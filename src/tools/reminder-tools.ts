// Reminder & Schedule Tools — userId for ownership, chatId for delivery

import { defineTool, ok } from './factory';

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
		await env.DB.prepare(
			'INSERT INTO reminders (user_id, chat_id, text, due_at, recurrence_type, thread_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
		).bind(
			ctx.userId, ctx.chatId, args.task_message as string,
			args.due_at_timestamp as number, args.recurrence_type as string,
			ctx.threadId, 'pending'
		).run();
		return ok({ scheduled_at_utc: args.due_at_timestamp });
	}
);

export const updateTimezone = defineTool(
	'update_timezone',
	'Update the user\'s timezone. Use IANA format.',
	{ timezone: { type: 'string' } },
	['timezone'],
	async (args, env, ctx) => {
		// Store timezone in user profile AND KV for fast access
		await env.CHAT_KV.put(`timezone_${ctx.userId}`, args.timezone as string);
		await env.DB.prepare(
			'UPDATE user_profiles SET timezone = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
		).bind(args.timezone as string, ctx.userId).run();
		return ok({ timezone: args.timezone });
	}
);
