# Governed Memory and Model Routing Release Test Plan

Date: 2026-07-31

## Automated checks

1. Generate Cloudflare binding types and run TypeScript validation.
2. Run the isolated unit lane for routing, Responses structured output,
   Telegram formatting and memory capture policy.
3. Run the complete Worker test suite.
4. Apply the complete schema and migration to a fresh local D1 database,
   import a representative legacy row and run `PRAGMA foreign_key_check`.
5. Build the production Worker with `wrangler deploy --dry-run`.
6. Run `git diff --check` and inspect the final scoped diff.

## Production gates

1. Confirm the `memoryKind` String metadata index is ready on both Vectorize
   projections.
2. Record a D1 Time Travel recovery bookmark.
3. Apply migration 0004 and verify aggregate lifecycle counts and foreign keys.
4. Deploy the Worker, record the version, and confirm the health endpoint.
5. Verify `MEMORY_CONSOLIDATION_ENABLED=false` in the deployed bindings.

## Behavioural contracts

- Luna High handles simple casual turns.
- Luna Medium handles curator and simple functional turns.
- Terra Medium handles substantive, emotional and reflective turns.
- Terra High handles code; Sol High handles research and architecture.
- Unsupported, sensitive and inferred memories remain candidates.
- Only confirmed, unexpired, evidence-backed assertions enter governed recall.
- Consolidation cannot mutate memory truth.
