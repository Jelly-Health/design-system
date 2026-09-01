#!/usr/bin/env bash
# Subset the Inter Variable faces and write the result into src/fonts/ -- the
# files the package actually ships. Emits FOUR files, not two: each face is split
# into a `latin` and a `latin-ext` slice, and src/styles/fonts.css gives each one
# a `unicode-range` so the browser downloads only the slices a page really uses.
#
# WHY THIS EXISTS
# ---------------
# The unsubsetted faces broke a consumer's performance budget. Measured on
# Jelly-Health/website (JH211, 2026-09-01) on Lighthouse's throttled mobile
# profile:
#
#     performance  0.97 -> 0.85   (floor 0.90)
#     FCP           1.0s -> 2.7s
#     LCP           2.1s -> 3.8s  (budget 2500ms)
#
# Proven by a controlled run on a single commit: importing `tokens.css` alone
# scored 1.00, importing `styles` (tokens + fonts) scored 0.85. The tokens cost
# nothing; the font bytes were the entire regression.
#
# WHY SPLIT RATHER THAN JUST SUBSET
# ---------------------------------
# Subsetting to Latin+Ext as one file got InterVariable to 154KB and LCP to a
# median 2562ms -- still over budget. Splitting takes the slice an
# English-language page actually downloads to 67KB:
#
#     original            352,240
#     Latin+Ext, one file 154,540
#     latin slice          66,792   <- what a page of English costs
#
# latin-ext is NOT dropped. It is deferred. A member or clinician name with a
# diacritic still renders in Inter; the browser simply fetches that slice when a
# character in its range appears. Do not "simplify" this back to one file.
#
# A THIRD OUTPUT PER FACE, FOR CONSUMERS THAT CANNOT EXPRESS unicode-range
# ------------------------------------------------------------------------
# The split above only works if the consumer can attach a `unicode-range` to each
# slice. src/styles/fonts.css does, so Jelly-Health/website gets the 67KB path.
#
# web-app/v2 CANNOT. It loads these faces through `next/font/local`, deliberately
# -- that generates a size-adjusted fallback so the swap does not reflow, and it
# emits --font-sans-loaded, which v2's tests/e2e/basepath.spec.ts asserts on.
# Neither is achievable with a bare @font-face. And `next/font/local`'s src
# entries accept only { path, weight, style }: there is NO unicodeRange option,
# and the top-level `declarations` applies to every generated face, so it cannot
# express per-file ranges either. Two src entries with identical family/weight/
# style do not fall through -- without unicode-range the later face simply wins.
#
# So v2 needs ONE file per face. It gets the combined Latin+Ext cut: 154KB rather
# than the 352KB original, and it keeps full extended-Latin coverage, which
# matters because these are patient and clinician names.
#
#     original             352,240
#     latinext, one file   154,540   <- what web-app/v2 loads
#     latin slice           66,792   <- what a page of English costs on the site
#
# Deleting these two files breaks v2's build outright: `Font file not found`.
# That is exactly how this gap was found (2026-09-01) -- the split shipped, v2
# re-pinned, and the build failed on a filename that no longer existed.
#
# THE SOURCE FILES ARE IN fonts-src/, NOT src/fonts/
# --------------------------------------------------
# src/fonts/ holds the subset OUTPUT and is overwritten by this script. The full
# originals live in fonts-src/, which `package.json` `files` does not ship, so
# consumers never download them. Keeping them in the repo is what makes the
# ranges wideable later -- a subset cannot be widened by re-subsetting itself.
#
#   Upstream: Inter (SIL OFL) -- https://rsms.me/inter/
#   Mono:     IBM Plex Mono is already ~10KB per face and is NOT subset here.
#
# Requires fontTools and brotli:  pip install fonttools brotli
#
set -euo pipefail
cd "$(dirname "$0")/.."

command -v pyftsubset >/dev/null 2>&1 || {
  echo "pyftsubset not found. pip install fonttools brotli" >&2
  exit 1
}

# Google Fonts' `latin` and `latin-ext` ranges. These strings are duplicated as
# `unicode-range` declarations in src/styles/fonts.css and the two MUST agree --
# a character inside a face's unicode-range but absent from its file renders as
# tofu rather than falling through to the other slice.
LATIN="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,\
U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD"
LATIN_EXT="U+0100-02AF,U+0304,U+0308,U+0329,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,\
U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF"

# Every entry here is load-bearing. Inter ships 43 features; `*` keeps all of
# them and their glyphs for ~47KB nothing in this system asks for -- the
# stylistic sets ss01-ss08, character variants cv01-cv14, fractions, ordinals,
# super/subscripts.
#
#   ccmp, mark, mkmk  combining-mark composition and positioning. Load-bearing
#                     BECAUSE Latin Extended is kept: without them a stacked
#                     diacritic mispositions instead of failing visibly.
#   kern liga clig calt rlig   normal Latin text rendering.
#   locl              language-specific forms.
#   tnum              tokens.css --numeric-console: tabular-nums.
#   pnum              tokens.css --numeric-member: proportional-nums.
#
# ⚠️ tnum and pnum are BOTH required, and dropping either is silent -- numbers
# just stop being tabular (console columns misalign) or stop being proportional.
# scripts/verify-fonts.py asserts both, and is mutation-tested against exactly
# this slip.
FEATURES='ccmp,kern,liga,clig,calt,rlig,locl,tnum,pnum,mark,mkmk'

total_before=0
total_latin=0

for face in InterVariable InterVariable-Italic; do
  src="fonts-src/${face}.woff2"
  [ -f "$src" ] || { echo "missing source: $src" >&2; exit 1; }
  before=$(wc -c < "$src" | tr -d ' ')
  total_before=$((total_before + before))

  for slice in latin ext latinext; do
    case "$slice" in
      latin)    unicodes="$LATIN" ;;
      ext)      unicodes="$LATIN_EXT" ;;
      latinext) unicodes="${LATIN},${LATIN_EXT}" ;;
    esac
    out="src/fonts/${face}-${slice}.woff2"

    # No --instancer / --variations flag, deliberately: instancing flattens the
    # weight axis, and the band is 300/400/510/590. 510 and 590 exist ONLY on
    # that axis -- a static face rounds them to 500 and 600, which passes review
    # and is wrong. Instancing also makes the file dramatically smaller, so it
    # is a tempting mistake. See src/styles/fonts.css.
    pyftsubset "$src" \
      --output-file="$out" \
      --flavor=woff2 \
      --layout-features="$FEATURES" \
      --name-IDs='*' \
      --name-legacy \
      --name-languages='*' \
      --unicodes="$unicodes"

    after=$(wc -c < "$out" | tr -d ' ')
    [ "$slice" = latin ] && total_latin=$((total_latin + after))
    printf '%-30s %8s bytes\n' "${face}-${slice}.woff2" "$after"
  done
done

# The old undivided files, if a previous revision left them behind. Leaving one
# in place would ship a file no @font-face references.
rm -f src/fonts/InterVariable.woff2 src/fonts/InterVariable-Italic.woff2

echo
printf 'sources %s bytes -> %s bytes actually downloaded by a page of English (%d%% less)\n' \
  "$total_before" "$total_latin" "$(( 100 - (total_latin * 100 / total_before) ))"
echo
echo "Now verify nothing load-bearing was trimmed:  python3 scripts/verify-fonts.py"
