// ============================================================
// Poll Answer Handler
//
// When the user taps an option on a mood poll, Telegram sends a
// poll_answer update. We:
//   1. Look up the poll context (userId, chatId) from KV
//   2. Save the mood score to today's evening entry
//   3. Pull 30-day trend + therapeutic notes + episodes + semantic
//      context and ask Gemini Pro for a therapeutic analysis
//   4. Send the analysis + Positive/Negative emotion buttons
//
// The emotion button callbacks are handled in bot/callback.ts.
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
import * as persona from '../services/persona';
import type { AIMessage } from '../types/ai';

interface PollContext {
	userId: number;
	chatId: number;
	timestamp: number;
}

export async function handlePollAnswer(
	pa: TelegramPollAnswer,
	env: Env
): Promise<void> {
	// Pollanswers with zero options selected = user removed their vote.
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

	const { userId, chatId } = ctx;
	const score = pa.option_ids[0]!; // 0-10 maps 1:1 to option index
	const threadId = 'default';

	log.info('mood_score_received', { userId, score });

	// Persist the score. upsertEntry handles insert-or-merge so repeated
	// polls on the same day update the existing row. Uses the user's
	// local timezone to determine what "today" means.
	const tz = await persona.getUserTimezone(env, userId);
	const today = mood.todayLocal(tz);
	await mood.upsertEntry(env, userId, today, 'evening', { mood_score: score });

	// Clinical concern range — still respond, but prioritise safety.
	if (score <= 1 || score >= 9) {
		await handleClinicalConcern(env, userId, chatId, threadId, score);
		return;
	}

	// Typing indicator while we build the full analysis
	await telegram.sendChatAction(chatId, threadId, 'typing', env).catch(() => {});

	// Pull all the context we need for a meaningful response
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

/**
 * Clinical-concern scores (0-1 severe depression, 9-10 mania)
 * get a safety-first response instead of the usual analysis path.
 * We still save the score and send emotion buttons — skipping the
 * flow entirely would feel dismissive — but the message prioritises
 * crisis resources and safety.
 */
async function handleClinicalConcern(
	env: Env,
	userId: number,
	chatId: number,
	threadId: string,
	score: number
): Promise<void> {
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
		log.error('mood_concern_error', { msg: (e as Error).message });
		response = fallbackAnalysis(score);
	}

	// Defensive cleanup before delivery (see note in handlePollAnswer).
	response = stripLeakedThoughts(response);
	response = normaliseMarkdown(response);

	const btns = {
		inline_keyboard: [[
			{ text: '☀️ Positive', callback_data: 'mood_cat_positive' },
			{ text: '🌧 Negative', callback_data: 'mood_cat_negative' },
		]],
	};
	await telegram.sendMessage(chatId, threadId, response, env, { markup: btns });

	log.warn('mood_clinical_concern', { userId, score });
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
