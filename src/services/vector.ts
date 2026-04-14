// ============================================================
// Vector Search Service
//
// Semantic search over memories using Vectorize + CF AI embeddings.
// Includes reranking for improved relevance.
// ============================================================

import { CF_MODELS } from '../config/models';
import { log } from '../lib/logger';

/**
 * Search for semantically similar memories.
 */
export async function semanticSearch(
	env: Env,
	chatId: number,
	query: string,
	topK = 10
): Promise<Array<{ id: string; score: number; metadata: Record<string, unknown> }>> {
	if (!env.VECTORIZE || !env.AI || !query.trim()) return [];

	try {
		// Generate embedding for the query
		const result = await env.AI.run(CF_MODELS.embedding as unknown as keyof AiModels, {
			text: [query],
		}) as { data?: number[][] };

		const vector = result?.data?.[0];
		if (!vector?.length) return [];

		// Query Vectorize
		const matches = await env.VECTORIZE.query(vector, {
			topK,
			filter: { chatId },
			returnMetadata: 'all',
		});

		return (matches.matches ?? []).map(m => ({
			id: m.id,
			score: m.score,
			metadata: (m.metadata ?? {}) as Record<string, unknown>,
		}));
	} catch (e) {
		log.error('semantic_search_error', { msg: (e as Error).message });
		return [];
	}
}

/**
 * Rerank search results using the BGE reranker model.
 */
export async function rerank(
	env: Env,
	query: string,
	results: Array<{ id: string; score: number; metadata: Record<string, unknown> }>
): Promise<typeof results> {
	if (!env.AI || !results.length || !query?.trim()) return results;

	try {
		const contexts = results
			.map(r => (r.metadata?.fact as string) ?? (r.metadata?.preview as string) ?? '')
			.filter(Boolean)
			.map(text => ({ text }));
		if (!contexts.length) return results;

		const reranked = await env.AI.run(CF_MODELS.reranker as unknown as keyof AiModels, {
			query,
			contexts,
		}) as { data?: Array<{ index: number; score: number }> };

		if (!reranked?.data?.length) return results;

		// Sort by reranker score and map back to original results
		return reranked.data
			.sort((a, b) => b.score - a.score)
			.map(r => results[r.index])
			.filter((r): r is NonNullable<typeof r> => r != null);
	} catch (e) {
		log.error('reranker_error', { msg: (e as Error).message });
		return results; // Graceful fallback
	}
}

/**
 * Get semantic context for a user message.
 * Searches + reranks, returns formatted string for prompt injection.
 */
export async function getSemanticContext(
	env: Env,
	chatId: number,
	query: string,
	maxResults = 5
): Promise<string> {
	const results = await semanticSearch(env, chatId, query, maxResults * 2);
	if (!results.length) return '';

	const reranked = await rerank(env, query, results);
	const top = reranked.slice(0, maxResults);

	if (!top.length) return '';

	let ctx = '\nSemantically relevant memories:\n';
	for (const r of top) {
		const fact = (r.metadata?.fact as string) ?? '';
		const category = (r.metadata?.category as string) ?? '';
		if (fact) ctx += `- [${category}] ${fact}\n`;
	}
	return ctx;
}
