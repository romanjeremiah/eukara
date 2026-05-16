// ============================================================
// AI Model Router
//
// Decides which provider + model to use for each message.
// Routes ~80% of traffic to free CF AI, reserves Gemini
// for irreplaceable capabilities.
//
// 2026-06-02 changes:
//   - Pro slot is now gemini-3.5-flash (Gemini 3 family). Supports
//     tool combination so custom tools + Google Search coexist on
//     the same call.
//   - enableGrounding=true on Gemma default_casual and on all Gemini
//     Pro routes. Model decides per-turn whether to actually search;
//     billing is per-query, not per-turn.
//   - default_casual no longer sets thinkingEffort='low' (F7). The
//     model's natural default applies.
//   - TaskComplexity widened to include 'minimal' for symmetry with
//     the Gemini thinkingLevel scale.
// ============================================================

import type { AIProvider, ModelRoute } from '../types/ai';
import { CF_MODELS, GEMINI_MODELS, COMPLEXITY_PATTERNS } from '../config/models';
import { CloudflareProvider } from './cloudflare';
import { GeminiProvider } from './gemini';
import { log } from '../lib/logger';

export interface RouterContext {
	userText: string;
	isOwner: boolean;
	healthCheckinActive?: string | null;
	hasMedia?: boolean;
	/**
	 * Set by the webhook dispatcher (src/index.ts) after a sticky-Pro
	 * check fires. When true, routeMessage skips its regex/keyword
	 * branches and returns the Pro lane directly. This is how the
	 * conversation "stays on Pro until context changes" — the topic
	 * classifier in src/services/topicShift.ts decided the new message
	 * is still on the same topic as the previous Pro exchange.
	 */
	forceProLane?: boolean;
}

/**
 * Detect the complexity of a user's message.
 * Returns which provider + model + thinking level to use.
 */
export function routeMessage(ctx: RouterContext): ModelRoute {
	const { userText, healthCheckinActive, hasMedia, forceProLane } = ctx;

	// Sticky Pro: previous turn was Pro and the topic classifier said
	// the new message is still in the same topic. Force Pro lane so the
	// conversation feels continuous. The dispatcher already paid the
	// classifier cost; routeMessage just respects the decision.
	if (forceProLane) {
		return {
			provider: 'gemini',
			model: GEMINI_MODELS.proLatest,
			thinkingEffort: 'dynamic',
			reason: 'sticky_pro_context',
			enableGrounding: true,
		};
	}

	// Media present: must route to Gemini. Workers AI chat models are
	// text-only and would silently drop the media content.
	if (hasMedia) {
		return {
			provider: 'gemini',
			model: GEMINI_MODELS.proLatest,
			thinkingEffort: 'dynamic',
			reason: 'multimodal_input',
			enableGrounding: true,
		};
	}

	// Active health check-in: needs Gemini Pro for therapeutic depth
	if (healthCheckinActive) {
		return {
			provider: 'gemini',
			model: GEMINI_MODELS.proLatest,
			thinkingEffort: 'dynamic',
			reason: 'active_health_checkin',
			enableGrounding: true,
		};
	}

	// Emotional / therapeutic messages: Gemini Pro
	if (COMPLEXITY_PATTERNS.emotional.test(userText)) {
		return {
			provider: 'gemini',
			model: GEMINI_MODELS.proLatest,
			thinkingEffort: 'dynamic',
			reason: 'emotional_content',
			enableGrounding: true,
		};
	}

	// Code / architecture: Qwen3 30B on CF AI (free, strong reasoning).
	// Grounding NOT enabled — Qwen3 30B web_search_options support
	// unverified against current CF schema.
	if (COMPLEXITY_PATTERNS.code.test(userText) || /```/.test(userText)) {
		return {
			provider: 'cloudflare',
			model: CF_MODELS.code,
			thinkingEffort: 'high',
			reason: 'code_content',
			enableGrounding: false,
		};
	}

	// Analytical requests: Qwen3 30B on CF AI
	if (COMPLEXITY_PATTERNS.analytical.test(userText)) {
		return {
			provider: 'cloudflare',
			model: CF_MODELS.code,
			thinkingEffort: 'medium',
			reason: 'analytical_content',
			enableGrounding: false,
		};
	}

	// Long messages (>300 chars): bump to reasoning model
	if (userText.length > 300) {
		return {
			provider: 'cloudflare',
			model: CF_MODELS.code,
			thinkingEffort: 'medium',
			reason: 'long_message',
			enableGrounding: false,
		};
	}

	// Default: Gemma 4 on CF AI. thinkingEffort intentionally omitted
	// (was 'low' pre-F7, now 'dynamic' so we don't suppress reasoning).
	// Grounding ALWAYS ON — Gemma 4 supports web_search_options.
	return {
		provider: 'cloudflare',
		model: CF_MODELS.chat,
		thinkingEffort: 'dynamic',
		reason: 'default_casual',
		enableGrounding: true,
	};
}

/**
 * Cheap pre-routing predicate used by the webhook dispatcher
 * (src/index.ts) to decide whether to enqueue a message vs await
 * it inline. Mirrors routeMessage's branching but returns only
 * the provider kind — no provider instantiation, no env access.
 *
 * Returns true when the message will hit the Pro lane (Gemini)
 * under normal routing. Sticky-Pro decisions are layered on top
 * by the dispatcher, not by this function.
 */
export function willHitProLane(
	userText: string,
	hasMedia: boolean,
	healthCheckinActive: string | null,
): boolean {
	if (hasMedia) return true;
	if (healthCheckinActive) return true;
	if (COMPLEXITY_PATTERNS.emotional.test(userText)) return true;
	return false;
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
			grounding: route.enableGrounding ?? false,
		});
	}

	return { provider, route };
}
