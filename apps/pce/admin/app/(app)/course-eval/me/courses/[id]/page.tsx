'use client'

/**
 * Course Evaluation — Faculty self-view, per-course (Sprint 4).
 * Spec §7: same drill-down depth as admin's offering view, but scoped
 * to the current faculty's own course. Privacy guardrail in force.
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
  COURSES, FACULTY, DEPT_AVG, SAMPLE_QUESTIONS, SAMPLE_OFFERING_THEMES,
  CURRENT_FACULTY_ID, TERMS,
} from '@/lib/course-eval-mock'

interface Props {
  params: Promise<{ id: string }>
}

export default function MyCourseDetail({ params }: Props) {
  const { id } = use(params)
  const course = COURSES.find(c => c.id === id && c.facultyId === CURRENT_FACULTY_ID)

  // Privacy: refuse to render another faculty's course on /me/ routes.
  if (!course) {
    return (
      <main id="main" tabIndex={-1} className="flex-1 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Course not found in your active assignments.
        </p>
      </main>
    )
  }

  const me = FACULTY.find(f => f.id === CURRENT_FACULTY_ID)!
  const trajectory = me.trajectory.map((t, i) => ({
    label: TERMS.find(x => x.id === t.term)?.label ?? t.term,
    value: t.rating,
  }))

  return (
    <>
      <header
        className="flex items-center gap-2 border-b border-border shrink-0"
        style={{ padding: '18px 28px 14px' }}
      >
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <Link href="/course-eval/me" className="text-sm text-muted-foreground hover:underline">
          My Course Evaluations
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
        <div className="max-w-5xl flex flex-col gap-5">

          <p className="text-sm text-muted-foreground">
            <span className="text-foreground font-medium">{course.name}</span> · {course.department}
            {' · '}
            {course.responses} of {course.sent} responses ({Math.round(course.responses / course.sent * 1000) / 10}%)
          </p>

          <Card className="p-4">
            <h2 className="text-sm font-semibold mb-3">My trajectory in this course</h2>
            <TrendSparkline
              history={trajectory.slice(0, -1)}
              currentValue={trajectory[trajectory.length - 1]?.value}
              currentLabel={trajectory[trajectory.length - 1]?.label}
              width={300}
              height={60}
              min={3.0}
              max={5.0}
              showExtremaMarkers
              showCurrentLabel
              band={{ low: DEPT_AVG - 0.2, high: DEPT_AVG + 0.2 }}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Departmental band shaded · min/max dots labeled.
              {/* Privacy guardrail: no peer-by-name, no percentile. */}
            </p>
          </Card>

          <Card className="p-4">
            <h2 className="text-sm font-semibold mb-3">Quantitative — per question</h2>
            <div className="flex flex-col gap-2">
              {SAMPLE_QUESTIONS.map(q => {
                const max = Math.max(...q.distribution)
                return (
                  <div
                    key={q.id}
                    className="grid items-center gap-3 rounded-md px-3 py-2"
                    style={{ gridTemplateColumns: '1fr 60px 240px', border: '1px solid var(--border)' }}
                  >
                    <span className="text-sm">{q.text}</span>
                    <span className="text-sm tabular-nums font-medium">{q.avg.toFixed(1)}</span>
                    <div className="flex items-end gap-1 h-7" aria-label={`Distribution: ${q.distribution.join(', ')}`}>
                      {q.distribution.map((count, i) => {
                        const h = max > 0 ? (count / max) * 100 : 0
                        return (
                          <div
                            key={i}
                            className="flex-1 rounded-t-sm"
                            style={{
                              height: `${h}%`,
                              minHeight: count > 0 ? 2 : 1,
                              background: count > 0 ? 'var(--chart-1)' : 'var(--muted)',
                            }}
                            title={`${i + 1}: ${count} responses`}
                          />
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          <AiInsightCard
            title="Themes from this course's responses"
            themes={SAMPLE_OFFERING_THEMES.map(t => ({
              id: t.id,
              text: t.text,
              mentionsCount: t.mentionsCount,
              totalContext: t.totalCourses,
              sentiment: t.sentiment,
            }))}
            source={`${course.responses} qualitative responses`}
            confidence="high"
            actions={
              <Button variant="default" size="sm">Add to action plan</Button>
            }
          />
        </div>
      </main>
    </>
  )
}
