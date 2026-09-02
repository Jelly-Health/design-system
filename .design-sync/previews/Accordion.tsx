import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@jelly-health/design-system";

/** Ported from `v2/app/design-system/page.tsx`'s "Accordion" section, with realistic FAQ copy in place of the placeholder section labels. */
export function Default() {
  return (
    <Accordion type="single" collapsible defaultValue="reschedule" className="w-full max-w-md">
      <AccordionItem value="reschedule">
        <AccordionTrigger>How do I reschedule an appointment?</AccordionTrigger>
        <AccordionContent>
          Open the appointment from your dashboard and choose "Reschedule." You can pick any open
          time slot up to 24 hours before your current appointment.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="missed-dose">
        <AccordionTrigger>What if I miss a dose?</AccordionTrigger>
        <AccordionContent>
          Take it as soon as you remember, unless it's close to your next scheduled dose. Message
          your care team if you're unsure — don't double up without checking first.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="billing">
        <AccordionTrigger>When am I billed?</AccordionTrigger>
        <AccordionContent>
          Billing runs on the same date each month, shown on your account page. You'll get an email
          receipt after every charge.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

/** `type="multiple"` — the other real value of the `type` prop, letting more than one section stay open at once. */
export function Multiple() {
  return (
    <Accordion type="multiple" defaultValue={["shipping", "refills"]} className="w-full max-w-md">
      <AccordionItem value="shipping">
        <AccordionTrigger>Shipping timelines</AccordionTrigger>
        <AccordionContent>
          Most orders ship within 2 business days of approval and arrive within a week.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="refills">
        <AccordionTrigger>Refill requests</AccordionTrigger>
        <AccordionContent>
          Refill requests are reviewed by your provider before they're sent to the pharmacy.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
