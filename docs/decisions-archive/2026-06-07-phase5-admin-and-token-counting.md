# 2026-06-07 - Phase 5: Owner-controlled access + per-user token counting

## Context

Roma kept the default-deny gate from Phase 3 and asked for the owner-only
controls that go with it:

1. Owner is the sole admin (env.OWNER_ID = 62047005)
2. Two parallel access paths: slash commands AND natural language
3. Per-user LLM token counting with surfacing
4. Unauthorised users get an explicit message rather than silent ignore

He answered the five open questions in my proposal:
- Token storage: Y (per-call log table)
- /authorised command: Yes
- Confirmation on admin tool fire: Yes
- Memory logging for admin actions: No
- Unauthorised message: explicit, exact text supplied

## Decisions

### 1. Database

New table `usage_log` created on the live D1 via Cloudflare MCP:

```sql
CREATE TABLE usage_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    occurred_at INTEGER NOT NULL DEFAULT (unixepoch()),
    model TEXT NOT NULL,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    request_kind TEXT
);
CREATE INDEX idx_usage_log_user_time ON usage_log(user_id, occurred_at DESC);
CREATE INDEX idx_usage_log_time      ON usage_log(occurred_at DESC);
```

Schema migration file written at
`schema_migration_2026-06-07_usage_log.sql` for record. `schema.sql`
updated. Storage shape: per-call rows. Aggregation via SQL GROUP BY.

### 2. Auth gate behaviour: explicit denial message

`src/index.js` webhook gate, lines around 1980:

- Calls `shouldProcessUpdate(env, update)` as before
- On denial, extracts userId + chatId via the new `extractUpdateSender`
  helper in `src/lib/auth.js`
- Sends Roma's exact text: "The owner of this bot has restricted access.
  You are not authorised to interact with this bot."
- Throttled to once per user per 24h via KV key
  `auth_denied_notified_<userId>` (TTL 86400)
- KV write fail-safe: notification errors logged but never block the
  webhook from returning 200

The throttle prevents spam if a denied user keeps trying. First denial
in a 24h window gets the message; subsequent denials in that window are
silent.

`/grant` clears `auth_denied_notified_<targetId>` when admitting a user,
so the newly admitted user starts fresh and does not see a stale denial
notification before their first authorised interaction.

### 3. Slash commands

Three commands added to `src/bot/handlers.js`:

- `/grant <user_id>` - owner-only, calls grantAuthorisation
- `/revoke <user_id>` - owner-only, calls revokeAuthorisation
- `/authorised` (+ `/authorized` alias) - owner-only, lists current
  authorised users with first_name enrichment from user_profiles when
  available

Owner check is on `msg.from?.id` (the sender) using `isOwner(env, ...)`,
not on chatId. This means the commands work even in group chats where
chatId is not the user's id.

### 4. Admin tools (natural language)

New file `src/tools/admin.js` with three tools registered in
`src/tools/index.js`:

- `grant_user_access(user_id, reason?)` - matches "grant access to <id>"
  etc.
- `revoke_user_access(user_id, reason?)` - matches "revoke <id>" etc.
- `list_authorised_users()` - matches "who has access" etc.

Defense in depth:

- Layer 1: webhook gate blocks non-authorised senders before they ever
  reach the LLM
- Layer 2: each tool's `execute()` checks
  `isOwner(env, context.userId)` and returns
  `{status: 'denied', message: 'This action is owner-only.'}`
  if false
- Layer 3: tool descriptions tell the LLM to require numeric user_ids
  and not invent them, to ask if a name was given instead

### 5. Token logging

New file `src/services/usageLog.js` with three functions:

