# Memory architecture, bi-temporal multi-signal recall

**Date:** 2026-05-29
**Status:** Approved (design only). Not yet implemented. Migration not yet applied.
**Scope:** Xaridotis (`gemini-bot`). Eukara to follow once stable.
**Predecessors:** `2026-05-22-anti-summary-synthesis.md`, `2026-05-25-media-handling-full-scope.md`, `2026-05-28-media-handling-bugfix.md`.

---

## 1. Context and current state

The 2026-05-29 production logs surfaced a token budget overflow when a 3.6 MB JSON upload reached `gemini-pro-latest`: the input alone exceeded the 1,048,576 token context window. The crash forced a wider review of how Xaridotis stores, indexes, and retrieves content of any kind.

That review surfaced five gaps in the current memory layer.

### Gap 1: episodes, mood entries, and knowledge graph triples are not in Vectorize

Disk-verified by grepping `src/services/vectorStore.js`. Current Vector ID prefixes in production:

| Prefix | Source table | Indexed? |
|---|---|---|
| `mem_${userId}_${id}` | `memories` | yes |
| `conv_${userId}_${messageId}` | conversation turns from CHAT_KV | yes |
| `media_${userId}_${messageId}` | `media_refs` (metadata only) | yes |
| `epi_${userId}_${id}` | `episodes` | **no** |
| `mood_${userId}_${id}` | `mood_journal` | **no** |
| `kg_${userId}_${id}` | `knowledge_graph` | **no** |

The "unified semantic recall" the architecture has been claiming is not the current state. Episodes, mood, and triples only surface via hard-coded D1 queries (LIKE patterns, recency filters), not semantic similarity.

### Gap 2: `chat_summaries` table is defined but unused

Schema is correct (7 columns: `id, user_id, chat_id, summary_text, date_range, ai_signature, created_at`). Disk grep found exactly one reference in `src/`: a doc string in `src/config/architecture.js:92`. Zero writes, zero reads in the runtime code path. The table is a placeholder.

### Gap 3: no bi-temporal validity on `memories` or `knowledge_graph`

When a user changes jobs from HSBC to Monzo, the old triple `Roma -> works at -> HSBC` should be deprecated, not overwritten. Currently the F3 silent observation block in `handlers.js` extracts new triples but has no way to mark old ones as superseded.

### Gap 4: retrieval is single-signal and gated

`memoryStore.js::getFormattedContext` pulls memories by recency-and-importance ordering. There is no semantic query, no contextual blending with recent history, no rerank by curator intent, and no fusion with episodes / mood / triples.

### Gap 5: large text uploads have no chunking path

Stage 1 of media handling (2026-05-25 → 2026-05-28) stores the file in R2 and a 1.5 MB UTF-8 excerpt in D1. For text-heavy files larger than the inline token budget, there is no way to retrieve specific passages later. The 3.6 MB JSON crash exposed this.

---

## 2. Verified facts and constraints

Live-fetched 2026-05-29 from official documentation.

| Constraint | Value | Source |
|---|---|---|
| Cloudflare D1 max row size | 2,000,000 bytes | developers.cloudflare.com/d1/platform/limits |
| Cloudflare D1 SQL dialect | SQLite (managed distributed) | developers.cloudflare.com/d1 |
| Cloudflare R2 max object | 5 TiB | developers.cloudflare.com/r2/platform/limits |
| Vectorize V2 vector dims | up to 1536 | developers.cloudflare.com/vectorize/platform/limits |
| Vectorize V2 metadata cap | 10 KiB per vector | same |
| Vectorize V2 max vectors per index | 10,000,000 | same |
| `gemini-embedding-2` max input | 8,192 tokens | ai.google.dev/gemini-api/docs/embeddings |
| `gemini-pro-latest` max input | 1,048,576 tokens | ai.google.dev/gemini-api/docs/models |
| SQLite ALTER TABLE restriction | `DEFAULT CURRENT_TIMESTAMP` not allowed on ADD COLUMN | sqlite.org/lang_altertable.html |
| Anthropic Sonnet 4.6 endpoint | `/v1/messages`, requires `max_tokens`, system at top level | docs.claude.com |
| OpenAI gpt-5.4 endpoint | `/v1/chat/completions`, uses `max_completion_tokens`, `reasoning_effort` | developers.openai.com/api/docs |

