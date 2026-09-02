#!/usr/bin/env node
/**
 * Verify that `cn()` never silently DELETES a class from a shipped component.
 *
 * ── The defect this exists for ────────────────────────────────────────────────────────────────
 * tailwind-merge decides which group a `text-*` class belongs to by validating its value. A known
 * t-shirt size or arbitrary length is a font size; anything unrecognised falls through to the text
 * COLOUR group. Every size name this package publishes is custom -- `console-sm`, `member-body`,
 * `h1` -- so before `src/lib/utils.ts` named them, all of them shared a group with `ink`, `ink-2`,
 * `danger` and every other colour role. Two classes in one group means the later wins and the
 * earlier is dropped: no error, no warning, and nothing in a diff or a screenshot review to see.
 *
 * Measured on `origin/main` 2026-09-02 by running this script against a snapshot of that tree:
 * **18 classes silently deleted across 9 of the 23 shipped components** -- 12 font sizes and 6
 * colours, since the collision destroys whichever of the pair comes first. Among them
 * `text-member-body` on all four `MessageBubble` voices, so the component whose own docstring
 * measures its contrast at the member body size was rendering at whatever size it inherited. The
 * member body floor was being deleted by the merge layer that exists to make conflicts resolve
 * predictably. That is the whole reason this is a script and not a paragraph in the README: the
 * failure is invisible by construction, so the only thing that catches it is running it.
 *
 *     node scripts/verify-class-merge.mjs
 *
 * ── What it checks ────────────────────────────────────────────────────────────────────────────
 *   1. Every class in every className string in `src/components` survives `cn()`. A string is a
 *      genuine co-occurrence -- those classes are always on the element together -- so a drop here
 *      is a real drop, not a hypothetical pairing.
 *   2. Every cva base string survives being merged with each of its variant strings. This is the
 *      case a per-string check cannot see, and it is the one that hit `MessageBubble`: the base
 *      carried `text-member-body`, each voice variant carried a colour, and they only meet at
 *      render time.
 *   3. The font-size list in `src/lib/utils.ts` is parsed from that file rather than restated
 *      here, so this script cannot drift from the thing it is checking. (Its agreement with
 *      `tokens.css` is a separate question, and `verify-type-ramp.py` check 9 owns it.)
 *
 * Requires `tailwind-merge` and `clsx` in `node_modules`. This package has no lockfile (recorded
 * gap, see README), so like `verify-eslint-rule.mjs` this is run manually from a checkout that has
 * them -- in practice by symlinking `web-app/node_modules`.
 *
 * ── Mutation-tested, and it failed the first round ───────────────────────────────────────────
 * The first cut of this script classified a `text-*` class as a size by looking it up in
 * FONT_SIZE_STEPS -- the very list under test. So emptying that list also emptied the script's
 * expectations, and **all three positive mutations below reported OK**. A check whose notion of
 * the truth is derived from the thing it is checking cannot fail, and nothing reveals that except
 * mutating it: it passes exactly as convincingly as a real one. `declaredSteps()` now reads
 * tokens.css, which is the file that actually declares the ramp, and the gap between what is
 * declared and what tailwind-merge has been told is itself reported.
 *
 * Re-run after that fix, each applied on its own:
 *
 *   - emptying FONT_SIZE_STEPS, i.e. the plain `twMerge` that shipped
 *                                     -> 35 failures: 17 unregistered steps + the 18 real drops
 *   - deleting `"member-body"` alone  -> 5: the drift line, and MessageBubble's four voices
 *   - deleting `"console-sm"` alone   -> 15, in six components
 *   - a step in FONT_SIZE_STEPS with no `--text-*` behind it  -> reported, opposite direction
 *
 * And two negative controls, which must stay SILENT -- a check that fires on correct code teaches
 * people to ignore it:
 *
 *   - `text-ink text-ink-3` on one element  -> not reported. Two colours colliding is what a merge
 *     is FOR, and flagging it would mean this script had measured the wrong thing
 *   - `text-console-base md:text-console-sm`, the responsive pattern `Input` has always shipped
 *     -> not reported: different variant scopes never compete
 *
 * A guard that has never failed is not evidence.
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { extendTailwindMerge } from "tailwind-merge";
import { clsx } from "clsx";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const UTILS = join(ROOT, "src", "lib", "utils.ts");
const TOKENS = join(ROOT, "src", "styles", "tokens.css");
const COMPONENTS = join(ROOT, "src", "components");

/* Parse FONT_SIZE_STEPS out of utils.ts. Restating the list here would make this script agree with
 * a copy of the config rather than with the config, which is the failure it is meant to catch. */
