// Telegram Interaction Tools

import { defineTool, ok, err } from './factory';
import * as telegram from '../lib/telegram';

export const reactToMessage = defineTool(
	'react_to_message',
	'Add an emoji reaction to a message. Use supported Telegram emojis only: 👍 👎 ❤ 🔥 🥰 👏 😁 🤔 🤯 😱 🤬 😢 🎉 🤩 🤮 💩 🙏 👌 🕊 🤡 🥱 🥴 😍 🐳 ❤‍🔥 🌚 💯 🤣 ⚡ 🏆 💔 🤨 😐 🍾 💋 😈 😴 😭 🤓 👻 👨‍💻 👀 🙈 😇 😨 🤝 🤗 🫡 💅 🤪 🗿 🆒 💘 🦄 😽 💊 🙊 🕶 👾 🤷 😡',
	{
		emoji: { type: 'string', description: 'One of the supported Telegram reaction emojis' },
	},
	['emoji'],
	async (args, env, ctx) => {
		try {
			await telegram.sendReaction(ctx.chatId, ctx.messageId ?? 0, args.emoji as string, env);
			return ok();
		} catch {
			return err('Unsupported emoji.');
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
