#!/usr/bin/env node
/**
 * Measure the member plane's hit targets in a real browser, because every claim JH222 makes about
 * them is geometric and nothing that reads the source can check one.
 *
 * `verify-member-plane.mjs` proves the classes are applied. This proves they MEAN what the
 * docstrings say: that a member `Checkbox` is 44px to tap, that the mark it draws is still 16px,
 * and — the one that matters most — that two of them stacked in a real group do not steal each
 * other's taps. "The class list contains `before:size-[var(--touch-min)]`" and "a member can hit
 * this control and only this control" are different claims, and only the second one is the floor.
 *
 *     JH_CHROMIUM=~/Library/Caches/ms-playwright/chromium_headless_shell-1234/\
 *       chrome-headless-shell-mac-arm64/chrome-headless-shell \
 *       node scripts/verify-touch-target.mjs
 *
 * Requires `tailwindcss`, `@tailwindcss/node` and `playwright` with a browser — the same manual-run
 * caveat as `verify-weight-computed.mjs`, and for the same reason: this package has no lockfile.
 * Not in `verify.yml`; the structural guard is the one that gates CI.
 *
 * ── What is checked, and why each one is separate ─────────────────────────────────────────────
 *   1. HIT   the expanded area reaches `--touch-min` on both axes, proved by `elementFromPoint` at
 *            eight points around the perimeter of the floor-sized box, not by reading a width
 *   2. PAINT the painted box is byte-for-byte the size it is on the console plane. This is the
 *            half that makes the decision defensible: the target grows, the drawing does not
 *   3. SPACE the control reserves its own footprint, so the expanded area is space it owns
 *   4. STACK three member radios in `RadioGroup`'s real `grid gap-3`, every sample point inside
 *            each one's floor-sized box resolving to that control and never to a sibling. This is
 *            the defect the reserved footprint exists to prevent, and it is invisible to 1-3:
 *            each control passes HIT in isolation while the group silently mis-routes taps
 *   5. QUIET the expanded pseudo-element paints nothing — no background, no border, no shadow — so
 *            focus ring and hover still describe the painted box rather than the hit box
 *   6. NOOP  the console plane grows no pseudo-element at all
 *
 * ── Mutation-tested ───────────────────────────────────────────────────────────────────────────
 * Each applied alone to an otherwise-passing tree, named by the check that caught it.
 *
 *   - drop `before:size-[var(--touch-min)]` from Checkbox's member variant
 *       -> HIT, 8 of 8 perimeter points falling through to BODY
 *   - drop the `m-[calc(...)]` footprint from RadioGroupItem's member variant
 *       -> SPACE and STACK. This is the pair that justifies check 4 existing: HIT still passes,
 *          because every control genuinely does measure 44px on its own. Only the group shows it
 *   - grow Checkbox's painted box (`size-4` -> `size-[var(--touch-min)]`) in the BASE string
 *       -> PAINT and SPACE. The "obvious" wrong fix, and the one a reviewer is least likely to
 *          challenge, because the control really does reach the floor
 *   - give Switch one symmetric `m-[calc((var(--touch-min)-1rem)/2)]`
 *       -> SPACE. It reserves 60px of width for a 44px hit area: not a floor violation, so no
 *          screenshot and no `>=` check would show it, but it shoves its neighbours 16px away
 *   - give the expanded pseudo a `before:bg-primary`               -> QUIET
 *   - move the expansion into the base string and empty the member variant, so both planes get it
 *       -> NOOP. Independently caught by `verify-member-plane.mjs`'s console-equivalence case
 *          (22 classes before, 31 after), which is the belt to this braces
 *
 * ⚠️ TWO OF THESE CHECKS WERE WRONG until the mutations found them, which is the argument for
 * running them rather than reasoning about them:
 *
 *   - PAINT originally compared member against this tree's own CONSOLE plane. That is circular:
 *     growing the painted box in the base string moves both planes together, they stay equal, and
 *     the check reports OK on precisely the mistake it exists to catch. It now compares against
 *     `origin/main`, which this diff cannot move.
 *   - SPACE originally required the footprint to be `>= floor`. That catches under-reserving and
 *     is blind to over-reserving, so the symmetric-margin mutation passed. It now requires the
 *     footprint to MATCH max(painted, floor).
 *
 * Negative control: the unmodified tree -> rc=0, all three controls 8/8, no stacked point
 * resolving to a neighbour.
 *
 * ⚠️ `Switch`'s reserved height measures 43.990625px rather than 44. `h-[1.15rem]` is 18.4px in
 * arithmetic and 18.390625px once Chromium has rounded it to 1/64px, and the margin derived from
 * it inherits the remainder. The tolerance here is half a pixel, which absorbs it. The HIT box
 * itself is an exact 44×44 because it is sized from `--touch-min` directly rather than from the
 * control, so nothing a member can tap is short of the floor; only the reserved layout box is,
 * by nine thousandths of a pixel.
 */
