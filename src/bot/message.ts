// ============================================================
// Message Handler
//
// All data operations use userId (from.id), not chatId.
// chatId is only used for message delivery.
// ============================================================

import type { TelegramMessage } from '../types/telegram';
import type { AIMessage, AIMessagePart, AIResponse, AITool, ModelRoute, ToolContext } from '../types/ai';
import { getProvider } from '../ai/router';
import { evaluateIntent } from '../ai/curator';
import type { CuratorResult } from '../ai/curator';
import { CloudflareProvider } from '../ai/cloudflare';
import { CF_MODELS } from '../config/models';
import * as telegram from '../lib/telegram';
import { handleWizardMessage } from './mood-wizard';
import { stripLeakedThoughts, splitMessage, normaliseMarkdown, enforceTagNesting } from '../lib/formatting';
import { log } from '../lib/logger';
import { loadHistory, saveHistory } from '../lib/history';
import {
	extractMediaFromMessage,
	mediaPlaceholder,
	arrayBufferToBase64,
	type MediaRef,
} from '../lib/media';
import * as memory from '../services/memory';
import * as episode from '../services/episode';
import * as knowledgeGraph from '../services/knowledge-graph';
import * as vector from '../services/vector';
import * as user from '../services/user';
import * as persona from '../services/persona';
import { getWeather, formatWeatherForContext } from '../services/weather';

// ============================================================
// AI chat with lane-appropriate fallback
//
// Two distinct strategies depending on which lane the router picked.
// 2026-06-04: split from a single function because the previous
// shared Tier-1 wrapper silently halved the casual-lane budget
// (90s to 30s) during the morning cascade reorder, hard-failing CF
// Gemma turns under load with no fallback.
//
// PRO LANE (route.provider === 'gemini')
// Four-tier cascade across Google + Cloudflare for emotional,
// multimodal, active-checkin, and sticky-context turns where
// resilience matters more than minimising spend.
//
//   Tier 1 (30s):  gemini-3.5-flash         3.x family, multimodal,
//                                            tool combination, fast.
//   Tier 2 (60s):  gemini-3.1-pro-preview         Deeper reasoning when
//                                            flash isn't enough.
//   Tier 3 (30s):  @cf/google/gemma-4-26b    Cross-provider resilience,
//                                            no Google dependency.
//   Tier 4 (30s):  gemini-3.1-flash-lite     Last-resort Gemini.
//
// CASUAL LANE (route.provider !== 'gemini', typically CF Gemma)
// Single call with one conditional retry. Routine non-emotional
// chat where the priority is fast happy-path response and graceful
// degradation when grounding misbehaves.
//
//   Attempt 1 (60s, 'casual_primary'):
//     as configured (with grounding if route allows).
//   Attempt 2 (30s, 'casual_no_grounding'):
//     retries the same model without web_search_options. Triggers
//     ONLY on timeout or CF 5006 schema validation error AND only
//     when grounding was enabled on Attempt 1. Other failures
//     (network, auth, content filter) re-throw immediately.
//
// Total worst-case wall clock: Pro lane 150s, casual lane 90s.
// Both sit well within the queue consumer's 15-min budget.
//
// Per-tier timeouts via Promise.race (wall-clock), not AbortSignal:
// provider-agnostic, no SDK-specific plumbing.
// ============================================================

/**
 * Wrap a promise with a wall-clock timeout via Promise.race.
 * Provider-agnostic (works for Gemini SDK and CF AI binding alike).
 * The underlying request continues in the background after timeout
 * fires — but since we're not in waitUntil(), the Worker runtime
 * cancels orphaned subrequests when the function returns.
 */
async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
	let timeoutId: ReturnType<typeof setTimeout> | null = null;
	const timeoutPromise = new Promise<never>((_, reject) => {
		timeoutId = setTimeout(
			() => reject(new Error(`${label} timed out after ${ms}ms`)),
			ms
		);
	});
	try {
		return await Promise.race([promise, timeoutPromise]);
	} finally {
		if (timeoutId !== null) clearTimeout(timeoutId);
	}
}

type ChatArgs = {
	messages: AIMessage[];
	tools: AITool[];
	systemInstruction?: string;
	thinkingLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
	enableGrounding: boolean;
};

type ProviderChat = (
	m: AIMessage[],
	t: AITool[],
	c: { systemInstruction?: string; thinkingLevel?: 'LOW' | 'MEDIUM' | 'HIGH'; enableGrounding?: boolean }
) => Promise<AIResponse>;

/**
 * Single-provider call with one conditional retry (formerly Casual Lane).
 * Since we now only use Cloudflare AI, all calls go through this path.
 *
 * Retry triggers ONLY when both:
 *   - The first attempt failed with a timeout OR a CF 5006 schema
 *     validation error (the two known modes that a grounding
 *     disable would actually fix).
 *   - Grounding was actually enabled on the first attempt.
 *
 * Other failures (network, auth, content filter) re-throw immediately
 * because a grounding-off retry wouldn't help and would just double
 * the user's wait time.
 */
