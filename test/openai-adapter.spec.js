// ============================================================
// Direct OpenAI adapter regression tests
//
// Pure unit tests: all SDK calls are mocked and no network or API key is used.
// ============================================================

import { describe, expect, it } from 'vitest';
import {
	OpenAIProvider,
	UnsupportedOpenAIMediaError,
	parseOpenAIStreamEvent,
} from '../src/ai/openai';
import { OPENAI_MODELS } from '../src/config/models';
import { routeMessage } from '../src/ai/router';
import { hasExplicitCrisisSignal } from '../src/ai/curator';

/**
 * Build a minimal OpenAI client double and retain every outbound request.
 *
 * @param {unknown} response Responses API value returned by create().
 * @param {number[]} embedding Embedding returned by embeddings.create().
 */
function fakeClient(response, embedding = [0.1, 0.2]) {
	const requests = [];
	const embeddingRequests = [];
	return {
		requests,
		embeddingRequests,
		client: {
			responses: {
				create: async (request) => {
					requests.push(request);
					return response;
				},
			},
			embeddings: {
				create: async (request) => {
					embeddingRequests.push(request);
					const vectors = Array.isArray(embedding[0])
						? embedding
						: [embedding];
					return {
						data: vectors.map((values, index) => ({
							embedding: values,
							index,
						})),
					};
				},
			},
		},
	};
}

