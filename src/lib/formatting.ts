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

	// Code blocks need protection from subsequent passes. Without this,
	// a fenced code block containing template literals like
	//   return `/api/posts/${id}`;
	// has its backticks eaten by the inline-code regex, which then wraps
	// the template literal as <code> INSIDE the <pre> — broken HTML
	// that Telegram rejects. The stash-placeholder-restore pattern
	// keeps code contents opaque to later transforms.
	const stashed: string[] = [];
	const stash = (html: string): string => {
		const idx = stashed.length;
		stashed.push(html);
		// NUL sentinels: will never appear in model output, so safe as a
		// placeholder token that nothing else in this function will touch.
		return `\x00STASH${idx}\x00`;
	};

	// 1. Fenced code blocks ```lang\n...\n``` → <pre>...</pre>, stashed.
	out = out.replace(/```(?:[a-z]*\n)?([\s\S]*?)```/gi, (_, code) => {
		return stash(`<pre>${code.trim()}</pre>`);
	});

	// 2. Inline code `foo` → <code>foo</code>, stashed.
	//    Single backticks only — must not greedy-match across lines.
	out = out.replace(/`([^`\n]+)`/g, (_, code) => {
		return stash(`<code>${code}</code>`);
	});

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

	// 7. Horizontal rules (---, ***, ___) → blank line.
	//    Telegram has no <hr> equivalent. The rule was separating
	//    sections; a blank line does the same job visually.
	out = out.replace(/^[ \t]*([-*_])\1{2,}[ \t]*$/gm, '');

	// 8. Pipe tables → bullet rows. Telegram HTML has NO table support,
	//    so the cleanest fallback is to flatten each data row into a
	//    single bullet line with pipe separators. The header row and
	//    the separator row (|:---|) are dropped; data rows are kept.
	//    This handles the shape the model typically produces:
	//      | Col | Col |
	//      | :-- | :-- |
	//      | val | val |
	out = convertPipeTables(out);

	// 9. Final whitespace pass — collapse runs of 3+ blank lines that
	//    the substitutions above may have introduced.
	out = out.replace(/\n{3,}/g, '\n\n');

	// 10. Restore stashed code blocks. Do this LAST so every other
	//     transformation has run on the non-code text.
	out = out.replace(/\x00STASH(\d+)\x00/g, (_, idx) => stashed[Number(idx)] ?? '');

	return out;
}

/**
 * Convert markdown pipe-tables to a bullet-row representation.
 *
 * Pattern detected:
 *   | Header1 | Header2 |
 *   | :--- | :--- |     ← separator (may have :, -, or spaces)
 *   | data | data |
 *   | data | data |
 *
 * Output:
 *   <b>Header1 | Header2</b>
 *   • data | data
 *   • data | data
 *
 * The header is bolded so the section still has visual hierarchy
 * even without a real table.
 */
function convertPipeTables(text: string): string {
	const lines = text.split('\n');
	const out: string[] = [];
	let i = 0;

	while (i < lines.length) {
		const line = lines[i]!;
		// Detect the header row: starts and ends with `|`, has at least one interior `|`.
		const isTableRow = /^\s*\|.+\|\s*$/.test(line);
		// The next line should be the separator: |:---|---|:---:|
		const nextLine = lines[i + 1];
		const isSeparator = nextLine !== undefined && /^\s*\|[\s\-:|]+\|\s*$/.test(nextLine);

		if (isTableRow && isSeparator) {
			// Extract header cells
			const headerCells = line.trim().slice(1, -1).split('|').map(s => s.trim());
			out.push(`<b>${headerCells.join(' | ')}</b>`);
			// Skip the separator row
			i += 2;
			// Process data rows
			while (i < lines.length && /^\s*\|.+\|\s*$/.test(lines[i]!)) {
				const cells = lines[i]!.trim().slice(1, -1).split('|').map(s => s.trim());
				out.push(`• ${cells.join(' | ')}`);
				i++;
			}
			continue;
		}
		out.push(line);
		i++;
	}
	return out.join('\n');
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
