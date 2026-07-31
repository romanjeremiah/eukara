// ============================================================
// Command Handler
//
// Processes /commands. Returns true if the message was a
// command (handled), false if it should be passed to the
// regular message handler.
// ============================================================

import type { TelegramMessage, TelegramInlineKeyboardButton } from '../types/telegram';
import type { MemoryRow } from '../types/db';
import * as telegram from '../lib/telegram';
import * as memory from '../services/memory';
import * as governedMemory from '../services/governed-memory';
import * as user from '../services/user';
import { TIMEZONE_PRESETS, findPresetByTz, isValidTimezone } from '../config/timezone-presets';
import { clearHistory } from '../lib/history';
import { escapeHtml, formatTime } from '../lib/formatting';
import { log } from '../lib/logger';
import { startMoodWizard } from './mood-wizard';

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
			await startMoodWizard(chatId, threadId, fromId, env);
			return true;
		}

		case '/architect': {
			if (!env.OWNER_ID || String(msg.from?.id) !== String(env.OWNER_ID)) {
				await telegram.sendMessage(chatId, threadId, 'This command is owner-only.', env);
				return true;
			}
			const userId = msg.from?.id;
			if (!userId) return true;
			// Concurrency guard with kill switch. Keyed by userId for
			// per-user isolation (matches the workflow's D1 isolation).
			const lock = await env.CHAT_KV.get(`architect_lock_${userId}`);
			if (lock) {
				const age = Math.round((Date.now() - parseInt(lock)) / 1000);
				await telegram.sendMessage(chatId, threadId,
					`⚙️ <b>Architecture review already running</b> (${age}s ago).`,
					env, { markup: { inline_keyboard: [[
						{ text: '🔄 Kill & Restart', callback_data: 'architect_kill', style: 'danger' },
						{ text: '⏳ Wait', callback_data: 'noop' },
					]] } });
				return true;
			}
			await env.CHAT_KV.put(`architect_lock_${userId}`, String(Date.now()), { expirationTtl: 120 });

			const statusRes = await telegram.sendMessage(chatId, threadId,
				'⚙️ <b>Architecture Review</b>\n\n<i>Starting research workflow...</i>', env);
			const statusMsgId = statusRes.result?.message_id;

			try {
				await env.ARCHITECT_WORKFLOW.create({
					id: `architect-${Date.now()}`,
					params: { chatId, userId, statusMsgId },
				});
			} catch (e) {
				await env.CHAT_KV.delete(`architect_lock_${userId}`);
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
			await user.ensureUser(env, userId, msg.from?.first_name, msg.from?.username, msg.from?.language_code);
			await env.CHAT_KV.delete(`active_persona_${userId}`);
			await telegram.sendMessage(
				chatId,
				threadId,
				'<b>Eukara now adapts automatically</b>\n\nThere is one consistent Eukara identity. The conversational register changes from turn to turn based on your current intent, while your delivery preferences remain in effect. Luna, Terra and Sol are model routes, not personas.',
				env,
			);
			return true;
		}

		case '/memories': {
			const userId = msg.from?.id;
			if (!userId) return true;
			if (env.GOVERNED_MEMORY_CAPTURE_ENABLED === 'true') {
				const [reviewable, confirmed] = await Promise.all([
					governedMemory.listAssertions(env, userId, ['candidate', 'legacy_unverified'], 8),
					governedMemory.listAssertions(env, userId, ['confirmed'], 8),
				]);
				if (reviewable.length || confirmed.length) {
					const lines = [
						'<b>Memory review</b>',
						'',
						`${confirmed.length} recent confirmed · ${reviewable.length} awaiting review`,
					];
					const buttons: TelegramInlineKeyboardButton[][] = [];
					if (reviewable.length) {
						lines.push('', '<b>Awaiting review</b>');
						for (const [index, assertion] of reviewable.entries()) {
							lines.push(`${index + 1}. [${escapeHtml(assertion.category)}] ${escapeHtml(assertion.statement)}`);
							buttons.push([
								{ text: `✅ ${index + 1}`, callback_data: `memory_confirm_${assertion.id}` },
								{ text: `❌ ${index + 1}`, callback_data: `memory_reject_${assertion.id}` },
								{ text: `✏️ ${index + 1}`, callback_data: `memory_correct_${assertion.id}` },
							]);
						}
					}
					if (confirmed.length) {
						lines.push('', '<b>Recently confirmed</b>');
						for (const [index, assertion] of confirmed.entries()) {
							lines.push(`${index + 1}. [${escapeHtml(assertion.category)}] ${escapeHtml(assertion.statement)}`);
							buttons.push([{
								text: `🗑️ Forget confirmed ${index + 1}`,
								callback_data: `memory_forget_${assertion.id}`,
							}]);
						}
					}
					await telegram.sendMessage(chatId, threadId, lines.join('\n'), env, {
						markup: buttons.length ? { inline_keyboard: buttons } : undefined,
					});
					return true;
				}
			}

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
			const governedRows = env.GOVERNED_MEMORY_CAPTURE_ENABLED === 'true'
				? await governedMemory.listAssertions(
					env,
					userId,
					['candidate', 'confirmed', 'legacy_unverified'],
					500,
				)
				: [];
			const legacyRows = governedRows.length
				? []
				: await memory.getMemories(env, userId, 500);
			const total = governedRows.length || legacyRows.length;
			if (!total) {
				await telegram.sendMessage(chatId, threadId,
					"Nothing to forget — I haven't saved anything about you yet.",
					env);
				return true;
			}
			// Group by category so the buttons can target whole groups.
			const counts = new Map<string, number>();
			for (const row of [...governedRows, ...legacyRows]) {
				counts.set(row.category, (counts.get(row.category) ?? 0) + 1);
			}

			const buttons: TelegramInlineKeyboardButton[][] = [];
			// One button per category, two per row for readability.
			const entries = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
			for (let i = 0; i < entries.length; i += 2) {
				const row: TelegramInlineKeyboardButton[] = [];
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
			buttons.push([{ text: '💣 Forget EVERYTHING', callback_data: 'forget_all_confirm', style: 'danger' }]);
			buttons.push([{ text: '✖️ Cancel', callback_data: 'forget_cancel' }]);

			await telegram.sendMessage(chatId, threadId,
				`<b>What should I forget?</b>\n\nI currently have <b>${total}</b> memories across ${entries.length} categories. Tap a category to wipe just that group, or use the red button to wipe everything.\n\n<i>Deletions are permanent.</i>`,
				env, { markup: { inline_keyboard: buttons } });
			return true;
		}

		case '/timezone': {
			const userId = msg.from?.id;
			if (!userId) return true;
			await user.ensureUser(env, userId, msg.from?.first_name, msg.from?.username, msg.from?.language_code);

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

				await user.setUserTimezone(env, userId, candidate);
				const preset = findPresetByTz(candidate);
				const nowLocal = new Date().toLocaleString('en-GB', { timeZone: candidate });
				await telegram.sendMessage(chatId, threadId,
					`<b>Timezone set${preset ? ` to ${preset.flag} ${preset.label}` : ''}</b>\n\n<code>${candidate}</code>\n\nYour local time is now <b>${nowLocal}</b>.`,
					env);
				return true;
			}

			// No arg → show picker
			const current = await user.getUserTimezone(env, userId);
			const currentPreset = findPresetByTz(current);
			const header = currentPreset
				? `<b>Your timezone: ${currentPreset.flag} ${currentPreset.label}</b>\n<code>${current}</code>\n\nPick a new one:`
				: `<b>Your timezone: ${current}</b>\n\nPick from the common list below, or type <code>/timezone Region/City</code> for anything else.`;

			// Two buttons per row for readability
			const rows: TelegramInlineKeyboardButton[][] = [];
			for (let i = 0; i < TIMEZONE_PRESETS.length; i += 2) {
				const row: TelegramInlineKeyboardButton[] = [];
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
		const lines = memories.slice(0, 10).map(m => {
			// Show a relative timestamp next to each memory so you can see
			// at a glance what's recent vs. stale. tg-time with format 'r'
			// renders as "2 weeks ago" / "yesterday" in the client's locale.
			// created_at is a SQLite datetime string ("YYYY-MM-DD HH:MM:SS")
			// which Date() can parse; we assume UTC because SQLite's
			// CURRENT_TIMESTAMP is UTC.
			const parsed = Date.parse(m.created_at + 'Z');
			const relTime = !isNaN(parsed)
				? ` <i>· ${formatTime(Math.floor(parsed / 1000), new Date(parsed).toLocaleDateString('en-GB'), 'r')}</i>`
				: '';
			return `• ${m.fact}${relTime}`;
		});
		const block = `<b>${category}</b> (${memories.length})\n` +
			lines.join('\n') +
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
