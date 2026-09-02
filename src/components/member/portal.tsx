import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'

import { cn } from '../../lib/utils'
import { Wordmark } from '../brand/wordmark'

/**
 * The member's own portal shell — JH219.
 *
 * ══ Where this comes from ════════════════════════════════════════════════════════════════════
 * The v6 canvas `jellyhealth Portal.dc.html`, frames A–E, and its build spec
 * `jh-wireframes-v11/_ds/…/components/member-portal.css`, whose header names that canvas as the
 * spec and whose 252 lines are the closest thing this system has to a drawn layout in code. This
 * file is that spec re-expressed against the package's own tokens; every proportion below is the
 * spec's, not a preference.
 *
 * ⚠️ **It is NOT the prospect portal.** JH219's card cites `jellyhealth Prospect Portal.dc.html`
 * for "portal nav", and that is the wrong surface: a prospect is pre-payment and reaches *"exactly
 * two things — the conversation with Alex, and a stripped membership explainer… no sidebar at
 * all"*, drawn as two tabs rather than a destination list. That is a different shell with a
 * different rule, and it is not built here. See README § *The portal shell* for what remains open.
 *
 * ══ The three decisions the spec makes, all of which survive here ════════════════════════════
 *   1. **Desktop is three panes: nav / conversation / destination panel, and picking a destination
 *      swaps the RIGHT PANEL ONLY.** The conversation never moves. It is the spine of the product
 *      and a portal that swapped it out would make the thread a destination among five.
 *   2. **Phone is the normal case, and it is a stack, not a shrunken desktop** — *"the member
 *      arrives from a link in a text"*. Destination list → destination content, with the
 *      conversation as a full-screen view reached from the message bar.
 *   3. **A container query, not a media query.** The spec is explicit about why: *"the portal may
 *      be embedded at a width the viewport knows nothing about"*. 720px is the width at which all
 *      three panes can sit side by side without any dropping below a readable measure.
 *
 * ══ Two things the spec has that this does not, and why ══════════════════════════════════════
 *
 * **`.mp--bare` is gone, because it is `TaskScreen`.** The spec's chrome rule — *"arrived from a
 * message → no shell, one exit back to the thread; arrived from the portal → shell"* — is
 * implemented there as a modifier that suppresses the sidebar. Making it a modifier is what
 * produced the one bug the spec documents at length: `.mp:not(.mp--bare)` had to be threaded
 * through the container query, because without it *"the container query silently restored the
 * sidebar in bare mode, giving a member who arrived from a text message the full navigable portal
 * at desktop width… and it only appeared above 720px, so a phone-width check could not catch it."*
 * A separate component cannot regress that way: there is no sidebar in `TaskScreen` to restore.
 *
 * **The phone/desktop switch is written so the two rules never race.** Each phone-only rule is
 * scoped to `@max-[720px]` rather than being overridden by a `@min-[720px]` rule later in the
 * file. This is the same defect in general form — a `group-data-*` variant compiles to two
 * classes' worth of specificity and a bare container-query variant to one, so the desktop rule
 * loses to the phone rule no matter what order they are in. Confining the phone rule to phone
 * widths means there is nothing to win: above 720px the rule does not exist.
 * `scripts/verify-member-chrome.mjs` measures the shell at 360px **and** 900px for that reason.
 */

/** The shell. `view` drives the phone stack only — above 720px every pane is visible regardless. */
function PortalShell({
  className,
  view,
  ...props
}: React.ComponentProps<'div'> & {
  /**
   * Which of the two phone views is on screen. Inert above the 720px container breakpoint, where
   * all three panes show at once — so a consumer never has to know the rendered width.
   */
  view: 'list' | 'pane'
}) {
  return (
    <div
      data-slot="portal-shell"
      data-view={view}
      /* `group/portal` so the panes below can read `data-view` off this element, and
       * `@container/portal` so their breakpoints are measured against THIS box rather than the
       * window — the spec's own reason: the portal may be embedded at a width the viewport knows
       * nothing about, and the phone frame it is drawn in is 360px inside a much wider page. */
      className={cn(
        'group/portal bg-bg @container/portal relative flex h-full min-h-0 min-w-0 flex-col',
        className,
      )}
      {...props}
    />
  )
}

