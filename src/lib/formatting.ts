// ============================================================
// Text Formatting Utilities
//
// Telegram HTML formatting, thought stripping, message splitting.
// These are pure functions with no side effects.
// ============================================================

const MAX_TELEGRAM_LENGTH = 4096;
const SAFE_SPLIT_LENGTH = 3900;

/**
 * Strip leaked internal reasoning from model output.
 * Catches both italic-bracketed actions and keyword-prefixed brackets.
 */
export function stripLeakedThoughts(text: string): string {
	if (!text) return text;
	return text
		// Remove ALL <i>[...]</i> patterns (italic bracketed actions)
		.replace(/<i>\s*\[[^\]]{0,300}\]\s*<\/i>/gi, '')
		// Remove keyword-prefixed [bracketed reasoning]
		.replace(
			/\[(?:Noticing|Thinking|Considering|Reflecting|Observing|Planning|Analyzing|Processing|Noting|Recalling|Checking|Looking|Adjusting|Scanning|Reviewing|Connecting|Sensing|Reading|Pulling|Searching|Querying|Loading|Fetching|Parsing)[^\]]{0,300}\]/gi,
			''
		)
		// Remove computing/result leaks
		.replace(/⚙️\s*Computing[^\n]*\n?/g, '')
		.replace(/^Result:\s*.*?timestamp:\s*\d+\s*$/gm, '')
		// Remove ACTION PLAN / PROCEDURAL MEMORY leaks
		.replace(/ACTION PLAN[^\n]*(?:\n[-•*][^\n]*)*/g, '')
		.replace(/PROCEDURAL MEMORY[^\n]*(?:\n[-•*][^\n]*)*/g, '')
		// Clean up resulting whitespace
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

/**
 * Split a long message into chunks at paragraph boundaries.
 * Respects Telegram's 4096-char HTML limit.
 */
export function splitMessage(text: string, maxLen = SAFE_SPLIT_LENGTH): string[] {
	if (text.length <= maxLen) return [text];

	const chunks: string[] = [];
	let remaining = text;

	while (remaining.length > maxLen) {
		// Try to split at a paragraph boundary
		let splitIdx = remaining.lastIndexOf('\n\n', maxLen);
		if (splitIdx < maxLen * 0.3) {
			// Fallback: split at single newline
			splitIdx = remaining.lastIndexOf('\n', maxLen);
		}
		if (splitIdx < maxLen * 0.3) {
			// Last resort: split at space
			splitIdx = remaining.lastIndexOf(' ', maxLen);
		}
		if (splitIdx < 1) splitIdx = maxLen;

		chunks.push(remaining.slice(0, splitIdx).trim());
		remaining = remaining.slice(splitIdx).trim();
	}
	if (remaining) chunks.push(remaining);
	return chunks;
}

/**
 * Escape HTML special characters for Telegram HTML parse mode.
 */
export function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}
