import {
  Thread,
  MessageBubble,
  MessageGroup,
  MessageSender,
  Avatar,
  AvatarFallback,
} from "@jelly-health/design-system";

/**
 * The four voices, in the order `tokens.css` defines them. Rendered inside a
 * `Thread` because that is the surface (`--sur`) every ΔL* measurement in
 * `message-bubble.tsx` is taken against — a bubble shown on a bare page would
 * misrepresent the edge rule the two warm voices depend on.
 */
export function Voices() {
  return (
    <Thread className="w-[420px]">
      <MessageBubble voice="provider">
        Your panel looks steady — nothing there worries me.
      </MessageBubble>
      <MessageBubble voice="coordinator">
        I&apos;ve moved your check-in to Thursday at 4pm.
      </MessageBubble>
      <MessageBubble voice="system">
        Answer a few questions before your visit so Alex has them in front of her.
      </MessageBubble>
      <MessageBubble voice="member">
        thanks — Thursday works better for me
      </MessageBubble>
    </Thread>
  );
}

/**
 * One turn: a sender label rendered once, with two consecutive bubbles under it.
 * The 8px gap inside the group against 18px between turns is what makes these
 * read as one person continuing rather than two separate arrivals.
 */
export function ProviderTurn() {
  return (
    <Thread className="w-[420px]">
      <MessageGroup>
        <MessageSender name="Alex">
          <Avatar className="size-6">
            <AvatarFallback className="text-member-caption">AK</AvatarFallback>
          </Avatar>
        </MessageSender>
        <MessageBubble voice="provider">
          I read your notes from last week.
        </MessageBubble>
        <MessageBubble voice="provider">
          Let&apos;s keep everything where it is until the next draw.
        </MessageBubble>
      </MessageGroup>
    </Thread>
  );
}

/**
 * A member turn answering a provider turn — the only voice that sits on the
 * right, and the only one carrying no sender label.
 */
export function MemberReply() {
  return (
    <Thread className="w-[420px]">
      <MessageGroup>
        <MessageSender name="Priya">
          <Avatar className="size-6">
            <AvatarFallback className="text-member-caption">PR</AvatarFallback>
          </Avatar>
        </MessageSender>
        <MessageBubble voice="coordinator">
          Your pharmacy has everything it needs now.
        </MessageBubble>
      </MessageGroup>
      <MessageBubble voice="member">perfect, thank you</MessageBubble>
    </Thread>
  );
}

/**
 * A longer message, showing the 88% max-width the bubble caps itself at and how
 * the text wraps inside it.
 */
export function LongMessage() {
  return (
    <Thread className="w-[420px]">
      <MessageBubble voice="provider">
        A few people notice the first week feels different — appetite drops off
        before anything else does. If that happens, eat on your usual schedule
        even when you are not hungry, and tell me if it is still happening after
        a fortnight.
      </MessageBubble>
    </Thread>
  );
}
