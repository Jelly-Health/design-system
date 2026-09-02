import { ThreadSkeleton } from "@jelly-health/design-system";

/**
 * The conversation, loading. A skeleton rather than a spinner, because the
 * geometry is the affordance — and it renders a real `Thread`, so the surface,
 * the 18px turn gap and the 24/22 screen padding cannot drift from the thing it
 * stands in for.
 *
 * The turns are ragged and alternate sides on purpose: a stack of equal blocks on
 * one side reads as a list, and the panel would reshape into a conversation when
 * the read landed.
 */
export function Default() {
  return (
    <div className="w-[420px]">
      <ThreadSkeleton />
    </div>
  );
}
