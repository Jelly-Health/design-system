#!/usr/bin/env node
/**
 * Verify the member-plane state patterns — JH218.
 *
 *     node scripts/verify-member-states.mjs            # everything
 *     node scripts/verify-member-states.mjs --no-browser
 *
 * The card this file belongs to is decided by one rule — **a failed load must never read as
 * "nothing to do"** — and by one claim, that the four states are *mutually unmistakable and cannot
 * be collapsed by a consumer*. A claim like that is worth exactly as much as the thing that would
 * fail if it stopped being true, so this script is in four parts and each one checks a different
 * kind of truth:
 *
 *   A. **Structure** (`renderToStaticMarkup`) — what actually reaches the DOM. The empty block has
 *      no control and does not announce; the failure block has both; no two of the four states
 *      render the same markup.
 *   B. **Types** (`tsc` over `scripts/fixtures/member-state-types.tsx`) — the half a rendering test
 *      cannot see. Every `@ts-expect-error` there asserts that a wrong state does not COMPILE, so
 *      weakening a guarantee shows up as TS2578 rather than as a test that still passes.
 *   C. **Layout** (real Chromium, both themes, 360px) — the overflow rules, which are not
 *      decidable from markup: nothing clipped, nothing off-screen, the page body never scrolling
 *      sideways, the thread scrolling inside its own box, and the skeleton fill clearing 3 ΔL*
 *      against every member surface in BOTH themes.
 *   D. **The star-export precondition** — 126 names, 0 collisions (109 until JH219's three shells). An ambiguous star export is
 *      dropped with no error, and the count in `member/index.ts` had gone two cards stale before
 *      anyone recounted; a number in a comment is not a check.
 *
 * ── The mutation that decides the card ───────────────────────────────────────────────────────
 * A guard that has never failed is not evidence. All seven below were applied, run, and reverted
 * on 2026-09-02; every one failed, and the tree was re-run green after each. Named by the case
 * that caught it, because the list will grow.
 *
 * ⚠️ Two of them survived the first pass and the reason is worth more than the mutations are: a
 * mutation harness that treats a CRASH as "nothing failed" reports a clean sweep, and an "absurd"
 * name with spaces in it is not absurd — it wraps by itself. Both are fixed here; neither was
 * visible from the passing output.:
 *
 *   - 🔴 **`MemberError` renders `MemberEmpty`'s markup** — the card's own mutation, applied
 *     literally: the failure block's container swapped for the empty block's (same slot, no
 *     `role="alert"`, no surface, no edge) and the retry button deleted.
 *       -> **8 structural cases fail.** It loses its announcement, its retry control, the 44px
 *          floor, the member plane on that control, its wrapping label, its delimited box, its own
 *          `data-slot`, and `MemberStateView`'s error branch starts rendering `member-empty`.
 *          The type cases still pass — which is the point of having both parts: the compiler
 *          cannot see a component that renders the wrong thing, and a renderer cannot see a state
 *          that should never have compiled.
 *   - **`onRetry` made optional on `MemberError`**
 *       -> 1 case: the fixture's "a failure the member cannot act on" directive goes unused,
 *          TS2578. Nothing in part A notices, because a consumer who passes one still gets a
 *          button — the whole defect is in what a consumer is ALLOWED to leave out.
 *   - **`items: readonly T[]` instead of `readonly [T, ...T[]]`**
 *       -> 1 case, covering both `ready`-cannot-be-empty directives at once. This mutation is
 *          exactly "port the console's `PanelState` after all", and it is worth noticing that
 *          nothing else in the script moves: the rendered output of a ready-with-nothing state is
 *          an empty screen, which is indistinguishable from every other empty screen. Only the
 *          type can catch it, which is the argument for the type.
 *   - **`break-words` dropped from `MessageSender`'s name** (and from the bubble base)
 *       -> 4 part-C cases fail, 2 per theme: the name and the bubble each outgrow their own track.
 *          Invisible to A and B. Two things had to be got right before this mutation was caught at
 *          all, and both are recorded because both looked fine: the harness's long name has to be
 *          UNBREAKABLE (one with spaces in it wraps on its own and the mutation passes), and the
 *          assertion has to be `scrollWidth > clientWidth` on every element rather than only on
 *          ones whose `overflow-x` is `hidden` — `Thread` scrolls, so a bubble that cannot wrap is
 *          absorbed by the thread's own scrollbar and never reaches the viewport edge.
 *   - **`max-w-full` dropped from `MessageSender`'s row, keeping `break-words`**
 *       -> 4 cases, 2 per theme, and one of them is the document scrolling sideways — a strictly
 *          worse outcome than the previous mutation. Worth recording rather than rounding off:
 *          `self-start` sizes the row to its content, so the name has no width to wrap INSIDE
 *          until the row is capped. The two classes are one fix and either alone leaves the bug.
 *   - **`--line` swapped back to `--mut` as the skeleton fill**
 *       -> **exactly 1 case, and it is the light one.** Dark passes (ΔL* 10.04); light fails
 *          (2.77 against `--sur`, under the 3 ΔL* threshold). That asymmetry is the precise
 *          "reads as distinct in one theme and identical in the other" failure the card names, and
 *          a single-theme run would have shipped it.
 *   - **`plane="member"` dropped from the retry button**
 *       -> 4 cases: the class is missing in the markup, and the rendered control measures 36px
 *          against the 44px floor in both themes. `tsc` is clean throughout — `plane` is optional,
 *          which is how the same bug shipped once already (see `verify-member-plane.mjs`).
 *
 * ── Requirements ─────────────────────────────────────────────────────────────────────────────
 * `react`, `react-dom`, `esbuild`, `typescript`, `playwright` and `@tailwindcss/postcss`, none of
 * which this package installs — it still has no lockfile. Borrow them the way `.design-sync/NOTES.md`
 * records (symlink a sibling repo's install into `node_modules/`) and keep Tailwind on the major
 * the rest of the tree compiles with. **Any SKIP exits non-zero**, including the deliberate
 * `--no-browser` one: a zero exit has to mean every part ran, or a missing dependency reads as a
 * pass.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, relative, resolve } from 'node:path'
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

/* ═══ Loading the components ═══════════════════════════════════════════════════════════════════
 *
 * Unlike `verify-member-plane.mjs`, this loader follows RELATIVE imports rather than stubbing
 * `cn`, and that is load-bearing rather than tidier: the retry button's overflow fix is
 * `whitespace-normal` and `h-auto` overriding `Button`'s base `whitespace-nowrap` and `h-9`, which
 * only holds if the REAL tailwind-merge resolves them. Stub `cn` and part C would measure a button
 * that the browser never renders. */
