import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Button,
} from "@jelly-health/design-system";

/**
 * Ported from `v2/app/design-system/page.tsx`'s "Overlays" section, forced open with `defaultOpen`
 * since a static capture can't hover the trigger. Radix Tooltip requires a `TooltipProvider`
 * ancestor — the showcase page wraps its whole page in one, so this card wraps its own locally.
 * `cfg.overrides.Tooltip` (cardMode "single", fixed viewport) is already set by the orchestrator so
 * the portaled content doesn't collapse to zero height in the screenshot.
 */
export function Open() {
  return (
    <TooltipProvider>
      <Tooltip defaultOpen>
        <TooltipTrigger asChild>
          <Button variant="outline">Refill status</Button>
        </TooltipTrigger>
        <TooltipContent>Estimated to ship within 2 business days.</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** The same open state anchored below the trigger instead of the default placement. */
export function OpenBottom() {
  return (
    <TooltipProvider>
      <Tooltip defaultOpen>
        <TooltipTrigger asChild>
          <Button variant="outline">Appointment details</Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Video visit, 15 minutes.</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
