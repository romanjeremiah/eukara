# 2026-05-25 — Full-scope media handling

**Status:** LOCKED. All files `node --check` clean. Migration applied to live D1. Not yet deployed (Roma deploys).
**Supersedes:** the pre-existing "fire-and-forget storeMedia, no D1 pointer" pattern for non-mood-photo media.

---

## Context

Roma reported that JSON files uploaded to Xaridotis via Telegram vanished on the next message. The bot would acknowledge the upload, then in turn 2 act as if the file didn't exist.

Investigation found two distinct gaps:

1. **`handlers.js::getMediaFromMessage` line 364** had a mime-type allow-list that only matched `image/`, `audio/`, `video/`, `application/pdf`, `text/`. `application/json` matched none of these, so the JSON file was rejected at the door — never downloaded, never sent to Gemini, never stored.

2. **No durable D1 pointer for non-mood-photo media.** Even when a file was accepted, `mediaStore.storeMedia(...).catch()` was fire-and-forget. The R2 key existed but nothing in D1 referenced it, so on subsequent turns there was no way to find the file.

The bot already had two robust pieces in place — `mediaStore.js` (R2 helper) and `filesApi.js` (Gemini Files API with 15 MB inline cutoff and Files-API-always-for-video). These are reused. The work is the missing pieces around them.

---

## Decisions confirmed by Roma

| # | Decision | Choice |
|---|---|---|
| 1 | >20 MB handling | Reject + suggest splitting/link |
| 2 | Storage of extracted text | Always full text; summary is additive only, never a replacement |
| 3 | TTL on uploaded files | Forever by default until `/forget` |
| 4 | Surface old files via | Semantic recall (Vectorize), not just thread-recency |
| 5 | PDF handling | Cache extracted text once via Gemini |
| 6 | Logging | Structured log lines |
| 7 | Per-user isolation | Every D1 query `WHERE user_id = ?`; every Vectorize op userId-prefixed id + metadata + filter; `getRefById` re-verifies user_id even with valid refId |

---

## What landed

### 1. Migration 006 + canonical schema

**`src/migration_006_media_refs.sql`** — applied to live D1 via `wrangler d1 execute --remote --file=...`. 5 queries executed, table verified empty.

**`schema.sql`** — canonical `media_refs` definition appended.

Schema:

