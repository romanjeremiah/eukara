# 2026-05-22 (evening) — Anti-Summary discipline applied to mood synthesis (Option A)

**Status:** LOCKED. `node --check` clean. Not deployed.
**Predecessor:** `2026-05-22-routing-rules.md` (afternoon — routing rules doc + memory consolidation cadence change).
**Supersedes:** the prior "Respond as a supportive and understanding friend" closing directive in `composeSynthesisPrompt`.

---

## Context

Roma raised the question of whether the spec's "Cognitive Decoupling & Heuristic Injection" pattern (Mem0 / LangGraph research) is implemented in `moodSynthesis.js`. Audit showed:

- **Data pipeline:** correctly pulls FIVE signal sources (today's data + 7-day mood history + episodes filtered by today's emotions + therapeutic memories with categories `pattern`/`trigger`/`schema`/`insight`/`homework`/`growth` + Vectorize semantic context). This part of the spec was already in place.
- **Prompt construction:** procedural string concatenation with a closing directive of "Respond as a supportive and understanding friend who notices patterns and helps him think." This is the exact RLHF-counselor framing every consumer LLM is trained to produce, and it is what was making synthesis output sound generic ("It sounds like you've been navigating a mix of emotions...").
- **Missing pieces from the spec:**
  - No explicit ban on the four therapy-speak phrase patterns.
  - No "find the friction" mandate.
  - No 2-3 sentence cap.
  - No "end with a blunt observational question" instruction.
  - No labelled heuristic-injection sections — the data was buried in procedural prose ("His past 7 days:", "His patterns and known triggers:").
  - No Step 2 silent-analysis pre-pass.

I proposed three options:
- **A:** Anti-Summary prompt rewrite ONLY. Data pipeline, cascade, callers untouched. ~80% of the quality gain at ~5% of the implementation cost.
- **B:** A + `maxOutputTokens: 400` cap as a backstop. Adds a deliberate exception to Roma's "never cap" rule.
- **C:** Full Synthesis Chain — Step 2 silent-analysis pre-pass with hidden JSON, then a persona-speaks Call 2 reading the analysis. Architecturally honest, doubles cost and complexity.

Roma chose **Option A**, with Option C deferred until 3-5 real check-ins have been observed under Option A.

---

## Why Option A is the right call (and why not C now)

**The 80/20 split is real.** The Anti-Summary prompt rewrite addresses the immediate failure mode (model defaulting to RLHF-counselor register). The Step 2 silent-analysis pass addresses a different, more subtle failure mode (model averaging instead of frictioning). The first is observable from a single check-in; the second only emerges from pattern analysis across many.

**Designing Step 2 before observation is premature.** The JSON schema for the analysis pass should be shaped by the failure modes we actually see in Option A's output. Designing it in the abstract means we'll design for theoretical failures and miss the real ones.

**Reversibility matters.** Option A is a single prompt change — if it goes worse, revert. Option C is a multi-stage architecture change with new state (analysis JSON persistence, cascade walker changes, possibly a new D1 table for analysis history). Much harder to roll back if it's wrong.

**The observation window forces discipline.** 3-5 actual mood check-ins ≈ 3-5 days. That's enough signal to see whether Option A's output is genuinely sharper or whether the constraints are being ignored. If it's sharp, we're done. If it's still drifting, we have concrete examples to point at when scoping C.

---

## What landed

### File: `src/services/moodSynthesis.js`

**Single function rewritten:** `composeSynthesisPrompt`.

**Header comment updated** with rationale block documenting Option A and what it changes vs preserves.

**New prompt structure (labelled blocks):**

