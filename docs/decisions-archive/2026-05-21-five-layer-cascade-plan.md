# 2026-05-21 — Five-Layer Provider-Aware Cascade Plan

**Status:** IMPLEMENTED in source. Not yet deployed. `node --check` clean across all touched files. Awaits OPENAI_API_KEY secret + `npx wrangler deploy --minify`.
**Scope:** Major architectural rework. Originally estimated 5-7 sessions; delivered in 2 sessions (one design, one implementation) under Roma's "fix everything in one go" directive.
**Override:** Roma invoked "no pushback" on the design decisions. Verification of configs against vendor docs was part of the work he asked for.
**Supersedes:** `2026-05-21-curator-and-cascade-revisions.md` (B1/C cascade portion) and `2026-05-20-model-lock.md`.

## Implementation summary (final state)

All five layers wired and exported from `src/config/cascades.js`. The router (`src/ai/router.js`) returns a `{provider: 'gemini', model, layer, reason, isDefault}` shape and the handler (`src/bot/handlers.js`) reads `route.layer`, looks up the cascade via `getCascadeForLayer(route.layer)`, and walks it with a provider-aware fallback strategy (Gemini→Gemini stays streaming; Gemini→non-Gemini drops to non-streaming `runCascade(remainingTiers)`).

New direct-API providers: `src/providers/openai.js`, `src/providers/anthropic.js`. AI Gateway wrapper (`src/lib/ai-gateway.js`) reworked to the Eukara Option-B approach: OpenAI-compat models (Gemma 4, Qwen3 30B, GLM 4.7, Kimi K2.6, Llama 4 Scout) use `max_completion_tokens` with the cap OMITTED entirely when caller does not specify one. Unconditional Gemma `thinking: false` removed; kept for Kimi K2.6 only. Test scaffold at `tests/cascades/`.

See `journal.txt` (2026-05-21 afternoon entry) and `PROJECT_TRACKER.md` for the full file-by-file list and pre-deploy checklist.

---

---

## 1. Goal

Replace the current ad-hoc Gemini-only cascade with five explicit, intent-driven layers, each with provider-diverse fallback chains. The Curator (Layer A) determines intent + complexity, the router maps to a layer, and each layer's cascade owns its own provider mix, parameter shape, and resilience contract.

Resilience principle: **no single provider failure must break end-user functionality.** Each layer crosses provider boundaries at least once (Google → Anthropic → OpenAI → Cloudflare).

---

## 2. Verification summary — all model identifiers confirmed against docs

| Model ID (canonical) | Provider | Endpoint / Binding | Verified via |
|---|---|---|---|
| `@cf/mistralai/mistral-small-3.1-24b-instruct` | Cloudflare Workers AI | `env.AI.run` | Uploaded reference row 54 |
| `@cf/meta/llama-3.3-70b-instruct-fp8-fast` | Cloudflare Workers AI | `env.AI.run` | Uploaded reference row 34 |
| `@cf/qwen/qwen2.5-coder-32b-instruct` | Cloudflare Workers AI | `env.AI.run` | Uploaded reference row 43 |
| `@cf/google/gemma-4-26b-a4b-it` | Cloudflare Workers AI | `env.AI.run`, OpenAI-compat schema | Uploaded reference row 53, CF changelog 2026-04-04 |
| `@cf/meta/llama-3.1-8b-instruct-fp8` | Cloudflare Workers AI | `env.AI.run` | Uploaded reference row 27. NB: only fp8 variant exists. Plain `@cf/meta/llama-3.1-8b-instruct` is not in CF's catalog. **Confirm Roma wants fp8 variant.** |
| `claude-haiku-4-5` | Anthropic direct | `https://api.anthropic.com/v1/messages` | Already in curator.js Tier 4; Anthropic model-IDs doc |
| `claude-sonnet-4-6` | Anthropic direct | `https://api.anthropic.com/v1/messages` | Anthropic platform docs, model IDs page |
| `gpt-5.4` | OpenAI direct | `https://api.openai.com/v1/chat/completions` | OpenAI docs gpt-5.4 page (gpt-5.4-2026-03-05 underlying) |
| `gpt-5.4-mini` | OpenAI direct | `https://api.openai.com/v1/chat/completions` | OpenAI docs gpt-5.4-mini page (gpt-5.4-mini-2026-03-17 underlying) |
| `gemini-pro-latest` | Google Gemini API | `@google/genai` SDK | Already in code (PRO_LATEST_MODEL) |
| `gemini-3.5-flash` | Google Gemini API | `@google/genai` SDK | Already in code (FLASH_35_MODEL) |
| `gemini-3.1-flash-lite` | Google Gemini API | `@google/genai` SDK | Already in code (FLASH_LITE_31_MODEL) |

