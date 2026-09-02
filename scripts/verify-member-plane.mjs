#!/usr/bin/env node
/**
 * Render the member-plane components and assert the rules their docstrings claim.
 *
 * Two subjects, both of which are only checkable by rendering:
 *
 *   A. `Button`, `Input` and `Textarea` actually APPLY `plane="member"`. This is not a formality —
 *      the first cut of `Button` declared the variant, typed it, and never destructured it, so
 *      `plane` fell into `...props`, leaked onto the DOM node, and was never passed to
 *      `buttonVariants`. `plane="member"` compiled, type-checked, reviewed clean and did nothing.
 *      `tsc` cannot see it: `VariantProps` makes the prop optional and the rest-spread accepts it.
 *   B. `MemberField`'s two house rules, below.
 *
 * Both are house rules with a specific failure mode, and both are the kind that stay true in a
 * docstring long after the code has stopped honouring them:
 *
 *   1. **An error is a message, or it does not exist.** `error=""` or whitespace must produce no
 *      error node AND no `aria-invalid` on the control. A control marked invalid with nothing to
 *      read is a red outline around a blank box, which is what "you have not filled this in yet"
 *      looks like -- the exact error-vs-empty collapse the house rule forbids.
 *   2. **There is no required marker, only an optional one**, per the Onboarding canvas. The
 *      default must be a bare label with `required` on the control; `optional` must flip both
 *      together, since they are one fact and two of them is a way for the label to lie.
 *
 *     node scripts/verify-member-plane.mjs
 *
 * Requires `react`, `react-dom` and `esbuild` in `node_modules` -- same manual-run caveat as
 * `verify-eslint-rule.mjs`, since this package has no lockfile.
 *
 * A guard that has never failed is not evidence, so each was mutated and re-run. Named by the case
 * that caught it, not by index, since the list will grow:
 *
 *   - dropping `.trim() !== ""` from the message test
 *       -> only the WHITESPACE case fails, not the empty-string one. Worth stating rather than
 *          rounding off: `""` is already falsy, so the trim buys exactly one thing -- an error of
 *          spaces, which is what a template or a resolved-to-nothing translation key produces.
 *          That is the realistic way this rule gets broken, and it is the case the trim is for.
 *   - deriving `aria-invalid` from `error != null` instead of from the resolved message
 *       -> the whitespace case fails: a control marked invalid with nothing to read
 *   - rendering the marker when NOT optional (the first cut of this component did exactly this,
 *     which would have labelled every unmarked field "(optional)")
 *       -> both the bare-label case and the optional case fail
 *   - letting the error REPLACE the description
 *       -> the both-shown case fails
 *   - hardcoding `required: true` so `optional` no longer drives it, i.e. two booleans for one fact
 *       -> the optional case fails, on the half where the label would have been lying
 *   - reverting `Button` to not destructuring `plane` (the real bug, caught by writing this file)
 *       -> all four Button member cases fail, including the DOM-leak one
 *
 */
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { transformSync } from "esbuild";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/* Load the .tsx through esbuild with the package's own `cn` stubbed to a plain join: this script
 * is about the component's STRUCTURE, and `verify-class-merge.mjs` owns class resolution. */
function load(relPath) {
  const src = readFileSync(join(ROOT, relPath), "utf8").replace(
    /import \{ cn \} from '.*?'/,
    "const cn = (...a) => a.filter(Boolean).join(' ')",
  );
  const js = transformSync(src, { loader: "tsx", format: "cjs", jsx: "automatic" }).code;
  const module = { exports: {} };
  const req = (id) =>
    id === "react" ? React : require(id);
  new Function("module", "exports", "require", js)(module, module.exports, req);
  return module.exports;
}

const { createRequire } = await import("node:module");
const require = createRequire(import.meta.url);
const { MemberField } = load("src/components/member/field.tsx");
const { Button } = load("src/components/ui/button.tsx");
const { Input } = load("src/components/ui/input.tsx");
const { Textarea } = load("src/components/ui/textarea.tsx");

