// ============================================================
// Reminders Service
//
// Single owner for the reminders table. Phase 2 (2026-06-02).
//
// Public surface:
//   createReminder    insert with dedup, returns { id, created }
//   listReminders     read filtered by status
//   getReminder       single read, ownership-checked
//   updateReminder    patch fields, ownership-checked
//   markDelivered     status='delivered'
//   softCancel        status='cancelled' (row kept)
//   listDuePending    cron-side: this user's pending due rows
//   deleteAll         hard delete for /forget
//
// Dedup behaviour: createReminder rejects near-duplicate inserts
// (same normalised text + due_at within +/-60s) and returns the
// existing id with created=false. Protects against the model
// double-calling set_reminder on retry.
// ============================================================

import type { ReminderRow } from '../types/db';
import { queryAll } from '../lib/db';
import { log } from '../lib/logger';

/**
 * Dedup window in seconds. Two pending reminders with the same
 * normalised text whose due_at differ by less than this are
 * considered duplicates.
 *
 * 60s is wide enough to catch model-retries (typically 5-10s
 * apart) and webhook re-deliveries without blocking the rare
 * legitimate case of two near-simultaneous reminders the user
 * actually wants.
 */
const DEDUP_WINDOW_SEC = 60;

/**
 * Optional metadata blob attached to a reminder.
 * Stored as JSON in the metadata column.
 *
 * `origin` is a free string by convention. Established values:
 *   'ai_suggested'   the model decided to set this from chat context
 *   'user_command'   from an explicit /remind or similar slash command
 *   'recurrence'     auto-created by the recurrence engine
 *   'workflow'       set by a background workflow (e.g. mood follow-up)
 * Callers may use other values; readers should treat unknown
 * origins as informational rather than dispatching on them.
 */
export interface ReminderMetadata {
	origin?: string;
	/**
	 * Conversation turn or memory id that triggered this.
	 * @deprecated since 2026-06-04: use `reason` going forward.
	 * Kept on the type for backward compatibility with rows written
	 * before the field rename. Read paths fall back to this when
	 * `reason` is absent.
	 */
	source_context?: string;
	/**
	 * The 'why' behind this reminder, phrased as the user would say
	 * it to themselves. Second-person, brief, one sentence. Ported
	 * from Xaridotis 2026-06-04. Surfaced in cron delivery as an
	 * expandable blockquote and returned by list_reminders so the
	 * model can match user intent to the right reminder by content.
	 */
	reason?: string;
	/**
	 * The user's original message that triggered this reminder.
	 * Captured for audit and to give the model context if the user
	 * later wants to edit. Not surfaced in delivery.
	 */
	originalRequest?: string;
	/**
	 * First name from user_profiles at the time of save. Fetched
	 * once at save rather than at delivery so a name change between
	 * scheduling and firing doesn't retro-edit a reminder. Used in
	 * group-chat delivery prefixes; harmless in 1:1 chats.
	 */
	firstName?: string;
	/**
	 * Which persona created the reminder. Single-persona for now
	 * (always 'eukara') but recorded for future multi-persona where
	 * delivery voice/style might differ by persona.
	 */
	persona?: string;
	/**
	 * Unix seconds when the reminder was created. Redundant with
	 * the row's created_at column but stored alongside the rest of
	 * the model-supplied context for self-contained metadata.
	 */
	createdAt?: number;
	/** Richer recurrence than the recurrence_type column can express. */
	recurrence?: {
		kind?: 'cron' | 'last_of_month' | 'nth_weekday';
		expression?: string;
	};
	/** Times the user has snoozed this. Bumped on snooze action. */
	snooze_count?: number;
}

export interface CreateReminderInput {
	chatId: number;
	threadId: string;
	text: string;
	dueAt: number;
	recurrenceType?: string;
	originalMessageId?: number | null;
	metadata?: ReminderMetadata;
}

export interface CreateReminderResult {
	id: number;
	/** false when an existing pending duplicate matched. */
	created: boolean;
}

/**
 * Insert a reminder, or return the existing id if a near-duplicate
 * pending reminder already exists for this user.
 *
 * Eukara signature pattern: (env, userId, input). Matches
 * services/episode.ts:saveEpisode and the rest of the codebase.
 */
export async function createReminder(
	env: Env,
	userId: number,
	input: CreateReminderInput
): Promise<CreateReminderResult> {
	const normalised = normaliseText(input.text);

	// Dedup: pull pending rows in the window and compare normalised
	// text in JS. Doing the normalisation in SQL is messier than this.
	const lo = input.dueAt - DEDUP_WINDOW_SEC;
	const hi = input.dueAt + DEDUP_WINDOW_SEC;
	const candidates = await queryAll<Pick<ReminderRow, 'id' | 'text'>>(
		env.DB.prepare(
			`SELECT id, text FROM reminders
			 WHERE user_id = ? AND status = 'pending'
			   AND due_at BETWEEN ? AND ?`
		).bind(userId, lo, hi)
	);
	for (const c of candidates) {
		if (normaliseText(c.text) === normalised) {
			log.info('reminder_dedup_hit', { userId, existingId: c.id, dueAt: input.dueAt });
			return { id: c.id, created: false };
		}
	}

	const metadataJson = input.metadata ? JSON.stringify(input.metadata) : null;
	const result = await env.DB.prepare(
		`INSERT INTO reminders
		 (user_id, chat_id, text, due_at, original_message_id,
		  recurrence_type, thread_id, status, metadata)
		 VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`
	).bind(
		userId, input.chatId, input.text, input.dueAt,
		input.originalMessageId ?? null,
		input.recurrenceType ?? 'none',
		input.threadId,
		metadataJson,
	).run();

	const id = Number(result.meta?.last_row_id ?? 0);
	log.info('reminder_created', { userId, id, dueAt: input.dueAt });
	return { id, created: true };
}

