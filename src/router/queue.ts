// ============================================================
// Queue Consumer
// All operations use userId for data isolation.
// chatId used only for message delivery.
//
// 2026-06-02 fixes:
//   F1: health_checkin / med_nudge / spontaneous_outreach now route
//       through CloudflareProvider and persist the greeting into KV
//       history. Replies have correct context; no more confabulation
//       from stale history.
//   F4: max_tokens (deprecated) -> max_completion_tokens via
//       CloudflareProvider.chat() for OpenAI-compat Gemma calls.
// ============================================================

import { log } from '../lib/logger';
import { CF_MODELS, OPENAI_MODELS } from '../config/models';
import {
	createConfiguredProvider,
	getAIProviderMode,
} from '../ai/provider-factory';
import { BASE_INSTRUCTION, MENTAL_HEALTH_DIRECTIVE, FORMATTING_RULES } from '../config/personas';
import * as telegram from '../lib/telegram';
import * as mood from '../services/mood';
import * as memory from '../services/memory';
import * as episode from '../services/episode';
import { normaliseMarkdown, enforceTagNesting } from '../lib/formatting';
import { loadHistory, saveHistory } from '../lib/history';
import { handleMessage } from '../bot/message';
import { allTools } from '../tools';
import type { AIMessage } from '../types/ai';
import type { TelegramMessage } from '../types/telegram';
import type { CuratorResult } from '../ai/curator';
import {
	evaluateEmbeddingRecall,
	OPENAI_BACKFILL_STATE_KEY,
	OPENAI_EMBEDDING_EVAL_KEY,
	OPENAI_EMBEDDING_EVAL_STATE_KEY,
	projectMemoryForRollback,
	projectMemoriesForRollback,
	scheduleEmbeddingEvaluation,
	type MemoryProjectionRow,
} from '../services/embedding-projection';
import { processProjectionOutbox } from '../services/governed-memory';

interface QueueTask {
	type: string;
	userId: number;
	chatId: number;
	period?: string;
	/**
	 * For `process_user_message` tasks (Pro-lane dispatch from
	 * src/index.ts). The full TelegramMessage is carried so the queue
	 * consumer can call handleMessage() with identical context. The
	 * webhook returns 200 OK to Telegram before this runs.
	 */
	message?: TelegramMessage;
	/**
	 * For `process_user_message` tasks. When true, the consumer passes
	 * forceHeavyLane:true into handleMessage so the router stays on Pro
	 * regardless of the new message's keywords (sticky-Pro continuation).
	 */
	forceHeavyLane?: boolean;
	/**
	 * Pre-computed intent triage from Curator (Layer A1).
	 */
	curatorResult?: CuratorResult;
	memoryId?: number;
	category?: string;
	fact?: string;
	afterId?: number;
	outboxId?: string;
}

const CHECKIN_THREAD_ID = 'default';

// Categories excluded from spontaneous outreach selection: clinical,
// therapeutic, and structural data that should never be surfaced as a
// casual "thinking of you" share. Everything else (facts, ideas,
// discoveries, preferences, observations) is fair game.
const OUTREACH_EXCLUDED_CATEGORIES = [
	'pattern', 'schema', 'trigger', 'avoidance', 'coping',
	'homework', 'insight', 'growth', 'feedback', 'triple', 'research_ref',
];

interface OutreachMemory {
	category: string;
	fact: string;
	importance_score?: number;
	created_at?: string;
}

/**
 * Weighted pick of a memory to surface. Two-stage selection:
 *   1. Saliency scoring (2026-06-04 Inner Thoughts cherry-pick) ranks
 *      memories by importance * recency, then narrows to the top third.
 *      Recency uses an exponential decay with a 14-day half-life so a
 *      week-old discovery beats a month-old idea without ignoring older
 *      facts entirely.
 *   2. Category-weighted random pick from the salient pool, mirroring
 *      the Xaridotis weighting (discoveries first, then ideas, then
 *      any remaining casual memory).
 */
