# Architectural Decisions Journal

## 2026-06-22: Xaridotis Architecture Port & Safety Implementation

### Overview
This session focused on porting core architectural patterns from the Xaridotis reference model to Eukara, specifically emphasizing the ingress safety firewall, intelligent intent-based routing, and async subconscious processing. We also performed a migration to the Telegram Bot API 10.1 rich message methods.

### 1. The Curator Pattern & Clinical Safety Firewall
We introduced `src/ai/curator.ts` (Layer A1) to run a high-speed inference check using `@cf/meta/llama-3.2-3b-instruct` on incoming user messages. This serves as a clinical safety net.
- **Decision:** Intent triage must happen *before* any heavy processing or history loading. We updated `dispatchMessage` in `src/index.ts` to block and await the curator result immediately.
- **Firewall Integration:** If the curator flags `isCrisis: true`, a hard-cut safety layer in `src/bot/message.ts` (lines ~423-455) intercepts the request. It bypasses the standard LLM chat generation and immediately responds with a predefined clinical safety response and markup, preventing confabulation on sensitive topics.

### 2. Intelligent Routing (Pro vs. Fast Lane)
- **Decision:** We migrated the `willHitProLane` logic in `src/ai/router.ts` away from static regex matching to consume the `CuratorResult`. The system now dynamically routes analytical and emotional intents to the heavier `@cf/meta/llama-3.3-70b-instruct-fp8-fast` model, while simple casual chats default to the edge model.

### 3. Layer A0: Ingress Context Injection (Telemetry)
- **Decision:** Implemented telemetry context injection in `src/bot/message.ts`. We now look up `telemetry_${userId}` from `CHAT_KV` and prepend the user's device status (battery, network connection) to the dynamic context. This aligns with the Xaridotis A0 layer and gives the AI ambient awareness of the user's physical situation.

### 4. Domain 3: Subconscious Processing
- **Decision:** Wrapped the background observation extraction task in `src/bot/message.ts` using `ctx.waitUntil()`. This allows the heavy extraction process (which parses the conversation for new memories and triples) to run asynchronously after the main webhook response is delivered, adhering to Cloudflare Worker async best practices and Domain 3 of the Xaridotis architecture. `ExecutionContext` is now correctly threaded down from `index.ts`.

### 5. Telegram API 10.1 Rich Message Migration
- **Decision:** Upgraded `src/lib/telegram.ts` to utilize the new `sendRichMessage` and `sendRichMessageDraft` endpoints introduced in Telegram Bot API 10.1, replacing the legacy `parse_mode: 'HTML'` pattern.
- **Implementation:** `sendMessageDraft` now correctly maps to `sendRichMessageDraft`, utilizing an integer hash for the `draft_id`. This eliminates the need to manage draft message IDs in KV storage, as Telegram natively handles the animated streaming of draft edits based on the `draft_id`.

## 2026-06-22: Mood Tracker Redesign & Cloudflare Tool Schema Fix

### Overview
This session focused on fixing an infinite-loop bug that caused the AI to become unresponsive after executing tool calls. It also includes an approved implementation plan for redesigning the Mood Tracker to use natural language and a streamlined UI flow with optional photo uploads and Gemini vision analysis.

