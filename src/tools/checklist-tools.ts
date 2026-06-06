// ============================================================
// Checklist Tool
// ============================================================
// Renders a Telegram inline-keyboard checklist whose items the
// user can toggle ✅/☐ by tapping. Each toggle round-trips
// through the chk| callback handler in src/bot/callback.ts
// which calls editMessage to update both the progress text and
// the keyboard.
//
// Ported from Xaridotis (../gemini-bot/src/tools/checklist.js)
// 2026-06-06. Behaviour matches Xaridotis byte-for-byte:
//   • Same callback_data format: chk|<index>|<title>
//   • Same progress bar: ▓░ blocks, percent, done/total
//   • Same toggle semantics: ✅ ↔ ☐
//   • Same item-text rules (imperative / second person, never
//     first-person; that constraint lives in the parameter
//     description so the model sees it).
//
// Per the persona MHD §10 update on 2026-06-06, this tool is NOT
// auto-deployed on mood thresholds. It only fires when the model
// chooses to call it — typically on user request or when the
// user has explicitly opted into a structured breakdown.
// ============================================================

import { defineTool, ok, err } from './factory';
import * as telegram from '../lib/telegram';

/**
 * Build the user-visible checklist message text with progress info.
 * Counts ticked rows (text starting with ✅), renders a 10-block
 * progress bar and the done/total ratio. Mirrors Xaridotis's
 * buildChecklistText so a future merge stays trivial.
 */
export function buildChecklistText(
	title: string,
	buttons: Array<Array<{ text: string }>>
): string {
	const total = buttons.length;
	const done = buttons.filter((row) => row[0]?.text?.startsWith('✅')).length;
	const remaining = total - done;

	let text = `📝 <b>${title}</b>\n`;
	text += `<i>Checklist</i>\n\n`;

	const pct = total > 0 ? Math.round((done / total) * 100) : 0;
	const filled = Math.round(pct / 10);
	const bar = '▓'.repeat(filled) + '░'.repeat(10 - filled);
	text += `${bar} ${pct}%\n`;
	text += `<b>${done}</b> of <b>${total}</b> completed`;
	if (remaining > 0) text += ` · ${remaining} remaining`;
	if (done === total && total > 0) text += ` 🎉`;

	return text;
}

export const createChecklist = defineTool(
	'create_checklist',
	"Create a checklist with toggleable tasks. Use for step-by-step plans, shopping lists, to-do lists, or task breakdowns the user has asked for. Items are tapped to mark done. Do NOT auto-deploy on mood scores — only on explicit user request or contextually obvious need.",
	{
		title: {
			type: 'string',
			description: "The title of the checklist (e.g., 'Morning Routine'). Max 255 characters.",
		},
		items: {
			type: 'array',
			items: { type: 'string' },
			description:
				"List of tasks (1-30 items). PERSPECTIVE: tasks are presented BACK to the user, so use imperative or noun phrases — NEVER first person. Good: 'Take meds', 'Email Sarah', 'Buy milk', 'Morning shower'. Bad: 'I take my meds', 'I email Sarah'. If the user describes their routine in first person ('I take meds, I shower'), convert each item to imperative ('Take meds', 'Shower').",
		},
	},
	['title', 'items'],
	async (args, env, ctx) => {
		const title = String(args.title ?? '').slice(0, 255);
		const itemsRaw = args.items;

		if (!Array.isArray(itemsRaw) || itemsRaw.length === 0) {
			return err('Checklist needs at least 1 item.');
		}
		if (itemsRaw.length > 30) {
			return err('Checklist supports at most 30 items.');
		}

		const items = itemsRaw.map((x) => String(x ?? '').trim()).filter(Boolean);
		if (items.length === 0) {
			return err('All checklist items were empty after trimming.');
		}

		const kb = {
			inline_keyboard: items.map((item, idx) => [
				{
					text: `☐  ${item}`,
					callback_data: `chk|${idx}|${title.slice(0, 40)}`,
				},
			]),
		};

		const msgText = buildChecklistText(title, kb.inline_keyboard);

		await telegram.sendMessage(ctx.chatId, ctx.threadId, msgText, env, {
			markup: kb,
		});

		return ok({ item_count: items.length });
	}
);
