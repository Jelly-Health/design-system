import * as React from 'react'
import { Check, X } from 'lucide-react'

import { cn } from '../../lib/utils'
import { Wordmark } from '../brand/wordmark'
import { Button } from '../ui/button'

/**
 * The task screen — one screen, one job — JH219.
 *
 * ══ The rule this file exists for ════════════════════════════════════════════════════════════
 * **A task screen has no navigation.** The Task Screens canvas states it as the screen's whole
 * purpose — *"Reached by deep link from a message, and from inside the portal — same screen, two
 * entry points. No navigation chrome to get lost in: land → one decision → done → back to the
 * thread"* — and `member-portal.css`, which is the drawn portal's build spec, states the same rule
 * as CSS rather than as prose:
 *
 *     CHROME RULE — arrived from a message → no shell, one exit back to the thread.
 *     Arrived from the portal → shell. A member who tapped a link in a text did not ask to
 *     enter a portal, so the sidebar and identity block are suppressed entirely.
 *
 * That is worth reading twice, because it is the reason this is a component and not a page
 * template: the same task screen is reached from two places, and the one reached from a text
 * message must not grow the portal around it. A member who taps a link in an SMS did not ask to
 * navigate anywhere.
 *
 * ── How the rule is enforced rather than documented ──────────────────────────────────────────
 * `TaskScreen` builds its own header and **there is no slot in it**. No `children`, no `nav`, no
 * `actions` array — the only control it can carry is the single exit it constructs itself from
 * `onExit`. This is `MemberStateView`'s move applied to chrome: the wrong thing is not
 * discouraged, it is unrepresentable. A consumer who wants a second header control has to change
 * this file, which is a review, which is the point.
 *
 * The same argument decides `title` and `lede`: they are **words, not markup**. A `ReactNode`
 * header slot is a navigation bar waiting to happen.
 *
 * ── The one thing this component deliberately does NOT own: the action's appearance ──────────
 * `action` is a slot, and the reason is a conflict between two canvases that this card is not
 * entitled to resolve. The Task Screens canvas draws every primary control filled with
 * `--accent-fill` on `--ring-on-accent`, which is exactly `Button variant="default"`. The
 * Onboarding canvas draws its primary control filled with `--ink` on `--card`, and its secondary
 * as a `--accent-fill` edge with `--accent-ink` text — **neither of which is a variant `Button`
 * has**. Picking one here would silently make one of the two canvases wrong, and inventing a
 * variant is JH201's variant-sheet work, not this card's. So the shell holds the slot, the
 * consumer passes the control, and the disagreement is reported rather than absorbed.
 *
 * What the slot's container DOES own is the touch floor, exactly as `ThreadEvent` does and for the
 * limitation `ThreadEvent`'s docstring records: a container can only set a minimum on the box it
 * owns, so this gives a 44px row with whatever was passed sitting inside it. Pass
 * `plane="member"` on the control itself — that is the only thing that raises the tap target.
 */

/** Shared by both screens below. Wordmark left, exactly one exit right, and no slot between them. */
function TaskScreenHeader({ onExit, exitLabel }: { onExit: () => void; exitLabel: string }) {
  return (
    <header
      data-slot="task-screen-header"
      /* No bottom rule, following the Task Screens canvas, which draws none — and unlike
       * `member-portal.css`'s `.mp__top`, which does. The difference is not an oversight in either
       * place: a portal top bar separates itself from a shell that continues below it, and a task
       * screen has nothing below it to be separated from. */
      className="flex shrink-0 items-center justify-between gap-[var(--space-2)] px-[var(--space-2)] py-[var(--space-1)]"
    >
      {/* The wordmark's first real consumer. It inherits `currentColor` by design, so the surface
       * chooses the colour; on the page ground that is `--ink`, as the canvas draws it — not
       * `--accent-ink`, which is the brand-as-link treatment. */}
      <Wordmark className="text-ink text-member-body" />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        plane="member"
        onClick={onExit}
        aria-label={exitLabel}
        data-slot="task-screen-exit"
      >
        <X aria-hidden="true" />
      </Button>
    </header>
  )
}

/**
 * The deciding screen: land, make one decision, act.
 *
 * `h-full` rather than `h-screen`: this package does not own the viewport, and a task screen is
 * also rendered inside the portal (the canvas's second entry point), where the viewport belongs to
 * the shell. A consumer that wants the full window gives the parent the height.
 */
