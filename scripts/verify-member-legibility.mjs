#!/usr/bin/env node
/**
 * Every member surface resolves its own text colour, and clears the text floor in dark — JH221.
 *
 *     node scripts/verify-member-legibility.mjs
 *
 * ── 🔴 THIS SCRIPT IS RED ON `origin/main`, DELIBERATELY ─────────────────────────────────────
 * Six package components inherit their resting text colour and the package declares no base
 * `body { color }`, so they render **black** — 20.12:1 in light, **1.05:1** in dark. That is
 * **[JH230](https://trello.com/c/QCQBL2Nj)** (raised 2026-09-02 by this card; the register in part
 * A is the list), not a regression you caused. This script is the finding's permanent record, and
 * it goes green on its own — with no edit to the check — as each fix lands and its `NOTE` line
 * tells you to drop it from `KNOWN`. **Do not "fix" it by relaxing the check.**
 *
 * It is not in `.github/workflows/verify.yml`, along with every other browser-driven check here —
 * the package has no lockfile, so CI runs only the five dependency-free scripts. Two more
 * (`verify-member-plane.mjs`, `verify-touch-target.mjs`) are already red on `main` for an
 * unrelated reason (JH229). A red script here does not block anyone.
 *
 * ── What it checks, and why neither existing harness could ───────────────────────────────────
 * `verify-contrast.py` computes 152 token pairs and all of them pass. That is the whole reason
 * this defect survived: **it checks pairs of tokens, and these components name no token.** A
 * component with no `text-*` class at all has no pair to check, so it is invisible to a pair
 * checker no matter how thorough the pair checker is. `verify-member-states.mjs` and
 * `verify-member-chrome.mjs` measure geometry and a handful of named token pairs, and neither
 * reads the computed colour of arbitrary text.
 *
 * The gap is structural, so the check has to be too:
 *
 *   A. **Inheritance** — render every member surface with a SENTINEL colour on `<body>`, then find
 *      every element that owns visible text whose computed colour came back as the sentinel. Those
 *      are the elements the package declares nothing for. This is exact rather than heuristic:
 *      testing for `rgb(0, 0, 0)` instead would confuse "undeclared" with "deliberately black",
 *      and a design is allowed to choose black.
 *   B. **Contrast** — render again with a CORRECT consumer base (`text-foreground`, what shadcn's
 *      own `globals.css` ships and this package omits) and measure every text element against its
 *      effective background at the 4.5:1 text floor, in both themes. Part A's elements would
 *      dominate the output otherwise; separating them means part B answers a different question —
 *      *once inheritance is fixed, is anything still unreadable?*
 *
 * ── Consumer children are excluded, and that is the load-bearing detail ──────────────────────
 * A consumer's own `<p>` inheriting a colour is correct behaviour, not a defect — the package
 * cannot colour markup it never sees. So every child passed into a surface below is wrapped in
 * `consumer()`, which sets an explicit colour. Anything that still comes back as the sentinel is
 * therefore constructed by the package itself. Without this the probe reports 10 elements and half
 * of them are the probe's own markup, which is how the first pass of this check read.
 *
 * ── The mutations that decide this file ──────────────────────────────────────────────────────
 * A guard that has never failed is not evidence. Applied, run and reverted on 2026-09-02:
 *
 *   - **`text-foreground` added to `Button`'s `outline` and `ghost` variants** (i.e. the fix)
 *       -> the two `Button` rows leave part A's failing set and the register's `expected` count
 *          drops by 2, which is the check confirming it tracks the real thing rather than a
 *          hard-coded list. This is the mutation that proves the script goes green on the fix.
 *   - **`text-ink` dropped from `MemberEmpty`'s title** (a currently-CLEAN component)
 *       -> 1 new part-A failure, reported as NEW and unfiled rather than folded into the register.
 *          This is the case that matters: the register must not swallow a fresh defect.
 *   - **`--accent-ink` swapped for `--accent-fill` on `PortalBack`** (F2's shape, moved onto a
 *      member surface)
 *       -> 1 part-B failure at 4.02:1 in dark and **nothing in light**, which is the theme
 *          asymmetry this card exists to catch. `verify-contrast.py` stays green throughout: it
 *          scores `--accent-fill` at its 3.0 GRAPHICAL floor, and this is text.
 *
 * ── Requirements ─────────────────────────────────────────────────────────────────────────────
 * `react`, `react-dom`, `esbuild` and `playwright`, plus a compiled stylesheet from
 * `node .design-sync/scripts/build-css.mjs` run at the package root. Borrow them as
 * `.design-sync/NOTES.md` records.
 */
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { transformSync } from 'esbuild'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const CSS_CACHE = join(ROOT, '.design-sync', '.cache', 'compiled-styles.css')

