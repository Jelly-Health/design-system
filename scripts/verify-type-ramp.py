#!/usr/bin/env python3
"""Verify the type ramp never reclaims Tailwind's generic size names.

This guard exists because of a regression that shipped and that nothing could
catch. tokens.css used to bind console density to Tailwind's OWN utility
names -- `--text-sm` 12px against Tailwind's stock 14px, `--text-base` 13px
against 16px, `--text-lg` 16px against 18px. Those are the names every app
already writes, so adopting the package silently resized text that no one had
touched: no error, no warning, no diff to review. Measured on the marketing
site, nav links, both CTAs and the footer went 14px -> 12px and the hero
paragraph 18px -> 16px, putting the most member-facing surface we have below
the member body floor that tokens.css itself declares. axe passed throughout,
because a small font is not a WCAG failure. A green accessibility check is
structurally unable to see this, which is why the check is here instead.

Checks:

  1. tokens.css declares no bare `--text-<size>` anywhere. Removing the
     `@theme inline` alias is NOT sufficient and that is the subtle part: a
     plain `:root` declaration overrides Tailwind's theme layer by cascade
     regardless of what `@theme` says, so the names themselves have to stay
     prefixed
  2. the `@theme inline` block exposes no generic `--text-<size>` alias, which
     is what would turn one back into a `text-sm` utility
  3. the console ramp is complete and each step is aliased -- a step declared
     but not aliased is a token with no utility, which fails silently as an
     unstyled element rather than an error
  4. no component ships a bare generic size utility. They must name a console
     step or a member token, since a bare one now resolves to Tailwind's value
     and not to a decision
  5. the member and display tokens survive, because they are the entire reason
     a surface can opt out of console density

Comments are stripped before scanning: tokens.css deliberately discusses
`--text-sm` in prose to explain the rule, and a checker that cannot tell prose
from a declaration would either fail on the explanation or force the
explanation to be deleted.

Exits non-zero on any failure, so CI can run it.

    python3 scripts/verify-type-ramp.py

This script is mutation-tested. Each of these makes it fail, and they were
each run:

  * adding `--text-sm: 12px;` back to the `:root` type block        (check 1)
  * adding `--text-lg: var(--text-console-lg);` to `@theme inline`  (check 2)
  * deleting the `--text-console-md` alias from `@theme inline`     (check 3)
  * changing a primitive's `text-console-sm` back to `text-sm`      (check 4)
  * deleting `--text-member-body`                                   (check 5)

A guard that has never failed is not evidence.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TOKENS = ROOT / "src" / "styles" / "tokens.css"
COMPONENTS = ROOT / "src" / "components"

# Tailwind's own generic size names. Binding any of these to a Jelly value is
# the regression this file exists to prevent.
GENERIC = ["2xs", "xs", "sm", "base", "md", "lg", "xl",
           "2xl", "3xl", "4xl", "5xl", "6xl"]
# The console ramp. `xs` is deliberately absent: the scale runs 2xs(10) /
# sm(12) / base(13) / md(15) / lg(16) / ... and there is no step between 10 and
# 12. A component wanting "extra small" wants `text-console-sm`.
CONSOLE = ["2xs", "sm", "base", "md", "lg", "xl",
           "2xl", "3xl", "4xl", "5xl", "6xl"]
REQUIRED_SEMANTIC = ["--text-member-body", "--text-h1"]

_ALT = "|".join(sorted(GENERIC, key=len, reverse=True))
# `(?<![\w-])` / `(?![\w-])` rather than \b: \b would happily match inside
# `text-muted-foreground` at the hyphen, and every colour utility would trip.
UTILITY_RE = re.compile(rf"(?<![\w-])text-({_ALT})(?![\w-])")
DECL_RE = re.compile(rf"^\s*--text-({_ALT})\s*:", re.M)


def strip_comments(css: str) -> str:
    """Blank out /* ... */ but keep newlines, so reported line numbers hold."""
    def blank(m):
        return re.sub(r"[^\n]", " ", m.group(0))
    return re.sub(r"/\*.*?\*/", blank, css, flags=re.S)


def theme_inline_block(css: str) -> str:
    m = re.search(r"@theme\s+inline\s*\{(.*?)\n\}", css, re.S)
    if m is None:
        sys.exit("FAIL: no `@theme inline` block found in tokens.css")
    return m.group(1)


def main() -> int:
    failures = []
    raw = TOKENS.read_text()
    css = strip_comments(raw)
    theme = theme_inline_block(css)
    outside_theme = css.replace(theme, "\n" * theme.count("\n"))

    # 1. no bare generic declaration anywhere in the file
    for m in DECL_RE.finditer(css):
        line = css[: m.start()].count("\n") + 1
        failures.append(
            f"tokens.css:{line}: declares `--text-{m.group(1)}`, one of "
            f"Tailwind's own size names. Use `--text-console-{m.group(1)}`. "
            f"A plain :root declaration overrides Tailwind by cascade even "
            f"with no @theme alias, so renaming the alias alone will not fix "
            f"this."
        )

    # 2. no generic alias inside @theme inline
    for m in re.finditer(rf"--text-({_ALT})\s*:", theme):
        failures.append(
            f"tokens.css @theme inline: aliases `--text-{m.group(1)}`, which "
            f"republishes a Tailwind utility name at a Jelly value. Consumers "
            f"get console density by accident -- the exact regression this "
            f"guard exists for."
        )

    # 3. console ramp complete, declared and aliased
    for step in CONSOLE:
        if not re.search(rf"^\s*--text-console-{re.escape(step)}\s*:", outside_theme, re.M):
            failures.append(f"tokens.css: `--text-console-{step}` is not declared")
        if not re.search(rf"--text-console-{re.escape(step)}\s*:", theme):
            failures.append(
                f"tokens.css @theme inline: `--text-console-{step}` is declared "
                f"but not aliased, so `text-console-{step}` is not a utility. "
                f"This fails as unstyled text, not as an error."
            )

    # 4. no component ships a bare generic size utility
    if COMPONENTS.is_dir():
        for f in sorted(COMPONENTS.rglob("*.tsx")):
            for m in UTILITY_RE.finditer(f.read_text()):
                line = f.read_text()[: m.start()].count("\n") + 1
                rel = f.relative_to(ROOT)
                failures.append(
                    f"{rel}:{line}: uses `{m.group(0)}`, which now resolves to "
                    f"Tailwind's stock value rather than a decision. Use "
                    f"`text-console-*` or a member token."
                )

    # 5. the semantic escape hatches survive
    for tok in REQUIRED_SEMANTIC:
        if not re.search(rf"^\s*{re.escape(tok)}\s*:", outside_theme, re.M):
            failures.append(
                f"tokens.css: `{tok}` is missing. It is how a surface opts out "
                f"of console density; without it there is nothing to opt into."
            )

    if failures:
        print(f"FAIL: {len(failures)} type-ramp violation(s)\n", file=sys.stderr)
        for f in failures:
            print(f"  - {f}", file=sys.stderr)
        return 1

    print(
        f"OK: no generic Tailwind size name is bound; console ramp complete "
        f"({len(CONSOLE)} steps); {len(REQUIRED_SEMANTIC)} semantic tokens present."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
