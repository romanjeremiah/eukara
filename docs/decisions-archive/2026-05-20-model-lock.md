# Decision: 2026-05-20 — Model Lock (B1/C → gemini-3.5-flash)

**Status**: LOCKED. Source-edited, syntax-clean, ready to deploy.
**Decided by**: Roma (explicit directive, "no pushback" override).
**Effective**: post-deploy.

---

## Verdict from Roma's strict bench cycle

| Model | Verdict |
|-------|---------|
| `gemini-3.5-flash` | NEW PRIMARY for all Gemini lanes (B1, B2, C, multimodal). Thinking level: HIGH. |
| `@cf/google/gemma-4-26b-a4b-it` (Gemma 4 26B) | KEEP. Production-ready for Layer D (functional). |
| `gemini-3.1-flash-lite` (stable) | Reliable, no longer hallucinating clinical tools. Keep as cascade Tier 6 / Layer D fallback. |
| `gemini-2.5-pro` | Keep as cascade Tier 3 (with thinkingBudget -1 for dynamic thinking). |
| `gemini-pro-latest` | NEW. Cascade Tier 4 (auto-alias to latest stable Pro). |
| `gemini-3-flash-preview` | RETIRED. Superseded by 3.5-flash. |
| `gemini-3.1-pro-preview` | RETIRED. Override to 3.5-flash. |
| `gemini-3.1-flash-lite-preview` | RETIRED. Use stable string instead. |
| `gpt-oss-20b` | DROPPED. Failed parallel tool calling in strict bench. |

---

## B1/C unified cascade (Roma's final spec)

```
Tier 1: gemini-3.5-flash    thinkingLevel: 'high'
        ↓ on retryable failure
Tier 2: gemini-3.5-flash    thinkingLevel: 'medium'
        ↓
Tier 3: gemini-2.5-pro      thinkingBudget: -1  (dynamic)
        ↓
Tier 4: gemini-pro-latest   (default config)
        ↓
Tier 5: anthropic/claude-sonnet-4.6  via AI Gateway  ← NOT YET WIRED (Phase B)
        ↓
Tier 6: gemini-3.1-flash-lite  (stable, low-latency last-resort)
```

The cascade replaces the prior MAIN_CASCADE + CRISIS_CASCADE pair. B1 (casual,
emotional+low), B2 (emotional+high), and C (crisis, code) all share the same
fallback chain.

Tier 5 is in the cascade comments but skipped at runtime. The walker advances
from Tier 4 directly to Tier 6 until the Gateway adapter is wired (Phase B).

---

## Override directive

Replace everywhere:
- `gemini-3.1-flash-lite-preview` → `gemini-3.1-flash-lite` (stable GA)
- `gemini-3-flash-preview` → `gemini-3.5-flash` (stable GA)
- `gemini-3.1-pro-preview` → `gemini-3.5-flash` (collapse to new primary)

Stay on preview (no stable equivalent exists yet):
- `gemini-3-pro-image-preview` (Nano Banana Pro)
- `gemini-3.1-flash-image-preview` (Nano Banana 2)
- `gemini-2.5-pro-preview-tts`
- `gemini-embedding-2-preview`

---

## Files touched

| File | What changed |
|------|--------------|
| `src/config/models.js` | GEMINI_MODELS rewritten. `pro` → 3.5-flash. New `proLegacy` (2.5-pro) and `proLatest` keys. `flashLite` → stable string. |
| `src/lib/ai/gemini.js` | Constants remapped. New `FLASH_35_MODEL` and `PRO_LATEST_MODEL` exports. `MODEL_DEFAULT_OPTS` binds `thinkingLevel: 'high'` to 3.5-flash; 2.5-pro switches to `thinkingBudget: -1`. |
| `src/ai/router.js` | Comment block rewritten. Rules 7 and 8 (casual, emotional+low) point to `GEMINI_MODELS.pro` (now 3.5-flash) instead of flashLite. |
| `src/bot/handlers.js` | MAIN_CASCADE + CRISIS_CASCADE collapsed into single B1C_CASCADE. New `cascadeTierIdx` state variable to track position across Tier 1 ↔ Tier 2 (same model string, different thinking). Import line updated with FLASH_35_MODEL and PRO_LATEST_MODEL. |

New file:
- `PROJECT_TRACKER.md` (root)
- `decisions/2026-05-20-model-lock.md` (this file)

---

## Verification

- `node --check` passes on all four touched source files.
- `grep -rn "gpt-oss\|gpt_oss" src/` returns empty — no production refs.
- Cascade tier walker uses index-based tracking (correct given Tier 1 and
  Tier 2 share a model string).

---

## What to watch after deploy

1. **`cascade_fallback` log frequency**: if Tier 1 → Tier 2 fires often, HIGH
   thinking is timing out on 3.5-flash. Consider switching primary default to
   MEDIUM.
2. **First-token latency**: Roma's bench claims 3.5-flash HIGH matches 2.5-pro
   quality at Flash latency. Validate by comparing `total_elapsed_ms` against
   pre-deploy baseline.
3. **Multimodal turns**: 3.5-flash supports multimodal per Google's GA docs
   (Computer Use is the only excluded capability). Watch for image/voice
   turns; first sign of trouble would be empty responses on those routes.
4. **`gemini-pro-latest` Tier 4 quality**: this is an auto-aliased model that
   can swap underneath us. If a fallback fires and the response is wrong, it
   might be a pro-latest version change. Pin to a specific version if this
   becomes an issue.

---

## Phase B (separate decision-record needed when started)

Wire Tier 5 of the cascade: `anthropic/claude-sonnet-4.6` via AI Gateway.

Required:
- Provider wrapper around AI Gateway's OpenAI-compat endpoint
  (`https://gateway.ai.cloudflare.com/v1/<account_id>/gemini-bot/anthropic/v1/messages`)
- `cf-aig-authorization: Bearer ${CF_AIG_TOKEN}` header on call
- Anthropic-flavoured request body (`messages` array, `max_tokens` etc.)
- Response shape adapter back to the streaming generation interface
- Cascade-walker integration so Tier 4 → Tier 5 → Tier 6 fires correctly

Estimated: 1-2 sessions.
