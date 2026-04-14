// ============================================================
// my-ai-bot — Entry Point
//
// Minimal router. Delegates to specialised handlers.
// No business logic lives here.
// ============================================================

import { log } from './lib/logger';
import { handleMessage, handleCallback, handleCommand } from './bot';
import * as telegram from './lib/telegram';
import { allTools } from './tools';
import type { TelegramUpdate } from './types/telegram';
import type { AITool } from './types/ai';

// Tool registry — all 26 tools loaded from typed modules
const tools: AITool[] = allTools;

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

				const task = routeUpdate(update, env);

				if (task) {
					// Return 200 immediately, process in background
					// 5-minute CPU limit (wrangler.jsonc) gives waitUntil plenty of time
					ctx.waitUntil(
						task.catch(err => {
							log.error('task_failed', { msg: (err as Error).message });
							if (env.OWNER_ID) {
								telegram.sendMessage(
									Number(env.OWNER_ID), 'default',
									`⚠️ <b>Error:</b> <code>${((err as Error).message ?? '').slice(0, 200)}</code>`,
									env
								).catch(() => {});
							}
						})
					);
				}
			} catch (err) {
				log.fatal('webhook_crash', { msg: (err as Error).message });
			}
			return new Response('OK');
		}

		return new Response('my-ai-bot is running', { status: 200 });
	},

	async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
		// TODO Phase 7: Lightweight cron checks, enqueue to Queue
		log.info('cron_tick');
	},

	async queue(batch: MessageBatch, env: Env): Promise<void> {
		// TODO Phase 7: Queue consumer for LLM-calling background tasks
		for (const msg of batch.messages) {
			log.info('queue_message', { body: msg.body });
			msg.ack();
		}
	},
};

// --- Update Router ---

function routeUpdate(update: TelegramUpdate, env: Env): Promise<void> | null {
	if (update.message) {
		return (async () => {
			const handled = await handleCommand(update.message!, env);
			if (!handled) {
				await handleMessage(update.message!, env, tools);
			}
		})();
	}

	if (update.callback_query) {
		return handleCallback(update.callback_query, env);
	}

	if (update.poll_answer) {
		// TODO Phase 5: Handle mood poll answers
		log.info('poll_answer', { pollId: update.poll_answer.poll_id });
		return null;
	}

	return null;
}


// --- Setup Handlers ---

async function handleSetupWebhook(env: Env): Promise<Response> {
	const token = env.TELEGRAM_TOKEN;
	if (!token) return new Response('TELEGRAM_TOKEN not set', { status: 500 });

	const webhookUrl = 'https://my-ai-bot.roman-jeremiah.workers.dev/';
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
		{ command: 'persona', description: 'Switch AI personality' },
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
