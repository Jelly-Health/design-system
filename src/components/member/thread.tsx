import * as React from 'react'

import { cn } from '../../lib/utils'

/**
 * The member's conversation — the scroll region the bubbles and event rows live in.
 *
 * ── The surface, and why it is not the one the canvas drew ───────────────────────────────────
 * `--sur`, whose role is "recessed: sidebars, section headers". A thread is a recessed region, so
 * this is the role rather than a look. The v9 Conversation Spine canvas drew the message list on
 * `--mut-soft`, which `tokens.css` labels "HOVER. A whisper." — that predates the design pass and
 * using it here would repurpose a hover token as a permanent surface, which is the failure mode
 * the whole role layer exists to prevent. Every bubble's edge and contrast in `message-bubble.tsx`
 * is measured against `--sur` on that basis.
 *
 * ── Spacing ──────────────────────────────────────────────────────────────────────────────────
 * `--gap-member-thread` (18px) between turns, `--pad-member-screen` (24px 22px) around the
 * region. Both are member-density tokens that already ship; the console's equivalents
 * (`--gap-console-thread`, 11px) are deliberately not reachable from here.
 *
 * ── What this component does NOT do ──────────────────────────────────────────────────────────
 * It renders no empty state. That is not an omission: "a failed load must never read as 'nothing
 * to do'" is a house rule, and a container that quietly draws "No messages" when handed zero
 * children makes the error case and the empty case pixel-identical at the exact moment they must
 * differ. The consumer decides which state it is in and renders it; the member state patterns
 * shipped separately as JH218 and are in `./state` and `./skeleton`.
 *
 * ── Overflow: this is the container that scrolls, and the body never does ────────────────────
 * `overflow-y-auto` engages only once a consumer constrains the height, which is the case the
 * docstring above has always described ("the scroll region") and never actually implemented — a
 * thread longer than its screen simply grew the page. Note the side effect and that it is wanted:
 * CSS computes `overflow-x: visible` to `auto` when the other axis is not visible, so anything too
 * WIDE now scrolls inside this box rather than pushing the document sideways. `min-w-0` is what
 * lets the box shrink below its content when it is itself a flex item; without it a long word in a
 * bubble widens the thread instead of wrapping in it.
 */
function Thread({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="thread"
      className={cn(
        'bg-sur flex min-w-0 flex-col gap-[var(--gap-member-thread)] overflow-y-auto p-[var(--pad-member-screen)]',
        className,
      )}
      {...props}
    />
  )
}

/**
 * The date heading events and messages cluster under.
 *
 * Uppercase, and therefore the one place the system's negative-tracking rule inverts:
 * `--tracking-micro` is positive because uppercase always needs it. Numerals take
 * `--numeric-member` (proportional) rather than the console's tabular figures — nothing here is a
 * column to be scanned down.
 */
function ThreadDay({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="thread-day"
      className={cn(
        'text-ink-3 text-member-caption self-center font-medium tracking-[var(--tracking-micro)] uppercase [font-variant-numeric:var(--numeric-member)]',
        className,
      )}
      {...props}
    />
  )
}

/**
 * A state change — a refill shipped, a dose changed, a draw recorded.
 *
 * A hairline row, centred, never a bubble and never an avatar. The three rules the v9 canvas
 * settled, all of which are the consumer's to honour rather than this component's to enforce:
 *
 *   1. One row per state change a member would notice, never one per state the machine emits.
 *   2. Rows cluster under a `ThreadDay` and never interrupt an exchange mid-turn.
 *   3. Each row names the destination that owns it — that is what `action` is for.
 *
 * The copy states a fact in the PAST TENSE. It never asks a question, offers an interpretation, or
 * tells the member what to do about it; the canvas is explicit that this is "the whole of the
 * difference between this and the thing the audit refused." An event row is also never a place to
 * put a severity or urgency treatment: flags are a flat set by product decision, and a row that is
 * important twice looks exactly like a row that is important once.
 */
function ThreadEvent({
  className,
  action,
  children,
  ...props
}: React.ComponentProps<'div'> & { action?: React.ReactNode }) {
  return (
    <div
      data-slot="thread-event"
      className={cn('border-line border-y py-3', className)}
      {...props}
    >
      {/* `break-words`: an event row names a destination and can carry a long one — a medication
          name, a member's own words quoted back. Centred text that cannot break runs out of the
          row in both directions at once. */}
      <p className="text-ink-2 text-member-caption text-center break-words [font-variant-numeric:var(--numeric-member)]">
        {children}
      </p>
      {action ? (
        /* The action is a member's tap target, so the row owns the `--touch-min` floor rather than
         * hoping whatever link is passed in happens to clear it. That is not a hypothetical:
         * re-measured 2026-09-02, all 21 size utilities in this package's primitives are
         * `text-console-*` (18 of them `text-console-sm`, i.e. 12px), and `Button`'s DEFAULT size
         * is `h-9` — 36px, not the 40px this comment first claimed, which is `size="lg"`. Every
         * one of the six sizes is below the 44px member floor `tokens.css` calls non-negotiable.
         *
         * ⚠️ What a wrapper can do about that is limited, and this line is the limit: a container
         * can only set a minimum on the box IT owns, so this produces a 44px row with whatever the
         * consumer passed sitting inside it at its own height. The row clears the floor; the thing
         * a member actually taps may not. The real fix is `plane="member"` on the control itself
         * (JH212, second slice) — see `Input`'s docstring. Prefer passing a member-plane control
         * here; this floor stays as the backstop for anything else. */
        <div className="text-member-caption mt-1 flex min-h-[var(--touch-min)] items-center justify-center break-words font-medium">
          {action}
        </div>
      ) : null}
    </div>
  )
}

export { Thread, ThreadDay, ThreadEvent }
