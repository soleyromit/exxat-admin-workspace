'use client'

import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@exxatdesignux/ui'
import type { AssessmentStatus } from '@/lib/qb-types'

interface BuilderLifecycleStepperProps {
  status: AssessmentStatus
}

const STEPS: { key: string; label: string; statuses: AssessmentStatus[] }[] = [
  { key: 'draft',     label: 'Draft',      statuses: ['draft'] },
  { key: 'review',    label: 'In Review',  statuses: ['pending-review', 'changes-requested'] },
  { key: 'approved',  label: 'Ready',      statuses: ['approved'] },
  { key: 'scheduled', label: 'Scheduled',  statuses: ['scheduled'] },
  { key: 'live',      label: 'Live',       statuses: ['live'] },
  { key: 'completed', label: 'Completed',  statuses: ['completed'] },
]

function stepIndexFor(status: AssessmentStatus): number {
  const idx = STEPS.findIndex(s => s.statuses.includes(status))
  return idx === -1 ? 0 : idx
}

export function BuilderLifecycleStepper({ status }: BuilderLifecycleStepperProps) {
  const current = stepIndexFor(status)

  return (
    <TooltipProvider>
      <div
        className="flex items-center px-6 h-9 border-b border-border bg-card shrink-0 gap-0"
        role="group"
        aria-label="Assessment lifecycle"
      >
        {STEPS.map((step, i) => {
          const isDone    = i < current
          const isActive  = i === current
          const isFuture  = i > current
          const isLast    = i === STEPS.length - 1

          return (
            <div key={step.key} className="flex items-center" style={{ flex: isLast ? '0 0 auto' : 1 }}>
              {/* Step dot + label */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Dot */}
                    <div
                      className={[
                        'size-2 rounded-full shrink-0 transition-colors',
                        isDone   ? 'bg-chart-2'              : '',
                        isActive ? 'bg-[var(--brand-color)]'  : '',
                        isFuture ? 'bg-border'               : '',
                      ].filter(Boolean).join(' ')}
                      aria-hidden="true"
                    />
                    {/* Label — only active step shows inline */}
                    <span
                      className={[
                        'text-xs whitespace-nowrap transition-colors',
                        isActive  ? 'font-semibold text-foreground'        : '',
                        isDone    ? 'text-chart-2 font-medium'             : '',
                        isFuture  ? 'text-muted-foreground/50 font-normal' : '',
                      ].filter(Boolean).join(' ')}
                    >
                      {step.label}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {isDone ? `${step.label} — completed` : isActive ? `Current: ${step.label}` : step.label}
                </TooltipContent>
              </Tooltip>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={[
                    'h-px flex-1 mx-2 transition-colors',
                    isDone ? 'bg-chart-2' : 'bg-border',
                  ].join(' ')}
                  aria-hidden="true"
                />
              )}
            </div>
          )
        })}
      </div>
    </TooltipProvider>
  )
}
