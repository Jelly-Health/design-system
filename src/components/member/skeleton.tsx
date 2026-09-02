import * as React from 'react'

import { cn } from '../../lib/utils'
import { Thread } from './thread'

/**
 * The two member-plane loading states — JH218.
 *
 * ── Why a skeleton and never a spinner ───────────────────────────────────────────────────────
 * The console settled this and the reasoning transfers without change: *"a skeleton holds the
 * panel's real geometry"* (`v2/components/provider/console/panel-frame.tsx`), so the layout does
 * not reshape itself when the read lands. What does NOT transfer is the density. The console
 * skeletons are built from `--pad-console-row` (8/14) and `--gap-console-thread` (11px); these are
 * built from `--pad-member-screen` (24/22) and `--gap-member-thread` (18px), and every block height
 * below is derived from a member type step times its own mapped leading rather than picked.
 *
 * ── The fill is `--line`, and the choice was measured rather than taken ──────────────────────
 * A skeleton block is a shape that has to be delimited by its fill alone — there is no text in it
 * and no border on it. `tokens.css` already states the threshold for exactly that question: a fill
 * under **3 ΔL\*** from the surface it lands on cannot delimit itself, which is why the two warm
 * `MessageBubble` voices carry a `--line-strong` edge. The obvious pick, `--mut`, fails it:
 *
 *     --mut  on --sur   ΔL* 2.77 (light)   — under the threshold, on the Thread's own surface
 *     --line on --sur   ΔL* 9.07 (light) · 10.04 (dark)
 *     --line on --bg    ΔL* 11.82 (light) · 12.24 (dark)
 *     --line on --card  ΔL* 12.91 (light) · 6.99 (dark)
 *
 * So `--line` is the one existing role that clears the threshold on all three member surfaces in
 * BOTH themes, and that is the whole argument for using a boundary token as a fill here.
 * `scripts/verify-member-states.mjs` recomputes those four numbers from `tokens.css` and fails if a
 * retune drops any of them under 3 — the numbers above are enforced, not remembered.
 *
 * ── It is announced, not merely drawn ────────────────────────────────────────────────────────
 * `role="status"` plus `aria-busy` plus an `sr-only` label. A member on bad signal is exactly the
 * person most likely to be on a screen reader waiting on this, and a screen of unlabelled grey
 * rectangles reads as nothing at all — the same "silence is indistinguishable from failure" trap
 * `PendingValue` takes its `sr-only` text for.
 *
 * Both are plain, stateless and free of `"use client"`: identical markup on every render, so a
 * consumer can flush one in a `<Suspense>` fallback the way the console does.
 */

