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
  identically.

## What landed, and what is still absent

**Type, spacing, shape and motion scales are now here.** They were withheld until the design pass
produced them — a plausible guess written earlier would have become the system by default. The pass
shipped as `jh-design-system-v10` and JH206 commit 3 brought all four in, along with the designed
colour values.

| | State |
|---|---|
| Colour | 25 roles, both themes. 150 contrast pairs recomputed from the values in this file: **0 failures**, 7 within 0.15 of their floor and marked `tight` |
| Type | Inter Variable (single family — Source Serif 4 retired), weights 300/400/510/590, 11-step size ramp **under `--text-console-*`** (see [Type: sizes are prefixed](#type-sizes-are-prefixed-and-that-is-the-point)), negative tracking scaled to size |
| Spacing | 8px base, 9 steps plus named surface paddings and a 44px member touch floor |
| Shape | Split radius vocabulary — 6px buttons, 12px cards, 4px badges, 12px ceiling — plus one floating-layer shadow |
| Motion | 100/120/200ms, one easing curve, focus-ring geometry |
| Components | The 19 shadcn primitives (`accordion` through `tooltip`), extracted from `web-app/v2/components/ui/` by **JH207**. `src/index.ts` exports all of them; `./ui/*` subpath exports the same components individually |

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
- **There is no member/marketing type ramp.** The size scale is console density under
  `--text-console-*`; on the member side there is exactly one type token, `--text-member-body`
  (16px), plus `--text-h1` for a marketing hero. A member or marketing surface therefore has no
  designed step for anything between those two and falls back to Tailwind's stock ramp, which is
  Tailwind's decision and not ours. Naming those steps needs new values, so it is a designer task
  (`/design-sync`) rather than something to fill in — see rule 1. Raised 2026-09-01 from JH211;
  it is what currently blocks `Jelly-Health/website` from retyping its nav, CTAs and footer.
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
is bound again, and it is mutation-tested against all five ways of doing it.

**Member surfaces must opt out explicitly.** Use `--text-member-body` (16px) for body copy and
`--text-h1` for a marketing hero — the one fluid step in the system,
`clamp(2rem, 2.2vw + 1.35rem, 3.5rem)`, since the console sits at a 1280px floor and never scales.
Anything between those two steps is currently undesigned; see Known gaps.

Decided 2026-09-01, [JH138](https://trello.com/c/9BYx5GAH).

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
