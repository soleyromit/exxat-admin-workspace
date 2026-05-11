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
  Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent,
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

/* DS Card slot composition (replaces hand-rolled <article> + raw divs).
 * Per card.md depth audit: this was one of 3 named Card-substitutes the
 * audit regex couldn't catch. Migration to slots aligns visual treatment
 * with the rest of the workspace. */
function FolderCard({ href, icon, title, description, metric, status = 'available' }: FolderCardProps) {
  const isComingSoon = status === 'coming-soon'

  /* WCAG fix 2026-05-11: opacity-60 on the whole Card dropped muted-foreground
     descendants to 2.57:1 (visual-review caught). Disabled state now uses
     aria-disabled + bg-muted/30 + cursor-not-allowed without descendant opacity
     so all text remains 4.5:1+. The "Coming soon" label conveys disabled state. */
  const cardInner = (
    <Card
      aria-disabled={isComingSoon || undefined}
      className={
        'group relative h-full transition-colors ' +
        (isComingSoon
          ? 'cursor-not-allowed bg-muted/30'
          : 'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring')
      }
    >
      <CardHeader>
        <CardAction>
          {isComingSoon ? (
            <span className="text-xs text-muted-foreground">Coming soon</span>
          ) : (
            <i
              className="fa-light fa-arrow-right text-xs text-muted-foreground transition-opacity opacity-0 group-hover:opacity-100"
              aria-hidden="true"
            />
          )}
        </CardAction>
        <div
          className="flex items-center justify-center w-10 h-10 rounded-md mb-2"
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
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      {metric && (
        <CardContent>
          <p className="text-xs text-muted-foreground tabular-nums">
            {metric.count} {metric.label}{metric.count === 1 ? '' : 's'}
          </p>
        </CardContent>
      )}
    </Card>
  )

  if (isComingSoon) return cardInner

  return (
    <Link href={href} className="block h-full" aria-label={`${title}: ${description}`}>
      {cardInner}
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

      <div className="flex-1 overflow-auto" style={{ padding: '28px 28px 28px' }}>
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
      </div>
    </>
  )
}
