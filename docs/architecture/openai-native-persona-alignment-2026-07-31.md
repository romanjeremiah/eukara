# OpenAI-native persona alignment

Status: implemented locally and validated on 2026-07-31; not committed or
deployed in this change set.

## Decision

Eukara will use one adaptive identity. Luna, Terra and Sol remain model-routing
tiers only. Luna, Socrates and Nova will no longer be selectable persona
identities.

The alignment is behavioural rather than a byte-for-byte copy of Xaridotis:

- preserve the Eukara identity and direct OpenAI Responses API architecture;
- adopt Xaridotis's fixed-core and evolving-surface persona model;
- adapt tool instructions to tools that Eukara actually exposes;
- preserve Eukara's live 1-5 mood-wizard scale;
- preserve compact Telegram conversation formatting;
- keep the mental-health directive conditional on a warm or urgent register;
- do not activate governed persona directives or inject unconfirmed inferred
  personality traits.

## Current architecture

```text
Curator intent and complexity
        |
        v
OpenAI model router
        |
        v
Base Eukara instruction
  + optional manually selected Luna, Socrates or Nova identity
  + optional clinical directive
  + formatting directive
  + second-brain directive
  + dynamic context
```

Known problems:

1. Manual `active_persona_*` KV state can override appropriate automatic tone.
2. The `style_card` D1 column is documented but not validated or injected.
3. The exported casual-register directive is not connected to prompt assembly.
4. The persona text predates Xaridotis's immutable mechanics, manipulation bans,
   literal-first discipline and closed-loop behaviour.
5. Legacy inferred persona text can still enter the prompt through
   `persona_config`, bypassing the governed-memory boundary.
6. Luna is both an OpenAI model tier and a selectable Eukara identity.

## Target architecture

```text
OpenAI curator
  intent + complexity + register + explicit current-turn constraints
        |
        +---------------------> OpenAI model router
        |
        v
Single adaptive Eukara prompt
  immutable core
  + validated style card and static user calibration
  + current register and escaped active constraints
  + compact Telegram formatting rules
  + warm/urgent-only clinical directive
  + governed memory and other dynamic context
```

## Composition rules

The prompt builder uses this order:

1. immutable Eukara core;
2. minimal user identity context without inferred traits;
3. validated style card and allow-listed scalar delivery controls;
4. current register plus escaped active constraints;
5. clinical directive only for `warm` or `urgent`;
6. compact Telegram formatting rules;
7. dynamic context.

Each rule has one canonical home. Prompt composition references rules rather
than repeating them, following current OpenAI GPT-5.6 guidance to keep prompts
lean and state instructions once.

## Compatibility and rollback

- Existing `active_persona_*` KV keys are not bulk-deleted. The new prompt
  builder ignores them, so rollback does not require reconstructing state.
- Existing persona callback buttons retire the selector safely and clear only
  the requesting user's obsolete override when clicked.
- `/persona` remains a compatibility command that explains the adaptive model;
  it is removed from the newly registered command list.
- `persona_config` remains in place for static scalar preferences and outreach
  cadence. Free-text inferred fields are not injected.
- No schema or binding change is required.

## Safety boundaries

- Crisis detection remains independent of the main persona response.
- The deterministic crisis response uses current UK routes: NHS 111 mental
  health option, Samaritans 116 123, SHOUT to 85258 and 999 for immediate danger.
- Clinical concepts stay private and are translated to plain language unless
  the user explicitly asks for the formal term.
- A low-confidence or absent curator result must not activate warm mode.
- Curator-produced constraint text is length-bounded and XML-escaped before
  entering the system prompt.

## Impact assessment

### User-visible

- Eukara presents one stable identity and changes register without announcing
  a persona switch.
- Simple conversation stays compact. Technical work becomes direct and
  evidence-led. Emotional turns receive the clinical layer without exposing its
  framework vocabulary.
- Existing persona buttons report that the selector has retired.

### Runtime

- One D1 profile read and one persona-config read remain on the prompt path.
- The existing KV persona read is removed.
- Curator structured output grows by two bounded fields. No second model call is
  introduced.
- No global mutable request state or floating Worker promise is introduced.

### Data

- No D1 migration, production rewrite or destructive consolidation is needed.
- Existing KV overrides remain recoverable but inert.
- Governed persona-directive capture, review and injection remain disabled.

## Validation plan

1. Unit-test style-card validation and malformed JSON fallback.
2. Unit-test casual, technical, warm and urgent prompt composition.
3. Prove that Luna, Socrates and Nova instructions are absent.
4. Prove that active constraints are escaped and warm-only clinical injection
   cannot leak into casual prompts.
5. Prove curator structured-output parsing and safe fallback register.
6. Run TypeScript, unit, full Vitest and Wrangler dry-run validation.
7. Run `git diff --check` and review the complete implementation diff.

## Validation result

- `npm run typecheck`: passed.
- `npm run test:unit`: 4 files and 26 tests passed.
- `npm run test:run`: 10 files and 59 tests passed. Vitest emitted its known
  delayed-close warning after all assertions passed.
- `npm run deploy:dry-run`: passed at 1,695.77 KiB raw and 269.03 KiB gzip.
- `git diff --check`: passed.
- No D1 migration, binding mutation, external write or deployment was run.

## Official references checked

- OpenAI GPT-5.6 model guidance:
  `https://developers.openai.com/api/docs/guides/model-guidance?model=gpt-5.6`
- Cloudflare Workers best practices:
  `https://developers.cloudflare.com/workers/best-practices/workers-best-practices/`
- Telegram Bot API `setMyCommands`:
  `https://core.telegram.org/bots/api#setmycommands`
- NHS urgent mental-health help:
  `https://www.nhs.uk/nhs-services/mental-health-services/where-to-get-urgent-help-for-mental-health/`
