// ============================================================
// Cron Handler
//
// All KV keys scoped by userId. Cron iterates over known users
// (currently OWNER_ID, extensible to all users).
// ============================================================

import { log } from '../lib/logger';
import { formatTime, escapeHtml } from '../lib/formatting';
import * as telegram from '../lib/telegram';
import * as user from '../services/user';
import * as persona from '../services/persona';
import * as reminders from '../services/reminders';
import type { ReminderMetadata } from '../services/reminders';
import * as curiosity from '../services/curiosity';

// Per-user spontaneous-outreach behaviour, dialled by
// persona_config.proactivity_level (2026-06-04). Each entry tunes
//   rollRate:       per-minute Math.random() chance of attempting
//   hourStart/End:  socially appropriate window (London local)
//   maxUnanswered:  pause after this many unanswered proactive messages
// in a row. The unanswered counter lives in KV under
// `proactive_unanswered_${userId}`, incremented after each send and
// cleared whenever the user sends a message (in bot/message.ts).
const PROACTIVITY_PROFILES = {
	low:    { rollRate: 0.02, hourStart: 11, hourEnd: 17, maxUnanswered: 1 },
	normal: { rollRate: 0.05, hourStart: 10, hourEnd: 19, maxUnanswered: 2 },
	high:   { rollRate: 0.08, hourStart: 9,  hourEnd: 21, maxUnanswered: 3 },
} as const;

type ProactivityLevel = keyof typeof PROACTIVITY_PROFILES;

interface ScheduleConfig { hour: number; minute: number }

export async function handleCron(env: Env): Promise<void> {
	if (!env.OWNER_ID) return;

	// For multi-user: iterate over all active users
	// For now: single owner
	const userIds = [Number(env.OWNER_ID)];

	for (const userId of userIds) {
		// Read timezone from user_profiles.timezone (DB source of truth).
		// user.getUserTimezone falls back to 'Europe/London' on error
		// or missing profile row, so cron never crashes on a fresh user.
		const tz = await user.getUserTimezone(env, userId);
		const now = new Date();
		const localTime = new Date(now.toLocaleString('en-US', { timeZone: tz }));
		const hour = localTime.getHours();
		const minute = localTime.getMinutes();
		const today = localTime.toISOString().split('T')[0]!;

		// Health check-ins
		try {
			await enqueueHealthTasks(env, userId, hour, minute, today);
		} catch (e) { log.error('cron_health_error', { userId, msg: (e as Error).message }); }

		// Memory consolidation
		try {
			await checkConsolidation(env, userId, localTime);
		} catch (e) { log.error('cron_consolidation_error', { userId, msg: (e as Error).message }); }

		// Autonomous interest-driven research (twice weekly, 04:00
		// local). Self-gating producer: writes `discovery` memories
		// that the spontaneous-outreach consumer later surfaces.
		try {
			await curiosity.maybeRunResearch(env, userId, localTime);
		} catch (e) { log.error('cron_research_error', { userId, msg: (e as Error).message }); }

		// Spontaneous outreach: interest-driven casual share. Cadence and
		// window are dialled per-user via persona_config.proactivity_level
		// (low / normal / high, see PROACTIVITY_PROFILES above). Guards in
		// order: sociable hour window, probabilistic roll, daily cap,
		// quiet-hours respect, 3h-since-last-message cooloff, and the
		// escalation guard that pauses outreach after maxUnanswered
		// proactive messages in a row without a user reply.
		try {
			const personaConfig = await persona.getPersonaConfig(env, userId);
			const level: ProactivityLevel = (
				(['low', 'normal', 'high'] as const).includes(personaConfig.proactivity_level as ProactivityLevel)
					? personaConfig.proactivity_level as ProactivityLevel
					: 'normal'
			);
			const cfg = PROACTIVITY_PROFILES[level];

			if (hour >= cfg.hourStart && hour <= cfg.hourEnd && Math.random() <= cfg.rollRate) {
				const key = `spontaneous_${userId}_${today}`;
				if (!await env.CHAT_KV.get(key)) {
					const quiet = await user.isQuietTime(env, userId);
					const lastSeenRaw = await env.CHAT_KV.get(`last_seen_${userId}`);
					const hoursSinceChat = lastSeenRaw
						? (Date.now() - Number(lastSeenRaw)) / 3_600_000
						: Infinity;
					const unanswered = Number(
						await env.CHAT_KV.get(`proactive_unanswered_${userId}`)
					) || 0;

					if (!quiet && hoursSinceChat >= 3 && unanswered < cfg.maxUnanswered) {
						await env.TASK_QUEUE.send({ type: 'spontaneous_outreach', userId, chatId: userId });
						await env.CHAT_KV.put(key, '1', { expirationTtl: 86400 });
					} else if (unanswered >= cfg.maxUnanswered) {
						log.info('outreach_skipped_escalation', { userId, unanswered, max: cfg.maxUnanswered });
					}
				}
			}
		} catch (e) { log.error('cron_outreach_error', { userId, msg: (e as Error).message }); }

		// Reminders
		try {
			await deliverReminders(env, userId);
		} catch (e) { log.error('cron_reminders_error', { userId, msg: (e as Error).message }); }

		// Weekly report: Sunday evening (day 0 in JS Date, 19:00 local)
		// Idempotency via KV key scoped to ISO week so a late cron tick
		// on the boundary doesn't double-fire.
		try {
			await enqueueWeeklyReport(env, userId, localTime);
		} catch (e) { log.error('cron_weekly_report_error', { userId, msg: (e as Error).message }); }
	}
}

