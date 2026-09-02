import { Avatar, AvatarFallback, AvatarImage } from "@jelly-health/design-system";

/** Ported from `v2/app/design-system/page.tsx`'s "Avatar" section — the fallback-only case. */
export function Fallback() {
  return (
    <Avatar>
      <AvatarFallback>JH</AvatarFallback>
    </Avatar>
  );
}

/**
 * `AvatarImage` — not shown on the showcase page, but a real exported piece of the Avatar
 * composition (`avatar.tsx`). Uses an inline SVG data URI so the image loads with no network
 * dependency during screenshot capture; falls back to initials if it fails to load.
 */
export function WithImage() {
  const placeholder =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#7C6A58"/><circle cx="32" cy="24" r="12" fill="#F4EFE8"/><path d="M12 58c0-12 9-20 20-20s20 8 20 20" fill="#F4EFE8"/></svg>',
    );
  return (
    <Avatar>
      <AvatarImage src={placeholder} alt="Provider avatar" />
      <AvatarFallback>DP</AvatarFallback>
    </Avatar>
  );
}
