// ============================================================
// Queue Consumer
//
// Handles all LLM-calling background tasks asynchronously.
// No timeout pressure. Automatic retries on failure.
// ============================================================

import { log } from '../lib/logger';
import { CF_MODELS } from '../config/models';

interface QueueTask {
	type: string;
	chatId: number;
	period?: string;
	[key: string]: unknown;
}

export async function handleQueue(batch: MessageBatch, env: Env): Promise<void> {
	for (const msg of batch.messages) {
		const task = msg.body as QueueTask;
		try {
			const chatId = task.chatId ?? Number(env.OWNER_ID);
			await processTask(task, chatId, env);
			msg.ack();
			log.info('queue_task_done', { type: task.type, period: task.period });
		} catch (e) {
			log.error('queue_task_error', { type: task.type, msg: (e as Error).message });
			msg.retry();
		}
	}
}

async function processTask(task: QueueTask, chatId: number, env: Env): Promise<void> {
	const token = env.TELEGRAM_TOKEN;

	switch (task.type) {
		case 'health_checkin': {
			// Set check-in flag
			await env.CHAT_KV.put(`health_checkin_active_${chatId}`, task.period ?? 'morning', { expirationTtl: 1800 });

			// Generate greeting using Gemma 4 (free)
			const prompt = task.period === 'morning'
				? 'Generate a 1-2 sentence morning greeting. Ask how they slept and casually ask if they took their morning medication. Keep it warm and conversational.'
				: 'Generate a 1-2 sentence midday check-in. Casually ask if they took their meds. Keep it brief and natural.';

			const result = await env.AI.run(CF_MODELS.chat as unknown as keyof AiModels, {
				messages: [
					{ role: 'system', content: 'You are a caring AI companion. Be warm, brief, natural.' },
					{ role: 'user', content: prompt },
				],
				max_tokens: 200,
			}) as { response?: string } | string;

			const greeting = (typeof result === 'string' ? result : result?.response)
				?? (task.period === 'morning' ? 'Morning! How did you sleep? Have you taken your meds?' : 'Quick check — have you taken your meds?');

			await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ chat_id: chatId, text: greeting, parse_mode: 'HTML' }),
			});

			await env.CHAT_KV.put(`med_pending_${chatId}`, task.period ?? 'morning', { expirationTtl: 7200 });
			break;
		}

		case 'mood_poll': {
			await env.CHAT_KV.put(`health_checkin_active_${chatId}`, 'evening', { expirationTtl: 1800 });

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
					chat_id: chatId,
					question: 'How are you feeling right now? (0-10 bipolar scale)',
					options,
					is_anonymous: false,
					type: 'regular',
				}),
			});

			const pollData = await pollRes.json() as { result?: { poll?: { id: string } } };
			const pollId = pollData.result?.poll?.id;
			if (pollId) {
				await env.CHAT_KV.put(`mood_poll_${pollId}`, JSON.stringify({ chatId, timestamp: Date.now() }), { expirationTtl: 3600 });
			}
			break;
		}

		case 'med_nudge': {
			const pending = await env.CHAT_KV.get(`med_pending_${chatId}`);
			if (!pending) break;

			const result = await env.AI.run(CF_MODELS.chat as unknown as keyof AiModels, {
				messages: [
					{ role: 'system', content: 'You are a caring AI companion.' },
					{ role: 'user', content: 'Send a brief, gentle 1-sentence follow-up about medication. Be natural, like a friend would.' },
				],
				max_tokens: 100,
			}) as { response?: string } | string;

			const nudge = (typeof result === 'string' ? result : result?.response)
				?? 'Just checking — did you manage to take your meds?';

			await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ chat_id: chatId, text: nudge, parse_mode: 'HTML' }),
			});
			break;
		}

		case 'spontaneous_outreach': {
			const result = await env.AI.run(CF_MODELS.chat as unknown as keyof AiModels, {
				messages: [
					{ role: 'system', content: 'You are a caring AI companion who occasionally checks in. Be brief, warm, and reference something interesting.' },
					{ role: 'user', content: 'Send a spontaneous, brief 1-2 sentence message to check in. Maybe share an interesting thought or observation.' },
				],
				max_tokens: 200,
			}) as { response?: string } | string;

			const message = (typeof result === 'string' ? result : result?.response);
			if (message) {
				await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
				});
			}
			break;
		}

		default:
			log.warn('unknown_queue_task', { type: task.type });
	}
}
