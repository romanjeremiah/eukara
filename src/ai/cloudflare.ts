// ============================================================
// Cloudflare AI Provider
//
// Implements AIProvider using Workers AI models.
// Primary provider for ~80% of traffic (free tier).
// Uses OpenAI-compatible function calling format.
//
// Workers AI calls go through runAI() from lib/ai-gateway.ts
// which transparently falls back to direct invocation if the
// AI Gateway is unavailable.
// ============================================================

import type {
	AIProvider, AIMessage, AITool, AIProviderConfig,
	AIResponse, AIStreamChunk, AIToolCall, AIMessageContent,
} from '../types/ai';
import { CF_MODELS } from '../config/models';
import { log } from '../lib/logger';
import { runAI } from '../lib/ai-gateway';

export class CloudflareProvider implements AIProvider {
	readonly name = 'cloudflare';
	private ai: Ai;
	private model: string;
	private useOpenAICompat: boolean;
	private supportsVision: boolean;
	private supportsGrounding: boolean;

	constructor(ai: Ai, model?: string) {
		this.ai = ai;
		this.model = model ?? CF_MODELS.chat;

		// Cloudflare has standardised on the OpenAI-compatible schema for
		// all modern chat models (verified against sync-input.json schemas
		// 2026-05-16). These models accept max_completion_tokens,
		// reasoning_effort, parallel_tool_calls, tool_choice, response_format
		// with json_schema, chat_template_kwargs, web_search_options, and
		// (where the model supports it) multipart user content with
		// type='image_url' | 'input_audio' | 'file'.
		//
		// Older models (Llama 3.x and earlier) use the legacy RoleScopedChatInput
		// shape with string-only content and `max_tokens`.
		this.useOpenAICompat = [
			'@cf/meta/llama-3.3-70b-instruct-fp8-fast',
			'@cf/google/gemma-4-26b-a4b-it',
			'@cf/qwen/qwen3-30b-a3b-fp8',
			'@cf/zai-org/glm-4.7-flash',
			'@cf/moonshotai/kimi-k2.6',
			'@cf/meta/llama-4-scout-17b-16e-instruct',
			'@cf/meta/llama-3.2-3b-instruct',
			'@cf/meta/llama-3.2-1b-instruct',
		].includes(this.model);

		// Vision-capable subset of the OpenAI-compat models. Adding a
		// model here enables `image_url` parts in user message content.
		this.supportsVision = [
			'@cf/google/gemma-4-26b-a4b-it',
			'@cf/moonshotai/kimi-k2.6',
			'@cf/meta/llama-4-scout-17b-16e-instruct',
		].includes(this.model);

		// Grounding-capable subset. Only models confirmed to accept
		// `web_search_options` are listed. Adding a model here enables
		// Decision B always-on grounding when config.enableGrounding is true.
		//
		// 2026-06-03: Gemma 4 26B grounding RE-ENABLED. The CF model schema
		// confirms `web_search_options` is an accepted parameter
		// (search_context_size enum low|medium|high; user_location.type
		// 'approximate' + approximate{city,country,region,timezone}), and our
		// payload matches it exactly. The schema does not forbid `tools` +
		// `web_search_options` together.
		// https://developers.cloudflare.com/workers-ai/models/gemma-4-26b-a4b-it/
		// Residual risk: a live `5006: anyOf at '/' not met ... /web_search_`
		// was seen earlier today despite the valid shape (published schema vs
		// runtime validator drift). If it recurs it breaks the casual lane,
		// which has no fallback. Mitigation if needed: catch the 5006 in
		// chat() and retry once without web_search_options.
		this.supportsGrounding = [
			'@cf/google/gemma-4-26b-a4b-it',  // re-enabled 2026-06-03 (schema-verified)
		].includes(this.model);
	}

	// Cast model string for env.AI.run() which expects keyof AiModels
	private runModel(input: Record<string, unknown>): Promise<AiTextGenerationOutput> {
		return runAI<AiTextGenerationOutput>(
			this.ai,
			this.model as unknown as keyof AiModels,
			input
		);
	}

