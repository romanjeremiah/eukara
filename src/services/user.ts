// ============================================================
// User Service
//
// Owns everything to do with the user_profiles table:
//   - first-touch initialisation
//   - profile reads and observation-driven updates
//   - timezone management (DB source of truth + KV mirror)
//
// Phase 2 (2026-06-03). Renamed from users.ts to match the rest
// of the Eukara service-file naming convention (singular domain
// noun). Dependency direction: persona.ts -> user.ts, never the
// reverse. ensureUser keeps the persona_config bootstrap via a
// direct INSERT OR IGNORE (no cross-module call) to avoid any
// import-cycle risk.
// ============================================================

import type { UserProfileRow } from '../types/db';
import { log } from '../lib/logger';

/**
 * Ensure user_profiles and persona_config rows exist for this user.
 * Called on first interaction. Idempotent via INSERT OR IGNORE.
 *
 * Touches two tables but stays in user.ts because persona_config
 * is a hard dependency of user_profiles in this app (one cannot
 * meaningfully exist without the other). The alternative would be
 * two separate calls at every interaction point, which is more
 * error-prone than the small layering compromise here.
 */
export async function ensureUser(
	env: Env,
	userId: number,
	firstName?: string,
	username?: string,
	languageCode?: string
): Promise<void> {
	await env.DB.prepare(
		'INSERT OR IGNORE INTO user_profiles (user_id, first_name, username, language_code) VALUES (?, ?, ?, ?)'
	).bind(userId, firstName ?? null, username ?? null, languageCode ?? 'en').run();

	await env.DB.prepare(
		'INSERT OR IGNORE INTO persona_config (user_id) VALUES (?)'
	).bind(userId).run();
}

/**
 * Read the full user_profiles row, or null if absent.
 */
export async function getProfile(env: Env, userId: number): Promise<UserProfileRow | null> {
	return env.DB.prepare(
		'SELECT * FROM user_profiles WHERE user_id = ?'
	).bind(userId).first<UserProfileRow>();
}

/**
 * Read the user's IANA timezone string (e.g. 'Europe/London',
 * 'America/New_York'). Falls back to 'Europe/London' for users
 * without a profile row or a null column.
 *
 * Single source of truth for tz-aware date math.
 *
 * Deliberate Eukara decision: this function swallows DB errors
 * and returns 'Europe/London' rather than throwing. Cron and the
 * message handler MUST have a tz to proceed; failing this call
 * would abort an entire cron tick or message turn. The other
 * Eukara services let DB errors throw because their callers have
 * recovery paths; this one does not, so we degrade in place.
 *
 * Mirrors the value into KV under `timezone_${userId}` so cron.ts
 * (which runs outside a request lifecycle) can read it cheaply.
 * The mirror is best-effort.
 */
export async function getUserTimezone(env: Env, userId: number): Promise<string> {
	try {
		const row = await env.DB.prepare(
			'SELECT timezone FROM user_profiles WHERE user_id = ?'
		).bind(userId).first<{ timezone: string | null }>();
		return row?.timezone ?? 'Europe/London';
	} catch (e) {
		log.warn('timezone_fetch_error', { userId, msg: (e as Error).message });
		return 'Europe/London';
	}
}

/**
 * Update the user's timezone. Writes to both user_profiles (source
 * of truth) and the KV mirror used by cron.ts.
 *
 * Callers should validate the timezone string before calling.
 * Intl.supportedValuesOf('timeZone') gives the canonical list in
 * modern runtimes. Passing an invalid tz will not throw here but
 * will break downstream toLocaleDateString calls that use it.
 */
export async function setUserTimezone(
	env: Env, userId: number, timezone: string
): Promise<void> {
	await env.DB.prepare(
		'UPDATE user_profiles SET timezone = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
	).bind(timezone, userId).run();
	// Mirror to KV for cron.ts. Best effort, do not block on failure.
	await env.CHAT_KV.put(`timezone_${userId}`, timezone).catch(e =>
		log.warn('timezone_kv_mirror_error', { userId, msg: (e as Error).message })
	);
	log.info('timezone_updated', { userId, timezone });
}

/**
 * Update profile facts learned from observation.
 * Currently used by the daily persona-evolution cron (Phase 4)
 * and any tool that wants to record an observed user trait.
 *
 * Pass only the fields you want to change. Omitted fields are
 * left untouched.
 */
export async function updateProfileFromObservation(
	env: Env, userId: number,
	updates: { hobbies?: string; traits?: string; preference?: string }
): Promise<void> {
	const fields: string[] = [];
	const values: (string | number)[] = [];

	if (updates.hobbies) { fields.push('known_hobbies = ?'); values.push(updates.hobbies); }
	if (updates.traits) { fields.push('core_traits = ?'); values.push(updates.traits); }
	if (updates.preference) { fields.push('communication_preference = ?'); values.push(updates.preference); }

	if (!fields.length) return;
	fields.push('updated_at = CURRENT_TIMESTAMP');
	values.push(userId);

	await env.DB.prepare(
		`UPDATE user_profiles SET ${fields.join(', ')} WHERE user_id = ?`
	).bind(...values).run();
}
