// ============================================================
// Telegram API Types
// Complete types for the Telegram Bot API entities we use.
// ============================================================

export interface TelegramChat {
	id: number;
	type: 'private' | 'group' | 'supergroup' | 'channel';
	first_name?: string;
	username?: string;
}

export interface TelegramUser {
	id: number;
	is_bot: boolean;
	first_name: string;
	username?: string;
	language_code?: string;
}

export interface TelegramPhotoSize {
	file_id: string;
	file_unique_id: string;
	file_size?: number;
	width: number;
	height: number;
}

export interface TelegramVoice {
	file_id: string;
	file_unique_id: string;
	duration: number;
	mime_type?: string;
	file_size?: number;
}

export interface TelegramAudio {
	file_id: string;
	file_unique_id: string;
	duration: number;
	performer?: string;
	title?: string;
	mime_type?: string;
	file_size?: number;
}

export interface TelegramVideo {
	file_id: string;
	file_unique_id: string;
	width: number;
	height: number;
	duration: number;
	mime_type?: string;
	file_size?: number;
}

export interface TelegramVideoNote {
	file_id: string;
	file_unique_id: string;
	length: number;
	duration: number;
	file_size?: number;
}

export interface TelegramSticker {
	file_id: string;
	file_unique_id: string;
	type: 'regular' | 'mask' | 'custom_emoji';
	width: number;
	height: number;
	is_animated: boolean;
	is_video: boolean;
	emoji?: string;
	file_size?: number;
}

export interface TelegramDocument {
	file_id: string;
	file_unique_id: string;
	file_name?: string;
	mime_type?: string;
	file_size?: number;
}

export interface TelegramMessage {
	message_id: number;
	message_thread_id?: number;
	from?: TelegramUser;
	chat: TelegramChat;
	date: number;
	text?: string;
	caption?: string;
	photo?: TelegramPhotoSize[];
	voice?: TelegramVoice;
	audio?: TelegramAudio;
	video?: TelegramVideo;
	video_note?: TelegramVideoNote;
	sticker?: TelegramSticker;
	document?: TelegramDocument;
	reply_to_message?: TelegramMessage;
	// reply_markup is the inline keyboard attached when the bot sent the
	// message. Used by callback handlers that need to mutate the keyboard
	// in place (interactive checklists, mood flow state edits) without
	// losing the rest of the markup. Per Bot API spec the field is optional;
	// only present on messages the bot sent with reply_markup set.
	reply_markup?: TelegramInlineKeyboardMarkup;
	entities?: Array<{
		type: string;
		offset: number;
		length: number;
		url?: string;
	}>;
}

export interface TelegramCallbackQuery {
	id: string;
	from: TelegramUser;
	message?: TelegramMessage;
	inline_message_id?: string;
	chat_instance: string;
	data?: string;
}

export interface TelegramReactionType {
	type: 'emoji' | 'custom_emoji';
	emoji?: string;
	custom_emoji_id?: string;
}

export interface TelegramMessageReaction {
	chat: TelegramChat;
	message_id: number;
	user?: TelegramUser;
	date: number;
	old_reaction: TelegramReactionType[];
	new_reaction: TelegramReactionType[];
}

export interface TelegramPollAnswer {
	poll_id: string;
	user: TelegramUser;
	option_ids: number[];
}

export interface TelegramInlineQuery {
	id: string;
	from: TelegramUser;
	query: string;
	offset: string;
	chat_type?: 'sender' | 'private' | 'group' | 'supergroup' | 'channel';
}

export interface TelegramUpdate {
	update_id: number;
	message?: TelegramMessage;
	edited_message?: TelegramMessage;
	callback_query?: TelegramCallbackQuery;
	message_reaction?: TelegramMessageReaction;
	poll_answer?: TelegramPollAnswer;
	inline_query?: TelegramInlineQuery;
}

// Telegram API response wrapper
export interface TelegramApiResponse<T = unknown> {
	ok: boolean;
	result?: T;
	description?: string;
	error_code?: number;
	// Present on 429 and some 400 responses. retry_after is seconds
	// the client should wait before retrying (Telegram Bot API docs).
	parameters?: {
		retry_after?: number;
		migrate_to_chat_id?: number;
	};
}

// Inline keyboard button. Shape per Bot API 9.6 — only the fields
// Eukara actually uses are typed strictly; everything else is
// allowed through via `[key: string]: unknown`. This gives us
// autocomplete and typo-prevention on `style` and the common
// action fields without needing to model every Telegram button
// variant (Pay, WebApp, SwitchInlineQuery...).
//
// Button styling (Bot API 9.4, Feb 2026):
//   - style: visual colour. 'danger' (red) for destructive actions,
//     'success' (green) for confirmations, 'primary' (blue) for the
//     main CTA in a group, or omit for the default neutral style.
//   - icon_custom_emoji_id: leading custom emoji sticker id. Only
//     rendered if the bot owner has Telegram Premium (Roma does).
//     The emoji id is a string from Telegram's custom emoji sticker
//     sets; getting one requires a sticker pack lookup.
export type ButtonStyle = 'danger' | 'success' | 'primary';

export interface TelegramInlineKeyboardButton {
	text: string;
	callback_data?: string;
	url?: string;
	style?: ButtonStyle;
	icon_custom_emoji_id?: string;
	// Escape hatch for button variants we don't strictly type.
	[key: string]: unknown;
}

export interface TelegramInlineKeyboardMarkup {
	inline_keyboard: TelegramInlineKeyboardButton[][];
}
