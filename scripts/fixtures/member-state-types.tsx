/* Type-level fixture for `scripts/verify-member-states.mjs` — NOT part of the shipped package.
 *
 * It lives outside `src/` on purpose: `package.json`'s `files` ships `src`, and `tsconfig.json`
 * includes only `src`, so this file is neither published nor part of `yarn typecheck`. The verify
 * script compiles it on its own with the same compiler options.
 *
 * ── How it asserts ───────────────────────────────────────────────────────────────────────────
 * Every `@ts-expect-error` below is an assertion that the line under it does NOT compile. If a
 * guarantee is weakened, the line starts compiling and `tsc` reports **TS2578, "Unused
 * '@ts-expect-error' directive"** — so the failure surfaces as a compile error rather than as a
 * silently passing test. The lines WITHOUT a directive are the control: they must compile, which
 * is what stops this file passing because everything in it is broken.
 *
 * ⚠️ `tsc` will also report the package's two pre-existing `ui/` ref-variance errors (badge, button)
 * when it follows the import graph. The verify script attributes errors by file and ignores those;
 * see its header.
 */
import * as React from 'react'

import {
  MemberEmpty,
  MemberError,
  MemberStateView,
  memberStateFrom,
  type MemberState,
} from '../../src/components/member/state'

type Row = { id: string }

const rows: readonly Row[] = []
const noop = () => {}

/* ── Controls: these MUST compile ──────────────────────────────────────────────────────────── */

const loading: MemberState<Row> = { status: 'loading' }
const failed: MemberState<Row> = { status: 'error' }
const blank: MemberState<Row> = { status: 'empty' }
const one: MemberState<Row> = { status: 'ready', items: [{ id: 'a' }] }
const derived: MemberState<Row> = memberStateFrom(rows)
void [loading, failed, blank, one, derived]

export const okEmpty = (
  <MemberEmpty title="No messages yet">Alex will write here when there is something to say.</MemberEmpty>
)

export const okError = (
  <MemberError title="We couldn’t load this" onRetry={noop}>
    This is not an empty screen.
  </MemberError>
)

export const okView = (
  <MemberStateView
    state={derived}
    skeleton="thread"
    empty={{ title: 'No messages yet', body: 'Nothing has arrived.' }}
    error={{ title: 'We couldn’t load this', body: 'This is not an empty screen.', onRetry: noop }}
  >
    {(items) => items.map((r) => <div key={r.id}>{r.id}</div>)}
  </MemberStateView>
)

/* ── 1. `ready` cannot be empty — the console's collapse, made unrepresentable ──────────────── */

// @ts-expect-error an empty list is not a `ready` state; it is the `empty` state
const readyWithNothing: MemberState<Row> = { status: 'ready', items: [] }

// @ts-expect-error a plain array is not known to be non-empty; go through `memberStateFrom`
const readyUnnarrowed: MemberState<Row> = { status: 'ready', items: rows }

/* ── 2. An empty state cannot carry a retry ─────────────────────────────────────────────────── */

// @ts-expect-error `onRetry` on an empty state would hand it the affordance that marks a failure
export const emptyWithRetry = <MemberEmpty title="Nothing yet" onRetry={noop}>Nothing.</MemberEmpty>

/* Both of the next two are written on one line on purpose. `@ts-expect-error` is line-scoped, and
 * `tsc` reports a bad JSX ATTRIBUTE at the attribute's own line — not at the element's opening
 * line — so a directive above a formatted multi-line element covers nothing and is then reported
 * as unused. There is no attribute-position comment syntax in JSX to put it closer. */
// @ts-expect-error the `empty` slot has no retry either — mis-wiring is closed at the view too
export const viewEmptySlotWithRetry = <MemberStateView state={derived} skeleton="screen" empty={{ title: 'Nothing yet', body: 'Nothing.', onRetry: noop }} error={{ title: 'Failed', body: 'Not empty.', onRetry: noop }}>{(items) => items.length}</MemberStateView>

/* ── 3. A failure the member cannot act on is unrepresentable ───────────────────────────────── */

// @ts-expect-error `onRetry` is required: a dead end is the state that most reads as "nothing to do"
export const errorWithoutRetry = <MemberError title="We couldn’t load this">Not an empty screen.</MemberError>

/* ── 4. Neither block can be a bare title ───────────────────────────────────────────────────── */

// @ts-expect-error the body is required — "No messages" with nothing after it IS the forbidden reading
export const emptyWithoutBody = <MemberEmpty title="No messages yet" />

// @ts-expect-error same rule on the failure side
export const errorWithoutBody = <MemberError title="We couldn’t load this" onRetry={noop} />

/* ── 5. The loading state cannot be handed another state's markup ───────────────────────────── */

// @ts-expect-error `skeleton` is a discriminant, not a node slot — see MemberStateView's docstring
export const viewWithNodeSkeleton = <MemberStateView state={derived} skeleton={<MemberEmpty title="x">y</MemberEmpty>} empty={{ title: 'Nothing yet', body: 'Nothing.' }} error={{ title: 'Failed', body: 'Not empty.', onRetry: noop }}>{(items) => items.length}</MemberStateView>

void [readyWithNothing, readyUnnarrowed]
void React
