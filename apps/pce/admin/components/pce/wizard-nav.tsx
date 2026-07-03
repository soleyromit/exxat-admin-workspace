'use client'

import { Button } from '@exxatdesignux/ui'

interface WizardNavProps {
  currentStep: number
  completedUpTo: number
  onStepClick: (n: number) => void
  mode?: 'course_evaluation' | 'general'
  steps?: { n: number; label: string }[]
}

const DEFAULT_STEPS: Record<string, { n: number; label: string }[]> = {
  course_evaluation: [
    { n: 1, label: 'Courses' },
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

export function WizardNav({ currentStep, completedUpTo, onStepClick, mode = 'course_evaluation', steps }: WizardNavProps) {
  const STEPS = steps ?? DEFAULT_STEPS[mode]

  return (
    <nav
      aria-label="Wizard steps"
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
                {isCompleted ? (
                  <i className="fa-solid fa-check" style={{ fontSize: 10 }} aria-hidden="true" />
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
    </nav>
  )
}
