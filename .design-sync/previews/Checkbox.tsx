import { Checkbox } from "@jelly-health/design-system";
import { Label } from "@jelly-health/design-system";

/** Ported from `v2/app/design-system/page.tsx`'s "Form controls" section. */
export function Unchecked() {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id="ds-check-unchecked" />
      <Label htmlFor="ds-check-unchecked">Checkbox</Label>
    </div>
  );
}

/** The checked state — not shown on the showcase page, but the primary state axis for this control. */
export function Checked() {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id="ds-check-checked" defaultChecked />
      <Label htmlFor="ds-check-checked">Checked</Label>
    </div>
  );
}

export function Disabled() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Checkbox id="ds-check-disabled" disabled />
        <Label htmlFor="ds-check-disabled">Disabled</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="ds-check-disabled-checked" disabled defaultChecked />
        <Label htmlFor="ds-check-disabled-checked">Disabled, checked</Label>
      </div>
    </div>
  );
}
/**
 * The member plane (JH222). The mark is the SAME 16px it is above — the difference is that 44px
 * around it is tappable, and that each control reserves that 44px so a stacked pair cannot overlap.
 * Two of them, deliberately: a lone checkbox cannot show the footprint, which is half the decision.
 */
export function Member() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Checkbox id="ds-check-member" plane="member" defaultChecked />
        <Label htmlFor="ds-check-member" plane="member">
          Text me refill reminders
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="ds-check-member-2" plane="member" />
        <Label htmlFor="ds-check-member-2" plane="member">
          Email me lab results
        </Label>
      </div>
    </div>
  );
}
