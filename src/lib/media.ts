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
	filename?: string;
	fileSize?: number;
	/** Short label for history placeholder / logs, e.g. "photo", "voice note". */
	kind: MediaKind;
}

export type MediaKind =
	| 'photo' | 'voice' | 'audio' | 'video' | 'video_note'
	| 'document' | 'sticker';

export type MediaLifecycleState =
	| 'accepted'
	| 'processing'
	| 'ready'
	| 'failed';

export interface StoredMediaRef {
	key: string;
	stateKey: string;
}

export interface MediaOwnershipContext {
	chatId: number;
	fileId: string;
	messageId: number;
	threadId: string;
	userId: number;
}

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
				filename: msg.document.file_name,
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
 * Persist accepted Telegram bytes and ownership metadata before any optional
 * provider processing. The deterministic key makes webhook retries idempotent.
 */
export async function persistTelegramMedia(
	env: Env,
	media: MediaRef,
	buffer: ArrayBuffer,
	owner: MediaOwnershipContext,
): Promise<StoredMediaRef> {
	if (!env.MEDIA_BUCKET) {
		throw new Error('MEDIA_BUCKET binding is required for media processing');
	}

	const key = [
		'media',
		String(owner.userId),
		String(owner.chatId),
		`${owner.messageId}-${media.kind}.${extensionForMedia(media.mimeType)}`,
	].join('/');
	const stateKey = `media_state:${key}`;
	const acceptedAt = new Date().toISOString();

	await env.MEDIA_BUCKET.put(key, buffer, {
		httpMetadata: { contentType: media.mimeType },
		customMetadata: {
			acceptedAt,
			chatId: String(owner.chatId),
			fileId: owner.fileId,
			kind: media.kind,
			messageId: String(owner.messageId),
			state: 'accepted',
			threadId: owner.threadId,
			userId: String(owner.userId),
		},
	});
	await env.DB.prepare(
		`INSERT INTO media_assets (
			object_key, user_id, chat_id, thread_id, message_id,
			telegram_file_id, kind, mime_type, state, accepted_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'accepted', ?, ?)
		ON CONFLICT(object_key) DO UPDATE SET
			telegram_file_id = excluded.telegram_file_id,
			mime_type = excluded.mime_type,
			updated_at = excluded.updated_at`,
	).bind(
		key,
		owner.userId,
		owner.chatId,
		owner.threadId,
		owner.messageId,
		owner.fileId,
		media.kind,
		media.mimeType,
		acceptedAt,
		acceptedAt,
	).run();

	await env.CHAT_KV.put(stateKey, JSON.stringify({
		acceptedAt,
		key,
		mimeType: media.mimeType,
		filename: media.filename ?? '',
		state: 'accepted' satisfies MediaLifecycleState,
		userId: owner.userId,
	}), { expirationTtl: 30 * 24 * 60 * 60 });

	return { key, stateKey };
}

/**
 * Update the lifecycle projection for a persisted media object.
 */
export async function updateStoredMediaState(
	env: Env,
	stored: StoredMediaRef,
	state: MediaLifecycleState,
	detail?: string,
): Promise<void> {
	const updatedAt = new Date().toISOString();
	const boundedDetail = detail?.slice(0, 500);
	await env.DB.prepare(
		`UPDATE media_assets
		 SET state = ?, detail = ?, updated_at = ?
		 WHERE object_key = ?`,
	).bind(state, boundedDetail ?? null, updatedAt, stored.key).run();
	await env.CHAT_KV.put(stored.stateKey, JSON.stringify({
		detail: boundedDetail,
		key: stored.key,
		state,
		updatedAt,
	}), { expirationTtl: 30 * 24 * 60 * 60 });
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

/**
 * Map provider MIME types to stable R2 object suffixes.
 */
function extensionForMedia(mimeType: string): string {
	const extensions: Record<string, string> = {
		'application/pdf': 'pdf',
		'audio/mp4': 'm4a',
		'audio/mpeg': 'mp3',
		'audio/ogg': 'ogg',
		'audio/wav': 'wav',
		'image/jpeg': 'jpg',
		'image/png': 'png',
		'image/webp': 'webp',
		'text/plain': 'txt',
		'video/mp4': 'mp4',
	};
	return extensions[mimeType] ?? 'bin';
}
