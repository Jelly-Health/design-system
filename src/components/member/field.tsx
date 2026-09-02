import * as React from 'react'

import { cn } from '../../lib/utils'

/**
 * A labelled field on a member surface — label, control, description, error.
 *
 * The primitives are atoms: an `Input` knows nothing about what it is asking for. The composition
 * is where the product decisions sit, and there are four of them here, three settled by the
 * canvases rather than by preference.
 *
 * ── 1. There is no required marker, and that is the decision, not an omission ─────────────────
 * The obvious build is `required` → a red asterisk. The Onboarding canvas says otherwise. Its
 * thesis line is *"Starts as a website, becomes a conversation, never becomes a form"*, and an
 * asterisk column is the single most form-like thing a screen can grow. Across the eleven steps
 * every field is drawn as a bare label — `Full name`, `Email`, `State`, `Date of birth`,
 * `Mobile number` — and exactly ONE carries a marker, the free-text box on step 1:
 *
 *     Say more, if you want (optional)
 *
 * So the canvas marks the OPTIONAL one, in words, inside the label. That is the inverse of the
 * usual convention and it is the right way round here: nearly every field in an eleven-step
 * onboarding is required, so marking required decorates almost everything and distinguishes
 * nothing, while marking optional lands on the handful of fields where it is real information.
 * A red asterisk would also spend the danger role on a field that is not in error — see 3.
 *
 * So the prop is `optional`, not `required`, and there is exactly one of them. A field is one or
 * the other, and two booleans for one fact is a way for the marker to say "(optional)" over a
 * control that rejects an empty value. `optional` drives both: the marker, and `required` on the
 * control — so validation and the label cannot disagree. The default is a required field with a
 * bare label, which is what the canvas draws ten times out of eleven. Writing nothing therefore
 * produces the common case, and the failure mode of forgetting the prop is a field that looks
 * required and is; the inverse default would put "(optional)" on required fields.
 *
 * ── 2. Field-level description is ours, and is flagged as such ────────────────────────────────
 * The canvases put supporting prose at SCREEN level, above the fields ("You'll hear from her
 * directly — check-ins, refill updates, lab bookings. Reply STOP anytime."), never under an
 * individual input. `description` is therefore not evidenced by a canvas; it is here because a
 * field sometimes has to say something only that field needs, and leaving it out would push
 * consumers into styling a `<p>` by hand, which is how a system loses control of a role. Prefer
 * the screen-level treatment the canvases actually draw, and reach for this when the sentence
 * genuinely belongs to one input.
 *
 * ── 3. An error is a message, or it does not exist ────────────────────────────────────────────
 * The house rule is that an error state must never be mistakable for an empty one. The way that
 * rule gets broken in a form is specific and worth naming: a field is put into an invalid state by
 * one prop and given its message by another, the message arrives empty — a validation library
 * returning `{}`, a nullish message, a translation key that did not resolve — and the member gets
 * a red outline around a blank box. Red-and-blank is exactly what "you have not filled this in
 * yet" looks like.
 *
 * So there is no `invalid` prop. `error` is the only way in, a non-empty string is the whole
 * definition of invalid, and a blank or whitespace-only value is treated as no error at all rather
 * than as an error that failed to say anything. An invalid field with nothing to read is
 * unrepresentable instead of merely discouraged — the same move `tokens.css` makes by keeping the
 * member reading range fixed.
 *
 * The description is NOT replaced by the error. Both are shown, both are named in
 * `aria-describedby`, and the error is last so it is the final thing read. Swapping one for the
 * other would delete the instruction at the exact moment the member has demonstrated she needs it.
 *
 * Contrast for both messages was measured against every surface a member field can land on,
 * 2026-09-02, both themes — `--ink-3` and `--danger` on `--bg`, `--card` and `--sur`. All twelve
 * pairings clear 4.5:1; the floor is `--ink-3` on `--sur` in light at 5.14:1.
 *
 * ── 4. Why a render prop ──────────────────────────────────────────────────────────────────────
 * The wiring — the id the label points at, the ids the control must name in `aria-describedby`,
 * `aria-invalid` — has to reach a control this component does not own and cannot import. Cloning
 * the child would do it invisibly and would silently do nothing when the child is a fragment or a
 * wrapper. Handing the props over makes the contract explicit and impossible to half-do: a
 * consumer who does not spread them gets a label pointing at no control, which is visible the
 * first time anyone taps the label.
 *
 *     <MemberField label="Mobile number" description="For refill updates." error={errors.phone}>
 *       {(field) => <Input plane="member" type="tel" {...field} />}
 *     </MemberField>
 *
 * `plane="member"` is the consumer's to pass and deliberately not forced here: this component
 * cannot know that its child is one of ours, and a wrapper cannot resize a control it does not
 * own — see `Input`'s docstring for why that is a property of the box model and not a gap.
 * `verify-class-merge.mjs` and the `Button`/`Input` matrices are what keep the two in step.
 */
type MemberFieldControlProps = {
  id: string
  required?: boolean
  'aria-invalid'?: true
  'aria-describedby'?: string
}

function MemberField({
  className,
  label,
  description,
  error,
  optional = false,
  children,
  ...props
}: Omit<React.ComponentProps<'div'>, 'children'> & {
  label: string
  description?: React.ReactNode
  /** A non-empty message. Blank or whitespace-only is treated as no error — see 3 above. */
  error?: string | null
  /** Marks the field optional in the label AND drops `required` from the control. See 1. */
  optional?: boolean
  children: (field: MemberFieldControlProps) => React.ReactNode
}) {
  const reactId = React.useId()
  const controlId = `${reactId}-control`
  const descriptionId = `${reactId}-description`
  const errorId = `${reactId}-error`

  const message = typeof error === 'string' && error.trim() !== '' ? error : null
  const describedBy =
    [description ? descriptionId : null, message ? errorId : null]
      .filter(Boolean)
      .join(' ') || undefined

  return (
    <div
      data-slot="member-field"
      /* `--space-1` (8px) between the parts. Layout, so not `--space-half`, which tokens.css
       * reserves for optical adjustment. The gap BETWEEN fields belongs to whatever lays the form
       * out, not to the field. */
      className={cn('flex flex-col gap-[var(--space-1)]', className)}
      {...props}
    >
      <label
        htmlFor={controlId}
        className="text-member-body text-ink font-medium"
      >
        {label}
        {optional ? (
          /* The optional marker, in the label, in words — see 1. Quiet (`--ink-3`, the tertiary
           * role) so it reads as an aside rather than as a second label, and not `sr-only`: it is
           * information the member wants before she starts typing, not after. */
          <span className="text-ink-3 font-normal"> (optional)</span>
        ) : null}
      </label>

      {children({
        id: controlId,
        required: optional ? undefined : true,
        ...(message ? { 'aria-invalid': true as const } : {}),
        ...(describedBy ? { 'aria-describedby': describedBy } : {}),
      })}

      {description ? (
        <p id={descriptionId} className="text-member-caption text-ink-3">
          {description}
        </p>
      ) : null}

      {message ? (
        /* `role="alert"` rather than a bare `aria-live` region: this appears in response to
         * something the member just did, and it must interrupt. It is `--danger` as TEXT, never a
         * `--danger-surface` fill — a filled block would compete with the control's own invalid
         * border for the same message, and the canvases give a filled danger surface to nothing at
         * this scale. */
        <p id={errorId} role="alert" className="text-member-caption text-danger">
          {message}
        </p>
      ) : null}
    </div>
  )
}

export { MemberField }
export type { MemberFieldControlProps }
