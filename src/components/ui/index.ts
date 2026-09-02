/* Every primitive, re-exported.
 *
 * `export *` rather than a hand-written list of the names on purpose: a list is a second place to
 * forget a component, and the failure is silent — the export simply is not there, and the first
 * person who needs it concludes it was never ported.
 *
 * ⚠️ This is only safe while no two primitives export the same name. An ambiguous star export is
 * **dropped without an error**, so the check is a precondition rather than a formality. Measured
 * 2026-09-01: 69 exported names, 0 collisions. Re-measured 2026-09-02 (JH224, adding toast.tsx /
 * toaster.tsx / use-toast.ts): 87 exported names, 0 collisions. Re-run it if a primitive gains an
 * export.
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