/** A block that stands in for `lines` lines of `step`-sized copy, at that step's mapped leading. */
function Lines({
  step,
  leading,
  widths,
}: {
  step: string
  leading: string
  widths: readonly string[]
}) {
  return (
    <>
      {widths.map((width, i) => (
        <div
          key={`${width}-${i}`}
          data-slot="skeleton-block"
          className="bg-line animate-pulse rounded-[var(--radius-badge)]"
          /* Height is the step times its own leading, so the block occupies the space the real
           * line will occupy — that is what "holds the real geometry" means here. Both halves are
           * tokens; the multiplication is not a new value. The stagger is the console's, and it is
           * the only reason a row of pulses reads as content arriving rather than as a barber's
           * pole. */
          style={{
            width,
            height: `calc(var(${step}) * var(${leading}))`,
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
    </>
  )
}

/** One turn's bubble, at `MessageBubble`'s own padding, radius and 88% cap. */
function BubbleSkeleton({
  side,
  widths,
}: {
  side: 'start' | 'end'
  widths: readonly string[]
}) {
  /* 🔴 The BUBBLE carries the width, not the spacers inside it. A bubble is `self-start`/`self-end`
   * in a flex column, so it is shrink-to-fit: a percentage on a CHILD resolves against a containing
   * block whose own width depends on that child, which CSS resolves as `auto` during intrinsic
   * sizing. Every spacer therefore computed to 0 and every bubble to its 32px of padding —
   * measured in headless Chromium 2026-09-02 against a 420px Thread, all six of 62/43/38/71/56/29%
   * flat zero. The skeleton rendered as three narrow pills and nothing caught it: the fill-contrast
   * and markup checks all pass on a 32px stub. A real bubble is sized by its WIDEST line, so that
   * is what sizes this one; `verify-member-states.mjs` part C now measures it. */
  const widest = widths.reduce((a, b) => (parseFloat(b) > parseFloat(a) ? b : a))
  return (
    <div
      data-slot="skeleton-block"
      style={{ width: widest }}
      className={cn(
        'bg-line flex max-w-[88%] animate-pulse flex-col gap-[var(--space-1)] rounded-[var(--radius-bubble)] px-4 py-3',
        side === 'end' ? 'self-end' : 'self-start',
      )}
    >
      {/* Transparent spacers: the bubble is one solid shape, and these only give it the height a
       * real bubble of this many lines would have. Two tones inside one bubble would need a second
       * fill that clears 3 ΔL* against `--line` in both themes, and no role does. */}
      {widths.map((width, i) => (
        <div
          key={`${width}-${i}`}
          style={{ height: 'calc(var(--text-member-body) * var(--leading-relaxed))' }}
        />
      ))}
    </div>
  )
}

/**
 * The conversation, loading.
 *
 * Renders a real `<Thread>` rather than re-declaring its container classes, so the surface, the
 * 18px turn gap and the 24/22 screen padding cannot drift from the thing this stands in for. The
 * turns are ragged and alternate sides on purpose — a stack of equal blocks on one side reads as a
 * list, and the panel would reshape into a conversation when the read landed.
 */
function ThreadSkeleton({
  className,
  label = 'Loading the conversation',
  ...props
}: React.ComponentProps<'div'> & { label?: string }) {
  return (
    <Thread
      data-slot="thread-skeleton"
      role="status"
      aria-busy="true"
      className={className}
      {...props}
    >
      <span className="sr-only">{label}</span>
      <BubbleSkeleton side="start" widths={['62%', '43%']} />
      <BubbleSkeleton side="end" widths={['38%']} />
      <BubbleSkeleton side="start" widths={['71%', '56%', '29%']} />
    </Thread>
  )
}

/**
 * A task screen, loading — a title, a paragraph, and the control at the bottom of it.
 *
 * Unlike the thread there is no container component to mirror, because no member screen layout
 * exists in this package yet; the padding and gaps are therefore written here from the same tokens
 * a screen would use. The control block is `--touch-min` tall rather than a button height: a
 * skeleton that reserves 36px and is replaced by a 44px control moves everything under it.
 */
function ScreenSkeleton({
  className,
  label = 'Loading',
  ...props
}: React.ComponentProps<'div'> & { label?: string }) {
  return (
    <div
      data-slot="screen-skeleton"
      role="status"
      aria-busy="true"
      className={cn(
        'flex min-w-0 flex-col gap-[var(--space-3)] p-[var(--pad-member-screen)]',
        className,
      )}
      {...props}
    >
      <span className="sr-only">{label}</span>
      <Lines step="--text-member-title" leading="--leading-snug" widths={['64%']} />
      <div className="flex min-w-0 flex-col gap-[var(--space-1)]">
        <Lines
          step="--text-member-body"
          leading="--leading-relaxed"
          widths={['100%', '96%', '73%']}
        />
      </div>
      <div className="flex min-w-0 flex-col gap-[var(--space-1)]">
        <Lines step="--text-member-caption" leading="--leading-relaxed" widths={['34%']} />
        <div
          data-slot="skeleton-block"
          className="bg-line w-full animate-pulse rounded-[var(--radius)]"
          style={{ height: 'var(--touch-min)' }}
        />
      </div>
    </div>
  )
}

export { ThreadSkeleton, ScreenSkeleton }
