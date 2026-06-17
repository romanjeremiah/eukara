// ============================================================
// Gemini AI Provider
//
// Implements AIProvider using Google Gemini API.
// Used only for irreplaceable features: deep therapeutic
// reasoning, image generation, TTS, Deep Research.
// Dynamically imported to avoid bundling when not needed.
//
// 2026-06-02 changes:
//   - Tool combination support (Decision A). When config.enableGrounding
//     is true AND model is Gemini 3 family, prepends {googleSearch: {}}
//     to the tools array and sets toolConfig.includeServerSideToolInvocations
//     so custom function declarations and Google Search coexist.
//   - parseResponse now captures candidates[0].content raw (for in-turn
//     tool loop continuity via AIMessage._rawProviderParts) and
//     groundingMetadata (for citation rendering).
//   - convertMessages now passes _rawProviderParts through untouched
//     when present.
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

/**
 * Models eligible for tool combination (built-in tools + custom
 * function declarations on the same call). Per Google docs only
 * Gemini 3 family models support this. 2.x family must choose one
 * or the other.
 */
function supportsToolCombination(model: string): boolean {
	return model.startsWith('gemini-3');
}

export class GeminiProvider implements AIProvider {
	readonly name = 'gemini';
	private apiKey: string;
	private model: string;

	constructor(apiKey: string, model?: string) {
		this.apiKey = apiKey;
		this.model = model ?? GEMINI_MODELS.proPrimary;
	}

