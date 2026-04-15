// ============================================================
// Gemini AI Provider
//
// Implements AIProvider using Google Gemini API.
// Used only for irreplaceable features: deep therapeutic
// reasoning, image generation, TTS, Deep Research.
// Dynamically imported to avoid bundling when not needed.
// ============================================================

import type {
	AIProvider, AIMessage, AITool, AIProviderConfig,
	AIResponse, AIStreamChunk, AIToolCall,
} from '../types/ai';
import { GEMINI_MODELS } from '../config/models';
import { log } from '../lib/logger';

// Lazy-loaded Gemini SDK instance
let _ai: any = null;

async function getAI(apiKey: string): Promise<any> {
	if (_ai) return _ai;
	const { GoogleGenAI } = await import('@google/genai');
	_ai = new GoogleGenAI({ apiKey });
	return _ai;
}

export class GeminiProvider implements AIProvider {
	readonly name = 'gemini';
	private apiKey: string;
	private model: string;

	constructor(apiKey: string, model?: string) {
		this.apiKey = apiKey;
		this.model = model ?? GEMINI_MODELS.pro;
	}

	async chat(
		messages: AIMessage[],
		tools?: AITool[],
		config?: AIProviderConfig
	): Promise<AIResponse> {
		const ai = await getAI(this.apiKey);

		const geminiContents = this.convertMessages(messages);
		const geminiTools = tools?.length ? this.convertTools(tools) : undefined;
		const thinkingConfig = this.convertThinking(config?.thinkingEffort);

		try {
			const response = await ai.models.generateContent({
				model: this.model,
				contents: geminiContents,
				config: {
					systemInstruction: config?.systemInstruction,
					temperature: config?.temperature ?? 1.0,
					maxOutputTokens: config?.maxTokens ?? 4096,
					tools: geminiTools,
					thinkingConfig,
				},
			});

			return this.parseResponse(response);
		} catch (err) {
			const error = err as Error;
			log.error('gemini_chat_error', { model: this.model, msg: error.message });
			throw error;
		}
	}

	async *chatStream(
		messages: AIMessage[],
		tools?: AITool[],
		config?: AIProviderConfig
	): AsyncIterable<AIStreamChunk> {
		const ai = await getAI(this.apiKey);

		const geminiContents = this.convertMessages(messages);
		const thinkingConfig = this.convertThinking(config?.thinkingEffort);

		try {
			const response = await ai.models.generateContentStream({
				model: this.model,
				contents: geminiContents,
				config: {
					systemInstruction: config?.systemInstruction,
					temperature: config?.temperature ?? 1.0,
					maxOutputTokens: config?.maxTokens ?? 4096,
					thinkingConfig,
				},
			});

			for await (const chunk of response) {
				// Filter out thought parts
				const parts = chunk.candidates?.[0]?.content?.parts ?? [];
				for (const part of parts) {
					if (part.thought) continue; // Skip thinking parts
					if (part.text) {
						yield { type: 'text', text: part.text };
					}
					if (part.functionCall) {
						yield {
							type: 'tool_call',
							toolCall: {
								name: part.functionCall.name,
								args: part.functionCall.args ?? {},
								id: part.functionCall.id ?? `call_${Date.now()}`,
							},
						};
					}
				}
			}
		} catch (err) {
			const error = err as Error;
			log.error('gemini_stream_error', { model: this.model, msg: error.message });
			throw error;
		}
	}

	async embed(text: string): Promise<number[]> {
		// Gemini embedding returns 768 dims, but our Vectorize index is 1024
		// This provider shouldn't be used for embeddings in Eukara
		log.warn('gemini_embed_called', { msg: 'Use CloudflareProvider.embed instead (1024 dims)' });
		return [];
	}

	// --- Internal converters ---

	private convertMessages(messages: AIMessage[]): Array<{ role: string; parts: Array<{ text: string }> }> {
		return messages
			.filter(m => m.role !== 'system') // System instruction handled separately
			.map(msg => ({
				role: msg.role === 'model' ? 'model' : 'user',
				parts: [{
					text: typeof msg.content === 'string'
						? msg.content
						: JSON.stringify(msg.content),
				}],
			}));
	}

	private convertTools(tools: AITool[]): Array<{ functionDeclarations: Array<Record<string, unknown>> }> {
		// Convert OpenAI-format tools to Gemini's functionDeclarations
		const declarations = tools.map(t => ({
			name: t.schema.function.name,
			description: t.schema.function.description,
			parameters: t.schema.function.parameters,
		}));
		return [{ functionDeclarations: declarations }];
	}

	private convertThinking(effort?: string): Record<string, unknown> | undefined {
		if (!effort) return undefined;
		// Gemini 3.x uses thinkingLevel: LOW | MEDIUM | HIGH
		const levelMap: Record<string, string> = {
			minimal: 'LOW',
			low: 'LOW',
			medium: 'MEDIUM',
			high: 'HIGH',
		};
		return { thinkingLevel: levelMap[effort] ?? 'LOW' };
	}

	private parseResponse(response: any): AIResponse {
		const parts = response.candidates?.[0]?.content?.parts ?? [];

		const textParts = parts
			.filter((p: any) => p.text && !p.thought)
			.map((p: any) => p.text);
		const text = textParts.join('');

		const toolCalls: AIToolCall[] = parts
			.filter((p: any) => p.functionCall)
			.map((p: any) => ({
				name: p.functionCall.name,
				args: p.functionCall.args ?? {},
				id: p.functionCall.id ?? `call_${Date.now()}`,
			}));

		return {
			text: text.trim(),
			toolCalls: toolCalls.length ? toolCalls : undefined,
		};
	}
}
