"use client"

import * as React from "react"
import * as ToastPrimitive from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { AlertCircle, Check, X } from "lucide-react"

import { cn } from "../../lib/utils"

/**
 * Toast — JH202 designed it, JH212 was going to build it and closed first, JH224 builds it.
 *
 * Every colour, radius, shadow and type size below is a literal read from `tokens.css`, matched
 * against the JH202 canvas (`ConsoleToast` / `MemberToast` artboards). Two axes, same as the rest
 * of the primitives that carry one: `tier` (`info` | `error` — never a third value; see
 * `getToastDuration`) and `plane` (`console` default | `member`, matching Button/Input/Textarea).
 *
 * 🔴 The two-tier rule is the whole point of this component, carried verbatim from JH202: an
 * informational toast is a REDUNDANT acknowledgment — the fact it announces must already be
 * durably visible elsewhere before it fires — so it can auto-dismiss. An error toast is the
 * entire notice; nothing else on screen changed, so it must never expire unseen. See
 * `getToastDuration`, which is the one thing here that must not silently regress.
 */

const ToastProvider = ToastPrimitive.Provider

/**
 * How long a toast stays up before it auto-dismisses, in milliseconds.
 *
 * `tier="error"` always returns `Infinity` — Radix's own signal to never start the close timer
 * (`@radix-ui/react-toast`'s `useTimer`: `if (!duration2 || duration2 === Infinity) return;`),
 * not a convention invented here. Informational toasts get the card's literal numbers: 4s on
 * console, 5s on member. Pause-on-hover/focus is Radix's built-in behaviour on `Toast.Root` /
 * `Toast.Provider` and is not reimplemented here.
 *
 * Exported standalone, with no rendering involved, so it can be proven by mutation: flip the
 * `tier === "error"` branch to a finite number and `scripts/verify-toast.mjs` fails. That is the
 * one regression the card calls out by name.
 */
export function getToastDuration(
  tier: "info" | "error",
  plane: "console" | "member",
): number {
  if (tier === "error") return Infinity
  return plane === "member" ? 5000 : 4000
}

/**
 * Which toasts a plane shows at once, given the full record list (oldest first), and what
 * happens to the rest.
 *
 *   - console: up to 3 visible, newest nearest the corner (the LAST 3 of the array). Anything
 *     older is still QUEUED — reported via `hiddenCount` so the caller can render a "+N more"
 *     chip — and may become visible later as newer ones close.
 *   - member: max 1 visible. A second toast REPLACES the first outright rather than queuing
 *     behind it, so anything bumped is reported via `superseded` instead: it is gone, not
 *     waiting, and the caller (`toaster.tsx`) removes it from the store entirely rather than
 *     merely hiding it — otherwise dismissing the visible toast would reveal the "replaced" one
 *     again, which is exactly the stacking behaviour this rule exists to rule out. `hiddenCount`
 *     is always 0 on member: a collapsed "+N more" chip would contradict "replaces, not stacks."
 *
 * Pure and rendering-free on purpose, same reason as `getToastDuration`: the stacking/replace
 * rule is the other thing the card calls "the whole point of the component," so it has to be
 * testable without mounting anything.
 */
export function planeVisibility<T>(
  records: T[],
  plane: "console" | "member",
): { visible: T[]; hiddenCount: number; superseded: T[] } {
  const cap = plane === "member" ? 1 : 3
  const visible = records.slice(-cap)
  const overflow = records.slice(0, records.length - visible.length)
  return {
    visible,
    hiddenCount: plane === "console" ? overflow.length : 0,
    superseded: plane === "member" ? overflow : [],
  }
}

