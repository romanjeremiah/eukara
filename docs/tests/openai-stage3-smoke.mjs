#!/usr/bin/env node

// Live Stage 3 OpenAI smoke test.
// Reads OPENAI_API_KEY from the process or .dev.vars and never prints it.

import { readFile } from 'node:fs/promises';
import OpenAI from 'openai';

const SAMPLE_OGG_URL = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/En-us-hello.ogg';

/**
 * Read one local development secret without exposing its value.
 */
async function loadOpenAIKey() {
	if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
	const source = await readFile(new URL('../../.dev.vars', import.meta.url), 'utf8');
	const match = source.match(/^OPENAI_API_KEY\s*=\s*["']?([^\r\n"']+)["']?\s*$/m);
	if (!match?.[1]) throw new Error('OPENAI_API_KEY is not configured');
	return match[1].trim();
}

/**
 * Read model identifiers from Eukara's central TypeScript registry.
 */
async function loadModelRegistry() {
	const source = await readFile(new URL('../../src/config/models.ts', import.meta.url), 'utf8');
	const registry = source.slice(source.indexOf('export const OPENAI_MODELS'));
	const model = (name) => {
		const match = registry.match(new RegExp(`\\b${name}:\\s*'([^']+)'`));
		if (!match?.[1]) throw new Error(`Could not read ${name} from OPENAI_MODELS`);
		return match[1];
	};
	return {
		curator: model('curator'),
		chat: model('chat'),
		architect: model('architect'),
		transcription: model('transcription'),
		speech: model('speech'),
		image: model('image'),
	};
}

/**
 * Time one live API assertion and return non-sensitive evidence.
 */
async function check(name, operation) {
	const startedAt = performance.now();
	const evidence = await operation();
	return {
		name,
		status: 'passed',
		durationMs: Math.round(performance.now() - startedAt),
		...evidence,
	};
}

const apiKey = await loadOpenAIKey();
const OPENAI_MODELS = await loadModelRegistry();
const client = new OpenAI({ apiKey, maxRetries: 0, timeout: 120_000 });
const checks = [];

for (const [role, model] of Object.entries({
	luna: OPENAI_MODELS.curator,
	terra: OPENAI_MODELS.chat,
	sol: OPENAI_MODELS.architect,
})) {
	checks.push(await check(`responses-${role}`, async () => {
		const response = await client.responses.create({
			model,
			input: 'Reply with only OK.',
			max_output_tokens: 32,
			store: false,
		});
		if (response.output_text.trim() !== 'OK') {
			throw new Error(`${model} returned an unexpected smoke response`);
		}
		return { model };
	}));
}

const audioResponse = await fetch(SAMPLE_OGG_URL);
if (!audioResponse.ok) throw new Error(`Could not fetch OGG fixture: ${audioResponse.status}`);
const audio = await audioResponse.arrayBuffer();
checks.push(await check('transcription-ogg', async () => {
	const result = await client.audio.transcriptions.create({
		model: OPENAI_MODELS.transcription,
		file: new File([audio], 'telegram-audio.ogg', { type: 'audio/ogg' }),
	});
	const transcript = result.text.trim();
	if (!transcript.toLowerCase().includes('hello')) {
		throw new Error('Transcription did not contain the expected fixture word');
	}
	return { model: OPENAI_MODELS.transcription, inputBytes: audio.byteLength };
}));

checks.push(await check('speech-mp3', async () => {
	const speech = await client.audio.speech.create({
		model: OPENAI_MODELS.speech,
		voice: 'nova',
		input: 'Eukara OpenAI speech smoke test.',
		response_format: 'mp3',
	});
	const data = await speech.arrayBuffer();
	if (data.byteLength < 100) throw new Error('Speech response was unexpectedly small');
	return { model: OPENAI_MODELS.speech, outputBytes: data.byteLength };
}));

checks.push(await check('image-png', async () => {
	const image = await client.images.generate({
		model: OPENAI_MODELS.image,
		prompt: 'A simple flat blue circle centred on a white background, no text.',
		size: '1024x1024',
		quality: 'medium',
		output_format: 'png',
	});
	const encoded = image.data?.[0]?.b64_json;
	if (!encoded) throw new Error('Image response did not include base64 data');
	const outputBytes = Buffer.byteLength(encoded, 'base64');
	if (outputBytes < 1_000) throw new Error('Image response was unexpectedly small');
	return { model: OPENAI_MODELS.image, outputBytes };
}));

console.log(JSON.stringify({
	timestamp: new Date().toISOString(),
	status: 'passed',
	checks,
}, null, 2));
