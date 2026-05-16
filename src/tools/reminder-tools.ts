// Reminder & Schedule Tools — userId for ownership, chatId for delivery.
//
// Phase 2 (2026-06-02): set_reminder routes through
// services/reminders.ts (dedup + metadata). update_timezone routes
// through services/user.ts so the DB+KV writes stay in one place.

import { defineTool, ok } from './factory';
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
