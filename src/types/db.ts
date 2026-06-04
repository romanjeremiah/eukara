// ============================================================
// D1 Database Row Types
//
// All personal data keyed by user_id (Telegram from.id).
// chat_id only used for delivery targets (reminders, summaries).
// ============================================================

export interface UserProfileRow {
	user_id: number;
	first_name: string | null;
	username: string | null;
	language_code: string;
	timezone: string;
	communication_preference: string;
	known_hobbies: string | null;
	core_traits: string | null;
	/**
	 * Structured document of communication preferences, interests,
	 * and subjective opinions. Loaded by services/persona.ts on every
	 * system-prompt build. Populated by the daily 04:00 consolidation
	 * cron (Phase 4). NULL for new users or until consolidation runs.
	 */
	style_card: string | null;
	first_seen_at: string;
	updated_at: string;
}

export interface PersonaConfigRow {
	user_id: number;
	tone: string;
	formality: string;
	humour_level: string;
	emoji_style: string;
	therapeutic_approach: string;
	topics_of_interest: string | null;
	communication_notes: string | null;
	evolved_traits: string | null;
	updated_at: string;
}

export interface MemoryRow {
	id: number;
	user_id: number;
	category: string;
	fact: string;
	importance_score: number;
	created_at: string;
	/**
	 * Supersession flag (2026-06-03). NULL means the memory is current
	 * and surfaces in default retrieval. A timestamp means the user has
	 * reported a change that contradicts this fact and the model called
	 * supersede_memory; the row is retained in the database but excluded
	 * from default retrieval.
	 */
	superseded_at: string | null;
}

export interface ReminderRow {
	id: number;
	user_id: number;
	chat_id: number;
	text: string;
	due_at: number;
	original_message_id: number | null;
	recurrence_type: string;
	thread_id: string;
	status: string;
	/**
	 * JSON blob for fields that don't justify their own column:
	 * richer recurrence config, snooze history, origin context
	 * (source memory id, source conversation turn), AI-suggested
	 * vs user-initiated flag. Phase 2 (2026-06-02).
	 */
	metadata: string | null;
	created_at: string;
	updated_at: string;
}

export interface EpisodeRow {
	id: number;
	user_id: number;
	episode_type: string;
	trigger_context: string | null;
	emotions: string | null;
	intervention: string | null;
	outcome: string | null;
	lesson: string | null;
	mood_score: number | null;
	related_memory_ids: string | null;
	metadata: string | null;
	created_at: string;
}

export interface KnowledgeGraphRow {
	id: number;
	user_id: number;
	subject: string;
	predicate: string;
	object: string;
	context: string | null;
	confidence: number;
	source: string | null;
	created_at: string;
}

export interface MoodJournalRow {
	id: number;
	user_id: number;
	date: string;
	entry_type: string;
	mood_score: number | null;
	emotions: string | null;
	sleep_hours: number | null;
	sleep_quality: string | null;
	medication_taken: number;
	medication_time: string | null;
	medication_notes: string | null;
	activities: string | null;
	note: string | null;
	ai_observation: string | null;
	photo_r2_key: string | null;
	clinical_tags: string | null;
	/**
	 * Distinguishes how a row was created so the scheduled evening cron
	 * can tell a real check-in from a casual mid-day mood mention.
	 * Precedence: 'cron_poll' > 'manual_command' > 'inline_chat'.
	 * Once a row is tagged as a real check-in (cron_poll or manual_command),
	 * later AI-driven updates must not downgrade it.
	 * NULL = pre-migration row; treat as 'inline_chat' for safety.
	 */
	source: string | null;
	created_at: string;
	updated_at: string;
}

export interface Episode extends Omit<EpisodeRow, 'emotions' | 'related_memory_ids' | 'metadata'> {
	emotions: string[];
	related_memory_ids: number[];
	metadata: Record<string, unknown>;
}

/**
 * Phase 2 (2026-06-02). Forensics row for every classifier / curator
 * decision. Written by services/curatorLog.ts. Lets us trace why
 * routing went one way after the fact (e.g. why did sticky-Pro
 * classify this turn as same-topic?).
 */
export interface CuratorLogRow {
	id: number;
	user_id: number;
	ts: string;
	/**
	 * Identifier for which classifier or curator made the decision.
	 * Examples: 'topic_shift', 'memory_dedup', 'mood_register',
	 * 'tool_selection'. Used as a grep handle in dashboards.
	 */
	classifier: string;
	/**
	 * The relevant user input truncated to 200 chars by the writer
	 * to avoid leaking long conversations into a debug table.
	 * NULL when the classifier doesn't take user input (e.g. a
	 * scheduled background decision).
	 */
	input_truncated: string | null;
	/**
	 * What the classifier decided. Free-form string, conventionally
	 * a JSON object stringified or a single label.
	 */
	decision: string | null;
	latency_ms: number | null;
	/** 1 = success, 0 = error. Defaults to 1 on insert. */
	success: number;
	error_msg: string | null;
}
