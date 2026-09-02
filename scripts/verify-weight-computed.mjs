#!/usr/bin/env node
/**
 * Assert the weight utilities COMPUTE the declared scale, in a real browser.
 *
 * `verify-weight-scale.py` proves the bindings are written correctly. This proves they arrive:
 * it compiles `tokens.css` with the real Tailwind engine and reads `getComputedStyle` in real
 * Chromium, because "the CSS says 510" and "an element renders 510" are different claims and only
 * the second one is the product.
 *
 *     node scripts/verify-weight-computed.mjs
 *
 * Requires `tailwindcss`, `@tailwindcss/node` and `playwright` (with a browser) in
 * `node_modules` -- the same manual-run caveat as `verify-member-plane.mjs` and
 * `verify-eslint-rule.mjs`, since this package has no lockfile. In practice: symlink
 * `web-app/node_modules`. Not in `verify.yml` for that reason; the structural guard is the one
 * that gates CI.
 *
 * If playwright's pinned browser build is not the one installed -- which is what a symlinked
 * `node_modules` usually means -- point `JH_CHROMIUM` at the chrome-headless-shell binary
 * under `~/Library/Caches/ms-playwright` (macOS) and run it as
 * `JH_CHROMIUM=<path> node scripts/verify-weight-computed.mjs`.
 *
 * ── Why a value check alone is not enough, and what this does instead ─────────────────────────
 * Two of the four weights are 300 and 400, which are ALSO Tailwind's stock values for
 * `font-light` and `font-normal`. So for those two, bound and unbound compute the same number and
 * a before/after comparison sees nothing:
 *
 *     font-light   unbound -> 300   bound -> 300
 *     font-normal  unbound -> 400   bound -> 400
 *
 * Reporting that as "verified" would be the familiar shape -- a check that passes for a reason
 * unrelated to the thing it claims to test. Deleting either binding is a real regression that this
 * script, written the obvious way, would call OK.
 *
 * So the binding is proved by MUTATION rather than by value. Each `--weight-*` in `:root` is
 * perturbed in turn to a sentinel that is deliberately NOT a multiple of 100 -- so it cannot
 * coincide with any Tailwind stock weight -- and the matching utility must follow it. A utility
 * that does not move is reading Tailwind's scale, whatever the file appears to say. That
 * discriminates all four, including the two whose natural values are invisible.
 *
 * The mutation is applied to an in-memory copy. Nothing is written to disk.
 *
 * Checks:
 *
 *   1. every utility computes the value its `--weight-*` token declares, read from `:root` rather
 *      than restated here
 *   2. every binding is LIVE, by mutation -- the check that covers `font-light`/`font-normal`
 *   3. `font-bold` computes Tailwind's stock 700 and does NOT follow `--weight-semibold` when it
 *      is mutated. That is the JH225 decision as a negative control: if someone aliases bold onto
 *      the ceiling, the second half fails even though the first half still passes
 *
 * ── Mutation-tested ───────────────────────────────────────────────────────────────────────────
 * Each applied on its own to a tree that was otherwise passing. The first two are the whole reason
 * this file exists -- a value-only check reports OK on both:
 *
 *   - delete `--font-weight-light` binding      -> 1 violation (liveness only; the value check
 *                                                  still sees 300 and is satisfied)
 *   - delete `--font-weight-normal` binding     -> 1 violation (same)
 *   - delete `--font-weight-medium` binding     -> 2 (value AND liveness)
 *   - delete `--font-weight-semibold` binding   -> 2 (value AND liveness)
 *   - empty all four, i.e. `origin/main`        -> 6
 *   - `--font-weight-medium: 510` as a literal  -> 1. The sharpest case: the value is correct and
 *                                                  the binding is dead, so only mutation sees it
 *   - `--font-weight-bold: var(--weight-semibold)` -> 5
 *
 * The 1-vs-2 split is the gap, quantified: for `font-light` and `font-normal` liveness is the only
 * signal there is.
 *
 * Negative controls, which must stay SILENT:
 *
 *   - the unmodified tree                       -> rc=0
 *   - the four bindings reordered               -> rc=0
 */
import { compile } from '@tailwindcss/node'
import { chromium } from 'playwright'
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const TOKENS = join(ROOT, 'src/styles/tokens.css')

// Our vocabulary -> Tailwind's, same map `verify-weight-scale.py` states and for the same reason:
// a translation between two naming schemes, not a claim about which tokens exist.
const NAME_MAP = { light: 'light', regular: 'normal', medium: 'medium', semibold: 'semibold' }

// Deliberately not multiples of 100, so a sentinel can never be mistaken for a Tailwind stock
// weight -- which is the entire discriminating power of check 2.
const SENTINEL = { light: 317, regular: 423, medium: 561, semibold: 634 }

const STOCK_BOLD = '700'

const source = readFileSync(TOKENS, 'utf8')

function declaredWeights(css) {
  const out = {}
  for (const m of css.matchAll(/^\s*--weight-([a-z0-9-]+)\s*:\s*([^;]+);/gm)) out[m[1]] = m[2].trim()
  return out
}

