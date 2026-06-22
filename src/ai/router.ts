// ============================================================
// AI Model Router
//
// Decides which provider + model to use for each message.
// Routes all traffic to Cloudflare Workers AI.
//
// 2026-06-22 changes:
//   - Migrated completely to Cloudflare Workers AI.
//   - Removed all Gemini fallbacks and models.
//   - Used @cf/meta/llama-3.3-70b-instruct-fp8-fast for deep reasoning.
//   - Used @cf/moonshotai/kimi-k2.7-code for code/analytical.
//   - Used @cf/llava-hf/llava-1.5-7b-hf for vision/multimodal.
// ============================================================

import type { AIProvider, ModelRoute } from '../types/ai';
import { CF_MODELS } from '../config/models';
import type { CuratorResult } from './curator';
import { CloudflareProvider } from './cloudflare';
import { log } from '../lib/logger';

export interface RouterContext {
	userText: string;
	isOwner: boolean;
	healthCheckinActive?: string | null;
	hasMedia?: boolean;
	/**
	 * Set by the webhook dispatcher (src/index.ts) after a sticky-heavy
	 * check fires. When true, routeMessage skips its regex/keyword
	 * branches and returns the heavy lane directly.
	 */
	forceHeavyLane?: boolean;
	curatorResult?: CuratorResult;
}

/**
 * Detect the complexity of a user's message.
 * Returns which provider + model + thinking level to use.
 */
export function routeMessage(ctx: RouterContext): ModelRoute {
	const { userText, healthCheckinActive, hasMedia, forceHeavyLane, curatorResult } = ctx;

	// Sticky Heavy: previous turn was Heavy and the topic classifier said
	// the new message is still in the same topic.
	if (forceHeavyLane) {
		return {
			provider: 'cloudflare',
			model: CF_MODELS.chat,
			reason: 'sticky_heavy_context',
			enableGrounding: true,
		};
	}

	// Media present: route to Cloudflare Vision model.
	if (hasMedia) {
		return {
			provider: 'cloudflare',
			model: CF_MODELS.vision,
			reason: 'multimodal_input',
			enableGrounding: false, // Vision models usually don't support grounding
		};
	}

	// Active health check-in: needs 70b reasoning model for therapeutic depth
	if (healthCheckinActive) {
		return {
			provider: 'cloudflare',
			model: CF_MODELS.chat,
			reason: 'active_health_checkin',
			enableGrounding: true,
		};
	}

	// Triage via Curator (Layer A1)
	if (curatorResult) {
		if (curatorResult.intent === 'emotional_vent' || curatorResult.intent === 'crisis') {
			return {
				provider: 'cloudflare',
				model: CF_MODELS.chat,
				reason: 'emotional_content',
				enableGrounding: true,
			};
		}

		if (curatorResult.intent === 'code') {
			return {
				provider: 'cloudflare',
				model: CF_MODELS.code,
				reason: 'code_content',
				thinkingLevel: 'HIGH',
				enableGrounding: false,
			};
		}

		if (curatorResult.intent === 'functional') {
			return {
				provider: 'cloudflare',
				model: CF_MODELS.code,
				reason: 'analytical_content',
				thinkingLevel: 'HIGH',
				enableGrounding: false,
			};
		}
	}

	// Long messages (>300 chars): bump to reasoning model
	if (userText.length > 300) {
		return {
			provider: 'cloudflare',
			model: CF_MODELS.code,
			reason: 'long_message',
			thinkingLevel: 'MEDIUM',
			enableGrounding: false,
		};
	}

	// Default: 70b Chat on CF AI.
	return {
		provider: 'cloudflare',
		model: CF_MODELS.chat,
		reason: 'default_casual',
		enableGrounding: true,
	};
}

/**
 * Cheap pre-routing predicate used by the webhook dispatcher
 * (src/index.ts) to decide whether to enqueue a message vs await
 * it inline. Mirrors routeMessage's branching but returns only
 * a boolean to indicate if it hits the "Heavy" (slower) lane.
 */
export function willHitHeavyLane(
	hasMedia: boolean,
	healthCheckinActive: string | null,
	curatorResult?: CuratorResult,
): boolean {
	if (hasMedia) return true;
	if (healthCheckinActive) return true;
	if (curatorResult && (curatorResult.intent === 'emotional_vent' || curatorResult.intent === 'crisis' || curatorResult.intent === 'code' || curatorResult.intent === 'functional')) return true;
	return false;
}

/**
 * Create the appropriate AI provider based on the route.
 */
export function createProvider(route: ModelRoute, env: Env): AIProvider {
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
			reason: route.reason,
			grounding: route.enableGrounding ?? false,
		});
	}

	return { provider, route };
}
