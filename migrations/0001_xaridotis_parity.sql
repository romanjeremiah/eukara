-- ============================================================
-- 0001_xaridotis_parity
--
-- Brings Eukara's D1 schema up to parity with Xaridotis on four
-- items identified in the 2026-05-16 audit:
--
--   1. user_profiles.style_card     — per-user style card text
--   2. mood_journal.source          — where a row was generated
--                                     (poll, ai_inference, manual, etc.)
--   3. training_pairs (table)       — LoRA fine-tuning dataset captured
--                                     from positive/negative reactions
--   4. updated_at hygiene triggers  — SQLite does not auto-bump DATETIME
--                                     columns on UPDATE; these triggers fix
--                                     that for user_profiles, persona_config,
--                                     reminders, mood_journal
--
-- Idempotency: ALTER TABLE ADD COLUMN is NOT idempotent in SQLite (no
-- IF NOT EXISTS clause), but D1's migration system tracks applied
-- migrations in d1_migrations so this file runs exactly once on each
-- environment. CREATE TABLE/INDEX/TRIGGER use IF NOT EXISTS / DROP+CREATE
-- as a defensive belt-and-braces.
-- ============================================================

-- 1. style_card on user_profiles
ALTER TABLE user_profiles ADD COLUMN style_card TEXT;

-- 2. source on mood_journal
ALTER TABLE mood_journal ADD COLUMN source TEXT;

-- 3. training_pairs table (LoRA fine-tuning dataset from positive reactions)
CREATE TABLE IF NOT EXISTS training_pairs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    user_message TEXT NOT NULL,
    bot_response TEXT NOT NULL,
    persona TEXT,
    signal TEXT NOT NULL,
    message_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_training_pairs_user_signal
    ON training_pairs(user_id, signal);
CREATE INDEX IF NOT EXISTS idx_training_pairs_signal_persona
    ON training_pairs(signal, persona);

-- 4. updated_at hygiene triggers
-- SQLite does not auto-bump DATETIME columns on UPDATE; the
-- DEFAULT CURRENT_TIMESTAMP only applies on INSERT. These triggers fix that.
-- The `WHEN OLD.updated_at IS NEW.updated_at` guard makes them idempotent:
-- if application code already set updated_at explicitly, the trigger skips.

DROP TRIGGER IF EXISTS trg_user_profiles_updated_at;
CREATE TRIGGER trg_user_profiles_updated_at
    AFTER UPDATE ON user_profiles
    FOR EACH ROW
    WHEN OLD.updated_at IS NEW.updated_at
BEGIN
    UPDATE user_profiles
       SET updated_at = CURRENT_TIMESTAMP
     WHERE user_id = NEW.user_id;
END;

DROP TRIGGER IF EXISTS trg_persona_config_updated_at;
CREATE TRIGGER trg_persona_config_updated_at
    AFTER UPDATE ON persona_config
    FOR EACH ROW
    WHEN OLD.updated_at IS NEW.updated_at
BEGIN
    UPDATE persona_config
       SET updated_at = CURRENT_TIMESTAMP
     WHERE user_id = NEW.user_id;
END;

DROP TRIGGER IF EXISTS trg_reminders_updated_at;
CREATE TRIGGER trg_reminders_updated_at
    AFTER UPDATE ON reminders
    FOR EACH ROW
    WHEN OLD.updated_at IS NEW.updated_at
BEGIN
    UPDATE reminders
       SET updated_at = CURRENT_TIMESTAMP
     WHERE id = NEW.id;
END;

DROP TRIGGER IF EXISTS trg_mood_journal_updated_at;
CREATE TRIGGER trg_mood_journal_updated_at
    AFTER UPDATE ON mood_journal
    FOR EACH ROW
    WHEN OLD.updated_at IS NEW.updated_at
BEGIN
    UPDATE mood_journal
       SET updated_at = CURRENT_TIMESTAMP
     WHERE id = NEW.id;
END;
