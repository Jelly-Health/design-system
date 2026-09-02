---
category: member
---

# MemberEmpty

Nothing here yet, and nothing wrong.

`src/components/member/state.tsx` is the authority for every decision below; this file exists
because the converter's source fuzzy-find cannot match `MemberEmpty` to a file named `state.tsx`,
so without it the component is grouped as a generic primitive and ships no usage guidance. Keep it
short and keep it true — if it disagrees with the source, the source wins.

## Usage

```tsx
import { MemberEmpty } from "@jelly-health/design-system";

<MemberEmpty title="No messages yet">
  Your care team will start the conversation here.
</MemberEmpty>
```

## Props

- `title: string` — required.
- `children: React.ReactNode` — **required**. Say *why* it is empty. A bare title is a word on a
  screen, and "no messages" with nothing after it is exactly the reading the house rule forbids.
- Plus the rest of `div`'s props, minus `children`.

## The four absences, each doing work

Deliberately the plainest thing in the member plane: text on the page ground, **no box, no border,
no icon and no control**. The only thing that must be true of this component is that it cannot be
mistaken for `MemberError` — and that guarantee is structural, not lexical. A member reading the
two at a glance sees a bordered card with a button, or a sentence. Copy alone would not survive a
consumer writing "Nothing to show" in both.

**There is no retry prop, and there will not be one.** A retry on an empty screen invites the
member to re-fetch a thing that is not broken and hands the empty state the one affordance that
marks a failure. There is also no call to action: an empty state that asks the member to do
something has decided, on no evidence, that the emptiness is her fault.

## Prefer `MemberStateView`

If you are choosing between this and `MemberError` at a call site, use
[`MemberStateView`](../MemberStateView) instead — it owns the switch, so the empty markup is
unreachable from the error branch.
