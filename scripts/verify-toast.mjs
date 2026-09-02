#!/usr/bin/env node
/**
 * Prove the two rules JH224's card calls "the whole point of the component" — neither is visible
 * in a diff, and neither survives being merely asserted once.
 *
 *   1. **An error toast must never auto-dismiss.** `getToastDuration("error", plane)` must return
 *      `Infinity` for both planes, and `<Toast tier="error">` must actually PASS that value to
 *      `@radix-ui/react-toast`'s `Root`, not just compute it and drop it on the floor.
 *   2. **The stacking/replace rule**: console shows up to 3 (newest nearest the corner, the rest
 *      collapsed into a count); member shows at most 1, and a new one replaces rather than joins.
 *
 * Both are pure functions (`getToastDuration`, `planeVisibility` in `toast.tsx`) specifically so
 * they are provable without mounting a browser — same reason `verify-weight-computed.mjs` proves
 * a CSS binding by perturbing a value rather than reading the file and hoping.
 *
 * Rendered assertions below (tier icon/colour, close hit target, action size, the `duration`
 * wiring) use the `renderToStaticMarkup` + esbuild-transform pattern from
 * `verify-member-plane.mjs`, with `cn` stubbed to a plain join for the same reason: this file is
 * about the component's STRUCTURE and prop wiring, not about tailwind-merge's conflict
 * resolution, which `verify-class-merge.mjs` already owns.
 *
 * `Toast.Root`'s `duration` prop is consumed internally by Radix and never spread to the DOM, so
 * no amount of string-matching the rendered HTML can prove it was passed through correctly.
 * `@radix-ui/react-toast` is therefore stubbed at ONE point only — `Root` — wrapping the real
 * component just enough to record the `duration` it actually receives, so the wiring between
 * `getToastDuration` and Radix is provable the same way the value itself is: directly, not by
 * inference from markup.
 *
 * ⚠️ `<Toast>`'s own rendered HTML is unreachable by `renderToStaticMarkup` at all -- Radix's
 * `ToastImpl` returns `null` until `context.viewport` is set, and that only happens through a REF
 * CALLBACK on a mounted `<Toast.Viewport>`; refs never fire during static string rendering. Plane
 * class checks (text size) are made against `toastVariants` directly instead, the same pure
 * function `<Toast>` calls to build its className -- not a workaround, the same reasoning as
 * testing `getToastDuration` standalone rather than trying to read a timer off a string.
 *
 * Run:  node scripts/verify-toast.mjs
 * Requires `react`, `react-dom`, `@radix-ui/react-toast` and `esbuild` in `node_modules` — same
 * manual-run caveat as `verify-member-plane.mjs` and `verify-eslint-rule.mjs`, since this package
 * has no lockfile.
 *
 * A guard that has never failed is not evidence. Each of these was mutated and re-run before this
 * file was committed:
 *
 *   - `getToastDuration`'s `tier === "error"` branch changed to `return 4000` instead of
 *     `Infinity` -> both "error never auto-dismisses" cases fail, and the Root-wiring case fails
 *     too, since it reads the SAME function.
 *   - `<Toast>` stopped passing `duration={getToastDuration(...)}` to `ToastPrimitive.Root`
 *     (reverted to Radix's own 5000ms default) -> the Root-wiring case fails while the two pure
 *     `getToastDuration` cases keep passing, which is why both exist: the pure check proves the
 *     decision is right, the wiring check proves the component actually uses it.
 *   - `planeVisibility`'s member cap changed from 1 to 3 -> the member-replaces case fails.
 *   - `planeVisibility` changed to slice from the front (`records.slice(0, cap)`) instead of the
 *     end -> the "newest nearest the corner" case fails, since the newest (last-pushed) record
 *     drops out of `visible` instead of the oldest.
 *   - `superseded` changed to `plane === "member" ? [] : overflow` (i.e. swapped with
 *     `hiddenCount`'s condition) -> the "supersedes nothing on console" and "gone, not queued on
 *     member" cases both fail, in opposite directions -- exactly the bug this would be: a member
 *     toast that never gets cleaned up (leaks, and can resurface) and a console toast that gets
 *     destroyed instead of queued (the "+N more" chip would undercount).
 */
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { transformSync } from "esbuild";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const { createRequire } = await import("node:module");
const require = createRequire(import.meta.url);
const RealToastPrimitive = require("@radix-ui/react-toast");

let capturedRootProps = null;
function CapturingRoot(props) {
  capturedRootProps = props;
  return React.createElement(RealToastPrimitive.Root, props);
}
const StubbedToastPrimitive = { ...RealToastPrimitive, Root: CapturingRoot };