const cache = new Map()

function loadFile(absPath) {
  if (cache.has(absPath)) return cache.get(absPath).exports
  const src = readFileSync(absPath, 'utf8')
  const js = transformSync(src, { loader: absPath.endsWith('.tsx') ? 'tsx' : 'ts', format: 'cjs', jsx: 'automatic' }).code
  const mod = { exports: {} }
  cache.set(absPath, mod)
  const req = (id) => {
    if (id === 'react') return React
    if (!id.startsWith('.')) return require(id)
    const base = resolve(dirname(absPath), id)
    for (const candidate of [base, `${base}.tsx`, `${base}.ts`, join(base, 'index.tsx'), join(base, 'index.ts')]) {
      if (existsSync(candidate) && !candidate.endsWith('/')) return loadFile(candidate)
    }
    throw new Error(`cannot resolve ${id} from ${absPath}`)
  }
  new Function('module', 'exports', 'require', js)(mod, mod.exports, req)
  return mod.exports
}

const load = (rel) => loadFile(join(ROOT, rel))

const { MemberEmpty, MemberError, MemberStateView, memberStateFrom } = load('src/components/member/state.tsx')
const { ThreadSkeleton, ScreenSkeleton } = load('src/components/member/skeleton.tsx')
const { Thread } = load('src/components/member/thread.tsx')
const { MessageBubble, MessageSender, MessageGroup } = load('src/components/member/message-bubble.tsx')
const { MemberField } = load('src/components/member/field.tsx')

const h = React.createElement
const render = (el) => renderToStaticMarkup(el)

const EMPTY_COPY = { title: 'No messages yet', body: 'Alex writes here when there is something to say.' }
const ERROR_COPY = {
  title: 'We couldn’t load your messages',
  body: 'This is not an empty conversation. Nothing was missed on your side.',
  onRetry: () => {},
}

const emptyHtml = render(h(MemberEmpty, { title: EMPTY_COPY.title }, EMPTY_COPY.body))
const errorHtml = render(h(MemberError, { title: ERROR_COPY.title, onRetry: ERROR_COPY.onRetry }, ERROR_COPY.body))
const threadSkeletonHtml = render(h(ThreadSkeleton))
const screenSkeletonHtml = render(h(ScreenSkeleton))

