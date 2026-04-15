// ============================================================
// Message Handler
//
// All data operations use userId (from.id), not chatId.
// chatId is only used for message delivery.
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
import * as persona from '../services/persona';

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

	if (!userText.trim()) return;

	// Ensure user profile + persona config exist
	await persona.ensureUser(env, userId, msg.from?.first_name, msg.from?.username, msg.from?.language_code);

	const isOwner = env.OWNER_ID && String(userId) === String(env.OWNER_ID);

	await telegram.sendChatAction(chatId, threadId, 'typing', env);

	// Check health check-in state (keyed by userId)
	const healthCheckin = isOwner
		? await env.CHAT_KV.get(`health_checkin_active_${userId}`)
		: null;

	// Route to AI provider
	const { provider, route } = getProvider(
		{ userText, isOwner: !!isOwner, healthCheckinActive: healthCheckin },
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

	const messages: AIMessage[] = [
		{ role: 'user', content: userText },
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

	// --- Background: silent observation (uses userId) ---
	if (userText.length > 20 && fullText.length > 20) {
		import('../ai/background').then(async ({ extractObservation }) => {
			const obs = await extractObservation(env.AI, userText, fullText);
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
	});
}
