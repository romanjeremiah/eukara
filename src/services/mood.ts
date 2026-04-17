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
 * Return today's date in London time as an ISO date string (YYYY-MM-DD).
 * All mood entries are keyed by London-local date for consistency with
 * scheduled check-ins and weekly/monthly aggregation windows.
 */
export function todayLondon(): string {
	return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' });
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
 */
export async function hasCheckedInToday(
	env: Env, userId: number, entryType: EntryType
): Promise<boolean> {
	const row = await env.DB.prepare(
		'SELECT id FROM mood_journal WHERE user_id = ? AND date = ? AND entry_type = ? LIMIT 1'
	).bind(userId, todayLondon(), entryType).first();
	return !!row;
}

/**
 * Partial update for today's entry. Creates a new row if none exists,
 * otherwise merges the supplied fields into the existing row. Fields
 * the caller omits are left untouched.
 *
 * Returns the final row after the write. Emotions and activities are
 * stored as JSON strings; callers pass the already-stringified value.
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

	// Merge: only SET fields the caller actually supplied.
	const keys = Object.keys(updates);
	if (!keys.length) return existing;

	const setClause = keys.map(k => `${k} = ?`).join(', ');
	const values = Object.values(updates);

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
 * suitable for injection into Gemini context. Keeps the last N
 * entries with score + emotions only — heavy fields (notes, tags)
 * are left out so the context stays lean.
 */
export function formatHistoryForContext(entries: MoodJournalRow[], limit = 10): string {
	if (!entries.length) return 'No previous check-ins found.';

	const summaries = entries.slice(0, limit).map(e => {
		const emotionsLabel = e.emotions ? safeJsonArray(e.emotions).join(', ') : 'none';
		const scoreLabel = e.mood_score ?? '?';
		return `${e.date} (${e.entry_type}): score ${scoreLabel}/10, emotions: ${emotionsLabel}`;
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

function safeJsonArray(raw: string | null): string[] {
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed.map(String) : [];
	} catch {
		return [];
	}
}
