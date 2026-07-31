// ============================================================
// Memory Service
//
// All memory operations keyed by user_id (not chat_id).
// Each user has their own isolated memory space.
// ============================================================

import type { MemoryRow } from '../types/db';
import { queryAll } from '../lib/db';
import { log } from '../lib/logger';

const THERAPEUTIC_CATEGORIES = [
	'pattern', 'trigger', 'avoidance', 'schema',
	'growth', 'coping', 'insight', 'homework',
] as const;

const LEGACY_INFERRED_CATEGORIES = [
	'implicit_mood', 'episode_topic', 'personality_trait',
] as const;
const LEGACY_INFERRED_SQL = LEGACY_INFERRED_CATEGORIES.map(() => '?').join(',');

export async function saveMemory(
	env: Env, userId: number, category: string, fact: string, importance = 1
): Promise<void> {
	// Phase 2 (2026-06-03): the redundant `INSERT OR IGNORE INTO
	// user_profiles` bootstrap was removed from here. user_profiles
	// is owned by services/user.ts:ensureUser, which the message
	// handler (and every other entry point) calls before any service
	// touches per-user data. Bootstrapping in two places risked
	// drift if ensureUser ever gains new seed fields.

	const result = await env.DB.prepare(
		'INSERT INTO memories (user_id, category, fact, importance_score) VALUES (?, ?, ?, ?)'
	).bind(userId, category.toLowerCase(), fact, importance).run();

	const memoryId = result?.meta?.last_row_id ?? Date.now();
	try {
		await env.TASK_QUEUE.send({
			type: 'index_memory_projection',
			userId,
			chatId: userId,
			memoryId: Number(memoryId),
			category: category.toLowerCase(),
			fact,
		});
	} catch (error) {
		// D1 is authoritative. A later backfill can repair a missed projection.
		log.error('vectorize_enqueue_error', { msg: (error as Error).message });
	}
}

export async function getMemories(env: Env, userId: number, limit = 30): Promise<MemoryRow[]> {
	return queryAll<MemoryRow>(env.DB.prepare(
		`SELECT id, user_id, category, fact, importance_score, created_at, superseded_at
		 FROM memories
		 WHERE user_id = ? AND superseded_at IS NULL
		   AND category NOT IN (${LEGACY_INFERRED_SQL})
		 ORDER BY importance_score DESC, created_at DESC LIMIT ?`
	).bind(userId, ...LEGACY_INFERRED_CATEGORIES, limit));
}

export async function getMemoriesByCategory(
	env: Env, userId: number, category: string, limit = 10
): Promise<MemoryRow[]> {
	return queryAll<MemoryRow>(env.DB.prepare(
		'SELECT id, user_id, category, fact, importance_score, created_at, superseded_at FROM memories WHERE user_id = ? AND category = ? AND superseded_at IS NULL ORDER BY created_at DESC LIMIT ?'
	).bind(userId, category.toLowerCase(), limit));
}

/**
 * Supersession (2026-06-03). Marks a memory as outdated. The row is
 * retained in the database but excluded from default retrieval queries
 * (which all filter `WHERE superseded_at IS NULL`). user_id is checked
 * to prevent cross-user supersession through a forged memory id.
 *
 * Idempotent: superseding an already-superseded row is a no-op (the
 * timestamp updates, which is fine).
 */
export async function supersedeMemory(
	env: Env, userId: number, memoryId: number
): Promise<void> {
	await env.DB.prepare(
		'UPDATE memories SET superseded_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?'
	).bind(memoryId, userId).run();
	await deleteLegacyProjection(env, [String(memoryId)]);
}

