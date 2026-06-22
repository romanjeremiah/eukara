// ============================================================
// Mood Callback Handlers
//
// Split out from callback.ts to keep that file readable.
// Handles the two "big" mood interactions:
//   handleEmotionToggle    — user tapped an individual emotion
//   handleEmotionsDone     — webhook-thin: persists selection,
//                            enqueues the heavy synthesis call
//   runEmotionsDoneWork    — exported, queue-worker entry point
//                            for the heavy Gemini Pro synthesis
//
// Category and "next" flows stay in callback.ts because they're
// trivial stateless button-swaps.
//
// 2026-06-02 Phase 1: handleEmotionsDone used to run the 2000-token
// thinking-high Gemini Pro call inline via ctx.waitUntil. That hit
// the 30s waitUntil ceiling on bad-latency days. Now the heavy
// work lives in runEmotionsDoneWork, invoked from the queue worker
// (src/router/queue.ts `mood_emotions_done` case) with a 15-min
// wall clock and 3 retries.
// ============================================================

import type { TelegramCallbackQuery } from '../types/telegram';
import type { AIMessage } from '../types/ai';
import { CloudflareProvider } from '../ai/cloudflare';
import { CF_MODELS } from '../config/models';
import {
	BASE_INSTRUCTION,
	MENTAL_HEALTH_DIRECTIVE,
	FORMATTING_RULES,
} from '../config/personas';
import { MOOD_RESPONSE_REINFORCEMENT } from './poll';
import { classifyEmotion } from '../config/emotions';
import * as telegram from '../lib/telegram';
import { normaliseMarkdown, stripLeakedThoughts, formatTime } from '../lib/formatting';
import { log } from '../lib/logger';
import { loadHistory, saveHistory } from '../lib/history';
import * as mood from '../services/mood';
import * as memory from '../services/memory';
import * as episode from '../services/episode';
import * as vector from '../services/vector';
import * as user from '../services/user';

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

	await env.CHAT_KV.put(key, JSON.stringify(selected), { expirationTtl: 86400 });
	await telegram.answerCallbackQuery(query.id, env, {
		text: adding ? `✓ ${emotion}` : `✗ ${emotion} removed`,
	}).catch(() => {});
}

/**
 * User has finished selecting emotions. Webhook-thin handler:
 *   1. Clear the emotion keyboard
 *   2. Acknowledge the callback
 *   3. Retrieve the selection buffer from KV and clear it
 *   4. Persist emotions against today's evening entry
 *   5. Fresh typing indicator
 *   6. Enqueue `mood_emotions_done` for the heavy synthesis
 *
 * The heavy Gemini Pro call lives in runEmotionsDoneWork below,
 * invoked from the queue worker so the 15-min wall clock applies
 * instead of the webhook's 30s waitUntil ceiling.
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

	// Clear the emotion keyboard so it can't be tapped again.
	await telegram.editMessageReplyMarkup(chatId, msgId, null, env).catch(() => {});
	await telegram.answerCallbackQuery(query.id, env).catch(() => {});

	// Retrieve selections, then clear the buffer.
	const key = `mood_emo_selected_${userId}`;
	const stored = await env.CHAT_KV.get(key) ?? '[]';
	let selected: string[] = [];
	try {
		const parsed = JSON.parse(stored);
		if (Array.isArray(parsed)) selected = parsed.map(String);
	} catch { /* empty selection is fine */ }
	await env.CHAT_KV.delete(key);

	// Persist emotions against today's evening entry, using the user's
	// local timezone to determine "today". Do this synchronously so the
	// row is committed before the queue worker picks up.
	const tz = await user.getUserTimezone(env, userId);
	const today = mood.todayLocal(tz);
	if (selected.length) {
		await mood.upsertEntry(env, userId, today, 'evening', {
			emotions: JSON.stringify(selected),
		});
		log.info('mood_emotions_logged', { userId, count: selected.length });
	}

	// Fresh typing indicator so the user has visual feedback while the
	// queue worker spins up. The work function sends another typing
	// indicator when it actually starts (typing actions expire ~5s).
	await telegram.sendChatAction(chatId, threadId, 'typing', env).catch(() => {});

	// Enqueue the heavy synthesis. Queue gives 15-min wall clock + 3
	// retries vs the webhook's 30s waitUntil ceiling. Fallback to
	// inline only if the queue binding is missing.
	if (!env.TASK_QUEUE) {
		log.warn('mood_emotions_no_queue_binding_fallback_inline', { userId });
		await runEmotionsDoneWork(env, userId, chatId, threadId, selected);
		return;
	}

	await env.TASK_QUEUE.send({
		type: 'mood_emotions_done',
		userId,
		chatId,
		threadId,
		selectedEmotions: selected,
	});
	log.info('mood_emotions_enqueued', { userId, count: selected.length });
}