	async chat(
		messages: AIMessage[],
		tools?: AITool[],
		config?: AIProviderConfig
	): Promise<AIResponse> {
		const ai = await getAI(this.apiKey);

		const geminiContents = this.convertMessages(messages);
		const { geminiTools, toolConfig, groundingEnabled } = this.buildTools(tools, config);
		const thinkingConfig = this.convertThinking(config?.thinkingLevel);

		if (groundingEnabled) {
			log.info('gemini_grounding_enabled', {
				model: this.model,
				customTools: tools?.length ?? 0,
			});
		}

		try {
			const response = await ai.models.generateContent({
				model: this.model,
				contents: geminiContents,
				config: {
					systemInstruction: config?.systemInstruction,
					maxOutputTokens: config?.maxTokens ?? 4096,
					tools: geminiTools,
					toolConfig,
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
		const { geminiTools, toolConfig } = this.buildTools(tools, config);
		const thinkingConfig = this.convertThinking(config?.thinkingLevel);

		try {
			const response = await ai.models.generateContentStream({
				model: this.model,
				contents: geminiContents,
				config: {
					systemInstruction: config?.systemInstruction,
					maxOutputTokens: config?.maxTokens ?? 4096,
					tools: geminiTools,
					toolConfig,
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

	/**
	 * Convert AIMessage[] to Gemini Content[]. When a message has
	 * `_rawProviderParts` set, those parts are passed through directly
	 * — this preserves `thoughtSignature`, `functionCall`,
	 * `functionResponse` parts from a previous turn's
	 * `candidates[0].content` so the model can maintain context across
	 * the in-turn tool loop with tool combination enabled.
	 */
	private convertMessages(messages: AIMessage[]): Array<{ role: string; parts: Array<Record<string, unknown>> }> {
		return messages
			.filter(m => m.role !== 'system') // System instruction handled separately
			.map(msg => {
				// In-turn tool loop continuity: prior Gemini turn echoed
				// back verbatim via _rawProviderParts.
				if (msg._rawProviderParts && Array.isArray(msg._rawProviderParts) && msg._rawProviderParts.length) {
					return {
						role: msg.role === 'model' ? 'model' : 'user',
						parts: msg._rawProviderParts as Array<Record<string, unknown>>,
					};
				}

				const parts: Array<Record<string, unknown>> = [];

				if (typeof msg.content === 'string') {
					parts.push({ text: msg.content });
				} else if (Array.isArray(msg.content)) {
					// Multimodal: unpack each part into Gemini's format.
					for (const part of msg.content) {
						if (part.type === 'text') {
							parts.push({ text: part.text });
						} else if (part.type === 'inline_data') {
							parts.push({
								inlineData: { mimeType: part.mimeType, data: part.data },
							});
						}
					}
				} else {
					// tool_use / tool_result — stringify as fallback
					parts.push({ text: JSON.stringify(msg.content) });
				}

				return {
					role: msg.role === 'model' ? 'model' : 'user',
					parts,
				};
			});
	}

	/**
	 * Build the tools array and toolConfig for the Gemini API call.
	 *
	 * - Custom function declarations are always converted to the
	 *   `functionDeclarations` shape Gemini expects.
	 * - When config.enableGrounding is true AND the model supports tool
	 *   combination (Gemini 3 family), prepends `{googleSearch: {}}` as
	 *   a separate tool entry alongside the function declarations.
	 * - When BOTH googleSearch and functionDeclarations are present,
	 *   sets `toolConfig.includeServerSideToolInvocations: true` per
	 *   the tool-combination docs.
	 * - On non-3.x models, grounding is silently dropped (logged) since
	 *   sending both would error.
	 *
	 * Docs: https://ai.google.dev/gemini-api/docs/tool-combination
	 */
	private buildTools(tools: AITool[] | undefined, config: AIProviderConfig | undefined): {
		geminiTools: Array<Record<string, unknown>> | undefined;
		toolConfig: Record<string, unknown> | undefined;
		groundingEnabled: boolean;
	} {
		const hasCustomTools = !!tools?.length;
		const wantsGrounding = !!config?.enableGrounding;
		const canCombine = supportsToolCombination(this.model);

		// Case 1: no grounding wanted. Just custom tools (or nothing).
		if (!wantsGrounding) {
			return {
				geminiTools: hasCustomTools ? this.convertTools(tools!) : undefined,
				toolConfig: undefined,
				groundingEnabled: false,
			};
		}

		// Case 2: grounding wanted on a non-combinable model. Sending
		// both would error — drop grounding and log so the issue is
		// visible. Custom tools win because they're explicit.
		if (!canCombine && hasCustomTools) {
			log.warn('gemini_grounding_dropped_non_combinable', {
				model: this.model,
				reason: 'tool_combination_requires_gemini_3',
			});
			return {
				geminiTools: this.convertTools(tools!),
				toolConfig: undefined,
				groundingEnabled: false,
			};
		}

		// Case 3: grounding wanted, model supports it (or no custom
		// tools to conflict with). Prepend googleSearch.
		const geminiTools: Array<Record<string, unknown>> = [{ googleSearch: {} }];
		if (hasCustomTools) {
			geminiTools.push(...this.convertTools(tools!));
		}

		// Tool combination requires toolConfig.includeServerSideToolInvocations
		// when both googleSearch and functionDeclarations are present.
		const toolConfig = (hasCustomTools && canCombine)
			? { includeServerSideToolInvocations: true }
			: undefined;

		return { geminiTools, toolConfig, groundingEnabled: true };
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

	private convertThinking(level?: 'LOW' | 'MEDIUM' | 'HIGH'): Record<string, unknown> | undefined {
		if (!level) return undefined;
		return { thinkingLevel: level };
	}

	private parseResponse(response: any): AIResponse {
		const candidate = response.candidates?.[0];
		const rawContent = candidate?.content;
		const parts = rawContent?.parts ?? [];

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

		// Grounding metadata, present when the model invoked
		// googleSearch on this turn. Shape per Google docs:
		//   { webSearchQueries: string[],
		//     groundingChunks: Array<{web: {uri, title}}>,
		//     groundingSupports: Array<{...}> }
		const groundingMetadata = candidate?.groundingMetadata;
		if (groundingMetadata?.webSearchQueries?.length) {
			log.info('gemini_grounded_response', {
				model: this.model,
				queries: groundingMetadata.webSearchQueries.length,
				chunks: groundingMetadata.groundingChunks?.length ?? 0,
			});
		}

		return {
			text: text.trim(),
			toolCalls: toolCalls.length ? toolCalls : undefined,
			_geminiRawContent: rawContent,
			_groundingMetadata: groundingMetadata,
		};
	}
}
