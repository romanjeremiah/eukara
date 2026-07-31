# 2026-06-08 - Option D (role-based per-user commands) + reaction gap fixes

## Context

Roma deployed everything up to and including Phase 5B + command menu
setup + welcome message cleanup. He then chose:

- Option D for command menu scoping (role-based per-user via
  `botCommandScopeChat`)
- Non-owner users get no commands for now (empty list)
- Persona must explicitly teach "invisible empathy" via reactions
- Outgoing reactions must show up in usage_log

This document captures the design choices behind that work.

## Telegram command scope resolution (verified from official docs)

Per https://core.telegram.org/bots/api the algorithm for private chats
resolves command lists from most specific to most general:

1. botCommandScopeChat + language_code
2. botCommandScopeChat
3. botCommandScopeAllPrivateChats + language_code
4. botCommandScopeAllPrivateChats
5. botCommandScopeDefault + language_code
6. botCommandScopeDefault

The first list that has been set wins. setMyCommands with commands=[]
is equivalent to deleteMyCommands for that scope.

## Decisions

### 1. Role column on user_profiles

```sql
ALTER TABLE user_profiles ADD COLUMN role TEXT;
```

Nullable, no default. NULL is treated as 'user' (empty command list) in
application code. The field controls Telegram command picker selection
only; it does NOT confer authorisation or admin rights. Owner identity
remains sourced from env.OWNER_ID. This deliberate decoupling avoids
the footgun where someone with role='owner' might think they have admin
power when they don't.

Applied to live D1 via Cloudflare MCP. Migration file:
schema_migration_2026-06-08_user_role.sql. schema.sql updated.

### 2. COMMAND_TEMPLATES in src/lib/telegram.js

```javascript
export const COMMAND_TEMPLATES = {
    owner: [ ... 16 commands ... ],
    user: [],
};
```

Two roles, forward-extensible. Unknown roles fall back to 'user' via
the `commandsForRole(role)` helper. Adding new roles later (e.g.
'advanced', 'support') is a single line plus running /sync-commands.

### 3. registerCommands now manages three scopes

After this change, GET /register-commands does:

1. setMyCommands commands=[] scope={type:'default'} — clears the
   global fallback so nothing leaks to randoms
2. setMyCommands commands=[] scope={type:'all_private_chats'} — same
   for the private-chat fallback. Belt-and-braces with #1
3. setMyCommands commands=[owner list] scope={type:'chat',
   chat_id:OWNER_ID} — applies the owner's full list

The owner sees their full picker; everyone else who hasn't been
explicitly granted a per-user list sees nothing.

### 4. setUserCommands / clearUserCommands helpers

Two new exports in src/lib/telegram.js:

- `setUserCommands(env, userId, role)` — applies the role's template
  for that user via botCommandScopeChat. If the template is empty,
  this is equivalent to deleteMyCommands for that scope.
- `clearUserCommands(env, userId)` — explicit deleteMyCommands for
  per-user scope, used at /revoke time.

Both return `{ok, error?}` and are best-effort. Failure does NOT throw
or fail the upstream operation. D1 is the source of truth; the command
list is a UX nicety.

### 5. Auth layer integration

`src/lib/auth.js`:

- `grantAuthorisation(env, userId, grantedBy, role='user')` — new 4th
  parameter. Persists role in the UPSERT. After successful D1 write,
  calls `setUserCommands(env, userId, safeRole)` best-effort and
  returns `commandSync` in the result.
- `revokeAuthorisation(env, userId, revokedBy)` — after successful D1
  write, calls `clearUserCommands(env, userId)` best-effort.
- `listAuthorisedUsersWithRoles(env)` — new helper for the
  /sync-commands endpoint. Returns `Array<{userId, role}>` with the
  owner first, role 'owner' forced.

Both grant and revoke log a warn if the Telegram command sync fails,
so the owner can re-run /sync-commands.

### 6. /grant slash command accepts optional role

`/grant <user_id> [role]` — third token is the role. Defaults to
'user'. Reply now includes which role was applied and whether the
command sync succeeded.

### 7. grant_user_access tool accepts optional role param

Tool schema includes a new `role` STRING parameter, defaulting to
'user'. Tool description includes the Option D context plus a hard
rule: NEVER pass role='owner' for anyone other than the bot owner.

### 8. /sync-commands HTTP endpoint

GET /sync-commands on the worker iterates all currently authorised
users via `listAuthorisedUsersWithRoles` and applies each user's
role's commands via `setUserCommands`. Skips the owner (covered by
registerCommands). Returns a JSON summary with per-user results.

