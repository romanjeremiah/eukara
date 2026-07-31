// ============================================================
// Request authentication helpers
// ============================================================

/**
 * Compare two secret strings without leaking their length or returning early.
 * SHA-256 produces fixed-size inputs for Workers' constant-time comparator.
 */
export async function timingSafeSecretEqual(
	provided: string | null,
	expected: string | undefined,
): Promise<boolean> {
	if (!provided || !expected) return false;

	const encoder = new TextEncoder();
	const [providedHash, expectedHash] = await Promise.all([
		crypto.subtle.digest('SHA-256', encoder.encode(provided)),
		crypto.subtle.digest('SHA-256', encoder.encode(expected)),
	]);

	return crypto.subtle.timingSafeEqual(providedHash, expectedHash);
}

/** Authenticate a Telegram webhook request using Telegram's secret header. */
export async function isTelegramWebhookAuthorised(
	request: Request,
	expectedSecret: string | undefined,
): Promise<boolean> {
	return timingSafeSecretEqual(
		request.headers.get('X-Telegram-Bot-Api-Secret-Token'),
		expectedSecret,
	);
}
