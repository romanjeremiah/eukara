// ============================================================
// Telegram API Client
//
// Typed wrapper around Telegram Bot API methods.
// All methods accept Env for the token and return typed responses.
// ============================================================

import type { TelegramApiResponse, TelegramMessage } from '../types/telegram';
import { log } from './logger';

// --- Core API call ---

// Maximum number of retries on retriable failures (429 rate limit,
// transient 5xx). Each retry honours the Retry-After header or uses
// exponential backoff. Two retries is enough for typical rate limit
// windows without making the user wait forever.
const MAX_RETRIES = 2;

async function tgApi<T = unknown>(
	method: string,
	env: Env,
	payload: Record<string, unknown>,
	attempt = 0
): Promise<TelegramApiResponse<T>> {
	let res: Response;
	try {
		res = await fetch(
			`https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/${method}`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			}
		);
	} catch (err) {
		// Network-level failure (DNS, connection reset, fetch abort).
		// Distinct from API-level errors — Telegram never saw this.
		log.error('telegram_fetch_failed', {
			method,
			attempt,
			msg: (err as Error).message,
		});
		// Rethrow so callers know the send didn't happen. handleMessage's
		// wrapper can attempt a fallback.
		throw err;
	}

	// Parse response body. If JSON parsing fails, Telegram returned
	// something unexpected (HTML error page, truncated response).
	let data: TelegramApiResponse<T>;
	try {
		data = await res.json() as TelegramApiResponse<T>;
	} catch (err) {
		log.error('telegram_response_not_json', {
			method,
			attempt,
			httpStatus: res.status,
			msg: (err as Error).message,
		});
		throw new Error(`Telegram returned non-JSON response: HTTP ${res.status}`);
	}

	// Handle the no-op case: editing a message to identical content
	// returns an error that we intentionally ignore.
	if (data.ok) return data;
	if (data.description?.includes('message is not modified')) return data;

	// 429 Too Many Requests — honour retry_after and back off.
	const retryAfter = data.parameters?.retry_after;
	if (res.status === 429 && retryAfter && attempt < MAX_RETRIES) {
		log.warn('telegram_rate_limited', {
			method,
			attempt,
			retryAfter,
			description: data.description,
		});
		await new Promise(r => setTimeout(r, retryAfter * 1000));
		return tgApi<T>(method, env, payload, attempt + 1);
	}

	// Transient 5xx — exponential backoff, best-effort retry.
	if (res.status >= 500 && res.status < 600 && attempt < MAX_RETRIES) {
		const delay = 500 * Math.pow(2, attempt);
		log.warn('telegram_transient_error', {
			method,
			attempt,
			httpStatus: res.status,
			description: data.description,
			retryingAfterMs: delay,
		});
		await new Promise(r => setTimeout(r, delay));
		return tgApi<T>(method, env, payload, attempt + 1);
	}

	// Non-retriable API error — log WITH httpStatus so we can
	// distinguish 400 (bad HTML) from 403 (blocked) from 429 (give up
	// after retries).
	log.error('telegram_api_error', {
		method,
		httpStatus: res.status,
		errorCode: data.error_code,
		description: data.description,
	});
	return data;
}

// --- Sanitise HTML for Telegram parse mode ---
//
// Telegram's HTML parse mode accepts a specific allowlist of tags
// (see https://core.telegram.org/bots/api#html-style). Any other
// tag in the output causes a 400 Bad Request, which silently drops
// the message from the user's perspective. We strip unsupported
// tags before send.
//
// Allowed tags (maintained in sync with Bot API docs):
//   b, strong, i, em, u, ins, s, strike, del,
//   code, pre, a, tg-spoiler, tg-emoji, blockquote
//
// Note: <blockquote expandable> is valid — the expandable attribute
// is permitted on blockquote. The regex handles it via the
// whitespace-or-close character class after the tag name.
// Telegram's complete HTML tag allowlist, maintained in sync with
// https://core.telegram.org/bots/api#html-style as of Bot API 9.6.
// Any tag name NOT in this list will be stripped by the sanitiser
// below, because Telegram responds with HTTP 400 when unknown tags
// appear in parse_mode=HTML messages — which silently drops the
// message from the user's perspective.
//
// tg-time (new in Bot API 9.5, March 2026) renders formatted
// timestamps that update live in Telegram clients — used by
// formatTime() in lib/formatting.ts for reminder messages and
// mood entry timestamps.
const ALLOWED_TAGS = [
	'b', 'strong', 'i', 'em', 'u', 'ins',
	's', 'strike', 'del',
	'code', 'pre', 'a',
	'tg-spoiler', 'tg-emoji', 'tg-time', 'blockquote',
].join('|');

