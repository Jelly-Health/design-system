#!/usr/bin/env python3
"""Recompute every text-on-surface contrast pair in tokens.css, both themes.

The README has claimed "150 contrast pairs recomputed: 0 failures, 7 tight" since JH196.  It was a
sentence, not a check — nothing recomputed it, and nothing noticed when a role moved.  This script is
the check.  JH208.

What it enforces, in order of how likely each is to catch something:

  1. Every colour role in `tokens.css` is CLASSIFIED — surface, foreground, or exempt with a reason.
     A new role that nobody classified fails here rather than being silently skipped, which is the
     only property that keeps the other four honest as the file grows.
  2. Every pair in the table below clears its floor: 4.5:1 for text, 3:1 for non-text (WCAG 1.4.3 /
     1.4.11).  Both themes, computed from the hexes in the file rather than from any recorded table.
  3. Every ratio QUOTED IN A COMMENT in tokens.css matches the computed value to 2dp.  The file says
     things like `--line-strong: #8A8577;  /* tight: 3.07 on --mut */`; those numbers are assertions
     and they go stale silently.
  4. Every pair the file marks `tight` really is tight, and every tight pair is marked.  Tight means
     within 0.15 of its floor — close enough that the next nudge to either value breaks it.
  5. The pair count and the failure count are printed, so the README can cite a command instead of a
     memory.

Run:  python3 scripts/verify-contrast.py [--table]
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

TOKENS = Path(__file__).resolve().parent.parent / "src" / "styles" / "tokens.css"

TEXT_FLOOR = 4.5      # WCAG 1.4.3, normal-size text
NON_TEXT_FLOOR = 3.0  # WCAG 1.4.11, UI component and graphical boundaries
TIGHT_MARGIN = 0.15

# ── The pairing table ─────────────────────────────────────────────────────────────────────────
# Which foreground can land on which surface.  Written out rather than derived, because "can land
# on" is a product fact and no amount of parsing recovers it.  Each entry cites why it is here; a
# reviewer disagreeing with one of these should edit THIS table, which is the point of it existing.

NEUTRAL = ["bg", "sur", "card", "mut-soft", "mut"]        # the five paper steps, --secondary == --mut
WARM = ["voice-provider", "voice-coordinator"]            # the two warm bubble fills
SEMANTIC = ["danger-surface", "success-surface"]          # tinted state surfaces

FOREGROUNDS: dict[str, tuple[float, list[str], str]] = {
    # role: (floor, surfaces, why this lands there)
    "ink":            (TEXT_FLOOR, NEUTRAL + WARM + SEMANTIC, "primary text, every surface"),
    "ink-2":          (TEXT_FLOOR, NEUTRAL + WARM + SEMANTIC, "secondary prose and meaningful metadata"),
    "ink-3":          (TEXT_FLOOR, NEUTRAL + WARM + SEMANTIC, "labels and timestamps — 'quiet, never unreadable'"),
    "accent-ink":     (TEXT_FLOOR, NEUTRAL + WARM, "the accent AS TEXT on a page surface (its own comment)"),
    "danger":         (TEXT_FLOOR, NEUTRAL + ["danger-surface"], "error text on a page or on its own tinted surface"),
    "success-ink":    (TEXT_FLOOR, NEUTRAL + ["success-surface"], "'only for a fact that already happened'"),
    "accent-on-accent": (TEXT_FLOOR, ["accent-fill"], "text and icons sitting on the accent fill"),
    "voice-on-member":  (TEXT_FLOOR, ["accent-fill"], "the member's own words; --voice-member aliases --accent-fill"),
    "danger-on-danger": (TEXT_FLOOR, ["danger"], "--destructive-foreground on --destructive"),
    "line-strong":    (NON_TEXT_FLOOR, NEUTRAL + WARM, "BOUNDS rather than separates — 'meets 3:1, a NON-TEXT threshold'"),
    "pending-rule":   (NON_TEXT_FLOOR, NEUTRAL + WARM, "the rule under an unapproved clinical value; same value as --line-strong"),
    "ring":           (NON_TEXT_FLOOR, NEUTRAL + WARM, "focus ring on page surfaces"),
    "ring-on-accent": (NON_TEXT_FLOOR, ["accent-fill"], "the inverse ring: '--ring on --accent-fill measures 1.77'"),
    "accent-fill":    (NON_TEXT_FLOOR, NEUTRAL, "a filled control has to be perceivable against the page"),
}

SURFACES = sorted({s for _, surfaces, _ in FOREGROUNDS.values() for s in surfaces})

EXEMPT: dict[str, str] = {
    "line": "SEPARATES rather than bounds — exempt from 3:1 by intent, stated at its declaration",
    "secondary": "a surface, same value as --mut, and covered by every pair that names --mut",
}


# ── Colour maths ──────────────────────────────────────────────────────────────────────────────

def srgb_to_linear(c: float) -> float:
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def relative_luminance(hex_colour: str) -> float:
    h = hex_colour.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    return 0.2126 * srgb_to_linear(r) + 0.7152 * srgb_to_linear(g) + 0.0722 * srgb_to_linear(b)


def contrast(fg: str, bg: str) -> float:
    a, b = relative_luminance(fg), relative_luminance(bg)
    lighter, darker = max(a, b), min(a, b)
    return (lighter + 0.05) / (darker + 0.05)


# ── Parsing ───────────────────────────────────────────────────────────────────────────────────

DECL = re.compile(r"^\s*--([a-z0-9-]+)\s*:\s*(#[0-9A-Fa-f]{6})\s*;(.*)$")


def block(css: str, selector: str) -> str:
    """The body of the first top-level block opened by `selector`."""
    start = css.index(selector)
    start = css.index("{", start) + 1
    depth, i = 1, start
    while depth:
        if css[i] == "{":
            depth += 1
        elif css[i] == "}":
            depth -= 1
        i += 1
    return css[start:i - 1]


def roles(body: str) -> tuple[dict[str, str], dict[str, str]]:
    """`{role: hex}` and `{role: trailing comment}` for one theme block."""
    values, comments = {}, {}
    for line in body.splitlines():
        m = DECL.match(line)
        if m:
            values[m.group(1)] = m.group(2).upper()
            comments[m.group(1)] = m.group(3)
    return values, comments


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--table", action="store_true", help="print every pair, not only the failures")
    args = ap.parse_args()

    css = TOKENS.read_text()
    light, light_comments = roles(block(css, ":root {"))
    dark, dark_comments = roles(block(css, ".dark {"))

    # --voice-system and --voice-member are aliases in the dual block, by necessity: declared in
    # :root alone they would keep the light value inside .dark.  Resolve them so the surfaces they
    # name are the ones actually painted.
    for theme in (light, dark):
        theme["voice-system"] = theme["card"]
        theme["voice-member"] = theme["accent-fill"]

    failures: list[str] = []
    rows: list[tuple[str, str, str, float, float, bool]] = []

    # 1 · every role classified
    classified = set(FOREGROUNDS) | set(SURFACES) | set(EXEMPT) | {"voice-system", "voice-member"}
    for theme_name, theme in (("light", light), ("dark", dark)):
        for role in theme:
            if role not in classified:
                failures.append(
                    f"UNCLASSIFIED  --{role} ({theme_name}) is a colour role that no pair, surface "
                    f"or exemption names. Add it to FOREGROUNDS, to a surface list, or to EXEMPT "
                    f"with the reason."
                )

    # 2 · every pair clears its floor
    for theme_name, theme in (("light", light), ("dark", dark)):
        for fg, (floor, surfaces, _why) in FOREGROUNDS.items():
            for bg in surfaces:
                if fg not in theme or bg not in theme:
                    failures.append(f"MISSING  --{fg} or --{bg} is absent from the {theme_name} block")
                    continue
                ratio = contrast(theme[fg], theme[bg])
                tight = ratio < floor + TIGHT_MARGIN
                rows.append((theme_name, fg, bg, ratio, floor, tight))
                if ratio < floor:
                    failures.append(
                        f"FAILS  {theme_name}: --{fg} ({theme[fg]}) on --{bg} ({theme[bg]}) "
                        f"= {ratio:.2f}, floor {floor}"
                    )

    # 3 · every ratio quoted in a comment matches the computed value
    # Two phrasings appear in the file: "tight: 3.07 on --mut" and "--ring on --accent-fill
    # measures 1.77". The second names its own foreground, so it is checked as an explicit pair.
    quoted = re.compile(r"(\d+\.\d{2})\s+on\s+--([a-z0-9-]+)")
    quoted_pair = re.compile(r"--([a-z0-9-]+)\s+on\s+--([a-z0-9-]+)\s+measures\s+(\d+\.\d{2})")
    for theme_name, comments, theme in (("light", light_comments, light), ("dark", dark_comments, dark)):
        for role, comment in comments.items():
            for claimed, bg in quoted.findall(comment):
                if bg not in theme:
                    failures.append(f"STALE COMMENT  {theme_name}: --{role} names --{bg}, which does not exist")
                    continue
                actual = contrast(theme[role], theme[bg])
                if abs(actual - float(claimed)) >= 0.005:
                    failures.append(
                        f"STALE COMMENT  {theme_name}: --{role}'s comment says {claimed} on --{bg}, "
                        f"computed {actual:.2f}"
                    )

            for fg2, bg2, claimed in quoted_pair.findall(comment):
                if fg2 not in theme or bg2 not in theme:
                    failures.append(f"STALE COMMENT  {theme_name}: --{role} names a role that does not exist")
                    continue
                actual = contrast(theme[fg2], theme[bg2])
                if abs(actual - float(claimed)) >= 0.005:
                    failures.append(
                        f"STALE COMMENT  {theme_name}: --{role}'s comment says --{fg2} on --{bg2} "
                        f"measures {claimed}, computed {actual:.2f}"
                    )

    # 4 · tight both ways
    marked = set()
    for theme_name, comments in (("light", light_comments), ("dark", dark_comments)):
        for role, comment in comments.items():
            if "tight" in comment.lower():
                for _claimed, bg in quoted.findall(comment):
                    marked.add((theme_name, role, bg))

    computed_tight = {(t, fg, bg) for t, fg, bg, _r, _f, tight in rows if tight}
    for pair in sorted(marked - computed_tight):
        failures.append(f"MARKED TIGHT BUT IS NOT  {pair[0]}: --{pair[1]} on --{pair[2]}")
    for pair in sorted(computed_tight - marked):
        t, fg, bg = pair
        ratio = next(r for tn, f, b, r, _fl, _ti in rows if (tn, f, b) == pair)
        failures.append(
            f"TIGHT BUT NOT MARKED  {t}: --{fg} on --{bg} = {ratio:.2f} — annotate it at the "
            f"declaration as the others are, so the next edit knows"
        )

    if args.table:
        print(f"{'theme':<6} {'foreground':<18} {'surface':<18} {'ratio':>6}  floor  ")
        for theme_name, fg, bg, ratio, floor, tight in rows:
            print(f"{theme_name:<6} --{fg:<16} --{bg:<16} {ratio:>6.2f}  {floor:<5} {'tight' if tight else ''}")
        print()

    print(f"{len(rows)} pairs ({len(rows) // 2} per theme) · "
          f"{sum(1 for r in rows if r[5])} tight · {len(failures)} failures")

    if failures:
        print()
        for f in failures:
            print(f"  {f}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
