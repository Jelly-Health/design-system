import { Switch } from "@jelly-health/design-system";
import { Label } from "@jelly-health/design-system";

/** Ported from `v2/app/design-system/page.tsx`'s "Form controls" section. */
export function Off() {
  return (
    <div className="flex items-center gap-2">
      <Switch id="ds-switch-off" />
      <Label htmlFor="ds-switch-off">Switch</Label>
    </div>
  );
}

/** The checked state — not shown on the showcase page, but the primary state axis for this
 * control, same pattern as Checkbox's on/off/disabled sweep. */
export function On() {
  return (
    <div className="flex items-center gap-2">
      <Switch id="ds-switch-on" defaultChecked />
      <Label htmlFor="ds-switch-on">On</Label>
    </div>
  );
}

export function Disabled() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Switch id="ds-switch-disabled" disabled />
        <Label htmlFor="ds-switch-disabled">Disabled</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="ds-switch-disabled-on" disabled defaultChecked />
        <Label htmlFor="ds-switch-disabled-on">Disabled, on</Label>
      </div>
    </div>
  );
}
