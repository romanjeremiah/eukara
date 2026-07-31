#!/usr/bin/env node

// ============================================================
// Local Telegram administration
// ============================================================
// Secrets are loaded by Node from .dev.vars through package.json scripts.
// This file never prints either secret and is not exposed by the Worker.
// ============================================================

const DEFAULT_WEBHOOK_URL = 'https://eukara.roman-jeremiah.workers.dev/';
const ALLOWED_UPDATES = [
	'message',
	'edited_message',
	'callback_query',
	'inline_query',
	'message_reaction',
	'poll_answer',
];
const COMMANDS = [
	{ command: 'mood', description: 'Start a guided mood and sleep check-in' },
	{ command: 'listen', description: 'Start a brain dump session' },
	{ command: 'done', description: 'End listening / brain dump' },
	{ command: 'architect', description: 'Run an innovation review' },
	{ command: 'memories', description: 'Show what I remember about you' },
	{ command: 'forget', description: 'Delete memories (category or all)' },
	{ command: 'timezone', description: 'Set your local timezone' },
	{ command: 'clear', description: 'Clear conversation context' },
	{ command: 'start', description: 'Welcome message' },
];

/** Return a required environment value without disclosing it. */
function requiredEnv(name) {
	const value = process.env[name]?.trim();
	if (!value) throw new Error(`${name} is not set. Add it to .dev.vars first.`);
	return value;
}

/** Validate and return the configured production webhook URL. */
function webhookUrl() {
	const value = process.env.TELEGRAM_WEBHOOK_URL?.trim() || DEFAULT_WEBHOOK_URL;
	const parsed = new URL(value);
	if (parsed.protocol !== 'https:') throw new Error('TELEGRAM_WEBHOOK_URL must use HTTPS.');
	return parsed.toString();
}

/** Call one bounded Telegram Bot API method and validate its response. */
async function callTelegram(method, body) {
	const token = requiredEnv('TELEGRAM_TOKEN');
	let response;
	try {
		response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		});
	} catch {
		throw new Error(`Telegram ${method} request failed before a response was received.`);
	}

	const data = await response.json().catch(() => null);
	if (!response.ok || data?.ok !== true) {
		throw new Error(`Telegram ${method} failed: ${data?.description ?? `HTTP ${response.status}`}`);
	}
	return data.result;
}

/** Register the authenticated production webhook without dropping updates. */
async function setWebhook() {
	const secret = requiredEnv('TELEGRAM_WEBHOOK_SECRET');
	if (!/^[A-Za-z0-9_-]{1,256}$/.test(secret)) {
		throw new Error('TELEGRAM_WEBHOOK_SECRET contains characters Telegram does not allow.');
	}

	await callTelegram('setWebhook', {
		url: webhookUrl(),
		allowed_updates: ALLOWED_UPDATES,
		secret_token: secret,
		drop_pending_updates: false,
	});
	console.log('Telegram webhook registered with secret-token authentication.');
}

/** Replace the bot command menu with Eukara's current command contract. */
async function setCommands() {
	await callTelegram('setMyCommands', { commands: COMMANDS });
	console.log(`Telegram command menu registered (${COMMANDS.length} commands).`);
}

/** Print non-secret Telegram configuration for rollout verification. */
async function printStatus() {
	const [webhook, commands] = await Promise.all([
		callTelegram('getWebhookInfo', {}),
		callTelegram('getMyCommands', {}),
	]);
	console.log(JSON.stringify({
		webhook: {
			url: webhook.url,
			pending_update_count: webhook.pending_update_count,
			last_error_date: webhook.last_error_date ?? null,
			last_error_message: webhook.last_error_message ?? null,
			allowed_updates: webhook.allowed_updates ?? [],
		},
		commands,
	}, null, 2));
}

/** Run the selected local administration operation. */
async function main() {
	const action = process.argv[2];
	if (action === 'setup') {
		await setWebhook();
		await setCommands();
		await printStatus();
		return;
	}
	if (action === 'status') {
		await printStatus();
		return;
	}
	throw new Error('Usage: telegram-admin.mjs <setup|status>');
}

main().catch(error => {
	console.error(error instanceof Error ? error.message : 'Telegram administration failed.');
	process.exitCode = 1;
});