/**
 * Queue-worker entry point for the mood-flow synthesis. Pulls
 * mood history, therapeutic notes, recent episodes, and semantic
 * context, asks Gemini Pro for the full therapeutic summary, and
 * sends it with the tg-time footer + saves history.
 *
 * The emotions and keyboard have already been handled by
 * handleEmotionsDone; this function only owns the AI synthesis.
 *
 * Exported because the queue worker (router/queue.ts
 * `mood_emotions_done` case) calls this. Also called inline by
 * handleEmotionsDone as a fallback when the TASK_QUEUE binding
 * is missing.
 */
export async function runEmotionsDoneWork(
	env: Env,
	userId: number,
	chatId: number,
	threadId: string,
	selected: string[]
): Promise<void> {
	// Fresh typing indicator at the start of consumer processing.
	await telegram.sendChatAction(chatId, threadId, 'typing', env).catch(() => {});

	// Partition for the prompt. classifyEmotion is the source of truth
	// so this stays correct if more emotions are added to any list.
	const posSelected: string[] = [];
	const negSelected: string[] = [];
	const dissSelected: string[] = [];
	for (const e of selected) {
		const kind = classifyEmotion(e);
		if (kind === 'positive') posSelected.push(e);
		else if (kind === 'negative') negSelected.push(e);
		else if (kind === 'dissociative') dissSelected.push(e);
	}

	// Pull today's score (written by the poll answer handler earlier)
	// using the user's timezone to align with what "today" means.
	const tz = await user.getUserTimezone(env, userId);
	const today = mood.todayLocal(tz);
	const todayEntry = await mood.getEntry(env, userId, today, 'evening').catch(() => null);
	const todayScore = todayEntry?.mood_score ?? null;

	// Pull context for the therapeutic summary. Episodes are pulled
	// by recency — filter-by-emotion isn't implemented in episode
	// service yet, so we use the most recent 5 unconditionally.
	//
	// 2026-06-03 (heuristic injection): also pull category='trigger'
	// and category='schema' memories so the synthesis prompt can
	// compare today's signals against KNOWN HEURISTICS instead of
	// summarising in a vacuum. Both degrade to [] on error — missing
	// heuristics should not crash the synthesis.
	//
	// 2026-06-03 (heuristic expansion 2→4): now also pulling 'pattern'
	// and 'avoidance' categories. Same graceful degradation.
	const [history, therapeuticNotes, relevantEpisodes, semanticCtx, triggers, schemas, patterns, avoidances] = await Promise.all([
		mood.getHistory(env, userId, 30, 'evening').catch(() => []),
		memory.getRecentTherapeuticMemories(env, userId, 30).catch(() => []),
		episode.getRecentEpisodes(env, userId, 5).catch(() => []),
		vector.getSemanticContext(
			env,
			userId,
			selected.join(' ') || 'mood emotions feelings'
		).catch(() => ''),
		memory.getMemoriesByCategory(env, userId, 'trigger', 10).catch(() => []),
		memory.getMemoriesByCategory(env, userId, 'schema', 10).catch(() => []),
		memory.getMemoriesByCategory(env, userId, 'pattern', 10).catch(() => []),
		memory.getMemoriesByCategory(env, userId, 'avoidance', 10).catch(() => []),
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

	// 2026-06-03 (heuristic injection): format triggers + schemas into a
	// KNOWN HEURISTICS block. The prompt below tells the model to find
	// friction between today's data and these heuristics rather than
	// summarising the data in isolation. Empty block when no heuristics
	// exist yet — graceful degradation for new users.
	//
	// 2026-06-03 (heuristic expansion 2→4): now formats four categories
	// (triggers, schemas, patterns, avoidances). Each is a separate
	// labelled block so the model can attribute the friction.
	const heuristicsAny = triggers.length || schemas.length || patterns.length || avoidances.length;
	const heuristicsContext = heuristicsAny
		? '[KNOWN HEURISTICS]\n'
			+ (triggers.length
				? 'Known triggers:\n' + triggers.slice(0, 8).map(t => `- ${t.fact}`).join('\n') + '\n'
				: '')
			+ (schemas.length
				? 'Known schemas/patterns:\n' + schemas.slice(0, 8).map(s => `- ${s.fact}`).join('\n') + '\n'
				: '')
			+ (patterns.length
				? 'Known recurring patterns:\n' + patterns.slice(0, 8).map(p => `- ${p.fact}`).join('\n') + '\n'
				: '')
			+ (avoidances.length
				? 'Known avoidances:\n' + avoidances.slice(0, 8).map(a => `- ${a.fact}`).join('\n')
				: '')
		: '';

	const prompt = buildSummaryPrompt({
		todayScore,
		posSelected,
		negSelected,
		dissSelected,
		historyContext,
		clinicalContext,
		episodeContext,
		semanticCtx,
		heuristicsContext,
	});

	let summary: string;
	try {
		const provider = new CloudflareProvider(env.AI, CF_MODELS.chat);
		const response = await provider.chat(
			[{ role: 'user', content: prompt }],
			[],
			{
				systemInstruction: `${BASE_INSTRUCTION}\n\n${MENTAL_HEALTH_DIRECTIVE}\n\n${FORMATTING_RULES}`,
				thinkingLevel: 'MEDIUM',
			}
		);
		summary = response.text || fallbackSummary(selected);
	} catch (e) {
		log.error('mood_summary_error', { msg: (e as Error).message, userId });
		summary = fallbackSummary(selected);
	}

	// Defensive cleanup before delivery (2026-06-02). Mood flow calls
	// provider.chat() directly and was bypassing the strip pass that
	// the main message handler runs. Strip first, then normalise.
	summary = stripLeakedThoughts(summary);
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
		posCount: posSelected.length,
		negCount: negSelected.length,
		dissCount: dissSelected.length,
		heuristicsUsed: triggers.length + schemas.length + patterns.length + avoidances.length,
		summaryLen: summary.length,
	});

	// 2026-06-03 (pattern c, 24h resume): flow completed cleanly. Drop
	// the pending flow + resume-offered flags so a fresh check-in is
	// clean state. Done in parallel with the existing active-flag
	// delete; all three are best-effort.
	await Promise.all([
		env.CHAT_KV.delete(`health_checkin_active_${userId}`),
		env.CHAT_KV.delete(`mood_flow_pending_${userId}`),
		env.CHAT_KV.delete(`mood_flow_resume_offered_${userId}`),
	]).catch(() => {});
}

