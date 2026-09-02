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
