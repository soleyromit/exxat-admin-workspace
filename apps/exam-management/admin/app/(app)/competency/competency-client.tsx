'use client'

/**
 * FACULTY COMPETENCY DASHBOARD — admin-side mirror of the student dashboard.
 *
 * Aarti's email: cross-course competency reporting is a "significant
 * differentiator over ExamSoft." Student-side already shows their progress;
 * this is the faculty-side companion: aggregated across the faculty's students,
 * grouped by course → objective.
 *
 * Follows canonical admin shell: SiteHeader → main → PageHeader → KeyMetrics → content.
 */

import { useMemo, useState } from 'react'
import {
  Button, Badge,
  Tip,
  Collapsible, CollapsibleTrigger, CollapsibleContent,
  LocalBanner,
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { PageHeader } from '@/components/page-header'
import { KeyMetrics, type MetricItem } from '@/components/key-metrics'
import { mockCourses } from '@/lib/qb-mock-data'
import { courseObjectives, facultyStudents } from '@/lib/faculty-mock-data'
import { useFacultySession } from '@/lib/faculty-session'
import { MetricBar, StatusPill } from '@/components/faculty-ui-kit'

export default function CompetencyClient() {
  const { role, faculty, hydrated } = useFacultySession()
  const visibleCourses = useMemo(() => {
    if (!hydrated) return []
    if (role === 'faculty' && faculty) {
      return mockCourses.filter(c => faculty.courses.some(fc => fc.courseId === c.id))
    }
    return mockCourses
  }, [role, faculty, hydrated])

  const allObjectives = useMemo(
    () => courseObjectives.filter(o => visibleCourses.some(c => c.id === o.courseId)),
    [visibleCourses]
  )

  const totalStudents = useMemo(() => {
    const courseIds = visibleCourses.map(c => c.id)
    return facultyStudents.filter(s => s.enrolledCourseIds.some(id => courseIds.includes(id))).length
  }, [visibleCourses])

  const atRiskCount = useMemo(() => {
    const courseIds = visibleCourses.map(c => c.id)
    return facultyStudents.filter(s => s.status === 'at-risk' && s.enrolledCourseIds.some(id => courseIds.includes(id))).length
  }, [visibleCourses])

  const untestedObjectives = allObjectives.filter(o => !o.lastAssessed)
  const tested = allObjectives.filter(o => !!o.lastAssessed)
  const overallAvg = tested.length > 0
    ? Math.round(tested.reduce((sum, o) => sum + o.avgPerformance, 0) / tested.length)
    : 0

  const metrics: MetricItem[] = [
    {
      id: 'avg',
      label: 'Cohort average',
      value: overallAvg > 0 ? `${overallAvg}%` : '—',
      delta: tested.length > 0 ? `${tested.length} of ${allObjectives.length} tested` : 'No data yet',
      trend: 'neutral',
    },
    {
      id: 'at-risk',
      label: 'At-risk students',
      value: atRiskCount,
      delta: totalStudents > 0 ? `of ${totalStudents}` : 'No students',
      trend: 'neutral',
    },
    {
      id: 'untested',
      label: 'Untested objectives',
      value: untestedObjectives.length,
      delta: allObjectives.length > 0 ? `of ${allObjectives.length}` : 'No objectives',
      trend: 'neutral',
    },
    {
      id: 'courses',
      label: 'Active courses',
      value: visibleCourses.length,
      delta: role === 'faculty' ? 'Your courses' : 'All programs',
      trend: 'neutral',
    },
  ]

  return (
    <>
      <SiteHeader title="Competency" />
      <div id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none">
        <PageHeader
          title="Competency"
          subtitle={`${role === 'faculty' ? 'Across your courses' : 'Across all programs'} · ${visibleCourses.length} ${visibleCourses.length === 1 ? 'course' : 'courses'} · ${totalStudents} students · ${allObjectives.length} objectives mapped`}
        />

        <div className="flex flex-1 flex-col gap-5 p-6 overflow-auto">
          <KeyMetrics variant="card" showHeader={false} metricsSingleRow metrics={metrics} />


          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Per-course performance
            </h2>
            {visibleCourses.map(course => (
              <CourseCompetencyCard
                key={course.id}
                course={course}
                objectives={courseObjectives.filter(o => o.courseId === course.id)}
              />
            ))}
          </section>
        </div>
      </div>
    </>
  )
}

// ─── Per-course expandable card ──────────────────────────────────────────────
function CourseCompetencyCard({
  course, objectives,
}: {
  course: typeof mockCourses[number]; objectives: typeof courseObjectives
}) {
  const [open, setOpen] = useState(true)
  const tested = objectives.filter(o => !!o.lastAssessed)
  const avg = tested.length > 0
    ? Math.round(tested.reduce((sum, o) => sum + o.avgPerformance, 0) / tested.length)
    : 0
  const untested = objectives.filter(o => !o.lastAssessed)
  const tone: 'success' | 'info' | 'warning' | 'neutral' =
    avg >= 80 ? 'success' : avg >= 70 ? 'info' : avg > 0 ? 'warning' : 'neutral'
  const valueColor =
    tone === 'success' ? 'text-chart-2' :
    /* WCAG fix 2026-05-11: text-chart-1 / text-chart-4 were 4.2:1 on
       theme-prism background (chart palette tuned for fills, not text).
       Compose darker text via mix-toward-foreground. */
    tone === 'info' ? 'text-[color:var(--chart-1)]' :
    tone === 'warning' ? 'text-[color:var(--chart-4)]' : 'text-muted-foreground'

  const weakest = tested.length > 0
    ? tested.reduce((min, o) => o.avgPerformance < min.avgPerformance ? o : min, tested[0])
    : null

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="flex items-center justify-start gap-4 px-5 py-4 w-full h-auto text-start whitespace-normal rounded-none">
            <div className="flex-1 min-w-0">
              <p className="font-heading text-base font-semibold text-foreground">
                {course.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {tested.length} tested · {untested.length} untested · {objectives.length} total objectives
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Cohort avg
                </span>
                <div className="flex items-center gap-2">
                  <MetricBar value={avg} tone={tone} width="w-20" />
                  <span className={`text-base font-bold tabular-nums ${valueColor}`}>
                    {avg > 0 ? `${avg}%` : '—'}
                  </span>
                </div>
              </div>
              <i
                className={`fa-light fa-chevron-down text-muted-foreground text-sm transition-transform ${open ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </div>
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t border-border px-5 py-4 flex flex-col gap-4">
            {weakest && weakest.avgPerformance < 70 && (
              <LocalBanner
                variant="warning"
                icon="fa-arrow-trend-down"
                title="Weakest area"
                action={{ label: 'Review course', href: `/courses/${course.id}` }}
              >
                <span className="font-medium text-foreground">{weakest.title}</span> — students averaging {weakest.avgPerformance}%. Consider remediation or reviewing question wording.
              </LocalBanner>
            )}

            <div className="flex flex-col gap-2">
              {objectives.map(o => {
                const t: 'success' | 'info' | 'warning' | 'neutral' =
                  o.avgPerformance >= 80 ? 'success' : o.avgPerformance >= 70 ? 'info' : o.avgPerformance > 0 ? 'warning' : 'neutral'
                const c =
                  t === 'success' ? 'text-chart-2' :
                  t === 'info' ? 'text-[color:var(--chart-1)]' :
                  t === 'warning' ? 'text-[color:var(--chart-4)]' : 'text-muted-foreground'
                const isTested = !!o.lastAssessed
                return (
                  <div key={o.id} className="flex items-center gap-3 text-sm">
                    <span className="flex-1 truncate text-foreground" title={o.title}>{o.title}</span>
                    <span className="text-[10px] text-muted-foreground tabular-nums w-16 text-end shrink-0">
                      {o.questionCount} Qs · {o.assessmentsCovered} on exams
                    </span>
                    <div className="flex items-center gap-2 w-28">
                      {isTested ? (
                        <>
                          <MetricBar value={o.avgPerformance} tone={t} width="w-full flex-1" />
                          <span className={`text-xs font-bold tabular-nums w-9 text-end ${c}`}>
                            {o.avgPerformance}%
                          </span>
                        </>
                      ) : (
                        <Tip label="No assessment has tested this objective yet">
                          <span>
                            <StatusPill tone="warning" icon="fa-circle-dashed" label="Untested" />
                          </span>
                        </Tip>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
