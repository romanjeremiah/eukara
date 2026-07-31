import { defineConfig } from 'vitest/config';

/**
 * Pure Node unit lane for contracts that do not require Workers bindings.
 * This remains runnable when Cloudflare's remote preview service is down.
 */
export default defineConfig({
	test: {
		environment: 'node',
		include: [
			'test/governed-memory.spec.js',
			'test/openai-adapter.spec.js',
			'test/telegram-formatting.spec.js',
		],
	},
});
