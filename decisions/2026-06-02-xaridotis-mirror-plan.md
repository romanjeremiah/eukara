# Eukara <- Xaridotis Mirror Plan
================================

**Date**: 2026-06-02
**Status**: Plan only. Nothing implemented. Awaiting Roma sign-off per section.
**Scope**: Bring Xaridotis feature parity into Eukara while keeping Eukara's existing model registry and aiming for a cleaner architecture than Xaridotis itself.

---

## 1. Scope and non-goals

### In scope (Roma's brief, 2026-06-02)
1. Mirror Xaridotis mood checks completely (synthesis + micro-acks + activities + sleep + photo + source tracking + Vectorize indexing).
2. Compare personas.ts (Eukara) vs personas.js (Xaridotis). Done in section 2.
3. Database review and persistent searchable chat history. Done in section 3.
4. Random / spontaneous outreach (upgrade the existing stub to the Xaridotis pattern).
5. Confirm Gemma is the casual-route default.
6. Accountability nudge (recurring patterns flagged without judgement).
7. Curiosity digest (proactive topic deep-dives).
8. Self-improvement scan / persona evolution (daily background job updating evolved_traits + communication_notes).
9. Reminder architecture: dedicated reminderStore service with dedup, metadata JSON, updateReminder cancel/partial/metadata-merge, user-scoped reads.
10. mediaStore service (R2 CRUD for images / voice / video / docs).
11. userStore service (profile CRUD, communication preferences, style_card).
12. planner service (CoALA generatePlan, casual-lane cascade, best-effort, never blocks reply).
13. Inline query handler (@bot <query> in any chat).
14. Persona switching (/persona, multiple built-ins, voice mapping).
15. Dedicated moodStore service (full CRUD + upsert + history + todayLocal()).

### Non-goals (explicit)
- No changes to model registry (src/config/models.ts). Pro = gemini-3.5-flash, flashLite = gemini-3.5-flash, casual default = @cf/google/gemma-4-26b-a4b-it, Pro-lane fallback = @cf/moonshotai/kimi-k2.6. These stay.
- Do NOT mirror Xaridotis cascade tiers that use OpenAI gpt-5.4 or Anthropic Haiku 4.5. Mapping table in section 5.3.
- training_pairs LoRA dataset table - NOT built yet.
- Gemini Files API (>100KB or PDF/video) - NOT built yet.
- Bi-temporal updates on memories + knowledge_graph - NOT in this scope.
- file_search via Gemini File Search store - NOT in scope.
- Voice transcription pipeline upgrade - NOT in scope.

### What is already in Eukara (do not rebuild)
- Queue tasks health_checkin, mood_poll, med_nudge, spontaneous_outreach, weekly_report (cases exist in src/router/queue.ts).
- Tool files (LLM-facing wrappers operating directly on D1 with no service layer). The plan promotes a service layer underneath without removing the tools.
- services/persona.ts, mood.ts, memory.ts, episode.ts, knowledge-graph.ts, vector.ts, weather.ts.
- Workflows: consolidation, research, architect (Eukara has architect; Xaridotis does not).
- Weekly Sunday 19:00 report (Eukara-only feature).
- /timezone command + DB-first tz with KV mirror.

---

## 2. personas.ts (Eukara) vs personas.js (Xaridotis) - Comparison

### Exports

| Export | Eukara (TS) | Xaridotis (JS) | Notes |
|---|---|---|---|
| BASE_INSTRUCTION | YES | YES (via personas.xaridotis.instruction) | Same template, only {NAME} differs. |
| MENTAL_HEALTH_DIRECTIVE | YES | YES | Identical content per design. |
| FORMATTING_RULES | YES | YES | Identical content per design. |
| SECOND_BRAIN_DIRECTIVE | YES | YES | Differs (see below). |
| CASUAL_REGISTER_DIRECTIVE | NO | YES (line 406) | GAP. Xaridotis injects this when Curator classifies the turn as casual. |
| personas (object) | NO | YES (legacy alias map) | Eukara has single persona; Xaridotis has 5 keys but all resolve to the same instruction text. Differentiation is at the persona_config row. |

### Content drift in SECOND_BRAIN_DIRECTIVE

Eukara contains: PROJECT REALITY (TS/Cloudflare), MOOD TRACKING UX, TOPIC BOUNDARIES, QUIET HOURS, Note-Taking, Enhanced Reminders, Idea Development, Natural Phrasing, Proactive Accountability, Relationship Depth, Collaborative Engineering, Continuous Learning.

Xaridotis additionally contains:
- TOOL SELECTION HARD CONSTRAINTS: explicit "use the dedicated tool, never manage_cloudflare" rules for reminders, mood, memory, episodes, therapeutic notes. Plus emotional-turn ban on auto-calling save_memory or save_therapeutic_note.
- TOPICS (ROUTING): 4-topic guidance (Second Brain, Mood Journal, Weekly Reports, General). Eukara does NOT have topic routing.

### Recommendation

