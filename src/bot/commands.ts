// ============================================================
// Command Handler
//
// Processes /commands. Returns true if the message was a
// command (handled), false if it should be passed to the
// regular message handler.
// ============================================================

import type { TelegramMessage } from '../types/telegram';
import * as telegram from '../lib/telegram';
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
				'<b>Welcome to Tenon</b>\n\nI am your AI companion, running on Cloudflare edge infrastructure.',
				env);
			return true;

		case '/clear':
			await env.CHAT_KV.delete(`persona_${chatId}_${threadId}`);
			await telegram.sendMessage(chatId, threadId, 'Context cleared.', env);
			return true;

		case '/mood':
			// TODO Phase 5: Send mood poll
			await telegram.sendMessage(chatId, threadId, 'Mood tracking coming soon.', env);
			return true;

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

		case '/listen':
			// TODO Phase 5: Start brain dump mode
			await telegram.sendMessage(chatId, threadId, 'Brain dump mode coming soon.', env);
			return true;

		case '/done':
			// TODO Phase 5: End brain dump mode
			await telegram.sendMessage(chatId, threadId, 'Session ended.', env);
			return true;

		case '/persona':
			// TODO Phase 5: Persona switching
			await telegram.sendMessage(chatId, threadId, 'Persona switching coming soon.', env);
			return true;

		default:
			return false; // Unknown command, pass to message handler
	}
}
