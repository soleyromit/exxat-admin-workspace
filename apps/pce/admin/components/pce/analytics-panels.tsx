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
import { CourseRankDots, GapQuadrant, CourseTrendStack, FacultyLeaderboardDots } from '@/components/pce/analytics-plots'
import { TruncatedText } from '@/components/truncated-text'
import { CHART_AXIS_TICK } from '@/lib/chart-typography'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import { SurveyStatusBadge } from '@/components/pce/pce-badges'
import { TermThemesInsight } from '@/components/pce/term-themes-insight'
import { usePce } from '@/components/pce/pce-state'
import { MOCK_SURVEYS, MOCK_FACULTY, MOCK_FACULTY_OFFERINGS } from '@/lib/pce-mock-data'
import {
  termKpis, termCourseBreakdown, termSeries, courseStats, gapPoints, medianOf,
  courseTrend, courseFacultyStats, type TermCourseRow,
} from '@/lib/pce-analytics'
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
type TermBreakdownRow = TermCourseRow & Record<string, unknown>

export type NudgeTarget = { id: string; courseCode: string; courseName: string; nonResponders: number }

/* ── chart configs ── */
const programTrendConfig: ChartConfig = {
  courseAvg:  { label: 'Course avg',  color: 'var(--chart-1)' },
  facultyAvg: { label: 'Faculty avg', color: 'var(--chart-2)' },
}
const courseRankConfig: ChartConfig = { avg: { label: 'Avg rating', color: 'var(--chart-1)' } }
const facultyRankConfig: ChartConfig = { avg: { label: 'Avg rating', color: 'var(--chart-2)' } }
const courseRatingTrendConfig: ChartConfig = { rating: { label: 'Avg rating', color: 'var(--brand-color)' } }

/* ── By Term columns ── */
/**
 * By Term row 3 — the "what went wrong in this term" table.
 *
 * Content and teaching stay in separate columns rather than averaging into one (D7 / D27:
 * "average score does not mean anything… each actor will have their score"). Below-median
 * scores take `--chip-4` amber, never red (VIZ-004, Aarti), and always pair the colour with
 * the number itself so colour is never the only encoding (A11Y-008).
 */
const TERM_BREAKDOWN_COLUMNS: ColumnDef<TermBreakdownRow>[] = [
  {
    key: 'courseCode', label: 'Course', sortable: true,
    cell: (row) => (
      <div>
        <p className="text-sm font-medium">{row.courseCode}</p>
        <TruncatedText className="text-xs text-muted-foreground max-w-[200px]">{row.courseName}</TruncatedText>
      </div>
    ),
  },
  {
    key: 'faculty', label: 'Faculty', sortable: true, width: 200,
    cell: (row) => <FacultyCell name={row.faculty[0] ?? '—'} />,
  },
  {
    key: 'courseAvg', label: 'Content', sortable: true, width: 110,
    header: () => <span className="block text-right">Content</span>,
    cell: (row) => (
      <div className="text-right text-sm tabular-nums font-semibold" style={{ color: row.courseAvg != null ? tierTextColor(row.courseAvg) : 'var(--muted-foreground)' }}>
        {row.courseAvg != null ? row.courseAvg.toFixed(2) : '—'}
      </div>
    ),
  },
  {
    key: 'facultyAvg', label: 'Teaching', sortable: true, width: 110,
    header: () => <span className="block text-right">Teaching</span>,
    cell: (row) => (
      <div className="text-right text-sm tabular-nums font-semibold" style={{ color: row.facultyAvg != null ? tierTextColor(row.facultyAvg) : 'var(--muted-foreground)' }}>
        {row.facultyAvg != null ? row.facultyAvg.toFixed(2) : '—'}
      </div>
    ),
  },
  {
    key: 'responseRate', label: 'Response', sortable: true, width: 130,
    header: () => <span className="block text-right">Response</span>,
    cell: (row) => (
      <div className="text-right">
        <span className="block text-sm tabular-nums font-semibold" style={{ color: completionColor(row.responseRate) }}>
          {row.responseRate}%
        </span>
        <span className="block text-xs text-muted-foreground tabular-nums">
          {row.responded} of {row.enrolled}
        </span>
      </div>
    ),
  },
]

