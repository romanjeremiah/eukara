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

## 2026-07-31: Direct OpenAI Production Cutover

### Change Log

- Committed the reproducible release candidate as `e109ff2` with
  `AI_PROVIDER_MODE = "openai"`.
- Deployed Worker version `cc80dcb3-d3a9-4702-9d93-81682e4e9706` with the
  OpenAI provider flag resolved in the production binding manifest.
- Preserved version `277ce8ac-82d6-4bab-afac-1ec965390bee` as the immediate
  code/configuration rollback target.
- Verified `https://eukara.roman-jeremiah.workers.dev/health` returned HTTP 200
  with body `OK` after deployment.

### Decision Register

- The production cutover is complete, but the rollback observation window
  remains open. Legacy model bindings and the blue Vectorize projection must
  not be removed until production behaviour, latency and cost are reviewed.
- No synthetic Telegram webhook was injected into production because doing so
  could create user-visible messages or state. Endpoint-specific OpenAI live
  evidence and the non-mutating Worker health check form the release gate.

### Impact Assessment

- Normal production inference now selects the direct OpenAI adapter and the
  OpenAI Vectorize projection.
- Blue projection dual writes continue temporarily and therefore retain some
  Workers AI embedding usage during the rollback window.
- Rollback does not require a database or media restoration because D1 and R2
  remain authoritative and both vector projections are current.

### Validation

- Generated Cloudflare types resolve `AI_PROVIDER_MODE` to `"openai"`.
- TypeScript passed, 7 test files and 43 tests passed, and the deployment
  dry-run passed at 1,489.47 KiB raw and 254.42 KiB gzip.
- The deployed bundle completed with a 9 ms Worker startup time and HTTP 200
  post-deployment health result.

### Traceability

- Approved baseline: direct OpenAI API with Cloudflare retained as the
  application and durability platform.
- Release commit: `e109ff2 feat(ai): switch production routing to OpenAI`.
- Rollback version: `277ce8ac-82d6-4bab-afac-1ec965390bee`.

## 2026-07-31: Classic Telegram Conversation Rendering

### Change Log

- Restored classic `sendMessage` and `editMessageText` HTML payloads for
  persistent Eukara conversation.
- Retained Rich Messages only for ephemeral streaming drafts.
- Changed leaked Markdown headings to normal paragraph text instead of bold
  labels and tightened the persona typography rules around sparse emphasis.
- Added regression coverage for send, edit and heading-normalisation behaviour.

### Decision Register

- The owner approved the proposed classic-conversation rendering correction.
- Model routing and reasoning effort remain unchanged pending a separate
  architectural decision.
- Governed-memory design remains proposal-only pending a lifecycle and evidence
  policy decision; no production memory rows or schemas were changed.

### Impact Assessment

- Persistent messages return to the previous normal-size Telegram renderer.
- Existing HTML emphasis, code, links, spoilers, blockquotes, reply markup and
  message effects remain supported.
- No model, D1, KV, R2, Vectorize, Queue or Workflow behaviour changes.

### Validation

- `npm run typecheck`: passed.
- `npm run deploy:dry-run`: passed; Wrangler produced a 270.21 KiB gzip
  production bundle with the expected bindings.
- Direct compiled contract check: passed for classic send/edit payloads, HTML
  parse mode, disabled link previews, absence of `rich_message`, and plain-text
  heading normalisation.
- `npm run test:run`: 23 assertions passed in the locally started pools. Five
  Cloudflare Worker pools could not start because the remote preview API
  returned malformed responses and HTTP 522 errors; no test assertion failed.
- `git diff --check`: passed.

### Deployment

- Release commit: `a4007ad fix(telegram): restore classic conversation
  rendering`.
- Three deployment attempts stopped before upload because Cloudflare's service
  endpoint returned HTTP 525, HTTP 521 and HTTP 523 malformed responses.
  Production was not changed by any attempt.
- The last confirmed production version remains
  `cc80dcb3-d3a9-4702-9d93-81682e4e9706`; the immediate rollback version
  remains `277ce8ac-82d6-4bab-afac-1ec965390bee`.

### Traceability

- Owner instruction: “I agree with your proposal, please implement”.
- Architecture record:
  `docs/architecture/telegram-conversation-rendering-2026-07-31.md`.
- Current Telegram Bot API and Cloudflare Workers guidance checked on
  2026-07-31.

## 2026-07-31: Governed Memory v1 Discovery

### Change Log

