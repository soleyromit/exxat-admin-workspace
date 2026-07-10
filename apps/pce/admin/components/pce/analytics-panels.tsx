'use client'

/**
 * Shared analytics panels — the SINGLE source of design for the By Term / By Faculty /
 * By Course views. Rendered both in the Dashboard tabs (driven by a selector) and in the
 * matching Directory profile pages (driven by the route entity), so the two are always
 * pixel-identical. Each panel owns no dialogs — it calls back to the host via
 * `onOpenSurvey` / `onNudge`, and the host renders the EvaluationCardSheet + Nudge dialog.
 */

import { useMemo, type ReactNode } from 'react'
import {
  Button, KeyMetrics, Avatar, AvatarFallback,
  ChartContainer, ChartTooltip, ChartTooltipContent,
  ChartLegend, ChartLegendContent,
  chartTooltipKeyboardSyncProps,
} from '@exxatdesignux/ui'
import type { MetricItem, ChartConfig } from '@exxatdesignux/ui'
import { BarChart, Bar, XAxis, YAxis, LineChart, Line, CartesianGrid, Cell } from 'recharts'
import {
  ChartCard, ChartFigure, ChartDataTable,
  ChartLeoPlotInsightOverlay,
  type ChartLeoInsight,
} from '@/components/charts-overview'
import { CHART_AXIS_TICK } from '@/lib/chart-typography'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import { SurveyStatusBadge } from '@/components/pce/pce-badges'
import { TermThemesInsight } from '@/components/pce/term-themes-insight'
import { usePce } from '@/components/pce/pce-state'
import { MOCK_SURVEYS, MOCK_FACULTY, MOCK_FACULTY_OFFERINGS } from '@/lib/pce-mock-data'
import type { FacultyOfferingRecord, SurveyStatus } from '@/lib/pce-mock-data'

/* ── shared helpers ── */
export const TERM_ORDER = [
  'Spring 2022', 'Fall 2022', 'Spring 2023', 'Fall 2023',
  'Spring 2024', 'Fall 2024', 'Spring 2025', 'Fall 2025', 'Spring 2026',
]

/* Amber for <3.7, brand for 3.7–4.3, green for ≥4.3. No red per aarti_no_red memory.
   tierColor = chart fills; tierTextColor swaps the amber for AA-safe --chip-4 on text. */
const tierColor = (avg: number) =>
  avg >= 4.3 ? 'var(--chart-2)' : avg >= 3.7 ? 'var(--brand-color)' : 'var(--chart-4)'
const tierTextColor = (avg: number) =>
  avg >= 4.3 ? 'var(--chart-2)' : avg >= 3.7 ? 'var(--brand-color)' : 'var(--chip-4)'

/* Completion % (higher is better): green ≥70, brand ≥60, AA-safe amber below. */
const completionColor = (pct: number) =>
  pct >= 70 ? 'var(--chart-2)' : pct >= 60 ? 'var(--brand-color)' : 'var(--chip-4)'

/* Initials from a display name ("Dr. Anita Patel" → "AP"). */
function initialsOf(name: string): string {
  const parts = name.replace(/^(Dr|Prof|Mr|Ms|Mrs)\.?\s+/i, '').trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

/* Avatar + name cell — matches the canonical SurveysTable instructor column. */
function FacultyCell({ name, initials }: { name: string; initials?: string }) {
  if (!name || name === '—') return <span className="text-sm text-muted-foreground">—</span>
  return (
    <div className="flex items-center gap-1.5 w-fit">
      <Avatar className="h-6 w-6 shrink-0">
        <AvatarFallback className="text-xs" style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}>
          {initials || initialsOf(name)}
        </AvatarFallback>
      </Avatar>
      <span className="text-sm font-medium truncate max-w-32">{name}</span>
    </div>
  )
}

/* Enrollment-weighted average rating. */
function weightedAvg(offerings: FacultyOfferingRecord[]): number {
  const totalEnrolled = offerings.reduce((s, o) => s + o.enrolled, 0)
  if (totalEnrolled === 0) return 0
  return offerings.reduce((s, o) => s + o.avgRating * o.enrolled, 0) / totalEnrolled
}

type FacultyOfferingRow = FacultyOfferingRecord & Record<string, unknown>
type CourseTermRow = {
  id: string; courseCode: string; courseName: string
  primaryFaculty: string; primaryFacultyInitials: string
  enrolled: number; completion: number
  status: string; isReleased: boolean
} & Record<string, unknown>
type CourseOfferingRow = FacultyOfferingRecord & { facultyName: string } & Record<string, unknown>

export type NudgeTarget = { id: string; courseCode: string; courseName: string; nonResponders: number }

/* ── chart configs ── */
const programTrendConfig: ChartConfig = {
  courseAvg:  { label: 'Course avg',  color: 'var(--chart-1)' },
  facultyAvg: { label: 'Faculty avg', color: 'var(--chart-2)' },
}
const courseRankConfig: ChartConfig = { avg: { label: 'Avg rating', color: 'var(--chart-1)' } }
const facultyRankConfig: ChartConfig = { avg: { label: 'Avg rating', color: 'var(--chart-2)' } }
const compareConfig: ChartConfig = { rating: { label: 'Avg rating', color: 'var(--brand-color)' } }
const courseRatingTrendConfig: ChartConfig = { rating: { label: 'Avg rating', color: 'var(--brand-color)' } }

