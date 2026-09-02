#!/usr/bin/env node
/**
 * Prove JH227's rule: **a dialog holding unsaved input refuses every close gesture this primitive
 * owns**, and — just as important — an ordinary dialog still closes on all of them.
 *
 * The gap JH202 recorded was "Escape always closes. No override in the current code." The second
 * half was already untrue of the Radix-backed port: `DialogContent` spreads `...props` onto
 * `DialogPrimitive.Content`, so `onEscapeKeyDown` was interceptable all along. The defect worth
 * guarding is the one that looks solved — a caller who intercepts Escape **alone** still loses the
 * draft to an overlay click or to the close button in the corner. So every case below runs three
 * times, once per gesture, and the negative cases run without the guard.
 *
 * **Nothing is stubbed and nothing is rendered.** `DialogContent` uses no hooks, so it is called as
 * a plain function and the React element tree it returns is walked for the real
 * `DialogPrimitive.Content` and `DialogPrimitive.Close` elements — the actual props the component
 * passes to Radix, not a recording of a fake. This is stronger than `verify-toast.mjs`'s stub,
 * which existed only because `Toast.Root` consumes `duration` internally and never emits it;
 * here the subject IS the props, so they can simply be read. Rendering is impossible anyway:
 * `DialogPortal` is Radix's `Portal`, which calls `createPortal` and needs a live DOM.
 *
 * The three Radix contracts this relies on were read out of `node_modules`, not assumed
 * (`@radix-ui/react-dialog@1.1.4`, 2026-09-02):
 *
 *   - `react-dismissable-layer`: `onEscapeKeyDown?.(event); if (!event.defaultPrevented) onDismiss()`
 *   - `react-dismissable-layer`: the same `defaultPrevented` gate around `onInteractOutside`, on
 *     both the pointer-down-outside and focus-outside paths
 *   - `react-dialog`: `onClick: composeEventHandlers(props.onClick, () => onOpenChange(false))`,
 *     and `@radix-ui/primitive`'s `composeEventHandlers` defaults `checkForDefaultPrevented` to
 *     `true`
 *
 * That is why "prevented" is the assertion below: preventing the event is exactly and only what
 * makes Radix skip the close.
 *
 * Run:  node scripts/verify-dialog-close-guard.mjs
 * Requires `react` and `esbuild` in `node_modules` — same manual-run caveat as the other node
 * verifiers, since this package has no lockfile.
 *
 * A guard that has never failed is not evidence. Each of these was mutated and re-run before this
 * file was committed; the reverted state is what ships:
 *
 *   - `dialogCloseGuard` dropped its `if (!onCloseAttempt) return null` and always returned
 *     handlers -> 5 fail: both "no guard at all" cases and all three "unguarded dialog still
 *     closes" cases. This is the mutation that matters most -- a permanently-on guard is a dialog
 *     nobody can close, and it is invisible in a diff.
 *   - `block` stopped calling `event.preventDefault()` (still called `onCloseAttempt`) -> 7 fail:
 *     all three pure cases, all three wiring cases, and the composition case, since each asserts
 *     the prevention and not merely the notification. That is the exact shape of a half-fix that
 *     tells the form about the gesture and then closes anyway.
 *   - `onInteractOutside` removed from `DialogPrimitive.Content` -> only the click-outside wiring
 *     case fails; the pure `dialogCloseGuard` case keeps passing. Both exist for that reason: the
 *     pure check proves the decision, the wiring check proves the component uses it.
 *   - `onClick` removed from `DialogPrimitive.Close` -> only the close-button case fails. This is
 *     the gesture a caller reaching for Radix's raw `onEscapeKeyDown` would miss, so it is the one
 *     that must not regress silently.
 *   - `composeGuarded` changed to ignore `callerHandler` -> 2 fail, both composition cases: the
 *     caller's handler stops running at all, so it can no longer pre-empt the guard either.
 *   - `composeGuarded` changed to skip its `defaultPrevented` check -> the "caller who prevents
 *     handles it alone" case fails, i.e. `onCloseAttempt` would fire on top of a caller that had
 *     already dealt with the gesture.
 *   - `onCloseAttempt` left in the `...props` rest instead of destructured out -> the leak case
 *     fails, catching an unknown prop on its way to the DOM.
 */
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { transformSync } from "esbuild";
import * as React from "react";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const { createRequire } = await import("node:module");
const require = createRequire(import.meta.url);
const DialogPrimitive = require("@radix-ui/react-dialog");

function load(relPath) {
  const src = readFileSync(join(ROOT, relPath), "utf8").replace(
    /import \{ cn \} from ['"].*?['"]/,
    "const cn = (...a) => a.filter(Boolean).join(' ')",
  );
  const js = transformSync(src, { loader: "tsx", format: "cjs", jsx: "automatic" }).code;
  const module = { exports: {} };
  const req = (id) => (id === "react" ? React : require(id));
  new Function("module", "exports", "require", js)(module, module.exports, req);
  return module.exports;
}

const { DialogContent, dialogCloseGuard } = load("src/components/ui/dialog.tsx");

let pass = 0;
let fail = 0;
function check(name, ok, detail) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (ok) pass += 1;
  else {
    fail += 1;
    if (detail !== undefined) console.log(`      ${detail}`);
  }
}

