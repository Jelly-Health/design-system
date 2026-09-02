import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@jelly-health/design-system";
import { Badge } from "@jelly-health/design-system";

/** Ported from `v2/app/design-system/page.tsx`'s "Table" section. */
export function Default() {
  return (
    <Table>
      <TableCaption>Placeholder rows — invented, not real records.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Row one</TableCell>
          <TableCell>
            <Badge variant="secondary">Active</Badge>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Row two</TableCell>
          <TableCell>
            <Badge variant="outline">Pending</Badge>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

/** The no-rows edge case — not on the showcase page, but a real state every table hits. */
export function Empty() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell colSpan={2} className="text-center text-muted-foreground">
            No rows
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
