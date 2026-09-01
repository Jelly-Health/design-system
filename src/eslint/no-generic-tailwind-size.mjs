/**
 * Flags a bare Tailwind size utility (`text-sm`, `text-lg`, ...) inside a
 * `className`/`class` attribute or a `cn()`/`clsx()`/`cva()`/`classnames()`
 * call. Companion to `scripts/verify-type-ramp.py`'s check 4, which catches
 * the same regression inside this package's own primitives -- this rule is
 * what gives a CONSUMER (web-app/v2, Jelly-Health/website) the same
 * protection, since the Python check has no visibility past this repo.
 *
 * Since JH213 (design-system#8), those names carry Tailwind's stock values,
 * not a Jelly decision -- `text-sm` is 14px, not console density. A consumer
 * that writes one today gets Tailwind's default silently, with nothing to
 * review against, which is the exact failure JH213 exists to prevent one hop
 * further out.
 *
 * ⚠️ The banned-name list is duplicated from `scripts/verify-type-ramp.py`'s
 * `GENERIC` list by hand -- there is no way to share a single source of truth
 * across Python and a consumer's JS toolchain without adding a build step,
 * which this package deliberately does not have. If the console ramp's step
 * names ever change, both lists need updating together.
 */

const GENERIC_SIZES = [
  "2xs", "xs", "sm", "base", "md", "lg", "xl",
  "2xl", "3xl", "4xl", "5xl", "6xl",
];

// `(?<![\w-])` / `(?![\w-])` rather than \b -- \b would happily match inside
// `text-muted-foreground` at the hyphen, and every colour utility would trip.
// Sorted longest-first so `2xl` doesn't get eaten by an `xl` partial match.
const SORTED = [...GENERIC_SIZES].sort((a, b) => b.length - a.length);
const GENERIC_RE = new RegExp(
  `(?<![\\w-])text-(${SORTED.join("|")})(?![\\w-])`,
  "g",
);

const SCOPED_CALLEES = new Set(["cn", "clsx", "cva", "classnames"]);

function isClassNameAttribute(node) {
  return (
    node.type === "JSXAttribute" &&
    node.name &&
    node.name.type === "JSXIdentifier" &&
    (node.name.name === "className" || node.name.name === "class")
  );
}

function isScopedCall(node) {
  return (
    node.type === "CallExpression" &&
    node.callee &&
    node.callee.type === "Identifier" &&
    SCOPED_CALLEES.has(node.callee.name)
  );
}

/**
 * Walk `.parent` up from the node being checked -- not `context.getAncestors()`,
 * which several ESLint 9 minor versions don't expose on the rule context.
 * `.parent` is populated by the traverser before a visitor runs and is the
 * more portable choice.
 */
function inScope(node) {
  let current = node.parent;
  while (current) {
    if (isClassNameAttribute(current) || isScopedCall(current)) return true;
    current = current.parent;
  }
  return false;
}

function reportMatches(context, node, text) {
  GENERIC_RE.lastIndex = 0;
  let match = GENERIC_RE.exec(text);
  while (match !== null) {
    context.report({
      node,
      message:
        `\`text-${match[1]}\` is Tailwind's stock value, not a Jelly decision. ` +
        `Use \`text-console-*\` for console density or \`--text-member-body\`/` +
        `\`--text-h1\` for a member/marketing surface.`,
    });
    match = GENERIC_RE.exec(text);
  }
}

/** @type {import("eslint").Rule.RuleModule} */
const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "disallow Tailwind's generic text size utilities in className/cn()/clsx()/cva(), " +
        "which now carry Tailwind's stock values rather than a Jelly Health decision",
    },
    schema: [],
    messages: {},
  },
  create(context) {
    return {
      Literal(node) {
        if (typeof node.value !== "string") return;
        if (!inScope(node)) return;
        reportMatches(context, node, node.value);
      },
      TemplateElement(node) {
        const text = node.value && node.value.raw;
        if (typeof text !== "string") return;
        if (!inScope(node)) return;
        reportMatches(context, node, text);
      },
    };
  },
};

export default rule;
