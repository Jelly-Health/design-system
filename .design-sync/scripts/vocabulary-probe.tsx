/* Safelist probe — not a real component. Every MAPPED step of the console/member type ramp
 * and the four mapped radius utilities, so Tailwind's JIT scan generates them regardless of
 * whether any component happens to use each one. The member ramp (caption/lede/title/section) was
 * added by JH212 and lede/title/section are reachable ONLY through this probe — nothing in src/
 * uses them, so without them here a design agent writing `text-member-title` gets no CSS and no
 * error. Referenced via @source alongside the real component and preview sources. */
export const VOCABULARY = (
  <div>
    <span className="text-console-2xs text-console-sm text-console-base text-console-md text-console-lg" />
    <span className="text-console-xl text-console-2xl text-console-3xl text-console-4xl text-console-5xl text-console-6xl" />
    <span className="text-member-caption text-member-body text-member-lede text-member-title text-member-section text-h1" />
    <span className="rounded-sm rounded-md rounded-lg rounded-xl" />
  </div>
);
