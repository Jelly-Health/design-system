#!/usr/bin/env node
/**
 * Verify the member screen chrome — JH219.
 *
 *     node scripts/verify-member-chrome.mjs            # everything
 *     node scripts/verify-member-chrome.mjs --no-browser
 *
 * Three shells, and each is decided by one rule that a screenshot cannot check:
 *
 *   - **A task screen has no navigation.** *"land → one decision → done → back to the thread. No
 *     navigation chrome to get lost in"* — and `member-portal.css`'s chrome rule, which says the
 *     same thing about how the member ARRIVED rather than about layout.
 *   - **Onboarding has no progress indicator.** None of the eleven canvas steps draws one; step 9
 *     says so outright. *"Starts as a website, becomes a conversation, never becomes a form."*
 *   - **The portal is a container query, and its phone rules must not leak above 720px.** This is
 *     the one that has actually gone wrong before, in the spec this shell is built from.
 *
 * Four parts, because no one of them can see the whole claim — the same split JH218 settled on:
 *
 *   A. **Structure** (`renderToStaticMarkup`) — what reaches the DOM. One control in the task
 *      header and it is the exit; no `<nav>`, no `aria-current`, no progressbar, no counter.
 *   B. **Types** (`tsc` over `scripts/fixtures/member-chrome-types.tsx`) — the half a renderer
 *      cannot see: nine `@ts-expect-error` directives asserting that the wrong chrome does not
 *      COMPILE. A weakened guarantee shows up as TS2578, not as a test that still passes.
 *   C. **Layout** (real Chromium, both themes, **360px AND 900px**) — the container query, the
 *      three-pane switch, the touch floor and the overflow rules.
 *   D. **The compiled stylesheet** — that the container-query utilities emitted at all. A Tailwind
 *      class used only inside a package component compiles to nothing, silently, dev and prod
 *      (`.design-sync/NOTES.md` records two subagents hitting it independently). A layout check
 *      passes for the wrong reason if the rule it depends on was never generated.
 *
 * ── Why 900px is not optional ────────────────────────────────────────────────────────────────
 * `member-portal.css` documents the bug this width exists to catch, in its own words:
 *
 *     :not(.mp--bare) is load-bearing. Both this and .mp--bare .mp__list{display:none} are
 *     specificity 0,2,0, and this rule comes later — so without the exclusion the container
 *     query silently restored the sidebar in bare mode… **and it only appeared above 720px,
 *     so a phone-width check could not catch it.**
 *
 * The same asymmetry exists in Tailwind and is easier to hit: `group-data-[view=pane]/portal:hidden`
 * compiles to two classes' worth of specificity and `@min-[720px]/portal:flex` to one, so the
 * desktop rule loses regardless of source order. `portal.tsx` avoids the race by scoping each
 * phone rule to `@max-[720px]` instead of overriding it later — mutation 3 below is that fix
 * removed, and it fails **only** at 900px.
 *
 * ── The mutations that decide the card ───────────────────────────────────────────────────────
 * A guard that has never failed is not evidence. All six were applied, run, and reverted on
 * 2026-09-02; every one failed, and the tree was re-run green after each.
 *
 *   - 🔴 **A second control in the task-screen header** (the card's own mutation — *"a task screen
 *     that grows a navigation affordance"*), added as a `<nav>` with two destinations.
 *       -> **4 structural cases fail** across both screens: the header stops holding exactly one
 *          control, a `<nav>` appears where the chrome rule forbids one, `aria-current` appears on
 *          a screen that has no current destination, and `TaskDone`'s header fails the same three.
 *          Part B is silent — a header slot is a *prop* the type already refuses, but markup added
 *          inside this file is not something a type can see. That is the argument for both parts.
 *   - **`backHref` made optional on `TaskDone`**
 *       -> 1 type case: the "done screen is never a dead end" directive goes unused, TS2578.
 *          Nothing in A or C moves — a consumer who passes one still gets a link. The whole defect
 *          is in what a consumer is ALLOWED to leave out, which is exactly `onRetry`'s shape.
 *   - 🔴 **`@max-[720px]/portal:` dropped from the nav's hide rule**, leaving a bare
 *     `group-data-[view=pane]/portal:hidden` — i.e. the spec's own bug, reintroduced.
 *       -> **2 cases fail, both at 900px, one per theme**, and *nothing at 360px moves*: the
 *          sidebar disappears at desktop width whenever the pane is the phone view, which is the
 *          navigable-portal-restored failure in mirror image. A phone-width-only harness reports a
 *          clean sweep. This is the single most valuable case in this file.
 *   - **`plane="member"` dropped from the task-screen exit button**
 *       -> **6 cases**, two more than expected and the two extra are the interesting ones: the
 *          control measures 36px against the 44px floor in both themes at both widths (4), the
 *          class is gone from the markup (1), and — unplanned — the screen starts reaching for
 *          `text-console-sm` (1), because `plane` is what swaps `Button`'s console type for member
 *          type. One prop carries both the tap target and the density. `tsc` is clean throughout:
 *          `plane` is optional, which is how the same bug shipped once already
 *          (`verify-member-plane.mjs`).
 *   - **A progress bar added to `OnboardingStep`** (`role="progressbar"` plus "Step 2 of 11")
 *       -> 2 structural cases: the progressbar role and the counter pattern. Worth recording that
 *          the type part catches the *prop* version of this and cannot catch the markup version —
 *          the file docstring is explicit that the rule is documented, not enforced, against a
 *          consumer's own children.
 *   - **`min-w-0 break-words` dropped from `PortalDestination`'s label**
 *       -> **8 cases, 2 per theme at BOTH widths** — not the 4 expected. Desktop was supposed to
 *          be safe because the sidebar is a fixed 15rem, and it is not: `portal-boxed` puts a
 *          360px shell on the 900px page, so the phone failure travels to the desktop run with it.
 *          That is the container-query case earning its place twice. The long destination name is
 *          **unbroken** on purpose — one with spaces wraps by itself and the mutation passes,
 *          which is the trap JH218 recorded and it is just as live here.
 *
 * ── Requirements ─────────────────────────────────────────────────────────────────────────────
 * `react`, `react-dom`, `esbuild`, `typescript` and `playwright`, plus a compiled stylesheet from
 * `node .design-sync/scripts/build-css.mjs`. None is installed by this package — borrow them as
 * `.design-sync/NOTES.md` records. **Any SKIP exits non-zero**, including the deliberate
 * `--no-browser` one: a zero exit has to mean every part ran, or a missing dependency reads as a
 * pass.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { transformSync } from 'esbuild'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const NO_BROWSER = process.argv.includes('--no-browser')

let pass = 0
let fail = 0
let skip = 0

function check(name, ok, detail) {
  if (ok) {
    pass += 1
    console.log(`PASS  ${name}`)
  } else {
    fail += 1
    console.log(`FAIL  ${name}`)
    if (detail !== undefined) console.log(`      ${String(detail).slice(0, 600)}`)
  }
}

function skipped(name, why) {
  skip += 1
  console.log(`SKIP  ${name} — ${why}`)
}

/* Follows relative imports rather than stubbing `cn`, for JH218's reason: the real tailwind-merge
 * has to resolve the class list, or part C measures markup the browser never renders. */
