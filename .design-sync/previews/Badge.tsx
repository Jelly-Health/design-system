import { Badge } from "@jelly-health/design-system";

/** Ported from `v2/app/design-system/page.tsx`'s "Badge" section — all four variants. */
export function Variants() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="destructive">Destructive</Badge>
    </div>
  );
}

/** Realistic usage — status labels as they appear in a table cell, matching the showcase page's "Table" section. */
export function StatusLabels() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Badge variant="secondary">Active</Badge>
      <Badge variant="outline">Pending</Badge>
      <Badge variant="destructive">Past due</Badge>
    </div>
  );
}
