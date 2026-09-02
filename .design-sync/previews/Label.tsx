import { Label, Input } from "@jelly-health/design-system";

/**
 * `Label` cannot render standalone — it needs an `htmlFor` pointing at a real control. Ported from
 * `v2/app/design-system/page.tsx`'s "Form controls" section, which pairs it with `Input` this way.
 */
export function Default() {
  return (
    <div className="w-72 space-y-2">
      <Label htmlFor="ds-label-default">Full name</Label>
      <Input id="ds-label-default" placeholder="Jordan Rivers" />
    </div>
  );
}

/** Same paired pattern, with an inline required marker — a common real usage on this form control. */
export function Required() {
  return (
    <div className="w-72 space-y-2">
      <Label htmlFor="ds-label-required">
        Date of birth <span className="text-destructive">*</span>
      </Label>
      <Input id="ds-label-required" placeholder="MM/DD/YYYY" />
    </div>
  );
}
/** The member plane (JH222) — 16px rather than the console 12px. Type only: a label forwards its
 *  tap to the control, which honours `--touch-min` itself. */
export function Member() {
  return (
    <div className="w-72 space-y-2">
      <Label htmlFor="ds-label-member" plane="member">
        Mobile number
      </Label>
      <Input id="ds-label-member" plane="member" placeholder="(555) 019-2847" />
    </div>
  );
}
