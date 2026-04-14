// ============================================================
// Cron Handler
//
// Runs every minute. Only performs CHEAP checks (KV reads,
// time comparisons). All LLM-calling tasks go to the Queue.
// ============================================================

import { log } from '../lib/logger';

interface ScheduleConfig {
	hour: number;
	minute: number;
}

export async function handleCron(env: Env): Promise<void> {
	if (!env.OWNER_ID) return;

	const chatId = Number(env.OWNER_ID);
	const tz = await env.CHAT_KV.get(`timezone_${chatId}`) ?? 'Europe/London';
	const now = new Date();
	const londonTime = new Date(now.toLocaleString('en-US', { timeZone: tz }));
	const hour = londonTime.getHours();
	const minute = londonTime.getMinutes();

	// --- Health check-ins: enqueue to Queue ---
	try {
		await enqueueHealthTasks(env, chatId, hour, minute);
	} catch (e) {
		log.error('cron_health_error', { msg: (e as Error).message });
	}

	// --- Memory consolidation: trigger Workflow monthly ---
	try {
		await checkConsolidation(env, chatId, londonTime);
	} catch (e) {
		log.error('cron_consolidation_error', { msg: (e as Error).message });
	}

	// --- Spontaneous outreach: cheap check, enqueue if passes ---
	try {
		if (hour >= 10 && hour <= 19 && Math.random() <= 0.05) {
			const today = londonTime.toISOString().split('T')[0]!;
			const outreachKey = `spontaneous_${today}`;
			if (!await env.CHAT_KV.get(outreachKey)) {
				await env.TASK_QUEUE.send({ type: 'spontaneous_outreach', chatId });
				await env.CHAT_KV.put(outreachKey, '1', { expirationTtl: 86400 });
			}
		}
	} catch (e) {
		log.error('cron_outreach_error', { msg: (e as Error).message });
	}

	// --- Reminders: deliver due reminders ---
	try {
		await deliverReminders(env, chatId);
	} catch (e) {
		log.error('cron_reminders_error', { msg: (e as Error).message });
	}
}

// --- Health check-in scheduling ---

async function enqueueHealthTasks(env: Env, chatId: number, hour: number, minute: number): Promise<void> {
	if (minute !== 0) return; // Only check on the hour

	const scheduleKey = (name: string) => `schedule_${name}`;

	// Morning check-in
	const morningSchedule = await getSchedule(env, scheduleKey('morning_checkin'), { hour: 8, minute: 0 });
	if (hour === morningSchedule.hour) {
		const todayKey = `checkin_morning_${new Date().toISOString().split('T')[0]}`;
		if (!await env.CHAT_KV.get(todayKey)) {
			await env.TASK_QUEUE.send({ type: 'health_checkin', period: 'morning', chatId });
			await env.CHAT_KV.put(todayKey, '1', { expirationTtl: 86400 });
		}
	}

	// Evening mood poll
	const eveningSchedule = await getSchedule(env, scheduleKey('evening_checkin'), { hour: 21, minute: 0 });
	if (hour === eveningSchedule.hour) {
		const todayKey = `checkin_evening_${new Date().toISOString().split('T')[0]}`;
		if (!await env.CHAT_KV.get(todayKey)) {
			await env.TASK_QUEUE.send({ type: 'mood_poll', chatId });
			await env.CHAT_KV.put(todayKey, '1', { expirationTtl: 86400 });
		}
	}
}

async function getSchedule(env: Env, key: string, defaults: ScheduleConfig): Promise<ScheduleConfig> {
	const stored = await env.CHAT_KV.get(key, { type: 'json' }) as ScheduleConfig | null;
	return stored ?? defaults;
}

// --- Monthly memory consolidation ---

async function checkConsolidation(env: Env, chatId: number, now: Date): Promise<void> {
	if (now.getDate() !== 1 || now.getHours() !== 3) return; // 1st of month, 3 AM

	const month = now.toISOString().split('-').slice(0, 2).join('-');
	const runKey = `consolidation_${month}`;
	if (await env.CHAT_KV.get(runKey)) return;

	await env.CHAT_KV.put(runKey, '1', { expirationTtl: 86400 * 5 });

	if (env.MEMORY_WORKFLOW) {
		await env.MEMORY_WORKFLOW.create({
			id: `consolidation-${month}`,
			params: { chatId },
		});
		log.info('workflow_triggered', { workflow: 'memory-consolidation', month });
	}
}

// --- Reminder delivery ---

async function deliverReminders(env: Env, chatId: number): Promise<void> {
	const nowUnix = Math.floor(Date.now() / 1000);
	const { results } = await env.DB.prepare(
		"SELECT id, text, thread_id, recurrence_type FROM reminders WHERE recipient_chat_id = ? AND status = 'pending' AND due_at <= ? LIMIT 5"
	).bind(chatId, nowUnix).all();

	if (!results?.length) return;

	const token = env.TELEGRAM_TOKEN;
	for (const r of results) {
		const reminder = r as { id: number; text: string; thread_id: string; recurrence_type: string };

		// Send reminder
		await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				chat_id: chatId,
				text: `⏰ <b>Reminder:</b> ${reminder.text}`,
				parse_mode: 'HTML',
			}),
		}).catch(() => {});

		// Mark as delivered
		await env.DB.prepare(
			"UPDATE reminders SET status = 'delivered', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
		).bind(reminder.id).run();

		log.info('reminder_delivered', { id: reminder.id });
	}
}
