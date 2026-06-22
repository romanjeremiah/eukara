# 2026-05-21 (evening) — Stages 1–4 conversation-aware re-ranker + full background cascade respec

**Status:** LOCKED. Source-edited, all 16 touched files pass `node --check`. Not deployed.
**Predecessor:** `2026-05-21-steps-1-to-4-completion.md` (afternoon ai_signature work) and `2026-05-21-curator-and-cascade-revisions.md` (morning five-layer cascade lock).
**Supersedes:** none. Stacks.

---

## Context

Two days of prior work landed the five-layer architecture (Layers A/B1/B2/C/D/F3), Path 2 cascade unification, and `ai_signature` schema. The remaining quality gap was a class of user-facing failures the architecture didn't yet defend against — what Roma calls "constraint amnesia" — typified by the gym example:

- User states: "I want healthy food on the way home from the gym."
- Bot responds: "You've earned a treat after a long day at the gym..."

The constraint exists in the conversation history but is overridden by the persona's warm-permissive default. The architecture had no explicit signal that a constraint was active, no instruction telling the model that explicit constraints outrank warmth, and no separation between memories that are *load-bearing* for this turn versus memories that are merely *available*.

Separately: Roma issued a comprehensive cascade respec for every background task. The prior background paths still leaned on Cloudflare Workers AI models (Llama 4 Scout, Llama 3.3 70B, Qwen Coder 32B). The respec moves all background tasks onto Gemini-first cascades with OpenAI as cross-provider resilience anchor, matching the design philosophy of the user-facing layers.

Two further concerns piggybacked the same window:
- Vectorize migration from 768-dim (Phase 2 deferred from earlier sessions).
- Voice transcription rewrite (Workers AI Whisper removed) and TTS Tier 1/1.5 (Gemini TTS) added behind env flag.

Roma's directive was explicit: no pushback, land everything in one session. The risk was real and was named at session start. This doc records what landed, why, and what's required to deploy safely.

---

## The eleven concerns

### 1. Stages 1–4 of the conversation-aware re-ranker

**Stage 1 — active user constraints.** The curator now extracts explicit user-stated constraints from the current turn and recent prior turns and surfaces them in their own prompt block, rendered at the top of the dynamic context above the persona. Constraints are tagged with `turn_offset` (0 = current, negative = older) and `category` (preference / boundary / task / tone). Examples: "I want healthy food" (preference), "no advice" (boundary), "find a recipe" (task), "be brief" (tone).

The block uses XML-style tags (`<active_user_constraints>...</active_user_constraints>`) so the persona's hard rule (Stage 4) can refer to it unambiguously.

**Stage 2 — history relevance re-ranking.** The curator tags each of the last ≤8 conversation turns as `anchor`, `context`, or `ignore`. The handler imports the new `applyHistoryRelevance` function and applies it to the `hist` array before passing it to `createChat`. Turns tagged `ignore` are replaced with one-line `[user summary] ...` or `[bot summary] ...` placeholders. Turns tagged `anchor` or `context` are kept verbatim. This lets the model spend attention on the turns that matter without losing turn structure entirely.

Wiring: three `createChat` callsites in handlers.js — the cached path, the cache-stale retry, and the tier-fallback path — all use `effectiveHist` (the re-ranked array). The transformation is wrapped in try/catch so a curator malformation falls back to raw `hist` rather than breaking the turn.

**Stage 3 — memory weighting.** The curator tags each retrieved memory id as `anchor`, `context`, or `ignore`. `buildCuratedPrepend` renders anchors with an `[ANCHOR | category]` prefix, contexts as normal text, and drops ignores. This replaces the prior binary `relevant_memory_ids` array. Backwards-compat: `relevant_memory_ids` is derived from non-ignore items so any caller still expecting that field continues to work.

**Stage 4 — persona hard rule.** A new top-of-directive block in `SECOND_BRAIN_DIRECTIVE` named `ACTIVE USER CONSTRAINTS — HARDEST RULE`. Six numbered rules + an explicit banned-framing list ("you deserve...", "give yourself grace...", "treat yourself...", "after a long day...") + four worked examples covering the four constraint categories.

The rule placement is critical. Roma's prior 2026-05-16 lock placed `TOOL SELECTION HARD CONSTRAINTS` in `SECOND_BRAIN_DIRECTIVE` (not `BASE_TEMPLATE`) and noted "must stay." Stage 4 follows the same pattern: it lives in the directive that's appended dynamically for second-brain turns, not in the base persona that's cached. This keeps it out of the prompt cache so updates take effect immediately on the next turn without waiting for cache expiry.

