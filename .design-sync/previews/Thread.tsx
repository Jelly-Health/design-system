import {
  Thread,
  ThreadDay,
  ThreadEvent,
  MessageGroup,
  MessageSender,
  MessageBubble,
  PendingValue,
  Avatar,
  AvatarFallback,
} from "@jelly-health/design-system";

/**
 * The canonical composition, ported verbatim from the package README's
 * "The member compositions" section — day heading, a provider turn, the member's
 * reply, and a state change as an event row rather than a bubble.
 */
export function Conversation() {
  return (
    <Thread className="w-[420px]">
      <ThreadDay>12 Aug</ThreadDay>

      <MessageGroup>
        <MessageSender name="Alex">
          <Avatar className="size-6">
            <AvatarFallback className="text-member-caption">AK</AvatarFallback>
          </Avatar>
        </MessageSender>
        <MessageBubble voice="provider">
          Had a look at your panel this morning — nothing there worries me.{" "}
          <PendingValue />
        </MessageBubble>
        <MessageBubble voice="provider">
          I&apos;d like to move you up. Nothing you need to do.
        </MessageBubble>
      </MessageGroup>

      <MessageBubble voice="member">ok — will I feel different?</MessageBubble>

      <ThreadEvent action={<a href="/treatment">Your treatment</a>}>
        Alex changed your dose to <PendingValue /> · 12 Aug
      </ThreadEvent>
    </Thread>
  );
}

/**
 * `ThreadDay` on its own, above a single turn — the date heading is centred and
 * uppercase, the one place the system's negative-tracking rule inverts.
 */
export function DayHeading() {
  return (
    <Thread className="w-[420px]">
      <ThreadDay>Yesterday</ThreadDay>
      <MessageGroup>
        <MessageSender name="Priya">
          <Avatar className="size-6">
            <AvatarFallback className="text-member-caption">PR</AvatarFallback>
          </Avatar>
        </MessageSender>
        <MessageBubble voice="coordinator">
          Your next lab draw is booked. I&apos;ll send the address the day before.
        </MessageBubble>
      </MessageGroup>
    </Thread>
  );
}

/**
 * Event rows clustered under one day — state changes a member would notice,
 * stated in the past tense, one row each. The second row carries no action,
 * which is the common case.
 */
export function StateChanges() {
  return (
    <Thread className="w-[420px]">
      <ThreadDay>28 Aug</ThreadDay>
      <ThreadEvent action={<a href="/refills">Track shipment</a>}>
        Your refill shipped · 28 Aug
      </ThreadEvent>
      <ThreadEvent>Lab results were added to your record · 28 Aug</ThreadEvent>
    </Thread>
  );
}
