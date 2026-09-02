---
category: member
---

# MemberError

The load failed, and the member can do something about it.

`src/components/member/state.tsx` is the authority for every decision below; this file exists
because the converter's source fuzzy-find cannot match `MemberError` to a file named `state.tsx`,
so without it the component is grouped as a generic primitive and ships no usage guidance. Keep it
short and keep it true — if it disagrees with the source, the source wins.

## Usage

```tsx
import { MemberError } from "@jelly-health/design-system";

<MemberError
  title="We couldn't load your messages"
  onRetry={() => refetch()}
>
  This isn't an empty inbox — the conversation is still there. Check your connection and try again.
</MemberError>
```

## Props

- `title: string` — required.
- `children: React.ReactNode` — **required**. Say what could not be loaded, and that it is not an
  emptiness.
- `onRetry: () => void` — **required**. A failure the member cannot act on reads as an empty
  screen; a dead end is the state that most says "nothing to do".
- `retryLabel?: string` — defaults to `"Try again"`.
- Plus the rest of `div`'s props, minus `children`.

## What makes it unmistakable is structure, not colour and not words

Three differences from `MemberEmpty`, each of which survives a consumer writing bad copy:

1. **A retry control, and it is not optional** — the one difference a member reads without
   reading. The component owns the `Button` (`plane="member"`, so the tap target clears the 44px
   floor) rather than taking a slot.
2. **`role="alert"`** — a member on a screen reader gets an announcement for a failure and silence
   for an emptiness, which is the correct pair.
3. **A bounded surface** — `--card` inside a `--line-strong` edge, where the empty state has no box
   at all. The edge is `--line-strong` rather than `--line` because `--card` sits 1.09 ΔL\* from
   `--bg` in light, far under the 3 ΔL\* threshold `tokens.css` sets for "a fill difference cannot
   delimit this".

## What it is not

**Not `--danger`.** Copy is neutral ink: a failed read is not a clinical event, and a red screen
tells a member something is wrong with *her*. It is also **not a severity tier** — there is no ramp
in this system, by product decision, so there is no "worse" error block below this one.

Carries no `"use client"`, the same position as `Button`: the boundary belongs to the consumer,
who knows where its tree turns interactive.

## Prefer `MemberStateView`

If you are choosing between this and `MemberEmpty` at a call site, use
[`MemberStateView`](../MemberStateView) instead — it owns the switch, so the error branch cannot
render the empty markup.
