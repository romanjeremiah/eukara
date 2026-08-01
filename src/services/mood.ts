// ============================================================
// Mood Service
//
// CRUD + history + upsert for the mood_journal table.
// All operations keyed by user_id.
//
// Entry model: one row per (user_id, date, entry_type) where
// entry_type is 'morning' | 'midday' | 'evening'. Check-ins
// upsert partial fields so a single day can grow across
// multiple interactions (e.g. morning meds logged first,
// evening mood score added later).
// ============================================================

import type { MoodJournalRow } from '../types/db';
import { queryAll } from '../lib/db';
import { log } from '../lib/logger';

export type EntryType = 'morning' | 'midday' | 'evening';

/**
 * Return today's date in the user's local timezone as an ISO date
 * string (YYYY-MM-DD). All mood entries are keyed by the user's
 * local date so that "today's check-in" matches their sense of
 * the day, regardless of where the server or the user is.
 *
 * Callers should resolve the user's timezone via
 * services/user.ts:getUserTimezone() and pass it in. The default
 * 'Europe/London' is a defensive fallback for environments where
 * the lookup has not yet been wired (e.g. early tests).
 */
export function todayLocal(timezone = 'Europe/London'): string {
	return new Date().toLocaleDateString('en-CA', { timeZone: timezone });
}

/**
 * @deprecated Use todayLocal(timezone) instead. Retained for
 * backwards compatibility — behaves identically but ignores the
 * user's chosen timezone.
 */
export function todayLondon(): string {
	return todayLocal('Europe/London');
}

/**
 * Fetch the single mood_journal row for (user_id, date, entry_type),
 * or null if the user hasn't checked in yet for this slot today.
 */
export async function getEntry(
	env: Env, userId: number, date: string, entryType: EntryType
): Promise<MoodJournalRow | null> {
	return env.DB.prepare(
		'SELECT * FROM mood_journal WHERE user_id = ? AND date = ? AND entry_type = ? LIMIT 1'
	).bind(userId, date, entryType).first<MoodJournalRow>();
}

/**
 * Has the user checked in at all today for the given slot?
 * Cheaper than getEntry when you only need a boolean.
 * Callers pass the user's timezone so "today" is evaluated locally.
 */
export async function hasCheckedInToday(
	env: Env, userId: number, entryType: EntryType, timezone = 'Europe/London'
): Promise<boolean> {
	const row = await env.DB.prepare(
		'SELECT id FROM mood_journal WHERE user_id = ? AND date = ? AND entry_type = ? LIMIT 1'
	).bind(userId, todayLocal(timezone), entryType).first();
	return !!row;
}

/**
 * Source precedence ordering. Higher index = stronger source.
 * Used by upsertEntry to reject downgrades: once a row is tagged
 * 'cron_poll' or 'manual_command' (a deliberate check-in), an
 * AI-driven 'inline_chat' write must not overwrite the label.
 *
 * NULL is treated as 'inline_chat' for safety, so pre-Phase-1
 * rows behave like the weakest source.
 */
const SOURCE_PRECEDENCE: Record<string, number> = {
	inline_chat: 0,
	manual_command: 1,
	cron_poll: 2,
};

function sourceRank(value: string | null | undefined): number {
	if (!value) return SOURCE_PRECEDENCE.inline_chat!;
	return SOURCE_PRECEDENCE[value] ?? SOURCE_PRECEDENCE.inline_chat!;
}

/**
 * Partial update for today's entry. Creates a new row if none exists,
 * otherwise merges the supplied fields into the existing row. Fields
 * the caller omits are left untouched.
 *
 * Returns the final row after the write. Emotions and activities are
 * stored as JSON strings; callers pass the already-stringified value.
 *
 * Source precedence (Phase 2): if `updates.source` is supplied and
 * the existing row's source has a higher precedence, the source
 * field is dropped from the write so a casual 'inline_chat' AI write
 * cannot downgrade a deliberate 'cron_poll' check-in. Other fields
 * are still merged. Precedence: cron_poll > manual_command > inline_chat.
 */