- ADD CASUAL_REGISTER_DIRECTIVE to src/config/personas.ts and inject only when Curator classifies casual. Suppresses therapy-speak on light chat. Identical content to Xaridotis.
- ADD TOOL SELECTION HARD CONSTRAINTS to Eukara's SECOND_BRAIN_DIRECTIVE, adapted to Eukara's tool names. Bigger win: Eukara tools were observed reaching for manage_cloudflare when dedicated tools exist. Sub-block also bans auto-calling save_memory / save_therapeutic_note mid emotional turn.
- Do NOT add TOPICS routing (Eukara is single-thread). Skip.
- Persona name ({NAME}) substitution stays. Multi-persona switching adds variation at the persona_config row level, NOT by branching instruction text.

---

## 3. Database review

### 3.1 Schema delta (Xaridotis has, Eukara lacks)

| Table | Eukara | Xaridotis | Action |
|---|---|---|---|
| user_profiles | basic | + style_card TEXT, + ai_signature TEXT | ADD COLUMN x2 |
| persona_config | PK = user_id (single persona/user) | composite PK (user_id, persona_key) + 8 extra columns | RECREATE via SELECT-INSERT (safe, <=2 rows of minimal data) |
| memories | basic | + ai_signature, + bi-temporal valid_from/valid_until/superseded_by_id | ADD ai_signature only (bi-temporal is non-goal) |
| reminders | basic | + metadata TEXT DEFAULT '{}', + ai_signature TEXT | ADD COLUMN x2 |
| chat_summaries | EXISTS but UNUSED | actively written by nightly cron | Add ai_signature; populate via section 6.5 |
| episodes | basic | + ai_signature TEXT | ADD COLUMN x1 |
| knowledge_graph | basic | + ai_signature, + bi-temporal cols | ADD ai_signature only |
| mood_journal | columns activities/ai_observation/photo_r2_key/clinical_tags exist but NEVER written | + source TEXT, + ai_signature TEXT | ADD COLUMN x2 |
| NEW: training_pairs | NO | YES | SKIP (non-goal) |
| NEW: curator_log | NO | YES | SKIP unless Roma wants forensics from day 1 |
| NEW: media_refs | NO | YES (D1 pointers to R2 with extracted_text, files_api_uri, vector_id, chunk_count, file_search_doc_name) | ADD - needed for mediaStore + photo upload |

### 3.2 updated_at triggers

Xaridotis has AFTER UPDATE triggers on user_profiles, persona_config, reminders, mood_journal that auto-bump updated_at (SQLite does NOT do this on its own - DEFAULT CURRENT_TIMESTAMP only applies on INSERT). Eukara should add the same triggers. Idempotent via WHEN OLD.updated_at IS NEW.updated_at guard.

### 3.3 Full searchable chat history - design

Roma's question: "Can we have a full chat history to query for better context if some questions or summaries are incomplete?"

Current Eukara state: src/lib/history.ts stores chat history in KV under chat_${chatId}_${threadId} with 7-day TTL and 24-turn cap. The chat_summaries D1 table exists but is never written. Older history is unrecoverable.

Proposed three-layer model (Xaridotis pattern + one improvement):

1. LIVE WINDOW (KV): the active conversation, last 24 turns, 7-day TTL, hot path reads. Keep as-is.
2. NARRATIVE LEDGER (D1 chat_summaries + Vectorize): when a thread idle for >=3 days, compress the entire KV blob into a 5-10 bullet structured summary, write to D1 with date_range, then index the summary into Vectorize as conv_${userId}_summary_${id} so it surfaces in multi-signal recall. Clear the KV entry. Active conversations are NEVER compressed mid-flight. Nightly cron at 03:00 London.
3. EUKARA IMPROVEMENT (vs Xaridotis): also keep a RAW TRANSCRIPT SHADOW in R2 (chat_raw/${userId}/${ISO_date}.jsonl) before the KV blob is deleted. Cheap, zero egress, gives Roma a forensic recovery path that Xaridotis lacks. Lifecycle rule: expire raw shadows after 365 days. Optional - Roma to confirm or skip.

Recall pipeline order for any user question:
1. KV live window (chronological context for current turn)
2. D1 memories matched by category / importance
3. D1 episodes matched by emotion overlap or recency
4. Vectorize semantic recall (returns mix of mood entries, episodes, knowledge_graph triples, and chat_summary bullets - all sharing the same embedding space)

This is what services/vector.ts is already structured for. Only addition: chat_summaries participate in that pipeline.

---

## 4. Service mirror inventory

Each service maps a Xaridotis JS file to a planned Eukara TS module. Architectural improvement vs Xaridotis: every service exports a typed interface (no any leaks), every D1 row parsed through a typed shape in src/types/db.ts, all error paths return a discriminated union ({ok: true, ...} / {ok: false, reason}) instead of throwing.

### 4.1 services/mood.ts (EXTEND, keep file path)

Already exists with todayLocal, getEntry, hasCheckedInToday, upsertEntry, getHistory, formatHistoryForContext, countRecentCheckins, deleteAll.

