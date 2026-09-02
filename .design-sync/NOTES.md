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

## Known render warns (triaged, expected on future re-syncs)

None outstanding — `package-validate.mjs`'s final run reports `render check: 20/20 previews render
cleanly`, zero warns.


## Coverage gap, as of this commit

This run synced the 19 shadcn primitives + `Wordmark` — 20 components, everything that existed in
`src/components/ui/` and `src/components/brand/` when it started. **JH212** (merged `4b56f19`,
concurrently with this run) added three more under `src/components/member/`: `MessageBubble`,
`PendingClinicalValue`, `Thread`. Not covered here — a future re-sync picks them up; `cfg.pkg`
already scopes discovery to the whole package root (`src/index.ts`), so no config change is needed,
just running the driver again.