const toastVariants = cva(
  "group pointer-events-auto relative flex items-start border border-line-strong bg-card rounded-lg shadow-float data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
  {
    variants: {
      plane: {
        // 340px, 10px icon/body gap, 12px padding — ConsoleToast artboard, `.toast` / `.toast-icon`.
        console:
          "w-full max-w-[340px] gap-2.5 p-3 text-console-base data-[state=open]:slide-in-from-bottom-2 data-[state=closed]:slide-out-to-right-full",
        // 320px (max-w-xs), 12px gap, 16px padding — MemberToast artboard.
        member:
          "w-full max-w-xs gap-3 p-4 text-member-body data-[state=open]:slide-in-from-top-full data-[state=closed]:slide-out-to-top-full",
      },
    },
    defaultVariants: { plane: "console" },
  },
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  Omit<React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root>, "duration"> &
    VariantProps<typeof toastVariants> & { tier: "info" | "error" }
>(({ className, plane, tier, ...props }, ref) => (
  <ToastPrimitive.Root
    ref={ref}
    duration={getToastDuration(tier, plane ?? "console")}
    data-slot="toast"
    data-tier={tier}
    data-plane={plane ?? "console"}
    className={cn(toastVariants({ plane }), className)}
    {...props}
  />
))
Toast.displayName = ToastPrimitive.Root.displayName

const toastIconVariants = cva("shrink-0", {
  variants: {
    plane: { console: "size-[18px] mt-px", member: "size-5 mt-0.5" },
    tier: { info: "text-success-ink", error: "text-danger" },
  },
  defaultVariants: { plane: "console" },
})

/**
 * Check for informational, alert-circle for error — the only two icons this component draws,
 * matching the two tiers 1:1. Decorative: the accessible text lives in `ToastDescription`, which
 * is what Radix's announce mechanism reads, so the icon is hidden from assistive tech.
 */
function ToastIcon({
  tier,
  plane = "console",
  className,
}: {
  tier: "info" | "error"
  plane?: "console" | "member"
  className?: string
}) {
  const Icon = tier === "error" ? AlertCircle : Check
  return (
    <Icon
      aria-hidden="true"
      strokeWidth={2}
      data-slot="toast-icon"
      className={cn(toastIconVariants({ plane, tier }), className)}
    />
  )
}

const ToastBody = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} data-slot="toast-body" className={cn("min-w-0 flex-1", className)} {...props} />
  ),
)
ToastBody.displayName = "ToastBody"

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description
    ref={ref}
    data-slot="toast-description"
    className={cn("m-0 text-ink leading-normal", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitive.Description.displayName

const toastActionVariants = cva(
  "mt-1.5 inline-flex font-medium text-accent-ink rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
  {
    variants: {
      // console reads var(--text-console-sm) directly in the canvas. Member's canvas hardcodes
      // 14px rather than a token name -- the one place the canvas doesn't cite one -- and 14px is
      // exactly --text-member-caption, so that's what this reaches for rather than a bare value.
      plane: { console: "text-console-sm", member: "text-member-caption" },
    },
    defaultVariants: { plane: "console" },
  },
)

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Action> &
    VariantProps<typeof toastActionVariants>
>(({ className, plane, ...props }, ref) => (
  <ToastPrimitive.Action
    ref={ref}
    data-slot="toast-action"
    className={cn(toastActionVariants({ plane }), className)}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitive.Action.displayName

const toastCloseVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-sm text-ink-3 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
  {
    variants: {
      plane: {
        // 18px hit target, 12px glyph -- ConsoleToast `.toast-close` / `.toast-close svg`.
        console: "size-[18px] [&_svg]:size-3",
        // 44px / --touch-min hit target via negative margin, same trick as Button's plane=member,
        // so the visual icon stays 14px while the tap target clears the floor -- MemberToast
        // `.toast-close` (44x44, -12px margin) / `.toast-close svg` (14px).
        member: "-m-3 min-h-[var(--touch-min)] min-w-[var(--touch-min)] [&_svg]:size-3.5",
      },
    },
    defaultVariants: { plane: "console" },
  },
)

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close> &
    VariantProps<typeof toastCloseVariants>
>(({ className, plane, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    data-slot="toast-close"
    aria-label="Dismiss"
    className={cn(toastCloseVariants({ plane }), className)}
    {...props}
  >
    <X strokeWidth={2.5} aria-hidden="true" />
  </ToastPrimitive.Close>
))
ToastClose.displayName = ToastPrimitive.Close.displayName

const toastViewportVariants = cva("fixed z-50 m-0 flex list-none outline-none", {
  variants: {
    plane: {
      // bottom-right, stacking upward: DOM order is oldest-first, and flex-col-reverse puts the
      // LAST child (the newest toast) nearest the anchor edge (the corner) -- ConsoleToast.
      console: "bottom-4 right-4 max-w-[340px] flex-col-reverse gap-2",
      // top of viewport, safe-area aware, centred -- MemberToast. `env()` is a browser API value,
      // not a design token, so it is not subject to the "never invent a token" rule.
      member:
        "inset-x-0 top-0 flex-col items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]",
    },
  },
  defaultVariants: { plane: "console" },
})

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport> &
    VariantProps<typeof toastViewportVariants>
>(({ className, plane, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    data-slot="toast-viewport"
    className={cn(toastViewportVariants({ plane }), className)}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitive.Viewport.displayName

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastIcon,
  ToastBody,
  ToastDescription,
  ToastAction,
  ToastClose,
  toastVariants,
}
