// ============================================================
// Reminder & Schedule Tools
//
// userId for ownership, chatId for delivery. Phase 2 (2026-06-02)
// routes set_reminder through services/reminders.ts (dedup +
// metadata) and update_timezone through services/user.ts.
//
// 2026-06-04 — Reminder context port from Xaridotis (Option A
// minus TTS). Adds:
//   - SMART TIMING heuristic in set_reminder description
//   - second-person / imperative perspective rules on task_message
//   - 24-hour format requirement on both message and context
//   - original_user_request parameter capturing the user's words
//   - firstName lookup via user.getProfile, stored in metadata
//   - persona='eukara' literal stored in metadata (future-proof)
//   - list_reminders returns metadata.reason as a `context` field
//   - update_reminder uses Xaridotis param shape (new_text,
//     new_due_at_timestamp, new_recurrence_type, new_context,
//     cancel:boolean). cancel maps to softCancel internally
//     (Decision 1b: status='cancelled' preserves audit trail)
//
// See decisions/2026-06-04-reminder-context-port.md for the full
// rationale and the locked decisions behind this shape.
// ============================================================

import { defineTool, ok, empty, err } from './factory';
import * as reminders from '../services/reminders';
import type { ReminderMetadata } from '../services/reminders';
import * as user from '../services/user';

