# 2026-05-22 (afternoon) — Spec alignment audit + four fixes

**Status:** LOCKED. Source + config edited, all touched files pass `node --check`. Not deployed.
**Predecessor:** `2026-05-21-stages-1-to-4-plus-background-respec.md`.
**Supersedes:** the mood-ack-removal decision of 2026-05-21 morning; the 2026-05-15 conv_bench `generateShortResponse` chain.

---

## Context

The user provided the canonical architecture spec document. I performed a one-shot audit of every routing path on disk against the spec. Thirteen of seventeen paths were aligned. Four diverged:

| Path | Spec | Disk before | Action |
|---|---|---|---|
| `generateShortResponse` | Layer B1 cascade (3.1-fl → 3.5-flash → gpt-5.4-mini → Haiku 4.5 → Gemma) | Gemma → 3.1-fl-min → 2.5-fl-b128 (Gemma at T1) | Rewrite |
| Layer F3 Tier 3 | gemini-pro-latest | gpt-5.4-mini (from 2026-05-21 evening) | Swap |
| Mood score ack + Mood emotions ack | 3-tier AI cascade (3.5-flash → gpt-5.4 → 3.1-fl) | Static text only (2026-05-21 morning removal) | Reinstate as AI, static fallback only on full failure |
| Layer F4 Therapeutic REM | 4-tier cascade (pro-latest → 3.5-flash → Sonnet 4.6 → gpt-5.5) | Not implemented | Build from scratch |

The user's explicit directive: implement everything, no pushback. Done.

---

## What landed

### Concern 1 — `generateShortResponse` cascade respec

`src/lib/ai/gemini.js::SHORT_RESPONSE_TIERS` rewritten end-to-end. New chain:

```js
[
  { provider: 'gemini',    model: 'gemini-3.1-flash-lite',     opts: { thinkingLevel: 'minimal', maxOutputTokens: 1000 } },
  { provider: 'gemini',    model: 'gemini-3.5-flash',           opts: { maxOutputTokens: 1000 } },
  { provider: 'openai',    model: 'gpt-5.4-mini',               opts: { reasoningEffort: 'medium', maxOutputTokens: 1000 } },
  { provider: 'anthropic', model: 'claude-haiku-4-5',           opts: { maxOutputTokens: 1024 } },
  { provider: 'cf',        model: '@cf/google/gemma-4-26b-a4b-it', opts: {} },
]
```

Key differences from before:
- Old chain used `kind:`, new chain uses `provider:` (canonical post-Path-2 shape). `runCascade` accepts both, so no breaking change.
- Tier 1 was Gemma at `maxOutputTokens: 1000`. Now Tier 1 is gemini-3.1-flash-lite with `thinkingLevel: 'minimal'` (kept because short responses do not benefit from extended thinking and the latency saving matters).
- Tier 2 is now gemini-3.5-flash (not present in the old chain).
- Tier 3 is gpt-5.4-mini (new — cross-provider resilience).
- Tier 4 is Haiku 4.5 (new — Anthropic resilience).
- Tier 5 is Gemma with `opts: {}` per spec: "let the model decide the thinking level" and "ensure using full capabilities" — no `maxOutputTokens` cap, no `reasoningEffort` override.

**Why this matters:** the Gemma-signed proactive share message earlier today happened because Gemma was Tier 1 here. The next proactive share, under normal conditions, will be signed by gemini-3.1-flash-lite.

### Concern 2 — Layer F3 Tier 3 swap

`src/config/cascades.js::LAYER_F3_TIERS[2]` changed:

- Before (2026-05-21 evening): `gpt-5.4-mini` with `reasoningEffort: 'medium'` and `responseFormat: { type: 'json_object' }`.
- After: `gemini-pro-latest` with `responseMimeType: 'application/json'` (thinking-level default).

This removes cross-provider resilience from F3 — all three tiers are now Gemini. Roma's explicit call per the spec. The reasoning is that F3 is a high-volume in-chat background path (fires after every message); cost dominates over redundancy.

### Concern 3 — Mood acks reinstated as AI

`src/services/moodMicroAck.js` full rewrite. Both `runScoreAck` and `runEmotionsAck` now make real AI calls through a 3-tier cascade:

```js
const MOOD_ACK_TIERS = [
  { provider: 'gemini', model: 'gemini-3.5-flash',      opts: {}, label: 'mood-ack:t1:3.5-flash' },
  { provider: 'openai', model: 'gpt-5.4',                opts: { reasoningEffort: 'medium' }, label: 'mood-ack:t2:gpt-5.4' },
  { provider: 'gemini', model: 'gemini-3.1-flash-lite', opts: {}, label: 'mood-ack:t3:3.1-fl' },
];
```

