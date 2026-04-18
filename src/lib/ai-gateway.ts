// ============================================================
// AI Gateway Fallback
//
// Wraps env.AI.run() with opportunistic AI Gateway routing.
// If the configured gateway does not exist (error code 2001),
// the first failure flips a module-level flag so subsequent
// calls skip the gateway entirely. This prevents a missing
// dashboard gateway from taking the whole bot down.
//
// Used by all Workers AI call sites: the main provider, the
// queue consumer, the background observation extractor, and
// the vector service.
// ============================================================

import { AI_GATEWAY } from '../config/models';
import { log } from './logger';

let gatewayDisabled = false;

function isMissingGatewayError(err: unknown): boolean {
	const msg = (err as Error)?.message ?? '';
	return msg.includes('2001') || msg.includes('configure AI Gateway');
}

/**
 * Run a Workers AI call, transparently falling back to a
 * gateway-less invocation if the configured gateway is missing.
 * The first detected failure flips `gatewayDisabled` so subsequent
 * calls skip the gateway attempt entirely in this isolate.
 */
export async function runAI<T>(
	ai: Ai,
	model: keyof AiModels,
	input: Record<string, unknown>
): Promise<T> {
	if (!gatewayDisabled) {
		try {
			return await ai.run(model, input, { gateway: AI_GATEWAY }) as T;
		} catch (err) {
			if (isMissingGatewayError(err)) {
				gatewayDisabled = true;
				log.warn('ai_gateway_unavailable', {
					gateway: AI_GATEWAY.id,
					action: 'falling_back_to_direct_ai_calls',
				});
				// Fall through to direct call below.
			} else {
				throw err;
			}
		}
	}
	return await ai.run(model, input) as T;
}