/** A DOM event's `preventDefault`/`defaultPrevented` pair, which is all any handler here touches. */
const fakeEvent = () => ({
  defaultPrevented: false,
  preventDefault() {
    this.defaultPrevented = true;
  },
});

/** Depth-first search of a React element tree for the first element of a given type. */
function findByType(node, type) {
  if (!React.isValidElement(node)) return null;
  if (node.type === type) return node;
  let found = null;
  React.Children.forEach(node.props?.children, (child) => {
    if (!found) found = findByType(child, type);
  });
  return found;
}

/** The real props `DialogContent` hands to Radix's `Content` and `Close`, for the given props. */
function wiring(props) {
  const tree = DialogContent({ children: null, ...props });
  const content = findByType(tree, DialogPrimitive.Content);
  const close = content && findByType(content, DialogPrimitive.Close);
  return { content: content?.props, close: close?.props };
}

// ── 0. the walk itself finds what it claims to ──────────────────────────────────────────────
// Without this, every case below could pass vacuously on `undefined`.
{
  const { content, close } = wiring({});
  check("the element walk reaches Radix's Content and Close", Boolean(content && close), {
    content: Boolean(content),
    close: Boolean(close),
  });
}

// ── 1. dialogCloseGuard — pure, no element tree ─────────────────────────────────────────────
check("no onCloseAttempt means no guard at all, not no-op handlers", dialogCloseGuard() === null);
check("an explicit undefined is the same as absent", dialogCloseGuard(undefined) === null);

{
  const guard = dialogCloseGuard(() => {});
  check(
    "a guard covers all three gestures, not just Escape",
    guard !== null &&
      typeof guard.onEscapeKeyDown === "function" &&
      typeof guard.onInteractOutside === "function" &&
      typeof guard.onClick === "function",
    guard && Object.keys(guard).join(","),
  );
}

for (const gesture of ["onEscapeKeyDown", "onInteractOutside", "onClick"]) {
  let calls = 0;
  const guard = dialogCloseGuard(() => (calls += 1));
  const event = fakeEvent();
  guard[gesture](event);
  check(
    `guard.${gesture} prevents the close AND notifies once`,
    event.defaultPrevented === true && calls === 1,
    JSON.stringify({ defaultPrevented: event.defaultPrevented, calls }),
  );
}

// ── 2. wiring — the guard actually reaches Radix, per gesture ───────────────────────────────
const GESTURES = [
  { name: "Escape", surface: "content", prop: "onEscapeKeyDown" },
  { name: "click outside", surface: "content", prop: "onInteractOutside" },
  { name: "the close button", surface: "close", prop: "onClick" },
];

for (const { name, surface, prop } of GESTURES) {
  let calls = 0;
  const handler = wiring({ onCloseAttempt: () => (calls += 1) })[surface]?.[prop];
  const event = fakeEvent();
  handler?.(event);
  check(
    `a guarded dialog refuses ${name}`,
    typeof handler === "function" && event.defaultPrevented === true && calls === 1,
    JSON.stringify({ handler: typeof handler, defaultPrevented: event.defaultPrevented, calls }),
  );
}

// ── 3. the negative path — an ORDINARY dialog still closes on all three ─────────────────────
// The mutation this catches (a guard that is always on) leaves every case in §2 green.
for (const { name, surface, prop } of GESTURES) {
  const handler = wiring({})[surface]?.[prop];
  const event = fakeEvent();
  handler?.(event);
  check(
    `an unguarded dialog still closes on ${name}`,
    event.defaultPrevented === false,
    `handler was ${typeof handler}`,
  );
}

// ── 4. a caller's own handler is composed, never dropped ────────────────────────────────────
{
  let callerCalls = 0;
  let attemptCalls = 0;
  const handler = wiring({
    onCloseAttempt: () => (attemptCalls += 1),
    onEscapeKeyDown: () => (callerCalls += 1),
  }).content.onEscapeKeyDown;
  const event = fakeEvent();
  handler(event);
  check(
    "a caller's own onEscapeKeyDown still runs alongside the guard",
    callerCalls === 1 && attemptCalls === 1 && event.defaultPrevented === true,
    JSON.stringify({ callerCalls, attemptCalls }),
  );
}
{
  let attemptCalls = 0;
  const handler = wiring({
    onCloseAttempt: () => (attemptCalls += 1),
    onEscapeKeyDown: (e) => e.preventDefault(),
  }).content.onEscapeKeyDown;
  handler(fakeEvent());
  check(
    "a caller who prevents the close handles it alone — no double notification",
    attemptCalls === 0,
    `onCloseAttempt fired ${attemptCalls} times`,
  );
}
{
  let callerCalls = 0;
  const handler = wiring({ onEscapeKeyDown: () => (callerCalls += 1) }).content.onEscapeKeyDown;
  handler(fakeEvent());
  check("without a guard, a caller's handler is passed through untouched", callerCalls === 1);
}

// ── 5. onCloseAttempt must not leak to the DOM ──────────────────────────────────────────────
check(
  "onCloseAttempt is consumed here, not forwarded to Radix (and on to the DOM)",
  !("onCloseAttempt" in wiring({ onCloseAttempt: () => {} }).content),
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