ADD (Xaridotis-parity):
- MOOD_LABELS map + getMoodLabel(score)
- MOOD_SOURCES enum + sourcePrecedence() (cron_poll > manual_command > inline_chat)
- hasRealEveningCheckin(env, userId, date?)
- hasSleepLoggedToday(env, userId, date?)
- hasPhotoLoggedToday(env, userId, date?)
- getTodayActivities(env, userId, date?) - union across all of today's rows
- mergeActivities(env, userId, date, entryType, additions, removals, source) - transactional add+remove returning {final, added, removed}
- getDayEntries(env, userId, date)
- getWeeklySummary(env, userId)
- upsertEntry extended to honour source precedence and fire vector.indexMood fire-and-forget on every write

Eukara cleanliness improvement: keep todayLocal(tz) as canonical name, drop deprecated todayLondon() alias. All Eukara callers already use todayLocal.

### 4.2 services/reminders.ts (NEW)

Current tools/reminder-tools.ts is 40 lines: single INSERT, no dedup, no metadata, no update. Replace with a proper service that the tool delegates to.

Public API:
- saveReminder({userId, chatId, threadId, text, dueAt, messageId, recurrence, context}) -> {duplicate: true, existing_id, existing_due_at} | {duplicate: false, id}
- findDuplicateReminder (private) - normalised text-prefix match + 5-min window. Recurring matches on time-of-day modulo 86400; one-off on absolute due_at.
- getDueReminders(env) - parses metadata JSON, returns rows with parsedMeta
- clearReminder(env, id) - soft-delete (status='delivered')
- updateRecurrence(env, id, nextTime) - for daily/weekly/monthly advance
- getUserReminders(env, userId) - pending only
- getReminderForUser(env, userId, id) - user-scoped read
- updateReminder({userId, id, newText?, newDueAt?, newRecurrence?, newContext?, cancel?}) -> {ok: true, action: 'updated'|'cancelled'|'noop', reminder} | {ok: false, reason: 'not_found'}

Eukara improvements vs Xaridotis:
- Strict TypeScript types (ReminderRow, ReminderContext, UpdateResult)
- normaliseForDedup factored out as pure helper, unit-testable
- Replace Xaridotis's narrow emoji-strip regex with \p{Extended_Pictographic} (Unicode property) - catches newer emoji blocks for accurate dedup

### 4.3 services/users.ts (NEW)

Takes identity bits out of current persona.ts; the persona-overlay half moves to services/personas.ts (4.4).

Public API:
- upsertUser(env, msg) - called on every webhook. INSERT ON CONFLICT updating first_name/username/language_code/updated_at. Awaits ensurePersonas(env, userId).
- buildUserIdentity(msg) - "FirstName LastName (@username) [uid:N]"
- getProfile(env, userId)
- getUserTimezone(env, userId) / setUserTimezone(env, userId, tz)
- getStyleCard(env, userId) / saveStyleCard(env, userId, card, aiSignature?)
- updateProfileFromObservation(env, userId, {hobbies?, traits?, preference?})

### 4.4 services/personas.ts (NEW, multi-persona)

Replaces persona-overlay half of persona.ts. Old persona.ts is split - build pipeline (buildSystemInstruction) stays in a thin wrapper, multi-persona CRUD goes here.

Built-in personas (Xaridotis-parity, names retained for cross-bot familiarity):

| Key | Display | Tone | Formality | Humour | Voice (TTS) |
|---|---|---|---|---|---|
| eukara | Eukara | warm | casual | moderate | (Eukara default) |
| nightfall | Nightfall | clinical | formal | low | Laomedeia / en-US |
| mooncake | Mooncake | witty | casual | high | Puck / en-GB |
| hue | HUE | deadpan | formal | dry | Sadaltager / en-US |
| tribore | Tribore | warm | casual | moderate | Erinome / en-US |

All personas share the same BASE + MHD + FORMATTING + SECOND_BRAIN text. Differentiation lives entirely in the persona_config row.

Public API: BUILT_IN_PERSONAS constant; ensurePersonas (batch seed, no-op if any row exists); getPersona; getAllPersonas; createPersona (custom, key normalised); updatePersona (allowlist of 12 fields, voice validated); deletePersona (refuses built-ins); resolvePersonaVoice -> {voice, locale}; buildPersonaTraits formatter.

Active selection: KV key persona_${chatId}_${threadId} (per-chat per-thread, Xaridotis pattern).

Voice catalogue lives in new src/config/voices.ts listing Chirp3-HD voices (existing lib/tts.ts already targets Chirp3-HD).

### 4.5 services/media.ts (NEW)

Public API matches Xaridotis mediaStore.js exactly:
- storeMedia(env, chatId, type, data, mimeType, metadata?) - accepts ArrayBuffer / Uint8Array / base64; keys as chatId/type/timestamp_hash.ext; returns R2 key
- getMedia(env, key) -> {body, arrayBuffer(), httpMetadata, customMetadata} or null
- listMedia(env, chatId, type?, limit?)
- deleteMedia(env, key) / deleteAllMedia(env, chatId) (bulk, capped at 1000)
- mimeExtension(mime) map

