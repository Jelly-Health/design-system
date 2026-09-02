import * as React from 'react'

import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { ScreenSkeleton, ThreadSkeleton } from './skeleton'

/**
 * The member plane's four states, and the type that makes three of them un-collapsible — JH218.
 *
 * ══ The rule this file exists for ════════════════════════════════════════════════════════════
 * **A failed load must never read as "nothing to do."** It is a house rule (README § *House
 * rules*) and it is this product's worst failure mode: a member on bad signal is told there is
 * nothing waiting for her. `Thread` already refuses to guess for that reason — *"a container that
 * quietly draws 'No messages' when handed zero children makes the error case and the empty case
 * pixel-identical at the exact moment they must differ."*
 *
 * Documenting that rule is not enough, because the way it gets broken is never a decision. It is a
 * consumer with four states and three renderers, reaching for the nearest one. So this file takes
 * `MemberField`'s move — *an error is a message, or it does not exist* — and applies it to the
 * screen: **the wrong state is a type error, not a review comment.**
 *
 * ══ Why this is NOT `PanelState<T>` ══════════════════════════════════════════════════════════
 * The console's type (`v2/components/provider/console/panel-state.ts`) is three states:
 *
 *     { status: "loading" } | { status: "ready"; data: T } | { status: "error"; attempts: number }
 *
 * **Empty is not in it.** It is folded into `ready` with zero items, so the console's own empty
 * state is `view.needsAttention.length === 0` written at the call site — and `queue-panel.tsx` has
 * to keep empty and failed apart by hand, with an em dash instead of a `0`, a sentence that says
 * *"This is not an empty queue"*, and a reader that resolves `unavailable` rather than an empty
 * view. All three are correct, and all three are conventions a second call site can simply not
 * follow. That is fine on one desktop panel written once. It is not the shape to port to a plane
 * that does not exist yet, because the next member screen would inherit the collapse and none of
 * the discipline.
 *
 * So `empty` is a **fourth variant**, and — the half that actually does the work — `ready` carries
 * a NON-EMPTY list:
 *
 *     { status: 'ready'; items: readonly [T, ...T[]] }
 *
 * `{ status: 'ready', items: [] }` does not compile. A consumer cannot arrive at "ready with
 * nothing in it", which is the state that renders as silence and is therefore indistinguishable
 * from a failure. `scripts/verify-member-states.mjs` proves that with `@ts-expect-error`, so the
 * claim is checked by the compiler rather than asserted here.
 *
 * `attempts` is deliberately not carried over. A2.4 draws *"tried 3×"* on the console; no canvas
 * draws one for a member, and a counter is a piece of product copy, not a free extra.
 *
 * ══ The three things a consumer cannot express ═══════════════════════════════════════════════
 *   1. **`ready` with nothing in it** — the non-empty tuple, above.
 *   2. **An empty state with a retry** — `MemberEmpty` has no such prop. A retry on an empty
 *      screen invites the member to re-fetch a thing that is not broken, and, worse, it hands the
 *      empty state the one affordance that marks a failure.
 *   3. **A failure the member cannot act on** — `onRetry` on `MemberError` is REQUIRED. A dead end
 *      is the state that most reads as "nothing to do": no control, no next step, just words.
 *
 * `MemberStateView` closes the last gap, which is mis-wiring: it owns the switch and constructs
 * both blocks itself, so the empty markup is unreachable from the error branch. The consumer
 * supplies words, never markup.
 */

/**
 * A list with at least one element in it.
 *
 * Exported because a consumer's own render callback has to be able to name the type it is handed,
 * and because `items.length > 0` is not something TypeScript narrows to a tuple on its own —
 * `memberStateFrom` is the sanctioned way across that gap.
 */
type NonEmpty<T> = readonly [T, ...T[]]

type MemberState<T> =
  | { readonly status: 'loading' }
  | { readonly status: 'empty' }
  | { readonly status: 'ready'; readonly items: NonEmpty<T> }
  | { readonly status: 'error' }

