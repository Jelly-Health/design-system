"use client"

import * as React from "react"

/**
 * The imperative toast store — JH224. A module-level singleton rather than a React context: the
 * whole point of `toast()` is that it can be called from anywhere (an event handler, a service
 * response, code with no JSX in scope), not only from inside a component that received a
 * `useToast` context.
 *
 * Deliberately plane-agnostic. Nothing here knows about "console" or "member" — that policy
 * (up-to-3-stacking-and-collapse vs. max-1-and-replace) lives in `toast.tsx`'s `planeVisibility`
 * and is applied by whichever `<Toaster plane="…" />` is mounted. Keeping it out of the store
 * means the store's own correctness (dedup, dismiss, cleanup) is provable without a plane in the
 * picture at all.
 */

export type ToastTier = "info" | "error"

export interface ToastOptions {
  /**
   * A stable id de-dupes: calling `toast()` again with the SAME id updates the existing record
   * in place instead of adding a second one. This is the resolution to JH202's open "two
   * identical errors firing back to back" question — dedup is opt-in, by the CALLER supplying a
   * stable id (e.g. `toast({ id: "refill-submit-error", ... })`), never inferred by comparing
   * message text. Comparing text would mean guessing at what counts as "identical"; a caller
   * already knows which failures are the same event repeating and which are two different ones
   * that happen to read alike.
   */
  id?: string
  tier: ToastTier
  description: React.ReactNode
  action?: { label: string; onClick: () => void }
}

export interface ToastRecord extends ToastOptions {
  id: string
  open: boolean
}

type Listener = () => void

let toasts: ToastRecord[] = []
const listeners = new Set<Listener>()
let seq = 0

function emit() {
  for (const listener of listeners) listener()
}

function genId() {
  seq += 1
  return `toast-${seq}`
}

/** Add a toast, or update it in place if `id` already names one that's currently open. */
export function toast(options: ToastOptions): string {
  const id = options.id ?? genId()
  const existing = toasts.find((t) => t.id === id)
  toasts = existing
    ? toasts.map((t) => (t.id === id ? { ...t, ...options, id, open: true } : t))
    : [...toasts, { ...options, id, open: true }]
  emit()
  return id
}

/** Flips `open` to false so the exit animation can play. Does not remove the record — see
 *  `remove` below for why that is a separate step. */
export function dismiss(id: string) {
  toasts = toasts.map((t) => (t.id === id ? { ...t, open: false } : t))
  emit()
}

/**
 * Actually drops the record. Split from `dismiss` because `<Toast.Root>` wraps its DOM node in
 * Radix's own `Presence`, which keeps rendering the exit (`data-[state=closed]:animate-out`)
 * animation for as long as the `<Toast.Root>` React element itself stays mounted — removing the
 * record (and with it, the element) the instant `open` becomes `false` would tear the node out of
 * the tree mid-animation and Presence never gets to finish it. `toaster.tsx` calls this after a
 * short delay tied to `--duration-slow`, the same 200ms the rest of the system's floating layers
 * animate with.
 */
export function remove(id: string) {
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

function subscribe(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return toasts
}

const EMPTY: ToastRecord[] = []

/** Live view of every toast, dismissed or not — plane-specific visibility is applied by the
 *  caller via `planeVisibility` (`toast.tsx`), not here. */
export function useToasts(): ToastRecord[] {
  return React.useSyncExternalStore(subscribe, getSnapshot, () => EMPTY)
}
