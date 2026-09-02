import { Button, OnboardingScreen, OnboardingStep } from "@jelly-health/design-system";

/**
 * The page an onboarding step sits on — the full-bleed shell around every
 * step in the eleven-step arc. `OnboardingScreen` carries no chrome of its
 * own (no progress bar, no back control — see `OnboardingStep`'s own note);
 * it only ever renders with a step inside it, so this card shows the shell
 * doing that job rather than standing empty.
 */
export function WithStep() {
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
