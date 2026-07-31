# Direct OpenAI API Migration Plan

Date: 2026-07-31
Status: Stages 1 to 4 complete; OpenAI production cutover ready to deploy
Owner instruction: Replace Eukara's model routing and AI-provider architecture with the direct OpenAI API.

## 1. Current situation

Eukara is a Cloudflare Worker whose AI execution is split across several
incompatible provider paths:

- the primary conversation, curator, embeddings, reranking and background
  inference paths call Cloudflare Workers AI;
- `src/workflows/research.ts`, `src/workflows/consolidation.ts` and
  `src/workflows/architect.ts` still call Google Gemini;
- `src/lib/tts.ts` still calls Gemini TTS;
- media routing selects a Cloudflare LLaVA model which is not included in the
  provider's vision-capable model set, so the adapter can discard media;
- the provider-neutral types and message loop retain Gemini-specific fields and
  branches;
- the existing Vectorize index contains embeddings produced by a Cloudflare
  model and cannot safely mix vectors from a different embedding model.

The current Stage 3 baseline passes TypeScript, 32 automated tests, the Worker
bundle dry-run and six live OpenAI endpoint checks. Production remains on the
Cloudflare provider flag while the embedding projection is still pending.

## 2. Approved architectural boundary

The following decision is approved:

- Eukara will call OpenAI directly, not through Cloudflare AI Gateway.
- Cloudflare remains the application and durability platform: Workers, D1, KV,
  R2, Vectorize, Queues and Workflows remain in place.
- `OPENAI_API_KEY` will be a Worker secret and must never be committed to source
  or `wrangler.jsonc`.
- The OpenAI Responses API will be the common interface for conversational,
  reasoning, multimodal and tool-calling workloads.
- Provider-specific logic will live behind one OpenAI adapter. Bot handlers,
  tools and Workflows must not construct OpenAI wire payloads independently.

## 3. Recommended target architecture

```text
Telegram webhook
    |
    v
Ingress and safety controls
    |
    v
Task router (intent, modality, latency and risk)
    |
    v
OpenAI provider adapter
    |-- Responses API: chat, reasoning, vision, tools and web search
    |-- Embeddings API: semantic memory vectors
    |-- Audio APIs: transcription and speech generation
    `-- Image API: image generation when explicitly requested
    |
    +-- D1: authoritative user, memory and lifecycle state
    +-- R2: authoritative media and report bytes
    +-- Vectorize: replaceable retrieval projection
    +-- Queues: idempotent background jobs
    `-- Workflows: durable multi-step research and consolidation
```

## 4. Recommended routing policy

The current OpenAI model guidance distinguishes three GPT-5.6 roles:

| Workload | Recommended role | Initial reasoning |
|---|---|---|
| Curator, tagging, topic shift and simple extraction | GPT-5.6 Luna | Low-cost, high-volume workload |
| Default conversation, emotional support, vision and tool use | GPT-5.6 Terra | Balance of quality, latency and cost |
| Complex architecture, deep research and difficult consolidation review | GPT-5.6 Sol | Quality-first, limited-volume workload |

Exact model snapshots and reasoning settings must be configuration, not scattered
string literals. Route selection must be deterministic and observable.

## 5. Privacy and state recommendation

Recommended default:

- send `store: false` on OpenAI requests;
- keep D1/KV/R2 as Eukara's durable authority;
- replay only the bounded conversation and tool context needed for a turn;
- use a stable, privacy-preserving safety identifier derived from the Eukara
  user identity rather than sending the Telegram identifier directly;
- redact secrets, credentials and unnecessary personal data from logs;
- do not introduce OpenAI-hosted conversation state or File Search in the first
  migration stage.

This keeps provider replacement possible and avoids creating a second,
independent conversation authority.

## 6. Embedding and Vectorize migration

Changing embedding models requires a blue-green projection migration:

1. Inspect and record the current Vectorize index dimensions and metric.
2. Create a new index compatible with the chosen OpenAI embedding output.
3. Add an embedding-version field to projection metadata.
4. Backfill active, non-superseded D1 memories into the new index using an
   idempotent Queue job.
5. Compare recall quality and coverage against representative Eukara queries.
6. Switch reads only after the new index meets the acceptance gates.
7. Retain the old index for rollback until the observation window completes.

Existing vectors must not be overwritten in place or mixed with OpenAI vectors.

## 7. Tool and mutation boundary

Provider migration must not preserve prompt-only authorisation:

- read-only tools may run when their validated server policy allows them;
- mutating tools require an enforced owner check and a short-lived,
  request-bound confirmation record;
- the model must never be the authority deciding whether consent exists;
- tool-call IDs and results must be preserved exactly through each Responses API
  continuation;
- duplicate tool calls and Queue deliveries must be idempotent.

`patch_repo_file` is the first required enforcement target.

## 8. Media lifecycle

The migration must separate durable acceptance from model processing:

1. download and validate Telegram bytes;
2. persist bytes to R2 and ownership/lifecycle metadata to D1;
3. acknowledge durable acceptance;
4. enqueue transcription, vision, document or indexing work;
5. record `pending`, `processing`, `ready`, `failed` or `expired`;
6. pass bounded media to OpenAI only after local ownership is established.

