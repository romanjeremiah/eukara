// ============================================================
// Model Configuration
//
// Central model registry for all AI providers.
// Gateway config routes all CF AI calls through AI Gateway
// for analytics, caching, and rate limiting.
// ============================================================

/** AI Gateway configuration - routes all CF AI calls for observability */
export const AI_GATEWAY = { id: 'eukara', skipCache: false, cacheTtl: 300 } as const;

/** Cloudflare Workers AI models (free tier) */
export const CF_MODELS = {
	chat: '@cf/google/gemma-4-26b-a4b-it',
	code: '@cf/qwen/qwen3-30b-a3b-fp8',
	observation: '@cf/meta/llama-3.1-8b-instruct',
	tagging: '@cf/meta/llama-3.2-1b-instruct',
	dedup: '@cf/zai-org/glm-4.7-flash',
	embedding: '@cf/qwen/qwen3-embedding-0.6b',
	reranker: '@cf/baai/bge-reranker-base',
	stt: '@cf/deepgram/nova-3',
} as const;

/** Gemini models (paid, used for complex/emotional/therapeutic) */
export const GEMINI_MODELS = {
	pro: 'gemini-2.5-pro',
	flash: 'gemini-3-flash-preview',
	image: 'gemini-2.5-flash-image',
	tts: 'gemini-2.5-pro-preview-tts',
} as const;

/** Complexity detection patterns */
export const COMPLEXITY_PATTERNS = {
	code: /\b(code|debug|function|class|api|typescript|javascript|python|regex|algorithm|sql|css|html|deploy|refactor|error|bug|fix)\b/i,
	analytical: /\b(compare|analyse|analyze|evaluate|research|explain|calculate|estimate|statistics|data|report|review)\b/i,
	emotional: /\b(anxious|depressed|panic|overwhelm|scared|lonely|empty|hopeless|angry|frustrated|sad|grief|trigger|manic|racing|numb|crying|breakdown|struggling|worried|stressed)\b/i,
} as const;
