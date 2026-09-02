'use client'

import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../../lib/utils'

/**
 * The switch, on either plane. Same decision as `checkbox.tsx` — read that docstring first; only
 * the arithmetic differs.
 *
 * The switch is the one control of the three that is not square: `h-[1.15rem] w-8`, so 18.4 × 32px
 * against a 44px floor. It is short of the floor on BOTH axes, by different amounts, so the
 * reserved footprint is asymmetric — a single `m-` would centre the hit area correctly and reserve
 * the wrong space on one axis. The horizontal shortfall is small (32px is already most of the way
 * there) and the vertical one is large, which is exactly the case where a symmetric guess looks
 * fine in a rendered screenshot and fails a measurement.
 *
 * The expanded area is square at `--touch-min` in both directions rather than "44px tall and as
 * wide as the track". The floor is a minimum on the target, not on one axis of it, and a member
 * reaching for a switch aims at the whole control.
 */
const switchVariants = cva(
  'peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      plane: {
        console: '',
        member:
          "relative my-[calc((var(--touch-min)-1.15rem)/2)] mx-[calc((var(--touch-min)-2rem)/2)] before:absolute before:top-1/2 before:left-1/2 before:size-[var(--touch-min)] before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']",
      },
    },
    defaultVariants: {
      plane: 'console',
    },
  },
)

function Switch({
  className,
  plane,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> &
  VariantProps<typeof switchVariants>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-plane={plane ?? 'console'}
      className={cn(switchVariants({ plane }), className)}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={
          'bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0'
        }
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch, switchVariants }
