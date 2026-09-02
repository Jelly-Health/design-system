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
/**
 * The member plane (JH222). `plane` goes on the TRIGGER and on each ITEM, not on `Select`: the
 * content renders through a portal, so the list is not a DOM descendant of the trigger and cannot
 * inherit it. A 44px trigger opening a list of 30px rows would have moved the floor violation
 * rather than fixed it.
 */
export function Member() {
  return (
    <div className="w-72">
      <Select>
        <SelectTrigger plane="member" className="w-full">
          <SelectValue placeholder="Choose a pharmacy" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="walgreens" plane="member">
            Walgreens — Market St
          </SelectItem>
          <SelectItem value="cvs" plane="member">
            CVS — 3rd &amp; Howard
          </SelectItem>
          <SelectItem value="mail" plane="member">
            Mail order
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