function pickOutreachMemory(memories: OutreachMemory[]): OutreachMemory | null {
	if (!memories.length) return null;

	const now = Date.now();
	const HALF_LIFE_MS = 14 * 86400 * 1000;
	const scored = memories.map(m => {
		const created = m.created_at
			? new Date(m.created_at + 'Z').getTime()
			: 0;
		const ageMs = Math.max(0, now - created);
		const recency = Math.pow(0.5, ageMs / HALF_LIFE_MS);
		const importance = m.importance_score ?? 1;
		return { mem: m, score: importance * recency };
	});
	scored.sort((a, b) => b.score - a.score);

	// Top third by saliency (minimum of 3 items so a sparse memory bank
	// doesn't collapse to a single option). The category-pool selection
	// below operates on this subset.
	const topCount = Math.max(3, Math.ceil(scored.length / 3));
	const top = scored.slice(0, topCount).map(s => s.mem);

	const discoveries = top.filter(m => m.category === 'discovery');
	const ideas = top.filter(m => m.category === 'idea' || m.category === 'brain_dump');
	const roll = Math.random();
	let pool: OutreachMemory[];
	if (discoveries.length && roll < 0.5) pool = discoveries;
	else if (ideas.length && roll < 0.7) pool = ideas;
	else pool = top;
	return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

/**
 * Build the generation prompt for the chosen memory. Discoveries are
 * framed as "something you read" with their source preserved so the
 * user can verify; everything else is framed as a passing thought.
 * Grounding is NOT re-run here: the discovery was already grounded at
 * research time, this only rephrases it in Eukara's voice.
 */
function buildOutreachPrompt(chosen: OutreachMemory): string {
	if (chosen.category === 'discovery') {
		// Discovery facts are stored as "Research: <text> [source: <uri>]".
		const sourceMatch = chosen.fact.match(/\[source:\s*([^\]]+)\]/);
		const source = sourceMatch?.[1]?.trim();
		const body = chosen.fact
			.replace(/^Research:\s*/, '')
			.replace(/\s*\[source:[^\]]+\]\s*$/, '')
			.trim();
		return `You came across this recently and thought they would find it interesting:\n\n"${body}"\n\n`
			+ `Text them about it out of the blue, like a friend who read something and wanted to share. 1 to 2 sentences. `
			+ (source ? `Include the link naturally: ${source}. ` : '')
			+ `Frame it as something you read, not settled fact. Do not offer help. Do not ask how they are.`;
	}
	return `A passing thought about something you know about them:\n\n"${chosen.fact}"\n\n`
		+ `Send a short, casual out-of-the-blue message about it, like a friend texting. 1 to 2 sentences. `
		+ `Do not offer help. Do not be a therapist. Just share the thought.`;
}

export async function handleQueue(batch: MessageBatch, env: Env): Promise<void> {
	for (const msg of batch.messages) {
		const task = msg.body as QueueTask;
		try {
			await processTask(task, env, msg.attempts || 1);
			msg.ack();
			log.info('queue_task_done', { type: task.type, userId: task.userId });
		} catch (e) {
			log.error('queue_task_error', {
				type: task.type,
				userId: task.userId,
				attempts: msg.attempts || 1,
				msg: (e as Error).message,
			});
			msg.retry();
		}
	}
}

