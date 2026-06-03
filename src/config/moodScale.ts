// ============================================================
// Mood Poll Options
//
// Canonical mood poll options used by the scheduled evening check-in
// (router/queue.ts `mood_poll` task) and the manual /mood command
// (bot/commands.ts). Pattern lifted from Xaridotis
// (gemini-bot/src/config/moodScale.js) where both paths import from
// here to prevent drift. Pre-2026-06-03 Eukara had shortened
// inline options in queue.ts that diverged from the clinical bipolar
// scale described in MENTAL_HEALTH_DIRECTIVE section 2.
//
// Each option is keyed 0..10 and matches Telegram's poll option_id
// (the index in the array IS the score). Order is critical.
//
// Telegram Bot API limits poll option text to 100 characters; longest
// entry here is ~60 chars, well within the limit.
// ============================================================

export const MOOD_POLL_OPTIONS = [
	'0: Crisis. Suicidal thoughts, no movement, total despair.',
	'1: Severe. Hopeless, guilt, feels impossible to function.',
	'2: Low. Persistent sadness, withdrawn, little motivation.',
	'3: Struggling. Anxious, irritable, getting through the day.',
	'4: Below average. Flat mood, low energy but managing.',
	'5: Neutral. Neither good nor bad, steady baseline.',
	'6: Good. Positive outlook, engaged, making good choices.',
	'7: Very good. Productive, social, optimistic and sharp.',
	'8: Elevated. High energy, racing thoughts, reduced sleep.',
	'9: Hypomanic. Impulsive, grandiose, poor judgement.',
	'10: Manic. Reckless, detached from reality, dangerous.',
] as const;

export const MOOD_POLL_QUESTION = 'How are you feeling right now? (0-10 bipolar scale)';
