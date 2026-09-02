import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../../lib/utils'

/**
 * The member conversation's bubble — one component, four voices.
 *
 * The four voices are already decided in `src/styles/tokens.css`; this component does not choose
 * a colour, it binds the roles that exist. `--voice-provider` is the physician (the one warm fill
 * in the system), `--voice-coordinator` is named support staff, `--voice-member` is the member's
 * own words (an alias of `--accent-fill`), and `--voice-system` is jellyhealth stating something
 * in the conversation (an alias of `--card`).
 *
 * ⚠️ **A system EVENT is not a system bubble.** A state change — a refill shipped, a dose changed —
 * is a `ThreadEvent`: a centred hairline row, no bubble, no avatar, past tense. The v9 Conversation
 * Spine canvas is explicit about why: *"The distinction is structural rather than coloured, so
 * neither kind dominates and neither reads as an alert."* `voice="system"` is for jellyhealth
 * SPEAKING — an onboarding prompt, a written instruction — not for reporting that something
 * happened. Reaching for it to announce a state change collapses that distinction.
 *
 * ── The edge, and why it is not decorative ───────────────────────────────────────────────────
 * `tokens.css` states the rule: a voice whose fill sits under 3 ΔL* from the surface it lands on
 * takes `--line-strong` as its edge, because `--line` cannot delimit a bubble that has no fill
 * difference. Measured against `--sur` (the `Thread` surface), 2026-09-02:
 *
 *   LIGHT   provider ΔL* 1.8 · coordinator ΔL* 0.8 · system(card) ΔL* 3.8 · member ΔL* 74.9
 *   DARK    provider ΔL* 7.3 · coordinator ΔL* 5.1 · system(card) ΔL* 3.0 · member ΔL* 42.6
 *
 * So in light both warm voices fail the rule outright and system sits just over it; in dark all
 * three clear it, system only barely. The edge is therefore applied to all three in BOTH themes
 * rather than switched per theme — a bubble that grows a border when the lights go out is a worse
 * artefact than one that keeps a hairline it does not strictly need. The member bubble is a
 * saturated fill at 40+ ΔL* in either theme and takes no edge; giving it one would read as a
 * second, competing boundary.
 *
 * Text contrast on every fill was measured at the same time and all six pairings clear 4.5:1.
 * The floor is `--voice-on-member` on `--voice-member` in dark at **4.51:1** — passing, and tight,
 * which is consistent with `tokens.css` already marking dark `--accent-fill` as tight. Do not put
 * anything below the member body size on the member bubble in dark; there is no headroom for it.
 */
const messageBubbleVariants = cva(
  'w-fit max-w-[88%] rounded-[var(--radius-bubble)] px-4 py-3 text-member-body',
  {
    variants: {
      voice: {
        provider: 'bg-voice-provider text-ink border border-line-strong self-start',
        coordinator:
          'bg-voice-coordinator text-ink border border-line-strong self-start',
        system: 'bg-voice-system text-ink border border-line-strong self-start',
        /* The member's own words: the only voice that sits on the right, and the only one whose
         * fill delimits itself. `--voice-on-member` is the designed foreground for this fill —
         * NOT `--accent-foreground`, which resolves to plain `--ink` and would be unreadable here.
         * The same shadcn alias inversion bites `--accent` (it is the hover/selected surface,
         * `--mut`, not the brand accent); `tokens.css` documents both. */
        member: 'bg-voice-member text-voice-on-member self-end',
      },
    },
    defaultVariants: {
      voice: 'provider',
    },
  },
)

function MessageBubble({
  className,
  voice,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof messageBubbleVariants>) {
  return (
    <div
      data-slot="message-bubble"
      data-voice={voice ?? 'provider'}
      className={cn(messageBubbleVariants({ voice }), className)}
      {...props}
    />
  )
}

/**
 * The sender's name above a turn — an avatar slot and a name.
 *
 * Rendered once per TURN, not once per bubble: the canvas draws two consecutive messages from the
 * physician under a single label. `MessageGroup` is what holds those bubbles together underneath
 * it. The member's own bubbles carry no sender label at all — a member does not need telling who
 * she is, and the right-hand alignment already says it.
 *
 * `children` is the avatar slot, so a consumer can pass the package's `<Avatar>` (or nothing).
 * The component owns the row's layout so that every thread spaces it the same way; it does not own
 * the avatar's size, because the console and the member portal do not agree on one.
 */
function MessageSender({
  className,
  name,
  children,
  ...props
}: React.ComponentProps<'div'> & { name: string }) {
  return (
    <div
      data-slot="message-sender"
      className={cn('flex items-center gap-2 self-start', className)}
      {...props}
    >
      {children}
      <span className="text-member-caption text-ink font-medium">{name}</span>
    </div>
  )
}

/**
 * One speaker's consecutive messages, under one sender label.
 *
 * The gap inside a turn is `--space-1` (8px) against `--gap-member-thread` (18px) between turns —
 * the tighter step is what makes two bubbles read as one person continuing rather than two
 * separate arrivals. Both are existing tokens; neither is a new value.
 */
function MessageGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="message-group"
      className={cn(
        'flex w-full flex-col gap-[var(--space-1)] [&>[data-slot=message-bubble][data-voice=member]]:self-end',
        className,
      )}
      {...props}
    />
  )
}

export { MessageBubble, MessageSender, MessageGroup, messageBubbleVariants }
