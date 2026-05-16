# 2026-06-02: Pro-lane migration, always-on grounding, bug pass

Status: implemented, not deployed. Roma to run `npx wrangler deploy
--minify` after review.

## Summary

Three intertwined changes plus a bug pass:

1. **Pro slot migration**: `gemini-2.5-pro` → `gemini-3.5-flash`. The
   key motivation is tool combination: 3.5-flash is in the Gemini 3
   family and supports built-in tools (Google Search) coexisting with
   custom function declarations on the same call. 2.5 Pro cannot.

2. **Always-on grounding**: Google Search on the Pro lane (Decision A)
   and `web_search_options` on the Gemma casual lane (Decision B).
   "Always on" means "always available, model decides per turn"; the
   model is not forced to search.

3. **Bug pass**: F1 to F7 plus the workflow drift on hardcoded model
   names and `chat_id` vs `user_id` D1 keying.

End-to-end streaming with tool loops (C3) is **deferred** to its own
session because rushing it ships bugs.

## Sources

- Gemini 3.5 Flash model card:
  https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash
  (last updated 2026-05-19)
- What's new in Gemini 3.5 Flash:
  https://ai.google.dev/gemini-api/docs/whats-new-gemini-3.5
- Google Search grounding:
  https://ai.google.dev/gemini-api/docs/google-search
- Tool combination (Gemini 3 only):
  https://ai.google.dev/gemini-api/docs/tool-combination
- Gemma 4 26B-A4B-IT API schema:
  https://developers.cloudflare.com/ai/models/@cf/google/gemma-4-26b-a4b-it/
- Nano Banana 2:
  https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-image
- Telegram Bot Features:
  https://core.telegram.org/bots/features

## Decision detail

### Pro slot: gemini-3.5-flash, thinking default

Roma's instruction: "For Pro slot we will use gemini-3.5-flash
(thinking level default, let the model decide)".

Implementation:
- `GEMINI_MODELS.pro = 'gemini-3.5-flash'`
- Router emits `thinkingEffort: 'dynamic'` on Pro routes. Per
  `convertThinking()` in `gemini.ts`, 3.x family with effort `dynamic`
  returns `undefined`, leaving the model to decide.
- Pro-lane cascade Tier 2 (`flashLite`) also becomes `gemini-3.5-flash`
  per Roma's decision. Tier 2 becomes effectively a retry of the same
  model. Accepted simplification; if outages bite we'll add a different
  Tier 2 (e.g., `gemini-3.1-flash-lite`).

Trade-offs Claude flagged and Roma accepted:
- 3.5-flash is a "Flash" model, not a "Pro" model. Therapeutic depth
  may be lower than 2.5 Pro on long emotional turns.
  Mitigation: Pro-lane bench harness queued for a follow-up session.
- 2.5 Pro had per-prompt search billing. 3.5-flash uses per-query
  billing (each search the model executes). For most turns the model
  won't search, so net cost is lower.

### Decision A: always-on grounding on the Pro lane

Roma's instruction: "Decision A (Gemini Pro grounding) - Migrate to
gemini-3.5-flash". This is the A3 path Claude described.

Implementation in `gemini.ts`:
- New `enableGrounding` flag in `AIProviderConfig`. When true, the
  provider prepends `{googleSearch: {}}` to the tools array.
- When grounding is enabled AND custom function declarations exist,
  sets `toolConfig.includeServerSideToolInvocations: true` per the
  tool-combination docs.
- `parseResponse` now captures `candidates[0].content` (raw, with
  parts) and exposes it via `AIResponse._geminiRawContent`. Used by
  `message.ts` to feed the model's previous raw output back on the
  next loop iteration, preserving `thoughtSignature` fields the model
  needs to maintain context.
- `convertMessages` checks for `_rawProviderParts` on each AIMessage
  and passes them straight through when present, skipping the standard
  text/inline_data conversion. This is how the in-turn tool loop
  preserves thought signatures.