async function enqueueHealthTasks(
	env: Env, userId: number, hour: number, minute: number, today: string
): Promise<void> {
	if (minute !== 0) return;

	const morningHour = (await getSchedule(env, `schedule_${userId}_morning`, { hour: 8, minute: 0 })).hour;
	if (hour === morningHour) {
		const key = `checkin_${userId}_morning_${today}`;
		if (!await env.CHAT_KV.get(key)) {
			await env.TASK_QUEUE.send({ type: 'health_checkin', period: 'morning', userId, chatId: userId });
			await env.CHAT_KV.put(key, '1', { expirationTtl: 86400 });
		}
	}

}

async function getSchedule(env: Env, key: string, defaults: ScheduleConfig): Promise<ScheduleConfig> {
	const stored = await env.CHAT_KV.get(key, { type: 'json' }) as ScheduleConfig | null;
	return stored ?? defaults;
}

async function checkConsolidation(env: Env, userId: number, now: Date): Promise<void> {
	if (now.getDate() !== 1 || now.getHours() !== 3) return;
	const month = now.toISOString().split('-').slice(0, 2).join('-');
	const key = `consolidation_${userId}_${month}`;
	if (await env.CHAT_KV.get(key)) return;
	await env.CHAT_KV.put(key, '1', { expirationTtl: 86400 * 5 });

	if (env.MEMORY_WORKFLOW) {
		await env.MEMORY_WORKFLOW.create({ id: `consolidation-${userId}-${month}`, params: { userId } });
		log.info('workflow_triggered', { workflow: 'memory-consolidation', userId, month });
	}
}

/**
 * Fire the weekly report task on Sunday at 19:00 local time.
 *
 * JS Date.getDay(): 0 = Sunday, 1 = Monday, ...
 *
 * Idempotency: keyed by ISO week (year + week number), so even if
 * cron fires multiple times in the 19:00 hour (shouldn't, but), we
 * only enqueue once. The KV entry expires after 7 days.
 *
 * The report is ONLY sent if there's data worth reporting on — the
 * queue handler (processTask → generateAndSendWeeklyReport) bails
 * silently when check-ins, memories, and episodes are all empty,
 * so users who haven't engaged this week don't get a pointless
 * "you did nothing" message.
 */
async function enqueueWeeklyReport(
	env: Env, userId: number, localTime: Date
): Promise<void> {
	const isSunday = localTime.getDay() === 0;
	const is19hSharp = localTime.getHours() === 19 && localTime.getMinutes() === 0;
	if (!isSunday || !is19hSharp) return;

	const weekKey = isoWeekKey(localTime);
	const key = `weekly_report_${userId}_${weekKey}`;
	if (await env.CHAT_KV.get(key)) return;
	await env.CHAT_KV.put(key, '1', { expirationTtl: 86400 * 7 });

	await env.TASK_QUEUE.send({ type: 'weekly_report', userId, chatId: userId });
	log.info('weekly_report_enqueued', { userId, weekKey });
}

