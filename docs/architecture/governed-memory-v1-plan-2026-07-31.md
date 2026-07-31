# Governed Memory v1

Date: 2026-07-31
Status: Approved and implemented, pending production release validation

## Current situation

Eukara has useful D1, Queue and Vectorize foundations, but the generic
`memories` table treats every stored statement as active truth. It has no
provenance, supporting evidence, confidence, confirmation state, validity
window or projection version.

A read-only production audit found:

- 108 active generic memories;
- 81 automatically generated `implicit_mood`, `episode_topic` or
  `personality_trait` records, representing 75% of active memories;
- 50 mood-journal rows and 24 knowledge-graph rows;
- no episode or chat-summary rows.

The current consolidation Workflow reads at most 200 memories, asks a model to
rewrite them, then replaces the user's complete memory set. This can discard
rows outside the input window, lose provenance and introduce model-generated
claims. Superseded or deleted D1 rows also do not consistently remove their
Vectorize projections, which can consume semantic top-K slots.

## Design principles

1. D1 remains the source of truth. Vectorize is a disposable projection.
2. Recall uses only confirmed, unexpired, evidence-backed assertions.
3. Inferences are candidates, not facts.
4. Mood, episodes, tool state and factual memory retain distinct lifecycles.
5. Every projection write and delete is idempotent and auditable.
6. Consolidation proposes merges; it never deletes and regenerates the entire
   memory corpus.

## Proposed architecture

### 1. Containment

- Stop promoting inferred mood, episode topics and personality traits directly
  into confirmed generic memory.
- Keep existing production rows unchanged during shadow mode.
- Feature-gate destructive consolidation before the governed store is enabled.
- Delete or tombstone vector projections whenever an assertion is superseded,
  rejected, expired or forgotten.

### 2. Additive governed store

Add new tables without changing the legacy `memories` contract:

- `memory_assertions`: canonical statement, category, lifecycle status,
  confidence, validity interval, source kind and supersession links;
- `memory_evidence`: assertion ID, source type, source record or turn ID,
  observed time, evidence digest and extraction confidence;
- `memory_outbox`: idempotency key, assertion version, upsert/delete action,
  retry state and last error;
- `memory_projection_registry`: assertion version, vector ID, embedding model,
  projection state and timestamps.

Lifecycle states are `candidate`, `confirmed`, `rejected`, `superseded` and
`expired`. Only `confirmed` assertions with evidence and a valid time window
may enter semantic recall.

### 3. Capture policy

- Explicit first-person user statements can become confirmed facts with the
  source turn recorded as evidence.
- Model-inferred preferences, traits, relationships, diagnoses and therapeutic
  interpretations remain candidates.
- Mood entries remain in the mood journal. Episode summaries remain episodes.
  They can support an assertion as evidence without becoming duplicate facts.
- User corrections create a superseding assertion and retain the audit trail.
- Forgetting removes the assertion from recall and queues projection deletion.

### 4. Projection and recall

- Queue an outbox event after the authoritative D1 transaction.
- Upsert only the latest confirmed assertion version into Vectorize.
- Store filterable metadata for user, entity type, lifecycle and version.
- Filter before top-K retrieval, then hydrate exact assertion IDs from D1.
- Assemble context in separate lanes: recent conversation, confirmed facts,
  episodes, mood and tool state. Deduplicate by assertion ID and apply an
  explicit context budget.

Cloudflare Queues provide at-least-once delivery, so every projection consumer
must be idempotent. D1 transactions protect the assertion and outbox state;
Vectorize remains eventually consistent and recoverable from the registry.

### 5. Safe consolidation

Replace delete-and-reinsert consolidation with a proposal pipeline:

1. Select a bounded set of related confirmed assertions and their evidence.
2. Ask the model for merge, supersede or no-change proposals.
3. Validate that every output is supported by cited assertion IDs.
4. Apply accepted lifecycle transitions transactionally.
5. Preserve raw evidence and queue the corresponding vector updates.

No proposal can invent a new confirmed assertion without source evidence.

### 6. Rollout

1. Add schemas, repository interfaces and lifecycle tests.
2. Shadow-write new captures while legacy recall remains authoritative.
3. Backfill legacy rows as `legacy_unverified`; do not auto-confirm rows that
   lack recoverable evidence.
4. Compare legacy and governed recall using contradiction, provenance,
   deletion and contamination evaluations.
5. Enable governed recall for the owner only, then cut over after the quality
   gates pass.
6. Keep legacy recall available as a rollback path until the observation window
   completes.

## Approved lifecycle decisions

1. Explicit, non-sensitive first-person facts may auto-confirm only when the
   proposed statement is lexically supported by the recorded source turn.
2. Sensitive or inferred claims remain candidates until the user confirms
   them through Telegram memory controls.
3. Legacy rows enter the governed store as `legacy_unverified` and are not
   eligible for governed recall or projection until confirmed.
4. Destructive consolidation is immediately feature-gated and replaced by an
   evidence-cited, proposal-only Workflow.

## Recommended baseline

- Automatically confirm explicit first-person facts with source evidence.
- Keep inferred and sensitive health, relationship and personality claims as
  candidates until the user confirms them.
- Add a Telegram memory review surface with confirm, reject, correct and forget
  actions.
- Import current rows as `legacy_unverified`; progressively confirm only those
  with evidence or user review.
- Keep mood and episode records in their source tables.

## Implemented release boundary

- `memory_assertions`, `memory_evidence`, `memory_outbox`,
  `memory_projection_registry` and `memory_consolidation_proposals` are
  additive D1 tables. The legacy table is retained for rollback.
- D1 is authoritative. Confirmed, unexpired, evidence-backed assertions are
  the only governed facts eligible for direct or semantic recall.
- Exact duplicate automatic captures reuse an active assertion.
- Queue projection uses assertion versions and deterministic outbox IDs.
  Failed or stale processing rows are reconciled by cron.
- Vectorize projection IDs use the `assert_` prefix and `memoryKind=governed`.
  Governed recall filters before top-K and rehydrates exact assertions from D1.
- When governed recall is enabled, legacy memory is not injected into live
  conversation context. The user can progressively confirm legacy rows with
  `/memories`.
- Confirm, reject, correct and forget actions update D1 lifecycle state and
  remove or replace derived vector projections.
- `MEMORY_CONSOLIDATION_ENABLED` defaults to `false`. Even if enabled later,
  the Workflow can only store source-cited review proposals and cannot delete
  or regenerate memory rows.

## Release risk and rollback

The deliberate safety cost is reduced historical continuity immediately after
cutover: unverified legacy facts stop entering conversation until reviewed.
This is preferable to silently treating provenance-free model inferences as
truth. Setting `GOVERNED_MEMORY_RECALL_ENABLED=false` restores the filtered
legacy recall path without deleting governed records.