async function chatWithFallback(
	route: ModelRoute,
	provider: { chat: ProviderChat },
	args: ChatArgs,
	env: Env,
): Promise<{ response: AIResponse; tierUsed: string }> {
	for (let cascadeAttempt = 1; cascadeAttempt <= 2; cascadeAttempt++) {
		// Attempt 1: as configured. 60s gives CF models room for grounding
		// latency without being unbounded.
		try {
			const response = await withTimeout(
				provider.chat(args.messages, args.tools, {
					systemInstruction: args.systemInstruction,
					thinkingLevel: args.thinkingLevel,
					enableGrounding: args.enableGrounding,
				}),
				60_000,
				'cf_primary'
			);
			return { response, tierUsed: `cf_primary_attempt_${cascadeAttempt}` };
		} catch (err) {
			const error = err as Error;
			const msg = error.message;
			const isTimeout = msg.includes('timed out');
			const is5006 = msg.includes('5006') || msg.toLowerCase().includes('anyof at');

			if (!args.enableGrounding || (!isTimeout && !is5006)) {
				if (cascadeAttempt === 2) throw error;
			} else {
				log.warn(`cf_retry_without_grounding_attempt_${cascadeAttempt}`, {
					model: route.model,
					reason: isTimeout ? 'timeout' : 'schema_5006',
					msg,
				});
			}
		}

		// Attempt 2: same model, grounding disabled. 30s budget. This path
		// is fast because grounding was the reason Attempt 1 was slow.
		try {
			const response = await withTimeout(
				provider.chat(args.messages, args.tools, {
					systemInstruction: args.systemInstruction,
					thinkingLevel: args.thinkingLevel,
					enableGrounding: false,
				}),
				30_000,
				'cf_no_grounding'
			);
			log.info(`cf_no_grounding_recovered_attempt_${cascadeAttempt}`, { model: route.model });
			return { response, tierUsed: `cf_no_grounding_attempt_${cascadeAttempt}` };
		} catch (err) {
			const error = err as Error;
			log.error(`cf_no_grounding_failed_attempt_${cascadeAttempt}`, { model: route.model, msg: error.message });
			if (cascadeAttempt === 2) throw error;
		}
	}
	throw new Error("CF cascade exhausted after 2 attempts");
}

// Telegram's Bot API caps file downloads at 20MB. Anything larger would
// need the Gemini Files API path, which is not implemented yet — we fail
// gracefully with a user-visible message instead.
const TELEGRAM_DOWNLOAD_LIMIT_BYTES = 20 * 1024 * 1024;

