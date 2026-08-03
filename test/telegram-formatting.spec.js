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

	it('renders grounded Markdown links as compact Telegram HTML anchors', () => {
		const input = '• <b>Margate Carnival Parade</b> ([margatecarnival.org](https://www.margatecarnival.org/?utm_source=openai))';
		const output = normaliseMarkdown(input);

		expect(output).toBe(
			'• <b>Margate Carnival Parade</b> <a href="https://www.margatecarnival.org/?utm_source=openai">margatecarnival.org</a>',
		);
		expect(output).not.toContain('](');
	});

	it('escapes query separators and protects URL underscores from emphasis conversion', () => {
		const output = normaliseMarkdown(
			'[Event details](https://example.com/event_name?utm_source=openai&day=sunday)',
		);

		expect(output).toBe(
			'<a href="https://example.com/event_name?utm_source=openai&amp;day=sunday">Event details</a>',
		);
		expect(output).not.toContain('<i>');
	});

	it('escapes uncontrolled Markdown link labels before creating HTML', () => {
		expect(normaliseMarkdown('[A & B <guide>](https://example.com)')).toBe(
			'<a href="https://example.com">A &amp; B &lt;guide&gt;</a>',
		);
	});

	it('keeps Markdown-looking links literal inside code spans', () => {
		expect(normaliseMarkdown('`[label](https://example.com)`')).toBe(
			'<code>[label](https://example.com)</code>',
		);
	});

	it('preserves existing Telegram HTML links', () => {
		const html = '<a href="https://example.com/?a=1&amp;b=2">Existing link</a>';
		expect(normaliseMarkdown(html)).toBe(html);
	});
});
