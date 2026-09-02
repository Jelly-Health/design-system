#!/usr/bin/env python3
"""Verify every declared weight token is reachable from a utility.

This is the third instance of one defect shape, and the reason it is a script
and not a review note. A token is declared, nothing binds it, and the result
looks plausible: `verify-type-ramp.py` exists for the `--text-*` case,
`verify-class-merge.mjs` for the `cn()` case, and this file for the weight
scale. In all three the failure is a value that is quietly not the value it
claims to be, with no error, nothing in a diff, and nothing in a screenshot.

  Measured on `origin/main` (7178b67) 2026-09-02, by compiling tokens.css with
  the real Tailwind v4.1.18 and reading `getComputedStyle` in a real Chromium:
  `.font-medium` resolved to **500** and `.font-semibold` to **600** --
  Tailwind's stock scale. tokens.css declares 510 and 590 and calls 590 "the
  ceiling". `@theme inline` bound none of the four weights, so the two
  off-scale stops were unreachable by any utility in the system.

That is the whole point of subsetting the faces WITHOUT `--instancer` (JH211):
the variable weight axis is kept alive so 510 and 590 can render, and
`verify-fonts.py` mutation-tests that the axis survives. The axis was intact
and nothing could ask for it. The static-face rounding tokens.css warns about
was happening anyway, one layer above the font.

    python3 scripts/verify-weight-scale.py

Stdlib only, and text-based on purpose -- the same reasoning `verify.yml`
gives for the ramp check. This package has no lockfile, so a check that needed
an install would be a check that does not run.

── Where this script's notion of the truth comes from ────────────────────────
`verify-class-merge.mjs` shipped a first version that classified using the very
list it was checking, so emptying that list emptied its expectations too and
all three positive mutations reported OK. The equivalent mistake here would be
to read the expected bindings out of `@theme inline` -- the block under test --
which would make an empty block trivially correct.

So the truth is the `:root` declarations: the scale the system says it has.
`@theme inline` is the thing under test, and is never read to decide what
SHOULD be there. The one thing restated below is NAME_MAP, which is a mapping
between two vocabularies (ours and Tailwind's), not a claim about which tokens
exist -- and check 4 fails if it drifts from the declarations in either
direction, so it cannot silently go stale.

Checks:

  1. every `--weight-*` declared in `:root` is bound in `@theme inline` to a
     `--font-weight-*` -- the defect above
  2. every binding points at `var(--weight-<name>)`, not a literal and not a
     different token. A literal at the theme layer is a second place a weight
     can be defined, which is how the scale and the utilities drift apart
  3. no `--font-weight-*` is declared OUTSIDE `@theme inline`. Removing an
     alias is not enough to restore Tailwind's value and neither is adding
     one: a plain `:root` declaration clobbers the theme layer by cascade
     regardless of what `@theme` says. Same trap the `--text-*` note in
     tokens.css documents
  4. NAME_MAP and the declarations agree in both directions -- a declared
     weight with no mapping, or a mapping for a weight that no longer exists
  5. `--font-weight-bold` stays unbound. JH225 decided `font-bold` keeps
     Tailwind's stock 700 rather than being aliased onto `--weight-semibold`,
     because aliasing would silently retype every `font-bold` in a consuming
     app with nothing to review against. That is a decision, so reversing it
     should be deliberate rather than incidental -- see the failure message

── Mutation-tested ───────────────────────────────────────────────────────────
Each applied on its own to a tree that was otherwise passing:

  - deleting `--font-weight-light` binding      -> 1 failure (check 1)
  - deleting `--font-weight-normal` binding     -> 1 failure (check 1)
  - deleting `--font-weight-medium` binding     -> 1 failure (check 1)
  - deleting `--font-weight-semibold` binding   -> 1 failure (check 1)
  - emptying the four bindings, i.e. `origin/main` as it stands
                                                -> 4 failures (check 1)
  - `--font-weight-medium: 510` as a literal    -> 1 failure (check 2)
  - `--font-weight-medium: var(--weight-light)` -> 1 failure (check 2)
  - `--font-weight-medium` added to `:root`     -> 1 failure (check 3)
  - a new `--weight-heavy: 700` in `:root`      -> 1 failure  (check 4). Not
    check 1 as well: check 1 iterates NAME_MAP, so an unmapped token is caught
    only by the drift check -- which is why check 4 exists
  - `--font-weight-bold: var(--weight-semibold)`-> 1 failure (check 5)

Negative controls, which must stay SILENT -- a check that fires on correct
code teaches people to ignore it:

  - `--font-weight-*` appearing in a COMMENT           -> not reported
  - `font-weight: 100 900` in fonts.css                -> not reported; that
    is a face's axis range, not a token, and this script does not read it
  - reordering the four bindings                       -> not reported
  - `--weight-regular` renamed in tokens.css AND NAME_MAP together -> not
    reported, which is correct: renaming the scale is allowed, breaking the
    link between declaration and binding is not
"""
import re
import sys
from pathlib import Path

TOKENS = Path(__file__).resolve().parent.parent / "src" / "styles" / "tokens.css"

