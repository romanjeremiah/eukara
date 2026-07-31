import { afterEach, describe, expect, it, vi } from 'vitest';
import { normaliseMarkdown } from '../src/lib/formatting';
import { editMessage, sendMessage } from '../src/lib/telegram';

/**
 * Return a successful Telegram response without making a network request.
 */
function telegramResponse() {
	return new Response(JSON.stringify({
		ok: true,
		result: {
			message_id: 1,
			chat: { id: 123, type: 'private' },
			date: 0,
		},
	}), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('classic Telegram conversation rendering', () => {
	it('sends persistent replies through sendMessage with HTML parse mode', async () => {
		const fetchMock = vi.fn(async () => telegramResponse());
		vi.stubGlobal('fetch', fetchMock);

		await sendMessage(123, 'default', '<b>Hello</b>', {
			TELEGRAM_TOKEN: 'test-token',
		});

		const [url, init] = fetchMock.mock.calls[0];
		const payload = JSON.parse(init.body);
		expect(url).toContain('/sendMessage');
		expect(payload).toMatchObject({
			chat_id: 123,
			text: '<b>Hello</b>',
			parse_mode: 'HTML',
			link_preview_options: { is_disabled: true },
		});
		expect(payload).not.toHaveProperty('rich_message');
	});

	it('edits persistent replies using the same classic HTML contract', async () => {
		const fetchMock = vi.fn(async () => telegramResponse());
		vi.stubGlobal('fetch', fetchMock);

		await editMessage(123, 7, 'Updated', { TELEGRAM_TOKEN: 'test-token' });

		const [url, init] = fetchMock.mock.calls[0];
		const payload = JSON.parse(init.body);
		expect(url).toContain('/editMessageText');
		expect(payload).toMatchObject({
			chat_id: 123,
			message_id: 7,
			text: 'Updated',
			parse_mode: 'HTML',
		});
		expect(payload).not.toHaveProperty('rich_message');
	});

	it('normalises leaked Markdown headings to normal paragraph text', () => {
		expect(normaliseMarkdown('# First\n\n### Second')).toBe('First\n\nSecond');
	});
});
