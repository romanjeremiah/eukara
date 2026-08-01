# Persona Finalisation

Date: 2026-08-01
Status: implementation boundary confirmed by the owner's request to finish the
approved adaptive Eukara persona work

## Current situation

Eukara already has one immutable identity, curator-selected registers, a
validated style card, conditional clinical guidance and compact Telegram HTML
rules. Normal conversation uses `services/persona.ts`, but three secondary
generation paths still bypass that composer:

1. spontaneous outreach;
2. weekly reflections;
3. the final mood-check-in observation.

Those paths repeat local persona fragments or generic friend instructions. They
therefore miss validated user delivery preferences, current-mode boundaries and
the single conditional-clinical policy. A residual `/10` label also conflicts
with the live 1-5 mood flow.

The repository additionally contains an inactive `src/index.js` entrypoint with
the retired KVN identity and an embedded Telegram bot token. Wrangler executes
`src/index.ts`, so the JavaScript file has no runtime ownership and should not
remain as an alternative architectural story or credential source.

## Decision

Finish the previously approved architecture without introducing another persona
layer:

- route all user-visible text generation through
  `persona.buildSystemInstruction()`;
- select `casual` for unsolicited social outreach and `warm` for reflective
  mood or weekly synthesis;
- express task-specific length and layout requirements as bounded active
  constraints rather than duplicate identity prompts;
- keep clinical guidance conditional on `warm` or `urgent` mode;
- preserve governed persona directives as disabled and keep legacy free-text
  traits out of the prompt;
- restrict the dormant persona-config writer to validated scalar delivery
  controls, without deleting historical columns or data;
- standardise displayed and background mood scales on 1-5;
- delete inactive `src/index.js` without rewriting Git history.

## Impact assessment

### Behaviour

- Proactive and reflective messages inherit Eukara's fixed identity and each
  user's validated delivery settings.
- Casual outreach cannot acquire therapeutic framing merely because it is
  generated outside the normal message router.
- Weekly and mood reflections retain warm guidance while remaining concise and
  non-diagnostic.
- Existing database schemas, stored persona fields, history ownership, model
  routes, queues and Telegram APIs remain unchanged.

### Safety and privacy

- Dynamic mood, history and memory context continues to be escaped before it is
  placed in prompt XML.
- Inferred traits remain reviewable governed-memory candidates and do not gain
  direct instruction authority.
- Removing the tracked credential stops future exposure in the working tree,
  but does not remove it from Git history. The Telegram bot token must be
  revoked and replaced before treating the repository as secure.

### Performance

- No additional model call is introduced. The secondary paths add one D1
  profile/persona read pair, performed in parallel by the existing composer.
- Prompts stay lean because feature prompts no longer repeat the core identity
  and formatting rules.

## Explicit non-goals

- automatic style-card evolution;
- activation of governed persona directives;
- new model-routing tiers or reasoning levels;
- database migrations or deletion of historical persona data;
- Git-history rewriting, token rotation or production deployment.

## Verification plan

1. Add unit coverage for scalar-only persona updates and the 1-5 history label.
2. Run TypeScript checking and both unit and Workers test suites.
3. Run a Wrangler deployment dry run.
4. Scan tracked files for credential-shaped Telegram tokens.
5. Review the final diff and confirm unrelated `.DS_Store` deletions remain
   untouched.