### 2–7. Background cascade respec per Roma's spec

All seven cascades were rewritten to follow one of two patterns:

**Heavy background cascade (HEAVY_BG_TIERS in cfAi.js):**
- Tier 1: `gemini-3.5-flash` (Gemini API, thinking-level default)
- Tier 2: `gpt-5.4` (OpenAI API, reasoning medium, `response_format: { type: 'json_object' }`)
- Tier 3: `gemini-3.1-flash-lite` (Gemini API, thinking-level default)

Used by: triple extraction, mood tagging, memory dedup, style card consolidation, persona evolution.

**Light background cascade (LIGHT_BG_TIERS in cfAi.js):**
- Tier 1: `gemini-3.1-flash-lite` (Gemini API, thinking-level default)
- Tier 2: `gemini-3.5-flash` (Gemini API, thinking-level default)
- Tier 3: `gpt-5.4-mini` (OpenAI API, reasoning medium, `response_format: { type: 'json_object' }`)

Used by: reaction interpretation, conversation mode tagger (legacy fallback when `USE_NEW_CURATOR='false'`).

**Pre-response curator (responseCurator.js):** matches Light pattern but with `responseMimeType: 'application/json'` on the Gemini tiers and `response_format: { type: 'json_object' }` on the OpenAI tier so the structured output is reliable across providers.

**Layer F3 (cascades.js):** matches Light pattern. Replaces the prior `@cf/meta/llama-3.1-8b-instruct-fp8` tier with OpenAI gpt-5.4-mini as the cross-provider resilience anchor.

**Mood synthesis (moodSynthesis.js):** custom three-tier — `gemini-3.5-flash → gpt-5.4 → gemini-3.1-flash-lite`. Notable difference from the Heavy pattern: the OpenAI tier deliberately omits `responseFormat` because synthesis output is free-form therapeutic prose, not JSON.

**Persona evolution (personaEvolution.js):** Heavy pattern with `responseFormat` on the OpenAI tier (the output is structured COMMUNICATION_NOTES / EVOLVED_TRAITS text but JSON mode keeps the parser stable cross-provider).

**Memory consolidation (workflows/memoryConsolidation.js):** custom four-tier:
- Tier 1: `gemini-pro-latest` (Gemini API, `responseMimeType: 'application/json'`)
- Tier 2: `gemini-3.5-flash` (Gemini API, `responseMimeType: 'application/json'`)
- Tier 3: `claude-sonnet-4-6` (Anthropic direct API, adaptive thinking, `maxOutputTokens: 8000`)
- Tier 4: `gpt-5.5` (OpenAI API, reasoning medium, `maxOutputTokens: 8000`, `response_format: { type: 'json_object' }`)

The four-tier shape was Roma's call: memory consolidation runs nightly, is the highest-stakes background task (irreversibly mutates the user's memory bank), and is the right place to spend on cross-provider redundancy.

Parser handles both shapes Sonnet and GPT-5.5 might return: raw array (regex match) or object-wrapped array (`{memories: [...]}` / `{items: [...]}` / `{consolidated: [...]}`).

**Vector re-indexing in consolidation Step 6** was rewired to call `vectorStore.indexMemory` instead of running a bespoke embedding pipeline. This means consolidation now routes through `gemini-embedding-2` and writes to the v2 index automatically.

All Cloudflare Workers AI models (`@cf/qwen/qwen2.5-coder-32b-instruct`, `@cf/meta/llama-4-scout-17b-16e-instruct`, `@cf/meta/llama-3.3-70b-instruct-fp8-fast`, `@cf/zai-org/glm-4.7-flash`) are removed from background paths. They remain available as exports in `src/lib/ai/gemini.js` only because `handlers.js` still imports `FLASH_LITE_25_MODEL` and the SHORT_RESPONSE_TIERS internal cascade still references some of them — both deliberately left in place for the user-facing short-response path which was outside this session's scope.

**Layer A curator (executeCurator in src/services/curator.js) is UNCHANGED.** It retains its 2026-05-19 lock: Mistral 24B → Llama 70B → Qwen 32B → Haiku 4.5. Roma's directive was about background tasks and the pre-response curator (responseCurator.js), not the Layer A intent classifier.

