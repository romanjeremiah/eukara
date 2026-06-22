# 2026-05-22 (afternoon, second pass) — Routing rules document + memory consolidation cadence

**Status:** LOCKED. `node --check` clean on the one code file touched. Not deployed.
**Predecessor:** `2026-05-22-spec-alignment-respec.md` (earlier today — generateShortResponse / F3 T3 / mood acks / F4 implementation).
**Supersedes:** the once-daily 03:30 cadence of `handleDailyMemoryConsolidation`.

---

## Context

After the spec-alignment session earlier today, Roma authored a canonical architecture spec doc and asked for it to be persisted in the repo as the authoritative source of truth for all routing decisions. Three open questions resolved in pre-write Q&A:

1. **F3 cadence**: confirmed "fires inside the chat handler after every message" replaces the prior "Nightly cron" wording in the spec. Code is already correct — `silentObservation` + auto-episode block in `src/bot/handlers.js` runs after every message, post-reply. The spec wording was inherited from an earlier doc and needed updating.

2. **Flex Inference**: spec doc names `gemini-pro-latest (Flex Inference / Batch API)` for F3 T3, F4 T1, and Memory Consolidation T1. After reviewing the Flex Inference docs and discussing implementation cost, agreed:
   - Document Flex as INTENDED for those three tiers.
   - Do NOT implement the async submit + poll pattern in `runCascade` this session.
   - Drop the Batch API path entirely (Roma flagged https://ai.google.dev/gemini-api/docs/batch-api?batch=file as having issues).
   - Carry Flex as a follow-up task in the routing rules doc.

3. **Memory consolidation cadence**: spec says "Memory consolidation runs daily" at the bottom and "Memory consolidation workflow (nightly)" in the cascade section — contradictory. Clarified with Roma:
   - The **full monthly workflow** (`handleMemoryConsolidation` / `MemoryConsolidationWorkflow`) stays unchanged (1st of month, 03:00 London).
   - The **daily safety-net handler** (`handleDailyMemoryConsolidation`) moves from once-daily 03:30 London to twice-daily 10:00 + 23:59 London.
   - Both slots are in London time.

---

## What changed

### 1. New file: `ROUTING_RULES.md`

Top-of-repo authoritative spec for every routing decision. Sections:

- **Universal configuration principles** — temperature, thinking-level, max_output_tokens, provider-specific conventions.
- **Layer A** — Curator (intent + complexity classifier). Mistral 24B → Llama 70B → Qwen 32B → Haiku 4.5.
- **Layer B1** — Casual chat. 3.1-fl → 3.5-flash → gpt-5.4-mini → Haiku 4.5 → Gemma.
- **Layer B2 + C** — Deep emotional + Brain (crisis / code). Pro-latest → 3.5-flash → gpt-5.4 → Sonnet 4.6 → Gemma HIGH.
- **Layer D** — Functional tools. 3.1-fl → 3.5-flash → gpt-5.4-mini → Gemma.
- **Layer F3** — Subconscious factual extraction. **Fires inside chat handler after every message.** Pro-latest at Tier 3 (intended Flex). All three tiers Gemini.
- **Layer F4** — Therapeutic REM. Pro-latest → 3.5-flash → Sonnet 4.6 → gpt-5.5. Cron-triggered weekly Sunday 03:00 London via `TherapeuticRemWorkflow`.
- **`generateShortResponse`** — 3-tier per spec doc (3.1-fl → 3.5-flash → Gemma). Note: disk currently has 5 tiers from the earlier session today — flagged as an open question for Roma.
- **Background tasks** — pre-response curator, conversation mode tagger (legacy fallback), mood acks + synthesis, heavy background tasks (triple extraction / mood tagging / dedup / style card / persona evolution), reaction interpretation, auto-episode + factual triples, memory consolidation workflow.
- **Vectorize embedding** — gemini-embedding-2 (1536-dim, v2 index, v1 dual-read transition).
- **TTS** — gemini-2.5-pro-preview-tts → gemini-3.1-flash-tts (gated behind `USE_GEMINI_TTS`; Chirp 3 HD remains default for Telegram compatibility).
- **Voice transcription** — gemini-pro-latest → gemini-3.5-flash → gemini-3.1-flash-lite. All Gemini.
- **Memory consolidation cadence** — full monthly workflow + daily safety-net (new twice-daily schedule documented here).
- **Flex Inference** — deferred design item. Marked as the intended path for F3 T3, F4 T1, Memory Consolidation T1.
- **Batch API** — explicitly dropped.
- **Per-provider parameter shapes** — quick reference for Gemini / CF / Anthropic / OpenAI.
- **Change log + discipline reminders** for future-Claude.

The file is designed to be the FIRST thing Claude reads before any change that touches routing. If disk and the rules disagree, the rules win and an alignment task gets opened.

### 2. Memory consolidation cadence: 10:00 + 23:59 London

`src/index.js::handleDailyMemoryConsolidation` rewritten:

**Before:**
- Single trigger window: 03:30 London.
- KV key: `daily_consolidation_${today}` (24h TTL).
- Cooldown: 24 hours since last consolidation.

**After:**
- Two trigger windows: 10:00 London (`isMorningSlot`) OR 23:59 London (`isLateSlot`).
- KV key: `daily_consolidation_${today}_${slot}` where `slot ∈ {morning, late}` (24h TTL each).
- Cooldown: 8 hours since last consolidation.
- All log lines now include `slot` for diagnostics.

**Why 8h cooldown:** The two slots are 13:59 apart. The previous 24h cooldown would have blocked the second slot every day. 8h allows both to fire when there's enough new signal (>=30 memories) but still prevents accidental triple-firing if the time check is ever loose.

**Why slot-per-key:** without the slot suffix, the morning run would consume the per-day idempotency key and block the late run from even entering the threshold check. Per-slot keys keep them independent.

### 3. NOT changed in this session (deliberate)

- **`generateShortResponse` 5-tier vs 3-tier conflict** — disk has 5 (set this morning), spec says 3. Roma's call needed. Routing rules doc names the conflict explicitly with a warning block. **Awaiting Roma's decision.**
- **Flex Inference implementation** — confirmed deferred. Tiers stay synchronous.
- **Full memory consolidation workflow** — still monthly, 1st at 03:00 London.

---

## Files touched

| File | Change |
|---|---|
| `ROUTING_RULES.md` | NEW — authoritative routing spec |
| `src/index.js` | `handleDailyMemoryConsolidation` rewritten for twice-daily 10:00 + 23:59 London with per-slot KV keys and 8h cooldown |
| `journal.txt` | Entry prepended |
| `decisions/2026-05-22-routing-rules.md` | This file |

All `node --check` clean.

---

## Pre-deploy checklist

1. `npx wrangler deploy --minify`. No new bindings or secrets required for this change.
2. After deploy, tail-watch for:
   - Next 10:00 London tick: log line `daily_consolidation_started` with `slot: 'morning'` (or `daily_consolidation_skipped` with `reason: 'below_threshold' | 'too_recent'` if conditions not met).
   - Next 23:59 London tick: same with `slot: 'late'`.
   - The 03:30 London window will now log nothing — the time check no longer matches that hour.
3. KV keys from the previous cadence (`daily_consolidation_${today}` without slot suffix) will expire naturally at 24h. No manual cleanup needed.

---

## Known risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Double-fire if both 10:00 and 23:59 windows hit on the same second tick (impossible by clock arithmetic but worth naming) | None | n/a | Per-slot KV keys mean each slot is independently gated |
| Cooldown too aggressive (8h skips legitimate second-slot runs) | Low | One run skipped, recovers next day | Threshold is `>=8h since last`; if 10:00 fires, 23:59 only fires if 13:59 hours have passed AND >=30 memories AND >=8h cooldown. All three usually pass. |
| `generateShortResponse` spec vs disk mismatch causes confusion later | Medium | Roma may notice 5-tier in code while rules say 3-tier; awaiting decision | Documented explicitly in ROUTING_RULES.md as an open question |
| Flex Inference deferral leaves cost on the table | Low (it's a follow-up, not a regression) | F3/F4/MemoryConsolidation Tier 1 runs on standard endpoint pricing | Documented as a known design item; not blocking |

---

## Deferred (still open)

- **Flex Inference wiring** — see ROUTING_RULES.md "Flex Inference" section. Needs `mode: 'flex'` tier option in `runCascade` + workflow-resumption pattern.
- **`generateShortResponse` 5-tier vs 3-tier decision** — Roma's call.
- **Vectorize V2 backfill script** — re-embed ~700 768-dim memories into v2.
- **WASM Opus encoder for TTS Tier 1** — unblocks Gemini TTS in default path.
- **Tool-emitted message signature plumbing** (`src/tools/quote.js`, `src/tools/effect.js`).
- **Step 5: streaming everywhere**.

---

## Honesty section

This session was small and disciplined relative to the larger ones earlier today. One code change (memory consolidation cadence), one new documentation file (routing rules), one decision doc (this one), and journal entry.

The discipline I exercised that I want to flag explicitly:
- Stopped and surfaced THREE separate ambiguities in Roma's message (F3 cadence, Flex implementation cost, memory consolidation which-workflow-which-cadence) before touching any code. Each was a real question, not a stalling tactic. Roma answered all three, and the implementation matched the answers.
- Did NOT silently align the `generateShortResponse` 5-tier vs 3-tier mismatch. Documented it as an open question in the routing rules doc instead. The earlier session put 5 tiers on disk per a different conversation; the spec doc Roma authored later names 3. Both are defensible. Roma decides.
- Did NOT implement Flex Inference. The temptation was there ("Roma agreed to defer" reads as permission to half-implement). Resisted. Documented as a design item.

What I did not do well: in the very first edit to `handleDailyMemoryConsolidation`, the `Filesystem:edit_file` matched on a partial-line boundary and left a duplicated comment block. Caught it via re-read, cleaned up with two further edits. Total: three edit calls where one should have done. Worth doing tighter `oldText` boundaries next time.
