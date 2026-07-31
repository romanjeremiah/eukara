// ============================================================
// Blue-green memory embedding projection
//
// D1 remains authoritative. The original 1,024-dimension index is retained
// for rollback while OpenAI's 1,536-dimension projection is backfilled.
// ============================================================

import type { OpenAIProvider } from '../ai/openai';
import { createOpenAIProvider } from '../ai/provider-factory';
import { CF_MODELS, OPENAI_MODELS } from '../config/models';
import { runAI } from '../lib/ai-gateway';

export const OPENAI_EMBEDDING_VERSION = 'openai:text-embedding-3-small:v1';
export const OPENAI_EMBEDDING_DIMENSIONS = 1_536;
export const CLOUDFLARE_EMBEDDING_DIMENSIONS = 1_024;
export const OPENAI_BACKFILL_STATE_KEY = 'openai_embedding_backfill:v1';
export const OPENAI_EMBEDDING_EVAL_KEY = 'openai_embedding_eval:v1';
export const OPENAI_EMBEDDING_EVAL_STATE_KEY = 'openai_embedding_eval_state:v1';

export interface MemoryProjectionRow {
	id: number;
	user_id: number;
	category: string;
	fact: string;
}

/**
 * Upsert a batch into the isolated OpenAI Vectorize projection.
 */
export async function projectOpenAIMemories(
	env: Env,
	memories: MemoryProjectionRow[],
	provider?: Pick<OpenAIProvider, 'embedMany'>,
): Promise<number> {
	if (!memories.length) return 0;
	if (!env.VECTORIZE_OPENAI) {
		throw new Error('VECTORIZE_OPENAI binding is required');
	}

	const openAI = provider ?? createOpenAIProvider(
		env,
		OPENAI_MODELS.embedding,
		{ timeoutMs: 120_000 },
	);
	const vectors = await openAI.embedMany(memories.map(memory => memory.fact));
	if (vectors.length !== memories.length) {
		throw new Error(
			`OpenAI embedding count mismatch: expected ${memories.length}, received ${vectors.length}`,
		);
	}
	for (const vector of vectors) {
		if (vector.length !== OPENAI_EMBEDDING_DIMENSIONS) {
			throw new Error(
				`OpenAI embedding dimension mismatch: expected ${OPENAI_EMBEDDING_DIMENSIONS}, received ${vector.length}`,
			);
		}
	}

	await env.VECTORIZE_OPENAI.upsert(memories.map((memory, index) => ({
		id: String(memory.id),
		values: vectors[index]!,
		metadata: {
			category: memory.category,
			embeddingVersion: OPENAI_EMBEDDING_VERSION,
			fact: memory.fact.slice(0, 200),
			preview: memory.fact.slice(0, 100),
			userId: memory.user_id,
		},
	})));

	return memories.length;
}

/**
 * Keep the original projection warm during the rollback observation window.
 */
export async function projectCloudflareMemories(
	env: Env,
	memories: MemoryProjectionRow[],
): Promise<number> {
	if (!memories.length || !env.VECTORIZE || !env.AI) return 0;
	const response = await runAI<{ data?: number[][] }>(
		env.AI,
		CF_MODELS.embedding as unknown as keyof AiModels,
		{ text: memories.map(memory => memory.fact) },
	);
	const vectors = response.data ?? [];
	if (vectors.length !== memories.length) {
		throw new Error(
			`Cloudflare embedding count mismatch: expected ${memories.length}, received ${vectors.length}`,
		);
	}
	for (const vector of vectors) {
		if (vector.length !== CLOUDFLARE_EMBEDDING_DIMENSIONS) {
			throw new Error(
				`Cloudflare embedding dimension mismatch: expected ${CLOUDFLARE_EMBEDDING_DIMENSIONS}, received ${vector.length}`,
			);
		}
	}
	await env.VECTORIZE.upsert(memories.map((memory, index) => ({
		id: String(memory.id),
		values: vectors[index]!,
		metadata: {
			category: memory.category,
			fact: memory.fact.slice(0, 200),
			preview: memory.fact.slice(0, 100),
			userId: memory.user_id,
		},
	})));
	return memories.length;
}

/**
 * Dual-write one new memory while both projections are retained for rollback.
 */
export async function projectMemoryForRollback(
	env: Env,
	memory: MemoryProjectionRow,
): Promise<void> {
	await projectMemoriesForRollback(env, [memory]);
}

/**
 * Maintain both projections while the Stage 4 rollback window is open.
 */
export async function projectMemoriesForRollback(
	env: Env,
	memories: MemoryProjectionRow[],
): Promise<void> {
	await projectCloudflareMemories(env, memories);
	await projectOpenAIMemories(env, memories);
}

