// ============================================================
// Persona Service
//
// Per-user personality evolution. Each user gets a unique
// persona that adapts based on their interactions.
// ============================================================

import type { PersonaConfigRow, UserProfileRow } from '../types/db';
import { log } from '../lib/logger';
import {
	BASE_INSTRUCTION,
	MENTAL_HEALTH_DIRECTIVE,
	FORMATTING_RULES,
	SECOND_BRAIN_DIRECTIVE,
} from '../config/personas';

const DEFAULT_PERSONA: PersonaConfigRow = {
	user_id: 0,
	tone: 'warm',
	formality: 'casual',
	humour_level: 'moderate',
	emoji_style: 'moderate',
	therapeutic_approach: 'supportive',
	topics_of_interest: null,
	communication_notes: null,
	evolved_traits: null,
	updated_at: '',
};

/**
 * Ensure user profile + persona config exist. Called on first interaction.
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
 * Get user's profile.
 */
export async function getProfile(env: Env, userId: number): Promise<UserProfileRow | null> {
	return env.DB.prepare(
		'SELECT * FROM user_profiles WHERE user_id = ?'
	).bind(userId).first<UserProfileRow>();
}

/**
 * Get user's persona configuration.
 */
export async function getPersonaConfig(env: Env, userId: number): Promise<PersonaConfigRow> {
	const config = await env.DB.prepare(
		'SELECT * FROM persona_config WHERE user_id = ?'
	).bind(userId).first<PersonaConfigRow>();
	return config ?? { ...DEFAULT_PERSONA, user_id: userId };
}

/**
 * Update persona config fields.
 */
export async function updatePersonaConfig(
	env: Env, userId: number, updates: Partial<PersonaConfigRow>
): Promise<void> {
	const allowed = ['tone', 'formality', 'humour_level', 'emoji_style',
		'therapeutic_approach', 'topics_of_interest', 'communication_notes', 'evolved_traits'];
	const fields = Object.entries(updates).filter(([k]) => allowed.includes(k));
	if (!fields.length) return;

	const sets = fields.map(([k]) => `${k} = ?`).join(', ');
	const values = fields.map(([, v]) => v);
	await env.DB.prepare(
		`UPDATE persona_config SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`
	).bind(...values, userId).run();
}

/**
 * Build the full system instruction for a specific user.
 *
 * Composition order (important — earlier layers set the frame,
 * later layers refine):
 *   1. BASE_INSTRUCTION           — identity, voice, therapeutic frameworks
 *   2. USER CONTEXT + PERSONA OVERLAY — who the user is, how Eukara speaks to them
 *   3. MENTAL_HEALTH_DIRECTIVE    — clinical protocol
 *   4. FORMATTING_RULES           — typography and HTML rules
 *   5. SECOND_BRAIN_DIRECTIVE     — accountability, note-taking, actions
 *   6. DYNAMIC CONTEXT            — per-turn memory, time, episodes, etc.
 */
export async function buildSystemInstruction(
	env: Env, userId: number, dynamicContext: string
): Promise<string> {
	const [profile, persona] = await Promise.all([
		getProfile(env, userId),
		getPersonaConfig(env, userId),
	]);

	const userName = profile?.first_name ?? 'there';
	const daysKnown = profile?.first_seen_at
		? Math.floor((Date.now() - new Date(profile.first_seen_at + 'Z').getTime()) / 86400000)
		: 0;

	// Per-user persona overlay — tone, formality, humour, evolved traits
	const personaOverlay = [
		`Tone: ${persona.tone}`,
		`Formality: ${persona.formality}`,
		`Humour: ${persona.humour_level}`,
		`Emoji usage: ${persona.emoji_style}`,
		`Therapeutic approach: ${persona.therapeutic_approach}`,
		persona.communication_notes ? `Communication notes: ${persona.communication_notes}` : '',
		persona.evolved_traits ? `Evolved personality traits (learned from this user): ${persona.evolved_traits}` : '',
		persona.topics_of_interest ? `User's stated interests: ${persona.topics_of_interest}` : '',
	].filter(Boolean).join('\n');

	// Stable profile facts worth knowing every turn
	const userContext = [
		profile?.known_hobbies ? `Known hobbies: ${profile.known_hobbies}` : '',
		profile?.core_traits ? `Core traits: ${profile.core_traits}` : '',
		profile?.communication_preference ? `Preferred style: ${profile.communication_preference}` : '',
	].filter(Boolean).join('\n');

	const userBlock = `
CURRENT USER: ${userName} (known for ${daysKnown} days)
${userContext}

YOUR PERSONALITY CALIBRATION FOR THIS USER:
${personaOverlay}
`.trim();

	return [
		BASE_INSTRUCTION,
		userBlock,
		MENTAL_HEALTH_DIRECTIVE,
		FORMATTING_RULES,
		SECOND_BRAIN_DIRECTIVE,
		dynamicContext,
	].join('\n\n');
}

/**
 * Update user profile with new information from observation.
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
