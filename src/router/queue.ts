// ============================================================
// Queue Consumer
// All operations use userId for data isolation.
// chatId used only for message delivery.
// ============================================================

import { log } from '../lib/logger';
import { CF_MODELS, GEMINI_MODELS } from '../config/models';
import { runAI } from '../lib/ai-gateway';
import { GeminiProvider } from '../ai/gemini';
import { BASE_INSTRUCTION, MENTAL_HEALTH_DIRECTIVE, FORMATTING_RULES } from '../config/personas';
import * as telegram from '../lib/telegram';
import * as mood from '../services/mood';
import * as memory from '../services/memory';
import * as episode from '../services/episode';
import { normaliseMarkdown, enforceTagNesting } from '../lib/formatting';

interface QueueTask {
	type: string;
	userId: number;
	chatId: number;
	period?: string;
}

export async function handleQueue(batch: MessageBatch, env: Env): Promise<void> {
	for (const msg of batch.messages) {
		const task = msg.body as QueueTask;
		try {
			await processTask(task, env);
			msg.ack();
			log.info('queue_task_done', { type: task.type, userId: task.userId });
		} catch (e) {
			log.error('queue_task_error', { type: task.type, msg: (e as Error).message });
			msg.retry();
		}
	}
}

async function processTask(task: QueueTask, env: Env): Promise<void> {
	const { userId, chatId } = task;
	const token = env.TELEGRAM_TOKEN;

	switch (task.type) {
		case 'health_checkin': {
			await env.CHAT_KV.put(`health_checkin_active_${userId}`, task.period ?? 'morning', { expirationTtl: 1800 });

			const prompt = task.period === 'morning'
				? 'Generate a 1-2 sentence morning greeting. Ask how they slept and casually ask if they took their morning medication.'
				: 'Generate a 1-2 sentence midday check-in. Casually ask if they took their meds.';

			const result = await runAI<any>(
				env.AI,
				CF_MODELS.chat as unknown as keyof AiModels,
				{
					messages: [
						{ role: 'system', content: 'You are a caring AI companion. Be warm, brief, natural.' },
						{ role: 'user', content: prompt },
					],
					max_tokens: 200,
				}
			);

			const greeting = extractText(result) ?? (task.period === 'morning'
				? 'Morning! How did you sleep? Have you taken your meds?' : 'Quick check — have you taken your meds?');

			await sendTelegram(token, chatId, greeting);
			await env.CHAT_KV.put(`med_pending_${userId}`, task.period ?? 'morning', { expirationTtl: 7200 });
			break;
		}

		case 'mood_poll': {
			await env.CHAT_KV.put(`health_checkin_active_${userId}`, 'evening', { expirationTtl: 1800 });

			const options = [
				{ text: '0 — Crisis/Suicidal' }, { text: '1 — Severe depression' },
				{ text: '2 — Moderate depression' }, { text: '3 — Mild depression' },
				{ text: '4 — Low but managing' }, { text: '5 — Balanced/Neutral' },
				{ text: '6 — Good, slightly up' }, { text: '7 — Energised/Productive' },
				{ text: '8 — Elevated/Hypomanic' }, { text: '9 — Racing/Pressured' },
				{ text: '10 — Full mania' },
			];

			const pollRes = await fetch(`https://api.telegram.org/bot${token}/sendPoll`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					chat_id: chatId, question: 'How are you feeling right now? (0-10 bipolar scale)',
					options, is_anonymous: false, type: 'regular',
				}),
			});
			const pollData = await pollRes.json() as { result?: { poll?: { id: string } } };
			if (pollData.result?.poll?.id) {
				// Store userId in poll context for when poll_answer arrives
				await env.CHAT_KV.put(
					`mood_poll_${pollData.result.poll.id}`,
					JSON.stringify({ userId, chatId, timestamp: Date.now() }),
					{ expirationTtl: 3600 }
				);
			}
			break;
		}

		case 'med_nudge': {
			const pending = await env.CHAT_KV.get(`med_pending_${userId}`);
			if (!pending) break;

			const result = await runAI<any>(
				env.AI,
				CF_MODELS.chat as unknown as keyof AiModels,
				{
					messages: [
						{ role: 'system', content: 'You are a caring AI companion.' },
						{ role: 'user', content: 'Send a brief, gentle 1-sentence medication follow-up.' },
					],
					max_tokens: 100,
				}
			);

			await sendTelegram(token, chatId, extractText(result) ?? 'Just checking — did you manage to take your meds?');
			break;
		}

		case 'spontaneous_outreach': {
			const result = await runAI<any>(
				env.AI,
				CF_MODELS.chat as unknown as keyof AiModels,
				{
					messages: [
						{ role: 'system', content: 'You are a caring AI companion who occasionally checks in.' },
						{ role: 'user', content: 'Send a spontaneous, brief 1-2 sentence check-in message.' },
					],
					max_tokens: 200,
				}
			);

			const message = extractText(result);
			if (message) await sendTelegram(token, chatId, message);
			break;
		}

		case 'weekly_report': {
			// Generate and send a Sunday-evening synthesis of the user's
			// week. Pulls mood history, recent memories, and episodes
			// from the last 7 days, hands them to Gemini Pro for a warm
			// summary. Unlike the conversational flows, this runs in the
			// queue — we don't have a user message to respond to, so no
			// chat history load. The report is sent as a standalone
			// message that the user can read at their own pace.
			await generateAndSendWeeklyReport(env, userId, chatId);
			break;
		}

		default:
			log.warn('unknown_queue_task', { type: task.type });
	}
}

