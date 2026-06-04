'use client'

/**
 * WORKFLOW STEP INDICATOR — assessment lifecycle visualizer.
 *
 * Aarti's "pre-publication chair approval workflow" is the differentiator.
 * Surfacing where each assessment is in its 8-step lifecycle makes the
 * approval-to-publication-to-results pipeline visible at a glance.
 *
 * Renders as a horizontal step strip:
 *   Draft ─ Pending ─ Approved ─ Published ─ Ongoing ─ Submitted ─ Results
 *
 * Past steps are filled, current step has a brand pulse, future steps fade.
 * "Changes-requested" branches off the Pending step with a warning treatment.
 */

import type { AssessmentReviewState } from '@/lib/faculty-mock-data'

export interface WorkflowStepIndicatorProps {
  state: AssessmentReviewState | 'draft'
  /** Compact mode — used inline on cards. False = full mode with labels. */
  compact?: boolean
}

const STEPS: { key: AssessmentReviewState | 'draft'; label: string; short: string; icon: string }[] = [
  { key: 'draft',             label: 'Draft',     short: 'Draft',  icon: 'fa-file-pen' },
  { key: 'pending-chair',     label: 'Pending',   short: 'Review', icon: 'fa-hourglass-half' },
  { key: 'approved',          label: 'Approved',  short: 'Ok',     icon: 'fa-check-circle' },
  { key: 'published',         label: 'Published', short: 'Pub',    icon: 'fa-bullhorn' },
  { key: 'in-progress',       label: 'Ongoing',   short: 'Going',  icon: 'fa-play' },
  { key: 'submitted',         label: 'Submitted', short: 'Done',   icon: 'fa-check-double' },
  { key: 'results-published', label: 'Results',   short: 'Results', icon: 'fa-eye' },
]

const STATE_INDEX: Record<AssessmentReviewState | 'draft', number> = {
  'draft': 0,
  'pending-chair': 1,
  'changes-requested': 1,   // sits at "Pending" but with warning style
  'approved': 2,
  'published': 3,
  'in-progress': 4,
  'submitted': 5,
  'results-published': 6,
}

export function WorkflowStepIndicator({ state, compact = false }: WorkflowStepIndicatorProps) {
  const currentIdx = STATE_INDEX[state]
  const isChangesRequested = state === 'changes-requested'

  return (
    <div className="flex items-center gap-0 w-full" role="list" aria-label="Assessment lifecycle progress">
      {STEPS.map((step, i) => {
        const isPast = i < currentIdx
        const isCurrent = i === currentIdx
        const isFuture = i > currentIdx
        // For changes-requested, current step gets a destructive treatment
        const currentTone = isChangesRequested && isCurrent ? 'destructive' : 'brand'

        const dotClass =
          isPast    ? 'bg-chart-2 border-chart-2 text-primary-foreground' :
          isCurrent && currentTone === 'destructive' ? 'bg-chart-5 border-chart-5 text-primary-foreground [animation:pulse-soft_1.8s_ease-in-out_infinite]' :
          isCurrent ? 'bg-brand border-brand text-brand-foreground [animation:pulse-soft_1.8s_ease-in-out_infinite]' :
                      'bg-card border-border text-muted-foreground'
        const labelClass =
          isPast    ? 'text-chart-2' :
          isCurrent && currentTone === 'destructive' ? 'text-chart-5 font-semibold' :
          isCurrent ? 'text-brand-dark font-semibold' :
                      'text-muted-foreground'
        const lineClass =
          i < currentIdx ? 'bg-chart-2' :
          i === currentIdx - 1 || i === currentIdx ? 'bg-border' :
                      'bg-border'

        return (
          <div
            key={step.key}
            role="listitem"
            className="flex items-center first:pl-0 last:pr-0 flex-1 last:flex-none min-w-0"
          >
            {/* Dot + label stack */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div
                className={`flex size-5 items-center justify-center rounded-full border-2 transition-colors ${dotClass}`}
              >
                {isPast ? (
                  <i className="fa-solid fa-check text-[8px]" aria-hidden="true" />
                ) : (
                  <i className={`fa-solid ${step.icon} text-[8px]`} aria-hidden="true" />
                )}
              </div>
              {!compact && (
                <span className={`text-[10px] uppercase tracking-wider whitespace-nowrap ${labelClass}`}>
                  {step.short}
                </span>
              )}
            </div>
            {/* Connector (skip for last) */}
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-1 ${lineClass}`} aria-hidden="true" />
            )}
          </div>
        )
      })}
    </div>
  )
}
