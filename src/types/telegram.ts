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
	document?: TelegramDocument;
	reply_to_message?: TelegramMessage;
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
}
