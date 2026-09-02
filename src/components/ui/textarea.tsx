import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../../lib/utils'

/**
 * The multi-line input, on either plane. Same split as `Input` — see its docstring for why member
 * sizing has to be a variant on the control rather than something a wrapper can impose.
 *
 * No `min-h-[var(--touch-min)]` on the member plane, and that is not an oversight: the base sets
 * `min-h-16` (64px), which already clears the 44px floor on both planes. Adding a second, smaller
 * minimum would be a declaration that can never apply.
 */
const textareaVariants = cva(
  'text-foreground border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      plane: {
        console: 'text-console-base md:text-console-sm',
        member: 'text-member-body',
      },
    },
    defaultVariants: {
      plane: 'console',
    },
  },
)

function Textarea({
  className,
  plane,
  ...props
}: React.ComponentProps<'textarea'> & VariantProps<typeof textareaVariants>) {
  return (
    <textarea
      data-slot="textarea"
      data-plane={plane ?? 'console'}
      className={cn(textareaVariants({ plane }), className)}
      {...props}
    />
  )
}

export { Textarea, textareaVariants }
