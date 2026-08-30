# `@jelly-health/design-system`

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

## What is not here yet — and why that is deliberate

**No type scale. No spacing scale. No radius scale. No warm/member palette roles. No components.**

These are JH138 checklist items 1.2–1.4 and 2, and they are **design decisions, not transcription.**
A plausible guess written here would become the system by default — every screen built against it
inherits it, and the designer arrives to find the question already answered. That is the mechanism that
produced v1's 157 hardcoded colours.

The measured state of each, as of 2026-08-30:

| | Found in the canvases | Meaning |
|---|---|---|
| Type | **32 distinct sizes**, incl. half-pixels (`12.5px`, `11.5px`, `13.5px`) | Hand-nudged, not a scale |
| Spacing | **20 distinct `gap` values** — 6/7/8/9/10px all in use | Five neighbouring values doing one job |
| Radius | **19 distinct radii** | An 8/12/16 cluster with noise around it |
| Warm palette | cream `#faf7f2`, peach `#ecdfd7`, success `#00793e` | In use, **no role name, no dark value** |

They land here when the design pass produces them.

### One thing in here is a stopgap, not a decision

`--color-ink3` has **no dark value in the canvases.** `tokens.css` sets it to `ink2`'s dark value so
nothing renders invisible — which collapses muted text into secondary text, and `#9691b8` is
simultaneously `--color-line` in dark. A text tone and a border tone sharing one value needs a measured
contrast ratio, not an assertion. Flagged in the file itself; do not read it as settled.

---

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
