// ============================================================
// Poll Answer Handler
//
// When the user taps an option on a mood poll, Telegram sends a
// poll_answer update. The webhook path does the minimum that has
// to happen synchronously — KV context lookup, score upsert,
// fresh typing indicator — and then enqueues the heavy Gemini Pro
// analysis as a `mood_score_received` queue task.
//
// 2026-06-02 Phase 1: split into webhook-thin handler +
// exported work functions. Before the split, the analysis Gemini
// call ran inline via ctx.waitUntil, which has a 30s ceiling after
// the client disconnects. Slow Gemini Pro emotional turns were
// silently terminated mid-flight on bad-latency days.
//
// The emotion button callbacks (Positive / Negative → emotion
// grid → Done) are handled in bot/callback.ts +
// bot/mood-callbacks.ts.
// ============================================================

import type { TelegramPollAnswer } from '../types/telegram';
import { GeminiProvider } from '../ai/gemini';
import { GEMINI_MODELS } from '../config/models';
import { BASE_INSTRUCTION, MENTAL_HEALTH_DIRECTIVE, FORMATTING_RULES } from '../config/personas';
import * as telegram from '../lib/telegram';
import { normaliseMarkdown, stripLeakedThoughts } from '../lib/formatting';
import { log } from '../lib/logger';
import { saveHistory, loadHistory } from '../lib/history';
import * as mood from '../services/mood';
import * as memory from '../services/memory';
import * as episode from '../services/episode';
import * as vector from '../services/vector';
import * as user from '../services/user';
import type { AIMessage } from '../types/ai';

interface PollContext {
	userId: number;
	chatId: number;
	timestamp: number;
	/**
	 * Phase 1 (2026-06-02): the mood_poll queue worker stashes the
	 * source label so we can write it onto the mood_journal row when
	 * the poll_answer webhook fires. 'cron_poll' from scheduled
	 * evening, 'manual_command' from /mood. NULL for pre-Phase-1
	 * polls still in the 1-hour KV window during deploy.
	 */
	source?: string | null;
}

/**
 * Webhook-thin poll_answer handler. Does only what must happen
 * before the worker disconnects: KV context lookup, score upsert
 * with source, fresh typing indicator, enqueue analysis.
 *
 * The heavy Gemini Pro call is owned by runMoodAnalysisWork /
 * runClinicalConcernWork below, invoked from the queue worker
 * (src/router/queue.ts `mood_score_received` case).
 */
