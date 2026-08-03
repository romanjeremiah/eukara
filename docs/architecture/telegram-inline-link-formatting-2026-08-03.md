# Telegram Inline-Link Formatting Repair

Date: 2026-08-03
Status: implemented under the owner's formatting-fix instruction

## Current situation

Eukara sends persistent messages using Telegram HTML parse mode. Its dedicated
grounding-source block already emits valid HTML anchors, but model prose can
still contain Markdown links such as `[label](https://example.com)`. The shared
`normaliseMarkdown()` function converted headings, emphasis, lists, code and
tables, but not links. Telegram therefore displayed the Markdown label and the
complete destination URL.

## Decision

Extend the existing shared normaliser rather than create a second rendering
path:

- recognise Markdown links with validated HTTP or HTTPS destinations;
- convert them to Telegram `<a href="...">label</a>` anchors;
- escape the URL for a quoted HTML attribute;
- stash anchors until emphasis processing is complete so underscores in paths
  and OpenAI tracking query parameters are not interpreted as italics;
- remove the redundant outer parentheses commonly emitted around a citation;
- leave malformed or unsupported destinations visible rather than silently
  creating a different link;
- preserve links inside code spans and existing Telegram HTML anchors.

## Impact assessment

- The repair applies centrally to ordinary replies, proactive outreach and
  weekly reflections, all of which already use the shared normaliser.
- The dedicated grounding-source block is unchanged.
- No prompt, model route, Telegram API, binding, storage schema or production
  state changes.
- Processing remains bounded linear text transformation on messages already
  constrained by Telegram's message length.

## Verification plan

1. Reproduce the exact parenthesised OpenAI web-link shape from the screenshot.
2. Cover query strings, underscores, code spans and existing HTML anchors.
3. Run type checking, unit tests, the full Workers suite and Wrangler dry run.
4. Review the final diff and preserve unrelated worktree changes.
