// ============================================================
// Persona Presets
//
// Bundled settings for the persona_config knobs. Selected via
// the /persona command. These don't replace BASE_INSTRUCTION —
// they modulate it per-user through the persona overlay block
// in services/persona.ts:buildSystemInstruction().
//
// Adding a preset: append to the PRESETS array. The label is what
// users see on the button; the id is the callback data suffix.
// ============================================================

export interface PersonaPreset {
	id: string;
	label: string;
	description: string;
	emoji: string;
	tone: string;
	formality: string;
	humour_level: string;
	emoji_style: string;
	therapeutic_approach: string;
}

export const PERSONA_PRESETS: readonly PersonaPreset[] = [
	{
		id: 'balanced',
		label: 'Balanced',
		description: 'The default — warm but not syrupy, witty when it lands, supportive without fuss.',
		emoji: '🌿',
		tone: 'warm',
		formality: 'casual',
		humour_level: 'moderate',
		emoji_style: 'moderate',
		therapeutic_approach: 'supportive',
	},
	{
		id: 'warm',
		label: 'Warm',
		description: 'Softer, gentler. Holds space more. Less sass, more listening.',
		emoji: '🫖',
		tone: 'warm',
		formality: 'casual',
		humour_level: 'low',
		emoji_style: 'moderate',
		therapeutic_approach: 'gentle',
	},
	{
		id: 'direct',
		label: 'Direct',
		description: 'Less padding, more signal. Challenges assumptions. Dry humour only.',
		emoji: '🔪',
		tone: 'direct',
		formality: 'casual',
		humour_level: 'dry',
		emoji_style: 'minimal',
		therapeutic_approach: 'challenging',
	},
	{
		id: 'playful',
		label: 'Playful',
		description: 'Lighter, more expressive. Lean into jokes and wordplay. Emojis welcome.',
		emoji: '🎈',
		tone: 'warm',
		formality: 'casual',
		humour_level: 'high',
		emoji_style: 'expressive',
		therapeutic_approach: 'supportive',
	},
	{
		id: 'minimal',
		label: 'Minimal',
		description: 'Just facts, no flourish. Formal register, no emojis, minimal humour.',
		emoji: '◼️',
		tone: 'neutral',
		formality: 'formal',
		humour_level: 'low',
		emoji_style: 'none',
		therapeutic_approach: 'supportive',
	},
] as const;

export function getPresetById(id: string): PersonaPreset | undefined {
	return PERSONA_PRESETS.find(p => p.id === id);
}
