// ============================================================
// OpenAI blue-green embedding projection regression tests
// ============================================================

import { describe, expect, it } from 'vitest';
import {
	OPENAI_EMBEDDING_DIMENSIONS,
	OPENAI_EMBEDDING_VERSION,
	evaluateEmbeddingRecall,
	projectOpenAIMemories,
	scheduleEmbeddingBackfill,
} from '../src/services/embedding-projection';
import { orderResultsByIds } from '../src/services/vector';

describe('OpenAI memory projection', () => {
	it('upserts versioned, user-scoped 1,536-dimension vectors', async () => {
		const upserts = [];
		const env = {
			VECTORIZE_OPENAI: {
				upsert: async (vectors) => upserts.push(vectors),
			},
		};
		const memories = [{
			id: 42,
			user_id: 7,
			category: 'preference',
			fact: 'Prefers concise technical explanations.',
		}];
		const provider = {
			embedMany: async () => [Array(OPENAI_EMBEDDING_DIMENSIONS).fill(0.25)],
		};

		await expect(projectOpenAIMemories(env, memories, provider)).resolves.toBe(1);
		expect(upserts[0][0]).toMatchObject({
			id: '42',
			metadata: {
				category: 'preference',
				embeddingVersion: OPENAI_EMBEDDING_VERSION,
				userId: 7,
			},
		});
		expect(upserts[0][0].values).toHaveLength(OPENAI_EMBEDDING_DIMENSIONS);
	});

	it('fails closed when the provider returns the wrong vector shape', async () => {
		const env = {
			VECTORIZE_OPENAI: { upsert: async () => undefined },
		};
		const provider = { embedMany: async () => [[0.1, 0.2]] };

		await expect(projectOpenAIMemories(env, [{
			id: 1,
			user_id: 7,
			category: 'fact',
			fact: 'A fact',
		}], provider)).rejects.toThrow(/dimension mismatch/);
	});
});

describe('Embedding backfill control', () => {
	it('enqueues one idempotent coordinator and records queued state', async () => {
		const state = new Map();
		const messages = [];
		const env = {
			OPENAI_API_KEY: 'test-key',
			VECTORIZE_OPENAI: {},
			TASK_QUEUE: { send: async (message) => messages.push(message) },
			CHAT_KV: {
				get: async (key) => state.get(key) ?? null,
				put: async (key, value) => state.set(key, value),
				delete: async (key) => state.delete(key),
			},
		};

		await expect(scheduleEmbeddingBackfill(env)).resolves.toBe(true);
		await expect(scheduleEmbeddingBackfill(env)).resolves.toBe(false);
		expect(messages).toEqual([{
			type: 'backfill_openai_embeddings',
			userId: 0,
			chatId: 0,
			afterId: 0,
		}]);
	});

	it('compares recall without returning private memory text', async () => {
		const env = {
			AI: {
				run: async () => ({ data: [[1], [2]] }),
			},
			VECTORIZE: {
				query: async (vector) => ({ matches: [{ id: String(vector[0]) }] }),
			},
			VECTORIZE_OPENAI: {
				query: async (vector) => ({ matches: [{ id: String(vector[0]) }] }),
			},
		};
		const memories = [
			{ id: 1, user_id: 7, category: 'fact', fact: 'Private one' },
			{ id: 2, user_id: 7, category: 'fact', fact: 'Private two' },
		];
		const provider = { embedMany: async () => [[1], [2]] };

		const result = await evaluateEmbeddingRecall(env, memories, provider);

		expect(result).toEqual({
			sampleSize: 2,
			cloudflareTop1: 2,
			cloudflareTop3: 2,
			openaiTop1: 2,
			openaiTop3: 2,
		});
		expect(JSON.stringify(result)).not.toContain('Private');
	});
});

describe('OpenAI reranker validation', () => {
	const results = [
		{ id: '1', score: 0.8 },
		{ id: '2', score: 0.7 },
		{ id: '3', score: 0.6 },
	];

	it('uses valid ids once and appends omitted candidates', () => {
		expect(orderResultsByIds(results, '["3","3","unknown","1"]'))
			.toEqual([results[2], results[0], results[1]]);
	});

	it('preserves vector order when JSON is invalid', () => {
		expect(orderResultsByIds(results, 'not-json')).toEqual(results);
	});
});
