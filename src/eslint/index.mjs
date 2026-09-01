/**
 * The flat-config fragment consumers spread into their own `eslint.config.mjs`:
 *
 *   import jhRules from "@jelly-health/design-system/eslint";
 *   export default [...jhRules, ...yourExistingConfig];
 *
 * Package-shipped rather than written per-consumer -- decided 2026-09-01, JH216
 * (https://trello.com/c/1gBQlgIn) -- so the ramp's naming rule has one place to
 * update, the same way `tokens.css` is the one place the ramp's values live.
 *
 * The plugin key ("jelly-design-system") is namespaced so a consumer's own
 * rule set can't collide with it under a bare name like "no-generic-size".
 */
import noGenericTailwindSize from "./no-generic-tailwind-size.mjs";

const config = [
  {
    plugins: {
      "jelly-design-system": {
        rules: {
          "no-generic-tailwind-size": noGenericTailwindSize,
        },
      },
    },
    rules: {
      "jelly-design-system/no-generic-tailwind-size": "error",
    },
  },
];

export default config;