interface SummaryInputs {
	todayScore: number | null;
	posSelected: string[];
	negSelected: string[];
	dissSelected: string[];
	historyContext: string;
	clinicalContext: string;
	episodeContext: string;
	semanticCtx: string;
	heuristicsContext: string;
}

function buildSummaryPrompt(inputs: SummaryInputs): string {
	const {
		todayScore, posSelected, negSelected, dissSelected,
		historyContext, clinicalContext, episodeContext, semanticCtx,
		heuristicsContext,
	} = inputs;

	// 2026-06-05: rewritten alongside buildAnalysisPrompt to address the
	// same literary-distance failure mode. The previous version explicitly
	// banned "I hear you" / "It sounds like" openers in the prompt body,
	// which forced the model into third-person narration ("the gray
	// flatness", "the heavy anchor"). The MOOD_RESPONSE_REINFORCEMENT
	// constant prepended here carves out genuine distress as a context
	// where "I hear you" is presence, not sycophancy. Friction-finding
	// is still requested for scores >= 4, where the user has bandwidth
	// for it; below that it's dropped entirely.

	const score = todayScore ?? 5;
	const lowScore = score <= 3;
	const highScore = score >= 8;

	const depthGuidance = lowScore
		? `LOW-SCORE GUIDANCE: this is a heavy day. The user does not have bandwidth for friction-finding or multi-day pattern observations. Lead with direct acknowledgement ("I'm here", "I hear you", or a natural variation). Acknowledge the emotions they picked, briefly, without listing them all back. End with ONE short question that invites them to say more about the loudest part — or a single steady observation that leaves space. Length: 2-3 short sentences total.`
		: highScore
			? `HIGH-SCORE GUIDANCE: the user is in hypomania or mania range. Match their energy calmly without amplifying it. Note one concrete grounding concern (sleep, big decisions, spending). End with ONE short question about sleep or current environment. Length: 3-4 short sentences.`
			: `MID-SCORE GUIDANCE: friction-finding is welcome here. Compare today's data against KNOWN HEURISTICS, past episodes, and recent history. Point out a specific contradiction or echo — "high sleep but flat energy", "same shape as Tuesday", "the trigger you flagged last month is back". Avoid generic trend descriptions ("a mixed day", "your mood is variable"). End with EITHER one short open-ended question OR one steady observation. Length: 3-5 short sentences.`;

	return `${MOOD_RESPONSE_REINFORCEMENT}

The user just completed their full mood check-in.

TODAY:
Mood score: ${todayScore ?? 'not recorded'}/10
Positive emotions: ${posSelected.length ? posSelected.join(', ') : 'none'}
Negative emotions: ${negSelected.length ? negSelected.join(', ') : 'none'}
Dissociative / altered-state emotions: ${dissSelected.length ? dissSelected.join(', ') : 'none'}

${depthGuidance}

If dissociative emotions are present, take them seriously — these are altered-perception states, not valence labels. Acknowledge briefly, without rushing to fix.

GROUNDING (for your awareness only — do NOT recite, quote, or list these back to the user):
${historyContext}
${heuristicsContext}
${clinicalContext}
${episodeContext}
${semanticCtx}

Never use clinical framework names. Never narrate the user's feelings back to them in third-person literary terms. Speak to them, not at them.`;
}

function fallbackSummary(selected: string[]): string {
	if (!selected.length) {
		return 'Thank you for checking in. What has been on your mind today?';
	}
	return `Thank you for sharing that. I hear you felt ${selected.slice(0, 3).join(', ')}${selected.length > 3 ? ', and more' : ''}. What has been driving those today?`;
}
