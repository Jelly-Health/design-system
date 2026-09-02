#!/usr/bin/env node
/**
 * Prove every public subpath RESOLVES from a real consumer, rather than asserting that it does.
 *
 * The package is consumed by subpath (`@jelly-health/design-system/ui/button`), and the exports
 * map reaches those files through one wildcard per directory. A wildcard carries an extension, the
 * directories are almost entirely `.tsx`, and the moment a `.ts` file lands in one the subpath
 * silently points at a filename that does not exist. Nothing in the repo notices: the file is
 * there, the barrel exports it, `tsc` is happy, and the failure appears only in a consumer, as
 * `Cannot find module`.
 *
 * That is not hypothetical — it is how JH217 found `ui/use-toast` broken, and JH228 hit the same
 * SHAPE somewhere else (the design-project bundle walk). THREE subpaths were dead when this script
 * was written, not the one the card named: `ui/use-toast`, `ui/index` and `member/index` — every
 * `.ts` file in a directory whose wildcard says `.tsx`. Finding the other two is the argument for
 * enumerating the directory instead of fixing the reported symptom.
 *
 *     node scripts/verify-exports.mjs
 *
 * Needs no dependencies and no browser, so unlike the other `.mjs` guards it is safe to run in CI.
 *
 * ── Why the fix is exact subpaths and not a `.ts` arm on the wildcard ─────────────────────────
 * The obvious fix is an array target — `["./src/components/ui/*.tsx", "./src/components/ui/*.ts"]`
 * — on the assumption that node tries each until one exists. IT DOES NOT. Node takes the first
 * syntactically valid target in the array and never checks the filesystem, so the `.ts` arm is
 * dead and `ui/use-toast` still resolves to `use-toast.tsx` and still fails. Measured, after
 * writing that fix and watching this script keep failing. The working fix is an exact subpath per
 * `.ts` file, which beats the wildcard because a literal key outranks a pattern.
 *
 * The cost of that fix is a list to maintain, which is precisely the kind of thing nobody
 * remembers — hence this script. It does not read the exports map and check it looks right; it
 * enumerates the files on disk, derives the subpath a consumer would write for each, and makes a
 * real consumer import it.
 *
 * ── Why it resolves rather than imports ──────────────────────────────────────────────────────
 * The first version `import()`ed each subpath and read `ERR_UNKNOWN_FILE_EXTENSION` as success
 * (node found the file, it just cannot execute TypeScript) and `ERR_MODULE_NOT_FOUND` as the
 * defect. That passed locally on node 20 and FAILED IN CI on every `.ts` subpath, for a reason
 * that has nothing to do with the exports map: newer node strips types from `.ts` and actually
 * RUNS it, so `use-toast.ts` reached its own `import 'react'`, found no `node_modules` on the
 * runner, and threw `ERR_MODULE_NOT_FOUND` — the same code, about a different module. The check
 * was reading a transitive dependency's absence as its own subject's absence, and it was
 * node-version-dependent, which is the worst kind of guard: green on the machine that wrote it.
 *
 * So it resolves and then stats, instead. `import.meta.resolve` applies the real exports map and
 * returns a URL WITHOUT loading anything — deliberately including URLs for files that do not
 * exist, which is exactly the defect here — so pairing it with `existsSync` asks the precise
 * question and nothing else. No execution, no dependencies, no node-version sensitivity.
 *
 * ── Mutation-tested ───────────────────────────────────────────────────────────────────────────
 * Each applied alone to an otherwise-passing tree. Baseline: 35 of 35 subpaths resolve, rc=0.
 *
 *   - remove the `./ui/use-toast` exact entry     -> 1 broken, 34/35
 *   - remove the `./ui/index` exact entry         -> 1 broken, 34/35
 *   - remove the `./member/index` exact entry     -> 1 broken, 34/35
 *   - replace all three exact entries with the array-arm form
 *       -> 3 broken, 32/35. This is the run that DISPROVED the array fix; the claim above is that
 *          measurement, not a reading of the spec
 *   - point `./ui/*` at `*.ts` instead of `*.tsx` -> 21 broken, 14/35 (every component)
 *   - break the root `"."` target                 -> 1 broken, 34/35
 *   - give a wildcard an object target            -> rejected outright, before probing anything
 *
 * ⚠️ This script had the same disease it was written to cure, twice, and a mutation found the
 * first while CI found the second.
 *
 *   1. The wildcard scan began as `.filter(([key, target]) => typeof target === 'string')`, so the
 *      moment the array-arm mutation turned the wildcards into arrays it stopped enumerating those
 *      directories ENTIRELY and reported "0 broken" — a clean pass over almost nothing, on a tree
 *      where three subpaths were dead. It now handles both shapes and rejects any third rather
 *      than skipping it, which is what the last mutation above exists to prove.
 *   2. It was green locally and RED IN CI on every `.ts` subpath, for a reason unrelated to the
 *      exports map — see "Why it resolves rather than imports" above. Reproduced deliberately
 *      before fixing: `git archive HEAD` into a clean tree with no `node_modules`, symlinked into
 *      a consumer, run under node 22 with `--experimental-strip-types`, which is the runner's
 *      behaviour. The old classifier calls `ui/use-toast` MISSING there and `ui/button` fine. The
 *      current one passes on that same clean tree under both node 20 and node 22.
 *
 * Negative control: the unmodified tree -> 35 of 35, rc=0.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readdirSync, symlinkSync, writeFileSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PKG = JSON.parse(execFileSync('cat', [join(ROOT, 'package.json')], { encoding: 'utf8' }))
const NAME = PKG.name

/* Directories reached by a wildcard, and the subpath prefix a consumer writes for each. Derived
 * from the exports map rather than hardcoded, so a new exported directory is covered the day it
 * is added instead of the day someone remembers this file. */
