#!/usr/bin/env node
/**
 * Fixture-tests `src/eslint/no-generic-tailwind-size.mjs` against ESLint's
 * real `Linter` API, the same engine a consumer's `eslint .` runs. Requires
 * `eslint` present in `node_modules` -- this package has neither a build
 * step nor a lockfile (recorded gap, see README), so this script is not
 * wired into CI yet; run it manually from a checkout that has `eslint`
 * available, or from a consumer's `node_modules` via a path override.
 *
 *     node scripts/verify-eslint-rule.mjs
 *
 * Each case is [name, code, expectedErrorCount]. This file is
 * mutation-tested against the rule itself, not just written and trusted:
 *
 *   - removing the ancestor-scope check (`inScope`) makes the "ordinary
 *     prose string OUTSIDE className" case false-positive -- caught
 *   - dropping the regex's `(?<![\w-])...(?![\w-])` boundary makes
 *     "text-small" (not a real utility, but a superstring of "text-sm")
 *     false-positive -- caught. `text-muted-foreground` does NOT exercise
 *     this: it never contains a banned word as a substring at all, boundary
 *     or not, so it is not evidence the boundary works -- verified by
 *     mutating and checking the result before trusting this list.
 *
 * A guard that has never failed is not evidence.
 */
import { Linter } from "eslint";
import jhRules from "../src/eslint/index.mjs";

const linter = new Linter();

const cases = [
  ["className text-sm", `<div className="text-sm">x</div>`, 1],
  ["className text-lg", `<div className="text-lg font-bold">x</div>`, 1],
  ["className text-2xl and text-sm combo", `<div className="flex text-2xl gap-2 text-sm">x</div>`, 2],
  ["console-prefixed, should NOT fire", `<div className="text-console-sm">x</div>`, 0],
  ["member token, should NOT fire", `<div className="text-member-body">x</div>`, 0],
  ["display token, should NOT fire", `<div className="text-h1">x</div>`, 0],
  ["colour utility, should NOT false-positive", `<div className="text-muted-foreground">x</div>`, 0],
  ["text-small (not a real utility), boundary must not partial-match text-sm", `<div className="text-small">x</div>`, 0],
  ["ordinary prose string OUTSIDE className, should NOT fire", `const msg = "please use text-sm here";`, 0],
  ["inside cn() call", `<div className={cn("flex", "text-sm", isActive && "text-lg")}>x</div>`, 2],
  ["inside cva() call", `const badge = cva("text-xs font-medium", { variants: { size: { sm: "text-sm" } } });`, 2],
  ["template literal in className", "<div className={`flex text-sm ${extra}`}>x</div>", 1],
  ["variant-prefixed md:text-sm inside className", `<div className="md:text-sm">x</div>`, 1],
  ["text-xs, no console-xs step exists but rule still bans stock text-xs", `<div className="text-xs">x</div>`, 1],
];

let pass = 0;
let fail = 0;
for (const [name, code, expected] of cases) {
  const messages = linter.verify(code, {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: jhRules[0].plugins,
    rules: jhRules[0].rules,
  });
  const got = messages.length;
  const ok = got === expected;
  const status = ok ? "PASS" : "FAIL";
  const detail = ok ? "" : `  msgs=${JSON.stringify(messages.map((m) => m.message))}`;
  console.log(`${status}  ${name.padEnd(65)} expected=${expected} got=${got}${detail}`);
  if (ok) pass += 1;
  else fail += 1;
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
