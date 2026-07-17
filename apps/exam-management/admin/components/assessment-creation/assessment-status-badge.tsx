'use client'

/* Shared lifecycle status badge — matches the product's canonical QBStatusBadge
   (components/qb/badges.tsx): a DS Badge (variant="secondary") rendered as a
   bordered pill with a status icon, tinted with the same --qb-status-* token
   family used by QB / courses / students. Reused by the landing, Review &
   Publish, and Status screens so status renders identically across the product.
   (The DS StatusBadge primitive is alpha/beta/new-only, so Badge is the correct
   base for lifecycle states.) */

import { Badge } from '@exxatdesignux/ui'
import { STATES, type LifecycleState } from './data'

const TINT: Record<LifecycleState, { bg: string; fg: string; border: string; icon: string }> = {
  planned:   { bg: 'var(--qb-status-planned-bg)',   fg: 'var(--qb-status-planned-fg)',   border: 'var(--qb-status-planned-border)',   icon: 'fa-calendar'      },
  draft:     { bg: 'var(--qb-status-draft-bg)',     fg: 'var(--qb-status-draft-fg)',     border: 'var(--qb-status-draft-border)',     icon: 'fa-pen-ruler'     },
  review:    { bg: 'var(--qb-status-review-bg)',    fg: 'var(--qb-status-review-fg)',    border: 'var(--qb-status-review-border)',    icon: 'fa-magnifying-glass' },
  ready:     { bg: 'var(--qb-status-saved-bg)',     fg: 'var(--qb-status-saved-fg)',     border: 'var(--qb-status-saved-border)',     icon: 'fa-circle-check'  },
  completed: { bg: 'var(--qb-status-completed-bg)', fg: 'var(--qb-status-completed-fg)', border: 'var(--qb-status-completed-border)', icon: 'fa-flag-checkered' },
  archived:  { bg: 'var(--qb-status-archived-bg)',  fg: 'var(--qb-status-archived-fg)',  border: 'var(--qb-status-archived-border)',  icon: 'fa-box-archive'   },
}

export function AssessmentStatusBadge({ state, className }: { state: LifecycleState; className?: string }) {
  const t = TINT[state]
  return (
    <Badge
      variant="secondary"
      className={`rounded-full gap-1.5 px-3 py-1 text-[12px] font-semibold whitespace-nowrap border ${className ?? ''}`}
      style={{ backgroundColor: t.bg, color: t.fg, borderColor: t.border }}
    >
      <i className={`fa-regular ${t.icon}`} aria-hidden="true" style={{ fontSize: 11 }} />
      {STATES[state].label}
    </Badge>
  )
}
