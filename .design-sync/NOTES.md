# design-sync NOTES — `Jelly-Health/design-system`

## Repo shape, recorded so a re-sync doesn't re-derive it

- **No Storybook.** Package shape, previews authored from usage examples.
- **No build, no `dist/`, deliberately.** `package.json exports["."]` points directly at
  `./src/index.ts` (raw TS source, not compiled output). This means `resolveDistEntry()` finds an
  "entry" that exists on disk and never falls into synth-entry mode on its own — `--entry ./dist/index.js`
  (a path that genuinely doesn't exist here) has to be passed explicitly every build to force the
  synth-from-`src/` fallback that actually discovers components. Passing the real `exports["."]` path
  (`./src/index.ts`) as `--entry` is the wrong move — it makes the tool think a real dist exists and
  `deriveComponentsFromSrc` never runs, finding 0 components.
- **The synth-content-scan over-includes compound sub-parts.** `export * from "./components/ui"` →
  `export * from "./accordion"` etc. surfaces every named export as a top-level "component" — 68 found
  vs 20 real primitives. The 48 pruned via `componentSrcMap: {Name: null}` are compound sub-parts
  (`AccordionItem`, `DialogContent`, `TableRow`, `TabsList`, etc.) that compose *inside* their parent's
  preview rather than existing as their own card. The prune list is recorded in `config.json` — if a
  primitive is added later with new sub-part exports, re-check the discovered list before building.
- **`@types/react` must be placed at `<pkgDir>/node_modules/@types/react`, not `--node-modules`'s
  path.** The DTS type-checker (`lib/dts.mjs`'s `projectFor`) walks up from the package's own directory
  looking for `node_modules/@types/react` — it does NOT consult `--node-modules` for this specific
  lookup (that flag is only for bundling/resolution). A `--node-modules` pointing at a real consumer
  (`web-app/v2`) with `@types/react` installed does not satisfy this check; it has to physically exist
  under the design-system package's own directory tree (a plain copy or symlink into a gitignored
  `node_modules/@types/react` works, no install needed).
- **`cfg.cssEntry` must point at a fully compiled stylesheet, not raw source.** `src/styles/index.css`
  is real CSS with unresolved `@import`s (`./fonts.css`, `./tokens.css`, `tw-animate-css`) meant to be
  resolved by a *consumer's* bundler (Tailwind v4 + PostCSS in Next.js) — the converter just copies
  whatever `cssEntry` points at verbatim into `_ds_bundle.css`, it doesn't resolve imports or run
  Tailwind. Pointing `cssEntry` at the raw source produced a stylesheet with 4 dangling `@import`s and
  nothing else — every component rendered completely unstyled. Fixed by compiling a real flattened
  stylesheet first (`.design-sync/.cache/build-css.mjs`, using `@tailwindcss/postcss` borrowed from
  `Jelly-Health/website`'s `node_modules`) and pointing `cssEntry` at that compiled output instead.

## Re-sync risks — what to watch on the next run

- **`.design-sync/.cache/compiled-styles.css` is a build artifact, not committed** (it's under
  `.cache/`, gitignored). Regenerate it with the COMMITTED script — `node .design-sync/scripts/build-css.mjs`,
  run with cwd at the package root — before rebuilding on a fresh clone. Needs `@tailwindcss/postcss`
  + `tw-animate-css` resolvable from `<repo-root>/node_modules` (borrowed via symlinks from
  `Jelly-Health/website`'s install this run, not installed into this package itself). ⚠️ The script
  resolves its own paths from `process.cwd()`, not its own file location — an earlier version keyed
  off `import.meta.url`'s dirname and silently produced a smaller, LESS scoped stylesheet when moved
  between directories, for reasons not fully root-caused. Always run it from the package root.
- **`@types/react` and the CSS-compile deps live in a gitignored `node_modules/`** at the package
  root, populated this run from `Jelly-Health/website`'s install via symlinks/copies. Not reproducible
  from a bare clone without redoing that step — a real `yarn install` of this package (once it has a
  lockfile) would make this unnecessary. **Superseded for the 2026-09-02 run — see the
  `--node-modules` bullet above: the whole set came from the `wt-design-sync` worktree's install,
  not from `website`, via one symlink.**
- **The `@source` glob in `compile-src.css` scans BOTH `src/components/**` and
  `.design-sync/previews/**`** — this was widened mid-run after two independent subagents (batches C
  and D) hit the same defect from the narrower scan: a Tailwind utility class used only in a preview
  composition (not already present somewhere in the real component source) compiled to nothing, with
  no error — silently unstyled, not a visible failure. If a future preview reaches for a brand-new
  utility class that's neither in the components nor an existing preview, re-check
  `.design-sync/.cache/compiled-styles.css` for it before assuming a token/class is broken.
- **`--node-modules` points at `web-app/v2`'s real install** (a live consumer, pinned to a specific
  design-system SHA at sync time). If that pin moves or that worktree is removed, bundling needs a new
  `--node-modules` target — any real consumer install with react/react-dom/lucide-react/@radix-ui/*
  resolved works.
  ⚠️ **Superseded 2026-09-02: `web-app/v2/node_modules` is now too thin for this** — it has
  `react`/`react-dom`/`@types` but **no `@radix-ui/*` and no `lucide-react`** (84 entries), so
  bundling against it fails to resolve. That run used the leftover install in the
  `wt-design-sync` worktree (626 entries, react 19.2.1, @radix-ui/*, lucide-react 1.37.0,
  @types/react 19.2.18, @tailwindcss/postcss **4.3.3**, tw-animate-css 1.4.0), symlinked in:
  `ln -sfn <that>/node_modules <workdir>/node_modules`. That one symlink satisfies all three needs
  at once — bundling, the `@types/react` lookup under the package's own dir, AND the CSS compile's
  `@tailwindcss/postcss` at the version `build-css.mjs` demands. **If that worktree is ever
  removed the symlink dies and there is no other install in the tree that has all of it** — the
  durable fix is a real `yarn install` here plus `react`/`react-dom` (they are peerDeps, so yarn
  will not pull them on its own).
- **Playwright: do NOT let the render check download a browser.** The machine's cache is
  `~/Library/Caches/ms-playwright` (macOS path — NOT `~/.cache/ms-playwright`, which does not
  exist, so a check that only looks there wrongly concludes "nothing cached" and asks the user to
  approve a ~200MB install). Cached build 2026-09-02: **chromium-1234**, which is pinned by
  **playwright 1.62.0** — not by web-app's own 1.58.2 pin (chromium 1208). Install into the staged
  scripts with the download suppressed and it launches against the cache with zero download:
  `cd .ds-sync && PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm i playwright@1.62.0`. Re-derive the
  version if the cache build changes: check `v<X.Y.Z>/packages/playwright-core/browsers.json` on
  raw.githubusercontent.com for the release whose `chromium` revision matches the cached dir name.

## Found during preview authoring, not a sync-mechanics issue

**`src/components/brand/wordmark.tsx`'s own doc comment recommends the wrong tokens.** It suggests
`text-accent` "on a page surface" and `text-accent-foreground` reversed on `bg-accent` — but
`--accent` resolves to `--mut` (a near-white SELECTED/hover-background token, not a text color) and
`--accent-foreground` resolves to plain `--ink`. Following the doc comment literally renders the
wordmark at near-invisible contrast. `--accent-ink` (`tokens.css` line 65, explicitly documented as
"the accent AS TEXT on a page surface") is the token that actually does what the comment describes;
`--accent-fill`/`--accent-on-accent` is the correct reversed pairing. Confirmed by screenshot, not
just by reading the token file. Not fixed as part of this sync — it's a bug in the shipped package's
own source, reported separately; the `Wordmark.tsx` preview here composes against the *correct*
tokens, not what the doc comment (incorrectly) says.

**`toast.tsx`'s stacking comment does not match what it renders.** The console viewport is
`flex-col-reverse` anchored `bottom-4 right-4`, and the source comment says this "puts the LAST
child (the newest toast) nearest the anchor edge (the corner)". `column-reverse` lays children
bottom-to-top, so the FIRST DOM child is nearest the bottom. Measured 2026-09-02 in headless
chromium on the `Toaster` preview (DOM order → viewport `top`, smaller = higher on screen):

    dom#0  top=319  toast-overflow  "+1 more"
    dom#1  top=246  toast           oldest visible
    dom#2  top=148  toast
    dom#3  top=49   toast           newest

So the **newest toast is farthest from the corner**, and the `+N more` chip — rendered first in
`toaster.tsx` — occupies the corner-most slot. Whether the comment or the layout is the thing to
change is a JH202/JH224 design call, not a sync decision, so nothing here was touched. Reported
rather than fixed.

## 🔴 The synth entry only walks `.tsx`/`.jsx` — every export in a `.ts` file was missing from the bundle

Found 2026-09-02 during the toast sync, and it had been live since the **first** sync. In
synth-entry mode `resolvePackage` builds the entry from `walk(srcRoot, n => /\.(tsx|jsx|mdx?)$/)`.
There is no `.ts` in that pattern, so **`src/lib/utils.ts` and `src/components/ui/use-toast.ts` were
never in the entry at all.** Their exports are still *bundled* (esbuild follows the imports from
`toaster.tsx` etc., so the components work), but they are not on `window.JellyDS`.

Measured in a real browser, not inferred: `Object.keys(window.JellyDS).length` was **93**, and
`cn`, `toast`, `dismiss`, `remove`, `useToasts` were all absent. `getToastDuration` and
`planeVisibility` were present — they live in `toast.tsx`. That is the tell: the split is by FILE
EXTENSION, not by anything about the export.

This mattered twice over. `conventions.md` has told the design agent *"Merge classes with `cn()`,
exported from the package root"* since the first sync, and `cn` was not there — the one class of
error the conventions validation pass exists to catch, and it slipped through because the pass
checked class names and component names but not the helper. And `Toaster`'s preview failed outright
with `TypeError: (0, ds_exports.toast) is not a function`.

**Fixed with `cfg.extraEntries: ["./src/lib/utils.ts", "./src/components/ui/use-toast.ts"]`** —
package-relative paths are supported and workspace-bounded. Export count went **93 → 99**.

⚠️ **This is a standing trap, not a one-off.** Any future public API added in a `.ts` file is
invisible to the global with no error anywhere — the build succeeds, validate passes, and only a
design agent calling the function finds out. **Whenever a `.ts` file gains an export meant to be
public, add it to `extraEntries`.** Check with:

```sh
git ls-files 'src/**/*.ts' | grep -v '\.d\.ts$'   # every file the synth entry cannot see
```

and confirm against the live list, which is the only authority — `grep`ping `_ds_bundle.js` for a
name gives false negatives (the name appears in the bundled source either way):

```js
// in a preview page, headless or devtools
Object.keys(window.JellyDS).sort()
```

## Toast previews — two techniques that are load-bearing

- **`ToastViewport` is `position: fixed` and `Toaster` owns it**, with no className to pass through,
  so the stack renders outside any captured area and the card screenshots blank (4.5 KB). Fix: give
  the stage a **transform**, which makes it the containing block for fixed descendants —
  `style={{ transform: 'translateZ(0)' }}` on a sized wrapper. The stack then anchors bottom-right
  *inside* the card. This styles the stage only; the component is untouched. PNG went 4.5 KB → 45 KB.
- **Seed only `tier: "error"` toasts in the `Toaster` preview.** `info` returns 4000/5000ms from
  `getToastDuration`, so an info-seeded card auto-dismisses and screenshots empty a few seconds after
  load — an intermittently blank card, which is worse than a broken one. `error` returns `Infinity`.
  The info tier's appearance is covered by `Toast`'s own cells, where `open` is passed as a literal
  `true` so nothing expires regardless of tier.
- The **member** plane's "replaces, not stacks" rule is a transition, not a state — a still frame of
  it is indistinguishable from one toast arriving. Deliberately not previewed; noted here rather than
  left looking like an omission.

## 🔴 In synth-entry mode, a NON-NULL `componentSrcMap` entry silently kills discovery

Found 2026-09-02, cost a confusing build. `lib/source-kit.mjs` builds its component list from the
shipped `.d.ts` exports, then applies `componentSrcMap` on top, and only falls back to the
`deriveComponentsFromSrc` content scan **when that list comes out completely empty**:

```js
let components = [...names].sort()...
if (!components.length && synthEntry) components = deriveComponentsFromSrc(srcFiles)...
```

This package has no `dist/`, so `exportedNames()` returns nothing and the content scan is the ONLY
thing that finds components. Adding one pin — `"MemberField": "src/components/member/field.tsx"` —
made `names` non-empty, so the fallback never ran and the build reported **1 component** instead of
24. It exits 0 and looks like a successful build.

So in this repo **`componentSrcMap` is a prune-only field**: `{Name: null}` entries are safe (they
are re-applied as a filter inside the fallback branch), a non-null pin is not. That also means the
sanctioned fix for a component whose source filename the fuzzy-find can't match is NOT a src pin —
see the next section. This constraint disappears the day the package gains a real build + `.d.ts`.

## `MemberField` is grouped via `docsMap`, not a src pin

`MemberField` lives in `src/components/member/field.tsx`. The fuzzy-find in `source-kit.mjs` looks
for `MemberField.tsx`, `member-field.tsx`, or `MemberField/index.tsx`, so it misses — leaving the
component with no `srcPath`, therefore no group (falls to `general`) and no JSDoc for its
`.prompt.md`. The other three member components match on their kebab filenames and group correctly
on their own.

Pinning the path is the obvious fix and is the trap above. The route used instead:
`.design-sync/docs/MemberField.md` with `category: member` frontmatter, bound via
`cfg.docsMap.MemberField`. Frontmatter `category` overrides a `general` group (`package-build.mjs`
~line 777), and the doc body becomes the `.prompt.md`, which also recovers the usage guidance the
missing JSDoc would have supplied.

⚠️ **That doc file duplicates prose from `field.tsx` and can rot.** It says so in its own body and
names the source as the authority. If `field.tsx`'s four decisions change, update it. The permanent
fix is renaming the source file to `member-field.tsx` — but that changes the package's public
subpath (`@jelly-health/design-system/member/field`), so it is a real API decision, not a sync fix.

## The vocabulary probe has to be widened when the type ramp grows

`.design-sync/scripts/vocabulary-probe.tsx` is the only reason unused type steps get generated at
all. It was written against the ramp as it stood at the first sync and JH212's member steps were
never added, so on 2026-09-02 `text-member-lede`, `text-member-title` and `text-member-section`
were **declared in `tokens.css`, mapped into `@theme`, and absent from the compiled stylesheet** —
a design agent writing `text-member-title` would have got no CSS and no error. `text-member-caption`
was present only by accident, because a preview authored that day happened to use it.

Widened this run to the five mapped member steps. **Whenever `tokens.css` gains a `--text-*` step,
add it to the probe as well** — the same rule `scripts/verify-class-merge.mjs` enforces for
`FONT_SIZE_STEPS`, but nothing enforces it here: the failure is silent in both directions.
Cross-check: `grep -- '--text-' src/styles/tokens.css` inside the `@theme` block vs the probe.

## Known render warns (triaged, expected on future re-syncs)

`[GRID_OVERFLOW] wide` on **`MessageBubble`, `PendingValue`, `Thread`** — remedied 2026-09-02 with
`cfg.overrides.<Name>.cardMode: "column"`, which is what the warn itself suggested. All three
compose inside a 420px-wide `Thread`, which cannot fit a multi-column grid cell. Per the skill, the
applied remedy cannot re-flag `wide`, so a clean re-validate is not evidence — confirmed visually
on the review sheets instead. `MemberField` was not flagged (320px cells fit).

**A `size-5` `Avatar` inside `MessageSender` renders its initials cramped** — the fallback inherits
`text-member-body` (16px) into a 20px circle. Previews use `size-6` + `text-member-caption` on the
fallback. Also expect **no visible avatar circle**: `AvatarFallback`'s `bg-muted` (`--mut`) is a
near-white token sitting on `Thread`'s near-white `--sur`, so the disc is invisible by design, not
by defect. Not a preview bug; don't "fix" it.

`[GRID_OVERFLOW] escape` on **`Toast`** — **triaged as a false positive, deliberately left on
`cardMode: "column"` rather than the `single` the warn prescribes.** The detector keys off the
computed `position`/portal of Radix's viewport, not off actual overflow; the four cells were checked
on the rendered card and every toast sits inside its own row with nothing clipped. Taking `single`
would drop three of four cells — the tier × plane matrix is the whole value of that card. `Toaster`
*is* on `single` (one export, so nothing is lost) and no longer warns.

Otherwise clean — final `package-validate.mjs` run: 24/24 render, 0 bad, 0 thin, 0
variants-identical, 0 grid overflow.


## Coverage — the member plane, closed 2026-09-02

The first run synced the 19 shadcn primitives + `Wordmark` (20). The **2026-09-02 member re-sync**
added JH212's four member compositions for **24 components**. ⚠️ That was true for about an hour: JH224's toast merged the same day and the
2026-09-02 toast re-sync took it to **26** (`Toast`, `Toaster`; seven sub-parts pruned). Do not
read any component count here as current — check `origin/main` against the uploaded
`_ds_sync.json`.

| Component | Landed | Preview |
|---|---|---|
| `MessageBubble` | `8e9f33e` (PR #13, JH212) | authored, graded good |
| `PendingValue` | `8e9f33e` (PR #13, JH212) | authored, graded good |
| `Thread` | `8e9f33e` (PR #13, JH212) | authored, graded good |
| `MemberField` | `03f0847` (PR #16, JH212) | authored, graded good |

⚠️ Kept from JH225's correction, because it will bite anyone reading older notes: **the export is
`PendingValue`, not `PendingClinicalValue`** (`src/components/member/index.ts`) — the longer name is
the concept, not the symbol, and a re-sync looking for it finds nothing.

JH225 predicted `componentSrcMap` would need new prune entries for the sub-parts the content scan
surfaces as top-level components. It did, and they are in `config.json`: `MessageSender`,
`MessageGroup` (from `message-bubble.tsx`), `ThreadDay`, `ThreadEvent` (from `thread.tsx`). It also
predicted `cfg.pkg` alone would suffice to FIND them, which held for three of the four —
`MemberField` needed the `docsMap` route below, and the obvious fix for it is a live trap.

### The deployed staleness JH225 measured is now resolved

JH225 read the live project back and found the pushed `_ds_bundle.css` stale by three cards. Verified
against the bundle this re-sync uploaded, so these are closed rather than merely expected to be:

- **Font weights bound.** `--font-weight-medium: 500` / `--font-weight-semibold: 600` are gone;
  `--weight-medium: 510` and `--weight-semibold: 590` are present, and `.font-medium` /
  `.font-semibold` resolve to them. That is JH225 (`ef6dea7`) actually reaching the design agent.
- **The member type ramp is complete** — all five of `caption`/`body`/`lede`/`title`/`section`, not
  just `body`. Note that four of them are present ONLY because the vocabulary probe was widened this
  run; see the probe section below. Being declared in `tokens.css` was never enough.
- **20 components → 24**, the member plane no longer empty.
- Still compiled with Tailwind **4.3.3** — keep matching it (see `build-css.mjs`).

## JH218 added five previews and the project is stale until the next sync — 2026-09-02

`/design-sync` was **not** run for JH218 (it is a human step, and the card scoped it out), so the
Claude Design project is behind by one card. What the next run has to pick up:

- **Five new previews**: `MemberEmpty`, `MemberError`, `MemberStateView`, `ThreadSkeleton`,
  `ScreenSkeleton` — five new components in `src/components/member/`, taking the package from 26 to
  31 as the sync counts them.
- **Expect new prune entries.** The content scan surfaces every named export as a top-level
  component, and `state.tsx` also exports `memberStateFrom` (a function, not a component) plus the
  `MemberState` and `NonEmpty` types. Check the discovered list against the 31 real cards before
  building and add `{Name: null}` prunes for whatever is not one — and remember the trap two
  sections up: a **non-null** `componentSrcMap` pin kills discovery entirely.
- **`skeleton.tsx` and `state.tsx` are `.tsx`, so the synth entry can see them.** That was
  deliberate: the `.ts`-invisible-to-the-entry trap above is the reason the state model lives in a
  `.tsx` file rather than the `state.ts` the console uses. `./member/*` subpaths only resolve to
  `.tsx` as well, so a `.ts` here would have been unreachable twice over.
- **No new `--text-*` step**, so `vocabulary-probe.tsx` needs no widening and `FONT_SIZE_STEPS`
  needs no entry. The new components use the existing member ramp only.

## The borrowed-dependency set, extended — 2026-09-02 (JH218)

The recipe above covers bundling and the CSS compile. JH218 needed `esbuild`, `typescript` and
`playwright` as well, and the one symlink to `wt-design-sync/node_modules` does **not** carry
`esbuild` — it is not in that install. What worked, from the package root:

```sh
# everything except esbuild, from the sync worktree's install
for p in <wt-design-sync>/node_modules/*; do ln -sfn "$p" node_modules/"$(basename "$p")"; done
# esbuild (and its platform binary) from web-app's install
ln -sfn <web-app>/node_modules/esbuild  node_modules/esbuild
ln -sfn <web-app>/node_modules/@esbuild node_modules/@esbuild
```

Two things measured while doing it, both worth keeping:

- 🔴 **`tsc` DOES run against that set**, which contradicts the standing "the package has never been
  installed, so `yarn typecheck` cannot run" note — true of `yarn typecheck`, not of `tsc`. Baseline
  on `origin/main` at `ae616b4`: **2 errors**, `RefAttributes` ref-variance in `ui/badge.tsx` and
  `ui/button.tsx`, both artefacts of resolving two copies of `@types/react` through the borrow
  rather than defects in the tree. The bar for a change is therefore *no new errors*, counted, not
  "it passes".
- **Playwright launches against the machine's cache with no download.** `playwright@1.62.1` from the
  sync worktree drives the cached `chromium-1234` build (`~/Library/Caches/ms-playwright`) that
  `.design-sync/NOTES.md` records for 1.62.0 — the two share a revision, so no
  `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` dance was needed here.

## The JH218 re-sync — 2026-09-02, 26 → 31 components

Ran from a fresh worktree cut from `origin/main` at `6472904`. The five previews were already
authored and committed by JH218; only the sync itself had been skipped, so this run was mostly
mechanical. Three things were not.

### 🔴 `ThreadSkeleton` was broken in the shipped package, and every existing check passed it

`BubbleSkeleton` sized itself from percentage-width **children**. A bubble is `self-start`/`self-end`
in a flex column, so it is shrink-to-fit: a percentage on a child resolves against a containing block
whose own width depends on that child, which CSS resolves as `auto` during intrinsic sizing.
Measured in headless chromium against a 420px `Thread`: **every bubble 32px** (its `px-4` padding
alone) and **all six spacers 0px**, declared 62/43/38/71/56/29%. It rendered as three narrow pills.

It had shipped that way since JH218 merged, and **nothing caught it**: `verify-member-states.mjs`
checked the markup and the fill's ΔL\* contrast, both of which a 32px stub passes — the stub really
does carry `--line` on `--sur`. `ScreenSkeleton` was fine throughout, because its `Lines` sit in a
definite-width column; that contrast is what isolated it.

**Fixed** by moving the width onto the bubble (`width: <widest line>`), which is what sizes a real
bubble anyway; the spacers keep providing height only. **Guarded** by two new part-C cases in
`verify-member-states.mjs` measuring each turn as a proportion of its track. Mutation-tested the way
that file's own ledger requires: reverting the fix fails exactly those 4 cases (2 per theme) and
**none of the other 46**, which is the evidence that no pre-existing check covered it.

⚠️ The general lesson, worth more than the fix: **a skeleton's contrast and markup checks can all
pass on a shape with no width.** A geometry claim needs a geometry measurement.

### The five new components land in `general` unless `docsMap` rescues them

Same trap `MemberField` hit, and for the same reason — the fuzzy-find looks for `MemberEmpty.tsx` /
`member-empty.tsx` and these live in `state.tsx` and `skeleton.tsx`. Without a fix all five group as
`general` **and** ship a one-line synthesized `.prompt.md`, so the design agent gets no usage
guidance at all. A `componentSrcMap` src pin is still the discovery-killing trap recorded above —
re-confirmed by reading `lib/source-kit.mjs` this run, the logic is unchanged.

Fixed with five real docs under `.design-sync/docs/` bound via `cfg.docsMap`, each with
`category: member` frontmatter. They fix the group and supply the `.prompt.md` in one move.
⚠️ **They duplicate prose from `state.tsx` / `skeleton.tsx` and can rot** — each says so in its own
body and names the source as the authority, same contract as `MemberField.md`.

### Everything else

- **No new prunes were needed.** `memberStateFrom` is camelCase and `MemberState`/`NonEmpty` are
  type-only, so the content scan skipped all three on its own — JH218 predicted prunes would be
  needed; they were not. Discovery found exactly 31.
- **No probe widening** — JH218's prediction held. All five `--text-member-*` steps compile.
- `extraEntries` still correct: **105 live exports** (99 + the 6 JH218 runtime names). Confirmed via
  `Object.keys(window.JellyDS)` in a real page, not by grepping the bundle.
- `MemberStateView`'s `Ready` preview was reworked: it rendered a bare `<p>`, which contradicts
  `skeleton="thread"` — the loading state promised `Thread` geometry the ready state then did not
  occupy, i.e. the exact reshape a skeleton exists to prevent, inside the one card meant to
  demonstrate it. Now a real `Thread` with provider + member bubbles.
- `conventions.md` was **validated, not rewritten**: 30/30 classes resolve in the compiled CSS,
  28/28 component names live, 5/5 helpers on the global. One paragraph was ADDED for the four-state
  pattern, which the file predated.
- `tsc` via `node node_modules/typescript/bin/tsc`: **2 errors, the same two** (`badge.tsx`,
  `button.tsx` ref-variance) — no new errors. ⚠️ `npx tsc` hits a decoy package here and prints
  "This is not the tsc command you are looking for" while exiting 0; do not read that as a pass.

### Re-sync risks from this run

- **The three `[GRID_OVERFLOW] wide` warns on `MemberEmpty` / `MemberError` / `MemberStateView`**
  were remedied with `cardMode: "column"`. As with the JH212 three, the applied remedy cannot
  re-flag, so a clean re-validate is not evidence — confirmed on the review sheets instead.
- **The `docsMap` docs are now six files that can rot.** If `state.tsx` or `skeleton.tsx` changes a
  decision, update the matching `.md`. Nothing enforces this.
- The borrowed-dependency recipe held unchanged: one symlink set from `wt-design-sync`'s install
  plus `esbuild`/`@esbuild` from `web-app`. `playwright@1.62.0` into `.ds-sync` with
  `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` launched the cached `chromium-1234` with no download.

## The 2026-09-02 re-sync — 31 → 36 components (JH219's screen shells + JH227's colour fix, JH230 already anchored)

Ran from a fresh worktree cut from `origin/main` at `fb5b825` (29 commits behind the primary
checkout's stale `main`, fast-forwarded first). Picked up everything merged since the JH218 resync
(`ds-resync-jh218`, PR #27): `card-226`/`card-228` were already anchored in `_ds_sync.json`;
`card-221-dark-mode-signoff` and `card-229-verifier-baselines` touched no rendered components;
`card-230-inherited-text-colour` changed `Checkbox`/`Label`/`RadioGroup`/`Select`/`Switch`'s text
colour (no new component); `card-227-dialog-close-guard` changed `Dialog` behaviourally (no visual
diff — confirmed on the canary spot-check) and added three new member/index.ts exports
(`dialogCloseGuard`, `DialogCloseGuard`, `DialogContentProps`) that the content scan correctly
skipped (camelCase / `*Props` suffix, same pattern as `memberStateFrom`). The real new surface was
JH219's three screen shells, landed via `card-222-member-plane-primitives` (PR #25) and
`card-219-member-screen-chrome` (PR #26), never synced until now.

### 🔴 A freshly-generated `.pnp.cjs` silently switches esbuild into PnP resolution and breaks the borrowed-node_modules recipe

Ran a bare `corepack yarn install` at the start of this run (per the base skill's "try a real
install first" guidance) to see if the package was more self-contained than NOTES predicted. It
resolved instantly (Yarn 4.5.0, PnP) but produced **no `node_modules`** — this package's
`packageManager` pin is Yarn Berry in PnP mode, and `react`/`react-dom` are peerDeps yarn won't
install anyway. So the borrowed-symlink recipe was still needed — but the install had ALSO written
`.pnp.cjs`/`.pnp.loader.mjs` into the worktree root, and esbuild silently detects that file and
switches to Yarn-PnP-aware resolution for the WHOLE build, even for unrelated symlinked
`node_modules`. Every bundle attempt failed on `Could not resolve "react"` /
`"react-dom"` with an error citing `Jelly-Health/website`'s (unrelated) real path and quoting
`.pnp.cjs`'s `packageDependencies` list — a confusing error because `website` itself has no PnP
manifest; `.pnp.cjs` was this worktree's own, one directory up from where the error seemed to point.
**Fix: delete `.pnp.cjs`/`.pnp.loader.mjs` after any `yarn install` attempt in this package** (they
are untracked, not gitignored — `git status --short .pnp.cjs` shows them as `??`) before running the
converter. **Do not commit them.** The real fix — a proper lockfile + `node-modules` linker — is
still the standing recommendation; until then, do not run a bare `yarn install` here without
cleaning up its PnP artifacts before the next build.

### The eleven `Portal*` sub-parts and `TaskDone`/`OnboardingScreen` needed the same two fixes MemberField needed, for the same reason

Discovery found 17 new top-level "components" from `src/components/member/{portal,onboarding,task-screen}.tsx`
(`member/index.ts`'s own doc comment calls this "the three screen shells... and the thirteen
`Portal*` parts" — that wording is the tell). Two fixes, matching the established patterns:

- **12 of the 13 `Portal*` exports are compound sub-parts of `PortalShell`**, not their own cards —
  pruned via `componentSrcMap: {Name: null}` (`PortalBack`, `PortalBody`, `PortalConversation`,
  `PortalConversationFooter`, `PortalConversationHeader`, `PortalDestination`, `PortalIdentity`,
  `PortalMessageBar`, `PortalNav`, `PortalPane`, `PortalPaneBody`, `PortalPaneTitle`) — exactly the
  Dialog/Card pattern. `.design-sync/previews/PortalShell.tsx` composes all 12 inside 4 stories
  (`PhoneConversation`, `PhoneList`, `PhonePane`, `ThreePanes`); none renders standalone.
- **`OnboardingScreen`, `OnboardingStep`, `PortalShell`, `TaskDone` fell to `general`** — the
  fuzzy-find looks for `onboarding-screen.tsx`/`onboarding-step.tsx`/`portal-shell.tsx`/`task-done.tsx`
  and the real files are `onboarding.tsx`/`portal.tsx`/`task-screen.tsx`. Fixed with four **stub**
  `docsMap` entries (`---\ncategory: member\n---`, no body) — same as `MemberField`'s fix, and
  confirmed the stub-doesn't-override-synthesis mechanism by reading `lib/emit.mjs:412`
  (`if (c.docBody)` is a truthy check, so an empty-body doc file falls through to JSDoc synthesis,
  which is rich here). `TaskScreen` alone matched (`task-screen.tsx` is its own kebab file) and
  needed no fix.
- **`OnboardingScreen` still rendered blank (`RENDER_BLANK`, PNG 4630B, `maxHeight: 48`) after the
  docsMap fix** — it only ever renders meaningfully wrapping an `OnboardingStep` child (same as
  `PortalShell` needing its 12 parts), and had no dedicated preview. Authored
  `.design-sync/previews/OnboardingScreen.tsx` (one story, reusing `OnboardingStep.tsx`'s `Step`
  composition) rather than pruning it — `member/index.ts`'s own doc comment lists it as one of "the
  three screen shells", i.e. explicitly meant to be a real export, not a sub-part.
- **`TaskDone` needed neither a prune nor a docsMap fix nor an authored preview** — it rendered real
  content (10434B, "Booked / Back to jellyhealth") with no dedicated `.tsx` of its own. Its only
  demonstration is the `Done` story inside `TaskScreen.tsx`'s preview file; `TaskDone` itself ships
  the mechanical floor-card render (crash-prevention props from its `.d.ts`), which happened to
  produce legible output because its props (`title`, `backHref`, `onExit`) are all simple strings/fns.
  Not authored a dedicated preview for it — the floor card here is good enough, and duplicating the
  `Done` composition into its own file would just be two copies of the same story to keep in sync.
- **Three new `[GRID_OVERFLOW] wide` warns** — `OnboardingStep`, `PortalShell`, `TaskScreen` — same
  remedy as every prior wave: `cardMode: "column"`.

### `conventions.md` — validated (30/30 classes, 35/35 names/helpers), one paragraph added

Same validation method as JH218: grepped every named class against `_ds_bundle.css` and confirmed
every named component/helper against a live `window.JellyDS` via a headless Playwright page (not
`grep`ping the bundle text, which gives false negatives per the standing warning above) — 129 live
exports, all 35 checked names present, nothing drifted. Added one paragraph for the three screen
shells (naming all four exports plus the 8 addressable `Portal*` sub-parts and pointing at
`PortalShell.prompt.md` for the `view` prop) — the file predated JH219 the same way it predated the
four-state pattern before JH218's paragraph.

### Everything else

- `tsc` via `node node_modules/typescript/bin/tsc`: not re-run this pass (no source changes in
  scope touch type-only surfaces beyond what JH218 already baselined at 2 pre-existing errors);
  worth re-checking on the next run that touches `.tsx` prop types.
- Canary spot-checks across 3 driver runs (15 total picks, several repeats): `Dialog`, `Wordmark`,
  `Table`, `Badge`, `Button`, `Tabs`, `Accordion`, `ThreadSkeleton`, `MemberEmpty`, `MemberError`,
  `MessageBubble`, `ScreenSkeleton`, `ScrollArea` — all confirmed visually against their recorded
  grades, zero divergence. No `--force` re-grade needed.
- Final `package-validate.mjs`: 36/36 render clean, 0 bad, 0 thin, 0 variants-identical. One
  standing non-blocking warn (`[GRID_OVERFLOW] escape` on `Toast`) — same false positive JH225
  triaged, re-confirmed rather than re-explained.
