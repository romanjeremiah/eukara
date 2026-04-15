// ============================================================
// Queue Consumer
// All operations use userId for data isolation.
// chatId used only for message delivery.
// ============================================================

import { log } from '../lib/logger';
import { CF_MODELS } from '../config/models';

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

			const result = await env.AI.run(CF_MODELS.chat as unknown as keyof AiModels, {
				messages: [
					{ role: 'system', content: 'You are a caring AI companion. Be warm, brief, natural.' },
					{ role: 'user', content: prompt },
				],
				max_tokens: 200,
			}) as any;

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

			const result = await env.AI.run(CF_MODELS.chat as unknown as keyof AiModels, {
				messages: [
					{ role: 'system', content: 'You are a caring AI companion.' },
					{ role: 'user', content: 'Send a brief, gentle 1-sentence medication follow-up.' },
				],
				max_tokens: 100,
			}) as any;

			await sendTelegram(token, chatId, extractText(result) ?? 'Just checking — did you manage to take your meds?');
			break;
		}

		case 'spontaneous_outreach': {
			const result = await env.AI.run(CF_MODELS.chat as unknown as keyof AiModels, {
				messages: [
					{ role: 'system', content: 'You are a caring AI companion who occasionally checks in.' },
					{ role: 'user', content: 'Send a spontaneous, brief 1-2 sentence check-in message.' },
				],
				max_tokens: 200,
			}) as any;

			const message = extractText(result);
			if (message) await sendTelegram(token, chatId, message);
			break;
		}

		default:
			log.warn('unknown_queue_task', { type: task.type });
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
