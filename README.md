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
- **Overused Grotesk**, four weights, self-hosted.
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

**Still absent: components.** `src/index.ts` exports `cn` and nothing else. That is JH207.

### Known gaps, recorded rather than hidden

- **Font payload grew by ~509KB.** Inter Variable (352KB) plus its italic (388KB) against the four
  Overused Grotesk faces (251KB) it replaced. The italic is used in exactly two places, both
  empty-state labels. Neither file is subsetted; subsetting to Latin is the fix and has not been done.
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
