# Terra Low Casual Routing Validation

Timestamp: 2026-07-31T14:52:17Z

## Decision contract

- Simple casual intent routes to `gpt-5.6-terra` with Low reasoning.
- Substantive casual intent remains `gpt-5.6-terra` with Medium reasoning.
- Curator and simple functional routes remain unchanged.
- Optimistic streaming remains gated by `reason=default_casual`.

## Results

- `npm run typecheck`: passed.
- `npm run test:unit`: 3 files, 19 tests passed.
- `npm run test:run`: 9 files, 52 tests passed. Vitest reported its known
  delayed-close warning after all assertions passed.
- `npm run deploy:dry-run`: passed at 1,714.63 KiB raw and 277.50 KiB gzip.
- `git diff --check`: passed.
- Production deployment: passed with 10 ms Worker startup time, version
  `870701dd-ca5a-4d2c-bc7e-8b870b049433`.
- Post-deployment health check: `Eukara is running`.

The initial full-suite and dry-run attempts inside the managed sandbox were
blocked by localhost and Wrangler-log permissions. Both were rerun with scoped
permission and completed successfully; this was a harness constraint rather
than an application failure.
