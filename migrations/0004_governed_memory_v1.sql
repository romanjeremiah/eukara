-- ============================================================
-- 0004_governed_memory_v1
--
-- Additive governed-memory substrate. Legacy memories remain available for
-- rollback, but are imported as legacy_unverified and are not eligible for
-- governed recall or projection until the user confirms them.
-- ============================================================

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

INSERT OR IGNORE INTO memory_assertions (
    id,
    user_id,
    category,
    statement,
    status,
    confidence,
    sensitivity,
    source_kind,
    legacy_memory_id,
    valid_from,
    created_at,
    updated_at
)
SELECT
    'legacy:' || id,
    user_id,
    category,
    fact,
    'legacy_unverified',
    0.25,
    CASE
        WHEN category IN (
            'health', 'relationship', 'personality_trait', 'implicit_mood',
            'episode_topic', 'pattern', 'trigger', 'avoidance', 'schema',
            'coping', 'insight', 'homework'
        ) THEN 'sensitive'
        ELSE 'standard'
    END,
    'legacy_memory',
    id,
    COALESCE(created_at, CURRENT_TIMESTAMP),
    COALESCE(created_at, CURRENT_TIMESTAMP),
    CURRENT_TIMESTAMP
FROM memories;