function TaskScreen({
  className,
  onExit,
  exitLabel = 'Close and go back to your conversation',
  title,
  lede,
  action,
  actionNote,
  children,
  ...props
}: Omit<React.ComponentProps<'div'>, 'title'> & {
  /** Required. A screen with no way out traps a member who tapped a link she did not mean to. */
  onExit: () => void
  exitLabel?: string
  /** Words, not markup — see the docstring. */
  title: string
  lede?: string
  /** The one control this screen exists for. Pass `plane="member"`; the row only floors its box. */
  action?: React.ReactNode
  /** The sentence under the control — *"Nothing is charged until you tap this."* Drawn on three of
   * the canvas's four task screens, so it is a slot rather than something a consumer bolts on. */
  actionNote?: string
}) {
  return (
    <div
      data-slot="task-screen"
      className={cn('bg-bg flex h-full min-h-0 min-w-0 flex-col', className)}
      {...props}
    >
      <TaskScreenHeader onExit={onExit} exitLabel={exitLabel} />
      {/* The scroll region. `min-h-0` is what lets a flex child actually shrink to its parent and
       * scroll inside itself rather than growing the page — the same fix `Thread` documents. */}
      <div
        data-slot="task-screen-body"
        className="min-h-0 min-w-0 flex-1 overflow-y-auto p-[var(--pad-member-screen)]"
      >
        <div className="mx-auto flex w-full max-w-[var(--measure)] min-w-0 flex-col gap-[var(--space-2)]">
          <h1 className="text-member-title text-ink font-medium break-words">{title}</h1>
          {lede === undefined ? null : (
            <p className="text-member-body text-ink-2 break-words">{lede}</p>
          )}
          {children}
          {action === undefined ? null : (
            <div className="mt-[var(--space-1)] flex min-h-[var(--touch-min)] min-w-0 flex-col justify-center">
              {action}
            </div>
          )}
          {actionNote === undefined ? null : (
            <p className="text-member-caption text-ink-3 text-center break-words">{actionNote}</p>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * The screen after the decision: done, and one way back.
 *
 * ── Why it is a separate component and not a `state` prop ────────────────────────────────────
 * Its props are not the deciding screen's props. There is no `action`, no `lede` and no
 * `actionNote`, and there IS a `backHref` — so a single component would need every one of them
 * optional, which is the shape that lets a consumer render a done screen with a primary action on
 * it. Two components with tight props beat one with loose ones, the same trade `MemberEmpty` and
 * `MemberError` make rather than sharing a `MemberBlock` with a `kind`.
 *
 * ── `backHref` is REQUIRED, for `MemberError`'s reason ───────────────────────────────────────
 * *"back to the thread"* is the second half of the sentence this whole screen exists to complete.
 * A done screen with no way back is a dead end, and a member who arrived from a text message has
 * no navigation to fall back on — that is the chrome rule working against her. So the way back is
 * not optional, and it is an **anchor**: it navigates, and `Button`'s own docstring is explicit
 * that `link` is a button styled quietly and *"an anchor is what navigates"*.
 *
 * ── `role="status"`, not `role="alert"` ──────────────────────────────────────────────────────
 * The pair `MemberError` establishes: a failure announces assertively, a completion announces
 * politely. A member on a screen reader has to be told the booking took, or the screen is silent
 * at the one moment silence is indistinguishable from failure.
 *
 * ── The tick is `--success-ink` on `--success-surface`, and that is within the role's rule ────
 * `tokens.css` restricts `--success-ink` to *"a fact that already happened: delivered, recorded"*.
 * A completed task is precisely that, and it is the only place in the member plane that qualifies.
 * It is not a severity tier: there is no ramp above or below it, because this system has none.
 */
function TaskDone({
  className,
  onExit,
  exitLabel = 'Close and go back to your conversation',
  title,
  backHref,
  backLabel = 'Back to jellyhealth',
  children,
  ...props
}: Omit<React.ComponentProps<'div'>, 'title' | 'children'> & {
  onExit: () => void
  exitLabel?: string
  title: string
  /** Required. Say what happened, in a sentence — a bare "Booked" is a word on a screen. */
  children: React.ReactNode
  /** Required — the way back to the thread. See the docstring. */
  backHref: string
  backLabel?: string
}) {
  return (
    <div
      data-slot="task-done"
      className={cn('bg-bg flex h-full min-h-0 min-w-0 flex-col', className)}
      {...props}
    >
      <TaskScreenHeader onExit={onExit} exitLabel={exitLabel} />
      <div
        role="status"
        className="min-h-0 min-w-0 flex-1 overflow-y-auto p-[var(--pad-member-screen)]"
      >
        <div className="mx-auto flex w-full max-w-[var(--measure)] min-w-0 flex-col items-center gap-[var(--space-2)] text-center">
          <span
            data-slot="task-done-mark"
            aria-hidden="true"
            className="bg-success-surface text-success-ink flex shrink-0 items-center justify-center rounded-[var(--radius-round)]"
            /* 48px: the canvas's own mark, and it is not `--touch-min` reused — nothing here is
             * tappable, so borrowing the touch floor would assert an affordance that is not there. */
            style={{ width: '48px', height: '48px' }}
          >
            <Check className="size-6" strokeWidth={2.4} />
          </span>
          <p className="text-member-title text-ink font-medium break-words">{title}</p>
          <p className="text-member-body text-ink-2 break-words">{children}</p>
          {/* An anchor, floored at 44px on the box it owns AND on itself — unlike `ThreadEvent`'s
           * action slot, this component constructs the control, so it can do both.
           *
           * ⚠️ The focus treatment is `ring-ring/50 ring-[3px]`, matching every other component in
           * this package, and it is deliberately NOT the designed `--ring-width` (2px) and
           * `--ring-offset` that `member-portal.css` specifies. Both are true at once: the designed
           * geometry is right and nothing in this package is bound to it yet — README § *What
           * landed* records that as JH201's variant-sheet work. Reaching for it here would put two
           * focus geometries inside one shell, on controls sitting next to each other, which is the
           * "never two systems" house rule failing in miniature. It moves when the whole package
           * moves. */}
          <a
            data-slot="task-done-back"
            href={backHref}
            className="text-accent-ink text-member-body focus-visible:ring-ring/50 mt-[var(--space-1)] inline-flex min-h-[var(--touch-min)] max-w-full items-center justify-center rounded-[var(--radius)] px-[var(--space-2)] font-medium break-words outline-none focus-visible:ring-[3px]"
          >
            {backLabel}
          </a>
        </div>
      </div>
    </div>
  )
}

export { TaskScreen, TaskDone }