const view = (state) =>
  render(
    h(
      MemberStateView,
      {
        state,
        skeleton: 'thread',
        empty: { title: EMPTY_COPY.title, body: EMPTY_COPY.body },
        error: ERROR_COPY,
      },
      (items) => items.map((r) => h('p', { key: r.id }, r.id)),
    ),
  )

/* ═══ A. Structure ═════════════════════════════════════════════════════════════════════════════ */
console.log('\n── A. structure ───────────────────────────────────────────────')

const TOUCH = 'min-h-[var(--touch-min)]'

check('empty and failed do not render the same markup', emptyHtml !== errorHtml)
check('empty carries no retry control', !emptyHtml.includes('data-slot="button"'), emptyHtml)
check('empty does not announce itself', !emptyHtml.includes('role="alert"'), emptyHtml)
check('empty has no box: no surface fill and no border', !/bg-card|border-line-strong/.test(emptyHtml), emptyHtml)
check('failed announces itself', errorHtml.includes('role="alert"'), errorHtml)
check('failed carries a retry control', errorHtml.includes('data-slot="button"'), errorHtml)
check('failed’s retry clears the 44px touch floor', errorHtml.includes(TOUCH), errorHtml)
check('failed’s retry is on the member plane', errorHtml.includes('data-plane="member"'), errorHtml)
check(
  'failed’s retry can wrap rather than clip a long label',
  /whitespace-normal/.test(errorHtml) && !/whitespace-nowrap/.test(errorHtml),
  errorHtml,
)
check('failed sits in a delimited box', /bg-card/.test(errorHtml) && /border-line-strong/.test(errorHtml), errorHtml)
check('failed is not drawn in the danger role', !/text-danger|bg-danger/.test(errorHtml), errorHtml)
check(
  'the two blocks are distinguishable by slot, not only by words',
  emptyHtml.includes('data-slot="member-empty"') && errorHtml.includes('data-slot="member-error"'),
)

const states = {
  loading: view({ status: 'loading' }),
  empty: view({ status: 'empty' }),
  error: view({ status: 'error' }),
  ready: view({ status: 'ready', items: [{ id: 'one' }] }),
}
const names = Object.keys(states)
const allDistinct = names.every((a) => names.every((b) => a === b || states[a] !== states[b]))
check('all four states render pairwise-distinct markup', allDistinct)

check('view: loading renders a skeleton and neither block', /data-slot="thread-skeleton"/.test(states.loading) && !/member-empty|member-error/.test(states.loading), states.loading.slice(0, 200))
check('view: empty renders the empty block and never the failure block', states.empty.includes('member-empty') && !states.empty.includes('member-error'))
check('view: failed renders the failure block and never the empty block', states.error.includes('member-error') && !states.error.includes('member-empty'))
check('view: ready renders the items and none of the three', states.ready.includes('one') && !/member-empty|member-error|skeleton/.test(states.ready))

check('memberStateFrom([]) is empty, never ready-with-nothing', memberStateFrom([]).status === 'empty')
check('memberStateFrom([x]) is ready and keeps the items', (() => {
  const s = memberStateFrom([{ id: 'a' }])
  return s.status === 'ready' && s.items.length === 1
})())

check('skeletons announce that something is loading', /role="status"/.test(threadSkeletonHtml) && /aria-busy="true"/.test(threadSkeletonHtml) && /sr-only/.test(threadSkeletonHtml), threadSkeletonHtml.slice(0, 200))
check('thread skeleton reuses the real Thread container', threadSkeletonHtml.includes('gap-[var(--gap-member-thread)]') && threadSkeletonHtml.includes('p-[var(--pad-member-screen)]'), threadSkeletonHtml.slice(0, 300))
check('screen skeleton is member density, never console density', /pad-member-screen/.test(screenSkeletonHtml) && !/console/.test(screenSkeletonHtml), screenSkeletonHtml.slice(0, 300))
check('no skeleton reaches for a console token', !/console/.test(threadSkeletonHtml) && !/console/.test(screenSkeletonHtml))
check('the screen skeleton reserves the 44px control, not a 36px one', screenSkeletonHtml.includes('var(--touch-min)'), screenSkeletonHtml.slice(0, 400))

/* ═══ B. Types ═════════════════════════════════════════════════════════════════════════════════ */
console.log('\n── B. types ───────────────────────────────────────────────────')

const FIXTURE = join('scripts', 'fixtures', 'member-state-types.tsx')
let tscBin
try {
  tscBin = require.resolve('typescript/bin/tsc')
} catch {
  tscBin = null
}

