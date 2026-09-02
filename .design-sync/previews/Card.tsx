import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
} from "@jelly-health/design-system";

/** Ported from `v2/app/design-system/page.tsx`'s "Card" section — the repo's own showcase. */
export function Default() {
  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Card title</CardTitle>
        <CardDescription>Supporting line of description.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-console-sm">Body content sits here.</p>
      </CardContent>
      <CardFooter>
        <Button size="sm">Action</Button>
      </CardFooter>
    </Card>
  );
}

/** A more realistic composition: a plan summary card, still invented placeholder content. */
export function WithLongerContent() {
  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Weekly check-in</CardTitle>
        <CardDescription>Due every Monday</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-console-sm">
          Log your weight and any symptoms so your care team can review
          progress before your next visit.
        </p>
      </CardContent>
      <CardFooter>
        <Button size="sm">Start check-in</Button>
        <Button size="sm" variant="ghost">
          Remind me later
        </Button>
      </CardFooter>
    </Card>
  );
}

/** Header/content only — no footer, showing the composition still holds together without one. */
export function NoFooter() {
  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Shipping address</CardTitle>
        <CardDescription>Where refills are delivered</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-console-sm">
          123 Maple Street, Apt 4B
          <br />
          Austin, TX 78701
        </p>
      </CardContent>
    </Card>
  );
}