---

## 3. Provider parameter shapes (verified, not all the same)

Each provider takes a different request shape. Mixing them is what breaks deployments. Reference table for the cascade walker and per-provider wrappers.

### 3.1 Google Gemini (`@google/genai` SDK, direct API)

Already supported via `src/lib/ai/gemini.js`.

- **Field for thinking effort**: `thinkingConfig` object with EITHER `thinkingLevel` (string `'minimal' | 'low' | 'medium' | 'high'` — Gemini 3.x family) OR `thinkingBudget` (integer; `-1` = dynamic, `0` = off, positive int = cap) — Gemini 2.5 family.
- "Default thinking" / "let the model decide": **omit thinkingConfig entirely** → uses Google's per-model default (medium for Flash, dynamic for Pro).
- **Output tokens cap**: `maxOutputTokens`. Default in our code is 2000.
- **Structured output**: `responseMimeType: 'application/json'` + optional `responseSchema`.
- **Temperature**: 1.0 (locked across project).
- **Tools**: `functionDeclarations` array; `googleSearch` supported in parallel on 3.x with `toolConfig.includeServerSideToolInvocations: true`.

### 3.2 Anthropic direct (`https://api.anthropic.com/v1/messages`)

Partially implemented in `src/services/curator.js` for Haiku Tier 4. Needs extension into a reusable provider wrapper.

- **Headers**: `x-api-key: ${ANTHROPIC_API_KEY}`, `anthropic-version: 2023-06-01` (current pinned), `content-type: application/json`.
- **Required body fields**: `model`, `max_tokens` (REQUIRED for Anthropic, unlike Gemini/OpenAI), `messages`, `system` (top-level, NOT a message role).
- **Thinking — three modes per model docs**:
  - `thinking: { type: "extended", budget_tokens: <int> }` — extended thinking with hard budget
  - `thinking: { type: "adaptive" }` — Sonnet 4.6 / Opus 4.6+ recommended default; model decides
  - `effort: "low" | "medium" | "high"` — alternative simpler control on supporting models
- **"Default thinking" / "let the model decide"**: pass `thinking: { type: "adaptive" }` on Sonnet 4.6 and later.
- **Structured outputs**: `output_config: { format: { type: 'json_schema', schema: ... } }` (curator.js already uses this for Haiku).
- **Response shape**: `data.content[]` array of typed blocks (`type: "text"`, `type: "thinking"`, `type: "tool_use"`, etc). Strip non-`text` blocks before returning to caller.
- **Temperature**: 1.0 across the project (Anthropic allows 0-1).
- **Streaming**: SSE with event types `message_start`, `content_block_start`, `content_block_delta`, `content_block_stop`, `message_delta`, `message_stop`.

### 3.3 OpenAI direct (`https://api.openai.com/v1/chat/completions`)

**Not yet implemented.** New provider wrapper required.

- **Headers**: `Authorization: Bearer ${OPENAI_API_KEY}`, `content-type: application/json`. **Worker secret not yet provisioned** — Roma needs to set this with `wrangler secret put OPENAI_API_KEY` before deploy.
- **Required body fields**: `model`, `messages` (OpenAI-style with `role: system` as a message, NOT top-level).
- **Reasoning effort**: `reasoning_effort: "none" | "low" | "medium" | "high" | "xhigh"`. Default for gpt-5.4 is `none`. Roma's spec: `medium` for both gpt-5.4 and gpt-5.4-mini.
- **Output tokens cap**: `max_completion_tokens` (NOT `max_tokens` — deprecated in newer GPT models).
- **Structured outputs**: `response_format: { type: 'json_schema', json_schema: { name, strict: true, schema } }`.
- **Temperature**: 1.0 (note: reasoning models like gpt-5.4 thinking variants ignore temperature; we still pass it for compatibility).
- **Response shape**: `data.choices[0].message.content`.
- **Streaming**: SSE with `data:` events containing `choices[0].delta.content`.

