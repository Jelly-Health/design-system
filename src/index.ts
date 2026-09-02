export { cn } from "./lib/utils";

/* The 19 primitives, extracted from `web-app/v2/components/ui/` by JH207.
 *
 * Importing from the package root pulls the whole set into the module graph. Most of them are
 * Radix-backed and Radix ships its own `"use client"`, so a Server Component that imports from
 * here can be pushed across the client boundary by a component it never named. When that matters,
 * import the subpath instead — `@jelly-health/design-system/ui/button` — which is exported for
 * exactly this reason. See README § "Importing a primitive".
 */
export * from "./components/ui";

/* The wordmark. Kept out of `./components/ui` -- it is brand, not a shadcn primitive, and it
 * carries no "use client" boundary concern, so it needs no `/brand/*` subpath the way `/ui/*`
 * does. See JH200 / src/components/brand/wordmark.tsx. */
export * from "./components/brand/wordmark";

/* The member-facing compositions (JH212). Product decisions rather than primitives -- see
 * `./components/member/index.ts` for why they are a separate directory. None of them carries a
 * "use client" boundary today, but they are exported on a `/member/*` subpath as well, so a
 * consumer that only wants the thread does not pull the primitives in behind it. */
export * from "./components/member";
