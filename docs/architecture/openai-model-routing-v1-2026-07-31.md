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
| Short casual conversation | GPT-5.6 Terra | Low | Low-latency lane with curator promotion to Terra Medium |
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

## Casual routing decision: Terra Low

OpenAI positions Terra as the balance of intelligence and cost. Its official
reasoning guidance identifies Medium as the balanced starting point and Low as
the setting for latency-sensitive workloads. Eukara therefore uses Terra Low
only for simple casual turns rather than inheriting the omitted Medium default.

The curator is the guardrail around this decision. A casual turn that is
nuanced, reflective, multi-part or context-dependent is promoted to Terra
Medium. Emotional, health and reflective conversations also remain Terra
Medium. This preserves the stronger quality lane where extra reasoning is
likely to matter without applying its latency to greetings and lightweight
social exchanges.

## Evaluation gates

Track by route reason and model:

- end-to-end and first-token latency;
- input, cached-input, reasoning and output tokens;
- estimated cost per completed turn;
- tool success and retry rate;
- user corrections or negative feedback;
- crisis false-negative and false-positive test cases;
- curator promotion rate from casual to substantive.

Compare Terra Low against Terra Medium on a fixed, anonymised conversation set.
Promote the default only if Medium produces a measured conversational-quality
gain that justifies its additional latency and token use.

## Official references

- [OpenAI GPT-5.6 model guidance](https://developers.openai.com/api/docs/guides/latest-model)
- [OpenAI model catalogue and pricing](https://developers.openai.com/api/docs/models)
- [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
