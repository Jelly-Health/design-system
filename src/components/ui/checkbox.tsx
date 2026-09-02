'use client'

import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { cva, type VariantProps } from 'class-variance-authority'
import { CheckIcon } from 'lucide-react'

import { cn } from '../../lib/utils'

/**
 * The checkbox, on either plane.
 *
 * `plane="console"` is the default and adds nothing at all — every class the component shipped
 * with stays in the base string, so the console rendering is not merely equivalent, it is
 * untouched. The member plane is purely additive. That is possible here and not on `Input`
 * because this is not a type problem: a checkbox has no text to raise.
 *
 * ── The decision: the HIT AREA reaches the floor, the PAINTED BOX does not move ───────────────
 * `--touch-min` is 44px and this control is `size-4` — 16px. The naive reading of "raise it to the
 * floor" is to grow the box, and that is wrong: a 44px square checkbox is not what any canvas
 * draws, and it would resize every form row it sits in. What a member actually needs is for the
 * 44px of screen around the mark to be tappable. So the member plane expands a centred
 * pseudo-element to `--touch-min` and leaves the painted box, the focus ring and the hover target
 * exactly where they were.
 *
 * A wrapper cannot do this, for the reason `input.tsx` sets out at length: a wrapper can only set
 * a minimum on the box it owns, so a 44px div around a 16px checkbox is a 44px row containing a
 * 16px hit area — the row satisfies the floor and the thing a member taps does not. The expansion
 * has to be on the control element, which is why this is a variant and not a composition.
 *
 * ── Why the margin is load-bearing, and not tidiness ──────────────────────────────────────────
 * A 44px hit area around a 16px box extends 14px in every direction, and pseudo-elements do not
 * occupy layout. `RadioGroup`'s own default is `grid gap-3` — 12px — so two stacked controls sit
 * 28px centre to centre while their hit areas are 44px tall. That is 16px of overlap, and the
 * later sibling wins it: tapping just below the first control selects the second, silently. The
 * member plane therefore also RESERVES the footprint, so a control's hit area is its own space and
 * adjacent hit areas meet without overlapping.
 *
 * The cost, stated rather than hidden: on the member plane the control occupies 44×44 in layout,
 * so it sits further from its label than the console one does. That is inherent to reserving 44px
 * for a 16px control — every arrangement that avoids the overlap pays it somewhere — and it is the
 * right trade against a radio group that quietly selects the wrong option.
 *
 * The margin restates the painted size (`1rem`, i.e. `size-4`) inside a `calc`, which is a second
 * place for it to be wrong if the drawn size ever changes. That drift is not guarded by reading
 * the CSS, which cannot tell; it is guarded by `scripts/verify-touch-target.mjs`, which measures
 * the rendered geometry in a real browser and fails if the footprint stops matching the floor or
 * if two stacked controls' hit areas start overlapping.
 *
 * ⛔ No token was invented for any of this. Every value is `--touch-min` or is derived from it.
 */
const checkboxVariants = cva(
  'peer border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      plane: {
        console: '',
        member:
          "relative m-[calc((var(--touch-min)-1rem)/2)] before:absolute before:top-1/2 before:left-1/2 before:size-[var(--touch-min)] before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']",
      },
    },
    defaultVariants: {
      plane: 'console',
    },
  },
)

function Checkbox({
  className,
  plane,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root> &
  VariantProps<typeof checkboxVariants>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      data-plane={plane ?? 'console'}
      className={cn(checkboxVariants({ plane }), className)}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox, checkboxVariants }
