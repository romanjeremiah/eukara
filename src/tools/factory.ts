// ============================================================
// Tool Factory
//
// Helper to create AITool instances with less boilerplate.
// Ensures every tool follows the OpenAI schema format.
// ============================================================

import type { AITool, ToolContext, ToolResult } from '../types/ai';

/**
 * Create a typed AITool with OpenAI-compatible schema.
 */
export function defineTool(
	name: string,
	description: string,
	parameters: Record<string, unknown>,
	required: string[],
	execute: (args: Record<string, unknown>, env: Env, ctx: ToolContext) => Promise<ToolResult>
): AITool {
	return {
		schema: {
			type: 'function',
			function: {
				name,
				description,
				parameters: { type: 'object', properties: parameters, required },
			},
		},
		execute,
	};
}

export function ok(data?: unknown, message?: string): ToolResult {
	return { status: 'success', data, message };
}

export function err(message: string): ToolResult {
	return { status: 'error', message };
}

export function empty(message: string): ToolResult {
	return { status: 'empty', message };
}
