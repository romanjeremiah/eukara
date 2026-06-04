// ============================================================
// Model Configuration
//
// Central model registry for all AI providers.
// Gateway config routes all CF AI calls through AI Gateway
// for analytics, caching, and rate limiting.
// ============================================================

/** AI Gateway configuration - routes all CF AI calls for observability */
export const AI_GATEWAY = { id: 'eukara', skipCache: false, cacheTtl: 300 } as const;

/**
 * Cloudflare Workers AI models. Note: Gemma 4 and Kimi K2.6 are PAID
 * (verify pricing on the CF dashboard before changes). Embeddings,
 * reranker, observation, tagging are typically within the free
 * neuron budget. CORRECTION 2026-06-02 — earlier comment "free tier"
 * was inaccurate.
 */
export const CF_MODELS = {
	chat: '@cf/google/gemma-4-26b-a4b-it',
	code: '@cf/qwen/qwen3-30b-a3b-fp8',
	observation: '@cf/meta/llama-3.1-8b-instruct',
	tagging: '@cf/meta/llama-3.2-1b-instruct',
	dedup: '@cf/zai-org/glm-4.7-flash',
	embedding: '@cf/qwen/qwen3-embedding-0.6b',
	reranker: '@cf/baai/bge-reranker-base',
	stt: '@cf/deepgram/nova-3',
	// Pro-tier fallback when both Gemini Pro and Gemini Flash-Lite fail.
	// Chosen for long-context conversational nuance on emotional/clinical
	// turns (1T params, reasoning model). PAID: $0.95/M input,
	// $0.16/M cached input, $4.00/M output (per CF docs 2026-05-16).
	// Context window 262,144 tokens.
	fallbackPro: '@cf/moonshotai/kimi-k2.6',
} as const;

/**
 * Gemini models (paid, used for complex/emotional/therapeutic).
 *
 * 2026-06-04: cascade reorder. The 2026-06-02 layout put
 * `gemini-pro-latest` at Tier 1 for quality, but Google-side
 * instability (90s timeouts, 503 UNAVAILABLE under load) made it
 * a slow door for every Pro-lane turn. Reordered to flash-first.
 *
 * Tier 1 (primary):  `gemini-3.5-flash` — same 3.x family,
 *                    supports tool combination (custom tools +
 *                    Google Search on one call) and multimodal.
 *                    Fast, reliable. Handles the vast majority of
 *                    Pro-lane turns by itself.
 * Tier 2 (fallback): `gemini-pro-latest` — deeper reasoning when
 *                    flash isn't enough or when flash itself fails.
 *                    Promoted from primary to fallback so its
 *                    instability no longer taxes every turn.
 * Tier 3 (fallback): `@cf/google/gemma-4-26b` — Cloudflare edge
 *                    GPU. Cross-provider resilience: if all-Google
 *                    is down (rare but real), CF still works.
 *                    Different infrastructure entirely.
 * Tier 4 (fallback): `gemini-3.1-flash-lite` — deepest Gemini
 *                    fallback. Small, cheap, multimodal, supports
 *                    function calling + search grounding. Google
 *                    themselves use it as a router-classifier in
 *                    Gemini CLI, validating it as a reliable
 *                    last-resort that can still call tools.
 *
 * Per-tier timeouts (wall-clock via Promise.race in message.ts):
 *   Tier 1 (flash):       30s — fast, anything longer is unhealthy
 *   Tier 2 (pro-latest):  60s — reasoning takes longer; tolerate it
 *   Tier 3 (gemma):       30s — edge GPU, never slow
 *   Tier 4 (flash-lite):  30s — small model, fast by design
 *
 * Worst case 150s. Inside the queue consumer 15-min wall-clock
 * budget with room to spare.
 *
 * Other slots (unchanged):
 *   - image: Nano Banana 2 (gemini-3.1-flash-image), STABLE.
 *   - tts: dead config — lib/tts.ts uses Google Cloud TTS
 *     (Chirp3-HD voice) directly. Kept for future migration.
 */
export const GEMINI_MODELS = {
	/** Tier 1 (primary) for Pro lane. Low-latency multimodal. */
	proPrimary: 'gemini-3.5-flash',
	/** Tier 2 (fallback). Deeper reasoning when needed. */
	proLatest: 'gemini-pro-latest',
	/** Tier 4 (deep fallback). Cost-effective, multimodal, tool-capable. */
	flashLite: 'gemini-3.1-flash-lite',
	image: 'gemini-3.1-flash-image',
	tts: 'gemini-2.5-pro-preview-tts',
} as const;

/** Complexity detection patterns */
export const COMPLEXITY_PATTERNS = {
	code: /\b(code|debug|function|class|api|typescript|javascript|python|regex|algorithm|sql|css|html|deploy|refactor|error|bug|fix)\b/i,
	analytical: /\b(compare|analyse|analyze|evaluate|research|explain|calculate|estimate|statistics|data|report|review)\b/i,
	emotional: /\b(anxious|depressed|panic|overwhelm|scared|lonely|empty|hopeless|angry|frustrated|sad|grief|trigger|manic|racing|numb|crying|breakdown|struggling|worried|stressed)\b/i,
} as const;
