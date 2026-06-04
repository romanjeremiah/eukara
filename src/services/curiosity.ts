// ============================================================
// Curiosity Service - autonomous interest-driven research
//
// Background producer for the spontaneous-outreach loop. Twice a
// week it derives a research topic from the user's own memories
// (interests, ideas, preferences), runs ONE grounded Gemini search
// for a concrete recent item, and saves it as a `discovery` memory
// with the source link retained.
//
// Decoupling: this only WRITES discovery memories. The consumer is
// the spontaneous_outreach queue task (router/queue.ts), which reads
// casual memories + discoveries and surfaces one casually. Research
// and surfacing are independent and time-shifted, with the memory
// table as the shared buffer. Pattern lifted from Xaridotis
// (gemini-bot handleAutonomousResearch), improved per the 2026-06-03
// decision: topics are memory-derived (not a hardcoded domain list)
// and the source URL is retained for verifiability.
//
// Reliability note: grounding with Google Search lowers but does not
// eliminate the chance of inaccurate output (Google's own safety
// guidance). The discovery is therefore framed tentatively when
// surfaced ("something you read", not settled fact) and always
// carries its source so the user can verify.
//
// Runs regardless of quiet hours: it produces a memory, it does not
// message the user. Quiet hours gate delivery, not research.
// ============================================================

import { log } from '../lib/logger';
import { GeminiProvider } from '../ai/gemini';
import { GEMINI_MODELS } from '../config/models';
import * as memory from './memory';

// Days (0=Sun) and local hour the research producer runs.
const RESEARCH_DAYS = [2, 5]; // Tuesday, Friday
const RESEARCH_HOUR = 4; // 04:00 local

// Memory categories that describe what the user is into. Used to
// build the interest profile fed to the grounded search. Excludes
// `discovery` (do not research our own past output) and clinical /
// therapeutic categories (care data, not interests).
const INTEREST_CATEGORIES = ['fact', 'preference', 'interest', 'idea', 'brain_dump', 'hobby', 'goal'];

// Fallback interest seeds for a user with no interest memories yet.
const DEFAULT_INTERESTS = [
	'artificial intelligence and LLM engineering',
	'consumer technology and new apps',
	'scientific discoveries (neuroscience, space, psychology)',
	'photography and drone technology',
	'fitness and exercise science',
];

/**
 * Run the autonomous research producer if the schedule matches.
 * Self-gating: returns early when the day/hour window does not match
 * or when it has already run today (KV idempotency). Called every
 * minute by the cron router; cheap on the no-op path (one KV read).
 */
export async function maybeRunResearch(env: Env, userId: number, localTime: Date): Promise<void> {
	if (!RESEARCH_DAYS.includes(localTime.getDay())) return;
	if (localTime.getHours() !== RESEARCH_HOUR || localTime.getMinutes() !== 0) return;

	const today = localTime.toISOString().split('T')[0]!;
	const key = `auto_research_${userId}_${today}`;
	if (await env.CHAT_KV.get(key)) return;
	// Set the key up front so a second cron tick in the same minute
	// cannot double-fire. 2-day TTL clears it before the next run.
	await env.CHAT_KV.put(key, '1', { expirationTtl: 86400 * 2 });

	try {
		const interests = await deriveInterests(env, userId);
		const provider = new GeminiProvider(env.GEMINI_API_KEY, GEMINI_MODELS.proPrimary);

		const prompt = `Find ONE concrete, genuinely interesting development from the last 7 days that someone with these interests would care about:

${interests}

Pick the single most interesting item. Write 2 to 3 sentences explaining what it is and why it matters. Be specific with names and what changed. Skip anything vague or older than a week. No preamble.`;

		const response = await provider.chat(
			[{ role: 'user', content: prompt }],
			undefined,
			{
				systemInstruction: 'You are a sharp research assistant surfacing one fresh, specific, genuinely interesting item. Concise and factual.',
				temperature: 0.7,
				maxTokens: 400,
				enableGrounding: true,
			},
		);

		const text = response.text?.trim();
		if (!text || text.length < 40) {
			log.info('research_skipped_thin_output', { userId });
			return;
		}

		// Retain the first grounding source URL so the discovery can be
		// surfaced with a verifiable link.
		const source = extractFirstSource(response._groundingMetadata);
		const fact = source ? `Research: ${text} [source: ${source}]` : `Research: ${text}`;

		await memory.saveMemory(env, userId, 'discovery', fact, 1);
		log.info('research_saved', { userId, hasSource: !!source, len: text.length });
	} catch (e) {
		log.warn('research_failed', { userId, msg: (e as Error).message });
	}
}

/**
 * Build a short interest profile from the user's memories. Falls back
 * to a small default seed list when the user has no interest memories
 * yet (brand-new user). Returns a newline-bulleted string.
 */
async function deriveInterests(env: Env, userId: number): Promise<string> {
	const all = await memory.getMemories(env, userId, 60).catch(() => []);
	const interests = all
		.filter(m => INTEREST_CATEGORIES.includes(m.category))
		.map(m => m.fact)
		.filter(Boolean)
		.slice(0, 12);

	const lines = interests.length ? interests : DEFAULT_INTERESTS;
	return lines.map(l => `- ${l}`).join('\n');
}

/**
 * Extract the first web source URL from Gemini grounding metadata.
 * Returns null when no grounded source is present. Defensive against
 * the loose shape of the metadata (groundingChunks: Array<{web:{uri}}>).
 */
function extractFirstSource(metadata: unknown): string | null {
	const chunks = (metadata as { groundingChunks?: Array<{ web?: { uri?: string } }> } | undefined)?.groundingChunks;
	if (!chunks?.length) return null;
	for (const chunk of chunks) {
		const uri = chunk?.web?.uri;
		if (uri) return uri;
	}
	return null;
}