---

## 3. Architectural principles

These are non-negotiable for this design.

1. **Per-user isolation.** Every Vector ID, every D1 row, every File Search store is scoped by `userId`. No cross-tenant leakage paths exist.
2. **Unified semantic recall.** All text content (memories, episodes, mood, kg, chat summaries, file chunks) lives in one Vectorize index, queryable in a single round trip. No parallel stores.
3. **Anti-summary discipline.** Synthesis prompts never instruct the model to "summarise". They instruct it to record events as they occurred. The `2026-05-22-anti-summary-synthesis.md` decision still holds.
4. **No Google lock-in for memory core.** The semantic memory index is on Cloudflare. Google embeddings via Gemini API are the embedding provider, but the index itself is sovereign. Gemini File Search (the RAG tool) is rejected for this reason.
5. **Files API as transport only.** The Google Files API is used for heavy multimodal payloads (video, long audio, hi-res images) to avoid Base64 bloat and worker memory ceilings. It is never used as a retrieval index for text content.
6. **Bi-temporal validity.** `memories` and `knowledge_graph` track `valid_from` and `valid_until`, so historical state can be queried as-of any past date without destructive updates.

---

## 4. Schema changes

Single migration, idempotent. Adds bi-temporal columns to two tables, indexes `chat_summaries`, and one helper column on `media_refs`. No drops.

```sql
-- Bi-temporal columns on memories
ALTER TABLE memories ADD COLUMN valid_from TEXT;
ALTER TABLE memories ADD COLUMN valid_until TEXT;
ALTER TABLE memories ADD COLUMN superseded_by_id INTEGER;

-- Bi-temporal columns on knowledge_graph
ALTER TABLE knowledge_graph ADD COLUMN valid_from TEXT;
ALTER TABLE knowledge_graph ADD COLUMN valid_until TEXT;
ALTER TABLE knowledge_graph ADD COLUMN superseded_by_id INTEGER;

-- Backfill existing rows so historical valid_from matches original created_at
UPDATE memories SET valid_from = created_at WHERE valid_from IS NULL;
UPDATE knowledge_graph SET valid_from = created_at WHERE valid_from IS NULL;

-- Index for chat_summaries cron lookups
CREATE INDEX IF NOT EXISTS idx_chat_summaries_user_date
  ON chat_summaries(user_id, date_range);

-- Helper column on media_refs for chunked file content (Stage 2)
ALTER TABLE media_refs ADD COLUMN chunk_count INTEGER DEFAULT 0;
```

### Why no `DEFAULT CURRENT_TIMESTAMP` on the new columns

SQLite prohibits `DEFAULT CURRENT_TIMESTAMP` on `ALTER TABLE ADD COLUMN`. Running it raises a syntax error. The application sets `valid_from` at INSERT time instead: in `saveMemory` and `saveTriple` we pass `valid_from = NOW.toISOString()` alongside the other column values. Single source of truth, no SQLite-version surprises.

---

## 5. Five new layers

### 5.1 `indexEpisode` / `indexMood` / `indexTriple` plus backfill

Add three new functions to `src/services/vectorStore.js`, mirroring the existing `indexMemory` shape.

```javascript
export async function indexEpisode(env, userId, episode) {
  const text = formatEpisodeForEmbedding(episode);
  const vector = await embedViaGemini(env, text);
  await env.VECTORIZE.upsert([{
    id: `epi_${userId}_${episode.id}`,
    values: vector,
    metadata: {
      userId,
      type: 'episode',
      created_at: episode.created_at,
      episode_type: episode.episode_type,
      preview: text.slice(0, 200),
    },
  }]);
}
// Same shape for indexMood (id `mood_${userId}_${id}`, type 'mood')
// Same shape for indexTriple (id `kg_${userId}_${id}`, type 'triple')
```

`formatEpisodeForEmbedding` produces a single line:
`[type] trigger: X | emotions: A,B | tried: Y | outcome: Z | lesson: L`

`formatMoodForEmbedding`:
`[score/10] valence: V | tags: A,B | note: N`

`formatTripleForEmbedding`:
`S P O (context: C)`

Wire these into the existing write paths:
- `episode.js::createEpisode` -> call `indexEpisode` after D1 insert
- `mood.js::logMoodEntry` -> call `indexMood` after D1 insert
- `kg.js::addTriple` (called from `silentObservation`) -> call `indexTriple` after D1 insert

