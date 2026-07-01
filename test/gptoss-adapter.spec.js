// ============================================================
// gpt-oss-120b adapter — output parsing regression tests
//
// The 2026-07-01 migration routes conversations to
// @cf/openai/gpt-oss-120b, which returns the Responses API output
// shape rather than Chat Completions `choices`. These tests lock in
// that CloudflareProvider.chat() parses all three shapes it can now
// receive so a turn never comes back with empty text (the "stopped
// responding" failure mode) purely because of a parser mismatch.
//
// Pure unit tests: env.AI is mocked with a stub `run()`; no network.
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { CloudflareProvider } from '../src/ai/cloudflare';

/**
 * Build a fake Workers AI binding whose run() returns a fixed payload.
 * Signature matches ai.run(model, input, options?) used by runAI().
 * @param {unknown} payload - value returned from run()
 */
function fakeAi(payload) {
	return {
		run: async (_model, _input, _opts) => payload,
	};
}

describe('CloudflareProvider gpt-oss output parsing', () => {
	beforeEach(() => {
		// Silence gateway warning noise is unnecessary; runAI's happy path
		// returns on the first (gateway) call because the stub never throws.
	});

	it('parses Responses API output_text into reply text', async () => {
		const provider = new CloudflareProvider(
			fakeAi({ output_text: 'Hello from gpt-oss.' }),
			'@cf/openai/gpt-oss-120b',
		);
		const res = await provider.chat([{ role: 'user', content: 'hi' }]);
		expect(res.text).toBe('Hello from gpt-oss.');
		expect(res.toolCalls).toBeUndefined();
	});

	it('parses Responses API output[] message + function_call', async () => {
		const provider = new CloudflareProvider(
			fakeAi({
				output: [
					{ type: 'reasoning', content: [] },
					{
						type: 'message',
						role: 'assistant',
						content: [{ type: 'output_text', text: 'On it.' }],
					},
					{
						type: 'function_call',
						name: 'set_reminder',
						arguments: '{"text":"call mum","when":"tomorrow"}',
						call_id: 'call_123',
					},
				],
			}),
			'@cf/openai/gpt-oss-120b',
		);
		const res = await provider.chat([{ role: 'user', content: 'remind me' }]);
		expect(res.text).toBe('On it.');
		expect(res.toolCalls).toHaveLength(1);
		expect(res.toolCalls[0]).toMatchObject({
			name: 'set_reminder',
			id: 'call_123',
			args: { text: 'call mum', when: 'tomorrow' },
		});
	});

	it('still parses the legacy {response} shape (regression)', async () => {
		const provider = new CloudflareProvider(
			fakeAi({ response: 'legacy reply' }),
			'@cf/meta/llama-3.2-3b-instruct',
		);
		const res = await provider.chat([{ role: 'user', content: 'hi' }]);
		expect(res.text).toBe('legacy reply');
	});

	it('still parses the OpenAI-compat {choices} shape (regression)', async () => {
		const provider = new CloudflareProvider(
			fakeAi({ choices: [{ message: { content: 'compat reply' } }] }),
			'@cf/meta/llama-3.3-70b-instruct-fp8-fast',
		);
		const res = await provider.chat([{ role: 'user', content: 'hi' }]);
		expect(res.text).toBe('compat reply');
	});
});
