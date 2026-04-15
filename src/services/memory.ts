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

export async function saveMemory(
	env: Env, userId: number, category: string, fact: string, importance = 1
): Promise<void> {
	await env.DB.prepare(
		'INSERT OR IGNORE INTO user_profiles (user_id) VALUES (?)'
	).bind(userId).run();

	const result = await env.DB.prepare(
		'INSERT INTO memories (user_id, category, fact, importance_score) VALUES (?, ?, ?, ?)'
	).bind(userId, category.toLowerCase(), fact, importance).run();

	const memoryId = result?.meta?.last_row_id ?? Date.now();
	indexInVectorize(env, userId, category, fact, memoryId).catch(
		e => log.error('vectorize_index_error', { msg: (e as Error).message })
	);
}

export async function getMemories(env: Env, userId: number, limit = 30): Promise<MemoryRow[]> {
	return queryAll<MemoryRow>(env.DB.prepare(
		'SELECT id, user_id, category, fact, importance_score, created_at FROM memories WHERE user_id = ? ORDER BY importance_score DESC, created_at DESC LIMIT ?'
	).bind(userId, limit));
}

export async function getMemoriesByCategory(
	env: Env, userId: number, category: string, limit = 10
): Promise<MemoryRow[]> {
	return queryAll<MemoryRow>(env.DB.prepare(
		'SELECT id, user_id, category, fact, importance_score, created_at FROM memories WHERE user_id = ? AND category = ? ORDER BY created_at DESC LIMIT ?'
	).bind(userId, category.toLowerCase(), limit));
}

export async function getFormattedContext(env: Env, userId: number): Promise<string> {
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
		} else if (m.category === 'discovery' || m.category === 'growth') {
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
		for (const m of factual) ctx += `- [${m.category}] ${m.fact}\n`;
	}
	if (therapeutic.length) {
		ctx += '\nTherapeutic observations:\n';
		for (const m of therapeutic) ctx += `- [${m.category}] ${m.fact} (${getRelativeAge(m.created_at)})\n`;
	}
	if (learned.length) {
		ctx += '\nRecent independent learning:\n';
		for (const m of learned.slice(0, 8)) ctx += `- ${m.fact}\n`;
	}
	if (feedback.length) {
		ctx += '\nUser reaction feedback:\n';
		for (const m of feedback.slice(0, 5)) ctx += `- ${m.fact}\n`;
	}
	if (triples.length) {
		ctx += '\nKnowledge Graph (relational connections):\n';
		for (const m of triples.slice(0, 15)) ctx += `- ${m.fact}\n`;
	}

	return ctx || '- No facts saved yet.';
}

export async function getRecentTherapeuticMemories(
	env: Env, userId: number, days = 7
): Promise<MemoryRow[]> {
	const since = new Date(Date.now() - days * 86400000).toISOString().split('T')[0]!;
	return queryAll<MemoryRow>(env.DB.prepare(`
		SELECT category, fact, importance_score, created_at FROM memories
		WHERE user_id = ? AND category IN ('homework','coping','growth','idea','brain_dump','insight')
		AND created_at > ? ORDER BY created_at DESC LIMIT 30
	`).bind(userId, since));
}

export async function deleteAllMemories(env: Env, userId: number): Promise<void> {
	await env.DB.prepare('DELETE FROM memories WHERE user_id = ?').bind(userId).run();
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

async function indexInVectorize(
	env: Env, userId: number, category: string, fact: string, memoryId: number
): Promise<void> {
	if (!env.VECTORIZE || !env.AI) return;
	try {
		const { CloudflareProvider } = await import('../ai/cloudflare');
		const provider = new CloudflareProvider(env.AI);
		const vector = await provider.embed(fact);
		if (vector.length) {
			await env.VECTORIZE.upsert([{
				id: String(memoryId),
				values: vector,
				metadata: { userId, category, fact: fact.slice(0, 200), preview: fact.slice(0, 100) },
			}]);
		}
	} catch (e) {
		log.error('vectorize_upsert_error', { msg: (e as Error).message });
	}
}
