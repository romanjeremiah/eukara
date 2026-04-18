// ============================================================
// Emotions Library
//
// The canonical list of emotions presented to the user in the
// mood check-in flow. Also referenced (by name, not by code)
// in MENTAL_HEALTH_DIRECTIVE in config/personas.ts — if you
// edit these lists, review that directive too.
//
// Three columns wide feels natural in Telegram's button grid.
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

export type PositiveEmotion = typeof POSITIVE_EMOTIONS[number];
export type NegativeEmotion = typeof NEGATIVE_EMOTIONS[number];
export type Emotion = PositiveEmotion | NegativeEmotion;

/**
 * Classify an emotion string as positive or negative.
 * Unknown emotions default to neutral — we never throw here
 * because callback data strings are untrusted user input.
 */
export function classifyEmotion(e: string): 'positive' | 'negative' | 'unknown' {
	if ((POSITIVE_EMOTIONS as readonly string[]).includes(e)) return 'positive';
	if ((NEGATIVE_EMOTIONS as readonly string[]).includes(e)) return 'negative';
	return 'unknown';
}

/**
 * Build a 3-column inline keyboard for an emotion list, plus
 * two trailing navigation rows.
 */
export function emotionButtonRows(
	emotions: readonly string[],
	otherCategoryLabel: string | null
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
	if (otherCategoryLabel) {
		rows.push([{
			text: `➡️ Next: ${otherCategoryLabel} emotions`,
			callback_data: `mood_emo_next_${otherCategoryLabel}`,
		}]);
	}
	rows.push([{
		text: '✅ Done selecting',
		callback_data: 'mood_emo_done',
	}]);
	return rows;
}
