// ============================================================
// Architect Workflow
//
// Durable innovation review. Runs as a Workflow to avoid
// the timeout issues that plagued the inline /architect command.
// Steps: Research → Generate proposals → Save → Notify
// ============================================================

import { WorkflowEntrypoint, WorkflowStep } from 'cloudflare:workers';
import type { WorkflowEvent } from 'cloudflare:workers';

interface ArchitectParams {
	chatId: number;
	statusMsgId?: number;
}

export class ArchitectWorkflow extends WorkflowEntrypoint<Env, ArchitectParams> {
	async run(event: WorkflowEvent<ArchitectParams>, step: WorkflowStep) {
		const { chatId, statusMsgId } = event.payload;
		const token = this.env.TELEGRAM_TOKEN;

		const notify = async (text: string) => {
			if (!statusMsgId || !token) return;
			await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					chat_id: chatId, message_id: statusMsgId,
					text: `⚙️ <b>Architecture Review</b>\n\n${text}`,
					parse_mode: 'HTML',
				}),
			}).catch(() => {});
		};

		// Step 1: Research via Tavily (if available)
		const researchContext = await step.do('research', {
			retries: { limit: 2, delay: '5 seconds' },
			timeout: '20 seconds',
		}, async () => {
			await notify('<i>Step 1/3: Searching platforms and competitors...</i>');

			if (!this.env.TAVILY_API_KEY) return '';
			try {
				const queries = [
					'Telegram Bot API latest features 2026',
					'Google Gemini API new agents features 2026',
					'AI chatbot innovations mental health 2026',
				];
				const results = await Promise.all(queries.map(q =>
					fetch('https://api.tavily.com/search', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							api_key: this.env.TAVILY_API_KEY,
							query: q, search_depth: 'basic', max_results: 3, include_answer: true,
						}),
					}).then(r => r.json() as Promise<{ answer?: string; results?: Array<{ title: string; content: string }> }>)
						.catch(() => ({ results: [] }))
				));

				return results
					.flatMap(r => r.results ?? [])
					.map(r => `${r.title}: ${r.content?.slice(0, 200)}`)
					.join('\n')
					.slice(0, 4000);
			} catch {
				return '';
			}
		});

		// Step 2: Generate proposals via Gemini Pro
		const suggestions = await step.do('generate-proposals', {
			retries: { limit: 2, delay: '10 seconds', backoff: 'exponential' },
			timeout: '60 seconds',
		}, async () => {
			await notify('<i>Step 2/3: Generating innovation proposals with Gemini Pro...</i>');

			const { GoogleGenAI } = await import('@google/genai');
			const ai = new GoogleGenAI({ apiKey: this.env.GEMINI_API_KEY });

			const researchSection = researchContext
				? `\n\nRESEARCH FINDINGS:\n${researchContext}` : '';

			const response = await ai.models.generateContent({
				model: 'gemini-3.1-pro-preview',
				contents: `You are an AI product strategist reviewing a Telegram AI companion chatbot. Find 3 unique innovations.

PROJECT: TypeScript on Cloudflare Workers. Uses Gemma 4 (CF AI), Gemini Pro (fallback), D1, Vectorize, Queues, Workflows.
${researchSection}

RESEARCH ACROSS: Telegram Bot API, Gemini API, Cloudflare Workers AI, competitors (Pi, Replika, ChatGPT), therapeutic AI (AEDP, IFS, DBT).

For each of 3 proposals: what it is, why unique, implementation sketch, why it matters for mental health.
Be bold.`,
				config: {
					temperature: 0.7,
					tools: researchContext ? [] : [{ googleSearch: {} }],
				},
			});

			const text = response.candidates?.[0]?.content?.parts
				?.filter((p: any) => p.text && !p.thought)
				?.map((p: any) => p.text)
				?.join('') ?? '';

			return text.trim();
		});

		if (!suggestions || suggestions.length < 100) {
			await notify('<i>❌ Could not generate meaningful suggestions. Try again later.</i>');
			return { status: 'failed' };
		}

		// Step 3: Save and notify
		await step.do('save-and-notify', async () => {
			await notify('<i>Step 3/3: Saving and delivering results...</i>');

			// Save to memory
			const today = new Date().toISOString().split('T')[0];
			await this.env.DB.prepare(
				'INSERT OR IGNORE INTO user_profiles (chat_id) VALUES (?)'
			).bind(chatId).run();
			await this.env.DB.prepare(
				'INSERT INTO memories (chat_id, category, fact, importance_score) VALUES (?, ?, ?, ?)'
			).bind(chatId, 'discovery', `Architect review (${today}): ${suggestions.slice(0, 500)}`, 1).run();

			// Send final result
			const finalText = suggestions.slice(0, 3900);
			await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					chat_id: chatId, message_id: statusMsgId,
					text: `<b>Architecture Review</b>\n\n${finalText}`,
					parse_mode: 'HTML',
					reply_markup: {
						inline_keyboard: [[
							{ text: '✅ Approve', callback_data: 'approve_pr' },
							{ text: '❌ Dismiss', callback_data: 'action_dismiss_pr' },
						]],
					},
				}),
			});
		});

		// Clear lock
		await this.env.CHAT_KV.delete(`architect_lock_${chatId}`);

		return { status: 'success', length: suggestions.length };
	}
}
