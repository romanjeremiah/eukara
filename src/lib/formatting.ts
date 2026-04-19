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
 * Convert leaked markdown syntax to Telegram HTML equivalents.
 *
 * Eukara's system prompt tells the model to use HTML, but models
 * occasionally slip into markdown habits — especially for headers,
 * bullet lists, and bold/italic emphasis. Without this converter,
 * users see raw `### Title`, `**bold**`, and `* item` characters
 * in their chat because Telegram HTML parse mode renders none of
 * those as formatting.
 *
 * Order matters: code blocks FIRST (so their contents aren't
 * mangled by later substitutions), then headers, then emphasis,
 * then bullets. Fenced code blocks are converted to <pre>; inline
 * backticks to <code>.
 */
export function normaliseMarkdown(text: string): string {
	if (!text) return text;
	let out = text;

	// 1. Fenced code blocks ```lang\n...\n``` → <pre>...</pre>
	//    Must run first so their contents don't get touched by the
	//    bullet/emphasis passes below.
	out = out.replace(/```(?:[a-z]*\n)?([\s\S]*?)```/gi, (_, code) => {
		return `<pre>${code.trim()}</pre>`;
	});

	// 2. Inline code `foo` → <code>foo</code>.
	//    Single backticks only — must not greedy-match across lines.
	out = out.replace(/`([^`\n]+)`/g, '<code>$1</code>');

	// 3. Markdown headers (###, ##, #) → bold on their own line.
	//    Telegram has no headers, so bold is the closest equivalent.
	//    NOTE: use [ \t]* not \s* for leading whitespace — \s includes
	//    newlines, which would cause the regex to eat blank lines
	//    preceding the header.
	out = out.replace(/^[ \t]*#{1,6}\s+(.+)$/gm, '<b>$1</b>');

	// 4. Bold **text** or __text__ → <b>text</b>
	//    Non-greedy to avoid swallowing multiple paragraphs.
	out = out.replace(/\*\*([^*\n]+?)\*\*/g, '<b>$1</b>');
	out = out.replace(/__([^_\n]+?)__/g, '<b>$1</b>');

	// 5. Italic *text* or _text_ → <i>text</i>
	//    Guard against matching bullets (* at start of line) and
	//    intra-word underscores (snake_case). The negative lookbehind
	//    and lookahead exclude word characters.
	out = out.replace(/(?<![*\w])\*([^*\n]+?)\*(?!\w)/g, '<i>$1</i>');
	out = out.replace(/(?<![_\w])_([^_\n]+?)_(?!\w)/g, '<i>$1</i>');

	// 6. Bullet lists: lines starting with `* ` or `- ` → `• `.
	//    Telegram HTML doesn't render <ul>/<li>, so convert to the
	//    bullet character the FORMATTING_RULES tells the model to use.
	out = out.replace(/^(\s*)[*\-]\s+/gm, '$1• ');

	return out;
}

/**
 * Escape HTML special characters for Telegram HTML parse mode.
 * Used when inserting user-provided or uncontrolled text into HTML output.
 * Do NOT apply to text that already contains intentional HTML (like model
 * output after normaliseMarkdown) — it would double-escape the tags.
 */
export function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}
