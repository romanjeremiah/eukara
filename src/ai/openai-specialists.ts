// ============================================================
// Direct OpenAI Specialist Services
//
// Audio transcription, speech generation and image generation use their
// dedicated OpenAI endpoints. Conversation state remains in Eukara.
// ============================================================

import OpenAI from 'openai';
import { OPENAI_MODELS } from '../config/models';

const OPENAI_TIMEOUT_MS = 120_000;
const MAX_SPEECH_INPUT_CHARS = 4096;
const MAX_IMAGE_PROMPT_CHARS = 32_000;

export interface GeneratedSpeech {
	data: ArrayBuffer;
	filename: string;
	mimeType: string;
}

export interface GeneratedImage {
	data: ArrayBuffer;
	mimeType: 'image/png';
}

/**
 * Direct OpenAI client for specialist media endpoints.
 */
export class OpenAISpecialistService {
	private readonly client: OpenAI;

	/**
	 * @param apiKey OpenAI project API key.
	 * @param client Optional injected client used by isolated unit tests.
	 */
	constructor(apiKey: string, client?: OpenAI) {
		this.client = client ?? new OpenAI({
			apiKey,
			maxRetries: 0,
			timeout: OPENAI_TIMEOUT_MS,
		});
	}

	/**
	 * Transcribe a bounded Telegram audio attachment.
	 */
	async transcribe(
		audio: ArrayBuffer,
		mimeType: string,
	): Promise<string> {
		const result = await this.client.audio.transcriptions.create({
			model: OPENAI_MODELS.transcription,
			file: new File(
				[audio],
				`telegram-audio.${extensionForMimeType(mimeType)}`,
				{ type: mimeType },
			),
		});

		const transcript = result.text.trim();
		if (!transcript) throw new Error('OpenAI transcription returned no text');
		return transcript;
	}

	/**
	 * Generate a bounded MP3 response for Telegram playback.
	 */
	async generateSpeech(text: string): Promise<GeneratedSpeech> {
		const input = text.trim().slice(0, MAX_SPEECH_INPUT_CHARS);
		if (!input) throw new Error('Speech input is empty');

		const response = await this.client.audio.speech.create({
			model: OPENAI_MODELS.speech,
			voice: 'nova',
			input,
			response_format: 'mp3',
		});

		return {
			data: await response.arrayBuffer(),
			filename: 'eukara.mp3',
			mimeType: 'audio/mpeg',
		};
	}

	/**
	 * Generate one PNG image from a text prompt.
	 */
	async generateImage(prompt: string): Promise<GeneratedImage> {
		const boundedPrompt = prompt.trim().slice(0, MAX_IMAGE_PROMPT_CHARS);
		if (!boundedPrompt) throw new Error('Image prompt is empty');

		const response = await this.client.images.generate({
			model: OPENAI_MODELS.image,
			prompt: boundedPrompt,
			size: '1024x1024',
			quality: 'medium',
			output_format: 'png',
		});
		const encoded = response.data?.[0]?.b64_json;
		if (!encoded) throw new Error('OpenAI image generation returned no image');

		return {
			data: decodeBase64(encoded),
			mimeType: 'image/png',
		};
	}
}

/**
 * Create the specialist client only when the required Worker secret exists.
 */
export function createOpenAISpecialistService(env: Env): OpenAISpecialistService {
	if (!env.OPENAI_API_KEY) {
		throw new Error(
			'OPENAI_API_KEY is required when AI_PROVIDER_MODE is "openai"',
		);
	}
	return new OpenAISpecialistService(env.OPENAI_API_KEY);
}

/**
 * Convert an API base64 payload without relying on Node Buffer globals.
 */
function decodeBase64(value: string): ArrayBuffer {
	const binary = atob(value);
	const bytes = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index++) {
		bytes[index] = binary.charCodeAt(index);
	}
	return bytes.buffer;
}

/**
 * Preserve a useful extension for OpenAI multipart upload validation.
 */
function extensionForMimeType(mimeType: string): string {
	const extensions: Record<string, string> = {
		'audio/aac': 'aac',
		'audio/m4a': 'm4a',
		'audio/mp4': 'mp4',
		'audio/mpeg': 'mp3',
		'audio/ogg': 'ogg',
		'audio/opus': 'opus',
		'audio/wav': 'wav',
		'audio/webm': 'webm',
	};
	return extensions[mimeType] ?? 'audio';
}
