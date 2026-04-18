// ============================================================
// Telegram API Client
//
// Typed wrapper around Telegram Bot API methods.
// All methods accept Env for the token and return typed responses.
// ============================================================

import type { TelegramApiResponse, TelegramMessage } from '../types/telegram';
import { log } from './logger';

// --- Core API call ---

async function tgApi<T = unknown>(
	method: string,
	env: Env,
	payload: Record<string, unknown>
): Promise<TelegramApiResponse<T>> {
	const res = await fetch(
		`https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/${method}`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		}
	);
	const data = await res.json() as TelegramApiResponse<T>;
	if (!data.ok && !data.description?.includes('message is not modified')) {
		log.error('telegram_api_error', { method, description: data.description });
	}
	return data;
}

// --- Sanitise HTML for Telegram parse mode ---

function sanitizeHtml(text: string): string {
	// Close unclosed tags and strip unsupported ones
	return text
		.replace(/<(?!\/?(b|i|u|s|code|pre|a|tg-spoiler|blockquote)[\s>\/])[^>]+>/gi, '')
		.replace(/<a(?![^>]*href)[^>]*>/gi, '');
}

// --- Message Methods ---

interface SendMessageOpts {
	replyId?: number;
	markup?: Record<string, unknown>;
	effectId?: string;
}

export async function sendMessage(
	chatId: number,
	threadId: string,
	text: string,
	env: Env,
	opts: SendMessageOpts = {}
): Promise<TelegramApiResponse<TelegramMessage>> {
	const cleanText = sanitizeHtml(text);
	const payload: Record<string, unknown> = {
		chat_id: chatId,
		text: cleanText || '...',
		parse_mode: 'HTML',
		disable_web_page_preview: true,
	};
	if (threadId !== 'default') payload.message_thread_id = threadId;
	if (opts.replyId) payload.reply_parameters = { message_id: opts.replyId };
	if (opts.markup) payload.reply_markup = opts.markup;
	if (opts.effectId) payload.message_effect_id = opts.effectId;
	return tgApi<TelegramMessage>('sendMessage', env, payload);
}

export async function editMessage(
	chatId: number,
	msgId: number,
	text: string,
	env: Env,
	markup?: Record<string, unknown>
): Promise<TelegramApiResponse<TelegramMessage>> {
	const cleanText = sanitizeHtml(text);
	const payload: Record<string, unknown> = {
		chat_id: chatId,
		message_id: msgId,
		text: cleanText || '...',
		parse_mode: 'HTML',
		disable_web_page_preview: true,
	};
	if (markup) payload.reply_markup = markup;
	return tgApi<TelegramMessage>('editMessageText', env, payload);
}

export async function sendMessageDraft(
	chatId: number,
	threadId: string,
	draftId: string,
	text: string,
	env: Env,
	replyId?: number
): Promise<void> {
	const key = `draft_${chatId}_${draftId}`;
	const existingMsgId = await env.CHAT_KV.get(key);

	const cleanText = sanitizeHtml(text);
	if (existingMsgId) {
		await editMessage(chatId, parseInt(existingMsgId), cleanText, env);
	} else {
		const res = await sendMessage(chatId, threadId, cleanText, env, { replyId });
		if (res.result?.message_id) {
			await env.CHAT_KV.put(key, String(res.result.message_id), { expirationTtl: 300 });
		}
	}
}

export async function deleteMessage(chatId: number, msgId: number, env: Env): Promise<void> {
	await tgApi('deleteMessage', env, { chat_id: chatId, message_id: msgId });
}

/**
 * Strip (or replace) the inline keyboard on an existing message without
 * touching its text. Pass null for markup to remove the keyboard entirely.
 */
export async function editMessageReplyMarkup(
	chatId: number,
	msgId: number,
	markup: Record<string, unknown> | null,
	env: Env
): Promise<void> {
	const payload: Record<string, unknown> = {
		chat_id: chatId,
		message_id: msgId,
	};
	if (markup) payload.reply_markup = markup;
	await tgApi('editMessageReplyMarkup', env, payload);
}

export async function answerCallbackQuery(
	callbackQueryId: string,
	env: Env,
	opts: { text?: string; showAlert?: boolean } = {}
): Promise<void> {
	await tgApi('answerCallbackQuery', env, {
		callback_query_id: callbackQueryId,
		text: opts.text,
		show_alert: opts.showAlert,
	});
}

export async function sendChatAction(
	chatId: number,
	threadId: string,
	action: string,
	env: Env
): Promise<void> {
	const payload: Record<string, unknown> = { chat_id: chatId, action };
	if (threadId !== 'default') payload.message_thread_id = threadId;
	await tgApi('sendChatAction', env, payload);
}

