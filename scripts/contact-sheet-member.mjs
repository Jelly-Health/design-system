#!/usr/bin/env node
/**
 * Render every member surface to an image, light beside dark, at both widths — JH221.
 *
 *     node scripts/contact-sheet-member.mjs             # both widths, all surfaces
 *     node scripts/contact-sheet-member.mjs --width 360
 *     node scripts/contact-sheet-member.mjs --case bubbles
 *
 * ── This is a GENERATOR, not a gate ──────────────────────────────────────────────────────────
 * Named `contact-sheet-*` rather than `verify-*` on purpose: it asserts almost nothing and must
 * never be read as a check that passed. Its exit code says the sheet was produced, not that the
 * sheet looks right. The one thing it does enforce is coverage (part 0 below), because a sheet
 * that silently omits a surface is worse than no sheet — it is a sign-off with a hole in it.
 *
 * ── Why this exists ──────────────────────────────────────────────────────────────────────────
 * `verify-contrast.py` computes 152 pairs, `verify-member-states.mjs` measures geometry and
 * computed colour on 46 cases, `verify-member-chrome.mjs` another 76. All three assert numbers and
 * **none of them takes a picture.** JH221 is a human looking at each member surface in dark and
 * saying yes, and until this script there was nothing that put the surfaces in front of a human at
 * all. The arithmetic was never what was missing.
 *
 * The gap the numbers cannot close, in the card's own terms: `--pending-rule` at 3.18 on `--mut`
 * in dark is a *passing* ratio, and the question this card asks is whether a passing rule still
 * reads as *awaiting sign-off* rather than as an error or as missing data. No ratio answers that.
 *
 * ── Why light sits beside dark, in one image ─────────────────────────────────────────────────
 * Dark mode is not judged in isolation — it is judged against what the surface is *supposed* to
 * communicate, which light establishes. The error-vs-empty distinction is the case that decides
 * the layout: in light `--card` sits 12.91 ΔL* from `--line` and the bordered box is obvious; in
 * dark it is 6.99 ΔL* and quieter. Reading the dark frame alone, the box looks fine. Read beside
 * the light frame, the question "does the structural distinction still do the work" is answerable.
 * Two files, flipped between, loses exactly that.
 *
 * Nesting a `.dark` subtree inside a light page is legitimate here and not a hack: `tokens.css`
 * declares `.dark` as a plain class selector and its variant as `&:is(.dark *)`, so the role
 * overrides cascade to any subtree. Verified 2026-09-02 — `tokens.css:290`.
 *
 * ── Why both widths ──────────────────────────────────────────────────────────────────────────
 * The column IS the container, not the viewport. `PortalShell` sets `container-type`, so a 360px
 * column renders the phone layout and a 900px column the three-pane desktop, on the same page and
 * in the same run. That is the honest rendering of a container-query component and it is why the
 * sheet does not need a viewport dance to show both.
 *
 * ── Output ───────────────────────────────────────────────────────────────────────────────────
 * `.design-sync/.cache/contact-sheet/` — under `.cache/`, which `.gitignore` already excludes.
 * ⛔ **Do not commit the images.** They are a build artefact; this script is the deliverable, and
 * the reason it is the deliverable is that a sign-off has to be repeatable or it decays into a
 * date. The next card that adds a member surface regenerates the sheet rather than re-doing the
 * inspection from scratch — and part 0 will refuse to let it forget.
 *
 * ── Requirements ─────────────────────────────────────────────────────────────────────────────
 * `react`, `react-dom`, `esbuild`, `typescript` and `playwright`, plus a compiled stylesheet from
 * `node .design-sync/scripts/build-css.mjs` run at the package root. None is installed by this
 * package — borrow them as `.design-sync/NOTES.md` records.
 */
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { transformSync } from 'esbuild'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const OUT = join(ROOT, '.design-sync', '.cache', 'contact-sheet')
const CSS_CACHE = join(ROOT, '.design-sync', '.cache', 'compiled-styles.css')

