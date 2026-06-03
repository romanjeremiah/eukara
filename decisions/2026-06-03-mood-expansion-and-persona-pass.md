# 2026-06-03 — Mood expansion: dissociative category + 24h resume + persona tightening

**Status:** implemented, not deployed. Awaiting Roma's `npx wrangler deploy --minify`.

## Scope decisions (confirmed before coding)

| Decision | Value | Notes |
|---|---|---|
| Dissociative button label | 🌫️ Dissociative | Parity with ☀️ Positive / 🌧 Negative |
| Cycle order | Positive → Negative → Dissociative → Positive | Centralised in `NEXT_CATEGORY` |
| Dissociative emotion list | `dissociated, depersonalised, derealised, splitting, fragmented, numb, switching` (7) | Ragged 3+3+1 tail in 3-column grid, accepted |
| Mood expiry | (a) hard 24h TTL + (c) resume prompt | Roma's call from four options offered |
| Persona pass | No-receipts ban, asymmetric pacing, heuristic injection for mood synthesis | Tool-timing on `save_therapeutic_note` skipped per Roma's list |

## Key architectural finding

Eukara does **not** have a Cloudflare Workflow for the evening mood flow like Xaridotis does. Eukara's mood flow is queue + KV + callbacks. So the question "extend the mood check timeout to 24h" doesn't map to changing a `STEP_TIMEOUT` constant. It maps to bumping TTLs on KV keys and adding a separate "pending flow" tracker for the resume prompt.

This is a real divergence from the Xaridotis reference and worth flagging for any future "port the workflow over" decision. Either approach is fine; just don't try to combine them in the same flow.

## Two separate flags

| Key | TTL | Purpose | Changed? |
|---|---|---|---|
| `health_checkin_active_${userId}` | 1800s (30 min) | Drives Pro-routing during immediate post-poll window | **Unchanged** |
| `mood_flow_pending_${userId}` | 86400s (24h) | Tracks flow state for resume prompt: `{stage, startedAt}` | **NEW** |
| `mood_flow_resume_offered_${userId}` | 86400s (24h) | Prevents re-prompting on every message during the same flow | **NEW** |
| `mood_poll_${pollId}` | Bumped 3600s → 86400s | Poll context lookup at answer time | Bumped |
| `mood_emo_selected_${userId}` | Bumped 3600s → 86400s | Partial emotion selection buffer | Bumped |

**Critical design choice**: keeping `health_checkin_active` at 30 min while extending `mood_flow_pending` to 24h. If we'd extended `health_checkin_active` to 24h to match, every casual message during the 24-hour window would route to Pro (because that flag drives the Pro routing branch). Slow responses for everything. Separating the two keys keeps casual chat fast while still allowing the flow to be resumed late in the day.

## Flow

```
20:30  cron mood_poll task fires
       → queue sends poll
       → writes mood_poll_<pollId> (24h)
       → writes mood_flow_pending = {awaiting_score, ts} (24h)
       → clears any stale mood_flow_resume_offered

[Happy path]
20:32  user taps poll
       → poll.ts saves score, advances mood_flow_pending → {awaiting_emotions, ts}
       → sends 3-button [☀️ Positive] [🌧 Negative] [🌫️ Dissociative] keyboard
20:33  user taps Positive → emotion grid shown
20:34  user taps emotions, taps Done
       → mood-callbacks.ts synthesises summary
       → clears health_checkin_active + mood_flow_pending + mood_flow_resume_offered

[Resume path]
20:30  poll sent (as above)
20:32  user doesn't tap, busy
21:00  health_checkin_active expires (30 min TTL)
       → Pro routing reverts to normal for casual chat
22:15  user types "hey, what's the weather"
       → dispatchMessage sees mood_flow_pending exists, idleMs = 105 min > 10 min,
         no resume_offered flag
       → sends "📌 Your check-in is still open" + [Continue] [Skip] buttons
       → sets mood_flow_resume_offered flag
       → continues normal routing for "hey, what's the weather" message
22:15  bot also sends the actual weather reply (separate message)

[After resume prompt]
22:18  user taps Continue
       → mood_resume_continue handler clears resume_offered flag
       → enqueues fresh mood_poll task
       → new poll sent at 22:18, new health_checkin_active set
   OR  user taps Skip
       → mood_resume_skip clears all flow keys
   OR  user ignores buttons
       → mood_flow_pending lives until 20:30 next day, then expires silently
       → resume prompt won't re-fire (offered flag prevents it)
```

