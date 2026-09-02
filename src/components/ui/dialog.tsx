"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "../../lib/utils"

/**
 * ⚠️ **This is the one primitive that was not ported as-is.** The legacy `components/ui/dialog.tsx`
 * is hand-rolled rather than Radix-backed, and it is missing the things a modal has to do:
 *
 *   - no focus trap, so keyboard focus walks straight out into the page behind the overlay
 *   - no Escape handling, so the only way out is a mouse
 *   - no focus restoration on close
 *   - no portal, so an ancestor `overflow: hidden` or `transform` can clip it
 *   - `aria-modal="true"` with nothing tying the dialog to its own title
 *   - it imports the `X` close icon and never renders it — there is no close button at all
 *
 * That last one is how it was found: v2's lint has real rules and flagged the unused import.
 * The root's lint is inert (`rules: {}`, measured in `C-01`), which is why it survived there.
 *
 * **The exported API is deliberately unchanged** — same names, and `Dialog` still takes
 * `open` / `onOpenChange` — so the 19 legacy call sites port across without edits.
 *
 * ## Unsaved input — `onCloseAttempt` (JH227)
 *
 * A dialog-hosted form loses a half-typed draft to an accidental close, which for a console
 * operated by keyboard all day is the failure JH138 named. Pass `onCloseAttempt` and **every
 * close gesture this primitive owns stops closing** and calls it instead, so the form can confirm
 * or save:
 *
 * ```tsx
 * <DialogContent onCloseAttempt={isDirty ? () => setConfirming(true) : undefined}>
 * ```
 *
 * Omit it (or pass `undefined`) and the dialog behaves exactly as before — this is additive, and
 * the 19 ported call sites are unaffected.
 *
 * **Three gestures, not one, and that is the whole point.** JH202 recorded this gap as "Escape
 * always closes. No override in the current code," and deferred it. The second half was already
 * untrue of this Radix-backed port when it was written: `DialogContent` spreads `...props` onto
 * `DialogPrimitive.Content`, so `onEscapeKeyDown` has always been interceptable — verified by
 * type-checking a consumer that passes it, 2026-09-02. The real defect is worse than a missing
 * hook, because it looks solved: a caller who guards `onEscapeKeyDown` alone still loses the
 * draft to an overlay click or to the close button in the corner. `onCloseAttempt` covers all
 * three together, which is the only reason it earns a prop over the raw Radix escape hatches:
 *
 *   - **Escape** — `onEscapeKeyDown`; `DismissableLayer` skips `onDismiss` when it is prevented
 *   - **Click outside** — `onInteractOutside`, which fires for a pointer-down outside *and* for
 *     focus leaving the layer, so both are covered by the one handler
 *   - **The close button** — the `X` this component renders; Radix composes a consumer `onClick`
 *     ahead of its own `onOpenChange(false)` with `checkForDefaultPrevented`, so preventing the
 *     click stops the close
 *
 * All three contracts were read out of `@radix-ui/react-dialog@1.1.4`,
 * `@radix-ui/react-dismissable-layer` and `@radix-ui/primitive` rather than assumed, and
 * `scripts/verify-dialog-close-guard.mjs` proves the wiring by mutation.
 *
 * **What is deliberately NOT guarded**, because the caller owns it and can route it to the same
 * handler: a `DialogClose` the caller renders in the body or footer (a "Cancel" button), and any
 * programmatic close through `Dialog`'s own `onOpenChange`. A guard that reached into those would
 * be a primitive overriding a decision its consumer had already made explicitly.
 *
 * **No confirmation UI ships here.** "Discard your changes?" is a product decision — its wording,
 * its buttons and whether it offers a save at all — and this package's rule is that a primitive
 * carries no opinion the canvases have not settled. `onCloseAttempt` is the seam; the console and
 * member consumers each bring their own.
 */

/** The handlers a guarded dialog needs, or `null` when there is nothing to guard. */
export type DialogCloseGuard = {
  onEscapeKeyDown: (event: { preventDefault: () => void }) => void
  onInteractOutside: (event: { preventDefault: () => void }) => void
  onClick: (event: { preventDefault: () => void }) => void
} | null

/**
 * Builds the three interceptors from `onCloseAttempt`, or returns `null` when it is absent.
 *
 * Split out as a pure function for the same reason `getToastDuration` is one: the decision it
 * makes is provable without a browser, while a `keydown` on a portalled, focus-trapped layer is
 * not. Returning `null` rather than a set of no-op handlers is load-bearing — an unguarded dialog
 * must pass Radix *nothing*, so its default close path is the untouched original rather than a
 * handler that happens to do nothing today.
 */
export function dialogCloseGuard(onCloseAttempt?: () => void): DialogCloseGuard {
  if (!onCloseAttempt) return null
  const block = (event: { preventDefault: () => void }) => {
    event.preventDefault()
    onCloseAttempt()
  }
  return { onEscapeKeyDown: block, onInteractOutside: block, onClick: block }
}

/**
 * Caller's handler first, ours only if the caller did not already prevent the close — the same
 * order and the same `defaultPrevented` check Radix's own `composeEventHandlers` uses. Written
 * out rather than imported because `@radix-ui/primitive` is a transitive dependency here, not a
 * declared one. Composing at all (rather than letting our handler win) is deliberate: silently
 * dropping a handler a consumer passed is the class of failure this package has already been bitten
 * by once, in `cn()`.
 */
function composeGuarded<E extends { defaultPrevented: boolean }>(
  callerHandler: ((event: E) => void) | undefined,
  guardHandler: ((event: E) => void) | undefined
) {
  if (!guardHandler) return callerHandler
  return (event: E) => {
    callerHandler?.(event)
    if (!event.defaultPrevented) guardHandler(event)
  }
}

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

function DialogOverlay({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-scrim backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  )
}

type DialogContentProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  /**
   * Called instead of closing when the user tries to dismiss a dialog that holds unsaved input —
   * Escape, a click outside, or the close button. Absent means today's behaviour: every gesture
   * closes. See this file's docstring for what is and is not covered.
   */
  onCloseAttempt?: () => void
}

function DialogContent({ className, children, onCloseAttempt, ...props }: DialogContentProps) {
  const guard = dialogCloseGuard(onCloseAttempt)
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border-2 bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          className
        )}
        {...props}
        onEscapeKeyDown={composeGuarded(props.onEscapeKeyDown, guard?.onEscapeKeyDown)}
        onInteractOutside={composeGuarded(props.onInteractOutside, guard?.onInteractOutside)}
      >
        {children}
        <DialogPrimitive.Close
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          onClick={guard?.onClick}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-2", className)} {...props} />
}

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex justify-end gap-3", className)} {...props} />
}

function DialogTitle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title className={cn("text-console-2xl font-semibold", className)} {...props} />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description className={cn("text-muted-foreground", className)} {...props} />
  )
}

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
export type { DialogContentProps }
