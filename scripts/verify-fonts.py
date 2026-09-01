#!/usr/bin/env python3
"""Verify the shipped faces still carry everything the stylesheets depend on.

A bad subset does not fail loudly. The font loads, the page renders, and
something is quietly wrong -- which is precisely the failure fonts.css warns
about: 510 and 590 exist only on the variable weight axis, and a face without
that axis rounds them to 500 and 600, close enough to pass review and wrong.
Instancing the axis away also makes the file *much smaller*, so it is a
tempting mistake, not an unlikely one.

Checks the things a rendered page cannot tell you:

  1. every file fonts.css references exists, and nothing ships unreferenced
  2. every `unicode-range` in fonts.css matches scripts/subset-fonts.sh. A
     character inside a face's declared range but absent from its file renders
     as TOFU -- the browser has been told that slice owns it, so it never falls
     through to the other slice
  3. the variable faces keep fvar with a wght axis spanning the declared band,
     and the opsz axis (fonts.css sets font-optical-sizing: auto, a no-op
     without it)
  4. tnum and pnum survive -- tokens.css sets --numeric-console: tabular-nums
     and --numeric-member: proportional-nums. The subset trims features
     explicitly, so this is what stops that trim going one entry too far
  5. ccmp/mark survive, because Latin Extended is kept and without them a
     stacked diacritic mispositions rather than failing visibly
  6. each slice actually covers the characters its range promises

Exits non-zero on any failure, so CI can run it.

    pip install fonttools brotli && python3 scripts/verify-fonts.py

This script is mutation-tested: dropping tnum from the feature list and
instancing the weight axis both make it fail. A guard that has never failed is
not evidence.
"""
import re
import sys
from pathlib import Path

from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
FONTS_CSS = ROOT / "src/styles/fonts.css"
SUBSET_SH = ROOT / "scripts/subset-fonts.sh"

# Weight band declared in tokens.css (--weight-light .. --weight-semibold).
NEEDED_WEIGHTS = (300, 400, 510, 590)

# Required of EVERY text slice.
REQUIRED_FEATURES = {
    "ccmp": "combining-mark composition (needed because Latin Extended is kept)",
    "mark": "combining-mark positioning (needed because Latin Extended is kept)",
    "kern": "kerning",
}

# Required only of the slice that actually contains digits.
#
# The figure features are checked on `latin` alone because U+0030-0039 live in
# the latin range, so the ext slice has no digits for tnum/pnum to act on and
# pyftsubset drops them as inert. That is correct behaviour, not a trim gone too
# far -- every digit on every page is served by the latin slice. Do not "fix"
# this by demanding them everywhere; it would fail on a correct build.
FIGURE_FEATURES = {
    "tnum": "tokens.css --numeric-console: tabular-nums",
    "pnum": "tokens.css --numeric-member: proportional-nums",
}
# Slices whose range covers the ASCII digits, and which therefore must carry the
# figure features. `latinext` is the combined cut web-app/v2 loads.
HAS_DIGITS = {"latin", "latinext"}

# Characters each slice promises. Latin Extended is sampled from real name
# orthographies -- French, Spanish, Polish, Czech, Turkish, Romanian, Hungarian
# -- because names are why that range is kept at all.
SAMPLES = {
    "latin": "AaZz09éñüçßıœ€£–—'\"…",
    "ext": "łżćšČžğșțőűā",
}
# The combined cut promises both ranges at once, so it must satisfy both samples.
# Derived rather than written out, so widening either range cannot leave this stale.
SAMPLES["latinext"] = SAMPLES["latin"] + SAMPLES["ext"]

failures: list[str] = []


def parse_ranges(text: str) -> list[set[str]]:
    """Every `unicode-range` block in fonts.css, normalised to a set of tokens."""
    return [
        {t.strip().upper() for t in body.split(",") if t.strip()}
        for body in re.findall(r"unicode-range:\s*([^;]+);", text, re.I)
    ]


def script_ranges() -> dict[str, set[str]]:
    """LATIN / LATIN_EXT as assigned in subset-fonts.sh (continuations joined)."""
    text = SUBSET_SH.read_text().replace("\\\n", "")
    out: dict[str, set[str]] = {}
    for var in ("LATIN", "LATIN_EXT"):
        m = re.search(rf'^{var}="([^"]+)"', text, re.M)
        if m:
            out[var] = {t.strip().upper() for t in m.group(1).split(",") if t.strip()}
    return out


