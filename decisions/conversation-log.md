# Eukara Conversation Log

Running record of Roma's conversations with Claude about Eukara: questions
asked, decisions made, implementation outcomes. Newest sessions at the top.
Full session-specific decision rationale lives alongside in
`/decisions/<date>-<slug>.md`. Terse session summaries live in
`/journal.txt`.

This file exists per Roma's explicit instruction (2026-06-02): "create a
file in the project folder and write there each conversation we have,
including my responses and decisions, so we can always track decisions
and how and what gets implemented".

---

## 2026-06-02 — Pro-lane migration, always-on grounding, bug pass

### Context Roma raised

Bug observed during morning check-in: bot greeted, user replied "yes.",
bot then responded with content from days-old "scatter method / peanut /
squirrel feeding" conversation that had nothing to do with the current
turn. A separate Marvel-movies question received no response and no log
line.

Roma asked Claude to:
1. Audit the Eukara codebase + functionality.
2. Cross-check against the official Cloudflare Gemma 4 docs to find
   capability gaps.
3. List every model used and where.
4. Verify the model IDs `gemini-3.5-flash` and `gemini-3.1-flash-image`.
5. Review Telegram Bot API features for capabilities Eukara isn't using.

### What Claude found

**Root causes**

- `queue.ts` health_checkin / med_nudge / spontaneous_outreach send the
  greeting via raw `sendTelegram` without calling `saveHistory`. The
  greeting never enters history. The user's "yes." reply loads stale
  history (potentially days old) and the model confabulates from that.
- The Marvel question was a fresh-info query routed to the Gemma
  default_casual model, which had no `web_search_options` enabled. The
  model has no information past January 2025 and either refused or
  silently failed (no log line found; likely a 30-second timeout).

**Other bugs surfaced during audit**

- F2: `background.ts:deduplicateMemories` calls GLM 4.7 Flash but parses
  `{response: ...}`. GLM returns `choices[0].message.content` (OpenAI
  compat). Dedup has been silently returning null since the model was
  changed.
- F3: workflows consolidation / architect / research query D1 by
  `chat_id`. Everywhere else has migrated to `user_id`. Workflows on the
  old key.
- F4: `queue.ts` uses deprecated `max_tokens: 200` on Gemma calls.
  Should be `max_completion_tokens`.
- F5: `models.ts` comment "Cloudflare Workers AI models (free tier)".
  Wrong: Gemma 4 is $0.10/M in, $0.30/M out; Kimi K2.6 is $0.95/$4.
- F6: `extractText` in queue.ts handles both response shapes;
  `background.ts:generate` only handles legacy. Inconsistent.
- F7: router.ts emits `thinkingEffort: 'low'` on default_casual against
  Roma's stated preference (let Gemma's natural default apply).
- Hardcoded models in workflows drifted away from the registry: both
  consolidation.ts and architect.ts reference `gemini-3.1-pro-preview`
  directly, not `GEMINI_MODELS.pro`.

### Decisions Roma made

After Claude verified the docs:

**Model slot decisions**

| Slot      | Was                              | Now (decision)              |
|-----------|----------------------------------|-----------------------------|
| pro       | `gemini-2.5-pro`                 | `gemini-3.5-flash` (stable) |
| flashLite | `gemini-3.1-flash-lite-preview`  | `gemini-3.5-flash`          |
| flash     | `gemini-3-flash-preview`         | RETIRED (unused)            |
| image     | `gemini-2.5-flash-image`         | `gemini-3.1-flash-image`    |
| tts       | `gemini-2.5-pro-preview-tts`     | unchanged (dead config kept)|

Rationale: Roma wants thinking level default ("let the model decide")
which on Gemini 3.x maps to omitting `thinkingConfig`. `gemini-3.5-flash`
is the stable version of the same family as the existing flash-preview.
Critically, it is in the Gemini 3 family so it supports tool combination
(custom tools + built-in tools in the same call), which 2.5 Pro does
not. That makes always-on grounding co-exist with Eukara's 26 custom
tools on the Pro lane.

**Hardcoded workflow models**

- `consolidation.ts`: `gemini-3.1-pro-preview` → `gemini-3.5-flash`
- `architect.ts`: `gemini-3.1-pro-preview` → `gemini-3.5-flash`
- `research.ts`: stays on `deep-research-pro-preview-12-2025` (Deep
  Research agent, different API surface)

**Decision A (Gemini Pro grounding)**

Always on via tool combination on `gemini-3.5-flash`. Requires:
- `tools: [{googleSearch: {}}, {functionDeclarations: [...]}]`
- `toolConfig: {includeServerSideToolInvocations: true}`
- Preserving `toolCall`, `toolResponse`, `thoughtSignature` parts in
  conversation history across the in-turn tool loop so the model can
  read its own prior reasoning.

**Decision B (Gemma web_search_options)**

Always on. `search_context_size: 'medium'` (the default) with
`user_location: {type: 'approximate', approximate: {country: 'GB',
timezone: 'Europe/London'}}`. Response `annotations[].url_citation`
rendered as inline footnote links in the Telegram HTML output. Note:
the model itself decides whether to actually search each turn, so
"always on" means "always available" not "always invoked". Billing is
per-query, not per-turn.

**Decision C (streaming)**

C3 (end-to-end including tool loops) confirmed. **DEFERRED** to its
own session by Claude with explicit flagging: the work is a multi-hour
rewrite that involves throttled `editMessageText` cycles, mid-stream
tool-call handling, chunked HTML across messages, and the existing
chatStream signatures need rework. Roma accepts deferral.

### Telegram features review (provided 2026-06-02)

Eukara already uses: inline keyboards, reply keyboards, polls, voice
messages, photo/video/audio/document ingestion, custom message effects,
HTML parse mode, sendChatAction, forum topics, business connection.

Unused but available:
- Mini Apps (largest UX improvement opportunity for the mood journal)
- Deep linking with start parameters
- Inline mode (`@eukara_bot ...` in any chat)
- Native sendChecklist + ChecklistTasksDone updates (currently
  reimplemented in text)
- setUserEmojiStatus (Premium feature, could reflect mood)
- Stories (postStory) for weekly report
- Bot-to-bot communication
- Custom emoji creation (Premium)

Roma noted but no immediate action — each is a separate small session.

### Bugs fixed in this session

All seven of F1–F7 are addressed in this session. Plus the workflow
drift (hardcoded models) and the chat_id→user_id mismatch.

### What was implemented

Files touched: see journal.txt for the list.

Code paths verified by `node --check`.

### What was deferred

- C3 end-to-end streaming (own session, decision doc TBD).
- Nano Banana 2 wiring (image generation tool).
- Native Telegram Checklists.
- Mini App for mood journal.
- Pro slot bench (verify gemini-3.5-flash matches 2.5 Pro on emotional
  turns).
- Pro slot question (substitute with Gemma/Kimi) — superseded by the
  decision to migrate to gemini-3.5-flash, which is Gemini-family but
  cheaper than 2.5 Pro.

### Deploy

NOT DEPLOYED by Claude. Roma runs `npx wrangler deploy --minify` after
review.

---

## 2026-05-21 — Pro-lane cascade rebuild and curator revisions

Previous session (full notes in Xaridotis journal and earlier Eukara
audits). Summary: introduced 3-tier Pro-lane cascade in
`chatWithProLaneFallback`, model-family-aware `convertThinking`,
OpenAI-compat schema flag in `CloudflareProvider`. This session built
on top of that work.
