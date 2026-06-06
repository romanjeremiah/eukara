# Port Xaridotis persona to Eukara (Eukara as sister product)

Date: 2026-06-06
Status: Phase 1 applied; Phase 2 and 3 pending.
Author: Roma + Claude
Supersedes: 2026-06-03-eukara-architecture-principles.md (architectural doctrine on Eukara independence)

## Context

Roma is preparing to test Eukara with additional users. To minimise product divergence between Xaridotis (his personal primary bot) and Eukara (the multi-user testbed), he wants the two bots to share persona DNA. Direction:

- Xaridotis is primary. New features, behavioural improvements, and persona changes land there first.
- Eukara is the sister product. Cheaper architecture (no Anthropic Sonnet fallback, lighter cron load, simpler agent infrastructure), but the persona text and memory architecture mirror Xaridotis byte-for-byte where possible.
- Per-user adaptation (persona_config sliders: tone, formality, humour_level, emoji_style, therapeutic_approach, verbosity, proactivity_level) remains on Eukara only. It sits on top of the shared base, not in place of it.

This reverses the 2026-06-03 architecture-principles doctrine which positioned Eukara as architecturally independent of Xaridotis. That doctrine is now superseded.

Roma's explicit asks driving this change:

1. Remove Eukara's persona anti-pattern rules (NO RECEIPTS banning "I hear you", NO SILVER LININGS, ASYMMETRIC PACING question cap). His framing: "I think it is sometimes better to say what to say (set expectations)."
2. Remove the Bare Minimum Survival Checklist auto-deploy.
3. Copy literally everything from Xaridotis persona instructions to Eukara, word-for-word.

Trigger conversation: Roma compared a Eukara reply to "I feel depressed" against Xaridotis's reply to the same content. Eukara produced literary distance ("It is exhausting when that gray flatness takes over... I'm not going to push a fix"). Xaridotis produced direct presence ("I hear you, and I am right here with you. It's incredibly heavy to carry that kind of darkness..."). Roma preferred Xaridotis. The Eukara reply was the literal output of its persona's NO RECEIPTS + NO SILVER LININGS rules; the model resorted to literary third-person observation as the "safe" alternative because direct presence was banned.

## What Phase 1 changed (Eukara, src/config/personas.ts)

Five exports now match Xaridotis (../gemini-bot/src/config/personas.js) with three intentional divergences:

1. {NAME} resolves to 'Eukara' (vs 'Xaridotis').
2. PROJECT REALITY in SECOND_BRAIN_DIRECTIVE reflects Eukara's TypeScript stack (vs Xaridotis's strict JavaScript ES modules). The line "NEVER suggest reverting to JavaScript" replaces Xaridotis's "NEVER suggest TypeScript".
3. MHD section 10 (previously "ADAPTIVE SURVIVAL ROUTINES") renamed to "CHECKLIST TOOL USE". The auto-deploy of create_checklist at mood 2/3 (Bare Minimum Survival Checklist) and mood 8 (Grounding Checklist) is gone. The section now describes when checklist use is appropriate (explicit user request, structured breakdown, personal protocol the user wants tracked) and explicitly forbids auto-deploy on mood thresholds.

Eukara-only MHD additions are KEPT (will be promoted to Xaridotis in Phase 2):

- §3 Dissociative emotions library (numb, depersonalised, derealised, splitting, fragmented, switching) — treated as altered-state, NOT negative-valence.
- §5 Medication ambivalence handling via motivational interviewing — roll with resistance, never argue the side the bot prefers.
- §11 Two additional therapeutic lenses (Cognitive patterns / CBT, Somatic / body awareness) on top of Xaridotis's five.
- §15 Relationship Conflict — Gottman complaint vs criticism, perspective-taking, accountability without shame, rehearsal not script.

These are pending promotion to Xaridotis. Until then, Eukara has more clinical content than Xaridotis. The Phase 2 backport will sync them.

Eukara-only BASE_TEMPLATE additions removed in this port:

- NO RECEIPTS rule (banned "I hear you" openers).
- NO SILVER LININGS rule (banned reassurance phrases).
- ASYMMETRIC PACING rule (one-question-per-turn cap).
- AVOID AI TELLS list (delve, leverage, tapestry, etc.).
- HONOUR USER CONSTRAINTS rule (preserved separately as ACTIVE USER CONSTRAINTS at the top of SECOND_BRAIN_DIRECTIVE).
- The "Three conditions allow named vocabulary" subsection (mirror, on request, psychoeducation).
- Extended framework list (CBT, motivational interviewing, somatic, narrative) in BASE_TEMPLATE — reduced to Xaridotis's five (AEDP, DBT, schema, attachment, IFS). MHD §11 still lists seven lenses because that section is the detailed clinical scaffolding rather than the base description.
- The creative/generative tone branch in HOW YOU ADAPT.

