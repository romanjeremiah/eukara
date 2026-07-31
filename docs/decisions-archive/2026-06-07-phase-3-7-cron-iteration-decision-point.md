# 2026-06-07  -  Phase 3.7 Cron Iteration: Decision Point

## Status

**Paused for Roma's decision.** Pending the answer to "should cron tasks
iterate authorised users, or stay owner-only?"

## What Phase 3.7 was supposed to be

Refactor every cron handler in `src/index.js` so it iterates over all
authorised users (via `listAuthorisedUsers(env)`) instead of hard-coding
`env.OWNER_ID`. The point was to future-proof the cron system so any
user with `authorised = 1` would receive the same scheduled experiences
Roma gets:

- Morning / midday / evening mood check-ins
- Medication nudges
- Weekly mental-health report
- Accountability nudge (Wed 16:00)
- Curiosity digest (Sat 10:00)
- Autonomous research (Tue/Fri 04:00)
- Self-improvement (15th of month)
- Spontaneous outreach (~5% chance per cron tick during waking hours)
- Memory consolidation, style card consolidation, narrative ledger,
  therapeutic REM, daily study, daily memory consolidation.

## The cost

`grep -c "env\.OWNER_ID" src/index.js` returns **47** hits across:

- 28 references inside the 14 cron handler functions (lines 170–1149)
- 4 references in queue handlers (lines 1558, 1571, 1581, 1593)
- 1 reference in `enqueueHealthTasks` (line 1362)
- 3 references in the `scheduled()` entry point itself (lines 2405,
  2451, 2462)
- 11 references in non-cron places (error reporting, owner-only business
  chats, etc.)  -  these MUST stay as `env.OWNER_ID`

So the refactor touches ~36 lines plus a structural change to the
`scheduled()` dispatcher (wrap the two `Promise.allSettled` blocks in
a `for (const userId of listAuthorisedUsers(env))` loop).

Each handler also has its own pattern: some start with
`const chatId = Number(env.OWNER_ID)`, others start with
`const londonTime = await getLocalTime(env.OWNER_ID, ...)` before
setting chatId. Three distinct rewrite patterns.

## The benefit

**Today: zero.** Only Roma is `authorised = 1`. The iterator returns
`[62047005]` and every handler runs exactly once per tick, exactly as
it does today.

**Future: contingent.** The benefit accrues only if Roma admits a
second user via direct D1 SQL. He said in this session he plans to
manage access via Telegram-level restrictions, not via the in-bot
authorisation table. If no second user is ever admitted, the refactor
is pure overhead.

## The risk

- 36+ surgical edits in a busy file (`src/index.js`, 2564 lines)
- Three distinct rewrite patterns means three places to get it subtly
  wrong
- Each handler has its own KV throttle keys (e.g.
  `health_checkin_morning_${today}`); the per-user version needs
  `${today}_${userId}` to avoid one user's "done" flag blocking
  another's check-in
- Same for in-flight workflows, `last_seen_${chatId}`, and other state
  keys  -  every cross-user mixing point needs auditing
- Spontaneous outreach uses `Math.random()` once per tick; per-user
  needs the roll inside the loop (or shared roll, depending on intent)

## Three options

### Option A  -  Implement now (full refactor)

Do the 36+ edits, wrap the dispatcher, audit every KV key for
per-user uniqueness. Estimated 1–2 hours of careful work plus a
careful first deploy.

**When it's right:** Roma plans to admit other users in the near future
and wants the plumbing ready.

### Option B  -  Defer indefinitely (no code change)

Leave the cron system owner-only. The webhook gate (Phase 3.6) already
blocks non-authorised users from interactive features. Crons stay as
they are.

**When it's right:** Roma will never admit a second user via the
in-bot mechanism. The bot is multi-user-capable at the message-handling
level but single-tenant at the cron level.

**Implication:** If Roma ever admits a user later, that user gets
interactive features but no scheduled check-ins. Reasonable behaviour
for a "guest" tier.

### Option C  -  Minimal-surface compromise

Refactor ONLY the conversational/interactive crons (morning check-in,
medication nudge, evening check-in, spontaneous outreach). Leave the
introspective ones (memory consolidation, narrative ledger,
self-improvement, autonomous research, architecture evolution,
therapeutic REM) as owner-only.

Reasoning: the introspective crons all read and write Roma's specific
data  -  they're not portable to other users without first running on
their data. The conversational ones are the only ones that "talk to"
the user.

This is ~8 of the 14 handlers, plus the dispatcher tweak. Half the cost
of Option A, most of the user-facing benefit.

## Recommendation

**Option B (defer)** unless Roma has a concrete plan to admit at least
one other user in the next few weeks.

Reasoning:
- Roma's stated workflow is Telegram-level restriction, not in-bot
  admission, which implies no second user is imminent.
- The webhook gate already protects against accidental admission of a
  random user.
- The refactor's complexity is real (per-user KV keys, per-user
  workflow IDs, per-user random rolls) and worth doing only when
  there's a confirmed need.
- If/when a second user IS admitted, Option C can be done quickly to
  give them the interactive crons.

## What's needed from Roma

A one-line answer:
- "A  -  do the full refactor now"
- "B  -  defer, leave crons owner-only"
- "C  -  minimal refactor, conversational crons only"

Or any combination/modification.
