'use client'

/**
 * PCE / CFE module home — "Course Evaluation and Surveys"
 *
 * Per Aarti 2026-05-05 (`e9389c39`): "post course evaluation are very separate
 * and they reside within each course. And I had actually said that's a bad
 * idea because the survey is a survey — post course evaluation is a
 * specialized service. It doesn't make sense to have a completely different
 * place for it."
 *
 * → Single home with two child folders:
 *   - Course Evaluation (per-course PCE — UC-01 + UC-09)
 *   - Programmatic Surveys (annual student/preceptor/alumni — UC-15)
 *
 * Workspace ADR-003 frames this as the per-product surface that lives behind
 * the Prism module-launcher tile (cross-product launcher is a separate
 * Romit-owned workstream).
 */

import Link from 'next/link'
import {
  SidebarTrigger, Separator,
} from '@exxat/ds/packages/ui/src'
import { usePce } from '@/components/pce/pce-state'

interface FolderCardProps {
  href: string
  icon: string
  title: string
  description: string
  metric: { count: number; label: string } | null
  status?: 'available' | 'coming-soon'
}

function FolderCard({ href, icon, title, description, metric, status = 'available' }: FolderCardProps) {
  const isComingSoon = status === 'coming-soon'

  const inner = (
    <article
      className={
        'group relative flex flex-col gap-3 rounded-lg border border-border bg-background p-5 transition-colors ' +
        (isComingSoon
          ? 'cursor-not-allowed opacity-60'
          : 'hover:bg-muted hover:border-border-control-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring')
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-md"
          style={{
            backgroundColor: 'color-mix(in oklch, var(--brand-color) 10%, var(--background))',
          }}
        >
          <i
            className={`fa-light ${icon} text-base`}
            style={{ color: 'var(--brand-color)' }}
            aria-hidden="true"
          />
        </div>
        {isComingSoon ? (
          <span className="text-xs text-muted-foreground">Coming soon</span>
        ) : (
          <i
            className="fa-light fa-arrow-right text-xs text-muted-foreground transition-opacity opacity-0 group-hover:opacity-100"
            aria-hidden="true"
          />
        )}
      </div>

      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {metric && (
        <p className="text-xs text-muted-foreground tabular-nums mt-auto">
          {metric.count} {metric.label}{metric.count === 1 ? '' : 's'}
        </p>
      )}
    </article>
  )

  if (isComingSoon) return inner

  return (
    <Link href={href} className="block" aria-label={`${title}: ${description}`}>
      {inner}
    </Link>
  )
}

export default function ModuleHomePage() {
  const { surveys } = usePce()

  // Course evaluations — current count
  const activeCourseEvals = surveys.filter(s =>
    s.status === 'active' || s.status === 'collecting' || s.status === 'pending_review'
  ).length

  return (
    <>
      <header className="flex items-center gap-2 border-b border-border shrink-0" style={{ padding: '18px 28px 14px' }}>
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <h1 className="flex-1 text-[22px] font-normal" style={{ fontFamily: 'var(--font-heading)' }}>
          Course Evaluation and Surveys
        </h1>
      </header>

      <main className="flex-1 overflow-auto" style={{ padding: '28px 28px 28px' }}>
        <div className="max-w-3xl flex flex-col gap-6">
          <p className="text-sm text-muted-foreground">
            Choose a folder to author, distribute, and analyze evaluations.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FolderCard
              href="/surveys"
              icon="fa-clipboard-list-check"
              title="Course Evaluation"
              description="End-of-term feedback on courses, instructors, and course coordinators."
              metric={
                surveys.length > 0
                  ? { count: activeCourseEvals, label: 'active evaluation' }
                  : null
              }
            />

            <FolderCard
              href="/programmatic-surveys"
              icon="fa-rectangle-list"
              title="Programmatic Surveys"
              description="Annual student, preceptor, alumni, and faculty surveys collected program-wide."
              metric={null}
              status="coming-soon"
            />
          </div>
        </div>
      </main>
    </>
  )
}
