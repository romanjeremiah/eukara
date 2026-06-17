/**
 * Persona reinforcement prepended to every mood-response prompt
 * (2026-06-05). Purpose: counteract the way the persona's NO RECEIPTS
 * and NO SILVER LININGS rules push the model into literary distance
 * ("the heavy static anchor", "the gray flatness") and meta-commentary
 * ("I am not going to push a fix") when real distress is on the table.
 *
 * Both of those failures came from the model interpreting the persona's
 * anti-sycophancy rules as a ban on direct acknowledgement. In genuine
 * distress, "I hear you" / "I am right here with you" is PRESENCE, not
 * a customer-service receipt — the persona's NO RECEIPTS rule does not
 * apply to these openers in a mood-response context.
 *
 * Compare Xaridotis's response that landed (Image 3 in the 2026-06-05
 * comparison): "I hear you, and I am right here with you. It's incredibly
 * heavy to carry that kind of darkness..." against Eukara's that did not:
 * "It is exhausting when that gray flatness takes over... I am not going
 * to try to push a fix or find a silver lining."
 *
 * Keep this short — it sits at the top of every mood prompt and competes
 * with the rest of the prompt for attention.
 */
export const MOOD_RESPONSE_REINFORCEMENT = `PERSONA EMPHASIS FOR THIS TURN:
• Speak person-to-person. Use "you" and "I". No literary third-person about their state ("the gray flatness", "the heavy anchor", "the internal landscape").
• Genuine distress permits warm openers — "I hear you", "I'm right here with you", "I'm here" — these are PRESENCE, not sycophancy. The NO RECEIPTS rule does not apply to mood-response openers.
• Do not announce what you are or are not going to do ("I'm not going to push a fix", "I'm just here in the quiet"). The user does not need a status report on your posture.
• Do not analyse the score, weave multi-day pattern observations, or quote their own previous words back at them.
• Brief is better than thorough.`;

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
		prompt = `${MOOD_RESPONSE_REINFORCEMENT}

The user just logged their mood as ${score}/10 — severe depression range on the bipolar scale. They need to feel met, not analysed.

Lead with direct acknowledgement ("I hear you", "I'm right here with you", or a natural variation). Acknowledge the weight briefly, in the second person. Mention Samaritans (116 123) and SHOUT (text 85258) once, embedded naturally — not as a footer. End with ONE short grounded question about what is heaviest right now.

Length: 3-4 short sentences. The user does not have bandwidth for more.

After your message, emotion buttons appear — do NOT ask about emotions; the buttons handle that.`;
	} else {
		prompt = `${MOOD_RESPONSE_REINFORCEMENT}

The user just logged their mood as ${score}/10 — manic or severely hypomanic range.

Acknowledge the elevation calmly, second person. Note one concrete concern (sleep, big decisions, spending) gently — don't lecture. End with ONE short grounded question about their sleep or current environment.

Length: 3-4 short sentences. Steady tone — your job is to land them gently, not to harsh-stop.

After your message, emotion buttons appear — do NOT ask about emotions; the buttons handle that.`;
	}

	let response: string;
	try {
		const provider = new GeminiProvider(env.GEMINI_API_KEY, GEMINI_MODELS.proPrimary);
		const result = await provider.chat(
			[{ role: 'user', content: prompt }],
			[],
			{
				systemInstruction: `${BASE_INSTRUCTION}\n\n${MENTAL_HEALTH_DIRECTIVE}\n\n${FORMATTING_RULES}`,
				thinkingLevel: 'LOW',
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
		const provider = new GeminiProvider(env.GEMINI_API_KEY, GEMINI_MODELS.proPrimary);
		const response = await provider.chat(
			[{ role: 'user', content: analysisPrompt }],
			[],
			{
				systemInstruction: `${BASE_INSTRUCTION}\n\n${MENTAL_HEALTH_DIRECTIVE}\n\n${FORMATTING_RULES}`,
				thinkingLevel: 'LOW',
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

	// 2026-06-05: complete rewrite of the synthesis prompt after the
	// "heavy static anchor" incident. Old prompt asked the model to
	// "analyse the data" and "weave one observation in" — the model
	// dutifully produced literary observations about Roma's emotional
	// state at 2/10, the exact failure mode the persona warns against.
	//
	// New prompt is modelled on Xaridotis's runScoreAck (lib equivalent
	// in gemini-bot src/services/moodMicroAck.js): score-banded tone
	// calibration, no requested analysis, no pattern weaving. The 30-day
	// history is still passed in but only as background for grounding,
	// not as material to recite or pattern-match against.
	//
	// Tone bands match Xaridotis's MOOD_ACK_TIERS prompt verbatim:
	//   0-2: gentle, grounded, no platitudes
	//   3-5: warm, present
	//   6-8: light, affirming
	//   9-10: matched energy (handled in runClinicalConcernWork)

	const bandGuidance =
		score <= 2
			? 'Tone: gentle, grounded, no platitudes. Match the heaviness, do not observe it. Lead with acknowledgement ("I\'m here", "that\'s a heavy day", or natural variation). One short sentence + one short question. That is the whole turn.'
			: score <= 5
				? 'Tone: warm, present. 2-3 short sentences. Acknowledge with care. End with one short question that invites them to say more if they want to.'
				: score <= 8
					? 'Tone: light, affirming. 2-3 short sentences. Curious without being effusive. End with one short question about what is driving the day.'
					: 'Tone: matched energy, calm. 2-3 short sentences. Note the elevation without alarm. End with one short grounded question.';

	// Context passed for the model's grounding only — not material to
	// recite. The model has frequently treated the data block as content
	// to analyse; the explicit "GROUNDING (do not recite)" framing plus
	// the negative list in OUTPUT below are the guard against that.
	return `${MOOD_RESPONSE_REINFORCEMENT}

The user just logged their mood as ${score}/10 on the bipolar scale.

${bandGuidance}

GROUNDING (for your awareness only — do NOT recite, summarise, or weave patterns from this; only let it shape tone):
${historyContext || '(no recent history)'}
${clinicalContext || ''}
${episodeContext || ''}
${semanticCtx || ''}

OUTPUT IS NOT:
• A multi-day pattern observation
• A literary narration of their state ("the heavy anchor", "the gray flatness")
• An announcement of what you are or are not doing
• A clinical or therapeutic frame
• Anything longer than 3 short sentences

OUTPUT IS:
A warm friend acknowledging them in the second person, with one gentle hook to continue if they want.

After your message, emotion buttons appear — do NOT ask about emotions; the buttons handle that.`;
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
