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
