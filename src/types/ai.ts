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
}

export interface AIToolCall {
	name: string;
	args: Record<string, unknown>;
	id: string;
}

export interface AIResponse {
	text: string;
	toolCalls?: AIToolCall[];
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
	thinkingEffort?: 'minimal' | 'low' | 'medium' | 'high';
	systemInstruction?: string;
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

export type TaskComplexity = 'low' | 'medium' | 'high';

export interface ModelRoute {
	provider: 'cloudflare' | 'gemini';
	model: string;
	thinkingEffort: TaskComplexity;
	reason: string;
}