/** The row that holds the panes. Column on phone (one at a time), row on desktop (all three). */
function PortalBody({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="portal-body"
      className={cn(
        'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden @min-[720px]/portal:flex-row',
        className,
      )}
      {...props}
    />
  )
}

/**
 * The destination list — a full-screen list on phone, a 15rem sidebar on desktop.
 *
 * `<nav>` with a label, because on phone this IS the whole screen and an unlabelled landmark is
 * indistinguishable from the pane it alternates with.
 */
function PortalNav({
  className,
  label = 'Portal destinations',
  children,
  ...props
}: React.ComponentProps<'nav'> & { label?: string }) {
  return (
    <nav
      data-slot="portal-nav"
      aria-label={label}
      className={cn(
        'flex min-w-0 flex-col overflow-y-auto p-[var(--space-2)]',
        /* Phone: hidden while the destination pane is the visible view. Scoped to phone widths so
         * it cannot outrank the desktop layout — see the file docstring. */
        '@max-[720px]/portal:group-data-[view=pane]/portal:hidden',
        /* Desktop: 15rem, fixed, ruled off from the conversation. `w-60` is 240px = 15rem. */
        'border-line @min-[720px]/portal:w-60 @min-[720px]/portal:shrink-0 @min-[720px]/portal:border-r',
        className,
      )}
      {...props}
    >
      <Wordmark className="text-ink text-member-body px-[var(--space-1)] pb-[var(--space-3)]" />
      <div className="flex min-w-0 flex-col gap-[var(--hairline)]">{children}</div>
    </nav>
  )
}

/**
 * One destination.
 *
 * ── There is no badge prop and no unread count, and that is a product decision ────────────────
 * The spec states it where the badge would go: *"No badge and no unread count. On a member surface
 * a count is anxiety with no action attached."* It is absent from the type rather than defaulted
 * to `undefined`, so adding one is a change to this file and therefore a review.
 *
 * ── An anchor, not a button ──────────────────────────────────────────────────────────────────
 * The canvas draws `<button>` because a wireframe has nowhere to navigate to. A destination is a
 * route, and `Button`'s own docstring settles the general case: *"`link` is still a button… an
 * anchor is what navigates."* `asChild` is here for the same reason it is on `Button` — a
 * framework's own link component has to be able to be the element.
 */
function PortalDestination({
  className,
  icon,
  current = false,
  asChild = false,
  children,
  ...props
}: React.ComponentProps<'a'> & {
  icon?: React.ReactNode
  /** Marks the destination the pane is currently showing. Emits `aria-current="page"`. */
  current?: boolean
  asChild?: boolean
}) {
  /* Annotated as `ElementType` rather than left to inference, and the reason is measurable
   * rather than stylistic: the inferred union of `Slot | 'a'` reproduces exactly the
   * `RefAttributes` ref-variance error that `ui/badge.tsx` and `ui/button.tsx` already carry —
   * both of which do the same `asChild ? Slot : Tag` and both of which are the package's entire
   * `tsc` baseline. Measured 2026-09-02: leaving it inferred took the count from 2 to 3. It is an
   * artefact of two `@types/react` copies resolving through the borrowed install, not a defect,
   * but a third copy of a known artefact is still a new error against a "no new errors" bar. The
   * annotation says the honest thing — the element is chosen at runtime — and the public prop type
   * above is what call sites are checked against, which is unaffected. */
  const Comp: React.ElementType = asChild ? Slot : 'a'
  return (
    <Comp
      data-slot="portal-destination"
      aria-current={current ? 'page' : undefined}
      className={cn(
        'text-member-body text-ink-2 hover:bg-mut-soft focus-visible:ring-ring/50 flex min-h-[var(--touch-min)] min-w-0 items-center gap-[var(--space-2)] rounded-[var(--radius)] px-[var(--space-2)] py-[var(--space-1)] text-left outline-none focus-visible:ring-[3px]',
        'aria-[current=page]:bg-mut aria-[current=page]:text-ink aria-[current=page]:font-medium',
        className,
      )}
      {...props}
    >
      {icon === undefined ? null : (
        <span aria-hidden="true" className="flex shrink-0 opacity-85">
          {icon}
        </span>
      )}
      {/* `min-w-0 break-words`: a destination name is product copy and can be translated into a
       * longer one. Either alone leaves the bug — the same pair `MessageSender` needed. */}
      <span className="min-w-0 flex-1 break-words">{children}</span>
    </Comp>
  )
}

