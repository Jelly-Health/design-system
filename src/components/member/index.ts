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
 * JH218's state patterns are here for the same test, and it is worth stating why rather than
 * assuming it: `member/` versus `ui/` is decided by whether the thing carries a product decision,
 * and **what a failed load is allowed to say is a product decision** — the house rule that a
 * failure must never read as "nothing to do", the absence of a call to action on an empty screen,
 * the refusal of a severity tier on an error. A primitive with an opinion about any of those would
 * not be a primitive. The skeletons follow the same line one step further down: they are built at
 * member density from member tokens, and a `ui/` skeleton would have to be told which plane it is
 * on, which is the `plane` axis solving a problem this directory does not have.
 *
 * JH219's three screen shells join them on the same test, and they pass it for a reason worth
 * stating: a task screen, an onboarding step and a portal pane are each one product decision about
 * what a member is allowed to see and reach — no navigation on a task screen, no progress meter in
 * onboarding, no unread count in the portal. A primitive holding any of those would not be a
 * primitive. `PortalShell` is the clearest case: its whole content is the chrome rule from
 * `member-portal.css`, which is a statement about how a member arrived, not about layout.
 *
 * ⚠️ Same precondition as `./ui/index.ts`: a star export is only safe while no two modules export
 * the same name. An ambiguous one is dropped with no error. Measured across every component file
 * in this package:
 *
 *   2026-09-02 (JH218)   109 names, 0 collisions   101 pre-existing + 8 (`MemberEmpty`,
 *                                                  `MemberError`, `MemberStateView`,
 *                                                  `memberStateFrom`, `MemberState`, `NonEmpty`,
 *                                                  `ThreadSkeleton`, `ScreenSkeleton`)
 *   2026-09-02 (JH222)   115 names, 0 collisions   + 6 cva functions, as the last five primitives
 *                                                  took the `plane` axis (`labelVariants`,
 *                                                  `selectTriggerVariants`, `selectItemVariants`,
 *                                                  `checkboxVariants`, `switchVariants`,
 *                                                  `radioGroupItemVariants`)
 *
 *   2026-09-02 (JH219)   132 names, 0 collisions   + 17, the three screen shells (`TaskScreen`,
 *                                                  `TaskDone`, `OnboardingScreen`,
 *                                                  `OnboardingStep`, and the thirteen `Portal*`
 *                                                  parts)
 *
 *   2026-09-02 (JH227)   135 names, 0 collisions   + 3, the dialog close guard
 *                                                  (`dialogCloseGuard`, `DialogCloseGuard`,
 *                                                  `DialogContentProps`). A fourth card in one
 *                                                  day, and the check caught it rather than a
 *                                                  reviewer — which is the whole point of it
 *
 *   ⚠️ This walk counts DECLARED export names across `src/components/`, types included, so it is
 *   a different denominator from `ui/index.ts`'s 94 (values only, that directory only). Both are
 *   right; neither reproduces the other. Stated here because two counts of "the exports" that
 *   disagree by 41 look like one of them is stale.
 *
 * Re-run it if a component gains an export; `scripts/verify-member-states.mjs` does the count, so
 * it is checked rather than remembered — which is how JH222 found out it had moved this number,
 * and how JH219 found out JH222 had, two hours later. Three cards moved it in one day; the table
 * is the argument for a check rather than a sentence.
 *
 * ⚠️ The 82 this comment used to quote was correct on the day and was a card stale by the time it
 * was read: JH224's toast landed the same afternoon and took the real figure to 101, with nothing
 * prompting a recount here. That is the argument for the count living in a script rather than in a
 * sentence.
 *
 * (No glob written literally in this comment: a `tsx` glob contains the two characters that close
 * a block comment, which is how the first cut of this file failed to compile.)
 */
export * from './message-bubble'
export * from './thread'
export * from './pending-value'
export * from './field'
export * from './skeleton'
export * from './state'
export * from './task-screen'
export * from './onboarding'
export * from './portal'
