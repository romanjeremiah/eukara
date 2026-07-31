// ============================================================
// Text-to-Speech Service
//
// Uses the configured provider during the staged OpenAI migration.
// ============================================================

import type { GeneratedSpeech } from '../ai/openai-specialists';
import { createOpenAISpecialistService } from '../ai/openai-specialists';
import { getAIProviderMode } from '../ai/provider-factory';

const VOICE_NAME = 'Zubenelgenubi';

function encodeWAV(samples: Uint8Array): ArrayBuffer {
	const buffer = new ArrayBuffer(44 + samples.length);
	const view = new DataView(buffer);

	// RIFF identifier
	writeString(view, 0, 'RIFF');
	// file length
	view.setUint32(4, 36 + samples.length, true);
	// RIFF type
	writeString(view, 8, 'WAVE');
	// format chunk identifier
	writeString(view, 12, 'fmt ');
	// format chunk length
	view.setUint32(16, 16, true);
	// sample format (raw)
	view.setUint16(20, 1, true);
	// channel count
	view.setUint16(22, 1, true);
	// sample rate
	view.setUint32(24, 24000, true);
	// byte rate (sample rate * block align)
	view.setUint32(28, 24000 * 2, true);
	// block align (channel count * bytes per sample)
	view.setUint16(32, 2, true);
	// bits per sample
	view.setUint16(34, 16, true);
	// data chunk identifier
	writeString(view, 36, 'data');
	// data chunk length
	view.setUint32(40, samples.length, true);

	// write the PCM samples
	new Uint8Array(buffer, 44).set(samples);

	return buffer;
}

function writeString(view: DataView, offset: number, string: string) {
	for (let i = 0; i < string.length; i++) {
		view.setUint8(offset + i, string.charCodeAt(i));
	}
}

/**
 * Generate speech audio using the configured provider.
 */
export async function generateSpeech(
	text: string,
	env: Env
): Promise<GeneratedSpeech> {
	if (getAIProviderMode(env) === 'openai') {
		return createOpenAISpecialistService(env).generateSpeech(text);
	}

	const apiKey = env.GEMINI_API_KEY;
	if (!apiKey) throw new Error('No TTS API key available');

	const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent?key=${apiKey}`;

	const res = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			contents: [{ parts: [{ text: text.slice(0, 5000) }] }],
			generationConfig: {
				responseModalities: ["AUDIO"],
				speechConfig: {
					voiceConfig: {
						prebuiltVoiceConfig: { voiceName: VOICE_NAME }
					}
				}
			}
		}),
	});

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const data = await res.json() as any;

	if (data.error) {
		throw new Error(`TTS error: ${data.error.message}`);
	}

	const candidates = data.candidates;
	if (!candidates || candidates.length === 0) {
		throw new Error('TTS returned no candidates');
	}

	const inlineData = candidates[0]?.content?.parts?.[0]?.inlineData;
	if (!inlineData || !inlineData.data) {
		throw new Error('TTS returned no audio data');
	}

	const { Buffer } = await import('node:buffer');
	const pcmBuffer = Buffer.from(inlineData.data, 'base64');
	const wavBuffer = encodeWAV(new Uint8Array(pcmBuffer));
	
	return {
		data: wavBuffer,
		filename: 'voice.wav',
		mimeType: 'audio/wav',
	};
}
