-- ============================================================
-- 0003_media_assets
--
-- Adds the authoritative ownership and lifecycle record for Telegram media.
-- R2 holds accepted bytes; this D1 table records who owns them and whether
-- provider processing is accepted, processing, ready or failed.
-- ============================================================

CREATE TABLE IF NOT EXISTS media_assets (
    object_key TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    chat_id INTEGER NOT NULL,
    thread_id TEXT NOT NULL,
    message_id INTEGER NOT NULL,
    telegram_file_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    state TEXT NOT NULL CHECK (state IN ('accepted', 'processing', 'ready', 'failed')),
    detail TEXT,
    accepted_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_media_assets_user_state
    ON media_assets(user_id, state, updated_at);

CREATE INDEX IF NOT EXISTS idx_media_assets_message
    ON media_assets(chat_id, message_id);
