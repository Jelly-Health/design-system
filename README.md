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
| Type | Inter Variable (single family — Source Serif 4 retired), weights 300/400/510/590, 11-step size ramp, negative tracking scaled to size |
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
- **Added 2026-09-01: `src/fonts/next-font/` — an undivided Latin+Ext file per Inter face, for a
  consumer that cannot apply the split above.** `next/font/local` (verified against Next 16.0.10)
  applies one `declarations` array to every `src` entry in a call, so it has no way to give two files
  of the same face two different `unicode-range`s — `web-app/v2` hits this because its literal `src`
  paths are statically analysed at build time and can't route through `fonts.css`. These consumers get
  154,540 bytes per face (57% off the 352,240-byte original) instead of the 67KB-for-English number
  above; `scripts/subset-fonts.sh` generates them from the same source in the same run, and
  `scripts/verify-fonts.py` holds them to the same axis/feature/coverage bar, checked against both
  ranges combined since one file now stands in for both slices. Not referenced by `fonts.css` on
  purpose — see the comment in `scripts/subset-fonts.sh`.
- **The legacy `--jh-*` brand ramp is deprecated but still shipped.** 22 live call sites in `v2`
  (`brand-300` ×19, `brand-700` ×2, `brand-025` ×1). It is re-pointed onto roles so those sites stay
  on-palette; it should shrink to nothing as they are touched.
- **No lockfile.** The package has never been installed, so `yarn typecheck` cannot run. Creating one
  is bound up with the release-process decision that is still open.

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
