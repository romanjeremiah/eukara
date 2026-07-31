# Telegram webhook authentication

Status: implemented locally and validated on 2026-07-31; production secret and
deployment remain owner-operated.

## Decision

Eukara uses Telegram's webhook `secret_token` as the request-origin credential.
The value is stored as the Cloudflare secret `TELEGRAM_WEBHOOK_SECRET` and in the
developer's ignored `.dev.vars` file for local administration.

Public `/setup-webhook` and `/register-commands` endpoints are removed. Webhook
and command registration are performed by `scripts/telegram-admin.mjs` from the
trusted local terminal.

## Request flow

```text
Telegram setWebhook
  secret_token configured
        |
        v
POST /
  X-Telegram-Bot-Api-Secret-Token
        |
        v
SHA-256 both values
  constant-time comparison
        |
        +-- mismatch or missing --> 401, body not parsed
        |
        +-- Worker secret missing --> 503, fail closed
        |
        +-- match --> parse Telegram update and dispatch
```

## Security properties

- Authentication happens before body parsing or owner-ID authorisation.
- Both secret strings are hashed to the same fixed length before Workers'
  `crypto.subtle.timingSafeEqual` comparison.
- Secret values are not logged, returned in responses or placed in source.
- Public requests cannot register a webhook, change the command menu or request
  that Telegram drop pending updates.
- Local webhook registration sets `drop_pending_updates` to `false`.
- `wrangler.jsonc` declares the secret as required so a future deployment fails
  validation if the binding is absent.

## Operational sequence

The webhook should be given the secret before the validating Worker is deployed.
The old Worker ignores the extra Telegram header; the new Worker requires it.
This ordering avoids an intentional authentication gap during cutover.

1. Store the same random secret locally and in Cloudflare.
2. Run `npm run telegram:setup` against the old Worker version.
3. Deploy the new Worker.
4. Run `npm run telegram:status` and a normal Telegram message smoke test.

## Impact assessment

- Legitimate Telegram updates gain one pair of SHA-256 digests and a fixed-size
  constant-time comparison. This cost is small and bounded.
- Invalid requests stop before JSON parsing, curator calls, queue writes, tools
  or owner checks.
- No D1, KV, R2, Vectorize, Queue or Workflow data migration is required.
- A missing production secret deliberately makes the webhook unavailable rather
  than falling open.

## Official references

- Telegram Bot API `setWebhook`:
  `https://core.telegram.org/bots/api#setwebhook`
- Cloudflare Worker secrets:
  `https://developers.cloudflare.com/workers/configuration/secrets/`
- Cloudflare Workers Web Crypto:
  `https://developers.cloudflare.com/workers/runtime-apis/web-crypto/`