/**
 * List reminders for a user, newest first by due_at.
 */
export async function listReminders(
	env: Env, userId: number,
	opts?: { status?: string; limit?: number }
): Promise<ReminderRow[]> {
	const limit = opts?.limit ?? 50;
	if (opts?.status) {
		return queryAll<ReminderRow>(
			env.DB.prepare(
				`SELECT * FROM reminders WHERE user_id = ? AND status = ?
				 ORDER BY due_at DESC LIMIT ?`
			).bind(userId, opts.status, limit)
		);
	}
	return queryAll<ReminderRow>(
		env.DB.prepare(
			`SELECT * FROM reminders WHERE user_id = ?
			 ORDER BY due_at DESC LIMIT ?`
		).bind(userId, limit)
	);
}

/**
 * Fetch a single reminder, ownership-checked.
 * Returns null when the row does not exist OR belongs to another user.
 */
export async function getReminder(
	env: Env, userId: number, id: number
): Promise<ReminderRow | null> {
	return env.DB.prepare(
		'SELECT * FROM reminders WHERE id = ? AND user_id = ?'
	).bind(id, userId).first<ReminderRow>();
}

/**
 * Patch fields on a reminder. Ownership-checked via WHERE user_id.
 * Unknown keys are dropped. Metadata can be passed as an object;
 * it is JSON-stringified before write.
 */
export async function updateReminder(
	env: Env, userId: number, id: number,
	updates: Partial<Omit<ReminderRow, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'metadata'>> & {
		metadata?: ReminderMetadata | string | null;
	}
): Promise<void> {
	const allowed = ['chat_id', 'text', 'due_at', 'original_message_id',
		'recurrence_type', 'thread_id', 'status', 'metadata'];
	const fields: string[] = [];
	const values: unknown[] = [];

	for (const [k, v] of Object.entries(updates)) {
		if (!allowed.includes(k)) continue;
		if (k === 'metadata' && v !== null && typeof v === 'object') {
			fields.push('metadata = ?');
			values.push(JSON.stringify(v));
		} else {
			fields.push(`${k} = ?`);
			values.push(v);
		}
	}
	if (!fields.length) return;

	fields.push('updated_at = CURRENT_TIMESTAMP');
	await env.DB.prepare(
		`UPDATE reminders SET ${fields.join(', ')}
		 WHERE id = ? AND user_id = ?`
	).bind(...values, id, userId).run();
}

export async function markDelivered(
	env: Env, userId: number, id: number
): Promise<void> {
	await env.DB.prepare(
		`UPDATE reminders SET status = 'delivered', updated_at = CURRENT_TIMESTAMP
		 WHERE id = ? AND user_id = ?`
	).bind(id, userId).run();
}

/**
 * Soft-cancel: status='cancelled', row preserved.
 */
export async function softCancel(
	env: Env, userId: number, id: number
): Promise<void> {
	await env.DB.prepare(
		`UPDATE reminders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
		 WHERE id = ? AND user_id = ?`
	).bind(id, userId).run();
}

/**
 * Cron-side helper: this user's pending reminders that are due.
 *
 * Scoped by user_id at the SQL level so a single user's runaway
 * reminder backlog cannot starve other users in the multi-user
 * cron loop (cron iterates users; each call sees only that user's
 * rows).
 */
export async function listDuePending(
	env: Env, userId: number, nowUnix: number, limit = 10
): Promise<ReminderRow[]> {
	return queryAll<ReminderRow>(
		env.DB.prepare(
			`SELECT * FROM reminders
			 WHERE user_id = ? AND status = 'pending' AND due_at <= ?
			 ORDER BY due_at ASC LIMIT ?`
		).bind(userId, nowUnix, limit)
	);
}

/**
 * Hard delete every reminder for a user. Used by /forget.
 */
export async function deleteAll(env: Env, userId: number): Promise<void> {
	await env.DB.prepare('DELETE FROM reminders WHERE user_id = ?').bind(userId).run();
	log.info('reminders_deleted_all', { userId });
}

/**
 * Normalise reminder text for dedup matching.
 * Lowercase, trim, collapse internal whitespace.
 */
function normaliseText(s: string): string {
	return s.toLowerCase().trim().replace(/\s+/g, ' ');
}
