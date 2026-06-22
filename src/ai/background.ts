// ============================================================
// Background AI Tasks
//
// Lightweight CF AI calls for non-user-facing processing.
// Uses the cheapest models within the free neuron budget.
//
// 2026-06-02 F2 + F6 fix: unified extractText helper that handles
// both OpenAI-compat (choices[0].message.content) and legacy native
// CF (response: string) response shapes. Previously deduplicateMemories
// silently returned null because GLM 4.7 Flash returns OpenAI-compat
// but generate() only parsed legacy.
// ============================================================

import { CF_MODELS } from '../config/models';
import { log } from '../lib/logger';
import { runAI } from '../lib/ai-gateway';

/**
 * Extract text from a CF AI response, handling both response shapes:
 *   - OpenAI-compat: choices[0].message.content (Gemma, GLM, Kimi, Qwen3)
 *   - Legacy native: response: string (Llama 3.x and earlier)
 * Returns null if neither shape matches or the text is empty.
 */
function extractText(result: unknown): string | null {
	if (typeof result === 'string') return result || null;
	if (!result || typeof result !== 'object') return null;

	// OpenAI-compat first (newer schema).
	const openAi = (result as { choices?: Array<{ message?: { content?: unknown } }> }).choices;
	if (Array.isArray(openAi) && openAi.length) {
		const content = openAi[0]?.message?.content;
		if (typeof content === 'string' && content.trim()) return content;
	}

	// Legacy native
	const legacy = (result as { response?: unknown }).response;
	if (typeof legacy === 'string' && legacy.trim()) return legacy;

	return null;
}

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

		const result = await runAI<unknown>(
			ai,
			model as unknown as keyof AiModels,
			{ messages, max_tokens: 512 }
		);

		return extractText(result);
	} catch (err) {
		const error = err as Error;
		log.error('bg_ai_error', { model, msg: error.message });
		return null;
	}
}

/**
 * Subconscious Processing (Domain 3 Layer G & F3).
 * Single JSON pass to extract memory, mood, personality evolution, and episode tracking.
 * We use the faster, cheaper 3b reasoning model for this background task.
 */
export async function runSubconsciousProcessing(
	ai: Ai,
	userText: string,
	botResponse: string
): Promise<{
	triples?: string[],
	mood_score?: number,
	emotions?: string[],
	personality_traits?: string[],
	episode_topic?: string
} | null> {
	const result = await generate(ai, CF_MODELS.observation,
		`You observed this exchange between USER and BOT:
USER: ${userText.slice(0, 400)}
BOT: ${botResponse.slice(0, 300)}

Perform subconscious analysis and return ONLY a valid JSON object matching this schema:
{
  "triples": ["Subject | Predicate | Object"], // Any NEW factual relational knowledge learned about the user
  "mood_score": 5, // Estimated 1-10 mood of the user based on text (1=crisis, 10=ecstatic)
  "emotions": ["anxious", "tired"], // 1-3 emotions detected in user
  "personality_traits": ["User prefers direct answers", "User uses dark humor"], // How the BOT should evolve its personality to match user preferences (ONLY if a shift is detected)
  "episode_topic": "Debugging code" // The current micro-topic
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
	ai: Ai,
	score: number,
	emotions: string[],
	note?: string
): Promise<string | null> {
	return generate(ai, CF_MODELS.tagging,
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

	const result = await generate(ai, CF_MODELS.dedup,
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
