// ============================================================
// Direct OpenAI Provider
//
// Stateless Responses API adapter. Eukara retains authoritative
// conversation, memory, media and workflow state in Cloudflare.
// ============================================================

import OpenAI from 'openai';
import type {
	EasyInputMessage,
	FunctionTool,
	Response,
	ResponseCreateParamsNonStreaming,
	ResponseCreateParamsStreaming,
	ResponseInputItem,
	ResponseOutputText,
	ResponseStreamEvent,
	Tool,
	WebSearchTool,
} from 'openai/resources/responses/responses';
import type {
	AIMessage,
	AIMessageContent,
	AIProvider,
	AIProviderConfig,
	AIResponse,
	AIStreamChunk,
	AITool,
	AIToolCall,
} from '../types/ai';
import { OPENAI_MODELS } from '../config/models';
import { log } from '../lib/logger';

const DEFAULT_TIMEOUT_MS = 55_000;

/**
 * Raised when a generic inline-data part cannot safely be represented in the
 * current Responses API adapter. Specialist audio and document ingestion is
 * introduced in a later migration stage.
 */
export class UnsupportedOpenAIMediaError extends Error {
	constructor(mimeType: string) {
		super(`OpenAI adapter does not yet support inline media type: ${mimeType}`);
		this.name = 'UnsupportedOpenAIMediaError';
	}
}

/**
 * Direct OpenAI implementation of Eukara's provider contract.
 */
export class OpenAIProvider implements AIProvider {
	readonly name = 'openai';
	private readonly client: OpenAI;
	private readonly model: string;

	/**
	 * @param apiKey OpenAI project API key.
	 * @param model Model selected by the central routing registry.
	 * @param client Optional injected client used by isolated unit tests.
	 * @param timeoutMs Optional request timeout for durable specialist Workflows.
	 */
	constructor(
		apiKey: string,
		model: string = OPENAI_MODELS.chat,
		client?: OpenAI,
		timeoutMs: number = DEFAULT_TIMEOUT_MS,
	) {
		this.model = model;
		this.client = client ?? new OpenAI({
			apiKey,
			maxRetries: 0,
			timeout: timeoutMs,
		});
	}

	/**
	 * Execute one stateless Responses API turn.
	 */
	async chat(
		messages: AIMessage[],
		tools?: AITool[],
		config?: AIProviderConfig,
	): Promise<AIResponse> {
		const request = this.buildRequest(messages, tools, config);

		try {
			const response = await this.client.responses.create(request);
			return this.parseResponse(response);
		} catch (error) {
			const err = error as Error;
			log.error('openai_chat_error', {
				model: this.model,
				error: err.message,
			});
			throw error;
		}
	}

	/**
	 * Stream visible text and tool-call intent without exposing reasoning
	 * events.
	 */
	async *chatStream(
		messages: AIMessage[],
		tools?: AITool[],
		config?: AIProviderConfig,
	): AsyncIterable<AIStreamChunk> {
		const request: ResponseCreateParamsStreaming = {
			...this.buildRequest(messages, tools, config),
			stream: true,
		};
		const stream = await this.client.responses.create(request);

		for await (const event of stream) {
			const chunk = parseOpenAIStreamEvent(event);
			if (chunk) yield chunk;
		}
	}

	/**
	 * Compatibility wrapper for the current Telegram draft-streaming helper.
	 * It will be removed once that helper consumes AIProvider.chatStream
	 * directly.
	 */
	async *streamChat(
		messages: AIMessage[],
		tools?: AITool[],
		config?: AIProviderConfig,
	): AsyncGenerator<{ delta: string; sawToolCall: boolean }> {
		for await (const chunk of this.chatStream(messages, tools, config)) {
			yield {
				delta: chunk.type === 'text' ? (chunk.text ?? '') : '',
				sawToolCall: chunk.type === 'tool_call',
			};
		}
	}

	/**
	 * Generate an embedding for the blue-green Vectorize projection.
	 */
	async embed(text: string): Promise<number[]> {
		const vectors = await this.embedMany([text]);
		return vectors[0] ?? [];
	}

	/**
	 * Generate an ordered embedding batch for Queue-owned backfills.
	 */
	async embedMany(texts: string[]): Promise<number[][]> {
		if (!texts.length) return [];
		const response = await this.client.embeddings.create({
			model: OPENAI_MODELS.embedding,
			input: texts,
			encoding_format: 'float',
		});
		return [...response.data]
			.sort((left, right) => left.index - right.index)
			.map(item => item.embedding);
	}

	/**
	 * Build the common stateless request shared by streaming and
	 * non-streaming calls.
	 */
	private buildRequest(
		messages: AIMessage[],
		tools?: AITool[],
		config?: AIProviderConfig,
	): ResponseCreateParamsNonStreaming {
		const requestTools = this.convertTools(tools, config?.enableGrounding);
		const reasoningEffort = toReasoningEffort(config?.thinkingLevel);

		return {
			model: this.model,
			input: this.convertMessages(messages),
			instructions: config?.systemInstruction,
			max_output_tokens: config?.maxTokens,
			parallel_tool_calls: false,
			reasoning: reasoningEffort
				? { effort: reasoningEffort, context: 'current_turn' }
				: { context: 'current_turn' },
			safety_identifier: config?.safetyIdentifier,
			store: false,
			tools: requestTools.length ? requestTools : undefined,
			include: config?.enableGrounding
				? ['web_search_call.action.sources']
				: undefined,
		};
	}

