import { Label, Textarea } from "@jelly-health/design-system";

/** Ported from `v2/app/design-system/page.tsx`'s "Form controls" section — the repo's own showcase. */
export function Default() {
  return (
    <div className="w-72 space-y-2">
      <Label htmlFor="ds-textarea-default">Notes for your provider</Label>
      <Textarea
        id="ds-textarea-default"
        placeholder="Anything you'd like them to know before your visit"
      />
    </div>
  );
}

/** Filled state — showing the field with realistic content rather than empty placeholder text. */
export function Filled() {
  return (
    <div className="w-72 space-y-2">
      <Label htmlFor="ds-textarea-filled">Notes for your provider</Label>
      <Textarea
        id="ds-textarea-filled"
        defaultValue="I've been feeling more tired than usual this week and wanted to flag it before our call."
      />
    </div>
  );
}

/** Disabled state — not shown on the showcase page, but a real attribute the `<textarea>` forwards. */
export function Disabled() {
  return (
    <div className="w-72 space-y-2">
      <Label htmlFor="ds-textarea-disabled">Notes for your provider</Label>
      <Textarea
        id="ds-textarea-disabled"
        defaultValue="Submitted — editing is locked until your next visit."
        disabled
      />
    </div>
  );
}
