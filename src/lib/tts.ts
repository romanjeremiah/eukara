// ============================================================
// Text-to-Speech Service
//
// Uses Gemini's TTS model for voice generation.
// Falls back gracefully if unavailable.
// ============================================================

import { GEMINI_MODELS } from '../config/models';
import { log } from './logger';

/**
 * Generate speech audio from text using Gemini TTS.
 * Returns an ArrayBuffer of OGG Opus audio.
 */
export async function generateSpeech(
	text: string,
	env: Env
): Promise<ArrayBuffer> {
	if (!env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set');

	const { GoogleGenAI } = await import('@google/genai');
	const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

	const response = await ai.models.generateContent({
		model: GEMINI_MODELS.tts,
		contents: text.slice(0, 3000),
		config: {
			responseModalities: ['AUDIO'],
			speechConfig: {
				voiceConfig: {
					prebuiltVoiceConfig: {
						voiceName: 'Kore',
					},
				},
			},
		},
	});

	// Extract audio data from response
	const part = response.candidates?.[0]?.content?.parts?.[0];
	if (!part || !(part as any).inlineData?.data) {
		throw new Error('TTS returned no audio data');
	}

	const base64 = (part as any).inlineData.data;
	const { Buffer } = await import('node:buffer');
	return Buffer.from(base64, 'base64').buffer as ArrayBuffer;
}
