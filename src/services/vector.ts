// ============================================================
// Vector Search Service
// Semantic search keyed by userId for per-user isolation.
// ============================================================

import { CF_MODELS } from '../config/models';
import { log } from '../lib/logger';

export async function semanticSearch(
	env: Env, userId: number, query: string, topK = 10
): Promise<Array<{ id: string; score: number; metadata: Record<string, unknown> }>> {
	if (!env.VECTORIZE || !env.AI || !query.trim()) return [];
	try {
		const result = await env.AI.run(CF_MODELS.embedding as unknown as keyof AiModels, {
			text: [query],
		}) as { data?: number[][] };
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

		const reranked = await env.AI.run(CF_MODELS.reranker as unknown as keyof AiModels, {
			query, contexts,
		}) as { data?: Array<{ index: number; score: number }> };
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

	let ctx = '\nSemantically relevant memories:\n';
	for (const r of top) {
		const fact = (r.metadata?.fact as string) ?? '';
		const category = (r.metadata?.category as string) ?? '';
		if (fact) ctx += `- [${category}] ${fact}\n`;
	}
	return ctx;
}