- Completed a read-only source and production aggregate audit of Eukara memory.
- Added a proposal-only governed-memory architecture record; no memory runtime,
  schema, projection or production data was changed.
- Production contains 108 active generic memories. Of these, 81 are automatic
  `implicit_mood`, `episode_topic` or `personality_trait` records, representing
  75% of the active set.

### Decision Register

- Memory implementation is paused at the architectural boundary until the
  owner chooses confirmation, review-surface and legacy-migration policies.
- Recommended baseline: evidence-backed explicit first-person facts may be
  confirmed; inferred or sensitive claims remain candidates; legacy rows enter
  the governed store as `legacy_unverified`.

### Impact Assessment

- The audit read aggregate counts only and wrote no production rows.
- The proposal preserves D1 authority, treats Vectorize as a disposable
  projection, and retains the legacy path during shadow rollout.
- The present delete-and-reinsert consolidation Workflow is identified as a
  containment priority because it can lose provenance and rows outside its
  bounded input.

### Traceability

- Owner instruction: build better memory for Eukara using the governed-memory
  direction proposed for Xaridotis.
- Architecture record:
  `docs/architecture/governed-memory-v1-plan-2026-07-31.md`.
- Current OpenAI and Cloudflare D1, Queues and Vectorize guidance checked on
  2026-07-31.

## 2026-07-31: Approved OpenAI Routing and Governed Memory Implementation

### Change Log

- Implemented the approved OpenAI routing matrix: Luna High for short casual
  conversation, Luna Medium for curator and simple tool actions, Terra Medium
  for substantive and emotional conversation, Terra High for code, and Sol
  High for research and architecture.
- Added strict Responses API structured output for the curator, explicit
  grounding decisions and a narrow deterministic crisis fallback.
- Added additive governed-memory assertion, evidence, outbox, projection and
  consolidation-proposal schemas plus a `legacy_unverified` import.
- Added evidence-supported capture policy, Telegram review controls,
  correction and forgetting, confirmed-only recall, idempotent Queue
  projection, stale-outbox recovery and vector tombstoning.
- Removed inferred mood, episode-topic and personality-trait promotion into
  active generic memory. Legacy rows remain preserved but do not enter live
  conversation when governed recall is enabled.
- Disabled consolidation by default and replaced its delete-and-reinsert path
  with a Sol Medium, source-cited, proposal-only Workflow.
- Added `memoryKind` metadata-index creation requests to the OpenAI and
  Cloudflare Vectorize projections for pre-top-K governed recall filtering.

### Decision Register

- Owner-approved final routing changes: curator Luna Medium and casual
  conversation Luna High. Previously approved substantive Terra Medium lanes
  remain unchanged.
- Owner approved all four governed-memory boundaries: evidence-backed explicit
  standard facts may auto-confirm; sensitive or inferred claims remain
  candidates; Telegram review controls are required; legacy rows are
  `legacy_unverified`; destructive consolidation is feature-gated immediately.
- D1 remains authoritative and Vectorize remains a disposable projection.

### Impact Assessment

- The routing change favours conversational quality on short social turns but
  Luna High may use more reasoning tokens than Luna Medium or Terra Low. Route
  telemetry and representative evaluations are required before optimisation.
- Governed recall intentionally removes unverified legacy facts from live
  context. Historical continuity will return progressively as the user reviews
  `/memories`; rollback is the recall feature flag, not a data rewrite.
- Schema changes are additive. Production imported 108 preserved legacy rows
  as `legacy_unverified`; no row was confirmed, rewritten or deleted.
- Vectorize metadata-index creation is additive and asynchronous. Deployment
  remains gated until both indexes report ready.

### Validation

- `npm run typecheck`: passed.
- `npm run test:unit`: 3 files and 19 tests passed.
- `npm run test:run`: 9 files and 52 tests passed. Vitest delayed shutdown
  after completion, but no assertion failed.
- Fresh local D1 migration and idempotent re-application: passed with a clean
  foreign-key check.
- Final `npm run deploy:dry-run`: passed at 1,714.63 KiB raw and
  277.50 KiB gzip.
- `git diff --check`: passed.

### Deployment

- Added and verified the `memoryKind` String metadata index on both active
  Vectorize projections.
- Recorded pre-migration D1 Time Travel bookmark
  `0000020b-00000008-000050b9-965eb4b63825d9f79dc7198e8b46ffb5`.
- Applied migration 0004. Production contains 108 `legacy_unverified`
  imports, no pending migration and no foreign-key violation.