Baseline shift: "warm but unperformed" → "observational and sparing — warmth present but unperformed, felt through consistency and the fact that you remember things". This is Xaridotis's baseline, restored.

New export added:

- CASUAL_REGISTER_DIRECTIVE — Xaridotis verbatim. Dead text in Eukara today; the intent classifier that drives injection is not yet wired. When the classifier lands in src/router/message.ts (Phase 3 or earlier), this directive becomes live for casual-intent turns.

## What Phase 1 changed (Eukara, checklist tool)

Per Roma's direction "I want Eukara being able to create check lists like Xaridotis where it make sense, so need to check in Xaridotis how it works."

Files:

- NEW src/tools/checklist-tools.ts — port of ../gemini-bot/src/tools/checklist.js. Provides `createChecklist` tool (registered as `create_checklist` in the AI schema) and `buildChecklistText` helper. The tool description explicitly tells the model NOT to auto-deploy on mood scores.
- MODIFIED src/tools/media-tools.ts — removed the prior static `sendChecklist` tool (text-only, no interactive buttons). Replaced with a note explaining the supersession.
- MODIFIED src/tools/index.ts — registers `createChecklist`, removes `sendChecklist` reference.
- MODIFIED src/bot/callback.ts — adds the `chk|` callback handler. Mirrors Xaridotis's chk| handler at gemini-bot/src/bot/handlers.js:3040 verbatim (parse index, mutate button text between ☐ and ✅, rebuild progress text via buildChecklistText, editMessage with the updated keyboard).
- MODIFIED src/types/telegram.ts — added `reply_markup?: TelegramInlineKeyboardMarkup` to TelegramMessage. Per Bot API 9.6 spec the field exists on messages the bot sent with reply_markup set; Eukara's types just hadn't modelled it.

## What Phase 1 changed (Eukara, mood synthesis prompts — already on disk from earlier in the session)

The MOOD_RESPONSE_REINFORCEMENT constant and score-banded buildAnalysisPrompt / buildSummaryPrompt / runClinicalConcernWork prompt rewrites in src/bot/poll.ts and src/bot/mood-callbacks.ts remain unchanged by Phase 1 of this port. They co-exist with the new persona by reinforcing the same directional shift — "I hear you" and "I'm right here with you" are explicitly carved out as presence (not sycophancy) in mood-response context. With the NO RECEIPTS rule now gone from the persona, the reinforcement is partially redundant but still useful as a per-turn nudge. Keeping it.

## Phase 2 plan (Xaridotis backports — NOT YET DONE)

Pending Roma's approval to proceed, the next session does the following on the gemini-bot repo:

1. Port Eukara's MHD §3 dissociative emotions library into Xaridotis MHD §3.
2. Port Eukara's MHD §5 motivational interviewing on medication ambivalence into Xaridotis MHD §5.
3. Port Eukara's MHD §11 CBT (Cognitive patterns) lens into Xaridotis MHD §11.
4. Port Eukara's MHD §11 Somatic (body awareness) lens into Xaridotis MHD §11.
5. Port Eukara's MHD §15 Relationship Conflict section into Xaridotis MHD as new §15.
6. Modify Xaridotis MHD §10 (ADAPTIVE SURVIVAL ROUTINES) to drop the auto-deploy lines, matching Eukara's CHECKLIST TOOL USE rewrite. Xaridotis already has the create_checklist tool, so this is text-only.
7. Add the MEMORY SUPERSESSION bullet to Xaridotis SECOND_BRAIN_DIRECTIVE's TOOL SELECTION HARD CONSTRAINTS section. The supersession infrastructure already exists in Xaridotis (schema, services/knowledgeGraph.js, handlers.js routing); only the persona-level rule needs to land.
8. Remove AI signature footers ("via gemini-3.1-flash-lite", "via gemini-pro-latest") from outbound messages. 27 caller sites of `formatReplyWithSignature` in src/. Determine whether to delete the function or gate it behind a debug flag.

