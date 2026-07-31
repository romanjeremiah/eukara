# 2026-05-21 — Curator and Cascade Revisions

**Status:** Locked. Code edits applied source-clean. Not yet deployed.
**Override clause:** Roma's "no pushback" — implement directly, document trade-offs in retrospect.
**Supersedes:** `2026-05-20-model-lock.md` (B1/C cascade portion).

---

## Trigger

Production log capture (2026-05-21 emotional+high turn) showed three failure modes contributing to 115s wall-time:

1. **80s cache-creation 503 storm** from Google Gemini API.
2. **11.4s Gemma empty response** in the SHORT_CASCADE (planner.js step).
3. **2.4s Llama 70B fp8-fast empty response** in the Response Curator cascade.

Only failure mode 2 had a fixable root cause identified in this session.

---

## Root cause: Gemma 4 26B configuration bug

Per https://ai.google.dev/gemma/docs/capabilities/thinking and https://ai.google.dev/gemma/docs/core/prompt-formatting-gemma4:

> "Larger Gemma 4 models (gemma-4-26B-A4B-it, gemma-4-31B-it) may occasionally generate a thought channel even when thinking mode is explicitly turned off. We've added an empty thinking token to stabilise."

Gemma 4 26B has **built-in thinking mode ON by default** — same shape as Kimi K2.6.

**Our bug:** `applyModelSpecificParams` in `src/lib/ai-gateway.js` only disabled thinking for Kimi K2.6, not Gemma 4. Result: every Gemma call reasoned silently until `max_tokens=1000` was consumed, then returned empty content. 11.4s wall-time per call.

**Fix:** Extend `applyModelSpecificParams` to handle Gemma 4 26B with the same `chat_template_kwargs.thinking: false` injection. Implemented via `REASONING_MODELS_THINKING_OFF_BY_DEFAULT` Set to make the next reasoning model addition trivial.

This was **not** a Cloudflare service degradation. The model was doing exactly what its docs say.

---

## Decisions

### 1. Response Curator cascade swap

**Before:**
- Tier 1: `@cf/meta/llama-3.3-70b-instruct-fp8-fast` (CF, label `curator:llama-3.3-70b-fast`)
- Tier 2: `gemini-3.1-flash-lite` (Gemini, label `curator:2.5-fl-b512`)

**After:**
- Tier 1: `gemini-3.1-flash-lite` (Gemini, `responseMimeType: 'application/json'`, `thinkingLevel: 'minimal'`, maxOutputTokens 800, label `curator:3.1-fl-stable`)
- Tier 2: `@cf/qwen/qwen2.5-coder-32b-instruct` (CF, maxOutputTokens 800, label `curator:qwen-32b-coder`)

**Rationale:** Llama 70B fp8-fast was returning empty intermittently in production (2.4s empty in this log). Qwen 32B coder scored high on JSON-shape compliance in the 3,750-trial bg_task bench. Gemini Flash-Lite is now stable GA and has native JSON via `responseMimeType` plus minimal thinking for low latency.

**Trade-offs accepted:**
- Tier 1 latency: ~3s P50 expected (Gemini API round-trip) vs Llama 70B's previous ~2.3s P50. Slower nominal but more reliable.
- Cross-provider Tier 2 (CF) preserves resilience-first principle (no single provider can break the cascade).

### 2. B1/C cascade rewrite (third revision today)

**Before (2026-05-20 lock):**
- Tier 1: `gemini-3.5-flash` thinkingLevel HIGH
- Tier 2: `gemini-3.5-flash` thinkingLevel MEDIUM
- Tier 3: `gemini-2.5-pro` thinkingBudget -1
- Tier 4: `gemini-pro-latest`
- Tier 5 (planned, not wired): `anthropic/claude-sonnet-4.6` via AI Gateway
- Tier 6: `gemini-3.1-flash-lite`

**After (2026-05-21 lock):**
- Tier 1: `gemini-pro-latest` (Google defaults; medium thinking auto)
- Tier 2: `gemini-2.5-pro` thinkingBudget -1
- Tier 3 (planned, not wired): `anthropic/claude-sonnet-4.6` via DIRECT Anthropic API
- Tier 4: `gemini-3.5-flash` thinkingLevel HIGH
- Tier 5: `gemini-3.1-flash-lite`