const cache = new Map()

function loadFile(absPath) {
  if (cache.has(absPath)) return cache.get(absPath).exports
  const src = readFileSync(absPath, 'utf8')
  const js = transformSync(src, {
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

const { TaskScreen, TaskDone } = load('src/components/member/task-screen.tsx')
const { OnboardingScreen, OnboardingStep } = load('src/components/member/onboarding.tsx')
const {
  PortalShell, PortalBody, PortalNav, PortalDestination, PortalIdentity,
  PortalConversation, PortalConversationHeader, PortalConversationFooter,
  PortalPane, PortalPaneBody, PortalPaneTitle, PortalBack, PortalMessageBar,
} = load('src/components/member/portal.tsx')
const { Thread } = load('src/components/member/thread.tsx')
const { MessageBubble } = load('src/components/member/message-bubble.tsx')

const h = React.createElement
const render = (el) => renderToStaticMarkup(el)

/* ═══ The three shells, as a consumer would write them ═════════════════════════════════════════
 *
 * No price appears anywhere below, including in the billing destination's label — README § *House
 * rules*: no prices, anywhere, including example copy. The Portal canvas goes further and is right:
 * a price must be ABSENT, not blanked, because the ruled blank means "awaiting clinical sign-off"
 * and spending it on a price drains that meaning. */

const DESTINATIONS = [
  ['Your care', '/care'],
  ['Your treatment', '/treatment'],
  ['Labs & results', '/labs'],
  ['Documents', '/documents'],
  ['Membership & billing', '/membership'],
]

/* Unbroken on purpose. A name with spaces in it wraps by itself and the mutation passes — the trap
 * JH218 recorded, and a translated destination name reaches this component unbroken. */
const LONG_DESTINATION = 'Behandlungsuebersichtundlaborergebnisse'.repeat(4)

const portal = (view, { overlay = false, longLabel = false } = {}) =>
  h(
    PortalShell,
    { view, 'data-testid': `portal-${view}${overlay ? '-overlay' : ''}${longLabel ? '-long' : ''}` },
    h(
      PortalBody,
      null,
      h(
        PortalNav,
        null,
        ...DESTINATIONS.map(([label, href], i) =>
          h(
            PortalDestination,
            { key: href, href, current: i === 0 },
            longLabel && i === 2 ? LONG_DESTINATION : label,
          ),
        ),
        h(PortalIdentity, null, 'Sarah M.'),
      ),
      h(
        PortalConversation,
        { overlay },
        h(PortalConversationHeader, null, 'Alex'),
        h(Thread, null, h(MessageBubble, { voice: 'provider' }, 'Everything is where I want it.')),
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
          h('p', null, 'Blood draw — Thu 21 Aug.'),
        ),
      ),
    ),
    h(PortalMessageBar, { name: 'Message Alex', preview: 'Everything is where I want it, and your thyroid is fine.' }),
  )

const taskEl = h(
  TaskScreen,
  {
    onExit: () => {},
    title: 'Book your blood draw',
    lede: 'Alex ordered a full panel. Pick a time near you.',
    action: h('button', { type: 'button' }, 'Confirm booking'),
    actionNote: 'Nothing is charged until you tap this.',
  },
  h('p', null, 'Thu 21 Aug, 9:00am'),
)

const doneEl = h(
  TaskDone,
  { onExit: () => {}, title: 'Booked', backHref: '/messages' },
  'Thu 21 Aug, 9:00am at Quest Diagnostics — Downtown. We will remind you the day before.',
)

const stepEl = h(
  OnboardingScreen,
  null,
  h(
    OnboardingStep,
    { title: 'Who you are', action: h('button', { type: 'button' }, 'Continue') },
    h('p', null, 'Full name, email, state, date of birth.'),
  ),
)

const taskHtml = render(taskEl)
const doneHtml = render(doneEl)
const stepHtml = render(stepEl)
const portalHtml = render(portal('list'))

/* ═══ A. Structure ═════════════════════════════════════════════════════════════════════════════ */
console.log('\n── A. structure ───────────────────────────────────────────────')

/* The header is everything before the body slot opens. Sliced rather than parsed, which is enough
 * for "how many controls are in it" and does not pull in a DOM. */
const headerOf = (html) => html.slice(0, html.indexOf('data-slot="task-screen-body"') + 1 || html.indexOf('role="status"') + 1)
const taskHeader = headerOf(taskHtml)
const doneHeader = headerOf(doneHtml)
const countControls = (html) => (html.match(/<(?:button|a)\b/g) ?? []).length

check('the task header holds exactly one control', countControls(taskHeader) === 1, taskHeader)
check('and it is the exit', taskHeader.includes('data-slot="task-screen-exit"'), taskHeader)
check('the exit is labelled for a screen reader', /aria-label="[^"]+"/.test(taskHeader), taskHeader)
check('the exit is on the member plane, so it clears the touch floor', taskHeader.includes('data-plane="member"'), taskHeader)
check('the done header holds exactly one control too', countControls(doneHeader) === 1, doneHeader)

check('a task screen renders no navigation landmark', !/<nav\b/.test(taskHtml) && !/<nav\b/.test(doneHtml), taskHtml)
check('a task screen names no current destination', !/aria-current/.test(taskHtml) && !/aria-current/.test(doneHtml))
check('a task screen carries no destination list', !/portal-destination|portal-nav/.test(taskHtml + doneHtml))

check('the done screen announces politely, never as an alert', doneHtml.includes('role="status"') && !doneHtml.includes('role="alert"'), doneHtml.slice(0, 300))
check('the done screen carries a way back, and it is an anchor', /<a[^>]+data-slot="task-done-back"[^>]*href="/.test(doneHtml) || /<a[^>]+href="[^"]*"[^>]*data-slot="task-done-back"/.test(doneHtml), doneHtml)
check('the deciding screen and the done screen are not the same markup', taskHtml !== doneHtml)
check('the success mark is decorative, not announced twice', /data-slot="task-done-mark"[^>]*aria-hidden="true"|aria-hidden="true"[^>]*data-slot="task-done-mark"/.test(doneHtml), doneHtml)

check('onboarding draws no progress indicator', !/role="progressbar"|<progress\b/.test(stepHtml), stepHtml)
check('onboarding draws no step counter', !/\bstep\s+\d+\s*(of|\/)\s*\d+/i.test(stepHtml), stepHtml)
check('onboarding draws no back control', !/data-slot="portal-back"|←\s*Back|Go back/i.test(stepHtml), stepHtml)
check('onboarding is a card on the page ground, not a bordered alert surface', stepHtml.includes('bg-card') && !stepHtml.includes('border-line-strong'), stepHtml.slice(0, 400))

check('a portal destination carries no badge or count element', !/data-slot="badge"/.test(portalHtml), portalHtml.slice(0, 400))
check('the current destination is marked for assistive tech, not only by fill', portalHtml.includes('aria-current="page"'), portalHtml.slice(0, 400))
check('the nav is a labelled landmark', /<nav[^>]+aria-label="[^"]+"/.test(portalHtml), portalHtml.slice(0, 300))
check('the identity block sits last in the nav', portalHtml.indexOf('portal-identity') > portalHtml.lastIndexOf('portal-destination'))
check('every member surface reaches for member type, never console type', !/text-console/.test(taskHtml + doneHtml + stepHtml + portalHtml))
check('no price appears anywhere in the chrome or its example copy', !/\$/.test(taskHtml + doneHtml + stepHtml + portalHtml))

/* ═══ B. Types ═════════════════════════════════════════════════════════════════════════════════ */
console.log('\n── B. types ───────────────────────────────────────────────────')

const FIXTURE = join('scripts', 'fixtures', 'member-chrome-types.tsx')
let tscBin
try {
  tscBin = require.resolve('typescript/bin/tsc')
} catch {
  tscBin = null
}

if (tscBin === null) {
  skipped('the wrong chrome does not compile', 'typescript is not installed')
} else {
  let out = ''
  try {
    out = execFileSync(
      process.execPath,
      [tscBin, '--noEmit', '--strict', '--jsx', 'react-jsx', '--target', 'ES2022', '--module', 'ESNext',
       '--moduleResolution', 'bundler', '--skipLibCheck', '--esModuleInterop', FIXTURE],
      { cwd: ROOT, encoding: 'utf8' },
    )
  } catch (e) {
    out = `${e.stdout ?? ''}${e.stderr ?? ''}`
  }
  /* Attribute by file: `tsc` follows the import graph into `ui/`, whose two ref-variance errors
   * are the package's documented baseline and nothing to do with this fixture. */
  const mine = out.split('\n').filter((l) => l.startsWith('scripts/fixtures/') && /error TS/.test(l))
  check('the wrong chrome does not compile: every @ts-expect-error is used', mine.length === 0, mine.join('\n') || out.slice(0, 400))
  const directives = readFileSync(join(ROOT, FIXTURE), 'utf8').match(/^\/\/ @ts-expect-error/gm) ?? []
  check('the fixture still asserts every guarantee (9 of them)', directives.length === 9, `found ${directives.length}`)
}

/* ═══ D. The compiled stylesheet ═══════════════════════════════════════════════════════════════ */
console.log('\n── D. the compiled stylesheet ─────────────────────────────────')

const CSS_CACHE = join(ROOT, '.design-sync', '.cache', 'compiled-styles.css')

if (!existsSync(CSS_CACHE)) {
  skipped('the container-query utilities were generated', 'run `node .design-sync/scripts/build-css.mjs` from the package root first')
} else {
  const css = readFileSync(CSS_CACHE, 'utf8')
  check('the portal declares a NAMED container, not an anonymous one', /container-name:\s*portal/.test(css), 'container-name: portal')
  check('the phone rules are scoped to below the breakpoint', css.includes('@container portal (width < 720px)'))
  check('the desktop rules are scoped to at or above it', css.includes('@container portal (width >= 720px)'))
  /* The two are complementary and non-overlapping, which is what removes the specificity race —
   * see the file docstring. If a future edit turns one into a `<=`/`>` pair they overlap at 720px
   * and the race is back. */
  check('and the two ranges do not overlap', !/@container portal \(width <= 720px\)/.test(css) && !/@container portal \(width > 720px\)/.test(css))
}

/* ═══ C. Layout, in a real browser, in both themes, at both widths ═════════════════════════════ */
console.log('\n── C. layout (real Chromium, both themes, 360px and 900px) ────')

const TOUCH_SLOTS = [
  'task-screen-exit',
  'task-done-back',
  'portal-destination',
  'portal-back',
  'portal-message-bar',
]

async function layout() {
  if (NO_BROWSER) {
    skipped('the container query, the touch floor and the overflow rules', '--no-browser was passed')
    return
  }
  let chromium
  try {
    ;({ chromium } = require('playwright'))
  } catch {
    skipped('the container query, the touch floor and the overflow rules', 'playwright is not installed')
    return
  }
  if (!existsSync(CSS_CACHE)) {
    skipped('the container query, the touch floor and the overflow rules', 'run `node .design-sync/scripts/build-css.mjs` from the package root first')
    return
  }

  const css = readFileSync(CSS_CACHE, 'utf8')
  const cases = [
    ['portal-list', portal('list'), '100%'],
    ['portal-pane', portal('pane'), '100%'],
    ['portal-overlay', portal('pane', { overlay: true }), '100%'],
    ['portal-long', portal('list', { longLabel: true }), '100%'],
    /* The container-query claim itself: a shell in a 360px box on a 900px page must render as a
     * phone. A media query cannot tell the difference; this is the whole reason the spec insists
     * on `container-type`. */
    ['portal-boxed', portal('list'), '360px'],
    ['task', taskEl, '100%'],
    ['done', doneEl, '100%'],
    ['step', stepEl, '100%'],
  ]
  const body = cases
    .map(([id, el, w]) => `<section data-case="${id}" style="width:${w};height:600px">${render(el)}</section>`)
    .join('\n')

  const browser = await chromium.launch()
  try {
    for (const theme of ['light', 'dark']) {
      for (const width of [360, 900]) {
        const page = await browser.newPage({ viewport: { width, height: 900 } })
        await page.setContent(
          `<!doctype html><html class="${theme === 'dark' ? 'dark' : ''}"><head><meta name="viewport" content="width=device-width"><style>${css}</style>` +
            `<style>html,body{margin:0;padding:0}</style></head><body class="bg-bg">${body}</body></html>`,
          { waitUntil: 'load' },
        )

        const m = await page.evaluate((touchSlots) => {
          const vw = document.documentElement.clientWidth
          const shown = (caseId, slot) => {
            const el = document.querySelector(`[data-case="${caseId}"] [data-slot="${slot}"]`)
            if (el === null) return null
            const r = el.getBoundingClientRect()
            return r.width > 0 && r.height > 0
          }
          const box = (caseId, slot) => {
            const el = document.querySelector(`[data-case="${caseId}"] [data-slot="${slot}"]`)
            return el === null ? null : el.getBoundingClientRect()
          }
          const overhang = []
          const clipped = []
          for (const el of document.querySelectorAll('section *')) {
            if (el.closest('.sr-only') !== null) continue
            const r = el.getBoundingClientRect()
            if (r.width === 0) continue
            if (r.right > vw + 0.5 || r.left < -0.5) {
              overhang.push(`${el.dataset.slot ?? el.tagName.toLowerCase()} [${el.closest('section').dataset.case}] right=${r.right.toFixed(1)} vw=${vw}`)
            }
            /* An ellipsis is not clipping, and the distinction is the house rule's own: clipped
               text is text cut off with nothing to say it was, which is a bug. Text that ends in
               an ellipsis announces its own truncation and, here, is one tap from being read in
               full — `member-portal.css` sets exactly this on the message bar's last turn. So the
               carve-out is by computed `text-overflow`, not by class name or slot: anything that
               overflows WITHOUT declaring an ellipsis is still a failure. */
            if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).textOverflow !== 'ellipsis') {
              clipped.push(`${el.dataset.slot ?? el.tagName.toLowerCase()} [${el.closest('section').dataset.case}] ${el.scrollWidth}>${el.clientWidth}`)
            }
          }
          const small = []
          for (const slot of touchSlots) {
            for (const el of document.querySelectorAll(`[data-slot="${slot}"]`)) {
              const r = el.getBoundingClientRect()
              if (r.height > 0 && r.height < 43.5) small.push(`${slot} ${r.height.toFixed(1)}px`)
            }
          }
          const mark = document.querySelector('[data-slot="task-done-mark"]')
          const rgb = (el, prop) => getComputedStyle(el)[prop]
          return {
            vw,
            docScrollWidth: document.documentElement.scrollWidth,
            bodyScrollWidth: document.body.scrollWidth,
            overhang,
            clipped,
            small,
            listNav: shown('portal-list', 'portal-nav'),
            listPane: shown('portal-list', 'portal-pane'),
            listConvo: shown('portal-list', 'portal-conversation'),
            paneNav: shown('portal-pane', 'portal-nav'),
            panePane: shown('portal-pane', 'portal-pane'),
            paneConvo: shown('portal-pane', 'portal-conversation'),
            overlayConvo: shown('portal-overlay', 'portal-conversation'),
            overlayPosition: (() => {
              const el = document.querySelector('[data-case="portal-overlay"] [data-slot="portal-conversation"]')
              return el === null ? null : getComputedStyle(el).position
            })(),
            msgbar: shown('portal-list', 'portal-message-bar'),
            back: shown('portal-pane', 'portal-back'),
            boxedNav: shown('portal-boxed', 'portal-nav'),
            boxedPane: shown('portal-boxed', 'portal-pane'),
            boxedMsgbar: shown('portal-boxed', 'portal-message-bar'),
            navWidth: (box('portal-list', 'portal-nav') ?? { width: 0 }).width,
            convoWidth: (box('portal-list', 'portal-conversation') ?? { width: 0 }).width,
            paneWidth: (box('portal-list', 'portal-pane') ?? { width: 0 }).width,
            markFill: mark === null ? null : rgb(mark, 'backgroundColor'),
            markInk: mark === null ? null : rgb(mark, 'color'),
            pageFill: rgb(document.body, 'backgroundColor'),
          }
        }, TOUCH_SLOTS)

        const t = `[${theme} ${width}px]`

        check(`${t} the page body never scrolls sideways`, m.docScrollWidth <= m.vw && m.bodyScrollWidth <= m.vw, `doc=${m.docScrollWidth} body=${m.bodyScrollWidth} vw=${m.vw}`)
        check(`${t} nothing is pushed outside the viewport`, m.overhang.length === 0, m.overhang.join(' | '))
        check(`${t} nothing outgrows its own track`, m.clipped.length === 0, m.clipped.join(' | '))
        check(`${t} every tap target clears the 44px floor`, m.small.length === 0, m.small.join(' | '))

        if (width < 720) {
          check(`${t} phone: the list view shows the destinations and hides the pane`, m.listNav === true && m.listPane === false, `nav=${m.listNav} pane=${m.listPane}`)
          check(`${t} phone: the pane view shows the pane and hides the destinations`, m.paneNav === false && m.panePane === true, `nav=${m.paneNav} pane=${m.panePane}`)
          check(`${t} phone: the conversation is absent until it is opened`, m.listConvo === false && m.paneConvo === false, `list=${m.listConvo} pane=${m.paneConvo}`)
          check(`${t} phone: opening it covers the shell`, m.overlayConvo === true && m.overlayPosition === 'absolute', `shown=${m.overlayConvo} position=${m.overlayPosition}`)
          check(`${t} phone: the message bar and the back control are the routes between views`, m.msgbar === true && m.back === true, `msgbar=${m.msgbar} back=${m.back}`)
        } else {
          check(`${t} desktop: all three panes are on screen at once`, m.listNav === true && m.listConvo === true && m.listPane === true, `nav=${m.listNav} convo=${m.listConvo} pane=${m.listPane}`)
          /* The one the spec's own bug lived in: the phone view state must not survive the
           * breakpoint. Nothing at 360px moves when this regresses. */
          check(`${t} desktop: the phone view state no longer hides anything`, m.paneNav === true && m.panePane === true && m.paneConvo === true, `nav=${m.paneNav} pane=${m.panePane} convo=${m.paneConvo}`)
          check(`${t} desktop: the phone-only routes are gone`, m.msgbar === false && m.back === false, `msgbar=${m.msgbar} back=${m.back}`)
          check(`${t} desktop: the sidebar is 15rem, fixed`, Math.abs(m.navWidth - 240) < 1, `${m.navWidth}px`)
          /* "an equal partner to the conversation rather than a rail hanging off it" — the spec's
           * own correction of its first build. 2px of tolerance for the hairline borders. */
          check(`${t} desktop: the conversation and the panel are equal halves of what is left`, Math.abs(m.convoWidth - m.paneWidth) <= 2, `convo=${m.convoWidth} pane=${m.paneWidth}`)
        }

        /* The container-query claim, checked at 900px where a media query would get it wrong. */
        check(`${t} the breakpoint is measured against the shell, not the window`, m.boxedNav === true && m.boxedPane === false && m.boxedMsgbar === true, `nav=${m.boxedNav} pane=${m.boxedPane} msgbar=${m.boxedMsgbar}`)

        /* A graphical object needs 3:1 to be perceivable — WCAG 1.4.11. The tick is the only
         * non-text carrier of meaning in this whole set. */
        check(`${t} the success tick is perceivable against its own disc`, contrast(m.markInk, m.markFill) >= 3, `${contrast(m.markInk, m.markFill).toFixed(2)}:1 — ${m.markInk} on ${m.markFill}`)
        check(`${t} and the disc is delimited against the page`, dL(m.markFill, m.pageFill) >= 3, `ΔL* ${dL(m.markFill, m.pageFill).toFixed(2)} — ${m.markFill} on ${m.pageFill}`)

        await page.close()
      }
    }
  } finally {
    await browser.close()
  }
}

function channels(rgb) {
  return rgb.match(/[\d.]+/g).slice(0, 3).map(Number)
}

function luminance(rgb) {
  const lin = (c) => {
    const v = c / 255
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  const [r, g, b] = channels(rgb)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

function lstar(rgb) {
  const y = luminance(rgb)
  return y > 0.008856 ? 116 * y ** (1 / 3) - 16 : 903.3 * y
}

const dL = (a, b) => Math.abs(lstar(a) - lstar(b))

await layout()

console.log(`\n${pass} passed, ${fail} failed, ${skip} skipped`)
process.exit(fail > 0 || skip > 0 ? 1 : 0)
