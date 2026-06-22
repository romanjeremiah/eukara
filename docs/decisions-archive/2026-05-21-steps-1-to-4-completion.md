# Decision: Steps 1–4 completion of the five-layer architecture rework

**Date:** 2026-05-21 (late afternoon)
**Status:** LOCKED, source-edited, schema applied to remote D1, not yet deployed.
**Supersedes:** N/A (strict superset of `decisions/2026-05-21-five-layer-cascade-plan.md`)

---

## Context

The 2026-05-21 morning session landed the five-layer provider-aware cascade
architecture (`decisions/2026-05-21-five-layer-cascade-plan.md`). That work
introduced the layer cascades and routing, but four mechanical follow-ups
were still pending:

1. Strip Kimi K2.6 and a set of dead helpers / unreachable code paths.
2. Add an `ai_signature TEXT` column to every D1 table that stores
   AI-authored data.
3. Surface the model identifier in every Telegram user-facing reply via an
   `<i>via {model}</i>` line, and wire the cascade primitives to return
   `{text, model}` instead of just text.
4. Wire `ai_signature` through every INSERT path so every AI-authored row
   in D1 carries the model that produced it.

This decision documents the completion of Steps 1–4, the deliberate Path 2
return-shape choice that drove the Step 3 refactor, and the scope deferred
to future sessions.

---

## Decision 1 — Path 2 cascade-return refactor (not Path 1 hybrid)

**Chosen:** Canonical `{text, model} | null` return shape across the entire
cascade family. `runCascade`, `generateShortResponse`,
`generateWithFallback` all return the same shape.

**Rejected:** The Path 1 hybrid the prior session shipped (some functions
return string, others return tuple, with parallel `*WithModel` variants
sitting alongside).

**Rationale.** A hybrid invites silent footguns. Six months from now a new
caller will guess which function to call and pick wrong half the time. The
failure mode is silent — an unsigned reply ships to the user, no one
notices until a chat-log audit. With Path 2 there is one shape across the
family. The failure mode is loud — destructuring a string yields undefined
for both fields and throws on the next field access, surfacing the bug
immediately in `wrangler tail`.

**Cost.** Roughly 35 call sites across services, workflows, handlers, and
the index file. Mechanically straightforward but each site is a potential
runtime error if missed. The refactor was bounded by exhaustive grep
before touching any code.

**Side effect.** `runCascadeWithModel` and `generateShortResponseWithModel`
were deleted. No more parallel APIs.

---

## Decision 2 — `ai_signature` columns are nullable, no backfill

**Chosen:** Every new column is `TEXT NULL`. Existing rows remain valid
with `ai_signature IS NULL`. No retroactive backfill.

**Rejected:** Forcing NOT NULL or backfilling pre-existing rows with a
placeholder like `'unknown'`.

**Rationale.** A placeholder is misinformation — it claims an answer we
don't have. A NULL is honest: the row predates the column, no model
provenance is recorded. Analytics queries can filter `WHERE ai_signature
IS NOT NULL` when they care; everything else continues to work.

---

## Decision 3 — `mood_journal` dual-stamps the synthesis output

**Chosen:** When `runSynthesisCascade` produces the end-of-flow therapeutic
note, both the markdown body itself ends with `\n\n_via {model}_` AND the
dedicated `ai_signature` column is populated. Per Roma's "both populated"
spec.

**Rationale.** The markdown body is what humans (or future Claude
sessions) re-read; the inline signature preserves provenance in the
content stream. The dedicated column is what analytics queries hit
(distribution of synthesis by model, latency-by-model, quality-by-model).
The two views serve different consumers and shouldn't compete.

---

## Decision 4 — Tool-emitted message signature is deferred

**Chosen:** Tools that send Telegram messages (`quote`, `effect`, possibly
`image`, `voice`) do NOT receive the model identifier in their
`context` parameter yet. Their messages go out without an inline
signature.

**Rationale.** Adding `aiModel` to the `context` passed into
`tools.execute(args, env, context)` touches every tool file. It's not a
deep change but it's a wide one. Doing it in the same session as the
Path 2 refactor compounds risk. The next assistant turn after any tool
call goes through the main streaming path in `handlers.js` (L1908),
which DOES carry a signature, so the user-visible reply chain is not
left blank — only the tool-emitted message itself is unsigned.

**Follow-up.** A dedicated short session to plumb the model through the
tool context.

---

## Decision 5 — Steps 5 and 6 deferred to dedicated sessions (Option X)

**Chosen:** Stop after Step 4. Document. Deploy what is done.

