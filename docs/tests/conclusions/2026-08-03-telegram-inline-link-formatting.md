# Telegram Inline-Link Formatting Conclusion

Date: 2026-08-03
Outcome: passed and commit-ready

## Conclusion

The visible full-link defect was caused by a missing conversion in the shared
Markdown normaliser, not by Telegram's HTML sender or the dedicated grounding
source block. Grounded model prose can contain Markdown links even when the
persona asks for HTML. Those links previously passed through unchanged.

The normaliser now converts validated HTTP and HTTPS Markdown links to compact
Telegram HTML anchors. It removes redundant citation parentheses, escapes link
labels and URL attributes, protects URL underscores from emphasis processing,
and preserves code spans and existing HTML links.

## Risk disposition

- Regression risk is low because the change is a pure, central text
  transformation with focused edge-case tests.
- Unsupported or malformed destinations remain visible rather than being
  silently linked.
- No model, prompt, binding, storage, API or production configuration changed.
- Type checking, 33 unit tests, 70 full-suite tests and the Wrangler deployment
  dry run passed.

## Evidence

See `docs/tests/results/2026-08-03-telegram-inline-link-formatting.txt`.
