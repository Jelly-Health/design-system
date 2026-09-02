import * as React from 'react'

import { cn } from '../../lib/utils'
import { Wordmark } from '../brand/wordmark'

/**
 * The onboarding chrome — the eleven-step arc — JH219.
 *
 * ══ The rule this file exists for ════════════════════════════════════════════════════════════
 * **There is no progress indicator.** Not a bar, not a "step 3 of 11", not a dot rail. Measured
 * across `jellyhealth Onboarding.dc.html` on 2026-09-02: **none of the eleven steps draws one**,
 * and step 9 says so in as many words — *"Two questions, one sitting. No progress bar."* The
 * prospect canvas states the same rule from the other side, for a member who leaves and comes
 * back weeks later: *"No progress meter, no 'you're 60% done,' no nag banner. Deliberately nothing
 * to notice was missing."* And there is no back control on any step either.
 *
 * That is not a styling preference, it is the arc's thesis — *"Starts as a website, becomes a
 * conversation, never becomes a form"*. A progress bar is the single most form-like thing a screen
 * can grow, and it converts a conversation into a task with a remaining count. It is the same
 * argument `MemberField` makes about the required marker, one level up.
 *
 * ⚠️ **This rule is documented, not enforced, and the difference matters.** There is no `step`,
 * `of`, `progress` or `total` prop, so nothing here hands a consumer one — but `children` is a
 * node slot, and a consumer can put anything in it. A component cannot make its own children
 * illegal. `scripts/verify-member-chrome.mjs` therefore asserts the *chrome* renders no
 * `role="progressbar"` and no step counter, which catches this file regressing and does not catch
 * a consumer. Saying so is worth more than a comment claiming a guarantee that is not there.
 *
 * ══ What is deliberately NOT here ════════════════════════════════════════════════════════════
 *   - **The credential step's controls.** Step 4 and the task-screen deep-link landing both draw
 *     three candidate sign-in methods inside a dashed warning: *"⚠ sign-in method undecided —
 *     pending compliance review… none of the three methods is the chosen one; do not draw this as
 *     settled."* That annotation is addressed to whoever builds it, not to the member, so nothing
 *     of it is drawn here — and the step itself is a shell around an undecided control.
 *   - **Step 11's copy.** *"awaiting alex's words — not shippable prose."* The shell is buildable;
 *     the words are a named human's to write.
 *   - **The 2px `--ink` card edge on steps 4 and 6.** It marks the steps that were NEW in the
 *     revision, for the reader of the canvas. It is annotation, not design — reading it as a
 *     variant would ship an emphasis treatment that no shipped screen is supposed to have.
 *
 * ══ The action is a slot, and this file is why ═══════════════════════════════════════════════
 * Every step's primary control is drawn `background: var(--ink); color: var(--card)`, and step 6's
 * secondary as a `--accent-fill` edge with `--accent-ink` text. **Neither is a variant `Button`
 * has**, and the Task Screens canvas fills its primary with `--accent-fill` instead — so the two
 * canvases disagree about the member plane's primary button. Resolving that is a variant-sheet
 * decision (JH201), not this card's, and inventing a variant here would silently make one of the
 * two canvases wrong. So both shells hold a slot and neither picks. See README § *The member
 * screen chrome*.
 */

/**
 * The page an onboarding step sits on.
 *
 * ⚠️ The canvases draw onboarding at phone width only, so the desktop column width below is the
 * one width token this system has (`--measure`, 62ch) rather than a drawn value. Flagged rather
 * than invented: if a narrower onboarding column is wanted, it is a design decision and a token,
 * not a number typed here.
 */
function OnboardingScreen({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="onboarding-screen"
      className={cn(
        'bg-bg flex min-h-full min-w-0 flex-col items-center justify-center p-[var(--pad-member-screen)]',
        className,
      )}
      {...props}
    />
  )
}

/**
 * One step.
 *
 * A card on the page ground: `--card` inside a `--line` hairline at `--radius-lg`, which is the
 * shape `tokens.css` reserves for cards and panels. The hairline is enough here — unlike
 * `MemberError`, which needs `--line-strong` because it lands on `--sur` inside a thread where
 * `--card` is 1.09 ΔL\* from the ground. This card lands on `--bg` and is the only thing on the
 * screen, so there is nothing for it to be confused with.
 */
function OnboardingStep({
  className,
  mark = false,
  align = 'start',
  title,
  lede,
  action,
  actionNote,
  children,
  ...props
}: Omit<React.ComponentProps<'div'>, 'title'> & {
  /** The wordmark above the title. Drawn on step 1 — the landing — and on no other step. */
  mark?: boolean
  /** Step 1 is centred; every other step is left-aligned. Both are drawn. */
  align?: 'start' | 'center'
  /** Words, not markup. */
  title: string
  lede?: string
  /** The one control. Pass `plane="member"` — the row only floors the box it owns. */
  action?: React.ReactNode
  /** The sentence under the control, e.g. *"Goes to Alex for clinical review next."* */
  actionNote?: string
}) {
  const centred = align === 'center'
  return (
    <div
      data-slot="onboarding-step"
      className={cn(
        'bg-card border-line flex w-full max-w-[var(--measure)] min-w-0 flex-col gap-[var(--space-2)] rounded-[var(--radius-lg)] border p-[var(--space-3)]',
        centred ? 'items-center text-center' : 'items-stretch',
        className,
      )}
      {...props}
    >
      {mark ? <Wordmark className="text-ink text-member-body" /> : null}
      <h1 className="text-member-title text-ink min-w-0 font-medium break-words">{title}</h1>
      {lede === undefined ? null : (
        <p className="text-member-body text-ink-2 min-w-0 break-words">{lede}</p>
      )}
      {children}
      {action === undefined ? null : (
        <div
          className={cn(
            'mt-[var(--space-1)] flex min-h-[var(--touch-min)] min-w-0 flex-col justify-center',
            centred ? 'w-full' : '',
          )}
        >
          {action}
        </div>
      )}
      {actionNote === undefined ? null : (
        <p className="text-member-caption text-ink-3 min-w-0 text-center break-words">
          {actionNote}
        </p>
      )}
    </div>
  )
}

export { OnboardingScreen, OnboardingStep }