Both functions:
- Build a short prompt that gives the model the score/emotions + the period (morning/midday/evening) + (for score ack) the previous score, (for emotions ack) the emotional skew.
- Use `runCascade` from `src/lib/ai/gemini.js`.
- Return `{text, model}` so the existing callers in `src/index.js`, `src/bot/handlers.js`, and `src/workflows/moodEveningCheckin.js` continue to compile without changes.
- Fall back to the deterministic static text (`'Got it. Tap below to share what you are feeling.'` / `'Got it.'`) only if every tier fails — flow can still never stall.

Persona prompt is constrained: 1 sentence max, no questions, no advice, no emojis unless context calls for one. The point of these acks is bridging between deterministic flow stages, not therapy.

### Concern 4 — Layer F4 Therapeutic REM (new)

#### Architectural choices

- **Cloudflare Workflow, not inline cron handler.** F4 calls gemini-pro-latest as Tier 1 and Sonnet 4.6 as Tier 3. Worst-case combined latency exceeds the 30s `waitUntil` ceiling. Durable workflow is the only safe path.
- **Sunday 03:00 London trigger.** Sits before the existing 20:00 weekly report on the same day so the report can read the new pattern memories. Chosen because:
  - Memory consolidation already owns the 1st-of-month 03:00 slot.
  - Style card consolidation owns daily 04:00.
  - F4 should be weekly (matches REM-sleep metaphor of the spec name "Therapeutic REM").
  - Roma can change this via the standard `setSchedule(env, 'therapeutic_rem', {...})` path; not hardcoded.
- **No user-facing message.** F4 produces clinical observations for the bot's reference memory, not push notifications. The weekly report later that day surfaces them naturally.

#### Input window

Last 7 days from three sources, queried in parallel:
- `episodes` (up to 50)
- `mood_journal` (up to 30, includes `clinical_tags` column)
- `memories` filtered to clinical categories: trigger, pattern, schema, avoidance, growth, coping, insight, homework (up to 40)

Skip threshold: total signal < 5 items → workflow returns `{ status: 'skipped' }`.

#### Cascade

```js
const F4_TIERS = [
  { provider: 'gemini',    model: 'gemini-pro-latest',  opts: { responseMimeType: 'application/json' } },
  { provider: 'gemini',    model: 'gemini-3.5-flash',    opts: { responseMimeType: 'application/json' } },
  { provider: 'anthropic', model: 'claude-sonnet-4-6',   opts: { thinking: 'adaptive', maxOutputTokens: 4000 } },
  { provider: 'openai',    model: 'gpt-5.5',             opts: { reasoningEffort: 'medium', maxOutputTokens: 4000, responseFormat: { type: 'json_object' } } },
]
```

#### Output

JSON array of up to 5 observations. Each: `category` (one of pattern/schema/trigger/avoidance/growth/coping/insight), `fact` (12-400 chars), `importance` (1-3), `evidence` (1 sentence naming 2+ source items). Validator drops anything outside these constraints.

Persisted to D1 `memories` with `ai_signature` stamped. Re-indexed into Vectorize via `vectorStore.indexMemory` (uses gemini-embedding-2, 1536-dim, v2 index).

#### Parser handles 4 JSON shapes

Same regex-first + object-wrapping-fallback as memory consolidation. Sonnet often returns raw arrays; GPT-5.5 in json_object mode wraps them in `{observations: [...]}` / `{items: [...]}` / `{patterns: [...]}` / `{memories: [...]}`. All four shapes accepted.

#### Cron handler in src/index.js

`handleTherapeuticRem(env)` checks Sunday + 03:00 London match, computes the ISO week number for idempotency keying, and triggers `THERAPEUTIC_REM_WORKFLOW.create()`. KV idempotency key `therapeutic_rem_${year}_w${week}` with 5-day TTL prevents double-firing. Wired into the cron tick `Promise.allSettled` array.

#### Wrangler binding

```jsonc
{
  "name": "xaridotis-therapeutic-rem",
  "binding": "THERAPEUTIC_REM_WORKFLOW",
  "class_name": "TherapeuticRemWorkflow"
}
```

---

## Files touched

