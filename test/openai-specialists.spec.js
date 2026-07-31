// ============================================================
// Direct OpenAI specialist endpoint regression tests
//
// Pure unit tests: all SDK calls are mocked and no API key is used.
// ============================================================

import { describe, expect, it } from 'vitest';
import { OpenAISpecialistService } from '../src/ai/openai-specialists';
import { OPENAI_MODELS } from '../src/config/models';

/**
 * Build a minimal specialist client double and retain outbound requests.
 */
function fakeClient() {
	const transcriptionRequests = [];
	const speechRequests = [];
	const imageRequests = [];
	return {
		transcriptionRequests,
		speechRequests,
		imageRequests,
		client: {
			audio: {
				transcriptions: {
					create: async (request) => {
						transcriptionRequests.push(request);
						return { text: '  Hello from Telegram.  ' };
					},
				},
				speech: {
					create: async (request) => {
						speechRequests.push(request);
						return new Response(new Uint8Array([1, 2, 3]));
					},
				},
			},
			images: {
				generate: async (request) => {
					imageRequests.push(request);
					return { data: [{ b64_json: 'AQID' }] };
				},
			},
		},
	};
}

describe('OpenAISpecialistService', () => {
	it('uploads Telegram OGG with the configured transcription model', async () => {
		const fake = fakeClient();
		const service = new OpenAISpecialistService('test-key', fake.client);

		const transcript = await service.transcribe(
			new Uint8Array([1, 2]).buffer,
			'audio/ogg',
		);

		expect(transcript).toBe('Hello from Telegram.');
		expect(fake.transcriptionRequests[0].model).toBe(OPENAI_MODELS.transcription);
		expect(fake.transcriptionRequests[0].file).toMatchObject({
			name: 'telegram-audio.ogg',
			type: 'audio/ogg',
		});
	});

	it('returns bounded MP3 speech metadata for Telegram', async () => {
		const fake = fakeClient();
		const service = new OpenAISpecialistService('test-key', fake.client);

		const speech = await service.generateSpeech(`  ${'a'.repeat(5_000)}  `);

		expect(fake.speechRequests[0]).toMatchObject({
			model: OPENAI_MODELS.speech,
			voice: 'nova',
			response_format: 'mp3',
		});
		expect(fake.speechRequests[0].input).toHaveLength(4_096);
		expect(speech.filename).toBe('eukara.mp3');
		expect(speech.mimeType).toBe('audio/mpeg');
		expect(Array.from(new Uint8Array(speech.data))).toEqual([1, 2, 3]);
	});

	it('decodes generated image base64 without Node Buffer globals', async () => {
		const fake = fakeClient();
		const service = new OpenAISpecialistService('test-key', fake.client);

		const image = await service.generateImage('A calm blue lake');

		expect(fake.imageRequests[0]).toMatchObject({
			model: OPENAI_MODELS.image,
			size: '1024x1024',
			quality: 'medium',
			output_format: 'png',
		});
		expect(image.mimeType).toBe('image/png');
		expect(Array.from(new Uint8Array(image.data))).toEqual([1, 2, 3]);
	});
});