	async chat(
		messages: AIMessage[],
		tools?: AITool[],
		config?: AIProviderConfig
	): Promise<AIResponse> {
		const cfMessages = this.convertMessages(messages, config?.systemInstruction);
		const cfTools = tools?.length ? this.convertTools(tools) : undefined;

		// Build the request payload. OpenAI-compatible models (Gemma 4,
		// Qwen3, GLM, Kimi, Llama 4) use max_completion_tokens and accept
		// reasoning_effort. Legacy native models (Llama 3.x) use max_tokens.
		//
		// Token cap policy: when the caller does NOT specify maxTokens,
		// OpenAI-compat models receive NO cap at all — let the model decide
		// based on its own context window and the response complexity. Only
		// the legacy native path applies the historical 2048 default to
		// preserve backwards compatibility.
		const payload: Record<string, unknown> = {
			messages: cfMessages,
			tools: cfTools,
		};

		if (this.useOpenAICompat) {
			if (config?.maxTokens != null) {
				payload.max_completion_tokens = config.maxTokens;
			}
			const reasoning = this.toReasoningEffort(config?.thinkingLevel);
			if (reasoning) payload.reasoning_effort = reasoning;

			// Decision B (2026-06-02): always-on Google Search via
			// web_search_options. Only sent when:
			//   (a) config.enableGrounding is true (set by router for the
			//       Gemma casual route), AND
			//   (b) this.supportsGrounding (verified model capability).
			// The model decides per-turn whether to actually invoke search;
			// billing is per-query, not per-turn.
			// search_context_size: 'medium' is the schema default. UK
			// location applies to the user_location field.
			if (config?.enableGrounding && this.supportsGrounding) {
				payload.web_search_options = {
					search_context_size: 'medium',
					user_location: {
						type: 'approximate',
						approximate: { country: 'GB', timezone: 'Europe/London' },
					},
				};
				log.info('cf_ai_grounding_enabled', { model: this.model });
			}
		} else {
			// Legacy CF chat models (Llama 3.x and earlier): max_tokens
			payload.max_tokens = config?.maxTokens ?? 2048;
		}

		try {
			const result = await this.runModel(payload);

			log.info('cf_ai_raw', {
				type: typeof result,
				keys: result ? Object.keys(result as object) : [],
				hasChoices: result ? 'choices' in (result as object) : false,
				hasResponse: result ? 'response' in (result as object) : false,
			});

			return this.parseResponse(result);
		} catch (err) {
			const error = err as Error;
			log.error('cf_ai_chat_error', { model: this.model, msg: error.message });
			throw error;
		}
	}

