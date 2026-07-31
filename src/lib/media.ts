// ============================================================
// Media Extraction
//
// Inspect a Telegram message, return the first usable media
// attachment (photo, voice, audio, video, video_note, document,
// sticker). Returns null if the message has no processable media.
//
// Remaps odd Telegram audio MIME types to ones Gemini accepts.
// ============================================================

import type { TelegramMessage } from '../types/telegram';

export interface MediaRef {
	fileId: string;
	mimeType: string;
	fileSize?: number;
	/** Short label for history placeholder / logs, e.g. "photo", "voice note". */
	kind: MediaKind;
}

export type MediaKind =
	| 'photo' | 'voice' | 'audio' | 'video' | 'video_note'
	| 'document' | 'sticker';

/**
 * Extract the first processable media attachment from a Telegram message.
 * Returns null when the message has no media or the media is not a kind
 * Gemini can ingest (e.g. animated stickers, non-media documents).
 */
export function extractMediaFromMessage(msg: TelegramMessage): MediaRef | null {
	// Photos come as an array of resolutions; pick the largest.
	if (msg.photo?.length) {
		const largest = msg.photo[msg.photo.length - 1]!;
		return {
			fileId: largest.file_id,
			mimeType: 'image/jpeg',
			fileSize: largest.file_size,
			kind: 'photo',
		};
	}

	if (msg.voice) {
		return {
			fileId: msg.voice.file_id,
			mimeType: 'audio/ogg',
			fileSize: msg.voice.file_size,
			kind: 'voice',
		};
	}

	if (msg.audio) {
		return {
			fileId: msg.audio.file_id,
			mimeType: remapAudioMime(msg.audio.mime_type) ?? 'audio/mpeg',
			fileSize: msg.audio.file_size,
			kind: 'audio',
		};
	}

	if (msg.video) {
		return {
			fileId: msg.video.file_id,
			mimeType: msg.video.mime_type ?? 'video/mp4',
			fileSize: msg.video.file_size,
			kind: 'video',
		};
	}

	if (msg.video_note) {
		return {
			fileId: msg.video_note.file_id,
			mimeType: 'video/mp4',
			fileSize: msg.video_note.file_size,
			kind: 'video_note',
		};
	}

	// Documents: accept only mime types Gemini can actually process.
	if (msg.document) {
		const mime = msg.document.mime_type ?? '';
		const supported =
			mime.startsWith('image/') ||
			mime.startsWith('audio/') ||
			mime.startsWith('video/') ||
			mime === 'application/pdf' ||
			mime.startsWith('text/');
		if (supported) {
			return {
				fileId: msg.document.file_id,
				mimeType: remapAudioMime(mime) ?? mime,
				fileSize: msg.document.file_size,
				kind: 'document',
			};
		}
	}

	// Stickers: only static ones. Animated/video stickers aren't handled.
	if (msg.sticker && !msg.sticker.is_animated && !msg.sticker.is_video) {
		return {
			fileId: msg.sticker.file_id,
			mimeType: 'image/webp',
			fileSize: msg.sticker.file_size,
			kind: 'sticker',
		};
	}

	return null;
}

/**
 * Build a short text placeholder used when storing a media turn in
 * conversation history — we don't persist the raw base64 data, only a
 * hint so the model knows something was sent on that turn.
 */
export function mediaPlaceholder(kind: MediaKind, caption?: string): string {
	const label = kind === 'video_note' ? 'video note' : kind;
	const captionPart = caption?.trim() ? ` with caption: "${caption.trim()}"` : '';
	return `[user sent a ${label}${captionPart}]`;
}

/**
 * Remap Telegram client MIME quirks to ones Gemini accepts.
 * Extend this list when new client versions surface more odd types.
 */
function remapAudioMime(mime: string | undefined): string | undefined {
	if (!mime) return undefined;
	if (mime === 'audio/s16le' || mime === 'audio/x-wav') return 'audio/wav';
	if (mime === 'audio/m4a') return 'audio/mp4';
	return mime;
}

/**
 * Convert ArrayBuffer to base64 string for inline transmission to Gemini.
 * Workers runtime lacks Node's Buffer by default, so we do it manually.
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	let binary = '';
	const chunkSize = 0x8000;
	for (let i = 0; i < bytes.length; i += chunkSize) {
		binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
	}
	return btoa(binary);
}
