# Phase 3: Multi-user authorisation gate

Date: 2026-06-07
Status: Applied to source. Schema migration already applied to production D1. NOT YET DEPLOYED to Workers.
Related: 2026-06-06-xaridotis-persona-backport.md, 2026-06-06-phase4-persona-positive-framing.md.

## Context

Investigation during the Phase 2 work surfaced that `user_profiles` already had 9 rows: Roma plus 8 incidental contacts. The bot had no authorisation gate; any Telegram user who messaged the bot got a `user_profiles` row created and likely a reply. Two of those 8 users had data downstream:

- user_id 8687626790: 1 memory + 1 mood entry. The memory text is about Roma ("Roman tends to use short, repetitive greetings…") — a misattribution bug rather than a real second user.
- user_id 8021432130 (Nathaneal): 1 memory ("Nathaneal is in London and has a clean, well-lit desk setup") — a brief actual interaction.

The other 6 are `user_profiles` rows with no downstream data. At least one ("彩虹代发 看我主页") is a Telegram spam account based on the name pattern.

Roma confirmed multi-user is real and asked for the authorisation work to land. The aim of Phase 3 is to close the auth gap without breaking Roma's single-user flow.

## Phase 3.1-3.4 (Phase 3 sub-pass 1, 2026-06-06 — already on disk)

- Schema migration `schema_migration_2026-06-06_multi_user_auth.sql` adds three columns to `user_profiles`: `authorised`, `authorised_at`, `authorised_by`. Backfills Roma as `authorised = 1`. Adds partial index `idx_user_profiles_authorised`. Migration applied to production D1 (verified 2026-06-07: Roma is authorised, all 8 other users default to 0, index exists).
- `schema.sql` updated to match new shape.
- `src/lib/auth.js` written (219 lines). Exports `isOwner`, `isAuthorised`, `listAuthorisedUsers`, `grantAuthorisation`, `revokeAuthorisation`, `shouldProcessUpdate`. Bootstrap rule: `env.OWNER_ID` always passes regardless of D1 state, so Roma cannot lock himself out even if D1 is unreachable.
- Audit pass on D1 and Vectorize: clean. Every Vectorize call filters by `userId`, every D1 SELECT against user-keyed tables includes `WHERE user_id = ?`. The one "unfiltered" query (`vectorMaintenance.js:205` counting all memories) is the maintenance counter and is intentional.

## Phase 3.6 (Phase 3 sub-pass 2, 2026-06-07 — this session)

Two source-file changes wire the authorisation gate into the live request paths.

### Change A — webhook entry gate (`src/index.js`)

Added `import { shouldProcessUpdate } from './lib/auth';` to the imports. Inserted the gate immediately after `update = await request.json()` and before the dispatch logic:

```js
if (!(await shouldProcessUpdate(env, update))) {
    return new Response('ok', { status: 200 });
}
```

Behavioural contract:

- Owner (`env.OWNER_ID = 62047005`): always passes via the `isOwner` bootstrap in `auth.js`. No D1 lookup for the owner path.
- Authorised non-owner: passes via D1 lookup (`SELECT authorised FROM user_profiles WHERE user_id = ?`).
- Unauthorised user: drops update with 200 OK so Telegram does not retry. Emits `auth_denied` log line with the user_id for visibility.
- D1 unreachable: fails closed (deny). Owner still passes via bootstrap.

Why 200 OK on denied rather than 401/403: Telegram Bot API retries non-2xx responses, which would generate noise in production logs for every spam message. 200 OK silently discards the update from Telegram's perspective. The `auth_denied` log line in our own logs is the audit trail.

### Change B — admin commands (`src/bot/handlers.js`)

Added `import { grantAuthorisation, revokeAuthorisation, isOwner } from '../lib/auth';`. Added two cases to the `switch (command)` block in `handleCommand`:

- `/grant <user_id>` — owner-only. Sets `authorised = 1` on the target row, or inserts a new row with `authorised = 1` if the user has never messaged the bot. Idempotent. Returns confirmation to chat.
- `/revoke <user_id>` — owner-only. Sets `authorised = 0`. Cannot revoke the owner themselves (blocked inside `revokeAuthorisation` to prevent accidental lockout). Returns confirmation to chat.

