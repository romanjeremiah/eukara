// ============================================================
// Chat History
//
// Per-chat conversation log stored in KV.
// Keyed by chat_{chatId}_{threadId} (delivery-scoped, not
// user-scoped — a group chat shares history across users,
// while user-scoped data lives elsewhere).
//
// Stored format: AIMessage[]. On load, tool_use/tool_result
// entries are filtered out because they are transient state
// from the in-turn tool loop and not meaningful context for
// future turns.
// ============================================================

import type { AIMessage } from '../types/ai';
import { log } from './logger';

const HISTORY_TTL_SECONDS = 604800; // 7 days
const HISTORY_MAX_TURNS = 24;

function key(chatId: number, threadId: string): string {
	return `chat_${chatId}_${threadId}`;
}

/**
 * Load prior conversation history for this chat + thread.
 * Returns an empty array if none exists or the stored value is malformed.
 * Sanitises the loaded history — drops tool calls/results, coerces roles,
 * ensures the first entry is a user turn.
 */
export async function loadHistory(
	env: Env, chatId: number, threadId: string
): Promise<AIMessage[]> {
	try {
		const raw = await env.CHAT_KV.get(key(chatId, threadId), { type: 'json' }) as AIMessage[] | null;
		if (!Array.isArray(raw)) return [];
		return sanitizeHistory(raw);
	} catch (e) {
		log.warn('history_load_error', { chatId, threadId, msg: (e as Error).message });
		return [];
	}
}

/**
 * Save conversation history after a turn completes. Caps length, drops
 * tool-loop entries, writes with 7-day TTL.
 */
export async function saveHistory(
	env: Env, chatId: number, threadId: string, messages: AIMessage[]
): Promise<void> {
	const sanitized = sanitizeHistory(messages).slice(-HISTORY_MAX_TURNS);
	if (!sanitized.length) return;
	try {
		await env.CHAT_KV.put(
			key(chatId, threadId),
			JSON.stringify(sanitized),
			{ expirationTtl: HISTORY_TTL_SECONDS }
		);
	} catch (e) {
		log.warn('history_save_error', { chatId, threadId, msg: (e as Error).message });
	}
}

/**
 * Clear conversation history for this chat + thread. Used by /clear.
 */
export async function clearHistory(
	env: Env, chatId: number, threadId: string
): Promise<void> {
	await env.CHAT_KV.delete(key(chatId, threadId));
}

/**
 * Filter an AIMessage array to only the text-bearing user/model turns.
 * - Drops tool_use and tool_result entries (transient tool-loop state).
 * - Drops entries with empty or non-string content.
 * - Ensures the first remaining entry is role=user (provider requirement).
 * - Merges consecutive same-role entries so history reads cleanly.
 */
export function sanitizeHistory(messages: AIMessage[]): AIMessage[] {
	// Step 1: keep only text-bearing user/model turns
	const clean: AIMessage[] = [];
	for (const m of messages) {
		if (m.role !== 'user' && m.role !== 'model') continue;
		if (typeof m.content !== 'string') continue;
		if (!m.content.trim()) continue;
		clean.push({ role: m.role, content: m.content });
	}

	// Step 2: drop leading model turns until the first user turn
	while (clean.length && clean[0]!.role !== 'user') clean.shift();

	// Step 3: merge consecutive same-role turns
	const merged: AIMessage[] = [];
	for (const turn of clean) {
		const last = merged[merged.length - 1];
		if (last && last.role === turn.role) {
			last.content = `${last.content}\n\n${turn.content}`;
		} else {
			merged.push({ ...turn });
		}
	}

	return merged;
}
