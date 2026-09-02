import { Toaster, toast } from "@jelly-health/design-system";

/**
 * `Toaster` renders from the module-level store in `use-toast.ts`, so the preview seeds it by
 * calling the real `toast()` at module scope — before React mounts, which is why the card is
 * populated on first paint with no effect and no fake data path.
 *
 * Every seeded toast is `tier: "error"` on purpose, and it is not a content choice: `info` toasts
 * auto-dismiss after 4s, so a card seeded with them screenshots empty and the render check goes
 * flaky. Errors return `Infinity` from `getToastDuration` and stay put. The info tier's appearance
 * is covered by `Toast`'s own cells.
 *
 * The scenario is one outage, not four unrelated failures: a clinician working through a batch of
 * refill approvals while the pharmacy integration is unreachable.
 */
toast({
  id: "refill-alvarez",
  tier: "error",
  description: "Couldn't send M. Alvarez's refill. Nothing was submitted.",
});
toast({
  id: "refill-okonkwo",
  tier: "error",
  description: "Couldn't send D. Okonkwo's refill. Nothing was submitted.",
});
toast({
  id: "refill-baptiste",
  tier: "error",
  description: "Couldn't send R. Baptiste's refill. Nothing was submitted.",
  action: { label: "Retry all", onClick: () => {} },
});
toast({
  id: "refill-nakamura",
  tier: "error",
  description: "Couldn't send Y. Nakamura's refill. Nothing was submitted.",
  action: { label: "Retry all", onClick: () => {} },
});

/**
 * The console plane, mounted for real: bottom-right, newest nearest the corner, three visible and
 * the fourth collapsed into the `+1 more` chip rather than dropped. This is the actual `fixed`
 * viewport, so the card is sized to stand in for a screen — the placement is the half of this
 * component a props table cannot show.
 *
 * The member plane is deliberately not a second cell. Its rule is "max 1 visible, and a new toast
 * *replaces* the previous one outright" — which renders as a single toast, visually identical to
 * one toast arriving normally. The behaviour is a transition, not a state, so a still frame would
 * assert nothing; `Toast`'s `MemberInfo` / `MemberError` cells cover the member plane's appearance.
 */
export function ConsoleStack() {
  return (
    <div
      className="border-line bg-sur relative h-[380px] w-[400px] overflow-hidden rounded-lg border"
      /* `ToastViewport` is `position: fixed` and `Toaster` owns it — there is no className to
       * pass through. A transform on an ancestor makes it the containing block for fixed
       * descendants, so the viewport anchors to this box's bottom-right instead of the page's,
       * and the card shows the real placement rather than a blank cell with the stack parked
       * off-screen. Styling the stage only; the component is untouched. */
      style={{ transform: "translateZ(0)" }}
    >
      <Toaster plane="console" />
    </div>
  );
}