/** Replace one `--weight-<name>` declaration in :root. Returns null if it did not apply, which is
 *  a failure rather than a skip: a mutation that silently no-ops reports OK on a broken tree. */
function mutate(css, name, value) {
  const re = new RegExp(`(^\\s*--weight-${name}\\s*:\\s*)([^;]+)(;)`, 'm')
  if (!re.test(css)) return null
  return css.replace(re, `$1${value}$3`)
}

async function computed(page, css, utilities) {
  const built = (await compile(`@import "tailwindcss";\n${css}\n`,
    { base: ROOT, onDependency() {} })).build(utilities)
  const file = join(tmpdir(), `jh225-${process.pid}-${Math.random().toString(36).slice(2)}.html`)
  writeFileSync(file, `<!doctype html><meta charset="utf-8"><style>${built}</style><body>` +
    utilities.map((u) => `<span id="${u}" class="${u}">x</span>`).join('') + `</body>`)
  try {
    await page.goto('file://' + file)
    return await page.evaluate((us) => Object.fromEntries(
      us.map((u) => [u, getComputedStyle(document.getElementById(u)).fontWeight])), utilities)
  } finally { unlinkSync(file) }
}

const declared = declaredWeights(source)
const names = Object.keys(NAME_MAP)
const utilities = [...names.map((n) => `font-${NAME_MAP[n]}`), 'font-bold']

const missing = names.filter((n) => !(n in declared))
if (missing.length) {
  console.error(`FAIL: tokens.css declares no ${missing.map((n) => `--weight-${n}`).join(', ')}. ` +
    `Either the scale changed or this script's NAME_MAP is stale; both are failures.`)
  process.exit(1)
}

// `JH_CHROMIUM` overrides the browser binary. Playwright resolves a build number pinned to its
// own version, so a checkout whose installed browser came from a different playwright (as when
// `node_modules` is symlinked from `web-app`) launches nothing without this. Unset in CI-like use.
const browser = await chromium.launch(
  process.env.JH_CHROMIUM ? { executablePath: process.env.JH_CHROMIUM } : {})
const page = await browser.newPage()
const failures = []
const rows = []

// 1. Natural values.
const base = await computed(page, source, utilities)
for (const n of names) {
  const util = `font-${NAME_MAP[n]}`
  const want = declared[n]
  const got = base[util]
  const observable = !/^[1-9]00$/.test(want)
  rows.push([util, want, got, observable ? 'value' : 'value (coincides with stock)'])
  if (got !== want) {
    failures.push(`\`.${util}\` computes ${got}, but \`--weight-${n}\` declares ${want}. The ` +
      `binding in \`@theme inline\` is missing or not reaching the utility.`)
  }
}

// 3a. Bold is stock.
if (base['font-bold'] !== STOCK_BOLD) {
  failures.push(`\`.font-bold\` computes ${base['font-bold']}, expected Tailwind's stock ` +
    `${STOCK_BOLD}. JH225 decided bold is not bound to a token -- see verify-weight-scale.py ` +
    `check 5.`)
}

// 2 + 3b. Mutation: each binding must be live, and bold must follow none of them.
for (const n of names) {
  const util = `font-${NAME_MAP[n]}`
  const sentinel = String(SENTINEL[n])
  const mutated = mutate(source, n, sentinel)
  if (mutated === null) {
    failures.push(`could not mutate \`--weight-${n}\` -- this script could not construct its own ` +
      `test, so nothing below was actually proved. Rejected rather than skipped.`)
    continue
  }
  const after = await computed(page, mutated, utilities)
  const live = after[util] === sentinel
  rows.push([util, `${sentinel} (mutated)`, after[util], live ? 'LIVE' : 'NOT BOUND'])
  if (!live) {
    failures.push(`\`--weight-${n}\` mutated to ${sentinel} and \`.${util}\` still computes ` +
      `${after[util]}, so the utility is reading Tailwind's own scale and the binding is not ` +
      `live. Note this is invisible in a plain value check when the declared value is ` +
      `${declared[n]}, which is also Tailwind's stock for \`.${util}\`.`)
  }
  if (after['font-bold'] !== STOCK_BOLD) {
    failures.push(`mutating \`--weight-${n}\` moved \`.font-bold\` to ${after['font-bold']}. ` +
      `Bold must not track any token -- JH225 left it at stock ${STOCK_BOLD} on purpose.`)
  }
}

await browser.close()

const w = [16, 18, 10, 30]
console.log(['utility', 'expected', 'computed', 'proved by'].map((h, i) => h.padEnd(w[i])).join(''))
console.log('-'.repeat(70))
for (const r of rows) console.log(r.map((c, i) => String(c).padEnd(w[i])).join(''))

if (failures.length) {
  console.error(`\nFAIL: ${failures.length} computed-weight violation(s)\n`)
  for (const f of failures) console.error(`  - ${f}`)
  process.exit(1)
}
console.log(`\nOK: ${names.length} weight utilities compute their declared value, all ` +
  `${names.length} bindings proved live by mutation (including font-light/font-normal, whose ` +
  `declared values coincide with Tailwind's stock and are invisible to a value check); ` +
  `font-bold stock at ${STOCK_BOLD} and tracks no token.`)
