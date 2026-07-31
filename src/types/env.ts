// ============================================================
// Environment Augmentation
//
// Secrets and env vars not in wrangler.jsonc but set via
// `wrangler secret put`. This extends the auto-generated Env
// from worker-configuration.d.ts.
// ============================================================

declare global {
	interface Env {
		// Secrets (set via `wrangler secret put`)
		TELEGRAM_TOKEN: string;
		TELEGRAM_WEBHOOK_SECRET: string;
		GEMINI_API_KEY: string;
		OPENAI_API_KEY?: string;
		OWNER_ID: string;
		TAVILY_API_KEY?: string;
		GITHUB_TOKEN?: string;
		GCP_TTS_API_KEY?: string;
		AI_PROVIDER_MODE: 'cloudflare' | 'openai';
		MEMORY_CONSOLIDATION_ENABLED: 'true' | 'false';
		GOVERNED_MEMORY_CAPTURE_ENABLED: 'true' | 'false';
		GOVERNED_MEMORY_RECALL_ENABLED: 'true' | 'false';
		GOVERNED_MEMORY_PROJECTION_ENABLED: 'true' | 'false';

		// Workflow bindings (auto-generated types may lag behind wrangler.jsonc)
		MEMORY_WORKFLOW: Workflow;
		RESEARCH_WORKFLOW: Workflow;
		ARCHITECT_WORKFLOW: Workflow;
		VECTORIZE_OPENAI: VectorizeIndex;
	}
}

export {};
