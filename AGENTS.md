# Agents

**Read [`README.md`](./README.md) first — it is the whole manual.** This file exists only to make the
three rules that are easy to break unmissable.

1. **Do not invent a token, ever.** The colour, type, spacing, shape and motion scales are all
   in `src/styles/tokens.css` now (JH206) — read it before assuming a value is missing. If a value
   is genuinely needed and no token covers it, say so and stop; do not fill it in with a guess. A
   plausible invented value becomes the system the moment it ships, which is the failure this rule
   exists to prevent.
2. **No hardcoded colour in a component, ever.** A colour with no role is a missing role.
3. **`/design-sync` is typed by a human**, in this directory, at the Claude Code prompt. You cannot run
   it and should not try.

House rules on prices, clinical values, severity ramps and error-vs-empty are in README § "House rules"
and are not restated here, so the two cannot drift.