export async function sendReaction(
	chatId: number,
	messageId: number,
	emoji: string,
	env: Env
): Promise<void> {
	await tgApi('setMessageReaction', env, {
		chat_id: chatId,
		message_id: messageId,
		reaction: [{ type: 'emoji', emoji }],
	});
}

export async function pinMessage(chatId: number, messageId: number, env: Env): Promise<void> {
	await tgApi('pinChatMessage', env, {
		chat_id: chatId,
		message_id: messageId,
		disable_notification: true,
	});
}

// --- Media Methods ---

export async function sendPhoto(
	chatId: number,
	threadId: string,
	buffer: ArrayBuffer,
	mimeType: string,
	env: Env,
	opts: { replyId?: number; caption?: string; markup?: Record<string, unknown> } = {}
): Promise<TelegramApiResponse<TelegramMessage>> {
	const formData = new FormData();
	formData.append('chat_id', String(chatId));
	formData.append('photo', new Blob([buffer], { type: mimeType }), 'image.jpg');
	if (threadId !== 'default') formData.append('message_thread_id', threadId);
	if (opts.caption) { formData.append('caption', opts.caption); formData.append('parse_mode', 'HTML'); }
	if (opts.replyId) formData.append('reply_parameters', JSON.stringify({ message_id: opts.replyId }));
	if (opts.markup) formData.append('reply_markup', JSON.stringify(opts.markup));

	const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/sendPhoto`, { method: 'POST', body: formData });
	return res.json() as Promise<TelegramApiResponse<TelegramMessage>>;
}

export async function sendVoice(
	chatId: number,
	threadId: string,
	buffer: ArrayBuffer,
	env: Env,
	replyId?: number
): Promise<TelegramApiResponse<TelegramMessage>> {
	const formData = new FormData();
	formData.append('chat_id', String(chatId));
	formData.append('voice', new Blob([buffer], { type: 'audio/ogg' }), 'voice.ogg');
	if (threadId !== 'default') formData.append('message_thread_id', threadId);
	if (replyId) formData.append('reply_parameters', JSON.stringify({ message_id: replyId }));

	const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/sendVoice`, { method: 'POST', body: formData });
	return res.json() as Promise<TelegramApiResponse<TelegramMessage>>;
}

export async function sendDocument(
	chatId: number,
	threadId: string,
	buffer: ArrayBuffer,
	filename: string,
	mimeType: string,
	env: Env
): Promise<TelegramApiResponse<TelegramMessage>> {
	const formData = new FormData();
	formData.append('chat_id', String(chatId));
	formData.append('document', new Blob([buffer], { type: mimeType }), filename);
	if (threadId !== 'default') formData.append('message_thread_id', threadId);

	const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/sendDocument`, { method: 'POST', body: formData });
	return res.json() as Promise<TelegramApiResponse<TelegramMessage>>;
}

export async function sendPoll(
	chatId: number,
	threadId: string,
	question: string,
	options: Array<{ text: string }>,
	env: Env,
	config: { isAnonymous?: boolean; type?: string; allowsMultipleAnswers?: boolean } = {}
): Promise<TelegramApiResponse<TelegramMessage>> {
	const payload: Record<string, unknown> = {
		chat_id: chatId,
		question,
		options,
		is_anonymous: config.isAnonymous ?? false,
		type: config.type ?? 'regular',
		allows_multiple_answers: config.allowsMultipleAnswers ?? false,
	};
	if (threadId !== 'default') payload.message_thread_id = threadId;
	return tgApi<TelegramMessage>('sendPoll', env, payload);
}

export async function sendLocation(
	chatId: number,
	threadId: string,
	latitude: number,
	longitude: number,
	env: Env
): Promise<TelegramApiResponse<TelegramMessage>> {
	const payload: Record<string, unknown> = { chat_id: chatId, latitude, longitude };
	if (threadId !== 'default') payload.message_thread_id = threadId;
	return tgApi<TelegramMessage>('sendLocation', env, payload);
}

// --- File Download ---

export async function downloadFile(fileId: string, env: Env): Promise<ArrayBuffer | null> {
	try {
		const fileRes = await tgApi<{ file_path?: string }>('getFile', env, { file_id: fileId });
		if (!fileRes.result?.file_path) return null;
		const url = `https://api.telegram.org/file/bot${env.TELEGRAM_TOKEN}/${fileRes.result.file_path}`;
		const res = await fetch(url);
		if (!res.ok) return null;
		return res.arrayBuffer();
	} catch {
		return null;
	}
}

// --- Inline Query ---

export async function answerInlineQuery(
	inlineQueryId: string,
	results: Array<Record<string, unknown>>,
	env: Env,
	opts: { cacheTime?: number; isPersonal?: boolean } = {}
): Promise<void> {
	await tgApi('answerInlineQuery', env, {
		inline_query_id: inlineQueryId,
		results,
		cache_time: opts.cacheTime ?? 30,
		is_personal: opts.isPersonal ?? true,
	});
}
