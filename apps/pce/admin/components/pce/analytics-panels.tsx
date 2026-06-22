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
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  ChartContainer, ChartTooltip, ChartTooltipContent,
  ChartLegend, ChartLegendContent,
} from '@exxatdesignux/ui'
import type { MetricItem, ChartConfig } from '@exxatdesignux/ui'
import { BarChart, Bar, XAxis, YAxis, LineChart, Line, CartesianGrid, Cell } from 'recharts'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import { SurveyStatusBadge } from '@/components/pce/pce-badges'
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
          Nudge
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

  // No early-return: the Program trend + Course/Faculty rankings are program-wide and
  // always have data, so every term profile shows rich viz even if its own courses
  // table is empty (the table renders its own inline empty state).

  return (
    <>
      <KeyMetrics variant="compact" metricsSingleRow metrics={byTermKpis} />

      {/* Program-level trend (full width) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Program trend</CardTitle>
          <CardDescription>Course rating vs. faculty rating across terms.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={programTrendConfig}
            className="w-full"
            style={{ height: 168 }}
            role="img"
            aria-label="Program trend: course avg vs faculty avg across historical terms"
          >
            <LineChart data={programTrendData} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="term" tick={{ fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
              <YAxis domain={[3.4, 4.8]} tickFormatter={(v: number) => v.toFixed(1)} tick={{ fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} width={28} />
              <ChartTooltip content={<ChartTooltipContent formatter={(v: unknown) => [`${(v as number).toFixed(2)}/5`, '']} />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line type="monotone" dataKey="courseAvg"  stroke="var(--color-courseAvg)"  strokeWidth={2} dot={{ r: 3, fill: 'var(--color-courseAvg)'  }} activeDot={{ r: 4 }} isAnimationActive={false} />
              <Line type="monotone" dataKey="facultyAvg" stroke="var(--color-facultyAvg)" strokeWidth={2} dot={{ r: 3, fill: 'var(--color-facultyAvg)' }} activeDot={{ r: 4 }} connectNulls={false} isAnimationActive={false} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Leaderboards: course rankings + faculty rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Course rankings</CardTitle>
            <CardDescription>Enrollment-weighted avg, all time. Color = tier.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={courseRankConfig} style={{ height: `${courseAllTimeRanked.length * 24 + 8}px` }} className="w-full" role="img" aria-label="Course rankings by enrollment-weighted average rating">
              <BarChart layout="vertical" data={courseAllTimeRanked} margin={{ top: 0, right: 36, bottom: 0, left: 0 }}>
                <XAxis type="number" domain={[0, 5]} hide />
                <YAxis type="category" dataKey="code" width={68} tick={{ fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                <Bar dataKey="avg" radius={[0, 3, 3, 0]} maxBarSize={14} background={{ fill: 'var(--muted)' }}>
                  {courseAllTimeRanked.map((c) => <Cell key={c.code} fill={tierColor(c.avg)} />)}
                </Bar>
                <ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(v: unknown) => [`${(v as number).toFixed(2)}/5`, 'Avg rating']} />} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Faculty rankings</CardTitle>
            <CardDescription>Enrollment-weighted avg, all time. Color = tier.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={facultyRankConfig} style={{ height: `${facultyAllTimeRanked.length * 24 + 8}px` }} className="w-full" role="img" aria-label="Faculty rankings by enrollment-weighted average rating">
              <BarChart layout="vertical" data={facultyAllTimeRanked} margin={{ top: 0, right: 36, bottom: 0, left: 0 }}>
                <XAxis type="number" domain={[0, 5]} hide />
                <YAxis type="category" dataKey="name" width={68} tick={{ fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                <Bar dataKey="avg" radius={[0, 3, 3, 0]} maxBarSize={14} background={{ fill: 'var(--muted)' }}>
                  {facultyAllTimeRanked.map((f) => <Cell key={f.name} fill={tierColor(f.avg)} />)}
                </Bar>
                <ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(v: unknown) => [`${(v as number).toFixed(2)}/5`, 'Avg rating']} />} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Courses in {value}</h2>
        <p className="text-xs text-muted-foreground">
          Select courses to push evaluations, or click a row to open its Evaluation Card. Use Nudge for an ad-hoc reminder.
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
                <p className="text-sm text-muted-foreground">No courses scheduled for {value} yet</p>
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
      { id: 'f-courses',    label: 'Courses taught', value: offerings.length,                              delta: '', trend: 'neutral', description: 'across all terms' },
      { id: 'f-rating',     label: 'Avg rating',     value: avgRating > 0 ? `${avgRating.toFixed(1)}/5` : '—', delta: '', trend: 'neutral', description: 'enrollment-weighted' },
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

  if (!faculty) return null

  return (
    <>
      <KeyMetrics variant="compact" metricsSingleRow metrics={facultyKpis} />

      {extraCharts}

      {compareData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Comparative context</CardTitle>
            <CardDescription>
              Enrollment-weighted avg vs. {faculty.department} dept and program average.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {compareData.map((d, i) => {
                const isOwn = i === compareData.length - 1
                return (
                  <div key={d.label} className="flex items-center gap-3">
                    <span className="text-xs w-24 shrink-0 truncate" style={{ color: isOwn ? 'var(--foreground)' : 'var(--muted-foreground)' }}>{d.label}</span>
                    <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
                      <div className="h-3 rounded-full" style={{ width: `${(d.rating / 5) * 100}%`, background: isOwn ? 'var(--brand-color)' : 'var(--muted-foreground)', opacity: isOwn ? 1 : 0.45 }} />
                    </div>
                    <span className="text-sm font-semibold tabular-nums w-10 text-right" style={{ color: isOwn ? 'var(--brand-color)' : 'var(--muted-foreground)' }}>
                      {d.rating.toFixed(1)}<span className="text-muted-foreground font-normal text-xs">/5</span>
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
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
      { id: 'c-rating',     label: 'Avg rating',     value: `${avgRating}/5`,       delta: '', trend: 'neutral', description: 'enrollment-weighted' },
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
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-muted-foreground">
        <i className="fa-light fa-chart-line text-4xl" aria-hidden="true" />
        <p className="text-sm">No cross-term history for this course yet.</p>
      </div>
    )
  }

  return (
    <>
      <KeyMetrics variant="compact" metricsSingleRow metrics={courseKpis} />

      {extraCharts}

      {courseTrendData.length >= 2 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Rating trend — {courseCode}</CardTitle>
            <CardDescription>Enrollment-weighted avg rating per term.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Inline SVG line — reliable in tabs (recharts ResponsiveContainer
                measures 0 height when mounted inside an inactive Radix tab). */}
            {(() => {
              const data = courseTrendData
              const MIN = 3, MAX = 5
              const n = data.length
              const X = (i: number) => n <= 1 ? 50 : (i / (n - 1)) * 100
              const Y = (r: number) => 6 + (1 - (Math.max(MIN, Math.min(MAX, r)) - MIN) / (MAX - MIN)) * 88
              const pts = data.map((d, i) => `${X(i)},${Y(d.rating)}`).join(' ')
              return (
                <div className="flex flex-col" style={{ height: 140 }} role="img" aria-label={`Rating trend for ${courseCode}: ${data.map(d => `${d.term} ${d.rating}`).join(', ')}`}>
                  <div className="flex flex-1 gap-1">
                    <div className="relative w-7 shrink-0">
                      {[5, 4, 3].map(v => (
                        <span key={v} className="absolute right-1 text-[10px] text-muted-foreground tabular-nums -translate-y-1/2" style={{ top: `${Y(v)}%` }}>{v.toFixed(1)}</span>
                      ))}
                    </div>
                    <div className="relative flex-1">
                      {[5, 4, 3].map(v => (
                        <div key={v} className="absolute inset-x-0 border-t border-border" style={{ top: `${Y(v)}%` }} />
                      ))}
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                        <polyline points={pts} fill="none" stroke="var(--brand-color)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
                      </svg>
                      {data.map((d, i) => (
                        <div key={i} className="absolute size-2 rounded-full -translate-x-1/2 -translate-y-1/2" style={{ left: `${X(i)}%`, top: `${Y(d.rating)}%`, background: 'var(--brand-color)' }} title={`${d.term}: ${d.rating}/5`} />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-7 shrink-0" />
                    <div className="flex-1 flex justify-between mt-1">
                      {data.map((d, i) => (
                        <span key={i} className="text-[10px] text-muted-foreground">{d.term}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      )}

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
          />
        </div>
      </div>
    </>
  )
}
