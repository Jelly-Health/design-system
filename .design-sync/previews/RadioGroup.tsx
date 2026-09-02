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
