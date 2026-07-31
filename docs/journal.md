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
- No live OpenAI call was attempted because `OPENAI_API_KEY` is not configured.

### Traceability

- Approved baseline and staged implementation:
  `docs/architecture/openai-direct-api-migration-plan-2026-07-31.md`.
- Owner approval: “Approve recommended baseline”.
