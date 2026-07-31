# Refactor plan: Hono migration + handlers.js split (deferred, test-backed)

Status: PLANNED, not started. Deferred out of the pre-deploy batch on
2026-06-09 by Roma's decision. This is a separate effort, on its own branch,
NOT to be mixed with a deploy.

## Why this is deferred, and the one rule that governs it

`src/index.js` (2,608 lines) and `src/bot/handlers.js` (3,388 lines) are both
worth modularising. But the test suite today is three trivial cases (a
hello-world worker plus the model-constants invariant). That is not a safety
net. Moving thousands of lines with no characterisation tests means any
regression ships silently.

Governing rule: no structural move happens until there is a test that would
fail if the move broke behaviour. Phase 0 builds that net. Phases 1 and 2 do
not start until Phase 0 is green.

This plan also surfaced a live bug during the audit (now fixed): `src/ai/router.js`
called `log.info` without importing `log`, a ReferenceError on the hot path that
no test caught. Treat that as evidence for the rule above, not an exception.

## Phase 0 (gate): build the characterisation net

Goal: lock in current behaviour before changing structure. Target the seams,
not the internals.

1. Router (`src/ai/router.js::pickLayer` and the exported router): table-driven
   tests over the 14 documented routing priorities in the file header. Given a
   curator result / message shape, assert the chosen layer. This is pure logic,
   no bindings, cheap to cover, and high value (routing is the brain).
2. Formatter (`src/lib/formatter.js`): unit tests for `sanitizeTelegramHTML`,
   `normaliseMarkdown`, `enforceTagNesting`, `splitMessage`, `getOpenTags`.
   These are pure string functions with zero I/O. The splitter already has an
   ad-hoc harness from 2026-06-08b; promote it into `test/formatter.spec.js`.
3. Complexity heuristics (`src/ai/complexity.js`): `detectComplexTask`,
   `isSimpleMessage`. Pure, feed the no-curator router fallback.
4. Webhook auth (`verifyWebhook`): now fail-closed. Assert: no secret -> false;
   wrong header -> false; matching header -> true.
5. Command dispatch (`handleCommand`) and callback dispatch (`handleCallback`):
   characterise the command/callback table. SEE THE NOTE BELOW — these cannot be
   unit-tested against the current monolith and are written at extraction time.

STATUS (2026-06-09): items 1, 2, 3, 4 DONE and verified, written as
`test/router.spec.js`, `test/formatter.spec.js`, `test/complexity.spec.js`,
`test/webhook-auth.spec.js`. Pure-function assertions confirmed against the real
modules via a standalone harness (vitest cannot run in the assistant sandbox;
Roma runs `npx vitest run` for the real pass).

IMPORTANT correction to the "test everything first" idea: `handleCommand` and
`handleCallback` are NOT exported and are deeply wired to telegram / KV / stores,
so they cannot be cleanly unit-tested while they live inside the monolith. That
is the chicken-and-egg of testing a monolith. Resolution: the pure SEAMS
(routing, formatting, complexity, webhook auth) form the achievable upfront net;
dispatch coverage is written TEST-AS-YOU-EXTRACT — the moment a module is pulled
out it becomes exported and importable, and its test ships in the same commit.
Phase 1.1 (mediaIntake) already followed this pattern.

Exit criteria for the upfront net: the four pure specs pass under
`npx vitest run`. Do NOT attempt to cover Gemini calls end to end; the goal is
structural safety, not model behaviour.

## Phase 1: split handlers.js (strangler, one module at a time)

Module map reconciled with the 2026-06-09 Hono audit plan (adds contextBuilder
and observation, which are good boundaries). Order chosen by coupling, lowest
first. After EACH extraction: run Phase 0 tests, run `node --check`, deploy to a
staging worker if available, smoke-test. Only then move to the next. This is a
strangler refactor, NOT a big-bang. Do not "move everything then delete the
file"; let handlers.js shrink to a thin orchestrator and retire it only once it
is empty, so any regression is one `git revert` of a single commit.

