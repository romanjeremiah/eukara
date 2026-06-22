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
	chat: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
	code: '@cf/moonshotai/kimi-k2.7-code',
	observation: '@cf/meta/llama-3.2-3b-instruct',
	tagging: '@cf/meta/llama-3.2-1b-instruct',
	dedup: '@cf/zai-org/glm-4.7-flash',
	embedding: '@cf/qwen/qwen3-embedding-0.6b',
	reranker: '@cf/baai/bge-reranker-base',
	stt: '@cf/deepgram/nova-3',
	vision: '@cf/llava-hf/llava-1.5-7b-hf',
	// Fallback when primary chat fails.
	fallbackPro: '@cf/moonshotai/kimi-k2.7-code',
} as const;