const wildcards = Object.entries(PKG.exports)
  .filter(([key]) => key.endsWith('/*'))
  .map(([key, target]) => {
    /* A target is a string or an ARRAY of them. Handling only the string case is not a
     * simplification, it is a hole: this script did exactly that at first, and when a mutation
     * turned the wildcards into arrays it stopped enumerating those directories altogether and
     * reported "0 broken" while checking almost nothing. A guard that quietly stops checking is
     * worse than no guard, so an unrecognised shape is rejected rather than skipped. */
    const arms = typeof target === 'string' ? [target] : target
    if (!Array.isArray(arms) || !arms.every((a) => typeof a === 'string')) {
      console.error(
        `FAIL: exports["${key}"] is neither a string nor an array of strings, so this script ` +
          `cannot tell which directory it covers. Rejected rather than skipped — the alternative ` +
          `is silently checking nothing.`,
      )
      process.exit(1)
    }
    return {
      prefix: key.slice(1, -2),
      dirs: [...new Set(arms.map((a) => a.slice(0, a.lastIndexOf('/')).replace(/^\.\//, '')))],
    }
  })
  .filter((w) => !w.dirs.some((d) => d.includes('fonts')))

const subpaths = []
for (const { prefix, dirs } of wildcards) {
  for (const dir of dirs) {
    for (const f of readdirSync(join(ROOT, dir))) {
      const m = f.match(/^(.+)\.(tsx|ts)$/)
      if (m) subpaths.push(`${NAME}${prefix}/${m[1]}`)
    }
  }
}
/* The non-wildcard entries too — a dangling literal target is the same defect with a shorter
 * blast radius. CSS and .mjs load for real, which is a stronger result than resolution alone. */
for (const key of Object.keys(PKG.exports)) {
  if (!key.endsWith('/*')) subpaths.push(NAME + key.slice(1))
}

const unique = [...new Set(subpaths)]

const consumer = mkdtempSync(join(tmpdir(), 'jh222-consumer-'))
try {
  mkdirSync(join(consumer, 'node_modules', '@jelly-health'), { recursive: true })
  symlinkSync(ROOT, join(consumer, 'node_modules', NAME))
  writeFileSync(
    join(consumer, 'probe.mjs'),
    `import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const targets = ${JSON.stringify(unique)}
const out = []
for (const t of targets) {
  let url
  try { url = import.meta.resolve(t) }
  catch (e) { out.push([t, 'unexported:' + e.code]); continue }
  out.push([t, existsSync(fileURLToPath(url)) ? 'ok' : 'missing:' + url.split('/').pop()])
}
console.log(JSON.stringify(out))`,
  )
  const raw = execFileSync('node', ['probe.mjs'], { cwd: consumer, encoding: 'utf8' })
  const results = JSON.parse(raw.trim().split('\n').pop())
  const broken = results.filter(([, v]) => v !== 'ok').map(([t]) => t)

  for (const [t, v] of results) console.log(`${v === 'ok' ? 'PASS' : 'FAIL'}  ${t}`)
  console.log(`\n${results.length - broken.length} of ${results.length} subpaths resolve`)

  if (broken.length) {
    console.error(`\nFAIL: ${broken.length} public subpath(s) point at a file that does not exist\n`)
    for (const b of broken) {
      console.error(
        `  - ${b} — the exports map sends this to a filename that is not on disk. If it is a ` +
          `.ts file in a directory whose wildcard says .tsx, add an exact entry for it ABOVE the ` +
          `wildcard; a .ts arm on the wildcard array does not work, see this file's header.`,
      )
    }
    process.exit(1)
  }
  console.log(`\nOK: every public subpath of ${NAME} resolves from a real consumer.`)
} finally {
  rmSync(consumer, { recursive: true, force: true })
}