describe('OpenAIProvider Responses API adapter', () => {
	it('keeps requests stateless and converts function tools and calls', async () => {
		const fake = fakeClient({
			output_text: 'Done.',
			output: [{
				type: 'function_call',
				name: 'set_reminder',
				arguments: '{"text":"call mum"}',
				call_id: 'call_123',
			}],
		});
		const provider = new OpenAIProvider(
			'test-key',
			OPENAI_MODELS.chat,
			fake.client,
		);
		const tool = {
			schema: {
				type: 'function',
				function: {
					name: 'set_reminder',
					description: 'Create a reminder.',
					parameters: {
						type: 'object',
						properties: { text: { type: 'string' } },
						required: ['text'],
					},
				},
			},
			execute: async () => ({ status: 'success' }),
		};

		const result = await provider.chat(
			[{ role: 'user', content: 'Remind me to call mum.' }],
			[tool],
			{
				systemInstruction: 'Be concise.',
				thinkingLevel: 'MEDIUM',
				safetyIdentifier: 'hashed-user',
			},
		);

		expect(result).toMatchObject({
			text: 'Done.',
			toolCalls: [{
				name: 'set_reminder',
				id: 'call_123',
				args: { text: 'call mum' },
			}],
		});
		expect(fake.requests[0]).toMatchObject({
			model: OPENAI_MODELS.chat,
			store: false,
			parallel_tool_calls: false,
			instructions: 'Be concise.',
			reasoning: { effort: 'medium', context: 'current_turn' },
			safety_identifier: 'hashed-user',
		});
		expect(fake.requests[0].tools[0]).toMatchObject({
			type: 'function',
			name: 'set_reminder',
			strict: false,
		});
	});

	it('uses strict Responses structured output for internal classifiers', async () => {
		const fake = fakeClient({ output_text: '{"intent":"casual"}', output: [] });
		const provider = new OpenAIProvider('test-key', OPENAI_MODELS.curator, fake.client);

		await provider.chat([{ role: 'user', content: 'hello' }], [], {
			thinkingLevel: 'MEDIUM',
			responseSchema: {
				name: 'route',
				schema: {
					type: 'object',
					properties: { intent: { type: 'string' } },
					required: ['intent'],
					additionalProperties: false,
				},
			},
		});

		expect(fake.requests[0]).toMatchObject({
			model: OPENAI_MODELS.curator,
			reasoning: { effort: 'medium', context: 'current_turn' },
			text: {
				format: {
					type: 'json_schema',
					name: 'route',
					strict: true,
				},
			},
		});
	});

	it('preserves tool-loop continuation and image inputs', async () => {
		const fake = fakeClient({ output_text: 'I can see it.', output: [] });
		const provider = new OpenAIProvider('test-key', undefined, fake.client);

		await provider.chat([
			{
				role: 'model',
				content: {
					type: 'tool_use',
					id: 'call_1',
					name: 'lookup',
					args: { query: 'weather' },
				},
			},
			{
				role: 'tool',
				content: {
					type: 'tool_result',
					toolCallId: 'call_1',
					content: '{"temperature":18}',
				},
			},
			{
				role: 'user',
				content: [
					{ type: 'text', text: 'What is in this image?' },
					{
						type: 'inline_data',
						mimeType: 'image/png',
						data: 'aW1hZ2U=',
					},
				],
			},
		]);

		expect(fake.requests[0].input[0]).toEqual({
			type: 'function_call',
			call_id: 'call_1',
			name: 'lookup',
			arguments: '{"query":"weather"}',
		});
		expect(fake.requests[0].input[1]).toEqual({
			type: 'function_call_output',
			call_id: 'call_1',
			output: '{"temperature":18}',
		});
		expect(fake.requests[0].input[2].content[1]).toEqual({
			type: 'input_image',
			detail: 'auto',
			image_url: 'data:image/png;base64,aW1hZ2U=',
		});
	});

	it('replays complete Responses output before tool results', async () => {
		const rawOutput = [
			{ type: 'reasoning', id: 'reason_1', content: [], summary: [] },
			{
				type: 'function_call',
				id: 'fc_1',
				call_id: 'call_1',
				name: 'lookup',
				arguments: '{"query":"weather"}',
			},
		];
		const first = fakeClient({ output_text: '', output: rawOutput });
		const firstProvider = new OpenAIProvider('test-key', undefined, first.client);
		const firstResponse = await firstProvider.chat([
			{ role: 'user', content: 'What is the weather?' },
		]);

		expect(firstResponse._openaiRawOutput).toEqual(rawOutput);

		const second = fakeClient({ output_text: 'It is mild.', output: [] });
		const secondProvider = new OpenAIProvider('test-key', undefined, second.client);
		await secondProvider.chat([
			{
				role: 'model',
				content: '',
				_openaiInputItems: firstResponse._openaiRawOutput,
			},
			{
				role: 'tool',
				content: {
					type: 'tool_result',
					toolCallId: 'call_1',
					content: '{"temperature":18}',
				},
			},
		]);

		expect(second.requests[0].input.slice(0, 2)).toEqual(rawOutput);
		expect(second.requests[0].input[2]).toEqual({
			type: 'function_call_output',
			call_id: 'call_1',
			output: '{"temperature":18}',
		});
	});

	it('rejects unsupported inline media rather than silently dropping it', async () => {
		const fake = fakeClient({ output_text: '', output: [] });
		const provider = new OpenAIProvider('test-key', undefined, fake.client);

		await expect(provider.chat([{
			role: 'user',
			content: [{
				type: 'inline_data',
				mimeType: 'audio/ogg',
				data: 'YXVkaW8=',
			}],
		}])).rejects.toBeInstanceOf(UnsupportedOpenAIMediaError);
		expect(fake.requests).toHaveLength(0);
	});

	it('sends PDF and text documents as stateless inline file inputs', async () => {
		const fake = fakeClient({ output_text: 'Document read.', output: [] });
		const provider = new OpenAIProvider('test-key', undefined, fake.client);

		await provider.chat([{
			role: 'user',
			content: [
				{ type: 'text', text: 'Summarise these.' },
				{
					type: 'inline_data',
					mimeType: 'application/pdf',
					data: 'cGRm',
					filename: 'notes.pdf',
				},
				{
					type: 'inline_data',
					mimeType: 'text/plain',
					data: 'dGV4dA==',
				},
			],
		}]);

		expect(fake.requests[0].input[0].content.slice(1)).toEqual([
			{
				type: 'input_file',
				detail: 'auto',
				file_data: 'data:application/pdf;base64,cGRm',
				filename: 'notes.pdf',
			},
			{
				type: 'input_file',
				detail: undefined,
				file_data: 'data:text/plain;base64,dGV4dA==',
				filename: 'telegram-document.txt',
			},
		]);
	});

	it('normalises OpenAI URL citations to Eukara annotation shape', async () => {
		const fake = fakeClient({
			output_text: 'Sourced answer.',
			output: [{
				type: 'message',
				content: [{
					type: 'output_text',
					text: 'Sourced answer.',
					annotations: [{
						type: 'url_citation',
						url: 'https://example.com',
						title: 'Example',
						start_index: 0,
						end_index: 6,
					}],
				}],
			}],
		});
		const provider = new OpenAIProvider('test-key', undefined, fake.client);

		const result = await provider.chat(
			[{ role: 'user', content: 'Search for this.' }],
			undefined,
			{ enableGrounding: true },
		);

		expect(result._annotations).toEqual([{
			type: 'url_citation',
			url_citation: {
				url: 'https://example.com',
				title: 'Example',
				start_index: 0,
				end_index: 6,
			},
		}]);
		expect(fake.requests[0].tools).toContainEqual({
			type: 'web_search',
			search_context_size: 'medium',
			user_location: {
				type: 'approximate',
				country: 'GB',
				timezone: 'Europe/London',
			},
		});
	});

	it('uses the approved embedding model', async () => {
		const fake = fakeClient({ output_text: '', output: [] }, [0.3, 0.4]);
		const provider = new OpenAIProvider('test-key', undefined, fake.client);

		await expect(provider.embed('memory')).resolves.toEqual([0.3, 0.4]);
		expect(fake.embeddingRequests[0]).toEqual({
			model: OPENAI_MODELS.embedding,
			input: ['memory'],
			encoding_format: 'float',
		});
	});

	it('batches embeddings in response index order', async () => {
		const fake = fakeClient(
			{ output_text: '', output: [] },
			[[0.1, 0.2], [0.3, 0.4]],
		);
		const provider = new OpenAIProvider('test-key', undefined, fake.client);

		await expect(provider.embedMany(['first', 'second'])).resolves.toEqual([
			[0.1, 0.2],
			[0.3, 0.4],
		]);
		expect(fake.embeddingRequests[0].input).toEqual(['first', 'second']);
	});
});