if (tscBin === null) {
  skipped('the wrong state does not compile', 'typescript is not installed')
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
  /* Attribute by file: `tsc` follows the import graph into `ui/`, which carries two pre-existing
   * ref-variance errors that are nothing to do with this fixture. */
  const mine = out
    .split('\n')
    .filter((l) => l.startsWith('scripts/fixtures/') && /error TS/.test(l))
  check('the wrong state does not compile: every @ts-expect-error is used', mine.length === 0, mine.join('\n') || out.slice(0, 400))
  const directives = readFileSync(join(ROOT, FIXTURE), 'utf8').match(/^\/\/ @ts-expect-error/gm) ?? []
  check('the fixture still asserts every guarantee (8 of them)', directives.length === 8, `found ${directives.length}`)
}

/* ═══ D. The star-export precondition ══════════════════════════════════════════════════════════ */
console.log('\n── D. star exports ────────────────────────────────────────────')

let ts = null
try {
  ts = require('typescript')
} catch {
  ts = null
}

if (ts === null) {
  skipped('star exports stay unambiguous', 'typescript is not installed')
} else {
  const files = []
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name)
      if (e.isDirectory()) walk(p)
      else if (/\.tsx?$/.test(e.name) && !/^index\.tsx?$/.test(e.name)) files.push(p)
    }
  }
  walk(join(ROOT, 'src/components'))
  files.sort()

  const owners = new Map()
  for (const f of files) {
    const sf = ts.createSourceFile(f, readFileSync(f, 'utf8'), ts.ScriptTarget.Latest, true, f.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
    const names = new Set()
    sf.forEachChild((n) => {
      if (ts.isExportDeclaration(n) && n.exportClause && ts.isNamedExports(n.exportClause)) {
        for (const el of n.exportClause.elements) names.add(el.name.text)
      }
      const mods = ts.canHaveModifiers(n) ? (ts.getModifiers(n) ?? []) : []
      if (mods.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
        if (ts.isVariableStatement(n)) for (const d of n.declarationList.declarations) names.add(d.name.getText(sf))
        else if (n.name) names.add(n.name.getText(sf))
      }
    })
    for (const nm of names) {
      if (!owners.has(nm)) owners.set(nm, [])
      owners.get(nm).push(relative(ROOT, f))
    }
  }
  const collisions = [...owners].filter(([, fs]) => fs.length > 1)
  check(`star exports stay unambiguous (${owners.size} names across ${files.length} files)`, collisions.length === 0, collisions.map(([n, f]) => `${n}: ${f.join(', ')}`).join('; '))
  /* 109 at JH218; 115 at JH222, which gave the last five primitives a `plane` axis and so added
   * six cva functions to the star-exported surface; 132 at JH219, which added the three member
   * screen shells; 135 at JH227, which added `dialogCloseGuard` and its two types. Bumping this is
   * the intended workflow, not a nuisance: the number exists so that gaining an export is a
   * decision someone signs, and this check is what turns "re-measure it" from a thing to remember
   * into a thing that fails. It has now caught four cards in one day, twice across a merge neither
   * session was watching for, and once in a directory (`ui/`) that this file is not named after —
   * which is correct, since the walk covers all of `src/components/`. */
  check('the count in member/index.ts is still the measured one', owners.size === 135, `measured ${owners.size}, comment says 135 — update both, or find what was added`)
}

/* ═══ C. Layout, in a real browser, in both themes ═════════════════════════════════════════════ */
console.log('\n── C. layout (real Chromium, 360px, both themes) ──────────────')

const CSS_CACHE = join(ROOT, '.design-sync', '.cache', 'compiled-styles.css')