PREREQUISITE 0 (decide before extracting anything): the shared-helper home and
the dependency direction. handlers.js has module-level state and shared helpers
(`sendLongMessage` -> formatter `splitMessage`, persona/history helpers, telegram
wrappers). Put shared helpers in a leaf module that the new modules import ONE
WAY. No module may import back up into messageRouter. This is the step the audit
plan omitted and the main source of circular-import risk.
STATUS 2026-06-09 (Phase 1.5): DONE for sendLongMessage -> `src/bot/send.js`
(leaf: depends only on lib/telegram + lib/formatter). The dispatcher modules
import sendLongMessage from there, never from handlers.js. persona/history
helpers already live in contextBuilder.js (Phase 1.2).

1. `src/bot/mediaIntake.js` <- `getMediaFromMessage` plus Telegram file download /
   size-limit / Google Files API push. Lowest coupling, pure-ish. First win.
   STATUS 2026-06-09: `getMediaFromMessage` (the pure parser) extracted, exported,
   imported back into handlers.js, and covered by `test/mediaIntake.spec.js`
   (9 cases, harness-verified). The file download / size / Files API push still
   live in handlers.js and move in a later step.
2. `src/bot/contextBuilder.js` <- `getWeatherContext`, `getCheckinRoadmap`,
   `getPersona`, `sanitizeHistory`. Prompt-context helpers, mostly pure.
   STATUS 2026-06-09: DONE. test/contextBuilder.spec.js covers the two pure ones.
3. `src/bot/observation.js` <- `silentObservation`, `saveTripleWithConflictCheck`
   (memory / F3 fact-extraction). Self-contained, runs post-reply.
   STATUS 2026-06-09: DONE via full free-variable audit (no pure surface to test).

--- BOUNDARY: items 4-7 below are the large, entangled extractions. They need
`npx vitest run` between steps (node --check misses missing-dep ReferenceErrors;
the assistant sandbox cannot run vitest). Do NOT do them blind. ---
4. `src/bot/moodFlowHandler.js` <- `handleActivitiesCallback`,
   `rerenderActivitiesKeyboard`, `labelOf`, `handlePhotoSkipCallback`,
   `handleSleepCallback`, `driveNextDeterministicStep`. The mood-poll state
   machine ONLY. NOTE: do NOT put `handleCallback` here (see callbackRouter).
   STATUS 2026-06-09 (Phase 1.4): DONE. 4 entry points exported + imported back;
   rerenderActivitiesKeyboard + labelOf kept internal. Free-variable audited,
   node --check clean. (handleCallback correctly left in handlers.js for now.)
5. `src/bot/callbackRouter.js` <- `handleCallback`. CORRECTION to the audit plan,
   which filed handleCallback under moodFlowHandler. handleCallback is the
   top-level inline-keyboard dispatcher; it routes `set_persona_`, `set_model_`,
   `confirm_forget`/`cancel_forget`, `action_voice`, `action_delete_msg`,
   `architect_kill`, `approve_pr`, `action_dismiss_pr` AND the mood callbacks.
   Filing it under mood would force moodFlowHandler to import persona, model and
   architect logic, inverting the dependency. It belongs in its own router that
   delegates only the mood cases to moodFlowHandler.
5b. `src/bot/callbackRouter.js` <- `handleCallback`.
    STATUS 2026-06-09 (Phase 1.7): DONE. 466 lines, 21 imports + handleMessage
    (call-time circular). index.js re-pointed. Free-var scan clean.
6. `src/bot/commandHandler.js` <- `handleCommand` and per-command helpers.
   STATUS 2026-06-09 (Phase 1.6): DONE. 844 lines. THERAPEUTIC_CATEGORIES moved
   with it. Call-time circular import with handleMessage. Free-var audited.
7. `src/bot/messageRouter.js` <- the core of `handleMessage`. Do this LAST.
   STATUS 2026-06-09: handleMessage is ALREADY isolated as the core of
   handlers.js (everything else extracted). The remaining work is an OPTIONAL
   rename handlers.js -> messageRouter.js plus updating every `./bot/handlers`
   importer (index.js, commandHandler, callbackRouter). A wrong import path
   passes node --check but fails at bundle/runtime, so do this ONLY with
   `npx vitest run` to verify. Low value (cosmetic); the decomposition goal is
   already met. handlers.js is ~1435 lines (was ~3400).

