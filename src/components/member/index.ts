/* The member-facing compositions (JH212).
 *
 * These are not shadcn primitives and deliberately do not live in `./ui`. A primitive is an atom
 * with no opinion about the product — a button, an input. Everything here carries a product
 * decision that `tokens.css` records and that the canvases settled: which voice sits on which
 * side, what a state change is allowed to say, what an unapproved clinical value looks like. Two
 * directories keep that distinction visible, the way `./brand` already does for the wordmark.
 *
 * Consumers can import the subpath — `@jelly-health/design-system/member/thread` — to keep the
 * rest out of the module graph, exactly as the `ui` subpath is exported for.
 *
 * ⚠️ Same precondition as `./ui/index.ts`: a star export is only safe while no two modules export
 * the same name. An ambiguous one is dropped with no error. Measured 2026-09-02 across every
 * component file in this package: **78 exported names, 0 collisions** — 70 of them pre-existing,
 * 8 added here. Re-run it if a component gains an export.
 *
 * (No glob written literally in this comment: a `tsx` glob contains the two characters that close
 * a block comment, which is how the first cut of this file failed to compile.)
 */
export * from './message-bubble'
export * from './thread'
export * from './pending-value'