Used to backfill after a deploy that changes COMMAND_TEMPLATES, or
after a grant where the Telegram API was temporarily unreachable.

### 9. Persona awareness for the role parameter

`src/config/personas.js` ACCESS CONTROL section gains a new bullet
explaining the role parameter: defaults to 'user', do not pass a
non-default unless the owner explicitly names one, and NEVER pass
role='owner' for anyone other than the bot owner.

### 10. Gap 1 - Invisible empathy via reactions

`MENTAL_HEALTH_DIRECTIVE` section 8 (READ THE ROOM) gains a new bullet
teaching the silent acknowledgement pattern: when the user is
mid-flow venting or has just disclosed something painful, sometimes
the right response is no text reply at all - just a react_to_message
call with an acknowledging emoji. Text during their flow feels like
an interruption.

No specific emojis are hardcoded per the standing rule
("Emojis: chosen dynamically by context always"). The instruction
describes the shape and the appropriate trigger, not the emoji.

This sits inside MHD because the trigger is emotional context
(venting / disclosure), not general behaviour. MHD is injected only
in warm-tone turns.

### 11. Gap 2 - Outgoing reactions in usage_log

`src/tools/reaction.js` execute() now calls `logUsage` after a
successful sendReaction:

```javascript
logUsage(env, context.userId, 'telegram',
  { input: 0, output: 0, total: 0 }, 'reaction:outgoing')
  .catch(() => {});
```

Zero tokens (no LLM cost on the Telegram-side send) but a distinct
request_kind 'reaction:outgoing' so reactions are countable as
events without polluting token totals.

Reaction INTERPRETATION (handleReactionFeedback ->
interpretReaction in cfAi.js) already runs through `runCascade` in
gemini.js, which is instrumented from Phase 5B. So incoming reaction
processing is already logged; only the outgoing send needed wiring.

## What was NOT changed

- `cfAi.cfAiGenerate` legacy helper still uncounted (no production
  path). Same status as before.
- Anthropic / OpenAI provider tier usage logging still uncounted in
  cascade. Same status as before.
- The role 'owner' template is identical to the previous owner list.
  No new commands added. Adding /usage as a slash command remains
  deferred (5C).

## Verification

- `node --check` passes on all touched JS files
- No em-dashes in new content written this session
- D1 query confirms `role` column accepts NULL on existing rows
- Current authorised users: owner (62047005, role=null=>'owner'),
  8863403828 (role=null=>'user'). After deploy + /sync-commands,
  8863403828 will have an empty per-user scope set explicitly

## Deploy steps for Roma

```bash
cd /Users/romanjeremiah/Library/CloudStorage/OneDrive-Personal/Documents/GitHub/gemini-bot
npx wrangler deploy --minify
```

After deploy, hit (in any order, both required):

```
GET https://<worker-url>/register-commands
GET https://<worker-url>/sync-commands
```

Expected responses:

- `/register-commands` returns
  `{ok:true, owner_id, default_cleared, all_private_chats_cleared,
   owner_set, owner_command_count: 16}`
- `/sync-commands` returns
  `{ok:true, synced: 1, results:[{user_id: 8863403828, role:'user',
   ok:true, commands:0}]}`

Verify visually:
- Roma's Telegram picker: 16 commands including /grant, /revoke,
  /authorised, /research, /architect
- User 8863403828's Telegram picker: empty (no commands suggested
  on /)

## Rollback

Code rollback via WebStorm git revert. The D1 schema change is
additive and non-destructive. Existing code that doesn't reference
the `role` column continues to work unchanged.

## Risks

1. **Backtick in template literals.** Caught one syntax error during
   this work: used backticks for inline-code formatting inside a
   `template literal`, which broke parsing. Now using single quotes.
   Worth remembering for future persona edits.

2. **The 'owner' role being passable.** Hard-flagged in both the
   tool description and persona ACCESS CONTROL bullet. Cannot be
   prevented at the SQL level without a CHECK constraint, which
   would require recreating the table. Acceptable trade-off.

3. **Telegram client cache.** Command lists may take seconds to
   update on Roma's client. Force-quit + reopen the Telegram app
   clears it if needed.

4. **The role attribute does not propagate to chat handlers.** A
   non-owner user with any role still hits the standard auth gate
   and chat pipeline. The role is purely cosmetic (command picker).
   If future roles need to gate features, that's a separate design.

