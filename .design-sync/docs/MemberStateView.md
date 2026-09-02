---
category: member
---

# MemberStateView

Renders exactly one of the member plane's four states, and owns the choice so a consumer cannot
make it wrongly. **This is the component to reach for** — prefer it over composing `MemberEmpty`,
`MemberError` and the skeletons by hand.

`src/components/member/state.tsx` is the authority for every decision below; this file exists
because the converter's source fuzzy-find cannot match `MemberStateView` to a file named
`state.tsx`, so without it the component is grouped as a generic primitive and ships no usage
guidance. Keep it short and keep it true — if it disagrees with the source, the source wins.

## Usage

```tsx
import { MemberStateView, memberStateFrom } from "@jelly-health/design-system";

<MemberStateView
  state={memberStateFrom(messages)}
  skeleton="thread"
  empty={{ title: "No messages yet", body: "Your care team will start the conversation here." }}
  error={{
    title: "We couldn't load your messages",
    body: "This isn't an empty inbox. Check your connection and try again.",
    onRetry: () => refetch(),
  }}
>
  {(items) => <Thread>{items.map((m) => <MessageBubble key={m.id} {...m} />)}</Thread>}
</MemberStateView>
```

## Props

- `state: MemberState<T>` — the four-variant union, below.
- `skeleton: 'thread' | 'screen'` — which loading state to draw. A discriminant rather than a
  `ReactNode`, so a node slot cannot hand the loading state the empty block.
- `empty: { title, body }` and `error: { title, body, onRetry, retryLabel? }` — **words, never
  markup**.
- `children: (items: NonEmpty<T>) => React.ReactNode` — rendered only for `ready`, and handed a
  list guaranteed to have something in it.

## The house rule this exists for

**A failed load must never read as "nothing to do."** It is this product's worst failure mode: a
member on bad signal told there is nothing waiting for her. Documenting the rule is not enough,
because the way it gets broken is never a decision — it is a consumer with four states and three
renderers reaching for the nearest one. So **the wrong state is a type error, not a review
comment.**

## The state type

```ts
type MemberState<T> =
  | { readonly status: 'loading' }
  | { readonly status: 'empty' }
  | { readonly status: 'ready'; readonly items: NonEmpty<T> }   // readonly [T, ...T[]]
  | { readonly status: 'error' }
```

`empty` is a **fourth variant**, not `ready` with zero items, and `ready` carries a **non-empty**
list: `{ status: 'ready', items: [] }` does not compile. A consumer cannot arrive at "ready with
nothing in it" — the state that renders as silence and is therefore indistinguishable from a
failure.

Three things a consumer cannot express: `ready` with nothing in it; an empty state with a retry;
and a failure the member cannot act on (`onRetry` is required). `MemberStateView` closes the last
gap — mis-wiring — by owning the switch and constructing both blocks itself. The switch is
exhaustive, so a fifth state added to `MemberState` fails to compile here rather than falling
through to a blank screen.

## `memberStateFrom`

```ts
memberStateFrom<T>(items: readonly T[]):
  | { readonly status: 'empty' }
  | { readonly status: 'ready'; readonly items: NonEmpty<T> }
```

The only sanctioned way to turn a list from a successful read into a state — `items.length > 0` is
not something TypeScript narrows to a tuple on its own. It returns the two-variant narrowing, so a
caller that already knows the read succeeded gets a type that cannot be `loading` or `error`. Use
it rather than writing your own `as`.