const TOUCH = "min-h-[var(--touch-min)]";
const planeCases = [
  ["Button plane=member reaches the touch floor", Button, { plane: "member" }, (h) => h.includes(TOUCH)],
  ["Button plane=member reaches the member body size", Button, { plane: "member" }, (h) => h.includes("text-member-body")],
  ["Button plane=member floors width too, for size=icon", Button, { plane: "member", size: "icon" }, (h) => h.includes("min-w-[var(--touch-min)]")],
  ["Button plane does not leak to the DOM as an attribute", Button, { plane: "member" }, (h) => !/ plane=/.test(h)],
  ["Button default stays console: no member classes", Button, {}, (h) => !h.includes("text-member-body") && !h.includes(TOUCH)],
  ["Button default keeps its console size", Button, {}, (h) => h.includes("h-9")],
  ["Input plane=member reaches the touch floor and body size", Input, { plane: "member" }, (h) => h.includes(TOUCH) && h.includes("text-member-body")],
  ["Input default stays console", Input, {}, (h) => h.includes("text-console-base") && !h.includes("text-member-body")],
  ["Textarea plane=member reaches the body size", Textarea, { plane: "member" }, (h) => h.includes("text-member-body")],
  ["Textarea default stays console", Textarea, {}, (h) => h.includes("text-console-base") && !h.includes("text-member-body")],
];

const html = (props) =>
  renderToStaticMarkup(
    React.createElement(MemberField, {
      label: "Mobile number",
      ...props,
      children: (field) => React.createElement("input", { ...field, type: "tel" }),
    }),
  );

const cases = [
  ["default: bare label, no marker", {}, (h) => !h.includes("(optional)")],
  ["default: control is required", {}, (h) => h.includes("required=\"\"")],
  [
    'error="" renders no error node',
    { error: "" },
    (h) => !h.includes('role="alert"'),
  ],
  [
    'error="   " renders no error node AND no aria-invalid',
    { error: "   " },
    (h) => !h.includes('role="alert"') && !h.includes("aria-invalid"),
  ],
  [
    "a real error renders an alert AND marks the control invalid",
    { error: "Enter a mobile number." },
    (h) =>
      h.includes('role="alert"') &&
      h.includes("Enter a mobile number.") &&
      h.includes('aria-invalid="true"'),
  ],
  [
    "optional: marker shown AND control not required",
    { optional: true },
    (h) => h.includes("(optional)") && !h.includes("required=\"\""),
  ],
  [
    "description and error are BOTH shown, error last",
    { description: "For refill updates.", error: "Enter a mobile number." },
    (h) =>
      h.includes("For refill updates.") &&
      h.indexOf("For refill updates.") < h.indexOf("Enter a mobile number."),
  ],
  [
    "aria-describedby names both messages",
    { description: "For refill updates.", error: "Enter a mobile number." },
    (h) => {
      const m = h.match(/aria-describedby="([^"]*)"/);
      return m !== null && m[1].split(" ").length === 2;
    },
  ],
  [
    "aria-describedby is absent when there is nothing to describe",
    {},
    (h) => !h.includes("aria-describedby"),
  ],
  [
    "the label points at the control",
    {},
    (h) => {
      const f = h.match(/for="([^"]*)"/);
      return f !== null && h.includes(`id="${f[1]}"`);
    },
  ],
];

let pass = 0;
let fail = 0;

for (const [name, Comp, props, assertion] of planeCases) {
  const out = renderToStaticMarkup(React.createElement(Comp, props));
  const ok = assertion(out);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (ok) pass += 1;
  else {
    fail += 1;
    console.log(`      ${out}`);
  }
}

for (const [name, props, assertion] of cases) {
  const out = html(props);
  const ok = assertion(out);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (!ok) {
    fail += 1;
    console.log(`      ${out}`);
  } else pass += 1;
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