These are bounded changes to working production code. tsc-equivalent verification for JavaScript: `node --check src/config/personas.js && node --check src/lib/formatter.js && node --check src/index.js`. Recommend deploying Phase 2 in two sub-passes (persona changes first, signature removal second) so any regression has a smaller blast radius.

## Phase 3 plan (Xaridotis multi-user — NEEDS DESIGN CONVERSATION BEFORE CODE)

Roma asked for per-user isolation in Xaridotis. Pre-work investigation (this session) found that the SCHEMA-level multi-tenancy is mostly already in place:

- Every D1 table in Xaridotis already has `user_id INTEGER NOT NULL` with FOREIGN KEY to user_profiles, and per-table user_id indexes. The schema is multi-tenant-ready.
- Memory supersession (which Roma's pasted document said to add) already exists extensively: `superseded_by_id INTEGER` columns on knowledge_graph and memories, full `markSuperseded` in services/knowledgeGraph.js, ADD/UPDATE_SUPERSEDED/CONTRADICT classifier in handlers.js, post-search supersession filter in memoryStore.js.
- Spontaneous outreach (which the document said to port from Eukara) already exists in Xaridotis: `handleSpontaneousOutreach` at src/index.js:781, queue task `spontaneous_outreach` wired at line 2309.

What's actually missing for genuine multi-user Xaridotis:

A. **Routing layer single-owner assumptions.** Every cron handler (`handleMorningCheckin`, `handleMiddayCheckin`, `handleEveningCheckin`, `handleArchitectureEvolution`, `handleWeeklyReport`, `handleMidWeekNudge`, `handleNarrativeLedger`, `handleSpontaneousOutreach`, etc.) hardcodes `env.OWNER_ID`. These need iteration over an authorised users table rather than a singleton.

B. **Authorisation middleware on update entry.** Currently the webhook handler in src/index.js admits any update whose user.id passes a permissive check. Need an explicit `authorised_users` table and middleware that returns 403 (or silent ignore) for non-admitted users.

C. **Chat topic IDs (secondBrain=553951, moodJournal=553952, weeklyReports=553953).** These are Roma's specific Telegram thread IDs. For multi-user, each user needs their own set of topic IDs stored in user_profiles, or topics need to live as direct messages without threads.

D. **Vectorize metadata filter audit.** Confirm `semanticSearch` and friends always filter by user_id before returning context to the prompt. Quick read suggests they do, but worth an explicit pass.

E. **D1 query audit.** Confirm every query in services/ and bot/ includes explicit `WHERE user_id = ?`. The schema indexes are there; the queries need verification.

F. **Onboarding flow.** New user joins → /start triggers user_profiles row creation, timezone picker, persona preset picker. Eukara has most of this; Xaridotis assumes Roma already exists.

Phase 3 is genuinely substantial (~half a day to a day of work, several hundred lines of routing changes, plus testing). Recommend a separate session with a dedicated design pass before any code, including:

- Is Xaridotis genuinely going multi-user, or was the request a discipline-for-Eukara framing? If the latter, none of this is needed and the work shrinks by ~80%.
- If multi-user, how are new users admitted? Telegram handle whitelist? Invite codes? Open?
- Does the AI signature removal happen in Phase 2 (independent of multi-user) or wait for Phase 3?
- Topic IDs strategy.

## Open follow-ups from this session (not part of the port)

- Mood synthesis prompt fixes in poll.ts and mood-callbacks.ts (on disk, not yet deployed).
- Pass 1/2/3 persona deduplication work (on disk, not yet deployed) — partially mooted by this port since the persona is now Xaridotis verbatim, but the supporting changes (mood prompt reinforcement, etc.) survive.
- Per-user adaptation infrastructure already deployed to production D1 schema: persona_config.verbosity and persona_config.proactivity_level columns exist with Roma set to 'balanced' preset.

## Verification

- `npx tsc --noEmit` clean after each Phase 1 file change (verified twice during session: after persona rewrite, after callback handler add).
- `node --check ../gemini-bot/src/config/personas.js` clean as of start of session (Xaridotis source, unmodified).
- File line counts: src/config/personas.ts grew from 415 to roughly 480 lines (added CASUAL_REGISTER_DIRECTIVE plus expanded ACTIVE USER CONSTRAINTS and TOPICS sections). src/tools/checklist-tools.ts new at 105 lines.

## Deploy

`npx wrangler deploy --minify` from the Eukara repo. Phase 1 is additive (new checklist tool, new persona text) and replaces the static sendChecklist tool which had no observed callers. Safe to deploy on its own.
