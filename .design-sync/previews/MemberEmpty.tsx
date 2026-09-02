import { MemberEmpty } from "@jelly-health/design-system";

/**
 * Nothing here yet, and nothing wrong. No box, no border, no icon and — the one
 * to notice — no button: the absence of a control is what keeps this from being
 * mistaken for `MemberError`, which always has one.
 *
 * No call to action either. An empty screen that asks the member to do something
 * has decided, on no evidence, that the emptiness is her fault.
 */
export function Default() {
  return (
    <div className="w-[420px]">
      <MemberEmpty title="No messages yet">
        Alex writes here when there is something to say. You don&apos;t need to keep
        this open.
      </MemberEmpty>
    </div>
  );
}

/**
 * The body is required, and this is why: the sentence is the whole state. A bare
 * &ldquo;No messages&rdquo; is exactly the reading the house rule forbids — silence that a
 * member on bad signal cannot tell apart from a failed load.
 */
export function OnATaskScreen() {
  return (
    <div className="w-[420px]">
      <MemberEmpty title="Nothing to do today">
        Your next check-in is booked. We&apos;ll message you when it&apos;s time.
      </MemberEmpty>
    </div>
  );
}
