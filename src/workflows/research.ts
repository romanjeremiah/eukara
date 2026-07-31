// ============================================================
// Deep Research Workflow
//
// OpenAI mode runs a stateless Sol research request with web search inside a
// durable Workflow step. Cloudflare mode preserves the Gemini interaction
// polling path until final cutover.
//
// 2026-06-02 changes:
//   F3: chatId param kept for Telegram delivery + R2 path; userId
//       added for D1 inserts (memories use user_id).
//   Model stays as deep-research-pro-preview-12-2025 (Interactions
//   API agent, separate from the chat models).
// ============================================================

import { WorkflowEntrypoint, WorkflowStep } from 'cloudflare:workers';
import type { WorkflowEvent } from 'cloudflare:workers';
import { createOpenAIProvider, getAIProviderMode } from '../ai/provider-factory';
import { OPENAI_MODELS } from '../config/models';

interface ResearchParams {
	chatId: number;
	userId: number;
	topic: string;
	manual?: boolean;
}

export class DeepResearchWorkflow extends WorkflowEntrypoint<Env, ResearchParams> {
	async run(event: WorkflowEvent<ResearchParams>, step: WorkflowStep) {
		const { chatId, userId, topic } = event.payload;
		let reportText = '';

		if (getAIProviderMode(this.env) === 'openai') {
			reportText = await step.do('openai-research', {
				retries: { limit: 2, delay: '15 seconds', backoff: 'exponential' },
				timeout: '5 minutes',
			}, async () => {
				const provider = createOpenAIProvider(
					this.env,
					OPENAI_MODELS.research,
					{ timeoutMs: 240_000 },
				);
				const response = await provider.chat(
					[{ role: 'user', content: topic }],
					undefined,
					{
						enableGrounding: true,
						maxTokens: 12_000,
						systemInstruction: [
							'Produce a rigorous, evidence-led research report.',
							'Distinguish verified facts from interpretation.',
							'Include material uncertainty, implementation implications, and a source list.',
						].join(' '),
						thinkingLevel: 'HIGH',
					},
				);
				return appendOpenAICitations(response.text, response._annotations);
			});
		} else {
			// Preserve the existing Gemini background interaction while the
			// production feature flag remains on Cloudflare mode.
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

			const maxPolls = 20;
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
		}

		if (!reportText) {
			return { status: 'timeout', reason: 'Research did not complete within 5 minutes' };
		}

		// Step 3: Save to R2 and D1
		await step.do('save-report', async () => {
			const safeTopic = topic.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_').slice(0, 60);
			const r2Key = `research/${userId}/${event.instanceId}_${safeTopic}.txt`;

			// Save full report to R2
			if (this.env.MEDIA_BUCKET) {
				await this.env.MEDIA_BUCKET.put(r2Key, reportText);
			}

			// Save reference in D1 — user_id, not chat_id.
			await this.env.DB.prepare(
				'INSERT OR IGNORE INTO user_profiles (user_id) VALUES (?)'
			).bind(userId).run();

			const referenceFact = `[R2:${r2Key}] Topic: ${topic.slice(0, 200)}`;
			const summaryFact = `Deep Research [${event.instanceId}] (${topic.slice(0, 80)}): ${reportText.slice(0, 800)}`;
			const insertIfAbsent = (
				category: string,
				fact: string,
			) => this.env.DB.prepare(
				`INSERT INTO memories (user_id, category, fact, importance_score)
				 SELECT ?, ?, ?, 1
				 WHERE NOT EXISTS (
					SELECT 1 FROM memories WHERE user_id = ? AND category = ? AND fact = ?
				 )`,
			).bind(userId, category, fact, userId, category, fact);
			await this.env.DB.batch([
				insertIfAbsent('research_ref', referenceFact),
				insertIfAbsent('discovery', summaryFact),
			]);
		});

		// Step 4: Notify user (chatId for delivery)
		await step.do('notify', async () => {
			const token = this.env.TELEGRAM_TOKEN;
			if (!token) return;

			const notifyKey = `workflow_notify:${event.instanceId}`;
			if (await this.env.CHAT_KV.get(notifyKey)) return;
			const preview = escapeHtml(reportText.slice(0, 2000));
			const safeTopic = escapeHtml(topic.slice(0, 100));
			const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					chat_id: chatId,
					text: `🔬 <b>Deep Research Complete</b>\n\n<b>Topic:</b> <i>${safeTopic}</i>\n\n<blockquote expandable>${preview}</blockquote>`,
					parse_mode: 'HTML',
					reply_markup: {
						inline_keyboard: [[
							{ text: '📝 Full Report', callback_data: 'research_text_0' },
							{ text: '🔊 Listen', callback_data: 'research_audio_0' },
						]],
					},
				}),
			});
			const result = await response.json() as { ok?: boolean; description?: string };
			if (!response.ok || !result.ok) {
				throw new Error(`Telegram research notification failed: ${result.description ?? response.status}`);
			}
			await this.env.CHAT_KV.put(notifyKey, 'sent', {
				expirationTtl: 30 * 24 * 60 * 60,
			});
		});

		return { status: 'success', topic, reportLength: reportText.length };
	}
}

/**
 * Preserve direct source URLs from Responses annotations in stored reports.
 */
function appendOpenAICitations(text: string, annotations: unknown[] | undefined): string {
	if (!annotations?.length) return text.trim();
	const sources = new Map<string, string>();
	for (const annotation of annotations) {
		const citation = annotation as {
			type?: string;
			url_citation?: { title?: unknown; url?: unknown };
		};
		if (citation.type !== 'url_citation') continue;
		const url = citation.url_citation?.url;
		if (typeof url !== 'string' || !url.startsWith('http')) continue;
		const title = citation.url_citation?.title;
		sources.set(url, typeof title === 'string' ? title : url);
	}
	if (!sources.size) return text.trim();
	const sourceList = Array.from(sources, ([url, title]) => `- ${title}: ${url}`)
		.join('\n');
	return `${text.trim()}\n\nSources\n${sourceList}`;
}

/**
 * Escape model output before inserting it into a Telegram HTML payload.
 */
function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}