- Grounding response metadata (`groundingMetadata` with
  `webSearchQueries`, `groundingChunks`, `groundingSupports`) is
  captured via `AIResponse._groundingMetadata` and rendered as inline
  citation links in `message.ts`.

### Decision B: always-on web_search_options on Gemma

Roma's instruction: "Decision B (Gemma always-on web_search_options) -
YES".

Implementation in `cloudflare.ts`:
- New `enableGrounding` flag in `AIProviderConfig`. When true on the
  Gemma route, adds `web_search_options: {search_context_size:
  'medium', user_location: {type: 'approximate', approximate:
  {country: 'GB', timezone: 'Europe/London'}}}` to the payload.
- Response `annotations[].url_citation` are parsed and exposed via
  `AIResponse._annotations`. `message.ts` renders them as numbered
  footnote links appended to the message body.
- Only enabled on Gemma 4 (`useOpenAICompat` + `supportsGrounding`
  flag). Code/analytical routes (Qwen3 30B) and the Pro-lane Tier 3
  fallback (Kimi K2.6) do not get grounding because their schema
  support is unverified.

### Decision C: end-to-end streaming, DEFERRED

Roma's instruction: "Decision C (streaming): C3. End-to-end including
tool loops."

Claude flagged this as a multi-hour rewrite with its own architectural
decisions to lock down:
- Throttle interval for `editMessageText` (Telegram flood limit kicks
  in around 1 edit/sec per chat; 30/sec hard limit globally).
- Buffer semantics: how much text accumulates before flushing.
- First chunk sent via `sendMessage`, subsequent chunks edit. What
  happens at the 4096-character boundary mid-stream.
- Mid-stream tool calls: flush current text, dispatch tool, restart
  streaming with a new message, then how do we link them visually?
- Multimodal turns: streaming over base64 inline_data input is fine,
  but the response may still be non-streamable on some models.
- `CloudflareProvider.chatStream` currently uses the legacy
  `{response: ...}` SSE shape; needs rewrite for OpenAI-compat
  `choices[0].delta.content`.

Decision: defer to a dedicated session. Provider-level streaming
plumbing exists. The handler-level orchestration is the missing
piece. A dedicated decision doc will be written before the next
session attempts it.

## Bug fixes

### F1: health check-in history persistence

Was: `queue.ts:processTask` for `health_checkin`, `med_nudge`,
`spontaneous_outreach` built the greeting via raw `runAI` and sent
via raw `sendTelegram`. No history write. User replies loaded stale
KV history and confabulated.

Now: greeting goes through `CloudflareProvider.chat()`, response is
appended to KV history via `saveHistory` with a synthetic user prompt
("[automatic check-in trigger]") plus the model output. The next user
reply loads correct context.

### F2: GLM dedup OpenAI-compat parsing

Was: `background.ts:generate` parses `result?.response`, which is the
legacy native CF response shape. GLM 4.7 Flash returns OpenAI-compat
(`choices[0].message.content`), so dedup silently returned null.

Now: `extractText` helper added to `background.ts` that handles both
shapes (preferring OpenAI-compat, falling back to legacy).

### F3: workflow chat_id → user_id

Was: `consolidation.ts`, `architect.ts`, `research.ts` query D1 by
`chat_id`. Rest of codebase uses `user_id` for per-user isolation.

Now: workflow params changed from `chatId` to `userId` (plus chatId
where Telegram delivery is needed). D1 queries use `user_id`.

### F4: max_tokens → max_completion_tokens

Was: `queue.ts` passes `max_tokens: 200` to Gemma. Schema says
`max_tokens` is deprecated in favour of `max_completion_tokens`.

Now: routed through `CloudflareProvider.chat()` which uses
`max_completion_tokens` for OpenAI-compat models.

### F5: free-tier comment

Was: `models.ts` comment "Cloudflare Workers AI models (free tier)".

