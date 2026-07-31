// Media Tools (Image, Effect, Checklist)

import { createOpenAISpecialistService } from '../ai/openai-specialists';
import { getAIProviderMode } from '../ai/provider-factory';
import { defineTool, ok, err } from './factory';
import * as telegram from '../lib/telegram';

export const generateImage = defineTool(
	'generate_image',
	'Generate an image from a detailed text prompt and send it to the current Telegram chat.',
	{
		prompt: { type: 'string', description: 'Detailed image generation prompt' },
	},
	['prompt'],
	async (args, env, ctx) => {
		if (getAIProviderMode(env) !== 'openai') {
			return err('Image generation is available when direct OpenAI mode is enabled.');
		}

		const prompt = String(args.prompt ?? '').trim();
		if (!prompt) return err('Image prompt is empty.');

		try {
			const image = await createOpenAISpecialistService(env).generateImage(prompt);
			const promptHash = await sha256Hex(prompt);
			const key = `generated/${ctx.userId}/${ctx.messageId}-${promptHash.slice(0, 16)}.png`;

			await env.MEDIA_BUCKET.put(key, image.data, {
				httpMetadata: { contentType: image.mimeType },
				customMetadata: {
					chatId: String(ctx.chatId),
					messageId: String(ctx.messageId),
					provider: 'openai',
					userId: String(ctx.userId),
				},
			});

			const sent = await telegram.sendPhoto(
				ctx.chatId,
				ctx.threadId,
				image.data,
				image.mimeType,
				env,
				{ replyId: ctx.messageId },
			);
			if (!sent.ok) {
				return err(`Image generated but Telegram delivery failed: ${sent.description ?? 'unknown error'}`);
			}

			return ok({ r2Key: key }, 'Image generated, persisted and sent.');
		} catch (error) {
			return err(`Image generation failed: ${(error as Error).message}`);
		}
	}
);

/**
 * Produce a deterministic suffix so tool retries overwrite the same R2 object.
 */
async function sha256Hex(value: string): Promise<string> {
	const digest = await crypto.subtle.digest(
		'SHA-256',
		new TextEncoder().encode(value),
	);
	return Array.from(new Uint8Array(digest))
		.map((byte) => byte.toString(16).padStart(2, '0'))
		.join('');
}

export const messageEffect = defineTool(
	'send_message_effect',
	'Send a message with a Telegram Premium effect (animation). Effects: 🔥 fire, 👍 thumbs_up, 👎 thumbs_down, ❤ heart, 🎉 party, 💩 poop.',
	{
		effect_emoji: { type: 'string', description: 'The effect emoji to use' },
	},
	['effect_emoji'],
	async (args, env, ctx) => {
		// Effect ID mapping (Telegram premium effects)
		const effects: Record<string, string> = {
			'🔥': '5104841245755180586',
			'👍': '5107584321108051014',
			'👎': '5104858069142078462',
			'❤': '5159385139981059251',
			'🎉': '5046509860389126442',
			'💩': '5046589136895476101',
		};
		const effectId = effects[args.effect_emoji as string];
		if (!effectId) return err('Unknown effect emoji.');
		return ok({ effectId }, 'Effect ID returned for handler to apply');
	}
);

// NOTE: 2026-06-06 — the prior static `sendChecklist` was replaced by
// `createChecklist` in src/tools/checklist-tools.ts. That version renders
// an interactive Telegram inline keyboard whose buttons toggle ticked /
// unticked state via the chk| callback handler in src/bot/callback.ts.
// The static text-only version had no progress tracking and no
// completion feedback, so the upgraded tool fully supersedes it.
