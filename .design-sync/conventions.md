## Using this design system

**Wrap `<Tooltip>` in `<TooltipProvider>`.** No other component needs a wrapper — the rest are self-contained. `Tooltip`/`Popover`/`Select`/`Dialog` are Radix-backed and portal their open content; when composing a *new* open/interactive state (not just importing the components), pass the uncontrolled `defaultOpen` prop to force it open without user interaction.

**Sizes are console-density by design, and they're prefixed on purpose.** `text-sm`, `text-base`, `text-lg` etc. are Tailwind's own stock values here — NOT part of this system. The real ramp lives on `text-console-*`:

| class | px | class | px |
|---|---|---|---|
| `text-console-2xs` | 10 | `text-console-xl` | 20 |
| `text-console-sm` | 12 | `text-console-2xl` | 24 |
| `text-console-base` | 13 (default body) | `text-console-3xl` | 32 |
| `text-console-md` | 15 | `text-console-4xl` | 48 |
| `text-console-lg` | 16 | `text-console-5xl` | 64 |
| | | `text-console-6xl` | 72 |

**Member surfaces opt OUT of console density and have their own ramp** — use it whenever you are building the patient-facing product, never the console steps: `text-member-caption` (14px, meta/timestamps — the ramp's floor), `text-member-body` (16px, the member body floor: copy, nav, CTA labels), `text-member-lede` (20px, hero paragraph/section intro), `text-member-title` (24px, screen or card title), `text-member-section` (fluid 28→36px, marketing `<h2>`). Plus `text-h1` (fluid 32→56px, one per page) — the two `clamp()` steps are the only sizes that scale with viewport.

**On a member surface, pass `plane="member"`** to `Button`, `Input` and `Textarea`. Every primitive here defaults to console sizing, which is below the 44px `--touch-min` touch floor; `plane` is a separate axis from `size`, and a wrapper cannot resize a control it does not own, so the prop has to go on the control itself.

**The member compositions are `Thread` / `ThreadDay` / `ThreadEvent`, `MessageBubble` / `MessageSender` / `MessageGroup`, `PendingValue`, and `MemberField`** — read their `.prompt.md` before composing a member screen. Two rules bind: a human message is a `MessageBubble` (four voices: `provider`, `coordinator`, `system`, `member`) while a state change is a `ThreadEvent` (a centred hairline row, past tense, never a bubble); and any clinical value not yet signed off is `<PendingValue />`, never a literal number and never a price.

**A member screen has FOUR states, and `MemberStateView` is how you render them** — never hand-roll the switch. `state` is a discriminated union (`loading` / `empty` / `ready` / `error`) where `ready` carries a **non-empty** list, so "ready with nothing in it" does not compile; build it with `memberStateFrom(items)` rather than your own cast. You pass words, never markup: `empty={{title, body}}` and `error={{title, body, onRetry}}`, plus `skeleton="thread" | "screen"`. The house rule it enforces is that **a failed load must never read as "nothing to do"** — so `MemberError` *requires* `onRetry` and carries `role="alert"` inside a bordered `--card`, while `MemberEmpty` has no control and no box at all, and neither is red (a failed read is not a clinical event). `ThreadSkeleton` and `ScreenSkeleton` are the two loading states and hold the real geometry, so nothing reshapes when the read lands. Reach for `MemberEmpty` / `MemberError` directly only when the state is already decided elsewhere.

**Color is semantic roles, never raw hex.** `bg-primary`/`text-primary-foreground` for the primary action, `bg-secondary`, `bg-destructive` for danger, `text-muted-foreground` for de-emphasized text, `border-input` for form-field borders. For brand accent specifically, use `text-accent-ink` (accent as text on a page surface) and the `bg-accent-fill`/`text-accent-on-accent` pair (accent as a filled surface, reversed) — NOT the generic `text-accent`/`bg-accent`/`text-accent-foreground`, which are shadcn's own hover/selected-state aliases and resolve to a near-white token, not a brand color.

**Radius has a split vocabulary, not one scale**: `rounded-md` (6px, buttons/inputs), `rounded-lg`/`rounded-xl` (12px, cards/panels/dialogs — `xl` is capped at `lg`'s value on purpose, nothing rounder belongs on a panel), `rounded-sm` (4px, badges).

**Notifications go through `Toaster` + `toast()`, never a hand-built banner.** Mount exactly one `<Toaster plane="console" />` (or `plane="member"`) per app, then call `toast({ tier, description, action? })` from anywhere — it is a module-level store, so it needs no context. **`tier` is the whole design**: `info` auto-dismisses (4s console / 5s member) and must only ever announce something already durably visible elsewhere; `error` never auto-dismisses, because the toast *is* the entire notice. Console stacks up to 3 with a `+N more` chip; member shows exactly 1 and a new toast replaces it. Pass a stable `id` to de-dupe a repeated failure instead of stacking it.

**Merge classes with `cn()`**, exported from the package root — the same conflict-resolution every component here already uses internally, so a class you pass in a `className` prop overrides the component's own default correctly.

## Where the truth lives

- `styles.css` (imports the compiled component styles + tokens + fonts) — the only stylesheet a design needs.
- `README.md`, generated per component from its `.d.ts` — the prop contract.
- Each component's own `.prompt.md` — real composition examples, not invented ones; ported from this repo's own `v2/app/design-system/page.tsx` showcase page (primitives) and the package README's member-composition section (`Thread`, `MessageBubble`, `PendingValue`, `MemberField`).

## One real composition

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button } from "@jelly-health/design-system";

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
```