def check_font(path: Path, *, variable: bool, sample_key: str | None,
               expect_italic: bool = False) -> None:
    """`variable` and `sample_key` follow what fonts.css actually declares.

    IBM Plex Mono is declared at two FIXED weights, so it is static by design and
    has no axis to lose, and it carries only what identifiers need -- holding it
    to Inter's contract would just teach the reader to ignore this output.
    """
    name = path.name
    if not path.exists():
        failures.append(f"{name}: missing")
        return

    font = TTFont(path)
    axes: dict[str, tuple[float, float]] = {}

    if variable:
        if "fvar" not in font:
            failures.append(f"{name}: NO fvar -- the variable axes are gone (instanced?)")
            return
        axes = {a.axisTag: (a.minValue, a.maxValue) for a in font["fvar"].axes}
        if "wght" not in axes:
            failures.append(f"{name}: no wght axis")
        else:
            lo, hi = axes["wght"]
            bad = [w for w in NEEDED_WEIGHTS if not (lo <= w <= hi)]
            if bad:
                failures.append(f"{name}: wght {lo}-{hi} cannot express {bad}")
        if "opsz" not in axes:
            failures.append(f"{name}: no opsz -- font-optical-sizing:auto is a no-op")
    elif "fvar" in font:
        failures.append(f"{name}: unexpectedly variable -- declared at a fixed weight")

    features: set[str] = set()
    for tag in ("GSUB", "GPOS"):
        if tag in font and font[tag].table.FeatureList:
            features |= {r.FeatureTag for r in font[tag].table.FeatureList.FeatureRecord}

    cmap = font.getBestCmap()

    if sample_key:
        expected = dict(REQUIRED_FEATURES)
        if sample_key in HAS_DIGITS:
            expected.update(FIGURE_FEATURES)
        for feat, why in expected.items():
            if feat not in features:
                failures.append(f"{name}: no {feat} -- {why} silently stops working")
        missing = [c for c in SAMPLES[sample_key] if ord(c) not in cmap]
        if missing:
            failures.append(
                f"{name}: range promises characters the file lacks -> TOFU: {''.join(missing)!r}"
            )

    if expect_italic:
        subfamily = str(font["name"].getDebugName(2) or "")
        if not (font["head"].macStyle & 0b10 or "Italic" in subfamily):
            failures.append(f"{name}: expected an italic face, got upright")

    nums = "tnum" in features and "pnum" in features  # digits live in the latin slice only
    print(
        f"  {name:36} {path.stat().st_size:>7,} b  "
        f"axes={','.join(sorted(axes)) or '-':<9} "
        f"num={str(nums):<5} glyphs={len(cmap)}"
    )


print("Shipped faces (src/fonts/):")
for face in ("InterVariable", "InterVariable-Italic"):
    for slice_ in ("latin", "ext", "latinext"):
        check_font(
            ROOT / f"src/fonts/{face}-{slice_}.woff2",
            variable=True,
            sample_key=slice_,
            expect_italic="Italic" in face,
        )
for weight in (400, 500):
    check_font(ROOT / f"src/fonts/IBMPlexMono-{weight}.woff2", variable=False, sample_key=None)

css = FONTS_CSS.read_text()
referenced = set(re.findall(r'url\("\.\./fonts/([^"]+)"\)', css))

# 1: no @font-face may point at a file that is not there...
for ref in sorted(referenced):
    if not (ROOT / "src/fonts" / ref).exists():
        failures.append(f"fonts.css references src/fonts/{ref}, which does not exist")

# The combined Latin+Ext cuts. These deliberately have NO @font-face in fonts.css:
# they exist for web-app/v2, which loads faces through `next/font/local` and so
# cannot attach a `unicode-range` to a slice (its src entries take only
# { path, weight, style }). v2 gets one 154KB file per face instead of the 352KB
# original; the website keeps the 67KB latin slice. See scripts/subset-fonts.sh.
NEXT_FONT_FACES = {
    "InterVariable-latinext.woff2",
    "InterVariable-Italic-latinext.woff2",
}

# 1b: ...and nothing may ship that no @font-face references. This is what catches
# an old undivided face left behind by a previous revision: harmless to render,
# but it is dead weight in every consumer's install.
for f in sorted((ROOT / "src/fonts").glob("*.woff2")):
    if f.name not in referenced and f.name not in NEXT_FONT_FACES:
        failures.append(f"src/fonts/{f.name} ships but no @font-face references it")

# 1c: the combined cuts must ship, and must stay unreferenced. Deleting one breaks
# v2's build outright with `Font file not found` -- which is exactly how this gap
# was found on 2026-09-01, after the split shipped and v2 re-pinned onto it.
# Referencing one from fonts.css would hand the website a 154KB face in place of
# the 67KB slice, silently undoing the Lighthouse fix that motivated the split.
for name in sorted(NEXT_FONT_FACES):
    if not (ROOT / "src/fonts" / name).exists():
        failures.append(f"src/fonts/{name} is missing -- web-app/v2 cannot build without it")
    if name in referenced:
        failures.append(f"fonts.css references {name}; that reverts the site to an unsplit face")

# 2: the ranges on both sides must agree, or the split produces tofu.
sh = script_ranges()
if not sh:
    failures.append("could not read LATIN/LATIN_EXT out of subset-fonts.sh")
else:
    for block in parse_ranges(css):
        if block not in (sh.get("LATIN"), sh.get("LATIN_EXT")):
            failures.append(
                "a unicode-range in fonts.css matches neither LATIN nor LATIN_EXT in "
                f"subset-fonts.sh -- regenerate rather than hand-edit one side: {sorted(block)}"
            )

if failures:
    print("\nFAILED:")
    for f in failures:
        print(f"  - {f}")
    sys.exit(1)

print("\nOK -- axes, features, slice coverage and unicode-range agreement all intact.")
