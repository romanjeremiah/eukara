// ============================================================
// Background AI Tasks
//
// Lightweight CF AI calls for non-user-facing processing.
// Uses the cheapest models within the free neuron budget.
// ============================================================

import { CF_MODELS } from '../config/models';
import { log } from '../lib/logger';

/**
 * Run a simple text generation on a CF AI model.
 */
async function generate(
	ai: Ai,
	model: string,
	prompt: string,
	system?: string
): Promise<string | null> {
	try {
		const messages: Array<{ role: string; content: string }> = [];
		if (system) messages.push({ role: 'system', content: system });
		messages.push({ role: 'user', content: prompt });

		const result = await ai.run(model as unknown as keyof AiModels, {
			messages,
			max_tokens: 512,
		}) as { response?: string } | string;

		if (typeof result === 'string') return result;
		return result?.response ?? null;
	} catch (err) {
		const error = err as Error;
		log.error('bg_ai_error', { model, msg: error.message });
		return null;
	}
}

/**
 * Extract observations + triples from a conversation exchange.
 * Replaces Gemini Flash for silent observation.
 * ~13 neurons per call.
 */
export async function extractObservation(
	ai: Ai,
	userText: string,
	botResponse: string
): Promise<string | null> {
	return generate(ai, CF_MODELS.observation,
		`You observed this exchange:
USER: ${userText.slice(0, 400)}
BOT: ${botResponse.slice(0, 300)}

Did you learn anything NEW about this person? Look for:
- Implicit preferences not stated directly
- Behavioural patterns
- New interests, goals, or life events
- Emotional patterns

If yes, respond with ONLY: OBSERVATION: [your observation]

Also extract relational connections as triples.
Format: TRIPLE: Subject | Predicate | Object
Examples: TRIPLE: Roman | enjoys | Coffee, TRIPLE: Gym | reduces | Anxiety

If nothing new, respond: NOTHING_NEW`,
		'You are a silent observer. Be concise. Only note genuinely new information.'
	);
}

/**
 * Tag a mood entry with clinical categories.
 * ~5 neurons per call.
 */
export async function tagMoodEntry(
	ai: Ai,
	score: number,
	emotions: string[],
	note?: string
): Promise<string | null> {
	return generate(ai, CF_MODELS.classify,
		`Mood score: ${score}/10. Emotions: ${emotions.join(', ')}. Note: ${(note ?? 'none').slice(0, 200)}.

Tag this entry with 1-3 clinical categories from this list:
depressive_episode, anxiety_state, hypomanic_signs, stable_baseline, mixed_state, crisis_risk, productive_phase, social_withdrawal, sleep_disruption, medication_response

Respond with ONLY the tags, comma-separated.`,
		'You are a clinical tagger. Return only tags, no explanation.'
	);
}

/**
 * First-pass memory deduplication before Gemini Pro consolidation.
 * ~25 neurons per call.
 */
export async function deduplicateMemories(
	ai: Ai,
	memories: Array<{ id: number; category: string; fact: string; importance_score: number }>
): Promise<{ groups: Array<{ label: string; indices: number[] }>; duplicates: Array<[number, number]> }> {
	if (!memories.length) return { groups: [], duplicates: [] };

	const list = memories.map((m, i) => `[${i}] [${m.category}] ${m.fact}`).join('\n');

	const result = await generate(ai, CF_MODELS.summarise,
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
