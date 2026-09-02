import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../../lib/utils'

/**
 * The text input, on either plane.
 *
 * `plane="console"` is the default and reproduces the exact class set this component shipped
 * before the variant existed — the height and the two size utilities moved out of the base string
 * into the console variant unchanged, so no consumer's rendering changes.
 *
 * ── Why member sizing is a variant HERE and not a wrapper's job ───────────────────────────────
 * The obvious alternative is to let a member composition impose sizing on whatever control it is
 * handed, and it does not work: a wrapper can only set a minimum on the BOX IT OWNS. Wrapping a
 * 36px input in a 44px div produces a 44px row with a 36px hit area inside it — the row satisfies
 * the floor and the thing a member actually taps does not. `--touch-min` is a property of the
 * control, so only the control can honour it. `ThreadEvent` does exactly the wrapper version today
 * and its docstring is careful to call it enforcing the floor on "the slot it controls", which is
 * the most a composition can do for a primitive it does not own.
 *
 * The member plane sets `min-h` rather than `h` for the same reason `Button` does: it raises the
 * console height to the floor without a compound variant, and a taller input (a filled `field-
 * sizing` control) is not clipped by it.
 */
const inputVariants = cva(
  "text-foreground file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-1 shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-console-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      plane: {
        console: 'h-9 text-console-base md:text-console-sm',
        member: 'min-h-[var(--touch-min)] text-member-body',
      },
    },
    defaultVariants: {
      plane: 'console',
    },
  },
)

/* `plane`, not `size`: `React.ComponentProps<'input'>` already carries `size?: number` — the HTML
 * attribute — so a cva variant called `size` would intersect with it to a type no caller can
 * satisfy. `plane` is also the truer name; it is the word tokens.css already uses to split
 * `--pad-console-*` from `--pad-member-*`, and this is that same split. */
function Input({
  className,
  type,
  plane,
  ...props
}: React.ComponentProps<'input'> & VariantProps<typeof inputVariants>) {
  return (
    <input
      type={type}
      data-slot="input"
      data-plane={plane ?? 'console'}
      className={cn(inputVariants({ plane }), className)}
      {...props}
    />
  )
}

export { Input, inputVariants }