/**
 * The only sanctioned way to turn a list that came back from a successful read into a state.
 *
 * It returns the two-variant narrowing rather than the full `MemberState<T>`, so a caller that
 * already knows the read succeeded gets a type that cannot be `loading` or `error`.
 *
 * ⚠️ The one assertion in this file is here, on the line immediately after the length check, and
 * that is the point of the function existing at all: without it every consumer writes its own
 * `as`, and the day one of them writes it on the wrong side of an `if` the guarantee is gone with
 * nothing in the diff to see. One cast, in one place, three lines from its own proof.
 */
function memberStateFrom<T>(
  items: readonly T[],
): { readonly status: 'empty' } | { readonly status: 'ready'; readonly items: NonEmpty<T> } {
  return items.length > 0
    ? { status: 'ready', items: items as unknown as NonEmpty<T> }
    : { status: 'empty' }
}

/**
 * Nothing here yet, and nothing wrong.
 *
 * Deliberately the plainest thing in this file: text on the page ground, no box, no border, no
 * icon and no control. Every one of those absences is doing work, because the ONLY thing that has
 * to be true of this component is that it cannot be mistaken for `MemberError` — and the reliable
 * way to guarantee that is structural, not lexical. A member reading the two at a glance sees a
 * bordered card with a button, or a sentence. Copy alone would not survive a consumer writing
 * *"Nothing to show"* in both.
 *
 * No call to action, following A2.1's *"there is nothing for Alex to start"* — an empty state that
 * asks the member to do something has decided, on no evidence, that the emptiness is her fault.
 *
 * `body` is required for the same reason `MemberField`'s error message is: a bare title is a word
 * on a screen, and "no messages" with nothing after it is precisely the reading the house rule
 * forbids. The sentence that says why it is empty is the whole state.
 */
function MemberEmpty({
  className,
  title,
  children,
  ...props
}: Omit<React.ComponentProps<'div'>, 'children'> & {
  title: string
  /** Required. Say why it is empty — see the docstring. */
  children: React.ReactNode
}) {
  return (
    <div
      data-slot="member-empty"
      className={cn(
        'flex min-w-0 flex-col gap-[var(--space-1)] p-[var(--pad-member-screen)]',
        className,
      )}
      {...props}
    >
      <p className="text-member-title text-ink font-medium break-words">{title}</p>
      <p className="text-member-body text-ink-2 max-w-[var(--measure)] break-words">{children}</p>
    </div>
  )
}

/**
 * The load failed, and the member can do something about it.
 *
 * ── What makes it unmistakable is structure, not colour and not words ────────────────────────
 * Three differences from `MemberEmpty`, each of which survives a consumer writing bad copy:
 *
 *   1. **A retry control, and it is not optional.** `onRetry` is a required prop. This is the one
 *      difference a member reads without reading — a 44px button is either there or it is not.
 *   2. **`role="alert"`.** The non-visual half of the same distinction, and the half that is
 *      easiest to leave out: a member on a screen reader gets an announcement for a failure and
 *      silence for an emptiness, which is the correct pair. `PendingValue` carries its `sr-only`
 *      text for the same reason.
 *   3. **A bounded surface.** `--card` (raised) inside a `--line-strong` edge, where the empty
 *      state has no box at all. The edge is `--line-strong` rather than `--line` for the reason
 *      `MessageBubble` documents: `--card` sits **1.09 ΔL\*** from `--bg` in light, far under the
 *      3 ΔL\* threshold `tokens.css` sets for "a fill difference cannot delimit this", so a
 *      hairline would leave the box undelimited on the surface it most often lands on.
 *
 * ── What it is NOT ───────────────────────────────────────────────────────────────────────────
 * **Not `--danger`.** The console's rule holds here and matters more: copy is neutral ink, because
 * a failed read is not a clinical event and a red screen tells a member something is wrong with
 * her. It is also not a severity tier — there is no ramp in this system, by product decision, so
 * there is no "worse" error block below this one.
 *
 * ── No `"use client"`, deliberately ──────────────────────────────────────────────────────────
 * Same position as `Button`, which also takes an `onClick` and carries no directive: the boundary
 * belongs to the consumer, who knows where its tree turns interactive. What this component does
 * own is the control itself — `plane="member"`, so the tap target clears the 44px floor. Taking a
 * `ReactNode` retry slot instead would have been server-friendlier and would have reproduced
 * exactly the limitation `ThreadEvent`'s docstring records: *"a container can only set a minimum
 * on the box IT owns"*, which clears the floor for the row and not for the thing a member taps.
 * The card asked for the floor, so the component owns the button.
 */
