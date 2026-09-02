import { ScrollArea } from "@jelly-health/design-system";

/** Ported from `v2/app/design-system/page.tsx`'s "ScrollArea" section — a short list that fits
 * comfortably within the fixed-height viewport. */
export function List() {
  return (
    <ScrollArea className="h-32 w-64 rounded-md border p-4">
      <div className="space-y-2">
        {Array.from({ length: 12 }, (_, i) => (
          <p key={i} className="text-console-sm">
            Scrollable line {i + 1}
          </p>
        ))}
      </div>
    </ScrollArea>
  );
}

/** Genuinely overflowing content — enough rows that the scrollbar is visibly needed, not just
 * theoretically present. Not on the showcase page; added because it's the state that actually
 * exercises the component. */
export function Overflowing() {
  return (
    <ScrollArea className="h-32 w-64 rounded-md border p-4">
      <div className="space-y-2">
        {Array.from({ length: 40 }, (_, i) => (
          <p key={i} className="text-console-sm">
            Overflowing line {i + 1}
          </p>
        ))}
      </div>
    </ScrollArea>
  );
}
