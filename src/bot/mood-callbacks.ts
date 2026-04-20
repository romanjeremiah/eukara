// ============================================================
// Mood Callback Handlers
//
// Split out from callback.ts to keep that file readable.
// Handles the two "big" mood interactions:
//   handleEmotionToggle — user tapped an individual emotion
//   handleEmotionsDone  — user finished selecting, synthesise summary
//
// Category and "next" flows stay in callback.ts because they're
// trivial stateless button-swaps.
// ============================================================

import type { TelegramCallbackQuery } from '../types/telegram';
import type { AIMessage } from '../types/ai';
import { GeminiProvider } from '../ai/gemini';
import { GEMINI_MODELS } from '../config/models';
import {
	BASE_INSTRUCTION,
	MENTAL_HEALTH_DIRECTIVE,
	FORMATTING_RULES,
} from '../config/personas';
import { POSITIVE_EMOTIONS, NEGATIVE_EMOTIONS, classifyEmotion } from '../config/emotions';
import * as telegram from '../lib/telegram';
import { normaliseMarkdown, formatTime } from '../lib/formatting';
import { log } from '../lib/logger';
import { loadHistory, saveHistory } from '../lib/history';
import * as mood from '../services/mood';
import * as memory from '../services/memory';
import * as episode from '../services/episode';
import * as vector from '../services/vector';
import * as persona from '../services/persona';

/**
 * Toggle a single emotion in/out of the user's selection.
 * Selection lives in KV under mood_emo_selected_<userId> as a
 * JSON string array. Always answer the callback with a toast so
 * the user gets visual confirmation of the toggle.
 */
export async function handleEmotionToggle(
	query: TelegramCallbackQuery,
	env: Env
): Promise<void> {
	const userId = query.from.id;
	const data = query.data!;
	const emotion = data.replace('mood_emo_', '');

	// Reject unknown emotions — callback data is untrusted input.
	const kind = classifyEmotion(emotion);
	if (kind === 'unknown') {
		await telegram.answerCallbackQuery(query.id, env).catch(() => {});
		return;
	}

	const key = `mood_emo_selected_${userId}`;
	const stored = await env.CHAT_KV.get(key) ?? '[]';
	let selected: string[];
	try {
		const parsed = JSON.parse(stored);
		selected = Array.isArray(parsed) ? parsed.map(String) : [];
	} catch {
		selected = [];
	}

	const idx = selected.indexOf(emotion);
	const adding = idx === -1;
	if (adding) selected.push(emotion);
	else selected.splice(idx, 1);

	await env.CHAT_KV.put(key, JSON.stringify(selected), { expirationTtl: 3600 });
	await telegram.answerCallbackQuery(query.id, env, {
		text: adding ? `✓ ${emotion}` : `✗ ${emotion} removed`,
	}).catch(() => {});
}

/**
 * User has finished selecting emotions. We:
 *   1. Persist the emotion list to today's mood_journal entry
 *   2. Pull mood history, therapeutic notes, relevant episodes,
 *      semantic context
 *   3. Ask Gemini Pro for a full therapeutic summary
 *   4. Send the summary, save the turn to history
 *
 * This is the heaviest call in the mood flow. If it fails, we fall
 * back to a minimal acknowledgement so the user isn't left hanging.
 */
