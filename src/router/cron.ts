// ============================================================
// Cron Handler
//
// All KV keys scoped by userId. Cron iterates over known users
// (currently OWNER_ID, extensible to all users).
// ============================================================

import { log } from '../lib/logger';
import { formatTime } from '../lib/formatting';
import * as telegram from '../lib/telegram';
import * as persona from '../services/persona';

interface ScheduleConfig { hour: number; minute: number }

export async function handleCron(env: Env): Promise<void> {
	if (!env.OWNER_ID) return;

	// For multi-user: iterate over all active users
	// For now: single owner
	const userIds = [Number(env.OWNER_ID)];

	for (const userId of userIds) {
		// Read timezone from user_profiles.timezone (DB source of truth).
		// persona.getUserTimezone falls back to 'Europe/London' on error
		// or missing profile row, so cron never crashes on a fresh user.
		// Previously this read from CHAT_KV.get(`timezone_${userId}`),
		// which is the KV mirror — reading from the source is correct
		// now that setUserTimezone writes to both.
		const tz = await persona.getUserTimezone(env, userId);
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

		// Spontaneous outreach
		try {
			if (hour >= 10 && hour <= 19 && Math.random() <= 0.05) {
				const key = `spontaneous_${userId}_${today}`;
				if (!await env.CHAT_KV.get(key)) {
					await env.TASK_QUEUE.send({ type: 'spontaneous_outreach', userId, chatId: userId });
					await env.CHAT_KV.put(key, '1', { expirationTtl: 86400 });
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

	const eveningHour = (await getSchedule(env, `schedule_${userId}_evening`, { hour: 21, minute: 0 })).hour;
	if (hour === eveningHour) {
		const key = `checkin_${userId}_evening_${today}`;
		if (!await env.CHAT_KV.get(key)) {
			await env.TASK_QUEUE.send({ type: 'mood_poll', userId, chatId: userId });
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
	// Include due_at so we can show users the originally-scheduled time
	// using a <tg-time> entity, which Telegram renders in the user's
	// local timezone automatically (Bot API 9.5+).
	const { results } = await env.DB.prepare(
		"SELECT id, text, chat_id, thread_id, due_at FROM reminders WHERE user_id = ? AND status = 'pending' AND due_at <= ? LIMIT 5"
	).bind(userId, nowUnix).all();

	if (!results?.length) return;
	for (const r of results) {
		const reminder = r as { id: number; text: string; chat_id: number; thread_id: string; due_at: number };

		// Format the original scheduled time with the tg-time entity.
		// Falling back to showing nothing if due_at is somehow missing —
		// the reminder text itself is the primary content.
		const dueLabel = reminder.due_at
			? formatTime(reminder.due_at, new Date(reminder.due_at * 1000).toLocaleString('en-GB'), 't')
			: '';
		const message = dueLabel
			? `⏰ <b>Reminder</b> · ${dueLabel}\n${reminder.text}`
			: `⏰ <b>Reminder:</b> ${reminder.text}`;

		// Use the proper send wrapper so we get retries, error logging,
		// and the plain-text fallback if HTML parsing fails. The old
		// raw-fetch path here was bypassing all of that.
		try {
			const res = await telegram.sendMessage(
				reminder.chat_id, reminder.thread_id || 'default', message, env
			);
			if (!res.ok) {
				log.warn('reminder_send_failed', { id: reminder.id, userId, description: res.description });
				continue; // Don't mark as delivered if the send failed
			}
		} catch (e) {
			log.warn('reminder_send_threw', { id: reminder.id, userId, msg: (e as Error).message });
			continue;
		}

		await env.DB.prepare("UPDATE reminders SET status = 'delivered', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?")
			.bind(reminder.id, userId).run();
		log.info('reminder_delivered', { id: reminder.id, userId });
	}
}
