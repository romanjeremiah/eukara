// ============================================================
// D1 Database Row Types
//
// These map directly to the schema.sql tables.
// Every D1 query result should be typed with these.
// ============================================================

export interface UserProfileRow {
	chat_id: number;
	first_name: string | null;
	communication_preference: string;
	known_hobbies: string | null;
	core_traits: string | null;
	updated_at: string;
}

export interface MemoryRow {
	id: number;
	chat_id: number;
	category: string;
	fact: string;
	importance_score: number;
	created_at: string;
}

export interface ReminderRow {
	id: number;
	creator_chat_id: number;
	recipient_chat_id: number;
	text: string;
	due_at: number;
	original_message_id: number | null;
	recurrence_type: string;
	thread_id: string;
	status: string;
	created_at: string;
	updated_at: string;
}

export interface ChatSummaryRow {
	id: number;
	chat_id: number;
	summary_text: string;
	date_range: string;
	created_at: string;
}

export interface EpisodeRow {
	id: number;
	chat_id: number;
	episode_type: string; // 'crisis' | 'breakthrough' | 'pattern' | 'checkin' | 'conversation'
	trigger_context: string | null;
	emotions: string | null; // JSON array
	intervention: string | null;
	outcome: string | null; // 'positive' | 'negative' | 'neutral' | 'pending'
	lesson: string | null;
	mood_score: number | null;
	related_memory_ids: string | null; // JSON array
	metadata: string | null; // JSON
	created_at: string;
}

export interface KnowledgeGraphRow {
	id: number;
	chat_id: number;
	subject: string;
	predicate: string;
	object: string;
	context: string | null;
	confidence: number;
	source: string | null; // 'observation' | 'conversation' | 'consolidation'
	created_at: string;
}

// Parsed episode with typed JSON fields
export interface Episode extends Omit<EpisodeRow, 'emotions' | 'related_memory_ids' | 'metadata'> {
	emotions: string[];
	related_memory_ids: number[];
	metadata: Record<string, unknown>;
}
