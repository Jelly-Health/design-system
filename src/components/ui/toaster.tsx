"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
import {
  Toast,
  ToastAction,
  ToastBody,
  ToastClose,
  ToastDescription,
  ToastIcon,
  ToastProvider,
  ToastViewport,
  planeVisibility,
} from "./toast"
import { dismiss, remove, useToasts } from "./use-toast"

/**
 * Grace period between a toast's `open` flipping to `false` and its record actually being
 * dropped -- see `remove`'s docstring in `use-toast.ts` for why this can't be zero. Tied to
 * `--duration-slow` (200ms), the token the rest of the system's floating-layer motion already
 * uses, rather than a picked constant.
 */
const EXIT_ANIMATION_MS = 200

/**
 * Mounts one plane's toast viewport. One `<Toaster />` per app -- `plane` lives on the Toaster,
 * not on individual `toast()` calls, the same reason `size` on `Button` doesn't decide whether
 * the SURFACE is console or member. A console app renders `<Toaster plane="console" />`
 * (the default); a member app renders `<Toaster plane="member" />`.
 */
function Toaster({ plane = "console" }: { plane?: "console" | "member" }) {
  const records = useToasts()
  const { visible, hiddenCount, superseded } = planeVisibility(records, plane)

  /* Member's "replaces, not stacks" rule needs an actual removal, not just hiding: `visible`
   * already excludes a superseded record from render, but leaving its data in the store would
   * let it resurface the moment the toast that replaced it closes. Nothing to animate here --
   * a superseded record was never the one rendered, so there is no exit transition to protect
   * the way there is in `dismiss`/`remove` below. */
  React.useEffect(() => {
    for (const record of superseded) remove(record.id)
  }, [superseded])

  return (
    <ToastProvider>
      <ToastViewport plane={plane}>
        {plane === "console" && hiddenCount > 0 ? (
          <li
            data-slot="toast-overflow"
            className={cn(
              // --radius-pill (999px) has no Tailwind alias in tokens.css's @theme block, unlike
              // --radius-lg/md/sm -- referenced directly rather than reached for via rounded-full,
              // which would coincidentally look the same without actually citing the token.
              "pointer-events-none self-end rounded-[var(--radius-pill)] bg-mut px-3 py-1 text-console-2xs font-medium text-ink-2",
            )}
          >
            +{hiddenCount} more
          </li>
        ) : null}
        {visible.map((record) => (
          <Toast
            key={record.id}
            tier={record.tier}
            plane={plane}
            open={record.open}
            onOpenChange={(open) => {
              if (open) return
              dismiss(record.id)
              window.setTimeout(() => remove(record.id), EXIT_ANIMATION_MS)
            }}
          >
            <ToastIcon tier={record.tier} plane={plane} />
            <ToastBody>
              <ToastDescription>{record.description}</ToastDescription>
              {record.action ? (
                <ToastAction
                  plane={plane}
                  altText={record.action.label}
                  onClick={record.action.onClick}
                >
                  {record.action.label}
                </ToastAction>
              ) : null}
            </ToastBody>
            <ToastClose plane={plane} />
          </Toast>
        ))}
      </ToastViewport>
    </ToastProvider>
  )
}

export { Toaster }