function load(relPath) {
  const src = readFileSync(join(ROOT, relPath), "utf8").replace(
    /import \{ cn \} from ['"].*?['"]/,
    "const cn = (...a) => a.filter(Boolean).join(' ')",
  );
  const js = transformSync(src, { loader: "tsx", format: "cjs", jsx: "automatic" }).code;
  const module = { exports: {} };
  const req = (id) => {
    if (id === "react") return React;
    if (id === "@radix-ui/react-toast") return StubbedToastPrimitive;
    return require(id);
  };
  new Function("module", "exports", "require", js)(module, module.exports, req);
  return module.exports;
}

const {
  Toast,
  ToastProvider,
  ToastIcon,
  ToastAction,
  ToastClose,
  toastVariants,
  getToastDuration,
  planeVisibility,
} = load("src/components/ui/toast.tsx");

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

// ── 1. getToastDuration — pure, no rendering ────────────────────────────────────────────────
check("error never auto-dismisses on console", getToastDuration("error", "console") === Infinity);
check("error never auto-dismisses on member", getToastDuration("error", "member") === Infinity);
check("info auto-dismisses at 4s on console", getToastDuration("info", "console") === 4000);
check("info auto-dismisses at 5s on member", getToastDuration("info", "member") === 5000);

// ── 2. planeVisibility — pure, no rendering ─────────────────────────────────────────────────
const ids = (n) => Array.from({ length: n }, (_, i) => ({ id: String(i) }));

{
  const { visible, hiddenCount } = planeVisibility(ids(5), "console");
  check(
    "console shows up to 3, newest nearest the corner",
    visible.map((r) => r.id).join(",") === "2,3,4" && hiddenCount === 2,
    JSON.stringify({ visible, hiddenCount }),
  );
}
{
  const { visible, hiddenCount } = planeVisibility(ids(2), "console");
  check(
    "console with fewer than 3 shows all, no collapse",
    visible.map((r) => r.id).join(",") === "0,1" && hiddenCount === 0,
  );
}
{
  const { visible, hiddenCount, superseded } = planeVisibility(ids(3), "member");
  check(
    "member shows only the newest — a second toast replaces the first",
    visible.map((r) => r.id).join(",") === "2" && hiddenCount === 0,
  );
  check(
    "the toasts a new one replaces are SUPERSEDED (gone), not queued",
    superseded.map((r) => r.id).join(",") === "0,1",
    JSON.stringify({ visible, hiddenCount, superseded }),
  );
}
{
  const { visible, hiddenCount, superseded } = planeVisibility(ids(1), "member");
  check(
    "member shows a single toast when there's only one, and supersedes nothing",
    visible.length === 1 && hiddenCount === 0 && superseded.length === 0,
  );
}
{
  const { hiddenCount, superseded } = planeVisibility(ids(5), "console");
  check("console never supersedes — overflow is queued, not destroyed", superseded.length === 0);
}

// ── 3. duration actually reaches Radix's Root, not just computed ───────────────────────────
function renderToast(props) {
  capturedRootProps = null;
  const html = renderToStaticMarkup(
    React.createElement(
      ToastProvider,
      null,
      React.createElement(
        Toast,
        { plane: "console", tier: "info", open: true, ...props },
        React.createElement(ToastIcon, { tier: props.tier ?? "info" }),
      ),
    ),
  );
  return { html, duration: capturedRootProps?.duration };
}

check(
  "Toast tier=error passes Infinity to Radix's Root.duration",
  renderToast({ tier: "error" }).duration === Infinity,
  `got ${renderToast({ tier: "error" }).duration}`,
);
check(
  "Toast tier=info plane=console passes 4000 to Radix's Root.duration",
  renderToast({ tier: "info", plane: "console" }).duration === 4000,
);
check(
  "Toast tier=info plane=member passes 5000 to Radix's Root.duration",
  renderToast({ tier: "info", plane: "member" }).duration === 5000,
);

// ── 4. plane classes, via toastVariants directly ────────────────────────────────────────────
// `<Toast>`'s own rendered HTML can't be used for this: Radix's `ToastImpl` returns `null` until
// `context.viewport` is set, and that only happens through a REF CALLBACK on a mounted
// `<Toast.Viewport>` -- refs never fire under `renderToStaticMarkup`, so the toast's body content
// is unreachable by string-matching no matter what wraps it. Confirmed by inspection of
// `@radix-ui/react-toast`'s source (`if (!context.viewport) return null;`) and by running this
// exact check before splitting it out: the html was consistently empty. `toastVariants` is the
// pure function that decides these classes, so it's tested directly instead -- the same reasoning
// as `getToastDuration`, and the "duration reaches Root" checks above already cover the one thing
// that DOES need a real `<Toast>` render (interception happens before Root's own return-null).
check(
  "toastVariants(console) carries console text size, not member",
  toastVariants({ plane: "console" }).includes("text-console-base") &&
    !toastVariants({ plane: "console" }).includes("text-member-body"),
);
check(
  "toastVariants(member) carries member text size, not console",
  toastVariants({ plane: "member" }).includes("text-member-body") &&
    !toastVariants({ plane: "member" }).includes("text-console-base"),
);
check(
  "error icon takes --danger",
  renderToStaticMarkup(React.createElement(ToastIcon, { tier: "error" })).includes("text-danger"),
);
check(
  "info icon takes --success-ink",
  renderToStaticMarkup(React.createElement(ToastIcon, { tier: "info" })).includes("text-success-ink"),
);

// ── 5. close button hit target and action size, rendered ───────────────────────────────────
const closeConsole = renderToStaticMarkup(
  React.createElement(ToastClose, { plane: "console" }),
);
const closeMember = renderToStaticMarkup(React.createElement(ToastClose, { plane: "member" }));
check("close button reaches the touch floor on member", closeMember.includes("min-h-[var(--touch-min)]"));
check("close button does NOT reach the touch floor on console", !closeConsole.includes("min-h-[var(--touch-min)]"));
check("plane does not leak to the DOM as an attribute (close)", !/ plane=/.test(closeMember));

const actionConsole = renderToStaticMarkup(
  React.createElement(ToastAction, { plane: "console", altText: "Retry" }, "Try again"),
);
const actionMember = renderToStaticMarkup(
  React.createElement(ToastAction, { plane: "member", altText: "Retry" }, "Try again"),
);
check("action takes console text size on console", actionConsole.includes("text-console-sm"));
check("action takes member caption size on member", actionMember.includes("text-member-caption"));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