export async function upsertEntry(
	env: Env,
	userId: number,
	date: string,
	entryType: EntryType,
	updates: Partial<Omit<MoodJournalRow, 'id' | 'user_id' | 'date' | 'entry_type' | 'created_at' | 'updated_at'>>
): Promise<MoodJournalRow | null> {
	const existing = await getEntry(env, userId, date, entryType);

	if (!existing) {
		// Insert new row with whatever updates were passed in.
		const cols = ['user_id', 'date', 'entry_type', ...Object.keys(updates)];
		const placeholders = cols.map(() => '?').join(', ');
		const values: unknown[] = [userId, date, entryType, ...Object.values(updates)];

		await env.DB.prepare(
			`INSERT INTO mood_journal (${cols.join(', ')}) VALUES (${placeholders})`
		).bind(...values).run();

		return getEntry(env, userId, date, entryType);
	}

	// Source precedence enforcement: drop the source field from the
	// update if it would downgrade the existing row.
	const effectiveUpdates: Record<string, unknown> = { ...updates };
	if ('source' in effectiveUpdates) {
		const incoming = effectiveUpdates.source as string | null | undefined;
		if (sourceRank(incoming) < sourceRank(existing.source)) {
			log.info('mood_source_downgrade_blocked', {
				userId, date, entryType,
				existing: existing.source,
				attempted: incoming ?? null,
			});
			delete effectiveUpdates.source;
		}
	}

	// Merge: only SET fields the caller actually supplied.
	const keys = Object.keys(effectiveUpdates);
	if (!keys.length) return existing;

	const setClause = keys.map(k => `${k} = ?`).join(', ');
	const values = Object.values(effectiveUpdates);

	await env.DB.prepare(
		`UPDATE mood_journal SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND date = ? AND entry_type = ?`
	).bind(...values, userId, date, entryType).run();

	return getEntry(env, userId, date, entryType);
}

/**
 * Last N days of entries for a given slot, newest first.
 * Used by the poll-answer handler for trend analysis.
 */
export async function getHistory(
	env: Env, userId: number, days = 30, entryType?: EntryType
): Promise<MoodJournalRow[]> {
	const since = new Date(Date.now() - days * 86400000).toISOString().split('T')[0]!;
	const sql = entryType
		? 'SELECT * FROM mood_journal WHERE user_id = ? AND date >= ? AND entry_type = ? ORDER BY date DESC, created_at DESC'
		: 'SELECT * FROM mood_journal WHERE user_id = ? AND date >= ? ORDER BY date DESC, created_at DESC';

	const stmt = entryType
		? env.DB.prepare(sql).bind(userId, since, entryType)
		: env.DB.prepare(sql).bind(userId, since);

	return queryAll<MoodJournalRow>(stmt);
}

/**
 * Summarise the user's recent mood history as a compact string,
 * suitable for injection into model context. Keeps the last N
 * entries with score + emotions only — heavy fields (notes, tags)
 * are left out so the context stays lean.
 */
export function formatHistoryForContext(entries: MoodJournalRow[], limit = 10): string {
	if (!entries.length) return 'No previous check-ins found.';

	const summaries = entries.slice(0, limit).map(e => {
		const emotionsLabel = e.emotions ? safeJsonArray(e.emotions).join(', ') : 'none';
		const scoreLabel = e.mood_score ?? '?';
		return `${e.date} (${e.entry_type}): score ${scoreLabel}/5, emotions: ${emotionsLabel}`;
	});

	return `Recent check-ins: ${summaries.join(' | ')}`;
}

/**
 * Count check-ins in the last N days — useful for streak tracking
 * in the weekly report, not for day-to-day logic.
 */