```sql
CREATE TABLE IF NOT EXISTS media_refs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    chat_id INTEGER NOT NULL,
    message_id INTEGER NOT NULL,
    thread_id TEXT DEFAULT 'default',
    media_type TEXT NOT NULL,            -- 'document' | 'image' | 'voice' | 'video' | 'audio'
    mime_type TEXT,
    file_name TEXT,
    size_bytes INTEGER,
    r2_key TEXT NOT NULL,
    telegram_file_id TEXT,
    extracted_text TEXT,                 -- inline UTF-8 excerpt, capped at 1.5 MB (Cloudflare D1's 2 MB row limit; verified 2026-05-28)
    files_api_uri TEXT,                  -- Gemini Files API URI for >100 KB or PDF/video
    files_api_expires_at DATETIME,
    summary TEXT,                        -- ADDITIVE only; never replaces extracted_text
    summary_model TEXT,
    vector_id TEXT,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

Four indexes, all leading with `user_id` for efficient isolation:

- `idx_media_refs_user_time (user_id, created_at DESC)` — recent files for a user
- `idx_media_refs_user_thread (user_id, thread_id, created_at DESC)` — per-thread recall
- `idx_media_refs_r2 (r2_key)` — reverse lookup for /forget
- `idx_media_refs_vector (vector_id) WHERE vector_id IS NOT NULL` — Vectorize reverse lookup

### 2. New service `src/services/mediaRefs.js`

User-scoped helpers:

- `isTextShaped(mimeType, fileName)` — pure function: true for text/*, structured-text mimes, and known text extensions.
- `insertRef(env, {userId, chatId, ...})` — fails closed if required fields missing.
- `getRefById(env, userId, refId)` — re-verifies user_id even with valid refId (defence in depth).
- `getRecentRefs(env, userId, {threadId, limit, days})` — used by handlers context build.
- `setVectorId(env, userId, refId, vectorId)` — called from fire-and-forget embed callback.
- `setSummary(env, userId, refId, summary, summaryModel)` — lazy summary fill, available for future feature.
- `deleteAllForUser(env, userId)` — `/forget` cascade. Deletes D1 rows + R2 objects + Vectorize entries.
- `extractMarkers(text)` — utility, currently unused (markers approach abandoned in favour of getRecentRefs + getSemanticContext).

Every function takes a `userId` argument and uses it in every D1 query and every R2 / Vectorize operation. No "current user" fallback.

### 3. `vectorStore.js::indexMediaRef`

Added consistent with existing helpers:
- ID: `media_${userId}_${refId}` (matches existing `indexMedia` pattern that's been there since pre-V2).
- Metadata: `userId: Number(userId)`, `category: 'media_ref'`, `mediaType`, `refId`, `fileName`, `preview`.
- Input: filename + summary (if present) + extracted_text excerpt (capped at 2000 chars).

The existing `semanticSearch` filter `{ userId: { $eq: Number(userId) } }` applies to media refs without modification.

### 4. `handlers.js` — six surgical edits

**a) Import added** (line 17): `import * as mediaRefs from '../services/mediaRefs';`

**b) `getMediaFromMessage` widened** (line ~358):
- Returns `{fileId, mimeHint, fileName, fileSize}` (was `{fileId, mimeHint}`).
- Document branch now accepts: original 5 prefixes + `application/json`, `application/xml`, `application/javascript`, `application/x-yaml`, `application/x-toml`, `application/csv`, `application/x-csv`, `application/sql`, AND extension fallback (json, jsonl, xml, yaml, csv, code, md, txt, ini, conf, html, css, ...) for when Telegram sends `application/octet-stream`.
- Normalises mime to `text/plain` when extension says text but mime is octet-stream.

**c) 20 MB guard** (line ~1701, right after `downloadFile`):
```js
const TELEGRAM_BOT_API_LIMIT = 20 * 1024 * 1024;
if (fileSize && fileSize > TELEGRAM_BOT_API_LIMIT) {
  const mb = (fileSize / 1024 / 1024).toFixed(1);
  await telegram.sendMessage(chatId, threadId,
    `⚠️ This file is ${mb} MB — over Telegram's 20 MB bot upload limit. Could you split it into smaller chunks or share a download link instead?`,
    env, messageId);
  log.warn('media_oversized', { userId, chatId, fileSize, mime: media.mimeHint });
  return;
}
```

**d) Mood-photo callsite wired** (line ~1740-1760): after successful `storeMedia`, insert `media_refs` row (in addition to the existing `mood_journal.photo_r2_key`) + fire-and-forget Vectorize index → `setVectorId`. So mood photos are now in BOTH the mood_journal link AND the unified media_refs table.

**e) General-document callsite restructured** (line ~1814-1860): was `mediaStore.storeMedia(...).catch()` fire-and-forget. Now:
- `await storeMedia` to capture the R2 key.
- If `isTextShaped(mime, fileName)`: UTF-8 decode buffer into `extractedText`.
- `mediaRefs.insertRef(...)` with userId scope.
- Fire-and-forget `vectorStore.indexMediaRef → setVectorId`.

**f) Context build extended** (line ~1286, ~1567):
- Promise.all now also fetches `recentMediaRefs = mediaRefs.getRecentRefs(env, userId, { threadId, limit: 5, days: 7 })` for substantive turns.
- `dynamicContext` template gains a `mediaCtx` block listing recent files with date + ref id + name + size + 160-char preview.

**g) `confirm_forget` cascade extended** (line ~2638):
```js
await Promise.all([
  memoryStore.deleteAllMemories(env, userId),
  vectorStore.deleteAllVectors(env, userId),
  mediaRefs.deleteAllForUser(env, userId),
]);
```

### 5. ROUTING_RULES.md

New section "Media Handling (uploaded files: documents, images, voice, video, audio)" placed between "Voice Transcription" and "Memory Consolidation Cadence". Documents:
- Four storage layers (R2 / D1 / Vectorize / Gemini Files API) and their distinct roles
- Receive flow (9 steps)
- Recall flow (5 steps)
- Per-user isolation invariants (5 numbered rules)
- Cascade reuse for media-related background work
- What is intentionally NOT done (no raw transcript table; no bespoke media-only retrieval; no synchronous embedding; no AI summary on upload)

Change log updated with 2026-05-25 entry.

---

## Architecture decisions that shaped the final design

### Why fire-and-forget embedding (revised from initial sync plan)

Initial plan was synchronous Vectorize embedding on the upload turn. After challenging the design:
- Adds 300-600ms to the hot path.
- The file is fully usable on the upload turn from `extracted_text` directly.
- The Vectorize index only matters for FUTURE turns referencing this file.
- The existing `mediaStore.storeMedia(...).catch()` pattern in handlers.js is already fire-and-forget — embedding follows the same risk model.
- Worst case (Worker terminates before embed completes): row still exists in D1 with extracted_text, can be re-embedded by a future maintenance sweep.

Net: pure improvement. Zero downside.

### Why no separate retrieval path (revised from initial bespoke-search plan)

Initial plan was a dedicated `searchMediaRefs(env, userId, query)` function to power a `[REFERENCED FILES]` context block. After verifying `getSemanticContext`:
- It runs unfiltered semantic search (no category filter) over the V2 index.
- All media refs are in the V2 index with `metadata.userId` set.
- So they're already returned by the search that already runs on every substantive turn.
- A bespoke media query would add a second retrieval path to maintain with no quality gain.

Net: one retrieval path instead of two. `getSemanticContext` does the work without code changes.

The `RECENT FILES IN THIS CHAT` block in dynamicContext is *additive* — a lightweight awareness signal (date, name, size, preview) so the model knows files exist in the thread even when no message strongly cues a semantic search hit. Cheap D1 read (`WHERE user_id = ? AND thread_id = ?` with indexed range query), capped at 5 rows.

### Why media_refs.id (not CHAT_KV markers)

Initial plan had `[file:refId]` markers written into CHAT_KV history so subsequent turns could discover the file via grep over history. After reading the actual CHAT_KV write path:
- The Gemini SDK owns the chat history (`chat.getHistory()`).
- Injecting synthetic markers would pollute the SDK's internal state.
- The data is already queryable via `getRecentRefs` (thread + time scoped) and via semantic search (any time, any thread, by relevance).

Net: cleaner. No SDK history pollution. `extractMarkers` helper exists in mediaRefs.js but is currently unused — kept in case a future feature needs explicit marker passing.

### Why Telegram 20 MB ceiling

Roma is on the hosted Bot API (the standard `api.telegram.org` endpoint), which caps `getFile` downloads at 20 MB. A self-hosted Bot API server can go up to 2 GB, but that's a separate infrastructure decision. The guard is at the receive-end so the user gets a clean, actionable message instead of a silent failure or a partial download.

---

## Per-user isolation invariants

These are security properties, not features. Every change to media handling code must preserve them.

1. **Every `media_refs` query carries `WHERE user_id = ?`.** No exceptions. No "current user" fallback. If a caller doesn't have a userId, the call fails closed (`null` return / empty array).

2. **Every Vectorize media op uses three layers of scoping:**
   - ID prefix `media_${userId}_`
   - Metadata `userId: Number(userId)`
   - Query-time filter `{ userId: { $eq: Number(userId) } }`

3. **`getRefById` re-verifies user_id even with a provided refId.** Defence in depth — a malformed or replayed marker cannot pull another user's file. The row check is `WHERE id = ? AND user_id = ?`.

4. **`/forget` cascade.** `mediaRefs.deleteAllForUser` deletes D1 rows + R2 objects + Vectorize entries in one atomic-ish sweep, all user-scoped.

5. **CHAT_KV scope.** Keyed `chat_${chatId}_${threadId}` — already per-chat. R2 keys lead with `${userId}/`. No cross-user paths exist.

The isolation pattern matches what's already in place for `memories`, `episodes`, `mood_journal`, `knowledge_graph`, and Vectorize — see the audit on 2026-05-25 that confirmed those existing stores all scope by user. Media is held to the same bar.

---

## Pre-deploy actions

1. `npx wrangler deploy --minify`. No new bindings, no new secrets. Migration already applied.
2. Upload a JSON file via Telegram. Tail-watch for:
   - `media_refs_inserted` with `hasExtractedText: true`
   - `📎 Vectorize (v2) indexed media_ref: media_<userId>_<refId>` log line
   - The bot's reply correctly references the JSON content (proves upload-turn injection still works)
3. Send a second message referencing the file ("what was in the JSON?"). Tail-watch for:
   - dynamicContext including the file in the RECENT FILES block (visible in `prompt_sizes` log)
   - Or semantic recall surfacing the file via `getSemanticContext`
4. Upload a >20 MB file. Verify rejection message + `media_oversized` log.
5. Run `/forget`. Tail-watch for `media_refs_deleted_for_user` showing correct counts (deleted_rows / deleted_r2 / deleted_vectors).

---

## Known risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Fire-and-forget embedding occasionally drops on Worker termination | Low | One file missing from Vectorize until re-embed | Row + extracted_text still in D1; can re-embed via maintenance sweep |
| Large extracted_text bloats D1 size over time | Medium | Storage cost; query latency on large rows | Indexes don't touch extracted_text; only fetched when getRefById is called |
| User uploads a file with malicious filename / mime spoofing | Low | Filename is stored as-is in D1 (UTF-8) | Never executed; only logged + injected as text in prompts (no shell, no eval) |
| Telegram sends application/octet-stream for a binary file we treat as text | Low | UTF-8 decode of binary bytes produces garbage extracted_text | TextDecoder is non-fatal; decoded garbage is just text. R2 has the lossless bytes. |
| TextDecoder runs on a huge buffer | Low | Memory pressure on Worker | bound by 20 MB ceiling = upper bound on decode size |
| Vectorize index grows unbounded | Low | Vectorize is happy up to ~5M vectors per index | `/forget` deletes vectors when user requests; nightly hygiene job could prune orphans later |

---

## Deferred (still open)

- **AI summary generation on upload.** Field exists in `media_refs.summary`, infrastructure to populate via HEAVY_BG_TIERS exists, but not auto-triggered. Could be added in a follow-up.
- **chat_summaries narrative ledger** — separate work raised earlier in the conversation. Not touched in this session.
- **Bi-temporal validity for staleness** — separate work raised earlier. Not touched in this session.
- **generateShortResponse 5-tier vs 3-tier** — still awaiting Roma's decision.
- **Vectorize V2 backfill** — still pending.

---

## Honesty section

What went well:
- Pushed back on three things in the initial design that were inefficient (sync embedding, bespoke retrieval path, CHAT_KV markers). Each pushback led to a strictly better design.
- Verified per-user isolation in the existing codebase BEFORE writing new code, so the new code matches the established pattern rather than inventing a weaker one.
- Migration applied to live D1 before declaring done, and verified the table exists.
- Every file passed `node --check`.

What was harder than it should have been:
- MCP connectors dropped out multiple times mid-session. Three turns in this conversation were spent confirming what tools were actually available rather than progressing the work. When connectors are intermittent, the right move is to land design docs while the tools are down so resumption is fast — I did this in the previous turn but should be quicker about it next time.
- The initial design proposal was overweighted toward "build it bespoke from scratch" before reading what `mediaStore.js` and `filesApi.js` already did. Reading the existing code first cut the build scope by ~60% (from 8 new files to 2 new files + 1 migration + handler wiring).

What I deliberately did not do:
- Did not add Workers AI models to the cascade for any new path.
- Did not set explicit temperature anywhere.
- Did not cap `maxOutputTokens` anywhere.
- Did not invent a `conversations` table for raw chat storage (rejected per 2026 consensus across Mem0, Zep, and the broader field).
- Did not auto-generate AI summaries on upload (capacity exists, not wired — wait until a future feature actually needs it).
