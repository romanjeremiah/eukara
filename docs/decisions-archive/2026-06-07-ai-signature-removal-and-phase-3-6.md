# 2026-06-07  -  AI Signature Removal + Phase 3 Multi-User Verification

## Context

Two threads collapsed into one session:

1. **AI signatures**: The "via {model}" footer at the bottom of every bot
   message. Function `formatReplyWithSignature(text, model)` was no-op'd in
   Phase 2 (2026-06-06) as a soft removal. Roma decided in this session that
   the feature is gone for good and asked for the code to be simplified
   accordingly ("no pushback").

2. **Phase 3 multi-user**: Schema migration for the `authorised` column
   wasn't confirmed applied because `npx wrangler d1 execute gemini-bot`
   failed with `Couldn't find DB with name 'gemini-bot'`. Verified via D1
   MCP that the migration HAD actually been applied (column + index + Roma
   row backfilled)  -  the wrangler error was misleading. Roma also dropped
   the `/grant` and `/revoke` command requirement, opting to manage access
   via Telegram-level restrictions (BotFather / privacy).

## Decisions

### 1. AI signature: full removal, not no-op

- **Function deleted.** `formatReplyWithSignature` is gone from
  `src/lib/formatter.js`. Only `stripLeakedThoughts` and
  `sanitizeTelegramHTML` remain exported.
- **All 27 call sites removed** across `src/index.js` (13 sites),
  `src/bot/handlers.js` (7 sites), plus inline strips earlier.
- **All imports removed** from both files.
- **SQL writes stripped** for the `ai_signature` column across 11 INSERT
  /UPDATE statements in 9 files:
  - `src/services/memoryStore.js` (×2 INSERTs)
  - `src/services/chatSummaries.js`
  - `src/services/episodeStore.js`
  - `src/services/knowledgeGraph.js`
  - `src/services/moodStore.js` (UPDATE + INSERT)
  - `src/services/userStore.js` (UPDATE in `saveStyleCard`)
  - `src/workflows/memoryConsolidation.js`
  - `src/workflows/therapeuticRem.js`
  - `src/index.js` (training_pairs INSERT)
- **Function signatures trimmed.** `aiSignature = null` removed from:
  - `memoryStore.saveMemory(env, userId, category, fact, importance = 1)`
  - `knowledgeGraph.saveTriple(env, userId, subject, predicate, object, context = null, source = 'observation')`
  - `userStore.saveStyleCard(env, userId, styleCard)`
  - `episodeStore.saveEpisode` destructuring (dropped `aiSignature = null`)
- **Object-literal removals.** `ai_signature: tagResult.model,` /
  `ai_signature: synth.model,` / `patch.ai_signature = ...` stripped from
  `handlers.js`, `moodEveningCheckin.js` (×2), `personaEvolution.js`.
- **Persona allow-list trimmed.** `'ai_signature'` removed from the
  `updatePersonaConfig` allow-list array in `src/services/persona.js`.
  (Also fixed a broken array literal that the perl strip had left dangling.)
- **Stale docstring comments cleaned** across `gemini.js`, `cfAi.js` (×5),
  `responseCurator.js`, `moodSynthesis.js`, `moodEveningCheckin.js` (×2),
  `memoryConsolidation.js`, `therapeuticRem.js`.

**Final state.** `grep -rn "ai_signature\|aiSignature\|AI_SIGNATURE" src/`
returns zero hits.

### 2. Schema columns left in place

The 10 `ai_signature TEXT` columns in `schema.sql` (and the matching
columns in the live D1) are **not** dropped in this pass. Reasoning:

- They're harmless dead fields  -  no code reads or writes them anymore.
- `DROP COLUMN` migrations on SQLite/D1 are heavy operations (table
  rewrites) and not worth the deploy risk when storage cost is negligible.
- A future cleanup migration can drop them across all 10 tables in one
  pass, simultaneously updating `schema.sql` to match.

Tables with dead `ai_signature` columns: `user_profiles`, `memories`,
`persona_config`, `mood_journal`, `chat_summaries`, `episodes`,
`knowledge_graph`, `training_pairs`, `chat_messages`, `consolidations`
(based on grep counts).

### 3. Phase 3 multi-user authorisation: verified applied

- D1 schema confirms `authorised INTEGER NOT NULL DEFAULT 0`,
  `authorised_at INTEGER`, `authorised_by INTEGER` columns present on
  `user_profiles`.
- Roma's row (`user_id = 62047005`) is `authorised = 1` with
  `authorised_at = 1780782931` (2026-06-06 21:55 UTC).
- All other 8 user_profiles rows are `authorised = 0`.
- Partial index `idx_user_profiles_authorised` exists with the
  `WHERE authorised = 1` filter.
- Webhook gate `shouldProcessUpdate` is wired in `src/index.js` at
  line 1980, with the import at line 24. Denied updates return `200 OK`
  to suppress Telegram retries; an `auth_denied` log line carries the
  user_id for SQL-based admission.

### 4. `/grant` and `/revoke` not implemented (per Roma)

Roma said: "I don't need the /grant and /revoke, I will give access
through Telegram OOB setting restricting who can use the bot."

Reading: he manages who can interact with the bot via Telegram-side
controls (keeping the bot username private, BotFather restrictions on
group joinability, etc.). The in-bot `authorised` column is defense in
depth  -  if the username leaks, the gate prevents unauthorised access at
the webhook level. Admissions, if ever needed, happen via direct D1 SQL.

### 5. Phase 3.7 (cron iteration) deferred  -  see separate decision

Phase 3.7 was on the pending list but raises a cost-benefit question
worth flagging separately. Captured in
`decisions/2026-06-07-phase-3-7-cron-iteration-decision-point.md`.

## Verification

- All JS files in `src/` pass `node --check`. Verified via
  `find src -name "*.js" -type f | while read f; do node --check "$f"; done`.
- No `ai_signature` references anywhere in `src/`.
- No `formatReplyWithSignature` references anywhere in `src/`.
- Migration confirmed via D1 MCP (Cloudflare API direct), not via wrangler
  CLI which has a binding-name resolution issue.

## Deploy status

**NOTHING DEPLOYED.** This is on-disk only.

To deploy:
```bash
cd /Users/romanjeremiah/Library/CloudStorage/OneDrive-Personal/Documents/GitHub/gemini-bot
npx wrangler deploy --minify
```

The bundled changes shipping in the next deploy:
- Phase 1 (Eukara persona port)  -  Eukara only, separate repo
- Phase 2 (Xaridotis persona backport)
- Phase 3.1–3.5 (multi-user auth migration applied, code in place)
- Phase 3.6 (webhook gate wired)
- Phase 4 (positive-framing persona refactor across both bots)
- AI signature removal (this decision)

The first deploy after this carries a moderate change surface. Worth
keeping `wrangler tail` open for the first 10 minutes to catch any
mood/memory/episode write that surfaces an unforeseen SQL parameter
mismatch.

## Rollback

The git working tree should be inspected via WebStorm before deploy. If
anything looks wrong:
- AI signature changes are spread across ~14 files. Single-commit revert
  is the safe rollback path.
- The auth gate at line 1980 in `src/index.js` can be reverted by
  removing the 3-line `if (!await shouldProcessUpdate...)` block.
- The migration on the live D1 is irreversible without a manual
  `ALTER TABLE user_profiles DROP COLUMN authorised, DROP COLUMN
  authorised_at, DROP COLUMN authorised_by;` plus dropping the index.
  But the columns are harmless even with the code reverted, so rollback
  doesn't require touching D1.
