# Gemini File Search Adoption (Option 4)

Date: 2026-05-29 (afternoon)
Author: Claude with Roma
Status: IMPLEMENTED. Not yet deployed.
Supersedes: section 5.5 ("Chunked text file indexing, Stage 2") of `2026-05-29-memory-architecture.md`.

---

## Why this exists

The 2026-05-29 design doc rejected Gemini File Search (option D) on three grounds: data sovereignty, no audio/video support, and fractured retrieval. We adopted Stage 1 (local token truncation) plus a planned Stage 2 (sliding-window chunked text into Vectorize V2).

Stage 1 shipped on the morning of 2026-05-29. Within hours a 3.6 MB JSON upload crashed again with the same `input token count exceeds 1,048,576` error. Root cause: my `shouldUseFilesAPI` rule routed text-like files >1 MB through Gemini's Files API on the assumption that fileData URIs reduced input token cost. They do not. Files API only solves the 20 MB inline-payload limit; the full file is tokenised by the server regardless of transport. Verified against ai.google.dev/gemini-api/docs/tokens and firebase.google.com/docs/ai-logic/count-tokens, both stating that input token count includes "the prompt (text and any input files)".

With Stage 1's premise broken, the three original objections to File Search were re-evaluated:
- **Data sovereignty**: All conversation content already flows through Gemini for inference. Persisting files to a Gemini-managed File Search store is the same data plane, not a new one. The original objection was a hand-wave.
- **No audio/video**: True (confirmed in docs note: "Audio and video formats are not currently supported"). Irrelevant for this problem. Audio still uses transcription pipeline; video still uses inline + Files API. File Search only owns text-like content + PDFs + (PNG/JPEG via multimodal embeddings).
- **Fractured retrieval**: The only real concern. But Stage 2 (custom chunker into Vectorize V2) is also fractured retrieval against the memory store, just inside our infrastructure. File Search trades one fragmentation for another with significantly less code to maintain.

The crash forced reconsideration. Roma's instruction: implement Option 4 (hybrid), no pushbacks.

---

## Architecture decision

**Hybrid retrieval split, clear ownership:**

| Content type | Retrieval store | Notes |
|---|---|---|
| Episodes, mood entries, knowledge triples, memories, chat summaries | Vectorize V2 (`gemini-bot-memory-v2`) | The 2026-05-29 unified recall pipeline. No change. |
| Uploaded files (text, PDF, supported image) | Gemini File Search (`xaridotis-docs` store) | New. Per-user metadata filter. Native chunking. |
| Audio, video, sticker uploads | Inline / Gemini Files API (transport only) | Unchanged. Transcription path still used for voice notes. |

**Single shared File Search store with metadata filter per-user.** Pattern mirrors Vectorize V2 (`gemini-bot-memory-v2` is also one shared index with `userId` metadata). Custom metadata on every document: `userId` (numericValue), `mediaRefId` (numericValue), `mimeType`, `fileName`, `uploadedAt`, `source: "xaridotis"`. The fileSearch tool config carries `metadataFilter: "userId=<n>"` per turn, so retrieval is automatically scoped.

**Embedding model: `gemini-embedding-2`.** Matches Vectorize V2 (1536-dim, multimodal-capable). Means future image RAG comes free without re-indexing.

**Tool-collision routing rule.** Per Gemini docs, fileSearch cannot combine with googleSearch or URL context on the same turn. Function calling IS compatible on Gemini 3.x. The rule:

  - If `recentMediaRefs` (last 5 refs, last 7 days) has any entry with `file_search_doc_name IS NOT NULL`: per-turn `tools = [functionDeclarations, fileSearch]`. googleSearch is disabled for that turn.
  - Otherwise (default): `tools = [functionDeclarations, googleSearch]`.

Trade-off accepted: when a user has indexed files in the last 7 days, googleSearch is unavailable. For Xaridotis usage patterns this is acceptable; most casual chat doesn't need Google Search. If a future user pattern needs both, we add a heuristic ("look up X online" → prefer googleSearch) inside the gating logic.

**Cache compatibility.** The `setupCache` path bakes tools into the cached config. When fileSearchTool is set, the cache shape is wrong, so we skip the cache for that turn. Negligible latency penalty (cache hit-rate is already lowest on file-related turns).

**Upload turn behaviour.** File Search indexing is async (5-30 seconds). We can't query against a freshly-uploaded file on the same turn. Two-phase handling:
  1. Upload turn: inline-truncate text content to 2 MB (~500K tokens), include directly so the model can engage with content immediately. Fire-and-forget File Search upload runs in parallel.
  2. Subsequent turns: `recentMediaRefs` has the new ref with `file_search_doc_name` set; fileSearch tool kicks in; model retrieves only relevant chunks (negligible token cost).

---

## Implementation summary