```
[TODAY'S DATA]:
- Mood score: 4/10
- Emotions: anxious, frustrated, tired
- Activities: work, deep work
- Sleep: 5.5 hours

[MOOD SCALE]:
0 - Catastrophic
...
10 - Euphoric

[RECENT TREND] (last 7 days — context only, not for naming today's state):
- 2026-05-21: 7/10, calm, content
- 2026-05-20: 6/10, focused
- ...

[RELATED EPISODES] (past moments where similar emotions surfaced):
- [coping] When anxious + tired together, reaching for caffeine has been
  a known pattern with mixed outcomes.
- ...

[KNOWN HEURISTICS] (Roman's established patterns, triggers, schemas, insights):
- [trigger] Anna's silence on Telegram triggers abandonment schema.
- [pattern] Score 7+ logged on days where every emotion was negative
  has correlated with masking in 3 prior journal entries.
- ...

[SEMANTIC CONTEXT] (related themes from past conversations):
- 2026-05-15: Discussion about high-functioning anxiety and the
  performance/reality gap.
- ...

=== STRICT CONSTRAINTS ===
1. DO NOT SUMMARIZE. Do not list the days, do not average the scores,
   do not enumerate the emotions, do not narrate his week back to him.
2. NO THERAPY-SPEAK. You are absolutely forbidden from using these phrase
   patterns or anything close to them:
   - "It sounds like you've been..."
   - "Navigating ups and downs / a mix of emotions / a lot lately..."
   - "You've had a mix of emotions / a tough week / a hard time..."
   - "It might be helpful to... / Perhaps you could... / Have you considered..."
3. FIND THE FRICTION. Compare [TODAY'S DATA] against [KNOWN HEURISTICS] and
   [RELATED EPISODES]. Is a known trigger active? Is there a contradiction
   (e.g. high score but every emotion picked was negative; gratitude logged
   but isolation also picked; says fine but slept 3 hours)? Name the one
   specific friction you see, not three.
4. ECONOMY OF WORDS. Maximum 2-3 sentences. The first sentence is the
   observation. The second optionally grounds it in a known pattern. The
   third is the question (see constraint 5).
5. NO PLATITUDES. End with a single blunt observational question that
   forces reflection — NOT a generic "how are you feeling?" or "is there
   anything you'd like to share?". The question must reference the specific
   friction you named in constraint 3.
6. ONLY TODAY'S EMOTIONS. Only reference emotions Roman recorded TODAY.
   The 7-day history is trend context; do NOT invent or mix in emotions
   from other days.
7. NO INVENTED FACTS. If a heuristic isn't in [KNOWN HEURISTICS], do not
   claim it. If an episode isn't in [RELATED EPISODES], do not reference
   it. Speak only to what is in the data above.

[SAFETY]: If anything in [TODAY'S DATA] suggests immediate safety concern
(mood score ≤ 2, emotions including "hopeless" / "suicidal" / "can't go
on", or similar), end your message with these helplines on a new line:
Samaritans 116 123, SHOUT text 85258, NHS 111.
```

### What did NOT change (verified by grep)

| Element | Status |
|---|---|
| `SYNTHESIS_TIERS` cascade | Unchanged: gemini-3.5-flash → gpt-5.4 → gemini-3.1-flash-lite |
| `runSynthesisCascade(env, userId, startedAtMs, systemPrompt)` signature | Unchanged |
| `maybeFireSynthesis(env, chatId, userId, threadId)` signature | Unchanged |
| Callers in `src/tools/mood.js`, `src/workflows/moodEveningCheckin.js`, `src/bot/handlers.js` (×2) | Unchanged |
| `buildSynthesisDataBlock` (all 5 signal-source queries) | Unchanged |
| `combineDayEntries` (multi-row-per-day handling) | Unchanged |
| `FIXED_FALLBACK_TEXT` floor on cascade exhaustion | Unchanged |
| No `maxOutputTokens` cap | Confirmed |
| No `temperature` override | Confirmed |

---

## Pre-deploy actions

1. `npx wrangler deploy --minify`. No bindings, no secrets, no schema changes.
2. Wait for the next evening mood check-in (20:30 London) or trigger one manually.
3. After the synthesis fires, tail-watch the `mood_synthesis_done` log line for the output text.
4. Verify NONE of these phrase patterns appear in the output:
   - "It sounds like"
   - "Navigating"
   - "a mix of emotions"
   - "It might be helpful"
