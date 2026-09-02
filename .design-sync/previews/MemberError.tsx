import { MemberError } from "@jelly-health/design-system";

/**
 * A failed load, and the three things that keep it from reading as an emptiness:
 * a retry control that is not optional, `role="alert"` so a screen reader hears a
 * failure rather than nothing, and a bounded `--card` surface inside a
 * `--line-strong` edge where the empty state has no box at all.
 *
 * Neutral ink, never `--danger`: a failed read is not a clinical event, and a red
 * screen tells a member something is wrong with her.
 */
export function Default() {
  return (
    <div className="w-[420px]">
      <MemberError title="We couldn't load your messages" onRetry={() => {}}>
        This is not an empty conversation. Nothing was missed on your side —
        messages are still arriving.
      </MemberError>
    </div>
  );
}

/**
 * The label is the consumer's, and it wraps rather than clipping: the button
 * overrides `Button`'s console-era `whitespace-nowrap` and fixed height, keeping
 * only the 44px floor `plane="member"` sets.
 */
export function LongLabel() {
  return (
    <div className="w-[420px]">
      <MemberError
        title="We couldn't load your treatment"
        onRetry={() => {}}
        retryLabel="Try loading your treatment again"
      >
        Nothing has changed while this was unavailable.
      </MemberError>
    </div>
  );
}
