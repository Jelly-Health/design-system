import {
  MemberStateView,
  memberStateFrom,
  MessageBubble,
  Thread,
} from "@jelly-health/design-system";

/* Message-shaped, and rendered through `Thread` in `Ready` below, because `skeleton="thread"`
 * promises that the loading state holds the geometry the ready state will occupy. A ready branch
 * that drew bare paragraphs would reshape the screen the moment the read landed — the one thing
 * `ThreadSkeleton` exists to prevent. */
const rows = [
  { id: "1", voice: "provider" as const, text: "Your refill shipped this morning." },
  { id: "2", voice: "member" as const, text: "great — thank you" },
];

const copy = {
  empty: {
    title: "No messages yet",
    body: "Alex writes here when there is something to say.",
  },
  error: {
    title: "We couldn't load your messages",
    body: "This is not an empty conversation. Nothing was missed on your side.",
    onRetry: () => {},
  },
} as const;

/**
 * The switch that makes the four states un-collapsible. It owns the choice and
 * constructs both blocks itself, so the empty markup is not reachable from the
 * error branch — the consumer hands over words, never markup.
 *
 * `skeleton` is a discriminant rather than a node slot for the same reason: a node
 * would let the loading state be handed the empty block.
 */
export function Ready() {
  return (
    <div className="w-[420px]">
      <MemberStateView
        state={memberStateFrom(rows)}
        skeleton="thread"
        empty={copy.empty}
        error={copy.error}
      >
        {(items) => (
          <Thread>
            {items.map((row) => (
              <MessageBubble key={row.id} voice={row.voice}>
                {row.text}
              </MessageBubble>
            ))}
          </Thread>
        )}
      </MemberStateView>
    </div>
  );
}

/** `memberStateFrom([])` resolves to `empty`; `ready` with nothing in it does not compile. */
export function Empty() {
  return (
    <div className="w-[420px]">
      <MemberStateView
        state={memberStateFrom([])}
        skeleton="thread"
        empty={copy.empty}
        error={copy.error}
      >
        {() => null}
      </MemberStateView>
    </div>
  );
}

/** The failure branch — note the retry, which the empty branch has no way to grow. */
export function Failed() {
  return (
    <div className="w-[420px]">
      <MemberStateView
        state={{ status: "error" }}
        skeleton="thread"
        empty={copy.empty}
        error={copy.error}
      >
        {() => null}
      </MemberStateView>
    </div>
  );
}

/** Loading, via the `thread` discriminant. */
export function Loading() {
  return (
    <div className="w-[420px]">
      <MemberStateView
        state={{ status: "loading" }}
        skeleton="thread"
        empty={copy.empty}
        error={copy.error}
      >
        {() => null}
      </MemberStateView>
    </div>
  );
}
