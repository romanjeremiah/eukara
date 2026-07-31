// ============================================================
// Eukara persona service
// ============================================================
// Eukara has one immutable identity. The curator chooses a temporary
// conversational register for each turn; validated user settings only
// calibrate delivery and cannot replace safety or authorisation rules.
// ============================================================

import type { PersonaConfigRow } from '../types/db';
import type { CuratorConstraint, CuratorResult } from '../ai/curator';
import {
	BASE_INSTRUCTION,
	MENTAL_HEALTH_DIRECTIVE,
	FORMATTING_RULES,
} from '../config/personas';
import { getProfile } from './user';
import { parseStyleCard, validateStyleCard, type StyleCard } from './style-card';

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
 * Read the user's legacy scalar delivery controls. Proactivity remains a
 * runtime setting used by cron and is never emitted into the model prompt.
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
 * Escape untrusted values before placing them inside prompt XML blocks.
 */
function escapePromptXml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

/** Return a known scalar setting or a safe fallback. */
function allowedValue(value: string, allowed: readonly string[], fallback: string): string {
	return allowed.includes(value) ? value : fallback;
}

/**
 * Use a validated structured style card when present. Otherwise translate the
 * existing scalar controls so an upgrade does not unexpectedly change delivery.
 */
function resolveStyleCard(raw: string | null | undefined, config: PersonaConfigRow): StyleCard {
	if (raw) return parseStyleCard(raw);

	const humourMap: Record<string, StyleCard['humour']> = {
		low: 'dry',
		moderate: 'moderate',
		high: 'high',
		none: 'none',
		dry: 'dry',
	};
	const densityMap: Record<string, StyleCard['formatting_density']> = {
		terse: 'sparse',
		standard: 'balanced',
		detailed: 'rich',
	};

	return validateStyleCard({
		tone: config.tone,
		humour: humourMap[config.humour_level],
		emoji_pattern: config.emoji_style,
		formatting_density: densityMap[config.verbosity],
		register_override: null,
	});
}

/** Build the immutable, validated per-user delivery block. */
export function buildDeliveryContext(
	style: StyleCard,
	config: PersonaConfigRow,
): string {
	const formality = allowedValue(config.formality, ['casual', 'neutral', 'formal'], 'casual');
	const therapeuticApproach = allowedValue(
		config.therapeutic_approach,
		['supportive', 'gentle', 'challenging', 'neutral'],
		'supportive',
	);
	const registerPreference = style.register_override ?? 'none';

	return `<style_card>
Tone: ${style.tone}
Humour: ${style.humour}
Emoji pattern: ${style.emoji_pattern}
Formatting density: ${style.formatting_density}
Preferred register: ${registerPreference}
Formality: ${formality}
Reflective delivery: ${therapeuticApproach}
These settings calibrate delivery only. The curator's current mode wins whenever they conflict.
</style_card>`;
}

/** Build a narrow current-turn mode selected by the curator. */
export function buildCurrentMode(register: CuratorResult['register']): string {
	const guidance: Record<CuratorResult['register'], string> = {
		casual: 'Use ordinary, light and concise conversation. Do not introduce therapeutic framing.',
		warm: 'Be emotionally present and plain-spoken. Match the user\'s weight without forcing depth.',
		technical: 'Be direct, evidence-led and structurally precise. State trade-offs and assumptions.',
		urgent: 'Use the safety register. Stay calm, direct and focused on connection to human support.',
	};
	return `<current_mode register="${register}">${guidance[register]}</current_mode>`;
}

/** Build current-message constraints after curator schema validation. */
export function buildActiveConstraints(constraints: CuratorConstraint[]): string {
	if (!constraints.length) return '<active_user_constraints>None.</active_user_constraints>';
	const lines = constraints.map(constraint =>
		`<constraint category="${constraint.category}">${escapePromptXml(constraint.text)}</constraint>`,
	);
	return `<active_user_constraints>\n${lines.join('\n')}\n</active_user_constraints>`;
}

/**
 * Build the full system instruction for one user and one curated turn.
 * Historical free-text traits remain stored but are deliberately excluded:
 * only governed memory context may introduce durable personal claims.
 */
export async function buildSystemInstruction(
	env: Env,
	userId: number,
	dynamicContext: string,
	curator?: Pick<CuratorResult, 'register' | 'activeConstraints'>,
): Promise<string> {
	const [profile, personaConfig] = await Promise.all([
		getProfile(env, userId),
		getPersonaConfig(env, userId),
	]);

	const userName = profile?.first_name ?? 'there';
	const daysKnown = profile?.first_seen_at
		? Math.floor((Date.now() - new Date(profile.first_seen_at + 'Z').getTime()) / 86400000)
		: 0;

	const register = curator?.register ?? 'casual';
	const constraints = curator?.activeConstraints ?? [];
	const style = resolveStyleCard(profile?.style_card, personaConfig);
	const userBlock = `<user_context>
Name: ${escapePromptXml(userName)}
Known for: ${daysKnown} days
Durable personal claims are supplied only through governed memory context.
</user_context>`;
	const includeMentalHealth = register === 'warm' || register === 'urgent';

	return [
		BASE_INSTRUCTION,
		userBlock,
		buildDeliveryContext(style, personaConfig),
		buildCurrentMode(register),
		buildActiveConstraints(constraints),
		includeMentalHealth ? MENTAL_HEALTH_DIRECTIVE : '',
		FORMATTING_RULES,
		`<turn_context>\n${escapePromptXml(dynamicContext)}\n</turn_context>`,
	].filter(Boolean).join('\n\n');
}