### 3.4 Cloudflare Workers AI OpenAI-compat (Gemma 4 26B, Qwen 32B coder, Mistral Small 3.1, Llama 4 Scout, Kimi K2.6, GLM)

Currently called via `env.AI.run(model, input)` in `src/lib/ai-gateway.js`. Today's bug: we send legacy `max_tokens` cap; Gemma 4 needs OpenAI-compat fields. Eukara already does this correctly in `src/ai/cloudflare.ts`.

- **OpenAI-compat schema applies to**: `@cf/google/gemma-4-26b-a4b-it`, `@cf/qwen/qwen3-30b-a3b-fp8`, `@cf/zai-org/glm-4.7-flash`, `@cf/moonshotai/kimi-k2.6`, `@cf/meta/llama-4-scout-17b-16e-instruct`. (Verified against Eukara's `useOpenAICompat` list and CF docs.)
- **Output tokens cap**: `max_completion_tokens` (NOT `max_tokens`). **Omit entirely when no cap specified** — this is Eukara's approach and fixes the empty-response bug.
- **Reasoning effort**: `reasoning_effort: "minimal" | "low" | "medium" | "high"`.
- **Thinking toggle** (Gemma 4 / Kimi K2.6): `chat_template_kwargs: { thinking: true | false }`. Default is true (model thinks). With Eukara's approach (no cap), thinking-on works fine because model has tokens to both think and respond.
- **Structured outputs**: `response_format: { type: 'json_schema', json_schema: { name, strict: true, schema } }`.
- **Response shape**: `data.choices[0].message.content`.
- **Legacy CF models** (Llama 3.3 70B, Mistral Small 3.1 24B, Qwen 2.5 Coder 32B) still use the older `{messages, max_tokens}` shape — keep as-is.

---

## 4. Layer definitions (final, locked)

### Layer A — Curator (intent + complexity classifier)

**Status:** Already implemented in `src/services/curator.js`. Verified to match Roma's spec exactly. No code change required.

| Tier | Model | Provider |
|---|---|---|
| 1 | `@cf/mistralai/mistral-small-3.1-24b-instruct` | CF Workers AI |
| 2 | `@cf/meta/llama-3.3-70b-instruct-fp8-fast` | CF Workers AI |
| 3 | `@cf/qwen/qwen2.5-coder-32b-instruct` | CF Workers AI |
| 4 | `claude-haiku-4-5` (structured outputs) | Anthropic direct |
| 5 | hard fallback `{intent: 'casual', complexity: 'low'}` | local |

Crisis regex backstop on raw user text. `strictParse` with `.toLowerCase().trim()`. `mapToLegacy` source labels with `+crisis-backstop` suffix. All present.

### Layer B1 — Soul (casual chat, transactional, low complexity)

Triggered by `curatorIntent === 'casual'` AND `curatorComplexity === 'low'` (and no override flags).

| Tier | Model | Provider | Thinking config |
|---|---|---|---|
| 1 | `gemini-3.1-flash-lite` | Gemini API | `thinkingLevel: 'minimal'` |
| 2 | `gemini-3.5-flash` | Gemini API | omit thinkingConfig (default) |
| 3 | `gpt-5.4-mini` | OpenAI direct | `reasoning_effort: 'medium'` |
| 4 | `claude-haiku-4-5` | Anthropic direct | `thinking: {type: 'adaptive'}` |
| 5 | `@cf/google/gemma-4-26b-a4b-it` | CF Workers AI (OpenAI-compat) | omit reasoning_effort, omit max_completion_tokens (model decides) |

### Layer B2 + C — Soul Deep / Brain (emotional high, crisis, code)

Triggered by `curatorIntent === 'emotional' && complexity === 'high'`, OR `curatorIntent === 'crisis'`, OR `curatorIntent === 'code'`.

| Tier | Model | Provider | Thinking config |
|---|---|---|---|
| 1 | `gemini-pro-latest` | Gemini API | omit thinkingConfig (default) |
| 2 | `gemini-3.5-flash` | Gemini API | omit thinkingConfig (default) |
| 3 | `gpt-5.4` | OpenAI direct | `reasoning_effort: 'medium'` |
| 4 | `claude-sonnet-4-6` | Anthropic direct | `thinking: {type: 'adaptive'}` |
| 5 | `@cf/google/gemma-4-26b-a4b-it` | CF Workers AI (OpenAI-compat) | `reasoning_effort: 'high'` |

### Layer D — Body (functional: timers, pins, checklists)

Triggered by `curatorIntent === 'functional'`. **Gemma is the primary here** — fits tool-calling use case at low cost.

| Tier | Model | Provider | Thinking config |
|---|---|---|---|
| 1 (Primary) | `@cf/google/gemma-4-26b-a4b-it` | CF Workers AI (OpenAI-compat) | omit reasoning_effort, omit max_completion_tokens (model decides) |
| 2 | `gemini-3.1-flash-lite` | Gemini API | `thinkingLevel: 'minimal'` |
| 3 | `gemini-3.5-flash` | Gemini API | omit thinkingConfig (default) |
| 4 | `gpt-5.4-mini` | OpenAI direct | `reasoning_effort: 'medium'` |

Note: Roma's spec listed Gemma as "Tier 4 (Primary)" — interpreting as "primary, with Gemini fallbacks above it numerically but the WALKER starts at Gemma." Cascade walker needs to support a primary-not-first semantic, OR I order the array with Gemma at index 0 (and document the apparent inversion). **Recommend the array-order approach**: Gemma at index 0, Gemini/OpenAI follow as fallback. Confirm with Roma.

### Layer F3 — Subconscious (nightly factual extraction)

Background cron, no user-facing latency.

| Tier | Model | Provider | Thinking config |
|---|---|---|---|
| 1 (Primary) | `gemini-3.1-flash-lite` | Gemini API | `thinkingLevel: 'minimal'` |
| 2 | `gemini-3.5-flash` | Gemini API | omit thinkingConfig (default) |
| 3 | `@cf/meta/llama-3.1-8b-instruct-fp8` | CF Workers AI (legacy schema) | n/a |

**Note**: Roma's spec said `@cf/meta/llama-3.1-8b-instruct` without `-fp8`. CF catalog only has the `-fp8` variant. **Need confirmation**: use `-fp8` or pick a different small model?

---

## 5. File-by-file changes

### Phase 1 — Provider wrappers (new code, no existing-code impact)

| File | Change |
|---|---|
| `src/providers/openai.js` (NEW) | OpenAI direct API wrapper. Functions: `runOpenAITier(env, model, prompt, systemPrompt, opts, label)`. Reads `env.OPENAI_API_KEY`. Maps to `messages` shape with `role:system` as message-0. Handles `reasoning_effort`, `max_completion_tokens`, `response_format` (json_schema). Returns trimmed text or null. |
| `src/providers/anthropic.js` (NEW) | Generic Anthropic direct API wrapper extracted from `curator.js::callHaikuStructured`. Functions: `runAnthropicTier(env, model, prompt, systemPrompt, opts, label)`. Supports `thinking: adaptive`, `thinking: extended`, structured outputs, plain text. Reads `env.ANTHROPIC_API_KEY`. Curator continues to use its inline call for now (refactor later). |
| `src/lib/ai-gateway.js` (EDIT) | Rework `runCfAi` to detect OpenAI-compat models (Gemma 4, Qwen 3.x, GLM, Kimi K2.6, Llama 4 Scout) and: send `max_completion_tokens` (omitted when no cap), pass `reasoning_effort` when caller specifies, pass `chat_template_kwargs.thinking` ONLY when caller explicitly sets it. **Remove the unconditional Gemma `thinking: false` injection that I shipped yesterday** — Eukara's approach proves this isn't necessary when token budgets are right. |
| `wrangler.jsonc` (EDIT — Roma) | Roma needs to `npx wrangler secret put OPENAI_API_KEY` before deploy. |

### Phase 2 — Cascade walker rework

| File | Change |
|---|---|
| `src/lib/ai/gemini.js` (EDIT) | Generalise `runCascade` to be provider-aware. Tier shape becomes `{ kind: 'gemini' \| 'cf' \| 'anthropic' \| 'openai', model, opts, label }`. Add dispatch branches for `anthropic` and `openai` calling the new provider wrappers. The existing `_runGeminiTier` and `_runCfTier` stay. |
| `src/lib/ai/gemini.js` (EDIT) | Update `SHORT_RESPONSE_TIERS`, `DEEP_RESPONSE_TIERS`, `BACKGROUND_TIERS` to use the new five-layer logic where applicable, OR mark legacy and leave alone if not on the critical path. |

### Phase 3 — Layer cascade arrays (the big rewrite)

| File | Change |
|---|---|
| `src/config/cascades.js` (NEW) | Single source of truth for the five layer cascades. Exports `LAYER_A_CURATOR_TIERS`, `LAYER_B1_TIERS`, `LAYER_B2C_TIERS`, `LAYER_D_TIERS`, `LAYER_F3_TIERS`. Imports model constants from `models.js` and the new provider wrappers. |
| `src/bot/handlers.js` (EDIT) | Replace `B1C_CASCADE` and `cascadeTierIdx` walker with a layer-aware variant that reads from `LAYER_B1_TIERS` or `LAYER_B2C_TIERS` depending on `curatorIntent` + `curatorComplexity`. The walker advancement logic stays index-based. |
| `src/services/responseCurator.js` (EDIT) | Keep its own internal cascade (it's a different task — JSON shape extraction). No change to fit it under Layer A. |
| `src/services/planner.js` (EDIT) | Replace direct `generateShortResponse` call with `runCascade(env, prompt, system, LAYER_B1_TIERS)` since the planner is a casual-flow helper. |
| `src/ai/router.js` (EDIT) | Update rule comments to reflect the five-layer model. The rules themselves (intent → layer dispatch) need refactoring so the router returns a LAYER tag, not a single model. The handler then walks the layer cascade. |
| `src/workflows/memoryConsolidation.js` (EDIT) | Wire to `LAYER_F3_TIERS` for the nightly factual-extraction job. |

### Phase 4 — Tests and verification

| File | Change |
|---|---|
| `tests/cascades/` (NEW DIR) | Per Roma's standing rule: test scripts + test results + decisions in subfolders. Initial smoke tests: one ping per tier per layer, recording latency + success rate. |
| `tests/cascades/scripts/ping_all_tiers.mjs` (NEW) | Standalone Node script that pings each model in each layer with a fixed prompt and records to `tests/cascades/results/YYYY-MM-DD-baseline.json`. |
| `tests/cascades/decisions/2026-05-21-layer-design.md` (NEW) | Sub-decision: why these orderings, expected latency, expected cost. |

### Phase 5 — Documentation and memory

| File | Change |
|---|---|
| `journal.txt` | Append summary at top once Phase 1-3 land. |
| `PROJECT_TRACKER.md` | New decision block. |
| `decisions/2026-05-21-five-layer-cascade-plan.md` | THIS FILE. |
| memory_user_edits | Replace #24 with the new five-layer state once deployed. |

---

## 6. Open questions for Roma

1. **Llama 3.1 8B variant**: CF only has `@cf/meta/llama-3.1-8b-instruct-fp8`. Roma's spec said `@cf/meta/llama-3.1-8b-instruct`. Use `-fp8`?
2. **Layer D primary semantic**: Gemma is "Tier 4 (Primary)" — confirm the cascade array should have Gemma at index 0 (walker starts there) with Gemini/OpenAI as fallbacks above it numerically.
3. **OPENAI_API_KEY Worker secret**: Roma needs to provision before Phase 1 can deploy. `npx wrangler secret put OPENAI_API_KEY`.
4. **Anthropic version pin**: Currently `2023-06-01` in curator.js. Newer features (adaptive thinking, structured outputs) may need `anthropic-version: 2024-09-23` or later. **Will verify against the latest docs in Phase 1.**
5. **Existing `PRIMARY_TEXT_MODEL`** in gemini.js: still points at FLASH_35_MODEL. Roma flagged this as "intentional" in the previous session. Confirm it should stay as `gemini-3.5-flash` for utility calls, separate from any layer cascade.
6. **PRO_LATEST_MODEL constant** in gemini.js already exists. The router's `GEMINI_MODELS.pro` was flipped to pro-latest yesterday. Question: revert `GEMINI_MODELS.pro` back to `gemini-3.5-flash` (so casual messages don't accidentally hit pro-latest as observed in this morning's log), OR remove the router rule mapping `curatorIntent==='casual'` to `GEMINI_MODELS.pro` and replace with a layer-aware dispatch? **Recommendation: the layer-aware dispatch in Phase 3 replaces this entire pattern. Until then, revert `GEMINI_MODELS.pro` to 3.5-flash to stop the bleeding.**
7. **Bench / regression risk**: each tier is a separate API call. Layer A is on the hot path of every turn. Adding OpenAI as Layer A Tier 4 (rare fallback) is fine but adding it as Layer B1 Tier 3 means every casual turn pays a potential ~3s OpenAI latency on the way to Tier 4 fallback. Resilience trade-off acknowledged.

---

## 7. Phase ordering (recommended)

| Phase | Scope | Sessions | Why first |
|---|---|---|---|
| 0 | Revert `GEMINI_MODELS.pro` to `gemini-3.5-flash` so casual doesn't hit pro-latest, AND remove the unconditional Gemma thinking-off injection from `applyModelSpecificParams`. Both single-line fixes that stop today's bleeding. | 0.25 | Stops casual messages going to pro-latest before the big rewrite lands. |
| 1 | Provider wrappers: `src/providers/openai.js`, `src/providers/anthropic.js`. Standalone smoke test scripts. No wiring into handlers. | 1 | New code is fully isolated; can be deployed without disturbing live behaviour. |
| 2 | Cascade walker generalisation: `runCascade` provider-aware. New `src/config/cascades.js` defining all five layer arrays. Still not wired. | 1 | Builds the infrastructure that Phase 3 uses. |
| 3 | Wire Layer B1, B2/C, D into `handlers.js` + `router.js`. Replace `B1C_CASCADE`. Layer A stays as-is (already correct). | 1-2 | Touches the hot path. Biggest risk. Needs careful diffing. |
| 4 | Wire Layer F3 into `memoryConsolidation.js` and any other background workflows. | 0.5 | Background, lower risk. |
| 5 | Bench + tests + documentation. | 0.5-1 | Verification, journal, project tracker, memory updates. |

**Total: 4-5 sessions** if no major surprises. 6-7 with bench iteration.

---

## 8. Risks identified

1. **OpenAI key not yet provisioned** — Roma blocker.
2. **Anthropic version header**: structured outputs + adaptive thinking may need a newer pin than 2023-06-01.
3. **Sonnet 4.6 max_tokens REQUIRED**: unlike Gemini, Anthropic requires `max_tokens`. Need a sensible default per layer (suggest 2048 for B2/C, 1024 for B1).
4. **OpenAI gpt-5.4 cost**: per Wikipedia, gpt-5.4-mini is 4x more expensive than gpt-5-mini equivalent. Layer B1 Tier 3 (gpt-5.4-mini) at scale could add up. Recommend logging actual fallback rates post-deploy and tuning.
5. **Cascade walker cross-provider streaming**: handlers.js currently expects Gemini-style streaming chunks. OpenAI and Anthropic use different SSE shapes. Phase 2 needs a shape adapter or, simpler, non-streaming fallback for non-Gemini tiers (they're fallbacks, not primary, so latency cost is small).
6. **Layer A Tier 4 (Haiku via Anthropic direct) is already wired** — no risk, just informational.
7. **Production deploy without bench first**: Roma deploys himself. Strongly recommend Phase 0 + Phase 1 land first, then Phase 2/3 in a separate deploy after smoke tests.

---

## 9. What I am NOT doing this session

- Touching any code. This session is verification + plan only.
- Updating journal.txt yet — only after Phase 0 lands.
- Updating PROJECT_TRACKER.md yet — only after Phase 0 lands.
- Updating memory yet — only after Phase 3 lands.

Roma to confirm:
- Open question answers (sec 6).
- Phase ordering and which phase to start next session.
- Whether to land Phase 0 (the two single-line bleeding-stops) in THIS conversation or roll into Phase 1.