Plus (Eukara improvement): sibling services/mediaRefs.ts mirroring Xaridotis's media_refs D1 table. Durable D1 pointers from Telegram message_id -> R2 key with extracted_text, vector_id, expires_at. Needed because mood_journal.photo_r2_key column is never written; routing photo uploads through mediaRefs gives Eukara a single durable index of every media object.

### 4.6 services/planner.ts (NEW)

CoALA Phase 2 explicit planning step. Called only for emotional / complex messages, never on casual. Best-effort, never blocks user reply.

Public API: generatePlan(env, userId, userText, currentMood) -> string | null

Pulls:
- Procedural insights from services/episode.ts (needs getProceduralInsights added - Xaridotis-parity)
- Recent episodes (last 5)
- Pending episodes (follow-ups whose outcome is still NULL)

Model: runs on the casual-lane cascade (Gemma 4 26B -> gemini-3.5-flash -> Kimi K2.6). Max 200 tokens, plain text, prepended to dynamic context as ACTION PLAN.

### 4.7 services/personaEvolution.ts (NEW)

Daily 04:00 London cron. Scans last 7 days of feedback, insight, pattern memories plus last 30 user turns from KV history. If >=5 signals, fires bg-cascade with EVOLUTION_PROMPT to produce COMMUNICATION_NOTES + EVOLVED_TRAITS, writes to user's active persona_config row. NONE-output is a valid return - does nothing.

Cleanliness improvements vs Xaridotis: parse with dedicated parseEvolutionOutput(text) -> {notes, traits} (unit-testable). Thin-evidence guards (<600 chars, must contain "- " bullets) stay.

### 4.8 services/chatSummaries.ts (NEW)

Nightly 03:00 cron. Implementation matches Xaridotis chatSummaries.js. Inactivity threshold: 3 days. Output schema: {summary_text, date_range, key_themes, user_emotional_tone, noteworthy_events} - last three are diagnostic only, not stored.

Cascade: bg-cascade (gemini-3.5-flash -> kimi-k2.6 -> gemma).

Idempotency: per-thread KV marker chat_summary_last_${chatId}_${threadId} with 7-day TTL. Per-day re-check inside 24h skipped via timestamp parse.

After each successful compression: write D1 row, index summary into Vectorize as conv_${userId}_summary_${id} with metadata.type='chat_summary', optionally write raw transcript shadow to R2 (3.3 improvement), delete KV blob.

Budget: 120s loop, 30s per chat, 40k char transcript cap. Fits Eukara's 300s CPU comfortably.

### 4.9 services/moodSynthesis.ts (NEW) - THE HEADLINE FIX

End-of-flow mood synthesis. QUEUE-FIRED, not inline (this is the root-cause fix for today's mood-check failure - see 5.1).

Public API:
- maybeFireSynthesis(env, chatId, userId, threadId) - idempotent via KV guard mood_synthesis_fired_${chatId}_${today}. Requires sleep logged. Enqueues mood_synthesis_final and writes guard with 26h TTL.
- runSynthesisCascade(env, userId, startedAtMs, systemPrompt) -> {text, model, source, ms} - called by queue worker.
- buildSynthesisDataBlock(env, userId, today, period) - pulls today's combined entries (deduped emotions + activities across all of today's rows), 7-day evening history, emotion-filtered episodes (needs episode.getEpisodesByEmotion - Xaridotis-parity), therapeutic memories (categories pattern/trigger/schema/insight/homework/growth), Vectorize semantic context.
- composeSynthesisPrompt(period, data) - Anti-Summary discipline (Xaridotis verbatim): labelled sections [TODAY'S DATA] / [MOOD SCALE] / [RECENT TREND] / [RELATED EPISODES] / [KNOWN HEURISTICS] / [SEMANTIC CONTEXT] + STRICT CONSTRAINTS (no summarising, no therapy-speak, find the friction, 2-3 sentences max, no platitudes, only today's emotions, no invented facts) + SAFETY footer.

### 4.10 services/moodMicroAck.ts (NEW)

Two short AI-driven acks: runScoreAck after score tap, runEmotionsAck after Done tap.

Both run on casual-lane cascade (Gemma first). One-sentence outputs. Tone matches score (0-2 grounded / 3-5 warm / 6-8 light / 9-10 matched). Hard fallbacks to STATIC_SCORE_ACK = "Got it. Tap below to share what you are feeling." and STATIC_EMOTIONS_ACK = "Got it." on total cascade failure.

These COULD be inline-safe (small calls, ~2-3s each) but the architecture is cleaner if they too go via the queue. Roma to choose - see 5.3.

### 4.11 bot/inlineHandler.ts (NEW)

@bot <query> in any Telegram chat. Direct Gemini Flash call (no gateway, for speed). Uses user's currently-active persona_config row. Max 300 tokens, 1-3 sentences, no HTML, temperature 1.0. Cache 10s for results, 300s for empty-query help card.

Allowed updates: inline_query already needs to be in setWebhook allowed_updates array. Check/add in src/index.ts.

