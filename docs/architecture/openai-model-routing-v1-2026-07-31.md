# OpenAI Model Routing v1

Date: 2026-07-31
Status: Approved and implemented, pending production release validation

## Decision

Eukara uses the OpenAI Responses API with explicit model and reasoning-effort
lanes. The curator returns a strict structured route containing intent,
complexity, crisis status and whether current external information is needed.

| Workload | Model | Reasoning | Notes |
|---|---|---:|---|
| Curator, intent and crisis triage | GPT-5.6 Luna | Medium | Strict JSON Schema plus deterministic narrow crisis fallback |
| Short casual conversation | GPT-5.6 Luna | High | Owner-approved quality bias for social turns |
| Simple reminder or tool action | GPT-5.6 Luna | Medium | Low-complexity functional lane |
| Substantive everyday conversation | GPT-5.6 Terra | Medium | Context-dependent discussion, planning and multi-step requests |
| Reflection, journalling, mental-health and health conversation | GPT-5.6 Terra | Medium | Nuance and continuity take priority over minimum cost |
| Code and technical problem solving | GPT-5.6 Terra | High | Interactive coding lane |
| Deep research and architecture Workflows | GPT-5.6 Sol | High | Bounded quality-first work |
| Consolidation proposal | GPT-5.6 Sol | Medium | Proposal-only and disabled by default |
| Media and sticky substantive context | GPT-5.6 Terra | Medium | Vision or continuing complex context |

Web search is available only when the curator says that current information is
required. Reasoning effort is passed through streaming as well as non-streaming
requests, so the router's decision is not silently replaced by the API default.

## Luna High versus Terra Low

Luna is OpenAI's cost-sensitive, high-volume tier. Terra has a higher base
capability ceiling and is positioned as the intelligence-and-cost balance.
The per-token Luna price is 40% of Terra's, but High effort may produce enough
additional reasoning tokens and latency to narrow or reverse the total-turn
advantage over Terra Low. High effort should therefore remain only if
representative Eukara evaluations show a measurable conversational benefit.

The curator is the guardrail around this decision. A casual turn that is
nuanced, reflective, multi-part or context-dependent is promoted to Terra
Medium rather than left on Luna High.

## Evaluation gates

Track by route reason and model:

- end-to-end and first-token latency;
- input, cached-input, reasoning and output tokens;
- estimated cost per completed turn;
- tool success and retry rate;
- user corrections or negative feedback;
- crisis false-negative and false-positive test cases;
- curator promotion rate from casual to substantive.

Compare Luna High against Luna Medium and Terra Low on a fixed, anonymised
conversation set before changing the approved route.

## Official references

- [OpenAI GPT-5.6 model guidance](https://developers.openai.com/api/docs/guides/latest-model)
- [OpenAI model catalogue and pricing](https://developers.openai.com/api/docs/models)
- [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
