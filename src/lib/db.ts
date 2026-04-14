// ============================================================
// Database Utilities
//
// Centralised D1 query helpers. Every LIKE query in the
// codebase MUST use safeLike() to prevent pattern errors.
// ============================================================

/**
 * Sanitise a string for safe use in D1 LIKE patterns.
 * Strips all non-alphanumeric characters, limits to maxWords words.
 *
 * Usage:
 *   const safe = safeLike(userInput);
 *   db.prepare('SELECT * FROM t WHERE col LIKE ?').bind(`%${safe}%`).all();
 */
export function safeLike(input: string | undefined | null, maxWords = 4): string {
	if (!input) return '';
	return input
		.replace(/[^a-zA-Z0-9\s]/g, '')
		.trim()
		.split(/\s+/)
		.slice(0, maxWords)
		.join(' ');
}

/**
 * Type-safe D1 query helper. Casts results through unknown to avoid
 * the Record<string, unknown> -> T type error.
 */
export async function queryAll<T>(
	stmt: D1PreparedStatement
): Promise<T[]> {
	const { results } = await stmt.all();
	return (results ?? []) as unknown as T[];
}

/**
 * Retry a D1 operation with exponential backoff.
 * D1 can transiently fail under load; this handles it gracefully.
 */
export async function withRetry<T>(
	fn: () => Promise<T>,
	maxRetries = 2,
	delayMs = 500
): Promise<T> {
	let lastError: Error | undefined;
	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			return await fn();
		} catch (err) {
			lastError = err as Error;
			if (attempt < maxRetries) {
				await new Promise(r => setTimeout(r, delayMs * (attempt + 1)));
			}
		}
	}
	throw lastError;
}
