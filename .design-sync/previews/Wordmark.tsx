import { Wordmark } from "@jelly-health/design-system";

/**
 * No showcase reference exists for `Wordmark` (it's brand, not a shadcn primitive — see
 * `src/components/brand/wordmark.tsx`). Composed directly from its source: it takes no size or
 * color prop by design — color inherits `currentColor` from a wrapping text-color class, and size
 * inherits from a wrapping font-size class, so both are set here via the wrapper rather than props.
 *
 * ⚠️ The component's own doc comment suggests `text-accent` "on a page surface", but `--accent` is
 * aliased to `--mut` (`tokens.css` line 317) — a near-white SELECTED/hover-background token, not a
 * text color — so `text-accent` renders the mark at ~invisible contrast on a white surface (verified
 * by screenshot during authoring). `tokens.css` line 65 defines `--accent-ink` explicitly as "the
 * accent AS TEXT on a page surface" — the semantically-correct token, used here instead. Filed as a
 * doc-comment bug in `wordmark.tsx` itself; not fixed in this preview, since a preview composes
 * against the component as it should be used, not as its doc comment currently (incorrectly) says.
 */
export function Default() {
  return (
    <div className="text-accent-ink">
      <Wordmark className="text-console-2xl" />
    </div>
  );
}

/** A larger size, as it would appear in a hero or marketing header. */
export function Large() {
  return (
    <div className="text-accent-ink">
      <Wordmark className="text-console-4xl" />
    </div>
  );
}

/**
 * Reversed on a filled brand surface — proves the color genuinely inherits rather than being baked
 * in. Uses `--accent-fill`/`--accent-on-accent` (`tokens.css` lines 64/66, "filled accent surfaces:
 * primary button, member bubble") — the pairing that's actually meant to reverse, not the doc
 * comment's `text-accent-foreground`/`bg-accent` (which resolves to plain `--ink` on near-white
 * `--mut`, not a real reversal either).
 */
export function OnFilledSurface() {
  return (
    <div className="rounded-md bg-accent-fill p-4 text-accent-on-accent">
      <Wordmark className="text-console-2xl" />
    </div>
  );
}
