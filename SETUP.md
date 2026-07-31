# Eukara setup guide

## Prerequisites

- Node.js 22 or later
- Wrangler 4
- an authenticated Cloudflare account
- a Telegram bot token from BotFather
- an OpenAI API key
- your numeric Telegram user ID

Install the repository dependencies with `npm install`.

## Local development secrets

Create `.dev.vars` in the project root. It is ignored by Git.

```dotenv
OPENAI_API_KEY=your-openai-key
TELEGRAM_TOKEN=your-botfather-token
OWNER_ID=your-numeric-telegram-user-id
TELEGRAM_WEBHOOK_SECRET=your-generated-webhook-secret
```

Generate the webhook secret with cryptographically secure random bytes:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Copy the generated value into `.dev.vars`. Do not paste it into source code,
`wrangler.jsonc`, Git history or chat.

## Production secrets

Set each required secret interactively. Wrangler stores them encrypted and does
not print their values afterwards.

```bash
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put TELEGRAM_TOKEN
npx wrangler secret put OWNER_ID
npx wrangler secret put TELEGRAM_WEBHOOK_SECRET
```

Use the same `TELEGRAM_WEBHOOK_SECRET` value in Cloudflare and `.dev.vars`.

## Secure Telegram webhook registration

The Worker has no public setup or command-registration endpoints. Registration
runs only from the local administration script.

For a zero-gap security cutover, use this order:

1. Add `TELEGRAM_WEBHOOK_SECRET` to `.dev.vars`.
2. Run `npx wrangler secret put TELEGRAM_WEBHOOK_SECRET` and paste the same value.
3. While the previous Worker version is still live, run:

   ```bash
   npm run telegram:setup
   ```

   This registers the production URL, the secret token, allowed update types and
   the current command menu. It explicitly preserves pending updates.

4. Deploy the authenticated Worker:

   ```bash
   npm run deploy
   ```

5. Verify the resulting Telegram configuration:

   ```bash
   npm run telegram:status
   ```

The status output must show:

- URL `https://eukara.roman-jeremiah.workers.dev/`;
- no `last_error_message`;
- the expected allowed update types;
- nine current bot commands and no `/persona` command.

Telegram sends `TELEGRAM_WEBHOOK_SECRET` in the
`X-Telegram-Bot-Api-Secret-Token` header. Eukara rejects a missing or incorrect
header before parsing the Telegram update.

## Validation

```bash
npm run typecheck
npm run test:unit
npm run test:run
npm run deploy:dry-run
```

Check the deployed Worker:

```bash
curl -fsS https://eukara.roman-jeremiah.workers.dev/health
npx wrangler tail --format pretty
```

## Optional secrets

Set these only for enabled integrations:

```bash
npx wrangler secret put TAVILY_API_KEY
npx wrangler secret put GITHUB_TOKEN
npx wrangler secret put GCP_TTS_API_KEY
```
