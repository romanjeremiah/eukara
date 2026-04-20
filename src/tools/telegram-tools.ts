// Telegram Interaction Tools

import { defineTool, ok, err } from './factory';
import * as telegram from '../lib/telegram';

export const reactToMessage = defineTool(
	'react_to_message',
	'Add an emoji reaction to a message. React contextually and naturally to match the conversation tone. You MUST use ONE of these exact supported emojis: 👍 👎 ❤ 🔥 🥰 👏 😁 🤔 🤯 😱 🤬 😢 🎉 🤩 🤮 💩 🙏 👌 🕊 🤡 🥱 🥴 😍 🐳 ❤‍🔥 🌚 🌭 💯 🤣 ⚡ 🍌 🏆 💔 🤨 😐 🍓 🍾 💋 🖕 😈 😴 😭 🤓 👻 👨‍💻 👀 🎃 🙈 😇 😨 🤝 ✍ 🤗 🫡 🎅 🎄 ⛄ 💅 🤪 🗿 🆒 💘 🙉 🦄 😽 💊 🙊 🕶 👾 🤷‍♂️ 🤷 🤷‍♀️ 😡. Do NOT use any other emoji.',
	{
		emoji: { type: 'string', description: 'One of the 73 supported Telegram reaction emojis from the list above' },
	},
	['emoji'],
	async (args, env, ctx) => {
		try {
			await telegram.sendReaction(ctx.chatId, ctx.messageId ?? 0, args.emoji as string, env);
			return ok();
		} catch {
			return err('Unsupported emoji. Use only the 73 listed emojis.');
		}
	}
);

export const pinMessage = defineTool(
	'pin_message',
	'Pin a message in the chat.',
	{
		reason: { type: 'string', description: 'Why this message should be pinned' },
	},
	['reason'],
	async (_args, env, ctx) => {
		if (!ctx.messageId) return err('No message to pin');
		await telegram.pinMessage(ctx.chatId, ctx.messageId, env);
		return ok({ pinned_message_id: ctx.messageId });
	}
);

export const sendLocation = defineTool(
	'send_location',
	'Pin a geographical location on a map. Use when recommending places, restaurants, or meeting points.',
	{
		latitude: { type: 'number' },
		longitude: { type: 'number' },
	},
	['latitude', 'longitude'],
	async (args, env, ctx) => {
		await telegram.sendLocation(ctx.chatId, ctx.threadId, args.latitude as number, args.longitude as number, env);
		return ok();
	}
);

export const sendDraft = defineTool(
	'send_draft',
	'Provide the user with a pre-filled message they can tap to share or send.',
	{
		text: { type: 'string', description: 'The text to pre-fill' },
	},
	['text'],
	async (args, env, ctx) => {
		const shareUrl = `https://t.me/share/url?text=${encodeURIComponent(args.text as string)}`;
		await telegram.sendMessage(ctx.chatId, ctx.threadId, '📝 Here\'s your draft:', env, {
			markup: { inline_keyboard: [[{ text: '📤 Send draft', url: shareUrl }]] },
		});
		return ok();
	}
);

export const replyWithQuote = defineTool(
	'reply_with_quote',
	'Reply to a specific quoted portion of the user\'s message.',
	{
		quote: { type: 'string', description: 'Exact text from the user\'s message to quote' },
		reply_text: { type: 'string', description: 'Your response to this specific quote' },
	},
	['quote', 'reply_text'],
	async (args, env, ctx) => {
		await telegram.sendMessage(ctx.chatId, ctx.threadId, args.reply_text as string, env, {
			replyId: ctx.messageId,
		});
		return ok();
	}
);

export const sendVoiceNote = defineTool(
	'send_voice_note',
	'Reply with a voice message. Use when the user requests voice or the response benefits from spoken delivery.',
	{
		text_to_speak: { type: 'string', description: 'Text to convert to speech' },
	},
	['text_to_speak'],
	async (args) => {
		// Voice execution handled by the message handler (needs TTS provider)
		return ok({ text: args.text_to_speak }, 'Voice handled by handler');
	}
);

export const lookupCustomEmoji = defineTool(
	'lookup_custom_emoji',
	'Look up Telegram custom emoji sticker IDs. Two modes: (1) pack_name to list all stickers in a set with their custom_emoji_id values — use this when you need to find an ID for a new button icon or <tg-emoji> tag. (2) emoji_ids to look up existing IDs and see what emoji they represent — use this for validation. Returns up to 50 stickers with their id, emoji, and set_name. Custom emoji only render in bot messages if the bot owner has Telegram Premium.',
	{
		pack_name: { type: 'string', description: 'Name of a custom emoji sticker pack (e.g. "RestrictedEmoji", or any pack from t.me/addemoji/{name}). Mutually exclusive with emoji_ids.' },
		emoji_ids: { type: 'string', description: 'Comma-separated list of custom_emoji_id values to look up (max 200). Mutually exclusive with pack_name.' },
	},
	[],
	async (args, env) => {
		const packName = args.pack_name as string | undefined;
		const emojiIds = args.emoji_ids as string | undefined;
		if (!packName && !emojiIds) return err('Provide either pack_name or emoji_ids.');
		if (packName && emojiIds) return err('Provide pack_name OR emoji_ids, not both.');

		if (packName) {
			const set = await telegram.getStickerSet(packName, env);
			if (!set) return err(`Sticker pack "${packName}" not found or inaccessible.`);
			if (set.sticker_type !== 'custom_emoji') {
				return err(`Pack "${packName}" is type "${set.sticker_type}" — only "custom_emoji" packs have IDs usable on buttons or in tg-emoji tags.`);
			}
			// Cap at 50 to keep the response compact — AI doesn't need 200.
			const stickers = set.stickers.slice(0, 50).map(s => ({
				id: s.custom_emoji_id,
				emoji: s.emoji,
			}));
			return ok({
				pack_name: set.name,
				pack_title: set.title,
				total_in_pack: set.stickers.length,
				stickers,
			});
		}

		const ids = (emojiIds ?? '').split(',').map(s => s.trim()).filter(Boolean);
		if (ids.length === 0) return err('emoji_ids was empty.');
		const stickers = await telegram.getCustomEmojiStickers(ids, env);
		return ok({
			stickers: stickers.map(s => ({
				id: s.custom_emoji_id,
				emoji: s.emoji,
				set_name: s.set_name,
			})),
		});
	}
);