	async *chatStream(
		messages: AIMessage[],
		tools?: AITool[],
		config?: AIProviderConfig
	): AsyncIterable<AIStreamChunk> {
		const cfMessages = this.convertMessages(messages, config?.systemInstruction);

		try {
			const stream = await runAI<ReadableStream | unknown>(
				this.ai,
				this.model as unknown as keyof AiModels,
				{
					messages: cfMessages,
					max_tokens: config?.maxTokens ?? 2048,
					stream: true,
				}
			);

			// CF AI streaming returns an EventSource-like stream
			if (stream instanceof ReadableStream) {
				const reader = stream.getReader();
				const decoder = new TextDecoder();
				let buffer = '';

				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					buffer += decoder.decode(value, { stream: true });
					const lines = buffer.split('\n');
					buffer = lines.pop() ?? '';

					for (const line of lines) {
						if (line.startsWith('data: ') && line !== 'data: [DONE]') {
							try {
								const data = JSON.parse(line.slice(6));
								if (data.response) {
									yield { type: 'text', text: data.response };
								}
							} catch { /* skip malformed chunks */ }
						}
					}
				}
			}
		} catch (err) {
			const error = err as Error;
			log.error('cf_ai_stream_error', { model: this.model, msg: error.message });
			throw error;
		}
	}

	async embed(text: string): Promise<number[]> {
		try {
			const result = await runAI<EmbeddingResponse>(
				this.ai,
				CF_MODELS.embedding as unknown as keyof AiModels,
				{ text: [text] }
			);

			return result?.data?.[0] ?? [];
		} catch (err) {
			const error = err as Error;
			log.error('cf_ai_embed_error', { msg: error.message });
			return [];
		}
	}

	// --- Internal converters ---



	private convertMessages(
		messages: AIMessage[],
		systemInstruction?: string
	): Array<Record<string, unknown>> {
		const result: Array<Record<string, unknown>> = [];

		if (systemInstruction) {
			result.push({ role: 'system', content: systemInstruction });
		}

		for (const msg of messages) {
			const role = msg.role === 'model' ? 'assistant' : msg.role;

			if (typeof msg.content === 'string') {
				result.push({ role, content: msg.content });
				continue;
			}

			if (Array.isArray(msg.content)) {
				if (this.supportsVision) {
					// OpenAI-compatible multipart content. Each part becomes
					// { type: 'text', text } or { type: 'image_url',
					//   image_url: { url: 'data:<mime>;base64,<data>' } }.
					const parts: Array<Record<string, unknown>> = [];
					for (const part of msg.content) {
						if (part.type === 'text') {
							parts.push({ type: 'text', text: part.text });
						} else if (part.type === 'inline_data') {
							parts.push({
								type: 'image_url',
								image_url: {
									url: `data:${part.mimeType};base64,${part.data}`,
								},
							});
						}
					}
					result.push({ role, content: parts });
				} else {
					// Legacy CF chat models cannot ingest inline_data. The router
					// should avoid sending multimodal turns here, but we degrade
					// gracefully if it does (e.g. via Pro-lane cascade fallback
					// to a non-vision CF model).
					const textParts: string[] = [];
					let droppedMedia = false;
					for (const part of msg.content) {
						if (part.type === 'text') textParts.push(part.text);
						else if (part.type === 'inline_data') droppedMedia = true;
					}
					if (droppedMedia) {
						log.warn('cf_ai_multimodal_dropped', { model: this.model });
						textParts.push('[media attached — not processable by this model]');
					}
					result.push({ role, content: textParts.join('\n') });
				}
				continue;
			}

			if (this.useOpenAICompat && typeof msg.content === 'object' && msg.content !== null) {
				const c = msg.content as any;
				if (c.type === 'tool_use') {
					result.push({
						role: 'assistant',
						content: '',
						tool_calls: [{
							name: c.name,
							arguments: typeof c.args === 'string' ? JSON.parse(c.args) : c.args
						}]
					});
					continue;
				} else if (c.type === 'tool_result') {
					result.push({
						role: 'tool',
						name: c.name,
						content: typeof c.content === 'string' ? c.content : JSON.stringify(c.content)
					});
					continue;
				}
			}

			// tool_use / tool_result fall-through — stringify as before.
			result.push({ role, content: JSON.stringify(msg.content) });
		}

		return result;
	}

	/**
	 * Map AIProviderConfig.thinkingEffort to OpenAI-compatible
	 * reasoning_effort values. Only sent to reasoning-capable models.
	 *
	 * Per CF schema (sync-input.json 2026-05-16) the allowed enum is
	 * 'low' | 'medium' | 'high'. We deliberately do NOT pass 'minimal'
	 * (Gemini-only) nor 'dynamic' (Gemini-only) — those return null/skip.
	 */
	private toReasoningEffort(level?: 'LOW' | 'MEDIUM' | 'HIGH'): string | undefined {
		if (!level) return undefined;
		return level.toLowerCase();
	}

	private convertTools(tools: AITool[]): Array<Record<string, unknown>> {
		return tools.map(t => ({
			type: 'function',
			function: {
				name: t.schema.function.name,
				description: t.schema.function.description,
				parameters: t.schema.function.parameters,
			},
		}));
	}

	private parseResponse(result: AiTextGenerationOutput): AIResponse {
		if (typeof result === 'string') {
			return { text: result };
		}

		let text = '';
		const toolCalls: AIToolCall[] = [];
		let annotations: unknown[] | undefined;

		// Gemma 4+ returns OpenAI-compatible format with `choices`
		if (result && 'choices' in result && Array.isArray((result as any).choices)) {
			const message = (result as any).choices[0]?.message;
			if (message?.content) text = message.content;

			if (message?.tool_calls && Array.isArray(message.tool_calls)) {
				for (const tc of message.tool_calls) {
					const args = typeof tc.function?.arguments === 'string'
						? JSON.parse(tc.function.arguments) : tc.function?.arguments ?? {};
					toolCalls.push({
						name: tc.function?.name ?? '',
						args,
						id: tc.id ?? `call_${Date.now()}`,
					});
				}
			}

			// Decision B output capture: annotations from web_search_options.
			// Shape per CF docs: choices[0].message.annotations[] each
			// being {type: 'url_citation', url_citation: {url, title,
			// start_index, end_index}}. Surfaced to message.ts for
			// rendering as footnote links.
			if (message?.annotations && Array.isArray(message.annotations) && message.annotations.length) {
				annotations = message.annotations;
				log.info('cf_ai_grounded_response', {
					model: this.model,
					citations: message.annotations.length,
				});
			}
		} else {
			// Legacy Workers AI format
			text = (result as any)?.response ?? '';
			if (result && 'tool_calls' in result && Array.isArray((result as any).tool_calls)) {
				for (const tc of (result as any).tool_calls) {
					toolCalls.push({
						name: tc.name ?? tc.function?.name ?? '',
						args: tc.arguments ?? tc.function?.arguments ?? {},
						id: tc.id ?? `call_${Date.now()}`,
					});
				}
			}
		}

		return {
			text: text.trim(),
			toolCalls: toolCalls.length ? toolCalls : undefined,
			_annotations: annotations,
		};
	}
}

// Type helpers for CF AI responses
interface EmbeddingResponse {
	shape?: number[];
	data?: number[][];
}

type RoleScopedChatInput = {
	role: 'system' | 'user' | 'assistant' | 'tool';
	content: string;
};
