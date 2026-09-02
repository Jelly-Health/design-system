import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../../lib/utils'

/**
 * The button, and the three axes it varies on.
 *
 * The component has always taken these variants; what it has never had is a record of which set is
 * INTENDED, so every consumer has had to infer the set from the source and guess which combination
 * was meant to exist. The matrix is written down in README § "The button matrix" rather than drawn
 * as a specimen — the card asked for the decision recorded, not another artefact to keep in sync.
 * The short version, so it is also here where the code is:
 *
 *   variant   default · destructive · outline · secondary · ghost · link
 *   size      default(36) · sm(32) · lg(40) · icon(36) · icon-sm(32) · icon-lg(40)
 *   plane     console(default) · member
 *
 * Two rules the set does not enforce and a reviewer has to:
 *
 *   - **`destructive` is the only semantic variant, and there is no ramp above or below it.** The
 *     system has no warning tier and no priority scale by product decision, so a "more dangerous"
 *     button does not exist. If an action needs more weight than `destructive`, it needs a
 *     confirmation step, not a redder button.
 *   - **`link` is still a button.** It is for an action styled quietly, never for navigation — an
 *     anchor is what navigates. On the member plane it takes the touch floor like every other
 *     button, which is the point of applying `plane` to the whole matrix rather than to `default`.
 *
 * `loading` is deliberately NOT a variant: see README for why it is a consumer concern here.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-console-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost:
          'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
      /* Which plane the button is on. `console` is the default and emits nothing, so every
       * existing call site renders exactly the classes it did before this variant existed.
       *
       * It is a SEPARATE axis from `size` rather than a sixth size value, because the two answer
       * different questions: `size` is how prominent this button is among its neighbours, `plane`
       * is which product it is in. Collapsing them would make a small member button
       * unrepresentable. It composes with every size without a compound variant, and that falls
       * out of CSS rather than being arranged: `min-height` beats `height`, so `size="default"`'s
       * `h-9` (36px) is simply raised to the 44px floor and `size="icon"`'s `size-9` is raised on
       * both axes. The `h-*` class stays in the output and becomes inert, which is why there is
       * no compound-variant table here to keep in sync. */
      plane: {
        console: '',
        member:
          'min-h-[var(--touch-min)] min-w-[var(--touch-min)] text-member-body',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      plane: 'console',
    },
  },
)

function Button({
  className,
  variant,
  size,
  plane,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      data-plane={plane ?? 'console'}
      className={cn(buttonVariants({ variant, size, plane, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