**Notable changes:**
- 3.5-flash double-tier collapsed; the auto-downgrade between thinking levels is replaced by cross-model fallback.
- 2.5-pro promoted from Tier 3 to Tier 2.
- Claude path changed from "via AI Gateway" → "via DIRECT Anthropic API". Implementation impact: Phase B now needs a new provider wrapper around `https://api.anthropic.com/v1/messages` with `x-api-key: ${ANTHROPIC_API_KEY}`, not the OpenAI-compat shape that AI Gateway would have given us. Cascade walker integration unchanged.

**Trade-offs accepted:**
- Tier 1 latency expected to be higher than the prior 3.5-flash HIGH primary. pro-latest is the stronger model but slower at the head of the cascade.
- Single-tier Tier 1 (no medium-thinking sibling) means slightly less resilience against Tier 1 failure before crossing to a different model family.

### 3. `GEMINI_MODELS` constants reshuffle

| Constant | Before | After |
|---|---|---|
| `pro` | `gemini-3.5-flash` | `gemini-pro-latest` |
| `proLegacy` | `gemini-2.5-pro` | `gemini-2.5-pro` (unchanged, Tier 2) |
| `proLatest` | `gemini-pro-latest` | `gemini-pro-latest` (alias) |
| `flash` | `gemini-3.5-flash` | `gemini-3.5-flash` (demoted to Tier 4) |
| `flashLite` | `gemini-3.1-flash-lite` | `gemini-3.1-flash-lite` (unchanged) |

The router uses `GEMINI_MODELS.pro` to dispatch most traffic — so most routed traffic now starts at `gemini-pro-latest`. This matches the cascade's Tier 1.

### 4. PRIMARY_TEXT_MODEL deliberately NOT changed

`src/lib/ai/gemini.js` still has `PRIMARY_TEXT_MODEL = FLASH_35_MODEL`. This is the default for short utility calls in `createChat` when no model is specified, separate from the router-driven flow. Updating it would be a broader change requiring a separate review.

---

## Pending follow-ups

### Phase B — wire claude-sonnet-4.6 direct API (Tier 3 of new cascade)

**Scope:**
- New provider wrapper for `anthropic/claude-sonnet-4.6` calling `https://api.anthropic.com/v1/messages` directly.
- `x-api-key: ${ANTHROPIC_API_KEY}` header (Worker secret already exists).
- Anthropic-flavoured request body translator (messages array, max_tokens, system param outside messages, Anthropic's content-block streaming format).
- Response shape adapter back to the streaming generation interface used by `handlers.js`.
- Cascade-walker integration: insert at index 2 of `B1C_CASCADE` so Tier 2 → Tier 3 → Tier 4 fires correctly.
- Estimated: 1-2 sessions of work.

### Post-deploy verification checklist

- [ ] `wrangler tail` confirms `model_route_resolved` shows `model: gemini-pro-latest` for typical turns.
- [ ] `curator:3.1-fl-stable` appears as the dominant curator log line.
- [ ] `short:gemma` no longer returns empty (Gemma thinking-off fix working).
- [ ] Layer D (`intent: functional`) succeeds on Gemma now.
- [ ] `cascade_fallback` events show Tier 1 → Tier 2 → Tier 4 ordering when retries trigger.
- [ ] No regression in `cache_setup_done` latency.

### If Gemma still misbehaves post-deploy

Demote Gemma to Layer D fallback and promote `gemini-3.1-flash-lite` to Layer D primary. Code change in `src/ai/router.js` rule 6 and any Cloudflare provider call sites.

---

## Files touched

- `src/lib/ai-gateway.js` — `applyModelSpecificParams` extended to Gemma 4.
- `src/services/responseCurator.js` — cascade tiers swapped.
- `src/config/models.js` — `GEMINI_MODELS` constants reshuffled, comment block rewritten.
- `src/lib/ai/gemini.js` — top-of-file comment block annotated with 2026-05-21 revision.
- `src/bot/handlers.js` — `B1C_CASCADE` rewritten.
- (`src/ai/router.js` — no code changes needed; auto-picks up new `GEMINI_MODELS.pro` value.)

All six files pass `node --check`.

---

## Override reason

Roma invoked the "no pushback" clause. Three discrete asks were applied as a unit:
1. Response Curator swap to Gemini Flash-Lite + Qwen 32B coder.
2. B1/C cascade third revision with claude-sonnet-4.6 moving from Gateway → direct API.
3. Investigation of Gemma 4 26B failure (result: configuration bug, fixed).

No alternative options were presented before implementation per the override clause. The journal and this decisions doc preserve the trade-offs for retrospective review.