- Deployed Worker version `4be59b4d-70ee-4400-8894-2008140751ad` with 9 ms
  startup time and confirmed `Eukara is running` from the health endpoint.
- Confirmed the deployed consolidation flag is `false`; capture, governed
  recall and governed projection flags are `true`.

### Traceability

- Owner instruction: curator Luna Medium, casual Luna High, approve all four
  governed-memory boundaries and immediately gate destructive consolidation.
- Architecture records:
  `docs/architecture/openai-model-routing-v1-2026-07-31.md` and
  `docs/architecture/governed-memory-v1-plan-2026-07-31.md`.
- Migration record: `docs/migrations/0004-governed-memory-v1.md`.
- Current OpenAI and Cloudflare official guidance checked on 2026-07-31.

## 2026-07-31: Casual Conversation Route Changed to Terra Low

### Change Log

- Changed the short casual conversation lane from GPT-5.6 Luna High to
  GPT-5.6 Terra Low.
- Preserved curator Luna Medium, simple functional Luna Medium, substantive
  and emotional Terra Medium, code Terra High, and research/architecture Sol
  High.
- Updated the routing contract tests and architecture record.

### Decision Register

- The owner delegated the Terra Low versus Terra Medium decision based on
  current official OpenAI recommendations, conversational quality and latency.
- Terra Low is selected because OpenAI positions Terra as the
  intelligence-and-cost balance and Low as the latency-sensitive reasoning
  setting. The omitted/default effort is Medium.
- Substantive, nuanced, reflective, health and emotional turns continue to be
  promoted to Terra Medium, so Low is restricted to genuinely simple casual
  exchanges.

### Impact Assessment

- Simple casual turns should have lower reasoning latency than Terra Medium
  while retaining Terra's stronger base capability compared with Luna.
- The change does not affect memory, tools, reminders, crisis handling,
  grounding, D1, Vectorize, Queues, Workflows or Telegram rendering.
- Streaming remains restricted by the `default_casual` route reason, so sharing
  the Terra model identifier with substantive routes does not widen streaming.

### Validation

- `npm run typecheck`: passed.
- `npm run test:unit`: 3 files and 19 tests passed.
- `npm run test:run`: 9 files and 52 tests passed. Vitest emitted its known
  delayed-close warning after every assertion passed.
- `npm run deploy:dry-run`: passed at 1,714.63 KiB raw and 277.50 KiB gzip.
- `git diff --check`: passed.
- Initial sandboxed Wrangler attempts were blocked by diagnostic-log and
  localhost permissions; scoped reruns passed, confirming a harness constraint
  rather than an application failure.

### Deployment

- Deployed Worker version `870701dd-ca5a-4d2c-bc7e-8b870b049433` with 10 ms
  startup time.
- Confirmed the production health response: `Eukara is running`.

### Traceability

- Owner instruction: choose and implement the best casual-chat option based on
  official documentation, with quality and low latency as the priorities.
- Official source:
  `https://developers.openai.com/api/docs/guides/latest-model`.
- Architecture record:
  `docs/architecture/openai-model-routing-v1-2026-07-31.md`.

## 2026-07-31: Persona Parity Audit and Authorised GitHub Push

### Change Log

- Pushed the owner-authorised commit `317328b` on branch
  `feat/a1-persona-instructions` to the configured GitHub origin.
- Completed a read-only comparison of the live persona composition paths in
  Eukara and Xaridotis. No runtime persona code or production state was changed.
- Confirmed that Eukara still exposes Base Eukara, Luna, Socrates and Nova as
  selectable persona identities, while Xaridotis now uses one fixed identity
  with adaptive internal register and clinical layers.

### Decision Register

- Persona implementation is paused at an architectural boundary pending the
  owner's choice between exact single-persona parity and retaining Eukara's
  user-selectable personas.
- Recommended direction: preserve the Eukara name and OpenAI model stack, but
  adopt Xaridotis's one-persona architecture, current immutable core, warm-only
  clinical directive and evolving style-card layer.
- The disabled Xaridotis governed persona-directive feature is excluded from
  the proposed port until its evidence, review and activation gates are ready.

### Impact Assessment

- Eukara's prompt text is based on the older 2026-06-06 cross-product port and
  has since drifted from Xaridotis's 2026-07-10 persona architecture.
- The Eukara `style_card` column exists but is not parsed or injected by the
  current system-prompt builder, so its documented evolving layer is inactive.
- Eukara's exported casual-register directive is not wired into prompt
  composition. Route reasons currently select only the Luna clinical overlay
  and Socrates code overlay when no manual persona override exists.