export async function handleMessage(
	msg: TelegramMessage,
	env: Env,
	tools: AITool[],
	options?: { forceHeavyLane?: boolean, curatorResult?: CuratorResult },
	ctx?: ExecutionContext
): Promise<void> {
	const chatId = msg.chat.id;
	const userId = msg.from?.id;
	if (!userId) return; // Can't process without a user identity

	const threadId = msg.message_thread_id ? String(msg.message_thread_id) : 'default';
	const userText = msg.text ?? msg.caption ?? '';
	const messageId = msg.message_id;

	// A message is processable if it has text OR a supported media attachment.
	const media = extractMediaFromMessage(msg);
	if (!userText.trim() && !media) return;

	// B6.5: Mood Wizard interception
	const isWizardHandled = await handleWizardMessage(msg, env);
	if (isWizardHandled) return;

	// Track last activity so proactive outreach doesn't double-text:
	// the cron spontaneous-outreach guard reads last_seen_<userId> and
	// skips if the user messaged within the last 3 hours. 7-day TTL
	// clears stale keys for dormant users.
	await env.CHAT_KV.put(`last_seen_${userId}`, String(Date.now()), { expirationTtl: 7 * 86400 });

	// 2026-06-04: a user message ends the proactive-silence chain.
	// Reset the unanswered counter so the cron escalation guard can
	// resume outreach. Best-effort: delete failures don't matter, the
	// key has a 7-day TTL and the worst case is one missed outreach.
	await env.CHAT_KV.delete(`proactive_unanswered_${userId}`).catch(() => {});

	// B7: Listening mode. If the user started a brain-dump session
	// via /listen, buffer their message and react with 👀 — DON'T run
	// the AI pipeline. The buffered messages will be synthesised as a
	// single prompt when they send /done.
	//
	// Cap the buffer at 100 entries so a forgotten `/listen` doesn't
	// accumulate unboundedly in KV. Gemini-bot learned this one the
	// hard way.
	const listening = await env.CHAT_KV.get(`listening_mode_${userId}`);
	if (listening) {
		const bufferKey = `listen_buffer_${userId}`;
		const bufferRaw = await env.CHAT_KV.get(bufferKey) ?? '[]';
		let buffer: string[];
		try {
			const parsed = JSON.parse(bufferRaw);
			buffer = Array.isArray(parsed) ? parsed.map(String) : [];
		} catch {
			buffer = [];
		}

		const timestamp = new Date().toLocaleTimeString('en-GB', {
			timeZone: 'Europe/London',
			hour12: false,
		});
		const entry = media
			? `[${timestamp}] ${mediaPlaceholder(media.kind, userText)}`
			: `[${timestamp}] ${userText}`;

		buffer.push(entry);
		if (buffer.length > 100) buffer = buffer.slice(-100);

		await env.CHAT_KV.put(bufferKey, JSON.stringify(buffer), { expirationTtl: 86400 });
		await telegram.sendReaction(chatId, messageId, '👀', env).catch(() => {});

		log.info('listen_buffered', { userId, entryCount: buffer.length, hasMedia: !!media });
		return;
	}

	// Ensure user profile + persona config exist
	await user.ensureUser(env, userId, msg.from?.first_name, msg.from?.username, msg.from?.language_code);

	// Read the user's timezone once per request — every time-aware
	// operation below (mood entry keys, dynamic context clock, B5
	// medication log) uses this. Reading once and passing in avoids
	// repeated DB hits for the same value.
	const userTz = await user.getUserTimezone(env, userId);
		
	// Personality traits from subconscious processing
	const traitsCtx = await memory.getMemoriesByCategory(env, userId, 'personality_trait', 10)
		.then(mems => mems.map(m => `- ${m.fact}`).join('\n'))
		.catch(() => '');

	const isOwner = env.OWNER_ID && String(userId) === String(env.OWNER_ID);

	// Pick a chat action that reflects what we're actually doing — media
	// messages visibly signal the bot is processing something heavier.
	const chatAction = media
		? (media.kind === 'voice' || media.kind === 'audio' ? 'record_voice' : 'upload_photo')
		: 'typing';
	await telegram.sendChatAction(chatId, threadId, chatAction, env);



	// Layer A1: Pre-gen Intent Triage
	// If the dispatcher didn't run it (e.g., non-owner traffic), run it now.
	const curatorResult = options?.curatorResult ?? await evaluateIntent(userText, env);



	// Layer A1: Pre-gen Intent Triage
	// Already ran above at line 307.

	// Layer A1: Clinical Safety Firewall (Hard Cut)
	if (curatorResult.isCrisis) {
		log.warn('clinical_safety_firewall_triggered', { userId, textPreview: userText.slice(0, 50) });
		const crisisResponse = 'I hear you, and I want you to know you are not alone right now. If things feel unmanageable, Samaritans are on 116 123 and SHOUT take texts on 85258. What has been the heaviest part today?';
		
		const crisisBtns = {
			inline_keyboard: [[
				{ text: '🔊 Voice', callback_data: 'action_voice' },
				{ text: '🗑️ Delete', callback_data: 'action_delete_msg', style: 'danger' as const },
			]],
		};

		const sendRes = await telegram.sendMessage(chatId, threadId, crisisResponse, env, { markup: crisisBtns });
		if (sendRes.ok) {
			const priorHistory = await loadHistory(env, chatId, threadId);
			const historyTurnText = media ? mediaPlaceholder(media.kind, userText) : userText;
			const historyMessages: AIMessage[] = [
				...priorHistory,
				{ role: 'user', content: historyTurnText },
				{ role: 'model', content: crisisResponse },
			];
			await saveHistory(env, chatId, threadId, historyMessages);
		}
		return;
	}

	// Route to AI provider. Media presence forces Gemini routing
	// because Workers AI chat models are text-only.
	// `options.forceHeavyLane` is set by the webhook dispatcher when the
	// sticky-Pro topic classifier decided the conversation should stay
	// on Pro despite no emotional keywords in this turn.
	const { provider, route } = getProvider(
		{
			userText,
			isOwner: !!isOwner,

			hasMedia: !!media,
			forceHeavyLane: options?.forceHeavyLane,
			curatorResult,
		},
		env
	);

	// Build context — all queries use userId. Weather runs alongside
	// memory/semantic fetches so it doesn't serialise latency; it
	// degrades to null (empty string) on any failure so a weather API
	// outage never blocks message handling.
	const isSubstantive = userText.length > 5;
	// Computed before context assembly so it can gate discoveries out
	// of the chat context on emotional turns (best practice: don't
	// surface "things I read" while someone is in distress).
	const isEmotional = /\b(anxious|depressed|panic|overwhelm|scared|lonely|empty|hopeless|angry|frustrated|sad|grief|trigger|manic|racing|numb|crying|breakdown|struggling|worried|stressed)\b/i.test(userText);
	const [memCtx, semanticCtx, weather] = await Promise.all([
		isSubstantive ? memory.getFormattedContext(env, userId, !isEmotional) : Promise.resolve(''),
		isSubstantive ? vector.getSemanticContext(env, userId, userText) : Promise.resolve(''),
		getWeather(env, userId, userTz).catch(() => null),
	]);

	// CoALA: batch episode + procedural queries
	let episodeCtx = '';
	let proceduralCtx = '';

	if (isEmotional) {
		const [episodes, insights] = await Promise.all([
			episode.getRecentEpisodes(env, userId, 5).catch(() => []),
			episode.getProceduralInsights(env, userId).catch(() => ({ worked: [], didntWork: [] })),
		]);
		episodeCtx = episode.formatEpisodesForContext(episodes);
		proceduralCtx = episode.formatProceduralContext(insights);
	}

	// GraphRAG context
	let graphCtx = '';
	if (isSubstantive) {
		const keywords = userText.split(/\s+/).filter(w => w.length > 3).slice(0, 3);
		for (const kw of keywords) {
			const triples = await knowledgeGraph.queryRelated(env, userId, kw, 5).catch(() => []);
			if (triples.length) {
				graphCtx = knowledgeGraph.formatGraphContext(triples);
				break;
			}
		}
	}

	// Dynamic context — clock rendered in the user's local timezone
	// so the model's sense of "now" matches the user's. Weather is
	// optional ambient context; null when the user's timezone isn't
	// in the coords lookup or the API fetch failed.
	const localNow = new Date().toLocaleString('en-GB', { timeZone: userTz });
	
	// Layer A0: Ingress Context Injection (Telemetry)
	const telemetryRaw = await env.CHAT_KV.get(`telemetry_${userId}`);
	let telemetryCtx = '';
	if (telemetryRaw) {
		try {
			const t = JSON.parse(telemetryRaw);
			telemetryCtx = `Device Telemetry: Battery ${t.battery}%${t.charging ? ' (Charging)' : ''}, Network: ${t.connection}`;
		} catch {
			telemetryCtx = `Device Telemetry: ${telemetryRaw}`;
		}
	}

	const dynamicContext = [
		`Local Time (${userTz}): ${localNow} | Unix: ${Math.floor(Date.now() / 1000)}`,
		telemetryCtx,
		formatWeatherForContext(weather),
		memCtx ? `\nMEMORY:\n${memCtx}` : '',
		semanticCtx,
		episodeCtx ? `\n${episodeCtx}` : '',
		proceduralCtx ? `\n${proceduralCtx}` : '',
		traitsCtx ? `\nEVOLVING PERSONALITY TRAITS:\n${traitsCtx}` : '',
		graphCtx ? `\n${graphCtx}` : '',
	].filter(Boolean).join('\n');

	// Build per-user system instruction (persona evolves per user)
	const systemInstruction = await persona.buildSystemInstruction(env, userId, dynamicContext, route.reason);

	// Load prior conversation history — sanitised on load, tool-loop
	// entries stripped. History is always text-only; the current turn
	// may be multimodal.
	const priorHistory = await loadHistory(env, chatId, threadId);

	// Build the current user turn. If media is present, download it,
	// convert to base64, and send as multimodal parts. If the download
	// fails (size limit, API error), degrade to a text-only turn that
	// tells the user and the model what happened.
	const currentUserContent = await buildUserTurnContent(userText, media, env, chatId, threadId, messageId);
	if (!currentUserContent) return; // unrecoverable media error, already messaged the user

	const messages: AIMessage[] = [
		...priorHistory,
		{ role: 'user', content: currentUserContent },
	];

	// --- AI Call with tool loop ---
	let fullText = '';
	let lastAnnotations: unknown[] | undefined;
	let lastGroundingMetadata: any;
	// 2026-07-01: records a thrown AI error so the post-loop salvage can
	// decide whether to retry the primary model or only the fallback, and
	// so we only surface an error to the user if every recovery attempt
	// also fails.
	let aiError: string | null = null;
	// Snapshot the current turn (prior history + this user message) BEFORE
	// the tool loop mutates `messages` with tool_use/tool_result entries.
	// The salvage/fallback calls below reuse this clean turn to force a
	// plain reply without replaying a half-finished tool exchange.
	const initialMessages: AIMessage[] = messages.slice();
	const toolContext: ToolContext = { userId, chatId, threadId, messageId };
	const maxToolRounds = 5;

	try {
		for (let round = 0; round < maxToolRounds; round++) {
			const { response, tierUsed } = await chatWithFallback(route, provider, {
				messages,
				tools,
				enableGrounding: route.enableGrounding ?? false,
			}, env);

			log.info('ai_response', { round, tier: tierUsed, textLen: response.text?.length ?? 0, toolCalls: response.toolCalls?.length ?? 0 });

			// Capture grounding outputs for the most recent round; rendered
			// once at the end as citations after the final reply.
			if (response._annotations) lastAnnotations = response._annotations;
			if (response._groundingMetadata) lastGroundingMetadata = response._groundingMetadata;

			// 2026-06-02: only the FINAL round's text is shown to the user.
			// Rounds that also call tools may emit planning/reasoning prose
			// in the content stream (Gemma 4 with enable_thinking, Gemini
			// 3.x with some grounded turns). That text is the model talking
			// to itself about what tool to call, not the user-facing reply.
			// Concatenating across rounds was leaking that reasoning into
			// the chat. The model's actual response is whatever it produces
			// in the round where it stops calling tools.
			if (response.toolCalls?.length) {
				// Tool-call round: DROP this round's text (treat as planning).
				// The model's user-facing reply will come in the round where
				// it stops calling tools (handled by the `break` below).

				// Decision A: tool combination on Gemini Pro lane. When the
				// provider returns _geminiRawContent, push the raw parts as
				// a single model AIMessage with _rawProviderParts so the
				// next iteration echoes back thoughtSignature / functionCall
				// parts verbatim. Otherwise (non-Gemini providers), keep the
				// previous synthesised {tool_use, tool_result} shape that
				// stringifies for legacy providers.
				const rawContent = response._geminiRawContent as { parts?: unknown[] } | undefined;
				const usePreservedParts = route.provider === 'gemini' && rawContent?.parts && Array.isArray(rawContent.parts);

				if (usePreservedParts) {
					messages.push({ role: 'model', content: '', _rawProviderParts: rawContent!.parts });
				} else {
					for (const tc of response.toolCalls) {
						messages.push({ role: 'model', content: { type: 'tool_use', name: tc.name, args: tc.args, id: tc.id } });
					}
				}

				const userParts: Array<Record<string, unknown>> = [];

				for (const tc of response.toolCalls) {
					const tool = tools.find(t => t.schema.function.name === tc.name);
					if (!tool) continue;
					try {
						const result = await tool.execute(tc.args, env, toolContext);
						if (usePreservedParts) {
							userParts.push({
								functionResponse: {
									name: tc.name,
									id: tc.id,
									response: { content: JSON.stringify(result) },
								},
							});
						} else {
							messages.push({ role: 'tool', content: { type: 'tool_result', toolCallId: tc.id, content: JSON.stringify(result) } });
						}
						log.info('tool_executed', { tool: tc.name, status: result.status });
					} catch (e) {
						const errorMsg = (e as Error).message;
						log.error('tool_error', { tool: tc.name, msg: errorMsg });
						const errorResult = { status: 'error', error: errorMsg };
						if (usePreservedParts) {
							userParts.push({
								functionResponse: {
									name: tc.name,
									id: tc.id,
									response: { content: JSON.stringify(errorResult) },
								},
							});
						} else {
							messages.push({ role: 'tool', content: { type: 'tool_result', toolCallId: tc.id, content: JSON.stringify(errorResult) } });
						}
					}
				}

				if (usePreservedParts && userParts.length > 0) {
					// Gemini expects all functionResponse parts in a single user turn
					messages.push({
						role: 'user',
						content: '',
						_rawProviderParts: userParts,
					});
				}
				continue;
			}

			// Final round: no tool calls. This IS the user-facing reply.
			if (response.text) fullText = response.text;
			break;
		}
	} catch (err) {
		const error = err as Error;
		log.error('ai_chat_error', {
			msg: error.message,
			stack: error.stack?.slice(0, 500),
			provider: route.provider,
			model: route.model,
			messagesCount: messages.length,
			firstContentType: typeof messages[0]?.content,
			lastContentType: typeof messages[messages.length - 1]?.content,
			hasMedia: !!media,
		});
		// 2026-07-01: record the error instead of surfacing it immediately.
		// The no-silence salvage below tries the grounded fallback first; we
		// only show the warning if every recovery attempt also fails.
		aiError = error.message || 'unknown';
	}

		// --- No-silence safeguard (2026-07-01) ---
		// A turn must never end silently. Two failure modes reach here with an
		// empty fullText: (a) the tool loop hit maxToolRounds without a final
		// text answer, or the model returned empty content (no throw); (b) the
		// primary call threw (aiError set). Force one plain, tool-free reply.
		// If the primary threw we skip re-calling it and go straight to the
		// grounded fallback (Gemma); otherwise we retry the primary tool-free
		// first, then fall back. Grounding is enabled only on the Gemma model.
		if (!fullText.trim()) {
			const salvageModels = aiError
				? [CF_MODELS.fallbackPro]
				: [route.model, CF_MODELS.fallbackPro];
			for (const salvageModel of salvageModels) {
				try {
					const salvageProvider = new CloudflareProvider(env.AI, salvageModel);
					const salvage = await withTimeout(
						salvageProvider.chat(initialMessages, [], {
							systemInstruction,
							enableGrounding: salvageModel === CF_MODELS.fallbackPro,
						}),
						40_000,
						'cf_salvage',
					);
					if (salvage.text?.trim()) {
						fullText = salvage.text;
						if (salvage._annotations) lastAnnotations = salvage._annotations;
						log.warn('ai_salvage_recovered', { model: salvageModel, afterError: !!aiError });
						break;
					}
				} catch (salvageErr) {
					log.warn('ai_salvage_failed', { model: salvageModel, msg: (salvageErr as Error).message });
				}
			}
		}

		// If primary + salvage + fallback all failed and there was a real
		// error, surface it so the turn isn't a confusing blank.
		if (!fullText.trim() && aiError) {
			fullText = `⚠️ <b>AI call failed</b>\n<code>${aiError.slice(0, 300)}</code>\n\n<i>provider: ${route.provider} · model: ${route.model}</i>`;
		}

	// --- Send final response ---
	// Track whether delivery actually succeeded so we can:
	//   (a) log it accurately in message_handled — previously this log
	//       fired regardless of send outcome, giving false positives
	//   (b) skip the history save when delivery failed (no point
	//       poisoning the conversation with replies the user never saw)
	//   (c) attempt a plain-text fallback on the first HTML failure
	let sent = false;
	let sendError: string | null = null;
	let sendAttempts = 0;

	if (fullText.trim()) {
		fullText = stripLeakedThoughts(fullText);
		// Model sometimes slips into markdown despite the HTML-only
		// directive in FORMATTING_RULES. Convert common markdown
		// syntax (###, **bold**, *italic*, `code`, - bullets) to
		// Telegram HTML equivalents before sending.
		fullText = normaliseMarkdown(fullText);
		// Fix illegal tag nesting (formatting inside <pre>/<code>,
		// nested blockquotes). Telegram returns HTTP 400 for these
		// and drops the message silently — this pass strips the
		// inner tags but keeps the text, so the message delivers.
		fullText = enforceTagNesting(fullText);

		// Append grounding citations (Decisions A + B). Rendered as a
		// compact source list under the main reply so the model's
		// natural text stays clean. Skipped if no grounding fired.
		const citations = formatCitations(lastAnnotations, lastGroundingMetadata);
		if (citations) fullText += citations;

		const btns = {
			inline_keyboard: [[
				{ text: '🔊 Voice', callback_data: 'action_voice' },
				{ text: '🗑️ Delete', callback_data: 'action_delete_msg', style: 'danger' as const },
			]],
		};

		// Sending uses per-chunk fallback. Each chunk is attempted as HTML;
		// on failure (most commonly a Telegram 400 over malformed entities)
		// the same chunk is retried as plain text. If both fail for a chunk,
		// the chunk is lost and the loop continues with the next one so the
		// user still gets the rest of the message rather than nothing.
		//
		// 2026-06-04: this replaces the previous design where any chunked-
		// send failure triggered a full re-send of the entire message as
		// plain text. That caused visible duplication (user saw the first
		// few HTML chunks followed by the entire plain version), which read
		// as random truncated fragments in the chat.

		const stripToPlain = (s: string): string =>
			s
				.replace(/<[^>]+>/g, '')
				.replace(/&lt;/g, '<')
				.replace(/&gt;/g, '>')
				.replace(/&amp;/g, '&')
				.replace(/&quot;/g, '"')
				.trim();

		// Send one chunk with HTML-then-plain fallback. Returns true if the
		// chunk landed in either form.
		const sendChunkWithFallback = async (
			chunkBody: string,
			opts: { replyId?: number; markup?: typeof btns | undefined }
		): Promise<boolean> => {
			sendAttempts++;
			try {
				const res = await telegram.sendMessage(chatId, threadId, chunkBody, env, opts);
				if (res.ok) return true;
				sendError = res.description ?? 'unknown';
			} catch (err) {
				sendError = `fetch threw: ${(err as Error).message}`;
			}

			const plain = stripToPlain(chunkBody);
			if (!plain) return false;
			sendAttempts++;
			try {
				const res = await telegram.sendMessage(chatId, threadId, plain, env, opts);
				if (res.ok) {
					log.warn('chunk_html_failed_plain_succeeded', {
						chatId,
						userId,
						prevError: sendError,
					});
					return true;
				}
				sendError = `plain: ${res.description ?? 'unknown'}`;
			} catch (err) {
				sendError = `plain fetch threw: ${(err as Error).message}`;
			}
			return false;
		};

		// Split into chunks if needed; short replies stay as a single element.
		const chunks = fullText.length > 3900 ? splitMessage(fullText) : [fullText];
		const failedChunks: number[] = [];

		for (let i = 0; i < chunks.length; i++) {
			const isFirst = i === 0;
			const isLast = i === chunks.length - 1;
			const ok = await sendChunkWithFallback(chunks[i]!, {
				replyId: isFirst ? messageId : undefined,
				markup: isLast ? btns : undefined,
			});
			if (!ok) failedChunks.push(i);
		}

		sent = failedChunks.length === 0;

		if (!sent) {
			log.error('send_failed_chunks', {
				chatId,
				userId,
				failedChunks,
				totalChunks: chunks.length,
				attempts: sendAttempts,
				lastError: sendError,
				textLen: fullText.length,
			});
		}
	}

	// --- Persist turn to conversation history ---
	// History is always stored as plain strings — media turns are
	// replaced with a text placeholder ("[user sent a voice note]")
	// so the model gets continuity without us having to serialise
	// base64 blobs into KV.
	//
	// Skip saving if delivery failed — saving a model response the
	// user never saw would poison the conversation (subsequent turns
	// would reference context the user didn't receive).
	if (fullText.trim() && sent) {
		const historyTurnText = media
			? mediaPlaceholder(media.kind, userText)
			: userText;

		// Rebuild the messages array with the text-only version of the
		// current user turn so sanitizeHistory in lib/history.ts stores it
		// cleanly. The tool-loop entries already in `messages` will be
		// dropped by the sanitiser on next load.
		const historyMessages: AIMessage[] = [
			...priorHistory,
			{ role: 'user', content: historyTurnText },
			{ role: 'model', content: fullText },
		];
		await saveHistory(env, chatId, threadId, historyMessages);
	}

	// --- Background: Subconscious Processing (Domain 3 Layer G & F3) ---
	// Only runs when the user sent real text content — media-only turns
	// don't yield useful observation text for the CF AI extractor.
	// Also skip if delivery failed: extracting observations from an
	// undelivered reply would create memories grounded in context the
	// user doesn't share.
	const observationInput = userText || (media ? mediaPlaceholder(media.kind) : '');
	if (sent && observationInput.length > 20 && fullText.length > 20) {
		const bgTask = import('../ai/background').then(async ({ runSubconsciousProcessing }) => {
			const obs = await runSubconsciousProcessing(env.AI, observationInput, fullText);
			if (!obs) return;

			// 1. Knowledge Graph Triples
			if (obs.triples && Array.isArray(obs.triples)) {
				for (const t of obs.triples) {
					const parts = t.split('|').map(s => s.trim());
					if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
						await knowledgeGraph.saveTriple(env, userId, parts[0], parts[1], parts[2], null, 'observation');
					}
				}
			}

			// 2. Personality Traits
			if (obs.personality_traits && Array.isArray(obs.personality_traits)) {
				for (const trait of obs.personality_traits) {
					if (typeof trait === 'string' && trait.length > 0) {
						await memory.saveMemory(env, userId, 'personality_trait', trait);
					}
				}
			}

			// 3. Mood/Emotion extraction (silent logging if appropriate)
			if (obs.mood_score !== undefined && obs.emotions && Array.isArray(obs.emotions)) {
				// We don't want to log mood automatically without user consent, 
				// but we could store it as an implicit mood entry in memory.
				await memory.saveMemory(env, userId, 'implicit_mood', `Mood: ${obs.mood_score}, Emotions: ${obs.emotions.join(', ')}`);
			}

			// 4. Episode Topic Tracking
			if (obs.episode_topic && typeof obs.episode_topic === 'string') {
				await memory.saveMemory(env, userId, 'episode_topic', obs.episode_topic);
			}
		});

		if (ctx) {
			ctx.waitUntil(bgTask.catch(e => log.error('bg_subconscious_failed', { msg: (e as Error).message })));
		}
	}

	log.info('message_handled', {
		userId,
		chatId,
		provider: route.provider,
		model: route.model.split('/').pop(),
		route_reason: route.reason,
		force_pro_lane: !!options?.forceHeavyLane,
		inputLen: userText.length,
		outputLen: fullText.length,
		hasMedia: !!media,
		mediaKind: media?.kind,
		sent,
		sendAttempts,
		...(sendError ? { sendError } : {}),
	});

	// Sticky Pro routing (2026-06-02): write KV anchor after a successful
	// Pro turn so the next user message can be content-classified against
	// this topic by the webhook dispatcher (src/index.ts). The classifier
	// (src/services/topicShift.ts) decides whether the next message stays
	// on Pro or releases to normal routing.
	//
	// Only writes for the owner (single-user-feature for now) on real
	// text turns that successfully delivered. Media-only turns don't
	// produce a useful text anchor for the classifier.
	//
	// TTL 2h: long enough for natural pauses, short enough that stale
	// sessions expire without a classifier call.
	if (sent && isOwner && route.provider === 'gemini' && userText.trim().length > 0) {
		try {
			await env.CHAT_KV.put(
				`pro_context_${userId}`,
				JSON.stringify({
					anchor: userText.slice(0, 300),
					route_reason: route.reason,
					ts: Date.now(),
				}),
				{ expirationTtl: 2 * 3600 }
			);
			log.info('sticky_pro_written', { userId, route_reason: route.reason });
		} catch (e) {
			log.warn('sticky_pro_write_failed', { userId, msg: (e as Error).message });
		}
	}
}