export const setReminder = defineTool(
	'set_reminder',
	"Schedule a reminder for the user. Calculate 'due_at_timestamp' as a Unix timestamp in UTC. The system prompt provides the current Unix time as an anchor. All times must be in UTC. SMART TIMING: If the user explicitly states a time, use it. If the user says 'remind me later' or gives a casual task without specifying a time (e.g., 'remind me to check the oven', 'remind me about this'), use your intelligence to assign a reasonable short delay (+5, +15, +30, or +60 minutes) based on the task's urgency. Do not pester for an exact time unless the task is clearly a major future event (flight, meeting, appointment). Set it and confirm the time you chose.",
	{
		task_message: {
			type: 'string',
			description: "The reminder text delivered BACK to the user as a notification. Any times in the text MUST use 24-hour format (e.g. '20:00', NOT '8 PM'; '09:30', NOT '9:30 AM'). PERSPECTIVE: this text is READ BY the user, so use SECOND PERSON or imperative — NEVER first person, NEVER third person. If the user says 'remind me that I am beautiful', the reminder MUST say 'You are beautiful'. If the user says 'remind me to take my meds', say 'Take your meds'. Bad: 'I am beautiful' (first-person, breaks the affirmation when the user reads it); 'Roman should take his meds' (third-person, sounds clinical). Good: 'You are beautiful'; 'Take your meds'.",
		},
		context: {
			type: 'string',
			description: "The 'why' behind this reminder, phrased as the user would say it to themselves. Use SECOND PERSON ('you', 'your') or neutral verb phrases. NEVER use third person ('Roman', 'he', 'his', 'Roman promised...'). ALL times in 24-hour format (13:00, NOT '1 PM'; 20:30, NOT '8:30 PM'). Good: 'You said you would take it 30 min after the 13:00 check-in', 'Promised to text Mum about the weekend'. Bad: 'Roman promised to take his medication', 'after our 1 PM check-in'. Keep it brief — one sentence maximum.",
		},
		due_at_timestamp: {
			type: 'integer',
			description: 'Unix timestamp (UTC) when the reminder should fire.',
		},
		recurrence_type: {
			type: 'string',
			enum: ['none', 'daily', 'weekly', 'monthly'],
		},
		original_user_request: {
			type: 'string',
			description: "The user's original message that triggered this reminder, captured for context. Pass the user's words verbatim, not your interpretation.",
		},
	},
	['task_message', 'context', 'due_at_timestamp', 'recurrence_type'],
	async (args, env, ctx) => {
		// Fetch firstName from user_profiles once at save time. A name
		// change between scheduling and firing should not retro-edit the
		// stored reminder; the snapshot taken here is the one delivered.
		const profile = await user.getProfile(env, ctx.userId);
		const firstName = profile?.first_name ?? undefined;

		const metadata: ReminderMetadata = {
			origin: 'ai_suggested',
			reason: typeof args.context === 'string'
				? (args.context as string).slice(0, 500)
				: undefined,
			originalRequest: typeof args.original_user_request === 'string'
				? (args.original_user_request as string).slice(0, 1000)
				: undefined,
			firstName,
			persona: 'eukara',
			createdAt: Math.floor(Date.now() / 1000),
		};

		const result = await reminders.createReminder(env, ctx.userId, {
			chatId: ctx.chatId,
			threadId: ctx.threadId,
			text: args.task_message as string,
			dueAt: args.due_at_timestamp as number,
			recurrenceType: args.recurrence_type as string,
			originalMessageId: ctx.messageId ?? null,
			metadata,
		});

		// Dedup guard hit: tell the model so it can respond honestly to
		// the user ("that reminder is already scheduled") rather than
		// confirming a save that didn't happen.
		if (!result.created) {
			return ok({
				status: 'duplicate_skipped',
				existing_reminder_id: result.id,
				note: 'A near-identical reminder is already scheduled for the same time slot. No new reminder was created. Tell the user the reminder is already in place rather than claiming you scheduled a new one.',
			});
		}

		return ok({
			scheduled_at_utc: args.due_at_timestamp,
			reminder_id: result.id,
			display_hint: 'Use this in your confirmation message to show the time in the user\'s timezone: include the text "Scheduled for: [time]" and the system will render it natively.',
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
	"THE ONLY tool for reading reminders / scheduled tasks. ALWAYS call this when the user asks anything about their reminders, scheduled items, pending tasks, what they have planned, what's coming up, or wants to find / show / list / check their reminders. Examples that MUST use this tool: 'show me my reminders', 'what do I have scheduled', 'what's coming up', 'list my pending tasks', 'do I have any reminders for X'. NEVER query the database directly — reminders live in a dedicated table with user-specific filtering and timezone formatting that this tool handles correctly. Returns each reminder's id (needed for update_reminder), text preview, due time (UTC and user-local), recurrence type, status, and a context snippet of the original 'why'. Always call this first when the user wants to change, move, cancel, or otherwise modify an existing reminder — you need the reminder_id from the returned list to call update_reminder. Optional status filter: 'pending' (active, default for normal 'show my reminders' queries), 'cancelled', 'delivered', or 'all'.",
	{
		status: { type: 'string', enum: ['pending', 'cancelled', 'delivered', 'all'] },
	},
	[],
	async (args, env, ctx) => {
		const status = args.status as string | undefined;
		const opts = status && status !== 'all' ? { status } : undefined;
		const rows = await reminders.listReminders(env, ctx.userId, opts);
		if (!rows.length) return empty('No reminders found.');

		const tz = await user.getUserTimezone(env, ctx.userId);
		const items = rows.map(r => {
			// Parse stored metadata for context. Tolerate malformed JSON
			// rather than throwing — old rows or partial writes shouldn't
			// break the list view. Fall back from `reason` (new) to
			// `source_context` (pre-2026-06-04 rows) for back-compat.
			let context = '';
			try {
				const meta = JSON.parse(r.metadata || '{}') as ReminderMetadata;
				context = (meta.reason || meta.source_context || '').slice(0, 120);
			} catch { /* malformed metadata; leave context blank */ }

			return {
				id: r.id,
				text: r.text,
				status: r.status,
				recurrence: r.recurrence_type,
				due_at_utc: r.due_at,
				due_at_local: new Date(Number(r.due_at) * 1000).toLocaleString('en-GB', {
					timeZone: tz,
					weekday: 'short',
					day: '2-digit',
					month: 'short',
					hour: '2-digit',
					minute: '2-digit',
					hour12: false,
				}),
				context,
			};
		});
		return ok({
			items,
			count: items.length,
			timezone: tz,
			note: 'Use the id from this list when calling update_reminder. Match the user\'s request to the right reminder using both text and context as well as due_at_local.',
		});
	}
);

export const updateReminder = defineTool(
	'update_reminder',
	"Modify or cancel an existing reminder by id. Call list_reminders first to find the reminder_id. All fields except reminder_id are optional — pass only what you want to change. To cancel a reminder, set cancel=true (this soft-cancels it; the row is retained for audit, but it stops firing). Times must be in 24-hour UTC Unix timestamp format. Examples: rewrite text → {reminder_id, new_text}; move time → {reminder_id, new_due_at_timestamp}; change frequency → {reminder_id, new_recurrence_type}; update why → {reminder_id, new_context}; cancel → {reminder_id, cancel: true}.",
	{
		reminder_id: {
			type: 'integer',
			description: 'The numeric id of the reminder to update. Get this from list_reminders. NEVER guess or invent an id.',
		},
		new_text: {
			type: 'string',
			description: "Replacement reminder text. Same rules as set_reminder.task_message — 24-hour times AND second-person / imperative perspective ('You are beautiful', 'Take your meds', NOT 'I am beautiful' and NOT 'Roman should take his meds'). Omit to leave unchanged.",
		},
		new_due_at_timestamp: {
			type: 'integer',
			description: 'New due time as Unix timestamp (UTC). For recurring reminders this becomes the next fire time; the recurrence rule continues from there. Omit to leave unchanged.',
		},
		new_recurrence_type: {
			type: 'string',
			enum: ['none', 'daily', 'weekly', 'monthly'],
			description: "New recurrence pattern. Use 'none' to convert a recurring reminder to a one-off. Omit to leave unchanged.",
		},
		new_context: {
			type: 'string',
			description: "New 'why' context for the reminder. Same second-person rules as set_reminder.context. Omit to leave unchanged.",
		},
		cancel: {
			type: 'boolean',
			description: "Set to true to soft-cancel the reminder. The reminder stops firing but the row is preserved with status='cancelled' for audit. When true, all other 'new_*' fields are ignored.",
		},
	},
	['reminder_id'],
	async (args, env, ctx) => {
		const id = args.reminder_id as number;
		const existing = await reminders.getReminder(env, ctx.userId, id);
		if (!existing) {
			return err(`No reminder found with id ${id} for this user. Call list_reminders to see what's actually scheduled, then retry with a valid reminder_id.`);
		}

		// Cancel path — short-circuit (Decision 1b: soft-cancel keeps
		// the row with status='cancelled' for audit; we never hard-
		// delete from this tool). All other fields ignored.
		if (args.cancel === true) {
			await reminders.softCancel(env, ctx.userId, id);
			return ok({
				status: 'cancelled',
				reminder_id: id,
				cancelled_text_preview: (existing.text || '').slice(0, 100),
				note: "Reminder cancelled (soft). It will not fire. Tell the user it's cancelled.",
			});
		}

		// Build update set from optional fields.
		const updates: {
			text?: string;
			due_at?: number;
			recurrence_type?: string;
			metadata?: ReminderMetadata;
		} = {};
		if (typeof args.new_text === 'string') updates.text = args.new_text;
		if (typeof args.new_due_at_timestamp === 'number') updates.due_at = args.new_due_at_timestamp;
		if (typeof args.new_recurrence_type === 'string') updates.recurrence_type = args.new_recurrence_type;

		// new_context merges into existing metadata so we don't lose
		// firstName / persona / originalRequest / createdAt.
		if (typeof args.new_context === 'string') {
			let existingMeta: ReminderMetadata = {};
			try { existingMeta = JSON.parse(existing.metadata || '{}') as ReminderMetadata; }
			catch { /* malformed; start fresh */ }
			updates.metadata = {
				...existingMeta,
				reason: (args.new_context as string).slice(0, 500),
			};
		}

		if (!Object.keys(updates).length) {
			return err('Nothing to update. Provide new_text, new_due_at_timestamp, new_recurrence_type, new_context, or cancel.');
		}

		await reminders.updateReminder(env, ctx.userId, id, updates);

		// Return the new state so the model can confirm to the user.
		const tz = await user.getUserTimezone(env, ctx.userId);
		const finalRow = await reminders.getReminder(env, ctx.userId, id);
		const dueLocal = finalRow?.due_at
			? new Date(finalRow.due_at * 1000).toLocaleString('en-GB', {
				timeZone: tz,
				weekday: 'short',
				day: '2-digit',
				month: 'short',
				hour: '2-digit',
				minute: '2-digit',
				hour12: false,
			})
			: null;

		return ok({
			status: 'updated',
			reminder_id: id,
			new_state: {
				text: finalRow?.text ?? null,
				due_at_utc: finalRow?.due_at ?? null,
				due_at_local: dueLocal,
				recurrence_type: finalRow?.recurrence_type ?? 'none',
			},
			note: 'Reminder updated. Confirm the change to the user using the new_state details. Use due_at_local in your reply, not the UTC timestamp.',
		});
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