const argv = process.argv.slice(2)
const argOf = (flag) => {
  const i = argv.indexOf(flag)
  return i === -1 ? null : argv[i + 1]
}
const ONLY_WIDTH = argOf('--width') === null ? null : Number(argOf('--width'))
const ONLY_CASE = argOf('--case')

/* Same loader as `verify-member-chrome.mjs`, and for its reason: it follows relative imports
 * rather than stubbing `cn`, so the real tailwind-merge resolves the class list. A sheet drawn
 * from stubbed classes is a picture of markup the browser never renders. */
const cache = new Map()

function loadFile(absPath) {
  if (cache.has(absPath)) return cache.get(absPath).exports
  const js = transformSync(readFileSync(absPath, 'utf8'), {
    loader: absPath.endsWith('.tsx') ? 'tsx' : 'ts',
    format: 'cjs',
    jsx: 'automatic',
  }).code
  const mod = { exports: {} }
  cache.set(absPath, mod)
  const req = (id) => {
    if (id === 'react') return React
    if (!id.startsWith('.')) return require(id)
    const base = resolve(dirname(absPath), id)
    for (const c of [base, `${base}.tsx`, `${base}.ts`, join(base, 'index.tsx'), join(base, 'index.ts')]) {
      if (existsSync(c) && !c.endsWith('/')) return loadFile(c)
    }
    throw new Error(`cannot resolve ${id} from ${absPath}`)
  }
  new Function('module', 'exports', 'require', js)(mod, mod.exports, req)
  return mod.exports
}

const load = (rel) => loadFile(join(ROOT, rel))

const { Thread, ThreadDay, ThreadEvent } = load('src/components/member/thread.tsx')
const { MessageBubble, MessageSender, MessageGroup } = load('src/components/member/message-bubble.tsx')
const { PendingValue } = load('src/components/member/pending-value.tsx')
const { MemberField } = load('src/components/member/field.tsx')
const { MemberEmpty, MemberError, MemberStateView, memberStateFrom } = load('src/components/member/state.tsx')
const { ThreadSkeleton, ScreenSkeleton } = load('src/components/member/skeleton.tsx')
const { TaskScreen, TaskDone } = load('src/components/member/task-screen.tsx')
const { OnboardingScreen, OnboardingStep } = load('src/components/member/onboarding.tsx')
const {
  PortalShell, PortalBody, PortalNav, PortalDestination, PortalIdentity,
  PortalConversation, PortalConversationHeader, PortalConversationFooter,
  PortalPane, PortalPaneBody, PortalPaneTitle, PortalBack, PortalMessageBar,
} = load('src/components/member/portal.tsx')

const { Button } = load('src/components/ui/button.tsx')
const { Input } = load('src/components/ui/input.tsx')
const { Textarea } = load('src/components/ui/textarea.tsx')
const { Checkbox } = load('src/components/ui/checkbox.tsx')
const { Label } = load('src/components/ui/label.tsx')
const { Switch } = load('src/components/ui/switch.tsx')
const { RadioGroup, RadioGroupItem } = load('src/components/ui/radio-group.tsx')

const h = React.createElement

/* ═══ The surfaces ═════════════════════════════════════════════════════════════════════════════
 *
 * No price appears anywhere below, including in the billing destination's label — README § *House
 * rules*. The Portal canvas goes further and is right: a price must be ABSENT, not blanked,
 * because the ruled blank means "awaiting clinical sign-off" and spending it on a price drains
 * that meaning. `PendingValue` below carries clinical values only.
 */

const DESTINATIONS = [
  ['Your care', '/care'],
  ['Your treatment', '/treatment'],
  ['Labs & results', '/labs'],
  ['Documents', '/documents'],
  ['Membership & billing', '/membership'],
]

