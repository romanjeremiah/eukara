// ============================================================
// Command Handler
//
// Processes /commands. Returns true if the message was a
// command (handled), false if it should be passed to the
// regular message handler.
// ============================================================

import type { TelegramMessage } from '../types/telegram';
import type { MemoryRow, PersonaConfigRow } from '../types/db';
import * as telegram from '../lib/telegram';
import * as memory from '../services/memory';
import * as persona from '../services/persona';
import { PERSONA_PRESETS, type PersonaPreset } from '../config/persona-presets';
import { TIMEZONE_PRESETS, findPresetByTz, isValidTimezone } from '../config/timezone-presets';
import { clearHistory } from '../lib/history';
import { escapeHtml } from '../lib/formatting';
import { log } from '../lib/logger';

export async function handleCommand(
	msg: TelegramMessage,
	env: Env
): Promise<boolean> {
	const text = msg.text ?? '';
	const chatId = msg.chat.id;
	const threadId = msg.message_thread_id ? String(msg.message_thread_id) : 'default';

	if (!text.startsWith('/')) return false;

	const cmd = text.split(/\s|@/)[0]!.toLowerCase();
	log.info('command', { chatId, cmd });

	switch (cmd) {
		case '/start':
			await telegram.sendMessage(chatId, threadId,
				'<b>Welcome to Eukara</b>\n\nI am your AI companion, running on Cloudflare edge infrastructure.',
				env);
			return true;

		case '/clear':
			await clearHistory(env, chatId, threadId);
			await env.CHAT_KV.delete(`persona_${chatId}_${threadId}`);
			await telegram.sendMessage(chatId, threadId, 'Conversation cleared. What is on your mind?', env);
			return true;

		case '/mood': {
			const fromId = msg.from?.id;
			if (!fromId) return true;
			// Enqueue a mood_poll task — the queue consumer already knows
			// how to send the 0-10 poll and wire the KV context for the
			// poll_answer webhook to find. Using the queue keeps the
			// webhook path fast and isolates the Telegram API call.
			await env.TASK_QUEUE.send({ type: 'mood_poll', userId: fromId, chatId });
			return true;
		}

		case '/architect': {
			if (!env.OWNER_ID || String(msg.from?.id) !== String(env.OWNER_ID)) {
				await telegram.sendMessage(chatId, threadId, 'This command is owner-only.', env);
				return true;
			}
			// Concurrency guard with kill switch
			const lock = await env.CHAT_KV.get(`architect_lock_${chatId}`);
			if (lock) {
				const age = Math.round((Date.now() - parseInt(lock)) / 1000);
				await telegram.sendMessage(chatId, threadId,
					`⚙️ <b>Architecture review already running</b> (${age}s ago).`,
					env, { markup: { inline_keyboard: [[
						{ text: '🔄 Kill & Restart', callback_data: 'architect_kill' },
						{ text: '⏳ Wait', callback_data: 'noop' },
					]] } });
				return true;
			}
			await env.CHAT_KV.put(`architect_lock_${chatId}`, String(Date.now()), { expirationTtl: 120 });

			const statusRes = await telegram.sendMessage(chatId, threadId,
				'⚙️ <b>Architecture Review</b>\n\n<i>Starting research workflow...</i>', env);
			const statusMsgId = statusRes.result?.message_id;

			try {
				await env.ARCHITECT_WORKFLOW.create({
					id: `architect-${Date.now()}`,
					params: { chatId, statusMsgId },
				});
			} catch (e) {
				await env.CHAT_KV.delete(`architect_lock_${chatId}`);
				await telegram.sendMessage(chatId, threadId,
					`⚙️ Workflow error: ${((e as Error).message ?? '').slice(0, 100)}`, env);
			}
			return true;
		}

		case '/listen': {
			const userId = msg.from?.id;
			if (!userId) return true;
			await env.CHAT_KV.put(`listening_mode_${userId}`, '1', { expirationTtl: 86400 });
			await env.CHAT_KV.delete(`listen_buffer_${userId}`);
			await telegram.sendMessage(chatId, threadId,
				'<b>Deep Listening Mode</b>\n\nTake all the space you need. Send as many messages or voice notes as you want — I will listen without interrupting, just acknowledging with a reaction.\n\nType /done when you are finished and I will synthesise everything you shared.',
				env);
			return true;
		}

		case '/done': {
			const userId = msg.from?.id;
			if (!userId) return true;
			const listening = await env.CHAT_KV.get(`listening_mode_${userId}`);
			if (!listening) {
				await telegram.sendMessage(chatId, threadId,
					'We are not in listening mode. Use /listen to start a brain dump.',
					env);
				return true;
			}
			await env.CHAT_KV.delete(`listening_mode_${userId}`);

			const bufferStr = await env.CHAT_KV.get(`listen_buffer_${userId}`) ?? '[]';
			const buffer: string[] = JSON.parse(bufferStr);
			await env.CHAT_KV.delete(`listen_buffer_${userId}`);

			if (buffer.length === 0) {
				await telegram.sendMessage(chatId, threadId,
					'You did not send anything during this session, but I am always here when you need me.',
					env);
				return true;
			}

			// No placeholder message — Telegram's typing indicator
			// (sent by handleMessage) signals the bot is working, and
			// the final synthesis will be the only new message in the
			// chat, which is cleaner UX.

			// Rewrite the incoming message so the normal message handler
			// treats this as the synthesis prompt. Mutation is safe here —
			// the msg object is a request-scoped payload and won't be reused.
			// Returning false causes index.ts to fall through to handleMessage.
			msg.text = `I have just completed a Deep Listening brain dump. Here are my raw thoughts across ${buffer.length} messages, in order:\n\n${buffer.join('\n\n')}\n\nPlease synthesise this. Identify core themes, active schemas, or actionable steps. Proactively save any important patterns or ideas to memory, then give me a cohesive, compassionate response.`;
			return false;
		}

		case '/persona': {
			const userId = msg.from?.id;
			if (!userId) return true;
			await persona.ensureUser(env, userId, msg.from?.first_name, msg.from?.username, msg.from?.language_code);
			const current = await persona.getPersonaConfig(env, userId);
			// Infer which preset (if any) matches the user's current config.
			// Matching is best-effort — evolved_traits and communication_notes
			// can drift without breaking the match.
			const currentPreset = inferCurrentPreset(current);
			const header = currentPreset
				? `<b>Your current mode: ${currentPreset.emoji} ${currentPreset.label}</b>\n\n<i>${currentPreset.description}</i>\n\nPick a new one:`
				: `<b>Pick a conversational mode</b>\n\nYour current settings don't match any preset exactly — choose one below to reset.`;
			const rows = PERSONA_PRESETS.map(p => [{
				text: `${p.emoji} ${p.label}${currentPreset?.id === p.id ? ' ✓' : ''}`,
				callback_data: `persona_preset_${p.id}`,
			}]);
			await telegram.sendMessage(chatId, threadId, header, env, {
				markup: { inline_keyboard: rows },
			});
			return true;
		}

		case '/memories': {
			const userId = msg.from?.id;
			if (!userId) return true;
			const rows = await memory.getMemories(env, userId, 100);
			if (!rows.length) {
				await telegram.sendMessage(chatId, threadId,
					"I haven't saved anything about you yet. As we talk, I'll pick up on things — facts, patterns, things that matter — and remember them.",
					env);
				return true;
			}
			const formatted = formatMemoriesForDisplay(rows);
			await telegram.sendMessage(chatId, threadId, formatted, env);
			return true;
		}

		case '/forget': {
			const userId = msg.from?.id;
			if (!userId) return true;
			const rows = await memory.getMemories(env, userId, 500);
			if (!rows.length) {
				await telegram.sendMessage(chatId, threadId,
					"Nothing to forget — I haven't saved anything about you yet.",
					env);
				return true;
			}
			// Group by category so the buttons can target whole groups.
			const counts = new Map<string, number>();
			for (const m of rows) counts.set(m.category, (counts.get(m.category) ?? 0) + 1);

			const buttons: Array<Array<{ text: string; callback_data: string }>> = [];
			// One button per category, two per row for readability.
			const entries = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
			for (let i = 0; i < entries.length; i += 2) {
				const row: Array<{ text: string; callback_data: string }> = [];
				for (let j = i; j < Math.min(i + 2, entries.length); j++) {
					const [cat, n] = entries[j]!;
					row.push({
						text: `🗑️ ${cat} (${n})`,
						callback_data: `forget_cat_${cat}`,
					});
				}
				buttons.push(row);
			}
			// Trailing danger-zone actions
			buttons.push([{ text: '💣 Forget EVERYTHING', callback_data: 'forget_all_confirm' }]);
			buttons.push([{ text: '✖️ Cancel', callback_data: 'forget_cancel' }]);

			await telegram.sendMessage(chatId, threadId,
				`<b>What should I forget?</b>\n\nI currently have <b>${rows.length}</b> memories across ${entries.length} categories. Tap a category to wipe just that group, or use the red button to wipe everything.\n\n<i>Deletions are permanent.</i>`,
				env, { markup: { inline_keyboard: buttons } });
			return true;
		}

		case '/timezone': {
			const userId = msg.from?.id;
			if (!userId) return true;
			await persona.ensureUser(env, userId, msg.from?.first_name, msg.from?.username, msg.from?.language_code);

			// Parse an optional argument: /timezone Europe/Berlin
			// Accepts both IANA strings and preset labels (case-insensitive).
			const arg = text.split(/\s+/).slice(1).join(' ').trim();
			if (arg) {
				// Try matching a preset label first — friendlier for users
				// typing "Tokyo" instead of "Asia/Tokyo".
				const presetByLabel = TIMEZONE_PRESETS.find(
					p => p.label.toLowerCase() === arg.toLowerCase()
				);
				const candidate = presetByLabel?.tz ?? arg;

				if (!isValidTimezone(candidate)) {
					await telegram.sendMessage(chatId, threadId,
						`<b>Unknown timezone:</b> <code>${escapeHtml(arg)}</code>\n\nUse a valid IANA identifier like <code>Europe/Berlin</code> or <code>America/New_York</code>, or use /timezone without arguments to pick from a list.`,
						env);
					return true;
				}

				await persona.setUserTimezone(env, userId, candidate);
				const preset = findPresetByTz(candidate);
				const nowLocal = new Date().toLocaleString('en-GB', { timeZone: candidate });
				await telegram.sendMessage(chatId, threadId,
					`<b>Timezone set${preset ? ` to ${preset.flag} ${preset.label}` : ''}</b>\n\n<code>${candidate}</code>\n\nYour local time is now <b>${nowLocal}</b>.`,
					env);
				return true;
			}

			// No arg → show picker
			const current = await persona.getUserTimezone(env, userId);
			const currentPreset = findPresetByTz(current);
			const header = currentPreset
				? `<b>Your timezone: ${currentPreset.flag} ${currentPreset.label}</b>\n<code>${current}</code>\n\nPick a new one:`
				: `<b>Your timezone: ${current}</b>\n\nPick from the common list below, or type <code>/timezone Region/City</code> for anything else.`;

			// Two buttons per row for readability
			const rows: Array<Array<{ text: string; callback_data: string }>> = [];
			for (let i = 0; i < TIMEZONE_PRESETS.length; i += 2) {
				const row = [];
				for (let j = i; j < Math.min(i + 2, TIMEZONE_PRESETS.length); j++) {
					const p = TIMEZONE_PRESETS[j]!;
					row.push({
						text: `${p.flag} ${p.label}${current === p.tz ? ' ✓' : ''}`,
						callback_data: `tz_set_${p.tz}`,
					});
				}
				rows.push(row);
			}
			await telegram.sendMessage(chatId, threadId, header, env, {
				markup: { inline_keyboard: rows },
			});
			return true;
		}

		default:
			return false; // Unknown command, pass to message handler
	}
}