`sendLongMessage` lives in the shared home (it is used by command, callback, and
message paths). `formatter.js` remains canonical for `splitMessage`/`getOpenTags`.

## Phase 2: migrate index.js to Hono

STATUS 2026-06-09: DONE. The fetch handler was restructured into a single Hono
app in-place (not split into route files - kept simpler). Body-preserving
transform: every route body is verbatim, paths identical, only the dispatch layer
changed. app.use=wrapD1 preamble, app.onError=global crash handler, 11 app.get
routes, app.post('*')=webhook (verify gate kept), app.all('*')=OK fallback.
queue/scheduled untouched. hono@^4.12.25 added to package.json (run `npm install`).
MANDATORY: staging-deploy + hit every endpoint before production - vitest does
not exercise routes.

Hono is a reasonable choice, but it is an opinion, not a requirement; the manual
router works. Do this only after Phase 1, and route-group by risk. The audit's
route files (`src/routes/webhook.js`, `admin.js`, `testing.js`) are a fine split.

CRITICAL - preserve existing URL paths. The audit plan proposed
`app.route('/admin', adminRouter)` and `app.route('/test', testingRouter)`, which
RENAMES every endpoint (`/register-commands` -> `/admin/register-commands`,
`/test-workflow` -> `/test/...`). These are live operator URLs; `/setup-webhook`
in particular registers the Telegram webhook, and `/maintenance/*`,
`/reindex-vectors` may be hit by cron or scripts. Renaming them silently breaks
those callers. Either mount the routers so the absolute paths are unchanged
(register each route at its current full path), or migrate and re-point EVERY
caller plus re-register the webhook. Default: keep paths identical.

1. Add Hono, mount `app` inside the existing `fetch` export. Migrate the
   low-risk GET admin/maintenance/testing routes first (paths unchanged):
   `/register-commands`, `/sync-commands`, `/test-workflow`, `/test-queue`,
   `/test-research`, `/reindex-vectors`, `/maintenance/*`, `/cleanorphans`,
   `/setup-webhook`, `/debug/cf-gemini`. Operator tools; regressions are visible
   and non-customer-facing.
2. Migrate the main `POST /` webhook path LAST. Implement `verifyWebhook` as Hono
   middleware that 401s on failure (same behaviour as today, now fail-closed).
3. Leave `queue()` and `scheduled()` as-is; Hono is HTTP routing only. Optionally
   factor their bodies into `src/cron/` and `src/queue/` later, independent of Hono.
4. Confirm `hono` is compatible with the installed `@cloudflare/vitest-pool-workers`
   0.16.x / vitest 4 toolchain before committing to it.

## Decisions already actioned (2026-06-09b, were deferred here)

- maxOutputTokens caps: DONE. Removed from every non-Anthropic tier across
  cascades, short-response, inline, and the OpenAI workflow tiers. Anthropic
  tiers keep explicit max_tokens (API-required; provider defaults to 2048 if
  omitted, which would truncate the 4000/8000 background tiers). Debug ping kept.
  Brevity now enforced by prompt, not a hard cap. Watch greeting/inline length
  in logs after deploy.
- Media caching hack: DONE. Dropped the `hasMedia` bypass at both setupCache
  sites; `fileSearchTool` bypass kept. The cache is text-only (system prompt),
  so media turns can reuse it. STILL NEEDS the post-deploy multimodal check
  (send image + audio, confirm no `400 INVALID_ARGUMENT`); if it 400s, restore
  the `hasMedia` bypass.

## Sequencing and rollback

- One concern per commit. Each extraction is its own commit with the Phase 0
  suite green, so `git revert` of a single commit cleanly backs out one module.
- Never combine a structural refactor commit with a behavioural change.
- Do not deploy mid-phase. Deploy only at phase boundaries with the suite green
  and a manual smoke test (text message, media message, a command, a mood-poll
  callback).
