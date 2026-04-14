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
	chatId: number;
	threadId: string;
	messageId?: number;
	userId?: number;
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

export type AIMessageContent =
	| string
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
