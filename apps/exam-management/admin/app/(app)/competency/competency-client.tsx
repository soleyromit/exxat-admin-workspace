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
import Link from 'next/link'
import {
  Button, Badge,
  Tooltip, TooltipTrigger, TooltipContent,
  Collapsible, CollapsibleTrigger, CollapsibleContent,
} from '@exxat/ds/packages/ui/src'
import { SiteHeader } from '@/components/site-header'
import { PageHeader } from '@/components/page-header'
import { KeyMetrics, type Metric } from '@/components/key-metrics'
import { mockCourses } from '@/lib/qb-mock-data'
import { courseObjectives, facultyStudents } from '@/lib/faculty-mock-data'
import { useFacultySession } from '@/lib/faculty-session'
import { MetricBar, ToneCallout, StatusPill } from '@/components/faculty-ui-kit'
import { AiGenerateModal } from '@/components/ai-generate-modal'

export default function CompetencyClient() {
  const { role, faculty, hydrated } = useFacultySession()
  const [aiOpen, setAiOpen] = useState(false)

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

  const metrics: Metric[] = [
    { id: 'avg',      label: 'Cohort average',      value: overallAvg > 0 ? `${overallAvg}%` : '—' },
    { id: 'at-risk',  label: 'At-risk students',    value: atRiskCount },
    { id: 'untested', label: 'Untested objectives', value: untestedObjectives.length },
    { id: 'courses',  label: 'Active courses',      value: visibleCourses.length },
  ]

  return (
    <>
      <SiteHeader title="Competency" />
      <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none">
        <PageHeader
          title="Competency"
          subtitle={`${role === 'faculty' ? 'Across your courses' : 'Across all programs'} · ${visibleCourses.length} ${visibleCourses.length === 1 ? 'course' : 'courses'} · ${totalStudents} students · ${allObjectives.length} objectives mapped`}
        />

        <div className="flex flex-1 flex-col gap-5 p-6 overflow-auto">
          <KeyMetrics metrics={metrics} />

          {untestedObjectives.length > 0 && (
            <ToneCallout
              tone="brand"
              icon="fa-duotone fa-solid fa-star-christmas"
              title={`AI can help close ${untestedObjectives.length} curriculum ${untestedObjectives.length === 1 ? 'gap' : 'gaps'}`}
              description={
                <>
                  Generate {untestedObjectives.length === 1 ? 'a draft question' : 'draft questions'} from {untestedObjectives.length === 1 ? 'this' : 'these'} untested {untestedObjectives.length === 1 ? 'objective' : 'objectives'}, then review &amp; refine before adding to your bank.
                  <span className="flex flex-col gap-1.5 mt-3">
                    {untestedObjectives.slice(0, 4).map(o => (
                      <span
                        key={o.id}
                        className="inline-flex items-center gap-2 rounded-md bg-background border border-brand/22 px-2.5 py-1.5 text-xs font-medium text-foreground"
                      >
                        <i className="fa-light fa-circle-dashed text-chart-4 shrink-0" aria-hidden="true" style={{ fontSize: 10 }} />
                        <span className="line-clamp-1">{o.title}</span>
                      </span>
                    ))}
                    {untestedObjectives.length > 4 && (
                      <span className="inline-flex items-center text-xs text-muted-foreground">
                        +{untestedObjectives.length - 4} more
                      </span>
                    )}
                  </span>
                </>
              }
              actions={
                <Button size="sm" className="gap-2" onClick={() => setAiOpen(true)}>
                  <i className="fa-duotone fa-solid fa-star-christmas text-brand" aria-hidden="true" />
                  Generate questions
                </Button>
              }
            />
          )}

          {/* AI generation modal — controlled by aiOpen, rendered always */}
          <AiGenerateModal
            open={aiOpen}
            onOpenChange={setAiOpen}
            objectives={untestedObjectives}
          />

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
      </main>
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
    tone === 'info' ? 'text-chart-1' :
    tone === 'warning' ? 'text-chart-4' : 'text-muted-foreground'

  const weakest = tested.length > 0
    ? tested.reduce((min, o) => o.avgPerformance < min.avgPerformance ? o : min, tested[0])
    : null

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-4 px-5 py-4 w-full text-start hover:bg-muted/30 transition-colors">
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
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t border-border px-5 py-4 flex flex-col gap-4">
            {weakest && weakest.avgPerformance < 70 && (
              <div className="rounded-lg border border-chart-4/22 bg-chart-4/7 p-3 flex items-start gap-3">
                <i className="fa-light fa-arrow-trend-down text-chart-4 text-sm mt-0.5" aria-hidden="true" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    Weakest area
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{weakest.title}</span> — students averaging {weakest.avgPerformance}%. Consider remediation or reviewing question wording.
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/courses/${course.id}`}>Review course</Link>
                </Button>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {objectives.map(o => {
                const t: 'success' | 'info' | 'warning' | 'neutral' =
                  o.avgPerformance >= 80 ? 'success' : o.avgPerformance >= 70 ? 'info' : o.avgPerformance > 0 ? 'warning' : 'neutral'
                const c =
                  t === 'success' ? 'text-chart-2' :
                  t === 'info' ? 'text-chart-1' :
                  t === 'warning' ? 'text-chart-4' : 'text-muted-foreground'
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
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <StatusPill tone="warning" icon="fa-circle-dashed" label="Untested" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            No assessment has tested this objective yet
                          </TooltipContent>
                        </Tooltip>
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
