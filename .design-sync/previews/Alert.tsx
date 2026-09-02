import { Alert, AlertDescription, AlertTitle } from "@jelly-health/design-system";

/** Ported from `v2/app/design-system/page.tsx`'s "Alert" section, with realistic copy in place of the placeholder text. */
export function Default() {
  return (
    <Alert className="max-w-md">
      <AlertTitle>Appointment reminder</AlertTitle>
      <AlertDescription>
        Your check-in with Dr. Patel is tomorrow at 10:00 AM. You can reschedule up to 24 hours in
        advance.
      </AlertDescription>
    </Alert>
  );
}

/** `variant="destructive"` — the other real value of `alertVariants`, not shown on the showcase page. */
export function Destructive() {
  return (
    <Alert className="max-w-md" variant="destructive">
      <AlertTitle>Payment failed</AlertTitle>
      <AlertDescription>
        We couldn't charge your card on file. Update your payment method to avoid a lapse in
        service.
      </AlertDescription>
    </Alert>
  );
}
