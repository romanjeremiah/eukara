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
				'<b>Welcome to my-ai-bot</b>\n\nI am your AI companion, running on Cloudflare edge infrastructure.',
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

		case '/architect':
			// TODO Phase 6: Trigger architect workflow
			await telegram.sendMessage(chatId, threadId, 'Architecture review coming soon.', env);
			return true;

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
