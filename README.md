# `@jelly-health/design-system`

> # ✅ The extraction has landed
>
> **`src/styles/tokens.css` is now the source of truth for colour and radius.** Extracted
> 2026-08-31 (JH206) from `web-app` `origin/main:v2/app/globals.css`, values verbatim — 115
> declarations, diffed to confirm nothing changed in the move.
>
> The file this replaces was hand-transcribed on 2026-08-30 from a checkout 147 commits behind
> `origin/main`, carried older canvas values, and was marked "do not build against it". That notice
> is now obsolete and this replaces it.
>
> **What changed in the move: nothing.** The commit is deliberately inert — same values, new home —
> so that a rendering failure here can only be a plumbing failure, never a design change. The design
> pass's values, and the type, spacing, shape and motion scales, arrive in a later commit.

Design tokens and components shared by **`Jelly-Health/website`** (marketing) and
**`web-app/v2`** (the patient app and clinical console).

**Created 2026-08-30** · Card: [JH138](https://trello.com/c/9BYx5GAH)

---

## Why this repo exists

Jelly Health has two faces that have to feel like one product, and they pull in opposite directions:

| | Patient-facing | Clinical console |
|---|---|---|
| Device | Mobile-first | Desktop, ~1280px floor — **not a mobile surface** |
| Density | Sparse, usually one screen doing one job | Dense; the physician is in it all day |
| Input | Touch | Keyboard-driven |

In v1 they diverged. Colour ended up hardcoded in 157 separate places, components were added ad hoc as
each page needed them, and the admin screens visibly read as a different product from the marketing
pages.

**The alternative to this repo was putting the system in one of the two apps.** That was rejected on
2026-08-30: whichever app owned it would own the *other* app's tokens too, and the marketing site — which
needs roughly 40% of the system and none of the console density work — was the one the plan originally
named. That is the v1 split with the roles reversed.

**The cost we accepted:** a release step between two repos that deploy independently. Recorded here so
it does not get re-litigated as though nobody had thought about it.

---

## What is in here

**Settled, and safe to build against:**

- **11 semantic colour roles, bound light and dark** — `bg`, `sur`, `card`, `ink`, `ink2`, `ink3`,
  `mut`, `line`, `ring`, `dang`, `accink`. Transcribed from the v9 design canvases, not invented here.
  The names are the canvases' own and stay that way, so the design and the code speak one language.
- **Inter Variable**, self-hosted, plus IBM Plex Mono for identifiers. (This bullet said *Overused
  Grotesk* until 2026-09-01; that typeface was retired during the design pass and the sentence had
  simply been left behind — the table below has been right since JH206.)
- `cn()`, so a component from this package and a component written in an app resolve class conflicts
  identically — and, since 2026-09-02, resolve them *correctly*: it now tells tailwind-merge which
  `text-*` names are font sizes, without which they were being silently deleted by colour classes
  and vice versa. See § *`cn()` knows this package's font sizes*.

## What landed, and what is still absent

**Type, spacing, shape and motion scales are now here.** They were withheld until the design pass
produced them — a plausible guess written earlier would have become the system by default. The pass
shipped as `jh-design-system-v10` and JH206 commit 3 brought all four in, along with the designed
colour values.

| | State |
|---|---|
| Colour | 25 roles, both themes. 150 contrast pairs recomputed from the values in this file: **0 failures**, 7 within 0.15 of their floor and marked `tight` |
| Type | Inter Variable (single family — Source Serif 4 retired), weights 300/400/510/590, 11-step size ramp **under `--text-console-*`** (see [Type: sizes are prefixed](#type-sizes-are-prefixed-and-that-is-the-point)), negative tracking scaled to size |
| Spacing | 8px base, 9 steps plus named surface paddings and a 44px member touch floor |
| Shape | Split radius vocabulary — 6px buttons, 12px cards, 4px badges, 12px ceiling — plus one floating-layer shadow |
| Motion | 100/120/200ms, one easing curve, focus-ring geometry |
| Components | The 19 shadcn primitives (`accordion` through `tooltip`), extracted from `web-app/v2/components/ui/` by **JH207**. `src/index.ts` exports all of them; `./ui/*` subpath exports the same components individually |

**Still absent: the designed variant sheets.** The primitives carry their pre-design-pass geometry —
`focus-visible:ring-[3px]` and `tw-animate-css` defaults, not the shipped `--ring-width`/`--ring-offset`
or the `--duration-*` scale — and badge is `rounded-md` (6px) where JH198 specifies 4px for badges.
None of that is an extraction defect: JH207's brief was "move the primitives, change nothing about
their design", and connecting them to the designed vocabulary is a real design decision left to
**JH201** (variant sheets) rather than made implicitly here.

### Known gaps, recorded rather than hidden

- ~~**Font payload grew by ~509KB.**~~ **Fixed 2026-09-01 (JH211).** The faces are now subset and
  split into `latin` / `latin-ext` slices, each with its own `unicode-range`, so a page downloads
  only the slices it uses. **A page of English costs 67KB where it used to cost 352KB — 81% less.**
  Regenerate with `scripts/subset-fonts.sh`; the full originals live in `fonts-src/`, which is not
  shipped. `scripts/verify-fonts.py` asserts the axes, `tnum`/`pnum`, mark positioning, slice
  coverage and range agreement, and is mutation-tested against both ways of getting it wrong.

  This was not housekeeping. Unsubset, the fonts broke the marketing site's mobile Lighthouse budget
  outright — measured on `Jelly-Health/website`: performance 0.97 → 0.85 against a 0.90 floor, LCP
  2.1s → 3.8s against a 2500ms budget. Subsetting to one Latin+Ext file was **not enough** (median
  LCP 2562ms, still failing); the `unicode-range` split is what brought it to 2048ms.
- **The legacy `--jh-*` brand ramp is deprecated but still shipped.** 22 live call sites in `v2`
  (`brand-300` ×19, `brand-700` ×2, `brand-025` ×1). It is re-pointed onto roles so those sites stay
  on-palette; it should shrink to nothing as they are touched.
- ~~**There is no member/marketing type ramp.**~~ **Fixed 2026-09-01 (JH214).** Five role-named
  steps, `--text-member-caption` through `--text-member-section` — see § *Type*.
- **The primitives are typed and sized at console density, and only three of them can opt out yet.**
  Re-measured on `main` 2026-09-02: all **21** size utilities in `src/components/` are
  `text-console-*`, **18** of them `text-console-sm` (12px), and none is a member token. `--touch-min`
  is worse than the earlier note here claimed — it said Button's tallest size was 40px against the
  44px floor, but the relevant number is the DEFAULT, `h-9` = **36px**, and **all six** sizes are
  under the floor. This is why `Jelly-Health/website` overrides both by hand.

  **Partly closed 2026-09-02 (JH212).** `Button`, `Input` and `Textarea` now take `plane="member"` —
  see § *The button matrix*. The remaining gap is the rest of the set: `Label`, `Checkbox`,
  `RadioGroup`, `Select` and `Switch` have no member plane, so a member form built from those still
  starts below the floor. Take them as their first real consumer needs them rather than in one sweep,
  and note that `Checkbox`, `RadioGroup` and `Switch` are hit-target problems as much as type ones —
  `Checkbox` is `size-4` (16px), which no font size can fix.
- **No lockfile.** The package has never been installed, so `yarn typecheck` cannot run. Creating one
  is bound up with the release-process decision that is still open.
- ~~**No wordmark.**~~ **Fixed 2026-09-01 (JH200).** `<Wordmark />` ships from the package root —
  see § *The wordmark*. It has no live consumer yet: the legacy marketing footer is the only place
  the full name renders today, and it is on the retired type system with no dependency on this
  package, so wiring it in means bringing the whole token/font layer to a surface `JH188` W7
  deletes within weeks — a larger, riskier change than this card asked for. `v2` has no full-name
  render site (the console sidebar deliberately shows the short form, `Jelly`, sized for a 216px
  rail), and `Jelly-Health/website` is mid-flight on `JH211`. Wire it in wherever a real screen
  needs the full name next, rather than force a site now.

## Using it

Both consumers are Next 16 / React 19 / Tailwind v4 (CSS-first, no `tailwind.config.js`).

**1 · Add the dependency.** Distribution is a git dependency — no registry, no publish step, no release
pipeline to maintain for a system with one designer and one engineer:

```jsonc
// package.json
"dependencies": {
  "@jelly-health/design-system": "Jelly-Health/design-system#main"
}
```

Pin a commit SHA instead of `main` when you want the app to stop moving under you.

**Peer dependencies you must supply:** `react` / `react-dom` `^19`, and **`lucide-react` `^1`**. Lucide
is a peer rather than a dependency so that the consumer owns the version and only **one** copy
installs — it is imported by `accordion`, `checkbox`, `dialog`, `radio-group` and `select`, and by
consumer code, and two majors resolving side by side means a duplicated bundle and two incompatible
icon component types. Decided 2026-09-01, [JH200](https://trello.com/c/DjdTEk90).

**3 · Adopt the type-ramp lint rule (optional but recommended).** `scripts/verify-type-ramp.py`
(JH213) only sees this package's own primitives — it has no visibility into a consumer that
reintroduces a bare `text-sm`. This closes that gap one hop further out:

```js
// eslint.config.mjs
import jhRules from "@jelly-health/design-system/eslint";
export default [...jhRules, ...yourExistingConfig];
```

Flags any of Tailwind's generic size utilities (`text-sm`, `text-base`, `text-lg`, …) inside a
`className`/`class` attribute or a `cn()`/`clsx()`/`cva()`/`classnames()` call — scoped to those
call sites specifically, not every string literal in a file, so it doesn't fire on ordinary prose
that happens to contain the substring. Verified against the real `eslint` `Linter` API in
`scripts/verify-eslint-rule.mjs`, mutation-tested (removing the scope check, or the regex's word
boundary, each break a specific fixture). ⚠️ Not wired into this repo's own CI — the package has no
lockfile and CI runs no `npm install` today; run the script manually, or rely on it running as part
of a consumer's own `eslint .`. Decided 2026-09-01, [JH216](https://trello.com/c/1gBQlgIn).

**2 · Transpile it.** The package ships TypeScript and CSS source with **no build step** — deliberately,
since a build is a release pipeline and a release pipeline is the cost we were trying to keep small:

```js
// next.config.mjs
const nextConfig = {
  transpilePackages: ["@jelly-health/design-system"],
};
```

### Type: sizes are prefixed, and that is the point

**`text-sm` is Tailwind's 14px here, not ours.** Console density lives on its own names:

```
text-console-2xs  10px      text-console-xl   20px
text-console-sm   12px      text-console-2xl  24px
text-console-base 13px      text-console-3xl  32px
text-console-md   15px      text-console-4xl  48px
text-console-lg   16px      text-console-5xl  64px
                            text-console-6xl  72px
```

There is no `text-console-xs`; the ramp steps 10 → 12 and "extra small" is `text-console-sm`.

An earlier cut of `tokens.css` bound these values to Tailwind's own generic names, so adopting the
package silently resized every `text-sm` a consumer had already written — no error, no warning,
nothing to review against. On the marketing site that measured as nav links, both CTAs and the
footer going 14px → 12px and the hero paragraph 18px → 16px, which put the most member-facing
surface we have a quarter below the **member body floor** `tokens.css` itself declares. axe passed
the whole time, because a small font is not a WCAG failure — which is exactly why this is a
committed check and not a note. `scripts/verify-type-ramp.py` fails the build if any generic name
is bound again. It is mutation-tested, and the mutations — each one run, including two that
defeated an earlier cut of the check — are listed in the script's own docstring rather than
counted here, so the list cannot drift from the code.

**Member surfaces must opt out explicitly**, and since JH214 there is a full ramp to opt into:

```
text-member-caption  14px       meta, timestamps, small print — the ramp's floor
text-member-body     16px       body copy, nav, CTA labels — THE MEMBER BODY FLOOR
text-member-lede     20px       hero paragraph, section intro
text-member-title    24px       screen title, card title
text-member-section  28 → 36px  marketing <h2>          fluid
text-h1              32 → 56px  marketing hero, one per page   fluid
```

**Role-named, not size-named**, matching every other member token in the file
(`--pad-member-screen`, `--gap-member-thread`, `--numeric-member`). A role name survives a retune;
`--text-member-lg` at 20px becomes a lie the day the ramp moves.

**The ramp bottoms at 14px. There is deliberately no member 12px.** 14px is also Tailwind's stock
`text-sm`, and the token still earns its name twice: the package's ESLint rule bans the generic
name in consumers, so without it a caption has nothing legal to write, and the value is our
decision about a minimum rather than Tailwind's about a default.

**Only the two display steps are fluid, and that is enforced.** Everything at or below 24px is
fixed, because a `clamp()` whose lower bound falls under 16px breaks the member body floor at
narrow viewports — silently, on the surface where the floor matters most, passing axe the whole
time. `verify-type-ramp.py` check 7 rejects a fluid reading step and check 8 rejects a display
clamp starting below the floor, including one re-declared later in the file.

**Member leading is derived by a rule.** Through the reading range a member step sits **one notch
looser** than the console step of the same size — 16px is `normal` on the console and `relaxed`
here, 20px is `snug` there and `normal` here, 24px is `tight` there and `snug` here. "Member airy"
is what the separate ramp is for, and this is the operative difference. The rule stops at the
display tier, where `section` takes `tight` exactly as `console-3xl` does, because airiness is a
reading property and display type wants the opposite.

The values are new — the canvases could not supply them. The member canvases are drawn below 1:1
(Conversation Spine's three commonest sizes are 11.5px ×53, 12.5px ×44, 11px ×27, and
`Portal.dc.html` already writes `var(--text-member-body)` rather than px), and the marketing canvas
is a drawing rather than a system: 34 distinct sizes on one page, 16 of them separate `clamp()`s,
two sharing endpoints and differing only in slope. Same situation as the nineteen radii, same
answer — chosen, with the canvas as evidence of range.

Prefix decided 2026-09-01, [JH138](https://trello.com/c/9BYx5GAH); member ramp decided the same day,
[JH214](https://trello.com/c/8UBPo5Py).

### Line-height is mapped, not derived

Every size step above pairs with a named `--leading-*` value — `display` 1.05, `tight` 1.1, `snug`
1.35, `normal` 1.5, `relaxed` 1.6. Size-driven: larger text reads relatively tighter.

```
2xs/sm      relaxed  1.6      xl          snug     1.35
base/md/lg  normal   1.5      2xl/3xl     tight    1.1
                               4xl/5xl/6xl display  1.05
--text-member-body  relaxed  1.6   (same 16px as console `lg`, different leading — "member
                                     airy" is the reason the token exists at all)
--text-h1            display  1.05
```

Without this pairing Tailwind supplies its own default — a ratio computed against **Tailwind's**
font size for that name, not ours. `text-console-lg` inherited a 1.556 ratio derived for stock 18px
while rendering at our 16px; nobody chose that, it was just what was left over.
`scripts/verify-type-ramp.py` fails the build if a step is missing a pairing, or if the pairing is a
bare number instead of a named `--leading-*` token — a number with no name attached is a decision
nobody can find the reasoning for later.

Decided 2026-09-01, [JH215](https://trello.com/c/tZxTAeXf).

**Two ways to load the fonts — pick by whether you can express `unicode-range`.**

| | Files | Who |
|---|---|---|
| Import `…/styles` (tokens + `fonts.css`) | the `-latin` / `-ext` slices, each with a `unicode-range` | `Jelly-Health/website`. A page of English costs **67KB** |
| Declare the faces yourself | `InterVariable-latinext.woff2`, `InterVariable-Italic-latinext.woff2` — one combined file per face, **154KB** | `web-app/v2`, which uses `next/font/local` |

`next/font/local`'s `src` entries accept only `{ path, weight, style }` — there is no `unicodeRange`
option, and the top-level `declarations` applies to every generated face, so per-file ranges are not
expressible. Hence the combined cut. Both paths keep full extended-Latin coverage; only the download
strategy differs. `scripts/verify-fonts.py` asserts the combined files ship **and** stay out of
`fonts.css` — referencing one there would hand the site a 154KB face instead of the 67KB slice.

**3 · Import the styles** at the top of your `globals.css`, before your own `@theme` block:

```css
@import "tailwindcss";
@import "@jelly-health/design-system/styles";
```

Tokens are then Tailwind utilities in the normal way — `bg-bg`, `text-ink`, `text-ink2`, `border-line`,
`ring-ring`, `text-dang`.

⚠️ **Keep `@theme static`.** Tailwind v4 emits a theme variable only when a generated utility references
it, so a token used only as a hand-authored `var(--color-x)` is silently pruned — identically in dev and
prod. The website repo has already hit this once.

**4 · Import a primitive.** Two entry points, on purpose:

```tsx
import { Button } from "@jelly-health/design-system";       // the barrel — all 19, one import
import { Button } from "@jelly-health/design-system/ui/button"; // one primitive, nothing else
```

The barrel is the ergonomic default. Reach for the subpath in a **Server Component** instead: 12 of
the 13 Radix packages the primitives are built on ship their own `"use client"`, so importing the
barrel pulls every primitive's module graph — client-only ones included — into whatever imports it.
`web-app/v2` has a Server Component in exactly that position (`dose-flag.tsx`), which is why its
showcase page (`app/design-system/page.tsx`) imports every primitive by subpath rather than from the
barrel — not style, a real constraint. Verify which form you need against your own build's output;
do not assume Next tree-shakes the unused ones away.

⚠️ **Do not add `"use client"` to a primitive.** It is not needed — the Radix dependency already
carries it, except `@radix-ui/react-slot` — and adding one anyway silently converts every Server
Component that imports the barrel into a client one. This bit `web-app/v2` and is recorded so it
does not get "fixed" as tidiness later.

### The wordmark

`jellyhealth` has never had an SVG or PNG logo — the name has always been live text, restyled
independently on every screen that shows it. `<Wordmark />` is the first shared, correct version:
typeset in Inter at `--weight-semibold` (590, the system's ceiling — there is no 700) and
`--tracking-tight` (-0.012em), lowercase, exported from the package root:

```tsx
import { Wordmark } from "@jelly-health/design-system";

// On a page surface — the default reading
<Wordmark className="text-2xl text-accent-ink" />

// Reversed on a filled surface — console header, dark footer, a share-card background
<Wordmark className="text-2xl text-accent-on-accent bg-accent-fill px-3 py-1.5" />
```

Colour and size are deliberately **not** baked in. Colour inherits `currentColor`, so a consumer
picks `text-accent-ink` (a page surface) or `text-accent-on-accent` (a filled one) — **not**
`text-accent`/`bg-accent`, which is the shadcn-generic alias for `--mut`, a different role
entirely (see the alias table above). Size is left to the consumer for the same reason a hero, a
nav bar and a footer are not the same size.

### The button matrix

The component has always taken these variants. What it has never had is a record of which set is
*intended*, so every consumer inferred it from the source and guessed which combinations were meant
to exist. Writing it down is the whole of this piece — the card asked for the decision recorded, not
for another specimen page to keep in sync with the code.

| Axis | Values | Notes |
|---|---|---|
| `variant` | `default` · `destructive` · `outline` · `secondary` · `ghost` · `link` | `default` is the accent fill. |
| `size` | `default` 36px · `sm` 32px · `lg` 40px · `icon` 36px · `icon-sm` 32px · `icon-lg` 40px | Console heights. All six sit under the 44px member floor. |
| `plane` | `console` (default) · `member` | Raises the control to `--touch-min` and `--text-member-body`. |

Four rules the type system cannot enforce and a reviewer has to:

- **`destructive` is the only semantic variant, and nothing sits above or below it.** There is no
  warning tier and no priority ramp anywhere in this system, by product decision. An action that
  needs more weight than `destructive` needs a confirmation step, not a redder button.
- **`link` is still a button.** It is an action styled quietly; an anchor is what navigates. On the
  member plane it takes the touch floor like everything else, which is why `plane` applies across
  the whole matrix rather than only to `default`.
- **`plane` is a separate axis from `size`, not a seventh size.** They answer different questions —
  `size` is how prominent this button is among its neighbours, `plane` is which product it is in —
  and collapsing them would make a small member button unrepresentable. They compose without a
  compound-variant table because `min-height` beats `height`: `size="default"`'s `h-9` is simply
  raised to 44px and left inert in the class list.
- **There is no `loading` variant, and adding one is a bigger decision than it looks.** A loading
  button has to hold its width while its label is replaced, name the state to a screen reader, and
  decide whether it blocks a second submit — three behaviours, not a style. It stays a consumer
  concern until a real screen needs it, at which point it is a component and not a variant.

**Member sizing is a property of the control, not of the layout around it.** This was the open
question in the card and the answer is forced rather than chosen: a wrapper can only set a minimum on
the box it owns, so wrapping a 36px button in a 44px row produces a row that clears the floor and a
tap target that does not. `ThreadEvent` does exactly that today and its docstring is careful to say
it enforces the floor on "the slot it controls" — which is the most any composition can do for a
primitive it does not own. Hence `plane` on the primitives.

```tsx
<Button plane="member">Continue</Button>              {/* 44px, 16px label */}
<Button plane="member" variant="ghost" size="icon" />  {/* 44×44 */}
```

### `cn()` knows this package's font sizes — and it did not before

`src/lib/utils.ts` extends tailwind-merge with the seventeen `--text-*` step names. Without that,
tailwind-merge classifies a `text-*` class by validating its value: a recognised t-shirt size is a
font size, and **anything it does not recognise falls through to the text-colour group**. Every size
name here is custom, so `text-console-sm`, `text-member-body` and `text-h1` all shared a group with
`text-ink`, `text-danger` and the rest — and two classes in one group means the later one wins and
the earlier is deleted.

That was shipping. Measured on `main` 2026-09-02: **18 classes silently deleted across 9 of the 23
components** — 12 font sizes and 6 colours, since whichever comes first is the one destroyed. Among
them `text-member-body` on all four `MessageBubble` voices, so the component whose docstring measures
its contrast at the member body size was rendering at whatever size it inherited. No error, no
warning, nothing in a diff to review.

`scripts/verify-class-merge.mjs` is the guard, and it reads the true list of sizes from `tokens.css`
rather than from the list it is checking — the first cut did the latter, and all three of its
positive mutations reported OK. **A new `--text-*` step must be added to `FONT_SIZE_STEPS` as well as
to `tokens.css`; the script fails when the two disagree, in either direction.**

One deliberate side effect: font size conflicts with `leading-*` in tailwind-merge, so
`leading-none text-console-sm` now resolves to just the size. That is correct here rather than merely
tolerable — JH215 paired every step with a `--text-<step>--line-height`, so a size utility really
does carry a leading and really does override one written before it. Written after it, `leading-*`
still wins.

### The member compositions

`src/components/member/` — JH212. Not primitives: a primitive is an atom with no opinion about the
product, while everything here carries a decision the canvases settled and `tokens.css` records.
Separate directory for the same reason `brand/` is one.

```tsx
import { Thread, ThreadDay, ThreadEvent } from "@jelly-health/design-system/member/thread";
import { MessageBubble, MessageSender, MessageGroup } from "@jelly-health/design-system/member/message-bubble";
import { PendingValue } from "@jelly-health/design-system/member/pending-value";

<Thread>
  <ThreadDay>12 Aug</ThreadDay>

  <MessageGroup>
    <MessageSender name="Alex"><Avatar className="size-5">…</Avatar></MessageSender>
    <MessageBubble voice="provider">
      Had a look at your panel this morning — nothing there worries me. <PendingValue />
    </MessageBubble>
    <MessageBubble voice="provider">I'd like to move you up. Nothing you need to do.</MessageBubble>
  </MessageGroup>

  <MessageBubble voice="member">ok — will I feel different?</MessageBubble>

  <ThreadEvent action={<a href="/treatment">Your treatment</a>}>
    Alex changed your dose to <PendingValue /> · 12 Aug
  </ThreadEvent>
</Thread>
```

Three rules are load-bearing and are explained at length in each file:

1. **A human message is a bubble; a state change is a `ThreadEvent`.** A centred hairline row, past
   tense, never a bubble and never an avatar. The v9 Conversation Spine canvas: *"The distinction is
   structural rather than coloured, so neither kind dominates and neither reads as an alert."*
   `voice="system"` is jellyhealth **speaking**, not jellyhealth reporting that something happened.
2. **The two warm voices carry a `--line-strong` edge, and it is not decoration.** Measured against
   `--sur` (the `Thread` surface): in light, provider sits **1.8 ΔL\*** and coordinator **0.8 ΔL\***
   from it — both under the 3 ΔL\* threshold `tokens.css` sets for "a fill difference cannot delimit
   this". The member bubble is 40+ ΔL\* in either theme and takes none.
3. **`PendingValue` is the `___`**, on `--pending-rule` — a boundary, never a warning — and it
   carries `sr-only` text, because three underscores read aloud are the "missing data" reading the
   house rule forbids. Never use it for a price.

⚠️ **Consumers must widen their Tailwind `@source` glob.** The v4 content scanner never reaches
`node_modules`, so a consumer whose `@source` still points at `src/components/ui/**/*.tsx` silently
drops every utility these components introduce — no error, dev or prod. Point it at
`src/components/**/*.tsx` instead, which also picks up `brand/` (never covered) and anything added
later.

⚠️ **A member composition cannot assume a primitive is member-sized.** Re-measured 2026-09-02: all
**21** size utilities in `src/components/` are `text-console-*`, and `Button`'s default size is
`h-9` (**36px**, not the 40px an earlier note here claimed — that is `size="lg"`), with all six
sizes under the 44px `--touch-min` floor. `ThreadEvent` enforces the floor on the action slot it
owns, which is the most a wrapper can do; pass `plane="member"` to fix the control itself.

#### `MemberField` — a labelled field

Label, control, description, error. Three of its four decisions come from the canvases rather than
from preference, and the first one is the one worth reading:

1. **There is no required marker.** The Onboarding canvas draws every field as a bare label —
   `Full name`, `Email`, `State`, `Date of birth`, `Mobile number` — and marks exactly one, the
   free-text box on step 1: *"Say more, if you want (optional)"*. It marks the **optional** field,
   in words, in the label. That is the inverse of the usual convention and correct here: nearly
   every field in an eleven-step onboarding is required, so marking required decorates almost
   everything and distinguishes nothing. It also fits the canvas's own thesis — *"Starts as a
   website, becomes a conversation, never becomes a form"* — where an asterisk column is the most
   form-like thing a screen can grow. Hence one prop, `optional`, which drives both the marker and
   `required` on the control so the two cannot disagree.
2. **An error is a message, or it does not exist.** There is no `invalid` prop: a non-empty `error`
   string *is* the invalid state, and a blank or whitespace-only value is treated as no error rather
   than as an error that failed to say anything. This is the house error-vs-empty rule at field
   scale — a red outline around a blank box is exactly what "you have not filled this in yet" looks
   like, and that is what an `invalid` flag plus a separately-supplied message produces the day the
   message arrives empty. The description is shown alongside the error, never replaced by it.
3. **The description is ours, not the canvas's**, and is flagged as such in the source — the canvases
   put supporting prose at screen level, above the fields, never under one input. Prefer that; reach
   for `description` when the sentence genuinely belongs to a single control.
4. **A render prop, because the wiring has to reach a control this component does not own.** Cloning
   the child would do it invisibly and would silently do nothing for a fragment or a wrapper.

```tsx
import { MemberField } from "@jelly-health/design-system/member/field";

<MemberField label="Mobile number" description="For refill updates." error={errors.phone}>
  {(field) => <Input plane="member" type="tel" {...field} />}
</MemberField>
```

`plane="member"` is the consumer's to pass and deliberately not forced — this component cannot know
its child is one of ours, and a wrapper cannot resize a control it does not own.

Contrast for both message roles was measured against every surface a member field can land on,
2026-09-02, both themes. All twelve pairings clear 4.5:1; the floor is `--ink-3` on `--sur` in light
at **5.14:1**.

`scripts/verify-member-plane.mjs` renders these components and asserts what their docstrings claim —
20 cases, mutation-tested against six ways of breaking them. Two of those mutations are bugs this
work actually shipped and then caught: the optional marker rendering on every field that was not
explicitly required, and `Button` declaring `plane` without ever destructuring it, so the prop
leaked to the DOM and the variant did nothing while type-checking clean.

---

## The design loop

The visual source of truth lives in **Claude Design**; this repo is where it becomes implementable.

```
   Claude Design                    this repo                   website · web-app/v2
   ─────────────                    ─────────                   ────────────────────
   design system  ◀── /design-sync ──▶  tokens/    ──── git dep ────▶  consume
   (canvas, editable)                  components/
```

- **`/design-sync` must be typed by a human at the Claude Code prompt, in this directory.** An agent
  cannot invoke it. It reads the tokens and React components directly and can create a new design
  system or update an existing one.
- It syncs **one component at a time, never as a wholesale replace** — so the design and the code are
  allowed to disagree temporarily without either being blocked.
- Because every component references a *role* rather than a hex value, changing one role updates it
  everywhere. **A system you cannot change cheaply is not finished, it is early.**

**Source material** — the 17 v6→v9 canvases these tokens came from, and the measured inventory behind
every number in this README, are outside the repo (they are not ours to commit). Ask Gian.

---

## House rules

- **No hardcoded colour.** If a component needs a colour with no role, that is a missing role — name it
  here rather than inlining a hex. This is the single rule whose absence produced v1.
- **No prices, anywhere**, including in example copy. The billing model is being rewritten.
- **No clinical values** — doses, thresholds, intervals, lab ranges — without a named clinician's
  sign-off. The canvases leave every one as `___` and that is correct.
- **No severity, urgency or priority ramp.** Flags are a flat, unranked set by deliberate product
  decision; a three-tier ramp would only get used.
- **An error state must never be mistakable for an empty one.** In this product a failed load that
  reads as "nothing to do" is the worst thing we can ship.
