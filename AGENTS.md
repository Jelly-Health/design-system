# Agents

**Read [`README.md`](./README.md) first — it is the whole manual.** This file exists only to make the
four rules that are easy to break unmissable.

1. **Do not invent a token, ever.** The colour, type, spacing, shape and motion scales are all
   in `src/styles/tokens.css` now (JH206) — read it before assuming a value is missing. If a value
   is genuinely needed and no token covers it, say so and stop; do not fill it in with a guess. A
   plausible invented value becomes the system the moment it ships, which is the failure this rule
   exists to prevent.
2. **No hardcoded colour in a component, ever.** A colour with no role is a missing role.
3. **Never bind a Tailwind generic size name.** `--text-sm`, `--text-base`, `--text-lg` and the rest
   belong to Tailwind; console density lives on `--text-console-*`. Binding one resizes text a
   consumer already wrote, with no error and nothing to review — it shipped once and put the
   marketing site below our own member body floor. Removing an `@theme inline` alias is **not** enough:
   a plain `:root` declaration overrides Tailwind by cascade anyway, so the name itself must stay
   prefixed. `scripts/verify-type-ramp.py` enforces this; run it before you commit a token change.
4. **`/design-sync` is typed by a human**, in this directory, at the Claude Code prompt. You cannot run
   it and should not try.

House rules on prices, clinical values, severity ramps and error-vs-empty are in README § "House rules"
and are not restated here, so the two cannot drift.