/**
 * ISO week identifier: YYYY-Www (e.g. "2026-W16").
 *
 * Used only as an idempotency key — we don't parse it back. Computed
 * via ISO 8601: Thursday-based week numbering. Good enough for
 * Sunday-sent reports where the ambiguous boundary (Sat/Sun night)
 * doesn't affect us.
 */
function isoWeekKey(date: Date): string {
	// Clone so we don't mutate caller's date
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
	// ISO week: Thursday determines the year. Shift date to nearest Thursday.
	const dayNum = (d.getUTCDay() + 6) % 7; // 0=Mon..6=Sun
	d.setUTCDate(d.getUTCDate() - dayNum + 3);
	const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
	const diffDays = (d.getTime() - firstThursday.getTime()) / 86400000;
	const week = 1 + Math.round((diffDays - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
	return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

async function deliverReminders(env: Env, userId: number): Promise<void> {
	const nowUnix = Math.floor(Date.now() / 1000);

	// Phase 2 fix (2026-06-03): listDuePending is now user-scoped at
	// the SQL level, so each cron tick only sees this user's rows.
	// Prevents one user's reminder backlog from starving another's
	// delivery slot when multi-user lands.
	const due = await reminders.listDuePending(env, userId, nowUnix, 10);
	if (!due.length) return;

	// Inline keyboard: Voice (reads the reminder text aloud via TTS)
	// + Delete (removes the delivered message from chat). Same
	// callback_data shape as bot replies, so the existing handlers in
	// bot/callback.ts handle both cases identically. No new wiring.
	const reminderMarkup = {
		inline_keyboard: [[
			{ text: '🔊 Voice', callback_data: 'action_voice' },
			{ text: '🗑️ Delete', callback_data: 'action_delete_msg' },
		]],
	};

	for (const reminder of due) {
		// Format the original scheduled time with the tg-time entity.
		// Falls back to no label if due_at is missing — the reminder
		// text is the primary content.
		const dueLabel = reminder.due_at
			? formatTime(reminder.due_at, new Date(reminder.due_at * 1000).toLocaleString('en-GB'), 't')
			: '';

		// Extract context reason from metadata for the expandable
		// blockquote. 2026-06-04 reminder context port. Falls back to
		// legacy `source_context` for rows written before the field
		// rename so older reminders deliver without a missing blockquote.
		let contextReason = '';
		try {
			const meta = JSON.parse(reminder.metadata || '{}') as ReminderMetadata;
			contextReason = (meta.reason || meta.source_context || '').trim();
		} catch { /* malformed metadata; deliver without context */ }

		// All user-generated fields go through escapeHtml: the model
		// can write &, <, > in reminder text or context and Telegram's
		// HTML parser would 400 on raw entities.
		const safeText = escapeHtml(reminder.text);
		const safeReason = contextReason ? escapeHtml(contextReason) : '';

		const headerLine = dueLabel
			? `⏰ <b>Reminder</b> · ${dueLabel}\n${safeText}`
			: `⏰ <b>Reminder:</b> ${safeText}`;

		const message = safeReason
			? `${headerLine}\n<blockquote expandable>${safeReason}</blockquote>`
			: headerLine;

		// Use the proper send wrapper so we get retries, error logging,
		// and the plain-text fallback if HTML parsing fails.
		try {
			const res = await telegram.sendMessage(
				reminder.chat_id, reminder.thread_id || 'default', message, env,
				{ markup: reminderMarkup }
			);
			if (!res.ok) {
				log.warn('reminder_send_failed', { id: reminder.id, userId, description: res.description });
				continue;
			}
		} catch (e) {
			log.warn('reminder_send_threw', { id: reminder.id, userId, msg: (e as Error).message });
			continue;
		}

		await reminders.markDelivered(env, userId, reminder.id);
		log.info('reminder_delivered', { id: reminder.id, userId });
	}
}