### 8. Mood flow consolidated to one AI call

Score-tap ack and emotions-Done ack used to make AI calls to produce a personalised acknowledgement. Roma's spec removes both. Now:

- Score-tap reply: static text `"Got it. Tap below to share what you are feeling."`
- Emotions-Done reply: static text `"Got it."`
- End-of-flow synthesis: still AI-driven (the new gemini-3.5-flash cascade above).

The mood flow now has **exactly one** AI call total, down from three. Function signatures (`runScoreAck`, `runEmotionsAck`) preserved so the three callers — `src/index.js`, `src/bot/handlers.js`, `src/workflows/moodEveningCheckin.js` — continue to compile unchanged. Both return `{ text, model: null }` to match the shape the callers destructure.

### 9. USE_NEW_CURATOR flipped opt-in → opt-out

`handlers.js` line 1208 now reads:

```js
if (env.USE_NEW_CURATOR !== 'false') {
```

instead of `=== 'true'`. New curator (executeCurator) is the default path. Setting `USE_NEW_CURATOR='false'` is the only way to fall back to legacy `tagConversationMode`. The legacy path itself was rewritten in this session to use `runCascade` + `LIGHT_BG_TIERS`, so even the opt-out doesn't carry orphaned CF model dependencies.

The diagnostic `/tagmode` command at handlers.js line 778 retains `=== 'true'` opt-in semantics intentionally — it's a developer-only diagnostic and not part of the production hot path.

### 10. Vectorize migration to gemini-embedding-2 (1536-dim)

Phase 2 of the Vectorize migration from the 2026-05-21 memory notes ("deferred — 768-dim working fine") was unblocked by Roma's directive.

**vectorStore.js rewrite:**
- `GEMINI_EMBEDDING_MODEL = 'gemini-embedding-2'` (no `-preview`)
- `EMBEDDING_DIMS = 1536`
- New `pickIndex(env)` helper: prefers `env.VECTORIZE_V2` (1536-dim) when bound, falls back to `env.VECTORIZE` (768-dim).
- Workers AI embedding fallback REMOVED from the primary path. Roma's call: Tier 1 only.
- Multimodal indexing (`indexMedia`) routes through Gemini Embedding 2 via inlineData parts — same SDK call as the 768-dim path, only `outputDimensionality` changes.

**Dual-read fallback during transition:**
- `semanticSearch` queries v2 first.
- If v2 returns empty AND `env.VECTORIZE` (v1) is bound, the function re-embeds the query at 768-dim using the legacy `@cf/baai/bge-base-en-v1.5` and queries v1.
- Legacy v1 matches are tagged `_source: 'v1-dualread'` with a 0.9× score penalty so v2 wins on ties post-backfill.

**Why dual-read:** Roma's explicit requirement was "cannot afford to lose any memory." The ~700 existing memories live in the 768-dim v1 index. Until they're backfilled into v2, dual-read keeps them searchable. Backfill is a separate manual step (a re-embed script, deferred to a future session).

**`deleteAllVectors`** now deletes from BOTH v1 and v2 when both are bound, so a `/forget` command stays consistent across both indexes during the transition.

### 11. Voice transcription rewrite + TTS Tier 1/1.5 added

**Transcription (transcription.js full rewrite):**
- Cloudflare Workers AI Whisper removed entirely.
- Three-tier Gemini-only cascade: `gemini-pro-latest → gemini-3.5-flash → gemini-3.1-flash-lite`.
- All three tiers use the same SDK call shape with `inlineData` audio parts per https://ai.google.dev/gemini-api/docs/audio.
- Per-tier 10s wall-clock timeout. Worst case before total failure: 30s.
- On total failure, returns `{ success: false, text: '' }`. Caller's existing hasMedia fallback (Pro for multimodal) covers the empty-transcript case — no worse than today.

**TTS (tts.js partial rewrite):**
- Tier 1: `gemini-2.5-pro-preview-tts` via Gemini API with `responseModalities: ['AUDIO']`.
- Tier 1.5: `gemini-3.1-flash-tts` via same API path.
- Tier 2: Google Cloud TTS Chirp 3 HD (preserved — native OGG Opus, what Telegram `sendVoice` expects).

**Honest implementation note (the reason Tier 1 is gated):**