export async function getFormattedContext(env: Env, userId: number, includeDiscoveries = true): Promise<string> {
	const all = await getMemories(env, userId, 40);
	if (!all.length) return '- No facts saved yet.';

	const therapeutic: MemoryRow[] = [];
	const factual: MemoryRow[] = [];
	const learned: MemoryRow[] = [];
	const feedback: MemoryRow[] = [];
	const triples: MemoryRow[] = [];

	for (const m of all) {
		if ((THERAPEUTIC_CATEGORIES as readonly string[]).includes(m.category)) {
			therapeutic.push(m);
		} else if (m.category === 'triple') {
			triples.push(m);
		} else if (m.category === 'discovery') {
			// Discoveries are gated out on emotional turns (caller passes
			// includeDiscoveries=false) so "things I read" never surface
			// while the user is in distress.
			if (includeDiscoveries) learned.push(m);
		} else if (m.category === 'growth') {
			learned.push(m);
		} else if (m.category === 'feedback') {
			feedback.push(m);
		} else {
			factual.push(m);
		}
	}

	let ctx = '';

	if (factual.length) {
		ctx += 'Facts about the user:\n';
		for (const m of factual) ctx += `- [${m.category}] ${m.fact} (${getRelativeAge(m.created_at)})\n`;
	}
	if (therapeutic.length) {
		ctx += '\nTherapeutic observations:\n';
		for (const m of therapeutic) ctx += `- [${m.category}] ${m.fact} (${getRelativeAge(m.created_at)})\n`;
	}
	if (learned.length) {
		ctx += '\nRecent independent learning:\n';
		for (const m of learned.slice(0, 8)) ctx += `- ${m.fact} (${getRelativeAge(m.created_at)})\n`;
	}
	if (feedback.length) {
		ctx += '\nUser reaction feedback:\n';
		for (const m of feedback.slice(0, 5)) ctx += `- ${m.fact} (${getRelativeAge(m.created_at)})\n`;
	}
	if (triples.length) {
		ctx += '\nKnowledge Graph (relational connections):\n';
		for (const m of triples.slice(0, 15)) ctx += `- ${m.fact} (${getRelativeAge(m.created_at)})\n`;
	}

	return ctx || '- No facts saved yet.';
}

export async function getRecentTherapeuticMemories(
	env: Env, userId: number, days = 7
): Promise<MemoryRow[]> {
	const since = new Date(Date.now() - days * 86400000).toISOString().split('T')[0]!;
	return queryAll<MemoryRow>(env.DB.prepare(`
		SELECT id, user_id, category, fact, importance_score, created_at, superseded_at FROM memories
		WHERE user_id = ? AND category IN ('homework','coping','growth','idea','brain_dump','insight')
		AND created_at > ? AND superseded_at IS NULL ORDER BY created_at DESC LIMIT 30
	`).bind(userId, since));
}

/**
 * Return all memories created within the last N days, regardless of
 * category. Used by the weekly report to show what Eukara learned
 * about the user this week. Ordered by creation time, newest first.
 */
export async function getMemoriesSince(
	env: Env, userId: number, days: number, limit = 50
): Promise<MemoryRow[]> {
	const since = new Date(Date.now() - days * 86400000).toISOString().split('T')[0]!;
	return queryAll<MemoryRow>(env.DB.prepare(
		`SELECT id, user_id, category, fact, importance_score, created_at, superseded_at
		 FROM memories
		 WHERE user_id = ? AND created_at > ? AND superseded_at IS NULL
		   AND category NOT IN (${LEGACY_INFERRED_SQL})
		 ORDER BY created_at DESC LIMIT ?`
	).bind(userId, since, ...LEGACY_INFERRED_CATEGORIES, limit));
}

export async function deleteAllMemories(env: Env, userId: number): Promise<void> {
	const rows = await queryAll<{ id: number }>(
		env.DB.prepare('SELECT id FROM memories WHERE user_id = ?').bind(userId),
	);
	await env.DB.prepare('DELETE FROM memories WHERE user_id = ?').bind(userId).run();
	await deleteLegacyProjection(env, rows.map(row => String(row.id)));
}

/** Delete one legacy category and its known vector IDs. */
export async function deleteMemoriesByCategory(
	env: Env,
	userId: number,
	category: string,
): Promise<number> {
	const rows = await queryAll<{ id: number }>(
		env.DB.prepare('SELECT id FROM memories WHERE user_id = ? AND category = ?')
			.bind(userId, category),
	);
	const result = await env.DB.prepare(
		'DELETE FROM memories WHERE user_id = ? AND category = ?',
	).bind(userId, category).run();
	await deleteLegacyProjection(env, rows.map(row => String(row.id)));
	return result.meta.changes ?? 0;
}

/** Vectorize is a projection, so projection deletion must never block D1 truth. */
async function deleteLegacyProjection(env: Env, ids: string[]): Promise<void> {
	if (!ids.length) return;
	try {
		await Promise.all([
			env.VECTORIZE?.deleteByIds(ids),
			env.VECTORIZE_OPENAI?.deleteByIds(ids),
		]);
	} catch (error) {
		log.error('legacy_memory_projection_delete_failed', {
			count: ids.length,
			msg: (error as Error).message,
		});
	}
}

function getRelativeAge(dateStr: string): string {
	const created = new Date(dateStr + 'Z');
	const days = Math.floor((Date.now() - created.getTime()) / 86400000);
	if (days === 0) return 'today';
	if (days === 1) return 'yesterday';
	if (days < 7) return `${days}d ago`;
	if (days < 30) return `${Math.floor(days / 7)}w ago`;
	return `${Math.floor(days / 30)}mo ago`;
}
