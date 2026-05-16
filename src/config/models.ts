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
 * 2026-06-02 (afternoon, post-timeout debugging): cascade reorder.
 * Tier 1 now `gemini-pro-latest` (auto-aliased to Google's latest
 * stable Pro) for highest-quality emotional/therapeutic turns.
 * Tier 2 stays `gemini-3.5-flash` (same family for thoughtSignature
 * continuity, much faster). Tier 3 is Gemma on CF (different
 * infrastructure, no Google dependency, very fast).
 *
 * Pattern lifted from Xaridotis B2C cascade (gemini-bot/src/config/
 * cascades.js LAYER_B2C_TIERS) minus the OpenAI / Anthropic middle
 * tiers (Eukara doesn't have those providers wired).
 *
 * Per-tier timeouts (wall-clock via Promise.race in message.ts):
 *   Tier 1 (proLatest):  90s — heavyweight, grounding + tools + thinking
 *   Tier 2 (flash):      45s — same family, faster
 *   Tier 3 (gemma):      30s — edge GPU, should never exceed
 *
 * Other slots:
 *   - flashLite: kept as alias for callers that want "fast Gemini".
 *     Currently also points at gemini-3.5-flash (same as flash).
 *   - flash: retired in earlier rewrite; not reintroduced. Use
 *     proLatest, flashLite, or image.
 *   - image: Nano Banana 2 (gemini-3.1-flash-image), STABLE.
 *   - tts: currently dead config — lib/tts.ts uses Google Cloud TTS
 *     (Chirp3-HD voice) directly. Kept for future migration.
 */
export const GEMINI_MODELS = {
	// Cascade order for emotional / Pro-lane turns.
	proLatest: 'gemini-pro-latest',
	pro: 'gemini-3.5-flash',
	flashLite: 'gemini-3.5-flash',
	image: 'gemini-3.1-flash-image',
	tts: 'gemini-2.5-pro-preview-tts',
} as const;

/** Complexity detection patterns */
export const COMPLEXITY_PATTERNS = {
	code: /\b(code|debug|function|class|api|typescript|javascript|python|regex|algorithm|sql|css|html|deploy|refactor|error|bug|fix)\b/i,
	analytical: /\b(compare|analyse|analyze|evaluate|research|explain|calculate|estimate|statistics|data|report|review)\b/i,
	emotional: /\b(anxious|depressed|panic|overwhelm|scared|lonely|empty|hopeless|angry|frustrated|sad|grief|trigger|manic|racing|numb|crying|breakdown|struggling|worried|stressed)\b/i,
} as const;