# Our vocabulary -> Tailwind's. The ONLY thing restated in this file, and it is
# a translation rather than a source of truth: check 4 fails if it disagrees
# with the declarations in either direction, so it cannot quietly go stale.
NAME_MAP = {
    "light": "light",
    "regular": "normal",
    "medium": "medium",
    "semibold": "semibold",
}

# JH225. `font-bold` is deliberately reachable at Tailwind's stock 700 rather
# than aliased onto the 590 ceiling -- see check 5 and the note in tokens.css.
UNBOUND_BY_DECISION = {"bold"}

DECL_RE = re.compile(r"^\s*--weight-([a-z0-9-]+)\s*:\s*([^;]+);", re.M)
BIND_RE = re.compile(r"^\s*--font-weight-([a-z0-9-]+)\s*:\s*([^;]+);", re.M)


def strip_comments(css: str) -> str:
    """Blank out /* ... */ but keep newlines, so line numbers hold.

    Also the negative control that matters most: `--font-weight-bold` written
    inside a comment explaining why it is absent must not read as a binding.
    """
    return re.sub(r"/\*.*?\*/",
                  lambda m: re.sub(r"[^\n]", " ", m.group(0)), css, flags=re.S)


def theme_inline_block(css: str) -> str:
    m = re.search(r"@theme\s+inline\s*\{(.*?)\n\}", css, re.S)
    if m is None:
        sys.exit("FAIL: no `@theme inline` block found in tokens.css")
    return m.group(1)


def main() -> int:
    failures = []
    css = strip_comments(TOKENS.read_text())
    theme = theme_inline_block(css)
    outside = css.replace(theme, "\n" * theme.count("\n"))

    # TRUTH: what the system says its scale is. Read from the declarations,
    # never from the block under test.
    declared = {m.group(1): m.group(2).strip() for m in DECL_RE.finditer(outside)}
    if not declared:
        sys.exit("FAIL: no `--weight-*` declarations found in tokens.css. "
                 "Either the scale was deleted or this parser is broken; "
                 "both are failures, and neither is a pass.")

    bound = {m.group(1): m.group(2).strip() for m in BIND_RE.finditer(theme)}

    # 4. NAME_MAP vs the declarations, both directions.
    for name in declared:
        if name not in NAME_MAP:
            failures.append(
                f"`--weight-{name}` is declared but NAME_MAP in this script "
                f"has no Tailwind name for it, so nothing checks that it is "
                f"reachable. Add it to NAME_MAP with the utility it should "
                f"back, or delete the token.")
    for name in NAME_MAP:
        if name not in declared:
            failures.append(
                f"NAME_MAP maps `--weight-{name}`, which tokens.css no longer "
                f"declares. Update NAME_MAP -- a mapping for a token that does "
                f"not exist is how this check goes stale without failing.")

    # 1 + 2. Every declared weight bound, and bound to itself.
    for name, tw in NAME_MAP.items():
        if name not in declared:
            continue                      # already reported by check 4
        want = f"var(--weight-{name})"
        if tw not in bound:
            failures.append(
                f"`--weight-{name}: {declared[name]}` is declared but "
                f"`--font-weight-{tw}` is not bound in `@theme inline`, so "
                f"`font-{tw}` resolves to Tailwind's stock scale and the "
                f"declared value is unreachable from any utility. Add "
                f"`--font-weight-{tw}: {want};`")
        elif bound[tw] != want:
            failures.append(
                f"`--font-weight-{tw}` is bound to `{bound[tw]}`, not "
                f"`{want}`. A weight must resolve to the token that declares "
                f"it: a literal or a different token here is a second place "
                f"the scale is defined, and the two drift silently.")

    # 3. Nothing shadowing the theme layer from outside it.
    for m in BIND_RE.finditer(outside):
        failures.append(
            f"`--font-weight-{m.group(1)}` is declared OUTSIDE `@theme "
            f"inline`. A plain declaration clobbers the theme layer by "
            f"cascade regardless of what `@theme` says, so this silently "
            f"wins over the binding. Move it into the `@theme inline` block.")

    # 5. The recorded decision about `font-bold`.
    for name in UNBOUND_BY_DECISION:
        if name in bound:
            failures.append(
                f"`--font-weight-{name}` is bound to `{bound[name]}`. JH225 "
                f"decided `font-{name}` keeps Tailwind's stock value rather "
                f"than being aliased onto another token, because aliasing it "
                f"silently retypes every `font-{name}` already written in a "
                f"consuming app with nothing to review against -- the failure "
                f"the `--text-*` note in tokens.css documents. If that "
                f"decision is being reversed deliberately, remove "
                f"`{name}` from UNBOUND_BY_DECISION in this script and say "
                f"why in tokens.css and on the card.")

    if failures:
        print(f"FAIL: {len(failures)} weight-scale violation(s)\n", file=sys.stderr)
        for f in failures:
            print(f"  - {f}", file=sys.stderr)
        return 1

    print(f"OK: {len(declared)} weight token(s) declared, all bound to a "
          f"`--font-weight-*` utility inside `@theme inline` "
          f"({', '.join(f'font-{t}' for t in sorted(NAME_MAP.values()))}); "
          f"none shadowed from outside it; "
          f"{', '.join(f'font-{n}' for n in sorted(UNBOUND_BY_DECISION))} "
          f"left at Tailwind's stock value by decision.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
