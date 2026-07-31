# 2026-06-09 - Handover verification: isGemini3x alias, tool-shape 400 retryable, formatter dead-code (obsolete)

## Context
A handover dated 2026-06-08, written by a prior chat session that had lost
file-write access, proposed four edits to Xaridotis plus a guarded apply
script. Standing rule: verify disk before trusting any handover. Verified
2026-06-09 via Desktop Commander reads.

## Verified disk state (facts)
| Item | Handover claim | Disk reality |
| --- | --- | --- |
| Change 1 isGemini3x alias (gemini.js ~215) | pending | NOT applied - confirmed |
| Change 2 isToolShape400 (handlers.js ~2398) | pending | NOT applied - confirmed |
| Change 3 delete formatter.js splitMessage | safe dead-code removal | OBSOLETE - would break build |
| Change 4 journal entry | to prepend | superseded by 2026-06-08/08b entries |

Change 3 detail: journal entry 2026-06-08b made formatter.js the canonical
single source of splitMessage + getOpenTags; lib/telegram.js and
bot/handlers.js both import from it. The handover predates that and assumed
formatter.js held an unimported dead copy. It does not. Do not apply.

## Decisions
1. Apply Changes 1 and 2 only. Both resilience/correctness:
   - Change 1 restores Google Search grounding on B2/C Pro turns by
     treating gemini-pro-latest as Gemini 3.x (aliases
     gemini-3.1-pro-preview, Roma-confirmed 2026-06-08).
   - Change 2 makes the Gemini-3-only combined-tools 400 retryable so it
     cascades to gemini-3.5-flash instead of erroring to the user.
   Status: APPLIED 2026-06-09 (both files edited surgically, node --check
   green, grep confirms C1=1 / C2=2 / formatter splitMessage intact). NOT
   deployed; `npx wrangler deploy --minify` + git push pending Roma's call.
2. Do NOT apply Change 3. formatter.js is canonical (2026-06-08b).
3. Carry-over session decisions recorded by the handover as Roma-greenlit:
   - Drop the Tavily function tool; rely on native grounding (Gemini
     google_search on 3.x, CF Gemma grounding). On disk (tools/index.js).
   - Autosplit ALL sends via lib/telegram.js sendMessage. On disk +
     consolidated to formatter.js (2026-06-08b).
   - /architect output wrapped in expandable blockquote + chunked send.
     On disk.
   - normaliseMarkdown safety net wired into sanitizeTelegramHTML. On disk.
   - Per-turn reset of cascadeTierIdx gives "next turn starts at Pro"; a
     WITHIN-turn back-to-Pro was deliberately NOT built (loop/latency
     risk) pending a Roma-specified trigger.

## Doc verification (official sources, per handover; NOT re-checked this run)
- Telegram limit 4096 chars AFTER entity parsing; over-limit fails both
  HTML send and plain-text fallback; auto-split is the fix. (core.telegram.org)
- Combining built-in tools (google_search) with function calling via
  context circulation / includeServerSideToolInvocations is Gemini 3-only
  (launched 18 Mar 2026; ai.google.dev/gemini-api/docs/tool-combination);
  2.5 and older reject with 400 INVALID_ARGUMENT.
- gemini-pro-latest aliases gemini-3.1-pro-preview (Roma-confirmed 2026-06-08).
Uncertainty: these three are taken from the handover and not independently
re-verified this run. Re-check against live docs before relying on them.

## Next steps (Roma's call)
1. Apply Changes 1 and 2 (surgical; gemini.js = 2-space indent,
   handlers.js = tabs).
2. node --check src/lib/ai/gemini.js && node --check src/bot/handlers.js.
3. npx wrangler deploy --minify.
4. Open judgement call: push on green node --check, or deploy + live test
   then push so history records only verified states. Default suggestion:
   deploy -> quick live test -> push.