function fontSizeSteps() {
  const src = readFileSync(UTILS, "utf8");
  const m = src.match(/const FONT_SIZE_STEPS\s*=\s*\[([\s\S]*?)\]/);
  if (!m) {
    console.error(`FAIL: could not find FONT_SIZE_STEPS in ${UTILS}`);
    process.exit(1);
  }
  return [...m[1].matchAll(/"([^"]+)"|'([^']+)'/g)].map((x) => x[1] ?? x[2]);
}

/* What a font size ACTUALLY is, read from tokens.css -- the file that declares them.
 *
 * This must not come from FONT_SIZE_STEPS, and getting that wrong is not a hypothetical: the first
 * cut of this script classified sizes using the same list it was checking, so deleting a step from
 * that list also deleted the script's expectation of it. All three positive mutations below
 * reported OK. A check whose notion of the truth is derived from the thing under test cannot fail,
 * and it takes a mutation to notice, because it passes exactly as convincingly as a real one. */
function declaredSteps() {
  const css = readFileSync(TOKENS, "utf8").replace(/\/\*[\s\S]*?\*\//g, " ");
  const names = new Set();
  for (const m of css.matchAll(/^\s*--text-([a-z0-9-]+?)\s*:/gim)) {
    if (!m[1].endsWith("--line-height")) names.add(m[1]);
  }
  return [...names].sort();
}

const DECLARED = declaredSteps();
const STEPS = fontSizeSteps();

/* The drift check. tokens.css declares the ramp; FONT_SIZE_STEPS tells tailwind-merge about it.
 * A step in the first and not the second is a size class that silently deletes colours (and gets
 * deleted by them) -- the shipped defect. The reverse is a name registered as a size that no token
 * backs, which suppresses a collision that is real. Both directions are failures. */
const missing = DECLARED.filter((x) => !STEPS.includes(x));
const extra = STEPS.filter((x) => !DECLARED.includes(x));
const merge = extendTailwindMerge({
  extend: { classGroups: { "font-size": [{ text: STEPS }] } },
});
const cn = (...inputs) => merge(clsx(inputs));

/* A class string, for our purposes: at least two space-separated tokens, at least one hyphen, and
 * no characters that only appear in prose. Deliberately loose -- a false positive here costs one
 * confusing line, a false negative costs the defect above. */
const CLASSY = /^[a-z0-9:[\]()&>=_,./#%*-]+(\s+[a-z0-9:[\]()&>=_,./#%*-]+)+$/i;

function stringLiterals(src) {
  return [...src.matchAll(/'([^'\n]*)'|"([^"\n]*)"/g)]
    .map((m) => (m[1] ?? m[2]).trim())
    .filter((s) => CLASSY.test(s) && s.includes("-"));
}

/* Split `md:hover:text-console-sm` into its variant scope and its utility. Two `text-*` classes
 * only compete when their scopes match -- `text-console-base md:text-console-sm` is the
 * responsive pattern `Input` has always used, and reporting it would be reporting correct code. */
function scopeOf(token) {
  const i = token.lastIndexOf(":");
  return i === -1 ? "" : token.slice(0, i + 1);
}

/* The one distinction this script exists to police. A `text-*` class is a SIZE if its value is a
 * registered step, and a COLOUR otherwise -- which is exactly the judgement tailwind-merge gets
 * wrong when a step is not registered, and exactly why it cannot be asked to make it for us. */
function kindOf(token) {
  const util = token.slice(scopeOf(token).length);
  if (!util.startsWith("text-")) return null;
  const value = util.slice("text-".length);
  if (value.startsWith("[")) return "size"; // arbitrary length, e.g. text-[13px]
  return DECLARED.includes(value) ? "size" : "colour";
}

/**
 * The classes that SHOULD survive: within each variant scope, the last size and the last colour.
 *
 * Anything else being dropped is the merge doing its job -- two colours collide, a variant
 * overrides a base's ring, a size variant's `h-8` replaces the base's `h-9`. Only a size and a
 * colour deleting each other is a defect, because they are different CSS properties that
 * tailwind-merge has misfiled into one group.
 */
function expectedSurvivors(tokens) {
  const last = new Map();
  for (const t of tokens) {
    const kind = kindOf(t);
    if (kind) last.set(`${scopeOf(t)}|${kind}`, t);
  }
  return [...last.values()];
}

function lostTextClasses(input) {
  const tokens = input.split(/\s+/).filter(Boolean);
  const out = new Set(cn(input).split(/\s+/).filter(Boolean));
  return expectedSurvivors(tokens).filter((t) => !out.has(t));
}

const files = [];
for (const dir of readdirSync(COMPONENTS)) {
  const d = join(COMPONENTS, dir);
  for (const f of readdirSync(d)) if (f.endsWith(".tsx")) files.push(join(d, f));
}

const failures = [];
for (const step of missing) {
  failures.push(
    `src/lib/utils.ts: tokens.css declares \`--text-${step}\` but FONT_SIZE_STEPS does not list ` +
      `"${step}", so tailwind-merge files \`text-${step}\` as a COLOUR and it deletes, and is ` +
      `deleted by, every colour class beside it`,
  );
}
for (const step of extra) {
  failures.push(
    `src/lib/utils.ts: FONT_SIZE_STEPS lists "${step}" but tokens.css declares no ` +
      `\`--text-${step}\`. A size registered with no token behind it suppresses a real collision.`,
  );
}

for (const path of files.sort()) {
  const rel = path.slice(ROOT.length + 1);
  /* Block comments discuss class names in prose on purpose -- `message-bubble.tsx` names
   * `--accent-foreground` to explain why it is wrong to use. Strip them, keeping newlines so the
   * reported line numbers still point at the right place. */
  const src = readFileSync(path, "utf8").replace(/\/\*[\s\S]*?\*\//g, (m) =>
    m.replace(/[^\n]/g, " "),
  );

  // 1. within one class string
  src.split("\n").forEach((line, i) => {
    for (const s of stringLiterals(line)) {
      for (const c of lostTextClasses(s)) {
        const kind = kindOf(c);
        failures.push(
          `${rel}:${i + 1}: \`${c}\` (font ${kind}) is deleted by cn() from this class string`,
        );
      }
    }
  });

  // 2. cva base against each variant string -- the pairing that only exists at render time
  const cvaCall = src.match(/cva\(\s*(['"])([\s\S]*?)\1\s*,\s*\{([\s\S]*)\n\s*\}\s*,?\s*\)/);
  if (cvaCall) {
    const base = cvaCall[2].replace(/\s+/g, " ").trim();
    if (CLASSY.test(base)) {
      for (const variant of stringLiterals(cvaCall[3])) {
        for (const c of lostTextClasses(`${base} ${variant}`)) {
          failures.push(
            `${rel}: cva base loses \`${c}\` (font ${kindOf(c)}) when merged with the ` +
              `variant \`${variant.slice(0, 48)}…\``,
          );
        }
      }
    }
  }
}

if (failures.length) {
  console.error(`FAIL: cn() silently deletes ${failures.length} class(es)\n`);
  for (const f of failures) console.error(`  - ${f}`);
  console.error(
    `\nThis is almost always a size/colour collision: a \`text-*\` name that is not in\n` +
      `FONT_SIZE_STEPS in src/lib/utils.ts falls through to the text-colour group and\n` +
      `conflicts with every colour role. Add the step there, then run\n` +
      `scripts/verify-type-ramp.py so tokens.css and that list stay in agreement.`,
  );
  process.exit(1);
}

console.log(
  `OK: ${DECLARED.length} font-size steps declared in tokens.css, all ${STEPS.length} registered ` +
    `with tailwind-merge, ${files.length} components scanned, 0 classes silently deleted by cn().`,
);