export async function handleEmotionsDone(
	query: TelegramCallbackQuery,
	env: Env
): Promise<void> {
	const userId = query.from.id;
	const chatId = query.message?.chat.id;
	const msgId = query.message?.message_id;
	const threadId = query.message?.message_thread_id
		? String(query.message.message_thread_id)
		: 'default';

	if (!chatId || !msgId) {
		await telegram.answerCallbackQuery(query.id, env).catch(() => {});
		return;
	}

	// Clear the emotion keyboard
	await telegram.editMessageReplyMarkup(chatId, msgId, null, env).catch(() => {});
	await telegram.answerCallbackQuery(query.id, env).catch(() => {});
	await telegram.sendChatAction(chatId, threadId, 'typing', env).catch(() => {});

	// Retrieve selections, then clear the buffer
	const key = `mood_emo_selected_${userId}`;
	const stored = await env.CHAT_KV.get(key) ?? '[]';
	let selected: string[] = [];
	try {
		const parsed = JSON.parse(stored);
		if (Array.isArray(parsed)) selected = parsed.map(String);
	} catch { /* empty selection is fine */ }
	await env.CHAT_KV.delete(key);

	// Persist emotions against today's evening entry, using the
	// user's local timezone to determine "today".
	const tz = await persona.getUserTimezone(env, userId);
	const today = mood.todayLocal(tz);
	if (selected.length) {
		await mood.upsertEntry(env, userId, today, 'evening', {
			emotions: JSON.stringify(selected),
		});
		log.info('mood_emotions_logged', { userId, count: selected.length });
	}

	// Partition for the prompt
	const negSet = new Set<string>(NEGATIVE_EMOTIONS);
	const posSelected = selected.filter(e => !negSet.has(e));
	const negSelected = selected.filter(e => negSet.has(e));

	// Pull today's score (written by the poll answer handler earlier)
	const todayEntry = await mood.getEntry(env, userId, today, 'evening').catch(() => null);
	const todayScore = todayEntry?.mood_score ?? null;

	// Pull context for the therapeutic summary. Episodes are pulled
	// by recency — filter-by-emotion isn't implemented in episode
	// service yet, so we use the most recent 5 unconditionally.
	const [history, therapeuticNotes, relevantEpisodes, semanticCtx] = await Promise.all([
		mood.getHistory(env, userId, 30, 'evening').catch(() => []),
		memory.getRecentTherapeuticMemories(env, userId, 30).catch(() => []),
		episode.getRecentEpisodes(env, userId, 5).catch(() => []),
		vector.getSemanticContext(
			env,
			userId,
			selected.join(' ') || 'mood emotions feelings'
		).catch(() => ''),
	]);

	const historyContext = mood.formatHistoryForContext(history, 10);
	const clinicalContext = therapeuticNotes.length
		? 'Clinical notes:\n' + therapeuticNotes
			.slice(0, 8)
			.map(n => `- [${n.category}] ${n.fact}`)
			.join('\n')
		: '(No therapeutic notes on file yet.)';
	const episodeContext = episode.formatEpisodesForContext(relevantEpisodes)
		|| '(No past episodes to reference.)';

	const prompt = buildSummaryPrompt({
		todayScore,
		posSelected,
		negSelected,
		historyContext,
		clinicalContext,
		episodeContext,
		semanticCtx,
	});

	let summary: string;
	try {
		const provider = new GeminiProvider(env.GEMINI_API_KEY, GEMINI_MODELS.pro);
		const response = await provider.chat(
			[{ role: 'user', content: prompt }],
			[],
			{
				systemInstruction: `${BASE_INSTRUCTION}\n\n${MENTAL_HEALTH_DIRECTIVE}\n\n${FORMATTING_RULES}`,
				temperature: 1.0,
				maxTokens: 2000,
				thinkingEffort: 'high',
			}
		);
		summary = response.text || fallbackSummary(selected);
	} catch (e) {
		log.error('mood_summary_error', { msg: (e as Error).message, userId });
		summary = fallbackSummary(selected);
	}

	// Defensive markdown cleanup.
	summary = normaliseMarkdown(summary);

	// Subtle footer showing when the check-in was logged. Uses tg-time
	// so the client renders it in the user's local timezone. The italic
	// + separator keeps it visually distinct from the AI prose above.
	const nowUnix = Math.floor(Date.now() / 1000);
	const footer = `\n\n<i>Logged at ${formatTime(nowUnix, new Date(nowUnix * 1000).toLocaleString('en-GB'), 't')}</i>`;
	const summaryWithFooter = summary + footer;

	await telegram.sendMessage(chatId, threadId, summaryWithFooter, env);

	// Persist the summary in conversation history so subsequent replies
	// have continuity. Using a synthetic user turn that labels the
	// selection keeps the chronology coherent without re-encoding the
	// button flow as conversation.
	const selectionLabel = selected.length
		? `[I finished my check-in. Selected emotions: ${selected.join(', ')}]`
		: `[I finished my check-in without selecting specific emotions]`;
	const priorHistory = await loadHistory(env, chatId, threadId);
	const historyMessages: AIMessage[] = [
		...priorHistory,
		{ role: 'user', content: selectionLabel },
		{ role: 'model', content: summary },
	];
	await saveHistory(env, chatId, threadId, historyMessages);

	log.info('mood_summary_sent', {
		userId,
		emotionsCount: selected.length,
		summaryLen: summary.length,
	});

	// Clear the health_checkin_active flag — the check-in is complete.
	await env.CHAT_KV.delete(`health_checkin_active_${userId}`);
}

interface SummaryInputs {
	todayScore: number | null;
	posSelected: string[];
	negSelected: string[];
	historyContext: string;
	clinicalContext: string;
	episodeContext: string;
	semanticCtx: string;
}

function buildSummaryPrompt(inputs: SummaryInputs): string {
	const {
		todayScore, posSelected, negSelected,
		historyContext, clinicalContext, episodeContext, semanticCtx,
	} = inputs;

	return `The user just completed their full mood check-in. Analyse everything and give a meaningful therapeutic summary.

TODAY'S CHECK-IN:
Mood score: ${todayScore ?? 'not recorded'}/10
Positive emotions selected: ${posSelected.length ? posSelected.join(', ') : 'none'}
Negative emotions selected: ${negSelected.length ? negSelected.join(', ') : 'none'}

RECENT MOOD HISTORY:
${historyContext}

${clinicalContext}

${episodeContext}

${semanticCtx}

YOUR RESPONSE (follow this structure naturally, not as a list):
1. Acknowledge what they shared today. Name the emotions they selected. If the mix of positive and negative is notable (e.g. "inspired but lonely"), explore that tension briefly.
2. Compare to recent days. Is the score trending up, down, or stable? Are certain emotions recurring? Note any patterns without being clinical.
3. If past episodes are available, reference what happened in similar emotional states before. What helped? What didn't? Use this to inform your suggestion.
4. Draw ONE therapeutic observation. Connect today's emotions to known patterns, triggers, or schemas from the clinical notes. Use the therapeutic frameworks (AEDP, IFS, schema) as lenses for YOUR thinking — do NOT name them to the user.
5. End with ONE natural question that invites deeper conversation but doesn't pressure.

Keep it warm, direct, and personal. 3-5 sentences. No bullet points. No clinical jargon unless it adds genuine insight. You know this person well.`;
}

function fallbackSummary(selected: string[]): string {
	if (!selected.length) {
		return 'Thank you for checking in. What has been on your mind today?';
	}
	return `Thank you for sharing that. I hear you felt ${selected.slice(0, 3).join(', ')}${selected.length > 3 ? ', and more' : ''}. What has been driving those today?`;
}
