// ============================================================
// AI Model Router
//
// Decides which provider + model to use for each message.
// Routes ~80% of traffic to free CF AI, reserves Gemini
// for irreplaceable capabilities.
// ============================================================

import type { AIProvider, ModelRoute, TaskComplexity } from '../types/ai';
import { CF_MODELS, GEMINI_MODELS, COMPLEXITY_PATTERNS } from '../config/models';
import { CloudflareProvider } from './cloudflare';
import { GeminiProvider } from './gemini';
import { log } from '../lib/logger';

export interface RouterContext {
	userText: string;
	isOwner: boolean;
	healthCheckinActive?: string | null;
	hasMedia?: boolean;
}

/**
 * Detect the complexity of a user's message.
 * Returns which provider + model + thinking level to use.
 */
export function routeMessage(ctx: RouterContext): ModelRoute {
	const { userText, healthCheckinActive } = ctx;

	// Active health check-in: needs Gemini Pro for therapeutic depth
	if (healthCheckinActive) {
		return {
			provider: 'gemini',
			model: GEMINI_MODELS.pro,
			thinkingEffort: 'high',
			reason: 'active_health_checkin',
		};
	}

	// Emotional / therapeutic messages: Gemini Pro
	if (COMPLEXITY_PATTERNS.emotional.test(userText)) {
		return {
			provider: 'gemini',
			model: GEMINI_MODELS.pro,
			thinkingEffort: 'medium',
			reason: 'emotional_content',
		};
	}

	// Code / architecture: Qwen3 30B on CF AI (free, strong reasoning)
	if (COMPLEXITY_PATTERNS.code.test(userText) || COMPLEXITY_PATTERNS.codeBlock.test(userText)) {
		return {
			provider: 'cloudflare',
			model: CF_MODELS.reasoning,
			thinkingEffort: 'high',
			reason: 'code_content',
		};
	}

	// Analytical requests: Qwen3 30B on CF AI
	if (COMPLEXITY_PATTERNS.analytical.test(userText)) {
		return {
			provider: 'cloudflare',
			model: CF_MODELS.reasoning,
			thinkingEffort: 'medium',
			reason: 'analytical_content',
		};
	}

	// Long messages (>300 chars): bump to reasoning model
	if (userText.length > 300) {
		return {
			provider: 'cloudflare',
			model: CF_MODELS.reasoning,
			thinkingEffort: 'medium',
			reason: 'long_message',
		};
	}

	// Default: Gemma 4 on CF AI (free, fast)
	return {
		provider: 'cloudflare',
		model: CF_MODELS.chat,
		thinkingEffort: 'low',
		reason: 'default_casual',
	};
}

/**
 * Create the appropriate AI provider based on the route.
 */
export function createProvider(route: ModelRoute, env: Env): AIProvider {
	if (route.provider === 'gemini') {
		return new GeminiProvider(env.GEMINI_API_KEY, route.model);
	}
	return new CloudflareProvider(env.AI, route.model);
}

/**
 * Convenience: route + create in one call.
 */
export function getProvider(ctx: RouterContext, env: Env): { provider: AIProvider; route: ModelRoute } {
	const route = routeMessage(ctx);
	const provider = createProvider(route, env);

	if (route.provider !== 'cloudflare' || route.reason !== 'default_casual') {
		log.info('model_route', {
			provider: route.provider,
			model: route.model,
			thinking: route.thinkingEffort,
			reason: route.reason,
		});
	}

	return { provider, route };
}