/* ── By Term columns ── */
function buildTermColumns(onNudge: (row: CourseTermRow) => void): ColumnDef<CourseTermRow>[] {
  return [
    // Leading checkbox column — required for `selectable` to render checkboxes + bulk bar.
    { key: 'select', label: '', width: 40, defaultPin: 'left', lockPin: true },
    {
      key: 'courseCode', label: 'Course', sortable: true,
      cell: (row) => (
        <div>
          <p className="text-sm font-medium">{row.courseCode}</p>
          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{row.courseName}</p>
        </div>
      ),
    },
    {
      key: 'primaryFaculty', label: 'Faculty', sortable: true, width: 200,
      cell: (row) => <FacultyCell name={row.primaryFaculty} initials={row.primaryFacultyInitials} />,
    },
    {
      key: 'enrolled', label: 'Students', sortable: true, width: 90,
      header: () => <span className="block text-right">Students</span>,
      cell: (row) => <div className="text-right text-sm tabular-nums">{row.enrolled}</div>,
    },
    {
      key: 'completion', label: 'Completion', sortable: true, width: 110,
      header: () => <span className="block text-right">Completion</span>,
      cell: (row) => (
        <div className="text-right text-sm tabular-nums font-semibold" style={{ color: completionColor(row.completion) }}>
          {row.completion > 0 ? `${row.completion}%` : '—'}
        </div>
      ),
    },
    {
      key: 'status', label: 'Status', sortable: true, width: 220,
      cell: (row) => <SurveyStatusBadge status={row.status as SurveyStatus} />,
    },
    {
      key: 'action', label: '', width: 96,
      cell: (row) => row.status === 'collecting' ? (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => { e.stopPropagation(); onNudge(row) }}
          aria-label={`Send ad-hoc reminder for ${row.courseCode}`}
        >
          Remind
        </Button>
      ) : null,
    },
  ]
}

/* ── By Faculty offering columns ── */
const facultyOfferingColumns: ColumnDef<FacultyOfferingRow>[] = [
  {
    key: 'courseCode', label: 'Course', sortable: true,
    cell: (row) => (
      <div className="min-w-0">
        <p className="text-sm font-medium">{row.courseCode}</p>
        <p className="text-xs text-muted-foreground truncate max-w-[160px]">{row.courseName}</p>
      </div>
    ),
  },
  { key: 'term', label: 'Term', sortable: true, cell: (row) => <span className="text-sm">{row.term}</span> },
  {
    key: 'enrolled', label: 'Enrolled', sortable: true,
    header: () => <span className="block text-right">Enrolled</span>,
    cell: (row) => <div className="text-right tabular-nums text-sm">{row.enrolled}</div>,
  },
  {
    key: 'responseRate', label: 'Completion', sortable: true,
    header: () => <span className="block text-right">Completion</span>,
    cell: (row) => <div className="text-right tabular-nums text-sm">{row.responseRate}%</div>,
  },
  {
    key: 'avgRating', label: 'Rating', sortable: true,
    header: () => <span className="block text-right">Rating</span>,
    cell: (row) => (
      <div className="text-right tabular-nums text-sm font-semibold" style={{ color: tierTextColor(row.avgRating) }}>
        {row.avgRating.toFixed(1)}
      </div>
    ),
  },
  {
    key: 'drill', label: '', width: 32,
    cell: (row) => row.surveyId ? (
      <div className="text-center"><i className="fa-light fa-chevron-right text-muted-foreground text-xs" aria-hidden="true" /></div>
    ) : null,
  },
]

