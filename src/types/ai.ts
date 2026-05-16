// ============================================================
// AI Provider Abstraction + Tool Contracts
//
// All AI interactions go through the AIProvider interface.
// Tools use OpenAI-format schemas (industry standard).
// Each provider (Cloudflare AI, Gemini) implements AIProvider.
// ============================================================

// --- Tool Contract ---

export interface ToolSchema {
	type: 'function';
	function: {
		name: string;
		description: string;
		parameters: {
			type: 'object';
			properties: Record<string, unknown>;
			required?: string[];
		};
	};
}

export interface ToolContext {
	/** Telegram user ID (from.id) — owner of all personal data */
	userId: number;
	/** Telegram chat ID — where the message was sent */
	chatId: number;
	/** Thread ID within the chat */
	threadId: string;
	/** Message ID being responded to */
	messageId?: number;
}

export interface ToolResult {
	status: 'success' | 'error' | 'empty';
	message?: string;
	data?: unknown;
}

export interface AITool {
	schema: ToolSchema;
	execute: (
		args: Record<string, unknown>,
		env: Env,
		context: ToolContext
	) => Promise<ToolResult>;
}

// --- AI Message Types ---

/**
 * A single part of a multimodal message. A user turn can mix text and
 * media parts (e.g. a voice note with a caption). Providers that don't
 * support multimodal input (Cloudflare Workers AI chat models) will
 * flatten these to text-only, dropping media — the router is
 * responsible for never sending multimodal turns there.
 */
export type AIMessagePart =
	| { type: 'text'; text: string }
	| { type: 'inline_data'; mimeType: string; data: string }; // data = base64

export type AIMessageContent =
	| string
	| AIMessagePart[]
	| { type: 'tool_result'; toolCallId: string; content: string }
	| { type: 'tool_use'; name: string; args: Record<string, unknown>; id: string };

export interface AIMessage {
	role: 'user' | 'model' | 'system' | 'tool';
	content: AIMessageContent;
	/**
	 * Provider-specific raw parts for in-turn tool loop continuity.
	 * On Gemini with tool combination, the next call must echo back the
	 * model's previous `candidates[0].content.parts` array (including
	 * `thoughtSignature`, `toolCall`, `toolResponse`) for the model to
	 * maintain context. When set, `GeminiProvider.convertMessages` uses
	 * these directly and skips the standard text/inline_data conversion.
	 * `CloudflareProvider` ignores this field. Only meaningful within a
	 * single user message's tool loop; not persisted to KV history.
	 */
	_rawProviderParts?: unknown[];
}

export interface AIToolCall {
	name: string;
	args: Record<string, unknown>;
	id: string;
}

export interface AIResponse {
	text: string;
	toolCalls?: AIToolCall[];
	/**
	 * Gemini-only: the raw `candidates[0].content` from the response,
	 * with all parts (text, functionCall, thoughtSignature). Used by
	 * the in-turn tool loop in message.ts to feed the model's previous
	 * output back as an AIMessage with `_rawProviderParts`. Not
	 * persisted to KV history.
	 */
	_geminiRawContent?: unknown;
	/**
	 * Gemini-only: `candidates[0].groundingMetadata` from Google Search
	 * grounding. Contains `webSearchQueries`, `groundingChunks`,
	 * `groundingSupports`. Rendered as inline citations in the Telegram
	 * output.
	 */
	_groundingMetadata?: unknown;
	/**
	 * Cloudflare-only (Gemma 4 with `web_search_options`):
	 * `choices[0].message.annotations[]` from the response. Each entry
	 * is `{type: 'url_citation', url_citation: {url, title, start_index,
	 * end_index}}`. Rendered as numbered footnote links in the Telegram
	 * output.
	 */
	_annotations?: unknown[];
}

// --- Streaming ---

export interface AIStreamChunk {
	type: 'text' | 'tool_call';
	text?: string;
	toolCall?: AIToolCall;
}

// --- Provider Config ---

export interface AIProviderConfig {
	temperature?: number;
	maxTokens?: number;
	// `dynamic` lets the model decide thinking budget per request.
	// Recommended default for 2.5 Pro per Google docs (cost-efficient,
	// 30-50% cheaper than fixed-high). Maps to `thinkingBudget: -1` on
	// 2.5 family; ignored on 3.x (3.x is always dynamic anyway).
	thinkingEffort?: 'minimal' | 'low' | 'medium' | 'high' | 'dynamic';
	systemInstruction?: string;
	/**
	 * Always-on grounding flag. Effect depends on provider+model:
	 *  - GeminiProvider on a Gemini 3 family model (e.g. gemini-3.5-flash):
	 *    prepends `{googleSearch: {}}` to the tools array and sets
	 *    `toolConfig.includeServerSideToolInvocations: true` if custom
	 *    function declarations are also present (tool combination).
	 *  - CloudflareProvider on Gemma 4: adds `web_search_options` to the
	 *    payload with `search_context_size: 'medium'` and UK user_location.
	 *  - Other providers/models: ignored.
	 * The model decides per-turn whether to actually invoke search; the
	 * flag only makes the capability available. Billing is per-query.
	 */
	enableGrounding?: boolean;
}

// --- The Provider Interface ---

export interface AIProvider {
	/** Non-streaming chat completion */
	chat(
		messages: AIMessage[],
		tools?: AITool[],
		config?: AIProviderConfig
	): Promise<AIResponse>;

	/** Streaming chat completion (optional, not all providers support it) */
	chatStream?(
		messages: AIMessage[],
		tools?: AITool[],
		config?: AIProviderConfig
	): AsyncIterable<AIStreamChunk>;

	/** Generate text embeddings */
	embed(text: string): Promise<number[]>;

	/** Provider name for logging */
	readonly name: string;
}

// --- Model Router Types ---

export type TaskComplexity = 'minimal' | 'low' | 'medium' | 'high' | 'dynamic';

export interface ModelRoute {
	provider: 'cloudflare' | 'gemini';
	model: string;
	thinkingEffort: TaskComplexity;
	reason: string;
	/**
	 * Whether grounding (Google Search / web_search_options) should be
	 * enabled on this route. Set by the router based on the model's
	 * verified capability — true for Gemma 4 and Gemini 3.x family,
	 * false for code/analytical routes (Qwen3 30B schema unverified).
	 */
	enableGrounding?: boolean;
}