**Rejected:** Push through Step 5 (streaming everywhere) and Step 6 (Layer
F4 Therapeutic REM) in the same session.

**Rationale.** Step 5 is genuinely 1–2 sessions of work — each provider has
a different SSE shape, error semantics, partial-text recovery semantics,
and Telegram has rate limits on message edits (~1/sec) that complicate the
draft-edit loop. Step 6 requires verifying current Gemini Batch API docs
(the API surface may have moved since cutoff), designing the input file
format, polling/scheduling against the existing minute-cron, and wiring
GPT-5.5 as the final fallback. Doing both back-to-back in one session and
then deploying means debugging five untested code paths in production
under `wrangler tail`.

By contrast, what landed today (Path 2 + AI signature + schema) is
substantial standalone value and can ship now with low risk.

---

## What landed

### Files added
- `schema_migration_2026-05-21_ai_signature.sql` (repo root)
- `decisions/2026-05-21-steps-1-to-4-completion.md` (this file)

### Files rewritten (canonical Path 2 shape, INSERT-time `ai_signature`)
- `src/lib/ai/gemini.js`
- `src/services/cfAi.js`
- `src/services/moodMicroAck.js`
- `src/services/moodSynthesis.js`
- `src/services/memoryStore.js`
- `src/services/moodStore.js`
- `src/services/episodeStore.js`
- `src/services/knowledgeGraph.js`
- `src/services/userStore.js`
- `src/services/persona.js`
- `schema.sql`

### Files edited (string → tuple migration at callsites)
- `src/lib/formatter.js` (verified)
- `src/services/planner.js`
- `src/services/responseCurator.js`
- `src/services/personaEvolution.js`
- `src/bot/handlers.js`
- `src/index.js`
- `src/workflows/moodEveningCheckin.js`
- `src/workflows/memoryConsolidation.js`

### Verification
All 18 touched JS files pass `node --check`.
All 10 D1 tables have `ai_signature` (`PRAGMA table_info` verified post-migration).

---

## What is deferred

| Item | Scope | Estimated sessions |
|---|---|---|
| Step 5: streaming everywhere across providers | OpenAI SSE + Anthropic typed events + CF OpenAI-compat SSE + unified iterator + Telegram draft-edit integration | 1–2 |
| Step 6: Layer F4 Therapeutic REM | Gemini Batch API for primary tier; fallback chain `3.5-flash → sonnet-4.6 → gpt-5.5`; new nightly cron workflow | 1 |
| Tool-emitted signature plumbing | Add `aiModel` to `tools.execute(args, env, context)`; update every tool file | 0.5 |
| Pending cleanup TODOs | Remove diagnostic `console.log` in `tagConversationMode`; remove stale `codeExecution` comment in `handlers.js`; investigate `hasMedia ? null : setupCache(...)` drop | 0.5 |

---

## Pre-deploy checklist

1. `npx wrangler secret put OPENAI_API_KEY` (still required from the morning lock for B1/B2C/D Tier 3).
2. Confirm `ANTHROPIC_API_KEY` Worker secret is present.
3. `npx wrangler deploy --minify`.
4. Tail watch for `model_route_resolved` with the new layer tags on first turn.
5. Spot-check that user-facing Telegram replies carry `<i>via {model}</i>`.
6. Spot-check a D1 query for AI-authored rows: any post-deploy row should have `ai_signature` populated. Pre-deploy rows remain NULL by design.

---

## Smoke-check SQL after deploy

After running through one full day (morning greeting, mid-day check, evening mood, a few chats), this query should return populated rows:

```sql
SELECT 'memories'        AS tbl, COUNT(*) AS with_sig FROM memories        WHERE ai_signature IS NOT NULL
UNION ALL SELECT 'episodes',        COUNT(*) FROM episodes        WHERE ai_signature IS NOT NULL
UNION ALL SELECT 'knowledge_graph', COUNT(*) FROM knowledge_graph WHERE ai_signature IS NOT NULL
UNION ALL SELECT 'mood_journal',    COUNT(*) FROM mood_journal    WHERE ai_signature IS NOT NULL
UNION ALL SELECT 'training_pairs',  COUNT(*) FROM training_pairs  WHERE ai_signature IS NOT NULL
UNION ALL SELECT 'user_profiles',   COUNT(*) FROM user_profiles   WHERE ai_signature IS NOT NULL
UNION ALL SELECT 'persona_config',  COUNT(*) FROM persona_config  WHERE ai_signature IS NOT NULL;
```

Any tier-1 cascade success will populate at least one row in each of: `memories` (via silent observation), `mood_journal` (via evening synthesis), and `training_pairs` (if any positive reaction lands).