// Matches any opening/closing tag whose name is NOT in the allowed
// set. The [\s>\/] terminator is critical: it ensures we don't
// false-match tags like <blockquote expandable> as the prefix
// "blockquote" followed by something non-terminator.
const DISALLOWED_TAG_RE = new RegExp(
	`<(?!\\/?(?:${ALLOWED_TAGS})[\\s>\\/])[^>]+>`,
	'gi'
);

function sanitizeHtml(text: string): string {
	return text
		// Normalise: <span class="tg-spoiler">content</span> is Telegram's
		// long-form spoiler syntax, equivalent to <tg-spoiler>content</tg-spoiler>.
		// Convert the whole unit (opening + content + closing) atomically so
		// we can't end up with an orphaned </span> that the allowlist would
		// strip and leave a dangling </tg-spoiler>.
		//
		// The non-greedy [\s\S]*? is deliberate: it stops at the FIRST </span>,
		// which is correct as long as tg-spoiler isn't nested inside another
		// <span>. Telegram doesn't permit nested spoilers anyway (per the
		// nesting rules in the docs), so this is safe in practice.
		.replace(
			/<span\s+class=["']tg-spoiler["']\s*>([\s\S]*?)<\/span>/gi,
			'<tg-spoiler>$1</tg-spoiler>'
		)
		// Strip any tag not in the allowlist. Any remaining <span> and
		// </span> (i.e. ones that weren't tg-spoiler) get stripped here.
		.replace(DISALLOWED_TAG_RE, '')
		// Strip <a> tags that are missing href (Telegram rejects these)
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
		rich_message: { html: cleanText || '...' },
		disable_notification: false,
	};
	if (threadId !== 'default') payload.message_thread_id = threadId;
	if (opts.replyId) payload.reply_parameters = { message_id: opts.replyId };
	if (opts.markup) payload.reply_markup = opts.markup;
	if (opts.effectId) payload.message_effect_id = opts.effectId;
	return tgApi<TelegramMessage>('sendRichMessage', env, payload);
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
		rich_message: { html: cleanText || '...' },
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
	const cleanText = sanitizeHtml(text);
	// Telegram draft_id must be a non-zero integer. Convert string draftId to a 32-bit int hash.
	let draftIdInt = 0;
	for (let i = 0; i < draftId.length; i++) {
		draftIdInt = Math.imul(31, draftIdInt) + draftId.charCodeAt(i) | 0;
	}
	draftIdInt = Math.abs(draftIdInt) || 1; // Ensure non-zero positive

	const payload: Record<string, unknown> = {
		chat_id: chatId,
		draft_id: draftIdInt,
		rich_message: { html: cleanText || '...' },
	};
	if (threadId !== 'default') payload.message_thread_id = threadId;
	
	// reply_parameters is only valid on sendRichMessage, but draft API might not support it
	// Docs for sendRichMessageDraft say it accepts: chat_id, message_thread_id, draft_id, rich_message.
	await tgApi('sendRichMessageDraft', env, payload);
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

// --- Sticker / Custom Emoji Discovery ---
//
// These endpoints let us look up custom emoji sticker IDs, which we
// then use as icon_custom_emoji_id on buttons or as <tg-emoji> tags
// in message text. Both require the bot owner to have Telegram Premium
// for the emoji to actually render in bot messages (Bot API 9.4+).

/**
 * A single sticker as returned by Telegram. Only the fields we use
 * are typed; additional fields (file_id, width, height, thumb, etc.)
 * exist on the wire but aren't needed for ID discovery.
 */
export interface TelegramSticker {
	file_id: string;
	file_unique_id: string;
	type: 'regular' | 'mask' | 'custom_emoji';
	emoji?: string;
	set_name?: string;
	custom_emoji_id?: string;
}

/**
 * Fetch a complete sticker set by name. For custom emoji sets,
 * every returned sticker will have a `custom_emoji_id` that can be
 * used with tg-emoji or on buttons.
 *
 * Common public sticker pack names with custom emoji:
 *   - "RestrictedEmoji" — Telegram's built-in extras (paid)
 *   - Any user-created pack via `t.me/addemoji/{name}`
 */
export async function getStickerSet(
	name: string, env: Env
): Promise<{ name: string; title: string; sticker_type: string; stickers: TelegramSticker[] } | null> {
	const res = await tgApi<{
		name: string;
		title: string;
		sticker_type: string;
		stickers: TelegramSticker[];
	}>('getStickerSet', env, { name });
	return res.ok && res.result ? res.result : null;
}

/**
 * Reverse lookup: given known custom_emoji_ids, fetch their sticker
 * info. Useful for validating stored IDs or discovering what emoji
 * a saved ID actually represents.
 *
 * Max 200 IDs per call per Bot API limits.
 */
export async function getCustomEmojiStickers(
	customEmojiIds: string[], env: Env
): Promise<TelegramSticker[]> {
	if (customEmojiIds.length === 0) return [];
	const res = await tgApi<TelegramSticker[]>('getCustomEmojiStickers', env, {
		custom_emoji_ids: customEmojiIds.slice(0, 200),
	});
	return res.ok && res.result ? res.result : [];
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
	const data = await res.json() as TelegramApiResponse<TelegramMessage>;
	if (!data.ok) {
		log.warn('telegram_voice_not_ok', {
			httpStatus: res.status,
			errorCode: data.error_code,
			description: data.description,
			bufferBytes: buffer.byteLength,
		});
	}
	return data;
}

export async function sendAudio(
	chatId: number,
	threadId: string,
	buffer: ArrayBuffer,
	filename: string,
	mimeType: string,
	env: Env,
	replyId?: number
): Promise<TelegramApiResponse<TelegramMessage>> {
	const formData = new FormData();
	formData.append('chat_id', String(chatId));
	formData.append('audio', new Blob([buffer], { type: mimeType }), filename);
	if (threadId !== 'default') formData.append('message_thread_id', threadId);
	if (replyId) formData.append('reply_parameters', JSON.stringify({ message_id: replyId }));

	const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/sendAudio`, { method: 'POST', body: formData });
	const data = await res.json() as TelegramApiResponse<TelegramMessage>;
	if (!data.ok) {
		log.warn('telegram_audio_not_ok', {
			httpStatus: res.status,
			errorCode: data.error_code,
			description: data.description,
			bufferBytes: buffer.byteLength,
		});
	}
	return data;
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

/**
 * Send a native Telegram poll or quiz.
 *
 * Modernised 2026-07-01 to the current Bot API sendPoll surface. All new
 * fields are optional and default to the previous behaviour, so existing
 * callers are unaffected. NOTE: as of this change nothing in Eukara calls
 * sendPoll yet (no poll tool/command) — this keeps the primitive correct and
 * ready for a future /poll feature.
 *
 * Reference: docs/telegram-api-docs/telegram-bot-api-reference.md → `sendPoll`.
 *
 * @param {Array<{text: string; text_parse_mode?: string; text_entities?: unknown[]}>} options
 *   1-12 InputPollOption objects. Option text supports custom-emoji formatting
 *   via text_parse_mode / text_entities.
 * @param {object} config - poll options; quiz fields (correctOptionIds,
 *   explanation) only apply when type === 'quiz'. openPeriod and closeDate are
 *   mutually exclusive (openPeriod wins if both are set).
 */
export async function sendPoll(
	chatId: number,
	threadId: string,
	question: string,
	options: Array<{ text: string; text_parse_mode?: string; text_entities?: unknown[] }>,
	env: Env,
	config: {
		isAnonymous?: boolean;
		type?: 'regular' | 'quiz';
		allowsMultipleAnswers?: boolean;
		questionParseMode?: string;
		allowsRevoting?: boolean;
		shuffleOptions?: boolean;
		hideResultsUntilCloses?: boolean;
		correctOptionIds?: number[];
		explanation?: string;
		explanationParseMode?: string;
		openPeriod?: number;
		closeDate?: number;
		isClosed?: boolean;
		description?: string;
		descriptionParseMode?: string;
		effectId?: string;
		replyId?: number;
		markup?: Record<string, unknown>;
	} = {}
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
	// Question formatting (currently custom-emoji only, per the API).
	if (config.questionParseMode) payload.question_parse_mode = config.questionParseMode;
	// Voting behaviour.
	if (config.allowsRevoting != null) payload.allows_revoting = config.allowsRevoting;
	if (config.shuffleOptions) payload.shuffle_options = true;
	if (config.hideResultsUntilCloses) payload.hide_results_until_closes = true;
	// Quiz mode.
	if (config.correctOptionIds) payload.correct_option_ids = config.correctOptionIds;
	if (config.explanation) payload.explanation = config.explanation;
	if (config.explanationParseMode) payload.explanation_parse_mode = config.explanationParseMode;
	// Auto-close timing (mutually exclusive; open_period takes precedence).
	if (config.openPeriod != null) payload.open_period = config.openPeriod;
	else if (config.closeDate != null) payload.close_date = config.closeDate;
	if (config.isClosed) payload.is_closed = true;
	// Poll description (Bot API 9.x+).
	if (config.description) payload.description = config.description;
	if (config.descriptionParseMode) payload.description_parse_mode = config.descriptionParseMode;
	// Delivery extras.
	if (config.effectId) payload.message_effect_id = config.effectId;
	if (config.replyId) payload.reply_parameters = { message_id: config.replyId };
	if (config.markup) payload.reply_markup = config.markup;
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
