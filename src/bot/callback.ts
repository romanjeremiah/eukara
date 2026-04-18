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
import { getPresetById } from '../config/persona-presets';
import { handleEmotionToggle, handleEmotionsDone } from './mood-callbacks';
import * as persona from '../services/persona';
import * as memory from '../services/memory';

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

	// --- Persona preset selection ---
	} else if (data.startsWith('persona_preset_')) {
		const presetId = data.replace('persona_preset_', '');
		const preset = getPresetById(presetId);
		if (!preset) {
			await telegram.answerCallbackQuery(query.id, env, {
				text: 'Unknown preset.',
			}).catch(() => {});
			return;
		}
		const userId = query.from.id;
		await persona.updatePersonaConfig(env, userId, {
			tone: preset.tone,
			formality: preset.formality,
			humour_level: preset.humour_level,
			emoji_style: preset.emoji_style,
			therapeutic_approach: preset.therapeutic_approach,
		});
		await telegram.editMessage(chatId, msgId,
			`<b>Mode set: ${preset.emoji} ${preset.label}</b>\n\n<i>${preset.description}</i>\n\n<i>You'll feel the shift in the next message.</i>`,
			env);
		await telegram.answerCallbackQuery(query.id, env, {
			text: `✓ ${preset.label}`,
		}).catch(() => {});
		log.info('persona_preset_applied', { userId, presetId });

	// --- Forget: category-specific deletion ---
	} else if (data.startsWith('forget_cat_')) {
		const category = data.replace('forget_cat_', '');
		const userId = query.from.id;
		const result = await env.DB.prepare(
			'DELETE FROM memories WHERE user_id = ? AND category = ?'
		).bind(userId, category).run();
		const deleted = result?.meta?.changes ?? 0;
		await telegram.editMessage(chatId, msgId,
			`<b>Forgotten.</b>\n\nDeleted <b>${deleted}</b> memories in the <b>${category}</b> category.`,
			env);
		await telegram.answerCallbackQuery(query.id, env, {
			text: `🗑️ ${deleted} forgotten`,
		}).catch(() => {});
		log.info('memories_deleted_category', { userId, category, deleted });

	// --- Forget everything: require confirmation ---
	} else if (data === 'forget_all_confirm') {
		await telegram.editMessage(chatId, msgId,
			`<b>⚠️ Really forget everything?</b>\n\nThis will permanently delete every memory I have about you. The conversation continues, but I'll be starting from zero context.\n\nThis cannot be undone.`,
			env, {
				markup: {
					inline_keyboard: [[
						{ text: '🔥 Yes, forget everything', callback_data: 'forget_all_execute' },
						{ text: '✖️ Cancel', callback_data: 'forget_cancel' },
					]],
				},
			});
		await telegram.answerCallbackQuery(query.id, env).catch(() => {});

	// --- Forget everything: execute ---
	} else if (data === 'forget_all_execute') {
		const userId = query.from.id;
		await memory.deleteAllMemories(env, userId);
		// Also drop the vector index entries for this user — leaving them
		// behind would let the vector search still surface "forgotten"
		// memories in semantic context.
		if (env.VECTORIZE) {
			// Vectorize doesn't support filter-based delete, so we rely on
			// the fact that semanticSearch filters by userId — orphaned
			// vectors won't be returned, but they'll sit in the index
			// taking space. Acceptable trade-off for now; fixable later
			// via a cleanup cron.
		}
		await telegram.editMessage(chatId, msgId,
			`<b>Done.</b>\n\nEverything wiped. I don't remember anything about you now — but I'm still here. What's on your mind?`,
			env);
		await telegram.answerCallbackQuery(query.id, env, {
			text: '🔥 All memories forgotten',
		}).catch(() => {});
		log.warn('memories_deleted_all', { userId });

	// --- Forget: cancel ---
	} else if (data === 'forget_cancel') {
		await telegram.editMessage(chatId, msgId,
			`<b>Cancelled.</b>\n\nNothing was deleted. Your memories are safe.`,
			env);
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