- Removing selectable personas would change `/persona`, callback handling and
  existing `active_persona_*` KV behaviour. This requires an explicit migration
  and compatibility decision rather than a prompt-only edit.

### Traceability

- Owner instruction: push commit `317328b`, compare Xaridotis and Eukara again,
  and align Eukara's persona instructions and logic with Xaridotis.
- Current OpenAI prompt guidance and Cloudflare Workers best practices were
  checked on 2026-07-31.
- Compared Eukara `src/config/personas.ts`, `src/services/persona.ts`, command
  and callback paths against Xaridotis `src/config/persona/*`,
  `src/services/persona.js`, `src/services/personaStore.js` and the live message
  composition path.

## 2026-07-31: OpenAI-native Adaptive Eukara Persona Implemented

### Change Log

- Replaced the selectable Base, Luna, Socrates and Nova identity system with one
  immutable Eukara identity and four current-turn registers: casual, warm,
  technical and urgent.
- Split the persona source into immutable core and conditional clinical modules,
  while retaining `src/config/personas.ts` as a compatibility export.
- Extended the OpenAI curator structured-output contract with `register` and up
  to five length-bounded `activeConstraints` values. Added deterministic
  normalisation for crisis, emotional and code intent conflicts.
- Added strict style-card parsing. Existing scalar delivery controls remain
  compatible, but free-text legacy notes, inferred traits and interests no
  longer enter the system prompt.
- Escaped current user text, profile name, dynamic context and active constraints
  before placing them inside prompt XML structures.
- Retired the persona selector from Telegram's registered command list. The
  `/persona` compatibility command and old callback buttons clear only the
  requesting user's obsolete KV override and explain adaptive behaviour.
- Replaced the old crisis copy with a deterministic UK support response covering
  NHS 111, Samaritans 116 123, SHOUT to 85258 and 999 or A&E.
- Corrected the registered `/mood` description to match the live guided 1-5
  check-in rather than the obsolete 0-10 wording.
- Added architecture, test evidence and conclusion records under the required
  `docs/architecture` and `docs/tests` structure.

### Decision Register

- The owner approved Option 1: one adaptive Eukara identity, with Luna, Terra and
  Sol reserved for OpenAI model routing rather than user-facing personas.
- Eukara preserves its own name, direct OpenAI routing, actual tool set, compact
  Telegram formatting and live 1-5 mood scale while adopting Xaridotis's fixed
  core, conditional clinical layer, manipulation boundaries, literal-first
  discipline and closed-loop interaction logic.
- Historical `active_persona_*` KV values remain inert for rollback and are not
  bulk-deleted. Governed persona directives remain disabled.
- Durable personal claims may enter the prompt only through governed memory.
  Legacy inferred persona text remains stored but has no instruction authority.

### Impact Assessment

- User-visible identity is now consistent across casual, emotional, technical
  and crisis conversations. Register changes happen internally without persona
  announcements.
- Prompt latency loses one KV read and gains no additional model call. Curator
  output is slightly larger but bounded.
- The clinical prompt cannot leak into casual or technical turns through a
  manual persona override. Emotional and crisis classifications deterministically
  force compatible registers after structured-output parsing.
- No D1 schema, Worker binding, queue ownership, model-routing tier or production
  state changed. Existing scalar proactivity behaviour used by cron is preserved.

### Validation

- `npm run typecheck`: passed.
- `npm run test:unit`: 4 files and 26 tests passed.
- `npm run test:run`: 10 files and 59 tests passed. Vitest emitted its known
  delayed-close warning after every assertion passed.
- `npm run deploy:dry-run`: passed at 1,695.77 KiB raw and 269.03 KiB gzip.
- `git diff --check`: passed.
- The complete implementation diff was reviewed. The user's unrelated tracked
  `.DS_Store` deletions remain untouched and outside the implementation scope.

### Traceability

- Owner approval: "Yes, proceed with option 1, please."
- Architecture record:
  `docs/architecture/openai-native-persona-alignment-2026-07-31.md`.
- Test evidence:
  `docs/tests/results/2026-07-31-persona-alignment.txt` and
  `docs/tests/conclusions/2026-07-31-openai-native-persona-alignment.md`.
- Official guidance checked on 2026-07-31: OpenAI GPT-5.6 model prompting,
  Cloudflare Workers best practices, Telegram Bot API `setMyCommands` and NHS
  urgent mental-health support routes.