---

## 5. Mood pipeline - current bug + target flow + model mapping

### 5.1 Current bug (root cause)

handlePollAnswer and handleEmotionsDone run via ctx.waitUntil in src/index.ts. Both make heavy Gemini Pro calls (1500 and 2000 tokens, thinkingEffort medium/high). Cloudflare's waitUntil ceiling is 30 seconds AFTER the response is returned - NOT the "5-minute CPU limit" the comment in index.ts claims. When the Gemini call goes over budget, the entire flow is silently terminated - including the catch block that would set the fallback. Yesterday (June 1) worked; today (June 2) didn't because Gemini latency landed over budget.

Independent issue: queue.ts mood_poll task uses raw fetch() instead of telegram.sendPoll, bypassing retry/error logging.

### 5.2 Target flow (queue-fired throughout)

1. /mood -> enqueue mood_poll. Unchanged.
2. Queue sends poll via typed telegram.sendPoll. Initialises mood_flow_${chatId} KV state.
3. User taps score -> poll_answer webhook -> ENQUEUE mood_score_received. Webhook returns 200 immediately. NO inline Gemini call.
4. Queue worker upserts score with source: 'manual_command' or 'cron_poll', runs moodMicroAck.runScoreAck, sends ack + Positive/Negative buttons.
5. Positive/Negative tap -> category grid (unchanged).
6. Emotion toggles -> KV (unchanged).
7. Done tap -> ENQUEUE mood_emotions_done. Callback returns immediately.
8. Queue worker saves emotions, runs runEmotionsAck, sends ack, then sequences activities keyboard -> sleep prompt -> photo prompt.
9. Once sleep logged AND (photo logged OR skipped) -> maybeFireSynthesis enqueues mood_synthesis_final.
10. Queue worker runs Anti-Summary cascade, sends synthesis + tg-time footer, clears health_checkin_active_${userId} flag.

Queue tasks have 15-min wall clock + 3 retries. No more 30s death.

### 5.3 Model mapping (Xaridotis -> Eukara)

Roma's constraint: do NOT change model registry. Xaridotis cascades use OpenAI gpt-5.4 and Claude Haiku 4.5; Eukara only has Gemini 3.5 Flash + CF Workers AI.

| Xaridotis cascade | Xaridotis tiers | Eukara cascade | Eukara tiers |
|---|---|---|---|
| SYNTHESIS_TIERS | 3.5-flash -> gpt-5.4 -> 3.1-flash-lite | synth-cascade | gemini-3.5-flash (Pro) -> gemini-3.5-flash (flashLite same model) -> kimi-k2.6 |
| MOOD_ACK_TIERS | 3.5-flash -> gpt-5.4 -> 3.1-flash-lite | mood-ack-cascade | GEMMA-4-26B -> gemini-3.5-flash -> kimi-k2.6 |
| LAYER_B1_TIERS (planner) | 3.1-fl -> 3.5-flash -> gpt-5.4-mini -> haiku -> gemma | casual-cascade | GEMMA-4-26B -> gemini-3.5-flash -> kimi-k2.6 |
| EVOLUTION_TIERS | 3.5-flash -> gpt-5.4 -> 3.1-flash-lite | bg-cascade | gemini-3.5-flash -> kimi-k2.6 -> gemma-4-26b |
| HEAVY_BG_TIERS (summaries) | 3.5-flash -> pro-latest -> gpt-5.4 -> 3.1-flash-lite | bg-cascade | gemini-3.5-flash -> kimi-k2.6 -> gemma-4-26b |

All cascades collapse to combinations of 3 models. Define once in new src/config/cascades.ts. Existing chatWithProLaneFallback helper (in bot/message.ts) generalised to runCascade(env, prompt, system, tiers).