function buildTermColumns(onNudge: (row: CourseTermRow) => void): ColumnDef<CourseTermRow>[] {
  return [
    // Leading checkbox column — required for `selectable` to render checkboxes + bulk bar.
    { key: 'select', label: '', width: 40, defaultPin: 'left', lockPin: true },
    {
      key: 'courseCode', label: 'Course', sortable: true,
      cell: (row) => (
        <div>
          <p className="text-sm font-medium">{row.courseCode}</p>
          <TruncatedText className="text-xs text-muted-foreground max-w-[200px]">{row.courseName}</TruncatedText>
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
        <TruncatedText className="text-xs text-muted-foreground max-w-[160px]">{row.courseName}</TruncatedText>
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

  /**
   * Row 1 of Monil's tab template, and it was the wrong four numbers.
   *
   * This used to render Overall completion / Responses / Courses / Collecting — those are
   * response-COLLECTION ops metrics (they belong on the Dashboard, which is a collection
   * cockpit). The tab's job is "is the program improving over time", and it carried no score
   * at all. The legacy app got this right: Terms tracked · Avg Response Rate ↑3% · Avg Score
   * ↑0.1 · Total Responses — and the deltas-vs-previous-term are the part that makes a term
   * KPI mean anything, since a term number without its predecessor answers nothing.
   *
   * Score is split course-content vs faculty rather than averaged into one (D7 / D27, Monil
   * and Aarti independently: "average score does not mean anything… each actor will have
   * their score"). Cohort axis keeps the old collection framing — the canonical term
   * derivations are term-keyed, and cohort as an axis is still unreconciled (Aarti D4 vs the
   * accepted July model), so it is not silently re-grained here.
   */
  const termStats = useMemo(() => (axis === 'term' ? termKpis(value) : null), [axis, value])
  const termBreakdown = useMemo<TermBreakdownRow[]>(
    () => (axis === 'term' ? (termCourseBreakdown(value) as TermBreakdownRow[]) : []),
    [axis, value],
  )
  const termBreakdownColumns = TERM_BREAKDOWN_COLUMNS

  const byTermKpis: MetricItem[] = useMemo(() => {
    if (!termStats) {
      const totalEnrolled  = termCourseRows.reduce((sum, r) => sum + r.enrolled, 0)
      const totalResponses = termCourseRows.reduce((sum, r) => sum + Math.round(r.enrolled * r.completion / 100), 0)
      const overallPct     = totalEnrolled > 0 ? Math.round((totalResponses / totalEnrolled) * 100) : 0
      return [
        { id: 'completion', label: 'Overall completion', value: `${overallPct}%`,     delta: '', trend: 'neutral', description: `${termCourseRows.length} courses` },
        { id: 'responses',  label: 'Responses',          value: totalResponses,        delta: '', trend: 'neutral', description: `of ${totalEnrolled} enrolled` },
        { id: 'courses',    label: 'Courses',            value: termCourseRows.length, delta: '', trend: 'neutral', description: value },
      ]
    }
    const t = termStats
    const signed = (d: number | null, suffix = '') =>
      d == null ? '' : `${d >= 0 ? '+' : ''}${suffix === '%' ? Math.round(d) : d.toFixed(2)}${suffix}`
    const dir = (d: number | null): 'up' | 'down' | 'neutral' =>
      d == null || d === 0 ? 'neutral' : d > 0 ? 'up' : 'down'
    return [
      {
        id: 'term-course-avg', label: 'Course score',
        value: t.courseAvg != null ? t.courseAvg.toFixed(2) : '—',
        delta: signed(t.courseDelta), trend: dir(t.courseDelta),
        // informational: an arrow tinted red on a score is banned (VIZ-004, Aarti).
        trendPolarity: 'informational',
        description: 'content · vs prior term',
      },
      {
        id: 'term-faculty-avg', label: 'Faculty score',
        value: t.facultyAvg != null ? t.facultyAvg.toFixed(2) : '—',
        delta: signed(t.facultyDelta), trend: dir(t.facultyDelta),
        trendPolarity: 'informational',
        description: 'teaching · vs prior term',
      },
      {
        id: 'term-response', label: 'Response rate',
        value: t.responseRate != null ? `${t.responseRate}%` : '—',
        delta: signed(t.responseDelta, '%'), trend: dir(t.responseDelta),
        trendPolarity: 'informational',
        description: `${t.responded.toLocaleString()} of ${t.enrolled.toLocaleString()} · target 80%`,
      },
      {
        id: 'term-courses', label: 'Courses evaluated',
        value: t.courses, delta: '', trend: 'neutral',
        description: value,
      },
    ]
  }, [termStats, termCourseRows, value])

  /* Term-scoped derivations for row 2. Scoped to THIS term — the trend above is all-terms
     by design (Monil: "trend graph is not for a single term, but for all the terms"), so the
     single-term answer has to live somewhere, and these are it. */
  const termScopedCourses = useMemo(
    () => (axis === 'term' ? courseStats(value) : []),
    [axis, value],
  )
  const termScopedMedian = useMemo(
    () => medianOf(termScopedCourses.map(c => c.score.weighted)),
    [termScopedCourses],
  )
  const termGaps = useMemo(() => (axis === 'term' ? gapPoints(value) : []), [axis, value])
  const termGapMeans = useMemo(() => ({
    course: termGaps.length ? termGaps.reduce((s, g) => s + g.courseAvg, 0) / termGaps.length : 0,
    faculty: termGaps.length ? termGaps.reduce((s, g) => s + g.facultyAvg, 0) / termGaps.length : 0,
  }), [termGaps])

  const termSpreadLeo: ChartLeoInsight | null = useMemo(() => {
    if (termScopedCourses.length < 2) return null
    const worst = termScopedCourses[termScopedCourses.length - 1]!
    const below = termScopedCourses.filter(c => c.score.weighted < termScopedMedian)
    return {
      // Frequency count, not a percentage — Aarti D17.
      headline: `${below.length} of ${termScopedCourses.length} courses sit below the ${termScopedMedian.toFixed(2)} median in ${value}`,
      explanation:
        `This is the term's own spread, not the program's — a course can sit above the all-time median and still ` +
        `be the weakest thing that ran this term. ${worst.courseCode} is lowest at ${worst.score.weighted.toFixed(2)}.`,
      kind: below.length > 0 ? 'anomaly' : 'trend',
      delta: { value: worst.score.weighted.toFixed(2), label: `lowest — ${worst.courseCode}` },
      bullets: [
        `${worst.courseCode} — ${worst.courseName}: ${worst.score.weighted.toFixed(2)} content · ${worst.responseRate}% response.`,
        `Term median ${termScopedMedian.toFixed(2)} across ${termScopedCourses.length} courses.`,
      ],
      anchor: { yValue: worst.score.weighted },
    }
  }, [termScopedCourses, termScopedMedian, value])

  const termGapLeo: ChartLeoInsight | null = useMemo(() => {
    if (termGaps.length < 3) return null
    const widest = [...termGaps].sort((a, b) => (b.facultyAvg - b.courseAvg) - (a.facultyAvg - a.courseAvg))[0]!
    const gap = widest.facultyAvg - widest.courseAvg
    const bothLow = termGaps.filter(g => g.courseAvg < termGapMeans.course && g.facultyAvg < termGapMeans.faculty)
    return {
      headline: `${widest.courseCode} scores ${gap.toFixed(2)} higher on teaching than on content this term`,
      explanation:
        `When the instructor rates well above the material, coaching the person will not move the number — the ` +
        `content needs work. ${bothLow.length} course${bothLow.length === 1 ? '' : 's'} in ${value} sit below both term means.`,
      kind: 'anomaly',
      delta: { value: `+${gap.toFixed(2)}`, label: 'faculty over content' },
      bullets: [
        `${widest.courseCode}: content ${widest.courseAvg.toFixed(2)} vs teaching ${widest.facultyAvg.toFixed(2)}.`,
        `${bothLow.length} of ${termGaps.length} courses below both term means.`,
      ],
      anchor: { yValue: widest.facultyAvg },
    }
  }, [termGaps, termGapMeans, value])

  const termColumns = useMemo(
    () => buildTermColumns((row) => onNudge({
      id: row.id,
      courseCode: row.courseCode,
      courseName: row.courseName,
      nonResponders: Math.max(0, row.enrolled - Math.round(row.enrolled * row.completion / 100)),
    })),
    [onNudge],
  )

  /**
   * Dual-line trend, from the CANONICAL term series.
   *
   * This used to aggregate `priorOfferings` off the surveys, which put the chart on a
   * different dataset from the KPIs directly above it: the trend ran Fa 2022 → Sp 2025 while
   * the KPI strip said Spring 2026, and `priorOfferings` only covered 5 of 15 courses. One
   * tab, two universes — the exact "numbers disagree with each other" failure (§4) that
   * `lib/pce-analytics.ts` exists to end. Every surface now derives from one place.
   */
  const programTrendData = useMemo(
    () =>
      termSeries()
        .filter(s => s.courseAvg != null)
        .map(s => ({
          term: s.short,
          courseAvg: s.courseAvg as number,
          facultyAvg: s.facultyAvg,
        })),
    [],
  )

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
      {/* ChartCard titles are h3, and the first visible h2 on this panel is further down, so
          the document jumps h1 → h3 (axe `heading-order`). The section is real; it just
          doesn't need to be seen. */}
      <h2 className="sr-only">{axis === 'term' ? `${value} overview` : `${value} cohort overview`}</h2>

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

              {/* §2.4 — the per-term delta chip row, and the doc singles it out as "the one
                  place the surface does [viz-first] well": the line gives the shape, the
                  chips give the exact value and its direction. Legal under VIZ-002 precisely
                  BECAUSE the line is above it — text below a chart labels values, it does
                  not interpret them. Negative deltas amber, never red (VIZ-004). */}
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-border pt-2">
                {programTrendData.map((d, i, arr) => {
                  const prev = i > 0 ? arr[i - 1].courseAvg : null
                  const delta = prev != null ? d.courseAvg - prev : null
                  const isScoped = d.term === value.replace('Spring ', 'Sp ').replace('Fall ', 'Fa ')
                  return (
                    <div key={d.term} className="flex flex-col">
                      <span className={`text-xs ${isScoped ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                        {d.term}
                      </span>
                      <span className="text-sm tabular-nums">{d.courseAvg.toFixed(2)}</span>
                      <span
                        className="text-xs tabular-nums"
                        style={{ color: delta != null && delta < 0 ? 'var(--chip-4)' : 'var(--muted-foreground)' }}
                      >
                        {delta == null ? '—' : `${delta >= 0 ? '+' : ''}${delta.toFixed(2)}`}
                      </span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </ChartFigure>
      </ChartCard>

      {/* Row 2 continued — the term-scoped viz this tab was missing.
          §9.1 maps it explicitly: "5 — spread across a term's courses | Q2 | Cleveland dot
          (N=8)". The trend above answers "which way is the program heading"; these answer
          "what happened INSIDE this term", which is the question the term selector implies. */}
      {axis === 'term' && termScopedCourses.length > 0 && (
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
          <ChartCard
            variant="normal"
            title={`Course spread — ${value}`}
            description="Every course evaluated this term against the term's own median. Faint dots are the individual offerings behind each mean."
            leoInsight={termSpreadLeo}
          >
            <ChartFigure
              label={`Course spread in ${value}`}
              summary={`Ranked dot plot of ${termScopedCourses.length} courses' content scores in ${value}, against the term median.`}
              dataLength={termScopedCourses.length}
              leoInsight={termSpreadLeo}
            >
              {() => (
                <>
                  <CourseRankDots courses={termScopedCourses} median={termScopedMedian} />
                  <ChartDataTable
                    caption={`Course content scores in ${value}`}
                    headers={['Course', 'Content score', 'Simple mean', 'Response rate']}
                    rows={termScopedCourses.map(c => [
                      `${c.courseCode} — ${c.courseName}`,
                      c.score.weighted.toFixed(2),
                      c.score.simple.toFixed(2),
                      `${c.responseRate}%`,
                    ])}
                  />
                </>
              )}
            </ChartFigure>
          </ChartCard>

          <ChartCard
            variant="normal"
            title={`Content vs teaching — ${value}`}
            description="One dot per course this term. Separates a course that needs redesigning from an instructor who needs support."
            leoInsight={termGapLeo}
          >
            <ChartFigure
              label={`Content versus teaching in ${value}`}
              summary={`Scatter of ${termGaps.length} courses in ${value}, course content score against faculty score, split at the term means.`}
              dataLength={termGaps.length}
              leoInsight={termGapLeo}
            >
              {() => (
                <>
                  <GapQuadrant
                    points={termGaps}
                    courseMean={termGapMeans.course}
                    facultyMean={termGapMeans.faculty}
                  />
                  <ChartDataTable
                    caption={`Content versus teaching in ${value}`}
                    headers={['Course', 'Content', 'Teaching', 'Enrolled']}
                    rows={termGaps.map(g => [
                      `${g.courseCode} — ${g.courseName}`,
                      g.courseAvg.toFixed(2),
                      g.facultyAvg.toFixed(2),
                      g.enrolled,
                    ])}
                  />
                </>
              )}
            </ChartFigure>
          </ChartCard>
        </div>
      )}

      {/* REMOVED 2026-07-14 — "Course rankings" + "Faculty rankings" (two ranked bar charts).
          Three reasons, any one sufficient:
          1. They were labelled "all terms" on a tab scoped to a single term — the chart
             contradicted the selector directly above it.
          2. Duplicates. Course rankings repeats Overview's ranked dots; faculty rankings
             repeats the By Faculty leaderboard — and Monil, pointing at exactly this chart:
             "This should be in faculty." Aarti's D5 agrees ("faculty is one click down").
          3. Ranked bars are the shape the ranked dot plot replaced: a bar carries one value
             and nothing else — no spread, no median, no sense of whether a mean is stable.
          The term-scoped ranking this tab actually needs is the deep-dive table below, which
          is Monil's own sketch. */}

      {/* Row 3 of the tab template — the deep-dive, and the one Monil said was missing:
          "This third table, where you just see some numbers — which is also a repetition of
          the above KPIs. Which again does not make sense. So this is where the requirement is
          missing. What additional we can add for that term that gives you actionable data."
          His sketch: every course in the term with response rate AND average score, ordered
          lowest-first — because the reason you open a term is to find what went wrong in it.
          Sits ABOVE the ops table below, which answers a different job (push / remind). */}
      {axis === 'term' && termBreakdown.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">Where {value} needs attention</h2>
          <p className="text-xs text-muted-foreground">
            Every course in the term, weakest content score first. Content and teaching are scored
            separately — they rarely fail together, and the fix differs.
          </p>
          <div className="-mx-4 lg:-mx-6">
            <DataTable<TermBreakdownRow>
              data={termBreakdown}
              columns={termBreakdownColumns}
              getRowId={(row) => row.courseCode}
              searchable={false}
              toolbarSlot={() => null}
              emptyState={
                <div className="flex flex-col items-center gap-2 py-8">
                  <i className="fa-light fa-chart-simple text-2xl text-muted-foreground" aria-hidden="true" />
                  <p className="text-sm font-medium">No evaluated courses in {value}</p>
                  <p className="text-xs text-muted-foreground">Scores appear once a survey in this term closes.</p>
                </div>
              }
            />
          </div>
        </div>
      )}

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

  if (!faculty) return null

  return (
    <>
      <h2 className="sr-only">{faculty.name} overview</h2>

      <KeyMetrics variant="compact" metricsSingleRow metrics={facultyKpis} />

      {extraCharts}

      {/* "Comparative context" (three bars: school avg / dept avg / own) removed 2026-07-14.
          It answered a real question with the weakest available shape — three bars carry a
          value each and nothing else: no distribution, no spread, no trajectory. The same
          question is now answered better in two places, neither of which is a bar:
            · /analytics?tab=faculty — the leaderboard, which shows every peer AND each
              person's spread (FacultyLeaderboardSection)
            · the profile + self-view — "Standing vs benchmarks", a dot placed against the
              department and university rules (BenchmarkDistribution, peer swarm gated by
              lens per §7.3)
          Keeping it would have meant two cards answering one question on the same page. */}

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

  /* By Course row 2 — both rated entities + the instructor comparison. */
  const courseTrendRows = useMemo(() => courseTrend(courseCode), [courseCode])
  const courseFaculty = useMemo(() => courseFacultyStats(courseCode), [courseCode])
  const courseFacultyMedian = useMemo(
    () => medianOf(courseFaculty.map(f => f.score.weighted)),
    [courseFaculty],
  )
  /* FacultyLeaderboardDots takes a FacultyStat. These instructors are scoped to ONE course,
     so `courses` is 1 by construction and the 1Y/3Y windows are meaningless at this scope —
     they are null rather than faked, and the chart does not read them. */
  const courseFacultyAsStats = useMemo(
    () =>
      courseFaculty.map(f => ({
        facultyId: f.facultyId,
        name: f.name,
        initials: '',
        score: f.score,
        responseRate: f.responseRate,
        offerings: f.terms,
        courses: 1,
        terms: f.terms,
        avg1y: null,
        avg3y: null,
        drift: null,
        ratings: f.ratings,
      })),
    [courseFaculty],
  )

  const courseFacultyLeo: ChartLeoInsight | null = useMemo(() => {
    if (courseFaculty.length < 2) return null
    const best = courseFaculty[0]!
    const worst = courseFaculty[courseFaculty.length - 1]!
    const spread = best.score.weighted - worst.score.weighted
    return {
      headline:
        spread >= 0.4
          ? `${courseCode} swings ${spread.toFixed(2)} depending on who teaches it`
          : `${courseCode} scores consistently across its ${courseFaculty.length} instructors`,
      explanation:
        spread >= 0.4
          ? 'A course that scores very differently by instructor is a staffing question, not a content one — the material is evidently teachable.'
          : 'Instructors land close together, so the score is a property of the course rather than of who is in front of it. That points at content.',
      kind: spread >= 0.4 ? 'anomaly' : 'trend',
      delta: { value: spread.toFixed(2), label: 'best to worst' },
      bullets: courseFaculty.map(f => `${f.name}: ${f.score.weighted.toFixed(2)}/5 across ${f.terms} term${f.terms === 1 ? '' : 's'}.`),
      anchor: { yValue: worst.score.weighted },
    }
  }, [courseFaculty, courseCode])

  /** This course's CE surveys — the AI theme card's scope (story 12). */
  const courseSurveys = useMemo(
    () => MOCK_SURVEYS.filter(s => s.surveyType !== 'programmatic' && s.courseCode === courseCode),
    [courseCode],
  )

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
      {/* ChartCard titles are h3 — without a section h2 the document jumps h1 → h3
          (axe `heading-order`). Real section, needn't be seen. */}
      <h2 className="sr-only">{courseCode} overview</h2>

      <KeyMetrics variant="compact" metricsSingleRow metrics={courseKpis} />

      {/* Story 12's theme half. Themes are the AI lane, NOT a chart — `ai-vs-pulled-lane.md`
          puts "themes, insights, action plans, summaries (LLM-extracted from open-text)" on
          the AI side and "trends, averages, distributions" on the pulled side, and charting
          an AI theme as if it were pulled data is a double violation (ADR-005 + D28's ban on
          preset taxonomies). The legacy prototype's three fixed themes as a bar chart is
          exactly that; this reuses the existing AiInsightCard composition instead, scoped to
          the course rather than the term.
          ⚠️ Monil treats themes as conditional — "if we are capturing the theme" — so this
          renders only where comments exist and cites its own source count. */}
      {courseSurveys.length > 0 && (
        <TermThemesInsight surveys={courseSurveys} scopeLabel={courseCode} />
      )}

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
            title={`Score trend — ${courseCode}`}
            description="Content and teaching move independently — that separation is the whole point of the tab. Response rate shares the term axis below."
            leoInsight={courseTrendLeo}
          >
            <ChartFigure
              label={`Score trend for ${courseCode}`}
              summary={`Course content and faculty scores per term for ${courseCode}, with response rate against an 80% target below on the same term axis.`}
              dataLength={courseTrendRows.length}
              leoInsight={courseTrendLeo}
            >
              {() => (
                <>
                  <CourseTrendStack rows={courseTrendRows} />
                  <ChartDataTable
                    caption={`Score trend for ${courseCode}`}
                    headers={['Term', 'Content', 'Teaching', 'Response rate', 'Faculty']}
                    rows={courseTrendRows.map(d => [
                      d.term,
                      d.courseAvg != null ? d.courseAvg.toFixed(2) : '—',
                      d.facultyAvg.toFixed(2),
                      `${d.responseRate}%`,
                      d.faculty.join(', '),
                    ])}
                  />
                </>
              )}
            </ChartFigure>
          </ChartCard>
        )
      })()}

      {/* Who taught it, and how each did — the By Course mirror of the portfolio's per-course
          ranking. A course whose score swings by instructor is a staffing conversation; one
          that is uniformly low is a content conversation. Same disentangling the gap quadrant
          does program-wide, asked from the course's side. */}
      {courseFaculty.length > 1 && (
        <ChartCard
          variant="normal"
          title={`Who taught ${courseCode}`}
          description="Each instructor's mean for this course, with their individual offerings drawn behind it."
          leoInsight={courseFacultyLeo}
        >
          <ChartFigure
            label={`Instructors of ${courseCode}`}
            summary={`Ranked dot plot of ${courseFaculty.length} instructors' scores for ${courseCode}, against the course median.`}
            dataLength={courseFaculty.length}
            leoInsight={courseFacultyLeo}
          >
            {() => (
              <>
                <FacultyLeaderboardDots faculty={courseFacultyAsStats} median={courseFacultyMedian} />
                <ChartDataTable
                  caption={`Instructors of ${courseCode}`}
                  headers={['Faculty', 'Score', 'Simple mean', 'Terms', 'Response rate']}
                  rows={courseFaculty.map(f => [
                    f.name,
                    f.score.weighted.toFixed(2),
                    f.score.simple.toFixed(2),
                    f.terms,
                    `${f.responseRate}%`,
                  ])}
                />
              </>
            )}
          </ChartFigure>
        </ChartCard>
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
