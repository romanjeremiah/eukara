# gpt-oss-120b migration + reply-outage and outreach-repeat fixes

**Date**: 2026-07-01
**Status**: Implemented on disk. Typechecked (`tsc --noEmit` clean) and unit-tested
(adapter output parsing, 7/7). NOT yet deployed. Roma runs `npx wrangler deploy`,
then confirms via live worker logs.
**Scope**: One combined change (Roma's call) covering three things: restore replies,
stop the repeating spontaneous outreach, and move conversations from the current
Cloudflare model to OpenAI `gpt-oss-120b`. Decisions D1 to D6 below were confirmed
with Roma before editing.

---

## 1. Problem (as reported)

- Eukara "stopped responding" (silent, not erroring).
- Spontaneous outreach sends "the same message over and over every day".
- Roma wants conversations moved to `gpt-oss-120b` "from Gemma", with configs per the
  latest Cloudflare docs.

## 2. Findings from code review (facts)

- **The journal was stale.** Newest `journal.txt` entry was 2026-06-02, but
  `src/ai/router.ts` was rewritten 2026-06-22 ("migrated completely to Cloudflare
  Workers AI, removed all Gemini"). That undocumented change is the most recent
  structural shift and the likely destabiliser.
- **Conversations were NOT on Gemma.** Post-06-22 the chat lanes route to
  `CF_MODELS.chat = @cf/meta/llama-3.3-70b-instruct-fp8-fast` (and `kimi-k2.7-code`
  for code/long turns). Gemma (`@cf/google/gemma-4-26b-a4b-it`) survived only as a
  capability entry in `ai/cloudflare.ts` and a stale comment in `bot/message.ts`; the
  router never selected it. Confirmed the **deployed** worker matches this (via the
  Cloudflare MCP `workers_get_worker_code`).
- **Silence mechanism.** `bot/message.ts` turns any thrown error into a visible
  "⚠️ AI call failed" message, so true silence means a *successful* call returning
  empty text: the tool loop exhausting `maxToolRounds` without a final answer, or an
  empty/unparseable model response. A contributing latent bug:
  `@cf/moonshotai/kimi-k2.7-code` (code/long lane + `fallbackPro`) was missing from the
  `useOpenAICompat` list in `ai/cloudflare.ts`, so its `choices` output was read with
  the legacy `.response` reader and came back empty.
- **Outreach repetition.** `services/curiosity.ts` ran its "research" on
  `CF_MODELS.chat` (llama-3.3-70b) with `enableGrounding:true`, but only Gemma is
  grounding-capable in this codebase, so grounding was silently off — discoveries were
  ungrounded model recall (stale, repetitive). It also read `response._groundingMetadata`
  (a Gemini-era field the CF provider never returns; it returns `_annotations`), so every
  discovery was saved sourceless. The outreach consumer then re-picked from a small,
  stable pool, and the escalation guard resets whenever the user replies — so a user
  chasing a broken bot kept the loop alive with near-identical daily texts.
- **gpt-oss-120b is a different API.** `@cf/openai/gpt-oss-120b` is built around the
  Responses API. Via `env.AI.run()` it does dynamic format detection and *accepts* a
  Chat-Completions `messages` array + `tools`, but uses `max_tokens` (default only
  **256**), has no `reasoning_effort` on this path, and NO `web_search_options`
  (no native grounding — Web Search is BYO-Exa, "coming soon"). Output is Responses-
  style (`output_text` / `output[]`), which the old parser did not read. A blind id
  swap would therefore have re-broken replies and dropped grounding.
  Refs: https://developers.cloudflare.com/workers-ai/models/gpt-oss-120b/ ;
  https://developers.cloudflare.com/changelog/post/2025-08-05-openai-open-models/

- **Discovered pre-existing breakage (out of scope, left untouched).** `workflows/
  architect.ts` and `workflows/consolidation.ts` still call the Google GenAI SDK
  (`GoogleGenAI` + `GEMINI_API_KEY`) but pass a `@cf/...` model id. The 06-22 migration
  only half-updated them, so `/architect` and the monthly consolidation are already
  broken independently of the two reported symptoms. Flagged for a follow-up; NOT
  changed here to keep this change focused and preserve prior work.

## 3. Decisions (confirmed with Roma)

- **D1 Sequencing**: one combined change (outage fix + outreach fix + migration).
- **D2 Scope**: move the text-generation conversation surface to gpt-oss-120b (main
  chat: casual/emotional/sticky; code/long; spontaneous-outreach voice). Keep the
  hot-path/background helpers on small fast models (triage curator, observation,
  tagging, dedup) — the curator runs on every inbound message, so a 120B there would
  tax every turn. Embeddings, reranker, STT and vision physically cannot move (text-
  only model) and are unchanged.
- **D3 Integration**: extend `CloudflareProvider` with a gpt-oss adapter (send `messages`
  via `env.AI.run`, raise `max_tokens`, parse the Responses-style output tolerantly).
  One provider, no new SDK.
- **D4 Grounding**: gpt-oss has no native grounding, so the paths that need live sourced
  facts (curiosity research, weekly report, and the conversation fallback) run on Gemma
  (`CF_MODELS.grounded`), the only grounding-capable model. This also restores real
  sources to discoveries.
- **D5 No-silence guarantee**: `bot/message.ts` gains a salvage step — if a turn ends
  with empty text (loop exhaustion, empty content, or a thrown primary error) it forces
  one plain tool-free reply, falling back to Gemma. A turn can no longer end silently.
- **D6 Outreach dedup**: `router/queue.ts` records the last surfaced memory
  (`last_outreach_<userId>`, 14-day TTL) and excludes it next run when other candidates
  exist, so outreach cannot repeat the same item on consecutive days.

## 4. Files changed

- `src/config/models.ts` — `chat` + `code` -> `@cf/openai/gpt-oss-120b`; new `grounded`
  = Gemma; `fallbackPro` -> Gemma; small/embedding/reranker/stt/vision unchanged.
- `src/ai/cloudflare.ts` — gpt-oss adapter branch (payload + `isGptOss`); added
  `kimi-k2.7-code` to the OpenAI-compat list (latent-bug fix); tolerant Responses-style
  output parsing in `parseResponse`.
- `src/services/curiosity.ts` — run grounded research on Gemma; read `_annotations`
  (not the dead `_groundingMetadata`) for the source URL.
- `src/router/queue.ts` — weekly report -> Gemma (keeps grounding); outreach
  last-surfaced dedup; outreach voice stays on `CF_MODELS.chat` (now gpt-oss).
- `src/bot/message.ts` — no-silence salvage + Gemma cross-model fallback; record error
  and only surface it if all recovery fails.
- `test/gptoss-adapter.spec.js` — new: locks in parsing of all four output shapes.

## 5. Verification

- `npx tsc --noEmit`: clean (0 errors).
- Adapter parsing: 7/7 assertions pass (Responses `output_text`; Responses `output[]`
  message + `function_call`; legacy `{response}`; OpenAI-compat `{choices}`). Run in the
  sandbox via a tsx harness because the repo's `node_modules` binaries are macOS-native
  and vitest's worker-pool bundler hit OneDrive on-demand read errors; the committed
  `test/gptoss-adapter.spec.js` runs under `npm test` on Roma's Mac.
- Post-deploy (Roma): confirm live logs show `cf_ai_raw` for gpt-oss and a non-empty
  reply; after a Tue/Fri 04:00 run, confirm a `discovery` memory now carries
  `[source: ...]`; confirm two consecutive outreach messages differ.

## 6. Not done / follow-ups

- Migrate `workflows/architect.ts` and `workflows/consolidation.ts` off the Google SDK
  onto `CloudflareProvider` (they are already broken post-06-22). Separate change.
- Optional: use the gpt-oss Responses `input` + `reasoning:{effort}` shape if we want
  explicit reasoning-effort control on the code lane (the `messages` path ignores it).
- Update the stale Pro-lane comment block in `bot/message.ts` (references Gemini tiers
  that no longer exist) — cosmetic, deferred to avoid noise in this change.
