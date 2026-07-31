# Telegram Conversation Rendering

Date: 2026-07-31
Status: Approved for implementation

## Current situation

Persistent Eukara replies use Telegram `sendRichMessage` with Rich HTML. The
model prompt discourages heading tags, but it encourages bold section labels
and the Markdown normaliser promotes leaked headings to bold text. After the
OpenAI cutover, the result is visually heavier than the previous conversational
style.

## Approved target

- Persistent conversational replies use classic `sendMessage` with
  `parse_mode: HTML`.
- Persistent edits use `editMessageText` with the same classic HTML contract.
- Rich Messages remain available only for ephemeral streaming drafts or future
  features that explicitly require rich blocks.
- Markdown headings degrade to normal paragraph text rather than bold labels.
- Persona instructions make ordinary paragraphs the default and limit bold
  emphasis to a short phrase when it materially improves comprehension.

## Impact assessment

- Message text, inline keyboards, replies and message effects remain supported.
- Links, code, spoilers, blockquotes and Telegram HTML entities remain
  supported through the existing sanitiser.
- Persistent replies return to a uniform client-controlled font size.
- Rich-only headings, tables and embedded media are intentionally unavailable
  in the normal conversation path.
- The change does not alter model routing, prompts outside typography, memory,
  storage or Workflow behaviour.

## Validation plan

- Unit-test the outbound Telegram method and payload for sends and edits.
- Unit-test leaked Markdown heading normalisation.
- Run TypeScript, the complete test suite and a Wrangler dry-run.
- Deploy only after the classic payload is confirmed and unrelated working-tree
  changes remain unstaged.