/**
 * Build the `content` field for the current user turn.
 *
 * - No media → returns the plain user text string.
 * - Media within the 20MB limit → downloads, converts to base64,
 *   returns multimodal parts (text prompt + inline_data).
 * - Media too large or download fails → messages the user directly,
 *   returns null so the caller can bail out.
 *
 * When the media is present but the user sent no caption, we inject
 * a short default prompt so the model always has something to respond
 * to ("Describe this image", "Transcribe this voice note", etc).
 */
async function buildUserTurnContent(
	userText: string,
	media: MediaRef | null,
	env: Env,
	chatId: number,
	threadId: string,
	messageId: number
): Promise<string | AIMessagePart[] | null> {
	if (!media) {
		return userText;
	}

	// Enforce the 20MB Telegram bot download cap up-front.
	if (media.fileSize && media.fileSize > TELEGRAM_DOWNLOAD_LIMIT_BYTES) {
		const mb = (media.fileSize / 1024 / 1024).toFixed(1);
		await telegram.sendMessage(chatId, threadId,
			`⚠️ That ${media.kind} is ${mb}MB, which is over my 20MB processing limit. Could you send a smaller version?`,
			env, { replyId: messageId });
		return null;
	}

	let buffer: ArrayBuffer | null;
	try {
		buffer = await telegram.downloadFile(media.fileId, env);
	} catch (e) {
		log.error('media_download_error', { kind: media.kind, msg: (e as Error).message });
		buffer = null;
	}

	if (!buffer) {
		await telegram.sendMessage(chatId, threadId,
			`⚠️ I couldn't download that ${media.kind}. Could you try sending it again?`,
			env, { replyId: messageId });
		return null;
	}

	const base64 = arrayBufferToBase64(buffer);

	// Fire-and-forget: store the raw bytes in R2 for future recall.
	// MEDIA_BUCKET binding is in wrangler.jsonc but may be absent locally.
	if (env.MEDIA_BUCKET) {
		const key = `media/${chatId}/${messageId}-${media.kind}`;
		env.MEDIA_BUCKET.put(key, buffer, {
			httpMetadata: { contentType: media.mimeType },
			customMetadata: { chatId: String(chatId), kind: media.kind },
		}).catch(e => log.warn('r2_store_error', { key, msg: (e as Error).message }));
	}

	// Always include a text prompt — if the user sent no caption, pick
	// a sensible default based on media kind so the model has direction.
	const promptText = userText.trim() || defaultPromptFor(media.kind);

	return [
		{ type: 'text', text: promptText },
		{ type: 'inline_data', mimeType: media.mimeType, data: base64 },
	];
}