- `logUsage(env, userId, model, tokens, kind)` - one INSERT per call,
  swallows errors so logging never breaks the user-facing request,
  accepts flexible token shapes (Gemini's usageMetadata, CF's usage,
  Anthropic's usage_block) via key fallback chain
- `getUserUsage(env, userId, days=30)` - per-user rollup grouped by
  model
- `getAllUsersUsage(env, days=30)` - all-users rollup grouped by user_id

### 6. LLM call instrumentation

`src/lib/ai/gemini.js` modified at five points:

- Import of `logUsage`
- `generateWithFallback(env, contents, config, opts)` - new opts param,
  logUsage call after the API response, defaults to env.OWNER_ID if no
  userId supplied
- `_runGeminiTier(env, model, prompt, systemPrompt, opts, label,
  usageCtx)` - new usageCtx param, logUsage call after the response
- `_runCfTier(env, model, prompt, systemPrompt, opts, label, usageCtx)`
  - same pattern, reads result.usage from CF Workers AI shape
- `_runCascadeInternal(env, prompt, systemPrompt, tiers, usageCtx)` -
  threads usageCtx into the tier dispatch
- `runCascade(env, prompt, systemPrompt, tiers, opts)` - new opts
  param, builds usageCtx with defaults
- `generateShortResponse(prompt, systemInstruction, env, opts)` - new
  opts param, threads userId/kind through to runCascade
- `sendChatMessage` and `sendChatMessageStream` - now yield a final
  `{type: 'usage', usage}` chunk so consumers can attribute tokens to
  the actual sender. Gemini puts usageMetadata on the response object
  (non-streaming) or on the final chunk (streaming). Both paths
  surfaced.

`src/bot/handlers.js` updated:

- Import of `logUsage`
- Stream consumer loop handles `chunk.type === 'usage'` by calling
  `logUsage(env, msg.from?.id ?? userId, textModel, chunk.usage,
  'chat_turn')`. Fire-and-forget with `.catch(() => {})` so a logging
  failure never blocks the turn.

Coverage:

- All cascade-driven Gemini and CF calls log on every tier that
  produces a response (including failed tiers, since the tokens were
  still spent)
- Direct `generateWithFallback` calls log on every API call
- Live streaming chat logs on every user turn with correct user
  attribution (msg.from.id)
- Cron and background calls log with env.OWNER_ID as fallback
  attribution

NOT logged this session:

- `cfAiGenerate` (legacy helper at top of cfAi.js, marked "no
  production code path uses it after 2026-05-21")
- Anthropic provider calls (the runCascade walker passes usageCtx to
  Gemini and CF tier runners, but not yet to runAnthropicTier or
  runOpenAITier). Cheap to add if/when those become active paths.

### 7. Usage surfacing

New file `src/tools/usage.js` with:

- `get_usage_stats(user_id?, days?)` - owner-only tool. With user_id:
  per-user breakdown by model. Without user_id: all-users summary
  sorted by total tokens descending. days defaults to 30, clamped to
  [1, 365].

No slash command for usage this session. The owner can ask Xaridotis
in natural language ("show me usage stats", "how many tokens has
8021432130 used last week") and the tool fires. A `/usage` slash
command could be added later if natural language proves clunky.

### 8. Persona awareness

`src/config/personas.js` BASE_TEMPLATE extended with an ACCESS CONTROL
section placed after RULES and before MESSAGE EFFECTS. Lists the four
admin tool names with example phrasings the owner might use ("give
access to <id>", "who has access", "show usage stats"), plus four
hard rules:

- NEVER invent or guess a user_id
- Tools refuse non-owners at execution; if a non-owner asks, decline
  plainly without calling the tool and do not reveal who else has
  access
- After a successful call, briefly confirm what changed
- If a tool returns error or denied, pass that back honestly

This is the persona-side teaching that lets natural language work.
Without it, the LLM may not pick the right tool when the owner
speaks loosely.

## Verification

- All JS files in `src/` pass `node --check`
- All new/edited content I wrote this session is em-dash free
- `usage_log` table + 2 indexes confirmed by SELECT against
  sqlite_master on the live D1
- Webhook gate verified to call sendMessage with the exact restricted
  text and 24h KV throttle

## Risks

1. **LLM hallucinating user_ids.** Primary mitigation: tool
   descriptions are explicit about requiring numeric ids. Secondary
   mitigation: tools validate (`Number.isFinite && > 0`) and return
   error if input is bad. Tertiary: grantAuthorisation upserts a row,
   so a bogus id just creates an orphan row that never receives a
   message (the user_id has to match a real Telegram user for the gate
   to admit them).

2. **Notification spam if a denied user spams the bot.** Mitigated by
   24h KV throttle. Worst case: one message per day per denied user.

3. **Token logging perf.** One D1 INSERT per LLM call. Workers Paid
   plan handles this easily. If hot path latency becomes a concern,
   batching via Queue is trivial to add later.

4. **Streaming chat usage drift.** Gemini emits `usageMetadata` on the
   final chunk only. If the stream is cut off (network, retry,
   StreamIdleError), no usage chunk is yielded and that turn is not
   logged. Acceptable - the request still ran on the model side, but
   tracking it accurately would require a separate counting strategy.

5. **Owner identity check assumes single owner.** The whole design
   assumes env.OWNER_ID is one user. Co-owner pattern would need code
   changes (probably an `is_admin` column on user_profiles). Not on
   the horizon.

## Deploy

Nothing deployed. To deploy:

```bash
cd /Users/romanjeremiah/Library/CloudStorage/OneDrive-Personal/Documents/GitHub/gemini-bot
npx wrangler deploy --minify
```

The deploy will carry:
- Phase 2 (Xaridotis persona backport)
- Phase 3.1 - 3.6 (multi-user auth gate + migration)
- Phase 4 (positive-framing persona)
- AI signature removal + /grant /revoke removal (from earlier this
  session, then re-added)
- Phase 5A (admin commands + admin tools + restricted message)
- Phase 5B (usage_log + instrumentation + usage tool + persona
  awareness)

This is a large change surface. Recommended deploy practice:

1. Run `wrangler tail` in a separate terminal before deploying
2. Watch for `auth_denied`, `auth_denied_notify_failed`, and
   `usage_log_failed` events in the first 10 minutes
3. Send yourself a test message to verify the gate lets you through
4. Try the admin commands (`/authorised`) to verify the new commands
   register
5. Speak naturally to Xaridotis ("show the authorised list") to verify
   the natural-language path works

## Rollback

Code rollback via WebStorm git revert. The D1 schema change is
non-destructive (new table only; no ALTER on existing tables). If the
code is rolled back but `usage_log` stays, it is dormant until code
references it again.

## Phase 5C (deferred)

- `/usage` and `/usage_all` slash commands (currently natural-language
  only via the tool)
- Anthropic and OpenAI provider tier usage logging (cheap, ~10 lines
  in each provider file)
- Aggregate counters on user_profiles for instant queries (denormalised
  cache of `usage_log`)
