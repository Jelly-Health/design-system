---
category: member
---

# ThreadSkeleton

The conversation, loading.

`src/components/member/skeleton.tsx` is the authority for every decision below; this file exists
because the converter's source fuzzy-find cannot match `ThreadSkeleton` to a file named
`skeleton.tsx`, so without it the component is grouped as a generic primitive and ships no usage
guidance. Keep it short and keep it true — if it disagrees with the source, the source wins.

## Usage

```tsx
import { ThreadSkeleton } from "@jelly-health/design-system";

<Suspense fallback={<ThreadSkeleton />}>
  <Conversation />
</Suspense>
```

Usually you do not reach for this directly — `MemberStateView` with `skeleton="thread"` draws it
for the `loading` state.

## Props

- `label?: string` — the `sr-only` announcement, defaults to `"Loading the conversation"`.
- Plus the rest of `div`'s props.

## Why a skeleton and never a spinner

A skeleton holds the surface's real geometry, so the layout does not reshape itself when the read
lands. This renders a **real `<Thread>`** rather than re-declaring its container classes, so the
surface, the 18px turn gap and the 24/22 screen padding cannot drift from the thing it stands in
for. The turns are ragged and alternate sides on purpose — a stack of equal blocks on one side
reads as a list, and the panel would reshape into a conversation when the read landed.

Density is member, not console: built from `--pad-member-screen` (24/22) and `--gap-member-thread`
(18px), with every block height derived from a member type step times its own mapped leading
rather than picked.

## The fill is `--line`, and it was measured

A skeleton block is delimited by its fill alone — no text in it, no border on it. `--mut` fails the
3 ΔL\* threshold `tokens.css` sets for exactly that question (2.77 on `--sur` in light). `--line`
is the one existing role that clears it on all three member surfaces in **both** themes, which is
the whole argument for using a boundary token as a fill. `scripts/verify-member-states.mjs`
recomputes those numbers from `tokens.css` and fails if a retune drops any under 3.

## It is announced, not merely drawn

`role="status"` + `aria-busy` + an `sr-only` label. A member on bad signal is exactly the person
most likely to be on a screen reader waiting on this, and a screen of unlabelled grey rectangles
reads as nothing at all. Stateless and free of `"use client"` — identical markup on every render,
so it can be flushed in a `<Suspense>` fallback.
