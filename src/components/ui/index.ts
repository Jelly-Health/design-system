/* Every primitive, re-exported.
 *
 * `export *` rather than a hand-written list of the names on purpose: a list is a second place to
 * forget a component, and the failure is silent — the export simply is not there, and the first
 * person who needs it concludes it was never ported.
 *
 * ⚠️ This is only safe while no two primitives export the same name. An ambiguous star export is
 * **dropped without an error**, so the check is a precondition rather than a formality. Re-run it
 * if a primitive gains an export.
 *
 *   2026-09-01              69 names, 0 collisions
 *   2026-09-02 (JH224)      87 names, 0 collisions   toast.tsx / toaster.tsx / use-toast.ts
 *   2026-09-02 (JH222)      93 names, 0 collisions   + labelVariants, selectTriggerVariants,
 *                                                      selectItemVariants, checkboxVariants,
 *                                                      switchVariants, radioGroupItemVariants
 *   2026-09-02 (JH227)      94 names, 0 collisions   + dialogCloseGuard
 *
 * Those are VALUE exports. Stating the denominator because the JH224 figure did not, and it does
 * not reproduce without it: the same walk counts 96 names on this tree and 90 on `origin/main` if
 * the three type-only exports (`ToastTier`, `ToastOptions`, `ToastRecord`) are included. Both
 * counts are 0-collision and the type/value split cannot collide across that boundary anyway, so
 * nothing was wrong — but a number whose definition is unstated gets re-derived differently by the
 * next person, which is how a precondition quietly stops being checked.
 *
 * **The walk, so the next row does not have to guess at it** (JH227): transform every module in
 * this directory except `index.ts` to CJS with esbuild's `tsx` loader, resolving relative imports
 * between them so `toaster.tsx` loads rather than being skipped, and count `Object.keys` of each
 * `module.exports`. Type-only exports are erased by the transform and are therefore excluded by
 * construction — that is what makes these VALUE counts. Re-run against `origin/main` as well as
 * the working tree: the walk above reproduces JH222's 93 exactly on `origin/main`, which is the
 * check that it is the same walk. Type-only exports now number **five** — `DialogCloseGuard` and
 * `DialogContentProps` joined the three above — so the inclusive figure is 99 here, 96 there.
 */
export * from "./accordion";
export * from "./alert";
export * from "./avatar";
export * from "./badge";
export * from "./button";
export * from "./card";
export * from "./checkbox";
export * from "./dialog";
export * from "./input";
export * from "./label";
export * from "./popover";
export * from "./radio-group";
export * from "./scroll-area";
export * from "./select";
export * from "./switch";
export * from "./table";
export * from "./tabs";
export * from "./textarea";
export * from "./toast";
export * from "./toaster";
export * from "./tooltip";
export * from "./use-toast";
