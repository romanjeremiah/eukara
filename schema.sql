-- ==========================================
-- EUKARA DATABASE SCHEMA
-- All personal data keyed by user_id (Telegram from.id)
-- chat_id used only for delivery targets
-- ==========================================

-- 1. USER PROFILES (per-user identity + persona evolution)
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id INTEGER PRIMARY KEY,
    first_name TEXT,
    username TEXT,
    language_code TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'Europe/London',
    communication_preference TEXT DEFAULT 'friendly',
    known_hobbies TEXT,
    core_traits TEXT,
    -- Structured communication preferences document; populated by
    -- the daily 04:00 consolidation cron. NULL until then.
    style_card TEXT,
    first_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. PERSONA CONFIG (per-user personality evolution)
-- Five slider columns capture the conversational mode (tone /
-- formality / humour / emoji / therapeutic). Two additional sliders
-- shape delivery (verbosity) and proactive cadence (proactivity_level).
-- Modes are defined in src/config/persona-presets.ts and assigned
-- via the /persona command. Free-text columns at the end hold
-- the per-user style card and evolved traits.
CREATE TABLE IF NOT EXISTS persona_config (
    user_id INTEGER PRIMARY KEY,
    tone TEXT DEFAULT 'warm',
    formality TEXT DEFAULT 'casual',
    humour_level TEXT DEFAULT 'moderate',
    emoji_style TEXT DEFAULT 'moderate',
    therapeutic_approach TEXT DEFAULT 'supportive',
    verbosity TEXT DEFAULT 'standard',
    proactivity_level TEXT DEFAULT 'normal',
    topics_of_interest TEXT,
    communication_notes TEXT,
    evolved_traits TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES user_profiles(user_id)
);

-- 3. MEMORIES (long-term facts, keyed by user_id)
CREATE TABLE IF NOT EXISTS memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    fact TEXT NOT NULL,
    importance_score INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- Supersession flag (2026-06-03). When the user reports a change
    -- that contradicts an existing fact, the model calls
    -- supersede_memory which sets this to CURRENT_TIMESTAMP. Default
    -- retrieval filters out superseded rows; data is retained for
    -- audit / future include_superseded queries.
    superseded_at DATETIME,
    FOREIGN KEY(user_id) REFERENCES user_profiles(user_id)
);

CREATE INDEX IF NOT EXISTS idx_memories_user ON memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_user_category ON memories(user_id, category);
CREATE INDEX IF NOT EXISTS idx_memories_superseded ON memories(user_id, superseded_at);

-- 4. REMINDERS (user_id = owner, chat_id = where to deliver)
CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    chat_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    due_at INTEGER NOT NULL,
    original_message_id INTEGER,
    recurrence_type TEXT DEFAULT 'none',
    thread_id TEXT DEFAULT 'default',
    status TEXT DEFAULT 'pending',
    -- JSON blob for fields that don't deserve their own column:
    -- richer recurrence config (custom cron, last-day-of-month),
    -- snooze history, origin context (source memory id, source
    -- conversation turn), AI-suggested vs user-initiated flag.
    -- Phase 2 (2026-06-02).
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reminders_due ON reminders(due_at, status);
CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id);

-- 5. CONVERSATION SUMMARIES
CREATE TABLE IF NOT EXISTS chat_summaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    chat_id INTEGER NOT NULL,
    summary_text TEXT NOT NULL,
    date_range TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES user_profiles(user_id)
);

-- 6. EPISODES (CoALA episodic memory)
CREATE TABLE IF NOT EXISTS episodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    episode_type TEXT NOT NULL,
    trigger_context TEXT,
    emotions TEXT,
    intervention TEXT,
    outcome TEXT,
    lesson TEXT,
    mood_score INTEGER,
    related_memory_ids TEXT,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_episodes_user ON episodes(user_id);
CREATE INDEX IF NOT EXISTS idx_episodes_type ON episodes(user_id, episode_type);
CREATE INDEX IF NOT EXISTS idx_episodes_date ON episodes(user_id, created_at);

