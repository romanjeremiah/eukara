// ============================================================
// Memory Consolidation Workflow ("REM Sleep")
//
// Durable multi-step workflow that consolidates memories monthly.
// Step 1: Fetch all memories from D1
// Step 2: First-pass deduplication via the configured provider
// Step 3: Quality-first consolidation via the configured provider
// Step 4: Atomic D1 write + cleanup
//
// 2026-06-02 changes:
//   F3: chatId param renamed to userId; D1 queries now use user_id
//       column for per-user isolation (matches rest of codebase).
//   Hardcoded model gemini-3.1-pro-preview replaced with
//   CF_MODELS.chat (= gemini-3.5-flash post-migration).
//   Workflow now in sync with central registry.
// ============================================================

import { WorkflowEntrypoint, WorkflowStep } from 'cloudflare:workers';
import type { WorkflowEvent } from 'cloudflare:workers';
import { createOpenAIProvider, getAIProviderMode } from '../ai/provider-factory';
import { CF_MODELS, OPENAI_MODELS } from '../config/models';

interface ConsolidationParams {
	userId: number;
}

interface MemoryItem {
	id: number;
	category: string;
	fact: string;
	importance_score: number;
	created_at: string;
}

interface ConsolidatedMemory {
	category: string;
	fact: string;
	importance: number;
}

export class MemoryConsolidationWorkflow extends WorkflowEntrypoint<Env, ConsolidationParams> {
	async run(event: WorkflowEvent<ConsolidationParams>, step: WorkflowStep) {
		const userId = event.payload.userId;
		if (!userId) throw new Error('Missing userId');

		// Step 1: Fetch all memories
		const allMemories = await step.do('fetch-memories', async () => {
			const { results } = await this.env.DB.prepare(
				'SELECT id, category, fact, importance_score, created_at FROM memories WHERE user_id = ? ORDER BY importance_score DESC, created_at DESC LIMIT 200'
			).bind(userId).all();
			return (results ?? []) as unknown as MemoryItem[];
		});

		if (allMemories.length < 15) {
			return { status: 'skipped', reason: 'Not enough memories', count: allMemories.length };
		}

		// Step 2: CF AI dedup (reduces tokens sent to Gemini)
		const dedupResult = await step.do('cf-ai-dedup', {
			retries: { limit: 2, delay: '5 seconds', backoff: 'constant' },
			timeout: '30 seconds',
		}, async () => {
			try {
				const { deduplicateMemories } = await import('../ai/background');
				return await deduplicateMemories(this.env, allMemories);
			} catch {
				return { groups: [], duplicates: [] };
			}
		});

		// Remove duplicates
		const dupIds = new Set<number>();
		for (const [, dupIdx] of dedupResult.duplicates) {
			const mem = allMemories[dupIdx];
			if (mem) dupIds.add(mem.id);
		}
		const dedupedMemories = allMemories.filter(m => !dupIds.has(m.id));

		// Step 3: Quality-first consolidation (expensive, retryable)
		const consolidated = await step.do('ai-consolidation', {
			retries: { limit: 3, delay: '10 seconds', backoff: 'exponential' },
			timeout: '120 seconds',
		}, async () => {
			const rawText = dedupedMemories
				.map(m => `[${m.category}] ${m.fact} (Score: ${m.importance_score})`)
				.join('\n');
			const prompt = `You are performing memory consolidation for a therapeutic Second Brain.
Here are the user's saved memories:
${rawText}

Task:
1. Remove duplicate facts.
2. Merge outdated preferences with newer ones.
3. Group related therapeutic patterns into coherent summaries.
4. Preserve exact wording of critical triggers with importance 3.
5. Keep all unique facts and ideas.

Return ONLY a raw JSON array:
[{"category":"preference","fact":"...","importance":1}]
No markdown and no backticks.`;

			if (getAIProviderMode(this.env) === 'openai') {
				const provider = createOpenAIProvider(
					this.env,
					OPENAI_MODELS.consolidation,
					{ timeoutMs: 120_000 },
				);
				const response = await provider.chat(
					[{ role: 'user', content: prompt }],
					undefined,
					{
						maxTokens: 8_000,
						systemInstruction: 'Return only valid JSON matching the requested array shape.',
						thinkingLevel: 'LOW',
					},
				);
				return parseConsolidatedMemories(response.text);
			}

			const { GoogleGenAI } = await import('@google/genai');
			const ai = new GoogleGenAI({ apiKey: this.env.GEMINI_API_KEY });

			const response = await ai.models.generateContent({
				model: CF_MODELS.chat,
				contents: prompt,
				config: { thinkingConfig: { thinkingLevel: 'LOW' as any } },
			});

			return parseConsolidatedMemories(response.text ?? '');
		});

		if (!consolidated.length) {
			return { status: 'failed', reason: 'Consolidation returned empty' };
		}

		// Step 4: Atomic D1 write
		await step.do('write-consolidated', async () => {
			const deleteStmt = this.env.DB.prepare('DELETE FROM memories WHERE user_id = ?').bind(userId);
			const inserts = consolidated.map(m =>
				this.env.DB.prepare(
					'INSERT INTO memories (user_id, category, fact, importance_score) VALUES (?, ?, ?, ?)'
				).bind(userId, (m.category ?? 'general').toLowerCase(), m.fact, m.importance ?? 1)
			);
			await this.env.DB.batch([deleteStmt, ...inserts]);
		});

		return {
			status: 'success',
			before: allMemories.length,
			afterDedup: dedupedMemories.length,
			afterConsolidation: consolidated.length,
		};
	}
}

/**
 * Validate provider JSON before it reaches the destructive replacement batch.
 */
function parseConsolidatedMemories(text: string): ConsolidatedMemory[] {
	const match = text.match(/\[[\s\S]*\]/);
	if (!match) return [];

	try {
		const parsed: unknown = JSON.parse(match[0]);
		if (!Array.isArray(parsed)) return [];
		return parsed.flatMap((item): ConsolidatedMemory[] => {
			if (!item || typeof item !== 'object') return [];
			const candidate = item as Record<string, unknown>;
			if (typeof candidate.fact !== 'string' || !candidate.fact.trim()) return [];
			const importance = Number(candidate.importance);
			return [{
				category: typeof candidate.category === 'string'
					? candidate.category
					: 'general',
				fact: candidate.fact.trim(),
				importance: Number.isFinite(importance)
					? Math.max(1, Math.min(3, Math.round(importance)))
					: 1,
			}];
		});
	} catch {
		return [];
	}
}
