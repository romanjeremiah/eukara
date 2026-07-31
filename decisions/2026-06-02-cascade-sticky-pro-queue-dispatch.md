# 2026-06-02 (afternoon) — Cascade reorder, sticky Pro, queue dispatch

**Status:** implemented, not deployed. Awaiting Roma's `npx wrangler deploy --minify`.

## Triggering incident

Roma sent "i'm feeling anxious about tomorrow" earlier today. The bot
showed a typing indicator, then... nothing. `wrangler tail` showed the
webhook acknowledged the request but no `ai_response` log fired.

## Root cause

`src/index.ts` wrapped `handleMessage` in `ctx.waitUntil(task)`. The
emotional message routed to Gemini Pro (grounded, 25 custom function
tools, thinking enabled). That call regularly takes 30–60s. The
`waitUntil` ceiling is 30s — verified against Cloudflare's canonical
limits page:

> When the client disconnects, tasks are canceled unless you call
> `waitUntil()` to extend execution by up to 30 seconds.
>
> — https://developers.cloudflare.com/workers/platform/limits/
> (current as of 2026-04-16)

This ceiling applies on the Paid plan equally. What Paid changes is the
CPU time cap (default 30s, configurable up to 5 min). HTTP-triggered
Workers have unlimited wall-clock while the client stays connected.

Roma initially pushed back that the Paid plan should raise the
waitUntil ceiling. I verified the docs and confirmed it does not.
The correct fix is architectural, not configuration.

## Architectural fix

Three changes, in priority order:

### 1. Cascade reorder

Was:
- Tier 1: `gemini-3.5-flash` (called "pro" but same as Tier 2)
- Tier 2: `gemini-3.5-flash` (no fallback value)
- Tier 3: `@cf/moonshotai/kimi-k2.6` (expensive paid CF model)

Now:
- Tier 1: `gemini-pro-latest` — Google's auto-aliased latest stable Pro,
  90s timeout. Highest quality for emotional/therapeutic content.
- Tier 2: `gemini-3.5-flash` — same family for thoughtSignature
  continuity, much faster. 45s timeout.
- Tier 3: `@cf/google/gemma-4-26b-a4b-it` — Cloudflare edge GPU,
  different infrastructure entirely. 30s timeout.

