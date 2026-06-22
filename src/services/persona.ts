// ============================================================
// Personas Service
//
// Owns everything to do with the persona_config table plus the
// composition of Eukara's system prompt for a given user.
//
// Phase 2 (2026-06-03). Renamed from personas.ts to match the
// rest of the Eukara service-file naming convention (singular
// domain noun: memory.ts, episode.ts, mood.ts, weather.ts).
// Dependency direction: persona.ts imports from user.ts. user.ts
// does not import from here.
//
// Conversational modes (balanced / warm / direct / playful /
// minimal) are templates defined in src/config/persona-presets.ts.
// /persona writes the chosen mode's slider values into persona_config
// via updatePersonaConfig() below. buildSystemInstruction reads
// those slider values back at every turn.
// ============================================================

import type { PersonaConfigRow } from '../types/db';
import {
	BASE_INSTRUCTION,
	MENTAL_HEALTH_DIRECTIVE,
	FORMATTING_RULES,
	SECOND_BRAIN_DIRECTIVE,
	LUNA_PERSONA,
	SOCRATES_PERSONA,
	NOVA_PERSONA,
} from '../config/personas';
import { getProfile } from './user';

const DEFAULT_PERSONA: PersonaConfigRow = {
	user_id: 0,
	tone: 'warm',
	formality: 'casual',
	humour_level: 'moderate',
	emoji_style: 'moderate',
	therapeutic_approach: 'supportive',
	verbosity: 'standard',
	proactivity_level: 'normal',
	topics_of_interest: null,
	communication_notes: null,
	evolved_traits: null,
	updated_at: '',
};

/**
 * Read the user's persona_config row.
 * Falls back to DEFAULT_PERSONA when the row is missing, so callers
 * don't have to null-check every slider. The defaults match the
 * 'balanced' preset.
 */
export async function getPersonaConfig(env: Env, userId: number): Promise<PersonaConfigRow> {
	const config = await env.DB.prepare(
		'SELECT * FROM persona_config WHERE user_id = ?'
	).bind(userId).first<PersonaConfigRow>();
	return config ?? { ...DEFAULT_PERSONA, user_id: userId };
}

/**
 * Patch persona_config fields. Pass any subset of the eight
 * editable columns; updated_at is bumped automatically.
 *
 * Unknown keys are silently dropped via the allow-list. This is
 * intentional: callers (including tools that the model invokes)
 * can pass arbitrary user-suggested keys without risk of writing
 * to columns we did not intend.
 */
export async function updatePersonaConfig(
	env: Env, userId: number, updates: Partial<PersonaConfigRow>
): Promise<void> {
	const allowed = ['tone', 'formality', 'humour_level', 'emoji_style',
		'therapeutic_approach', 'verbosity', 'proactivity_level',
		'topics_of_interest', 'communication_notes', 'evolved_traits'];
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
 * Composition order (important: earlier layers set the frame,
 * later layers refine):
 *   1. BASE_INSTRUCTION             identity, voice, therapeutic frameworks
 *   2. USER CONTEXT + PERSONA OVERLAY  who the user is, how Eukara speaks to them
 *   3. MENTAL_HEALTH_DIRECTIVE      clinical protocol
 *   4. FORMATTING_RULES             typography and HTML rules
 *   5. SECOND_BRAIN_DIRECTIVE       accountability, note-taking, actions
 *   6. DYNAMIC CONTEXT              per-turn memory, time, episodes, etc.
 *
 * The persona overlay block is the per-user calibration: tone /
 * formality / humour / emoji / therapeutic_approach plus any
 * accumulated evolved_traits, communication_notes, and stated
 * topics_of_interest. These come from /persona presets or from
 * the daily evolution cron (Phase 4).
 */
export async function buildSystemInstruction(
	env: Env, userId: number, dynamicContext: string, routeReason?: string
): Promise<string> {
	const [profile, personaConfig, kvPersona] = await Promise.all([
		getProfile(env, userId),
		getPersonaConfig(env, userId),
		env.CHAT_KV.get(`active_persona_${userId}`),
	]);

	const userName = profile?.first_name ?? 'there';
	const daysKnown = profile?.first_seen_at
		? Math.floor((Date.now() - new Date(profile.first_seen_at + 'Z').getTime()) / 86400000)
		: 0;

	// Per-user persona overlay: tone, formality, humour, verbosity,
	// evolved traits. proactivity_level is NOT included — it's a runtime
	// gate for the cron outreach loop, not a tone instruction; surfacing
	// it as text would invite the model to interpret it as a verbal
	// instruction ("act high-proactivity") which isn't what it means.
	const personaOverlay = [
		`Tone: ${personaConfig.tone}`,
		`Formality: ${personaConfig.formality}`,
		`Humour: ${personaConfig.humour_level}`,
		`Emoji usage: ${personaConfig.emoji_style}`,
		`Therapeutic approach: ${personaConfig.therapeutic_approach}`,
		`Verbosity: ${personaConfig.verbosity}`,
		personaConfig.communication_notes ? `Communication notes: ${personaConfig.communication_notes}` : '',
		personaConfig.evolved_traits ? `Evolved personality traits (learned from this user): ${personaConfig.evolved_traits}` : '',
		personaConfig.topics_of_interest ? `User's stated interests: ${personaConfig.topics_of_interest}` : '',
	].filter(Boolean).join('\n');

	// Stable profile facts worth knowing every turn.
	const userContext = [
		profile?.known_hobbies ? `Known hobbies: ${profile.known_hobbies}` : '',
		profile?.core_traits ? `Core traits: ${profile.core_traits}` : '',
		profile?.communication_preference ? `Preferred style: ${profile.communication_preference}` : '',
	].filter(Boolean).join('\n');

	const userBlock = `
<context>
CURRENT USER: ${userName} (known for ${daysKnown} days)
${userContext}

YOUR PERSONALITY CALIBRATION FOR THIS USER:
${personaOverlay}
</context>
`.trim();

	let activePersonaBlock = '';
	let includeMentalHealth = false;

	const activePersona = kvPersona || 'base';

	if (activePersona === 'luna' || (!kvPersona && (routeReason === 'emotional_content' || routeReason === 'active_health_checkin'))) {
		activePersonaBlock = LUNA_PERSONA;
		includeMentalHealth = true;
	} else if (activePersona === 'socrates' || (!kvPersona && routeReason === 'code_content')) {
		activePersonaBlock = SOCRATES_PERSONA;
	} else if (activePersona === 'nova') {
		activePersonaBlock = NOVA_PERSONA;
	}

	return [
		BASE_INSTRUCTION,
		userBlock,
		activePersonaBlock,
		includeMentalHealth ? MENTAL_HEALTH_DIRECTIVE : '',
		FORMATTING_RULES,
		SECOND_BRAIN_DIRECTIVE,
		dynamicContext,
	].filter(Boolean).join('\n\n');
}
