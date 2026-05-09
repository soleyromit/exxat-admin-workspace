'use client'

/**
 * Course Evaluation — Admin course drill-down (Sprint 3).
 * Spec §6 (offering covers question-level + responses; this page is the
 * "course" middle layer aggregating all offerings of one course).
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
  COURSES, FACULTY, DEPT_AVG, SAMPLE_OFFERING_THEMES, TERMS,
} from '@/lib/course-eval-mock'

interface Props {
  params: Promise<{ id: string }>
}

export default function CourseDrillDown({ params }: Props) {
  const { id } = use(params)
  const course = COURSES.find(c => c.id === id)

  if (!course) {
    return (
      <main id="main" tabIndex={-1} className="flex-1 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Course not found.</p>
      </main>
    )
  }

  const faculty = FACULTY.find(f => f.id === course.facultyId)
  // Synthesize per-term offerings (mocked from faculty trajectory as a stand-in)
  const offerings = faculty
    ? faculty.trajectory.map((t, i) => ({
        id: `${course.id}-${t.term}`,
        term: t.term,
        termLabel: TERMS.find(x => x.id === t.term)?.label ?? t.term,
        rating: t.rating,
        responses: 42 + i * 2,
        sent: 51 + i * 2,
      }))
    : []
  const completion = course.sent > 0 ? Math.round((course.responses / course.sent) * 1000) / 10 : 0

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
        <h1 className="text-sm font-semibold flex-1 truncate">{course.name}</h1>
      </header>

      <main
        id="main"
        tabIndex={-1}
        className="flex-1 overflow-auto"
        style={{ padding: '20px 28px 40px', scrollPaddingTop: 60 }}
      >
        <div className="max-w-6xl flex flex-col gap-5">

          <section>
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground font-medium">{course.name}</span> · {course.department}
              {faculty && (
                <>
                  {' · taught by '}
                  <Link href={`/course-eval/faculty/${faculty.id}`} className="hover:underline">
                    {faculty.name}
                  </Link>
                </>
              )}
              {' · '}
              {course.responses} of {course.sent} responses ({completion}%)
            </p>
          </section>

          <Card className="p-4">
            <h2 className="text-sm font-semibold mb-3">Trajectory across {offerings.length} offerings</h2>
            <TrendSparkline
              history={offerings.slice(0, -1).map(o => ({ label: o.termLabel, value: o.rating }))}
              currentValue={offerings[offerings.length - 1]?.rating}
              currentLabel={offerings[offerings.length - 1]?.termLabel}
              width={300}
              height={60}
              min={3.0}
              max={5.0}
              showExtremaMarkers
              showCurrentLabel
              band={{ low: DEPT_AVG - 0.2, high: DEPT_AVG + 0.2 }}
            />
          </Card>

          <Card className="p-4">
            <h2 className="text-sm font-semibold mb-3">Offerings — click to drill in</h2>
            <div className="flex flex-col gap-2">
              {offerings.map(o => (
                <Link
                  key={o.id}
                  href={`/course-eval/offering/${o.id}`}
                  className="grid items-center gap-3 rounded-md p-3 transition-colors hover:bg-muted"
                  style={{ gridTemplateColumns: '160px 1fr 60px 90px', border: '1px solid var(--border)' }}
                >
                  <span className="text-sm font-medium">{o.termLabel}</span>
                  <div className="relative h-3 rounded-sm" style={{ background: 'var(--muted)' }}>
                    <div
                      className="absolute inset-y-0 start-0 rounded-sm"
                      style={{
                        width: `${((o.rating - 3.0) / 2.0) * 100}%`,
                        background: o.rating < DEPT_AVG ? 'var(--chart-4)' : 'var(--chart-1)',
                      }}
                      aria-hidden="true"
                    />
                  </div>
                  <span
                    className="text-sm tabular-nums text-right"
                    style={o.rating < DEPT_AVG ? { color: 'var(--chart-4)', fontWeight: 500 } : undefined}
                  >
                    {o.rating.toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums text-right">
                    {o.responses} / {o.sent}
                  </span>
                </Link>
              ))}
            </div>
          </Card>

          <AiInsightCard
            title="Cross-offering themes"
            themes={SAMPLE_OFFERING_THEMES.map(t => ({
              id: t.id,
              text: t.text,
              mentionsCount: t.mentionsCount,
              totalContext: t.totalCourses,
              sentiment: t.sentiment,
            }))}
            source={`${offerings.reduce((s, o) => s + o.responses, 0)} qualitative responses across ${offerings.length} offerings`}
            confidence="high"
            actions={
              <Button variant="outline" size="sm">View evidence</Button>
            }
          />
        </div>
      </main>
    </>
  )
}