Pattern lifted from Xaridotis `LAYER_B2C_TIERS` in
`gemini-bot/src/config/cascades.js` (minus OpenAI/Anthropic middle
tiers — Eukara doesn't have those providers wired).

Per-tier timeouts via `Promise.race` wrappers (not AbortSignal), so
the implementation is provider-agnostic. Total worst-case wall-clock
is 165s, well within the queue consumer's 15-min budget.

### 2. Dispatch: queue for Pro, await inline for casual

`src/index.ts` now decides routing before processing:

- **Pro lane** (emotional / multimodal / active check-in / sticky Pro) →
  enqueue as `process_user_message` task → return 200 OK to Telegram
  immediately. Queue consumer has 15-min wall-clock budget.
- **Casual lane** (Gemma on CF) → `await task` inline. The Worker stays
  connected until processing completes; HTTP-triggered Workers have no
  wall-clock cap while client connected. Telegram's webhook tolerates
  ~60s before retrying.
- **Callbacks / polls / non-owner traffic** → unchanged, still
  `ctx.waitUntil`.

The dispatch decision uses `willHitProLane()` (new helper in
`router.ts`) — a regex-only predicate that mirrors `routeMessage` but
returns just a boolean. No env access, no KV reads, microseconds.

### 3. Sticky Pro routing with content-based release

After every successful Pro turn, `message.ts` writes a KV anchor:

```json
{ "anchor": "<first 300 chars of user message>", "route_reason": "emotional_content", "ts": 1717350000000 }
```

Key: `pro_context_${userId}`. TTL: 2h.

On the next user message, the dispatcher reads this anchor. If it
exists AND the new message doesn't already match the emotional regex
(which would route to Pro anyway), the dispatcher runs a topic-shift
classifier (`src/services/topicShift.ts`):

- Model: `@cf/meta/llama-3.2-3b-instruct`. Smallest fast model with
  acceptable instruction-following for this 2-class decision.
- Output: SAME or DIFFERENT (system prompt locked to one word).
- Wrapped in 2s `Promise.race` timeout. On error or timeout: return
  `sameTopic=true` (conservative — better to stay on Pro than flip
  personas mid-thread).
- Trivial-message bypass: messages under 10 chars (yes/ok/yeah) skip
  the classifier entirely and stay on Pro.

If classifier says SAME → `forceProLane: true` carried through to
`handleMessage` via queue task body or inline options.
If DIFFERENT → KV flag cleared, normal routing applies.

Roma chose **content-based** over time-based topic shift detection.
Cost: one CF AI call per ambiguous follow-up message (typical
150–400ms). Worth it for the UX of "conversation stays on Pro until I
clearly change topic."

## What this looks like for the user

**Before:**
- User: "I'm feeling anxious about tomorrow"
- Bot: [typing indicator]
- [30s later: waitUntil cancellation, isolate killed]
- Bot: ...silence. Nothing comes through.

**After:**
- User: "I'm feeling anxious about tomorrow"
- Bot: [200 OK to Telegram in ~50ms; typing indicator]
- Queue consumer picks up: Gemini Pro Latest runs (15-30s typical)
- Bot: thoughtful response, sticky_pro_written event in tail
- User: "yeah, I've got the dentist"
- Dispatcher reads sticky flag → classifier returns SAME → enqueues
  with forceProLane:true → Pro reply, conversation continues
- User: "anyway, can you remind me about my flight at 6pm?"
- Classifier returns DIFFERENT → KV cleared → routes to Gemma (casual,
  fast) → reminder tool call → done

## Files changed

| File | Change |
|---|---|
| `src/config/models.ts` | Added `proLatest: 'gemini-pro-latest'` |
| `src/ai/router.ts` | Added `RouterContext.forceProLane`; pointed Pro routes at `proLatest`; new `willHitProLane()` helper |
| `src/bot/message.ts` | Cascade reorder (Tier 1/2/3); `withTimeout` helper; `handleMessage` accepts `options.forceProLane`; sticky-Pro KV write at end of Pro turn |
| `src/services/topicShift.ts` | NEW: Llama 3.2 3B classifier with 2s timeout + KV read/clear helpers |
| `src/router/queue.ts` | Added `process_user_message` task; 3-retry final-attempt user notification |
| `src/index.ts` | Hybrid dispatch via `dispatchMessage()`; sticky-Pro check before queue/inline decision |
| `journal.txt` | Session summary |

## Decisions explicitly NOT made this session

Roma flagged these for separate sessions, by his direction:

1. **Mood emotions expansion** — add a new category for
   borderline/dissociation support (provisionally "Dissociative" with
   dissociated, depersonalised, derealised, splitting, fragmented,
   numb, switching). Lives in `src/bot/mood-callbacks.ts`. Not
   touched this session.

2. **Mood check 24h expiry + alternative patterns.** Roma confirmed
   extending the timeout to 24h. Four patterns to choose from in a
   future session:
   - Hard 24h timeout (extend current 4h)
   - 24h timeout with reminder at 4h
   - Persistent KV state (no workflow waiting; complete on any
     callback whenever)
   - Resume-on-next-message (next user message checks pending mood
     flow and offers to continue before processing)

3. **Other-users slowness** — need `wrangler tail` capture of a slow
   request from a non-owner user to diagnose. Could be the same 30s
   timeout we just fixed; could be sequential D1 awaits or cold
   starts. Diagnose first.

4. **CPU cap in `wrangler.jsonc`** — not added. Default 30s is fine
   because calls are I/O bound, not CPU bound.

## Sources

- Cloudflare Workers limits: https://developers.cloudflare.com/workers/platform/limits/
- waitUntil specifically: https://developers.cloudflare.com/workers/runtime-apis/handlers/fetch/#contextwaituntil
- Xaridotis B2C cascade reference: `gemini-bot/src/config/cascades.js`,
  `LAYER_B2C_TIERS`
- Xaridotis hybrid dispatch reference: `gemini-bot/src/index.js`,
  around line 2197 (`shouldQueue` decision) and line 2271
  (`useBackground` hybrid dispatch)
- Gemini SDK abortSignal support: https://github.com/googleapis/js-genai
  (verified for future use; not used in this implementation — preferred
  Promise.race for provider-agnostic timeout handling)