Owner check uses `msg.from?.id`, not `chatId`, so that admin commands work correctly even in group chats where chatId != user_id.

Not registered in the public command menu via `registerCommands` — they are owner-only admin tools. Roma just types them. Future enhancement: use Telegram's per-user command scopes (`scope: { type: 'chat', chat_id: OWNER_ID }`) to surface them only in the owner's menu.

## What Phase 3.6 explicitly chose NOT to do

- **Cron iteration refactor (Phase 3.7).** The 8+ cron handlers (`handleMorningCheckin`, `handleMiddayCheckin`, `handleEveningCheckin`, `handleArchitectureEvolution`, `handleWeeklyReport`, `handleMidWeekNudge`, `handleNarrativeLedger`, `handleSpontaneousOutreach`) still hardcode `env.OWNER_ID`. After Phase 3.6 the bot accepts admitted users for live conversation but only Roma gets scheduled check-ins. This is the right behaviour for single-active-user; refactoring cron to iterate `listAuthorisedUsers(env)` waits until a concrete second admitted user actually wants check-ins.
- **/start onboarding flow rewrite.** Current /start works fine for the owner. New admitted users will hit the same /start. A dedicated onboarding (timezone picker, persona preset picker) for new users can land when needed; it is not blocking.
- **Public command menu entries for /grant and /revoke.** Owner-only; would clutter every user's picker.
- **Cleanup of the 7 orphan `user_profiles` rows** with no downstream data. Harmless once the gate is enforced. Cleanup SQL is on the journal entry for whenever Roma wants to run it.
- **Reassignment of the misattributed memory** (user 8687626790's memory about Roma). Single-row update Roma can run when convenient; not blocking deployment.

## Verification

- `node --check src/index.js` clean.
- `node --check src/bot/handlers.js` clean.
- `node --check src/lib/auth.js` clean.
- `node --check src/config/personas.js` clean.
- `node --check src/lib/formatter.js` clean.
- Production D1 verified: 3 new columns + 1 partial index present, Roma authorised, 8 others denied by default.
- No Telegram-side change required; webhook URL and secret unchanged.

## Deploy

```
cd /Users/romanjeremiah/Library/CloudStorage/OneDrive-Personal/Documents/GitHub/gemini-bot
npx wrangler deploy --minify
```

Post-deploy smoke test:

1. Send yourself a message in DM — should respond normally.
2. Tail Worker logs: `npx wrangler tail` — look for `auth_denied` lines from incidental traffic (Telegram contacts who message the bot).
3. Verify `/grant` and `/revoke` work by trying `/grant 99999999` and `/revoke 99999999` against a throwaway user_id; check D1 with `SELECT * FROM user_profiles WHERE user_id = 99999999`.

Rollback: `git checkout src/index.js src/bot/handlers.js && npx wrangler deploy --minify`. The migration columns can stay; they are passive without the integration code.

## Wrangler CLI note for future migrations

The D1 database is named `reminders_db` in `wrangler.jsonc` (legacy from when Xaridotis was just a reminders bot). The binding is `DB`, and `gemini-bot` is the Worker name, not the database name. So:

- ❌ `npx wrangler d1 execute gemini-bot --remote --file=…` (errors with "Couldn't find DB with name 'gemini-bot'")
- ✅ `npx wrangler d1 execute reminders_db --remote --file=…`

Future schema migrations should use `reminders_db` as the database identifier.

## Open follow-ups parked from this work

- **Phase 3.7 cron iteration** when a concrete second user is admitted.
- **Onboarding flow for new admitted users** (timezone picker, persona preset picker).
- **Per-user command scopes** to expose `/grant` and `/revoke` only in Roma's menu.
- **Cleanup SQL** for the 7 orphan rows: `DELETE FROM user_profiles WHERE user_id != 62047005 AND authorised = 0 AND user_id NOT IN (SELECT DISTINCT user_id FROM memories UNION SELECT DISTINCT user_id FROM mood_journal)` (deletes only rows with no downstream data).
- **Memory reassignment** for user 8687626790's misattributed-Roma memory: `UPDATE memories SET user_id = 62047005 WHERE user_id = 8687626790 AND fact LIKE 'Roman tends to%'` (verify the row first).
