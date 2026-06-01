'use client'

import { Button } from '@exxatdesignux/ui'

interface WizardNavProps {
  currentStep: number
  completedUpTo: number
  onStepClick: (n: number) => void
}

const STEPS = [
  { n: 1, label: 'Properties' },
  { n: 2, label: 'Distribution' },
  { n: 3, label: 'Design' },
  { n: 4, label: 'Communicate' },
  { n: 5, label: 'Report access' },
]

export function WizardNav({ currentStep, completedUpTo, onStepClick }: WizardNavProps) {
  return (
    <aside
      className="flex flex-col shrink-0 border-r border-border"
      style={{ width: 220, background: 'var(--background)', padding: '24px 12px' }}
    >
      <nav className="flex flex-col gap-0.5" aria-label="Wizard steps">
        {STEPS.map(({ n, label }) => {
          const isCompleted = n <= completedUpTo
          const isCurrent = n === currentStep

          if (isCompleted) {
            return (
              <Button
                key={n}
                variant="ghost"
                size="sm"
                className="justify-start gap-2 w-full font-normal"
                onClick={() => onStepClick(n)}
                aria-label={`Go to step ${n}: ${label}`}
              >
                <i
                  className="fa-solid fa-check text-xs shrink-0"
                  aria-hidden="true"
                  style={{ color: 'var(--brand-color)', width: 16 }}
                />
                <span>{label}</span>
              </Button>
            )
          }

          if (isCurrent) {
            return (
              <Button
                key={n}
                variant="secondary"
                size="sm"
                className="justify-start gap-2 w-full font-normal cursor-default"
                aria-current="step"
              >
                <span
                  className="shrink-0 rounded-full flex items-center justify-center"
                  style={{ width: 16, height: 16, background: 'var(--brand-color)', flexShrink: 0 }}
                >
                  <span className="rounded-full" style={{ width: 6, height: 6, background: 'var(--card)' }} />
                </span>
                <span className="font-semibold">{label}</span>
              </Button>
            )
          }

          // future
          return (
            <Button
              key={n}
              variant="ghost"
              size="sm"
              className="justify-start gap-2 w-full font-normal"
              disabled
              aria-disabled="true"
            >
              <span
                className="text-xs font-semibold shrink-0 text-center"
                style={{ width: 16, color: 'var(--muted-foreground)' }}
              >
                {n}
              </span>
              <span>{label}</span>
            </Button>
          )
        })}
      </nav>
    </aside>
  )
}
