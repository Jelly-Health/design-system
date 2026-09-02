---
category: member
---

# MemberField

A labelled field on a member surface — label, control, description, error.

`src/components/member/field.tsx` is the authority for every decision below; this file exists
because the converter's source fuzzy-find cannot match `MemberField` to a file named `field.tsx`,
so without it the component is grouped as a generic primitive and ships no usage guidance. Keep it
short and keep it true — if it disagrees with the source, the source wins.

## Usage

```tsx
import { MemberField } from "@jelly-health/design-system/member/field";

<MemberField label="Mobile number" description="For refill updates." error={errors.phone}>
  {(field) => <Input plane="member" type="tel" {...field} />}
</MemberField>
```

`children` is a render prop, not a child element: the wiring (`id`, `required`, `aria-invalid`,
`aria-describedby`) has to reach a control this component does not own and cannot import. A
consumer who does not spread `field` gets a label pointing at no control — visibly broken the
first time anyone taps the label, which is the point of making the contract explicit.

`plane="member"` is the consumer's to pass and deliberately not forced. A wrapper cannot resize a
control it does not own, and every primitive in this package defaults to console sizing, which is
below the 44px `--touch-min` floor.

## The four decisions

1. **There is no required marker — `optional` is the prop.** The Onboarding canvas draws every
   field as a bare label and marks exactly one, in words, in the label: *"Say more, if you want
   (optional)"*. Marking optional is the inverse of the usual convention and is right here,
   because nearly every field in an eleven-step onboarding is required. `optional` drives both the
   marker and `required` on the control, so validation and the label cannot disagree. The default
   is a required field with a plain label.
2. **An error is a message, or it does not exist.** There is no `invalid` prop. A non-empty
   `error` string *is* the invalid state; blank or whitespace-only is treated as no error rather
   than as an error that failed to say anything. This is the house error-vs-empty rule at field
   scale — a red outline around a blank box is exactly what "you have not filled this in yet"
   looks like.
3. **`description` is shown alongside the error, never replaced by it.** Both are named in
   `aria-describedby`, error last. Swapping one for the other would delete the instruction at the
   moment the member has demonstrated she needs it. Prefer the screen-level prose the canvases
   draw above the fields; reach for `description` when the sentence belongs to one input.
4. **The error is `--danger` as text, never a `--danger-surface` fill**, with `role="alert"` — it
   appears in response to something the member just did, so it must interrupt.

Contrast for both message roles was measured against every surface a member field can land on
(2026-09-02, both themes): all twelve pairings clear 4.5:1, floor `--ink-3` on `--sur` in light at
5.14:1.