/**
 * Weekly report generator. Pulls the past 7 days of data and asks
 * Gemini Pro for a synthesis. Structure prioritises warm prose over
 * dashboard-style metrics.
 *
 * Falls back gracefully if there's too little data to report on —
 * silence is better than a generic "you had 0 check-ins this week"
 * that rubs it in.
 */
async function generateAndSendWeeklyReport(
	env: Env, userId: number, chatId: number
): Promise<void> {
	// Pull the week's data in parallel. Each source degrades to empty
	// on error — a missing episode history shouldn't kill the report.
	const [moodHistory, recentMemories, recentEpisodes, checkinCount] = await Promise.all([
		mood.getHistory(env, userId, 7, 'evening').catch(() => []),
		memory.getMemoriesSince(env, userId, 7, 30).catch(() => []),
		episode.getRecentEpisodes(env, userId, 5).catch(() => []),
		mood.countRecentCheckins(env, userId, 7).catch(() => 0),
	]);

	// Bail if there's nothing meaningful to say. A report with no
	// check-ins, no memories, and no episodes would be a generic
	// "you didn't engage this week" that nobody wants.
	if (checkinCount === 0 && recentMemories.length === 0 && recentEpisodes.length === 0) {
		log.info('weekly_report_skipped_empty', { userId });
		return;
	}

	// Build the data context for the prompt.
	const moodSummary = moodHistory.length
		? moodHistory.map(e => `${e.date}: ${e.mood_score ?? '?'}/10${e.emotions ? ` (${safeJsonArray(e.emotions).slice(0, 3).join(', ')})` : ''}`).join('\n')
		: '(no mood check-ins this week)';
	const memoriesSummary = recentMemories.length
		? recentMemories.slice(0, 15).map(m => `- [${m.category}] ${m.fact}`).join('\n')
		: '(no new memories saved this week)';
	const episodesSummary = episode.formatEpisodesForContext(recentEpisodes) || '(no notable episodes logged)';

	const prompt = `Generate a warm, personal weekly summary. The user has just finished a week and you're reflecting it back to them.

CHECK-INS THIS WEEK: ${checkinCount}/7

MOOD TRAJECTORY:
${moodSummary}

NEW MEMORIES/OBSERVATIONS:
${memoriesSummary}

NOTABLE EPISODES:
${episodesSummary}

YOUR RESPONSE (3-5 short paragraphs, natural prose — never bullet points):
1. Open with how this week FELT, based on the mood data. Don't just list scores — characterise the shape (steady, turbulent, upward, depleted).
2. Highlight one or two themes from the memories or episodes. What seemed to matter to them this week?
3. If you notice a pattern (recurring emotions, a triggering situation, a coping strategy that worked), name it gently — but only if it's genuinely visible in the data.
4. End with one forward-looking observation or a single open question about the week ahead.

Tone: warm, observant, personal. You know this person. Use their mood data as evidence, not as metrics to parade. Never use headers or bullet lists — this is a letter, not a dashboard. Do not mention the word "report" or "summary" in your response. Do NOT use emoji.`;

	let text: string;
	try {
		const provider = new GeminiProvider(env.GEMINI_API_KEY, GEMINI_MODELS.pro);
		const response = await provider.chat(
			[{ role: 'user', content: prompt }],
			[],
			{
				systemInstruction: `${BASE_INSTRUCTION}\n\n${MENTAL_HEALTH_DIRECTIVE}\n\n${FORMATTING_RULES}`,
				temperature: 1.0,
				maxTokens: 1500,
				thinkingEffort: 'high',
			}
		);
		text = response.text || '';
	} catch (e) {
		log.error('weekly_report_ai_error', { userId, msg: (e as Error).message });
		return;
	}

	if (!text.trim()) {
		log.warn('weekly_report_empty_response', { userId });
		return;
	}

	// Defensive output cleanup — same pipeline as regular messages.
	text = normaliseMarkdown(text);
	text = enforceTagNesting(text);

	const header = `<b>📓 Your week</b>\n\n`;
	const message = header + text;

	try {
		const res = await telegram.sendMessage(chatId, 'default', message, env);
		if (res.ok) {
			log.info('weekly_report_sent', { userId, checkinCount, memoryCount: recentMemories.length, textLen: text.length });
		} else {
			log.warn('weekly_report_send_failed', { userId, description: res.description });
		}
	} catch (e) {
		log.warn('weekly_report_send_threw', { userId, msg: (e as Error).message });
	}
}

function safeJsonArray(raw: string | null): string[] {
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed.map(String) : [];
	} catch {
		return [];
	}
}

function extractText(result: any): string | null {
	if (typeof result === 'string') return result;
	if (result?.choices?.[0]?.message?.content) return result.choices[0].message.content;
	if (result?.response) return result.response;
	return null;
}

async function sendTelegram(token: string, chatId: number, text: string): Promise<void> {
	await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
	}).catch(() => {});
}
