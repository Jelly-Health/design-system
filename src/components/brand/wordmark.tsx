import * as React from 'react'

import { cn } from '../../lib/utils'

/**
 * The wordmark, typeset from tokens rather than traced. See JH200.
 *
 * No SVG or PNG logo has ever existed for jellyhealth -- the name has always been live text,
 * restyled independently on every screen that showed it. This is the first shared, correct
 * version: `--weight-semibold` (590, the system's ceiling -- there is no 700) and
 * `--tracking-tight` (-0.012em), the same two values a legacy footer's ad-hoc
 * `font-semibold tracking-tight` class already landed on by coincidence, now set on the typeface
 * that actually ships (Inter) rather than the retired serif that class was written against.
 *
 * Colour is deliberately NOT baked in -- it inherits `currentColor`, so a consumer sets it via
 * the surface it sits on (`text-accent-ink` on a page surface, `text-accent-on-accent` reversed on
 * `bg-accent-fill`). Baking in one token would make the reversed case -- a filled header, a dark
 * footer, a share-card background -- a second component instead of one colour override.
 *
 * ⚠️ Not `text-accent`/`bg-accent`/`text-accent-foreground` -- those are shadcn's own generic
 * hover/selected-state aliases (`--accent` resolves to `--mut`, a near-white token, not a brand
 * colour; `--accent-foreground` resolves to plain `--ink`). Using them renders this at
 * near-invisible contrast on a light surface. Confirmed by screenshot during JH216's design-sync
 * pass, 2026-09-01 -- `--accent-ink` is the token `tokens.css` itself documents as "the accent AS
 * TEXT on a page surface", which is what this component actually needs.
 *
 * Size is deliberately NOT baked in either, for the same reason: a hero, a nav bar and a footer
 * are not the same size, and nothing here should presume which one a consumer is building.
 */
function Wordmark({
  className,
  style,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="wordmark"
      className={cn('lowercase', className)}
      style={{
        fontWeight: 'var(--weight-semibold)',
        letterSpacing: 'var(--tracking-tight)',
        ...style,
      }}
      {...props}
    >
      jellyhealth
    </span>
  )
}

export { Wordmark }
