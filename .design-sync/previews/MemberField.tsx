import { MemberField, Input, Textarea } from "@jelly-health/design-system";

/**
 * The default: a bare label over a member-plane control. Ported from the
 * README's `MemberField` snippet. No required marker — the Onboarding canvas
 * marks the *optional* field instead, so writing nothing produces the common
 * case (a required field with a plain label).
 *
 * `plane="member"` is the consumer's to pass: the field cannot resize a control
 * it does not own.
 */
export function Default() {
  return (
    <div className="w-80">
      <MemberField label="Full name">
        {(field) => <Input plane="member" {...field} />}
      </MemberField>
    </div>
  );
}

/**
 * With a field-level `description`. Prefer the screen-level prose the canvases
 * actually draw; reach for this when the sentence genuinely belongs to one
 * input.
 */
export function WithDescription() {
  return (
    <div className="w-80">
      <MemberField
        label="Mobile number"
        description="For refill updates. Reply STOP anytime."
      >
        {(field) => <Input plane="member" type="tel" {...field} />}
      </MemberField>
    </div>
  );
}

/**
 * `optional` — the marker in words, inside the label, and the one prop that also
 * drops `required` from the control so the two cannot disagree.
 */
export function Optional() {
  return (
    <div className="w-80">
      <MemberField
        label="Say more, if you want"
        description="Anything you'd like Alex to read before your first visit."
        optional
      >
        {(field) => <Textarea plane="member" rows={3} {...field} />}
      </MemberField>
    </div>
  );
}

/**
 * The error state. A non-empty `error` string *is* the invalid state — there is
 * no `invalid` prop — and the description stays visible alongside the message
 * rather than being replaced by it.
 */
export function WithError() {
  return (
    <div className="w-80">
      <MemberField
        label="Date of birth"
        description="So we can match you to your pharmacy record."
        error="Enter a date in DD/MM/YYYY format."
      >
        {(field) => (
          <Input plane="member" defaultValue="12/31" {...field} />
        )}
      </MemberField>
    </div>
  );
}

/**
 * Several fields laid out together — the gap *between* fields belongs to the
 * form, not to the field, which is why the stack sets it here.
 */
export function InAForm() {
  return (
    <div className="flex w-80 flex-col gap-5">
      <MemberField label="Full name">
        {(field) => <Input plane="member" defaultValue="Priya Raman" {...field} />}
      </MemberField>
      <MemberField label="Email">
        {(field) => (
          <Input plane="member" type="email" defaultValue="priya@example.com" {...field} />
        )}
      </MemberField>
      <MemberField label="State" description="Where your prescription is filled.">
        {(field) => <Input plane="member" defaultValue="Texas" {...field} />}
      </MemberField>
    </div>
  );
}