async function processTask(task: QueueTask, env: Env, attempts: number): Promise<void> {
	const { userId, chatId } = task;

	switch (task.type) {
		case 'project_memory_assertion': {
			if (!task.outboxId) throw new Error('Invalid project_memory_assertion task');
			await processProjectionOutbox(env, task.outboxId);
			break;
		}

		case 'index_memory_projection': {
			if (!task.memoryId || !task.category || !task.fact) {
				throw new Error('Invalid index_memory_projection task');
			}
			await projectMemoryForRollback(env, {
				id: task.memoryId,
				user_id: userId,
				category: task.category,
				fact: task.fact,
			});
			break;
		}

		case 'backfill_openai_embeddings': {
			const afterId = Math.max(0, task.afterId ?? 0);
			const batchSize = 25;
			const { results } = await env.DB.prepare(
				`SELECT id, user_id, category, fact
				 FROM memories
				 WHERE superseded_at IS NULL AND id > ?
				 ORDER BY id ASC
				 LIMIT ?`,
			).bind(afterId, batchSize).all<MemoryProjectionRow>();
			const memories = results ?? [];
			await projectMemoriesForRollback(env, memories);

			if (memories.length === batchSize) {
				await env.TASK_QUEUE.send({
					type: 'backfill_openai_embeddings',
					userId: 0,
					chatId: 0,
					afterId: memories[memories.length - 1]!.id,
				});
			} else {
				await env.CHAT_KV.put(OPENAI_BACKFILL_STATE_KEY, 'complete');
				await scheduleEmbeddingEvaluation(env);
			}
			log.info('openai_embedding_backfill_batch', {
				afterId,
				count: memories.length,
				complete: memories.length < batchSize,
			});
			break;
		}

		case 'evaluate_embedding_recall': {
			const { results } = await env.DB.prepare(
				`SELECT id, user_id, category, fact
				 FROM memories
				 WHERE superseded_at IS NULL
				 ORDER BY importance_score DESC, id DESC
				 LIMIT 10`,
			).all<MemoryProjectionRow>();
			const evaluation = await evaluateEmbeddingRecall(env, results ?? []);
			if (evaluation.openaiTop3 !== evaluation.sampleSize) {
				throw new Error(
					`OpenAI projection is not query-ready: ${evaluation.openaiTop3}/${evaluation.sampleSize} top-3 self recall`,
				);
			}
			await env.CHAT_KV.put(
				OPENAI_EMBEDDING_EVAL_KEY,
				JSON.stringify({
					...evaluation,
					evaluatedAt: new Date().toISOString(),
				}),
			);
			await env.CHAT_KV.put(OPENAI_EMBEDDING_EVAL_STATE_KEY, 'complete');
			log.info('embedding_recall_evaluated', { ...evaluation });
			break;
		}

		case 'spontaneous_outreach': {
			// Interest-driven casual share. Pull recent memories, keep
			// the casual (non-clinical) ones, weight selection by saliency
			// (importance * recency) within the discovery / idea / general
			// category pools, and hand the chosen item to the persona-voiced
			// generator. The cron guards (per-user proactivity dial, daily
			// cap, 3h-since-chat, quiet hours, escalation limit) have already
			// passed by the time this runs.
			const all = await memory.getMemories(env, userId, 50).catch(() => []);
			let casual = all.filter(m => !OUTREACH_EXCLUDED_CATEGORIES.includes(m.category));
			if (!casual.length) break;

			// 2026-07-01: exclude the memory surfaced last time so outreach
			// cannot repeat the same item on consecutive runs (a core cause
			// of the "same message every day" report). Only applied when
			// more than one candidate remains, so a single-memory user still
			// gets contacted rather than silently skipped.
			const lastFact = await env.CHAT_KV.get(`last_outreach_${userId}`);
			if (lastFact && casual.length > 1) {
				const filtered = casual.filter(m => m.fact !== lastFact);
				if (filtered.length) casual = filtered;
			}

			const chosen = pickOutreachMemory(casual);
			if (!chosen) break;

			const greeting = await generateCheckinMessage(env, chatId, userId,
				'[automatic spontaneous outreach trigger]',
				buildOutreachPrompt(chosen),
				''
			);
			if (greeting) {
				// 2026-07-01: deliver through the SAME pipeline as normal
				// replies so proactive messages render identically. Previously
				// this used a raw fetch (sendTelegram) with no markdown->HTML
				// normalisation and no inline keyboard, which is why outreach
				// looked different from replies (no Voice/Delete buttons, and
				// any markdown the model emitted showed raw).
				let outText = normaliseMarkdown(greeting);
				outText = enforceTagNesting(outText);
				const outreachMarkup = {
					inline_keyboard: [[
						{ text: '🔊 Voice', callback_data: 'action_voice' },
						{ text: '🗑️ Delete', callback_data: 'action_delete_msg', style: 'danger' as const },
					]],
				};
				await telegram.sendMessage(chatId, CHECKIN_THREAD_ID, outText, env, { markup: outreachMarkup });
				// Record what we just surfaced so the next run's dedup guard
				// (above) can avoid repeating it. 14-day TTL. Best-effort.
				await env.CHAT_KV.put(`last_outreach_${userId}`, chosen.fact, { expirationTtl: 14 * 86400 })
					.catch(() => {});
				// 2026-06-04 Inner Thoughts escalation guard. Increment
				// unanswered counter after each successful send. Cleared
				// when the user sends any message (bot/message.ts). When
				// the count crosses persona_config.proactivity_level's
				// maxUnanswered (1/2/3 for low/normal/high), cron pauses
				// further outreach until the user replies.
				try {
					const current = Number(
						await env.CHAT_KV.get(`proactive_unanswered_${userId}`)
					) || 0;
					await env.CHAT_KV.put(
						`proactive_unanswered_${userId}`,
						String(current + 1),
						{ expirationTtl: 7 * 86400 }
					);
				} catch (e) {
					log.warn('outreach_counter_write_failed', { userId, msg: (e as Error).message });
				}
			}
			break;
		}

		case 'weekly_report': {
			// Generate and send a Sunday-evening synthesis of the user's
			// week. Pulls mood history, recent memories, and episodes
			// from the last 7 days, hands them to Gemini Pro for a warm
			// summary. Unlike the conversational flows, this runs in the
			// queue — we don't have a user message to respond to, so no
			// chat history load. The report is sent as a standalone
			// message that the user can read at their own pace.
			await generateAndSendWeeklyReport(env, userId, chatId);
			break;
		}

		case 'process_user_message': {
			// 2026-06-02 (afternoon): Pro-lane user messages are dispatched
			// here by src/index.ts instead of going through ctx.waitUntil().
			// Reason: waitUntil has a 30s ceiling after the client disconnects
			// (https://developers.cloudflare.com/workers/platform/limits/),
			// which silently kills slow emotional/grounded Gemini Pro calls.
			// The queue gives 15-min wall-clock budget per task, plenty for
			// the 90s/45s/30s tier cascade in chatWithProLaneFallback.
			//
			// Pattern lifted from Xaridotis (gemini-bot/src/index.js queue
			// consumer, `user_message` task type).
			if (!task.message) {
				log.warn('process_user_message_no_message', { userId });
				break;
			}

			const qChatId = task.message.chat.id;
			const qThreadId = task.message.message_thread_id
				? String(task.message.message_thread_id)
				: 'default';

			log.info('queue_user_message_start', {
				userId,
				chatId: qChatId,
				msgId: task.message.message_id,
				forceHeavyLane: !!task.forceHeavyLane,
				attempts,
			});

			// Send a fresh typing indicator at the start of consumer
			// processing. The dispatcher already sent one when enqueueing,
			// but typing actions expire after ~5s on Telegram's side.
			await telegram.sendChatAction(qChatId, qThreadId, 'typing', env).catch(() => {});

			try {
				await handleMessage(task.message, env, allTools, {
					forceHeavyLane: task.forceHeavyLane,
					curatorResult: task.curatorResult,
				});
				log.info('queue_user_message_done', { userId, chatId: qChatId });
			} catch (hmErr) {
				const err = hmErr as Error;
				// Only notify the user on the FINAL retry attempt. Otherwise
				// the user gets three identical error messages in a row when
				// a message fails permanently. Cloudflare Queues default
				// max_retries=3 so attempts reaches 3 on the last try.
				if (attempts >= 3) {
					await telegram.sendMessage(
						qChatId, qThreadId,
						`⚠️ <b>I couldn't get a reply through after ${attempts} attempts.</b>\n<code>${(err.message ?? '').slice(0, 300)}</code>`,
						env
					).catch(() => {});
				}
				throw hmErr; // re-throw so the queue retries / acks correctly
			}
			break;
		}

		default:
			log.warn('unknown_queue_task', { type: task.type });
	}
}

