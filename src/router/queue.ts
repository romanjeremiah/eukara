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
import { GEMINI_MODELS } from '../config/models';
import { GeminiProvider } from '../ai/gemini';
import { BASE_INSTRUCTION, MENTAL_HEALTH_DIRECTIVE, FORMATTING_RULES } from '../config/personas';
import { MOOD_POLL_OPTIONS, MOOD_POLL_QUESTION } from '../config/moodScale';
import * as telegram from '../lib/telegram';
import * as mood from '../services/mood';
import * as memory from '../services/memory';
import * as episode from '../services/episode';
import { normaliseMarkdown, enforceTagNesting } from '../lib/formatting';
import { loadHistory, saveHistory } from '../lib/history';
import { handleMessage } from '../bot/message';
// Phase 1 (2026-06-02): mood-flow queue routing. Heavy Gemini Pro
// calls were running inline via ctx.waitUntil and hitting the 30s
// ceiling. Moved into queue workers so the 15-min wall clock applies.
// Work functions live in bot/ to keep AI logic colocated with the
// persona / context plumbing; the queue worker only orchestrates.
import { runMoodAnalysisWork, runClinicalConcernWork } from '../bot/poll';
import { runEmotionsDoneWork } from '../bot/mood-callbacks';
import { allTools } from '../tools';
import type { AIMessage } from '../types/ai';
import type { TelegramMessage } from '../types/telegram';

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
	 * forceProLane:true into handleMessage so the router stays on Pro
	 * regardless of the new message's keywords (sticky-Pro continuation).
	 */
	forceProLane?: boolean;
	// ---- Phase 1 mood-flow fields (2026-06-02) ----
	/**
	 * For `mood_poll` tasks: the source label the poll was triggered
	 * by ('cron_poll' from scheduled evening, 'manual_command' from
	 * /mood). Propagated into the KV poll context so the poll_answer
	 * handler can write the right source onto the mood_journal row.
	 */
	source?: string;
	/** For mood_score_received / mood_emotions_done: thread routing. */
	threadId?: string;
	/** For mood_score_received: the 0-10 score the user tapped. */
	score?: number;
	/** For mood_emotions_done: the emotions the user selected. */
	selectedEmotions?: string[];
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
	const token = env.TELEGRAM_TOKEN;

	switch (task.type) {
		case 'health_checkin': {
			await env.CHAT_KV.put(`health_checkin_active_${userId}`, task.period ?? 'morning', { expirationTtl: 1800 });

			const userPrompt = task.period === 'morning'
				? '[automatic morning check-in trigger]'
				: '[automatic midday check-in trigger]';
			const generationPrompt = task.period === 'morning'
				? 'Generate a 1-2 sentence morning greeting. Ask how they slept and casually ask if they took their morning medication.'
				: 'Generate a 1-2 sentence midday check-in. Casually ask if they took their meds.';

			const greeting = await generateCheckinMessage(env, chatId, userId, userPrompt, generationPrompt,
				task.period === 'morning'
					? 'Morning! How did you sleep? Have you taken your meds?'
					: 'Quick check — have you taken your meds?'
			);

			await sendTelegram(token, chatId, greeting);
			await env.CHAT_KV.put(`med_pending_${userId}`, task.period ?? 'morning', { expirationTtl: 7200 });
			break;
		}

		case 'mood_poll': {
			await env.CHAT_KV.put(`health_checkin_active_${userId}`, 'evening', { expirationTtl: 1800 });

			// 2026-06-03: poll options restored from Xaridotis-style long
			// descriptions (src/config/moodScale.ts). Previously the inline
			// shortened strings here had drifted from the clinical bipolar
			// scale in MENTAL_HEALTH_DIRECTIVE section 2. Both this path
			// and the manual /mood command now share the canonical list.
			const options = MOOD_POLL_OPTIONS.map(t => ({ text: t }));

			// Phase 1 (2026-06-02): switched from raw fetch to telegram.sendPoll
			// so the call goes through tgApi's 429 / 5xx retry + structured
			// error logging. Previously a transient Telegram error silently
			// dropped the poll and the user got nothing.
			const pollRes = await telegram.sendPoll(
				chatId,
				CHECKIN_THREAD_ID,
				MOOD_POLL_QUESTION,
				options,
				env,
				{ isAnonymous: false, type: 'regular' },
			);
			// TelegramMessage covers the common message shape; poll messages
			// additionally carry a `poll` field with the new poll's id. Cast
			// inline so we don't widen the global TelegramMessage type for one
			// call site.
			const pollResult = pollRes.result as (TelegramMessage & { poll?: { id?: string } }) | undefined;
			const pollId = pollResult?.poll?.id;
			if (pollId) {
				// Stash source so the poll_answer webhook handler knows which
				// path triggered this poll. Distinguishes manual /mood from
				// cron-fired evening poll for the source-tracking column.
				// 2026-06-03: TTL bumped 1h -> 24h (pattern a). User can come
				// back later in the day and the poll context survives.
				await env.CHAT_KV.put(
					`mood_poll_${pollId}`,
					JSON.stringify({
						userId,
						chatId,
						timestamp: Date.now(),
						source: task.source ?? null,
					}),
					{ expirationTtl: 86400 },
				);

				// 2026-06-03 (pattern c, 24h resume): mark the flow as pending
				// so the dispatcher can detect a stuck check-in and offer
				// Continue / Skip. Cleared in:
				//   - poll.ts on score received (advances stage)
				//   - mood-callbacks.ts runEmotionsDoneWork on completion
				//   - callback.ts mood_resume_skip
				await env.CHAT_KV.put(
					`mood_flow_pending_${userId}`,
					JSON.stringify({ stage: 'awaiting_score', startedAt: Date.now() }),
					{ expirationTtl: 86400 }
				).catch(() => {});
				// Clear any stale resume-offered flag from a previous abandoned
				// flow so the resume prompt can fire again on THIS check-in.
				await env.CHAT_KV.delete(`mood_flow_resume_offered_${userId}`).catch(() => {});
			} else {
				// Send genuinely failed (after tgApi's internal retries). The
				// queue itself won't retry mood_poll because tgApi returns a
				// resolved response on API-level errors; the throw branch only
				// fires on network failure. Logging loud so we can spot this
				// in wrangler tail.
				log.warn('mood_poll_send_failed', {
					userId,
					chatId,
					ok: pollRes.ok,
					description: pollRes.description,
					errorCode: pollRes.error_code,
				});
			}
			break;
		}

		case 'mood_score_received': {
			// Phase 1 (2026-06-02): the poll_answer handler upserted the
			// score with source, then enqueued this task. We run the heavy
			// Gemini Pro analysis here so the 15-min wall clock applies
			// instead of the webhook's 30s waitUntil ceiling. The actual
			// work lives in bot/poll.ts so AI logic stays colocated with
			// the persona / mental-health prompt context.
			if (typeof task.score !== 'number') {
				log.warn('mood_score_received_no_score', { userId });
				break;
			}
			const threadId = task.threadId ?? CHECKIN_THREAD_ID;
			if (task.score <= 1 || task.score >= 9) {
				await runClinicalConcernWork(env, userId, chatId, threadId, task.score);
			} else {
				await runMoodAnalysisWork(env, userId, chatId, threadId, task.score);
			}
			break;
		}

		case 'mood_emotions_done': {
			// Phase 1 (2026-06-02): the Done-button callback saved the
			// selected emotions, then enqueued this task. The therapeutic
			// summary Gemini Pro call (~2000 tokens, thinking high) runs
			// here so the 15-min wall clock applies. Work function lives
			// in bot/mood-callbacks.ts.
			const threadId = task.threadId ?? CHECKIN_THREAD_ID;
			const selected = Array.isArray(task.selectedEmotions) ? task.selectedEmotions : [];
			await runEmotionsDoneWork(env, userId, chatId, threadId, selected);
			break;
		}

		case 'med_nudge': {
			const pending = await env.CHAT_KV.get(`med_pending_${userId}`);
			if (!pending) break;

			const greeting = await generateCheckinMessage(env, chatId, userId,
				'[automatic medication follow-up trigger]',
				'Send a brief, gentle 1-sentence medication follow-up.',
				'Just checking — did you manage to take your meds?'
			);
			await sendTelegram(token, chatId, greeting);
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
			const casual = all.filter(m => !OUTREACH_EXCLUDED_CATEGORIES.includes(m.category));
			if (!casual.length) break;

			const chosen = pickOutreachMemory(casual);
			if (!chosen) break;

			const greeting = await generateCheckinMessage(env, chatId, userId,
				'[automatic spontaneous outreach trigger]',
				buildOutreachPrompt(chosen),
				''
			);
			if (greeting) {
				await sendTelegram(token, chatId, greeting);
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
				forceProLane: !!task.forceProLane,
				attempts,
			});

			// Send a fresh typing indicator at the start of consumer
			// processing. The dispatcher already sent one when enqueueing,
			// but typing actions expire after ~5s on Telegram's side.
			await telegram.sendChatAction(qChatId, qThreadId, 'typing', env).catch(() => {});

			try {
				await handleMessage(task.message, env, allTools, {
					forceProLane: task.forceProLane,
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
		const provider = new GeminiProvider(env.GEMINI_API_KEY, GEMINI_MODELS.proPrimary);
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
		const provider = new GeminiProvider(env.GEMINI_API_KEY, GEMINI_MODELS.proPrimary);
		const response = await provider.chat(
			[{ role: 'user', content: prompt }],
			[],
			{
				systemInstruction: `${BASE_INSTRUCTION}\n\n${MENTAL_HEALTH_DIRECTIVE}\n\n${FORMATTING_RULES}`,
				thinkingLevel: 'HIGH',
				enableGrounding: true,
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

async function sendTelegram(token: string, chatId: number, text: string): Promise<void> {
	if (!text) return;
	await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
	}).catch(() => {});
}