/** Who is signed in. Sits at the BOTTOM of the nav, as drawn — hence `mt-auto`. */
function PortalIdentity({ className, children, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="portal-identity"
      className={cn(
        'border-line mt-auto flex min-w-0 items-center gap-[var(--space-2)] border-t pt-[var(--space-2)]',
        className,
      )}
      {...props}
    >
      <span className="text-member-body text-ink min-w-0 flex-1 font-medium break-words">
        {children}
      </span>
    </div>
  )
}

/**
 * The conversation pane — permanent on desktop, a full-screen view on phone.
 *
 * It holds a `Thread`; it does not re-declare one. `overlay` is the phone state, and it is a prop
 * rather than a second component because the desktop rendering is identical either way — above
 * 720px the pane is simply always there and `overlay` stops meaning anything.
 */
function PortalConversation({
  className,
  overlay = false,
  ...props
}: React.ComponentProps<'div'> & {
  /** Phone only: the member tapped the message bar. Inert above 720px. */
  overlay?: boolean
}) {
  return (
    <div
      data-slot="portal-conversation"
      data-overlay={overlay ? 'true' : 'false'}
      className={cn(
        'bg-bg hidden min-h-0 min-w-0 flex-col',
        /* Phone: it covers the shell when opened, and is absent otherwise. Both halves are scoped
         * to phone widths, so neither can leak above the breakpoint. */
        '@max-[720px]/portal:data-[overlay=true]:absolute @max-[720px]/portal:data-[overlay=true]:inset-0 @max-[720px]/portal:data-[overlay=true]:z-[5] @max-[720px]/portal:data-[overlay=true]:flex',
        /* Desktop: a permanent middle pane, an equal share of what the nav leaves. */
        'border-line @min-[720px]/portal:flex @min-[720px]/portal:flex-1 @min-[720px]/portal:basis-0 @min-[720px]/portal:border-r',
        className,
      )}
      {...props}
    />
  )
}

/** The conversation's header — who the member is talking to. */
function PortalConversationHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="portal-conversation-header"
      className={cn(
        'text-ink border-line flex min-w-0 shrink-0 items-center gap-[var(--space-2)] border-b p-[var(--space-2)]',
        className,
      )}
      {...props}
    />
  )
}

/** The composer's rail, at the foot of the conversation. */
function PortalConversationFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="portal-conversation-footer"
      className={cn(
        'text-ink border-line min-w-0 shrink-0 border-t p-[var(--space-2)]',
        className,
      )}
      {...props}
    />
  )
}

/**
 * The destination panel — the only thing a destination swaps.
 *
 * The spec records the mistake worth not repeating: *"The first build gave the panel a fixed
 * 19rem, which made it a rail beside a wide chat rather than a peer to it — the reference's right
 * panel is a full working surface, not a summary strip."* Hence `flex-1 basis-0`, an equal partner
 * to the conversation.
 */
function PortalPane({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="portal-pane"
      className={cn(
        'relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden',
        '@max-[720px]/portal:group-data-[view=list]/portal:hidden',
        '@min-[720px]/portal:basis-0',
        className,
      )}
      {...props}
    />
  )
}

