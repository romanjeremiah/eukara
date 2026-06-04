// Reminder & Schedule Tools — userId for ownership, chatId for delivery.
//
// Phase 2 (2026-06-02): set_reminder routes through
// services/reminders.ts (dedup + metadata). update_timezone routes
// through services/user.ts so the DB+KV writes stay in one place.

import { defineTool, ok, empty, err } from './factory';
import * as reminders from '../services/reminders';
import * as user from '../services/user';

export const setReminder = defineTool(
	'set_reminder',
	"Schedule a reminder. Calculate due_at_timestamp as Unix timestamp UTC.",
	{
		task_message: { type: 'string' },
		context: { type: 'string' },
		due_at_timestamp: { type: 'integer' },
		recurrence_type: { type: 'string', enum: ['none', 'daily', 'weekly', 'monthly'] },
	},
	['task_message', 'context', 'due_at_timestamp', 'recurrence_type'],
	async (args, env, ctx) => {
		const result = await reminders.createReminder(env, ctx.userId, {
			chatId: ctx.chatId,
			threadId: ctx.threadId,
			text: args.task_message as string,
			dueAt: args.due_at_timestamp as number,
			recurrenceType: args.recurrence_type as string,
			metadata: {
				origin: 'ai_suggested',
				source_context: typeof args.context === 'string'
					? (args.context as string).slice(0, 200)
					: undefined,
			},
		});
		return ok({
			scheduled_at_utc: args.due_at_timestamp,
			reminder_id: result.id,
			deduplicated: !result.created,
		});
	}
);

export const updateTimezone = defineTool(
	'update_timezone',
	'Update the user\'s timezone. Use IANA format.',
	{ timezone: { type: 'string' } },
	['timezone'],
	async (args, env, ctx) => {
		await user.setUserTimezone(env, ctx.userId, args.timezone as string);
		return ok({ timezone: args.timezone });
	}
);

export const setQuietHours = defineTool(
	'set_quiet_hours',
	'Silence proactive outreach until a given time. Use when the user asks for quiet or do-not-disturb (for example "leave me alone", "deep work until 17:00", "stop messaging me today"). Pass end_at_timestamp as a Unix timestamp in seconds (UTC). Does NOT silence medication or clinical check-ins.',
	{
		end_at_timestamp: { type: 'integer' },
		reason: { type: 'string' },
	},
	['end_at_timestamp'],
	async (args, env, ctx) => {
		const endUnix = args.end_at_timestamp as number;
		await user.setQuietHours(env, ctx.userId, endUnix);
		return ok({ quiet_until_utc: endUnix });
	}
);

export const clearQuietHours = defineTool(
	'clear_quiet_hours',
	'Cancel an active quiet-hours window so proactive outreach can resume. Use when the user says they are back, "you can talk again", or "never mind".',
	{},
	[],
	async (_args, env, ctx) => {
		await user.clearQuietHours(env, ctx.userId);
		return ok({ cleared: true });
	}
);

export const listReminders = defineTool(
	'list_reminders',
	'List the user\'s reminders, newest first. Optional status filter: "pending" (active, use this when the user just wants to see what is set), "cancelled", "delivered", or "all". Returns each reminder\'s id (needed for update_reminder), text, due time, status and recurrence.',
	{
		status: { type: 'string', enum: ['pending', 'cancelled', 'delivered', 'all'] },
	},
	[],
	async (args, env, ctx) => {
		const status = args.status as string | undefined;
		const opts = status && status !== 'all' ? { status } : undefined;
		const rows = await reminders.listReminders(env, ctx.userId, opts);
		if (!rows.length) return empty('No reminders found.');
		const items = rows.map(r => ({
			id: r.id,
			text: r.text,
			status: r.status,
			recurrence: r.recurrence_type,
			due_at_utc: r.due_at,
			due_london: new Date(Number(r.due_at) * 1000).toLocaleString('en-GB', {
				timeZone: 'Europe/London',
				day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
			}),
		}));
		return ok({ items, count: items.length });
	}
);

export const updateReminder = defineTool(
	'update_reminder',
	'Reschedule, edit, or cancel a SINGLE reminder by id (get the id from list_reminders first). To cancel one reminder, set status to "cancelled". To reschedule, set due_at_timestamp (Unix seconds, UTC). To change the wording, set task_message.',
	{
		reminder_id: { type: 'integer' },
		due_at_timestamp: { type: 'integer' },
		task_message: { type: 'string' },
		status: { type: 'string', enum: ['pending', 'cancelled'] },
	},
	['reminder_id'],
	async (args, env, ctx) => {
		const id = args.reminder_id as number;
		const existing = await reminders.getReminder(env, ctx.userId, id);
		if (!existing) return err(`No reminder found with id ${id}.`);
		const updates: { due_at?: number; text?: string; status?: string } = {};
		if (typeof args.due_at_timestamp === 'number') updates.due_at = args.due_at_timestamp;
		if (typeof args.task_message === 'string') updates.text = args.task_message;
		if (typeof args.status === 'string') updates.status = args.status;
		if (!Object.keys(updates).length) {
			return err('Nothing to update. Provide due_at_timestamp, task_message, or status.');
		}
		await reminders.updateReminder(env, ctx.userId, id, updates);
		return ok({ reminder_id: id, updated: Object.keys(updates) });
	}
);

export const clearReminders = defineTool(
	'clear_reminders',
	'Cancel ALL of the user\'s pending reminders at once. Use only when the user clearly asks to clear, cancel, or remove all their reminders. This soft-cancels them (they stop firing but are kept in history, not hard-deleted). If the intent is ambiguous, confirm with the user before calling.',
	{},
	[],
	async (_args, env, ctx) => {
		const pending = await reminders.listReminders(env, ctx.userId, { status: 'pending' });
		if (!pending.length) return empty('No active reminders to clear.');
		for (const r of pending) {
			await reminders.softCancel(env, ctx.userId, r.id);
		}
		return ok({ cleared: pending.length });
	}
);
