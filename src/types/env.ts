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
		GEMINI_API_KEY: string;
		OWNER_ID: string;
		TAVILY_API_KEY?: string;
		GITHUB_TOKEN?: string;
	}
}

export {};
