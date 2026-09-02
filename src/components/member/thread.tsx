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
 * differ. The consumer decides which state it is in and renders it; the member state patterns are
 * their own piece of JH212.
 */
function Thread({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="thread"
      className={cn(
        'bg-sur flex flex-col gap-[var(--gap-member-thread)] p-[var(--pad-member-screen)]',
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
      <p className="text-ink-2 text-member-caption text-center [font-variant-numeric:var(--numeric-member)]">
        {children}
      </p>
      {action ? (
        /* The action is a member's tap target, so the row owns the `--touch-min` floor rather than
         * hoping whatever link is passed in happens to clear it. That is not a hypothetical:
         * measured 2026-09-02, all 20 size utilities in this package's primitives are
         * `text-console-*`, and `Button` stands at `h-10` (40px) — below the 44px member floor
         * `tokens.css` calls non-negotiable. A member composition cannot assume a primitive it
         * receives is member-sized, so it enforces the floor on the slot it controls. */
        <div className="text-member-caption mt-1 flex min-h-[var(--touch-min)] items-center justify-center font-medium">
          {action}
        </div>
      ) : null}
    </div>
  )
}

export { Thread, ThreadDay, ThreadEvent }