async function layout() {
  if (NO_BROWSER) {
    skipped('overflow and both-theme separation', '--no-browser was passed')
    return
  }
  let chromium
  try {
    ;({ chromium } = require('playwright'))
  } catch {
    skipped('overflow and both-theme separation', 'playwright is not installed')
    return
  }
  if (!existsSync(CSS_CACHE)) {
    skipped('overflow and both-theme separation', 'run `node .design-sync/scripts/build-css.mjs` from the package root first')
    return
  }

  /* Deliberately absurd content. The 200-character name is the card's own example; the unbroken
   * token is the case a max-width cannot fix; 500 turns is the "more items than fit" case. */
  /* 210 characters with no space, hyphen or other break opportunity in them. That detail is the
   * whole case: an earlier version of this harness used a long name WITH spaces in it, and it
   * passed with `break-words` removed — the text simply wrapped at its spaces. A name only reaches
   * this component unbroken, so only an unbroken one tests anything. */
  const LONG_NAME = 'Anneliesevongoethehausenmuller'.repeat(7)
  const LONG_TOKEN = 'x'.repeat(400)
  const LONG_LABEL = 'What is the name of the pharmacy you would like this sent to '.repeat(4)
  const LONG_TITLE = 'We could not load your conversation just now and we are not sure why yet'

  const harness = [
    ['thread-skeleton', h(ThreadSkeleton)],
    ['screen-skeleton', h(ScreenSkeleton)],
    ['empty', h(MemberEmpty, { title: EMPTY_COPY.title }, EMPTY_COPY.body)],
    ['error', h(MemberError, { title: LONG_TITLE, onRetry: () => {}, retryLabel: 'Try loading your conversation again' }, ERROR_COPY.body)],
    [
      'long-name',
      h(Thread, null, h(MessageGroup, null, h(MessageSender, { name: LONG_NAME }), h(MessageBubble, { voice: 'provider' }, 'Short message under a very long name.'))),
    ],
    ['long-token', h(Thread, null, h(MessageBubble, { voice: 'member' }, LONG_TOKEN))],
    ['long-label', h(MemberField, { label: LONG_LABEL, error: 'Enter a pharmacy name.' }, (field) => h('input', { ...field }))],
    [
      'long-thread',
      h(
        Thread,
        { style: { height: '320px' }, 'data-testid': 'long-thread' },
        Array.from({ length: 500 }, (_, i) => h(MessageBubble, { key: i, voice: i % 2 ? 'member' : 'provider' }, `Turn ${i + 1}`)),
      ),
    ],
  ]

  const body = harness
    .map(([id, el]) => `<section data-case="${id}" style="width:100%">${render(el)}</section>`)
    .join('\n')
  const css = readFileSync(CSS_CACHE, 'utf8')

  const browser = await chromium.launch()
  try {
    for (const theme of ['light', 'dark']) {
      const page = await browser.newPage({ viewport: { width: 360, height: 740 } })
      await page.setContent(
        `<!doctype html><html class="${theme === 'dark' ? 'dark' : ''}"><head><meta name="viewport" content="width=device-width"><style>${css}</style>` +
          `<style>html,body{margin:0;padding:0}</style></head><body class="bg-bg">${body}</body></html>`,
        { waitUntil: 'load' },
      )

      const m = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth
        const overhang = []
        const clipped = []
        for (const el of document.querySelectorAll('section *')) {
          // `sr-only` is a 1px clipped box BY DESIGN — that is the technique, not a defect.
          if (el.closest('.sr-only') !== null) continue
          const r = el.getBoundingClientRect()
          if (r.width > 0 && (r.right > vw + 0.5 || r.left < -0.5)) {
            overhang.push(`${el.dataset.slot ?? el.tagName.toLowerCase()} [${el.closest('section').dataset.case}] right=${r.right.toFixed(1)} vw=${vw}`)
          }
          if (el.scrollWidth > el.clientWidth + 1) {
            clipped.push(`${el.dataset.slot ?? el.tagName.toLowerCase()} [${el.closest('section').dataset.case}] ${el.scrollWidth}>${el.clientWidth}`)
          }
        }
        const thread = document.querySelector('[data-testid="long-thread"]')
        const button = document.querySelector('[data-slot="member-error"] [data-slot="button"]')
        /* Each skeleton bubble against the track it sits in, as a percentage. A bubble whose
         * declared width does not resolve collapses to its own padding and still passes every
         * other check in this file — see the block comment in `BubbleSkeleton`. */
        const skel = document.querySelector('[data-case="thread-skeleton"] [data-slot="thread-skeleton"]')
        const skelStyle = getComputedStyle(skel)
        const trackWidth =
          skel.clientWidth - parseFloat(skelStyle.paddingLeft) - parseFloat(skelStyle.paddingRight)
        const skeletonBubbles = [...skel.children]
          .filter((el) => el.dataset.slot === 'skeleton-block')
          .map((el) => ({
            declared: parseFloat(el.style.width),
            measured: +((el.getBoundingClientRect().width / trackWidth) * 100).toFixed(1),
            px: +el.getBoundingClientRect().width.toFixed(1),
          }))
        const rgb = (el) => getComputedStyle(el).backgroundColor
        return {
          docScrollWidth: document.documentElement.scrollWidth,
          bodyScrollWidth: document.body.scrollWidth,
          vw,
          overhang,
          clipped,
          skeletonBubbles,
          threadScrolls: thread.scrollHeight > thread.clientHeight,
          threadNoSideScroll: thread.scrollWidth <= thread.clientWidth + 1,
          buttonHeight: button.getBoundingClientRect().height,
          fills: {
            threadSurface: rgb(document.querySelector('[data-case="thread-skeleton"] [data-slot="thread-skeleton"]')),
            threadBlock: rgb(document.querySelector('[data-case="thread-skeleton"] [data-slot="skeleton-block"]')),
            page: rgb(document.body),
            screenBlock: rgb(document.querySelector('[data-case="screen-skeleton"] [data-slot="skeleton-block"]')),
            errorCard: rgb(document.querySelector('[data-slot="member-error"]')),
            errorEdge: getComputedStyle(document.querySelector('[data-slot="member-error"]')).borderTopColor,
          },
        }
      })

      const t = `[${theme}]`
      check(`${t} the page body never scrolls sideways`, m.docScrollWidth <= m.vw && m.bodyScrollWidth <= m.vw, `doc=${m.docScrollWidth} body=${m.bodyScrollWidth} vw=${m.vw}`)
      check(`${t} nothing is pushed outside the viewport`, m.overhang.length === 0, m.overhang.join(' | '))
      check(`${t} nothing outgrows its own track — not clipped, not side-scrolling`, m.clipped.length === 0, m.clipped.join(' | '))
      check(`${t} a 500-turn thread scrolls inside its own box`, m.threadScrolls, `scrollHeight vs clientHeight`)
      check(`${t} and that box does not scroll sideways either`, m.threadNoSideScroll)
      check(`${t} the retry control measures at least 44px`, m.buttonHeight >= 44, `${m.buttonHeight}px`)

      /* The turns have to be RAGGED, which they cannot be if their widths do not resolve. Checked
       * as a proportion of the track rather than in px so it survives a viewport or padding
       * change; 1.5pp of tolerance covers sub-pixel rounding only. A collapsed bubble reads as
       * ~10% here instead of its declared 62%, which is the shape of the 2026-09-02 defect. */
      check(
        `${t} every skeleton turn is as wide as it declares`,
        m.skeletonBubbles.length === 3 &&
          m.skeletonBubbles.every((b) => Math.abs(b.measured - b.declared) <= 1.5),
        m.skeletonBubbles.map((b) => `declared ${b.declared}% → ${b.measured}% (${b.px}px)`).join(' | '),
      )
      check(
        `${t} and the turns are ragged rather than one column`,
        new Set(m.skeletonBubbles.map((b) => b.px)).size === m.skeletonBubbles.length,
        m.skeletonBubbles.map((b) => `${b.px}px`).join(' | '),
      )

      /* The 3 ΔL* threshold is `tokens.css`'s own, for "a fill difference cannot delimit this".
       * Read from the RENDERED colours rather than from the file, so a broken cascade is caught
       * as well as a bad value. */
      const dL = (a, b) => Math.abs(lstar(a) - lstar(b))
      check(`${t} the thread skeleton's blocks are delimited by their fill`, dL(m.fills.threadBlock, m.fills.threadSurface) >= 3, `ΔL* ${dL(m.fills.threadBlock, m.fills.threadSurface).toFixed(2)} — ${m.fills.threadBlock} on ${m.fills.threadSurface}`)
      check(`${t} the screen skeleton's blocks are delimited by their fill`, dL(m.fills.screenBlock, m.fills.page) >= 3, `ΔL* ${dL(m.fills.screenBlock, m.fills.page).toFixed(2)} — ${m.fills.screenBlock} on ${m.fills.page}`)
      check(`${t} the failure block's edge delimits it`, dL(m.fills.errorEdge, m.fills.errorCard) >= 3, `ΔL* ${dL(m.fills.errorEdge, m.fills.errorCard).toFixed(2)}`)

      await page.close()
    }
  } finally {
    await browser.close()
  }
}

function lstar(rgb) {
  const [r, g, b] = rgb.match(/[\d.]+/g).slice(0, 3).map(Number)
  const lin = (c) => {
    const v = c / 255
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  const y = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  return y > 0.008856 ? 116 * y ** (1 / 3) - 16 : 903.3 * y
}

await layout()

console.log(`\n${pass} passed, ${fail} failed, ${skip} skipped`)
process.exit(fail > 0 || skip > 0 ? 1 : 0)