All three calls follow the same pattern as `indexMemory`: fire-and-forget with `.catch(log.error)` so vector failures never block the D1 write.

**Backfill plan.** Asynchronous batch backfill via an isolated admin endpoint, decided 2026-05-29:

- Endpoint: `/maintenance/backfill-v2` (POST, protected by `MAINTENANCE_TOKEN` secret)
- Per call, pulls up to 20 unindexed rows from one table, embeds via `gemini-embedding-2`, upserts to Vectorize
- "Unindexed" is detected by querying Vectorize for the ID and checking for absence; on miss, the row is embedded
- Tracks progress per table in KV (`backfill_progress_episodes`, `_mood_journal`, `_knowledge_graph`) for resumability
- Run repeatedly by cron or manual hit until all tables report `done: true`
- Idempotent: re-running upserts the same IDs

Estimated row counts to be measured before deploy via `SELECT COUNT(*)` on each table.

### 5.2 `chat_summaries` narrative ledger

Repurpose the unused table. Compress aged conversation slices into bullet summaries that get embedded into Vectorize alongside everything else.

**Cadence:** nightly cron at 03:00 London. Threshold: compress messages from any thread where the oldest unsummarised message is at least 3 days old. Window: each summary covers a rolling 3-day block.

The 3-day threshold (down from a more conservative 5-day initial proposal) accepts a tighter compression cycle so CHAT_KV stays lean and the ledger has more granular blocks.

**Model cascade:** new export `HEAVY_BG_TIERS` in `src/config/cascades.js`. Disk-verified that both Anthropic and OpenAI providers already exist (`src/providers/anthropic.js` and `src/providers/openai.js`) and that `runCascade` in `src/lib/ai/gemini.js` walks them natively.

```javascript
export const HEAVY_BG_TIERS = Object.freeze([
  // Tier 1 primary: cheap, fast, sufficient quality for narrative compression
  {
    kind: 'gemini',
    provider: 'google',
    model: GEMINI_MODELS.flash,                // 'gemini-3.5-flash'
    label: 'HBG:t1:3.5-flash',
    options: { thinkingConfig: { thinkingBudget: -1 } }, // default thinking
  },
  // Tier 2 fallback: more capable Gemini if Flash fails
  {
    kind: 'gemini',
    provider: 'google',
    model: GEMINI_MODELS.pro,                  // 'gemini-pro-latest'
    label: 'HBG:t2:pro-latest',
    options: { thinkingConfig: { thinkingBudget: -1 } },
  },
  // Tier 3 fallback: cross-provider, OpenAI, reasoning medium
  {
    kind: 'openai',
    provider: 'openai',
    model: OPENAI_MODELS.gpt54,                // 'gpt-5.4'
    label: 'HBG:t3:gpt-5.4',
    options: { reasoningEffort: 'medium' },
  },
  // Tier 4 fallback: cheapest Gemini, last-ditch
  {
    kind: 'gemini',
    provider: 'google',
    model: GEMINI_MODELS.flashLite,            // 'gemini-3.1-flash-lite'
    label: 'HBG:t4:3.1-fl',
    options: { thinkingConfig: { thinkingBudget: -1 } },
  },
]);
```

Note: Anthropic Sonnet is intentionally not in this cascade. It remains in `LAYER_B2C_TIERS` for primary chat tier-4 fallback (deep emotional / crisis / code), where its strengths matter more. Narrative compression is a structured-output task where Flash quality is sufficient.

**Output schema:** canonical JSON. Each provider's response format directive differs but the schema is shared.

```jsonc
{
  "summary_text": "string, 5-10 bullet points joined with newlines",
  "date_range": "YYYY-MM-DD to YYYY-MM-DD",
  "key_themes": ["string", "..."],
  "user_emotional_tone": "string",
  "noteworthy_events": ["string", "..."]
}
```

Provider adapters in `runCascade` translate this into:
- Gemini: `generationConfig.responseSchema`
- Anthropic: `output_config.format.json_schema.schema` (not used here, kept for reference)
- OpenAI: `response_format.json_schema.schema`

