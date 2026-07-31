# OpenAI Stage 4 Embedding Readiness

Date: 2026-07-31
Status: Pre-backfill gates passed

## Evidence

- `text-embedding-3-small` returned exactly 1,536 dimensions in a live call.
- `eukara-memory-openai-v1` was created with 1,536 dimensions and cosine
  distance.
- Numeric `userId` and string `embeddingVersion` metadata indexes were active
  before inserting vectors.
- TypeScript, 39 automated tests and the Worker bundle dry-run passed with the
  old and new Vectorize bindings present.

## Gate

The provider flag must remain `cloudflare` until the Queue-owned backfill
reaches all active D1 memories and the aggregate self-recall comparison is
recorded. The existing `my-ai-bot-memory` index remains bound for rollback.

Raw live evidence:
`docs/tests/results/2026-07-31T10-33-51Z/openai-stage4-smoke.json`.