## Heuristic injection (mood synthesis)

The previous `runEmotionsDoneWork` prompt asked Gemini to "give a meaningful therapeutic summary" using history + clinical notes + episodes + semantic context. Output was generic averaging — sounded similar across users with similar data.

New prompt:
- Pulls `getMemoriesByCategory(env, userId, 'trigger', 10)` and (..., 'schema', 10) alongside existing context
- Formats them as `[KNOWN HEURISTICS]` block with "Known triggers:" and "Known schemas/patterns:" subsections
- Tells the model to **find friction** between today's data and the heuristics — point out contradictions or echoes — not summarise
- Adds explicit no-receipts ban inline ("react directly to the content, do not say 'I hear you'")
- Adds dissociation-aware section: "If dissociative emotions are present, take them seriously. These are altered-perception states, not valence labels."
- Adds asymmetric pacing: "End with EITHER one open-ended question OR a flat declarative observation. Roughly 40% of the time, end with the observation."

Degrades gracefully: when triggers/schemas are empty (new user), the block reads "(No known triggers or schemas on file yet.)" and the model just compares against today's data + history + episodes.

## Persona pass

Two new rules added to `BASE_TEMPLATE` VOICE DISCIPLINE section (around line 60 of `personas.ts`):

1. **NO RECEIPTS (CRITICAL)**: Banned opening phrases list — `"I hear that you are feeling"`, `"I hear you"`, `"It sounds like"`, `"That makes sense"`, `"I can understand why"`, `"What I'm hearing is"`, `"It seems like you're"`. Explanation that these are AI sycophancy patterns. Counter-example given: instead of `"I hear that you are exhausted"`, say `"You've been carrying this for days"` or `"Of course you are."`

2. **ASYMMETRIC PACING**: Don't end every message with a question. Roughly 40% of warm-tone replies should close on a flat declarative observation, leaving space for the user to lead. Reinforces the existing "one question per response" rule with the orthogonal pacing constraint.

Plus section 3 of `MENTAL_HEALTH_DIRECTIVE` (EMOTIONS LIBRARY) updated:
- Added the seven dissociative/altered-state emotions
- Clinical guidance not to collapse them into negative valence: "Numbness is the absence of feeling, not sadness. Depersonalisation and derealisation are clinical phenomena (feeling unreal / outside oneself / outside reality)."
- Instruction: "do not rush to fix, do not collapse them into the negative bucket, do not narrate them clinically."

## Files changed (8)

| File | Change |
|---|---|
| `src/config/moodScale.ts` | **NEW**. Canonical long-form poll options + question constant |
| `src/config/emotions.ts` | Added `DISSOCIATIVE_EMOTIONS`, `EmotionCategory` type, `NEXT_CATEGORY`, `CATEGORY_LABEL`, `emotionsByCategory()`. Changed `emotionButtonRows` signature to take typed category |
| `src/config/personas.ts` | NO RECEIPTS + ASYMMETRIC PACING added to VOICE DISCIPLINE; dissociative section added to EMOTIONS LIBRARY |
| `src/router/queue.ts` | Uses `MOOD_POLL_OPTIONS`/`MOOD_POLL_QUESTION` from moodScale; poll context TTL 1h → 24h; sets `mood_flow_pending` after sending poll |
| `src/bot/poll.ts` | Third button 🌫️ Dissociative in both keyboards; advances `mood_flow_pending` stage to `awaiting_emotions` after score |
| `src/bot/callback.ts` | `mood_cat_dissociative` branch; three-way cycling via `NEXT_CATEGORY`; new `mood_resume_continue` and `mood_resume_skip` handlers; selection-buffer TTL 1h → 24h |
| `src/bot/mood-callbacks.ts` | Selection-buffer TTL 1h → 24h; three-way partition in `runEmotionsDoneWork` via `classifyEmotion`; pulls triggers + schemas, injects as `[KNOWN HEURISTICS]` block; prompt rewritten; clears `mood_flow_pending` + `mood_flow_resume_offered` on done |
| `src/index.ts` | `MOOD_RESUME_IDLE_MS` constant + `maybeOfferMoodResume()` helper; called in `dispatchMessage` owner path before routing |

