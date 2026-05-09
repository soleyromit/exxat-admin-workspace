'use client'

import { useState, useMemo } from 'react'
import {
  Button, Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  ToggleGroup, ToggleGroupItem,
  SidebarTrigger, Separator,
} from '@exxat/ds/packages/ui/src'
import { usePce } from '@/components/pce/pce-state'
import { MOCK_RESPONSES, MOCK_TERMS, MOCK_COHORTS, SECTION_LABELS } from '@/lib/pce-mock-data'

function ScoreBar({ score, max = 5 }: { score: number; max?: number }) {
  return (
    <div className="flex items-center gap-2">
      <div
        style={{
          height: 6,
          width: 80,
          borderRadius: 3,
          backgroundColor: 'var(--muted)',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${(score / max) * 100}%`,
            borderRadius: 3,
            backgroundColor: 'var(--brand-color)',
          }}
        />
      </div>
      <span className="tabular-nums text-sm font-semibold">{score}</span>
    </div>
  )
}

type Axis = 'term' | 'cohort'
type CourseTypeFilter = 'all' | 'didactic' | 'clinical'

export default function AnalyticsPage() {
  const { surveys } = usePce()
  // Per Aarti 2026-05-08 16:09 D4: two top-level axes — Term + Cohort.
  const [axis, setAxis] = useState<Axis>('term')
  const [term, setTerm] = useState('Spring 2026')
  const [cohort, setCohort] = useState('Class of 2026')
  // Per Aarti 2026-05-08 16:09 design task C5: clinical/didactic split on Cohort view.
  const [courseTypeFilter, setCourseTypeFilter] = useState<CourseTypeFilter>('all')

  const scopedSurveys = useMemo(() => {
    let filtered = axis === 'term'
      ? surveys.filter(s => s.term === term)
      : surveys.filter(s => s.cohort === cohort)

    // Course-type filter applies on Cohort view only (per audit C5)
    if (axis === 'cohort' && courseTypeFilter !== 'all') {
      filtered = filtered.filter(s => s.courseType === courseTypeFilter)
    }
    return filtered
  }, [surveys, axis, term, cohort, courseTypeFilter])

  const releasedSurveys = scopedSurveys.filter(s => s.status === 'released' || s.status === 'closed')

  const totalRate = scopedSurveys.length > 0
    ? Math.round(scopedSurveys.reduce((acc, s) => acc + s.responseRate, 0) / scopedSurveys.length)
    : 0

  const completedCount = releasedSurveys.length

  // Aggregate section scores across responses in scope
  const scopedResponses = MOCK_RESPONSES.filter(r =>
    scopedSurveys.some(s => s.id === r.surveyId)
  )

  const sectionAvgs: Record<string, number[]> = {}
  scopedResponses.forEach(r => {
    r.sectionScores.forEach(s => {
      if (!sectionAvgs[s.section]) sectionAvgs[s.section] = []
      sectionAvgs[s.section].push(s.avg)
    })
  })

  const sectionSummary = Object.entries(sectionAvgs).map(([section, avgs]) => ({
    section,
    avg: Math.round((avgs.reduce((a, b) => a + b, 0) / avgs.length) * 10) / 10,
  }))

  // Per-course breakdown
  const courseBreakdown = scopedSurveys.map(survey => {
    const resp = MOCK_RESPONSES.find(r => r.surveyId === survey.id)
    return {
      survey,
      scores: resp?.sectionScores ?? [],
    }
  })

  const hasData = scopedSurveys.length > 0
  const scopeLabel = axis === 'term' ? term : cohort

  return (
    <>
      <header className="flex items-center gap-2 border-b border-border shrink-0" style={{ padding: '18px 28px 14px' }}>
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <h1 className="flex-1 text-[22px] font-normal" style={{ fontFamily: 'var(--font-heading)' }}>Analytics</h1>

        {/* View axis toggle (D4): Term ↔ Cohort. Faculty is one click down (D5) */}
        <ToggleGroup
          type="single"
          value={axis}
          onValueChange={(v) => v && setAxis(v as Axis)}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem value="term" aria-label="Term view">Term</ToggleGroupItem>
          <ToggleGroupItem value="cohort" aria-label="Cohort view">Cohort</ToggleGroupItem>
        </ToggleGroup>

        {axis === 'term' ? (
          <Select value={term} onValueChange={setTerm}>
            <SelectTrigger className="h-8 w-36 text-sm" aria-label="Select term">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MOCK_TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        ) : (
          <Select value={cohort} onValueChange={setCohort}>
            <SelectTrigger className="h-8 w-44 text-sm" aria-label="Select cohort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MOCK_COHORTS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        <Button variant="outline" size="sm">
          <i className="fa-light fa-arrow-down-to-line" aria-hidden="true" />
          Export
        </Button>
      </header>

      <main className="flex-1 overflow-auto" style={{ padding: '20px 28px 28px' }}>
        {!hasData ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <i className="fa-light fa-chart-mixed text-muted-foreground text-4xl" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">No analytics data for {scopeLabel}</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Release surveys to faculty to see aggregated results here.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6 max-w-4xl">

            {/* Course-type filter — Cohort view only (per audit C5) */}
            {axis === 'cohort' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Course type:</span>
                <ToggleGroup
                  type="single"
                  value={courseTypeFilter}
                  onValueChange={(v) => v && setCourseTypeFilter(v as CourseTypeFilter)}
                  size="sm"
                >
                  <ToggleGroupItem value="all" aria-label="All courses">All</ToggleGroupItem>
                  <ToggleGroupItem value="didactic" aria-label="Didactic only">Didactic</ToggleGroupItem>
                  <ToggleGroupItem value="clinical" aria-label="Clinical only">Clinical</ToggleGroupItem>
                </ToggleGroup>
              </div>
            )}

            {/*
              AI insights — pulled-vs-AI lane affordance per docs/patterns/viz/ai-vs-pulled-lane.md.
              Per Aarti 2026-05-08 16:09 D14: AI summaries surface BEFORE question-level detail.
            */}
            <section
              role="region"
              aria-label="AI insight"
              className="rounded-lg border border-border p-4 bg-background"
            >
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
                <i
                  className="fa-light fa-sparkles"
                  style={{ color: 'var(--brand-color)' }}
                  aria-hidden="true"
                />
                <span>AI insight</span>
              </div>
              <p className="text-sm text-foreground mb-2">
                {axis === 'term'
                  ? `Across ${scopedSurveys.length} courses this term, response rate is ${totalRate}%. ${releasedSurveys.length > 0 ? 'Themes from released surveys cluster on pacing and faculty availability.' : 'No surveys released yet — themes will appear once results are available.'}`
                  : `${cohort} has ${scopedSurveys.length} courses${courseTypeFilter !== 'all' ? ` (${courseTypeFilter})` : ''} in scope. ${releasedSurveys.length > 0 ? 'AI will surface cohort-level themes once enough released-survey data is available.' : 'No released surveys yet for this cohort.'}`}
              </p>
              <p className="text-xs text-muted-foreground">
                Based on {scopedResponses.length} response{scopedResponses.length === 1 ? '' : 's'} across {releasedSurveys.length} released survey{releasedSurveys.length === 1 ? '' : 's'}
              </p>
            </section>

            {/* Summary cards — pulled lane (computed metrics, no AI affordance) */}
            <div className="grid grid-cols-2 gap-4">
              {/* Response rates card */}
              <div className="border border-border rounded-lg p-5 flex flex-col gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Response Rates
                </p>
                <div className="flex flex-col gap-1">
                  <p className="text-2xl font-bold tabular-nums">{totalRate}%</p>
                  <p className="text-sm text-muted-foreground">
                    overall average
                  </p>
                </div>
                <div
                  style={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'var(--muted)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${totalRate}%`,
                      borderRadius: 4,
                      backgroundColor: 'var(--brand-color)',
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {completedCount} of {scopedSurveys.length} surveys complete
                </p>
              </div>

              {/* Avg scores card */}
              <div className="border border-border rounded-lg p-5 flex flex-col gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Avg Scores by Section
                </p>
                {sectionSummary.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {sectionSummary.map(({ section, avg }) => (
                      <div key={section} className="flex items-center justify-between gap-3">
                        <span className="text-sm flex-1 text-muted-foreground">
                          {SECTION_LABELS[section as keyof typeof SECTION_LABELS] ?? section}
                        </span>
                        <ScoreBar score={avg} />
                        <span className="text-xs w-6 text-right text-muted-foreground">/5</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No released data yet.</p>
                )}
              </div>
            </div>

            {/* By course table — faculty as a column (one click down per Aarti D5) */}
            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold">By Course</h2>
              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Instructor</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>CC</TableHead>
                      <TableHead>FP</TableHead>
                      <TableHead>CD</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courseBreakdown.map(({ survey, scores }) => {
                      const cc = scores.find(s => s.section === 'course_content')
                      const fp = scores.find(s => s.section === 'faculty_performance')
                      const cd = scores.find(s => s.section === 'course_director')
                      const primary = survey.instructors.find(i => i.role === 'primary')
                      return (
                        <TableRow key={survey.id}>
                          <TableCell>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-medium">{survey.courseCode}</span>
                              <span className="text-xs truncate max-w-32 text-muted-foreground">
                                {survey.courseName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell><span className="text-sm font-medium">{primary?.name ?? '—'}</span></TableCell>
                          <TableCell>
                            {survey.courseType ? (
                              <span className="text-xs capitalize text-muted-foreground">{survey.courseType}</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="tabular-nums text-sm font-semibold">{survey.responseRate}%</span>
                          </TableCell>
                          <TableCell>
                            {cc ? <span className="tabular-nums text-sm font-semibold">{cc.avg}</span> : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell>
                            {fp ? <span className="tabular-nums text-sm font-semibold">{fp.avg}</span> : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell>
                            {cd ? <span className="tabular-nums text-sm font-semibold">{cd.avg}</span> : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

          </div>
        )}
      </main>
    </>
  )
}