-- 7. KNOWLEDGE GRAPH (GraphRAG triples)
CREATE TABLE IF NOT EXISTS knowledge_graph (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    predicate TEXT NOT NULL,
    object TEXT NOT NULL,
    context TEXT,
    confidence REAL DEFAULT 1.0,
    source TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kg_subject ON knowledge_graph(user_id, subject);
CREATE INDEX IF NOT EXISTS idx_kg_object ON knowledge_graph(user_id, object);

-- 8. MOOD JOURNAL
CREATE TABLE IF NOT EXISTS mood_journal (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    entry_type TEXT NOT NULL DEFAULT 'evening',
    mood_score INTEGER,
    emotions TEXT,
    sleep_hours REAL,
    sleep_quality TEXT,
    medication_taken INTEGER DEFAULT 0,
    medication_time TEXT,
    medication_notes TEXT,
    activities TEXT,
    note TEXT,
    ai_observation TEXT,
    photo_r2_key TEXT,
    clinical_tags TEXT,
    -- 'cron_poll' | 'manual_command' | 'inline_chat'.
    -- Precedence: cron_poll > manual_command > inline_chat. AI-driven
    -- updates must not downgrade real check-ins.
    source TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mood_user_date ON mood_journal(user_id, date);

-- 9. CURATOR LOG (forensics for classifier / curator decisions)
-- Phase 2 (2026-06-02). Logs every classifier or curator call so we can
-- trace why routing went a particular way after the fact. input_truncated
-- is capped at 200 chars by the writer (services/curatorLog.ts) to avoid
-- leaking long conversations into a debug table.
CREATE TABLE IF NOT EXISTS curator_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    ts DATETIME DEFAULT CURRENT_TIMESTAMP,
    classifier TEXT NOT NULL,
    input_truncated TEXT,
    decision TEXT,
    latency_ms INTEGER,
    success INTEGER DEFAULT 1,
    error_msg TEXT
);

CREATE INDEX IF NOT EXISTS idx_curator_user_ts ON curator_log(user_id, ts);
CREATE INDEX IF NOT EXISTS idx_curator_classifier ON curator_log(classifier, ts);

-- 10. GOVERNED MEMORY V1
-- Canonical lifecycle/evidence store. See migrations/0004_governed_memory_v1.sql.
CREATE TABLE IF NOT EXISTS memory_assertions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    statement TEXT NOT NULL,
    status TEXT NOT NULL CHECK (
        status IN ('candidate', 'confirmed', 'rejected', 'superseded', 'expired', 'legacy_unverified')
    ),
    confidence REAL NOT NULL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
    sensitivity TEXT NOT NULL DEFAULT 'standard' CHECK (sensitivity IN ('standard', 'sensitive')),
    version INTEGER NOT NULL DEFAULT 1,
    valid_from DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid_until DATETIME,
    source_kind TEXT NOT NULL,
    legacy_memory_id INTEGER,
    superseded_by TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES user_profiles(user_id),
    FOREIGN KEY(superseded_by) REFERENCES memory_assertions(id),
    UNIQUE(user_id, legacy_memory_id)
);
CREATE INDEX IF NOT EXISTS idx_memory_assertions_user_status
    ON memory_assertions(user_id, status, updated_at);
CREATE INDEX IF NOT EXISTS idx_memory_assertions_recall
    ON memory_assertions(user_id, status, valid_until, updated_at);

CREATE TABLE IF NOT EXISTS memory_evidence (
    id TEXT PRIMARY KEY,
    assertion_id TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    source_type TEXT NOT NULL,
    source_id TEXT,
    excerpt TEXT NOT NULL,
    excerpt_sha256 TEXT NOT NULL,
    observed_at DATETIME NOT NULL,
    extraction_confidence REAL NOT NULL DEFAULT 1.0 CHECK (
        extraction_confidence >= 0 AND extraction_confidence <= 1
    ),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(assertion_id) REFERENCES memory_assertions(id),
    FOREIGN KEY(user_id) REFERENCES user_profiles(user_id)
);
CREATE INDEX IF NOT EXISTS idx_memory_evidence_assertion
    ON memory_evidence(assertion_id, created_at);
CREATE INDEX IF NOT EXISTS idx_memory_evidence_user
    ON memory_evidence(user_id, created_at);

CREATE TABLE IF NOT EXISTS memory_outbox (
    id TEXT PRIMARY KEY,
    assertion_id TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    assertion_version INTEGER NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('upsert', 'delete')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'processing', 'completed', 'failed')
    ),
    attempt_count INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(assertion_id) REFERENCES memory_assertions(id),
    FOREIGN KEY(user_id) REFERENCES user_profiles(user_id),
    UNIQUE(assertion_id, assertion_version, action)
);
CREATE INDEX IF NOT EXISTS idx_memory_outbox_status
    ON memory_outbox(status, updated_at);

CREATE TABLE IF NOT EXISTS memory_projection_registry (
    assertion_id TEXT NOT NULL,
    projection_name TEXT NOT NULL,
    vector_id TEXT NOT NULL,
    assertion_version INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'tombstoned', 'failed')),
    last_error TEXT,
    projected_at DATETIME,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(assertion_id, projection_name),
    FOREIGN KEY(assertion_id) REFERENCES memory_assertions(id)
);

CREATE TABLE IF NOT EXISTS memory_consolidation_proposals (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    source_memory_ids TEXT NOT NULL,
    proposals_json TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'accepted', 'rejected')
    ),
    model TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME,
    FOREIGN KEY(user_id) REFERENCES user_profiles(user_id)
);
CREATE INDEX IF NOT EXISTS idx_memory_consolidation_proposals_user_status
    ON memory_consolidation_proposals(user_id, status, created_at);
