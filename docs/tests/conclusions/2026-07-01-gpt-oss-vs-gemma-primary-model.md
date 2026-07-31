# Decision: primary chat/code model — gpt-oss-120b vs gemma-4-26b-a4b-it

**Date:** 2026-07-01
**Test run analysed:** `docs/tests/results/2026-07-01T17-07-09-924Z/`
**Script:** `docs/tests/model-comparison-gpt-oss-vs-gemma.mjs`
**Traceability:** follows from the 2026-07-01 gpt-oss-120b migration (docs/journal.md, decisions/) and the open question of whether gemma-4-26b-a4b-it should be the primary model instead.

## Recommendation

**Keep `@cf/openai/gpt-oss-120b` as the primary chat/code model.** The spec-sheet comparison (cheaper, bigger context, vision, working `reasoning_effort`) favoured gemma-4-26b-a4b-it on paper. The actual test run reverses that: gemma failed to produce any visible answer on 2 of 6 realistic prompts, and was 2–8x slower on every prompt, because of default hidden reasoning behaviour the spec sheet doesn't show and Eukara's current code doesn't account for.

## What the raw output actually showed

Reading `choices[0].message` in the raw JSON (not just the visible-text summary in `comparison.md`) surfaced a field neither model's spec page mentions clearly: both models return a hidden reasoning trace alongside the visible answer — `reasoning_content` for gpt-oss-120b, `reasoning` for gemma-4-26b-a4b-it. **Eukara's `CloudflareProvider.parseResponse` (`src/ai/cloudflare.ts`) only ever reads `message.content` — it never reads either reasoning field.** That's fine as long as the model finishes its reasoning and still has budget left to write the visible answer. It stopped being fine here:

| Case | thinkingLevel | gpt-oss-120b | gemma-4-26b-a4b-it |
|---|---|---|---|
| casual | none | stop, 144 completion tokens | stop, 783 completion tokens (~730 hidden) |
| emotional_vent | none | stop, 388 tokens | stop, 1696 tokens (~1650 hidden) |
| code | HIGH | stop, 510 tokens, correct answer | **length — content: null, 2048/2048 tokens, empty reply** |
| functional | HIGH | stop, 382 tokens | stop, 1386 tokens (~1076 hidden) |
| long_message | MEDIUM | stop, 405 tokens | stop, 2043/2048 tokens (~2000 hidden) — nearly failed too |
| reasoning_stress | HIGH | stop, 1271 tokens, valid schedule | **length — content: null, 2048/2048 tokens, empty reply** |

Two findings, in order of importance:

1. **Gemma hit the token cap and returned a completely empty answer on 2 of 6 prompts** (`code`, `reasoning_stress`) — both genuinely open-ended, hard reasoning tasks. Its `reasoning` field shows why: on the `code` case, it visibly flip-flops between four different candidate answers for over 2,000 tokens ("Let's go with X... wait, let's pivot... actually, let's go with Y...") and never converges to a final answer before the budget runs out. In production, this is a reply the user never sees a response to at all — and Eukara's own `fallbackPro` salvage model is *also* gemma-4-26b-a4b-it right now, so a naive retry risks failing the same way twice.

2. **Gemma reasons by default, even when `reasoning_effort` is never sent.** The `casual` and `emotional_vent` cases had `thinkingLevel: null` — no reasoning parameter was requested at all — and gemma still spent 730–1650 tokens drafting and re-drafting candidate replies internally before settling on a one-liner. This is why every gemma response was slower (6.7s–37.6s vs. gpt-oss's 3.1s–24.6s) and cost more than the visible text would suggest. gpt-oss also reasons by default, but concisely (50–70 tokens of plan, not a multi-draft internal debate), and it never failed to finish.

## On answer quality itself, when gemma did respond

Where gemma completed successfully, its tone was often a very good match for Eukara's dry/sassy voice — e.g. on `functional` and `long_message` it pushed back on the premise ("The reflection is a luxury you can't afford this week... the gift and the productivity of reflecting are just noise") in a way that fits the "hold your independence, challenge assumptions" persona instruction arguably better than gpt-oss's more agreeable, structured responses. gpt-oss's `code` answer was the stronger technical answer of the two available for that case (correctly identified the shared-reference mutation bug, not just a more obvious KeyError, which is what gemma's reasoning trace was drifting toward before it ran out of budget). Casual replies were close to a wash — both landed the joke, gemma's was punchier and shorter.

So on pure conversational quality, when both actually answer, it's closer to a genuine style trade-off than a blowout. It's the reliability and latency gap — not the writing quality — that decides this.

## What would need to change to reconsider gemma

- Read `message.reasoning` in `parseResponse` (or at minimum log it) so hidden reasoning is visible for debugging, not silently discarded.
- Raise `max_completion_tokens` well above 2048 for any gemma-routed call, and/or find a way to suppress or cap gemma's default reasoning verbosity (not confirmed to exist as a parameter on this model/endpoint — worth checking Cloudflare's docs or support before assuming it's possible).
- Point `fallbackPro` at a genuinely different model than the primary route, so a salvage retry isn't gambling on the same failure mode.
- Re-test with a larger token budget to see whether the two `length`-truncated cases were genuinely unsolvable in gemma's reasoning style, or just needed more room.

None of that is done today, so switching now would be a regression, not an upgrade, despite gemma's better list price and larger context window.

## Caveats

- Single run, one sample per case — no repeated trials to check variance (a second run could land differently, especially near the token-cap edge cases).
- Cost figures in `comparison.md` use the real `usage.completion_tokens` from the API, so they already reflect the hidden reasoning tokens — but that also means gemma's advertised per-token price advantage is smaller in practice than the sticker price implies, once actual token consumption is counted rather than assumed.
- This only evaluates the `chat`/`code` primary-model question. It says nothing about gemma's suitability as the `grounded` lane (web search) or `fallbackPro`, where it's already in production use today for different reasons.