**Worker location:** `src/services/chatSummaries.js` (new file). The nightly cron entry calls `consolidateNarrativeLedger(env)` which iterates user threads from CHAT_KV, finds blocks older than 3 days, calls `runCascade(env, prompt, system, HEAVY_BG_TIERS)`, parses the JSON, writes a row to `chat_summaries`, and embeds the `summary_text` into Vectorize as `conv_${userId}_${summaryId}`.

Using the existing `conv_` prefix (not `summary_`) keeps the rerank logic clean: summaries get the same boosts as conversation turns, with date-range metadata distinguishing them when needed.

### 5.3 Bi-temporal validity plus F3 ADD / UPDATE / CONTRADICT classifier

The schema migration added `valid_from`, `valid_until`, `superseded_by_id` to both `memories` and `knowledge_graph`. The retrieval logic enforces them.

**Default query filter:** all retrieval reads add `WHERE valid_until IS NULL OR valid_until > NOW`. Memories with a populated `valid_until` are considered historical and only surface to as-of queries.

**F3 silent observation update.** Currently `src/bot/handlers.js::silentObservation` at line 141 extracts factual triples from each turn and writes them to `knowledge_graph` unconditionally. New behaviour:

For each newly-extracted triple `(S, P, O_new)`:
1. Look up existing triples with the same `(userId, subject, predicate)` where `valid_until IS NULL`.
2. If none exist: ADD. Write new row with `valid_from = NOW`.
3. If an existing triple has the same `object`: skip (already known).
4. If an existing triple has a different `object`: ask the F3 model to classify as one of `{UPDATE_SUPERSEDED, CONTRADICT}`:
   - `UPDATE_SUPERSEDED`: a fact about the user has genuinely changed (job, location, relationship status). Mark old row `valid_until = NOW, superseded_by_id = NEW_ID`. Insert new row with `valid_from = NOW`.
   - `CONTRADICT`: the new statement contradicts the old one but it is unclear which is correct (model hallucination, user error, irony). Mark new row `valid_until = NOW + 1 hour` as provisional. Surface the conflict in the next reply for the user to confirm.

The classifier prompt added to `silentObservation`:

```
You are reviewing a possible state change in factual records about the user.

OLD: ${S} ${P} ${O_old} (recorded ${old.valid_from})
NEW: ${S} ${P} ${O_new} (extracted from current turn)

Recent context (last 3 turns):
${context}

Classify as exactly one of:
- UPDATE_SUPERSEDED  (the user's situation has genuinely changed)
- CONTRADICT         (the two statements conflict but the truth is unclear)

Respond with the single token.
```

Runs on `LAYER_F3_TIERS` (same as triple extraction). One extra round trip per detected conflict. Conflicts are rare so the latency cost is small.

### 5.4 Multi-signal retrieval with contextual embedding

The hot path replacement for the current `getFormattedContext`. New function `getMultiSignalContext` in `src/services/memoryStore.js`.

**Step 1: contextual query construction.** Read the last 3 turns from CHAT_KV. Concatenate as `[user]: ... | [bot]: ... | [user]: ... | current: ${currentMessage}`. This is the embedding input. Resolves the "sparse query problem" where "what about that?" produces no useful embedding when sent alone.

**Step 2: cap to embedding token budget.** `gemini-embedding-2` allows 8,192 input tokens. The blended query is well within this for normal exchanges but a defensive truncation at 4,000 characters protects edge cases (long user message).

**Step 3: embed and query.** Single call to Vectorize with `topK: 12`. Returns matches across all prefixes (`mem_`, `conv_`, `epi_`, `mood_`, `kg_`, `media_`) for this `userId`.

**Step 4: filter by validity.** Drop any match whose underlying D1 row has `valid_until <= NOW` (for `mem_` and `kg_` items). Episodes / mood / conv / media are append-only and don't have a `valid_until` concept.

**Step 5: rerank.** For each surviving match, compute `finalScore`:

```
ageInDays = (NOW - item.metadata.created_at) / 86400000
decay     = exp(-0.005 * ageInDays)
boost     = boostFor(curatorIntent, item.id_prefix, item.metadata)
finalScore = (vectorScore * decay) + boost
```

**Step 6: threshold and slice.** Filter `finalScore >= 0.65`. Sort desc. Take top 5.

**Step 7: format injection block.** See section 6.

**Reranker priors:** locked initial values in a new config block in `src/config/cascades.js`. These are tunable; the doc records them as starting priors only.

