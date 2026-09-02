import {
  PendingValue,
  Thread,
  MessageBubble,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@jelly-health/design-system";

/**
 * The `___` in running prose — the case the README shows and by far the most
 * common one. The rule underneath is `--pending-rule` at `--rule-emphasis`
 * (2px): a boundary, never a warning.
 */
export function InProse() {
  return (
    <p className="text-member-body text-ink w-[360px]">
      Alex changed your dose to <PendingValue /> and asked for a repeat panel in{" "}
      <PendingValue /> weeks.
    </p>
  );
}

/**
 * On the `--sur` surface inside a bubble, which is where most of the 90 canvas
 * instances actually sit. The mark keeps its own `--card` fill, so it stays
 * legible against a voice fill rather than dissolving into it.
 */
export function InAMessage() {
  return (
    <Thread className="w-[420px]">
      <MessageBubble voice="provider">
        Your next step up would be <PendingValue />, but I want the panel back
        first.
      </MessageBubble>
    </Thread>
  );
}

/**
 * A labelled read-out — the treatment-summary shape, where the value is the
 * whole point of the row and its absence has to be unmistakably "not signed off
 * yet" rather than "we have no data".
 */
export function InASummary() {
  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Your treatment</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="text-member-body text-ink flex flex-col gap-2">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-3">Current dose</dt>
            <dd>
              <PendingValue />
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-3">Next review</dt>
            <dd>
              <PendingValue />
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

/**
 * A custom `label` — the visible glyphs never change, only what a screen reader
 * is told. The default is "awaiting clinician sign-off"; override it when the
 * surrounding sentence makes a more specific reading available.
 */
export function CustomScreenReaderLabel() {
  return (
    <p className="text-member-body text-ink w-[360px]">
      Target range for your next draw:{" "}
      <PendingValue label="lab range awaiting clinician sign-off" />
    </p>
  );
}
