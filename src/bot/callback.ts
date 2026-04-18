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
import {
	POSITIVE_EMOTIONS,
	NEGATIVE_EMOTIONS,
	emotionButtonRows,
} from '../config/emotions';
import { handleEmotionToggle, handleEmotionsDone } from './mood-callbacks';

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

	// --- Mood category selection (Positive / Negative) ---
	// After the poll answer's clinical analysis, the user taps one of
	// two category buttons. We show the corresponding emotion grid,
	// reset the selection buffer, and offer "Next" to the other
	// category plus "Done" to finish.
	} else if (data === 'mood_cat_positive' || data === 'mood_cat_negative') {
		const userId = query.from.id;
		await telegram.editMessageReplyMarkup(chatId, msgId, null, env).catch(() => {});
		await env.CHAT_KV.put(
			`mood_emo_selected_${userId}`,
			'[]',
			{ expirationTtl: 3600 }
		);

		const isPositive = data === 'mood_cat_positive';
		const list = isPositive ? POSITIVE_EMOTIONS : NEGATIVE_EMOTIONS;
		const other = isPositive ? 'negative' : 'positive';
		const rows = emotionButtonRows(list, other);

		await telegram.sendMessage(chatId, threadId,
			`<b>Select all ${isPositive ? 'positive' : 'negative'} emotions that resonate.</b>\nTap each one, then ➡️ Next or ✅ Done.`,
			env, { markup: { inline_keyboard: rows } });
		await telegram.answerCallbackQuery(query.id, env).catch(() => {});

	// --- Mood: switch to the other category mid-flow ---
	} else if (data.startsWith('mood_emo_next_')) {
		const next = data.replace('mood_emo_next_', '');
		await telegram.editMessageReplyMarkup(chatId, msgId, null, env).catch(() => {});

		const isPositive = next === 'positive';
		const list = isPositive ? POSITIVE_EMOTIONS : NEGATIVE_EMOTIONS;
		// Once they've seen both categories, only "Done" remains.
		const rows = emotionButtonRows(list, null);

		await telegram.sendMessage(chatId, threadId,
			`<b>Now select any ${next} emotions.</b>\nTap each one, then ✅ Done.`,
			env, { markup: { inline_keyboard: rows } });
		await telegram.answerCallbackQuery(query.id, env).catch(() => {});

	// --- Mood: user done, synthesise full therapeutic summary ---
	} else if (data === 'mood_emo_done') {
		await handleEmotionsDone(query, env);

	// --- Mood: individual emotion toggle ---
	} else if (data.startsWith('mood_emo_')) {
		await handleEmotionToggle(query, env);

	// --- Noop (dismiss buttons) ---
	} else if (data === 'noop') {
		await telegram.answerCallbackQuery(query.id, env).catch(() => {});

	// --- Unknown callback ---
	} else {
		log.warn('unknown_callback', { chatId, data });
		await telegram.answerCallbackQuery(query.id, env).catch(() => {});
	}
}
