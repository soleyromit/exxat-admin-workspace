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
      style={{ width: 220, background: 'var(--muted)', padding: '24px 12px' }}
    >
      <nav className="flex flex-col gap-1" aria-label="Wizard steps">
        {STEPS.map(({ n, label }) => {
          const isCompleted = n <= completedUpTo
          const isCurrent = n === currentStep
          const isFuture = n > currentStep

          if (isCompleted) {
            return (
              <Button
                key={n}
                variant="ghost"
                size="sm"
                className="justify-start gap-2 font-normal"
                onClick={() => onStepClick(n)}
                aria-label={`Go to step ${n}: ${label}`}
              >
                <i
                  className="fa-solid fa-check text-xs shrink-0"
                  aria-hidden="true"
                  style={{ color: 'var(--brand-color)', width: 16 }}
                />
                <span style={{ color: 'var(--foreground)' }}>{label}</span>
              </Button>
            )
          }

          if (isCurrent) {
            return (
              <div
                key={n}
                className="flex items-center gap-2 rounded-md"
                style={{
                  padding: '6px 12px',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                }}
                aria-current="step"
              >
                <span
                  className="shrink-0 rounded-full flex items-center justify-center"
                  style={{
                    width: 16,
                    height: 16,
                    background: 'var(--brand-color)',
                    flexShrink: 0,
                  }}
                >
                  <span
                    className="rounded-full"
                    style={{ width: 6, height: 6, background: 'var(--card)' }}
                  />
                </span>
                <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                  {label}
                </span>
              </div>
            )
          }

          // future
          return (
            <div
              key={n}
              className="flex items-center gap-2"
              style={{ padding: '6px 12px', opacity: 0.5 }}
              aria-disabled="true"
            >
              <span
                className="text-xs font-semibold shrink-0 text-center"
                style={{ width: 16, color: 'var(--muted-foreground)' }}
              >
                {n}
              </span>
              <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {label}
              </span>
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
