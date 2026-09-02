---
category: member
---

# ScreenSkeleton

A task screen, loading — a title, a paragraph, and the control at the bottom of it.

`src/components/member/skeleton.tsx` is the authority for every decision below; this file exists
because the converter's source fuzzy-find cannot match `ScreenSkeleton` to a file named
`skeleton.tsx`, so without it the component is grouped as a generic primitive and ships no usage
guidance. Keep it short and keep it true — if it disagrees with the source, the source wins.

## Usage

```tsx
import { ScreenSkeleton } from "@jelly-health/design-system";

<Suspense fallback={<ScreenSkeleton />}>
  <RefillTask />
</Suspense>
```

Usually you do not reach for this directly — `MemberStateView` with `skeleton="screen"` draws it
for the `loading` state.

## Props

- `label?: string` — the `sr-only` announcement, defaults to `"Loading"`.
- Plus the rest of `div`'s props.

## Why it is written from tokens rather than mirroring a container

Unlike `ThreadSkeleton`, there is no container component to mirror: **no member screen layout
exists in this package yet**, so the padding and gaps are written from the same tokens a screen
would use. If a member screen layout ever lands, this should render it the way `ThreadSkeleton`
renders a real `<Thread>`.

The control block is `--touch-min` tall rather than a button height. A skeleton that reserves 36px
and is then replaced by a 44px control moves everything under it — which is the one thing a
skeleton exists to prevent.

## Shared with `ThreadSkeleton`

The `--line` fill (measured against the 3 ΔL\* threshold in `tokens.css`, enforced by
`scripts/verify-member-states.mjs`), the `role="status"` + `aria-busy` + `sr-only` announcement,
and the staggered pulse that makes a row read as content arriving rather than a barber's pole. See
[`ThreadSkeleton`](../ThreadSkeleton) for the reasoning in full.