/* ── By Course offering columns ── */
const courseOfferingColumns: ColumnDef<CourseOfferingRow>[] = [
  { key: 'term', label: 'Term', sortable: true, cell: (row) => <span className="text-sm">{row.term}</span> },
  {
    key: 'facultyName', label: 'Faculty', sortable: true, width: 200,
    cell: (row) => (
      <div className="flex items-center gap-1.5 w-fit">
        <Avatar className="h-6 w-6 shrink-0">
          <AvatarFallback className="text-xs" style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}>
            {initialsOf(row.facultyName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-sm truncate max-w-32">{row.facultyName}</p>
        </div>
      </div>
    ),
  },
  {
    key: 'enrolled', label: 'Enrolled', sortable: true,
    header: () => <span className="block text-right">Enrolled</span>,
    cell: (row) => <div className="text-right tabular-nums text-sm">{row.enrolled}</div>,
  },
  {
    key: 'avgRating', label: 'Rating', sortable: true,
    header: () => <span className="block text-right">Rating</span>,
    cell: (row) => (
      <div className="text-right tabular-nums text-sm font-semibold" style={{ color: tierTextColor(row.avgRating) }}>
        {row.avgRating.toFixed(1)}
      </div>
    ),
  },
  {
    key: 'responseRate', label: 'Completion', sortable: true,
    header: () => <span className="block text-right">Completion</span>,
    cell: (row) => <div className="text-right tabular-nums text-sm">{row.responseRate}%</div>,
  },
  {
    key: 'drill', label: '', width: 32,
    cell: (row) => row.surveyId ? (
      <div className="text-center"><i className="fa-light fa-chevron-right text-muted-foreground text-xs" aria-hidden="true" /></div>
    ) : null,
  },
]

/* ════════════════════ By Term panel ════════════════════ */
export function ByTermPanel({
  axis = 'term', value, onOpenSurvey, onNudge,
}: {
  axis?: 'term' | 'cohort'
  value: string
  onOpenSurvey: (surveyId: string) => void
  onNudge: (t: NudgeTarget) => void
}) {
  const { surveys } = usePce()
  const ceSurveysLive = useMemo(() => surveys.filter(s => s.surveyType !== 'programmatic'), [surveys])

  const scopedSurveys = useMemo(
    () => axis === 'term'
      ? ceSurveysLive.filter(s => s.term === value)
      : ceSurveysLive.filter(s => s.cohort === value),
    [ceSurveysLive, axis, value],
  )

  const termCourseRows = useMemo((): CourseTermRow[] => {
    if (scopedSurveys.length > 0) {
      return scopedSurveys.map(s => {
        const primary = s.instructors.find(i => i.role === 'primary') ?? s.instructors[0]
        return {
          id: s.id,
          courseCode: s.courseCode,
          courseName: s.courseName,
          primaryFaculty: primary?.name ?? '—',
          primaryFacultyInitials: primary?.initials ?? (primary?.name ? initialsOf(primary.name) : ''),
          enrolled: s.enrollmentCount,
          completion: s.responseRate,
          status: s.status,
          isReleased: s.status === 'released' || s.status === 'closed',
        }
      })
    }
    // No live CE surveys for this term (e.g. an archived term) — fall back to the
    // term's historical offerings so the profile shows real courses, never a blank.
    if (axis === 'term') {
      return MOCK_FACULTY_OFFERINGS
        .filter(o => o.term === value)
        .map(o => {
          const fac = MOCK_FACULTY.find(f => f.id === o.facultyId)
          return {
            id: `${o.courseCode}-${o.term}-${o.facultyId}`,
            courseCode: o.courseCode,
            courseName: o.courseName,
            primaryFaculty: fac?.name ?? '—',
            primaryFacultyInitials: fac?.initials ?? (fac?.name ? initialsOf(fac.name) : ''),
            enrolled: o.enrolled,
            completion: o.responseRate,
            status: 'released',
            isReleased: true,
          }
        })
    }
    return []
  }, [scopedSurveys, axis, value])

  const byTermKpis: MetricItem[] = useMemo(() => {
    const totalEnrolled  = termCourseRows.reduce((sum, r) => sum + r.enrolled, 0)
    const totalResponses = termCourseRows.reduce((sum, r) => sum + Math.round(r.enrolled * r.completion / 100), 0)
    const overallPct     = totalEnrolled > 0 ? Math.round((totalResponses / totalEnrolled) * 100) : 0
    const collecting     = termCourseRows.filter(r => r.status === 'collecting' || r.status === 'scheduled').length
    return [
      { id: 'completion', label: 'Overall completion', value: `${overallPct}%`,      delta: '', trend: 'neutral', description: `${termCourseRows.length} courses` },
      { id: 'responses',  label: 'Responses',          value: totalResponses,         delta: '', trend: 'neutral', description: `of ${totalEnrolled} enrolled` },
      { id: 'courses',    label: 'Courses',            value: termCourseRows.length,  delta: '', trend: 'neutral', description: value },
      { id: 'collecting', label: 'Collecting',         value: collecting,             delta: '', trend: 'neutral', description: 'still open' },
    ]
  }, [termCourseRows, value])

  const termColumns = useMemo(
    () => buildTermColumns((row) => onNudge({
      id: row.id,
      courseCode: row.courseCode,
      courseName: row.courseName,
      nonResponders: Math.max(0, row.enrolled - Math.round(row.enrolled * row.completion / 100)),
    })),
    [onNudge],
  )

  /* Dual-line trend: aggregate priorOfferings from CE surveys by term. */
  const programTrendData = useMemo(() => {
    const ceSurveys = MOCK_SURVEYS.filter(s => s.surveyType !== 'programmatic')
    const byTerm: Record<string, { courseAvgs: number[]; facultyAvgs: number[] }> = {}
    ceSurveys.forEach(s => {
      s.priorOfferings?.forEach(po => {
        if (!byTerm[po.term]) byTerm[po.term] = { courseAvgs: [], facultyAvgs: [] }
        byTerm[po.term].courseAvgs.push(po.courseAvg)
        if (po.facultyAvg != null) byTerm[po.term].facultyAvgs.push(po.facultyAvg)
      })
    })
    return TERM_ORDER.filter(t => byTerm[t]).map(t => ({
      term: t.replace('Spring ', 'Sp ').replace('Fall ', 'Fa '),
      courseAvg:  +(byTerm[t].courseAvgs.reduce((s, v) => s + v, 0) / byTerm[t].courseAvgs.length).toFixed(2),
      facultyAvg: byTerm[t].facultyAvgs.length > 0
        ? +(byTerm[t].facultyAvgs.reduce((s, v) => s + v, 0) / byTerm[t].facultyAvgs.length).toFixed(2)
        : null,
    }))
  }, [])

  const courseAllTimeRanked = useMemo(() => {
    const byCode: Record<string, { totalRating: number; totalEnrolled: number }> = {}
    MOCK_FACULTY_OFFERINGS.forEach(o => {
      if (!byCode[o.courseCode]) byCode[o.courseCode] = { totalRating: 0, totalEnrolled: 0 }
      byCode[o.courseCode].totalRating   += o.avgRating * o.enrolled
      byCode[o.courseCode].totalEnrolled += o.enrolled
    })
    return Object.entries(byCode)
      .map(([code, v]) => ({ code, avg: v.totalEnrolled > 0 ? +(v.totalRating / v.totalEnrolled).toFixed(2) : 0 }))
      .filter(c => c.avg > 0)
      .sort((a, b) => b.avg - a.avg)
  }, [])

  const facultyAllTimeRanked = useMemo(() => {
    const byFaculty: Record<string, { name: string; totalRating: number; totalEnrolled: number }> = {}
    MOCK_FACULTY_OFFERINGS.forEach(o => {
      const f = MOCK_FACULTY.find(fac => fac.id === o.facultyId)
      if (!f) return
      const last = f.name.split(' ').slice(-1)[0]
      if (!byFaculty[o.facultyId]) byFaculty[o.facultyId] = { name: last, totalRating: 0, totalEnrolled: 0 }
      byFaculty[o.facultyId].totalRating   += o.avgRating * o.enrolled
      byFaculty[o.facultyId].totalEnrolled += o.enrolled
    })
    return Object.values(byFaculty)
      .map(v => ({ name: v.name, avg: v.totalEnrolled > 0 ? +(v.totalRating / v.totalEnrolled).toFixed(2) : 0 }))
      .filter(f => f.avg > 0)
      .sort((a, b) => b.avg - a.avg)
  }, [])

  // ── Leo insights — DS OS chart signature, all values derived from chart data ──
  const programTrendLeo: ChartLeoInsight | null = useMemo(() => {
    if (programTrendData.length < 2) return null
    const last = programTrendData[programTrendData.length - 1]
    const prev = programTrendData[programTrendData.length - 2]
    const delta = +(last.courseAvg - prev.courseAvg).toFixed(2)
    const gap = last.facultyAvg != null ? +(last.facultyAvg - last.courseAvg).toFixed(2) : null
    return {
      headline:
        delta < 0
          ? `Course ratings dipped ${Math.abs(delta).toFixed(2)} in ${last.term}`
          : delta > 0
            ? `Course ratings improved ${delta.toFixed(2)} in ${last.term}`
            : `Course ratings held steady in ${last.term}`,
      explanation:
        gap != null && gap > 0
          ? `Faculty ratings run ${gap.toFixed(2)} above course ratings in the latest term — students consistently rate people higher than course structure. Course-content follow-ups usually close this gap.`
          : 'Course and faculty ratings are moving together across terms.',
      kind: delta < 0 ? 'dip' : 'trend',
      delta: { value: `${delta >= 0 ? '+' : ''}${delta.toFixed(2)}`, label: `vs ${prev.term}` },
      bullets: [
        `${last.term}: course ${last.courseAvg.toFixed(2)}/5${last.facultyAvg != null ? ` · faculty ${last.facultyAvg.toFixed(2)}/5` : ''}.`,
        `${programTrendData.length} terms of history in view.`,
      ],
      anchor: { xValue: last.term, yDataKeys: ['courseAvg', 'facultyAvg'], yCombine: 'max' },
    }
  }, [programTrendData])

  const courseRankLeo: ChartLeoInsight | null = useMemo(() => {
    if (courseAllTimeRanked.length < 2) return null
    const top = courseAllTimeRanked[0]
    const lowest = courseAllTimeRanked[courseAllTimeRanked.length - 1]
    const belowTier = courseAllTimeRanked.filter(c => c.avg < 3.7).length
    return {
      headline:
        lowest.avg < 3.7
          ? `${lowest.code} is the lowest-rated course at ${lowest.avg.toFixed(2)}/5`
          : `${top.code} leads course ratings at ${top.avg.toFixed(2)}/5`,
      explanation:
        belowTier > 0
          ? `${belowTier} course${belowTier !== 1 ? 's sit' : ' sits'} below the 3.7 tier. Their open-text feedback is the first place to look for what to change next offering.`
          : 'Every course is at or above the 3.7 tier — the spread below is a quality band, not a problem list.',
      kind: lowest.avg < 3.7 ? 'anomaly' : 'trend',
      delta: { value: (top.avg - lowest.avg).toFixed(2), label: 'spread, top to bottom' },
      bullets: [
        `${courseAllTimeRanked.filter(c => c.avg >= 4.3).length} course(s) in the green tier (≥4.3).`,
        `${belowTier} course(s) below 3.7 (amber tier).`,
        'Weighted by class size across all terms.',
      ],
      anchor: { xValue: lowest.avg < 3.7 ? lowest.code : top.code, yDataKeys: ['avg'] },
    }
  }, [courseAllTimeRanked])

  const facultyRankLeo: ChartLeoInsight | null = useMemo(() => {
    if (facultyAllTimeRanked.length < 2) return null
    const top = facultyAllTimeRanked[0]
    const lowest = facultyAllTimeRanked[facultyAllTimeRanked.length - 1]
    const belowTier = facultyAllTimeRanked.filter(f => f.avg < 3.7).length
    return {
      headline:
        belowTier > 0
          ? `${lowest.name} is rated below the 3.7 tier at ${lowest.avg.toFixed(2)}/5`
          : `${top.name} leads faculty ratings at ${top.avg.toFixed(2)}/5`,
      explanation:
        belowTier > 0
          ? 'Below-tier faculty ratings usually track specific sections — check the per-section breakdown before drawing conclusions about the person.'
          : 'All faculty rate at or above the 3.7 tier across their weighted offerings.',
      kind: belowTier > 0 ? 'anomaly' : 'trend',
      delta: { value: (top.avg - lowest.avg).toFixed(2), label: 'spread, top to bottom' },
      bullets: [
        `${facultyAllTimeRanked.length} faculty ranked, weighted by class size.`,
        `${facultyAllTimeRanked.filter(f => f.avg >= 4.3).length} in the green tier (≥4.3).`,
      ],
      anchor: { xValue: belowTier > 0 ? lowest.name : top.name, yDataKeys: ['avg'] },
    }
  }, [facultyAllTimeRanked])

  // No early-return: the Program trend + Course/Faculty rankings are program-wide and
  // always have data, so every term profile shows rich viz even if its own courses
  // table is empty (the table renders its own inline empty state).

  return (
    <>
      <KeyMetrics variant="compact" metricsSingleRow metrics={byTermKpis} />

      {/* AI themes — cross-course summary BEFORE the pulled metrics below
          (Aarti 2026-05-08 D14: AI summaries first at every aggregation level) */}
      <TermThemesInsight surveys={scopedSurveys} scopeLabel={value} />

      {/* Program-level trend (full width) — DS OS ChartCard + Leo insight */}
      <ChartCard
        variant="normal"
        title="Program trend"
        description="Course rating vs. faculty rating across terms."
        leoInsight={programTrendLeo}
      >
        <ChartFigure
          label="Program trend"
          summary="Line chart of course average versus faculty average rating across historical terms."
          dataLength={programTrendData.length}
        >
          {(activeIndex) => (
            <>
              <div className="relative w-full">
                <ChartContainer config={programTrendConfig} className="w-full" style={{ height: 168 }}>
                  <LineChart accessibilityLayer data={programTrendData} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="term" tick={CHART_AXIS_TICK} tickLine={false} axisLine={false} />
                    <YAxis domain={[3.4, 4.8]} tickFormatter={(v: number) => v.toFixed(1)} tick={CHART_AXIS_TICK} tickLine={false} axisLine={false} width={28} />
                    <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent formatter={(v: unknown) => [`${(v as number).toFixed(2)}/5`, '']} />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Line type="monotone" dataKey="courseAvg"  stroke="var(--color-courseAvg)"  strokeWidth={2} dot={{ r: 3, fill: 'var(--color-courseAvg)'  }} activeDot={{ r: 4, stroke: 'var(--ring)', strokeWidth: 2 }} isAnimationActive={false} />
                    <Line type="monotone" dataKey="facultyAvg" stroke="var(--color-facultyAvg)" strokeWidth={2} dot={{ r: 3, fill: 'var(--color-facultyAvg)' }} activeDot={{ r: 4, stroke: 'var(--ring)', strokeWidth: 2 }} connectNulls={false} isAnimationActive={false} />
                  </LineChart>
                </ChartContainer>
                <ChartLeoPlotInsightOverlay data={programTrendData} xDataKey="term" />
              </div>
              <ChartDataTable
                caption="Program trend"
                headers={['Term', 'Course avg', 'Faculty avg']}
                rows={programTrendData.map(d => [d.term, d.courseAvg.toFixed(2), d.facultyAvg != null ? d.facultyAvg.toFixed(2) : '—'])}
              />
            </>
          )}
        </ChartFigure>
      </ChartCard>

      {/* Leaderboards: course rankings + faculty rankings — DS OS ChartCard + Leo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          variant="normal"
          title="Course rankings"
          description="Avg rating, weighted by class size · all terms. Color = tier."
          leoInsight={courseRankLeo}
        >
          <ChartFigure
            label="Course rankings"
            summary="Horizontal bar chart ranking courses by enrollment-weighted average rating; bar color marks the quality tier."
            dataLength={courseAllTimeRanked.length}
          >
            {(activeIndex) => (
              <>
                <div className="relative w-full">
                <ChartContainer config={courseRankConfig} style={{ height: `${courseAllTimeRanked.length * 24 + 8}px` }} className="w-full">
                  <BarChart accessibilityLayer layout="vertical" data={courseAllTimeRanked} margin={{ top: 0, right: 36, bottom: 0, left: 0 }}>
                    <XAxis type="number" domain={[0, 5]} hide />
                    <YAxis type="category" dataKey="code" width={68} tick={CHART_AXIS_TICK} tickLine={false} axisLine={false} />
                    <Bar dataKey="avg" radius={[0, 3, 3, 0]} maxBarSize={14} background={{ fill: 'var(--muted)' }} isAnimationActive={false} activeBar={{ stroke: 'var(--ring)', strokeWidth: 2 }} {...(activeIndex != null ? { activeIndex } : {})}>
                      {courseAllTimeRanked.map((c) => <Cell key={c.code} fill={tierColor(c.avg)} />)}
                    </Bar>
                    <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} cursor={false} content={<ChartTooltipContent formatter={(v: unknown) => [`${(v as number).toFixed(2)}/5`, 'Avg rating']} />} />
                  </BarChart>
                </ChartContainer>
                <ChartLeoPlotInsightOverlay data={courseAllTimeRanked} xDataKey="code" chartFamily="bar" />
                </div>
                <ChartDataTable
                  caption="Course rankings"
                  headers={['Course', 'Avg rating']}
                  rows={courseAllTimeRanked.map(c => [c.code, `${c.avg.toFixed(2)}/5`])}
                />
              </>
            )}
          </ChartFigure>
        </ChartCard>

        <ChartCard
          variant="normal"
          title="Faculty rankings"
          description="Avg rating, weighted by class size · all terms. Color = tier."
          leoInsight={facultyRankLeo}
        >
          <ChartFigure
            label="Faculty rankings"
            summary="Horizontal bar chart ranking faculty by enrollment-weighted average rating; bar color marks the quality tier."
            dataLength={facultyAllTimeRanked.length}
          >
            {(activeIndex) => (
              <>
                <div className="relative w-full">
                <ChartContainer config={facultyRankConfig} style={{ height: `${facultyAllTimeRanked.length * 24 + 8}px` }} className="w-full">
                  <BarChart accessibilityLayer layout="vertical" data={facultyAllTimeRanked} margin={{ top: 0, right: 36, bottom: 0, left: 0 }}>
                    <XAxis type="number" domain={[0, 5]} hide />
                    <YAxis type="category" dataKey="name" width={68} tick={CHART_AXIS_TICK} tickLine={false} axisLine={false} />
                    <Bar dataKey="avg" radius={[0, 3, 3, 0]} maxBarSize={14} background={{ fill: 'var(--muted)' }} isAnimationActive={false} activeBar={{ stroke: 'var(--ring)', strokeWidth: 2 }} {...(activeIndex != null ? { activeIndex } : {})}>
                      {facultyAllTimeRanked.map((f) => <Cell key={f.name} fill={tierColor(f.avg)} />)}
                    </Bar>
                    <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} cursor={false} content={<ChartTooltipContent formatter={(v: unknown) => [`${(v as number).toFixed(2)}/5`, 'Avg rating']} />} />
                  </BarChart>
                </ChartContainer>
                <ChartLeoPlotInsightOverlay data={facultyAllTimeRanked} xDataKey="name" chartFamily="bar" />
                </div>
                <ChartDataTable
                  caption="Faculty rankings"
                  headers={['Faculty', 'Avg rating']}
                  rows={facultyAllTimeRanked.map(f => [f.name, `${f.avg.toFixed(2)}/5`])}
                />
              </>
            )}
          </ChartFigure>
        </ChartCard>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Courses in {value}</h2>
        <p className="text-xs text-muted-foreground">
          Select courses to push evaluations, or click a row to open its Evaluation Card. Use Remind for an ad-hoc reminder.
        </p>
        {/* -mx cancels the DataTable's own mx-4/6 so its border aligns flush with the KPIs/charts above */}
        <div className="-mx-4 lg:-mx-6">
          <DataTable<CourseTermRow>
            data={termCourseRows}
            columns={termColumns}
            getRowId={(row) => row.id}
            selectable
            searchable={false}
            bulkActionsSlot={(selected) => (
              <Button
                variant="default"
                size="sm"
                onClick={() => { window.location.href = `/surveys/push?ids=${[...selected].join(',')}` }}
              >
                <i className="fa-light fa-paper-plane" aria-hidden="true" />
                Push {selected.size} evaluation{selected.size !== 1 ? 's' : ''}
              </Button>
            )}
            onRowClick={(row) => onOpenSurvey(row.id)}
            emptyState={
              <div className="flex flex-col items-center gap-2 py-8">
                <i className="fa-light fa-calendar-plus text-muted-foreground" aria-hidden="true" style={{ fontSize: 24 }} />
                <p className="text-sm font-medium">No courses scheduled for {value}</p>
                <p className="text-xs text-muted-foreground">Push an evaluation to populate this term.</p>
              </div>
            }
          />
        </div>
      </div>
    </>
  )
}

/* ════════════════════ By Faculty panel ════════════════════ */
export function ByFacultyPanel({
  facultyId, onOpenSurvey, extraCharts,
}: {
  facultyId: string
  onOpenSurvey: (surveyId: string) => void
  /** Optional viz rendered right after the KPI strip (e.g. profile radar + distribution band). */
  extraCharts?: ReactNode
}) {
  const faculty = MOCK_FACULTY.find(f => f.id === facultyId) ?? null

  const offerings = useMemo(
    () => MOCK_FACULTY_OFFERINGS.filter(o => o.facultyId === facultyId) as FacultyOfferingRow[],
    [facultyId],
  )

  const facultyKpis: MetricItem[] = useMemo(() => {
    if (!faculty) return []
    const avgRating     = +weightedAvg(offerings).toFixed(1)
    const avgCompletion = offerings.length > 0
      ? Math.round(offerings.reduce((s, o) => s + o.responseRate, 0) / offerings.length) : 0
    const termsCount    = new Set(offerings.map(o => o.term)).size
    return [
      { id: 'f-courses',    label: 'Courses taught', value: offerings.length,                              delta: '', trend: 'neutral', description: 'across all terms (all data)' },
      { id: 'f-rating',     label: 'Avg faculty rating', value: avgRating > 0 ? `${avgRating.toFixed(1)}/5` : '—', delta: '', trend: 'neutral', description: 'weighted by class size' },
      { id: 'f-completion', label: 'Avg completion', value: avgCompletion > 0 ? `${avgCompletion}%` : '—',    delta: '', trend: 'neutral', description: 'all offerings' },
      { id: 'f-terms',      label: 'Terms active',   value: termsCount,                                     delta: '', trend: 'neutral', description: 'term appearances' },
    ]
  }, [faculty, offerings])

  /* Comparative bars: own vs dept avg vs school avg (enrollment-weighted). */
  const compareData = useMemo(() => {
    if (!faculty) return []
    const ownOfferings  = MOCK_FACULTY_OFFERINGS.filter(o => o.facultyId === faculty.id)
    const deptIds       = MOCK_FACULTY.filter(f => f.department === faculty.department).map(f => f.id)
    const deptOfferings = MOCK_FACULTY_OFFERINGS.filter(o => deptIds.includes(o.facultyId))
    return [
      { label: 'School avg', rating: +weightedAvg(MOCK_FACULTY_OFFERINGS).toFixed(2) },
      { label: 'Dept avg',   rating: +weightedAvg(deptOfferings).toFixed(2) },
      { label: faculty.name.split(' ').slice(-1)[0], rating: +weightedAvg(ownOfferings).toFixed(2) },
    ]
  }, [faculty])

  // Leo insight — own rating vs dept/school (derived from compareData).
  const compareLeo: ChartLeoInsight | null = (() => {
    if (!faculty || compareData.length < 3) return null
    const own = compareData[2].rating
    const dept = compareData[1].rating
    const diff = +(own - dept).toFixed(2)
    const lastName = faculty.name.split(' ').slice(-1)[0]
    return {
      headline:
        diff < 0
          ? `${lastName} rates ${Math.abs(diff).toFixed(2)} below the ${faculty.department} average`
          : diff > 0
            ? `${lastName} rates ${diff.toFixed(2)} above the ${faculty.department} average`
            : `${lastName} matches the ${faculty.department} average`,
      explanation:
        diff < 0
          ? 'A below-department average usually traces to one or two offerings, not the whole portfolio — check the offerings table below for the outlier terms.'
          : 'Weighted by class size, so large sections move this number more than small ones.',
      kind: diff < 0 ? 'dip' : 'trend',
      delta: { value: `${diff >= 0 ? '+' : ''}${diff.toFixed(2)}`, label: 'vs dept avg' },
      bullets: [
        `School avg ${compareData[0].rating.toFixed(2)}/5 · dept avg ${dept.toFixed(2)}/5 · own ${own.toFixed(2)}/5.`,
        'Enrollment-weighted across all offerings.',
      ],
      anchor: { xValue: compareData[2].label, yDataKeys: ['rating'] },
    }
  })()

  if (!faculty) return null

  return (
    <>
      <KeyMetrics variant="compact" metricsSingleRow metrics={facultyKpis} />

      {extraCharts}

      {compareData.length > 0 && (
        <ChartCard
          variant="normal"
          title="Comparative context"
          description={`Avg rating, weighted by class size, vs. ${faculty.department} dept and program average.`}
          leoInsight={compareLeo}
        >
          <ChartFigure
            label="Comparative context"
            summary={`Horizontal bars comparing ${compareData.map(d => `${d.label} ${d.rating}`).join(', ')} out of 5.`}
            dataLength={compareData.length}
          >
            {(activeIndex) => (
              <>
                <div className="relative w-full">
                <ChartContainer config={compareConfig} style={{ height: `${compareData.length * 40 + 8}px` }} className="w-full">
                  <BarChart accessibilityLayer layout="vertical" data={compareData} margin={{ top: 0, right: 36, bottom: 0, left: 0 }}>
                    <XAxis type="number" domain={[0, 5]} hide />
                    <YAxis type="category" dataKey="label" width={80} tick={CHART_AXIS_TICK} tickLine={false} axisLine={false} />
                    <Bar dataKey="rating" radius={[0, 3, 3, 0]} maxBarSize={14} background={{ fill: 'var(--muted)' }} isAnimationActive={false} activeBar={{ stroke: 'var(--ring)', strokeWidth: 2 }} {...(activeIndex != null ? { activeIndex } : {})}>
                      {compareData.map((d, i) => (
                        <Cell
                          key={d.label}
                          fill={i === compareData.length - 1 ? 'var(--brand-color)' : 'var(--muted-foreground)'}
                          fillOpacity={i === compareData.length - 1 ? 1 : 0.45}
                        />
                      ))}
                    </Bar>
                    <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} cursor={false} content={<ChartTooltipContent formatter={(v: unknown) => [`${(v as number).toFixed(1)}/5`, 'Avg rating']} />} />
                  </BarChart>
                </ChartContainer>
                <ChartLeoPlotInsightOverlay data={compareData} xDataKey="label" chartFamily="bar" />
                </div>
                <ChartDataTable
                  caption="Comparative context"
                  headers={['Scope', 'Avg rating']}
                  rows={compareData.map(d => [d.label, `${d.rating.toFixed(2)}/5`])}
                />
              </>
            )}
          </ChartFigure>
        </ChartCard>
      )}

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">
          Offerings by {faculty.name.split(' ').slice(1).join(' ') || faculty.name}
        </h2>
        <p className="text-xs text-muted-foreground">
          Rows with <i className="fa-light fa-chevron-right" aria-hidden="true" /> have evaluation data — click to open the card.
        </p>
        <div className="-mx-4 lg:-mx-6">
          <DataTable<FacultyOfferingRow>
            data={offerings}
            columns={facultyOfferingColumns}
            getRowId={(row) => `${row.facultyId}-${row.term}-${row.courseCode}`}
            selectable={false}
            searchable={false}
            onRowClick={(row) => { if (row.surveyId) onOpenSurvey(row.surveyId) }}
            emptyState={
              <div className="flex flex-col items-center gap-2 py-6">
                <i className="fa-light fa-chalkboard-user text-muted-foreground" aria-hidden="true" style={{ fontSize: 24 }} />
                <p className="text-sm font-medium">No offerings for this faculty</p>
                <p className="text-xs text-muted-foreground">Course offerings appear here once this faculty member is assigned to a term.</p>
              </div>
            }
          />
        </div>
      </div>
    </>
  )
}

