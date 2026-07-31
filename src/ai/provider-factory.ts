// ============================================================
// AI Provider Factory
//
// Centralises the staged provider switch so application services do not
// construct provider clients or read provider secrets independently.
// ============================================================

import type { AIProvider, ModelRoute } from '../types/ai';
import { CloudflareProvider } from './cloudflare';
import { OpenAIProvider } from './openai';

export type AIProviderMode = 'cloudflare' | 'openai';

/**
 * Resolve the configured provider mode. Unknown values fail safely to the
 * currently deployed Cloudflare path during migration.
 */
export function getAIProviderMode(env: Env): AIProviderMode {
	return env.AI_PROVIDER_MODE === 'openai' ? 'openai' : 'cloudflare';
}

/**
 * Create an OpenAI provider only when the Worker secret is configured.
 */
export function createOpenAIProvider(env: Env, model: string): OpenAIProvider {
	if (!env.OPENAI_API_KEY) {
		throw new Error(
			'OPENAI_API_KEY is required when AI_PROVIDER_MODE is "openai"',
		);
	}
	return new OpenAIProvider(env.OPENAI_API_KEY, model);
}

/**
 * Create a provider for a chat-router decision.
 */
export function createRouteProvider(route: ModelRoute, env: Env): AIProvider {
	if (route.provider === 'openai') {
		return createOpenAIProvider(env, route.model);
	}
	return new CloudflareProvider(env.AI, route.model);
}

/**
 * Create the provider for a fixed workload role while preserving the
 * Cloudflare implementation until the migration switch is enabled.
 */
export function createConfiguredProvider(
	env: Env,
	models: { openai: string; cloudflare: string },
): AIProvider {
	return getAIProviderMode(env) === 'openai'
		? createOpenAIProvider(env, models.openai)
		: new CloudflareProvider(env.AI, models.cloudflare);
}
