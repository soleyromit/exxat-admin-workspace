'use client'

/**
 * Course Evaluation — Admin faculty drill-down (Sprint 3 of spec).
 *
 * Spec: apps/pce/docs/specs/course-evaluation.md §5
 *
 * Wireframe per §5.1:
 * - Trajectory across last N terms (sparkline + delta + dept-avg band)
 * - Per-course breakdown with bullet vs department average
 * - AI insights — themes from this faculty's evaluations
 *
 * Viz patterns:
 * - trend-sparkline (upgraded with extrema markers + cohort band)
 * - bullet-vs-target (per-course rows)
 * - ai-vs-pulled-lane (AI themes section)
 */

import * as React from 'react'
import Link from 'next/link'
import { use } from 'react'
import {
  Button,
  Card,
  SidebarTrigger, Separator,
} from '@exxat/ds/packages/ui/src'
import { TrendSparkline } from '@/components/pce/trend-sparkline'
import { AiInsightCard } from '@/components/pce/ai-insight-card'
import {
  FACULTY, getFacultyCourses, DEPT_AVG, SAMPLE_OFFERING_THEMES,
} from '@/lib/course-eval-mock'

interface Props {
  params: Promise<{ id: string }>
}

export default function FacultyDrillDown({ params }: Props) {
  const { id } = use(params)
  const faculty = FACULTY.find(f => f.id === id)

  if (!faculty) {
    return (
      <main id="main" tabIndex={-1} className="flex-1 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Faculty not found.</p>
      </main>
    )
  }

  const courses = getFacultyCourses(faculty.id)
  const trajectory = faculty.trajectory.map(t => ({ label: t.term, value: t.rating }))
  const latest = faculty.trajectory[faculty.trajectory.length - 1]
  const prior = faculty.trajectory[faculty.trajectory.length - 2]
  const consecutiveBelow = faculty.trajectory.filter(t => t.rating < DEPT_AVG).length

  return (
    <>
      <header
        className="flex items-center gap-2 border-b border-border shrink-0"
        style={{ padding: '18px 28px 14px' }}
      >
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <Link href="/" className="text-sm text-muted-foreground hover:underline">Admin</Link>
        <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" />
        <Link href="/course-eval" className="text-sm text-muted-foreground hover:underline">
          Course Evaluation
        </Link>
        <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" />
        <h1 className="text-sm font-semibold flex-1 truncate">{faculty.name}</h1>
      </header>

      <main
        id="main"
        tabIndex={-1}
        className="flex-1 overflow-auto"
        style={{ padding: '20px 28px 40px', scrollPaddingTop: 60 }}
      >
        <div className="max-w-6xl flex flex-col gap-5">

          <section aria-labelledby="overview-heading">
            <h2 id="overview-heading" className="sr-only">Overview</h2>
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground font-medium">{faculty.name}</span> · faculty
              {' · '}
              currently teaching {courses.length} courses · avg rating{' '}
              <span className="text-foreground font-medium">{latest.rating.toFixed(1)}</span>{' '}
              (departmental: {DEPT_AVG.toFixed(1)})
            </p>
          </section>

          <Card className="p-4">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-sm font-semibold">Trajectory across {faculty.trajectory.length} terms</h2>
              <Link href="/course-eval" className="text-xs text-muted-foreground hover:underline">
                ← Back to term overview
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <TrendSparkline
                history={trajectory.slice(0, -1)}
                currentValue={latest.rating}
                currentLabel={latest.term}
                width={280}
                height={60}
                min={3.0}
                max={5.0}
                showExtremaMarkers
                showCurrentLabel
                band={{ low: DEPT_AVG - 0.2, high: DEPT_AVG + 0.2 }}
              />
            </div>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {trajectory.map(t => (
                <div key={t.label} className="flex items-baseline justify-between">
                  <span className="text-muted-foreground capitalize">{t.label.replace('-', ' ')}</span>
                  <span
                    className="tabular-nums font-medium"
                    style={t.value < DEPT_AVG ? { color: 'var(--chart-4)' } : undefined}
                  >
                    {t.value.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
            {consecutiveBelow >= 2 && (
              <p className="text-xs mt-3" style={{ color: 'var(--chart-4)' }}>
                <i className="fa-light fa-triangle-exclamation me-1" aria-hidden="true" />
                Below departmental average ({DEPT_AVG.toFixed(1)}) for {consecutiveBelow} terms.
              </p>
            )}
            {prior && (
              <p className="text-xs mt-1 text-muted-foreground">
                Departmental band shaded; sparkline endpoints labeled with current value. Min dot = lowest term, max dot = highest term.
              </p>
            )}
          </Card>

          <Card className="p-4">
            <h2 className="text-sm font-semibold mb-3">Per-course breakdown</h2>
            <div className="flex flex-col gap-3">
              {courses.map(c => {
                const ratingPct = ((c.rating - 3.0) / 2.0) * 100
                const deptPct = ((c.deptAvg - 3.0) / 2.0) * 100
                const belowDept = c.rating < c.deptAvg
                return (
                  <Link
                    key={c.courseId}
                    href={`/course-eval/course/${c.courseId}`}
                    className="block rounded-md p-3 transition-colors hover:bg-muted"
                    style={{ border: '1px solid var(--border)' }}
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-medium">{c.courseName}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {c.responses} of {c.sent} responses
                      </span>
                    </div>
                    <div className="relative h-3 my-2 rounded-sm" style={{ background: 'var(--muted)' }}>
                      <div
                        className="absolute inset-y-0 start-0 rounded-sm"
                        style={{
                          width: `${ratingPct}%`,
                          background: belowDept ? 'var(--chart-4)' : 'var(--chart-1)',
                        }}
                        aria-hidden="true"
                      />
                      <div
                        className="absolute top-0 bottom-0 w-px"
                        style={{
                          left: `${deptPct}%`,
                          background: 'var(--foreground)',
                        }}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="tabular-nums">
                        Rating <span className="font-medium" style={belowDept ? { color: 'var(--chart-4)' } : undefined}>{c.rating.toFixed(1)}</span>
                      </span>
                      <span className="text-muted-foreground tabular-nums">
                        Dept avg: {c.deptAvg.toFixed(1)}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </Card>

          <AiInsightCard
            title="Themes from this faculty's evaluations"
            themes={SAMPLE_OFFERING_THEMES.map(t => ({
              id: t.id,
              text: t.text,
              mentionsCount: t.mentionsCount,
              totalContext: t.totalCourses,
              sentiment: t.sentiment,
            }))}
            source="42 qualitative responses across both courses"
            confidence="high"
            body={
              <p>
                Recommended action: revisit pacing for chapters 7–9 (cited in 12 of 18 mentions).
              </p>
            }
            actions={
              <>
                <Button variant="default" size="sm">Save action</Button>
                <Button variant="outline" size="sm">Discuss with chair</Button>
              </>
            }
          />
        </div>
      </main>
    </>
  )
}