export async function countRecentCheckins(
	env: Env, userId: number, days = 7
): Promise<number> {
	const since = new Date(Date.now() - days * 86400000).toISOString().split('T')[0]!;
	const row = await env.DB.prepare(
		'SELECT COUNT(*) AS n FROM mood_journal WHERE user_id = ? AND date >= ?'
	).bind(userId, since).first<{ n: number }>();
	return row?.n ?? 0;
}

/**
 * Hard delete every mood_journal row for a user. Used by the eventual
 * /forget command when we wire user-initiated data deletion.
 */
export async function deleteAll(env: Env, userId: number): Promise<void> {
	await env.DB.prepare('DELETE FROM mood_journal WHERE user_id = ?').bind(userId).run();
	log.info('mood_deleted', { userId });
}

// ============================================================
// Phase 2 helpers (2026-06-02)
//
// Domain queries the mood-flow + cron use to make decisions like
// "should we send an evening reminder?" or "is sleep already
// logged?". Each takes the user's timezone so "today" is local.
// ============================================================

/**
 * True if today's evening row exists AND was created by a real
 * check-in (source 'cron_poll' or 'manual_command'). A casual
 * mid-day AI write that landed in the evening slot does NOT
 * count, because the source will be 'inline_chat' or NULL.
 *
 * Used by the evening cron to decide whether to fire the
 * scheduled reminder. If the user has already done a real
 * check-in (early via /mood), the cron stays quiet.
 */
export async function hasRealEveningCheckin(
	env: Env, userId: number, timezone = 'Europe/London'
): Promise<boolean> {
	const today = todayLocal(timezone);
	const row = await env.DB.prepare(
		`SELECT source FROM mood_journal
		 WHERE user_id = ? AND date = ? AND entry_type = 'evening'
		 LIMIT 1`
	).bind(userId, today).first<{ source: string | null }>();
	if (!row) return false;
	return row.source === 'cron_poll' || row.source === 'manual_command';
}

/**
 * True if today has any sleep data logged in the evening row
 * (hours or quality). Used by the mood-flow synthesis step to
 * decide whether to ask about sleep.
 */
export async function hasSleepLoggedToday(
	env: Env, userId: number, timezone = 'Europe/London'
): Promise<boolean> {
	const today = todayLocal(timezone);
	const row = await env.DB.prepare(
		`SELECT sleep_hours, sleep_quality FROM mood_journal
		 WHERE user_id = ? AND date = ? AND entry_type = 'evening'
		 LIMIT 1`
	).bind(userId, today).first<{ sleep_hours: number | null; sleep_quality: string | null }>();
	if (!row) return false;
	return row.sleep_hours !== null || (row.sleep_quality !== null && row.sleep_quality !== '');
}

/**
 * Merge a list of activity strings into today's row, dedup-aware.
 * Activities are stored as a JSON array of strings. New entries
 * are appended in order, skipping any value already present
 * (case-insensitive match).
 *
 * Returns the new full array after merge, so callers can use it
 * without an extra read. Empty `newActivities` is a no-op that
 * returns the existing array (or [] if no row yet).
 */
export async function mergeActivities(
	env: Env,
	userId: number,
	date: string,
	entryType: EntryType,
	newActivities: string[]
): Promise<string[]> {
	const existing = await getEntry(env, userId, date, entryType);
	const current = existing?.activities ? safeJsonArray(existing.activities) : [];

	if (!newActivities.length) return current;

	const seen = new Set(current.map(s => s.toLowerCase().trim()));
	const merged = [...current];
	for (const a of newActivities) {
		const key = a.toLowerCase().trim();
		if (!key || seen.has(key)) continue;
		seen.add(key);
		merged.push(a);
	}

	// If nothing was actually new, skip the write.
	if (merged.length === current.length) return current;

	await upsertEntry(env, userId, date, entryType, {
		activities: JSON.stringify(merged),
	});
	return merged;
}

function safeJsonArray(raw: string | null): string[] {
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed.map(String) : [];
	} catch {
		return [];
	}
}