/* ════════════════════ By Course panel ════════════════════ */
export function ByCoursePanel({
  courseCode, onOpenSurvey, extraCharts,
}: {
  courseCode: string
  onOpenSurvey: (surveyId: string) => void
  /** Optional viz rendered right after the KPI strip (e.g. profile radar + distribution band). */
  extraCharts?: ReactNode
}) {
  const courseOfferings = useMemo((): CourseOfferingRow[] => {
    if (!courseCode) return []
    return MOCK_FACULTY_OFFERINGS
      .filter(o => o.courseCode === courseCode)
      .map(o => ({ ...o, facultyName: MOCK_FACULTY.find(f => f.id === o.facultyId)?.name ?? '—' }) as CourseOfferingRow)
      .sort((a, b) => b.term.localeCompare(a.term))
  }, [courseCode])

  const courseKpis: MetricItem[] = useMemo(() => {
    if (!courseOfferings.length) return []
    const avgRating     = +weightedAvg(courseOfferings).toFixed(1)
    const avgCompletion = Math.round(courseOfferings.reduce((s, o) => s + o.responseRate, 0) / courseOfferings.length)
    const sorted        = [...courseOfferings].sort((a, b) => a.term.localeCompare(b.term))
    const trendDir      = sorted.length >= 2
      ? (sorted[sorted.length - 1].avgRating >= sorted[sorted.length - 2].avgRating ? '↗' : '↘')
      : '—'
    return [
      { id: 'c-count',      label: 'Times offered',  value: courseOfferings.length, delta: '', trend: 'neutral', description: 'all terms' },
      { id: 'c-rating',     label: 'Avg rating',     value: `${avgRating}/5`,       delta: '', trend: 'neutral', description: 'weighted by class size' },
      { id: 'c-completion', label: 'Avg completion', value: `${avgCompletion}%`,    delta: '', trend: 'neutral', description: 'all offerings' },
      { id: 'c-trend',      label: 'Trend',          value: trendDir,               delta: '', trend: 'neutral', description: 'vs prior term' },
    ]
  }, [courseOfferings])

  /* Rating trend for this course (enrollment-weighted per term). */
  const courseTrendData = useMemo(() => {
    if (!courseOfferings.length) return []
    const byTerm: Record<string, { total: number; enrolled: number }> = {}
    courseOfferings.forEach(o => {
      if (!byTerm[o.term]) byTerm[o.term] = { total: 0, enrolled: 0 }
      byTerm[o.term].total    += o.avgRating * o.enrolled
      byTerm[o.term].enrolled += o.enrolled
    })
    return TERM_ORDER.filter(t => byTerm[t]).map(t => ({
      term:   t.replace('Spring ', 'Sp ').replace('Fall ', 'Fa '),
      rating: +(byTerm[t].total / byTerm[t].enrolled).toFixed(2),
    }))
  }, [courseOfferings])

  if (courseOfferings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8">
        <i className="fa-light fa-chart-line text-muted-foreground" aria-hidden="true" style={{ fontSize: 24 }} />
        <p className="text-sm font-medium">No cross-term history for this course</p>
        <p className="text-xs text-muted-foreground">Trends appear once this course has been offered in more than one term.</p>
      </div>
    )
  }

  return (
    <>
      <KeyMetrics variant="compact" metricsSingleRow metrics={courseKpis} />

      {extraCharts}

      {courseTrendData.length >= 2 && (() => {
        // Leo insight — slope across offerings (derived from courseTrendData).
        const first = courseTrendData[0]
        const last = courseTrendData[courseTrendData.length - 1]
        const slope = +(last.rating - first.rating).toFixed(2)
        const courseTrendLeo: ChartLeoInsight = {
          headline:
            slope < 0
              ? `${courseCode} has slipped ${Math.abs(slope).toFixed(2)} since ${first.term}`
              : slope > 0
                ? `${courseCode} has improved ${slope.toFixed(2)} since ${first.term}`
                : `${courseCode} has held steady since ${first.term}`,
          explanation:
            slope < 0
              ? 'A multi-term slide is a stronger signal than one bad offering — compare what changed in staffing or structure between the peak term and now.'
              : 'Enrollment-weighted per term, so larger sections carry more weight in each point.',
          kind: slope < 0 ? 'dip' : 'trend',
          delta: { value: `${slope >= 0 ? '+' : ''}${slope.toFixed(2)}`, label: `since ${first.term}` },
          bullets: [
            `Latest: ${last.term} at ${last.rating.toFixed(2)}/5.`,
            `${courseTrendData.length} offerings in view.`,
          ],
          anchor: { xValue: last.term, yDataKeys: ['rating'], yCombine: 'max' },
        }
        return (
          <ChartCard
            variant="normal"
            title={`Rating trend — ${courseCode}`}
            description="Avg rating, weighted by class size, per term."
            leoInsight={courseTrendLeo}
          >
            <ChartFigure
              label={`Rating trend for ${courseCode}`}
              summary={`Line chart of average rating per term: ${courseTrendData.map(d => `${d.term} ${d.rating}`).join(', ')}.`}
              dataLength={courseTrendData.length}
            >
              {(activeIndex) => (
                <>
                  <div className="relative w-full">
                    <ChartContainer config={courseRatingTrendConfig} className="w-full" style={{ height: 140 }}>
                      <LineChart accessibilityLayer data={courseTrendData} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="term" tick={CHART_AXIS_TICK} tickLine={false} axisLine={false} />
                        <YAxis domain={[3, 5]} tickFormatter={(v: number) => v.toFixed(1)} tick={CHART_AXIS_TICK} tickLine={false} axisLine={false} width={28} />
                        <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent formatter={(v: unknown) => [`${(v as number).toFixed(2)}/5`, '']} />} />
                        <Line type="monotone" dataKey="rating" stroke="var(--color-rating)" strokeWidth={2} dot={{ r: 3, fill: 'var(--color-rating)' }} activeDot={{ r: 4, stroke: 'var(--ring)', strokeWidth: 2 }} isAnimationActive={false} />
                      </LineChart>
                    </ChartContainer>
                    <ChartLeoPlotInsightOverlay data={courseTrendData} xDataKey="term" />
                  </div>
                  <ChartDataTable
                    caption={`Rating trend for ${courseCode}`}
                    headers={['Term', 'Avg rating']}
                    rows={courseTrendData.map(d => [d.term, `${d.rating.toFixed(2)}/5`])}
                  />
                </>
              )}
            </ChartFigure>
          </ChartCard>
        )
      })()}

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Offerings of {courseCode}</h2>
        <p className="text-xs text-muted-foreground">Click any row to open the Evaluation Card for that term.</p>
        <div className="-mx-4 lg:-mx-6">
          <DataTable<CourseOfferingRow>
            data={courseOfferings}
            columns={courseOfferingColumns}
            getRowId={(row) => `${row.courseCode}-${row.term}-${row.facultyId}`}
            selectable={false}
            searchable={false}
            onRowClick={(row) => { if (row.surveyId) onOpenSurvey(row.surveyId) }}
            emptyState={
              <div className="flex flex-col items-center gap-2 py-6">
                <i className="fa-light fa-book-open text-muted-foreground" aria-hidden="true" style={{ fontSize: 24 }} />
                <p className="text-sm font-medium">No offerings for this course</p>
                <p className="text-xs text-muted-foreground">Term offerings appear here once this course is scheduled.</p>
              </div>
            }
          />
        </div>
      </div>
    </>
  )
}
