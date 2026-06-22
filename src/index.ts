// ============================================================
// Eukara \u2014 Entry Point
//
// Webhook handler with hybrid dispatch (2026-06-02 afternoon):
//
//   - Owner Pro-lane text (emotional / sticky / multimodal / active
//     check-in): enqueued as `process_user_message`. Worker returns
//     200 OK to Telegram immediately. Queue consumer processes with
//     15-min wall-clock budget. Bypasses the 30s waitUntil ceiling.
//   - Owner casual text: awaited inline. Worker stays alive until
//     handleMessage completes; HTTP-triggered Workers have no wall-
//     clock limit while client connected. Telegram's webhook tolerates
//     up to ~60s before retrying.
//   - Callbacks, polls, non-owner traffic: ctx.waitUntil (30s budget).
//
// Why not waitUntil for everything? Cloudflare docs:
//   https://developers.cloudflare.com/workers/platform/limits/
//   "When the client disconnects, tasks are canceled unless you call
//    waitUntil() to extend execution by up to 30 seconds."
// Slow Gemini Pro emotional turns regularly exceed 30s, so the work
// was being silently killed mid-flight. Hybrid dispatch fixes this.
// ============================================================

import { log } from './lib/logger';
import { handleMessage, handleCallback, handleCommand } from './bot';
import { handleCron } from './router/cron';
import { handleQueue } from './router/queue';
import { willHitHeavyLane } from './ai/router';
import { evaluateIntent } from './ai/curator';
import { readStickyProContext, clearStickyProContext, detectTopicShift } from './services/topicShift';
import * as telegram from './lib/telegram';
import { allTools } from './tools';
import type { TelegramUpdate, TelegramMessage } from './types/telegram';
import type { AITool } from './types/ai';

// Export Workflow classes (required by Cloudflare Workers)
export { MemoryConsolidationWorkflow } from './workflows/consolidation';
export { DeepResearchWorkflow } from './workflows/research';
export { ArchitectWorkflow } from './workflows/architect';

// Tool registry \u2014 all 26 tools loaded from typed modules
const tools: AITool[] = allTools;

// 2026-06-03 (pattern c): how long a mood flow can sit idle (no stage
// advancement) before the dispatcher offers a Continue / Skip prompt
// when the user comes back. 10 minutes is long enough that an active
// in-flow user (typing emotions one by one) won't trigger it, and
// short enough that someone returning hours later gets the prompt
// promptly on their first incoming message.
const MOOD_RESUME_IDLE_MS = 10 * 60 * 1000;

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		// --- API Routes ---
		if (url.pathname === '/setup-webhook') return handleSetupWebhook(env);
		if (url.pathname === '/register-commands') return handleRegisterCommands(env);
		if (url.pathname === '/health') return new Response('OK');

		// --- Telegram Webhook ---
		if (request.method === 'POST' && url.pathname === '/') {
			try {
				const update = await request.json<TelegramUpdate>();

				// Ignore bot messages
				if (update.message?.from?.is_bot) return new Response('OK');

				// Hybrid dispatch: route owner text by whether it'll hit Pro lane.
				// Everything else (callbacks, polls, non-owner) falls back to the
				// uniform waitUntil path below.
				if (update.message && !update.callback_query && !update.poll_answer) {
					await dispatchMessage(update.message, env, ctx);
				} else {
					const task = routeUpdate(update, env);
					if (task) {
						ctx.waitUntil(
							task.catch(err => {
								log.error('task_failed', { msg: (err as Error).message });
								if (env.OWNER_ID) {
									telegram.sendMessage(
										Number(env.OWNER_ID), 'default',
										`\u26a0\ufe0f <b>Error:</b> <code>${((err as Error).message ?? '').slice(0, 200)}</code>`,
										env
									).catch(() => {});
								}
							})
						);
					}
				}
			} catch (err) {
				log.fatal('webhook_crash', { msg: (err as Error).message });
			}
			return new Response('OK');
		}

		return new Response('Eukara is running', { status: 200 });
	},

	async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
		ctx.waitUntil(handleCron(env).catch(e => log.error('cron_error', { msg: (e as Error).message })));
	},

	async queue(batch: MessageBatch, env: Env): Promise<void> {
		await handleQueue(batch, env);
	},
};

// ============================================================
// Message dispatch
// ============================================================

/**
 * Detect whether the message has any supported media attachment.
 * Mirrors src/lib/media.ts:extractMediaFromMessage but cheaper \u2014
 * the dispatcher only needs a boolean, not the full MediaRef.
 */
