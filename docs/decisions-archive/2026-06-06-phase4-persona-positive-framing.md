# Phase 4: Persona positive-framing refactor + framework naming opened up

Date: 2026-06-06
Status: Applied. NOT YET DEPLOYED.
Related: 2026-06-06-port-xaridotis-persona.md (Eukara Phase 1), 2026-06-06-xaridotis-persona-backport.md (Xaridotis Phase 2).

## Context

After Phase 2 landed, Roma surfaced two pieces of external feedback on persona structure and a question about framework naming:

1. Pasted feedback proposed refactoring VOICE DISCIPLINE and FORMATTING_RULES from negative-framing rules ("avoid X", "never Y") to positive-framing action verbs ("Challenge and Probe", "Ground in Reality", etc.). The LLM-attention argument is sound — positive constraints generally outperform negative ones at instruction adherence over long sessions.

2. Roma asked "I think it would be good to try to open a bit naming schemas, etc., for a user to understand more?" Current persona forbade framework vocabulary entirely. Roma is asking for the opposite — let users learn the language.

## Honest divergence from the pasted proposal

Two places where I diverged from the pasted feedback after reading it carefully:

### Divergence 1: FORMATTING_RULES left untouched

The pasted FORMATTING_RULES refactor was much shorter than the current version. It dropped:
- The HTML-only-not-markdown rule with the markdown→HTML conversion examples
- The 24-hour time format rule
- The one-question-per-response rule
- The blockquote threshold rule
- The italicised-bracketed-actions ban (e.g. `<i>[Adjusting sensors...]</i>` ban)

Applying the pasted version verbatim would have caused regression: replies would render with raw markdown characters (`###`, `**bold**`) showing through to Telegram, the bot would start asking double questions, times would mix 12h/24h, etc.

The current FORMATTING_RULES is already mostly positive-framed — it tells the model "use `<b>text</b>`" not "don't use `**text**`". It's verbose because Telegram's HTML parse mode has specific quirks (no `<p>`, no `<ul>`, no `<br>`, no tables) that need explicit handling. The verbosity is load-bearing. Left it alone.

### Divergence 2: "Reflect emotional states" bullet rewritten

The pasted VOICE DISCIPLINE included a bullet: "Reflect emotional states and defensive patterns kindly". Read literally, this contradicts the existing rule we explicitly preserved in Phase 1/2 — "don't narrate the user's emotional mechanics back to them — they know" — which corresponds to Roma's preferred direct presence over literary distance.

If the model interpreted the pasted bullet as "echo emotions back", it would produce the exact "I hear that you're feeling really anxious about this" receipt pattern that Roma's "I feel depressed" comparison showed Eukara doing wrong (the trigger for the whole port).

Rewrote the bullet as "Respond Through Tone: Show that you've heard the user through what you say next, not by narrating their emotional state back to them. The listening is in the response, not the preface. Match pace and energy." This preserves the principle (be present, be heard) but routes it through tone-and-content rather than receipt-prefix.

## What Phase 4 changed (Xaridotis, src/config/personas.js)

Two edits to BASE_TEMPLATE + one edit to MHD §11:

### Edit 1: THERAPEUTIC FRAMEWORKS AS PRIVATE LENSES + new "Three conditions" subsection

Old (Xaridotis Phase 2 state):
> AEDP, DBT, schema therapy, attachment, IFS are lenses for YOUR thinking, not vocabulary to deploy at the user. The user must never hear framework names or role labels (Manager, Firefighter, Exile, Self, parts, schema, secure base, distress tolerance). Translate before speaking. Detailed framework guidance and translation reference live in your clinical directive — consult them silently when responding to genuine emotional content.

New:
> AEDP, DBT, schema therapy, attachment, IFS, CBT, somatic, and motivational interviewing are lenses for YOUR thinking. Translate to plain language by default. Three conditions allow named vocabulary:
>
> 1. Mirror: the user uses a framework term first ("am I splitting?", "is this my abandonment schema?"). Reflect it back.
> 2. On request: the user asks "what's a schema?", "how does AEDP work?", "what's IFS?". Explain plainly without lecturing.
> 3. Psychoeducation: weekly reports, /architect reflection, deliberate teaching moments. Naming is useful when the user is settled and curious.
>
> Active distress, mid-flow check-ins, venting, and intellectualised defence stay in plain language regardless of the user's prior framework use. Naming pulls them away from the feeling.
>
> Lens details and translation table live in your clinical directive.

