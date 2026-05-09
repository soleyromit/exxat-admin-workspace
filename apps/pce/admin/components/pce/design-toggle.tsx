'use client'

/**
 * DesignToggle — switch between the new (course-eval) design surface and
 * the legacy equivalent (analytics / my-surveys / templates).
 *
 * Sits in the page header. Pill UI shows current state highlighted.
 *
 * Why this exists: per Romit 2026-05-09 — the new course-eval surfaces were
 * built parallel to existing PCE workflows rather than merged in. This toggle
 * lets him compare the two designs side by side until merge work happens.
 *
 * The deeper integration (sharing usePce() state, MOCK_TEMPLATES,
 * MOCK_RESPONSES) is a separate refactor — see apps/pce/docs/specs/
 * course-evaluation.md §16 maintenance.
 */

import * as React from 'react'
import Link from 'next/link'

interface Props {
  /** Active variant — which side of the toggle is highlighted */
  active: 'legacy' | 'new'
  /** Path to the legacy equivalent */
  legacyHref: string
  /** Path to the new equivalent */
  newHref: string
  /** Optional override label for legacy side */
  legacyLabel?: string
  /** Optional override label for new side */
  newLabel?: string
  className?: string
}

export function DesignToggle({
  active,
  legacyHref,
  newHref,
  legacyLabel = 'Legacy',
  newLabel = 'New',
  className,
}: Props) {
  return (
    <div
      role="group"
      aria-label="Compare designs"
      className={`flex items-center gap-0.5 rounded-md p-0.5 text-xs ${className ?? ''}`}
      style={{ border: '1px solid var(--border)', background: 'var(--background)' }}
    >
      <Link
        href={legacyHref}
        aria-current={active === 'legacy' ? 'page' : undefined}
        className="px-2.5 py-1 rounded-sm transition-colors"
        style={{
          background: active === 'legacy' ? 'var(--muted)' : 'transparent',
          color: active === 'legacy' ? 'var(--foreground)' : 'var(--muted-foreground)',
          fontWeight: active === 'legacy' ? 500 : 400,
        }}
      >
        {legacyLabel}
      </Link>
      <Link
        href={newHref}
        aria-current={active === 'new' ? 'page' : undefined}
        className="px-2.5 py-1 rounded-sm transition-colors flex items-center gap-1"
        style={{
          background: active === 'new' ? 'var(--muted)' : 'transparent',
          color: active === 'new' ? 'var(--foreground)' : 'var(--muted-foreground)',
          fontWeight: active === 'new' ? 500 : 400,
        }}
      >
        <i
          className="fa-light fa-sparkles text-[10px]"
          style={{ color: 'var(--brand-color)' }}
          aria-hidden="true"
        />
        {newLabel}
      </Link>
    </div>
  )
}

/**
 * Mapping of route pairs. Single source of truth — when the layout of either
 * side changes, update here and the toggle updates everywhere.
 */
export const DESIGN_PAIRS = {
  termOverview:  { legacy: '/analytics',          new: '/course-eval'           },
  cohortOverview:{ legacy: '/analytics?axis=cohort', new: '/course-eval/cohort' },
  myView:        { legacy: '/my-surveys',         new: '/course-eval/me'        },
  templates:     { legacy: '/templates',          new: '/course-eval'           },  // course-eval/templates is stub; route to term overview
} as const
