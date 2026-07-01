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
	// 2026-07-01 migration: conversational + code lanes moved from
	// llama-3.3-70b / kimi-k2.7-code to OpenAI's gpt-oss-120b. gpt-oss is
	// wired through the dedicated adapter branch in ai/cloudflare.ts (Chat
	// Completions `messages` in via env.AI.run, tolerant Responses-style
	// output parsing). Ref:
	// https://developers.cloudflare.com/workers-ai/models/gpt-oss-120b/
	chat: '@cf/openai/gpt-oss-120b',
	code: '@cf/openai/gpt-oss-120b',
	// Grounded lane. gpt-oss has NO native web search, so the paths that
	// need live, sourced facts (curiosity research, weekly report, and the
	// grounded fallback for conversation) run on Gemma, the only
	// grounding-capable model here (accepts web_search_options). Kept
	// separate from `chat` so grounding survives the gpt-oss migration.
	grounded: '@cf/google/gemma-4-26b-a4b-it',
	// Hot-path / background helpers stay on small, fast models (per the
	// 2026-07-01 decision): triage runs on every inbound message, so a
	// 120B model there would add latency and cost to every turn.
	observation: '@cf/meta/llama-3.2-3b-instruct',
	tagging: '@cf/meta/llama-3.2-1b-instruct',
	dedup: '@cf/zai-org/glm-4.7-flash',
	// Non-text models — physically cannot run on a text-only LLM, unchanged.
	embedding: '@cf/qwen/qwen3-embedding-0.6b',
	reranker: '@cf/baai/bge-reranker-base',
	stt: '@cf/deepgram/nova-3',
	vision: '@cf/llava-hf/llava-1.5-7b-hf',
	// Cross-model fallback when the primary gpt-oss chat call fails.
	fallbackPro: '@cf/google/gemma-4-26b-a4b-it',
} as const;
