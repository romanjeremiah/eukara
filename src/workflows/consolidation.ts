// ============================================================
// Memory Consolidation Workflow ("REM Sleep")
//
// Durable multi-step workflow that consolidates memories monthly.
// Step 1: Fetch all memories from D1
// Step 2: First-pass deduplication via CF AI (free)
// Step 3: Gemini consolidation (paid, retryable)
// Step 4: Atomic D1 write + cleanup
//
// 2026-06-02 changes:
//   F3: chatId param renamed to userId; D1 queries now use user_id
//       column for per-user isolation (matches rest of codebase).
//   Hardcoded model gemini-3.1-pro-preview replaced with
//   GEMINI_MODELS.flashLite (= gemini-3.5-flash post-migration).
//   Workflow now in sync with central registry.
// ============================================================

import { WorkflowEntrypoint, WorkflowStep } from 'cloudflare:workers';
import type { WorkflowEvent } from 'cloudflare:workers';
import { GEMINI_MODELS } from '../config/models';

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
				return await deduplicateMemories(this.env.AI, allMemories);
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

		// Step 3: Gemini consolidation (expensive, retryable)
		const consolidated = await step.do('ai-consolidation', {
			retries: { limit: 3, delay: '10 seconds', backoff: 'exponential' },
			timeout: '120 seconds',
		}, async () => {
			const { GoogleGenAI } = await import('@google/genai');
			const ai = new GoogleGenAI({ apiKey: this.env.GEMINI_API_KEY });

			const rawText = dedupedMemories
				.map(m => `[${m.category}] ${m.fact} (Score: ${m.importance_score})`)
				.join('\n');

			const response = await ai.models.generateContent({
				model: GEMINI_MODELS.flashLite,
				contents: `You are performing memory consolidation for a therapeutic Second Brain.
Here are the user's saved memories:
${rawText}

Task:
1. Remove duplicate facts.
2. Merge outdated preferences with newer ones.
3. Group related therapeutic patterns into coherent summaries.
4. Preserve exact wording of critical triggers (importance 3).
5. Keep all unique facts and ideas.

Return ONLY a raw JSON array:
[{"category":"preference","fact":"...","importance":1}]
No markdown, no backticks.`,
				config: { temperature: 0.2 },
			});

			const text = response.text ?? '';
			const match = text.match(/\[[\s\S]*\]/);
			return match ? JSON.parse(match[0]) as Array<{ category: string; fact: string; importance: number }> : [];
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