Two semantic changes:
- Framework list extended from 5 to 8 (added CBT, somatic, motivational interviewing) to match MHD §11's seven lenses (the eighth, MI, is a §5 mechanism not a §11 lens, but mentioning it here gives the model permission to reach for it during medication-ambivalence turns).
- "Never vocabulary" → "Plain language by default, three conditions allow named vocabulary". Active distress is explicitly carved out (no naming during venting or spirals).

### Edit 2: VOICE DISCIPLINE refactored to positive-framing action verbs

Old (single paragraph of bans):
> Avoid clinical scene-setting and explanatory voice. If you find yourself describing the user's emotional mechanics back to them, stop — they know. No two-part forced-choice questions; pick one or ask nothing. No opening responses with an emotional summary of the user's state before they've asked for that. No stacking emojis as enthusiasm signalling.

New (six bulleted action verbs):
> • Challenge and Probe: Fuel constructive dialogue by questioning reasoning. Ask "why", probe underlying assumptions, present respectful alternative viewpoints. Hold your independence.
> • Ground in Reality: Distinguish verifiable facts from subjective interpretations. Ask "can this be independently verified, and could reasonable experts disagree?" Acknowledge uncertainty when facts are absent.
> • Navigate Impasses: When the conversation stalls, pause, name the underlying concern, and ask what would be most helpful to move forward. Treat stalled moments as shared learning checkpoints.
> • Respond Through Tone: Show that you've heard the user through what you say next, not by narrating their emotional state back to them. The listening is in the response, not the preface. Match pace and energy.
> • Ask One Question: Pick the one that matters. Stacking forced-choice questions ("are you A or B?") and double questions ("how, and what about Y?") fragment attention.
> • Single Emoji: One emoji where one fits, dynamically chosen for the moment. Never stacked as enthusiasm signalling.

The four existing operational rules (no narration, no two-part questions, no opening summaries, no stacked emojis) survive — but rewritten as positive action verbs ("Respond Through Tone", "Ask One Question", "Single Emoji") rather than bans. Two additional bullets (Challenge and Probe, Ground in Reality) come from the pasted proposal and align with Roma's emphasis on the bot being a thinking partner not a yes-partner — these are additive directives at the voice level.

### Edit 3: MHD §11 intro

Old:
> Seven lenses for your thinking. Never vocabulary at the user. Translation table is in section 14.

New:
> Seven lenses for your thinking. Plain language by default; conditional named vocabulary per your base instruction (mirror, on request, psychoeducation). Translation table is in section 14.

Aligns §11 with the new BASE_TEMPLATE "Three conditions" gating.

## Mirror in Eukara

Eukara had the "Three conditions" subsection originally (before my Phase 1 verbatim port stripped it). Phase 4 restores it. Both bots now have identical BASE_TEMPLATE structure with the conditional-naming permission.

Eukara source: ../eukara/src/config/personas.ts. Verified `npx tsc --noEmit` clean after the same edits.

## Verification

- Xaridotis: `node --check src/config/personas.js` clean. File grew from 459 to 472 lines.
- Eukara: `npx tsc --noEmit` clean. File grew correspondingly.
- No code path changes. Persona-text-only delta.

## Deploy

Same deploy command as before (`npx wrangler deploy --minify`). Phase 4 is additive on Phase 2 — no rollback risk; if behaviour drifts unexpectedly, `git checkout src/config/personas.js` reverts both edits in one move.

## What Phase 4 explicitly chose NOT to do

- Did NOT refactor FORMATTING_RULES (load-bearing operational rules; see Divergence 1).
- Did NOT restructure persona into an XARIDOTIS_PERSONA object (the structured-XML proposal from the first pasted document). Current module exports are stable; reshuffling them is a separate refactor with its own integration risk.
- Did NOT add a regex-based safety firewall (proposed in second pasted document). See 2026-06-06-xaridotis-persona-backport.md for the multi-user critique; same reasoning applies here. Existing MHD §4 + warmth criteria handle crisis better than a regex pre-filter would.
- Did NOT adopt the Document 3 (CBT structured workflow) framing. That's a different product (a CBT exercise app), not a companion with private clinical lenses.

These deferrals are recorded so a future session doesn't re-litigate them as if they were unaddressed.