const portal = (view, { overlay = false } = {}) =>
  h(
    PortalShell,
    { view },
    h(
      PortalBody,
      null,
      h(
        PortalNav,
        null,
        ...DESTINATIONS.map(([label, href], i) =>
          h(PortalDestination, { key: href, href, current: i === 0 }, label),
        ),
        h(PortalIdentity, null, 'Sarah M.'),
      ),
      h(
        PortalConversation,
        { overlay },
        h(PortalConversationHeader, null, 'Alex'),
        h(
          Thread,
          null,
          h(ThreadDay, null, 'Thursday 21 August'),
          h(
            MessageGroup,
            null,
            h(MessageSender, { name: 'Alex Chen, NP' }),
            h(MessageBubble, { voice: 'provider' }, 'Your panel came back. Everything is where I want it.'),
          ),
          h(MessageBubble, { voice: 'member' }, 'That is a relief, thank you.'),
        ),
        h(PortalConversationFooter, null, 'Message Alex'),
      ),
      h(
        PortalPane,
        null,
        h(
          PortalPaneBody,
          null,
          h(PortalBack, null),
          h(PortalPaneTitle, null, 'Your care'),
          h('p', { className: 'text-member-body text-ink-2' }, 'Blood draw — Thu 21 Aug, 9:00am.'),
        ),
      ),
    ),
    h(PortalMessageBar, {
      name: 'Message Alex',
      preview: 'Your panel came back. Everything is where I want it.',
    }),
  )

/* A stand-in for a real form control on the member plane — `MemberField` takes a render prop so
 * the control is the consumer's, which is the whole point of the eight `plane="member"`
 * primitives. */
const field = (props, control = (f) => h(Input, { ...f, plane: 'member', placeholder: 'Boots, Oxford Street' })) =>
  h(MemberField, props, control)

