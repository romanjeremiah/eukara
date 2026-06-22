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
