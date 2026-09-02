import { MemberStateView, memberStateFrom } from "@jelly-health/design-system";

const rows = [{ id: "1", text: "Your refill shipped" }];

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
        {(items) =>
          items.map((row) => (
            <p key={row.id} className="text-member-body text-ink">
              {row.text}
            </p>
          ))
        }
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
