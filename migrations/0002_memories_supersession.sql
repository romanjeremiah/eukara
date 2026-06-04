-- ============================================================
-- 0002_memories_supersession
--
-- Adds a `superseded_at` column to the memories table so the
-- model can mark old facts as outdated when the user reports a
-- change. Default retrieval filters out superseded rows, but the
-- data is retained for audit / personal recall.
--
-- See decisions/2026-06-03-persona-hardening-and-lens-expansion.md
-- (Option C) for design notes.
--
-- Idempotency: ALTER TABLE ADD COLUMN is NOT idempotent in SQLite,
-- but D1's migration system tracks applied migrations in
-- d1_migrations so this file runs exactly once per environment.
-- ============================================================

ALTER TABLE memories ADD COLUMN superseded_at DATETIME;

-- Index helps the WHERE superseded_at IS NULL filter on retrieval.
-- Note: in SQLite a partial index on a NULL predicate would be
-- tighter (`CREATE INDEX ... WHERE superseded_at IS NULL`) but D1
-- support for partial indexes is consistent so we use the simple
-- full index on the column instead.
CREATE INDEX IF NOT EXISTS idx_memories_superseded ON memories(user_id, superseded_at);
