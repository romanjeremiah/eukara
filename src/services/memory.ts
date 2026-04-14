// ============================================================
// Memory Service
//
// Long-term fact storage about the user. Categorised memories
// with importance scoring, formatted context for AI prompts,
// and Vectorize indexing for semantic search.
// ============================================================

import type { MemoryRow } from '../types/db';
import { queryAll } from '../lib/db';
import { log } from '../lib/logger';

const THERAPEUTIC_CATEGORIES = [
	'pattern', 'trigger', 'avoidance', 'schema',
	'growth', 'coping', 'insight', 'homework',
] as const;

export async function saveMemory(
	env: Env,
	chatId: number,
	category: string,
	fact: string,
	importance = 1
): Promise<void> {
	// Ensure user_profiles entry exists (prevents FOREIGN KEY errors)
	await env.DB.prepare(
		'INSERT OR IGNORE INTO user_profiles (chat_id) VALUES (?)'
	).bind(chatId).run();

	const result = await env.DB.prepare(
		'INSERT INTO memories (chat_id, category, fact, importance_score) VALUES (?, ?, ?, ?)'
	).bind(chatId, category.toLowerCase(), fact, importance).run();

	// Index in Vectorize for semantic search (fire-and-forget)
	const memoryId = result?.meta?.last_row_id ?? Date.now();
	indexInVectorize(env, chatId, category, fact, memoryId).catch(
		e => log.error('vectorize_index_error', { msg: (e as Error).message })
	);
}

export async function getMemories(env: Env, chatId: number, limit = 30): Promise<MemoryRow[]> {
	return queryAll<MemoryRow>(env.DB.prepare(
		'SELECT id, category, fact, importance_score, created_at FROM memories WHERE chat_id = ? ORDER BY importance_score DESC, created_at DESC LIMIT ?'
	).bind(chatId, limit));
}

export async function getMemoriesByCategory(
	env: Env,
	chatId: number,
	category: string,
	limit = 10
): Promise<MemoryRow[]> {
	return queryAll<MemoryRow>(env.DB.prepare(
		'SELECT id, category, fact, importance_score, created_at FROM memories WHERE chat_id = ? AND category = ? ORDER BY created_at DESC LIMIT ?'
	).bind(chatId, category.toLowerCase(), limit));
}

/**
 * Build formatted memory context for injection into AI prompts.
 * Groups memories by type with relative timestamps.
 */
export async function getFormattedContext(env: Env, chatId: number): Promise<string> {
	const all = await getMemories(env, chatId, 40);
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
		for (const m of therapeutic) {
			ctx += `- [${m.category}] ${m.fact} (${getRelativeAge(m.created_at)})\n`;
		}
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
	env: Env, chatId: number, days = 7
): Promise<MemoryRow[]> {
	const since = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
	return queryAll<MemoryRow>(env.DB.prepare(`
		SELECT category, fact, importance_score, created_at FROM memories
		WHERE chat_id = ? AND category IN ('homework','coping','growth','idea','brain_dump','insight')
		AND created_at > ? ORDER BY created_at DESC LIMIT 30
	`).bind(chatId, since));
}

export async function deleteAllMemories(env: Env, chatId: number): Promise<void> {
	await env.DB.prepare('DELETE FROM memories WHERE chat_id = ?').bind(chatId).run();
}

// --- Helpers ---

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
	env: Env, chatId: number, category: string, fact: string, memoryId: number
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
				metadata: { chatId, category, fact: fact.slice(0, 200), preview: fact.slice(0, 100) },
			}]);
		}
	} catch (e) {
		log.error('vectorize_upsert_error', { msg: (e as Error).message });
	}
}