const CASES = [
  /* ── Thread ───────────────────────────────────────────────────────────────────────────────── */
  ['thread', 'Thread · ThreadDay · ThreadEvent · all four voices', ['Thread', 'ThreadDay', 'ThreadEvent', 'MessageBubble', 'MessageSender', 'MessageGroup'],
    h(
      Thread,
      null,
      h(ThreadDay, null, 'Thursday 21 August'),
      h(
        MessageGroup,
        null,
        h(MessageSender, { name: 'Alex Chen, NP' }),
        h(MessageBubble, { voice: 'provider' }, 'Your panel came back and everything is where I want it. I have left your dose unchanged.'),
        h(MessageBubble, { voice: 'provider' }, 'Next draw in twelve weeks.'),
      ),
      h(MessageBubble, { voice: 'member' }, 'That is a relief — thank you for looking so quickly.'),
      h(
        MessageGroup,
        null,
        h(MessageSender, { name: 'Priya Raman' }),
        h(MessageBubble, { voice: 'coordinator' }, 'I have booked the draw for you. Details are in Labs & results.'),
      ),
      h(MessageBubble, { voice: 'system' }, 'jellyhealth sends a reminder the day before every draw.'),
      h(ThreadEvent, { action: h('a', { href: '/treatment', className: 'text-accent-ink' }, 'Your treatment') }, 'Refill shipped on 19 August.'),
      h(ThreadEvent, null, 'Blood draw recorded on 21 August.'),
    )],

  /* ── The bubbles alone, so the four fills can be read against each other ──────────────────── */
  ['bubbles', 'MessageBubble — the four voices on --sur', ['MessageBubble'],
    h(
      Thread,
      null,
      h(MessageBubble, { voice: 'provider' }, 'provider — the one warm fill in the system'),
      h(MessageBubble, { voice: 'coordinator' }, 'coordinator — named support staff'),
      h(MessageBubble, { voice: 'system' }, 'system — jellyhealth speaking, never a state change'),
      h(MessageBubble, { voice: 'member' }, 'member — her own words, the only saturated fill'),
    )],

  /* ── PendingValue: the single most consequential misreading available on a member surface ──── */
  ['pending', 'PendingValue — must read as awaiting sign-off, not as an error or missing data', ['PendingValue'],
    h(
      'div',
      { className: 'bg-bg flex flex-col gap-[var(--space-3)] p-[var(--pad-member-screen)]' },
      h('p', { className: 'text-member-body text-ink' }, 'Your dose is ', h(PendingValue), ' mg, taken once weekly.'),
      h('p', { className: 'text-member-body text-ink' }, 'Next review in ', h(PendingValue), ' weeks.'),
      h('p', { className: 'text-member-body text-ink-2' }, 'Target range ', h(PendingValue), ' to ', h(PendingValue), ' — your clinician will confirm both.'),
      /* On --card as well as on --bg: the component sets its own `bg-card`, so on the page ground
       * it is a raised chip and on a card it is flush. Both readings are in scope. */
      h(
        'div',
        { className: 'bg-card border-line rounded-[var(--radius-lg)] border p-[var(--space-3)]' },
        h('p', { className: 'text-member-body text-ink' }, 'On a card: ', h(PendingValue), ' mg'),
      ),
      h('p', { className: 'text-member-caption text-ink-3' }, 'Compare: the rule is --pending-rule (#76716C in dark), never --danger and never --line.'),
    )],

  /* ── MemberField, every state ──────────────────────────────────────────────────────────────── */
  ['field', 'MemberField — resting, described, errored, optional', ['MemberField'],
    h(
      'div',
      { className: 'bg-bg flex flex-col gap-[var(--space-4)] p-[var(--pad-member-screen)]' },
      field({ label: 'Which pharmacy should this go to?' }),
      field({ label: 'Which pharmacy should this go to?', description: 'We will send it there for every refill until you change it.' }),
      field({ label: 'Which pharmacy should this go to?', error: 'Enter a pharmacy name.' }),
      field({ label: 'Anything else Alex should know?', optional: true }, (f) =>
        h(Textarea, { ...f, plane: 'member', rows: 3, placeholder: 'Optional' })),
    )],

  /* ── The four states (JH218) ───────────────────────────────────────────────────────────────── */
  ['states', 'ThreadSkeleton · ScreenSkeleton · MemberEmpty · MemberError', ['ThreadSkeleton', 'ScreenSkeleton', 'MemberEmpty', 'MemberError'],
    h(
      'div',
      { className: 'bg-bg flex flex-col gap-[var(--space-5)]' },
      h(ThreadSkeleton),
      h(ScreenSkeleton),
      h(MemberEmpty, { title: 'No messages yet' }, 'Alex will write when your results are back. Nothing is waiting on you.'),
      h(MemberError, { title: 'We could not load your conversation', onRetry: () => {} }, 'This is a problem on our side, not something you did.'),
    )],

  /* 🔴 The card's own question, isolated: a failed load must never read as "nothing to do", and the
   * two are separated STRUCTURALLY — a bordered `--card` box with a retry, versus text on the page
   * ground. In dark `--card` sits 6.99 ΔL* from `--line` against light's 12.91, so the box is real
   * but quieter. Put them adjacent, in both themes, and the compression is readable. */
  ['empty-vs-error', 'MemberEmpty beside MemberError — the structural distinction under compression', ['MemberEmpty', 'MemberError'],
    h(
      'div',
      { className: 'bg-bg flex flex-col gap-[var(--space-3)] p-[var(--space-3)]' },
      h(MemberEmpty, { title: 'No messages yet' }, 'Alex will write when your results are back. Nothing is waiting on you.'),
      h(MemberError, { title: 'We could not load your messages', onRetry: () => {} }, 'This is a problem on our side, not something you did.'),
    )],

  ['state-view', 'MemberStateView driving each of the four states', ['MemberStateView', 'memberStateFrom'],
    h(
      'div',
      { className: 'bg-bg flex flex-col gap-[var(--space-5)]' },
      /* `memberStateFrom` returns the two-variant narrowing only — `empty` or `ready` — because a
       * caller that already knows the read succeeded should get a type that cannot be `loading` or
       * `error`. Those two are constructed as literals, which is the shape a real consumer writes.
       * Passing a second argument here silently did nothing and threw on `undefined.length`. */
      ...[
        ['loading', { status: 'loading' }],
        ['empty', memberStateFrom([])],
        ['error', { status: 'error' }],
        ['ready', memberStateFrom([{ id: 'Your panel came back. Everything is where I want it.' }])],
      ].map(([name, state]) =>
        h(
          MemberStateView,
          {
            key: name,
            state,
            skeleton: 'thread',
            empty: { title: 'No messages yet', body: 'Alex will write when your results are back.' },
            error: { title: 'We could not load your conversation', body: 'This is a problem on our side.', onRetry: () => {} },
          },
          (items) => h(Thread, null, ...items.map((r) => h(MessageBubble, { key: r.id, voice: 'provider' }, r.id))),
        ),
      ),
    )],

  /* ── The three shells (JH219) ──────────────────────────────────────────────────────────────── */
  ['task', 'TaskScreen — land, one decision, done', ['TaskScreen'],
    h(
      TaskScreen,
      {
        onExit: () => {},
        title: 'Book your blood draw',
        lede: 'Alex ordered a full panel. Pick a time near you.',
        action: h(Button, { plane: 'member', className: 'w-full' }, 'Confirm booking'),
        actionNote: 'Nothing is charged until you tap this.',
      },
      h('p', { className: 'text-member-body text-ink' }, 'Thu 21 Aug, 9:00am — Quest Diagnostics, Downtown.'),
    )],

  /* The green tick on a near-black disc. `verify-member-chrome.mjs` asserts it clears 3:1 as a
   * graphical object in both themes, which is the WCAG 1.4.11 bar for a non-text carrier of
   * meaning — but 3:1 is a floor, not a judgement about whether it reads as *completed* rather
   * than as decoration. That judgement is this sheet's whole reason for existing. */
  ['done', 'TaskDone — --success-ink on --success-surface, the tick', ['TaskDone'],
    h(
      TaskDone,
      { onExit: () => {}, title: 'Booked', backHref: '/messages' },
      'Thu 21 Aug, 9:00am at Quest Diagnostics — Downtown. We will remind you the day before.',
    )],

  ['onboarding', 'OnboardingScreen · OnboardingStep — no progress indicator, by decision', ['OnboardingScreen', 'OnboardingStep'],
    h(
      OnboardingScreen,
      null,
      h(
        OnboardingStep,
        {
          title: 'Who you are',
          action: h(Button, { plane: 'member', className: 'w-full' }, 'Continue'),
        },
        h(
          'div',
          { className: 'flex flex-col gap-[var(--space-3)]' },
          field({ label: 'Full name' }, (f) => h(Input, { ...f, plane: 'member', placeholder: 'Sarah Mitchell' })),
          field({ label: 'Which state do you live in?' }, (f) => h(Input, { ...f, plane: 'member', placeholder: 'Oregon' })),
        ),
      ),
    )],

  /* ── The portal, in each configuration it has ──────────────────────────────────────────────── */
  ['portal-list', 'PortalShell view="list" — desktop three-pane at 900, phone list at 360',
    ['PortalShell', 'PortalBody', 'PortalNav', 'PortalDestination', 'PortalIdentity', 'PortalConversation',
     'PortalConversationHeader', 'PortalConversationFooter', 'PortalPane', 'PortalPaneBody', 'PortalPaneTitle',
     'PortalBack', 'PortalMessageBar'],
    portal('list')],

  ['portal-pane', 'PortalShell view="pane"', [], portal('pane')],
  ['portal-overlay', 'PortalShell view="pane" overlay — the phone conversation overlay', [], portal('pane', { overlay: true })],

  /* ── The eight plane="member" primitives (JH222) ───────────────────────────────────────────── */
  ['plane-controls', 'plane="member" — all eight primitives at the 44px floor',
    [],
    h(
      'div',
      { className: 'bg-bg flex flex-col gap-[var(--space-4)] p-[var(--pad-member-screen)]' },
      h(
        'div',
        { className: 'flex flex-wrap gap-[var(--space-2)]' },
        h(Button, { plane: 'member' }, 'Primary'),
        h(Button, { plane: 'member', variant: 'outline' }, 'Outline'),
        h(Button, { plane: 'member', variant: 'ghost' }, 'Ghost'),
      ),
      h(Input, { plane: 'member', placeholder: 'Input on the member plane' }),
      h(Textarea, { plane: 'member', rows: 2, placeholder: 'Textarea on the member plane' }),
      h(
        'div',
        { className: 'flex items-center gap-[var(--space-2)]' },
        h(Checkbox, { plane: 'member', id: 'cs-check' }),
        h(Label, { plane: 'member', htmlFor: 'cs-check' }, 'Send me a reminder the day before'),
      ),
      h(
        'div',
        { className: 'flex items-center gap-[var(--space-2)]' },
        h(Switch, { plane: 'member', id: 'cs-switch' }),
        h(Label, { plane: 'member', htmlFor: 'cs-switch' }, 'Text me as well as email'),
      ),
      h(
        RadioGroup,
        { plane: 'member', defaultValue: 'am' },
        h(
          'div',
          { className: 'flex items-center gap-[var(--space-2)]' },
          h(RadioGroupItem, { plane: 'member', value: 'am', id: 'cs-am' }),
          h(Label, { plane: 'member', htmlFor: 'cs-am' }, 'Morning'),
        ),
        h(
          'div',
          { className: 'flex items-center gap-[var(--space-2)]' },
          h(RadioGroupItem, { plane: 'member', value: 'pm', id: 'cs-pm' }),
          h(Label, { plane: 'member', htmlFor: 'cs-pm' }, 'Afternoon'),
        ),
      ),
    )],
]

