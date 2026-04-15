// ============================================================
// Cloudflare AI Provider
//
// Implements AIProvider using Workers AI models.
// Primary provider for ~80% of traffic (free tier).
// Uses OpenAI-compatible function calling format.
// ============================================================

import type {
	AIProvider, AIMessage, AITool, AIProviderConfig,
	AIResponse, AIStreamChunk, AIToolCall, AIMessageContent,
} from '../types/ai';
import { CF_MODELS } from '../config/models';
import { log } from '../lib/logger';

export class CloudflareProvider implements AIProvider {
	readonly name = 'cloudflare';
	private ai: Ai;
	private model: string;

	constructor(ai: Ai, model?: string) {
		this.ai = ai;
		this.model = model ?? CF_MODELS.chat;
	}

	// Cast model string for env.AI.run() which expects keyof AiModels
	private runModel(input: Record<string, unknown>): Promise<AiTextGenerationOutput> {
		return this.ai.run(this.model as unknown as keyof AiModels, input) as Promise<AiTextGenerationOutput>;
	}

	async chat(
		messages: AIMessage[],
		tools?: AITool[],
		config?: AIProviderConfig
	): Promise<AIResponse> {
		const cfMessages = this.convertMessages(messages, config?.systemInstruction);
		const cfTools = tools?.length ? this.convertTools(tools) : undefined;

		try {
			const result = await this.runModel({
				messages: cfMessages,
				tools: cfTools,
				temperature: config?.temperature ?? 1.0,
				max_tokens: config?.maxTokens ?? 2048,
			});

			// Debug: log raw response shape
			log.info('cf_ai_raw', {
				type: typeof result,
				keys: result ? Object.keys(result) : [],
				response: typeof result === 'string' ? result.slice(0, 200) : (result?.response ?? '').slice(0, 200),
				hasToolCalls: result && 'tool_calls' in result,
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
			const stream = await this.ai.run(this.model as unknown as keyof AiModels, {
				messages: cfMessages,
				temperature: config?.temperature ?? 1.0,
				max_tokens: config?.maxTokens ?? 2048,
				stream: true,
			});

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
			const result = await this.ai.run(CF_MODELS.embedding as unknown as keyof AiModels, {
				text: [text],
			}) as EmbeddingResponse;

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
	): RoleScopedChatInput[] {
		const result: RoleScopedChatInput[] = [];

		if (systemInstruction) {
			result.push({ role: 'system', content: systemInstruction });
		}

		for (const msg of messages) {
			const content = typeof msg.content === 'string'
				? msg.content
				: JSON.stringify(msg.content);

			const role = msg.role === 'model' ? 'assistant' : msg.role;
			result.push({ role: role as 'system' | 'user' | 'assistant' | 'tool', content });
		}

		return result;
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
		// Handle both string and object responses
		if (typeof result === 'string') {
			return { text: result };
		}

		const text = result?.response ?? '';
		const toolCalls: AIToolCall[] = [];

		// Parse tool calls from the response
		if (result && 'tool_calls' in result && Array.isArray((result as any).tool_calls)) {
			for (const tc of (result as any).tool_calls) {
				toolCalls.push({
					name: tc.name ?? tc.function?.name ?? '',
					args: tc.arguments ?? tc.function?.arguments ?? {},
					id: tc.id ?? `call_${Date.now()}`,
				});
			}
		}

		return { text, toolCalls: toolCalls.length ? toolCalls : undefined };
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
