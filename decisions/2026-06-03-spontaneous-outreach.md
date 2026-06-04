# Spontaneous Outreach: interest-driven research sharing
================================

**Date**: 2026-06-03
**Status**: Implemented on disk. NOT yet typechecked or deployed. Roma runs `npx tsc --noEmit` then `npx wrangler deploy`.
**Scope**: Port Xaridotis's spontaneous interest-driven research sharing into Eukara, built better. All decisions D1 to D5 below were locked with Roma ("implement everything, no pushback") before editing.

---

## 1. Problem

Eukara already enqueued and handled `spontaneous_outreach`, but the handler was hollow: it generated a generic check-in on the cheap edge model (Gemma) with the stub system instruction "You are a caring AI companion. Be warm, brief, natural.", pulling no memories and no discoveries. The only research producer was the heavyweight user-triggered DeepResearchWorkflow. So there was no autonomous "bot reads something you'd like and texts you about it" loop, and proactive messages did not sound like Eukara.

## 2. Findings that shaped the design (code review + web research)

- Eukara's persona is already strong. The real tone defect was that the proactive path bypassed it entirely. Fixing the routing (not the persona) is the tone win.
- Eukara intentionally weaves discoveries into chat context (persona "weave them in naturally" plus memory.getFormattedContext). So Xaridotis's discovery-isolation rule was deliberately NOT ported; the lighter, correct guard is to gate discoveries out of emotional turns only.
- Quiet hours was referenced by the persona (`set_quiet_hours` / `clear_quiet_hours`) but never implemented (no tools, no state). The persona was over-promising.
- No last-seen tracking existed.
- Proactive context-aware outreach is supported by the literature for engagement (e.g. PaRT 2025; ACM TOIS proactive-conversational survey), but companion-app retention tactics carry a documented manipulation/over-dependence risk (HBS De Freitas 2025; APA 2026). The healthy design is genuine usefulness, not engagement-bait: hence the 1/day cap, "just share, do not be a therapist" framing, and quiet-hours respect.
- Gemini grounding with Google Search reduces but does not eliminate hallucination (Google safety docs). Hence: retain the source link, frame discoveries tentatively when surfaced.

## 3. Decisions (as implemented)

- **D1 Tone**: proactive generation (spontaneous outreach, health check-ins, med nudge) now routes through Eukara's real persona voice (BASE_INSTRUCTION + FORMATTING_RULES) on Gemini (GEMINI_MODELS.pro = gemini-3.5-flash), not the generic stub on Gemma. Infrequent, so cost is negligible.
- **D2 Research producer**: new lightweight grounded Gemini + Google Search producer, twice weekly (Tue + Fri 04:00 local), writes a `discovery` memory and RETAINS the source link (improvement over Xaridotis, which drops it).
- **D3 Interest source**: research topics are derived from the user's own memory store (categories: fact, preference, interest, idea, brain_dump, hobby, goal), with a small hardcoded DEFAULT_INTERESTS fallback only for a brand-new user with no memories.
- **D4 Guardrails**: kept the 1/day cap; added a last-seen guard (no outreach within 3h of the user's last message) and an emotional-turn gate; built minimal quiet hours (KV state + the two tools the persona already referenced) and made outreach respect it. Clinical / medication care is unaffected by quiet hours.
- **D5 Discovery-in-context**: kept (Eukara design), but gated out of emotional turns via getFormattedContext(..., includeDiscoveries=false). Xaridotis isolation behaviour deliberately not ported.

## 4. Architecture

Producer/consumer decoupled through the `memories` table (same shape as Xaridotis):
- Producer: `services/curiosity.ts:maybeRunResearch` (cron, twice weekly, self-gating with KV idempotency `auto_research_<userId>_<date>`). Runs regardless of quiet hours (it produces a memory, does not message).
- Consumer: `router/queue.ts` `spontaneous_outreach` case. Pulls 50 memories, drops clinical/structural categories (OUTREACH_EXCLUDED_CATEGORIES), weights selection toward discoveries then ideas (pickOutreachMemory), and builds a content-aware prompt (buildOutreachPrompt) that frames a discovery as "something you read" with its source.
- Cron gate (router/cron.ts): sociable hours 10 to 19, ~5% per-minute roll, daily cap, last-seen >= 3h, not in quiet hours.

## 5. Files changed

- NEW `src/services/curiosity.ts`: maybeRunResearch + deriveInterests + extractFirstSource.
- `src/services/user.ts`: isQuietTime / setQuietHours / clearQuietHours (KV `quiet_until_<userId>`).
- `src/tools/reminder-tools.ts`: set_quiet_hours / clear_quiet_hours tools.
- `src/tools/index.ts`: registered the two tools.
- `src/router/cron.ts`: call maybeRunResearch; added quiet + last-seen guards to the outreach enqueue.
- `src/router/queue.ts`: rewrote generateCheckinMessage to use Gemini + persona; rewrote spontaneous_outreach to select and share a memory/discovery; added selection helpers. Removed now-unused CloudflareProvider + CF_MODELS imports.
- `src/services/memory.ts`: getFormattedContext gained includeDiscoveries param; discovery split from growth.
- `src/bot/message.ts`: write last_seen_<userId> early; compute isEmotional before context assembly and pass !isEmotional to getFormattedContext.

## 6. Verification pending (Roma)

1. `npx tsc --noEmit` in the eukara repo. Watch: queue.ts (MENTAL_HEALTH_DIRECTIVE import may now be unused, harmless under current tsconfig), curiosity.ts grounding-metadata access.
2. Deploy via wrangler.
3. Confirm the model actually calls set_quiet_hours when asked for quiet (persona directive now backed by a real tool).
4. After a Tue/Fri 04:00 run, check D1 for a `discovery` memory containing `[source: ...]`, then confirm a later outreach surfaces it with the link.

## 7. Not done (out of scope)

Curiosity digest (multi-topic), self-improvement persona evolution, accountability nudge, DLQ, topics routing, tagger lite. These remain on the Eukara gap list.
