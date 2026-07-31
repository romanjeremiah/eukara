# my-ai-bot Setup Guide

## Project Complete: Phases 1-7

| Phase | Status | What |
|---|---|---|
| 1 | ✅ | TypeScript scaffold, types, D1 schema, infrastructure |
| 2 | ✅ | AI providers (Cloudflare + Gemini), model router |
| 3 | ✅ | Core services (memory, episodes, knowledge graph, vector) |
| 4 | ✅ | Telegram client, message handling, streaming, callbacks |
| 5 | ✅ | 26 tools in OpenAI format |
| 6 | ✅ | 3 Workflows (architect, research, consolidation) |
| 7 | ✅ | Cron + Queue (health check-ins, reminders, outreach) |
| 8 | ⬜ | Secrets + testing (this guide) |

---

## Step 1: Create a New Telegram Bot

Since my-ai-bot runs in parallel with gemini-bot, it needs its own bot:

1. Open Telegram, message @BotFather
2. Send `/newbot`
3. Name: `MyAIBot` (or similar)
4. Username: `my_ai_bot_roman` (must be unique, end with `bot`)
5. Copy the token BotFather gives you

## Step 2: Set Secrets

From the my-ai-bot directory:

```bash
cd ~/Library/CloudStorage/OneDrive-Personal/Documents/GitHub/my-ai-bot

# Required
npx wrangler secret put TELEGRAM_TOKEN    # Paste the new bot token
npx wrangler secret put GEMINI_API_KEY    # Same key as gemini-bot
npx wrangler secret put OWNER_ID          # Your Telegram user ID: 62047005

# Optional
npx wrangler secret put TAVILY_API_KEY    # For web search (free tier)
npx wrangler secret put GITHUB_TOKEN      # For GitHub tools
```

## Step 3: Register Webhook

```bash
curl "https://my-ai-bot.roman-jeremiah.workers.dev/setup-webhook"
```

Verify:
```bash
curl "https://api.telegram.org/bot<YOUR_TOKEN>/getWebhookInfo"
```

## Step 4: Register Commands

```bash
curl "https://my-ai-bot.roman-jeremiah.workers.dev/register-commands"
```

## Step 5: Test Basic Conversation

Send a message to your new bot. Check logs:
```bash
npx wrangler tail --format pretty
```

## Step 6: Add Mood Journal Table

```bash
npx wrangler d1 execute my-db --remote --command="CREATE TABLE IF NOT EXISTS mood_journal (id INTEGER PRIMARY KEY AUTOINCREMENT, chat_id INTEGER NOT NULL, date TEXT NOT NULL, entry_type TEXT NOT NULL DEFAULT 'evening', mood_score INTEGER, emotions TEXT, sleep_hours REAL, sleep_quality TEXT, medication_taken INTEGER DEFAULT 0, medication_time TEXT, medication_notes TEXT, activities TEXT, note TEXT, ai_observation TEXT, photo_r2_key TEXT, clinical_tags TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)"
```