function hasMedia(msg: TelegramMessage): boolean {
	return !!(msg.photo || msg.voice || msg.audio || msg.video
		|| msg.video_note || msg.document || msg.sticker);
}

/**
 * Decide where a user message should be processed:
 *   - Queue (Pro lane) for slow work that would exceed waitUntil's 30s.
 *   - Inline await for fast casual work (Worker stays connected).
 *
 * Also handles the sticky-Pro check: if the previous Pro turn left a
 * KV anchor and this message isn't already emotional, the topic
 * classifier decides whether to keep the conversation on Pro.
 */
async function dispatchMessage(
	msg: TelegramMessage,
	env: Env,
	ctx: ExecutionContext,
): Promise<void> {
	const userId = msg.from?.id;
	if (!userId) {
		// No identity \u2014 fall through to the inline path; handleMessage
		// will bail early.
		await runMessageHandler(msg, env, ctx, false);
		return;
	}

	const isOwner = env.OWNER_ID && String(userId) === String(env.OWNER_ID);
	const userText = msg.text ?? msg.caption ?? '';
	const media = hasMedia(msg);

	// Slash commands always handled inline (they're fast and synchronous).
	if (/^\/\w+/.test(userText)) {
		await runMessageHandler(msg, env, ctx, false);
		return;
	}

	// Non-owner: keep the existing uniform path (waitUntil). No sticky
	// logic, no queue routing. Multi-user expansion is a separate ticket.
	if (!isOwner) {
		await runMessageHandler(msg, env, ctx, true);
		return;
	}

	// --- Owner path ---

	// Active health check-in flag is read once here AND again inside
	// handleMessage (which may clear it on topic-change detection).
	// Cheap KV read, no harm in duplication.
	const healthCheckin = await env.CHAT_KV.get(`health_checkin_active_${userId}`);

	// Layer A1: Pre-gen Intent Triage
	const curatorResult = await evaluateIntent(userText, env);

	// Base routing decision (no regex, relies on curatorResult).
	const baseHeavyLane = willHitHeavyLane(media, healthCheckin, curatorResult);

	// Sticky-Pro override. Only runs when:
	//   (a) Base routing says casual (no point overriding an already-Pro
	//       route), AND
	//   (b) A sticky context exists in KV from the previous Pro turn.
	let forceHeavyLane = false;
	if (!baseHeavyLane) {
		const sticky = await readStickyProContext(env, userId);
		if (sticky) {
			// Trivial-message bypass: very short messages (yes/ok/yeah) are
			// almost always continuation, skip the classifier round-trip.
			if (userText.trim().length < 10) {
				forceHeavyLane = true;
				log.info('sticky_pro_kept_short', { userId });
			} else {
				const result = await detectTopicShift(env, sticky, userText);
				if (result.sameTopic) {
					forceHeavyLane = true;
					log.info('sticky_pro_kept', {
						userId,
						source: result.source,
						latencyMs: result.latencyMs,
					});
				} else {
					await clearStickyProContext(env, userId);
					log.info('sticky_pro_cleared', {
						userId,
						source: result.source,
						latencyMs: result.latencyMs,
					});
				}
			}
		}
	}

	const finalHeavyLane = baseHeavyLane || forceHeavyLane;

	if (finalHeavyLane && env.TASK_QUEUE) {
		// Enqueue + ack 200 OK to Telegram immediately. Consumer has 15-min
		// wall-clock budget, plenty for the 90s/45s/30s cascade. Typing
		// indicator buys ~5s of UX feedback before the queue picks up.
		try {
			await env.TASK_QUEUE.send({
				type: 'process_user_message',
				userId,
				chatId: msg.chat.id,
				message: msg,
				forceHeavyLane,
				curatorResult,
			});
			const threadId = msg.message_thread_id ? String(msg.message_thread_id) : 'default';
			// Fire-and-forget; failing to set typing isn't user-visible.
			ctx.waitUntil(
				telegram.sendChatAction(msg.chat.id, threadId, 'typing', env).catch(() => {}),
			);
			log.info('message_queued', {
				userId,
				chatId: msg.chat.id,
				reason: forceHeavyLane && !baseHeavyLane ? 'sticky_heavy' : 'heavy_lane',
				textLen: userText.length,
				hasMedia: media,
			});
			return;
		} catch (queueErr) {
			// Queue send failed — fall through to inline await. Better
			// to hit the 30s ceiling than to drop the message entirely.
			log.warn('queue_send_failed', { userId, msg: (queueErr as Error).message });
			await runMessageHandler(msg, env, ctx, true, { forceHeavyLane, curatorResult });
			return;
		}
	}

	// Casual lane — await inline so the Worker stays connected past
	// the 30s waitUntil ceiling. HTTP-triggered Workers have no wall-
	// clock cap while the client is connected (verified in docs).
	await runMessageHandler(msg, env, ctx, true, { curatorResult });
}

