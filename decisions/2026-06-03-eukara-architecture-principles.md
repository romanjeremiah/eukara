# Eukara Architecture Principles

**Date**: 2026-06-03
**Status**: Accepted. Standing instruction for all Eukara work.
**Trigger**: Phase 1+2 review surfaced multiple cases where Xaridotis patterns had been ported wholesale instead of designed for Eukara's actual architecture.

---

## Core principle

**Eukara is not Xaridotis-in-TypeScript.** Eukara has its own architectural decisions (Pro-lane cascade, hybrid dispatch via queue/inline/waitUntil, single-tenant-first with multi-user readiness, service-first design, native Cloudflare Workers stack). Patterns from Xaridotis (JS, looser service boundaries, different cascade tiers, KV-heavy state machines) are reference points, not blueprints.

When implementing a feature in Eukara, the question is not "how does Xaridotis do this?" but "what is the right shape for Eukara?". Cross-referencing Xaridotis is useful for understanding the user-facing intent (what the feature accomplishes for the user) and for noting tradeoffs that surfaced there. It is not useful as a starting template.

---

## Always evaluate alternatives before implementing

Before writing code for any non-trivial feature:

1. **State the user pain.** Not the technical change. The thing the user feels.
2. **List at least two distinct ways to address it.** Different in approach, not just different in flavour (e.g. "streaming synthesis" vs "separate micro-ack" vs "edit-in-place" are three different approaches to the same latency-perception problem; "Flash-Lite micro-ack" vs "Pro micro-ack" is one approach in two flavours).
3. **Note the tradeoff for each.** Latency, cost, complexity, reliability, user friction.
4. **Pick one with reasoning.** If it matches a Xaridotis pattern, that is fine, but the reasoning must be Eukara-grounded, not "Xaridotis did it".

Skipping this step is the failure mode that produced the issues in this review. Examples of what would have been caught:
- The `60s` dedup window: would have surfaced that Eukara's traffic patterns differ from Xaridotis (slower-paced, AI-only reminders), and the number is defensible but should be documented as Eukara-justified.
- `listDuePending` table-wide read: would have surfaced the multi-user starvation risk before shipping.
- `MicroAck` design: would have surfaced streaming, message-edit, and model-downgrade as alternative approaches that may serve Eukara better than the Xaridotis "fast ack call".

---

## Naming conventions

### Service files (`src/services/*.ts`)
**Singular domain noun.** `memory.ts`, `episode.ts`, `mood.ts`, `weather.ts`, `user.ts`, `persona.ts`, `reminders.ts`, `topicShift.ts`, `vector.ts`.

The historical exception (`reminders.ts` plural) is preserved because `reminder` would clash with the common per-row variable name `reminder` in loops, and the file genuinely operates on a collection rather than a singleton.

### Namespace imports
Match the file name. `import * as user from '../services/user'`, `import * as persona from '../services/persona'`, `import * as reminders from '../services/reminders'`.

### Config files (`src/config/*.ts`)
Plural is acceptable here (`personas.ts`, `persona-presets.ts`, `models.ts`, `emotions.ts`) because they contain static collections of constants, not domain runtime logic.

---

## Service-layer rules

1. **Services own SQL.** Tools, handlers, and routers do not write raw SQL against domain tables; they call into services.
2. **Function signatures: `(env, userId, input)`.** Input is an options object when more than 3 fields. Matches `services/episode.ts:saveEpisode`. Avoids long positional argument lists like `(env, userId, chatId, threadId, text, dueAt, opts)`.
3. **Ownership checks at SQL level.** Every UPDATE / SELECT-by-id includes `AND user_id = ?` in the WHERE clause. JS-side filtering on table-wide reads is not "defence in depth"; it is a starvation vector under load.
4. **Errors throw by default.** DB errors propagate. The one documented exception is `user.getUserTimezone`, which falls back to `Europe/London` because cron and message handlers cannot proceed without a tz; the deviation is documented in the function's JSDoc.
5. **No cross-service circular dependencies.** Direction is fixed: `persona → user`, never the reverse. `reminders` and `mood` are leaves.
6. **Single bootstrap path.** `user.ensureUser` is the only entry point that creates `user_profiles + persona_config` rows. Other services assume the user exists.

---

## AI-call rules

1. **No bypassing the Pro-lane cascade.** Direct `new GeminiProvider(...)` calls in handlers or queue workers must justify why they cannot use `chatWithProLaneFallback`. The cascade exists so a single provider outage does not break end-user functionality; opting out re-introduces the fragility.
2. **No new "MicroAck" calls without a latency budget.** Latency mitigations should be considered in order: streaming → message-edit → model-downgrade → separate ack call. Each adds complexity; pick the lowest-complexity option that solves the perceived problem.
3. **System prompts compose, do not duplicate.** `persona.buildSystemInstruction` is the canonical assembly point. New flows that need a system prompt should extend the composition, not inline `${BASE_INSTRUCTION}\n\n${MENTAL_HEALTH_DIRECTIVE}\n\n${FORMATTING_RULES}`.

---

## Metadata column rules

1. **Free-string conventions over strict enums.** Metadata fields like `origin` use documented free strings (`'ai_suggested'`, `'user_command'`, `'recurrence'`, `'workflow'`) rather than TypeScript-enforced unions. The runtime cannot validate them anyway; documented conventions allow callers to extend without an interface change.
2. **Typed sub-structures where shape matters.** Nested objects like `recurrence: { kind, expression }` keep their literal-union types because their shape is consumed by callers.

---

## Process rules for this collaboration

1. **Re-read disk before assuming context.** Memory is a hint, not authority. Read `journal.txt` and grep source before planning edits.
2. **Consult before patching on multi-step debugging.** Explain root cause, offer options with tradeoffs, get a call. Do not jump straight to a fix in unclear situations.
3. **Surgical edits.** Grep for the identifier, verify exact whitespace, construct precise `oldText`/`newText` pairs. Full rewrites only when the change density justifies it.
4. **Verify with `npx tsc --noEmit` before declaring complete.** Then summarise what was done, what was deferred, and what to watch for after deploy.
5. **Roma owns deploy.** Claude edits files and confirms type-clean; Roma runs `npx wrangler deploy --minify`.

---

## Living document

This document is not exhaustive. Future architectural decisions for Eukara should be added here (or referenced from new dated decision files in this directory). When a Xaridotis pattern is ported to Eukara, the decision file should explain why the Eukara version differs.
