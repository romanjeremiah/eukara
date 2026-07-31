# Telegram webhook authentication conclusion

Date: 2026-07-31

## Outcome

The approved Option A security design is implemented locally. Forged or missing
Telegram secret headers are rejected before request-body parsing, and the former
public administration endpoints are no longer executable.

## Verified behaviour

- Missing or incorrect webhook secret returns HTTP 401.
- A matching webhook secret permits the Telegram dispatch path.
- Missing Worker secret fails closed with HTTP 503.
- `/setup-webhook` and `/register-commands` return HTTP 404.
- Cloudflare-generated types include `TELEGRAM_WEBHOOK_SECRET`.
- The local administration script never prints either secret and explicitly
  preserves pending Telegram updates.

## Remaining rollout actions

The owner must store the same random value in `.dev.vars` and Cloudflare, run the
local Telegram setup script, deploy the Worker, and verify webhook status. These
steps deliberately remain outside automated tests because they change production
secrets and Telegram state.

See `SETUP.md` and
`docs/architecture/telegram-webhook-authentication-2026-07-31.md`.
