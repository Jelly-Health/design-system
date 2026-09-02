#!/usr/bin/env node
/**
 * Render the member-plane components and assert the rules their docstrings claim.
 *
 * Two subjects, both of which are only checkable by rendering:
 *
 *   A. `Button`, `Input`, `Textarea` and, since JH224, `Toast` (via `ToastClose`/`ToastAction` —
 *      `Toast` itself needs a mounted Radix viewport ref to render at all, see the case comments
 *      below) actually APPLY `plane="member"`. This is not a formality —
 *      the first cut of `Button` declared the variant, typed it, and never destructured it, so
 *      `plane` fell into `...props`, leaked onto the DOM node, and was never passed to
 *      `buttonVariants`. `plane="member"` compiled, type-checked, reviewed clean and did nothing.
 *      `tsc` cannot see it: `VariantProps` makes the prop optional and the rest-spread accepts it.
 *   B. `MemberField`'s two house rules, below.
 *   C. Since JH222, that the five remaining primitives took the axis too -- and, for the parts
 *      that cannot be rendered here at all, that they at least destructure it. See the JH222
 *      block at the end of this comment for why that distinction is load-bearing.
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
 * JH222 added `Label`, `SelectTrigger` and `SelectItem`. Their mutations, same discipline:
 *
 *   - `Label` in the exact JH212 shape -- `plane` declared and typed, never destructured, never
 *     used (all three edits, since removing only the destructure leaves `data-plane={plane}`
 *     referencing a name that no longer exists and the script dies on a ReferenceError instead)
 *       -> 3 fail: the member case, the DOM-leak case, and the destructure case
 *   - `SelectTrigger` not destructuring `plane`
 *       -> 7 fail, including the console-equivalence case, which throws rather than compares
 *   - `SelectItem` in the exact JH212 shape
 *       -> 1 fail, and it is the SOURCE check, not a rendered one. Worth stating plainly: this is
 *          the case that justifies the destructure check existing at all. `SelectItem` renders
 *          through a Portal and produces NO server-rendered DOM -- verified, not assumed -- so
 *          every render-based assertion above is structurally blind to it. Without the source
 *          check this mutation is silent, which is precisely the shape #16 shipped.
 *   - `Label` console variant emptied of `text-console-sm`
 *       -> 2 fail: the console case, and equivalence (11 before, 10 after, lost text-console-sm)
 *   - `Label` member variant pointed back at the console token   -> 1 (the member case)
 *   - `SelectTrigger` console variant loses `data-[size=sm]:h-8`
 *       -> 1, equivalence only (37 vs 36). No rendered case looks at the `sm` step, so the diff
 *          against `origin/main` is the only thing standing between a dropped class and a clean
 *          review -- which is the whole argument for comparing against the ref instead of against
 *          a list of expectations retyped here
 *   - `SelectTrigger` member variant keeping `data-[size=default]:h-9` too -> 1
 *   - `SelectItem` member variant losing the touch floor                   -> 1
 *
 * JH229 re-based the console-equivalence baseline off the live `origin/main` and onto frozen
 * pre-axis data (see the block above `PRE_AXIS_CONSOLE`). Every mutation above still fails exactly
 * the cases it did. These were added, each applied alone to an otherwise-passing tree:
 *
 *   - `Label` console emptied of `text-console-sm`, with the BASELINE REF HOLDING THE SAME BYTES
 *     as the working tree -- i.e. the regression has already merged, which is the state every
 *     clean checkout of `main` is in
 *       -> the old check: `PASS  Label plane=console is class-identical to origin/main (10 before,
 *          10 after)`. On a tree that has lost the class. The baseline moved with the code, so the
 *          two agreed about the wrong thing.
 *          The frozen check: `FAIL ... (11 before, 10 after -- lost [text-console-sm])`.
 *          That pair of lines is the whole of JH229, and it is why this baseline is data.
 *   - `SelectTrigger` console losing `data-[size=sm]:h-8`  -> 1, equivalence only (37 vs 36)
 *   - `SelectItem` console losing `text-console-sm`        -> 2, incl. equivalence (24 vs 23)
 *
 * ⚠️ Before JH229, on a clean checkout of `main`, ZERO of the six console-equivalence cases could
 * fail: five compared the tree against a copy of itself, and the sixth was reading the wrong
 * component entirely. Now six of six can. If a change here ever drops that number back toward
 * zero, it is the same defect returning, whatever it is called.
 *
 * Negative control: the unmodified tree -> 63 passed, 0 failed, rc=0.
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
    /import \{ cn \} from ['"].*?['"]/,
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

/* The class list of the element carrying `data-slot="<slot>"`. The compound primitives cannot be
 * rendered alone (Radix throws "`SelectTrigger` must be used within `Select`"), so their cases
 * render the whole subtree and pick the one element under test back out of it. */
