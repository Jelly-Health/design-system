import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@jelly-health/design-system";
import { Button } from "@jelly-health/design-system";

/**
 * Ported from `v2/app/design-system/page.tsx`'s "Overlays" section. `defaultOpen` (uncontrolled)
 * renders the dialog open on mount, since a static capture can't click the trigger the showcase
 * page uses — this is the same composition, just forced open for the card.
 */
export function Open() {
  return (
    <Dialog defaultOpen>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog title</DialogTitle>
          <DialogDescription>
            Radix-backed: Escape closes it, focus is trapped and restored.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