	/**
	 * Convert Eukara's provider-neutral messages to Responses API input
	 * items, including tool-loop continuation.
	 */
	private convertMessages(messages: AIMessage[]): ResponseInputItem[] {
		return messages.flatMap((message) => {
			if (message._openaiInputItems?.length) {
				return message._openaiInputItems as ResponseInputItem[];
			}
			return [this.convertMessage(message)];
		});
	}

	/**
	 * Convert one provider-neutral message to a Responses API input item.
	 */
	private convertMessage(message: AIMessage): ResponseInputItem {
		const content = message.content;

		if (isToolUse(content)) {
			return {
				type: 'function_call',
				call_id: content.id,
				name: content.name,
				arguments: JSON.stringify(content.args),
			};
		}

		if (isToolResult(content)) {
			return {
				type: 'function_call_output',
				call_id: content.toolCallId,
				output: content.content,
			};
		}

		const role: EasyInputMessage['role'] =
			message.role === 'model'
				? 'assistant'
				: message.role === 'tool'
					? 'user'
					: message.role;

		if (typeof content === 'string') {
			return { type: 'message', role, content };
		}

		return {
			type: 'message',
			role,
			content: content.map((part) => {
				if (part.type === 'text') {
					return { type: 'input_text' as const, text: part.text };
				}
				if (!part.mimeType.startsWith('image/')) {
					throw new UnsupportedOpenAIMediaError(part.mimeType);
				}
				return {
					type: 'input_image' as const,
					detail: 'auto' as const,
					image_url: `data:${part.mimeType};base64,${part.data}`,
				};
			}),
		};
	}

	/**
	 * Convert local function schemas and optional OpenAI web search into
	 * Responses API tools.
	 */
	private convertTools(tools?: AITool[], enableGrounding?: boolean): Tool[] {
		const result: Tool[] = (tools ?? []).map((tool): FunctionTool => ({
			type: 'function',
			name: tool.schema.function.name,
			description: tool.schema.function.description,
			parameters: tool.schema.function.parameters,
			strict: false,
		}));

		if (enableGrounding) {
			const webSearch: WebSearchTool = {
				type: 'web_search',
				search_context_size: 'medium',
				user_location: {
					type: 'approximate',
					country: 'GB',
					timezone: 'Europe/London',
				},
			};
			result.push(webSearch);
		}

		return result;
	}

	/**
	 * Preserve Eukara's existing response contract, including its citation
	 * wrapper shape, while reading native Responses API output items.
	 */
	private parseResponse(response: Response): AIResponse {
		const toolCalls: AIToolCall[] = [];
		const annotations: unknown[] = [];

		for (const item of response.output) {
			if (item.type === 'function_call') {
				toolCalls.push({
					name: item.name,
					args: parseToolArguments(item.arguments, item.name),
					id: item.call_id,
				});
				continue;
			}

			if (item.type !== 'message') continue;
			for (const content of item.content) {
				if (content.type !== 'output_text') continue;
				annotations.push(...mapAnnotations(content.annotations));
			}
		}

		return {
			text: response.output_text,
			toolCalls: toolCalls.length ? toolCalls : undefined,
			_annotations: annotations.length ? annotations : undefined,
			_openaiRawOutput: toolCalls.length ? response.output : undefined,
		};
	}
}

/**
 * Convert a streaming event into Eukara's public streaming contract. Reasoning
 * and lifecycle events are intentionally ignored.
 */
export function parseOpenAIStreamEvent(
	event: ResponseStreamEvent,
): AIStreamChunk | undefined {
	if (event.type === 'response.output_text.delta') {
		return { type: 'text', text: event.delta };
	}

	if (
		event.type === 'response.function_call_arguments.delta'
		|| (
			event.type === 'response.output_item.added'
			&& event.item.type === 'function_call'
		)
	) {
		return { type: 'tool_call' };
	}

	return undefined;
}

/**
 * Parse tool arguments defensively so a malformed model payload cannot crash
 * routing before the tool layer can report a useful error.
 */
function parseToolArguments(
	argumentsJson: string,
	toolName: string,
): Record<string, unknown> {
	try {
		const parsed: unknown = JSON.parse(argumentsJson);
		if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
			return parsed as Record<string, unknown>;
		}
	} catch (error) {
		log.warn('openai_tool_arguments_invalid', {
			tool: toolName,
			error: (error as Error).message,
		});
	}
	return {};
}

/**
 * Map OpenAI URL citations to the wrapper already consumed by Eukara's
 * Telegram rendering and curiosity services.
 */
function mapAnnotations(
	annotations: ResponseOutputText['annotations'],
): unknown[] {
	return annotations.flatMap((annotation) => {
		if (annotation.type !== 'url_citation') return [];
		return [{
			type: 'url_citation',
			url_citation: {
				url: annotation.url,
				title: annotation.title,
				start_index: annotation.start_index,
				end_index: annotation.end_index,
			},
		}];
	});
}

/**
 * Map Eukara's provider-neutral thinking level onto OpenAI reasoning effort.
 */
function toReasoningEffort(
	level?: AIProviderConfig['thinkingLevel'],
): 'low' | 'medium' | 'high' | undefined {
	return level?.toLowerCase() as 'low' | 'medium' | 'high' | undefined;
}

/**
 * Identify a tool call embedded in the provider-neutral message union.
 */
function isToolUse(
	content: AIMessageContent,
): content is Extract<AIMessageContent, { type: 'tool_use' }> {
	return !Array.isArray(content)
		&& typeof content === 'object'
		&& content.type === 'tool_use';
}

/**
 * Identify a tool result embedded in the provider-neutral message union.
 */
function isToolResult(
	content: AIMessageContent,
): content is Extract<AIMessageContent, { type: 'tool_result' }> {
	return !Array.isArray(content)
		&& typeof content === 'object'
		&& content.type === 'tool_result';
}