describe('OpenAI streaming and routing foundation', () => {
	it('emits visible text and tool intent but ignores reasoning', () => {
		expect(parseOpenAIStreamEvent({
			type: 'response.output_text.delta',
			delta: 'Hel',
		})).toEqual({ type: 'text', text: 'Hel' });
		expect(parseOpenAIStreamEvent({
			type: 'response.output_item.added',
			item: { type: 'function_call' },
		})).toEqual({ type: 'tool_call' });
		expect(parseOpenAIStreamEvent({
			type: 'response.reasoning_text.delta',
			delta: 'private',
		})).toBeUndefined();
	});

	it('keeps Cloudflare as default and applies the approved OpenAI lane matrix', () => {
		expect(routeMessage({ userText: 'hello', isOwner: true }).provider)
			.toBe('cloudflare');
		expect(routeMessage(
			{
				userText: 'hello',
				isOwner: true,
				curatorResult: {
					intent: 'casual',
					isCrisis: false,
					complexity: 'simple',
					needsCurrentInformation: false,
				},
			},
			'openai',
		)).toMatchObject({
			provider: 'openai',
			model: OPENAI_MODELS.chat,
			thinkingLevel: 'LOW',
			reason: 'default_casual',
			enableGrounding: false,
		});

		expect(routeMessage({
			userText: 'Let us think through how I should approach my week.',
			isOwner: true,
			curatorResult: {
				intent: 'casual',
				isCrisis: false,
				complexity: 'substantive',
				needsCurrentInformation: false,
			},
		}, 'openai')).toMatchObject({
			model: OPENAI_MODELS.chat,
			thinkingLevel: 'MEDIUM',
			reason: 'substantive_conversation',
		});

		expect(routeMessage({
			userText: 'Remind me at 20:00.',
			isOwner: true,
			curatorResult: {
				intent: 'functional',
				isCrisis: false,
				complexity: 'simple',
				needsCurrentInformation: false,
			},
		}, 'openai')).toMatchObject({
			model: OPENAI_MODELS.functional,
			thinkingLevel: 'MEDIUM',
			reason: 'simple_tool_action',
		});
	});

	it('keeps a narrow deterministic crisis fallback', () => {
		expect(hasExplicitCrisisSignal('I am planning to hurt myself')).toBe(true);
		expect(hasExplicitCrisisSignal('We discussed suicide prevention research')).toBe(false);
	});
});