/* React escapes `&`, `'` and `"` on the way into the attribute, so a class the source writes as
 * `[&_svg]:shrink-0` comes back as `[&amp;_svg]:shrink-0`. Undo it, so what this returns is what
 * the component actually says -- which is what makes the frozen baseline below greppable against
 * the source instead of being a wall of entities nobody can check by eye. `&amp;` is decoded LAST,
 * or a literal `&amp;#x27;` would decode twice. */
const unescapeHtml = (s) =>
  s
    .replace(/&(?:#39|#x27|apos);/g, "'")
    .replace(/&(?:quot|#34);/g, '"')
    .replace(/&(?:amp|#38);/g, "&");

function classesOf(html, slot) {
  const m = html.match(new RegExp(`data-slot="${slot}"[^>]*?\\bclass="([^"]*)"`));
  if (m === null) throw new Error(`no element with data-slot="${slot}" in: ${html.slice(0, 300)}`);
  return unescapeHtml(m[1]);
}

const setOf = (classes) => new Set(classes.split(/\s+/).filter(Boolean));

const { MemberField } = load("src/components/member/field.tsx");
const { Button } = load("src/components/ui/button.tsx");
const { Input } = load("src/components/ui/input.tsx");
const { Textarea } = load("src/components/ui/textarea.tsx");
const { ToastClose, ToastAction, toastVariants } = load("src/components/ui/toast.tsx");
const { Label } = load("src/components/ui/label.tsx");
const Sel = load("src/components/ui/select.tsx");
const { Checkbox } = load("src/components/ui/checkbox.tsx");
const { Switch } = load("src/components/ui/switch.tsx");
const RG = load("src/components/ui/radio-group.tsx");

const TOUCH = "min-h-[var(--touch-min)]";
/* The hit-target three floor differently from the type-and-height two: they expand a centred
 * pseudo-element rather than growing the box, so the marker to look for is the pseudo's size and
 * the reserved footprint, not `min-h`. See `checkbox.tsx`'s docstring. */
const HIT = "before:size-[var(--touch-min)]";
const FOOTPRINT = /\bm[xy]?-\[calc\(\(var\(--touch-min\)-[^\]]+\)\/2\)\]/;
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
  // Toast (JH224) takes the same axis as the table in README § "Reaching for the right thing":
  // two densities of one component, never a forked copy. `<Toast>` itself can't be rendered here
  // -- Radix's `ToastImpl` returns null without a mounted `<Toast.Viewport>` ref, which
  // `renderToStaticMarkup` never fires -- so this exercises the two pieces that render standalone
  // (`ToastClose`, `ToastAction`); `scripts/verify-toast.mjs` covers `toastVariants` and the rest
  // of the component directly, including the `duration` (never-auto-dismiss-on-error) rule.
  ["ToastClose plane=member reaches the touch floor", ToastClose, { plane: "member" }, (h) => h.includes(TOUCH)],
  ["ToastClose default stays console: no touch floor", ToastClose, {}, (h) => !h.includes(TOUCH)],
  ["ToastClose plane does not leak to the DOM as an attribute", ToastClose, { plane: "member" }, (h) => !/ plane=/.test(h)],
  ["ToastAction plane=member reaches the member caption size", ToastAction, { plane: "member", altText: "Retry" }, (h) => h.includes("text-member-caption")],
  ["ToastAction default stays console", ToastAction, { altText: "Retry" }, (h) => h.includes("text-console-sm") && !h.includes("text-member-caption")],
  // Label (JH222) is the type-only half of the plane: a label has no hit target worth flooring,
  // so `member` moves 12px to the member body ramp and does nothing else.
  ["Label plane=member reaches the member body size", Label, { plane: "member" }, (h) => h.includes("text-member-body")],
  ["Label default stays console", Label, {}, (h) => h.includes("text-console-sm") && !h.includes("text-member-body")],
  ["Label plane does not leak to the DOM as an attribute", Label, { plane: "member" }, (h) => !/ plane=/.test(h)],
  // The hit-target three (JH222). Each asserts three separate things, because "it got bigger" is
  // the failure this design exists to avoid: the hit area expands, the footprint is reserved so a
  // stacked group cannot overlap, and the PAINTED size is untouched.
  ["Checkbox plane=member expands the hit area to the floor", Checkbox, { plane: "member" }, (h) => h.includes(HIT)],
  ["Checkbox plane=member reserves the footprint", Checkbox, { plane: "member" }, (h) => FOOTPRINT.test(h)],
  ["Checkbox plane=member leaves the painted box at size-4", Checkbox, { plane: "member" }, (h) => / size-4 /.test(h) && !/ size-\[var\(--touch-min\)\]/.test(h)],
  ["Checkbox default stays console: no hit box, no footprint", Checkbox, {}, (h) => !h.includes(HIT) && !FOOTPRINT.test(h) && !h.includes("before:")],
  ["Checkbox plane does not leak to the DOM as an attribute", Checkbox, { plane: "member" }, (h) => !/ plane=/.test(h)],
  ["Switch plane=member expands the hit area to the floor", Switch, { plane: "member" }, (h) => h.includes(HIT)],
  // The switch is short of the floor on both axes by DIFFERENT amounts, so it reserves
  // asymmetrically -- a single `m-` would look right and measure wrong on one axis.
  ["Switch plane=member reserves both axes separately", Switch, { plane: "member" }, (h) => /my-\[calc\(\(var\(--touch-min\)-1\.15rem\)\/2\)\]/.test(h) && /mx-\[calc\(\(var\(--touch-min\)-2rem\)\/2\)\]/.test(h)],
  ["Switch plane=member leaves the painted track at h-[1.15rem] w-8", Switch, { plane: "member" }, (h) => h.includes("h-[1.15rem]") && h.includes("w-8")],
  ["Switch default stays console: no hit box, no footprint", Switch, {}, (h) => !h.includes(HIT) && !FOOTPRINT.test(h) && !h.includes("before:")],
  ["Switch plane does not leak to the DOM as an attribute", Switch, { plane: "member" }, (h) => !/ plane=/.test(h)],
];

/* ── Compound primitives (JH222) ─────────────────────────────────────────────────────────────
 * `SelectTrigger`, `SelectItem` and `RadioGroupItem` throw outside their Root, so each case
 * renders the Root subtree and `classesOf` picks the element under test back out. Cases are
 * `[name, () => html, slot, assertion]` -- the assertion receives the CLASS LIST of that one
 * element, not the whole markup, so a class landing on the wrong sub-part cannot satisfy it. */
const inRadioGroup = (props) =>
  renderToStaticMarkup(
    React.createElement(RG.RadioGroup, {}, React.createElement(RG.RadioGroupItem, { value: "a", ...props })),
  );

const inSelect = (part, props) =>
  renderToStaticMarkup(
    React.createElement(Sel.Select, { open: true }, React.createElement(part, props, "Option")),
  );

const compoundCases = [
  ["SelectTrigger plane=member reaches the touch floor", () => inSelect(Sel.SelectTrigger, { plane: "member" }), "select-trigger", (c) => c.includes(TOUCH)],
  ["SelectTrigger plane=member reaches the member body size", () => inSelect(Sel.SelectTrigger, { plane: "member" }), "select-trigger", (c) => c.includes("text-member-body")],
  // The member plane must not also carry the console density ramp: `size` is a console-only knob
  // and both its steps are below the floor -- see the component docstring.
  ["SelectTrigger plane=member drops the console size ramp", () => inSelect(Sel.SelectTrigger, { plane: "member" }), "select-trigger", (c) => !c.includes("data-[size=default]:h-9") && !c.includes("data-[size=sm]:h-8")],
  ["SelectTrigger default stays console", () => inSelect(Sel.SelectTrigger, {}), "select-trigger", (c) => c.includes("text-console-sm") && c.includes("data-[size=default]:h-9") && !c.includes("text-member-body")],
  ["SelectTrigger plane does not leak to the DOM as an attribute", () => inSelect(Sel.SelectTrigger, { plane: "member" }), "select-trigger", (_c, h) => !/ plane=/.test(h)],
  ["RadioGroupItem plane=member expands the hit area to the floor", () => inRadioGroup({ plane: "member" }), "radio-group-item", (c) => c.includes(HIT)],
  ["RadioGroupItem plane=member reserves the footprint", () => inRadioGroup({ plane: "member" }), "radio-group-item", (c) => FOOTPRINT.test(c)],
  ["RadioGroupItem plane=member leaves the painted box at size-4", () => inRadioGroup({ plane: "member" }), "radio-group-item", (c) => /(^| )size-4( |$)/.test(c)],
  ["RadioGroupItem default stays console: no hit box, no footprint", () => inRadioGroup({}), "radio-group-item", (c) => !c.includes(HIT) && !FOOTPRINT.test(c) && !c.includes("before:")],
  ["RadioGroupItem plane does not leak to the DOM as an attribute", () => inRadioGroup({ plane: "member" }), "radio-group-item", (_c, h) => !/ plane=/.test(h)],
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
for (const [name, render, slot, assertion] of compoundCases) {
  let ok = false;
  let detail = "";
  try {
    const out = render();
    detail = out;
    ok = assertion(classesOf(out, slot), out);
  } catch (e) {
    detail = `threw: ${e.message}`;
  }
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (ok) pass += 1;
  else {
    fail += 1;
    console.log(`      ${detail.slice(0, 400)}`);
  }
}

/* ── Console equivalence against the frozen pre-axis baseline (JH222, re-based JH229) ───────
 * The 100% of call sites that are console today must render exactly what they rendered before the
 * axis existed. Giving a primitive a plane means MOVING classes out of a base string into a
 * `console` variant, and a class dropped or fat-fingered on the way is invisible in review -- the
 * component still compiles and still looks approximately right.
 *
 * 🔴 THE BASELINE BELOW IS FROZEN DATA, AND THAT IS THE ENTIRE POINT OF JH229.
 *
 * It used to be read live, with `git show origin/main:<path>`. That was correct for exactly as
 * long as JH222 was an unmerged branch: the moment JH222 merged, `origin/main` BECAME the after
 * state, and five of these six cases were comparing the working tree against itself. They did not
 * go red -- they went VACUOUS. `62 passed, 1 failed` with five of the passes proving nothing.
 *
 * `git merge-base HEAD origin/main` is the tempting fix and it is the same bug wearing a hat: on a
 * branch cut from `origin/main` that touches no primitive, the merge-base IS `HEAD`, so the
 * baseline is once again the thing under test. A check whose notion of the truth comes from its
 * own subject cannot fail, and it passes exactly as convincingly as a real one.
 *
 * So the expectation is ABSOLUTE. These are the classes each primitive shipped with at `6472904`
 * -- the last commit before the plane axis existed, i.e. the first parent of JH222's merge. They
 * were captured by RENDERING that ref, not retyped from it. Re-derive any row with:
 *
 *     git show 6472904:src/components/ui/<file>.tsx
 *
 * Compared as SETS, so order and duplicates do not matter: cva emits the variant's classes after
 * the base string, so the order legitimately changes while the content must not. This is the check
 * #16 ran by hand for `Input` (34 before, 34 after, empty symmetric difference), made permanent.
 *
 * ⚠️ A red case here means the console plane MOVED. Fix the component; or, if the change is
 * genuinely intended, edit these classes in the same commit so the diff shows a human deciding it.
 * Re-pointing this at any moving ref to turn it green re-creates the JH229 defect exactly.
 *
 * Verified while fixing JH229: nothing had actually drifted between `6472904` and `b264d78`. The
 * guard had stopped being able to see, not stopped being satisfied. */
const PRE_AXIS_CONSOLE = {
  // Label -- 11 classes
  Label: `
    flex font-medium gap-2 group-data-[disabled=true]:opacity-50
    group-data-[disabled=true]:pointer-events-none items-center leading-none
    peer-disabled:cursor-not-allowed peer-disabled:opacity-50 select-none text-console-sm
  `,
  // SelectTrigger -- 37 classes
  SelectTrigger: `
    *:data-[slot=select-value]:flex *:data-[slot=select-value]:gap-2
    *:data-[slot=select-value]:items-center *:data-[slot=select-value]:line-clamp-1
    [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground
    [&_svg]:pointer-events-none [&_svg]:shrink-0 aria-invalid:border-destructive
    aria-invalid:ring-destructive/20 bg-transparent border border-input
    dark:aria-invalid:ring-destructive/40 dark:bg-input/30 dark:hover:bg-input/50
    data-[placeholder]:text-muted-foreground data-[size=default]:h-9 data-[size=sm]:h-8
    disabled:cursor-not-allowed disabled:opacity-50 flex focus-visible:border-ring
    focus-visible:ring-[3px] focus-visible:ring-ring/50 gap-2 items-center justify-between
    outline-none px-3 py-2 rounded-md shadow-xs text-console-sm transition-[color,box-shadow]
    w-fit whitespace-nowrap
  `,
  // SelectItem -- 24 classes
  SelectItem: `
    *:[span]:last:flex *:[span]:last:gap-2 *:[span]:last:items-center
    [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground
    [&_svg]:pointer-events-none [&_svg]:shrink-0 cursor-default data-[disabled]:opacity-50
    data-[disabled]:pointer-events-none flex focus:bg-accent focus:text-accent-foreground gap-2
    items-center outline-hidden pl-2 pr-8 py-1.5 relative rounded-sm select-none text-console-sm
    w-full
  `,
  // Checkbox -- 22 classes
  Checkbox: `
    aria-invalid:border-destructive aria-invalid:ring-destructive/20 border border-input
    dark:aria-invalid:ring-destructive/40 dark:bg-input/30 dark:data-[state=checked]:bg-primary
    data-[state=checked]:bg-primary data-[state=checked]:border-primary
    data-[state=checked]:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50
    focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none
    peer rounded-[4px] shadow-xs shrink-0 size-4 transition-shadow
  `,
  // Switch -- 20 classes
  Switch: `
    border border-transparent dark:data-[state=unchecked]:bg-input/80
    data-[state=checked]:bg-primary data-[state=unchecked]:bg-input disabled:cursor-not-allowed
    disabled:opacity-50 focus-visible:border-ring focus-visible:ring-[3px]
    focus-visible:ring-ring/50 h-[1.15rem] inline-flex items-center outline-none peer
    rounded-full shadow-xs shrink-0 transition-all w-8
  `,
  // RadioGroupItem -- 19 classes
  RadioGroupItem: `
    aria-invalid:border-destructive aria-invalid:ring-destructive/20 aspect-square border
    border-input dark:aria-invalid:ring-destructive/40 dark:bg-input/30
    disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring
    focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none rounded-full shadow-xs
    shrink-0 size-4 text-primary transition-[color,box-shadow]
  `,
};

const equivalenceCases = [
  ["Label", "src/components/ui/label.tsx", (m) => renderToStaticMarkup(React.createElement(m.Label, {}, "x")), "label"],
  ["SelectTrigger", "src/components/ui/select.tsx", (m) => renderToStaticMarkup(React.createElement(m.Select, { open: true }, React.createElement(m.SelectTrigger, {}, "x"))), "select-trigger"],
  ["Checkbox", "src/components/ui/checkbox.tsx", (m) => renderToStaticMarkup(React.createElement(m.Checkbox, {})), "checkbox"],
  ["Switch", "src/components/ui/switch.tsx", (m) => renderToStaticMarkup(React.createElement(m.Switch, {})), "switch"],
  ["RadioGroupItem", "src/components/ui/radio-group.tsx", (m) => renderToStaticMarkup(React.createElement(m.RadioGroup, {}, React.createElement(m.RadioGroupItem, { value: "a" }))), "radio-group-item"],
];

for (const [name, relPath, render, slot] of equivalenceCases) {
  let ok = false;
  let detail = "";
  try {
    const before = setOf(PRE_AXIS_CONSOLE[name]);
    const after = setOf(classesOf(render(load(relPath)), slot));
    const lost = [...before].filter((c) => !after.has(c));
    const gained = [...after].filter((c) => !before.has(c));
    ok = lost.length === 0 && gained.length === 0;
    detail = `${before.size} before, ${after.size} after` +
      (ok ? "" : ` -- lost [${lost.join(" ")}] gained [${gained.join(" ")}]`);
  } catch (e) {
    detail = `threw: ${e.message}`;
  }
  console.log(`${ok ? "PASS" : "FAIL"}  ${name} plane=console matches the pre-axis baseline (${detail})`);
  if (ok) pass += 1;
  else fail += 1;
}

/* ── Parts that never reach server-rendered DOM (JH222) ──────────────────────────────────────
 * `SelectItem` renders through `SelectPrimitive.Portal`, which produces nothing under
 * `renderToStaticMarkup` -- verified, not assumed: rendering `Select > SelectContent > SelectItem`
 * yields markup with no `data-slot="select-item"` in it at all. Same shape as `Toast` above.
 *
 * So it is proved in two decidable pieces instead of one rendered one:
 *   a. the variant table resolves correctly, read off the exported cva function; and
 *   b. the component actually DESTRUCTURES `plane` and hands it to that function.
 * (b) is the half that matters, because (a) alone is exactly what passed review in #16 while the
 * component did nothing -- a correct variant table wired to no one. */
const itemConsole = setOf(Sel.selectItemVariants({}));
const itemMember = setOf(Sel.selectItemVariants({ plane: "member" }));

/* `SelectItem` uses the same frozen baseline as the rendered cases above, which is the second
 * thing JH229 fixed. It used to scrape `origin/main`'s source for the class literal in the `cn(...)`
 * after its `data-slot`, because the pre-axis component had no cva function to call. Once JH222
 * merged, that literal no longer existed -- `SelectItem` now reads `cn(selectItemVariants({ plane }),
 * className)` -- so the regex slid PAST it to the next `cn("...")` in the file and silently scraped
 * `SelectSeparator` instead. That is why this one case was red while the five above were green: it
 * was comparing `SelectItem` against a horizontal rule (`bg-border pointer-events-none -mx-1 my-1
 * h-px`, 5 classes). Not self-reference but a wrong subject -- and a check reading the wrong subject
 * is worse than one reading none, because its failure looks like a real finding. */

const derivedCases = [
  ["SelectItem plane=member reaches the touch floor", () => itemMember.has(TOUCH)],
  ["SelectItem plane=member reaches the member body size", () => itemMember.has("text-member-body")],
  ["SelectItem default stays console", () => itemConsole.has("text-console-sm") && !itemConsole.has("text-member-body")],
  /* Reported with its counts, like the rendered equivalence cases above, so the number never has
   * to be recalled or guessed by anyone quoting this check. */
  () => {
      const before = setOf(PRE_AXIS_CONSOLE.SelectItem);
      const lost = [...before].filter((c) => !itemConsole.has(c));
      const gained = [...itemConsole].filter((c) => !before.has(c));
      const ok = lost.length === 0 && gained.length === 0;
      return [
        `SelectItem plane=console matches the pre-axis baseline (${before.size} before, ` +
          `${itemConsole.size} after` +
          (ok ? ")" : ` -- lost [${lost.join(" ")}] gained [${gained.join(" ")}])`),
      ok,
    ];
  },
];

/* The destructure check, applied to every component that claims a plane. This is the JH212 bug
 * stated directly: `plane` declared and typed but left in `...props` compiles, type-checks and
 * does nothing. `VariantProps` makes it optional and the rest-spread swallows it, so `tsc` is
 * blind to it -- the only signals are the rendered DOM (used above where it exists) and the
 * source itself (used here where it does not). */
function destructures(src, fnName) {
  const m = src.match(new RegExp(`function ${fnName}\\(\\{([^}]*)\\}`));
  return m !== null && /(^|[\s,])plane([\s,]|$)/.test(m[1]);
}

const planedComponents = [
  ["Label", "src/components/ui/label.tsx", "Label", "labelVariants"],
  ["SelectTrigger", "src/components/ui/select.tsx", "SelectTrigger", "selectTriggerVariants"],
  ["SelectItem", "src/components/ui/select.tsx", "SelectItem", "selectItemVariants"],
  ["Checkbox", "src/components/ui/checkbox.tsx", "Checkbox", "checkboxVariants"],
  ["Switch", "src/components/ui/switch.tsx", "Switch", "switchVariants"],
  ["RadioGroupItem", "src/components/ui/radio-group.tsx", "RadioGroupItem", "radioGroupItemVariants"],
];

for (const [name, relPath, fnName, cvaName] of planedComponents) {
  const src = readFileSync(join(ROOT, relPath), "utf8");
  const ok = destructures(src, fnName) && new RegExp(`${cvaName}\\(\\{ plane \\}\\)`).test(src);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name} destructures plane AND passes it to ${cvaName}`);
  if (ok) pass += 1;
  else fail += 1;
}

for (const entry of derivedCases) {
  /* An entry is either `[name, () => boolean]` or a single `() => [name, boolean]` -- the latter
   * for cases that want to report the numbers they actually measured. */
  let name;
  let ok = false;
  try {
    if (typeof entry === "function") [name, ok] = entry();
    else { [name] = entry; ok = entry[1](); }
  } catch (e) {
    name = name ?? "derived case";
    ok = false;
  }
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (ok) pass += 1;
  else fail += 1;
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
