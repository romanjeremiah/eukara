// ============================================================
// Background AI Tasks
//
// Lightweight provider-neutral calls for non-user-facing processing.
// Uses the lowest-cost configured model role.
//
// 2026-06-02 F2 + F6 fix: unified extractText helper that handles
// both OpenAI-compat (choices[0].message.content) and legacy native
// CF (response: string) response shapes. Previously deduplicateMemories
// silently returned null because GLM 4.7 Flash returns OpenAI-compat
// but generate() only parsed legacy.
// ============================================================

import { CF_MODELS, OPENAI_MODELS } from '../config/models';
import { log } from '../lib/logger';
import { createConfiguredProvider } from './provider-factory';

/**
 * Run a simple text generation on the configured provider model.
 */
async function generate(
	env: Env,
	models: { openai: string; cloudflare: string },
	prompt: string,
	system?: string
): Promise<string | null> {
	try {
		const provider = createConfiguredProvider(env, models);
		const result = await provider.chat(
			[{ role: 'user', content: prompt }],
			[],
			{
				systemInstruction: system,
				thinkingLevel: 'LOW',
				maxTokens: 512,
				enableGrounding: false,
			},
		);
		return result.text?.trim() || null;
	} catch (err) {
		const error = err as Error;
		log.error('bg_ai_error', { models, msg: error.message });
		return null;
	}
}

/**
 * Subconscious Processing (Domain 3 Layer G & F3).
 * Single JSON pass to extract reviewable relationship and delivery candidates.
 * Dedicated domain flows retain ownership of mood and episode data.
 */
export async function runSubconsciousProcessing(
	env: Env,
	userText: string,
	botResponse: string
): Promise<{
	triples?: string[],
	personality_traits?: string[]
} | null> {
	const result = await generate(env, {
		openai: OPENAI_MODELS.background,
		cloudflare: CF_MODELS.observation,
	},
		`You observed this exchange between USER and BOT:
USER: ${userText.slice(0, 400)}
BOT: ${botResponse.slice(0, 300)}

Perform subconscious analysis and return ONLY a valid JSON object matching this schema:
{
  "triples": ["Subject | Predicate | Object"], // Any NEW factual relational knowledge learned about the user
  "personality_traits": ["User prefers direct answers", "User uses dry humour"] // Possible delivery preferences (ONLY if directly supported by the exchange)
}

Return ONLY raw JSON. No markdown fences.`,
		'You are the subconscious processor. You output strictly JSON.'
	);

	if (!result) return null;
	try {
		// Clean any markdown fences the model might have ignored instructions to exclude
		const cleanJson = result.replace(/^```json/i, '').replace(/```$/i, '').trim();
		return JSON.parse(cleanJson);
	} catch (e) {
		log.warn('subconscious_json_parse_error', { msg: (e as Error).message, result: result.slice(0, 100) });
		return null;
	}
}

/**
 * Tag a mood entry with clinical categories.
 * ~5 neurons per call.
 */
export async function tagMoodEntry(
	env: Env,
	score: number,
	emotions: string[],
	note?: string
): Promise<string | null> {
	return generate(env, {
		openai: OPENAI_MODELS.background,
		cloudflare: CF_MODELS.tagging,
	},
		`Mood score: ${score}/5. Emotions: ${emotions.join(', ')}. Note: ${(note ?? 'none').slice(0, 200)}.

Tag this entry with 1-3 clinical categories from this list:
depressive_episode, anxiety_state, hypomanic_signs, stable_baseline, mixed_state, crisis_risk, productive_phase, social_withdrawal, sleep_disruption, medication_response

Respond with ONLY the tags, comma-separated.`,
		'You are a clinical tagger. Return only tags, no explanation.'
	);
}

/**
 * First-pass memory deduplication before durable consolidation.
 */
export async function deduplicateMemories(
	env: Env,
	memories: Array<{ id: number; category: string; fact: string; importance_score: number }>
): Promise<{ groups: Array<{ label: string; indices: number[] }>; duplicates: Array<[number, number]> }> {
	if (!memories.length) return { groups: [], duplicates: [] };

	const list = memories.map((m, i) => `[${i}] [${m.category}] ${m.fact}`).join('\n');

	const result = await generate(env, {
		openai: OPENAI_MODELS.background,
		cloudflare: CF_MODELS.dedup,
	},
		`Here are ${memories.length} stored memories. Identify:
1. DUPLICATES: memories that say the same thing (list pairs of indices)
2. GROUPS: memories that relate to the same topic (list groups of indices with a label)

MEMORIES:
${list}

Respond in this exact format:
DUPLICATES: [0,5], [3,7]
GROUP: Topic name: [1,4,8]

If no duplicates: DUPLICATES: none`,
		'You are a data organiser. Be precise with indices.'
	);

	const duplicates: Array<[number, number]> = [];
	const groups: Array<{ label: string; indices: number[] }> = [];

	if (result) {
		const dupMatch = result.match(/DUPLICATES:\s*(.+)/);
		if (dupMatch?.[1] && !dupMatch[1].includes('none')) {
			for (const p of dupMatch[1].matchAll(/\[(\d+),\s*(\d+)\]/g)) {
				duplicates.push([parseInt(p[1]!), parseInt(p[2]!)]);
			}
		}
		for (const g of result.matchAll(/GROUP:\s*(.+?):\s*\[([^\]]+)\]/g)) {
			const indices = g[2]!.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
			groups.push({ label: g[1]!.trim(), indices });
		}
	}

	return { groups, duplicates };
}
