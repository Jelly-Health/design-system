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
  lockfile) would make this unnecessary.
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

Otherwise clean — final `package-validate.mjs` run: 24/24 render, 0 bad, 0 thin, 0
variants-identical, 0 grid overflow.


## Coverage — closed 2026-09-02

The first run synced the 19 shadcn primitives + `Wordmark` (20). The **2026-09-02 re-sync** added
JH212's four member compositions — `MessageBubble`, `Thread`, `PendingValue`, `MemberField` — for
**24 components**, which is everything exported from `src/components/` today. The prediction above
that "no config change is needed" turned out to be wrong in two ways; both are recorded below.