Fire-and-forget R2 writes are not an acceptable success path.

## 9. Implementation stages

### Stage 0: decisions, evaluation fixtures and rollback contract

- resolve the decision register in section 11;
- capture representative conversation, tool, vision, audio, research and memory
  fixtures with personal data removed;
- define quality, latency, cost and failure acceptance thresholds;
- add a feature flag which can select the old or new adapter during validation.

### Stage 1: OpenAI foundation

- add the supported OpenAI SDK;
- add generated environment typing for `OPENAI_API_KEY`;
- create the central model registry and OpenAI provider adapter;
- implement Responses API output, streaming, structured output and function-call
  parsing;
- add mocked provider-contract tests with no live API dependency.

### Stage 2: stateless and conversational paths

- migrate curator, topic shift, background extraction and default chat;
- migrate tool-loop continuation and Telegram draft streaming;
- add web-search citation handling;
- enforce tool authorisation before enabling mutating tools.

### Stage 3: multimodal and specialist services

- [x] persist Telegram media before processing;
- [x] migrate vision, transcription, TTS and image generation;
- [x] migrate architect, research and memory-consolidation Workflows;
- [x] make Workflow writes and notifications idempotent and keep provider
  calls inside independently retryable steps.

Stage 3 OpenAI routing remains disabled in production by
`AI_PROVIDER_MODE = "cloudflare"`
until Stage 4 provides the versioned OpenAI embedding projection and the
cutover gates have passed.

### Stage 4: embeddings and retrieval

- [x] provision a separate 1,536-dimension cosine Vectorize index with
  `userId` and `embeddingVersion` metadata indexes;
- [x] add Queue-owned, retry-safe dual projection for new writes and D1
  backfill batches;
- [x] route OpenAI-mode semantic search and Luna reranking to the green
  projection while retaining Cloudflare-mode reads from the blue index;
- [x] complete 108/108 production coverage in both indexes and record a 10/10
  top-1 and top-3 recall comparison for both projections;
- [x] prepare OpenAI read cutover while retaining the old index and provider
  bindings for the rollback observation window.

### Stage 5: removal and production rollout

- remove Gemini and Workers AI runtime dependencies only after all paths pass;
- remove obsolete provider types, comments, secrets and configuration;
- update the compatibility date and run `wrangler types`;
- deploy gradually, inspect structured logs and cost, then close the rollback
  window.

## 10. Validation gates

No production cutover until all of the following hold:

- TypeScript, unit tests and Worker dry-run pass;
- the stale root snapshots are replaced with meaningful endpoint tests;
- text, tools, streaming, image, voice, document and Workflow fixtures pass;
- mutating tools fail closed without server-side authorisation;
- no accepted media depends on a floating promise;
- the new Vectorize index has complete active-memory coverage;
- old and new recall results are compared before cutover;
- per-route token use, latency, errors and estimated cost are observable;
- rollback restores the previous adapter and Vectorize index without data loss.

## 11. Approved decision register

The owner approved the recommended baseline on 2026-07-31. The alternatives
below remain recorded for architectural traceability but are not the selected
implementation.

### D1. AI workload scope

**Approved:** migrate all model inference, including conversation, curator,
background extraction, web research, vision, transcription, speech, image
generation, embeddings and reranking. Retain Cloudflare only for application and
storage infrastructure.

Alternative: migrate only generative text and keep Workers AI for embeddings,
reranking and speech. This is cheaper to implement but is not an all-OpenAI model
architecture.

### D2. OpenAI response storage

**Approved:** `store: false`, with Eukara-controlled state in D1/KV/R2.

Alternative: allow OpenAI-stored responses and continuation IDs. This reduces
some replay work but creates another state and retention authority.

### D3. Model routing

**Approved:** Luna for high-volume classifiers/extractors, Terra for the main
conversation and tool loop, Sol for bounded quality-first tasks.

Alternative: use Terra everywhere. This is simpler but spends more on background
work and gives up a distinct quality-first lane.

### D4. Failure policy

**Approved:** OpenAI-only fallback between configured GPT roles, followed by a
transparent user-visible failure. Do not silently fall back to Gemini or Workers
AI.

Alternative: retain a temporary cross-provider emergency fallback during
migration. This improves availability but prevents a clean provider boundary and
complicates behavioural evaluation.

### D5. Embedding cutover

**Approved:** a new versioned Vectorize index with Queue-owned backfill,
blue-green evaluation and rollback retention.

Alternative: keep the existing Workers AI embedding model indefinitely. This
avoids reindexing but leaves a permanent non-OpenAI model dependency.

## 12. Current official references

- OpenAI model guidance:
  https://developers.openai.com/api/docs/guides/latest-model
- OpenAI model catalogue:
  https://developers.openai.com/api/docs/models
- Cloudflare Workers best practices:
  https://developers.cloudflare.com/workers/best-practices/workers-best-practices/
- Cloudflare Vectorize limits:
  https://developers.cloudflare.com/vectorize/platform/limits/