/**
 * F1 fix (2026-06-02): generate a check-in greeting AND persist it to
 * KV history. Previously the greeting was sent via raw runAI +
 * sendTelegram with no history write, so the user's reply loaded stale
 * history (potentially days old) and the model confabulated.
 *
 * Routes through CloudflareProvider so it uses max_completion_tokens
 * (F4) and gets the same chat_template treatment as user-initiated
 * turns.
 *
 * `userPromptForHistory` is a short synthetic marker like
 * "[automatic morning check-in trigger]" that goes into history as the
 * "user turn". This gives subsequent replies a coherent precedent.
 *
 * Falls back to `fallbackMessage` on any error so the user always gets
 * something. Empty string means "send nothing" (used for spontaneous
 * outreach where empty AI output is fine).
 */
async function generateCheckinMessage(
	env: Env,
	chatId: number,
	userId: number,
	userPromptForHistory: string,
	generationPrompt: string,
	fallbackMessage: string
): Promise<string> {
	let greeting = fallbackMessage;

	try {
		// Tone fix (2026-06-03): proactive messages now generate through
		// Eukara's real persona voice (BASE + FORMATTING) on Gemini, not
		// the generic "caring AI companion" stub on the edge model.
		// Infrequent (a few per week) so model cost is negligible and the
		// voice consistency is worth it.
		const provider = createConfiguredProvider(env, {
			openai: OPENAI_MODELS.chat,
			cloudflare: CF_MODELS.chat,
		});
		const response = await provider.chat(
			[{ role: 'user', content: generationPrompt }],
			undefined,
			{
				systemInstruction: `${BASE_INSTRUCTION}\n\n${FORMATTING_RULES}`,
				thinkingLevel: 'LOW',
				enableGrounding: false,
			},
		);
		if (response.text?.trim()) {
			greeting = response.text.trim();
		}
	} catch (e) {
		log.warn('checkin_generation_failed', { userId, msg: (e as Error).message });
	}

	if (!greeting) return '';

	// Persist to KV history so the user's reply loads correct context.
	try {
		const prior = await loadHistory(env, chatId, CHECKIN_THREAD_ID);
		const next: AIMessage[] = [
			...prior,
			{ role: 'user', content: userPromptForHistory },
			{ role: 'model', content: greeting },
		];
		await saveHistory(env, chatId, CHECKIN_THREAD_ID, next);
	} catch (e) {
		log.warn('checkin_history_save_failed', { userId, msg: (e as Error).message });
	}

	return greeting;
}

