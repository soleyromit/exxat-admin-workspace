'use client'

import { Button } from '@exxatdesignux/ui'

interface WizardNavProps {
  currentStep: number
  completedUpTo: number
  onStepClick: (n: number) => void
  mode?: 'course_evaluation' | 'general'
  steps?: { n: number; label: string }[]
  /** Landmark label. Override when TWO steppers coexist on one page (the
   *  template builder embeds inside a wizard step) — duplicate nav labels
   *  fail axe landmark-unique. */
  ariaLabel?: string
  /** Right-aligned slot (2026-08-12) — one shared home for step-spanning
   *  actions like Save as draft, which previously rendered in three
   *  different positions across steps 2/3/4 (grouped with step 2's own
   *  header actions, in step 3's footer, in a step-4-only shell row). Since
   *  the last step is always rightmost, this reads as "beside Review" on
   *  every step, not just step 4. */
  endSlot?: React.ReactNode
}

const DEFAULT_STEPS: Record<string, { n: number; label: string }[]> = {
  // Two-step split (Jul 2026, reversing the earlier merge): step 1 scopes the
  // COURSES (term + cohort + roster), step 2 designs the SURVEY INSTANCES
  // (template per course; duplicates auto-skipped at the offering+role+person
  // grain). Internal step numbers are sequential again for this flow.
  course_evaluation: [
    { n: 1, label: 'Courses & Students' },
    { n: 2, label: 'Survey Design' },
    { n: 3, label: 'Communication' },
    { n: 4, label: 'Review' },
  ],
  // Programmatic surveys skip Distribution (not course-scoped). The `n` values
  // stay aligned to the internal wizard steps (1 → 3 → 4) so nav state matches.
  general: [
    { n: 1, label: 'Basic Details' },
    { n: 3, label: 'Distribution' },
    { n: 4, label: 'Review' },
  ],
}

export function WizardNav({ currentStep, completedUpTo, onStepClick, mode = 'course_evaluation', steps, ariaLabel = 'Wizard steps', endSlot }: WizardNavProps) {
  const STEPS = steps ?? DEFAULT_STEPS[mode]

  return (
    <nav
      aria-label={ariaLabel}
      className="shrink-0 border-b border-border flex items-center"
      style={{ height: 52, padding: '0 40px', background: 'var(--background)', gap: 0 }}
    >
      {STEPS.map(({ n, label }, idx) => {
        const isCompleted = n <= completedUpTo
        const isCurrent = n === currentStep
        const isFuture = !isCompleted && !isCurrent
        // Displayed position is sequential (1,2,3…) even when internal step
        // numbers skip (e.g. programmatic skips Distribution → n = 1,3,4).
        const displayNum = idx + 1

        return (
          <div key={n} className="flex items-center" style={{ gap: 0 }}>
            {/* Step pill */}
            <Button
              variant={isCurrent ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => isCompleted ? onStepClick(n) : undefined}
              disabled={isFuture}
              aria-current={isCurrent ? 'step' : undefined}
              aria-label={isCompleted ? `Go back to step ${displayNum}: ${label}` : `Step ${displayNum}: ${label}`}
              className="gap-2 cursor-default"
              style={isCurrent ? {} : isCompleted ? { cursor: 'pointer' } : {}}
            >
              {/* Indicator: check for completed, filled dot for current, number for future */}
              <span
                className="shrink-0 flex items-center justify-center rounded-full text-xs font-semibold"
                style={{
                  width: 20,
                  height: 20,
                  background: isCurrent
                    ? 'var(--foreground)'
                    : isCompleted
                    ? 'transparent'
                    : 'var(--muted)',
                  color: isCurrent
                    ? 'var(--background)'
                    : isCompleted
                    ? 'var(--brand-color)'
                    : 'var(--muted-foreground)',
                }}
              >
                {/* Current step shows its number, never a check — a check on the
                    active step reads as "already done". */}
                {isCompleted && !isCurrent ? (
                  <i className="fa-solid fa-check text-xs" aria-hidden="true" />
                ) : (
                  displayNum
                )}
              </span>

              {/* Label */}
              <span style={{ fontWeight: isCurrent ? 600 : 400 }}>
                {label}
              </span>
            </Button>

            {/* Connector line — between steps, not after last */}
            {idx < STEPS.length - 1 && (
              <span
                aria-hidden="true"
                style={{
                  display: 'block',
                  width: 32,
                  height: 1,
                  background: 'var(--border)',
                  margin: '0 4px',
                  flexShrink: 0,
                }}
              />
            )}
          </div>
        )
      })}
      {endSlot && <div className="ms-auto flex items-center gap-3 shrink-0">{endSlot}</div>}
    </nav>
  )
}