let pass = 0
let fail = 0

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
const { MemberEmpty, MemberError } = load('src/components/member/state.tsx')
const { ThreadSkeleton, ScreenSkeleton } = load('src/components/member/skeleton.tsx')
const { TaskScreen, TaskDone } = load('src/components/member/task-screen.tsx')
const { OnboardingScreen, OnboardingStep } = load('src/components/member/onboarding.tsx')
const P = load('src/components/member/portal.tsx')
const { Button } = load('src/components/ui/button.tsx')
const { Label } = load('src/components/ui/label.tsx')
const { Input } = load('src/components/ui/input.tsx')
const { Textarea } = load('src/components/ui/textarea.tsx')

const h = React.createElement

/* See the docstring: a consumer's own markup is not the package's to colour, so everything the
 * probe passes IN is coloured explicitly. What comes back uncoloured is the package's. */
const consumer = (...kids) => h('span', { className: 'text-ink', 'data-consumer': '' }, ...kids)

const SURFACES = {
  Thread: h(Thread, null,
    h(ThreadDay, null, 'Thursday 21 August'),
    h(MessageGroup, null, h(MessageSender, { name: 'Alex Chen, NP' }), h(MessageBubble, { voice: 'provider' }, 'Everything is where I want it.')),
    h(MessageBubble, { voice: 'coordinator' }, 'Booked for you.'),
    h(MessageBubble, { voice: 'system' }, 'jellyhealth sends a reminder.'),
    h(MessageBubble, { voice: 'member' }, 'Thank you.'),
    h(ThreadEvent, null, 'Refill shipped on 19 August.')),
  ThreadSkeleton: h(ThreadSkeleton),
  ScreenSkeleton: h(ScreenSkeleton),
  MemberEmpty: h(MemberEmpty, { title: 'No messages yet' }, 'Alex will write when your results are back.'),
  MemberError: h(MemberError, { title: 'We could not load your conversation', onRetry: () => {} }, 'This is a problem on our side.'),
  MemberField: h(MemberField, { label: 'Which pharmacy?', description: 'We will send it there.', error: 'Enter a pharmacy name.' },
    (f) => h(Input, { ...f, plane: 'member' })),
  MemberFieldOptional: h(MemberField, { label: 'Anything else?', optional: true }, (f) => h(Textarea, { ...f, plane: 'member' })),
  PendingValue: consumer('Your dose is ', h(PendingValue), ' mg.'),
  TaskScreen: h(TaskScreen, {
    onExit: () => {}, title: 'Book your blood draw', lede: 'Pick a time near you.',
    action: h(Button, { plane: 'member' }, 'Confirm booking'), actionNote: 'Nothing is charged yet.',
  }, consumer('Thu 21 Aug, 9:00am')),
  TaskDone: h(TaskDone, { onExit: () => {}, title: 'Booked', backHref: '/messages' }, 'We will remind you the day before.'),
  Onboarding: h(OnboardingScreen, null,
    h(OnboardingStep, { title: 'Who you are', action: h(Button, { plane: 'member' }, 'Continue') }, consumer('Full name, email, state.'))),
  Portal: h(P.PortalShell, { view: 'list' },
    h(P.PortalBody, null,
      h(P.PortalNav, null,
        h(P.PortalDestination, { href: '/care', current: true }, 'Your care'),
        h(P.PortalDestination, { href: '/labs' }, 'Labs & results'),
        h(P.PortalIdentity, null, 'Sarah M.')),
      h(P.PortalConversation, null,
        h(P.PortalConversationHeader, null, 'Alex'),
        h(Thread, null, h(MessageBubble, { voice: 'provider' }, 'Everything is where I want it.')),
        h(P.PortalConversationFooter, null, 'Message Alex')),
      h(P.PortalPane, null,
        h(P.PortalPaneBody, null, h(P.PortalBack, null), h(P.PortalPaneTitle, null, 'Your care'), consumer('Blood draw — Thu 21 Aug.')))),
    h(P.PortalMessageBar, { name: 'Message Alex', preview: 'Everything is where I want it.' })),
  PlaneControls: h('div', null,
    h(Button, { plane: 'member' }, 'Primary'),
    h(Button, { plane: 'member', variant: 'outline' }, 'Outline'),
    h(Button, { plane: 'member', variant: 'ghost' }, 'Ghost'),
    h(Button, { plane: 'member', variant: 'secondary' }, 'Secondary'),
    h(Label, { plane: 'member' }, 'A label on the member plane'),
    h(Input, { plane: 'member', defaultValue: 'typed text' }),
    h(Textarea, { plane: 'member', defaultValue: 'typed text' })),
}

