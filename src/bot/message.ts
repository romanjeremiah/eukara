// ============================================================
// Message Handler
//
// All data operations use userId (from.id), not chatId.
// chatId is only used for message delivery.
// ============================================================

import type { TelegramMessage } from '../types/telegram';
import type { AIMessage, AIMessagePart, AITool, ToolContext } from '../types/ai';
import { getProvider } from '../ai/router';
import * as telegram from '../lib/telegram';
import { stripLeakedThoughts, splitMessage } from '../lib/formatting';
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
import * as persona from '../services/persona';

// Telegram's Bot API caps file downloads at 20MB. Anything larger would
// need the Gemini Files API path, which is not implemented yet — we fail
// gracefully with a user-visible message instead.
const TELEGRAM_DOWNLOAD_LIMIT_BYTES = 20 * 1024 * 1024;

export async function handleMessage(
	msg: TelegramMessage,
	env: Env,
	tools: AITool[]
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

	// Ensure user profile + persona config exist
	await persona.ensureUser(env, userId, msg.from?.first_name, msg.from?.username, msg.from?.language_code);

	const isOwner = env.OWNER_ID && String(userId) === String(env.OWNER_ID);

	// Pick a chat action that reflects what we're actually doing — media
	// messages visibly signal the bot is processing something heavier.
	const chatAction = media
		? (media.kind === 'voice' || media.kind === 'audio' ? 'record_voice' : 'upload_photo')
		: 'typing';
	await telegram.sendChatAction(chatId, threadId, chatAction, env);

	// Check health check-in state (keyed by userId)
	let healthCheckin = isOwner
		? await env.CHAT_KV.get(`health_checkin_active_${userId}`)
		: null;

	// B6: Context gating. If a check-in is pending but the user is
	// clearly changing topic (longer, non-health-related message),
	// drop the check-in flag so the bot doesn't nag them about mood
	// mid-conversation. Short acknowledgements still count as
	// engagement.
	if (healthCheckin && userText.trim()) {
		const isHealthRelated = /\b(sleep|mood|medication|med|meds|anxious|anxiety|depressed|depress|feel|feeling|emotion|check.?in|tired|exhaust|rest)\b/i.test(userText);
		if (!isHealthRelated && userText.length > 10) {
			await env.CHAT_KV.delete(`health_checkin_active_${userId}`);
			healthCheckin = null;
			log.info('checkin_dropped_topic_change', { userId, userTextPreview: userText.slice(0, 50) });
		}
	}

	// B5: Conversational medication detection. If a `med_pending_*`
	// flag is set and the user's message matches confirmation phrases,
	// clear the flag and log the medication to today's mood entry.
	// Fires alongside the AI response, not instead of it.
	if (isOwner && userText.trim()) {
		const medPending = await env.CHAT_KV.get(`med_pending_${userId}`);
		if (medPending && /\b(took|taken|yes|yep|yeah|done|had them|swallowed|popped|sorted)\b/i.test(userText)) {
			await env.CHAT_KV.delete(`med_pending_${userId}`);
			await env.CHAT_KV.delete(`nudge_pending_${medPending}_${userId}`);
			// Log to mood journal — best effort, don't block the AI call
			import('../services/mood').then(async (mood) => {
				await mood.upsertEntry(env, userId, mood.todayLondon(), medPending as 'morning' | 'midday' | 'evening', {
					medication_taken: 1,
					medication_notes: `Confirmed conversationally: "${userText.slice(0, 100)}"`,
				});
				log.info('med_confirmed_conversational', { userId, period: medPending });
			}).catch(e => log.error('med_log_error', { msg: (e as Error).message }));
		}
	}

	// Route to AI provider. Media presence forces Gemini routing
	// because Workers AI chat models are text-only.
	const { provider, route } = getProvider(
		{
			userText,
			isOwner: !!isOwner,
			healthCheckinActive: healthCheckin,
			hasMedia: !!media,
		},
		env
	);

	// Build context — all queries use userId
	const isSubstantive = userText.length > 5;
	const [memCtx, semanticCtx] = await Promise.all([
		isSubstantive ? memory.getFormattedContext(env, userId) : Promise.resolve(''),
		isSubstantive ? vector.getSemanticContext(env, userId, userText) : Promise.resolve(''),
	]);

	// CoALA: batch episode + procedural queries
	let episodeCtx = '';
	let proceduralCtx = '';
	const isEmotional = /\b(anxious|depressed|panic|overwhelm|scared|lonely|empty|hopeless|angry|frustrated|sad|grief|trigger|manic|racing|numb|crying|breakdown|struggling|worried|stressed)\b/i.test(userText);

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

	// Dynamic context
	const dynamicContext = [
		`London Time: ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })} | Unix: ${Math.floor(Date.now() / 1000)}`,
		memCtx ? `\nMEMORY:\n${memCtx}` : '',
		semanticCtx,
		episodeCtx ? `\n${episodeCtx}` : '',
		proceduralCtx ? `\n${proceduralCtx}` : '',
		graphCtx ? `\n${graphCtx}` : '',
	].filter(Boolean).join('');

	// Build per-user system instruction (persona evolves per user)
	const systemInstruction = await persona.buildSystemInstruction(env, userId, dynamicContext);

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
	const toolContext: ToolContext = { userId, chatId, threadId, messageId };
	const maxToolRounds = 5;

	try {
		for (let round = 0; round < maxToolRounds; round++) {
			const response = await provider.chat(messages, tools, {
				temperature: 1.0,
				thinkingEffort: route.thinkingEffort,
				systemInstruction,
			});

			log.info('ai_response', { round, textLen: response.text?.length ?? 0, toolCalls: response.toolCalls?.length ?? 0 });

			if (response.text) fullText += response.text;

			if (response.toolCalls?.length) {
				for (const tc of response.toolCalls) {
					const tool = tools.find(t => t.schema.function.name === tc.name);
					if (!tool) continue;
					try {
						const result = await tool.execute(tc.args, env, toolContext);
						messages.push({ role: 'model', content: { type: 'tool_use', name: tc.name, args: tc.args, id: tc.id } });
						messages.push({ role: 'tool', content: { type: 'tool_result', toolCallId: tc.id, content: JSON.stringify(result) } });
						log.info('tool_executed', { tool: tc.name, status: result.status });
					} catch (e) {
						log.error('tool_error', { tool: tc.name, msg: (e as Error).message });
					}
				}
				continue;
			}
			break;
		}
	} catch (err) {
		log.error('ai_chat_error', { msg: (err as Error).message, provider: route.provider, model: route.model });
		fullText = "Sorry, I hit a snag processing that. Could you try again?";
	}

	// --- Send final response ---
	if (fullText.trim()) {
		fullText = stripLeakedThoughts(fullText);

		const btns = {
			inline_keyboard: [[
				{ text: '🔊 Voice', callback_data: 'action_voice' },
				{ text: '🗑️ Delete', callback_data: 'action_delete_msg' },
			]],
		};

		if (fullText.length > 3900) {
			const chunks = splitMessage(fullText);
			for (let i = 0; i < chunks.length; i++) {
				const isLast = i === chunks.length - 1;
				await telegram.sendMessage(chatId, threadId, chunks[i]!, env, {
					replyId: i === 0 ? messageId : undefined,
					markup: isLast ? btns : undefined,
				});
			}
		} else {
			await telegram.sendMessage(chatId, threadId, fullText, env, {
				replyId: messageId,
				markup: btns,
			});
		}
	}

	// --- Persist turn to conversation history ---
	// History is always stored as plain strings — media turns are
	// replaced with a text placeholder ("[user sent a voice note]")
	// so the model gets continuity without us having to serialise
	// base64 blobs into KV.
	if (fullText.trim()) {
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

	// --- Background: silent observation (uses userId) ---
	// Only runs when the user sent real text content — media-only turns
	// don't yield useful observation text for the CF AI extractor.
	const observationInput = userText || (media ? mediaPlaceholder(media.kind) : '');
	if (observationInput.length > 20 && fullText.length > 20) {
		import('../ai/background').then(async ({ extractObservation }) => {
			const obs = await extractObservation(env.AI, observationInput, fullText);
			if (!obs || obs.includes('NOTHING_NEW')) return;

			const obsMatch = obs.match(/OBSERVATION:\s*(.+)/);
			if (obsMatch?.[1]) {
				await memory.saveMemory(env, userId, 'observation', obsMatch[1].trim());
			}

			for (const match of obs.matchAll(/TRIPLE:\s*([^|]+)\|([^|]+)\|(.+)/g)) {
				const [, subject, predicate, object] = match;
				if (subject && predicate && object) {
					await knowledgeGraph.saveTriple(env, userId, subject.trim(), predicate.trim(), object.trim(), null, 'observation');
				}
			}
		}).catch(e => log.error('observation_error', { msg: (e as Error).message }));
	}

	log.info('message_handled', {
		userId,
		chatId,
		provider: route.provider,
		model: route.model.split('/').pop(),
		thinking: route.thinkingEffort,
		inputLen: userText.length,
		outputLen: fullText.length,
		hasMedia: !!media,
		mediaKind: media?.kind,
	});
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
			return 'Transcribe this and respond to whatever was said.';
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
