# OpenAI-native persona alignment conclusion

Date: 2026-07-31

## Outcome

The approved single-identity Eukara architecture is implemented locally and
passes all automated validation. Luna, Terra and Sol remain model-routing
labels only. Retired Luna, Socrates and Nova persona instructions no longer
enter prompt composition.

## Verified properties

- The curator returns a bounded register and explicit current-turn constraints.
- Crisis, emotional and code intents are normalised to urgent, warm and
  technical registers respectively.
- User text, dynamic context and active constraints are escaped before entering
  prompt XML blocks.
- The clinical directive is absent from casual and technical prompts and is
  present only for warm or urgent prompts.
- The style card accepts enumerated values only and falls back safely when JSON
  is malformed.
- Legacy free-text communication notes, inferred traits and interests remain
  stored but no longer become system instruction.
- The old persona command and callback paths clear only the requesting user's
  obsolete override and explain the adaptive identity.
- The deterministic UK crisis response includes NHS 111, Samaritans 116 123,
  SHOUT to 85258 and 999 or A&E for immediate danger.
- Compact Telegram HTML remains the canonical rendering contract.

## Residual risks

- Register classification is model-assisted. Deterministic normalisation and
  the narrow crisis fallback reduce inconsistent outputs but cannot eliminate
  every language-classification error.
- Existing `active_persona_*` values remain inert in KV for rollback until a
  user invokes the compatibility path. This is intentional and not a runtime
  prompt risk.
- No production smoke test has been run because deployment was not part of this
  implementation request.

## Evidence

See `docs/tests/results/2026-07-31-persona-alignment.txt` and
`docs/architecture/openai-native-persona-alignment-2026-07-31.md`.
