/* Type-level fixture for `scripts/verify-member-chrome.mjs` — NOT part of the shipped package.
 *
 * Same contract as `member-state-types.tsx`, and the same reason for living outside `src/`:
 * `package.json`'s `files` ships `src` and `tsconfig.json` includes only `src`, so nothing here is
 * published or type-checked by `yarn typecheck`. The verify script compiles it on its own.
 *
 * Every `@ts-expect-error` asserts the line under it does NOT compile. Weaken the guarantee and
 * the line starts compiling, which `tsc` reports as **TS2578, "Unused '@ts-expect-error'
 * directive"** — the failure surfaces as a compile error rather than as a test that quietly still
 * passes. The undirected lines are the control: they must compile.
 *
 * ⚠️ The package's two pre-existing `ui/` ref-variance errors (badge, button) appear when `tsc`
 * follows the import graph. The script attributes errors by file and ignores them.
 */
import * as React from 'react'

import { TaskScreen, TaskDone } from '../../src/components/member/task-screen'
import { OnboardingScreen, OnboardingStep } from '../../src/components/member/onboarding'
import { PortalShell, PortalDestination, PortalNav } from '../../src/components/member/portal'

const noop = () => {}

/* ── Controls: these MUST compile ──────────────────────────────────────────────────────────── */

export const okTask = (
  <TaskScreen onExit={noop} title="Book your blood draw" lede="Alex ordered a full panel.">
    <p>Pick a time.</p>
  </TaskScreen>
)

export const okDone = (
  <TaskDone onExit={noop} title="Booked" backHref="/messages">
    We will remind you the day before.
  </TaskDone>
)

export const okStep = (
  <OnboardingScreen>
    <OnboardingStep title="Who you are" mark align="center">
      <p>Fields go here.</p>
    </OnboardingStep>
  </OnboardingScreen>
)

export const okPortal = (
  <PortalShell view="list">
    <PortalNav>
      <PortalDestination href="/care" current>
        Your care
      </PortalDestination>
    </PortalNav>
  </PortalShell>
)

/* ── 1. A task screen always has a way out ──────────────────────────────────────────────────── */

// @ts-expect-error `onExit` is required: a member who tapped a link she did not mean to is trapped without it
export const taskWithoutExit = <TaskScreen title="Book your blood draw">body</TaskScreen>

/* ── 2. A done screen is never a dead end ───────────────────────────────────────────────────── */

// @ts-expect-error `backHref` is required — "back to the thread" is the half of the sentence this screen completes
export const doneWithoutBack = <TaskDone onExit={noop} title="Booked">Done.</TaskDone>

// @ts-expect-error the sentence is required too: a bare "Booked" is a word on a screen
export const doneWithoutBody = <TaskDone onExit={noop} title="Booked" backHref="/messages" />

/* ── 3. The header is not a slot — a task screen cannot grow navigation ─────────────────────── */

// @ts-expect-error there is no header/nav slot, by design: this is the chrome rule, not a preference
export const taskWithHeaderSlot = <TaskScreen onExit={noop} title="Book" header={<nav />}>body</TaskScreen>

// @ts-expect-error `title` is words, not markup — a node here is a header bar waiting to happen
export const taskWithMarkupTitle = <TaskScreen onExit={noop} title={<b>Book</b>}>body</TaskScreen>

/* ── 4. Onboarding has no progress indicator ────────────────────────────────────────────────── */

// @ts-expect-error no `step`: none of the eleven canvas steps draws a counter, and step 9 says so
export const stepWithCounter = <OnboardingStep title="Who you are" step={2}>fields</OnboardingStep>

// @ts-expect-error and no `total` to count towards either
export const stepWithTotal = <OnboardingStep title="Who you are" total={11}>fields</OnboardingStep>

/* ── 5. A portal destination carries no count ───────────────────────────────────────────────── */

// @ts-expect-error no badge and no unread count: on a member surface a count is anxiety with no action attached
export const destWithBadge = <PortalDestination href="/care" badge={3}>Your care</PortalDestination>

/* ── 6. The shell always knows which phone view it is in ────────────────────────────────────── */

// @ts-expect-error `view` is required — the phone stack has no default, and guessing one hides a pane
export const shellWithoutView = <PortalShell>panes</PortalShell>

void React
