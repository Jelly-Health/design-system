# `@jelly-health/design-system`

> # ✅ The extraction has landed
>
> **`src/styles/tokens.css` is now the source of truth for colour and radius.** Extracted
> 2026-08-31 (JH206) from `web-app` `origin/main:v2/app/globals.css`, values verbatim — 115
> declarations, diffed to confirm nothing changed in the move.
>
> The file this replaces was hand-transcribed on 2026-08-30 from a checkout 147 commits behind
> `origin/main`, carried older canvas values, and was marked "do not build against it". That notice
> is now obsolete and this replaces it.
>
> **What changed in the move: nothing.** The commit is deliberately inert — same values, new home —
> so that a rendering failure here can only be a plumbing failure, never a design change. The design
> pass's values, and the type, spacing, shape and motion scales, arrive in a later commit.

Design tokens and components shared by **`Jelly-Health/website`** (marketing) and
**`web-app/v2`** (the patient app and clinical console).

**Created 2026-08-30** · Card: [JH138](https://trello.com/c/9BYx5GAH)

---

## Why this repo exists

Jelly Health has two faces that have to feel like one product, and they pull in opposite directions:

| | Patient-facing | Clinical console |
|---|---|---|
| Device | Mobile-first | Desktop, ~1280px floor — **not a mobile surface** |
| Density | Sparse, usually one screen doing one job | Dense; the physician is in it all day |
| Input | Touch | Keyboard-driven |

In v1 they diverged. Colour ended up hardcoded in 157 separate places, components were added ad hoc as
each page needed them, and the admin screens visibly read as a different product from the marketing
pages.

**The alternative to this repo was putting the system in one of the two apps.** That was rejected on
2026-08-30: whichever app owned it would own the *other* app's tokens too, and the marketing site — which
needs roughly 40% of the system and none of the console density work — was the one the plan originally
named. That is the v1 split with the roles reversed.

**The cost we accepted:** a release step between two repos that deploy independently. Recorded here so
it does not get re-litigated as though nobody had thought about it.

---

## What is in here

**Settled, and safe to build against:**

- **11 semantic colour roles, bound light and dark** — `bg`, `sur`, `card`, `ink`, `ink2`, `ink3`,
  `mut`, `line`, `ring`, `dang`, `accink`. Transcribed from the v9 design canvases, not invented here.
  The names are the canvases' own and stay that way, so the design and the code speak one language.
- **Inter Variable**, self-hosted, plus IBM Plex Mono for identifiers. (This bullet said *Overused
  Grotesk* until 2026-09-01; that typeface was retired during the design pass and the sentence had
  simply been left behind — the table below has been right since JH206.)
- `cn()`, so a component from this package and a component written in an app resolve class conflicts
  identically — and, since 2026-09-02, resolve them *correctly*: it now tells tailwind-merge which
  `text-*` names are font sizes, without which they were being silently deleted by colour classes
  and vice versa. See § *`cn()` knows this package's font sizes*.
- **The member state patterns** — loading, empty, failed, and the overflow rules — added 2026-09-02
  by JH218. Not four components so much as one type that makes three of the four impossible to
  confuse: see § *The four states*.
- **The three member screen shells** — the task screen, the onboarding step and the portal —
  added 2026-09-02 by JH219. Each is one product decision about what a member is allowed to see and
  reach, not a layout: no navigation on a task screen, no progress meter in onboarding, no unread
  count in the portal. See § *The member screen chrome*.

## What landed, and what is still absent

**Type, spacing, shape and motion scales are now here.** They were withheld until the design pass
produced them — a plausible guess written earlier would have become the system by default. The pass
shipped as `jh-design-system-v10` and JH206 commit 3 brought all four in, along with the designed
colour values.

| | State |
|---|---|
| Colour | 25 roles, both themes. **152 contrast pairs**, recomputed from the values in this file by `scripts/verify-contrast.py`: **0 failures**, 10 within 0.15 of their floor and marked `tight` at the declaration ([how](#contrast-is-computed-not-remembered)) |
| Type | Inter Variable (single family — Source Serif 4 retired), weights 300/400/510/590 bound to `font-light`/`font-normal`/`font-medium`/`font-semibold` (see [Weights are bound](#weights-are-bound-and-510590-are-the-point)), 11-step size ramp **under `--text-console-*`** (see [Type: sizes are prefixed](#type-sizes-are-prefixed-and-that-is-the-point)), negative tracking scaled to size |
| Spacing | 8px base, 9 steps plus named surface paddings and a 44px member touch floor |
| Shape | Split radius vocabulary — 6px buttons, 12px cards, 4px badges, 12px ceiling — plus one floating-layer shadow |
| Motion | 100/120/200ms, one easing curve, focus-ring geometry |
| Components | The 19 shadcn primitives (`accordion` through `tooltip`), extracted from `web-app/v2/components/ui/` by **JH207**, plus `toast` — the one primitive the canvases never drew until **JH202**/**JH224** — bringing the set to 20. `src/index.ts` exports all of them; `./ui/*` subpath exports the same components individually |

**Still absent: the designed variant sheets.** The primitives carry their pre-design-pass geometry —
`focus-visible:ring-[3px]` and `tw-animate-css` defaults, not the shipped `--ring-width`/`--ring-offset`
or the `--duration-*` scale — and badge is `rounded-md` (6px) where JH198 specifies 4px for badges.
None of that is an extraction defect: JH207's brief was "move the primitives, change nothing about
their design", and connecting them to the designed vocabulary is a real design decision left to
**JH201** (variant sheets) rather than made implicitly here.

### Known gaps, recorded rather than hidden

- ~~**Font payload grew by ~509KB.**~~ **Fixed 2026-09-01 (JH211).** The faces are now subset and
  split into `latin` / `latin-ext` slices, each with its own `unicode-range`, so a page downloads
  only the slices it uses. **A page of English costs 67KB where it used to cost 352KB — 81% less.**
  Regenerate with `scripts/subset-fonts.sh`; the full originals live in `fonts-src/`, which is not
  shipped. `scripts/verify-fonts.py` asserts the axes, `tnum`/`pnum`, mark positioning, slice
  coverage and range agreement, and is mutation-tested against both ways of getting it wrong.

  This was not housekeeping. Unsubset, the fonts broke the marketing site's mobile Lighthouse budget
  outright — measured on `Jelly-Health/website`: performance 0.97 → 0.85 against a 0.90 floor, LCP
  2.1s → 3.8s against a 2500ms budget. Subsetting to one Latin+Ext file was **not enough** (median
  LCP 2562ms, still failing); the `unicode-range` split is what brought it to 2048ms.
- **The legacy `--jh-*` brand ramp is deprecated but still shipped.** 22 live call sites in `v2`
  (`brand-300` ×19, `brand-700` ×2, `brand-025` ×1). It is re-pointed onto roles so those sites stay
  on-palette; it should shrink to nothing as they are touched.
- ~~**There is no member/marketing type ramp.**~~ **Fixed 2026-09-01 (JH214).** Five role-named
  steps, `--text-member-caption` through `--text-member-section` — see § *Type*.
- ~~**The primitives are typed and sized at console density, and only three of them can opt out yet.**~~
  **Closed 2026-09-02 (JH222).**
  Re-measured on `main` 2026-09-02: all **21** size utilities in `src/components/` are
  `text-console-*`, **18** of them `text-console-sm` (12px), and none is a member token. `--touch-min`
  is worse than the earlier note here claimed — it said Button's tallest size was 40px against the
  44px floor, but the relevant number is the DEFAULT, `h-9` = **36px**, and **all six** sizes are
  under the floor. This is why `Jelly-Health/website` overrides both by hand.

  **Partly closed 2026-09-02 (JH212)** — `Button`, `Input` and `Textarea` — **and closed
  2026-09-02 (JH222)** with the remaining five: `Label`, `Select`, `Checkbox`, `RadioGroup` and
  `Switch`. A member form can now be built entirely from primitives that know the floor.

  The note that used to sit here said to take them as their first real consumer needs them rather
  than in one sweep. JH222 did the sweep instead, and the reason is worth recording rather than
  quietly reversing: the pacing rule exists to stop speculative work outrunning a consumer, and
  there is no consumer coming — `v2` has no member routes, and [JH219](https://trello.com/c/HRq6Uz7B),
  which would create them, is Blocked on a scheduling question. Waiting for a consumer meant waiting
  indefinitely, and five separate PRs would each have been too small to review meaningfully. The two
  halves went in as separate commits, because they are not the same work.

  `Label` and `Select` were type and height, a direct application of `Input`'s axis. The other three
  are **hit-target problems, not type problems** — `Checkbox` is `size-4` (16px) against a 44px
  floor, which no font size fixes — and they resolve it by expanding the **hit area** to
  `--touch-min` while leaving the **painted box** exactly as drawn. Growing the box would be the
  wrong fix: a 44px square checkbox is not what any canvas draws. See § *Reaching for the right
  thing* and `checkbox.tsx`'s docstring for the full argument, including why the member plane also
  has to reserve its own footprint (without it, two radios in `RadioGroup`'s own `grid gap-3` have
  overlapping hit areas and the lower one silently wins taps meant for the upper).
- **No lockfile.** The package has never been installed, so `yarn typecheck` cannot run. Creating one
  is bound up with the release-process decision that is still open.
- ~~**No wordmark.**~~ **Fixed 2026-09-01 (JH200).** `<Wordmark />` ships from the package root —
  see § *The wordmark*. It has no live consumer yet: the legacy marketing footer is the only place
  the full name renders today, and it is on the retired type system with no dependency on this
  package, so wiring it in means bringing the whole token/font layer to a surface `JH188` W7
  deletes within weeks — a larger, riskier change than this card asked for. `v2` has no full-name
  render site (the console sidebar deliberately shows the short form, `Jelly`, sized for a 216px
  rail), and `Jelly-Health/website` is mid-flight on `JH211`. Wire it in wherever a real screen
  needs the full name next, rather than force a site now.

## Using it

Both consumers are Next 16 / React 19 / Tailwind v4 (CSS-first, no `tailwind.config.js`).

**1 · Add the dependency.** Distribution is a git dependency — no registry, no publish step, no release
pipeline to maintain for a system with one designer and one engineer:

```jsonc
// package.json
"dependencies": {
  "@jelly-health/design-system": "Jelly-Health/design-system#main"
}
```

Pin a commit SHA instead of `main` when you want the app to stop moving under you.

**Peer dependencies you must supply:** `react` / `react-dom` `^19`, and **`lucide-react` `^1`**. Lucide
is a peer rather than a dependency so that the consumer owns the version and only **one** copy
installs — it is imported by `accordion`, `checkbox`, `dialog`, `radio-group` and `select`, and by
consumer code, and two majors resolving side by side means a duplicated bundle and two incompatible
icon component types. Decided 2026-09-01, [JH200](https://trello.com/c/DjdTEk90).

**3 · Adopt the type-ramp lint rule (optional but recommended).** `scripts/verify-type-ramp.py`
(JH213) only sees this package's own primitives — it has no visibility into a consumer that
reintroduces a bare `text-sm`. This closes that gap one hop further out:

```js
// eslint.config.mjs
import jhRules from "@jelly-health/design-system/eslint";
export default [...jhRules, ...yourExistingConfig];
```

Flags any of Tailwind's generic size utilities (`text-sm`, `text-base`, `text-lg`, …) inside a
`className`/`class` attribute or a `cn()`/`clsx()`/`cva()`/`classnames()` call — scoped to those
call sites specifically, not every string literal in a file, so it doesn't fire on ordinary prose
that happens to contain the substring. Verified against the real `eslint` `Linter` API in
`scripts/verify-eslint-rule.mjs`, mutation-tested (removing the scope check, or the regex's word
boundary, each break a specific fixture). ⚠️ Not wired into this repo's own CI — the package has no
lockfile and CI runs no `npm install` today; run the script manually, or rely on it running as part
of a consumer's own `eslint .`. Decided 2026-09-01, [JH216](https://trello.com/c/1gBQlgIn).

**2 · Transpile it.** The package ships TypeScript and CSS source with **no build step** — deliberately,
since a build is a release pipeline and a release pipeline is the cost we were trying to keep small:

```js
// next.config.mjs
const nextConfig = {
  transpilePackages: ["@jelly-health/design-system"],
};
```

### Type: sizes are prefixed, and that is the point

**`text-sm` is Tailwind's 14px here, not ours.** Console density lives on its own names:

```
text-console-2xs  10px      text-console-xl   20px
text-console-sm   12px      text-console-2xl  24px
text-console-base 13px      text-console-3xl  32px
text-console-md   15px      text-console-4xl  48px
text-console-lg   16px      text-console-5xl  64px
                            text-console-6xl  72px
```

There is no `text-console-xs`; the ramp steps 10 → 12 and "extra small" is `text-console-sm`.

An earlier cut of `tokens.css` bound these values to Tailwind's own generic names, so adopting the
package silently resized every `text-sm` a consumer had already written — no error, no warning,
nothing to review against. On the marketing site that measured as nav links, both CTAs and the
footer going 14px → 12px and the hero paragraph 18px → 16px, which put the most member-facing
surface we have a quarter below the **member body floor** `tokens.css` itself declares. axe passed
the whole time, because a small font is not a WCAG failure — which is exactly why this is a
committed check and not a note. `scripts/verify-type-ramp.py` fails the build if any generic name
is bound again. It is mutation-tested, and the mutations — each one run, including two that
defeated an earlier cut of the check — are listed in the script's own docstring rather than
counted here, so the list cannot drift from the code.

**Member surfaces must opt out explicitly**, and since JH214 there is a full ramp to opt into:

```
text-member-caption  14px       meta, timestamps, small print — the ramp's floor
text-member-body     16px       body copy, nav, CTA labels — THE MEMBER BODY FLOOR
text-member-lede     20px       hero paragraph, section intro
text-member-title    24px       screen title, card title
text-member-section  28 → 36px  marketing <h2>          fluid
text-h1              32 → 56px  marketing hero, one per page   fluid
```

**Role-named, not size-named**, matching every other member token in the file
(`--pad-member-screen`, `--gap-member-thread`, `--numeric-member`). A role name survives a retune;
`--text-member-lg` at 20px becomes a lie the day the ramp moves.

**The ramp bottoms at 14px. There is deliberately no member 12px.** 14px is also Tailwind's stock
`text-sm`, and the token still earns its name twice: the package's ESLint rule bans the generic
name in consumers, so without it a caption has nothing legal to write, and the value is our
decision about a minimum rather than Tailwind's about a default.

**Only the two display steps are fluid, and that is enforced.** Everything at or below 24px is
fixed, because a `clamp()` whose lower bound falls under 16px breaks the member body floor at
narrow viewports — silently, on the surface where the floor matters most, passing axe the whole
time. `verify-type-ramp.py` check 7 rejects a fluid reading step and check 8 rejects a display
clamp starting below the floor, including one re-declared later in the file.

**Member leading is derived by a rule.** Through the reading range a member step sits **one notch
looser** than the console step of the same size — 16px is `normal` on the console and `relaxed`
here, 20px is `snug` there and `normal` here, 24px is `tight` there and `snug` here. "Member airy"
is what the separate ramp is for, and this is the operative difference. The rule stops at the
display tier, where `section` takes `tight` exactly as `console-3xl` does, because airiness is a
reading property and display type wants the opposite.

The values are new — the canvases could not supply them. The member canvases are drawn below 1:1
(Conversation Spine's three commonest sizes are 11.5px ×53, 12.5px ×44, 11px ×27, and
`Portal.dc.html` already writes `var(--text-member-body)` rather than px), and the marketing canvas
is a drawing rather than a system: 34 distinct sizes on one page, 16 of them separate `clamp()`s,
two sharing endpoints and differing only in slope. Same situation as the nineteen radii, same
answer — chosen, with the canvas as evidence of range.

Prefix decided 2026-09-01, [JH138](https://trello.com/c/9BYx5GAH); member ramp decided the same day,
[JH214](https://trello.com/c/8UBPo5Py).

### Line-height is mapped, not derived

Every size step above pairs with a named `--leading-*` value — `display` 1.05, `tight` 1.1, `snug`
1.35, `normal` 1.5, `relaxed` 1.6. Size-driven: larger text reads relatively tighter.

```
2xs/sm      relaxed  1.6      xl          snug     1.35
base/md/lg  normal   1.5      2xl/3xl     tight    1.1
                               4xl/5xl/6xl display  1.05
--text-member-body  relaxed  1.6   (same 16px as console `lg`, different leading — "member
                                     airy" is the reason the token exists at all)
--text-h1            display  1.05
```

Without this pairing Tailwind supplies its own default — a ratio computed against **Tailwind's**
font size for that name, not ours. `text-console-lg` inherited a 1.556 ratio derived for stock 18px
while rendering at our 16px; nobody chose that, it was just what was left over.
`scripts/verify-type-ramp.py` fails the build if a step is missing a pairing, or if the pairing is a
bare number instead of a named `--leading-*` token — a number with no name attached is a decision
nobody can find the reasoning for later.

Decided 2026-09-01, [JH215](https://trello.com/c/tZxTAeXf).

### Weights are bound, and 510/590 are the point

The scale is `300 / 400 / 510 / 590`, and **510 and 590 are not standard weights** — they exist only
on Inter's variable axis. That is the whole reason JH211 subset the
faces *without* `--instancer`: an instanced subset collapses the axis to fixed instances, a static
face rounds 510 to 500 and 590 to 600, and the result passes review while being wrong.

Until [JH225](https://trello.com/c/BQMHdxhZ) the axis was intact and **nothing could ask for it.**
`@theme inline` bound none of the four weights, so Tailwind emitted its own scale and the rounding
happened one layer above the font instead. Measured on `origin/main` (`7178b67`, 2026-09-02) by
compiling `tokens.css` with the real Tailwind 4.1.18 and reading `getComputedStyle` in Chromium:

| utility | before | after |
|---|---|---|
| `font-light` | 300 | 300 — unchanged, and *invisible to a value check* (see below) |
| `font-normal` | 400 | 400 — same |
| `font-medium` | **500** | **510** |
| `font-semibold` | **600** | **590** |

The axis does respond at those stops rather than snapping to the nearest hundred: rendered advance
width of "Refill queue" at 64px goes 330.875px → 331.609px from 500 to 510, and 338.234px →
337.500px from 600 to 590. Both deltas are 0.734px, exactly **a tenth of the 500 → 600 step**
(7.359px), so the change is real but small — roughly 0.2% of advance width on the fourteen
`font-medium` sites in this package.

**Why weight broke here when tracking did not**, since both are declared the same way: Tailwind's
own theme variables are named `--tracking-tight` and `--tracking-normal`, which is exactly what
`tokens.css` calls them, so a plain `:root` declaration overrides Tailwind's by cascade and the
`tracking-*` utilities already carry our values. Its weight variables are `--font-weight-*` while
ours are `--weight-*` — different names, no collision, no override, nothing reachable. The names
are the whole difference, and neither case is visible in a diff.

**Two of the four are invisible to a value check, and that needed a different kind of proof.**
300 and 400 are also Tailwind's stock values for `font-light` and `font-normal`, so for those two
bound and unbound compute the same number — deleting either binding is a real regression that a
before/after comparison calls OK. `scripts/verify-weight-computed.mjs` proves the binding by
**mutation** instead: each `--weight-*` is perturbed in memory to a sentinel that is deliberately
not a multiple of 100, and the matching utility must follow it. A utility that does not move is
reading Tailwind's scale whatever the file appears to say. All four bindings are proved live that
way, and `font-bold` is asserted *not* to follow any of them.

That script needs a browser, so like `verify-member-plane.mjs` and `verify-eslint-rule.mjs` it is
run manually rather than in CI — the package has no lockfile. The structural guard is the one that
gates the build:

`scripts/verify-weight-scale.py` fails the build if a declared weight is not bound, if a binding
points at a literal or the wrong token, or if a `--font-weight-*` is declared outside `@theme
inline` where it would clobber the theme layer by cascade. It takes its notion of the truth from
the `:root` declarations, never from the `@theme inline` block it is checking — the mistake
`verify-class-merge.mjs` shipped and had to fix.

**`font-bold` is deliberately not bound** and keeps Tailwind's stock 700. Aliasing it onto
`--weight-semibold` would silently retype every `font-bold` already written in a consuming app with
nothing to review against, which is the failure the [prefixed sizes](#type-sizes-are-prefixed-and-that-is-the-point)
section exists for; adding a `--weight-bold: 700` would contradict the ceiling this system declares.
The four `font-bold` sites in `web-app/v2` are a consumer retype, tracked on JH225.

Decided 2026-09-02, [JH225](https://trello.com/c/BQMHdxhZ).

**Two ways to load the fonts — pick by whether you can express `unicode-range`.**

| | Files | Who |
|---|---|---|
| Import `…/styles` (tokens + `fonts.css`) | the `-latin` / `-ext` slices, each with a `unicode-range` | `Jelly-Health/website`. A page of English costs **67KB** |
| Declare the faces yourself | `InterVariable-latinext.woff2`, `InterVariable-Italic-latinext.woff2` — one combined file per face, **154KB** | `web-app/v2`, which uses `next/font/local` |

`next/font/local`'s `src` entries accept only `{ path, weight, style }` — there is no `unicodeRange`
option, and the top-level `declarations` applies to every generated face, so per-file ranges are not
expressible. Hence the combined cut. Both paths keep full extended-Latin coverage; only the download
strategy differs. `scripts/verify-fonts.py` asserts the combined files ship **and** stay out of
`fonts.css` — referencing one there would hand the site a 154KB face instead of the 67KB slice.

**3 · Import the styles** at the top of your `globals.css`, before your own `@theme` block:

```css
@import "tailwindcss";
@import "@jelly-health/design-system/styles";
```

Tokens are then Tailwind utilities in the normal way — `bg-bg`, `text-ink`, `text-ink2`, `border-line`,
`ring-ring`, `text-dang`.

⚠️ **Keep `@theme static`.** Tailwind v4 emits a theme variable only when a generated utility references
it, so a token used only as a hand-authored `var(--color-x)` is silently pruned — identically in dev and
prod. The website repo has already hit this once.

**4 · Import a primitive.** Two entry points, on purpose:

```tsx
import { Button } from "@jelly-health/design-system";       // the barrel — all 19, one import
import { Button } from "@jelly-health/design-system/ui/button"; // one primitive, nothing else
```

The barrel is the ergonomic default. Reach for the subpath in a **Server Component** instead: 12 of
the 13 Radix packages the primitives are built on ship their own `"use client"`, so importing the
barrel pulls every primitive's module graph — client-only ones included — into whatever imports it.
`web-app/v2` has a Server Component in exactly that position (`dose-flag.tsx`), which is why its
showcase page (`app/design-system/page.tsx`) imports every primitive by subpath rather than from the
barrel — not style, a real constraint. Verify which form you need against your own build's output;
do not assume Next tree-shakes the unused ones away.

⚠️ **Do not add `"use client"` to a primitive.** It is not needed — the Radix dependency already
carries it, except `@radix-ui/react-slot` — and adding one anyway silently converts every Server
Component that imports the barrel into a client one. This bit `web-app/v2` and is recorded so it
does not get "fixed" as tidiness later.

### Contrast is computed, not remembered

`scripts/verify-contrast.py` recomputes **every text-on-surface pair in this file, both themes**,
from the hexes as they stand — no committed table, no remembered number. It is the fifth guard in
`scripts/` and the only one that had a claim in this README before it had a check behind it.

```
python3 scripts/verify-contrast.py --table
→ 152 pairs (76 per theme) · 10 tight · 0 failures
```

Five checks, in the order they are likely to catch something:

1. **Every colour role is classified** — a surface, a foreground with a floor and a list of the
   surfaces it can land on, or an exemption with a reason. A role nobody classified **fails**
   rather than being skipped, which is what keeps the other four honest as the file grows.
2. **Every pair clears its floor** — 4.5:1 for text, 3:1 for non-text boundaries and controls.
3. **Every ratio quoted in a comment matches the computed value**, to 2dp. `tokens.css` says things
   like `/* tight: 3.07 on --mut */` and `--ring on --accent-fill measures 1.77`; those are
   assertions, and assertions go stale silently.
4. **`tight` is enforced in both directions** — a pair within 0.15 of its floor must be marked at its
   declaration, and a pair marked `tight` must really be one.
5. The pair, tight and failure counts are printed, so this README can cite a command.

**What running it the first time found.** The claim it replaces — *"150 pairs, 0 failures, 7 tight"* —
holds on the part that matters: **0 failures**, and the two counts are close enough to be the same
sweep. But **three tight pairs were unmarked**, and one of them is the tightest text pair in the
system: `--accent-on-accent` on `--accent-fill` in dark measures **4.51 against a 4.5 floor**. The
same value under a different name, `--voice-on-member`, is the member's own message bubble — so the
member's own words in dark mode sit one hundredth above AA. It is passing, and it is one nudge to
either hex from not passing. All three are now marked where they are declared.

The pairing table lives in the script, written out rather than derived, because *"which surface can
this text land on"* is a product fact that no amount of parsing recovers. **Disagreeing with a pair
means editing that table** — which is the point of it being a table.

### The wordmark

`jellyhealth` has never had an SVG or PNG logo — the name has always been live text, restyled
independently on every screen that shows it. `<Wordmark />` is the first shared, correct version:
typeset in Inter at `--weight-semibold` (590, the system's ceiling — there is no 700) and
`--tracking-tight` (-0.012em), lowercase, exported from the package root:

```tsx
import { Wordmark } from "@jelly-health/design-system";

// On a page surface — the default reading
<Wordmark className="text-2xl text-accent-ink" />

// Reversed on a filled surface — console header, dark footer, a share-card background
<Wordmark className="text-2xl text-accent-on-accent bg-accent-fill px-3 py-1.5" />
```

Colour and size are deliberately **not** baked in. Colour inherits `currentColor`, so a consumer
picks `text-accent-ink` (a page surface) or `text-accent-on-accent` (a filled one) — **not**
`text-accent`/`bg-accent`, which is the shadcn-generic alias for `--mut`, a different role
entirely (see the alias table above). Size is left to the consumer for the same reason a hero, a
nav bar and a footer are not the same size.

### The button matrix

The component has always taken these variants. What it has never had is a record of which set is
*intended*, so every consumer inferred it from the source and guessed which combinations were meant
to exist. Writing it down is the whole of this piece — the card asked for the decision recorded, not
for another specimen page to keep in sync with the code.

| Axis | Values | Notes |
|---|---|---|
| `variant` | `default` · `destructive` · `outline` · `secondary` · `ghost` · `link` | `default` is the accent fill. |
| `size` | `default` 36px · `sm` 32px · `lg` 40px · `icon` 36px · `icon-sm` 32px · `icon-lg` 40px | Console heights. All six sit under the 44px member floor. |
| `plane` | `console` (default) · `member` | Raises the control to `--touch-min` and `--text-member-body`. |

Since JH222 the `plane` axis spans **all eight** primitives a member form is built from — `Button`,
`Input`, `Textarea`, `Label`, `Select`, `Checkbox`, `RadioGroup`, `Switch` — and it means one of two
things depending on what was actually below the floor:

| | Primitives | What `plane="member"` does |
|---|---|---|
| **Type and height** | `Button` `Input` `Textarea` `Label` `Select` | Raises the box to `--touch-min` with `min-h` and the type to the member ramp. |
| **Hit area only** | `Checkbox` `RadioGroup` `Switch` | Expands a centred pseudo-element to `--touch-min` and **leaves the painted box alone**, since these are 16–18px marks that no font size fixes and that must not grow. Also reserves the 44px footprint, or stacked controls overlap. |

Both are the control's own job for the same reason the fourth rule below gives. `scripts/verify-touch-target.mjs`
measures the second row in a real browser — hit area, painted box, footprint and a stacked group —
because every claim in it is geometric and nothing that reads the source can check one.

Four rules the type system cannot enforce and a reviewer has to:

- **`destructive` is the only semantic variant, and nothing sits above or below it.** There is no
  warning tier and no priority ramp anywhere in this system, by product decision. An action that
  needs more weight than `destructive` needs a confirmation step, not a redder button.
- **`link` is still a button.** It is an action styled quietly; an anchor is what navigates. On the
  member plane it takes the touch floor like everything else, which is why `plane` applies across
  the whole matrix rather than only to `default`.
- **`plane` is a separate axis from `size`, not a seventh size.** They answer different questions —
  `size` is how prominent this button is among its neighbours, `plane` is which product it is in —
  and collapsing them would make a small member button unrepresentable. They compose without a
  compound-variant table because `min-height` beats `height`: `size="default"`'s `h-9` is simply
  raised to 44px and left inert in the class list.
- **There is no `loading` variant, and adding one is a bigger decision than it looks.** A loading
  button has to hold its width while its label is replaced, name the state to a screen reader, and
  decide whether it blocks a second submit — three behaviours, not a style. It stays a consumer
  concern until a real screen needs it, at which point it is a component and not a variant.

**Member sizing is a property of the control, not of the layout around it.** This was the open
question in the card and the answer is forced rather than chosen: a wrapper can only set a minimum on
the box it owns, so wrapping a 36px button in a 44px row produces a row that clears the floor and a
tap target that does not. `ThreadEvent` does exactly that today and its docstring is careful to say
it enforces the floor on "the slot it controls" — which is the most any composition can do for a
primitive it does not own. Hence `plane` on the primitives.

```tsx
<Button plane="member">Continue</Button>              {/* 44px, 16px label */}
<Button plane="member" variant="ghost" size="icon" />  {/* 44×44 */}
```

### The toast

`src/components/ui/toast.tsx` (primitives, Radix-backed), `toaster.tsx` (the mounted viewport)
and `use-toast.ts` (the imperative store) — JH224. Designed by JH202, which shipped no code on
purpose; JH212 was going to build it and closed first without doing so, leaving a reserved
elevation token (`tokens.css`: *"floating layers ONLY — popover, menu, command palette, dialog,
toast, tooltip"*) with nothing behind it until now.

**Two tiers, not a severity ramp — this is the point of the component, more than the visual
design.** Carried verbatim from JH202: an informational toast is a *redundant acknowledgment* —
the fact it announces must already be durably visible elsewhere (a queue row, a thread, a task
list) before the toast fires — so it auto-dismisses. An error toast is different in kind: nothing
else on screen changed, so the toast *is* the entire notice, and it must never expire unseen.

```tsx
toast({ tier: "info", description: "Note added to thread" })
toast({ tier: "error", description: "Couldn't submit — check your connection", action: { label: "Try again", onClick: retry } })
```

| | Console | Member |
|---|---|---|
| Placement | bottom-right, stacking upward | top of viewport, safe-area aware |
| Stacking | up to 3 visible, newest nearest the corner, 4th+ collapses to a "+N more" chip | max 1 — a second toast **replaces** the first |
| Duration (informational) | 4s | 5s |
| Size | `--text-console-base` (13px), 18px icon, 18px close target | `--text-member-body` (16px), 20px icon, `--touch-min` (44px) close target |

`plane` lives on `<Toaster plane="…" />` (one per app), not on individual `toast()` calls —
the same reason `size` on `Button` doesn't decide whether the surface is console or member.
Elevation: `--radius-lg` (12px, the floating-layer ceiling), `--line-strong` boundary (never
`--line`), `--shadow-float` — the system's rule that floating layers get a hairline *and* a
shadow, static surfaces get only the hairline.

**Never a finite duration for `tier="error"`.** `getToastDuration(tier, plane)` returns
`Infinity` for every error toast, which is Radix's own signal (`@radix-ui/react-toast`'s
`useTimer`) to never start the close timer — not a convention invented here. Pause-on-hover/focus
is Radix's built-in `Toast.Root` behaviour and is not reimplemented. `scripts/verify-toast.mjs`
proves this by mutation: flipping the `tier === "error"` branch to a finite number, or removing
the wiring from `<Toast>` to `Toast.Root`'s `duration` prop, both fail it — run before this
shipped, and reverted after confirming the failure.

**Member "replaces, not stacks" is an actual removal, not a hidden queue.** A superseded member
toast is dropped from the store outright (`planeVisibility`'s `superseded`, applied in
`toaster.tsx`), rather than merely hidden — otherwise dismissing the visible toast would reveal
the "replaced" one reappearing, which is exactly the stacking behaviour the rule exists to rule
out. Console's overflow is the opposite: genuinely queued (`hiddenCount`), so a slot freed by a
closing toast can surface the next one.

**Dedup is opt-in, by a stable id — not inferred from message text.** JH202 left "two identical
errors firing back to back" unresolved as out of its brief. Comparing message text to decide
"identical" means guessing at what the caller meant; the caller already knows. Passing the same
`id` twice updates the existing toast in place instead of adding a second one:

```tsx
toast({ id: "refill-submit-error", tier: "error", description: "Couldn't submit — check your connection" })
```

**Dialog's Escape-always-closes gap is not resolved here.** JH202 documented it and deferred the
fix to whoever builds a dialog-hosted form; toast doesn't host one, so it isn't resolved by this
card either. Raised as [JH227](https://trello.com/c/WLseboFW) rather than left silently open a
second time.

### `cn()` knows this package's font sizes — and it did not before

`src/lib/utils.ts` extends tailwind-merge with the seventeen `--text-*` step names. Without that,
tailwind-merge classifies a `text-*` class by validating its value: a recognised t-shirt size is a
font size, and **anything it does not recognise falls through to the text-colour group**. Every size
name here is custom, so `text-console-sm`, `text-member-body` and `text-h1` all shared a group with
`text-ink`, `text-danger` and the rest — and two classes in one group means the later one wins and
the earlier is deleted.

That was shipping. Measured on `main` 2026-09-02: **18 classes silently deleted across 9 of the 23
components** — 12 font sizes and 6 colours, since whichever comes first is the one destroyed. Among
them `text-member-body` on all four `MessageBubble` voices, so the component whose docstring measures
its contrast at the member body size was rendering at whatever size it inherited. No error, no
warning, nothing in a diff to review.

`scripts/verify-class-merge.mjs` is the guard, and it reads the true list of sizes from `tokens.css`
rather than from the list it is checking — the first cut did the latter, and all three of its
positive mutations reported OK. **A new `--text-*` step must be added to `FONT_SIZE_STEPS` as well as
to `tokens.css`; the script fails when the two disagree, in either direction.**

One deliberate side effect: font size conflicts with `leading-*` in tailwind-merge, so
`leading-none text-console-sm` now resolves to just the size. That is correct here rather than merely
tolerable — JH215 paired every step with a `--text-<step>--line-height`, so a size utility really
does carry a leading and really does override one written before it. Written after it, `leading-*`
still wins.

### The member compositions

`src/components/member/` — JH212. Not primitives: a primitive is an atom with no opinion about the
product, while everything here carries a decision the canvases settled and `tokens.css` records.
Separate directory for the same reason `brand/` is one.

```tsx
import { Thread, ThreadDay, ThreadEvent } from "@jelly-health/design-system/member/thread";
import { MessageBubble, MessageSender, MessageGroup } from "@jelly-health/design-system/member/message-bubble";
import { PendingValue } from "@jelly-health/design-system/member/pending-value";

<Thread>
  <ThreadDay>12 Aug</ThreadDay>

  <MessageGroup>
    <MessageSender name="Alex"><Avatar className="size-5">…</Avatar></MessageSender>
    <MessageBubble voice="provider">
      Had a look at your panel this morning — nothing there worries me. <PendingValue />
    </MessageBubble>
    <MessageBubble voice="provider">I'd like to move you up. Nothing you need to do.</MessageBubble>
  </MessageGroup>

  <MessageBubble voice="member">ok — will I feel different?</MessageBubble>

  <ThreadEvent action={<a href="/treatment">Your treatment</a>}>
    Alex changed your dose to <PendingValue /> · 12 Aug
  </ThreadEvent>
</Thread>
```

Three rules are load-bearing and are explained at length in each file:

1. **A human message is a bubble; a state change is a `ThreadEvent`.** A centred hairline row, past
   tense, never a bubble and never an avatar. The v9 Conversation Spine canvas: *"The distinction is
   structural rather than coloured, so neither kind dominates and neither reads as an alert."*
   `voice="system"` is jellyhealth **speaking**, not jellyhealth reporting that something happened.
2. **The two warm voices carry a `--line-strong` edge, and it is not decoration.** Measured against
   `--sur` (the `Thread` surface): in light, provider sits **1.8 ΔL\*** and coordinator **0.8 ΔL\***
   from it — both under the 3 ΔL\* threshold `tokens.css` sets for "a fill difference cannot delimit
   this". The member bubble is 40+ ΔL\* in either theme and takes none.
3. **`PendingValue` is the `___`**, on `--pending-rule` — a boundary, never a warning — and it
   carries `sr-only` text, because three underscores read aloud are the "missing data" reading the
   house rule forbids. Never use it for a price.

⚠️ **Consumers must widen their Tailwind `@source` glob.** The v4 content scanner never reaches
`node_modules`, so a consumer whose `@source` still points at `src/components/ui/**/*.tsx` silently
drops every utility these components introduce — no error, dev or prod. Point it at
`src/components/**/*.tsx` instead, which also picks up `brand/` (never covered) and anything added
later.

⚠️ **A member composition cannot assume a primitive is member-sized.** Re-measured 2026-09-02: all
**21** size utilities in `src/components/` are `text-console-*`, and `Button`'s default size is
`h-9` (**36px**, not the 40px an earlier note here claimed — that is `size="lg"`), with all six
sizes under the 44px `--touch-min` floor. `ThreadEvent` enforces the floor on the action slot it
owns, which is the most a wrapper can do; pass `plane="member"` to fix the control itself.

#### `MemberField` — a labelled field

Label, control, description, error. Three of its four decisions come from the canvases rather than
from preference, and the first one is the one worth reading:

1. **There is no required marker.** The Onboarding canvas draws every field as a bare label —
   `Full name`, `Email`, `State`, `Date of birth`, `Mobile number` — and marks exactly one, the
   free-text box on step 1: *"Say more, if you want (optional)"*. It marks the **optional** field,
   in words, in the label. That is the inverse of the usual convention and correct here: nearly
   every field in an eleven-step onboarding is required, so marking required decorates almost
   everything and distinguishes nothing. It also fits the canvas's own thesis — *"Starts as a
   website, becomes a conversation, never becomes a form"* — where an asterisk column is the most
   form-like thing a screen can grow. Hence one prop, `optional`, which drives both the marker and
   `required` on the control so the two cannot disagree.
2. **An error is a message, or it does not exist.** There is no `invalid` prop: a non-empty `error`
   string *is* the invalid state, and a blank or whitespace-only value is treated as no error rather
   than as an error that failed to say anything. This is the house error-vs-empty rule at field
   scale — a red outline around a blank box is exactly what "you have not filled this in yet" looks
   like, and that is what an `invalid` flag plus a separately-supplied message produces the day the
   message arrives empty. The description is shown alongside the error, never replaced by it.
3. **The description is ours, not the canvas's**, and is flagged as such in the source — the canvases
   put supporting prose at screen level, above the fields, never under one input. Prefer that; reach
   for `description` when the sentence genuinely belongs to a single control.
4. **A render prop, because the wiring has to reach a control this component does not own.** Cloning
   the child would do it invisibly and would silently do nothing for a fragment or a wrapper.

```tsx
import { MemberField } from "@jelly-health/design-system/member/field";

<MemberField label="Mobile number" description="For refill updates." error={errors.phone}>
  {(field) => <Input plane="member" type="tel" {...field} />}
</MemberField>
```

`plane="member"` is the consumer's to pass and deliberately not forced — this component cannot know
its child is one of ours, and a wrapper cannot resize a control it does not own.

Contrast for both message roles was measured against every surface a member field can land on,
2026-09-02, both themes. All twelve pairings clear 4.5:1; the floor is `--ink-3` on `--sur` in light
at **5.14:1**.

#### The four states — loading, empty, failed, and too much content

JH218. `src/components/member/state.tsx` and `src/components/member/skeleton.tsx`.

🔴 **A failed load must never read as "nothing to do."** That house rule is the whole of this card,
and it is why `Thread` has always refused to draw its own empty state. The problem with leaving it
there is that the rule gets broken by nobody deciding anything: a consumer with four states and
three renderers reaches for the nearest one. So this is not "a spinner and an empty state" — it is a
type where **the wrong state does not compile**, the same move `MemberField` makes by having no
`invalid` prop.

```tsx
import {
  MemberStateView, memberStateFrom, type MemberState,
} from "@jelly-health/design-system/member/state";

<MemberStateView
  state={memberStateFrom(messages)}
  skeleton="thread"
  empty={{ title: "No messages yet", body: "Alex writes here when there is something to say." }}
  error={{ title: "We couldn't load your messages", body: "This is not an empty conversation.", onRetry }}
>
  {(items) => items.map((m) => <MessageBubble key={m.id} voice={m.voice}>{m.text}</MessageBubble>)}
</MemberStateView>
```

**It is deliberately not the console's `PanelState<T>`.** That type is three states —
`loading | ready | error` — with **empty folded into `ready` with zero items**, which is exactly the
collapse this rule forbids. `queue-panel.tsx` keeps empty and failed apart by hand instead: an em
dash rather than a `0`, a sentence that says *"This is not an empty queue"*, and a reader that
resolves `unavailable` rather than an empty view. All three are right, and all three are conventions
a second call site can simply not follow. Here:

```ts
type MemberState<T> =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "ready"; items: readonly [T, ...T[]] }   // ← non-empty, by type
  | { status: "error" }
```

**Three things a consumer cannot express**, which is the part that does the work:

| Wrong state | Why it cannot be written |
|---|---|
| `ready` with nothing in it | `items` is a non-empty tuple. `{ status: "ready", items: [] }` does not compile; `memberStateFrom` is the one sanctioned way across the narrowing, and it returns `empty` for an empty list |
| An empty screen with a retry | `MemberEmpty` has no such prop, and neither does the view's `empty` slot. A retry is the affordance that marks a failure; handing it to the empty state is the collapse in one prop |
| A failure the member cannot act on | `onRetry` is **required** on `MemberError`. A dead end — no control, no next step, just words — is the state that most reads as "nothing to do" |

`MemberStateView` closes the last gap, mis-wiring: it owns the switch and builds both blocks itself,
so the consumer supplies words and never markup, and `skeleton` is a discriminant (`"thread" |
"screen"`) rather than a node slot for the same reason.

**What separates empty from failed on screen is structure, not copy** — copy would not survive a
consumer writing *"Nothing to show"* in both. `MemberEmpty` is text on the page ground: no box, no
border, no icon, no control, and no call to action (A2.1 — *"there is nothing for Alex to start"*).
`MemberError` announces itself with `role="alert"`, sits on `--card` inside a `--line-strong` edge
(`--card` is **1.09 ΔL\*** from `--bg` in light, so a hairline would leave it undelimited — the same
argument `MessageBubble` makes), and always carries a `plane="member"` retry. It is **not** drawn in
`--danger`: a failed read is not a clinical event, and there is no severity tier below it because
this system has no ramp.

**The skeletons are member density and the fill was measured, not chosen.** A skeleton block has no
text in it and no border on it, so it has to be delimited by fill alone — and `tokens.css` already
sets the threshold for that question at 3 ΔL\*. The obvious pick fails it: `--mut` on `--sur` is
**2.77** in light (and 10.04 in dark, which is precisely the "reads as distinct in one theme and
identical in the other" trap). `--line` is the one existing role that clears 3 ΔL\* on all three
member surfaces in both themes, so that is the fill. `ThreadSkeleton` renders a real `<Thread>`
rather than re-declaring its container classes; block heights are a member type step times its own
mapped leading, and the control block in `ScreenSkeleton` is `--touch-min`, never a button height.

**Overflow is a rule about tracks, and it changed four existing components.** *Text that can outgrow
its track wraps or scrolls in its own container; clipped text is a bug, and the page body never
scrolls sideways.* `MessageSender` needed `max-w-full` on the row **and** `min-w-0 break-words` on
the name — either alone leaves the bug, because `self-start` sizes the row to its content so the
name has no width to wrap inside until the row is capped. `MessageBubble` takes `break-words` in its
base (the 88% cap stops a long *sentence* and does nothing about a long *token*), `MemberField`'s
label and messages take it too, and `Thread` finally has the `overflow-y-auto` its own docstring has
always described.

**Verified by `scripts/verify-member-states.mjs`** — 46 cases in four parts, because no one part can
see the whole claim: structure via `renderToStaticMarkup`, **types** via `tsc` over a fixture whose
eight `@ts-expect-error` directives assert that the wrong state does *not* compile, **layout** in
real Chromium at 360px in **both themes**, and the star-export precondition (109 names, 0
collisions). Seven mutations were applied and reverted; each failed. The card's own — *make the
error state render the empty state's markup* — fails eight cases, and the two type mutations fail
nothing else, which is the argument for having both parts.

⚠️ **`yarn typecheck` still has no lockfile to run against, but `tsc` itself does run** — borrow
`react`, `react-dom`, `esbuild`, `typescript`, `playwright` and `@tailwindcss/postcss` by symlinking
a sibling repo's install into `node_modules/` (`.design-sync/NOTES.md` records the recipe and why
the Tailwind major has to match), then `node node_modules/typescript/bin/tsc --noEmit`. **The
baseline is 2 errors**, both `RefAttributes` variance in `ui/badge.tsx` and `ui/button.tsx` from the
borrowed `@types/react`, and the bar is no new ones.

`scripts/verify-member-plane.mjs` renders these components and asserts what their docstrings claim —
25 cases as of 2026-09-02 (this sentence said 20 until JH218 re-ran it; JH224 added five `Toast`
cases without anything prompting a recount), mutation-tested against six ways of breaking them. Two of those mutations are bugs this
work actually shipped and then caught: the optional marker rendering on every field that was not
explicitly required, and `Button` declaring `plane` without ever destructuring it, so the prop
leaked to the DOM and the variant did nothing while type-checking clean.

### The member screen chrome

JH219. `src/components/member/task-screen.tsx`, `onboarding.tsx` and `portal.tsx`. Three shells,
each decided by one rule, and in every case the rule is about what a member is allowed to reach —
which is why they are compositions and not primitives.

```tsx
import { TaskScreen, TaskDone } from "@jelly-health/design-system/member/task-screen";
import { OnboardingScreen, OnboardingStep } from "@jelly-health/design-system/member/onboarding";
import { PortalShell, PortalBody, PortalNav, PortalDestination } from "@jelly-health/design-system/member/portal";

<TaskScreen
  onExit={close}
  title="Book your blood draw"
  lede="Alex ordered a full panel. Pick a time near you."
  action={<Button plane="member" className="w-full">Confirm booking</Button>}
>
  {slots}
</TaskScreen>
```

#### 1. A task screen has no navigation, and that is enforced rather than asked for

*"Reached by deep link from a message, and from inside the portal — same screen, two entry points.
No navigation chrome to get lost in: land → one decision → done → back to the thread."* The layout
spec states the same rule as a chrome rule about how the member **arrived**: *"arrived from a
message → no shell, one exit back to the thread… A member who tapped a link in a text did not ask
to enter a portal."*

`TaskScreen` builds its own header and **there is no slot in it** — no `children`, no `nav`, no
`actions`. The only control it can carry is the single exit it constructs from `onExit`. This is
`MemberStateView`'s move applied to chrome: the wrong thing is not discouraged, it is
unrepresentable. `title` and `lede` are **words, not markup**, for the same reason — a `ReactNode`
header is a navigation bar waiting to happen.

`TaskDone` is a second component rather than a `state` prop, because its props are not the deciding
screen's: no `action`, no `actionNote`, and a **required** `backHref`. That requirement is
`MemberError`'s `onRetry` argument transposed — a done screen with no way back is a dead end, and a
member who arrived from a text message has no navigation to fall back on. It announces with
`role="status"`, politely, where a failure announces assertively.

**The spec's `.mp--bare` modifier is deliberately absent, and its absence closes a bug.** Bare mode
is a portal with the sidebar suppressed, which is what a task screen is — and implementing it as a
modifier is what produced the one defect the spec documents at length: `:not(.mp--bare)` had to be
threaded through the container query, because without it *"the container query silently restored
the sidebar in bare mode, giving a member who arrived from a text message the full navigable portal
at desktop width… and it only appeared above 720px, so a phone-width check could not catch it."* A
separate component cannot regress that way: there is no sidebar in `TaskScreen` to restore.

#### 2. Onboarding has no progress indicator, and this one is documented rather than enforced

Measured across all eleven canvas steps on 2026-09-02: **none draws one**, and step 9 says so
outright — *"No progress bar."* The prospect canvas states it from the other side, for a member who
leaves and returns weeks later: *"No progress meter, no 'you're 60% done,' no nag banner.
Deliberately nothing to notice was missing."* No step draws a back control either.

That is the arc's thesis, not a preference — *"Starts as a website, becomes a conversation, never
becomes a form"* — and a progress bar is the most form-like thing a screen can grow.

⚠️ **The difference between this rule and the one above is worth keeping.** There is no `step`,
`of`, `progress` or `total` prop, so nothing hands a consumer one; the type fixture asserts that
each of those does not compile. But `children` is a node slot and a consumer can put anything in
it. A component cannot make its own children illegal. The verification therefore checks that the
*chrome* renders no `role="progressbar"` and no counter — which catches this package regressing and
does not catch a consumer. Saying so is worth more than a comment claiming a guarantee that is not
there.

Three things the canvas draws that are deliberately **not** built: the credential step's controls
(*"sign-in method undecided — pending compliance review… none of the three methods is the chosen
one"*), step 11's copy (*"awaiting alex's words — not shippable prose"*), and the 2px `--ink` card
edge on steps 4 and 6, which marks the steps that were new in that revision — annotation addressed
to a reader of the canvas, not a variant.

#### 3. The portal is a container query, and its phone rules are scoped so they cannot race

Desktop is three panes — nav, conversation, destination panel — and **picking a destination swaps
the right panel only**. The conversation never moves: it is the spine of the product, and a portal
that swapped it out would make the thread a destination among five. The sidebar is a fixed 15rem
and the other two are equal halves of what is left; a panel given a fixed width *"made it a rail
beside a wide chat rather than a peer to it"*, which the spec records as its own first build's
mistake.

Phone is the normal case, because *"the member arrives from a link in a text"*, and it is a stack
rather than a shrunken desktop: destination list → destination content, with the conversation as a
full-screen view reached from the message bar. `view` drives that and is inert above the
breakpoint, so a consumer never has to know the rendered width.

**720px, measured against the shell rather than the window.** The spec is explicit about why —
*"the portal may be embedded at a width the viewport knows nothing about"* — and the phone frame it
is drawn in is 360px inside a much wider page.

Each phone rule is scoped to `@max-[720px]` rather than overridden by a `@min-[720px]` rule later
in the file, and that is the same defect as the `.mp--bare` one in general form:
`group-data-[view=pane]/portal:hidden` compiles to two classes' worth of specificity and
`@min-[720px]/portal:flex` to one, so the desktop rule loses no matter what order they sit in.
Confining the phone rule to phone widths means there is nothing to win.

**There is no badge and no unread count**, and there is no prop for one: *"on a member surface a
count is anxiety with no action attached."* A destination is an `<a>` rather than the canvas's
`<button>` — a wireframe has nowhere to navigate to, and `Button`'s own docstring settles the
general case.

#### The primary button is a slot in all three, because two canvases disagree about it

Every shell takes `action` as a node and none of them constructs the control. This is not
squeamishness: the Task Screens canvas fills its primary with `--accent-fill` on `--ring-on-accent`,
which is exactly `Button variant="default"`; the Onboarding canvas fills its primary with `--ink`
on `--card` and draws its secondary as an `--accent-fill` edge with `--accent-ink` text. **Neither
of the latter two is a variant `Button` has.** Picking one here would silently make one canvas
wrong, and inventing a variant is JH201's variant-sheet work. So the shells hold the slot, the
consumer passes the control, and the disagreement is reported rather than absorbed.

What the slot's container does own is the touch floor, with `ThreadEvent`'s limitation intact: a
container can only set a minimum on the box it owns. **Pass `plane="member"` on the control** — it
is the only thing that raises the tap target, and, as one of the mutations below found, the only
thing that moves the control off console type.

#### What is not here

- **The prospect portal.** JH219's card cites `jellyhealth Prospect Portal.dc.html` for "portal
  nav"; that is the pre-payment surface, where a prospect reaches *"exactly two things — the
  conversation with Alex, and a stripped membership explainer… no sidebar at all"*, drawn as two
  tabs rather than a destination list. It is a different shell with a different rule and it is not
  built here. `jellyhealth Portal.dc.html` is the member's own shell and is what this section
  describes.
- **The rows, chips, badges and document grid** inside a destination panel. Those are screen
  content and belong to the portal's own card, not to its chrome.
- **A drawn desktop width for onboarding.** The canvases draw it at phone width only, so the step
  card is capped at `--measure` — the one width token this system has — rather than at a number
  typed here. Flagged rather than invented.

#### Verified by `scripts/verify-member-chrome.mjs`

**76 cases in four parts**, on the split JH218 settled: structure via `renderToStaticMarkup`,
**types** via `tsc` over a fixture whose nine `@ts-expect-error` directives assert that the wrong
chrome does not compile, **layout** in real Chromium in both themes at **360px and 900px**, and the
compiled stylesheet itself — a Tailwind class used only inside a package component compiles to
nothing, silently, so a layout check can pass for the wrong reason if the rule it depends on was
never generated.

**Six mutations were applied and reverted; every one failed.** Two are worth repeating here:

- **The nav's hide rule un-scoped from phone widths** — the spec's own bug, reintroduced — fails
  **2 cases, both at 900px, and nothing at 360px moves.** A phone-width-only harness reports a
  clean sweep. This is why the layout part runs at two widths.
- **`min-w-0 break-words` dropped from a destination label** failed **8 cases, not the 4 expected**:
  desktop was supposed to be safe behind a fixed 15rem sidebar and is not, because the harness also
  renders a 360px shell on the 900px page to prove the breakpoint is a container query. That case
  earned its place twice.

⚠️ **None of this is reachable from a consumer yet.** `web-app/v2` is pinned to `b49123c`, which
predates JH218, so neither the state patterns nor these shells can be imported there until someone
re-pins — a JH217-shaped follow-up, not this card.

---

## The design loop

The visual source of truth lives in **Claude Design**; this repo is where it becomes implementable.

```
   Claude Design                    this repo                   website · web-app/v2
   ─────────────                    ─────────                   ────────────────────
   design system  ◀── /design-sync ──▶  tokens/    ──── git dep ────▶  consume
   (canvas, editable)                  components/
```

- **`/design-sync` must be typed by a human at the Claude Code prompt, in this directory.** An agent
  cannot invoke it. It reads the tokens and React components directly and can create a new design
  system or update an existing one.
- It syncs **one component at a time, never as a wholesale replace** — so the design and the code are
  allowed to disagree temporarily without either being blocked.
- Because every component references a *role* rather than a hex value, changing one role updates it
  everywhere. **A system you cannot change cheaply is not finished, it is early.**

**Source material** — the 17 v6→v9 canvases these tokens came from, and the measured inventory behind
every number in this README, are outside the repo (they are not ours to commit). Ask Gian.

---

## Reaching for the right thing

Every answer below is decided somewhere else in this file. This is the one place that gives them in
the order you hit them, because they all resolve to the same first question: **which product is this
surface in?** Not "which size looks right" — the two ramps overlap in pixels (`--text-console-lg` and
`--text-member-body` are both 16px) and disagree about everything else.

| Deciding | Console — desktop, dense, keyboard | Member and marketing — mobile-first, sparse |
|---|---|---|
| Body copy | `text-console-base` · 13px, *console primary* in `tokens.css` | `text-member-body` · 16px, a **floor** rather than a default |
| Smallest allowed | `text-console-2xs` · 10px | `text-member-caption` · 14px, the ramp's floor |
| Headings | `text-console-xl` and up — size-named steps, no per-role assignment | `text-member-lede` (intro) · `text-member-title` (screen or card) · `text-member-section` (marketing `<h2>`, fluid) — role-named, JH214 |
| Surface padding | `--pad-console-row` 8/14 · `--pad-console-panel` 16/18 | `--pad-member-screen` 24/22 |
| Stacking gap | `--gap-console-thread` 11px | `--gap-member-thread` 18px |
| Numerals | `--numeric-console`, tabular — columns have to align | `--numeric-member`, proportional — it reads as prose |
| Control height | `size` alone: 32 / 36 / 40px | `plane="member"` — raises to `--touch-min`, 44px |

**The headings row is asymmetric on purpose**, and it is worth knowing before you go hunting for a
token that is not missing: the console ramp is named by **size**, the member ramp by **role**. The
console is one dense surface where a step is chosen against its neighbours; the member side is many
single-purpose screens where the same role recurs. Neither ramp is the other's fallback, and a step
borrowed across the line will be the wrong leading even when the pixel size matches — see
§ *Line-height is mapped, not derived*.

Then, in order:

1. **Is there a token?** Read `src/styles/tokens.css` before concluding there is not — it carries
   colour, type, spacing, shape and motion, and a value that looks absent is usually named something
   you did not guess. If nothing covers it, say so and stop rather than filling it in: `AGENTS.md`
   rule 1 exists because an invented value becomes the system the moment it ships.
2. **Is there already a composition?** `member/` holds the pieces that carry a product decision
   (thread, message bubble, field, pending value); `ui/` holds the shadcn primitives, which are atoms
   with no opinion about the product; `brand/` is the wordmark. A member screen assembled only from
   `ui/` comes out console-typed — the warning in § *The member compositions* has the measurement.
3. **Does the primitive know which plane it is on?** If it takes `plane`, pass it. If it does not and
   the surface is member-facing, that is a gap in the primitive, not something a wrapper can fix — a
   wrapper only sets a minimum on the box it owns, which clears the floor for the row and not for the
   tap target inside it.
4. **Did the consumer's `@source` glob move?** A utility used only inside a package component is
   dropped silently, dev and prod, unless the consumer scans `src/components/**/*.tsx`.

---

## House rules

- **No hardcoded colour.** If a component needs a colour with no role, that is a missing role — name it
  here rather than inlining a hex. This is the single rule whose absence produced v1.
- **No prices, anywhere**, including in example copy. The billing model is being rewritten.
- **No clinical values** — doses, thresholds, intervals, lab ranges — without a named clinician's
  sign-off. The canvases leave every one as `___` and that is correct.
- **No severity, urgency or priority ramp.** Flags are a flat, unranked set by deliberate product
  decision; a three-tier ramp would only get used.
- **An error state must never be mistakable for an empty one.** In this product a failed load that
  reads as "nothing to do" is the worst thing we can ship.
- **One system at two densities — never two systems.** Console and member differ by token
  *family* (`--text-console-*` vs `--text-member-*`, `--pad-console-*` vs `--pad-member-*`) and by
  the `plane` axis on a primitive — never by a second copy of a component, a forked scale, or a
  value picked because the shared one "looked wrong here". v1's admin screens read as a different
  product because that split was allowed to become structural. § *Reaching for the right thing* is
  the map.
