// ============================================================
// Telegram media durability regression tests
// ============================================================

import { describe, expect, it } from 'vitest';
import {
	persistTelegramMedia,
	updateStoredMediaState,
} from '../src/lib/media';

/**
 * Build R2 and KV doubles that retain every awaited mutation.
 */
function fakeEnvironment() {
	const r2Puts = [];
	const kvPuts = [];
	const dbStatements = [];
	const dbRuns = [];
	return {
		r2Puts,
		kvPuts,
		dbStatements,
		dbRuns,
		env: {
			MEDIA_BUCKET: {
				put: async (...args) => r2Puts.push(args),
			},
			CHAT_KV: {
				put: async (...args) => kvPuts.push(args),
			},
			DB: {
				prepare: (sql) => {
					dbStatements.push(sql);
					return {
						bind: (...values) => ({
							run: async () => dbRuns.push(values),
						}),
					};
				},
			},
		},
	};
}

describe('Telegram media persistence', () => {
	it('persists bytes and ownership before provider processing', async () => {
		const fake = fakeEnvironment();
		const bytes = new Uint8Array([7, 8, 9]).buffer;

		const stored = await persistTelegramMedia(
			fake.env,
			{ fileId: 'telegram-file', kind: 'voice', mimeType: 'audio/ogg' },
			bytes,
			{
				chatId: 22,
				fileId: 'telegram-file',
				messageId: 33,
				threadId: 'topic-1',
				userId: 11,
			},
		);

		expect(stored).toEqual({
			key: 'media/11/22/33-voice.ogg',
			stateKey: 'media_state:media/11/22/33-voice.ogg',
		});
		expect(fake.r2Puts[0][0]).toBe(stored.key);
		expect(fake.r2Puts[0][1]).toBe(bytes);
		expect(fake.r2Puts[0][2]).toMatchObject({
			httpMetadata: { contentType: 'audio/ogg' },
			customMetadata: {
				chatId: '22',
				fileId: 'telegram-file',
				messageId: '33',
				threadId: 'topic-1',
				userId: '11',
				state: 'accepted',
			},
		});
		expect(fake.dbStatements[0]).toContain('INSERT INTO media_assets');
		expect(fake.dbRuns[0]).toEqual([
			stored.key,
			11,
			22,
			'topic-1',
			33,
			'telegram-file',
			'voice',
			'audio/ogg',
			expect.any(String),
			expect.any(String),
		]);
		const accepted = JSON.parse(fake.kvPuts[0][1]);
		expect(accepted).toMatchObject({
			key: stored.key,
			mimeType: 'audio/ogg',
			state: 'accepted',
			userId: 11,
		});
	});

	it('records bounded lifecycle failure detail', async () => {
		const fake = fakeEnvironment();
		await updateStoredMediaState(
			fake.env,
			{ key: 'media/key', stateKey: 'media_state:media/key' },
			'failed',
			'x'.repeat(700),
		);

		expect(fake.kvPuts[0][0]).toBe('media_state:media/key');
		expect(fake.dbStatements[0]).toContain('UPDATE media_assets');
		expect(fake.dbRuns[0]).toEqual([
			'failed',
			'x'.repeat(500),
			expect.any(String),
			'media/key',
		]);
		const state = JSON.parse(fake.kvPuts[0][1]);
		expect(state.state).toBe('failed');
		expect(state.detail).toHaveLength(500);
	});
});
