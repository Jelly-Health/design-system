import { Tabs, TabsList, TabsTrigger, TabsContent } from "@jelly-health/design-system";

/** Ported from `v2/app/design-system/page.tsx`'s "Tabs" section, with realistic labels and copy. */
export function Default() {
  return (
    <Tabs defaultValue="overview" className="w-full max-w-md">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="medications">Medications</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <p className="text-console-sm">
          A summary of your current plan and any upcoming visits.
        </p>
      </TabsContent>
      <TabsContent value="medications">
        <p className="text-console-sm">
          Your active prescriptions and their next refill dates.
        </p>
      </TabsContent>
    </Tabs>
  );
}

/**
 * A three-tab composition with one tab disabled — the disabled state isn't shown on the showcase
 * page, but `TabsTrigger` forwards a real `disabled` prop through to the Radix trigger.
 */
export function WithDisabledTab() {
  return (
    <Tabs defaultValue="overview" className="w-full max-w-md">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="messages">Messages</TabsTrigger>
        <TabsTrigger value="billing" disabled>
          Billing
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <p className="text-console-sm">
          A summary of your current plan and any upcoming visits.
        </p>
      </TabsContent>
      <TabsContent value="messages">
        <p className="text-console-sm">Notes and updates from your care team.</p>
      </TabsContent>
    </Tabs>
  );
}