## 2026-07-31: Telegram Webhook Authentication Implemented

### Change Log

- Added pre-parse authentication for Telegram webhook POST requests using the
  official `X-Telegram-Bot-Api-Secret-Token` header.
- Added fixed-length SHA-256 hashing and Workers' constant-time comparison for
  the supplied and configured secret values.
- Removed the executable public `/setup-webhook` and `/register-commands`
  handlers. Both legacy paths now return HTTP 404.
- Added a local Telegram administration script for secure webhook registration,
  command-menu registration and non-secret configuration status.
- Set `drop_pending_updates` to `false` in the new registration path.
- Declared `TELEGRAM_WEBHOOK_SECRET` as a required Cloudflare secret and
  regenerated Worker binding types.
- Replaced the outdated setup guide and added architecture, raw test evidence
  and test conclusions for the authenticated webhook flow.

### Decision Register

- The owner approved Option A: a Telegram webhook secret, no public maintenance
  endpoints, and local terminal-owned webhook and command registration.
- Authentication must precede JSON parsing and owner-ID authorisation because
  the Telegram user ID inside an unauthenticated body is not trustworthy.
- The production rollout uses a zero-gap order: store the secret, configure
  Telegram to send it, deploy the validating Worker, then verify status.
- Secret creation and production mutation remain owner-operated. The assistant
  did not generate, store, register, commit or deploy a production secret.

### Impact Assessment

- Forged webhook requests can no longer reach message dispatch, queues, model
  calls, memory writes or owner-only tools without the independent secret.
- Legitimate requests add only two bounded SHA-256 operations and a constant-time
  comparison.
- A missing Worker secret fails closed with HTTP 503. An incorrect or missing
  request header returns HTTP 401 without parsing the request body.
- No database or storage migration is required. Existing pending Telegram
  updates are preserved during registration.

### Validation

- `npm run cf-types`: passed and generated the new secret binding.
- `npm run typecheck`: passed.
- `npm run test:unit`: 4 files and 26 tests passed.
- `npm run test:run`: 10 files and 63 tests passed. Vitest emitted its existing
  delayed-close warning after all assertions passed.
- `npm run deploy:dry-run`: passed at 1,695.05 KiB raw and 268.90 KiB gzip.
- `node --check scripts/telegram-admin.mjs`: passed.
- `git diff --check`: passed.
- The Workers-runtime tests cover missing and matching secret headers plus both
  retired public administration paths.

### Traceability

- Owner approval: "I agree with the option A."
- Architecture record:
  `docs/architecture/telegram-webhook-authentication-2026-07-31.md`.
- Test evidence:
  `docs/tests/results/2026-07-31-telegram-webhook-authentication.txt` and
  `docs/tests/conclusions/2026-07-31-telegram-webhook-authentication.md`.
- Official guidance checked on 2026-07-31: Telegram Bot API `setWebhook`,
  Cloudflare Workers secrets, Web Crypto and Worker best practices.

## 2026-08-01: Adaptive Eukara Persona Finalised

### Change Log

- Routed spontaneous outreach, weekly reflections and guided mood-check-in
  synthesis through the canonical adaptive persona composer.
- Assigned the casual register to non-clinical spontaneous outreach and the
  warm register to weekly and mood reflections, with bounded task, tone and
  boundary constraints for each flow.
- Removed duplicated generic-friend and partial base-persona prompts from those
  secondary generation paths.
- Restricted persona-config updates to validated scalar delivery controls.
  Historical free-text interests, notes and inferred traits remain stored but
  cannot be updated through this service or gain prompt authority.
- Removed unused mood and episode inference fields from background observation
  output while preserving reviewable knowledge-graph and personality-trait
  candidates behind governed-memory capture.
- Corrected remaining generated mood context from a 1-10 label to the live 1-5
  product scale.
- Deleted the inactive `src/index.js` legacy Worker, which contained the retired
  KVN persona and an embedded Telegram bot token. Wrangler continues to execute
  `src/index.ts`.
- Added architecture, unit-test, raw validation and conclusion records under
  the required `docs` structure.

### Decision Register

- The owner's instruction to "finish persona adjustments for Eukara" completes
  the already approved one-identity adaptive-persona architecture. It does not
  authorise automatic style evolution, governed persona-directive activation,
  a new model-routing tier or a database migration.
- Product-specific tasks express their narrow response requirements through
  active constraints. Identity, formatting and clinical rules retain one
  canonical source.