```javascript
export const RERANK_PRIORS = Object.freeze({
  EMOTIONAL_EPISODE_BOOST: 0.2,   // applied when curatorIntent='emotional' and id starts with 'epi_'
  EMOTIONAL_CONV_BOOST:    0.1,   // applied when curatorIntent='emotional' and id starts with 'conv_'
  CODE_SPEC_BOOST:         0.3,   // applied when curatorIntent='code' and item.metadata.category='architecture_spec'
  COSINE_THRESHOLD:        0.65,  // minimum finalScore for an item to surface
  DECAY_LAMBDA:            0.005, // decay factor exponent
});
```

Rationale for narrowness: starting with three concrete priors that map cleanly to known Xaridotis patterns (emotional turns benefit from episodic recall; code-spec queries benefit from architecture memories). Broader matrices can be added once these three are tuned and validated.

### 5.5 Chunked text file indexing (Option E, Stage 2)

Today's bug-fix Stage 1 (Option A, local token truncation) lands first. Stage 2 follows in a separate session.

**Stage 2 outline.** Background worker that consumes media_refs uploads of text-shaped MIME types (`text/*`, `application/json`, etc.) where extracted bytes exceed 256 KB. Pipeline:

1. Read the original from R2 (lossless source).
2. Decode UTF-8.
3. Split into 1,500-character chunks with 200-character overlap (sliding window).
4. Embed each chunk via `gemini-embedding-2`.
5. Upsert to Vectorize with IDs `media_${userId}_${refId}_chunk_${index}`.
6. Update `media_refs.chunk_count = N`.

Retrieval inherits automatically: chunks surface through `getMultiSignalContext` alongside memories, episodes, etc. No special handling at query time.

This delivers the same capability that Gemini File Search would (RAG over large text files) but keeps the index on Cloudflare. The `media_${userId}_${refId}_chunk_${index}` namespace stays sovereign.

---

## 6. Hot-path execution model

`src/bot/handlers.js::handleUserMessage` substantive-turn pipeline:

```
1. Trivial content shield
   - Normalise (trim, lowercase, strip trailing punctuation)
   - If matches RE_TRIVIAL_SHIELD, skip retrieval entirely
   - Constant defined narrowly to avoid suppressing context-bearing greetings
     like "morning, terrible sleep last night"

2. PARALLEL kickoff (Promise.all)
   a. Curator: extract intent + entities + register, returns ctxMode and curatorIntent
   b. Retrieval: getMultiSignalContext, returns ranked items

3. Rerank with curator output as soft prior
   - Apply RERANK_PRIORS based on (curatorIntent, item.id prefix, item.metadata.category)
   - Keep items above COSINE_THRESHOLD (0.65)
   - Slice top 5

4. Format injection block (timestamped [SUBCONSCIOUS RECALL])

5. Inject at top of system prompt, route to primary chat cascade
   (Layer B1/B2/C/D depending on curatorIntent and ctxMode)

6. After response, kick off silentObservation (LAYER_F3) in the background
   - Extract new triples
   - Run ADD/UPDATE_SUPERSEDED/CONTRADICT classifier per triple
   - Persist to knowledge_graph with bi-temporal columns
```

**Trivial content shield (final form):**

```javascript
const RE_TRIVIAL_SHIELD = /^(ok|thanks|thank you|cool|yes|no|yep|nope|y|n|cheers|nice|bye|goodbye|👍|❤️|😂|🔥)$/i;

function isTrivial(text) {
  if (!text) return true;
  const normalised = text.trim().toLowerCase().replace(/[!.?…,]+$/u, '');
  return RE_TRIVIAL_SHIELD.test(normalised);
}
```

Deliberately does NOT include `morning`, `evening`, `night`, etc. Those words frequently appear as context-bearing openers ("morning, terrible sleep last night") and gating on them would suppress legitimate recall. The check on `yid`, `yey`, `pk` from the document is omitted as they appear to be typos in the source; if they are intentional shorthand for actual user habits they can be added later.

**Timestamped injection block format:**

