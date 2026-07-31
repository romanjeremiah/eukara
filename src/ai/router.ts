// ============================================================
// AI Model Router
//
// Decides which provider + model to use for each message.
// Routes to the selected provider while the OpenAI migration flag remains
// disabled by default.
//
// 2026-06-22 changes:
//   - Migrated completely to Cloudflare Workers AI.
//   - Removed all Gemini fallbacks and models.
//   - Used @cf/meta/llama-3.3-70b-instruct-fp8-fast for deep reasoning.
//   - Used @cf/moonshotai/kimi-k2.7-code for code/analytical.
//   - Used @cf/llava-hf/llava-1.5-7b-hf for vision/multimodal.
// ============================================================

import type { AIProvider, ModelRoute } from '../types/ai';
import { CF_MODELS, OPENAI_MODELS } from '../config/models';
import type { CuratorResult } from './curator';
import {
	createRouteProvider,
	getAIProviderMode,
	type AIProviderMode,
} from './provider-factory';
import { log } from '../lib/logger';

export type { AIProviderMode } from './provider-factory';

export interface RouterContext {
	userText: string;
	isOwner: boolean;

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
export function routeMessage(
	ctx: RouterContext,
	providerMode: AIProviderMode = 'cloudflare',
): ModelRoute {
	const { userText, hasMedia, forceHeavyLane, curatorResult } = ctx;
	const provider = providerMode;
	const models = providerMode === 'openai'
		? {
			chat: OPENAI_MODELS.chat,
			code: OPENAI_MODELS.tools,
			vision: OPENAI_MODELS.vision,
		}
		: CF_MODELS;

	// Sticky Heavy: previous turn was Heavy and the topic classifier said
	// the new message is still in the same topic.
	if (forceHeavyLane) {
		return {
			provider,
			model: models.chat,
			reason: 'sticky_heavy_context',
			enableGrounding: true,
		};
	}

	// Media present: route to the selected provider's vision-capable model.
	if (hasMedia) {
		return {
			provider,
			model: models.vision,
			reason: 'multimodal_input',
			enableGrounding: false, // Vision models usually don't support grounding
		};
	}


	// Triage via Curator (Layer A1)
	if (curatorResult) {
		if (curatorResult.intent === 'emotional_vent' || curatorResult.intent === 'crisis') {
			return {
				provider,
				model: models.chat,
				reason: 'emotional_content',
				enableGrounding: true,
			};
		}

		if (curatorResult.intent === 'code') {
			return {
				provider,
				model: models.code,
				reason: 'code_content',
				thinkingLevel: 'HIGH',
				enableGrounding: false,
			};
		}

		if (curatorResult.intent === 'functional') {
			return {
				provider,
				model: models.code,
				reason: 'analytical_content',
				thinkingLevel: 'HIGH',
				enableGrounding: false,
			};
		}
	}

	// Long messages (>300 chars): bump to reasoning model
	if (userText.length > 300) {
		return {
			provider,
			model: models.code,
			reason: 'long_message',
			thinkingLevel: 'MEDIUM',
			enableGrounding: false,
		};
	}

	// Default: the selected provider's main conversation model.
	return {
		provider,
		model: models.chat,
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
	curatorResult?: CuratorResult,
): boolean {
	if (hasMedia) return true;

	if (curatorResult && (curatorResult.intent === 'emotional_vent' || curatorResult.intent === 'crisis' || curatorResult.intent === 'code' || curatorResult.intent === 'functional')) return true;
	return false;
}

/**
 * Create the appropriate AI provider based on the route.
 */
export function createProvider(route: ModelRoute, env: Env): AIProvider {
	return createRouteProvider(route, env);
}

/**
 * Convenience: route + create in one call.
 */
export function getProvider(ctx: RouterContext, env: Env): { provider: AIProvider; route: ModelRoute } {
	const providerMode = getAIProviderMode(env);
	const route = routeMessage(ctx, providerMode);
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
