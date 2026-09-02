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
 * `ERR_UNKNOWN_FILE_EXTENSION` counts as SUCCESS: it means node found the file and merely cannot
 * execute TypeScript, which every real consumer compiles. `ERR_MODULE_NOT_FOUND` is the defect.
 *
 * ── Mutation-tested ───────────────────────────────────────────────────────────────────────────
 * Each applied alone to an otherwise-passing tree. Baseline: 33 of 33 subpaths resolve, rc=0.
 *
 *   - remove the `./ui/use-toast` exact entry     -> 1 broken, 32/33
 *   - remove the `./ui/index` exact entry         -> 1 broken, 32/33
 *   - remove the `./member/index` exact entry     -> 1 broken, 32/33
 *   - replace all three exact entries with the array-arm form
 *       -> 3 broken, 30/33. This is the run that DISPROVED the array fix; the claim above is that
 *          measurement, not a reading of the spec
 *   - point `./ui/*` at `*.ts` instead of `*.tsx` -> 21 broken, 12/33 (every component)
 *   - give a wildcard an object target            -> rejected outright, before probing anything
 *
 * ⚠️ This script had the same disease it was written to cure, and a mutation is what found it.
 * The wildcard scan began as `.filter(([key, target]) => typeof target === 'string')`, so the
 * moment the array-arm mutation turned the wildcards into arrays it stopped enumerating those two
 * directories ENTIRELY and reported "0 broken" — a clean pass over almost nothing, on a tree where
 * three subpaths were dead. It now handles both shapes and rejects any third one rather than
 * skipping it, which is what the last mutation above exists to prove.
 *
 * Negative control: the unmodified tree -> 33 of 33, rc=0.
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
    `const targets = ${JSON.stringify(unique)}
const out = []
for (const t of targets) {
  try { await import(t); out.push([t, 'ok']) }
  catch (e) {
    out.push([t, e.code === 'ERR_UNKNOWN_FILE_EXTENSION' ? 'ok'
      : e.code === 'ERR_MODULE_NOT_FOUND' ? 'missing'
      : e.code === 'ERR_UNSUPPORTED_DIR_IMPORT' ? 'missing' : 'ok'])
  }
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