Now: corrected to "Cloudflare Workers AI models. Note: Gemma 4 and
Kimi K2.6 are PAID (verify pricing on CF dashboard). Embeddings,
reranker, observation, tagging are typically free tier."

### F6: unified extractText

See F2.

### F7: drop thinking 'low' on default_casual

Was: router emits `thinkingEffort: 'low'` for `default_casual`.

Now: `thinkingEffort: undefined` (model decides). `convertThinking()`
on Gemma maps this to no `reasoning_effort` field, letting
`chat_template_kwargs.enable_thinking` default to true and the model
choose budget.

## Files changed

```
src/config/models.ts          registry + comment fix
src/types/ai.ts               enableGrounding, _rawProviderParts,
                              _geminiRawContent, _groundingMetadata,
                              _annotations
src/ai/router.ts              Pro→3.5-flash, enableGrounding flag,
                              drop 'low' for casual
src/ai/cloudflare.ts          web_search_options, annotations
src/ai/gemini.ts              tool combination, raw content
                              preservation, grounding metadata
src/bot/message.ts            push _rawProviderParts for Pro tool
                              loop, render annotations + citations
src/bot/commands.ts           /architect dispatch passes userId;
                              architect_lock keyed by userId
src/bot/callback.ts           architect_kill unlocks by userId
src/router/cron.ts            MEMORY_WORKFLOW dispatch: {userId}
src/router/queue.ts           F1 history persistence via
                              CloudflareProvider + saveHistory
src/ai/background.ts          F2 unified extractText
src/tools/research-tools.ts   RESEARCH_WORKFLOW dispatch: pass userId
src/workflows/consolidation.ts  3.5-flash, user_id
src/workflows/architect.ts      3.5-flash, user_id (chatId kept
                                for delivery)
src/workflows/research.ts       user_id for R2 path + D1
journal.txt                  session entry
decisions/conversation-log.md  conversation history
decisions/2026-06-02-...md   this file
```

**lib/history.ts intentionally unchanged.** The in-turn tool loop
state (with `_rawProviderParts` for Gemini tool combination) lives
in-memory inside `handleMessage`'s `messages` array and never reaches
the KV history layer. Cross-turn history stays text-only and small,
as before. This means thought signatures are only valid within one
user message's tool loop, not across messages — which matches Google's
documented expectations for tool combination.

## Verification

`node --check` on all changed `.ts` files via `tsc --noEmit`. Roma to
deploy and verify in production.

## What to test post-deploy

1. Casual fresh-info question (e.g. "what new Marvel films are
   coming?"). Should now ground via Gemma `web_search_options` and
   return citations.
2. Emotional turn during evening check-in followed by a fresh-info
   question. Should route to gemini-3.5-flash with tool combination,
   ground + still call tools if needed.
3. Tool call on Pro lane (e.g. "remind me to take my evening meds at
   8pm"). Should execute the tool AND complete cleanly.
4. `wrangler tail` should show new log events:
   - `cf_ai_grounding_enabled` (Gemma)
   - `gemini_grounding_enabled` (Pro lane)
   - `gemini_grounded_response` with `webSearchQueries` count
   - No more `bg_ai_error` from GLM dedup
5. Memory consolidation workflow should now actually dedupe (check
   D1 `memories` count before/after consolidation runs).
6. Workflow queries should not error on `chat_id` column (the column
   may still exist in old `user_profiles` rows; new inserts use
   `user_id`).

## Open questions for future sessions

- Should the Pro-lane Tier 2 fallback diverge from Tier 1 again?
  Currently both are 3.5-flash. If we hit a real outage in production
  we'll find out fast.
- Is `gemini-3.5-flash` therapeutic depth good enough? Needs a bench.
- Should `web_search_options.search_context_size` adapt per route
  (low for fast casual, high for analytical)?
- Should we cache grounding results per query to reduce repeat search
  costs? Probably yes, with short TTL.