function MemberError({
  className,
  title,
  children,
  onRetry,
  retryLabel = 'Try again',
  ...props
}: Omit<React.ComponentProps<'div'>, 'children'> & {
  title: string
  /** Required. Say what could not be loaded, and that it is not an emptiness. */
  children: React.ReactNode
  /** Required — see 3 in the docstring. A failure the member cannot act on reads as an empty screen. */
  onRetry: () => void
  retryLabel?: string
}) {
  return (
    <div
      data-slot="member-error"
      role="alert"
      className={cn(
        'bg-card border-line-strong flex min-w-0 flex-col items-start gap-[var(--space-1)] rounded-[var(--radius-lg)] border p-[var(--pad-member-screen)]',
        className,
      )}
      {...props}
    >
      <p className="text-member-title text-ink font-medium break-words">{title}</p>
      <p className="text-member-body text-ink-2 max-w-[var(--measure)] break-words">{children}</p>
      <Button
        type="button"
        variant="outline"
        plane="member"
        onClick={onRetry}
        /* `whitespace-normal` and `h-auto` override two of `Button`'s console-era base classes,
         * and both are overflow fixes rather than taste: the base is `whitespace-nowrap` with a
         * fixed `h-9`, so a retry label that is longer than its track — a translation, or a
         * consumer writing more than two words — would run out of the button and then be cut off
         * by its own fixed height. `plane="member"`'s `min-h` still holds the 44px floor; only the
         * ceiling is removed. */
        className="mt-[var(--space-1)] h-auto max-w-full whitespace-normal"
      >
        {retryLabel}
      </Button>
    </div>
  )
}

/**
 * Renders exactly one of the four states, and owns the choice so a consumer cannot make it wrongly.
 *
 * The last hole the type alone leaves open is **mis-wiring**: given `MemberEmpty` and `MemberError`
 * as two importable components, nothing stops `state.status === 'error' ? <MemberEmpty …>`. So the
 * switch lives here and both blocks are constructed internally. The consumer hands over words —
 * `{ title, body }` — never markup, and the empty markup is not reachable from the error branch at
 * all.
 *
 * `skeleton` is a discriminant (`'thread' | 'screen'`) rather than a `ReactNode` for the same
 * reason: a node slot would let the loading state be handed the empty block, which is the third
 * pair the card asks to keep apart.
 *
 * The switch is exhaustive over the union, so a fifth state added to `MemberState` fails to
 * compile here rather than falling through to a blank screen.
 */
function MemberStateView<T>({
  state,
  skeleton,
  empty,
  error,
  children,
}: {
  state: MemberState<T>
  skeleton: 'thread' | 'screen'
  empty: { title: string; body: React.ReactNode }
  error: { title: string; body: React.ReactNode; onRetry: () => void; retryLabel?: string }
  /** Rendered only for `ready`, and handed a list that is guaranteed to have something in it. */
  children: (items: NonEmpty<T>) => React.ReactNode
}) {
  switch (state.status) {
    case 'loading':
      return skeleton === 'thread' ? <ThreadSkeleton /> : <ScreenSkeleton />
    case 'empty':
      return <MemberEmpty title={empty.title}>{empty.body}</MemberEmpty>
    case 'error':
      return (
        <MemberError title={error.title} onRetry={error.onRetry} retryLabel={error.retryLabel}>
          {error.body}
        </MemberError>
      )
    case 'ready':
      return <>{children(state.items)}</>
  }
}

export { MemberEmpty, MemberError, MemberStateView, memberStateFrom }
export type { MemberState, NonEmpty }
