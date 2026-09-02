import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@jelly-health/design-system";

/**
 * Ported from `v2/app/design-system/page.tsx`'s "Form controls" section — the closed trigger
 * with placeholder text, the state a select is in most of the time.
 */
export function Closed() {
  return (
    <div className="w-56">
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Option A</SelectItem>
          <SelectItem value="b">Option B</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * `defaultOpen` (uncontrolled) renders the dropdown open on mount, since a static capture can't
 * click the trigger the showcase page uses — same composition, forced open for the card. Radix's
 * `Select.Root` passes `defaultOpen` straight through, same pattern as `Dialog`/`Popover`.
 */
export function Open() {
  return (
    <div className="w-56">
      <Select defaultOpen defaultValue="b">
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Option A</SelectItem>
          <SelectItem value="b">Option B</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
