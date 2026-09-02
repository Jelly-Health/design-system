import { ScreenSkeleton } from "@jelly-health/design-system";

/**
 * A task screen, loading — a title, a paragraph, and the control at the bottom of
 * it. Every block's height is a member type step times its own mapped leading, so
 * the blocks occupy the space the real lines will occupy.
 *
 * The control block is `--touch-min` (44px) rather than a button height: a
 * skeleton that reserves 36px and is replaced by a 44px control moves everything
 * under it.
 */
export function Default() {
  return (
    <div className="w-[420px]">
      <ScreenSkeleton />
    </div>
  );
}