/**
 * Default prompt injected when the user sends media without a caption.
 * Keeps the prompt conversational rather than command-like.
 */
function defaultPromptFor(kind: MediaRef['kind']): string {
	switch (kind) {
		case 'voice':
		case 'audio':
			// 2026-06-03: previously said 'Transcribe this and respond'. The
			// 'transcribe' instruction made Gemini prepend a literal
			// 'Transcription: "..."' line to its reply, leaking the audio
			// text into the user-facing message body. Switched to a pure
			// response framing so the model just answers the spoken content.
			return 'Respond naturally to what was said in this audio, as if it had been spoken to you in conversation.';
		case 'video':
		case 'video_note':
			return 'Watch this and share what stands out. Comment on anything noteworthy.';
		case 'photo':
		case 'sticker':
			return 'Describe what you see, and respond to it as if I had shared it in conversation.';
		case 'document':
			return 'Read this and respond to whatever it contains.';
	}
}

/**
 * Format grounding citations into a compact source list appended to
 * the bot's reply. Handles both formats:
 *   - CF Gemma annotations: [{type:'url_citation', url_citation:{url,title,...}}]
 *   - Gemini groundingMetadata: {webSearchQueries, groundingChunks:[{web:{uri,title}}]}
 *
 * Returns empty string when nothing to cite. Output is Telegram HTML,
 * deduplicated by URL, capped at 6 sources to keep the message tidy.
 */