/* ═══ The known register ═══════════════════════════════════════════════════════════════════════
 *
 * The five elements that inherit today, each keyed `Surface :: slot-or-tag`. This is a register,
 * not a suppression: every one of them still FAILS and is still counted. What the register buys is
 * that a SIXTH is reported as NEW and unfiled, instead of disappearing into a wall of red — the
 * failure mode a bare list of 6 would have. Delete an entry when its fix lands; the script needs
 * no other edit to go green.
 *
 * Raised 2026-09-02 by JH221, owned by JH230 (https://trello.com/c/QCQBL2Nj). `<button>` is the
 * one that matters most: `MemberError`'s
 * own docstring calls the retry control *"the one difference a member reads without reading"*, and
 * it is the control the whole error-vs-empty distinction rests on.
 */
const KNOWN = new Map([
  ['button', 'Button variant="outline" and variant="ghost" set a colour only on :hover, never at rest. This is the one that matters most: MemberError constructs an outline Button as its retry control, and that component\'s own docstring calls it "the one difference a member reads without reading".'],
  ['label', 'Label declares no resting text colour — every form label on the member plane'],
  ['input', 'Input declares no colour for the text a member types. Invisible to a text-node walk — see part A.'],
  ['textarea', 'Textarea, the same'],
  ['portal-conversation-header', 'PortalConversationHeader declares no text colour'],
  ['portal-conversation-footer', 'PortalConversationFooter declares no text colour'],
])

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
const body = Object.entries(SURFACES)
  .map(([n, el]) => `<section data-s="${n}" style="width:360px">${renderToStaticMarkup(el)}</section>`)
  .join('\n')

const SENTINEL = 'rgb(1, 2, 3)'
const page = (theme, bodyColour) =>
  `<!doctype html><html class="${theme === 'dark' ? 'dark' : ''}"><head><style>${css}</style>` +
  `<style>html,body{margin:0}${bodyColour}</style></head><body class="bg-bg">${body}</body></html>`

