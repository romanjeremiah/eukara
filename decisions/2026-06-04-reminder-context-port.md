# 2026-06-04 — Reminder context port (Option A minus TTS)

## Context

Eukara's reminder tool surface was minimal: `set_reminder` captured
`task_message` + `context` + `due_at_timestamp` + `recurrence_type`,
stored a tiny metadata blob (`origin` + `source_context`), and the
delivery cron sent a one-line "Reminder · time · text" message with
no surrounding context. The Xaridotis equivalent had evolved further:
SMART TIMING heuristic, second-person perspective rules, an
`original_user_request` capture, expandable blockquote on delivery,
and Voice + Delete buttons.

Roma opened the session asking for the Voice button to be fixed
(separate diagnostic established the root cause was a Telegram Premium
privacy setting, not code). Once unblocked he confirmed the reminder
port as the main work for the session.

## Scope

Port the Xaridotis reminder context model to Eukara. Specifically:
1. Capture more context on save (originalRequest, firstName, persona).
2. Surface that context on delivery (blockquote + inline keyboard).
3. Update tool descriptions so the model populates fields correctly.
4. Keep Eukara's existing message format; only add to it.
5. NOT port the auto-TTS-on-delivery feature.

## Decisions locked before implementation

### Decision 1b — Soft-cancel preserved as the canonical mechanism

Xaridotis's `update_reminder.cancel:true` hard-deletes the row.
Eukara's `softCancel` sets `status='cancelled'` and keeps the row
for audit. Roma chose to keep soft-cancel but expose `cancel:true` as
the public tool API so the model's mental model matches Xaridotis.
Implementation: `cancel:true` short-circuits to `reminders.softCancel`
inside the tool's execute. Hard delete remains reserved for
`reminders.deleteAll` behind `/forget`.

Why: audit trail matters, cancellation is reversible by reading the
row back, and the model interface stays portable between projects.

### Decision 3 — `persona` field stored even though single-persona today

Eukara is single-persona (`'eukara'`). The field is always that
literal. Stored anyway because:
- Future multi-persona is a stated goal in `userMemories`.
- Adding the field after the fact would require either a migration
  or a confusing read-time default.
- Cost is one extra string per reminder row.

### Decision on firstName threading — no ToolContext change

Two paths considered:
1. Add `firstName?: string` to `ToolContext`, populate it once in
   `message.ts` per turn.
2. Fetch from `user.getProfile()` inside the `set_reminder` execute.

Chose option 2. `set_reminder` is infrequent (a few per day at most),
one extra D1 read per save is negligible, and option 1 ripples through
`ToolContext` consumers for a field only one tool wants.

### Decision on metadata field naming — `reason` over `source_context`

Xaridotis stores the 'why' in `metadata.reason`. Eukara previously
stored it in `metadata.source_context`. Renaming to `reason` going
forward keeps the two projects' metadata shapes aligned (helpful when
porting features between them) and matches the more readable name.

Back-compat: `source_context` stays on the `ReminderMetadata` type
with a `@deprecated` JSDoc tag, and every read path falls back from
`reason` to `source_context`. Existing rows continue to render their
blockquote correctly. No data migration needed.

### Decision on cron message format — additive only

Xaridotis's delivery line is `⏰ Reminder: text` + Scheduled-for line
+ blockquote. Eukara's was `⏰ Reminder · tg-time · text`. Roma's
locked decision was to keep Eukara's existing header and only ADD the
blockquote and inline keyboard on top. Rationale: Eukara's tg-time
entity is richer than a literal "Scheduled for" line because the time
re-renders in the user's local format client-side.

## Files modified

| File | Change |
|---|---|
| `src/lib/telegram.ts` | `sendVoice` warn-only log on `!data.ok` (separate silent-swallow fix). |
| `src/services/reminders.ts` | `ReminderMetadata` extended with `reason`, `originalRequest`, `firstName`, `persona`, `createdAt`. `source_context` deprecated. |
| `src/tools/reminder-tools.ts` | `set_reminder`, `list_reminders`, `update_reminder` rewritten with Xaridotis-aligned shape and verbatim-ported descriptions. |
| `src/router/cron.ts` | `deliverReminders` HTML-escapes user content, appends blockquote when `metadata.reason` present, adds Voice + Delete inline keyboard. |
| `src/config/personas.ts` | SECOND_BRAIN_DIRECTIVE item 2 expanded with perspective rule, 24-hour rule, `original_user_request` requirement, edit/cancel workflow. |

## Explicitly rejected during planning

- **Adding firstName to ToolContext.** Disproportionate ripple for one
  consumer.
- **Hard-deleting on `cancel:true`.** Removes audit. Reversible
  cancellation is the safer default.
- **Wholesale replacing Eukara's cron message with Xaridotis's
  format.** Eukara's tg-time entity is the better primitive; reuse it.
- **Auto-TTS on reminder delivery.** Roma's explicit constraint — TTS
  budget is finite and the user can press the Voice button when they
  want a voice message.
- **Per-persona voice settings.** Phase 2 voice-switching architecture
  is parked. The Voice button uses the global default voice for now.

## Risk register

| Risk | Likelihood | Mitigation |
|---|---|---|
| Existing reminders with `source_context` lose their blockquote | Low | Read-time fallback covers all legacy rows. |
| Model populates `original_user_request` with its own interpretation rather than the user's verbatim words | Medium | Parameter description explicitly says "user's words verbatim, not your interpretation". Persona directive reinforces. Observe in production. |
| HTML escape over-escapes content that the model intentionally formatted | Low | The escape only runs on stored metadata + reminder text, both of which are user-generated plain strings. Model-formatted prose is not in this path. |
| Voice button on group-chat reminders allows other members to trigger TTS for any reminder | Low | Voice action ignores who pressed it (callback handler doesn't check `from.id`). Only relevant in a future multi-user group setting; not in Roma's current 1:1 deployment. Flag for Phase 2 hardening. |

## Smoke tests after deploy

1. Ask Eukara for a reminder with a specific 'why'. Confirm D1
   `reminders.metadata` row contains all five fields: `reason`,
   `originalRequest`, `firstName`, `persona`, `createdAt` (plus
   `origin: 'ai_suggested'`).
2. Wait for cron delivery. Confirm the message shows the existing
   header line, the new `<blockquote expandable>` with the reason
   underneath, and the Voice/Delete buttons.
3. Press Voice on the delivered reminder. Confirm voice arrives.
4. Press Delete on the delivered reminder. Confirm message removed
   from chat.
5. Call `list_reminders` and confirm each item has a `context` field
   populated from `metadata.reason`.
6. Call `update_reminder` with `new_context`. Confirm the reason
   updates and `firstName`, `persona`, `originalRequest` are intact.
7. Call `update_reminder` with `cancel: true`. Confirm the row is in
   D1 with `status='cancelled'` (not deleted).
8. Optionally test the back-compat read path: manually craft a row
   with `metadata.source_context` (no `reason`) and verify
   `list_reminders` returns it as `context` and the cron blockquote
   renders correctly.

## Deferred

- Phase 2 voice-switching architecture (Decisions D-A through D-E).
  Parked at Roma's request: "not ready yet; we will need to plan it
  properly".
- `sendPhoto` and `sendDocument` silent-swallow fix. Same shape as
  `sendVoice`'s issue but no production failures have hit them yet.
  Apply when triggered.
- Reverse port: bring no-receipts, asymmetric pacing, no-silver-linings,
  AI-tells ban, dissociative mood category, supersession back from
  Eukara to Xaridotis after Eukara stabilises.