```
=== [SUBCONSCIOUS RECALL] ===
The following relational contexts have been retrieved from your long-term storage index based on semantic and entity overlap with the current turn. Use these temporal markers to inform tone and context.

- [2026-05-14 | KG]: Roma works at Monzo (superseded HSBC 2025-08-12)
- [2026-04-19 | EPISODE]: Conflict with Jordan over Pride plans | Anxious, Isolated | Tried AEDP emotional mirroring | Outcome neutral
- [2026-03-02 | CHAT_SUMMARY]: User navigated deep anxiety regarding a ServiceNow platform migration
- [2025-11-08 | MEM:trigger]: Late-night work sessions consistently precede mood dips
- [2026-05-21 | MOOD]: 4/10 valence negative | tags work, sleep | "couldn't focus all day"
=============================
```

Injected at the very top of the system prompt, before persona and tool blocks. Ordering inside the block is by `finalScore` descending.

---

## 7. Files API role (transport only)

The Google Files API is retained but its role is narrow. Three legitimate use cases, none of them retrieval.

1. **Large multimodal ingress.** Videos, voice notes longer than ~5 minutes, hi-res images. Base64 inline incurs a 33% bloat penalty that can push a single Worker request over its memory ceiling. The Files API streams raw binary from R2 directly to Google and returns a `fileUri` pointer. Lightweight to pass to Gemini.
2. **Multi-turn asset consistency.** Files uploaded via the Files API have a 48-hour TTL on Google's infrastructure. If a user references the same upload across ten conversation turns, the `fileUri` is reused without re-uploading the bytes.
3. **Server-side preprocessing.** Files in `PROCESSING` state are parsed by Google's media pipeline. This keeps heavy media decode work off our Worker's cpu_ms budget.

Files API is NOT used for:
- Text content retrieval (Option E chunked Vectorize is canonical).
- Persistent memory (48h TTL is too short).
- Anything keyed by `userId` for long-term lookup (the URI is opaque and ephemeral).

`src/services/filesApi.js` continues to handle uploads. `shouldUseFilesAPI(mime, sizeBytes)` will be tightened in a follow-up to gate strictly on size + multimodal type, not text-shaped content.

---

## 8. Migration order

What ships independently. Order matters: each step is safe to apply without the next, but later steps assume earlier ones are done.

1. **Schema migration** (section 4). Runs via Wrangler. Idempotent on re-run. No downstream code reads the new columns yet, so application is safe.
2. **Application sets `valid_from` at INSERT.** `saveMemory` and the kg insert path in `silentObservation` populate the column on new rows. Code-only change, no schema impact.
3. **`indexEpisode` / `indexMood` / `indexTriple` plus write-path wiring.** New rows from this point are indexed in Vectorize as they are created. Old rows still unindexed until backfill.
4. **Backfill admin endpoint** at `/maintenance/backfill-v2`. Run repeatedly until all three tables report done. Throttled to 20 rows per call, gemini-embedding-2 rate limits permitting.
5. **`getMultiSignalContext`** added to `memoryStore.js`. Old `getFormattedContext` kept temporarily as a fallback path.
6. **`HEAVY_BG_TIERS` cascade plus `chatSummaries.js` worker.** Wire into the nightly cron at 03:00 London. First run begins compressing.
7. **F3 ADD/UPDATE/CONTRADICT classifier.** Updates `silentObservation` to manage `valid_until` rather than blindly insert.
8. **Hot path swap.** Replace `getFormattedContext` call site in `handlers.js` with `getMultiSignalContext`. Old function deleted.

Steps 1 through 4 can run before step 5. Step 5 depends on step 3 being live. Step 6 is independent. Steps 7 and 8 should ship together to avoid mixing old and new injection patterns in the same response.

---

## 9. Backfill plan

### Memories already in old 768-dim index

Approximately 700 rows in `gemini-bot-memory` were embedded with `@cf/baai/bge-base-en-v1.5` (768-dim) before the April 2026 migration to `gemini-embedding-2` (1536-dim). They are queryable via the legacy dual-read path (`vectorStore.js::legacyResults`) but produce noisier matches. A separate backfill (not part of this design doc) re-embeds them at 1536-dim. Deferred to Phase 2 of the original migration plan.

### Episodes, mood, knowledge graph (new)

Per section 5.1. Asynchronous batch via `/maintenance/backfill-v2`. Throttled to 20 rows per call. Per-table progress in KV. Estimated time to complete depends on row counts (to be measured before deploy).

### `chat_summaries`

No backfill needed. The table is empty. The nightly cron starts producing rows from day one.

---

## 10. Honesty section

