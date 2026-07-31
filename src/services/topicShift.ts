// ============================================================
// Topic Shift Detector
//
// Used by the webhook dispatcher (src/index.ts) for sticky Pro
// routing. When a sticky-Pro flag is set on a user (written at the
// end of every successful Pro turn in message.ts), the next message
// triggers this classifier to decide:
//
//   - same topic   -> force Pro lane on this turn too
//   - different topic -> clear the flag, fall back to normal routing
//
// Conservative on errors: if the classifier fails or times out, we
// return same_topic=true. Better to keep the user on Pro and pay a
// little more than to switch personas mid-thread.
//
// Cost: one CF AI call per check (~150-400ms typically). Only runs
// when sticky flag exists AND new message DOESN'T already match the
// emotional regex (which would route to Pro anyway).
//
// Model: @cf/meta/llama-3.2-3b-instruct. Smallest fast model with
// instruction-following accuracy good enough for this 2-class
// decision. Roughly 5x faster than the Gemma chat model and free
// tier eligible.
// ============================================================

import { log } from '../lib/logger';
import { OPENAI_MODELS } from '../config/models';
import {
	createConfiguredProvider,
	getAIProviderMode,
} from '../ai/provider-factory';

const CLASSIFIER_MODEL = '@cf/meta/llama-3.2-3b-instruct' as const;
const CLASSIFIER_TIMEOUT_MS = 2_000;

export interface StickyProContext {
	anchor: string;
	route_reason?: string;
	ts: number;
}

export interface TopicShiftResult {
	sameTopic: boolean;
	source: 'classifier' | 'classifier_error' | 'classifier_timeout';
	latencyMs: number;
}

/**
 * Decide whether `newMessage` continues the same topic as the
 * sticky-Pro context's anchor (the user message that triggered Pro
 * on the previous turn).
 *
 * Returns sameTopic=true on classifier failure (conservative).
 */
export async function detectTopicShift(
	env: Env,
	context: StickyProContext,
	newMessage: string,
): Promise<TopicShiftResult> {
	const started = Date.now();

	// Trivial cases that don't need a classifier call.
	// Very short messages (yes/ok/yeah) are almost always continuation.
	const trimmed = newMessage.trim();
	if (trimmed.length < 10) {
		return {
			sameTopic: true,
			source: 'classifier',
			latencyMs: Date.now() - started,
		};
	}

	const prompt = `You are a topic-continuity classifier. Given a previous user message and a new user message in the same chat, decide whether the new message continues the SAME topic or shifts to a DIFFERENT topic.

PREVIOUS MESSAGE: "${context.anchor.slice(0, 300)}"

NEW MESSAGE: "${trimmed.slice(0, 300)}"

A "same topic" continuation includes follow-ups, clarifications, replies, emotional processing of the same situation, or any natural progression of the conversation.

A "different topic" shift is when the user clearly changes subject — e.g. asks an unrelated technical question, switches from feelings to logistics, or starts a new task.

Respond with EXACTLY one word: SAME or DIFFERENT.`;

	try {
		const provider = createConfiguredProvider(env, {
			openai: OPENAI_MODELS.background,
			cloudflare: CLASSIFIER_MODEL,
		});
		const callPromise = provider.chat(
			[{ role: 'user', content: prompt }],
			[],
			{
				systemInstruction: 'Output exactly one word: SAME or DIFFERENT.',
				thinkingLevel: 'LOW',
				maxTokens: 8,
				enableGrounding: false,
			},
		);

		// Promise.race timeout so a hung CF AI call doesn't block the
		// webhook ack to Telegram. Same pattern as message.ts cascade.
		const timeoutPromise = new Promise<never>((_, reject) => {
			setTimeout(
				() => reject(new Error('topic_shift_classifier_timeout')),
				getAIProviderMode(env) === 'openai' ? 5_000 : CLASSIFIER_TIMEOUT_MS,
			);
		});

		const result = await Promise.race([callPromise, timeoutPromise]);

		const raw = result.text.trim().toUpperCase();
		// Match on prefix to be tolerant of the model adding punctuation
		// or short trailing words. The system prompt strongly nudges
		// one-word output but we don't trust it 100%.
		const same = raw.startsWith('SAME');
		const different = raw.startsWith('DIFFERENT');

		// If neither token appears (model output garbage), conservative
		// fallback: stay on the same topic.
		const sameTopic = different ? false : (same ? true : true);
		const latencyMs = Date.now() - started;

		log.info('topic_shift_classified', {
			sameTopic,
			latencyMs,
			rawPrefix: raw.slice(0, 20),
		});

		return { sameTopic, source: 'classifier', latencyMs };
	} catch (e) {
		const msg = (e as Error).message;
		const latencyMs = Date.now() - started;
		const isTimeout = msg.includes('timeout');
		log.warn('topic_shift_classifier_failed', { msg, latencyMs, isTimeout });
		return {
			sameTopic: true,
			source: isTimeout ? 'classifier_timeout' : 'classifier_error',
			latencyMs,
		};
	}
}

/**
 * Read the sticky-Pro KV anchor for a user. Returns null when the
 * flag isn't set (most messages). Tolerates JSON parse errors by
 * returning null and logging \u2014 a malformed value shouldn't keep
 * the user stuck on Pro forever.
 */
export async function readStickyProContext(
	env: Env,
	userId: number,
): Promise<StickyProContext | null> {
	try {
		const raw = await env.CHAT_KV.get(`pro_context_${userId}`);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as Partial<StickyProContext>;
		if (typeof parsed.anchor !== 'string' || typeof parsed.ts !== 'number') {
			log.warn('sticky_pro_malformed', { userId });
			return null;
		}
		return parsed as StickyProContext;
	} catch (e) {
		log.warn('sticky_pro_read_failed', { userId, msg: (e as Error).message });
		return null;
	}
}

/**
 * Clear the sticky-Pro flag. Called when the classifier decides the
 * new message is a topic shift, or when the user explicitly resets
 * context (e.g. `/clear` command \u2014 wired separately).
 */
export async function clearStickyProContext(env: Env, userId: number): Promise<void> {
	try {
		await env.CHAT_KV.delete(`pro_context_${userId}`);
	} catch (e) {
		log.warn('sticky_pro_clear_failed', { userId, msg: (e as Error).message });
	}
}
