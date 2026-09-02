import { Button, TaskScreen, TaskDone } from "@jelly-health/design-system";

/**
 * One screen, one job. Reached by deep link from a message and from inside the
 * portal — the same screen, two entry points — so it carries no navigation at
 * all: land, make one decision, and go back to the thread.
 *
 * The header has no slot in it. The only control it can hold is the single exit
 * the component builds itself, which is the chrome rule made unrepresentable
 * rather than merely documented.
 */
export function Deciding() {
  return (
    <div className="h-[560px] w-[360px] overflow-hidden rounded-[var(--radius-lg)] border border-line">
      <TaskScreen
        onExit={() => {}}
        title="Book your blood draw"
        lede="Alex ordered a full panel. Pick a time near you."
        action={
          <Button plane="member" className="w-full">
            Confirm booking
          </Button>
        }
      >
        <div className="flex flex-col gap-[var(--space-1)]">
          <div className="flex min-h-[var(--touch-min)] items-center justify-between rounded-[var(--radius)] border border-accent-fill bg-sur px-[var(--space-2)] text-member-body text-ink">
            <span>Thu 21 Aug</span>
            <span>9:00am</span>
          </div>
          <div className="flex min-h-[var(--touch-min)] items-center justify-between rounded-[var(--radius)] border border-line px-[var(--space-2)] text-member-body text-ink-2">
            <span>Fri 22 Aug</span>
            <span>7:30am</span>
          </div>
        </div>
        <p className="text-member-caption text-ink-3">
          Quest Diagnostics — Downtown, 2.1mi
        </p>
      </TaskScreen>
    </div>
  );
}

/**
 * The second half of the sentence. `backHref` is required for `onRetry`'s
 * reason: a done screen with no way back is a dead end, and a member who
 * arrived from a text message has no navigation to fall back on.
 *
 * It announces with `role="status"` — politely, where a failure announces
 * assertively — and the tick is `--success-ink` on `--success-surface`, the one
 * place on the member plane that meets that role's rule: a fact that already
 * happened.
 */
export function Done() {
  return (
    <div className="h-[560px] w-[360px] overflow-hidden rounded-[var(--radius-lg)] border border-line">
      <TaskDone onExit={() => {}} title="Booked" backHref="#thread">
        Thu 21 Aug, 9:00am at Quest Diagnostics — Downtown. We&rsquo;ll remind
        you the day before.
      </TaskDone>
    </div>
  );
}

/**
 * A read-only decision — the shape three of the canvas&rsquo;s four task screens
 * take. Almost no form fields anywhere in this set; the form-heavy surface is
 * onboarding, not tasks.
 */
export function ReviewAndConfirm() {
  return (
    <div className="h-[560px] w-[360px] overflow-hidden rounded-[var(--radius-lg)] border border-line">
      <TaskScreen
        onExit={() => {}}
        title="Review your details"
        lede="Rendered from what you told Alex. Check it's right before it becomes your chart."
        action={
          <Button plane="member" className="w-full">
            This looks right — confirm
          </Button>
        }
        actionNote="Goes to Alex for clinical review next."
      >
        <div className="rounded-[var(--radius)] border border-line px-[var(--space-2)]">
          <div className="flex justify-between border-b border-line py-[var(--space-1)] text-member-body">
            <span className="text-ink-3">Conditions</span>
            <span className="text-ink">None</span>
          </div>
          <div className="flex justify-between py-[var(--space-1)] text-member-body">
            <span className="text-ink-3">Medications</span>
            <span className="text-ink">Metformin</span>
          </div>
        </div>
      </TaskScreen>
    </div>
  );
}
