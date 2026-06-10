'use client'

/* Shared lifecycle status badge — a DS Badge (pill, text-xs) tinted with the
   DS hue-at-alpha pattern proven on the live DS data-list. Reused by the
   landing, Review & Publish, and Status screens so status renders identically
   everywhere. (The DS StatusBadge primitive is alpha/beta/new-only, so Badge is
   the correct base for lifecycle states.) */

import { Badge } from '@exxatdesignux/ui'
import { STATES, type LifecycleState } from './data'

const TINT: Record<LifecycleState, { bg: string; fg: string }> = {
  planned:   { bg: 'oklch(from var(--chart-4) l c h / 0.14)', fg: 'var(--chip-4)' },
  draft:     { bg: 'oklch(from var(--chart-4) l c h / 0.14)', fg: 'var(--chip-4)' },
  review:    { bg: 'oklch(from var(--chart-1) l c h / 0.12)', fg: 'var(--chip-1)' },
  ready:     { bg: 'oklch(from var(--chart-2) l c h / 0.14)', fg: 'var(--chip-2)' },
  completed: { bg: 'oklch(from var(--chart-2) l c h / 0.14)', fg: 'var(--chip-2)' },
  archived:  { bg: 'var(--muted)', fg: 'var(--muted-foreground)' },
}

export function AssessmentStatusBadge({ state, className }: { state: LifecycleState; className?: string }) {
  const t = TINT[state]
  return (
    <Badge variant="secondary" className={`font-medium ${className ?? ''}`} style={{ backgroundColor: t.bg, color: t.fg }}>
      {STATES[state].label}
    </Badge>
  )
}