export async function handlePollAnswer(
	pa: TelegramPollAnswer,
	env: Env
): Promise<void> {
	// Poll answers with zero options selected = user removed their vote.
	// We don't treat retraction as a mood event; just ignore.
	if (!pa.option_ids?.length) return;

	// Look up the poll context stashed when the poll was sent.
	// If it's missing, the poll has expired (1-hour TTL) or wasn't ours.
	const ctx = await env.CHAT_KV.get<PollContext>(
		`mood_poll_${pa.poll_id}`,
		{ type: 'json' }
	);
	if (!ctx) {
		log.info('poll_answer_no_context', { pollId: pa.poll_id });
		return;
	}
	// Clean up KV — one-shot, no replay.
	await env.CHAT_KV.delete(`mood_poll_${pa.poll_id}`);

	const { userId, chatId, source } = ctx;
	const score = pa.option_ids[0]!; // 0-10 maps 1:1 to option index
	const threadId = 'default';

	log.info('mood_score_received_webhook', { userId, score, source: source ?? null });

	// Persist the score + source synchronously so the row is committed
	// before the queue worker picks up. Uses the user's local timezone
	// to determine what "today" means.
	const tz = await user.getUserTimezone(env, userId);
	const today = mood.todayLocal(tz);
	await mood.upsertEntry(env, userId, today, 'evening', {
		mood_score: score,
		source: source ?? null,
	});

	// 2026-06-03 (pattern c, 24h resume): advance the flow state so the
	// dispatcher can detect a pending check-in and offer Continue / Skip
	// if the user walks away after the poll but before tapping emotions.
	// Cleared in mood-callbacks.ts runEmotionsDoneWork on completion.
	await env.CHAT_KV.put(
		`mood_flow_pending_${userId}`,
		JSON.stringify({ stage: 'awaiting_emotions', startedAt: Date.now() }),
		{ expirationTtl: 86400 }
	).catch(() => {});
	// Resume-offered flag is per-pending-flow; clear any stale one from a
	// previous abandoned flow now that we have fresh engagement.
	await env.CHAT_KV.delete(`mood_flow_resume_offered_${userId}`).catch(() => {});

	// Fresh typing indicator so the user gets feedback while the queue
	// worker spins up. Typing actions expire after ~5s; the work
	// function will send another one when it actually starts.
	await telegram.sendChatAction(chatId, threadId, 'typing', env).catch(() => {});

	// Enqueue the heavy Gemini Pro call. Queue gives 15-min wall clock
	// + 3 retries vs the webhook's 30s waitUntil ceiling. The queue
	// worker dispatches to runClinicalConcernWork or
	// runMoodAnalysisWork based on the score.
	if (!env.TASK_QUEUE) {
		// No queue binding — fall back to inline so the user isn't left
		// hanging. This is the same risk as before the Phase 1 fix, but
		// at least the score is already saved.
		log.warn('mood_score_no_queue_binding_fallback_inline', { userId });
		if (score <= 1 || score >= 9) {
			await runClinicalConcernWork(env, userId, chatId, threadId, score);
		} else {
			await runMoodAnalysisWork(env, userId, chatId, threadId, score);
		}
		return;
	}

	await env.TASK_QUEUE.send({
		type: 'mood_score_received',
		userId,
		chatId,
		threadId,
		score,
	});
	log.info('mood_score_enqueued', { userId, score });
}

/**
 * Clinical-concern scores (0-1 severe depression, 9-10 mania)
 * get a safety-first response instead of the usual analysis path.
 * The score and source have already been written to mood_journal
 * by handlePollAnswer; this function only sends the AI response
 * and the emotion category buttons.
 *
 * Exported because the queue worker (router/queue.ts
 * `mood_score_received` case) calls this when score is in the
 * clinical range. Also called inline by handlePollAnswer as a
 * fallback when the TASK_QUEUE binding is missing.
 */
export async function runClinicalConcernWork(
	env: Env,
	userId: number,
	chatId: number,
	threadId: string,
	score: number
): Promise<void> {
	// Fresh typing indicator. The webhook sent one when it enqueued,
	// but that's ~5s old by the time the queue picks up.
	await telegram.sendChatAction(chatId, threadId, 'typing', env).catch(() => {});

	let prompt: string;
	if (score <= 1) {
		prompt = `The user just logged their mood as ${score}/10, which on the bipolar scale indicates severe depression or crisis. Respond with deep compassion. Acknowledge the weight of what they're sharing. Remind them gently about Samaritans (116 123, UK) and SHOUT (text 85258). Ask ONE grounded question about what's weighing on them — do NOT stack questions. Keep the response under 5 sentences. Do not use clinical jargon.`;
	} else {
		prompt = `The user just logged their mood as ${score}/10, which on the bipolar scale indicates mania or severe hypomania. Acknowledge calmly. Raise safety concerns (sleep, impulsive decisions, spending) without lecturing. Ask ONE grounded question about their sleep or current environment. Keep the response under 5 sentences. Do not use clinical jargon.`;
	}

	let response: string;
	try {
		const provider = new GeminiProvider(env.GEMINI_API_KEY, GEMINI_MODELS.pro);
		const result = await provider.chat(
			[{ role: 'user', content: prompt }],
			[],
			{
				systemInstruction: `${BASE_INSTRUCTION}\n\n${MENTAL_HEALTH_DIRECTIVE}\n\n${FORMATTING_RULES}`,
				temperature: 0.7,
				maxTokens: 600,
				thinkingEffort: 'medium',
			}
		);
		response = result.text || fallbackAnalysis(score);
	} catch (e) {
		log.error('mood_concern_error', { msg: (e as Error).message, userId });
		response = fallbackAnalysis(score);
	}

	// Defensive cleanup before delivery (see note in handlePollAnswer).
	response = stripLeakedThoughts(response);
	response = normaliseMarkdown(response);

	const btns = {
		inline_keyboard: [[
			{ text: '☀️ Positive', callback_data: 'mood_cat_positive' },
			{ text: '🌧 Negative', callback_data: 'mood_cat_negative' },
			{ text: '🌫️ Dissociative', callback_data: 'mood_cat_dissociative' },
		]],
	};
	await telegram.sendMessage(chatId, threadId, response, env, { markup: btns });

	// Persist in conversation history so the model has continuity if
	// the user replies to the clinical concern message.
	const priorHistory = await loadHistory(env, chatId, threadId);
	const historyMessages: AIMessage[] = [
		...priorHistory,
		{ role: 'user', content: `[I just logged my mood as ${score}/10]` },
		{ role: 'model', content: response },
	];
	await saveHistory(env, chatId, threadId, historyMessages);

	log.warn('mood_clinical_concern', { userId, score });
}