### Files added
- `src/services/fileSearchStore.js`. REST-based wrapper. `ensureStore` (lazy-creates, caches name in KV), `uploadAndIndex` (resumable upload with custom metadata), `deleteUserDocuments` (list-by-userId cascade for /forget), `deleteDocument`, `buildFileSearchTool` (builds the per-turn tool config with metadata_filter), `isFileSearchSupportedMime` (gate before upload).
- `decisions/2026-05-29-file-search-adoption.md`. This doc.

### Files modified
- `schema.sql`: `media_refs.file_search_doc_name` column added with partial index. D1 migration already applied directly.
- `src/services/filesApi.js`: removed the buggy "text-like >1 MB → Files API" rule. Tightened `INLINE_TEXT_TRUNCATE_CAP_BYTES` from 3 MB to 2 MB.
- `src/services/mediaRefs.js`: new `setFileSearchDocName` helper. `deleteAllForUser` extended to also call `fileSearchStore.deleteUserDocuments`.
- `src/lib/ai/gemini.js`: `buildConfig` now accepts `opts.fileSearchTool` and swaps `googleSearch` for it on Gemini 3.x.
- `src/bot/handlers.js`: imports fileSearchStore; builds `fileSearchTool` from recentMediaRefs after the Promise.all; skips cache when fileSearchTool is set; passes `{ fileSearchTool }` through all three `createChat` call sites (primary, cache-stale retry, cascade retry); adds fire-and-forget File Search upload after `vectorStore.indexMediaRef` in the general doc path.
- `src/index.js`: new admin endpoint `GET /maintenance/backfill-filesearch` with `x-worker-auth` gate, optional `user_id` filter, KV cursor pagination. Reads R2, calls uploadAndIndex per row, writes back via setFileSearchDocName.

### Migration applied to D1
```sql
ALTER TABLE media_refs ADD COLUMN file_search_doc_name TEXT;
CREATE INDEX IF NOT EXISTS idx_media_refs_filesearch
  ON media_refs(file_search_doc_name) WHERE file_search_doc_name IS NOT NULL;
```

### Validation
- All 6 modified files pass `node --check`.
- REST endpoint URLs verified against ai.google.dev/api/file-search/file-search-stores (live fetch 2026-05-29).
- Per-user metadata filter pattern verified against the same docs and the `metadata_filter='author=Robert Graves'` example.
- Tool-incompatibility constraint verified against ai.google.dev/gemini-api/docs/file-search#limitations.

### Costs and limits acknowledged
- Indexing-time embeddings: paid at standard `gemini-embedding-2` rate.
- Storage: free.
- Query-time embeddings: free.
- Retrieved chunks: charged as regular context tokens.
- Per-document max: 100 MB.
- Total store size (Tier 1): 10 GB.
- Backend reserves ~3× source size for embeddings.

---

## Pre-deploy checklist

1. `npx wrangler deploy --minify`.
2. First successful upload triggers `ensureStore`. Verify:
   - Log line `📁 File Search store created: fileSearchStores/xaridotis-docs-<suffix>` (or `reused` if pre-existing).
   - `wrangler kv key get --binding=CHAT_KV --remote fs_store_name` returns the name.
3. Re-upload the same 3.6 MB JSON that crashed earlier. Verify:
   - Upload turn: no 1,048,576-token crash. Inline content truncated to 2 MB (log `inline_text_truncated`).
   - Background: log line `📁 File Search indexing started: ...` within seconds.
   - D1: `SELECT file_search_doc_name FROM media_refs WHERE id = <newId>` is non-null.
4. Wait 30-60 seconds, then send a follow-up message about the file's content. Verify:
   - `wrangler tail` shows the request configured with the fileSearch tool (no googleSearch on that turn).
   - Response cites file content.
   - No regression on turns without indexed files (googleSearch still active for them).
5. Run the backfill for any pre-existing media_refs rows:
   ```bash
   AUTH="$(get worker auth secret)"
   while true; do
     resp=$(curl -s -H "x-worker-auth: $AUTH" "$WORKER_URL/maintenance/backfill-filesearch?limit=5")
     echo "$resp"
     echo "$resp" | grep -q '"done":true' && break
     sleep 5
   done
   ```
6. Test /forget cascade. Verify `media_refs_deleted_for_user` log line includes non-zero `deletedFileSearch`.

---

## Open questions / accepted risks

- **Operation name vs document name.** uploadToFileSearchStore returns a long-running operation; the document name only resolves after indexing completes (~5-30s). We store the operation name as the sentinel in `file_search_doc_name`, which is sufficient for the routing gate (non-null check). For /forget we cascade by metadata filter, not by stored name. A future enhancement could poll the operation and update with the actual document name, but it's not required.
- **Multi-user store size growth.** Single shared store for now. If Eukara or another deployment shares the same project, we'd need to rename or use one store per app. Currently fine.
- **Backfill cost on first run.** Existing media_refs rows are small (~50 across 37 distinct files). Backfilling them all is cheap (<1 GB embedding cost). Not a concern.
- **The 7-day googleSearch suppression window.** Mentioned above. Monitor: are there real turns where a user uploads a file and then within a week asks "look up X online"? If yes, add the heuristic. Not pre-emptive optimisation.
