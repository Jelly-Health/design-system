'use client'

import * as React from 'react'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { cva, type VariantProps } from 'class-variance-authority'
import { CircleIcon } from 'lucide-react'

import { cn } from '../../lib/utils'

/**
 * One radio, on either plane. See `checkbox.tsx` for the full argument — this is the same 16px
 * control with the same 44px floor, and it takes the same treatment: the hit area reaches
 * `--touch-min` via a centred pseudo-element, the painted box does not move, and the footprint is
 * reserved so adjacent hit areas cannot overlap.
 *
 * This component is where that overlap is not hypothetical. `RadioGroup` below defaults to
 * `grid gap-3` — 12px — so without the reserved footprint two stacked member radios would sit 28px
 * apart with 44px hit areas, overlapping by 16px, and the lower one would win the contested band.
 * A radio group that selects a neighbouring option when tapped near the edge is a worse defect
 * than the small target it was meant to fix, which is why the footprint is part of the decision
 * rather than a refinement of it.
 *
 * The axis is on the ITEM, not on `RadioGroup`. The group is a layout box (`grid gap-3`) with no
 * hit target of its own, and its gap needs no member reading: once each item reserves 44px, 12px
 * between them is 12px of genuine space rather than 12px of overlap. Putting a plane on the group
 * as well would be a second way to say the same thing, and two of them can disagree.
 */
const radioGroupItemVariants = cva(
  'border-input text-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 aspect-square size-4 shrink-0 rounded-full border shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
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

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn('grid gap-3', className)}
      {...props}
    />
  )
}

function RadioGroupItem({
  className,
  plane,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item> &
  VariantProps<typeof radioGroupItemVariants>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      data-plane={plane ?? 'console'}
      className={cn(radioGroupItemVariants({ plane }), className)}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="relative flex items-center justify-center"
      >
        <CircleIcon className="fill-primary absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}

export { RadioGroup, RadioGroupItem, radioGroupItemVariants }