/**
 * Standard mood-analysis flow for non-clinical scores (2-8).
 * Pulls 30-day trend + therapeutic notes + recent episodes +
 * semantic context, asks Gemini Pro for a meaningful response,
 * and sends it with the Positive/Negative emotion buttons.
 *
 * The score and source have already been written to mood_journal
 * by handlePollAnswer; this function only handles the AI response.
 *
 * Exported because the queue worker (router/queue.ts
 * `mood_score_received` case) calls this. Also called inline by
 * handlePollAnswer as a fallback when the TASK_QUEUE binding is
 * missing.
 */
export async function runMoodAnalysisWork(
	env: Env,
	userId: number,
	chatId: number,
	threadId: string,
	score: number
): Promise<void> {
	// Fresh typing indicator. The webhook sent one when it enqueued,
	// but that's ~5s old by the time the queue picks up.
	await telegram.sendChatAction(chatId, threadId, 'typing', env).catch(() => {});

	// Pull all the context we need for a meaningful response. Each
	// source degrades to empty/`''` on error — we'd rather send a
	// thinner reply than crash the whole task.
	const [history, therapeuticNotes, episodes, semanticCtx] = await Promise.all([
		mood.getHistory(env, userId, 30, 'evening').catch(() => []),
		memory.getRecentTherapeuticMemories(env, userId, 30).catch(() => []),
		episode.getRecentEpisodes(env, userId, 5).catch(() => []),
		vector.getSemanticContext(env, userId, `mood ${score} feelings`).catch(() => ''),
	]);

	const historyContext = mood.formatHistoryForContext(history, 10);
	const clinicalContext = therapeuticNotes.length
		? 'Clinical notes:\n' + therapeuticNotes
			.slice(0, 8)
			.map(n => `- [${n.category}] ${n.fact}`)
			.join('\n')
		: '';
	const episodeContext = episode.formatEpisodesForContext(episodes);

	const analysisPrompt = buildAnalysisPrompt({
		score,
		historyContext,
		clinicalContext,
		episodeContext,
		semanticCtx,
	});

	// Call Gemini Pro directly — this is a system-generated response,
	// not a conversational reply, so we bypass the normal message
	// handler to avoid injecting the full persona_config overlay on
	// top of the clinical prompt.
	let analysis: string;
	try {
		const provider = new GeminiProvider(env.GEMINI_API_KEY, GEMINI_MODELS.pro);
		const response = await provider.chat(
			[{ role: 'user', content: analysisPrompt }],
			[],
			{
				systemInstruction: `${BASE_INSTRUCTION}\n\n${MENTAL_HEALTH_DIRECTIVE}\n\n${FORMATTING_RULES}`,
				temperature: 1.0,
				maxTokens: 1500,
				thinkingEffort: 'medium',
			}
		);
		analysis = response.text || fallbackAnalysis(score);
	} catch (e) {
		log.error('mood_analysis_error', { msg: (e as Error).message, userId });
		analysis = fallbackAnalysis(score);
	}

	// Defensive cleanup before delivery. stripLeakedThoughts catches
	// prose-form planning paragraphs the model occasionally emits ahead
	// of the actual reply (2026-06-02). normaliseMarkdown converts the
	// model's stray markdown into Telegram HTML. Order matters: strip
	// first so paragraph boundaries are still clean for splitting.
	analysis = stripLeakedThoughts(analysis);
	analysis = normaliseMarkdown(analysis);

	// Send the analysis + emotion category buttons
	const btns = {
		inline_keyboard: [[
			{ text: '☀️ Positive', callback_data: 'mood_cat_positive' },
			{ text: '🌧 Negative', callback_data: 'mood_cat_negative' },
			{ text: '🌫️ Dissociative', callback_data: 'mood_cat_dissociative' },
		]],
	};

	const sent = await telegram.sendMessage(chatId, threadId, analysis, env, {
		markup: btns,
	});

	// Persist in conversation history so the model has continuity if
	// the user replies to the analysis.
	const priorHistory = await loadHistory(env, chatId, threadId);
	const historyMessages: AIMessage[] = [
		...priorHistory,
		{ role: 'user', content: `[I just logged my mood as ${score}/10]` },
		{ role: 'model', content: analysis },
	];
	await saveHistory(env, chatId, threadId, historyMessages);

	log.info('mood_analysis_sent', {
		userId,
		score,
		analysisLen: analysis.length,
		messageId: sent?.result?.message_id,
	});
}

