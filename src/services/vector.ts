// ============================================================
// Vector Search Service
// Semantic search keyed by userId for per-user isolation.
//
// Memory facts are stored in D1; Vectorize holds embeddings with
// truncated metadata for fast preview/filtering. Retrieval always
// rehydrates the full fact from D1 by id so the model never sees
// mid-word truncation in its context.
// ============================================================

import type { MemoryRow } from '../types/db';
import { CF_MODELS } from '../config/models';
import { queryAll } from '../lib/db';
import { log } from '../lib/logger';
import { runAI } from '../lib/ai-gateway';

export async function semanticSearch(
	env: Env, userId: number, query: string, topK = 10
): Promise<Array<{ id: string; score: number; metadata: Record<string, unknown> }>> {
	if (!env.VECTORIZE || !env.AI || !query.trim()) return [];
	try {
		const result = await runAI<{ data?: number[][] }>(
			env.AI,
			CF_MODELS.embedding as unknown as keyof AiModels,
			{ text: [query] }
		);
		const vector = result?.data?.[0];
		if (!vector?.length) return [];

		const matches = await env.VECTORIZE.query(vector, {
			topK,
			filter: { userId },
			returnMetadata: 'all',
		});
		return (matches.matches ?? []).map(m => ({
			id: m.id, score: m.score,
			metadata: (m.metadata ?? {}) as Record<string, unknown>,
		}));
	} catch (e) {
		log.error('semantic_search_error', { msg: (e as Error).message });
		return [];
	}
}

export async function rerank(
	env: Env, query: string,
	results: Array<{ id: string; score: number; metadata: Record<string, unknown> }>
): Promise<typeof results> {
	if (!env.AI || !results.length || !query?.trim()) return results;
	try {
		const contexts = results
			.map(r => (r.metadata?.fact as string) ?? (r.metadata?.preview as string) ?? '')
			.filter(Boolean)
			.map(text => ({ text }));
		if (!contexts.length) return results;

		const reranked = await runAI<{ data?: Array<{ index: number; score: number }> }>(
			env.AI,
			CF_MODELS.reranker as unknown as keyof AiModels,
			{ query, contexts }
		);
		if (!reranked?.data?.length) return results;

		return reranked.data
			.sort((a, b) => b.score - a.score)
			.map(r => results[r.index])
			.filter((r): r is NonNullable<typeof r> => r != null);
	} catch (e) {
		log.error('reranker_error', { msg: (e as Error).message });
		return results;
	}
}

export async function getSemanticContext(
	env: Env, userId: number, query: string, maxResults = 5
): Promise<string> {
	const results = await semanticSearch(env, userId, query, maxResults * 2);
	if (!results.length) return '';
	const reranked = await rerank(env, query, results);
	const top = reranked.slice(0, maxResults);
	if (!top.length) return '';

	// Rehydrate full facts from D1 by id. Vectorize metadata.fact is
	// capped at 200 chars when stored (see services/memory.ts:indexInVectorize),
	// which produced mid-word truncations in the model's context window
	// and bled into user-facing replies. Looking up the full row by id
	// costs one extra D1 round-trip per turn but guarantees the model
	// sees complete observations.
	const ids = top
		.map(r => r.id)
		.filter((id): id is string => typeof id === 'string' && id.length > 0);
	if (!ids.length) return '';

	const placeholders = ids.map(() => '?').join(',');
	let fullMemories: MemoryRow[] = [];
	try {
		fullMemories = await queryAll<MemoryRow>(
			env.DB.prepare(
				`SELECT id, user_id, category, fact, importance_score, created_at, superseded_at
				 FROM memories
				 WHERE id IN (${placeholders}) AND user_id = ? AND superseded_at IS NULL`
			).bind(...ids, userId)
		);
	} catch (e) {
		log.error('semantic_rehydrate_error', { msg: (e as Error).message });
		return '';
	}

	if (!fullMemories.length) return '';

	// Preserve the semantic ranking order from Vectorize/reranker.
	const factsById = new Map<string, MemoryRow>();
	for (const m of fullMemories) factsById.set(String(m.id), m);

	let ctx = '\nSemantically relevant memories:\n';
	for (const r of top) {
		const m = factsById.get(r.id);
		if (m && m.fact) ctx += `- [${m.category}] ${m.fact}\n`;
	}
	return ctx;
}
