// ============================================================
// Message Handler
//
// Processes incoming user messages. Routes to AI provider,
// handles tool calls, manages streaming drafts.
// Replaces the 1,578-line handlers.js monolith.
// ============================================================

import type { TelegramMessage } from '../types/telegram';
import type { AIMessage, AITool, ToolContext } from '../types/ai';
import { getProvider } from '../ai/router';
import * as telegram from '../lib/telegram';
import { stripLeakedThoughts, splitMessage } from '../lib/formatting';
import { log } from '../lib/logger';
import * as memory from '../services/memory';
import * as episode from '../services/episode';
import * as knowledgeGraph from '../services/knowledge-graph';
import * as vector from '../services/vector';

const DRAFT_THROTTLE_MS = 500;

export async function handleMessage(
	msg: TelegramMessage,
	env: Env,
	tools: AITool[]
): Promise<void> {
	const chatId = msg.chat.id;
	const threadId = msg.message_thread_id ? String(msg.message_thread_id) : 'default';
	const userText = msg.text ?? msg.caption ?? '';
	const messageId = msg.message_id;

	if (!userText.trim()) return;

	const isOwner = env.OWNER_ID && String(msg.from?.id) === String(env.OWNER_ID);

	// Show typing indicator
	await telegram.sendChatAction(chatId, threadId, 'typing', env);

	// Check health check-in state
	const healthCheckin = isOwner
		? await env.CHAT_KV.get(`health_checkin_active_${chatId}`)
		: null;

	// Route to the right AI provider
	const { provider, route } = getProvider(
		{ userText, isOwner: !!isOwner, healthCheckinActive: healthCheckin },
		env
	);

	// Build context
	const isSubstantive = userText.length > 5;
	const [memCtx, semanticCtx] = await Promise.all([
		isSubstantive ? memory.getFormattedContext(env, chatId) : Promise.resolve(''),
		isSubstantive ? vector.getSemanticContext(env, chatId, userText) : Promise.resolve(''),
	]);

	// CoALA: batch episode + procedural queries for emotional messages
	let episodeCtx = '';
	let proceduralCtx = '';
	const isEmotional = /\b(anxious|depressed|panic|overwhelm|scared|lonely|empty|hopeless|angry|frustrated|sad|grief|trigger|manic|racing|numb|crying|breakdown|struggling|worried|stressed)\b/i.test(userText);

	if (isEmotional) {
		const [episodes, insights] = await Promise.all([
			episode.getRecentEpisodes(env, chatId, 5).catch(() => []),
			episode.getProceduralInsights(env, chatId).catch(() => ({ worked: [], didntWork: [] })),
		]);
		episodeCtx = episode.formatEpisodesForContext(episodes);
		proceduralCtx = episode.formatProceduralContext(insights);
	}

	// GraphRAG context
	let graphCtx = '';
	if (isSubstantive) {
		const keywords = userText.split(/\s+/).filter(w => w.length > 3).slice(0, 3);
		for (const kw of keywords) {
			const triples = await knowledgeGraph.queryRelated(env, chatId, kw, 5).catch(() => []);
			if (triples.length) {
				graphCtx = knowledgeGraph.formatGraphContext(triples);
				break;
			}
		}
	}

	// Build system instruction with dynamic context
	const dynamicContext = [
		`[Context] London Time: ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })} | Unix: ${Math.floor(Date.now() / 1000)}`,
		memCtx ? `\nMEMORY:\n${memCtx}` : '',
		semanticCtx,
		episodeCtx ? `\n${episodeCtx}` : '',
		proceduralCtx ? `\n${proceduralCtx}` : '',
		graphCtx ? `\n${graphCtx}` : '',
	].filter(Boolean).join('');

	// TODO: Load persona instruction from config
	const systemInstruction = `You are Xaridotis, a genuine AI companion.\n\n${dynamicContext}`;

	// Build message history
	const messages: AIMessage[] = [
		{ role: 'user', content: userText },
	];

	// --- AI Call with tool loop ---
	let fullText = '';
	const toolContext: ToolContext = { chatId, threadId, messageId, userId: msg.from?.id };
	const maxToolRounds = 5;

	try {
		for (let round = 0; round < maxToolRounds; round++) {
			const useStreaming = round === 0 && provider.chatStream;

			if (useStreaming && provider.chatStream) {
				// Streaming first pass
				let draftId = `d_${Date.now()}`;
				let lastDraftTime = 0;
				let passText = '';
				const toolCalls: Array<{ name: string; args: Record<string, unknown>; id: string }> = [];

				for await (const chunk of provider.chatStream(messages, tools, {
					temperature: 1.0,
					thinkingEffort: route.thinkingEffort,
					systemInstruction,
				})) {
					if (chunk.type === 'text' && chunk.text) {
						passText += chunk.text;
						fullText += chunk.text;

						const now = Date.now();
						if (now - lastDraftTime >= DRAFT_THROTTLE_MS && fullText.trim()) {
							const safeDraft = fullText.replace(/<[^>]*$/, '');
							if (safeDraft.trim()) {
								telegram.sendMessageDraft(chatId, threadId, draftId, safeDraft, env, messageId);
								lastDraftTime = now;
							}
						}
					} else if (chunk.type === 'tool_call' && chunk.toolCall) {
						toolCalls.push(chunk.toolCall);
					}
				}

				// Execute tool calls if any
				if (toolCalls.length) {
					for (const tc of toolCalls) {
						const tool = tools.find(t => t.schema.function.name === tc.name);
						if (!tool) continue;
						try {
							const result = await tool.execute(tc.args, env, toolContext);
							messages.push({ role: 'model', content: { type: 'tool_use', name: tc.name, args: tc.args, id: tc.id } });
							messages.push({ role: 'tool', content: { type: 'tool_result', toolCallId: tc.id, content: JSON.stringify(result) } });
						} catch (e) {
							log.error('tool_error', { tool: tc.name, msg: (e as Error).message });
						}
					}
					continue; // Next round to get AI response with tool results
				}
				break; // No tool calls, done

			} else {
				// Non-streaming pass (tool result follow-ups)
				const response = await provider.chat(messages, tools, {
					temperature: 1.0,
					thinkingEffort: route.thinkingEffort,
					systemInstruction,
				});

				if (response.text) fullText += response.text;

				if (response.toolCalls?.length) {
					for (const tc of response.toolCalls) {
						const tool = tools.find(t => t.schema.function.name === tc.name);
						if (!tool) continue;
						try {
							const result = await tool.execute(tc.args, env, toolContext);
							messages.push({ role: 'model', content: { type: 'tool_use', name: tc.name, args: tc.args, id: tc.id } });
							messages.push({ role: 'tool', content: { type: 'tool_result', toolCallId: tc.id, content: JSON.stringify(result) } });
						} catch (e) {
							log.error('tool_error', { tool: tc.name, msg: (e as Error).message });
						}
					}
					continue;
				}
				break;
			}
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
			// Delete the streaming draft and send final formatted message
			const draftKey = `draft_${chatId}_d_${Date.now()}`;
			const draftMsgId = await env.CHAT_KV.get(`draft_${chatId}_d_${messageId}`);
			if (draftMsgId) {
				await telegram.editMessage(chatId, parseInt(draftMsgId), fullText, env, btns);
				await env.CHAT_KV.delete(`draft_${chatId}_d_${messageId}`);
			} else {
				await telegram.sendMessage(chatId, threadId, fullText, env, {
					replyId: messageId,
					markup: btns,
				});
			}
		}
	}

	// --- Background: silent observation (fire-and-forget) ---
	if (userText.length > 20 && fullText.length > 20) {
		import('../ai/background').then(async ({ extractObservation }) => {
			const obs = await extractObservation(env.AI, userText, fullText);
			if (!obs || obs.includes('NOTHING_NEW')) return;

			// Save observations
			const obsMatch = obs.match(/OBSERVATION:\s*(.+)/);
			if (obsMatch?.[1]) {
				await memory.saveMemory(env, chatId, 'observation', obsMatch[1].trim());
			}

			// Save triples
			for (const match of obs.matchAll(/TRIPLE:\s*([^|]+)\|([^|]+)\|(.+)/g)) {
				const [, subject, predicate, object] = match;
				if (subject && predicate && object) {
					await knowledgeGraph.saveTriple(
						env, chatId,
						subject.trim(), predicate.trim(), object.trim(),
						null, 'observation'
					);
				}
			}
		}).catch(e => log.error('observation_error', { msg: (e as Error).message }));
	}

	log.info('message_handled', {
		chatId,
		provider: route.provider,
		model: route.model.split('/').pop(),
		thinking: route.thinkingEffort,
		inputLen: userText.length,
		outputLen: fullText.length,
	});
}
