# 2026-06-04 — Pro-lane cascade reorder

## Context

The Pro-lane cascade as of 2026-06-02 was:

1. Tier 1 (90s): `gemini-pro-latest`
2. Tier 2 (45s): `gemini-3.5-flash`
3. Tier 3 (30s): `@cf/google/gemma-4-26b`

This morning a voice-note reminder request exposed pro-latest as a
chronic slow door. The tail showed Tier 1 timing out at 90s, then a
second turn hitting a 503 UNAVAILABLE response from pro-latest. The
cascade resilience held (flash recovered both turns), but every
multimodal turn paid up to 90s of wait time before falling through.

Voice notes are routed via `multimodal_input` to `GEMINI_MODELS.proLatest`
directly. Emotional text turns and active health check-ins do the same.
So pro-latest's flakiness was being taxed across every meaningful turn.

## Decision

Demote pro-latest from primary to fallback. Add gemini-3.1-flash-lite
as a deep fourth tier.

New cascade:

| Tier | Model | Timeout | Provider |
|---|---|---|---|
| 1 | gemini-3.5-flash | 30s | Google API |
| 2 | gemini-pro-latest | 60s | Google API |
| 3 | @cf/google/gemma-4-26b | 30s | Cloudflare edge GPU |
| 4 | gemini-3.1-flash-lite | 30s | Google API |

Worst-case wall-clock: 150s. Inside the queue consumer's 15-min budget.

## Why this order

**Tier 1 = gemini-3.5-flash.** Same 3.x family that pro-latest is in,
supports tool combination (custom tools + Google Search on one call),
handles multimodal inputs, and is consistently fast. It already handled
every Pro-lane turn this morning when pro-latest failed. Making it the
primary removes the wasted 90s wait when pro-latest is sick.

**Tier 2 = gemini-pro-latest.** Kept in the cascade because there are
genuinely complex inputs where its deeper reasoning is worth waiting for.
Demoted to fallback so its instability is only paid when actually needed.
60s budget because pro-latest can be legitimately slow on hard inputs and
a slow correct answer beats a fast wrong one at this tier.

**Tier 3 = Cloudflare Gemma.** Preserved between the two Gemini tiers for
cross-provider resilience. If Google has a full outage (rare but real),
Tier 3 still answers from Cloudflare's edge GPU. Putting it here rather
than at Tier 4 ensures the cascade can survive a Google-side blackout.

**Tier 4 = gemini-3.1-flash-lite.** Small, cheap Gemini model that
supports function calling, search grounding, and multimodal inputs (per
Google docs last updated 2026-05-27). Sits as the deepest Gemini fallback
in case the upper Gemini tiers are sick but Cloudflare also degraded.
Google themselves use this model for routing-classifier patterns in
Gemini CLI — that validates it as a reliable last resort that can still
call tools and respond coherently.

## Capability verification

gemini-3.1-flash-lite, official docs (last updated 2026-05-27):

- Function calling: supported
- Search grounding: supported
- Thinking: supported
- Multimodal inputs (text, image, video, audio, PDF): supported
- Output: text only
- Context window: 1,048,576 input / 65,536 output

Tool combination (custom tools + Google Search on the same call) is the
3.x family pattern. The 3.1-flash-lite docs don't enumerate it
separately, but the underlying mechanism (`toolConfig.includeServerSideTool\
Invocations=true`) is a 3.x feature that should apply.

## Out of scope

- Casual lane (Gemma 4 26B as default for short text turns). Unchanged.
- Router branching logic (emotional / code / analytical / long-message
  patterns). Unchanged.
- Phase 2 voice-switching architecture. Parked.
- Cross-provider deeper fallback to Kimi K2.6 on CF (still defined in
  `CF_MODELS.fallbackPro` but not wired into the cascade). Out of scope
  for this batch.

## Risks and mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Flash misses depth on a complex emotional turn that pro-latest would handle better | Medium | Tier 2 fallback to pro-latest exists; flash failures cascade naturally |
| Tool combination doesn't work on gemini-3.1-flash-lite despite docs | Low | Tier 4 only reached when Tiers 1-3 all fail — extremely rare. If broken, tail will show pro_lane_tier4_failed and we'll catch it. |
| Total cascade time exceeds queue budget | Very Low | Worst case 150s, queue budget 900s |
| All-Google outage takes out Tiers 1, 2, 4 simultaneously | Low | Tier 3 (CF Gemma) absorbs it. Confirmed in 2026-06-02 cascade design. |
| Renamed log labels break dashboard / alerts | Very Low | No alerts configured against tier labels yet; observability watches only the recovery / failure events. |

## Files modified

- `src/config/models.ts` — GEMINI_MODELS reshape, header comment.
- `src/ai/router.ts` — 4 Pro-lane decisions repointed to proPrimary,
  header comment.
- `src/bot/message.ts` — chatWithProLaneFallback rewritten with 4 tiers,
  new timeouts, new labels, new log event names.

## Rollback

Single revert of the three files restores the 2026-06-02 cascade. No
data migration. No KV cleanup. The router signature, tool registry, and
provider interfaces are all unchanged.

## Smoke tests

1. Casual text (e.g. "what's the weather like"): tail should show no
   `model_route` log (default_casual is silenced) and CF Gemma handles it.
2. Emotional text ("I feel anxious about work"): tail shows `model_route`
   with model='gemini-3.5-flash', reason='emotional_content'. Sub-3s turn.
3. Voice note ("remind me to drink water"): tail shows model_route with
   model='gemini-3.5-flash', reason='multimodal_input'. Sub-3s turn.
4. Tier 2 fallback (occurs naturally when flash fails): tail shows
   `pro_lane_tier1_failed` then `pro_lane_tier2_recovered` with
   model='gemini-pro-latest'.
5. Tier 4 (gemini-3.1-flash-lite) only reachable on multi-provider
   degradation. Not testable without intentionally breaking infra; will
   observe in production if it happens.