### 1. Cloudflare Workers AI Schema Fixes
- **Discovery:** The `@cf/meta/llama-3.3-70b-instruct-fp8-fast` model on Cloudflare Workers AI expects a proprietary top-level `{ name, arguments }` schema for tool calls in the message history, discarding the standard OpenAI `{ id, type, function }` format.
- **Decision:** Patched `src/ai/cloudflare.ts` to construct the correct Cloudflare tool call payload, restoring the AI's "memory" of tools it invoked.
- **Discovery 2:** The `try-catch` block inside `src/bot/message.ts` logged tool execution errors (like `react_to_message` failing with Telegram's `400 REACTION_INVALID`) but failed to append the error as a `tool_result` to the AI's internal dialogue. This violated strict schema rules and crashed the generative loop.
- **Decision:** Update `src/bot/message.ts` to pass caught errors back to the AI as a `tool_result` so the AI can gracefully handle failures instead of crashing.

### 2. Mood Tracker Redesign Plan
- **Decision:** Approved plan to remove the scheduled cron logic for mood checks and the old KV state machine.
- **Decision:** Rebuild the Mood Check workflow to trigger via `/mood` or natural language. It will use a streamlined 3-step sequence:
  1. Sleep hours (`force_reply`)
  2. Mood scale (`inline_keyboard` with predefined emojis)
  3. Optional photo upload (`inline_keyboard` with Skip button)
- **Decision:** Integrate Gemini Vision API to analyze uploaded photos, extracting a concise, friendly summary to store alongside the sleep and mood data in the long-term history.

## 2026-07-31: Direct OpenAI API Migration Approved

### Change Log

- Added `docs/architecture/openai-direct-api-migration-plan-2026-07-31.md`.
- Recorded the current hybrid Workers AI/Gemini execution paths, known media,
  Workflow, authorisation and Vectorize migration risks.
- Documented a staged migration and rollback approach. No runtime code,
  configuration, secrets, provider calls, production data or deployments were
  changed in this interaction.

### Decision Register

- **Approved by owner:** Eukara will migrate to the direct OpenAI API rather than
  Cloudflare AI Gateway.
- **Approved boundary:** Cloudflare remains the application and durability
  platform for Workers, D1, KV, R2, Vectorize, Queues and Workflows.
- **Approved scope:** migrate chat, curator, research, vision, transcription,
  speech, image generation, embeddings and reranking to direct OpenAI APIs.
- **Approved state policy:** set OpenAI `store: false`; Eukara's D1, KV and R2
  stores remain authoritative.
- **Approved routing baseline:** GPT-5.6 Luna for inexpensive high-volume work,
  GPT-5.6 Terra for the main chat and tool loop, and GPT-5.6 Sol for difficult
  research and architecture tasks.
- **Approved failure policy:** provider fallbacks remain OpenAI-only.
- **Approved vector migration:** use a blue-green Vectorize index with
  Queue-owned backfill, validation, cutover and rollback retention.
- **Implementation stage authorised:** Stage 1 may add the direct OpenAI SDK,
  model registry, provider adapter, tests and a disabled-by-default migration
  switch. Existing production routing remains unchanged until later gates pass.

### Impact Assessment

- Documentation-only change with no effect on Worker behaviour or production
  state.
- The future runtime migration will affect every AI route, tool-loop
  continuation, media flow, specialist Workflow, secret definition and semantic
  retrieval projection.
- Existing vectors and user memories must remain recoverable throughout the
  migration; an in-place embedding-model replacement is not approved.
- Added the direct OpenAI Node SDK dependency (`openai` 7.2.0). No API key,
  provider traffic or deployment has been configured.

### Traceability

- Owner instruction: “I agree with you to implement direct OpenAI API. Can you
  start working on it?”
- Owner approval: “Approve recommended baseline”.
- Architecture plan:
  `docs/architecture/openai-direct-api-migration-plan-2026-07-31.md`.

## 2026-07-31: Stage 1 OpenAI Foundation

### Change Log

- Added the direct Responses API adapter in `src/ai/openai.ts`.
- Added a central OpenAI model registry for the approved Luna, Terra and Sol
  workload tiers plus specialist audio, image and embedding models.
- Extended the provider-neutral contracts and exports for OpenAI.
- Added `AI_PROVIDER_MODE = "cloudflare"` as a disabled-by-default migration
  switch and taught the router to select OpenAI when explicitly enabled.
- Added an optional `OPENAI_API_KEY` secret type. No secret value was created,
  read or committed.
- Corrected the provider constructor and environment augmentation types found
  by the first direct TypeScript validation pass.
- Added isolated OpenAI adapter and routing regression tests. The tests mock all
  SDK calls and cover stateless requests, tool conversion, tool-loop
  continuation, images, explicit unsupported-media failure, citation
  normalisation, embeddings, stream filtering and the disabled routing default.
- Regenerated Cloudflare Worker types after adding the migration variable. The
  generated file is ignored by Git and produced no tracked diff.
- Updated the architecture plan status and decision register to reflect the
  owner's approval, and corrected provider-specific router comments.

### Decision Register

- The adapter sends `store: false` on every Responses API request.
- Direct SDK retries are disabled so later application-level fallback policy
  remains the single retry owner.
- Existing sequential tool-loop behaviour is preserved with
  `parallel_tool_calls: false`.
- Non-image inline media fails explicitly in this first adapter slice instead
  of being silently discarded. Audio and document conversion remain
  specialist-workload migration tasks.
- OpenAI web citations are normalised into Eukara's existing annotation shape
  to avoid breaking Telegram source rendering.

### Impact Assessment

- Production behaviour is unchanged because the routing switch defaults to
  `cloudflare`.
- Enabling `openai` without the `OPENAI_API_KEY` secret fails closed with a
  configuration error.
- The new provider is not yet wired into curator, background tasks,
  specialist Workflows, TTS, image generation or the Vectorize read path.
- The OpenAI SDK requires local Node.js 22 or later for supported development;
  local Node.js 26.4.0 satisfies that requirement, and the Worker dry-run
  subsequently validated bundle compatibility.
- The repository's `node_modules/.bin/tsc` wrapper is a stale regular script
  with a broken relative path, so validation uses the installed TypeScript
  entry point directly pending a dependency-directory refresh.

### Validation

- Direct TypeScript validation passed with TypeScript 6.0.2.
- The isolated OpenAI test suite passed: 1 file, 7 tests.
- The complete suite ran 22 tests: 20 passed and the same 2 pre-existing
  `Hello World!` snapshots failed because the Worker now returns `OK` and
  `Eukara is running`. These stale snapshots are unrelated to the OpenAI
  change and were not rewritten.
- Wrangler 4.107.0 produced a successful dry-run bundle: 1,387.53 KiB raw and
  240.63 KiB gzip. No deployment occurred.
- `npm audit --omit=dev` reported zero production dependency
  vulnerabilities. The install-time warning refers to development or optional
  packages outside this implementation scope.
- No live OpenAI call was attempted during Stage 1 because the secret had not
  yet been configured.

### Traceability

- Approved baseline and staged implementation:
  `docs/architecture/openai-direct-api-migration-plan-2026-07-31.md`.
- Owner approval: “Approve recommended baseline”.

## 2026-07-31: Stage 2 OpenAI Runtime Integration

### Change Log

- Added a central provider factory so services no longer construct OpenAI or
  Cloudflare clients independently.
- Added OpenAI selection for the curator, topic-shift classifier, subconscious
  extraction, mood tagging, memory deduplication, autonomous research,
  proactive check-ins and weekly synthesis.
- Made Telegram draft streaming consume the provider-neutral streaming
  interface.
- Added OpenAI-only primary-to-fallback and no-silence salvage routing when
  OpenAI mode is selected. The existing Cloudflare cascade remains intact in
  Cloudflare mode.
- Propagated the router's configured reasoning level into the main tool loop.
- Preserved complete OpenAI Responses output items across stateless tool-loop
  continuations, including reasoning and function-call items.
- Added a server-enforced owner check to `patch_repo_file`; prompt wording is no
  longer its only identity boundary.
- Added regression tests for provider-mode fail-safe behaviour, missing-secret
  failure and the GitHub mutation owner boundary.
- Replaced the stale `Hello World!` snapshots with assertions against Eukara's
  real TypeScript entrypoint. The unit test now imports `src/index.ts`
  explicitly rather than resolving the obsolete `src/index.js` sibling.
- Updated the architecture plan status to record local completion of Stages 1
  and 2.

### Decision Register

- The provider switch remains `cloudflare` until the remaining specialist
  Workflows, media services, embeddings and authorisation gates are migrated.
- OpenAI fallback uses Luna and never silently crosses to Workers AI.
- Complete model output replay is required before corresponding
  `function_call_output` items in stateless Responses tool loops.
- Weekly synthesis does not enable web search on OpenAI because its evidence is
  the supplied private Eukara data, not public web content.
- The configured `OPENAI_API_KEY` was verified by secret name only. Its value
  was not read, logged or written to disk.

### Impact Assessment

- Current production behaviour remains unchanged while
  `AI_PROVIDER_MODE = "cloudflare"`.
- OpenAI mode now consistently covers the Stage 2 routing paths changed here,
  including error recovery and streaming.
- Live OpenAI validation cannot run directly from the local shell because the
  key exists as a write-only Wrangler secret rather than a local environment
  variable. A Worker-context smoke test remains pending.

### Validation

- Direct TypeScript validation passed.
- The complete suite passed: 4 files and 27 tests.
- Wrangler dry-run passed: 1,459.17 KiB raw and 246.89 KiB gzip. No deployment
  occurred.
- Wrangler confirmed that `OPENAI_API_KEY` exists as a secret binding.

### Traceability

- Owner instruction: “Continue. I set OPENAI_API_KEY, so we can freely use it.”
- Approved migration plan:
  `docs/architecture/openai-direct-api-migration-plan-2026-07-31.md`.

## 2026-07-31: Guardrailed Autonomy Baseline

### Change Log

- Recorded the owner's standing authority for Codex to execute routine Eukara
  delivery work within the guardrails below.
- No application code, configuration, credentials, Cloudflare resources,
  production data or deployment state changed in this interaction.

### Decision Register

- **Approved autonomous actions:** modify Eukara; run local tests and live
  integration checks; create branches; stage task-related files; commit; push;
  open pull requests; deploy; perform post-deployment checks; and roll back
  failed application deployments.
- **Actions requiring explicit approval:** delete or rotate credentials;
  destructively modify production data; apply irreversible migrations; delete
  Cloudflare resources; change billing; or force-push.
- This baseline grants execution authority but does not waive the project's
  architectural pause requirement. New architectural decisions, structural
  shifts and materially ambiguous implementation choices must still be
  presented with options, implications and trade-offs before implementation.
- Staging and commits must remain limited to task-related files. Unrelated
  existing worktree changes remain user-owned and must be preserved.

### Impact Assessment

- This is a documentation-only governance change with no runtime or production
  impact.
- Future tasks can proceed through delivery and deployment without repeated
  approval when they remain inside the approved scope and an agreed design.
- Destructive, irreversible, financial and credential-management boundaries
  remain protected by an explicit approval gate.

### Traceability

- Owner instruction: “Approve guardrailed autonomy baseline. Codex may modify
  Eukara, run tests and live integration checks, create branches, stage
  task-related files, commit, push, open pull requests, deploy, perform
  post-deployment checks and roll back failed application deployments. Codex
  must not delete or rotate credentials, modify production data destructively,
  apply irreversible migrations, delete Cloudflare resources, change billing
  or force-push without explicit approval.”

## 2026-07-31: Stage 3 OpenAI Specialist and Workflow Migration

### Change Log

- Added direct OpenAI transcription, speech and image services behind the
  central provider boundary.
- Added durable Telegram media acceptance: bytes are awaited in R2, ownership
  and lifecycle state are authoritative in the new D1 `media_assets` table,
  and KV retains a 30-day fast lifecycle projection.
- Added OpenAI vision and voice-note transcription to normal messages and the
  mood wizard. Unsupported OpenAI video and document processing now fails
  visibly after safe persistence instead of silently dropping content.
- Replaced the placeholder image tool with real OpenAI image generation,
  awaited R2 persistence and checked Telegram delivery.
- Routed TTS through OpenAI in OpenAI mode and labelled the playback as an
  AI-generated voice. The Cloudflare-mode Gemini path remains available during
  migration.
- Routed architect, deep-research and memory-consolidation Workflows through
  the configured provider. Added deterministic keys, idempotent D1 inserts,
  retry-owned provider calls, checked Telegram delivery and citation retention.
- Added required Wrangler secret declarations while leaving
  `AI_PROVIDER_MODE = "cloudflare"`.
- Added pure specialist/media regression tests, a repeatable live OpenAI smoke
  harness and durable raw/conclusion evidence.
- Repaired local `npm test` and `npm run typecheck` scripts so they do not
  depend on OneDrive-damaged package-manager shim files.

### Decision Register

- D1 is the authoritative media lifecycle store. KV is only a replaceable
  projection and R2 is authoritative for accepted bytes.
- OpenAI audio uses `gpt-transcribe`; speech uses `tts-1` with `nova`; image
  generation uses `gpt-image-2` with medium-quality 1024 px PNG output.
- OpenAI deep research remains synchronous inside a retryable Cloudflare
  Workflow step. OpenAI background mode is not used because the approved
  privacy boundary requires `store: false`.
- The production provider flag stays on `cloudflare`. Stage 3 code may deploy
  dormant, but the OpenAI cutover remains blocked by the Stage 4 embedding and
  recall-quality gates.

### Impact Assessment

- In the current production mode, primary inference and the preserved Gemini
  specialist branches are unchanged. Media acceptance becomes durable for all
  provider modes and therefore requires migration `0003_media_assets` before
  deploying this code.
- OpenAI mode gains real image, vision, transcription, speech and specialist
  Workflow execution without adding provider-hosted state.
- Accepted bytes can remain in R2 if a later D1 or provider operation fails;
  deterministic keys make retry safe and prevent duplicate objects.
- Document and video inference is deliberately not enabled in OpenAI mode yet.
  The user receives a transparent failure and the accepted bytes remain owned
  by Eukara for a future document-processing stage.

### Validation

- TypeScript 6.0.2 validation passed.
- The complete automated suite passed: 6 files and 32 tests.
- Wrangler 4.107.0 dry-run passed: 1,475.75 KiB raw and 251.10 KiB gzip.
- Live OpenAI validation passed for Luna, Terra, Sol, OGG transcription, MP3
  speech and PNG image generation. No API key value was logged or committed.
- Local test warnings concern intentionally absent non-OpenAI `.dev.vars`
  values and remote-only AI/Vectorize bindings; they did not fail the suite.

### Traceability

- Owner instruction: “All set up is done, continue with the development.”
- Approved migration plan:
  `docs/architecture/openai-direct-api-migration-plan-2026-07-31.md`.
- Live evidence:
  `docs/tests/results/2026-07-31T10-24-44Z/openai-stage3-smoke.json`.

## 2026-07-31: Stage 3 Production Deployment

### Change Log

- Applied additive D1 migration `0003_media_assets.sql` to remote database
  `my-db` and verified the complete table shape on the production primary.
- Deployed feature commit `35eed89` to the Eukara Worker.
- Production version changed from
  `f7bae9fe-424d-4836-9094-216235b10d35` to
  `38ca8719-2700-4520-a4dc-157b3f832707`.
- Confirmed the public Worker endpoint returned HTTP 200 with
  `Eukara is running` after deployment.

### Decision Register

- The OpenAI production cutover remains intentionally blocked. The deployed
  `AI_PROVIDER_MODE` value is still `cloudflare` until Stage 4 finishes the
  versioned embedding projection and recall comparison.
- Version `f7bae9fe-424d-4836-9094-216235b10d35` is the application rollback
  target for this deployment. The additive D1 table contains no rows and does
  not require rollback if the Worker version is reverted.

### Impact Assessment

- Durable media persistence is active in the existing Cloudflare provider
  path. New accepted Telegram media will create an owned R2 object plus an
  authoritative D1 lifecycle row before provider processing.
- OpenAI specialist and Workflow routing is deployed but dormant. No existing
  Vectorize reads or primary model requests were switched.
- The new production table was verified empty immediately after deployment;
  no existing user data was rewritten or deleted.

### Validation

- Remote migration `0003_media_assets.sql` applied successfully.
- Remote `PRAGMA table_info(media_assets)` returned all 12 expected columns.
- Production health check returned HTTP 200 from Cloudflare LHR.
- Wrangler confirmed version `38ca8719-2700-4520-a4dc-157b3f832707` receives
  100% of traffic.

### Deployment Commit Summary

`feat(ai): complete OpenAI specialist migration`

Adds durable media ownership, specialist audio/image services and
provider-switched Workflows while retaining the Cloudflare production flag
pending the embedding cutover.

### Traceability

- Owner's guardrailed autonomy baseline dated 2026-07-31.
- Feature commit: `35eed89`.
- Migration: `migrations/0003_media_assets.sql`.

## 2026-07-31: Stage 4 Blue-Green Embedding Projection

### Change Log

- Inspected production: `my-ai-bot-memory` is a 1,024-dimension cosine index
  with 11 vectors while D1 contains 108 active memories.
- Provisioned `eukara-memory-openai-v1` as an isolated 1,536-dimension cosine
  index. Added numeric `userId` and string `embeddingVersion` metadata indexes
  before inserting any vectors.
- Added batch OpenAI embedding support with strict result-count and 1,536-
  dimension validation.
- Added Queue-owned blue-green projection tasks. New memories are dual-written
  during the rollback window, and cron schedules an idempotent D1 backfill in
  batches of 25.
- Replaced the floating Vectorize write after `saveMemory` with an awaited
  Queue enqueue. D1 remains authoritative if projection enqueueing fails.
- Added OpenAI-mode semantic search against the green index and Luna-based
  reranking with validated ID ordering. Cloudflare mode continues to use the
  existing index and reranker.
- Added automatic full reprojection after memory consolidation replaces D1
  rows.
- Added an aggregate recall evaluator that stores only counts, never private
  memory text, and blocks readiness unless every sampled memory appears in the
  OpenAI top three.
- After the first production evaluation attempt did not persist a result, added
  an independently expiring evaluation lock. Cron now recovers evaluation
  without repeating a completed backfill.

### Decision Register

- The new projection uses default 1,536-dimension
  `text-embedding-3-small` vectors and cosine distance.
- Both indexes remain write-active during the rollback observation window.
- Backfill ownership belongs to Cloudflare Queues; request handlers only await
  enqueueing and never perform unbounded projection work.
- Recall evidence uses exact-memory self-recall over ten importance-ranked
  active rows. It is a coverage/readiness gate, not a complete semantic-quality
  benchmark.
- `AI_PROVIDER_MODE` remains `cloudflare` until production coverage and recall
  results are verified.

### Impact Assessment

- No existing Vectorize resource was modified or deleted.
- Provisioning the green index creates no model cutover. Backfill will add
  OpenAI embedding usage and Vectorize stored dimensions once the updated
  Worker is deployed.
- Dual writes intentionally retain Workers AI embedding usage until the
  rollback window closes.
- The existing blue projection was already incomplete relative to D1. The
  Queue backfill repairs both projections, improving rollback coverage as well
  as preparing OpenAI retrieval.

### Validation

- Live `text-embedding-3-small` output contained exactly 1,536 dimensions.
- Vectorize reported the green index at 1,536 dimensions, zero vectors, and
  both metadata indexes active before deployment.
- TypeScript validation passed.
- The complete automated suite passed: 7 files and 40 tests.
- Wrangler dry-run passed: 1,486.87 KiB raw and 253.70 KiB gzip, with both
  Vectorize bindings resolved.

### Traceability

- Approved Stage 4 decision D5 in
  `docs/architecture/openai-direct-api-migration-plan-2026-07-31.md`.
- Current Cloudflare Vectorize create/query guidance and OpenAI embedding model
  documentation checked on 2026-07-31.
- Live evidence:
  `docs/tests/results/2026-07-31T10-33-51Z/openai-stage4-smoke.json`.

## 2026-07-31: OpenAI Production Cutover Preparation

### Change Log

- Completed blue-green production coverage: 108 active D1 memories, 108 blue
  vectors and 108 OpenAI green vectors.
- Recorded the private-data-free recall gate: both projections returned 10/10
  top-1 and 10/10 top-3 exact-memory self-recall.
- Added stateless PDF and text-file inputs using inline Responses API
  `input_file` data. Telegram filenames are preserved and accepted bytes remain
  authoritative in R2.
- Added a live PDF fixture using a 13,264-byte public test document; Terra
  returned the expected document title.
- Added a central server-side owner boundary for every mutating model tool.
  Read-only tools remain available under their existing user-scoped policies.
- Added a five-minute, message-bound `CONFIRM REPO CHANGE` record for GitHub
  writes. Repository mutation now requires both owner identity and explicit
  per-request confirmation.
- Changed the configured production target from `cloudflare` to `openai` and
  updated Eukara's self-description. Old bindings remain for rollback.

### Decision Register

- The embedding gate is accepted because green coverage equals active D1
  coverage and green recall is not worse than blue on the recorded sample.
- Direct OpenAI becomes the production inference path. The old provider and
  index remain temporarily bound but are not selected by normal model routing.
- Video inference remains a transparent unsupported case. Telegram video bytes
  are saved before the user is told that direct processing is not enabled.

### Impact Assessment

- The next deployment changes live chat, classification, tools, vision,
  transcription, document, speech, image, research, consolidation, embedding
  reads and reranking to direct OpenAI.
- Cloudflare remains the application and durability platform. Blue projection
  dual writes continue only for the rollback observation window.
- The provider switch is reversible by restoring
  `AI_PROVIDER_MODE = "cloudflare"` and redeploying; no D1 or R2 data rollback
  is required.

### Validation

- TypeScript validation passed.
- The complete automated suite passed: 7 files and 43 tests.
- Live OpenAI checks passed for Luna, Terra, Sol, embeddings, PDF input, OGG
  transcription, MP3 speech and PNG image generation.
- Production embedding coverage and recall gates passed as recorded in
  `docs/tests/results/2026-07-31T10-47-48Z/openai-cutover-smoke.json`.

### Traceability

- Owner approval: “Approve recommended baseline”.
- Owner instruction: “All set up is done, continue with the development.”
- Official OpenAI file-input guidance and Cloudflare Vectorize guidance checked
  on 2026-07-31.