const browser = await chromium.launch()
let inherited = []
let lowContrast = []
try {
  /* ── A ── */
  const pA = await browser.newPage({ viewport: { width: 420, height: 1200 } })
  await pA.setContent(page('dark', 'body{color:rgb(1,2,3)}'), { waitUntil: 'load' })
  inherited = await pA.evaluate((SENT) => {
    const out = []
    for (const sec of document.querySelectorAll('section[data-s]')) {
      for (const el of sec.querySelectorAll('*')) {
        if (el.closest('.sr-only') !== null || el.closest('[data-consumer]') !== null) continue
        /* An `<input>`'s value is NOT a DOM text node, so a childNodes walk cannot see it and the
         * control's colour would go unchecked — `Input` inherits exactly like `Textarea` does and
         * was missed by the first version of this file for precisely that reason. Form controls
         * are therefore included by tag, not by whether they own a text node. */
        const isControl = ['input', 'textarea', 'select'].includes(el.tagName.toLowerCase())
        const ownsText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim() !== '')
        if (!ownsText && !isControl) continue
        if (getComputedStyle(el).color === SENT) {
          out.push({
            key: el.dataset.slot ?? el.tagName.toLowerCase(),
            surface: sec.dataset.s,
            text: el.textContent.trim().slice(0, 40),
          })
        }
      }
    }
    return out
  }, SENTINEL)
  await pA.close()

  /* ── B ── */
  for (const theme of ['light', 'dark']) {
    const pB = await browser.newPage({ viewport: { width: 420, height: 1200 } })
    await pB.setContent(page(theme, 'body{color:var(--foreground)}'), { waitUntil: 'load' })
    const found = await pB.evaluate(() => {
      const lum = (rgb) => {
        const [r, g, b] = rgb.match(/[\d.]+/g).slice(0, 3).map(Number)
        const f = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
      }
      /* The nearest ancestor with a non-transparent background is what the text actually lands on.
       * Reading the element's own `backgroundColor` alone reports `rgba(0,0,0,0)` for almost
       * everything and would score every text node against a colour it never touches. */
      const effBg = (el) => {
        for (let n = el; n !== null; n = n.parentElement) {
          const bg = getComputedStyle(n).backgroundColor
          if (bg && !/rgba\(0, 0, 0, 0\)|transparent/.test(bg)) return bg
        }
        return getComputedStyle(document.body).backgroundColor
      }
      const out = []
      for (const sec of document.querySelectorAll('section[data-s]')) {
        for (const el of sec.querySelectorAll('*')) {
          if (el.closest('.sr-only') !== null || el.closest('[data-consumer]') !== null) continue
          const isControl = ['input', 'textarea', 'select'].includes(el.tagName.toLowerCase())
          const ownsText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim() !== '')
          if (!ownsText && !isControl) continue
          const cs = getComputedStyle(el)
          const bg = effBg(el)
          let ratio
          try {
            const l1 = lum(cs.color); const l2 = lum(bg)
            ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
          } catch { continue }
          if (ratio < 4.5) {
            out.push({
              key: `${sec.dataset.s} :: ${el.dataset.slot ?? el.tagName.toLowerCase()}`,
              text: el.textContent.trim().slice(0, 32),
              ratio: Number(ratio.toFixed(2)),
              color: cs.color, bg,
            })
          }
        }
      }
      return out
    })
    lowContrast.push(...found.map((f) => ({ ...f, theme })))
    await pB.close()
  }
} finally {
  await browser.close()
}

/* ═══ Report ═══════════════════════════════════════════════════════════════════════════════════ */
console.log('\n── A. every member surface declares its own text colour ────────')

const seen = new Set(inherited.map((i) => i.key))
const newly = [...seen].filter((k) => !KNOWN.has(k))
const stillKnown = [...KNOWN.keys()].filter((k) => seen.has(k))
const fixed = [...KNOWN.keys()].filter((k) => !seen.has(k))

const surfacesOf = (k) => [...new Set(inherited.filter((i) => i.key === k).map((i) => i.surface))].join(', ')

for (const k of stillKnown) {
  fail += 1
  console.log(`FAIL  <${k}> inherits its text colour  — KNOWN, filed`)
  console.log(`      on: ${surfacesOf(k)}`)
  console.log(`      ${KNOWN.get(k)}`)
}
for (const k of newly) {
  fail += 1
  console.log(`FAIL  <${k}> inherits its text colour  — 🔴 NEW, NOT FILED`)
  console.log(`      on: ${surfacesOf(k)}`)
  console.log('      A component that names no text colour renders black in dark. Give it one,')
  console.log('      or add it to KNOWN with the card that owns the fix.')
}
for (const k of fixed) {
  console.log(`NOTE  <${k}> no longer inherits — remove it from KNOWN.`)
}
check(
  `no member surface inherits its text colour (${seen.size} kinds do; ${stillKnown.length} filed, ${newly.length} new)`,
  seen.size === 0,
  seen.size === 0 ? undefined : 'see the register in this file',
)

console.log('\n── B. text clears 4.5:1 once a consumer supplies the base ──────')
for (const c of lowContrast) {
  fail += 1
  console.log(`FAIL  [${c.theme}] ${c.key} at ${c.ratio}:1  "${c.text}"`)
  console.log(`      ${c.color} on ${c.bg} — the text floor is 4.5:1`)
}
check(`every text element on a member surface clears 4.5:1 in both themes (${lowContrast.length} do not)`, lowContrast.length === 0)

console.log(`\n${pass} passed, ${fail} failed`)
if (fail > 0 && newly.length === 0 && lowContrast.length === 0) {
  console.log('\n🔴 Red is EXPECTED here — every failure above is the filed JH221 finding.')
  console.log('   See this file\'s docstring. Do not relax the check; fix the components.')
}
process.exit(fail > 0 ? 1 : 0)