/**
 * Weekly report generator. Pulls the past 7 days of data and asks
 * Gemini Pro for a synthesis. Structure prioritises warm prose over
 * dashboard-style metrics.
 *
 * Falls back gracefully if there's too little data to report on —
 * silence is better than a generic "you had 0 check-ins this week"
 * that rubs it in.
 */
async function generateAndSendWeeklyReport(
	env: Env, userId: number, chatId: number
): Promise<void> {
	// Pull the week's data in parallel. Each source degrades to empty
	// on error — a missing episode history shouldn't kill the report.
	const [moodHistory, recentMemories, recentEpisodes, checkinCount] = await Promise.all([
		mood.getHistory(env, userId, 7, 'evening').catch(() => []),
		memory.getMemoriesSince(env, userId, 7, 30).catch(() => []),
		episode.getRecentEpisodes(env, userId, 5).catch(() => []),
		mood.countRecentCheckins(env, userId, 7).catch(() => 0),
	]);

	// Bail if there's nothing meaningful to say. A report with no
	// check-ins, no memories, and no episodes would be a generic
	// "you didn't engage this week" that nobody wants.
	if (checkinCount === 0 && recentMemories.length === 0 && recentEpisodes.length === 0) {
		log.info('weekly_report_skipped_empty', { userId });
		return;
	}

	// Build the data context for the prompt.
	const moodSummary = moodHistory.length
		? moodHistory.map(e => `${e.date}: ${e.mood_score ?? '?'}/10${e.emotions ? ` (${safeJsonArray(e.emotions).slice(0, 3).join(', ')})` : ''}`).join('\n')
		: '(no mood check-ins this week)';
	const memoriesSummary = recentMemories.length
		? recentMemories.slice(0, 15).map(m => `- [${m.category}] ${m.fact}`).join('\n')
		: '(no new memories saved this week)';
	const episodesSummary = episode.formatEpisodesForContext(recentEpisodes) || '(no notable episodes logged)';

	const prompt = `Generate a warm, personal weekly summary. The user has just finished a week and you're reflecting it back to them.

CHECK-INS THIS WEEK: ${checkinCount}/7

MOOD TRAJECTORY:
${moodSummary}

NEW MEMORIES/OBSERVATIONS:
${memoriesSummary}

NOTABLE EPISODES:
${episodesSummary}

YOUR RESPONSE (3-5 short paragraphs, natural prose — never bullet points):
1. Open with how this week FELT, based on the mood data. Don't just list scores — characterise the shape (steady, turbulent, upward, depleted).
2. Highlight one or two themes from the memories or episodes. What seemed to matter to them this week?
3. If you notice a pattern (recurring emotions, a triggering situation, a coping strategy that worked), name it gently — but only if it's genuinely visible in the data.
4. End with one forward-looking observation or a single open question about the week ahead.

Tone: warm, observant, personal. You know this person. Use their mood data as evidence, not as metrics to parade. Never use headers or bullet lists — this is a letter, not a dashboard. Do not mention the word "report" or "summary" in your response. Do NOT use emoji.`;

	let text: string;
	try {
		// 2026-07-01: weekly report stays on the grounded model (Gemma).
		// It sets enableGrounding:true, and only Gemma honours
		// web_search_options; gpt-oss (the new CF_MODELS.chat) has no native
		// grounding, so keeping this on chat would silently drop sourcing.
		const provider = createConfiguredProvider(env, {
			openai: OPENAI_MODELS.chat,
			cloudflare: CF_MODELS.grounded,
		});
		const response = await provider.chat(
			[{ role: 'user', content: prompt }],
			[],
			{
				systemInstruction: `${BASE_INSTRUCTION}\n\n${MENTAL_HEALTH_DIRECTIVE}\n\n${FORMATTING_RULES}`,
				thinkingLevel: 'HIGH',
				enableGrounding: getAIProviderMode(env) === 'cloudflare',
			}
		);
		text = response.text || '';
	} catch (e) {
		log.error('weekly_report_ai_error', { userId, msg: (e as Error).message });
		return;
	}

	if (!text.trim()) {
		log.warn('weekly_report_empty_response', { userId });
		return;
	}

	// Defensive output cleanup — same pipeline as regular messages.
	text = normaliseMarkdown(text);
	text = enforceTagNesting(text);

	const header = `<b>📓 Your week</b>\n\n`;
	const message = header + text;

	try {
		const res = await telegram.sendMessage(chatId, 'default', message, env);
		if (res.ok) {
			log.info('weekly_report_sent', { userId, checkinCount, memoryCount: recentMemories.length, textLen: text.length });
		} else {
			log.warn('weekly_report_send_failed', { userId, description: res.description });
		}
	} catch (e) {
		log.warn('weekly_report_send_threw', { userId, msg: (e as Error).message });
	}
}

function safeJsonArray(raw: string | null): string[] {
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed.map(String) : [];
	} catch {
		return [];
	}
}