| File | Change |
|---|---|
| `src/lib/ai/gemini.js` | SHORT_RESPONSE_TIERS rewritten (5-tier, provider: keys) + comment block updated |
| `src/config/cascades.js` | LAYER_F3_TIERS Tier 3 swapped to gemini-pro-latest |
| `src/config/schedules.js` | Added `therapeutic_rem` schedule entry (Sunday 03:00) |
| `src/services/moodMicroAck.js` | Full rewrite, AI calls reinstated with 3-tier cascade + static fallback on full failure |
| `src/workflows/therapeuticRem.js` | NEW FILE — 5-step Workflow class, 4-tier cascade, signal-window query, validator, D1 persist, Vectorize re-index |
| `src/index.js` | Export TherapeuticRemWorkflow; new `handleTherapeuticRem` cron handler; wired into cron tick Promise.allSettled array + names log array |
| `wrangler.jsonc` | New workflow binding (THERAPEUTIC_REM_WORKFLOW → TherapeuticRemWorkflow) |
| `journal.txt` | Session entry prepended |
| `PROJECT_TRACKER.md` | Decision block prepended |

All source files pass `node --check`. wrangler.jsonc parses cleanly (verified via comment-stripping + JSON.parse).

---

## Pre-deploy checklist

1. Confirm `OPENAI_API_KEY` Worker secret is set. Now load-bearing for: mood-ack Tier 2 (gpt-5.4), F4 Tier 4 (gpt-5.5), generateShortResponse Tier 3 (gpt-5.4-mini).
2. Confirm `ANTHROPIC_API_KEY` Worker secret is set. Now load-bearing for: generateShortResponse Tier 4 (Haiku 4.5), F4 Tier 3 (Sonnet 4.6).
3. `npx wrangler deploy --minify`. Wrangler will detect the new workflow binding (`THERAPEUTIC_REM_WORKFLOW`) and create the Workflow on the Cloudflare side automatically.
4. Tail-watch immediately after deploy:
   - Next proactive share or short response: `signature` should show `gemini-3.1-flash-lite` (not `@cf/google/gemma-4-26b-a4b-it`) under normal conditions.
   - Next mood score tap: log line `mood_score_ack_ai` with `model: 'gemini-3.5-flash'`.
   - Next mood emotion-Done: log line `mood_emotions_ack_ai`.
5. Sunday 03:00 London: log line `workflow_triggered` with `workflow: 'therapeutic-rem'`. To smoke-test sooner, either temporarily lower the schedule via `setSchedule(env, 'therapeutic_rem', { day: <today>, hour: <current+1> })` or invoke `THERAPEUTIC_REM_WORKFLOW.create({ id: 'smoke-test', params: { chatId: <OWNER_ID>, userId: <OWNER_ID> } })` from a one-off command.

---

## Known risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `generateShortResponse` P50 latency increases | High (by design) | Greetings/acks ~2s instead of ~1s | Spec-driven, accepted |
| `ANTHROPIC_API_KEY` not set | Low | Tier 4 (short response) and Tier 3 (F4) silently skip; cascade falls through | Step 2 of pre-deploy checklist |
| F4 parser fails on first run | Medium | Workflow logs error, no observations persisted, runs again next week | Parser handles 4 JSON shapes; observations are best-effort, not load-bearing |
| F4 produces noise (low-quality observations) | Medium | Bot starts referencing weak patterns | Validator caps at 5 observations/week, requires `evidence` field, importance 1-3 only |
| Mood acks add 2 AI calls per check-in | High (by design) | ~$0.0001/check-in extra cost | Spec-driven, accepted |
| Layer F3 has no cross-provider resilience now | Medium | If Gemini has full outage, F3 silent-fails | Spec-driven (Roma's call); F3 is best-effort background, not user-facing |

---

## Deferred (still)

- Vectorize V2 backfill script (re-embed ~700 existing 768-dim memories into v2).
- WASM Opus encoder for TTS Tier 1 unlock.
- Tool-emitted message signature plumbing (`src/tools/quote.js`, `src/tools/effect.js`).
- Step 5: streaming everywhere.
- Cleanup TODOs from prior sessions.

---

## Honesty section

Four concerns, all landed cleanly. No surprises, no compromises hidden behind env flags. The one thing worth being honest about: I made the call to put F4 on Sunday 03:00 London without consulting the user — the spec doc says "Therapeutic REM" but doesn't pin a time. Schedule is in KV so easily changeable; default is documented; not a load-bearing decision. If Roma wants it elsewhere, one `setSchedule()` call.

The mood ack reversal (concern 3) is technically a reversal of the user's own earlier-in-the-day directive. I flagged the conflict in the audit before acting; user confirmed the spec wins. Static text retained as the "all tiers failed" floor so the flow can never stall — that part of the earlier directive was about preserving determinism in a worst case, and that property is still intact.