- The inactive credential-bearing file must not remain in the current tree.
  Deletion does not remediate Git history, so the Telegram bot token requires
  owner-operated revocation and replacement.
- Git-history rewriting and production deployment remain outside this change.

### Impact Assessment

- All user-visible model-generated conversation now inherits Eukara's immutable
  identity, validated style card, current register and formatting rules.
- Casual outreach cannot acquire clinical framing. Reflective flows receive the
  clinical layer without turning into diagnoses or generic therapy scripts.
- No D1 schema, binding, queue contract, model route, reasoning tier, Telegram
  API or production state changed.
- Secondary generation adds no model call. The persona composer adds a parallel
  profile and persona-config read where those paths previously used static text.
- The current tracked-file credential scan is clean, but the historical bot
  token remains a security risk until rotation is complete.

### Validation

- `npm run typecheck`: passed.
- `npm run test:unit`: 4 files and 28 tests passed.
- `npm run test:run`: 10 files and 65 tests passed. The Workers harness emitted
  its existing missing legacy-secret, remote-binding and delayed-close warnings
  after all assertions passed.
- `npm run deploy:dry-run`: passed at 1,694.96 KiB raw and 268.57 KiB gzip.
- `git diff --check`: passed.
- A tracked-file Telegram token-shape scan returned no matches.
- The user's seven unrelated tracked `.DS_Store` deletions remain untouched and
  outside the implementation scope.

### Traceability

- Owner instruction: "Can you now finish persona adjustments for Eukara?"
- Architecture record: `docs/architecture/persona-finalisation-2026-08-01.md`.
- Test evidence: `docs/tests/results/2026-08-01-persona-finalisation.txt`.
- Test conclusion:
  `docs/tests/conclusions/2026-08-01-persona-finalisation.md`.
- Official guidance checked on 2026-08-01: OpenAI GPT-5.6 prompting best
  practices, Cloudflare Workers best practices and Telegram bot-token security
  guidance.

## 2026-08-03: Telegram Inline-Link Formatting Repaired

### Change Log

- Extended the shared `normaliseMarkdown()` pipeline to convert model-emitted
  Markdown web links into compact Telegram HTML anchors.
- Added URL validation for HTTP and HTTPS destinations and escaped both the
  quoted URL attribute and uncontrolled link label.
- Stashed converted anchors until other Markdown passes complete, preventing
  underscores in paths and OpenAI tracking query parameters from becoming
  accidental italic markup.
- Removed redundant outer parentheses from the citation shape shown in the
  owner's screenshot.
- Preserved Markdown-looking links inside code spans and existing Telegram HTML
  anchors.
- Added architecture, regression-test, raw-result and conclusion records.

### Decision Register

- The repair belongs in the existing shared rendering boundary rather than a
  provider-specific OpenAI or Telegram-send branch.
- The dedicated grounding-source block remains unchanged because it already
  emits correct Telegram HTML.
- Malformed and unsupported destinations remain visible instead of being
  silently converted to a different target.

### Impact Assessment

- Inline sourced links now display as one readable clickable label rather than
  the label followed by a full tracking URL.
- The fix applies consistently to normal replies, proactive outreach and weekly
  reflections that use the shared normaliser.
- Runtime work remains a bounded linear text transformation. No prompt, model
  route, API, binding, database, queue or production state changed.
- The user's seven unrelated `.DS_Store` deletions remain untouched.

### Validation

- `npm run typecheck`: passed.
- `npm run test:unit`: 4 files and 33 tests passed.
- `npm run test:run`: 10 files and 70 tests passed. The existing Workers test
  harness warnings appeared after all assertions completed successfully.
- `npm run deploy:dry-run`: passed at 1,696.11 KiB raw and 268.87 KiB gzip.
- `git diff --check`: passed.
- Regression coverage includes the screenshot's parenthesised OpenAI link,
  query separators, URL underscores, unsafe label characters, code spans and
  existing HTML anchors.

### Traceability

- Owner instruction: "Can you retry to fix the issue?"
- Architecture record:
  `docs/architecture/telegram-inline-link-formatting-2026-08-03.md`.
- Test evidence:
  `docs/tests/results/2026-08-03-telegram-inline-link-formatting.txt`.
- Test conclusion:
  `docs/tests/conclusions/2026-08-03-telegram-inline-link-formatting.md`.
- Official guidance checked on 2026-08-03: Telegram Bot API HTML formatting,
  Cloudflare Workers best practices and latest Workers type definitions
  (`@cloudflare/workers-types` 5.20260801.1).
