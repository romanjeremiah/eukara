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
import { CF_MODELS, GEMINI_MODELS } from '../config/models';
import { CloudflareProvider } from '../ai/cloudflare';
import { GeminiProvider } from '../ai/gemini';
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
}

const CHECKIN_THREAD_ID = 'default';

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
					: 'Quick check — have you taken your meds?',
				300
			);

			await sendTelegram(token, chatId, greeting);
			await env.CHAT_KV.put(`med_pending_${userId}`, task.period ?? 'morning', { expirationTtl: 7200 });
			break;
		}

		case 'mood_poll': {
			await env.CHAT_KV.put(`health_checkin_active_${userId}`, 'evening', { expirationTtl: 1800 });

			const options = [
				{ text: '0 — Crisis/Suicidal' }, { text: '1 — Severe depression' },
				{ text: '2 — Moderate depression' }, { text: '3 — Mild depression' },
				{ text: '4 — Low but managing' }, { text: '5 — Balanced/Neutral' },
				{ text: '6 — Good, slightly up' }, { text: '7 — Energised/Productive' },
				{ text: '8 — Elevated/Hypomanic' }, { text: '9 — Racing/Pressured' },
				{ text: '10 — Full mania' },
			];

			const pollRes = await fetch(`https://api.telegram.org/bot${token}/sendPoll`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					chat_id: chatId, question: 'How are you feeling right now? (0-10 bipolar scale)',
					options, is_anonymous: false, type: 'regular',
				}),
			});
			const pollData = await pollRes.json() as { result?: { poll?: { id: string } } };
			if (pollData.result?.poll?.id) {
				// Store userId in poll context for when poll_answer arrives
				await env.CHAT_KV.put(
					`mood_poll_${pollData.result.poll.id}`,
					JSON.stringify({ userId, chatId, timestamp: Date.now() }),
					{ expirationTtl: 3600 }
				);
			}
			break;
		}

		case 'med_nudge': {
			const pending = await env.CHAT_KV.get(`med_pending_${userId}`);
			if (!pending) break;

			const greeting = await generateCheckinMessage(env, chatId, userId,
				'[automatic medication follow-up trigger]',
				'Send a brief, gentle 1-sentence medication follow-up.',
				'Just checking — did you manage to take your meds?',
				200
			);
			await sendTelegram(token, chatId, greeting);
			break;
		}

		case 'spontaneous_outreach': {
			const greeting = await generateCheckinMessage(env, chatId, userId,
				'[automatic spontaneous outreach trigger]',
				'Send a spontaneous, brief 1-2 sentence check-in message.',
				'',
				300
			);
			if (greeting) await sendTelegram(token, chatId, greeting);
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
	fallbackMessage: string,
	maxTokens: number,
): Promise<string> {
	let greeting = fallbackMessage;

	try {
		const provider = new CloudflareProvider(env.AI, CF_MODELS.chat);
		const response = await provider.chat(
			[{ role: 'user', content: generationPrompt }],
			[],
			{
				systemInstruction: 'You are a caring AI companion. Be warm, brief, natural.',
				temperature: 1.0,
				maxTokens,
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
		const provider = new GeminiProvider(env.GEMINI_API_KEY, GEMINI_MODELS.pro);
		const response = await provider.chat(
			[{ role: 'user', content: prompt }],
			[],
			{
				systemInstruction: `${BASE_INSTRUCTION}\n\n${MENTAL_HEALTH_DIRECTIVE}\n\n${FORMATTING_RULES}`,
				temperature: 1.0,
				maxTokens: 1500,
				thinkingEffort: 'dynamic',
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
