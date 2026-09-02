'use client'

import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { cva, type VariantProps } from 'class-variance-authority'
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react'

import { cn } from '../../lib/utils'

function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectGroup({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

/**
 * The select trigger, on either plane.
 *
 * `plane="console"` is the default and reproduces the exact class set this component shipped
 * before the variant existed — `text-console-sm` and the two `data-[size=*]` heights moved out of
 * the base string into the console variant unchanged, so no consumer's rendering changes.
 *
 * ── Why the member plane drops `size` rather than composing with it ───────────────────────────
 * `size` is a CONSOLE density knob: `sm` (32px) and `default` (36px) are two points on a ramp that
 * is entirely below `--touch-min`. There is no member reading of "small", because the floor is the
 * floor — a 32px member trigger is not a compact member trigger, it is a broken one. So the member
 * variant carries no `data-[size=*]` height at all and floors with `min-h` instead, the same shape
 * `Input` uses and for the same reason: it raises the height without a compound variant, and a
 * trigger whose value wraps is not clipped by it. Passing `size="sm"` alongside `plane="member"`
 * is therefore not an error and not a conflict; the size is simply not consulted.
 */
const selectTriggerVariants = cva(
  "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      plane: {
        console: 'text-console-sm data-[size=default]:h-9 data-[size=sm]:h-8',
        member: 'min-h-[var(--touch-min)] text-member-body',
      },
    },
    defaultVariants: {
      plane: 'console',
    },
  },
)

function SelectTrigger({
  className,
  size = 'default',
  plane,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: 'sm' | 'default'
} & VariantProps<typeof selectTriggerVariants>) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      data-plane={plane ?? 'console'}
      className={cn(selectTriggerVariants({ plane }), className)}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  position = 'popper',
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border shadow-md',
          position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
          className,
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            'p-1',
            position === 'popper' &&
              'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1',
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn('text-muted-foreground px-2 py-1.5 text-console-sm', className)}
      {...props}
    />
  )
}

/**
 * One option in the list, on either plane.
 *
 * ── Why this takes the axis SEPARATELY from `SelectTrigger`, rather than inheriting it ────────
 * An option is a tap target in its own right — arguably the more important one, since the trigger
 * is tapped once and the list is tapped to actually choose. It is also the half that is easy to
 * forget, which is why it gets a plane rather than being left on console density behind a member
 * trigger: a 44px trigger that opens a list of 30px rows has moved the floor violation rather than
 * fixed it.
 *
 * It cannot inherit the trigger's plane by CSS. `SelectContent` renders through
 * `SelectPrimitive.Portal`, so the list is not a DOM descendant of the trigger and no
 * `data-[plane=member] &` selector can reach it. The two remaining options were a React context on
 * `Select` — one `plane` for the whole compound — or an explicit prop on each part. The prop is
 * what is here, on the repo's simplest-thing-that-works rule: a context is more machinery, and
 * there is no consumer yet to tell us whether a mixed pairing (member trigger, console list) is
 * something anyone wants. If passing it twice turns out to be error-prone in real use, a context
 * on `Select` that these two default to is the upgrade path and does not break this signature.
 *
 * `min-h` rather than `h`: an option whose label wraps to two lines must grow, not clip.
 */
const selectItemVariants = cva(
  "focus:bg-accent focus:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
  {
    variants: {
      plane: {
        console: 'text-console-sm',
        member: 'min-h-[var(--touch-min)] text-member-body',
      },
    },
    defaultVariants: {
      plane: 'console',
    },
  },
)

function SelectItem({
  className,
  plane,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item> &
  VariantProps<typeof selectItemVariants>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      data-plane={plane ?? 'console'}
      className={cn(selectItemVariants({ plane }), className)}
      {...props}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn('bg-border pointer-events-none -mx-1 my-1 h-px', className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        'flex cursor-default items-center justify-center py-1',
        className,
      )}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        'flex cursor-default items-center justify-center py-1',
        className,
      )}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  selectItemVariants,
  selectTriggerVariants,
}
