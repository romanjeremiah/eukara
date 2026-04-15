// ============================================================
// Text-to-Speech Service
//
// Uses Google Cloud TTS (Chirp3-HD voices) for voice generation.
// Returns OGG Opus audio compatible with Telegram voice messages.
// ============================================================

import { log } from './logger';

const VOICE_NAME = 'en-US-Chirp3-HD-Zubenelgenubi';

/**
 * Generate speech audio from text using Google Cloud TTS.
 * Returns an ArrayBuffer of OGG Opus audio.
 */
export async function generateSpeech(
	text: string,
	env: Env
): Promise<ArrayBuffer> {
	const apiKey = env.GCP_TTS_API_KEY ?? env.GEMINI_API_KEY;
	if (!apiKey) throw new Error('No TTS API key available');

	const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

	const res = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			input: { text: text.slice(0, 5000) },
			voice: {
				languageCode: 'en-US',
				name: VOICE_NAME,
			},
			audioConfig: {
				audioEncoding: 'OGG_OPUS',
				sampleRateHertz: 24000,
			},
		}),
	});

	const data = await res.json() as { audioContent?: string; error?: { message: string } };

	if (data.error) {
		throw new Error(`TTS error: ${data.error.message}`);
	}

	if (!data.audioContent) {
		throw new Error('TTS returned no audio content');
	}

	const { Buffer } = await import('node:buffer');
	return Buffer.from(data.audioContent, 'base64').buffer as ArrayBuffer;
}