Gemini TTS returns 24 kHz signed PCM L16 audio. Telegram `sendVoice` requires OGG Opus. Converting PCM → Opus inside a Cloudflare Worker requires an Opus encoder, which is not available in the default Workers runtime (no native ffmpeg, no Web Audio API encoders).

Tier 1 currently wraps the raw 24 kHz PCM in a WAV header and returns it. Telegram `sendVoice` will reject WAV. Therefore Tier 1 / 1.5 are gated behind `env.USE_GEMINI_TTS === 'true'`. With the flag unset (the default), the function calls Tier 2 (Chirp 3 HD) directly and the buffer shape returned to the caller is unchanged — backwards-compat preserved.

Once a WASM Opus encoder is added to the Worker (or all TTS callsites switch to `sendAudio` which accepts WAV/MP3 — different UX, file presentation not voice-note presentation), Tier 1 can be unlocked. This is the only implementation note where I deviated from "do it" in favour of "do it safely" — flagged transparently at the file header in `src/lib/tts.js`.

---

## Files touched (16 total)

All pass `node --check`.

| File | Change |
|---|---|
| `src/config/models.js` | Added `GEMINI_MODELS.embedding = 'gemini-embedding-2'`, `ttsFlash`, `transcribePrimary/Fallback/Final`; added `OPENAI_MODELS.gpt55` |
| `src/config/cascades.js` | `LAYER_F3_TIERS` respec |
| `src/config/personas.js` | Stage 4 `ACTIVE USER CONSTRAINTS — HARDEST RULE` block prepended to `SECOND_BRAIN_DIRECTIVE` |
| `src/services/responseCurator.js` | Full rewrite: new cascade + Stages 1–3 + `applyHistoryRelevance` export |
| `src/services/cfAi.js` | `HEAVY_BG_TIERS` + `LIGHT_BG_TIERS` + `tagConversationMode` rebuilt on `runCascade` |
| `src/services/moodMicroAck.js` | Full rewrite: AI removed, static text only, signatures preserved |
| `src/services/moodSynthesis.js` | New cascade per spec |
| `src/services/personaEvolution.js` | New cascade per spec |
| `src/services/vectorStore.js` | Full rewrite: gemini-embedding-2 + 1536-dim + v2 index + v1 dual-read |
| `src/services/transcription.js` | Full rewrite: Gemini-only cascade |
| `src/workflows/memoryConsolidation.js` | Full rewrite: 4-tier cascade incl. Sonnet 4.6 + GPT-5.5; re-indexing via vectorStore |
| `src/lib/tts.js` | Gemini TTS Tier 1/1.5 added behind `USE_GEMINI_TTS` flag; Chirp 3 HD default |
| `src/bot/handlers.js` | `USE_NEW_CURATOR` opt-out default; Stage 2 `applyHistoryRelevance` wiring at all three `createChat` callsites; new curator log fields |
| `src/index.js` | No code changes (mood callers continue to compile against the preserved signatures) |
| `src/lib/ai/gemini.js` | No code changes (legacy constants still exported for handlers/SHORT_RESPONSE_TIERS) |
| `src/workflows/moodEveningCheckin.js` | No code changes (mood callers continue to compile) |

---

## Pre-deploy checklist

**Critical:**

1. `npx wrangler vectorize create gemini-bot-memory-v2 --dimensions=1536 --metric=cosine`
2. Add to `wrangler.jsonc`:
   ```json
   {
     "binding": "VECTORIZE_V2",
     "index_name": "gemini-bot-memory-v2"
   }
   ```
   Keep the existing `VECTORIZE` binding for the duration of the dual-read window.
3. Confirm `OPENAI_API_KEY` Worker secret is set. NOW load-bearing for: HEAVY_BG_TIERS Tier 2, LIGHT_BG_TIERS Tier 3, curator Tier 3, F3 Tier 3, synthesis Tier 2, memory consolidation Tier 4. Without it, those tiers silently skip and the cascade degrades to gemini-3.1-flash-lite.
4. Confirm `ANTHROPIC_API_KEY` Worker secret is set. NOW load-bearing for memory consolidation Tier 3 (Sonnet 4.6).
5. Do NOT set `USE_GEMINI_TTS='true'`. The default Chirp 3 HD path continues to produce Telegram-compatible OGG Opus. Setting the flag will route to Tier 1 (Gemini TTS), which currently returns WAV-wrapped PCM that `sendVoice` will reject. See `src/lib/tts.js` header for the full rationale.

