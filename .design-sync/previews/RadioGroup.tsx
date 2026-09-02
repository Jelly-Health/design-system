import { RadioGroup, RadioGroupItem, Label } from "@jelly-health/design-system";

/** Ported from `v2/app/design-system/page.tsx`'s "Form controls" section. */
export function Default() {
  return (
    <RadioGroup defaultValue="monthly" className="space-y-2">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="monthly" id="ds-radio-monthly" />
        <Label htmlFor="ds-radio-monthly">Monthly</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="quarterly" id="ds-radio-quarterly" />
        <Label htmlFor="ds-radio-quarterly">Quarterly</Label>
      </div>
    </RadioGroup>
  );
}

/** Same options, different item selected — the primary variant axis for a radio group. */
export function SecondOptionSelected() {
  return (
    <RadioGroup defaultValue="quarterly" className="space-y-2">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="monthly" id="ds-radio-monthly-2" />
        <Label htmlFor="ds-radio-monthly-2">Monthly</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="quarterly" id="ds-radio-quarterly-2" />
        <Label htmlFor="ds-radio-quarterly-2">Quarterly</Label>
      </div>
    </RadioGroup>
  );
}

/** `disabled` is a real prop on Radix's `RadioGroupItem`, styled explicitly (opacity-50, no pointer events). */
export function WithDisabledOption() {
  return (
    <RadioGroup defaultValue="monthly" className="space-y-2">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="monthly" id="ds-radio-monthly-3" />
        <Label htmlFor="ds-radio-monthly-3">Monthly</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="quarterly" id="ds-radio-quarterly-3" disabled />
        <Label htmlFor="ds-radio-quarterly-3">Quarterly (unavailable)</Label>
      </div>
    </RadioGroup>
  );
}
/**
 * The member plane (JH222). Three options rather than one, because the thing worth seeing here is
 * the group: each item's 44px hit area is its own reserved space, so tapping near the edge of one
 * option cannot select its neighbour. Without the reserved footprint these would overlap by 16px
 * in this exact `gap-3` layout, and the lower option would win.
 */
export function Member() {
  return (
    <RadioGroup defaultValue="monthly">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="monthly" id="ds-radio-member-monthly" plane="member" />
        <Label htmlFor="ds-radio-member-monthly" plane="member">
          Every month
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="quarterly" id="ds-radio-member-quarterly" plane="member" />
        <Label htmlFor="ds-radio-member-quarterly" plane="member">
          Every three months
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="paused" id="ds-radio-member-paused" plane="member" />
        <Label htmlFor="ds-radio-member-paused" plane="member">
          Pause refills
        </Label>
      </div>
    </RadioGroup>
  );
}
