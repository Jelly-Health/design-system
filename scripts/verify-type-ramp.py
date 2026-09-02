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
  5. the member ramp is complete and each step is aliased, for the same reason
     as the console ramp -- these are the entire reason a surface can opt out
     of console density, and a step with no utility fails as unstyled text
  7. no member step in the READING range is fluid. A `clamp()` whose lower
     bound falls below 16px breaks the member body floor at narrow viewports,
     silently, on the surface where the floor matters most, and no other check
     in this repo can see it. Keeping the reading range fixed makes that
     unrepresentable rather than merely discouraged
  8. every fluid step's clamp minimum is at or above the 16px floor. A minimum
     the checker cannot resolve to px -- a `calc()`, a `var()`, a unit this
     does not know -- is REJECTED rather than skipped: a guard that waves
     through what it cannot read is the failure mode this file exists to
     avoid, not an acceptable edge case
  6. every console/member/display step pairs with a `--text-<step>--line-height`
     that references one of the named `--leading-*` tokens. Without a pair,
     Tailwind supplies its own default -- a ratio computed against TAILWIND'S
     font size for that name, not ours, e.g. `text-console-lg` inheriting a
     1.556 ratio derived for Tailwind's stock 18px while rendering at our 16px.
     A bare number (`1.5` instead of `var(--leading-normal)`) passes the same
     failure mode through a second door, so it is rejected too -- the point is
     naming a leading decision, not just having a number.

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
  * deleting the `--text-member-title` alias from `@theme inline`   (check 5)
  * deleting `--text-console-lg--line-height` from `@theme inline`   (check 6)
  * hardcoding `--text-console-lg--line-height: 1.5;`                (check 6)
  * making `--text-member-lede` fluid                                (check 7)
  * lowering `--text-member-section`'s clamp min to 0.75rem          (check 8)
  * writing that min as `calc(1.75rem)`, which cannot be resolved    (check 8)
  * re-declaring `--text-member-lede` fluid in a LATER media query,
    which defeated check 7 until it read every declaration and not
    just the first                                                   (check 7)

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
# The member ramp, split by tier. The split is the point: reading steps are
# fixed and display steps may scale. See checks 7 and 8.
MEMBER_READING = ["caption", "body", "lede", "title"]
MEMBER_DISPLAY = ["section"]
MEMBER = MEMBER_READING + MEMBER_DISPLAY
REQUIRED_SEMANTIC = [f"--text-member-{step}" for step in MEMBER] + ["--text-h1"]
# Steps allowed to carry a clamp(). Everything else must be a fixed size.
FLUID_ALLOWED = [f"--text-member-{step}" for step in MEMBER_DISPLAY] + ["--text-h1"]

# The member body floor, in px. Declared in tokens.css as `--text-member-body`
# and restated here because check 8 has to compare against a number. Assumes a
# 16px root font size, which nothing in this package changes; if that ever
# stops being true, this conversion stops being true with it.
FLOOR_PX = 16.0
ROOT_PX = 16.0

VIEWPORT_UNIT_RE = re.compile(r"(?<![\w-])\d*\.?\d+(vw|vh|vmin|vmax|svw|lvw|dvw)(?![\w-])")
CLAMP_MIN_RE = re.compile(r"clamp\(\s*([^,]+),")

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


def to_px(value: str):
    """Resolve a CSS length to px, or None if it cannot be read with certainty.

    None is a rejection, not a pass. Check 8 treats an unresolvable minimum as
    a failure precisely because the alternative -- skipping it -- is how a
    guard comes to report OK on the thing it was written to catch.
    """
    v = value.strip()
    m = re.fullmatch(r"(\d*\.?\d+)rem", v)
    if m:
        return float(m.group(1)) * ROOT_PX
    m = re.fullmatch(r"(\d*\.?\d+)px", v)
    if m:
        return float(m.group(1))
    return None


