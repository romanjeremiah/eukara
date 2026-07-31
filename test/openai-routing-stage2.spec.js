// ============================================================
// Stage 2 provider routing and mutation-boundary regression tests
// ============================================================

import { describe, expect, it } from 'vitest';
import {
	createConfiguredProvider,
	getAIProviderMode,
} from '../src/ai/provider-factory';
import { OPENAI_MODELS } from '../src/config/models';
import { patchRepoFile, readRepoFile } from '../src/tools/github-tools';

describe('Stage 2 provider selection', () => {
	it('fails unknown modes safely to Cloudflare', () => {
		expect(getAIProviderMode({ AI_PROVIDER_MODE: 'unexpected' })).toBe('cloudflare');
	});

	it('creates an OpenAI role provider only when the secret exists', () => {
		const models = {
			openai: OPENAI_MODELS.background,
			cloudflare: '@cf/meta/llama-3.2-3b-instruct',
		};

		expect(() => createConfiguredProvider(
			{ AI_PROVIDER_MODE: 'openai' },
			models,
		)).toThrow(/OPENAI_API_KEY/);

		const provider = createConfiguredProvider(
			{ AI_PROVIDER_MODE: 'openai', OPENAI_API_KEY: 'test-key' },
			models,
		);
		expect(provider.name).toBe('openai');
	});
});

describe('GitHub tool authorisation', () => {
	const args = {
		path: 'src/example.ts',
		content: 'export {};',
		message: 'test change',
	};
	const outsiderContext = {
		userId: 999,
		chatId: 999,
		threadId: 'default',
	};

	it('blocks repository mutation for a non-owner before network access', async () => {
		const result = await patchRepoFile.execute(
			args,
			{ OWNER_ID: '123', GITHUB_TOKEN: 'test-token' },
			outsiderContext,
		);

		expect(result).toEqual({
			status: 'error',
			message: 'Only the configured owner may modify repository files.',
		});
	});

	it('does not add the mutation-only owner restriction to repository reads', async () => {
		const result = await readRepoFile.execute(
			{ path: 'README.md' },
			{},
			outsiderContext,
		);

		expect(result).toEqual({
			status: 'error',
			message: 'GitHub token not configured.',
		});
	});
});
