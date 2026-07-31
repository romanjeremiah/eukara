// ============================================================
// Deep Research Workflow
//
// Triggers Gemini's Deep Research agent, polls for completion,
// saves full report to R2, and notifies the user.
//
// 2026-06-02 changes:
//   F3: chatId param kept for Telegram delivery + R2 path; userId
//       added for D1 inserts (memories use user_id).
//   Model stays as deep-research-pro-preview-12-2025 (Interactions
//   API agent, separate from the chat models).
// ============================================================

import { WorkflowEntrypoint, WorkflowStep } from 'cloudflare:workers';
import type { WorkflowEvent } from 'cloudflare:workers';

interface ResearchParams {
	chatId: number;
	userId: number;
	topic: string;
	manual?: boolean;
}

export class DeepResearchWorkflow extends WorkflowEntrypoint<Env, ResearchParams> {
	async run(event: WorkflowEvent<ResearchParams>, step: WorkflowStep) {
		const { chatId, userId, topic } = event.payload;

		// Step 1: Start the Deep Research agent
		const interactionId = await step.do('start-research', {
			retries: { limit: 2, delay: '10 seconds' },
			timeout: '30 seconds',
		}, async () => {
			const { GoogleGenAI } = await import('@google/genai');
			const ai = new GoogleGenAI({ apiKey: this.env.GEMINI_API_KEY });

			const interaction = await ai.interactions.create({
				input: topic,
				agent: 'deep-research-pro-preview-12-2025',
				background: true,
			});

			return interaction.id;
		});

		if (!interactionId) {
			return { status: 'failed', reason: 'Could not start research' };
		}

		// Step 2: Poll for completion (with step.sleep between polls)
		let reportText = '';
		const maxPolls = 20; // 20 polls × 15s sleep = 5 minutes max

		for (let i = 0; i < maxPolls; i++) {
			await step.sleep(`poll-wait-${i}`, '15 seconds');

			const result = await step.do(`poll-${i}`, {
				retries: { limit: 1, delay: '5 seconds' },
				timeout: '15 seconds',
			}, async () => {
				const { GoogleGenAI } = await import('@google/genai');
				const ai = new GoogleGenAI({ apiKey: this.env.GEMINI_API_KEY });

				const interaction = await ai.interactions.get(interactionId);
				const status = (interaction as any).status ?? 'unknown';

				if (status === 'COMPLETED' || status === 'completed') {
					// Extract the report text from the response
					const response = (interaction as any).response;
					const text = response?.candidates?.[0]?.content?.parts
						?.map((p: any) => p.text)
						?.join('') ?? '';
					return { done: true, text };
				}

				return { done: false, text: '' };
			});

			if (result.done) {
				reportText = result.text;
				break;
			}
		}

		if (!reportText) {
			return { status: 'timeout', reason: 'Research did not complete within 5 minutes' };
		}

		// Step 3: Save to R2 and D1
		await step.do('save-report', async () => {
			const timestamp = Date.now();
			const safeTopic = topic.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_').slice(0, 60);
			// R2 path uses userId for per-user namespacing.
			const r2Key = `research/${userId}/${timestamp}_${safeTopic}.txt`;

			// Save full report to R2
			if (this.env.MEDIA_BUCKET) {
				await this.env.MEDIA_BUCKET.put(r2Key, reportText);
			}

			// Save reference in D1 — user_id, not chat_id.
			await this.env.DB.prepare(
				'INSERT OR IGNORE INTO user_profiles (user_id) VALUES (?)'
			).bind(userId).run();

			await this.env.DB.prepare(
				'INSERT INTO memories (user_id, category, fact, importance_score) VALUES (?, ?, ?, ?)'
			).bind(
				userId, 'research_ref',
				`[R2:${r2Key}] Topic: ${topic.slice(0, 200)}`,
				1
			).run();

			// Save summary in memories
			const summary = reportText.slice(0, 800);
			await this.env.DB.prepare(
				'INSERT INTO memories (user_id, category, fact, importance_score) VALUES (?, ?, ?, ?)'
			).bind(userId, 'discovery', `Deep Research (${topic.slice(0, 80)}): ${summary}`, 1).run();
		});

		// Step 4: Notify user (chatId for delivery)
		await step.do('notify', async () => {
			const token = this.env.TELEGRAM_TOKEN;
			if (!token) return;

			const preview = reportText.slice(0, 2000);
			await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					chat_id: chatId,
					text: `🔬 <b>Deep Research Complete</b>\n\n<b>Topic:</b> <i>${topic.slice(0, 100)}</i>\n\n<blockquote expandable>${preview}</blockquote>`,
					parse_mode: 'HTML',
					reply_markup: {
						inline_keyboard: [[
							{ text: '📝 Full Report', callback_data: 'research_text_0' },
							{ text: '🔊 Listen', callback_data: 'research_audio_0' },
						]],
					},
				}),
			});
		});

		return { status: 'success', topic, reportLength: reportText.length };
	}
}
