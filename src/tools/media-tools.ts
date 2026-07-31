// Media Tools (Image, Effect, Checklist)

import { defineTool, ok, err, empty } from './factory';
import * as telegram from '../lib/telegram';

export const generateImage = defineTool(
	'generate_image',
	'Generate an AI image based on a text prompt. Only available via Gemini provider.',
	{
		prompt: { type: 'string', description: 'Detailed image generation prompt' },
	},
	['prompt'],
	async (args) => {
		// Image generation requires Gemini - handled by message handler
		return ok({ prompt: args.prompt }, 'Image generation routed to Gemini provider');
	}
);

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

