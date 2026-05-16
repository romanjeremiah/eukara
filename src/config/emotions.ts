// ============================================================
// Emotions Library
//
// The canonical list of emotions presented to the user in the
// mood check-in flow. Also referenced (by name, not by code)
// in MENTAL_HEALTH_DIRECTIVE in config/personas.ts — if you
// edit these lists, review that directive too.
//
// Three columns wide feels natural in Telegram's button grid.
//
// 2026-06-03: added DISSOCIATIVE_EMOTIONS to support
// borderline / dissociative episodes. These don't fit cleanly
// into "positive" or "negative" — depersonalisation and
// derealisation are altered-perception states, splitting and
// switching are interpersonal/parts dynamics, numbness is an
// absence of affect rather than a negative valence. Surfacing
// them as a third category lets the model partition them
// correctly in the synthesis prompt.
// ============================================================

export const POSITIVE_EMOTIONS = [
	'lively', 'grateful', 'proud',
	'calm', 'relaxed', 'energetic',
	'motivated', 'empathetic', 'inspired',
	'curious', 'satisfied', 'excited',
	'brave', 'confident', 'happy',
	'joyful', 'carefree',
] as const;

export const NEGATIVE_EMOTIONS = [
	'devastated', 'empty', 'frustrated',
	'scared', 'angry', 'depressed',
	'sad', 'anxious', 'annoyed',
	'insecure', 'lonely', 'confused',
	'tired', 'bored', 'nervous',
	'disappointed', 'lost',
] as const;

export const DISSOCIATIVE_EMOTIONS = [
	'dissociated', 'depersonalised', 'derealised',
	'splitting', 'fragmented', 'numb',
	'switching',
] as const;

export type PositiveEmotion = typeof POSITIVE_EMOTIONS[number];
export type NegativeEmotion = typeof NEGATIVE_EMOTIONS[number];
export type DissociativeEmotion = typeof DISSOCIATIVE_EMOTIONS[number];
export type Emotion = PositiveEmotion | NegativeEmotion | DissociativeEmotion;

export type EmotionCategory = 'positive' | 'negative' | 'dissociative';

/**
 * Classify an emotion string as positive, negative, or dissociative.
 * Unknown emotions return 'unknown' — callback data strings are
 * untrusted user input so we never throw here.
 */
export function classifyEmotion(e: string): EmotionCategory | 'unknown' {
	if ((POSITIVE_EMOTIONS as readonly string[]).includes(e)) return 'positive';
	if ((NEGATIVE_EMOTIONS as readonly string[]).includes(e)) return 'negative';
	if ((DISSOCIATIVE_EMOTIONS as readonly string[]).includes(e)) return 'dissociative';
	return 'unknown';
}

/**
 * Fixed cycling order shown on the "Next: <category>" button.
 * Positive → Negative → Dissociative → Positive.
 * Centralised so the keyboard builder and the callback router agree.
 */
export const NEXT_CATEGORY: Record<EmotionCategory, EmotionCategory> = {
	positive: 'negative',
	negative: 'dissociative',
	dissociative: 'positive',
};

/**
 * Human-readable label used inside the "Next: <label> emotions" button.
 * Capitalised for display.
 */
export const CATEGORY_LABEL: Record<EmotionCategory, string> = {
	positive: 'Positive',
	negative: 'Negative',
	dissociative: 'Dissociative',
};

/**
 * Resolve a category name to its emotion list. Strong typing on the
 * argument so callbacks routing on `mood_cat_<category>` can't pass
 * a typo.
 */
export function emotionsByCategory(cat: EmotionCategory): readonly string[] {
	switch (cat) {
		case 'positive': return POSITIVE_EMOTIONS;
		case 'negative': return NEGATIVE_EMOTIONS;
		case 'dissociative': return DISSOCIATIVE_EMOTIONS;
	}
}

/**
 * Build a 3-column inline keyboard for an emotion list, plus
 * up to two trailing navigation rows. If `nextCategory` is provided
 * a "Next: <nextCategory> emotions" row is added; the "Done" row is
 * always added last.
 *
 * Pre-2026-06-03 this took `otherCategoryLabel: string | null` and
 * cycled between positive/negative only. Now takes a typed category
 * so callers don't have to know about three-way ordering — that
 * lives in NEXT_CATEGORY above.
 */
export function emotionButtonRows(
	emotions: readonly string[],
	nextCategory: EmotionCategory | null
): Array<Array<{ text: string; callback_data: string }>> {
	const rows: Array<Array<{ text: string; callback_data: string }>> = [];
	for (let i = 0; i < emotions.length; i += 3) {
		rows.push(
			emotions.slice(i, i + 3).map(e => ({
				text: e,
				callback_data: `mood_emo_${e}`,
			}))
		);
	}
	if (nextCategory) {
		rows.push([{
			text: `➡️ Next: ${CATEGORY_LABEL[nextCategory]} emotions`,
			callback_data: `mood_emo_next_${nextCategory}`,
		}]);
	}
	rows.push([{
		text: '✅ Done selecting',
		callback_data: 'mood_emo_done',
	}]);
	return rows;
}
