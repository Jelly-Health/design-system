import { Input, Label } from "@jelly-health/design-system";

/** Ported from `v2/app/design-system/page.tsx`'s "Form controls" section. */
export function Default() {
  return (
    <div className="w-72 space-y-2">
      <Label htmlFor="ds-input-default">Email address</Label>
      <Input id="ds-input-default" placeholder="you@example.com" />
    </div>
  );
}

/** `disabled` is a real HTML input attribute the component styles explicitly (opacity-50, no pointer events). */
export function Disabled() {
  return (
    <div className="w-72 space-y-2">
      <Label htmlFor="ds-input-disabled">Member ID</Label>
      <Input id="ds-input-disabled" disabled defaultValue="M-10492" />
    </div>
  );
}

/** `aria-invalid` is a real styled state in the source (destructive border/ring), not invented. */
export function Invalid() {
  return (
    <div className="w-72 space-y-2">
      <Label htmlFor="ds-input-invalid">Phone number</Label>
      <Input id="ds-input-invalid" aria-invalid="true" defaultValue="not a phone number" />
    </div>
  );
}
