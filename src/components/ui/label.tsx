'use client'

import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../../lib/utils'

/**
 * The field label, on either plane.
 *
 * `plane="console"` is the default and reproduces the exact class set this component shipped
 * before the variant existed — `text-console-sm` moved out of the base string into the console
 * variant unchanged, so no consumer's rendering changes.
 *
 * This is the type-only half of the member plane: a label has no hit target of its own worth
 * floor-checking (tapping it forwards to the control, which honours `--touch-min` itself), so the
 * member plane raises 12px to `--text-member-body` and does nothing else. Contrast `Checkbox`,
 * where the type is not the problem at all.
 *
 * Not to be confused with `MemberField`, which renders its OWN `<label>` already on the member
 * ramp rather than composing this one — so giving this component a plane does not change what
 * `MemberField` renders. That is deliberate: `MemberField` owns the label/description/error
 * relationship as one unit, and a label it did not render is a label it cannot wire up.
 */
const labelVariants = cva(
  'text-foreground flex items-center gap-2 leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
  {
    variants: {
      plane: {
        console: 'text-console-sm',
        member: 'text-member-body',
      },
    },
    defaultVariants: {
      plane: 'console',
    },
  },
)

function Label({
  className,
  plane,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root> &
  VariantProps<typeof labelVariants>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      data-plane={plane ?? 'console'}
      className={cn(labelVariants({ plane }), className)}
      {...props}
    />
  )
}

export { Label, labelVariants }
