#!/usr/bin/env node
/**
 * Compiles a flattened, real stylesheet for the design-sync converter's `cfg.cssEntry` to point
 * at. src/styles/index.css ships unresolved `@import`s (fonts.css/tokens.css/tw-animate-css) meant
 * for a CONSUMER's own bundler to resolve -- the design-sync converter just copies whatever
 * cssEntry points at verbatim, it doesn't run Tailwind itself. Without this, every component
 * renders completely unstyled (4 dangling @imports, nothing else).
 *
 * @source in compile-src.css scans BOTH the real component source (src/components/**) and the
 * authored preview compositions (.design-sync/previews/**) -- narrower scopes miss any utility
 * class a preview reaches for that isn't already used somewhere in the real components (found by
 * two independent subagents hitting the same defect during JH -- see .design-sync/NOTES.md).
 * vocabulary-probe.tsx additionally safelists the full text-console-* / text-member-body / text-h1 /
 * radius vocabulary so it's generated regardless of whether the current 20 components happen to
 * use every step -- a design agent composing NEW UI with this DS needs the full ramp available,
 * not just whatever's incidentally used today.
 *
 * MUST be run with cwd at the design-system package root (paths below are cwd-relative, not
 * relative to this script's own location -- that indirection produced a silently truncated
 * ~55KB compile in testing, vs. the correct ~113KB, for reasons not fully root-caused; cwd-relative
 * paths sidestep it entirely). Requires @tailwindcss/postcss + tw-animate-css resolvable from
 * <repo-root>/node_modules -- see NOTES.md for how this run sourced them (symlinked from
 * Jelly-Health/website's install; this package itself has no lockfile yet).
 *
 *     cd <design-system repo root>
 *     node .design-sync/scripts/build-css.mjs
 */
import postcss from 'postcss';
import tw from '@tailwindcss/postcss';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const entry = path.join(root, '.design-sync', 'scripts', 'compile-src.css');
const out = path.join(root, '.design-sync', '.cache', 'compiled-styles.css');

const css = fs.readFileSync(entry, 'utf8');
const result = await postcss([tw({ base: path.dirname(entry) })]).process(css, { from: entry });
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, result.css);
console.log(`compiled ${result.css.length} bytes -> ${path.relative(root, out)}`);
