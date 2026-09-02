import { Button, OnboardingScreen, OnboardingStep } from "@jelly-health/design-system";

/**
 * One step of the eleven-step arc.
 *
 * There is no progress bar, no &ldquo;step 3 of 11&rdquo;, no dot rail and no
 * back control — none of the eleven canvas steps draws one, and step 9 says so
 * outright. That is the arc&rsquo;s thesis rather than a styling choice:
 * *starts as a website, becomes a conversation, never becomes a form*, and a
 * progress bar is the most form-like thing a screen can grow.
 *
 * The action is a slot. The onboarding canvas fills its primary control with
 * `--ink` and the task-screen canvas fills its own with `--accent-fill`;
 * neither the ink fill nor the canvas&rsquo;s accent-edged secondary is a
 * variant `Button` has, so the shell holds the slot and the disagreement is
 * reported rather than absorbed.
 */
export function Step() {
  return (
    <div className="w-[360px]">
      <OnboardingScreen>
        <OnboardingStep
          title="Who you are"
          action={
            <Button plane="member" className="w-full">
              Continue
            </Button>
          }
        >
          <div className="flex flex-col gap-[var(--space-1)]">
            {["Full name", "Email", "State", "Date of birth"].map((label) => (
              <div
                key={label}
                className="flex min-h-[var(--touch-min)] items-center rounded-[var(--radius)] border border-line px-[var(--space-2)] text-member-body text-ink-3"
              >
                {label}
              </div>
            ))}
          </div>
        </OnboardingStep>
      </OnboardingScreen>
    </div>
  );
}

/**
 * Step 1 — the landing, and the only step drawn centred and the only one
 * carrying the wordmark. `mark` and `align` exist because the canvas draws both
 * treatments, not because a shell should be configurable.
 */
export function Landing() {
  return (
    <div className="w-[360px]">
      <OnboardingScreen>
        <OnboardingStep
          mark
          align="center"
          title="What brings you here?"
          lede="Before anything else — tell us in your own words."
          action={
            <Button plane="member" className="w-full">
              Continue
            </Button>
          }
        >
          <div className="grid w-full grid-cols-2 gap-[var(--space-1)]">
            {["Weight", "Hormones", "Energy / sleep", "Not sure"].map((c) => (
              <div
                key={c}
                className="flex min-h-[var(--touch-min)] items-center justify-center rounded-[var(--radius)] border border-line px-[var(--space-1)] text-member-body text-ink"
              >
                {c}
              </div>
            ))}
          </div>
        </OnboardingStep>
      </OnboardingScreen>
    </div>
  );
}