import { compile } from '@tailwindcss/node'
import { chromium } from 'playwright'
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'
import { transformSync } from 'esbuild'
import * as React from 'react'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const { createRequire } = await import('node:module')
const require = createRequire(import.meta.url)

function load(relPath) {
  const src = readFileSync(join(ROOT, relPath), 'utf8').replace(
    /import \{ cn \} from ['"].*?['"]/,
    "const cn = (...a) => a.filter(Boolean).join(' ')",
  )
  const js = transformSync(src, { loader: 'tsx', format: 'cjs', jsx: 'automatic' }).code
  const module = { exports: {} }
  new Function('module', 'exports', 'require', js)(module, module.exports, (id) =>
    id === 'react' ? React : require(id),
  )
  return module.exports
}

const { checkboxVariants } = load('src/components/ui/checkbox.tsx')
const { switchVariants } = load('src/components/ui/switch.tsx')
const { radioGroupItemVariants } = load('src/components/ui/radio-group.tsx')

/* The subjects, each with the two class strings its own cva produces. Read from the component
 * rather than restated here: a copy of the expected classes is a second place to be wrong, and it
 * would keep passing after the component stopped agreeing with it. */
const SUBJECTS = [
  { name: 'Checkbox', variants: checkboxVariants, path: 'src/components/ui/checkbox.tsx', slot: 'checkbox' },
  { name: 'Switch', variants: switchVariants, path: 'src/components/ui/switch.tsx', slot: 'switch' },
  { name: 'RadioGroupItem', variants: radioGroupItemVariants, path: 'src/components/ui/radio-group.tsx', slot: 'radio-group-item' },
]

/* PAINT's baseline is `origin/main`, NOT this tree's own console plane.
 *
 * Comparing member against console is what this script did first, and it is circular: growing the
 * painted box in the BASE string moves both planes together, the two stay equal, and the check
 * reports OK on exactly the mistake it exists to catch. Caught by mutation, which is the only
 * reason it is not still written that way. So the baseline comes from the ref, where the painted
 * box is whatever shipped and cannot be moved by this diff.
 *
 * Extraction failing is a FAILURE, never a skip. */
function baseLiteralFor(src, slot) {
  const at = src.indexOf(`data-slot="${slot}"`)
  if (at === -1) return null
  const m = src.slice(at).match(/cn\(\s*\n?\s*(["'])([\s\S]*?)\1/)
  return m === null ? null : m[2]
}

for (const s of SUBJECTS) {
  const src = execFileSync('git', ['show', `origin/main:${s.path}`], { cwd: ROOT, encoding: 'utf8' })
  s.mainClasses = baseLiteralFor(src, s.slot)
  if (s.mainClasses === null) {
    console.error(
      `FAIL: could not read ${s.name}'s painted box from origin/main:${s.path}. This script ` +
        `could not construct its own baseline, so nothing below would be proved. Rejected ` +
        `rather than skipped.`,
    )
    process.exit(1)
  }
}

const GROUP_CLASSES = 'grid gap-3' // RadioGroup's real default, not a stand-in

const utilities = [
  ...new Set(
    SUBJECTS.flatMap((s) => [s.variants({}), s.variants({ plane: 'member' })])
      .concat(GROUP_CLASSES, ...SUBJECTS.map((s) => s.mainClasses))
      .flatMap((c) => c.split(/\s+/))
      .filter(Boolean),
  ),
]

const css = readFileSync(join(ROOT, 'src/styles/tokens.css'), 'utf8')
const built = (
  await compile(`@import "tailwindcss";\n${css}\n`, { base: ROOT, onDependency() {} })
).build(utilities)

/* Controls are laid out far apart so that checks 1-3 measure one control with nothing near it;
 * the stacked group is the only place neighbours are deliberately in range. */
const body =
  SUBJECTS.map(
    (s) => `<div style="margin:120px">
       <button id="${s.name}-main" class="${s.mainClasses}"></button>
     </div>
     <div style="margin:120px">
       <button id="${s.name}-console" class="${s.variants({})}"></button>
     </div>
     <div style="margin:120px">
       <button id="${s.name}-member" class="${s.variants({ plane: 'member' })}"></button>
     </div>`,
  ).join('') +
  `<div style="margin:120px"><div id="stack" class="${GROUP_CLASSES}">` +
  [0, 1, 2]
    .map(
      (i) =>
        `<button id="stack-${i}" class="${radioGroupItemVariants({ plane: 'member' })}"></button>`,
    )
    .join('') +
  `</div></div>`

const file = join(tmpdir(), `jh222-${process.pid}-${Math.random().toString(36).slice(2)}.html`)
writeFileSync(
  file,
  `<!doctype html><meta charset="utf-8"><style>${built}</style><body style="margin:0">${body}</body>`,
)

const browser = await chromium.launch(
  process.env.JH_CHROMIUM ? { executablePath: process.env.JH_CHROMIUM } : {},
)
const page = await browser.newPage({ viewport: { width: 1200, height: 2400 } })

let measurements
try {
  await page.goto('file://' + file)
  measurements = await page.evaluate(
    ({ names }) => {
      const floor = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--touch-min'),
      )
      const px = (v) => parseFloat(v) || 0

      /* Sample just INSIDE the floor-sized box centred on the painted box: if the expansion is
       * short on any side, at least one of these lands outside it. Half a pixel of inset keeps the
       * sample off the exact boundary, where a rounding difference is not a defect. */
      const perimeter = (cx, cy, size) => {
        const r = size / 2 - 0.5
        return [
          [cx - r, cy - r], [cx, cy - r], [cx + r, cy - r],
          [cx - r, cy], [cx + r, cy],
          [cx - r, cy + r], [cx, cy + r], [cx + r, cy + r],
        ]
      }

      const probe = (el, size) => {
        const b = el.getBoundingClientRect()
        const cx = b.left + b.width / 2
        const cy = b.top + b.height / 2
        return perimeter(cx, cy, size).map(([x, y]) => {
          const hit = document.elementFromPoint(x, y)
          return { x: Math.round(x), y: Math.round(y), id: hit ? hit.id || hit.tagName : null }
        })
      }

      const describe = (id) => {
        const el = document.getElementById(id)
        const b = el.getBoundingClientRect()
        const cs = getComputedStyle(el)
        const before = getComputedStyle(el, '::before')
        return {
          id,
          paint: { w: b.width, h: b.height },
          footprint: {
            w: b.width + px(cs.marginLeft) + px(cs.marginRight),
            h: b.height + px(cs.marginTop) + px(cs.marginBottom),
          },
          before: {
            content: before.content,
            background: before.backgroundColor,
            borderWidth: before.borderTopWidth,
            boxShadow: before.boxShadow,
            w: px(before.width),
            h: px(before.height),
          },
          hits: probe(el, floor),
        }
      }

      const stack = [0, 1, 2].map((i) => {
        const el = document.getElementById(`stack-${i}`)
        const b = el.getBoundingClientRect()
        const cx = b.left + b.width / 2
        const cy = b.top + b.height / 2
        const r = floor / 2 - 0.5
        const pts = []
        for (let dx = -r; dx <= r; dx += r / 2) {
          for (let dy = -r; dy <= r; dy += r / 2) {
            const hit = document.elementFromPoint(cx + dx, cy + dy)
            pts.push({ dx: Math.round(dx), dy: Math.round(dy), id: hit ? hit.id : null })
          }
        }
        return { id: `stack-${i}`, points: pts }
      })

      return {
        floor,
        controls: names.flatMap((n) => [describe(`${n}-main`), describe(`${n}-console`), describe(`${n}-member`)]),
        stack,
      }
    },
    { names: SUBJECTS.map((s) => s.name) },
  )
} finally {
  await browser.close()
  unlinkSync(file)
}

const { floor, controls, stack } = measurements
const byId = Object.fromEntries(controls.map((c) => [c.id, c]))
const failures = []
const rows = []
const near = (a, b) => Math.abs(a - b) < 0.5

for (const { name } of SUBJECTS) {
  const main = byId[`${name}-main`]
  const con = byId[`${name}-console`]
  const mem = byId[`${name}-member`]

  // 1. HIT
  const missed = mem.hits.filter((h) => h.id !== `${name}-member`)
  if (missed.length) {
    failures.push(
      `HIT: ${name} plane=member does not reach ${floor}px — ${missed.length} of 8 perimeter ` +
        `points miss the control (${missed.map((m) => `${m.x},${m.y}->${m.id}`).join(' ')}). ` +
        `The expanded area is smaller than the floor on at least one side.`,
    )
  }

  // 2. PAINT — against origin/main, on both planes, so a base-string change cannot hide here
  for (const [planeName, got] of [['console', con], ['member', mem]]) {
    if (!near(main.paint.w, got.paint.w) || !near(main.paint.h, got.paint.h)) {
      failures.push(
        `PAINT: ${name} plane=${planeName} draws ${got.paint.w}×${got.paint.h}, but origin/main ` +
          `draws ${main.paint.w}×${main.paint.h}. The member plane must expand the HIT area and ` +
          `leave the painted box alone — growing the box is the wrong fix the docstrings argue ` +
          `against, and it is the one a reviewer is least likely to challenge because the control ` +
          `really does reach the floor.`,
      )
    }
  }

  /* 3. SPACE — the footprint must MATCH the hit area, not merely cover it.
   *
   * `>= floor` was the first version and it is too weak in the other direction: a symmetric margin
   * on `Switch` reserves 60px of width for a 44px hit area, which passes "at least the floor"
   * while pushing everything beside it 16px away for no reason. Caught by mutation. A control
   * wider than the floor reserves its own width, hence max(). */
  const want = { w: Math.max(main.paint.w, floor), h: Math.max(main.paint.h, floor) }
  if (!near(mem.footprint.w, want.w) || !near(mem.footprint.h, want.h)) {
    failures.push(
      `SPACE: ${name} plane=member reserves ${mem.footprint.w}×${mem.footprint.h} of layout, ` +
        `expected ${want.w}×${want.h}. Under-reserving takes area from whatever sits next to it ` +
        `(see STACK); over-reserving pushes its neighbours away for nothing.`,
    )
  }

  // 5. QUIET
  const b = mem.before
  const paints =
    b.background !== 'rgba(0, 0, 0, 0)' || parseFloat(b.borderWidth) > 0 || b.boxShadow !== 'none'
  if (paints) {
    failures.push(
      `QUIET: ${name}'s expanded pseudo-element paints something (background ${b.background}, ` +
        `border ${b.borderWidth}, shadow ${b.boxShadow}). It must be invisible, or the focus ring ` +
        `and hover stop describing the painted box.`,
    )
  }

  // 6. NOOP
  if (con.before.content !== 'none') {
    failures.push(
      `NOOP: ${name} plane=console grew a pseudo-element (content ${con.before.content}). The ` +
        `console plane is 100% of call sites today and must be untouched.`,
    )
  }

  rows.push([
    name,
    `${main.paint.w}×${main.paint.h}`,
    `${mem.paint.w}×${mem.paint.h}`,
    `${mem.before.w}×${mem.before.h}`,
    `${mem.footprint.w}×${mem.footprint.h}`,
    missed.length === 0 ? '8/8' : `${8 - missed.length}/8`,
  ])
}

// 4. STACK
for (const s of stack) {
  const stolen = s.points.filter((p) => p.id !== s.id)
  if (stolen.length) {
    const thieves = [...new Set(stolen.map((p) => p.id))].join(', ')
    failures.push(
      `STACK: ${s.id} loses ${stolen.length} of ${s.points.length} points inside its own ` +
        `${floor}px hit area to [${thieves}]. Two stacked controls' hit areas overlap and the ` +
        `later sibling wins the contested band, so a member tapping near the edge of one option ` +
        `selects another. This is what the reserved footprint prevents.`,
    )
  }
}

const w = [16, 14, 14, 14, 14, 6]
console.log(
  ['control', 'paint main', 'paint member', 'hit box', 'footprint', 'pts']
    .map((h, i) => h.padEnd(w[i]))
    .join(''),
)
console.log('-'.repeat(80))
for (const r of rows) console.log(r.map((c, i) => String(c).padEnd(w[i])).join(''))
const stackOk = stack.every((s) => s.points.every((p) => p.id === s.id))
console.log(
  `\nstacked group (${GROUP_CLASSES}): ${stack.length} controls, ` +
    `${stack[0].points.length} points each, ` +
    (stackOk ? 'no point resolves to a neighbour' : 'OVERLAP DETECTED'),
)

if (failures.length) {
  console.error(`\nFAIL: ${failures.length} touch-target violation(s)\n`)
  for (const f of failures) console.error(`  - ${f}`)
  process.exit(1)
}
console.log(`\nOK: ${SUBJECTS.length} controls reach the ${floor}px floor with the painted box unchanged.`)