/**
 * Inline message handler invocation. Set `awaitFully` to true to keep
 * the Worker connected until handleMessage returns (the new default
 * for casual owner traffic). Set false to use ctx.waitUntil (the
 * legacy path, retained for non-owner traffic where we want the
 * webhook response to be instant).
 */
async function runMessageHandler(
	msg: TelegramMessage,
	env: Env,
	ctx: ExecutionContext,
	awaitFully: boolean,
	options?: { forceHeavyLane?: boolean, curatorResult?: any },
): Promise<void> {
	const task = (async () => {
		const handled = await handleCommand(msg, env);
		if (!handled) {
			await handleMessage(msg, env, tools, options, ctx);
		}
	})();

	if (awaitFully) {
		try {
			await task;
		} catch (err) {
			log.error('inline_task_failed', { msg: (err as Error).message });
			if (env.OWNER_ID) {
				await telegram.sendMessage(
					Number(env.OWNER_ID), 'default',
					`\u26a0\ufe0f <b>Error:</b> <code>${((err as Error).message ?? '').slice(0, 200)}</code>`,
					env,
				).catch(() => {});
			}
		}
	} else {
		ctx.waitUntil(
			task.catch(err => {
				log.error('bg_task_failed', { msg: (err as Error).message });
			}),
		);
	}
}

// --- Legacy update router (used for callback_query / poll_answer) ---

function routeUpdate(update: TelegramUpdate, env: Env): Promise<void> | null {
	if (update.callback_query) {
		return handleCallback(update.callback_query, env);
	}

	// Message updates take the dispatchMessage path above; this branch
	// is for safety only.
	if (update.message) {
		// Non-owner fallback path doesn't have ctx here directly,
		// but routeUpdate is called inside fetch() and its promise is passed to ctx.waitUntil().
		// We'd have to thread ctx through routeUpdate if we wanted it here, but
		// routeUpdate is legacy so leaving without ctx is fine, the promise itself
		// is passed to ctx.waitUntil in fetch().
		return (async () => {
			const handled = await handleCommand(update.message!, env);
			if (!handled) {
				await handleMessage(update.message!, env, tools);
			}
		})();
	}

	return null;
}


// --- Setup Handlers ---

async function handleSetupWebhook(env: Env): Promise<Response> {
	const token = env.TELEGRAM_TOKEN;
	if (!token) return new Response('TELEGRAM_TOKEN not set', { status: 500 });

	const webhookUrl = 'https://eukara.roman-jeremiah.workers.dev/';
	const allowedUpdates = JSON.stringify([
		'message', 'edited_message', 'callback_query',
		'inline_query', 'message_reaction', 'poll_answer',
	]);

	const res = await fetch(
		`https://api.telegram.org/bot${token}/setWebhook?url=${webhookUrl}&allowed_updates=${allowedUpdates}&drop_pending_updates=true`
	);
	const data = await res.json();
	return Response.json(data);
}

async function handleRegisterCommands(env: Env): Promise<Response> {
	const token = env.TELEGRAM_TOKEN;
	if (!token) return new Response('TELEGRAM_TOKEN not set', { status: 500 });

	const commands = [
		{ command: 'mood', description: 'Log your mood (0-10 scale with emotions)' },
		{ command: 'listen', description: 'Start a brain dump session' },
		{ command: 'done', description: 'End listening / brain dump' },
		{ command: 'architect', description: 'Run an innovation review' },
		{ command: 'persona', description: 'Change conversational mode' },
		{ command: 'memories', description: 'Show what I remember about you' },
		{ command: 'forget', description: 'Delete memories (category or all)' },
		{ command: 'timezone', description: 'Set your local timezone' },
		{ command: 'clear', description: 'Clear conversation context' },
		{ command: 'start', description: 'Welcome message' },
	];

	const res = await fetch(
		`https://api.telegram.org/bot${token}/setMyCommands`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ commands }),
		}
	);
	const data = await res.json();
	return Response.json(data);
}

// ============================================================
// End
// ============================================================