// ============================================================
// Command helpers
// ============================================================

/**
 * Guess which preset the user's current persona_config matches.
 * Returns the preset if all five knobs match exactly, else undefined.
 * We ignore communication_notes, topics_of_interest, evolved_traits —
 * those drift through observation and don't define the preset.
 */
function inferCurrentPreset(config: PersonaConfigRow): PersonaPreset | undefined {
	return PERSONA_PRESETS.find(p =>
		p.tone === config.tone &&
		p.formality === config.formality &&
		p.humour_level === config.humour_level &&
		p.emoji_style === config.emoji_style &&
		p.therapeutic_approach === config.therapeutic_approach
	);
}

/**
 * Format the full list of memories grouped by category.
 * Telegram message limit is ~4000 chars — if we exceed, truncate
 * and note the total count.
 */
function formatMemoriesForDisplay(rows: MemoryRow[]): string {
	const byCategory = new Map<string, MemoryRow[]>();
	for (const m of rows) {
		if (!byCategory.has(m.category)) byCategory.set(m.category, []);
		byCategory.get(m.category)!.push(m);
	}

	// Sort categories by count, desc
	const sorted = Array.from(byCategory.entries())
		.sort((a, b) => b[1].length - a[1].length);

	const header = `<b>What I remember about you</b>\n\n<i>${rows.length} memories across ${sorted.length} categories.</i>\n\n`;
	let body = '';
	let truncated = false;

	for (const [category, memories] of sorted) {
		const block = `<b>${category}</b> (${memories.length})\n` +
			memories.slice(0, 10).map(m => `• ${m.fact}`).join('\n') +
			(memories.length > 10 ? `\n<i>... and ${memories.length - 10} more</i>` : '') +
			'\n\n';

		if ((header + body + block).length > 3800) {
			truncated = true;
			break;
		}
		body += block;
	}

	if (truncated) {
		body += `<i>Output truncated — use /forget to clear space or ask me to list a specific category.</i>`;
	}

	return (header + body).trim();
}