**Deploy:**

6. `npx wrangler deploy --minify`.

**Tail-watch checklist post-deploy:**

7. New log fields confirm Stages 1–3 are firing:
   - `curator_complete` — new fields: `constraintCount`, `anchorMemories`, `ignoredHistory`, `curator_model`.
   - `history_re_ranked` — new log line, fires when Stage 2 actually summarises any turns.
   - `prompt_sizes` — `curated_chars` should be larger on turns with constraints (the `<active_user_constraints>` block adds to it).
   - First voice note after deploy should log `transcribe_tier_ok` with `model: 'gemini-pro-latest'` (Tier 1) — confirms the Workers AI Whisper removal.

**Backfill is separate:**

8. Vectorize v2 backfill is NOT done by this deploy. New memories created after deploy index into v2. Old memories (~700) remain in v1 and are served via dual-read until a backfill script re-embeds them with gemini-embedding-2 into v2. Backfill script is a separate session.

---

## Known risks at deploy time

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `OPENAI_API_KEY` missing or rate-limited | Medium | Background tasks degrade to gemini-3.1-flash-lite | Confirm secret set; tail-watch for OpenAI tier failures |
| `ANTHROPIC_API_KEY` missing | Low | Memory consolidation falls through to Tier 4 (GPT-5.5) | Confirm secret set; consolidation runs monthly so the impact window is small |
| Memory consolidation JSON shape varies cross-provider | Medium | Parser handles raw array + 3 object-wrapping shapes | If a 5th shape appears, parser logs the failure and the workflow retries |
| Voice transcription Gemini regional outage | Low | Empty transcript → caller falls back to hasMedia routing | Pro still receives the audio directly via multimodal path |
| Stage 2 over-summarises noisy curator output | Low | History turns replaced with bad summaries | Wrapped in try/catch with fallback to raw `hist`. Worst case: no improvement, never broken |
| TTS Tier 1 accidentally enabled in prod | Low (gated behind explicit env flag) | Telegram voice notes break (sendVoice rejects WAV) | Do not set `USE_GEMINI_TTS` until WASM Opus encoder lands |
| Vectorize v2 binding missing | High if not created pre-deploy | All semantic search falls through to v1 dual-read (still works) | Step 1 of pre-deploy checklist |

---

## Deferred to follow-up sessions

- **Vectorize V2 backfill script.** Re-embed all existing 768-dim memories with gemini-embedding-2 into the v2 index. Without this, dual-read remains the load-bearing path indefinitely.
- **WASM Opus encoder.** Unblocks TTS Tier 1 in the default path. Until then, Gemini TTS is unreachable in production.
- **Tool-emitted message signature plumbing.** `src/tools/quote.js`, `src/tools/effect.js` — carried over from prior session.
- **Step 5: streaming everywhere.** OpenAI SSE, Anthropic typed events, CF OpenAI-compat. Carried over.
- **Step 6: Layer F4 Therapeutic REM via Gemini Batch API.** Carried over.
- **Cleanup.** Stale `console.log` block in `tagConversationMode`; stale `codeExecution` comment in handlers.js (if any remain).

---

## Honesty section

This session was larger than was sensible for one window. Eleven independent concerns landed in one go because Roma explicitly directed it. The risk was named at session start and accepted.

What protected the work:
- Every file passes `node --check`.
- Stage 2 wrapped in try/catch with fallback to raw `hist`.
- USE_GEMINI_TTS gated behind an env flag so the default voice-note path is unchanged.
- Vectorize v1 dual-read so no memory is lost during the transition window.
- Backwards-compat shape preservation in mood ack functions so no caller broke.
- Function signature preservation across the curator output (relevant_memory_ids derived from non-ignore memory_weights so any caller that hasn't migrated still gets the array it expects).

What didn't get protected:
- No bench data for any of the new cascades. Roma's spec was prescriptive ("use these models"), so the work was implementation, not selection. The first real-world signal will be tail logs post-deploy.
- No integration test. The Worker compiles; whether the Stage 1 constraint block actually changes the model's output is a deploy-and-watch question.
- The TTS WAV vs Opus constraint was an unexpected discovery mid-session. The implementation is honest about the limitation but doesn't solve it. Tier 1 is unreachable until a future session.

Next session should: deploy, watch the new log fields, write the v2 backfill script, decide whether the WASM Opus encoder is worth the bundle-size cost.
