// ============================================================
// Callback Query Handler
//
// Handles inline keyboard button presses.
// Each callback_data value routes to a specific action.
// ============================================================

import type { TelegramCallbackQuery } from '../types/telegram';
import * as telegram from '../lib/telegram';
import { generateSpeech } from '../lib/tts';
import { log } from '../lib/logger';

export async function handleCallback(
	query: TelegramCallbackQuery,
	env: Env
): Promise<void> {
	const chatId = query.message?.chat.id;
	const msgId = query.message?.message_id;
	const data = query.data;

	if (!chatId || !msgId || !data) return;

	const threadId = query.message?.message_thread_id
		? String(query.message.message_thread_id) : 'default';

	log.info('callback', { chatId, data });

	// --- Voice ---
	if (data === 'action_voice') {
		const botText = query.message?.text;
		if (!botText) {
			await telegram.answerCallbackQuery(query.id, env, { text: 'No text to convert.' });
			return;
		}
		await telegram.answerCallbackQuery(query.id, env, { text: '🔊 Generating voice...' });
		await telegram.sendChatAction(chatId, threadId, 'upload_voice', env);
		try {
			const audio = await generateSpeech(botText, env);
			await telegram.sendVoice(chatId, threadId, audio, env, msgId);
		} catch (e) {
			log.error('voice_error', { msg: (e as Error).message });
			await telegram.sendMessage(chatId, threadId, '⚠️ Voice generation failed.', env);
		}

	// --- Delete message ---
	} else if (data === 'action_delete_msg') {
		await telegram.deleteMessage(chatId, msgId, env);
		await telegram.answerCallbackQuery(query.id, env).catch(() => {});

	// --- Architect kill switch ---
	} else if (data === 'architect_kill') {
		await env.CHAT_KV.delete(`architect_lock_${chatId}`);
		await telegram.editMessage(chatId, msgId,
			'⚙️ <b>Architecture review cancelled.</b> Run /architect to start fresh.', env);
		await telegram.answerCallbackQuery(query.id, env, { text: 'Cancelled.' }).catch(() => {});

	// --- Mood emotion selection ---
	} else if (data.startsWith('mood_emo_')) {
		// TODO Phase 5: Wire up mood emotion selection flow
		await telegram.answerCallbackQuery(query.id, env).catch(() => {});

	// --- Noop (dismiss buttons) ---
	} else if (data === 'noop') {
		await telegram.answerCallbackQuery(query.id, env).catch(() => {});

	// --- Unknown callback ---
	} else {
		log.warn('unknown_callback', { chatId, data });
		await telegram.answerCallbackQuery(query.id, env).catch(() => {});
	}
}