/* ═══ 0. Coverage — the one thing this script refuses to let slide ═════════════════════════════
 *
 * Every renderable export of `src/components/member/` must appear in some case above. A component
 * that ships without reaching the sheet is a surface nobody signed off, and the failure is silent
 * by default: the sheet still renders, still looks complete, and is missing a thing. This is the
 * mechanism that makes the sign-off repeatable rather than a date — see the file docstring.
 *
 * The walk is an AST walk, not a grep. `grep '^export {'` misses `portal.tsx` entirely, because
 * its export block is multi-line, and drops 13 of the 30; a `sed` range over several files at once
 * spills from one file into the next. Both were hit while writing this. `verify-member-states.mjs`
 * part D does the same walk across the whole package — this is that approach, narrowed.
 */
function renderableExports() {
  const ts = require('typescript')
  const { readdirSync } = require('node:fs')
  const dir = join(ROOT, 'src/components/member')
  const names = []
  for (const f of readdirSync(dir)) {
    if (!/\.tsx$/.test(f)) continue
    const p = join(dir, f)
    const sf = ts.createSourceFile(p, readFileSync(p, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    sf.forEachChild((n) => {
      if (ts.isExportDeclaration(n) && n.exportClause && ts.isNamedExports(n.exportClause) && !n.isTypeOnly) {
        for (const el of n.exportClause.elements) if (!el.isTypeOnly) names.push(el.name.text)
      }
    })
  }
  return names
}

/* `messageBubbleVariants` is a cva and renders nothing. `memberStateFrom` is a function, but it is
 * listed as covered anyway because `state-view` calls it four times to build its states — it has a
 * visible consequence on the sheet, which is the test that matters here. */
const NOT_RENDERABLE = new Set(['messageBubbleVariants'])

const covered = new Set(CASES.flatMap(([, , names]) => names))
const all = renderableExports().filter((n) => !NOT_RENDERABLE.has(n))
const missing = all.filter((n) => !covered.has(n))

console.log(`coverage: ${all.length - missing.length}/${all.length} renderable member exports appear on the sheet`)
if (missing.length > 0) {
  console.error(`\n🔴 NOT ON THE SHEET: ${missing.join(', ')}`)
  console.error('Add each to a case above, or to an existing case\'s name list if it already renders there.')
  console.error('A surface missing from the sheet is a surface nobody signed off.')
  process.exit(1)
}

/* ═══ Render ═══════════════════════════════════════════════════════════════════════════════════ */

if (!existsSync(CSS_CACHE)) {
  console.error(`\n🔴 no compiled stylesheet at ${CSS_CACHE}`)
  console.error('Run `node .design-sync/scripts/build-css.mjs` from the package root first.')
  process.exit(1)
}

let chromium
try {
  ;({ chromium } = require('playwright'))
} catch {
  console.error('\n🔴 playwright is not resolvable — borrow it as `.design-sync/NOTES.md` records.')
  process.exit(1)
}

const css = readFileSync(CSS_CACHE, 'utf8')
const WIDTHS = ONLY_WIDTH === null ? [360, 900] : [ONLY_WIDTH]
const selected = ONLY_CASE === null ? CASES : CASES.filter(([id]) => id === ONLY_CASE)
if (selected.length === 0) {
  console.error(`\n🔴 no case named "${ONLY_CASE}". Known: ${CASES.map(([id]) => id).join(', ')}`)
  process.exit(1)
}

/* One column per theme, each exactly `width` wide so the surface renders at its true width and the
 * container query sees the column rather than the viewport. The gutter is --bg-neutral grey so
 * neither theme's page ground bleeds into the other's edge. */
const page = (width, body) => `<!doctype html><html><head><meta charset="utf-8">
<style>${css}</style>
<style>
  html,body{margin:0;padding:0;background:#8a8a8a}
  .cs-sheet{display:flex;flex-direction:column;gap:28px;padding:20px}
  .cs-row{display:flex;gap:20px;align-items:flex-start}
  .cs-col{width:${width}px;flex:0 0 ${width}px}
  .cs-label{font:600 12px/1.4 ui-sans-serif,system-ui,sans-serif;color:#fff;padding:0 0 6px}
  .cs-caption{font:600 13px/1.4 ui-sans-serif,system-ui,sans-serif;color:#fff;padding:0 0 4px}
  .cs-frame{overflow:hidden}
</style></head><body>${body}</body></html>`

const frame = (theme, el) =>
  `<div class="cs-col"><div class="cs-label">${theme.toUpperCase()}</div>` +
  `<div class="cs-frame ${theme === 'dark' ? 'dark' : ''}"><div class="bg-bg">${renderToStaticMarkup(el)}</div></div></div>`

const row = (id, caption, el) =>
  `<div data-case="${id}"><div class="cs-caption">${id} — ${caption}</div>` +
  `<div class="cs-row">${frame('light', el)}${frame('dark', el)}</div></div>`

rmSync(OUT, { recursive: true, force: true })
mkdirSync(join(OUT, 'surfaces'), { recursive: true })

const browser = await chromium.launch()
try {
  for (const width of WIDTHS) {
    const ctx = await browser.newContext({
      viewport: { width: width * 2 + 60, height: 1200 },
      deviceScaleFactor: 2,
    })
    const p = await ctx.newPage()

    /* Per-surface first — one image per case, which is what a reviewer actually opens. */
    for (const [id, caption, , el] of selected) {
      await p.setContent(page(width, `<div class="cs-sheet">${row(id, caption, el)}</div>`), { waitUntil: 'load' })
      const target = await p.$(`[data-case="${id}"]`)
      await target.screenshot({ path: join(OUT, 'surfaces', `${id}-${width}.png`) })
    }

    /* Then the whole sheet in one image, for the pass that compares surfaces to each other. */
    await p.setContent(
      page(width, `<div class="cs-sheet">${selected.map(([id, caption, , el]) => row(id, caption, el)).join('\n')}</div>`),
      { waitUntil: 'load' },
    )
    await p.screenshot({ path: join(OUT, `sheet-${width}.png`), fullPage: true })
    await ctx.close()
    console.log(`  ${width}px — ${selected.length} surfaces, light and dark`)
  }
} finally {
  await browser.close()
}

console.log(`\nwrote ${OUT}`)
console.log('⛔ build artefact — do not commit the images. The script is the deliverable.')
