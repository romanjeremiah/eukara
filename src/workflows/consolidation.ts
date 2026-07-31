// ============================================================
// Memory Consolidation Workflow ("REM Sleep")
//
// Durable multi-step workflow that consolidates memories monthly.
// Step 1: Fetch all memories from D1
// Step 2: First-pass deduplication via the configured provider
// Step 3: Quality-first consolidation via the configured provider
// Step 4: Persist a reviewable proposal without changing memory truth
//
// 2026-06-02 changes:
//   F3: chatId param renamed to userId; D1 queries now use user_id
//       column for per-user isolation (matches rest of codebase).
// 2026-07-31 changes:
//   Destructive replacement was removed. Sol now creates evidence-cited,
//   reviewable proposals behind a disabled-by-default containment gate.
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

interface ConsolidationProposal {
	action: 'merge' | 'supersede' | 'keep';
	source_ids: number[];
	category: string;
	fact: string;
	importance: number;
}

const CONSOLIDATION_SCHEMA: Record<string, unknown> = {
	type: 'object',
	properties: {
		proposals: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					action: { type: 'string', enum: ['merge', 'supersede', 'keep'] },
					source_ids: { type: 'array', items: { type: 'integer' }, minItems: 1 },
					category: { type: 'string' },
					fact: { type: 'string' },
					importance: { type: 'integer', minimum: 1, maximum: 3 },
				},
				required: ['action', 'source_ids', 'category', 'fact', 'importance'],
				additionalProperties: false,
			},
		},
	},
	required: ['proposals'],
	additionalProperties: false,
};

export class MemoryConsolidationWorkflow extends WorkflowEntrypoint<Env, ConsolidationParams> {
	async run(event: WorkflowEvent<ConsolidationParams>, step: WorkflowStep) {
		if (this.env.MEMORY_CONSOLIDATION_ENABLED !== 'true') {
			return { status: 'disabled', reason: 'Governed-memory containment gate' };
		}
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

		// Step 2: inexpensive first-pass deduplication reduces proposal tokens.
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

		// Step 3: Quality-first consolidation proposal (expensive, retryable)
		const consolidated = await step.do('ai-consolidation', {
			retries: { limit: 3, delay: '10 seconds', backoff: 'exponential' },
			timeout: '120 seconds',
		}, async () => {
			const validSourceIds = new Set(dedupedMemories.map(memory => memory.id));
			const rawText = dedupedMemories
				.map(m => `[id=${m.id}] [${m.category}] ${m.fact} (Score: ${m.importance_score})`)
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

Each proposal must cite one or more source IDs from the supplied list. Do not
invent a fact that is not fully supported by those cited sources.

Return ONLY this JSON object:
{"proposals":[{"action":"merge","source_ids":[12,15],"category":"preference","fact":"...","importance":1}]}
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
						systemInstruction: 'Return only evidence-cited consolidation proposals. Never modify memory truth.',
						thinkingLevel: 'MEDIUM',
						responseSchema: {
							name: 'eukara_memory_consolidation_proposal',
							schema: CONSOLIDATION_SCHEMA,
						},
					},
				);
				return parseConsolidationProposals(response.text, validSourceIds);
			}

			const { GoogleGenAI } = await import('@google/genai');
			const ai = new GoogleGenAI({ apiKey: this.env.GEMINI_API_KEY });

			const response = await ai.models.generateContent({
				model: CF_MODELS.chat,
				contents: prompt,
				config: { thinkingConfig: { thinkingLevel: 'MEDIUM' as any } },
			});

			return parseConsolidationProposals(response.text ?? '', validSourceIds);
		});

		if (!consolidated.length) {
			return { status: 'failed', reason: 'Consolidation returned empty' };
		}

		// Step 4: Persist only a reviewable proposal. The deterministic id makes
		// retries idempotent. No memory or evidence rows are deleted or replaced.
		const proposalId = `consolidation:${event.instanceId}`;
		await step.do('write-consolidation-proposal', async () => {
			await this.env.DB.prepare(`
				INSERT OR IGNORE INTO memory_consolidation_proposals (
					id, user_id, source_memory_ids, proposals_json, status, model
				) VALUES (?, ?, ?, ?, 'pending', ?)
			`).bind(
				proposalId,
				userId,
				JSON.stringify(allMemories.map(memory => memory.id)),
				JSON.stringify(consolidated),
				getAIProviderMode(this.env) === 'openai'
					? OPENAI_MODELS.consolidation
					: CF_MODELS.chat,
			).run();
		});

		return {
			status: 'proposal_created',
			proposalId,
			before: allMemories.length,
			afterDedup: dedupedMemories.length,
			afterConsolidation: consolidated.length,
		};
	}
}

/**
 * Validate provider JSON before it becomes a reviewable proposal.
 */
function parseConsolidationProposals(
	text: string,
	validSourceIds: Set<number>,
): ConsolidationProposal[] {
	const match = text.match(/\{[\s\S]*\}/);
	if (!match) return [];

	try {
		const parsed = JSON.parse(match[0]) as { proposals?: unknown };
		if (!Array.isArray(parsed.proposals)) return [];
		return parsed.proposals.flatMap((item): ConsolidationProposal[] => {
			if (!item || typeof item !== 'object') return [];
			const candidate = item as Record<string, unknown>;
			if (typeof candidate.fact !== 'string' || !candidate.fact.trim()) return [];
			if (!['merge', 'supersede', 'keep'].includes(String(candidate.action))) return [];
			if (!Array.isArray(candidate.source_ids)) return [];
			const sourceIds = [...new Set(candidate.source_ids.map(Number))];
			if (!sourceIds.length || sourceIds.some(id => !Number.isInteger(id) || !validSourceIds.has(id))) {
				return [];
			}
			const importance = Number(candidate.importance);
			return [{
				action: candidate.action as ConsolidationProposal['action'],
				source_ids: sourceIds,
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