/**
 * Idempotently enqueue the blue-green backfill coordinator.
 */
export async function scheduleEmbeddingBackfill(
	env: Env,
	force = false,
): Promise<boolean> {
	if (!env.OPENAI_API_KEY || !env.VECTORIZE_OPENAI || !env.TASK_QUEUE) return false;
	if (force) await env.CHAT_KV.delete(OPENAI_BACKFILL_STATE_KEY);
	const state = await env.CHAT_KV.get(OPENAI_BACKFILL_STATE_KEY);
	if (state === 'complete' || state === 'queued') return false;

	await env.TASK_QUEUE.send({
		type: 'backfill_openai_embeddings',
		userId: 0,
		chatId: 0,
		afterId: 0,
	});
	await env.CHAT_KV.put(OPENAI_BACKFILL_STATE_KEY, 'queued', {
		expirationTtl: 60 * 60,
	});
	return true;
}

/**
 * Independently recover recall evaluation after Vectorize convergence or a
 * transient Queue failure without repeating the full backfill.
 */
export async function scheduleEmbeddingEvaluation(env: Env): Promise<boolean> {
	if (!env.TASK_QUEUE) return false;
	if (await env.CHAT_KV.get(OPENAI_BACKFILL_STATE_KEY) !== 'complete') return false;
	if (await env.CHAT_KV.get(OPENAI_EMBEDDING_EVAL_KEY)) return false;
	if (await env.CHAT_KV.get(OPENAI_EMBEDDING_EVAL_STATE_KEY) === 'queued') return false;

	await env.TASK_QUEUE.send({
		type: 'evaluate_embedding_recall',
		userId: 0,
		chatId: 0,
	});
	await env.CHAT_KV.put(OPENAI_EMBEDDING_EVAL_STATE_KEY, 'queued', {
		expirationTtl: 5 * 60,
	});
	return true;
}

export interface EmbeddingRecallEvaluation {
	sampleSize: number;
	cloudflareTop1: number;
	cloudflareTop3: number;
	openaiTop1: number;
	openaiTop3: number;
}

/**
 * Compare exact-memory self-recall across blue and green projections without
 * storing private fact text in the evaluation result.
 */
export async function evaluateEmbeddingRecall(
	env: Env,
	memories: MemoryProjectionRow[],
	provider?: Pick<OpenAIProvider, 'embedMany'>,
): Promise<EmbeddingRecallEvaluation> {
	if (!memories.length) {
		return {
			sampleSize: 0,
			cloudflareTop1: 0,
			cloudflareTop3: 0,
			openaiTop1: 0,
			openaiTop3: 0,
		};
	}
	if (!env.AI || !env.VECTORIZE || !env.VECTORIZE_OPENAI) {
		throw new Error('Both embedding providers and Vectorize bindings are required');
	}

	const texts = memories.map(memory => memory.fact);
	const cloudflareResponse = await runAI<{ data?: number[][] }>(
		env.AI,
		CF_MODELS.embedding as unknown as keyof AiModels,
		{ text: texts },
	);
	const cloudflareVectors = cloudflareResponse.data ?? [];
	const openAI = provider ?? createOpenAIProvider(
		env,
		OPENAI_MODELS.embedding,
		{ timeoutMs: 120_000 },
	);
	const openaiVectors = await openAI.embedMany(texts);
	if (
		cloudflareVectors.length !== memories.length
		|| openaiVectors.length !== memories.length
	) {
		throw new Error('Embedding evaluation vector count mismatch');
	}

	const evaluation: EmbeddingRecallEvaluation = {
		sampleSize: memories.length,
		cloudflareTop1: 0,
		cloudflareTop3: 0,
		openaiTop1: 0,
		openaiTop3: 0,
	};
	for (let index = 0; index < memories.length; index++) {
		const memory = memories[index]!;
		const expectedId = String(memory.id);
		const [cloudflareMatches, openaiMatches] = await Promise.all([
			env.VECTORIZE.query(cloudflareVectors[index]!, {
				topK: 3,
				filter: { userId: memory.user_id },
			}),
			env.VECTORIZE_OPENAI.query(openaiVectors[index]!, {
				topK: 3,
				filter: { userId: memory.user_id },
			}),
		]);
		const cloudflareIds = (cloudflareMatches.matches ?? []).map(match => match.id);
		const openaiIds = (openaiMatches.matches ?? []).map(match => match.id);
		if (cloudflareIds[0] === expectedId) evaluation.cloudflareTop1++;
		if (cloudflareIds.includes(expectedId)) evaluation.cloudflareTop3++;
		if (openaiIds[0] === expectedId) evaluation.openaiTop1++;
		if (openaiIds.includes(expectedId)) evaluation.openaiTop3++;
	}

	return evaluation;
}