What is being deferred, what is untested, what could go wrong.

**Deferred:**
- Re-embedding the ~700 legacy 768-dim memories (Phase 2 of April migration).
- Eukara mirror of these changes.
- The full reranker boost matrix beyond the three priors locked in `RERANK_PRIORS`. Tunable later.
- Stage 2 chunked file content indexing. Roadmap entry, not this doc.
- Conflict detection at retrieval time (surfacing when two memories return contradictory facts about the same subject+predicate, even if both are still valid). The F3 classifier handles write-time conflicts; read-time disambiguation is a future enhancement.

**Untested:**
- The 0.005 decay constant and the 0.65 cosine threshold are starting values from the source document. No empirical tuning has been done against Xaridotis usage patterns. Expect to revisit after 2-4 weeks of production data.
- The 3-day compression threshold for `chat_summaries`. May produce too many small blocks or too few; tunable in `chatSummaries.js`.
- The contextual embedding (last 3 turns + current) may produce worse retrieval than current-only embedding on some message types. The intuition is correct (resolves sparse queries) but at-scale validation is pending.
- The F3 ADD/UPDATE/CONTRADICT classifier prompt has not been benched. Worst case is over-classifying neutral statements as contradicts; mitigated by the 1-hour provisional TTL.

**Known risks:**
- Adding `epi_`, `mood_`, `kg_` to Vectorize roughly triples the index size. Within the 10,000,000 vector limit by orders of magnitude but the dashboard graph will jump on deploy day. Not a problem, just noting.
- The backfill endpoint is rate-limited by `gemini-embedding-2` quota (currently Tier 1). Large backfills may take days at 20 rows per call with throttling. Run during off-peak.
- `silentObservation` calling the conflict classifier adds one F3 round trip per detected conflict. If conflicts spike (unlikely in practice), the F3 cascade quota could be stressed. The `LAYER_F3_TIERS` cascade already has three fallback levels; even Tier 3 (`pro-latest`) is fine for occasional conflict resolution.
- Reusing the `conv_` prefix for chat summaries blurs the distinction between turn-level and summary-level vectors at the rerank step. Mitigated by metadata field `type: 'chat_summary'` versus `type: 'turn'`. If retrieval analytics show summaries dominating or being underweighted, split into distinct prefixes in a follow-up.

**Things that could break in production:**
- If the backfill endpoint runs while the regular write path is also indexing new rows, there is a small chance of double-embedding the same row. Idempotent upsert means the row is overwritten with identical content, no data loss, just wasted Gemini calls.
- The nightly cron at 03:00 London could overlap with the existing 04:00 style-card consolidation if `chat_summaries` consolidation runs long. Watch wrangler tail for the first week.
- The trivial-content shield is intentionally narrow. If false-positive trivial-skips become an issue (unlikely with the locked set), the shield can be relaxed or removed entirely with no schema change.

---

## Approvals

- Architecture: approved by Roma 2026-05-29 across iterative review of Curator gating, Files API role, chat_summaries reuse, model cascade selection, backfill strategy, bi-temporal columns, rerank weights, and trivial-content shield.
- Migration SQL: pending Roma's lock-in confirmation before D1 application.
- Implementation: pending design doc review.

## References

- `2026-05-22-anti-summary-synthesis.md`, synthesis discipline
- `2026-05-25-media-handling-full-scope.md`, media_refs schema
- `2026-05-28-media-handling-bugfix.md`, MIME normalisation, 1.5 MB cap, R2 key segment
- Project knowledge: `Humanlike AI Agent Development Resources.pdf`, Mem0/Zep/Hindsight LOCOMO benchmarks
- Project knowledge: `Building AI Agents_ Templates Examples.pdf`, Mem0 + LangGraph stateful RAG pattern
- sqlite.org/lang_altertable.html, ALTER TABLE restrictions
- developers.cloudflare.com/d1/platform/limits, D1 row limit
- developers.cloudflare.com/vectorize/platform/limits, Vectorize V2 limits
- ai.google.dev/gemini-api/docs/embeddings, `gemini-embedding-2` token cap
- docs.claude.com/en/docs/about-claude/models, Anthropic model IDs (reference, not used in HEAVY_BG_TIERS)
- developers.openai.com/api/docs/models, OpenAI model IDs (gpt-5.4 used in HEAVY_BG_TIERS)
