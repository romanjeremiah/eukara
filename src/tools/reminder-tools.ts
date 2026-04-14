// Reminder & Schedule Tools

import { defineTool, ok } from './factory';

export const setReminder = defineTool(
	'set_reminder',
	"Schedule a reminder. Calculate due_at_timestamp as Unix timestamp UTC. SMART TIMING: If user says 'remind me later' without a time, assign a reasonable delay (+5, +15, +30, +60 min) based on urgency.",
	{
		task_message: { type: 'string', description: 'The reminder text' },
		context: { type: 'string', description: 'The emotional context behind this reminder' },
		due_at_timestamp: { type: 'integer', description: 'Unix timestamp (UTC) when reminder fires' },
		recurrence_type: { type: 'string', enum: ['none', 'daily', 'weekly', 'monthly'] },
	},
	['task_message', 'context', 'due_at_timestamp', 'recurrence_type'],
	async (args, env, ctx) => {
		await env.DB.prepare(
			'INSERT INTO reminders (creator_chat_id, recipient_chat_id, text, due_at, recurrence_type, thread_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
		).bind(
			ctx.chatId, ctx.chatId, args.task_message as string,
			args.due_at_timestamp as number, args.recurrence_type as string,
			ctx.threadId, 'pending'
		).run();

		return ok({
			scheduled_at_utc: args.due_at_timestamp,
			display_hint: 'Confirm the time in the user\'s timezone.',
		});
	}
);

export const updateTimezone = defineTool(
	'update_timezone',
	'Update the user\'s timezone. Use IANA format (e.g. Europe/London, America/New_York).',
	{
		timezone: { type: 'string', description: 'IANA timezone string' },
	},
	['timezone'],
	async (args, env, ctx) => {
		await env.CHAT_KV.put(`timezone_${ctx.chatId}`, args.timezone as string);
		return ok({ timezone: args.timezone });
	}
);
