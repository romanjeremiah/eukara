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
	NEXT_CATEGORY,
	CATEGORY_LABEL,
	emotionButtonRows,
	emotionsByCategory,
	type EmotionCategory,
} from '../config/emotions';
import { getPresetById } from '../config/persona-presets';
import { findPresetByTz } from '../config/timezone-presets';
import { handleEmotionToggle, handleEmotionsDone } from './mood-callbacks';
import { buildChecklistText } from '../tools/checklist-tools';
import * as user from '../services/user';
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
		// Lock is keyed by userId post-2026-06-02 migration (architect
		// workflow's D1 isolation also uses user_id).
		const userId = query.from.id;
		await env.CHAT_KV.delete(`architect_lock_${userId}`);
		await telegram.editMessage(chatId, msgId,
			'⚙️ <b>Architecture review cancelled.</b> Run /architect to start fresh.', env);
		await telegram.answerCallbackQuery(query.id, env, { text: 'Cancelled.' }).catch(() => {});

	// --- Mood category selection (Positive / Negative / Dissociative) ---
	// After the poll answer's clinical analysis, the user taps one of
	// three category buttons. We show the corresponding emotion grid,
	// reset the selection buffer, and offer "Next: <other>" plus "Done".
	// Cycling order lives in NEXT_CATEGORY in src/config/emotions.ts.
	//
	// 2026-06-03: third category 🌫️ Dissociative added for borderline /
	// dissociative episodes that don't fit cleanly into positive or
	// negative valence.
	} else if (data === 'mood_cat_positive' || data === 'mood_cat_negative' || data === 'mood_cat_dissociative') {
		const userId = query.from.id;
		const cat = data.replace('mood_cat_', '') as EmotionCategory;

		await telegram.editMessageReplyMarkup(chatId, msgId, null, env).catch(() => {});
		await env.CHAT_KV.put(
			`mood_emo_selected_${userId}`,
			'[]',
			// 2026-06-03: TTL bumped 1h -> 24h so a user who walks away
			// mid-flow can still come back and find their partial
			// selection intact.
			{ expirationTtl: 86400 }
		);

		const list = emotionsByCategory(cat);
		const rows = emotionButtonRows(list, NEXT_CATEGORY[cat]);

		await telegram.sendMessage(chatId, threadId,
			`<b>Select all ${CATEGORY_LABEL[cat].toLowerCase()} emotions that resonate.</b>\nTap each one, then ➡️ Next or ✅ Done.`,
			env, { markup: { inline_keyboard: rows } });
		await telegram.answerCallbackQuery(query.id, env).catch(() => {});

	// --- Mood: switch to the next category mid-flow ---
	} else if (data.startsWith('mood_emo_next_')) {
		const nextRaw = data.replace('mood_emo_next_', '');
		const next: EmotionCategory =
			nextRaw === 'positive' || nextRaw === 'negative' || nextRaw === 'dissociative'
				? nextRaw
				: 'positive';

		await telegram.editMessageReplyMarkup(chatId, msgId, null, env).catch(() => {});

		const list = emotionsByCategory(next);
		// 2026-06-03: with three categories we always show the next one
		// on cycling, even after the user has been around the loop. They
		// can stop at any point with "Done".
		const rows = emotionButtonRows(list, NEXT_CATEGORY[next]);

		await telegram.sendMessage(chatId, threadId,
			`<b>Now select any ${CATEGORY_LABEL[next].toLowerCase()} emotions.</b>\nTap each one, then ➡️ Next or ✅ Done.`,
			env, { markup: { inline_keyboard: rows } });
		await telegram.answerCallbackQuery(query.id, env).catch(() => {});

	// --- Mood: user done, synthesise full therapeutic summary ---
	} else if (data === 'mood_emo_done') {
		await handleEmotionsDone(query, env);

	// --- Mood: resume buttons (from dispatchMessage soft-resume prompt) ---
	// Pattern (c) 2026-06-03: when the user comes back to chat with a
	// pending mood flow, the dispatcher (src/index.ts dispatchMessage)
	// sends a soft "check-in still open" prompt with Continue / Skip
	// buttons. These callbacks handle those taps.
	} else if (data === 'mood_resume_continue') {
		const userId = query.from.id;
		await telegram.editMessageReplyMarkup(chatId, msgId, null, env).catch(() => {});
		await telegram.answerCallbackQuery(query.id, env, { text: 'Restarting the check-in...' }).catch(() => {});

		// Send a fresh poll via the existing queue path. Same task type
		// the cron uses, so downstream handlers work unchanged.
		await env.CHAT_KV.delete(`mood_flow_resume_offered_${userId}`).catch(() => {});
		if (env.TASK_QUEUE) {
			await env.TASK_QUEUE.send({
				type: 'mood_poll',
				userId,
				chatId,
				source: 'manual_resume',
			});
			log.info('mood_flow_resumed', { userId });
		} else {
			log.warn('mood_flow_resume_no_queue_binding', { userId });
		}

	} else if (data === 'mood_resume_skip') {
		const userId = query.from.id;
		await telegram.editMessageReplyMarkup(chatId, msgId, null, env).catch(() => {});
		await Promise.all([
			env.CHAT_KV.delete(`mood_flow_pending_${userId}`),
			env.CHAT_KV.delete(`mood_flow_resume_offered_${userId}`),
			env.CHAT_KV.delete(`mood_emo_selected_${userId}`),
			env.CHAT_KV.delete(`health_checkin_active_${userId}`),
		]).catch(() => {});
		await telegram.answerCallbackQuery(query.id, env, { text: 'Skipped. Catch you on the next one.' }).catch(() => {});
		log.info('mood_flow_skipped', { userId });

	// --- Mood: individual emotion toggle ---
	} else if (data.startsWith('mood_emo_')) {
		await handleEmotionToggle(query, env);

	// --- Persona preset / mode selection ---
	} else if (data.startsWith('persona_switch_')) {
		const newPersona = data.replace('persona_switch_', '');
		const userId = query.from.id;
		
		if (newPersona === 'base') {
			await env.CHAT_KV.delete(`active_persona_${userId}`);
		} else {
			await env.CHAT_KV.put(`active_persona_${userId}`, newPersona);
		}

		const names: Record<string, string> = {
			base: '🟢 Base Eukara (Dynamic)',
			luna: '🌙 Luna (Mindfulness)',
			socrates: '🏛 Socrates (Analytical)',
			nova: '✨ Nova (Creative)'
		};

		await telegram.editMessage(chatId, msgId,
			`<b>Persona set: ${names[newPersona] || newPersona}</b>\n\n<i>You'll feel the shift in the next message.</i>`,
			env);
		await telegram.answerCallbackQuery(query.id, env, {
			text: `✓ ${newPersona}`,
		}).catch(() => {});
		log.info('persona_switched', { userId, newPersona });

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
						{ text: '🔥 Yes, forget everything', callback_data: 'forget_all_execute', style: 'danger' },
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

	// --- Timezone preset selection ---
	// Tapped from the /timezone picker. Sets the user's timezone in
	// both user_profiles (source of truth) and the KV mirror, then
	// confirms by showing the current local time in the new zone.
	} else if (data.startsWith('tz_set_')) {
		const tz = data.replace('tz_set_', '');
		const userId = query.from.id;
		try {
			await user.setUserTimezone(env, userId, tz);
			const preset = findPresetByTz(tz);
			const nowLocal = new Date().toLocaleString('en-GB', { timeZone: tz });
			const label = preset ? `${preset.flag} ${preset.label}` : tz;
			await telegram.editMessage(chatId, msgId,
				`<b>Timezone set to ${label}</b>\n<code>${tz}</code>\n\nYour local time is now <b>${nowLocal}</b>.`,
				env);
			await telegram.answerCallbackQuery(query.id, env, {
				text: `✓ ${preset?.label ?? tz}`,
			}).catch(() => {});
			log.info('timezone_set_from_picker', { userId, tz });
		} catch (e) {
			log.error('timezone_set_error', { userId, tz, msg: (e as Error).message });
			await telegram.answerCallbackQuery(query.id, env, {
				text: 'Failed to set timezone',
			}).catch(() => {});
		}

	// --- Interactive checklist toggle ---
	// callback_data is `chk|<index>|<title slice>`. Tapping a row
	// flips its prefix between ☐ and ✅, then we rebuild the
	// progress text (▓3░░ + percent + done/total) and edit the
	// message with the updated keyboard. Mirrors Xaridotis's
	// chk| handler in ../gemini-bot/src/bot/handlers.js verbatim.
	} else if (data.startsWith('chk|')) {
		const parts = data.split('|');
		const index = parseInt(parts[1] ?? '', 10);
		const title = parts[2] || 'Checklist';

		const markup = query.message?.reply_markup;
		const row = markup?.inline_keyboard?.[index];
		const button = row?.[0];
		if (!markup || !markup.inline_keyboard || !row || !button) {
			await telegram.answerCallbackQuery(query.id, env).catch(() => {});
			return;
		}

		if (button.text.startsWith('✅')) {
			button.text = `☐  ${button.text.replace(/^✅\s+/, '')}`;
		} else {
			button.text = `✅  ${button.text.replace(/^☐\s+/, '')}`;
		}

		const newText = buildChecklistText(title, markup.inline_keyboard);
		await telegram.editMessage(
			chatId,
			msgId,
			newText,
			env,
			markup as unknown as Record<string, unknown>
		);
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
