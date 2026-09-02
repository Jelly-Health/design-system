import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Every font-size step this package publishes, as tailwind-merge sees it.
 *
 * ── Why this list has to exist ────────────────────────────────────────────────────────────────
 * tailwind-merge resolves `text-*` by VALIDATING the value: a known t-shirt size or an arbitrary
 * length is a font size, and anything else it cannot recognise falls through to the text-COLOUR
 * group. Every size name this package ships is a custom one — `console-sm`, `member-body`, `h1` —
 * so all of them landed in the colour group alongside `ink`, `ink-2`, `danger` and the rest. Two
 * classes in one group means the later one wins and the earlier one is DELETED, silently, with no
 * error and nothing in the diff to see.
 *
 * That is not hypothetical; it was already shipping. Measured on `origin/main` 2026-09-02, before
 * this fix, across every class string in `src/components`:
 *
 *   10 classes dropped from 10 shipped class strings, plus `text-member-body` dropped from the
 *   cva base of all four `MessageBubble` voices by the colour class in each voice variant.
 *
 * So `MessageBubble` — the component whose own docstring measures its contrast against the member
 * body size — was rendering at whatever size it inherited, and `ThreadDay`/`ThreadEvent` were
 * losing `text-ink-3`/`text-ink-2` to the size class that followed them. The member body floor was
 * being deleted by the merge layer that exists to make conflicts resolve predictably.
 *
 * Naming the steps here puts them in the font-size group, where they conflict with each other and
 * with nothing else. After the fix the same measurement reports 0 dropped.
 *
 * ⚠️ **A new `--text-*` step must be added here as well as to `tokens.css`.** Two lists is a place
 * to drift, so `scripts/verify-type-ramp.py` check 9 fails when this array and the `@theme inline`
 * aliases stop agreeing — in either direction. Do not edit one without running it.
 *
 * ── One deliberate side effect ────────────────────────────────────────────────────────────────
 * tailwind-merge treats font-size as conflicting with `leading-*`, so `leading-none
 * text-console-sm` now resolves to just `text-console-sm` where it previously kept both. That is
 * correct for this package rather than merely tolerable: JH215 paired every step with a
 * `--text-<step>--line-height`, so a size utility here really does carry a line-height and really
 * does override a `leading-*` written before it. Written after it, `leading-*` still wins.
 */
const FONT_SIZE_STEPS = [
  "console-2xs",
  "console-sm",
  "console-base",
  "console-md",
  "console-lg",
  "console-xl",
  "console-2xl",
  "console-3xl",
  "console-4xl",
  "console-5xl",
  "console-6xl",
  "member-caption",
  "member-body",
  "member-lede",
  "member-title",
  "member-section",
  "h1",
];

const twMerge = extendTailwindMerge({
  extend: { classGroups: { "font-size": [{ text: FONT_SIZE_STEPS }] } },
});

/**
 * Merge class names, with later Tailwind utilities winning over earlier ones.
 *
 * Lives in the package rather than in each app so a component shipped from here
 * and a component written in an app resolve conflicts the same way.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
