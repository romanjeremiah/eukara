// ============================================================
// my-ai-bot — Entry Point
//
// Minimal router. Delegates to specialised handlers.
// No business logic lives here.
// ============================================================

import { log } from './lib/logger';
import type { TelegramUpdate } from './types/telegram';

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		// --- API Routes ---
		if (url.pathname === '/setup-webhook') {
			return handleSetupWebhook(env);
		}

		if (url.pathname === '/register-commands') {
			return handleRegisterCommands(env);
		}

		// --- Telegram Webhook ---
		if (request.method === 'POST' && url.pathname === '/') {
			try {
				const update = await request.json<TelegramUpdate>();

				if (update.message?.from?.is_bot) {
					return new Response('OK'); // Ignore bot messages
				}

				// TODO Phase 2+: Route to message/callback/poll handlers
				log.info('update_received', {
					type: update.message ? 'message' : update.callback_query ? 'callback' : 'other',
					chatId: update.message?.chat.id ?? update.callback_query?.message?.chat.id,
				});

				return new Response('OK');
			} catch (err) {
				const error = err as Error;
				log.fatal('webhook_crash', { msg: error.message });
				return new Response('OK'); // Always return 200 to Telegram
			}
		}

		return new Response('my-ai-bot is running', { status: 200 });
	},

	async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
		// TODO Phase 7: Cron handler (lightweight checks, enqueue to Queue)
		log.info('cron_tick');
	},

	async queue(batch: MessageBatch, env: Env): Promise<void> {
		// TODO Phase 7: Queue consumer (all LLM-calling background tasks)
		for (const msg of batch.messages) {
			log.info('queue_message', { body: msg.body });
			msg.ack();
		}
	},
};

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
