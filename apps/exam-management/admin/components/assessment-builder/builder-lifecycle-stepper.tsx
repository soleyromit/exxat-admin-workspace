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
        className="flex items-start px-6 py-2 border-b border-border bg-card shrink-0"
        role="group"
        aria-label="Assessment lifecycle"
      >
        {STEPS.map((step, i) => {
          const isDone   = i < current
          const isActive = i === current
          const isLast   = i === STEPS.length - 1

          return (
            <div key={step.key} className="flex items-start" style={{ flex: isLast ? '0 0 auto' : 1 }}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    {/* Node — checkmark when done, filled dot + brand-tint ring when active, number when future */}
                    <div
                      className={[
                        'flex size-5 items-center justify-center rounded-full border transition-colors',
                        isDone   ? 'bg-chart-2 border-chart-2 text-white' : '',
                        isActive ? 'bg-[var(--brand-color)] border-[var(--brand-color)] text-white ring-4 ring-[var(--brand-tint)]' : '',
                        !isDone && !isActive ? 'bg-card border-border text-muted-foreground' : '',
                      ].filter(Boolean).join(' ')}
                      aria-hidden="true"
                    >
                      {isDone
                        ? <i className="fa-solid fa-check text-[10px]" aria-hidden="true" />
                        : isActive
                          ? <span className="size-1.5 rounded-full bg-white" />
                          : <span className="text-[10px] font-semibold tabular-nums">{i + 1}</span>}
                    </div>
                    {/* Label — all steps labelled (12px min) */}
                    <span
                      className={[
                        'text-xs whitespace-nowrap leading-none transition-colors',
                        isActive ? 'font-semibold text-[var(--brand-color)]' : '',
                        isDone   ? 'font-medium text-chart-2' : '',
                        !isDone && !isActive ? 'font-normal text-muted-foreground' : '',
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

              {/* Connector — vertically centred on the 20px dot (mt-2.5) */}
              {!isLast && (
                <div
                  className={['mx-2 mt-2.5 h-0.5 flex-1 rounded-full transition-colors', isDone ? 'bg-chart-2' : 'bg-border'].join(' ')}
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
