import {
  MessageBubble,
  PortalBack,
  PortalBody,
  PortalConversation,
  PortalConversationFooter,
  PortalConversationHeader,
  PortalDestination,
  PortalIdentity,
  PortalMessageBar,
  PortalNav,
  PortalPane,
  PortalPaneBody,
  PortalPaneTitle,
  PortalShell,
  Thread,
} from "@jelly-health/design-system";

const DESTINATIONS = [
  "Your care",
  "Your treatment",
  "Labs & results",
  "Documents",
  "Membership & billing",
];

function Nav() {
  return (
    <PortalNav>
      {DESTINATIONS.map((label, i) => (
        <PortalDestination key={label} href="#" current={i === 0}>
          {label}
        </PortalDestination>
      ))}
      <PortalIdentity>Sarah M.</PortalIdentity>
    </PortalNav>
  );
}

function Conversation({ overlay = false }: { overlay?: boolean }) {
  return (
    <PortalConversation overlay={overlay}>
      <PortalConversationHeader>
        <div>
          <div className="text-member-body font-medium text-ink">Alex</div>
          <div className="text-member-caption text-ink-3">
            Same thread as her SMS
          </div>
        </div>
      </PortalConversationHeader>
      <Thread className="flex-1">
        <MessageBubble voice="provider">
          Everything&rsquo;s where I want it. Thyroid is fine, and your fasting
          glucose came down.
        </MessageBubble>
        <MessageBubble voice="member">Thank you</MessageBubble>
      </Thread>
      <PortalConversationFooter>
        <div className="flex min-h-[var(--touch-min)] items-center rounded-[var(--radius)] border border-line-strong px-[var(--space-2)] text-member-body text-ink-3">
          Message Alex
        </div>
      </PortalConversationFooter>
    </PortalConversation>
  );
}

function Pane() {
  return (
    <PortalPane>
      <PortalPaneBody>
        <PortalBack />
        <PortalPaneTitle>Your care</PortalPaneTitle>
        <div className="flex items-start justify-between gap-[var(--space-2)] border-b border-line py-[var(--space-2)]">
          <span className="min-w-0">
            <span className="block text-member-body text-ink">Blood draw</span>
            <span className="block text-member-caption text-ink-3">
              Thu 21 Aug, 9:00am · Quest Diagnostics, Downtown
            </span>
          </span>
        </div>
      </PortalPaneBody>
    </PortalPane>
  );
}

/**
 * Desktop — three panes. Nav, conversation, destination panel. Picking a
 * destination swaps the **right panel only**; the conversation never moves,
 * because it is the spine of the product rather than a destination among five.
 *
 * The 720px breakpoint is a **container** query, not a media query: the portal
 * may be embedded at a width the viewport knows nothing about. The sidebar is a
 * fixed 15rem and the other two are equal halves of what is left — a panel that
 * is a rail beside a wide chat was the first build&rsquo;s mistake, corrected in
 * the layout spec this shell comes from.
 *
 * No unread count anywhere in the nav. On a member surface a count is anxiety
 * with no action attached, so there is no prop for one.
 */
export function ThreePanes() {
  return (
    <div className="h-[520px] w-[960px] overflow-hidden rounded-[var(--radius-lg)] border border-line">
      <PortalShell view="list">
        <PortalBody>
          <Nav />
          <Conversation />
          <Pane />
        </PortalBody>
        <PortalMessageBar
          name="Message Alex"
          preview="Everything's where I want it…"
        />
      </PortalShell>
    </div>
  );
}

/**
 * Phone is the normal case — the member arrives from a link in a text. Below
 * the breakpoint the same shell is a stack: the destination list, with the
 * message bar as the route into the conversation.
 */
export function PhoneList() {
  return (
    <div className="h-[560px] w-[360px] overflow-hidden rounded-[var(--radius-lg)] border border-line">
      <PortalShell view="list">
        <PortalBody>
          <Nav />
          <Conversation />
          <Pane />
        </PortalBody>
        <PortalMessageBar
          name="Message Alex"
          preview="Everything's where I want it…"
        />
      </PortalShell>
    </div>
  );
}

/** The same shell after a destination is picked. `← All sections` is the way back, and it exists only here. */
export function PhonePane() {
  return (
    <div className="h-[560px] w-[360px] overflow-hidden rounded-[var(--radius-lg)] border border-line">
      <PortalShell view="pane">
        <PortalBody>
          <Nav />
          <Conversation />
          <Pane />
        </PortalBody>
        <PortalMessageBar
          name="Message Alex"
          preview="Everything's where I want it…"
        />
      </PortalShell>
    </div>
  );
}

/** The conversation opened from the message bar — a full-screen view that covers the shell. */
export function PhoneConversation() {
  return (
    <div className="h-[560px] w-[360px] overflow-hidden rounded-[var(--radius-lg)] border border-line">
      <PortalShell view="pane">
        <PortalBody>
          <Nav />
          <Conversation overlay />
          <Pane />
        </PortalBody>
      </PortalShell>
    </div>
  );
}