function formatCitations(
	annotations: unknown[] | undefined,
	groundingMetadata: any
): string {
	const sources: Array<{ url: string; title: string }> = [];
	const seen = new Set<string>();

	const push = (url: unknown, title: unknown) => {
		if (typeof url !== 'string' || !url.startsWith('http')) return;
		if (seen.has(url)) return;
		seen.add(url);
		sources.push({
			url,
			title: typeof title === 'string' && title.trim() ? title.trim().slice(0, 80) : url.replace(/^https?:\/\//, '').split('/')[0]!,
		});
	};

	// CF Gemma path
	if (Array.isArray(annotations)) {
		for (const ann of annotations) {
			const a = ann as { type?: string; url_citation?: { url?: unknown; title?: unknown } };
			if (a?.type === 'url_citation' && a.url_citation) {
				push(a.url_citation.url, a.url_citation.title);
			}
		}
	}

	// Gemini path. groundingChunks each have `web: {uri, title}`.
	const chunks = groundingMetadata?.groundingChunks;
	if (Array.isArray(chunks)) {
		for (const chunk of chunks) {
			const web = (chunk as { web?: { uri?: unknown; title?: unknown } })?.web;
			if (web) push(web.uri, web.title);
		}
	}

	if (!sources.length) return '';

	const capped = sources.slice(0, 6);
	const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	const items = capped.map((s, i) =>
		`<a href="${escapeHtml(s.url)}">[${i + 1}] ${escapeHtml(s.title)}</a>`
	).join('\n');

	return `\n\n<blockquote expandable><i>Sources</i>\n${items}</blockquote>`;
}
