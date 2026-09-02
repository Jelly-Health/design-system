import * as React from 'react'

import { cn } from '../../lib/utils'

/**
 * A clinical value that exists but has not been signed off — the `___` treatment.
 *
 * There are 90 of these across the 16 canvases and the house rule behind them is absolute: no
 * dose, threshold, interval or lab range appears until a named clinician has approved it. This
 * component exists so that rule is something a consumer *reaches for* rather than something it has
 * to remember, and so the 91st instance cannot be typed as three literal underscores in a `<span>`
 * with whatever styling was nearest.
 *
 * ── It must read as "awaiting sign-off", never as "missing data" ─────────────────────────────
 * Two decisions carry that, and neither is cosmetic:
 *
 *   - **The rule underneath is `--pending-rule`, not `--danger` and not `--line`.** `tokens.css`
 *     gives it the same value as `--line-strong` deliberately, and says why: "a pending clinical
 *     value is a BOUNDARY, not a warning. It must never read as an error, and never as missing
 *     data." At `--rule-emphasis` (2px) it is a deliberate mark rather than a hairline someone
 *     could take for a text underline.
 *   - **A screen reader is told what it is.** The visible glyphs are underscores; read aloud they
 *     are nothing at all, which lands a non-sighted member on exactly the "missing data" reading
 *     the rule forbids. The `sr-only` text is the accessible half of the same decision.
 *
 * ⚠️ **Never a price.** `--pending-rule` is reserved for clinical values. The nine `$---`
 * placeholders in the canvases are a different thing waiting on a different decision (the billing
 * rewrite), and giving them the clinical treatment would imply a clinician is what they are
 * waiting on.
 */
function PendingValue({
  className,
  label = 'awaiting clinician sign-off',
  style,
  ...props
}: React.ComponentProps<'span'> & { label?: string }) {
  return (
    <span
      data-slot="pending-value"
      className={cn('bg-card text-ink-3 border-pending-rule px-1.5 font-medium', className)}
      /* The width is set here rather than as a `border-b-*` utility on purpose. Border width is
       * one of the few properties where an arbitrary value holding a bare `var()` is ambiguous
       * between a length and a colour, so it needs a type hint the version of which differs
       * between Tailwind 3 and 4 — and a wrong guess compiles to nothing, silently, which is the
       * exact failure mode this package has been bitten by twice. `wordmark.tsx` sets
       * `--weight-semibold` and `--tracking-tight` inline for the same reason. */
      style={{ borderBottomWidth: 'var(--rule-emphasis)', ...style }}
      {...props}
    >
      <span aria-hidden="true">___</span>
      <span className="sr-only">{label}</span>
    </span>
  )
}

export { PendingValue }
