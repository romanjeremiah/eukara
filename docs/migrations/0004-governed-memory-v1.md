# Migration 0004: Governed Memory v1

Date: 2026-07-31
SQL: `migrations/0004_governed_memory_v1.sql`

## Purpose

Add an evidence-backed assertion lifecycle without changing or deleting the
legacy `memories` table.

## Changes

- Adds assertion, evidence, projection outbox, projection registry and
  consolidation proposal tables.
- Imports each legacy memory once as `legacy_unverified` using the deterministic
  ID `legacy:<memory_id>`.
- Adds indexes for user/status recall, evidence lookup, outbox reconciliation
  and pending proposal review.

## Safety properties

- The migration is additive and the legacy import is idempotent through
  `INSERT OR IGNORE` plus `UNIQUE(user_id, legacy_memory_id)`.
- Imported rows do not become confirmed and are not projected automatically.
- No legacy memory, mood, episode, graph or vector row is deleted.
- A D1 recovery bookmark must be recorded before remote application.

## Verification queries

Use aggregate results only:

```sql
SELECT status, source_kind, COUNT(*) AS count
FROM memory_assertions
GROUP BY status, source_kind;

PRAGMA foreign_key_check;
```

Expected initial state: every imported row has status `legacy_unverified` and
source kind `legacy_memory`; the foreign-key check returns no rows.
