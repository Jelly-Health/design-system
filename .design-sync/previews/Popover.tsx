import { Popover, PopoverContent, PopoverTrigger } from "@jelly-health/design-system";
import { Button } from "@jelly-health/design-system";

/**
 * Ported from `v2/app/design-system/page.tsx`'s "Overlays" section. `defaultOpen` (uncontrolled)
 * renders the popover open on mount, since a static capture can't click the trigger the showcase
 * page uses — this is the same composition, just forced open for the card.
 */
export function Open() {
  return (
    <Popover defaultOpen>
      <PopoverTrigger asChild>
        <Button variant="outline">Open popover</Button>
      </PopoverTrigger>
      <PopoverContent>Popover content.</PopoverContent>
    </Popover>
  );
}