5. Verify the output is 2-3 sentences.
6. Verify the output ends with a question that references something specific from [TODAY'S DATA] or [KNOWN HEURISTICS] (not a generic "how are you feeling?").

---

## Observation window: 3-5 real mood check-ins

This is the gate before Step 2 / Option C work begins. Collect:

- Whether the four banned phrase patterns surface at all (rough compliance rate).
- Whether output is consistently 2-3 sentences or drifts longer.
- Whether the "find the friction" instruction produces specific observations or remains abstract.
- Whether the closing question references the specific friction or falls back to generic check-out.
- Whether the model invents facts (claims heuristics / episodes that aren't in the input).

If compliance is high (>80%), Option C may not be needed at all. If compliance is patchy on specific constraints (e.g. "model still summarises despite the ban"), THAT is the signal for Option C: it means single-pass attention is splitting between analysis and voicing, and a silent-analysis pre-pass would do the analysis cognitive job alone.

---

## Known risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Model ignores constraints anyway (LLMs sometimes do) | Medium | Output drifts back toward summary register | Observe; Option C addresses this structurally |
| Constraint stack is too long, model loses track | Low | Particularly long synthesis prompts can cause attention dilution | Constraint block is ~25 lines; well under the typical attention horizon for Gemini 3.5 Flash |
| Output now too short / clipped at sentence boundary | Low | No `maxOutputTokens` cap, so this would be model-side, not infrastructure | Observe; if it happens, the prompt itself is wrong, not the cap |
| Question at the end becomes interrogation-style instead of reflective | Medium | Sharp questions can land as harsh; the "blunt observational" framing might overshoot | Observe across 3-5 check-ins; tune the constraint wording if needed |
| F4 Therapeutic REM (Sunday 03:00) writes patterns that surface as `[KNOWN HEURISTICS]` and feedback-loop into synthesis | Low | F4 is best-effort, validator caps at 5 obs/week, and Anti-Summary "no invented facts" rule protects against false claims | Observe whether F4-written heuristics produce sharper or noisier synthesis |

---

## Deferred (still)

- **Option C / Step 2 silent-analysis pre-pass** — wait for 3-5 check-ins of Option A data before scoping.
- **Anti-Summary discipline rollout to other voice paths** (mood acks, check-in greetings, weekly report, accountability nudge, daily-study share) — separate session if Roma wants it. The discipline could be extracted into a shared `XARIDOTIS_DISCIPLINE` constant in `src/config/personas.js` and injected into every short-response system prompt.
- **`generateShortResponse` 5-tier vs 3-tier** — disk has 5, spec says 3. Roma's call.
- **Flex Inference wiring** — design item per ROUTING_RULES.md.
- **Vectorize V2 backfill script** — re-embed ~700 768-dim memories into v2.
- **WASM Opus encoder** — unblocks TTS Tier 1.
- **Tool-emitted signature plumbing** (quote.js, effect.js).
- **Step 5: streaming everywhere**.

---

## Honesty section

Smallest session of the day. One function rewrite, three documentation files updated. The discipline I want to flag:

- **Pushed back hard on the user's proposed snippet** before implementing. The snippet imported from a non-existent `ai-gateway.js`, called a non-existent `runLlm`, queried a non-existent `therapeutic_notes` table, set `temperature: 0.4` (violates standing rule), capped `max_tokens: 150` (violates standing rule + risk of mid-sentence truncation on Gemini), bypassed the cascade entirely, and dropped 4 of 5 signal sources. Naming these specifically rather than implementing the snippet verbatim was the right call.

- **Did not implement Option C** despite the appeal of doing the architecturally complete thing. The discipline of "observe Option A for 3-5 check-ins first" is the right one because we don't yet know which failures Option A solves and which it doesn't.

- **Did not silently add a token cap** even though it's tempting as a backstop. The "economy of words" property should come from the prompt ("max 2-3 sentences") not from a token wall. If 3-5 check-ins show that the prompt-only constraint is being ignored, then we revisit with Option B (token cap as a deliberate exception, called out in the file header).

What I'd do differently: nothing in the implementation. The earlier draft of this session was interrupted partway through writing the decision doc, but everything that mattered (the code, the journal, the tracker) landed cleanly in the previous turn. This turn just completed the decision doc.
