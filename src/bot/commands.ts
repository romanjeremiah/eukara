// ============================================================
// Command Handler
//
// Processes /commands. Returns true if the message was a
// command (handled), false if it should be passed to the
// regular message handler.
// ============================================================

import type { TelegramMessage } from '../types/telegram';
import * as telegram from '../lib/telegram';
import { clearHistory } from '../lib/history';
import { log } from '../lib/logger';

export async function handleCommand(
	msg: TelegramMessage,
	env: Env
): Promise<boolean> {
	const text = msg.text ?? '';
	const chatId = msg.chat.id;
	const threadId = msg.message_thread_id ? String(msg.message_thread_id) : 'default';

	if (!text.startsWith('/')) return false;

	const cmd = text.split(/\s|@/)[0]!.toLowerCase();
	log.info('command', { chatId, cmd });

	switch (cmd) {
		case '/start':
			await telegram.sendMessage(chatId, threadId,
				'<b>Welcome to Eukara</b>\n\nI am your AI companion, running on Cloudflare edge infrastructure.',
				env);
			return true;

		case '/clear':
			await clearHistory(env, chatId, threadId);
			await env.CHAT_KV.delete(`persona_${chatId}_${threadId}`);
			await telegram.sendMessage(chatId, threadId, 'Conversation cleared. What is on your mind?', env);
			return true;

		case '/mood': {
			const fromId = msg.from?.id;
			if (!fromId) return true;
			// Enqueue a mood_poll task — the queue consumer already knows
			// how to send the 0-10 poll and wire the KV context for the
			// poll_answer webhook to find. Using the queue keeps the
			// webhook path fast and isolates the Telegram API call.
			await env.TASK_QUEUE.send({ type: 'mood_poll', userId: fromId, chatId });
			return true;
		}

		case '/architect': {
			if (!env.OWNER_ID || String(msg.from?.id) !== String(env.OWNER_ID)) {
				await telegram.sendMessage(chatId, threadId, 'This command is owner-only.', env);
				return true;
			}
			// Concurrency guard with kill switch
			const lock = await env.CHAT_KV.get(`architect_lock_${chatId}`);
			if (lock) {
				const age = Math.round((Date.now() - parseInt(lock)) / 1000);
				await telegram.sendMessage(chatId, threadId,
					`⚙️ <b>Architecture review already running</b> (${age}s ago).`,
					env, { markup: { inline_keyboard: [[
						{ text: '🔄 Kill & Restart', callback_data: 'architect_kill' },
						{ text: '⏳ Wait', callback_data: 'noop' },
					]] } });
				return true;
			}
			await env.CHAT_KV.put(`architect_lock_${chatId}`, String(Date.now()), { expirationTtl: 120 });

			const statusRes = await telegram.sendMessage(chatId, threadId,
				'⚙️ <b>Architecture Review</b>\n\n<i>Starting research workflow...</i>', env);
			const statusMsgId = statusRes.result?.message_id;

			try {
				await env.ARCHITECT_WORKFLOW.create({
					id: `architect-${Date.now()}`,
					params: { chatId, statusMsgId },
				});
			} catch (e) {
				await env.CHAT_KV.delete(`architect_lock_${chatId}`);
				await telegram.sendMessage(chatId, threadId,
					`⚙️ Workflow error: ${((e as Error).message ?? '').slice(0, 100)}`, env);
			}
			return true;
		}

		case '/listen': {
			const userId = msg.from?.id;
			if (!userId) return true;
			await env.CHAT_KV.put(`listening_mode_${userId}`, '1', { expirationTtl: 86400 });
			await env.CHAT_KV.delete(`listen_buffer_${userId}`);
			await telegram.sendMessage(chatId, threadId,
				'<b>Deep Listening Mode</b>\n\nTake all the space you need. Send as many messages or voice notes as you want — I will listen without interrupting, just acknowledging with a reaction.\n\nType /done when you are finished and I will synthesise everything you shared.',
				env);
			return true;
		}

		case '/done': {
			const userId = msg.from?.id;
			if (!userId) return true;
			const listening = await env.CHAT_KV.get(`listening_mode_${userId}`);
			if (!listening) {
				await telegram.sendMessage(chatId, threadId,
					'We are not in listening mode. Use /listen to start a brain dump.',
					env);
				return true;
			}
			await env.CHAT_KV.delete(`listening_mode_${userId}`);

			const bufferStr = await env.CHAT_KV.get(`listen_buffer_${userId}`) ?? '[]';
			const buffer: string[] = JSON.parse(bufferStr);
			await env.CHAT_KV.delete(`listen_buffer_${userId}`);

			if (buffer.length === 0) {
				await telegram.sendMessage(chatId, threadId,
					'You did not send anything during this session, but I am always here when you need me.',
					env);
				return true;
			}

			await telegram.sendMessage(chatId, threadId,
				'<i>Synthesising what you shared...</i>',
				env);

			// Rewrite the incoming message so the normal message handler
			// treats this as the synthesis prompt. Mutation is safe here —
			// the msg object is a request-scoped payload and won't be reused.
			// Returning false causes index.ts to fall through to handleMessage.
			msg.text = `I have just completed a Deep Listening brain dump. Here are my raw thoughts across ${buffer.length} messages, in order:\n\n${buffer.join('\n\n')}\n\nPlease synthesise this. Identify core themes, active schemas, or actionable steps. Proactively save any important patterns or ideas to memory, then give me a cohesive, compassionate response.`;
			return false;
		}

		case '/persona':
			// TODO Phase 5: Persona switching
			await telegram.sendMessage(chatId, threadId, 'Persona switching coming soon.', env);
			return true;

		default:
			return false; // Unknown command, pass to message handler
	}
}