interface AnalysisInputs {
	score: number;
	historyContext: string;
	clinicalContext: string;
	episodeContext: string;
	semanticCtx: string;
}

function buildAnalysisPrompt(inputs: AnalysisInputs): string {
	const { score, historyContext, clinicalContext, episodeContext, semanticCtx } = inputs;

	return `The user just logged their mood as ${score}/10 on the bipolar scale. Analyse the data below and respond with a meaningful, grounded acknowledgement.

TODAY:
Mood score: ${score}/10

RECENT MOOD HISTORY:
${historyContext}

${clinicalContext || '(No therapeutic notes on file yet.)'}

${episodeContext || '(No past episodes to reference.)'}

${semanticCtx || ''}

YOUR RESPONSE (3-5 sentences, natural prose, not a bulleted list):
1. Acknowledge the score without repeating it numerically. If it stands out against recent days (up, down, stable), note that briefly.
2. If therapeutic notes or past episodes reveal a pattern relevant to this score, weave one observation in — without sounding clinical.
3. End with a question that invites the user to say more, worded naturally. Ask EXACTLY one question.

After your message, the user will be shown Positive/Negative emotion buttons to tap — do NOT ask about emotions in your text; the buttons handle that.

Do not mention the data structure, the score number more than once, or how you generated this analysis. Just speak.`;
}

/**
 * Fallback used when Gemini is unreachable. Keeps the flow alive
 * so the emotion buttons still appear.
 */
function fallbackAnalysis(score: number): string {
	if (score <= 1) {
		return 'I hear you, and I want you to know you are not alone right now. If things feel unmanageable, Samaritans are on 116 123 and SHOUT take texts on 85258. What has been the heaviest part today?';
	}
	if (score >= 9) {
		return 'That is a big spike. Before anything else — have you slept, and is there someone around tonight?';
	}
	if (score <= 3) return 'Thanks for logging that. What has been weighing on you most today?';
	if (score >= 7) return 'Sounds like a strong day. What has been driving that?';
	return 'Steady day then. What has been on your mind?';
}