## Pre-deploy checks

```bash
cd ~/Library/CloudStorage/OneDrive-Personal/Documents/GitHub/eukara
npx tsc --noEmit
```

Areas I'd want eyes on if tsc complains:

1. `emotions.ts` — `emotionButtonRows` signature changed from `(emotions, otherCategoryLabel: string | null)` to `(emotions, nextCategory: EmotionCategory | null)`. I updated the one caller in `callback.ts`. If there's another caller I missed, tsc will flag it.
2. `callback.ts` — added `import { MOOD_POLL_OPTIONS, MOOD_POLL_QUESTION } from '../config/moodScale'`, but I don't actually use those in callback.ts. Could be unused-import warning. Cosmetic.
3. `mood-callbacks.ts` — kept the `POSITIVE_EMOTIONS, NEGATIVE_EMOTIONS, DISSOCIATIVE_EMOTIONS` imports but only `classifyEmotion` is used in the new partition logic. Possible unused-import warnings.

## Things I'd test in `wrangler tail` after deploy

**Smoke test:**
- Trigger `/mood` manually. Verify long-form descriptions appear (not the short "0 — Crisis/Suicidal" form).
- Tap a score. Verify three-button category keyboard appears with 🌫️ Dissociative.
- Tap Dissociative. Verify the 7 dissociative emotions render (3+3+1 grid).
- Cycle: tap "Next: Positive emotions" — should jump to Positive grid with "Next: Negative emotions" button. Negative grid → "Next: Dissociative emotions". Loop confirmed.
- Tap Done with mixed selection. Verify the synthesis prompt now references "Find the friction" framing in the log.

**Resume flow:**
- Trigger `/mood`, answer poll, don't tap emotions.
- Wait 11+ minutes.
- Send any casual message. Verify `mood_flow_resume_offered` event in tail + the "📌 Your check-in is still open" prompt arrives.
- Send another message. Verify NO second resume prompt fires (offered flag working).
- Tap Continue. Verify `mood_flow_resumed` event + fresh poll sent.
- Tap Skip. Verify `mood_flow_skipped` event + all flow keys cleared.

**Persona pass (anecdotal):**
- Send "I am exhausted" — expect a response that does NOT open with "I hear that you are exhausted" or similar.
- Send several emotional messages over a few turns. Watch whether the bot stops compulsively ending with questions (no good metric, just feel).

## Deferred this session

- Tool-timing constraint on `save_therapeutic_note` description ("don't call mid-distress"). Small one-line tool description change. Easy to add later.
- Nano Banana 2 image generation wiring. Roma asked "can we use Gemma to generate images?" — clarified Gemma is text-only. Options for future session: Nano Banana 2 only (paid Gemini), CF Flux Schnell only (free), or cascade.
- Other-users slowness diagnosis. Need a `wrangler tail` capture of a slow request from a non-owner user.
- Vitest broken. Blocks `test/model-invariants.spec.js`.

## Sources

- Xaridotis canonical poll options: `gemini-bot/src/config/moodScale.js`
- Xaridotis workflow with `STEP_TIMEOUT`: `gemini-bot/src/workflows/moodEveningCheckin.js` (Eukara doesn't have an equivalent yet, see architectural note)
- Heuristic-injection rationale: the two feedback documents Roma pasted, points 3 and the "REM Cycle" section. Caveats noted in my previous-turn review: the documents had some shaky technical detail (`gemini-3.5-pro` doesn't exist, Redis/KV reference) but the heuristic-injection core idea is solid clinical practice.
- Cloudflare Workers limits (relevant to why we don't extend `health_checkin_active` to 24h): https://developers.cloudflare.com/workers/platform/limits/