def declared_values(css: str, token: str):
    """EVERY value declared for `token` outside @theme inline, in source order.

    All of them, not the first. A token can be re-declared later in the file --
    inside a media query, inside `.dark` -- and the cascade means the LAST one
    is what ships. Reading only the first was a real hole, found by mutation
    while writing check 7: appending

        @media (max-width: 640px) {
          :root { --text-member-lede: clamp(0.75rem, 3vw, 1.25rem); }
        }

    left the file with a 12px fluid reading step and this script still printed
    OK, because the fixed 20px declaration above it was the one being read.
    """
    return [m.group(1).strip()
            for m in re.finditer(rf"^\s*{re.escape(token)}\s*:\s*([^;]+);", css, re.M)]


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

    # 5. the member ramp is complete, declared and aliased -- same shape as
    # check 3, and for the same reason: a step with no utility fails as
    # unstyled text rather than as an error
    for tok in REQUIRED_SEMANTIC:
        if not re.search(rf"^\s*{re.escape(tok)}\s*:", outside_theme, re.M):
            failures.append(
                f"tokens.css: `{tok}` is missing. It is how a surface opts out "
                f"of console density; without it there is nothing to opt into."
            )
        if not re.search(rf"{re.escape(tok)}\s*:", theme):
            failures.append(
                f"tokens.css @theme inline: `{tok}` is declared but not "
                f"aliased, so `{tok.replace('--', '', 1)}` is not a utility. "
                f"This fails as unstyled text, not as an error."
            )

    # 6. every step that has a size also has a leading, and it names a
    # `--leading-*` decision rather than a bare ratio Tailwind would supply
    # anyway or a hand-picked number nobody can find the reasoning for.
    leading_steps = [f"--text-console-{step}" for step in CONSOLE] + REQUIRED_SEMANTIC
    for tok in leading_steps:
        pair_re = rf"{re.escape(tok)}--line-height\s*:\s*([^;]+);"
        m = re.search(pair_re, theme)
        if m is None:
            failures.append(
                f"tokens.css @theme inline: `{tok}--line-height` is missing. "
                f"Without it Tailwind pairs `{tok}` with a default ratio "
                f"computed against Tailwind's own font size for that name, "
                f"which is meaningless once the size is ours."
            )
            continue
        value = m.group(1).strip()
        if not re.fullmatch(r"var\(--leading-[a-z]+\)", value):
            failures.append(
                f"tokens.css @theme inline: `{tok}--line-height: {value}` "
                f"does not reference a named `--leading-*` token. A bare "
                f"number is a leading decision made with no name attached to "
                f"it and no way to tell it apart from a typo."
            )

    # 7. no reading-range member step is fluid. This is the one invariant here
    # that protects a value rather than a name: a clamp lower bound below the
    # floor renders 14px body copy on a phone, passes axe (a small font is not
    # a WCAG failure), and looks correct in every desktop screenshot.
    for tok in [f"--text-member-{step}" for step in MEMBER_READING]:
        for value in declared_values(outside_theme, tok):
            if not ("clamp(" in value or VIEWPORT_UNIT_RE.search(value)):
                continue
            failures.append(
                f"tokens.css: `{tok}: {value}` is fluid, and reading-range "
                f"member steps must be fixed. A clamp whose lower bound falls "
                f"below {FLOOR_PX:.0f}px breaks the member body floor at "
                f"narrow viewports with nothing to see it. Only "
                f"{', '.join(FLUID_ALLOWED)} may scale."
            )

    # 8. every step that IS allowed to scale starts at or above the floor
    for tok in FLUID_ALLOWED:
        for value in declared_values(outside_theme, tok):
            if "clamp(" not in value:
                continue  # allowed to scale, not obliged to
            m = CLAMP_MIN_RE.search(value)
            raw = m.group(1).strip() if m else None
            px = to_px(raw) if raw is not None else None
            if px is None:
                failures.append(
                    f"tokens.css: `{tok}: {value}` has a clamp minimum "
                    f"(`{raw}`) this check cannot resolve to px, so it cannot "
                    f"be shown to sit at or above the {FLOOR_PX:.0f}px floor. "
                    f"Write it as a plain rem or px value. An unreadable bound "
                    f"is rejected rather than skipped on purpose: a guard that "
                    f"waves through what it cannot parse reports OK on exactly "
                    f"the case it exists to catch."
                )
            elif px < FLOOR_PX:
                failures.append(
                    f"tokens.css: `{tok}` starts at {px:.0f}px, below the "
                    f"{FLOOR_PX:.0f}px member body floor `--text-member-body` "
                    f"declares. At a narrow viewport this renders "
                    f"member-facing text under the floor, and nothing else in "
                    f"this repo can see it happen."
                )

    if failures:
        print(f"FAIL: {len(failures)} type-ramp violation(s)\n", file=sys.stderr)
        for f in failures:
            print(f"  - {f}", file=sys.stderr)
        return 1

    print(
        f"OK: no generic Tailwind size name is bound; console ramp complete "
        f"({len(CONSOLE)} steps); member ramp complete ({len(MEMBER)} steps, "
        f"{len(MEMBER_READING)} fixed); {len(leading_steps)} steps paired with "
        f"a named leading; {len(FLUID_ALLOWED)} fluid steps at or above the "
        f"{FLOOR_PX:.0f}px floor."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
