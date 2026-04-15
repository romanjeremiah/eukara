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
	medication_notes: string | null;
	activities: string | null;
	note: string | null;
	ai_observation: string | null;
	clinical_tags: string | null;
	created_at: string;
}

export interface Episode extends Omit<EpisodeRow, 'emotions' | 'related_memory_ids' | 'metadata'> {
	emotions: string[];
	related_memory_ids: number[];
	metadata: Record<string, unknown>;
}
