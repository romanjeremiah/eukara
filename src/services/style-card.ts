// ============================================================
// Eukara communication style card
// ============================================================
// The card calibrates delivery only. It cannot alter identity, safety,
// authorisation or tool boundaries in the immutable persona core.
// ============================================================

export type StyleTone = 'warm' | 'neutral' | 'direct' | 'witty' | 'deadpan';
export type StyleHumour = 'none' | 'dry' | 'moderate' | 'high';
export type StyleEmoji = 'none' | 'minimal' | 'moderate' | 'expressive';
export type StyleDensity = 'sparse' | 'balanced' | 'rich';
export type StyleRegister = 'casual' | 'warm' | 'technical' | null;

export interface StyleCard {
	tone: StyleTone;
	humour: StyleHumour;
	emoji_pattern: StyleEmoji;
	formatting_density: StyleDensity;
	register_override: StyleRegister;
}

export const BASE_STYLE_CARD: Readonly<StyleCard> = Object.freeze({
	tone: 'warm',
	humour: 'dry',
	emoji_pattern: 'minimal',
	formatting_density: 'sparse',
	register_override: null,
});

const VALID_TONES = new Set<StyleTone>(['warm', 'neutral', 'direct', 'witty', 'deadpan']);
const VALID_HUMOUR = new Set<StyleHumour>(['none', 'dry', 'moderate', 'high']);
const VALID_EMOJI = new Set<StyleEmoji>(['none', 'minimal', 'moderate', 'expressive']);
const VALID_DENSITY = new Set<StyleDensity>(['sparse', 'balanced', 'rich']);
const VALID_REGISTERS = new Set<Exclude<StyleRegister, null>>(['casual', 'warm', 'technical']);

/** Return true when a value is a non-null plain record. */
function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Validate untrusted style-card JSON without allowing arbitrary prompt text.
 * Unknown and invalid fields fall back independently to the fixed base card.
 */
export function validateStyleCard(value: unknown): StyleCard {
	if (!isRecord(value)) return { ...BASE_STYLE_CARD };

	const tone = typeof value.tone === 'string' && VALID_TONES.has(value.tone as StyleTone)
		? value.tone as StyleTone
		: BASE_STYLE_CARD.tone;
	const humour = typeof value.humour === 'string' && VALID_HUMOUR.has(value.humour as StyleHumour)
		? value.humour as StyleHumour
		: BASE_STYLE_CARD.humour;
	const emojiPattern = typeof value.emoji_pattern === 'string'
		&& VALID_EMOJI.has(value.emoji_pattern as StyleEmoji)
		? value.emoji_pattern as StyleEmoji
		: BASE_STYLE_CARD.emoji_pattern;
	const formattingDensity = typeof value.formatting_density === 'string'
		&& VALID_DENSITY.has(value.formatting_density as StyleDensity)
		? value.formatting_density as StyleDensity
		: BASE_STYLE_CARD.formatting_density;
	const registerOverride = typeof value.register_override === 'string'
		&& VALID_REGISTERS.has(value.register_override as Exclude<StyleRegister, null>)
		? value.register_override as Exclude<StyleRegister, null>
		: null;

	return {
		tone,
		humour,
		emoji_pattern: emojiPattern,
		formatting_density: formattingDensity,
		register_override: registerOverride,
	};
}

/** Parse a D1 style-card value, returning safe defaults on malformed JSON. */
export function parseStyleCard(raw: string | null | undefined): StyleCard {
	if (!raw) return { ...BASE_STYLE_CARD };
	try {
		return validateStyleCard(JSON.parse(raw));
	} catch {
		return { ...BASE_STYLE_CARD };
	}
}