Acks pick Gemma FIRST (directly answers Roma's "ensure we are using Gemma") - Gemma is on edge GPU, responds in ~400-800ms for short outputs. Synthesis picks Gemini Pro first because Anti-Summary discipline is hard for smaller models. Background jobs pick Gemini Pro first because they are not latency-sensitive.

---

## 6. Background workers

### 6.1 Spontaneous outreach (UPGRADE)

Current Eukara (router/queue.ts spontaneous_outreach case): a generic prompt sent through generateCheckinMessage. No memory mix, no scheduling logic, no topic search.

Target (Xaridotis pattern):
- Triggered from cron at ~5% chance per minute, only between 10:00 and 19:00 user-local
- Daily cap via KV spontaneous_${today} (1 per day max)
- >=3 hours since user's last message (last_seen_${chatId})
- Respects quiet hours (set_quiet_hours KV flag)
- Pulls a memory mix prioritising implicit observation insights, discovery items, idea brain-dumps, homework follow-ups
- CRITICAL: discovery memories are NEVER injected into chat prompts as memCtx. They are only used for spontaneous outreach. Add memCtx allowlist to services/memory.ts that excludes discovery.

### 6.2 Accountability nudge (NEW)

New task type accountability_nudge triggered from cron 1-2x per week at sensible hour (e.g. Wednesday 17:00 user-local). Pulls patterns from memories (categories pattern, commitment, goal) where:
- pattern mentions avoidance / skipping / procrastination
- commitment was made in last 7 days
- goal has no recent progress evidence

Output: single calibrated nudge message via casual-cascade. Tone matches persona's tone setting. Never lectures. Single observation, single optional question.

### 6.3 Curiosity digest (NEW)

New task type curiosity_digest triggered weekly (e.g. Saturday 11:00 user-local). Reads topics_of_interest (persona_config) and recent interest / discovery memories. Web search for fresh items in those topics, generates 3-bullet digest with citations, sends to chat with tg-time footer.

Uses existing tools/research-tools.ts and tools/web-tools.ts plumbing. No new AI integration.

### 6.4 Persona evolution (NEW)

Daily 04:00 London cron -> services/personaEvolution.evolvePersona(env, userId). Implementation per 4.7.

IMPORTANT: evolution operates on the user's currently-active persona (resolved via KV persona_${chatId}_${threadId}), not on every persona row. Switching personas mid-week should not pollute Nightfall with Eukara observations.

### 6.5 Chat summary ledger (NEW)

Nightly 03:00 London cron -> services/chatSummaries.consolidateNarrativeLedger(env). Per 4.8.

---

## 7. /persona command + multi-persona switching

Already present as a command - extend to true switching.

- /persona (no arg) -> list available (built-in + custom) with display name, tone summary, voice. Inline keyboard buttons to select.
- /persona <key> -> switch active persona for current chat+thread. KV persona_${chatId}_${threadId} updated.
- /persona new -> guided creation flow. KV flag persona_creating_${userId} records in-progress wizard step.
- /persona delete <key> -> refuses built-ins.
- /persona voice <key> <voiceName> -> validated against Chirp3-HD catalogue.

On next user message, buildSystemInstruction reads active persona key from KV and overlays that row's settings on shared instruction text. The instruction TEXT is unchanged; only the overlay sliders change.

---

## 8. Confirming Gemma usage

Verified:
- src/config/models.ts defines CF_MODELS.chat = '@cf/google/gemma-4-26b-a4b-it' (paid, $0.10/$0.30 per M tokens, 256k context).
- src/ai/router.ts default_casual route uses CF_MODELS.chat for casual turns (no longer forcing thinking effort low).
- mood-ack cascade picks Gemma FIRST (5.3).
- casual-cascade picks Gemma FIRST.
- bg-cascade keeps Gemma as Tier 3 fallback.

Gemma is used wherever latency matters more than nuance. Gemini 3.5 Flash takes over for synthesis (Anti-Summary). Kimi K2.6 is the safety net.

---

## 9. Phasing and dependencies

Five phases. Each phase ends in a deployable state with no broken features. Roma deploys at end of each phase after reviewing diff.

### Phase 1 - Mood reliability fix + queue routing (HIGHEST PRIORITY)

Resolves today's bug.

- Add queue task types: mood_score_received, mood_emotions_done, mood_synthesis_final.
- Move Gemini Pro calls from bot/poll.ts and bot/mood-callbacks.ts into their queue workers.
- Replace raw fetch() poll send with telegram.sendPoll.
- Add source column to mood_journal (additive migration).
- Add mood_flow_${chatId} KV state record + helpers.
- Fix misleading comment in src/index.ts about waitUntil budget.

Deliverable: mood check completes reliably even when Gemini Pro stalls. ~6-8 hours.

### Phase 2 - Service layer foundation

- Create services/users.ts (move identity bits from persona.ts).
- Create services/personas.ts with seeded built-ins (composite PK migration).
- Create services/reminders.ts (replace inline INSERT in tools/reminder-tools.ts).
- Create services/media.ts + services/mediaRefs.ts.
- Extend services/mood.ts with helpers from 4.1.
- Schema migration: ai_signature everywhere, source on mood_journal (Phase 1), metadata on reminders, style_card on user_profiles, persona_config composite PK, media_refs table, updated_at triggers.

Deliverable: typed service layer underneath every tool. Tools become 5-line wrappers. ~12-15 hours.

### Phase 3 - Mood completeness

- Create services/moodSynthesis.ts + Anti-Summary prompt.
- Create services/moodMicroAck.ts + cascades.
- Wire activities keyboard, sleep prompt, photo prompt into the mood flow workflow.
- Make photo_r2_key actually get written via mediaRefs.linkToMoodJournal().
- Update clinical_tags writes via new services/moodTagger.ts (Llama 3.2 1B, casual cascade fallback).

Deliverable: mood check produces full synthesis with Anti-Summary discipline, all columns populated. ~10 hours.

### Phase 4 - Persona evolution + chat summaries

- Create services/personaEvolution.ts + 04:00 cron hook in router/cron.ts.
- Create services/chatSummaries.ts + 03:00 cron hook.
- Add chat_summaries Vectorize indexing into multi-signal recall in services/vector.ts.
- Optional: raw transcript shadow to R2 (3.3).
- Add CASUAL_REGISTER_DIRECTIVE to personas.ts and wire into prompt build when curator returns casual intent.

Deliverable: persona learns from interactions; older chat history is permanently searchable. ~10 hours.

### Phase 5 - Background features + inline + /persona UI

- Upgrade spontaneous_outreach to Xaridotis pattern with memory mix + scope guard.
- Implement accountability_nudge + curiosity_digest queue tasks + cron triggers.
- Create bot/inlineHandler.ts + add inline_query to allowed_updates.
- Expand /persona command into multi-persona switching wizard.
- Add services/planner.ts for CoALA Phase 2.

Deliverable: feature-complete vs Xaridotis. ~12 hours.

### Total estimate

50-55 hours of focused work across 5 sessions. Each phase independently deployable.

---

## 10. Schema migration SQL (Phase 1+2, additive only)

```sql
-- Migration 001: Xaridotis-parity additive columns + media_refs
-- 2026-06-XX (Phase 1+2 of mirror plan)

-- 1. mood_journal: source tracking (Phase 1)
ALTER TABLE mood_journal ADD COLUMN source TEXT;
ALTER TABLE mood_journal ADD COLUMN ai_signature TEXT;

-- 2. reminders: metadata + ai_signature
ALTER TABLE reminders ADD COLUMN metadata TEXT DEFAULT '{}';
ALTER TABLE reminders ADD COLUMN ai_signature TEXT;

-- 3. user_profiles: style_card + ai_signature
ALTER TABLE user_profiles ADD COLUMN style_card TEXT;
ALTER TABLE user_profiles ADD COLUMN ai_signature TEXT;

-- 4. memories, episodes, knowledge_graph, chat_summaries: ai_signature
ALTER TABLE memories ADD COLUMN ai_signature TEXT;
ALTER TABLE episodes ADD COLUMN ai_signature TEXT;
ALTER TABLE knowledge_graph ADD COLUMN ai_signature TEXT;
ALTER TABLE chat_summaries ADD COLUMN ai_signature TEXT;

-- 5. persona_config: RECREATE with composite PK
-- (Safe: current table has at most 2 minimal rows.)
CREATE TABLE persona_config_new (
    user_id INTEGER NOT NULL,
    persona_key TEXT NOT NULL,
    display_name TEXT,
    is_custom INTEGER DEFAULT 0,
    base_persona TEXT DEFAULT 'eukara',
    tone TEXT DEFAULT 'warm',
    formality TEXT DEFAULT 'casual',
    humour_level TEXT DEFAULT 'moderate',
    emoji_style TEXT DEFAULT 'moderate',
    therapeutic_approach TEXT DEFAULT 'supportive',
    voice_name TEXT,
    voice_locale TEXT DEFAULT 'en-US',
    custom_instruction TEXT,
    topics_of_interest TEXT,
    communication_notes TEXT,
    evolved_traits TEXT,
    ai_signature TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, persona_key),
    FOREIGN KEY(user_id) REFERENCES user_profiles(user_id)
);

INSERT INTO persona_config_new
    (user_id, persona_key, display_name, tone, formality, humour_level,
     emoji_style, therapeutic_approach, topics_of_interest,
     communication_notes, evolved_traits, updated_at)
SELECT
    user_id, 'eukara', 'Eukara', tone, formality, humour_level,
    emoji_style, therapeutic_approach, topics_of_interest,
    communication_notes, evolved_traits, updated_at
FROM persona_config;

DROP TABLE persona_config;
ALTER TABLE persona_config_new RENAME TO persona_config;
CREATE INDEX idx_persona_user ON persona_config(user_id);

-- 6. media_refs (new table)
CREATE TABLE IF NOT EXISTS media_refs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    chat_id INTEGER NOT NULL,
    message_id INTEGER NOT NULL,
    thread_id TEXT DEFAULT 'default',
    media_type TEXT NOT NULL,
    mime_type TEXT,
    file_name TEXT,
    size_bytes INTEGER,
    r2_key TEXT NOT NULL,
    telegram_file_id TEXT,
    extracted_text TEXT,
    summary TEXT,
    summary_model TEXT,
    vector_id TEXT,
    expires_at DATETIME,
    chunk_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_media_refs_user_time
    ON media_refs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_refs_r2 ON media_refs(r2_key);

-- 7. updated_at triggers (Phase 2)
DROP TRIGGER IF EXISTS trg_user_profiles_updated_at;
CREATE TRIGGER trg_user_profiles_updated_at
    AFTER UPDATE ON user_profiles FOR EACH ROW
    WHEN OLD.updated_at IS NEW.updated_at
BEGIN
    UPDATE user_profiles SET updated_at = CURRENT_TIMESTAMP
    WHERE user_id = NEW.user_id;
END;

DROP TRIGGER IF EXISTS trg_persona_config_updated_at;
CREATE TRIGGER trg_persona_config_updated_at
    AFTER UPDATE ON persona_config FOR EACH ROW
    WHEN OLD.updated_at IS NEW.updated_at
BEGIN
    UPDATE persona_config SET updated_at = CURRENT_TIMESTAMP
    WHERE user_id = NEW.user_id AND persona_key = NEW.persona_key;
END;

DROP TRIGGER IF EXISTS trg_reminders_updated_at;
CREATE TRIGGER trg_reminders_updated_at
    AFTER UPDATE ON reminders FOR EACH ROW
    WHEN OLD.updated_at IS NEW.updated_at
BEGIN
    UPDATE reminders SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;

DROP TRIGGER IF EXISTS trg_mood_journal_updated_at;
CREATE TRIGGER trg_mood_journal_updated_at
    AFTER UPDATE ON mood_journal FOR EACH ROW
    WHEN OLD.updated_at IS NEW.updated_at
BEGIN
    UPDATE mood_journal SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;
```

All ADD COLUMN operations are non-destructive. persona_config recreation is destructive but only on a table with <=2 minimal rows; rows preserved by SELECT-INSERT migration. Apply in single wrangler d1 execute batch.

---

## 11. Rollback plan

Per phase:

- Phase 1: roll back by reverting queue.ts case additions and restoring inline calls in bot/poll.ts / bot/mood-callbacks.ts. Schema additions are non-destructive so no rollback needed. source column simply stays NULL.
- Phase 2: roll back by reverting service file additions and persona_config table recreation. Safety copy of persona_config_pre_migration kept in D1 for 7 days. Additive schema columns stay (no harm).
- Phase 3: roll back by deleting new service files. Mood flow returns to Phase 1 state (working but no synthesis / acks).
- Phase 4: roll back by removing cron hooks. Existing chat_summaries D1 rows kept but not consulted.
- Phase 5: each feature is independent - accountability nudge, curiosity digest, inline handler, /persona expansion can be reverted individually.

---

## 12. Open questions for Roma (answer before Phase 1 starts)

1. Persona keys: keep "xaridotis / nightfall / mooncake / hue / tribore" as the built-in set with "eukara" as new primary key replacing xaridotis? Or just rename xaridotis -> eukara and lose the legacy alias names? My recommendation: rename, drop legacy names, since Eukara is a different bot and historical reasons for those names (Helldivers) are Xaridotis-specific.
2. Raw transcript shadow to R2 (3.3): yes / no / defer?
3. curator_log table: forensic Curator routing logs from day 1, or skip and add later if needed?
4. Phase ordering: Phase 1 first (mood fix) is non-negotiable; rest can re-order. Confirm or propose.
5. Photo upload investigation (paused 2026-05-04 in Xaridotis): include in Phase 3, or keep paused? D1 still shows photo_r2_key always NULL across both bots - same root cause likely.
6. Old services/persona.ts: split into users.ts + personas.ts per 4.3 / 4.4, or leave as thin re-export shim during migration to avoid touching every import site?

---

## 13. Files that will be created or changed (full list)

NEW files:
- src/config/cascades.ts
- src/config/voices.ts
- src/services/users.ts
- src/services/personas.ts
- src/services/reminders.ts
- src/services/media.ts
- src/services/mediaRefs.ts
- src/services/moodSynthesis.ts
- src/services/moodMicroAck.ts
- src/services/moodTagger.ts
- src/services/planner.ts
- src/services/personaEvolution.ts
- src/services/chatSummaries.ts
- src/bot/inlineHandler.ts
- src/lib/moodFlow.ts (KV-backed flow state helpers)
- migrations/001_mirror_plan.sql

CHANGED files:
- src/config/personas.ts (add CASUAL_REGISTER_DIRECTIVE, TOOL SELECTION HARD CONSTRAINTS)
- src/services/persona.ts (slim to re-export shim or remove)
- src/services/mood.ts (extend with helpers)
- src/services/episode.ts (add getEpisodesByEmotion, getProceduralInsights, getPendingEpisodes)
- src/services/memory.ts (add memCtx scope allowlist, exclude discovery)
- src/services/vector.ts (chat_summaries participate in multi-signal recall)
- src/bot/poll.ts (replace inline Gemini call with queue enqueue)
- src/bot/mood-callbacks.ts (replace inline Gemini call with queue enqueue)
- src/bot/commands.ts (extend /persona, add /mood subcommands if useful)
- src/bot/callback.ts (mood synthesis routing, persona switch buttons)
- src/router/queue.ts (add mood_score_received, mood_emotions_done, mood_synthesis_final, accountability_nudge, curiosity_digest tasks)
- src/router/cron.ts (add 03:00 chat summaries, 04:00 persona evolution, accountability + curiosity hooks)
- src/index.ts (correct waitUntil comment, add inline_query to allowed_updates, enqueue poll_answer rather than waitUntil)
- src/lib/history.ts (no functional change; clarify comments)
- src/lib/telegram.ts (add sendPoll helper if missing)
- schema.sql (canonical source for fresh deploys)

NO changes:
- src/config/models.ts (Roma's explicit constraint)
- src/ai/router.ts (already routes casual to Gemma)
- All workflow files (consolidation, research, architect)
- Weekly Sunday report code
