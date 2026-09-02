import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastIcon,
  ToastBody,
  ToastDescription,
  ToastAction,
  ToastClose,
} from "@jelly-health/design-system";

/**
 * The real `ToastViewport` is `fixed` — bottom-right on console, top-centre on member — which
 * would escape a grid cell. These cells override it to `static` so the toast renders inline and
 * the two axes can be compared side by side; `Toaster`'s own card shows the true placement.
 *
 * `open` is passed as a literal `true` rather than `defaultOpen`: `Toast` derives its own
 * duration from `tier`, so an `info` toast would auto-dismiss 4s after the page loads and screenshot
 * an empty card. Controlled-open with no state to change keeps every cell stable.
 */
function Inline({
  plane,
  children,
}: {
  plane: "console" | "member";
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <ToastViewport plane={plane} className="static w-auto max-w-none px-0 pt-0">
        {children}
      </ToastViewport>
    </ToastProvider>
  );
}

/**
 * Console · informational. A check glyph in the success role, and the one tier that
 * auto-dismisses — 4s — because what it announces is already durably visible somewhere else.
 */
export function ConsoleInfo() {
  return (
    <Inline plane="console">
      <Toast tier="info" plane="console" open>
        <ToastIcon tier="info" plane="console" />
        <ToastBody>
          <ToastDescription>Refill approved and sent to the pharmacy.</ToastDescription>
        </ToastBody>
        <ToastClose plane="console" />
      </Toast>
    </Inline>
  );
}

/**
 * Console · error, with an action. Never auto-dismisses (`getToastDuration` returns `Infinity`)
 * because nothing else on screen changed — the toast *is* the entire notice.
 */
export function ConsoleError() {
  return (
    <Inline plane="console">
      <Toast tier="error" plane="console" open>
        <ToastIcon tier="error" plane="console" />
        <ToastBody>
          <ToastDescription>
            Couldn&apos;t reach the pharmacy. The refill wasn&apos;t sent.
          </ToastDescription>
          <ToastAction plane="console" altText="Try again">
            Try again
          </ToastAction>
        </ToastBody>
        <ToastClose plane="console" />
      </Toast>
    </Inline>
  );
}

/**
 * Member · informational. Wider padding, member body size, a 44px close target — the same
 * plane split `Button`, `Input` and `Textarea` carry.
 */
export function MemberInfo() {
  return (
    <Inline plane="member">
      <Toast tier="info" plane="member" open>
        <ToastIcon tier="info" plane="member" />
        <ToastBody>
          <ToastDescription>Your check-in is booked for Thursday.</ToastDescription>
        </ToastBody>
        <ToastClose plane="member" />
      </Toast>
    </Inline>
  );
}

/** Member · error, with an action. Same never-expires rule as the console error tier. */
export function MemberError() {
  return (
    <Inline plane="member">
      <Toast tier="error" plane="member" open>
        <ToastIcon tier="error" plane="member" />
        <ToastBody>
          <ToastDescription>
            We couldn&apos;t save your answers. Nothing was lost — try once more.
          </ToastDescription>
          <ToastAction plane="member" altText="Retry">
            Retry
          </ToastAction>
        </ToastBody>
        <ToastClose plane="member" />
      </Toast>
    </Inline>
  );
}