/**
 * The scroll region inside the panel.
 *
 * Separate from `PortalPane` because they own different things: the pane owns its share of the
 * row, this owns the padding and the scrolling. Padding steps up on desktop, as drawn —
 * `--pad-member-screen` (24/22) on phone, `--space-4` (32) on desktop.
 */
function PortalPaneBody({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="portal-pane-body"
      className={cn(
        'min-h-0 min-w-0 flex-1 overflow-y-auto p-[var(--pad-member-screen)] @min-[720px]/portal:p-[var(--space-4)]',
        className,
      )}
      {...props}
    />
  )
}

/**
 * The destination's title.
 *
 * `--text-member-title` (24px) on phone, `--text-member-section` on desktop — the spec steps it up
 * *"so the destination name reads as a page title rather than a section label floating above
 * content"*. `--text-member-section` is the ramp's one step above title and is the only fluid step
 * that may be used here; `tokens.css` allows exactly two fluid steps and both clear the 16px
 * member floor at every width, which `scripts/verify-type-ramp.py` enforces.
 */
function PortalPaneTitle({ className, ...props }: React.ComponentProps<'h1'>) {
  return (
    <h1
      data-slot="portal-pane-title"
      className={cn(
        'text-member-title text-ink mb-[var(--space-3)] min-w-0 font-semibold break-words @min-[720px]/portal:mb-[var(--space-4)] @min-[720px]/portal:text-member-section',
        className,
      )}
      {...props}
    />
  )
}

/**
 * Phone only: back to the destination list.
 *
 * Hidden above 720px, where the list is already on screen — *"a control to open it would be a
 * second route to the same place."* A button rather than an anchor: it changes which pane of the
 * shell is showing, which is a state change, not a navigation.
 */
function PortalBack({
  className,
  children = '← All sections',
  ...props
}: React.ComponentProps<'button'>) {
  return (
    <button
      type="button"
      data-slot="portal-back"
      className={cn(
        'text-accent-ink text-member-body focus-visible:ring-ring/50 -mx-[var(--space-1)] inline-flex min-h-[var(--touch-min)] min-w-0 items-center rounded-[var(--radius)] px-[var(--space-1)] text-left outline-none focus-visible:ring-[3px] @min-[720px]/portal:hidden',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

/**
 * Phone only: the route into the conversation.
 *
 * The spec is explicit that this is a phone affordance and that it disappears on desktop, where
 * the conversation is already on screen. It shows the last turn, truncated to one line — the one
 * place in this shell where a single line of ellipsis is right rather than a wrap, because it is a
 * preview of something the member is one tap from reading in full.
 */
function PortalMessageBar({
  className,
  avatar,
  name,
  preview,
  openLabel = 'Open',
  ...props
}: Omit<React.ComponentProps<'button'>, 'children'> & {
  avatar?: React.ReactNode
  name: string
  /** The last turn, one line. Optional — a member with no messages yet has none. */
  preview?: string
  openLabel?: string
}) {
  return (
    <button
      type="button"
      data-slot="portal-message-bar"
      className={cn(
        'border-line bg-mut-soft hover:bg-mut focus-visible:ring-ring/50 flex min-h-[var(--touch-min)] w-full min-w-0 shrink-0 items-center gap-[var(--space-2)] border-t p-[var(--space-2)] text-left outline-none focus-visible:ring-[3px] @min-[720px]/portal:hidden',
        className,
      )}
      {...props}
    >
      {avatar === undefined ? null : <span className="shrink-0">{avatar}</span>}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-member-body text-ink font-medium break-words">{name}</span>
        {preview === undefined ? null : (
          <span className="text-member-caption text-ink-2 truncate">{preview}</span>
        )}
      </span>
      <span className="text-member-body text-accent-ink shrink-0 font-medium">{openLabel}</span>
    </button>
  )
}

export {
  PortalShell,
  PortalBody,
  PortalNav,
  PortalDestination,
  PortalIdentity,
  PortalConversation,
  PortalConversationHeader,
  PortalConversationFooter,
  PortalPane,
  PortalPaneBody,
  PortalPaneTitle,
  PortalBack,
  PortalMessageBar,
}
