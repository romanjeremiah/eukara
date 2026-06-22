# Decision: ~/Projects is the canonical working directory (2026-06-14)

## Decision
From 2026-06-14, ALL work on Xaridotis and Eukara happens under /Users/romanjeremiah/Projects:
- Xaridotis (gemini-bot): /Users/romanjeremiah/Projects/xaridotis/gemini-bot
- Eukara:                 /Users/romanjeremiah/Projects/eukara

The previous OneDrive locations under
/Users/romanjeremiah/Library/CloudStorage/OneDrive-Personal/Documents/GitHub/
are DEPRECATED and must not be edited. They are now stale/behind.

## Rationale
- OneDrive-synced paths caused recurring filesystem write stalls. Moving off OneDrive removes
  that class of failure.
- Verified 2026-06-14: every source/content file is byte-identical between old and new for both
  projects (recursive diff, zero differences, excluding node_modules/.git/build noise).
- The new gemini-bot repo committed the previously-uncommitted in-flight work as commit 578186c
  (clean linear descendant of c5e2247; nothing lost). The old copy still carries that work
  uncommitted, so it is the behind copy.

## Follow-up actions
- SECURITY: the gemini-bot git remote embeds a GitHub PAT in cleartext in .git/config. Rotate the
  token and switch to SSH or a credential helper.
- Retire/delete the OneDrive copies once nothing references them.

## Status
Active. All future file operations target the ~/Projects paths.
