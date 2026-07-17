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
import { XAxis, YAxis, LineChart, Line, CartesianGrid } from 'recharts'
import {
  ChartCard, ChartFigure, ChartDataTable,
  ChartLeoPlotInsightOverlay,
  type ChartLeoInsight,
} from '@/components/charts-overview'
import {
  GapQuadrant, CourseTrendStack, FacultyLeaderboardDots, Slopegraph, ProgramResponseTrend,
  CourseRankDots, CohortStudentWaffle,
} from '@/components/pce/analytics-plots'
import { TruncatedText } from '@/components/truncated-text'
import { CHART_AXIS_TICK } from '@/lib/chart-typography'
import { DataTablePaginated } from '@/components/data-table/pagination'
import { ChartCardActions } from '@/components/pce/chart-card-actions'
import type { ColumnDef } from '@/components/data-table/types'
import { SurveyStatusBadge } from '@/components/pce/pce-badges'
import { TermThemesInsight } from '@/components/pce/term-themes-insight'
import { StudentVoice } from '@/components/pce/student-voice'
import { usePce } from '@/components/pce/pce-state'
import { MOCK_SURVEYS, MOCK_FACULTY, MOCK_FACULTY_OFFERINGS } from '@/lib/pce-mock-data'
import {
  termKpis, cohortKpis, termCourseBreakdown, termSeries, gapPoints, medianOf,
  courseTrend, courseFacultyStats, courseStats, facultyStats, facultySurveys, termSlope,
  shortTerm, RESPONSE_TARGET,
  type TermCourseRow,
} from '@/lib/pce-analytics'
import type { FacultyOfferingRecord, SurveyStatus } from '@/lib/pce-mock-data'

/* ── shared helpers ── */
export const TERM_ORDER = [
  'Spring 2022', 'Fall 2022', 'Spring 2023', 'Fall 2023',
  'Spring 2024', 'Fall 2024', 'Spring 2025', 'Fall 2025', 'Spring 2026',
]

/*
  Three tiers, and the MIDDLE ONE IS NEUTRAL — never the brand.

  This used to paint 3.7–4.3 in `--brand-color`, which put the product's own pink on every
  middling score. Measured on the rendered cells, not guessed: DPT-540's 3.70, DPT-515's 3.75
  and DPT-601's 3.80 all computed to lab(46.65 73.389 -26.6458) — the brand token exactly.

  Three things wrong with that, and they compound:
    · The brand colour ends up meaning "mediocre". Brand is identity and primary CTAs, never a
      data tier — and PlotTheme's own contract reserves it for the SUBJECT of a view.
    · Brand pink sits at hue 342, which is red-adjacent, so it READS as "bad" while it
      actually meant "middle" — the encoding is inverted for the reader, and VIZ-004 keeps red
      out of score viz precisely because Aarti reads it as alarm.
    · Every chart in this feature is a TWO-tier split (above threshold = teal, below = amber).
      A three-tier table with brand in the middle meant the table and the charts disagreed
      about what colour means on the same page.

  Neutral middle fixes all three: unremarkable scores look unremarkable, and only the
  exceptions earn colour — the same rule the drift arrows already follow.
*/
/**
 * BELOW THE MEDIAN IS AMBER, everything else is plain — a threshold, not a fixed tier ladder.
 *
 * The table's own doc-comment promised "below-median scores take --chip-4 amber" and the code
 * did something else: an absolute 3.7 boundary. Nothing in Spring 2026 scores below 3.7, so
 * the amber tier NEVER FIRED — in a card called "Where Spring 2026 needs attention", sorted
 * weakest-first, the failing courses (3.70, 3.75, 3.80) rendered in plain text while the
 * healthy ones (4.30+) got teal. The colour was celebrating success in a triage table and
 * leaving the problems unmarked. The comment was right; the implementation was wrong.
 *
 * Median-relative also matches every chart in the feature — CourseRankDots and
 * FacultyLeaderboardDots both split on the median — so the table and the charts finally agree
 * on what colour means. No teal-for-good here: in a triage table position already carries
 * "needs attention" (weakest first), and only the exceptions earn ink.
 */
const belowMedianColor = (v: number, median: number) =>
  v < median ? 'var(--chip-4)' : 'var(--foreground)'

/* Response % against the collection target, not a median — a rate has an absolute bar. */
const completionColor = (pct: number) =>
  pct < RESPONSE_TARGET ? 'var(--chip-4)' : 'var(--foreground)'

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
const fmt2 = (v: number) => v.toFixed(2)

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
const termBreakdownColumnsFor = (
  courseMedian: number,
  facultyMedian: number,
): ColumnDef<TermBreakdownRow>[] => [
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
      <div className="text-right text-sm tabular-nums font-semibold" style={{ color: row.courseAvg != null ? belowMedianColor(row.courseAvg, courseMedian) : 'var(--muted-foreground)' }}>
        {row.courseAvg != null ? row.courseAvg.toFixed(2) : '—'}
      </div>
    ),
  },
  {
    key: 'facultyAvg', label: 'Teaching', sortable: true, width: 110,
    header: () => <span className="block text-right">Teaching</span>,
    cell: (row) => (
      <div className="text-right text-sm tabular-nums font-semibold" style={{ color: row.facultyAvg != null ? belowMedianColor(row.facultyAvg, facultyMedian) : 'var(--muted-foreground)' }}>
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
/* Factory, like the term breakdown — the Rating column needs a median to split on, and a
   module-level const can't have one. Rating here is the INSTRUCTOR's score for that offering,
   so it splits on the faculty median. */
const facultyOfferingColumnsFor = (facultyMedian: number): ColumnDef<FacultyOfferingRow>[] => [
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
      <div className="text-right tabular-nums text-sm font-semibold" style={{ color: belowMedianColor(row.avgRating, facultyMedian) }}>
        {row.avgRating.toFixed(2)}
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
/* Same as facultyOfferingColumnsFor — Rating is the instructor's score for the offering. */
const courseOfferingColumnsFor = (facultyMedian: number): ColumnDef<CourseOfferingRow>[] => [
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
      <div className="text-right tabular-nums text-sm font-semibold" style={{ color: belowMedianColor(row.avgRating, facultyMedian) }}>
        {row.avgRating.toFixed(2)}
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
  axis = 'term', value, onOpenSurvey, onNudge, onSelectCourse,
}: {
  axis?: 'term' | 'cohort'
  value: string
  onOpenSurvey: (surveyId: string) => void
  /** Attention-table rows drill into the named course (By Course tab). */
  onSelectCourse?: (courseCode: string) => void
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
  /* Cohort is a first-class slice now, not a fallback — see `cohortKpis`. Flipping the toggle
     used to drop you onto a score-less KPI set, so the cohort axis couldn't answer the one
     question it exists for. Same shape either way, so everything downstream is unchanged. */
  const termStats = useMemo(
    () => (axis === 'term' ? termKpis(value) : cohortKpis(value)),
    [axis, value],
  )
  const termBreakdown = useMemo<TermBreakdownRow[]>(
    () => (axis === 'term' ? (termCourseBreakdown(value) as TermBreakdownRow[]) : []),
    [axis, value],
  )
  /* Program medians, not this term's — "is this course weak, period" is the useful question.
     A within-term median would put half the term below it by construction, every term. Same
     medians the Overview charts split on, so a course flagged here is flagged there. */
  const breakdownMedians = useMemo(() => ({
    course: medianOf(courseStats().map(c => c.score.weighted)),
    faculty: medianOf(facultyStats().map(f => f.score.weighted)),
  }), [])
  const termBreakdownColumns = useMemo(
    () => termBreakdownColumnsFor(breakdownMedians.course, breakdownMedians.faculty),
    [breakdownMedians],
  )

  const byTermKpis: MetricItem[] = useMemo(() => {
    // No `!termStats` fallback any more. It was the score-less KPI set the cohort axis fell
    // onto, and now that cohortKpis exists both branches always return a TermKpis, so the
    // branch is unreachable. Deleted rather than left as a trap — an unreachable fallback is
    // where the next weaker code path gets reintroduced.
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
        description: axis === 'term' ? 'content · vs prior term' : 'content · vs prior cohort',
      },
      {
        id: 'term-faculty-avg', label: 'Faculty score',
        value: t.facultyAvg != null ? t.facultyAvg.toFixed(2) : '—',
        delta: signed(t.facultyDelta), trend: dir(t.facultyDelta),
        trendPolarity: 'informational',
        description: axis === 'term' ? 'teaching · vs prior term' : 'teaching · vs prior cohort',
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
  const termSlopeData = useMemo(() => (axis === 'term' ? termSlope(value) : null), [axis, value])

  const termSlopeLeo: ChartLeoInsight | null = useMemo(() => {
    if (!termSlopeData || termSlopeData.rows.length < 2) return null
    const rows = termSlopeData.rows
    const risers = rows.filter(r => r.delta > 0.15)
    const fallers = rows.filter(r => r.delta < -0.15)
    const worst = rows[rows.length - 1]!
    const best = rows[0]!
    return {
      // Frequency counts, not percentages — Aarti D17.
      headline:
        fallers.length > 0
          ? `${fallers.length} of ${rows.length} courses fell coming into ${value}`
          : `No course lost ground coming into ${value}`,
      explanation:
        fallers.length > 0
          ? `${worst.courseCode} fell furthest, ${Math.abs(worst.delta).toFixed(2)}. A ranked list would show it as "low" ` +
            `and an aggregate trend would average it away — only the slope shows it MOVED, which is the difference ` +
            `between a course that is hard and a course that broke.`
          : `${risers.length} course${risers.length === 1 ? '' : 's'} improved and the rest held. Flat lines are stability, not missing data.`,
      kind: fallers.length > 0 ? 'dip' : 'trend',
      delta: {
        value: `${worst.delta >= 0 ? '+' : ''}${worst.delta.toFixed(2)}`,
        label: `${worst.courseCode} · biggest fall`,
      },
      bullets: [
        `${worst.courseCode}: ${worst.from.toFixed(2)} → ${worst.to.toFixed(2)} (${worst.delta >= 0 ? '+' : ''}${worst.delta.toFixed(2)}).`,
        `${best.courseCode}: ${best.from.toFixed(2)} → ${best.to.toFixed(2)} (${best.delta >= 0 ? '+' : ''}${best.delta.toFixed(2)}).`,
        `${rows.length} courses ran in both ${termSlopeData.from} and ${value}.`,
      ],
      anchor: { yValue: worst.to },
    }
  }, [termSlopeData, value])

  /**
   * The cohort's three populations — n students, n faculty, n courses.
   *
   * Romit: "in a cohort there are n number of students, faculties and courses, and your viz
   * hasn't accounted for that." He was right, and the reason is worth writing down: the cohort
   * axis reused the term axis's charts wholesale, so it inherited a shape built for a slice of
   * TIME and applied it to a slice of PEOPLE. Every one of the three n's was aggregated into a
   * scalar before it reached a mark.
   *
   * The rubric decides the marks, not novelty. Courses (5–12) and faculty (~8) are N≤30 →
   * Cleveland dot (`VIZ-PATTERN-005`), which is the same mark the other tabs use — that
   * repetition is instructed, and swapping in a different chart per tab for variety would
   * break the rubric. Students (371) are N>30, which `cleveland-dot.md:25` puts outside the
   * dot's range, and that is the dimension that genuinely had no mark: it was rendered as the
   * bare string "69%".
   *
   * Scoped through `courseStats`/`facultyStats` with a cohort argument rather than a parallel
   * `cohortCourseStats`, so the cohort axis and every other surface read the same derivation.
   */
  const cohortCourses = useMemo(
    () => (axis === 'cohort' ? courseStats(undefined, value) : []),
    [axis, value],
  )
  const cohortFaculty = useMemo(
    () => (axis === 'cohort' ? facultyStats(undefined, value) : []),
    [axis, value],
  )
  /* Medians over the COHORT's own entities, not the program's. On the term axis the program
     median is right ("is this course weak, period"); here the question the selector implies is
     "who is weak WITHIN this class", and a program median would answer a question nobody asked
     of a cohort. */
  const cohortMedians = useMemo(
    () => ({
      course: medianOf(cohortCourses.map(c => c.score.weighted)),
      faculty: medianOf(cohortFaculty.map(f => f.score.weighted)),
    }),
    [cohortCourses, cohortFaculty],
  )

  const termGaps = useMemo(() => (axis === 'term' ? gapPoints(value) : []), [axis, value])
  const termGapMeans = useMemo(() => ({
    course: termGaps.length ? termGaps.reduce((s, g) => s + g.courseAvg, 0) / termGaps.length : 0,
    faculty: termGaps.length ? termGaps.reduce((s, g) => s + g.facultyAvg, 0) / termGaps.length : 0,
  }), [termGaps])

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
  /* The full term series — `programTrendData` reshapes this for recharts, but the response
     chart wants the canonical points (it needs `term` for the scoped-term band, not just the
     abbreviated `short`). One derivation, two views. */
  const termSeriesData = useMemo(() => termSeries(), [])

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
  /* Story 13's response half — the Leo reads the PATH, which is the whole point of promoting
     it from a delta chip to a trend. */
  const responseTrendLeo: ChartLeoInsight | null = useMemo(() => {
    const rows = termSeriesData.filter(t => t.responseRate != null)
    if (rows.length < 2) return null
    const rates = rows.map(t => t.responseRate as number)
    const below = rates.filter(r => r < RESPONSE_TARGET).length
    const first = rates[0]!
    const last = rates[rates.length - 1]!
    const lowest = Math.min(...rates)
    const trough = rows[rates.indexOf(lowest)]!
    const recovered = lowest < last - 4
    return {
      // Frequency, not percentage — Aarti D17.
      headline: `${below} of ${rows.length} terms came in under the ${RESPONSE_TARGET}% target`,
      explanation: recovered
        ? `Collection bottomed out at ${lowest}% in ${trough.term} and has climbed to ${last}% since. ` +
          `A single delta would have shown ${last - first >= 0 ? '+' : ''}${last - first} points and hidden the dip ` +
          `entirely — a drop-and-recovery and a flat line produce the same number.`
        : `Collection runs from ${first}% to ${last}%, with the low at ${lowest}% in ${trough.term}. ` +
          `Read the path: the target is what a rate means, not the rate on its own.`,
      kind: below > 0 ? 'dip' : 'trend',
      delta: { value: `${lowest}%`, label: `low — ${trough.short}` },
      bullets: [
        `Latest ${last}% · low ${lowest}% (${trough.term}) · target ${RESPONSE_TARGET}%.`,
        `${below} of ${rows.length} terms below target.`,
      ],
      anchor: { yValue: lowest },
    }
  }, [termSeriesData])

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

      {/* Row 1 — the two halves of story 13, paired.
          "term avg score AND response trends": the score half was charted and the response
          half was a single KPI delta chip, which is RUBRIC Q4's ❌ verbatim ("hides the path;
          a drop-and-recovery looks identical to flat"). They sit side by side because they are
          different problems — a falling score is a curriculum conversation, a falling
          collection rate is a reminder — and because a line chart doesn't earn 100% width. */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
      <ChartCard
        variant="normal"
        title="Program trend"
        /* Program-wide on BOTH axes, by design — Monil: "trend graph is not for a single term,
           but for all the terms". That is defensible next to a term selector and dangerous next
           to a cohort one: the KPI strip directly above IS cohort-scoped, so two adjacent
           readings of "4.11" and "4.18" describe different populations. Saying which is which is
           the whole fix; silently mixing scopes on one screen is the bug this file exists to end. */
        description={
          axis === 'term'
            ? 'Course rating vs. faculty rating across terms.'
            : `Course rating vs. faculty rating across terms — program-wide, not ${value}. The numbers above are this cohort's.`
        }
        leoInsight={programTrendLeo}
      >
        <ChartFigure
          label="Program trend"
          summary="Line chart of course average versus faculty average rating across historical terms."
          dataLength={programTrendData.length}
        >
          {(activeIndex) => (
            <>
              {programTrendData.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No term history yet — the trend appears once a second term closes.
                </p>
              ) : (
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
              )}
              <ChartDataTable
                caption="Program trend"
                headers={['Term', 'Course avg', 'Faculty avg']}
                rows={programTrendData.map(d => [d.term, d.courseAvg.toFixed(2), d.facultyAvg != null ? d.facultyAvg.toFixed(2) : '—'])}
              />
              <ChartCardActions
                title="Program trend"
                table={{
                  headers: ['Term', 'Course score', 'Faculty score'],
                  rows: programTrendData.map((t) => [
                    t.term,
                    t.courseAvg.toFixed(2),
                    t.facultyAvg != null ? t.facultyAvg.toFixed(2) : '—',
                  ]),
                }}
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

      <ChartCard
        variant="normal"
        title="Response rate across terms"
        /* The band only exists on the term axis — `scopedTerm` below is undefined for a cohort,
           because a cohort is not a point on a term axis and has nowhere to mark. The copy used
           to promise "The band marks Class of 2026" regardless, describing a mark that was never
           drawn. A description that names a thing the reader cannot find is worse than no
           description: they go looking for it. */
        description={
          axis === 'term'
            ? `The collection path against the ${RESPONSE_TARGET}% target — the shape, not a single delta. The band marks ${value}.`
            : `The collection path against the ${RESPONSE_TARGET}% target — the shape, not a single delta. Program-wide across all terms, not scoped to ${value}.`
        }
        leoInsight={responseTrendLeo}
      >
        <ChartFigure
          label="Response rate across terms"
          summary={`Line chart of the program's enrollment-weighted response rate across terms against a ${RESPONSE_TARGET}% target.`}
          dataLength={termSeriesData.length}
          leoInsight={responseTrendLeo}
        >
          {() => (
            <>
              <ProgramResponseTrend
                series={termSeriesData}
                target={RESPONSE_TARGET}
                scopedTerm={axis === 'term' ? value : undefined}
              />
              <ChartDataTable
                caption="Response rate by term"
                headers={['Term', 'Response rate']}
                rows={termSeriesData
                  .filter(t => t.responseRate != null)
                  .map(t => [t.term, `${t.responseRate}%`])}
              />
              <ChartCardActions
                title="Response rate by term"
                description="Response rate against the target, larger."
                detail={
                  <ProgramResponseTrend
                    series={termSeriesData}
                    target={RESPONSE_TARGET}
                    scopedTerm={axis === 'term' ? value : undefined}
                    height={420}
                  />
                }
                table={{
                  headers: ['Term', 'Response rate'],
                  rows: termSeriesData
                    .filter((t) => t.responseRate != null)
                    .map((t) => [t.term, `${t.responseRate}%`]),
                }}
              />
            </>
          )}
        </ChartFigure>
      </ChartCard>
      </div>

      {/* Row 2, COHORT axis — the class's three populations, each as itself.
          This row used to not exist: flipping to Cohort silently dropped every panel below the
          trends, so the page got shorter and never said why. VIZ-006 is the binding rule —
          "Cohort comparison must show pairing or distribution, never duo-numbers. Two large
          numbers side-by-side is forbidden in dashboard contexts" — and a KPI strip reading
          4.11 / 4.09 is exactly the forbidden shape. Distributions are the fix. */}
      {axis === 'cohort' && (
        <>
          <ChartCard
            variant="normal"
            title={`Who answered — ${value}`}
            description="One square is one student"
          >
            <ChartFigure
              label={`Students who answered in ${value}`}
              summary={`Waffle chart: ${termStats.responded} of ${termStats.enrolled} students in ${value} answered their evaluations, one square per student.`}
              dataLength={termStats.enrolled}
            >
              {() => (
                <>
                  <CohortStudentWaffle
                    responded={termStats.responded}
                    enrolled={termStats.enrolled}
                    target={RESPONSE_TARGET}
                  />
                  <ChartDataTable
                    caption={`Student response in ${value}`}
                    headers={['Outcome', 'Students']}
                    rows={[
                      ['Answered', termStats.responded],
                      ['No response', Math.max(0, termStats.enrolled - termStats.responded)],
                      ['Enrolled', termStats.enrolled],
                    ]}
                  />
                  <ChartCardActions
                    title={`Who answered — ${value}`}
                    table={{
                      headers: ['Status', 'Students'],
                      rows: [
                        ['Responded', termStats.responded],
                        ['Did not respond', termStats.enrolled - termStats.responded],
                        ['Enrolled', termStats.enrolled],
                      ],
                    }}
                  />
                </>
              )}
            </ChartFigure>
          </ChartCard>

          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
            <ChartCard
              variant="normal"
              /* NOT "Courses in {value}" — the DataTable further down already owns that title,
                 and it answers a different question with a different count: it lists the LIVE
                 surveys you can push (5), while this ranks every course the class has been
                 evaluated on (7). Two panels, one title, two numbers is how a reader concludes
                 the page is broken. The title names the metric; the table names the worklist. */
              title={`Course scores — ${value}`}
              description={`The lowest of ${cohortCourses.length} courses, ranked · content score`}
            >
              <ChartFigure
                label={`Courses in ${value} ranked by content score`}
                summary={`Cleveland dot plot of the ${cohortCourses.length} courses ${value} took, ranked by course-content score against this cohort's median of ${cohortMedians.course.toFixed(2)}.`}
                dataLength={cohortCourses.length}
              >
                {() => (
                  <>
                    <CourseRankDots
                      courses={cohortCourses}
                      median={cohortMedians.course}
                    />
                    <ChartDataTable
                      caption={`Courses in ${value}`}
                      headers={['Course', 'Content score', 'Response rate']}
                      rows={cohortCourses.map(c => [
                        `${c.courseCode} — ${c.courseName}`,
                        c.score.weighted.toFixed(2),
                        `${c.responseRate}%`,
                      ])}
                    />
                    <ChartCardActions
                      title={`Course scores — ${value}`}
                      description={`All ${cohortCourses.length} courses this class was evaluated on, ranked.`}
                      detail={
                        <CourseRankDots
                          courses={cohortCourses}
                          median={cohortMedians.course}
                          limit={cohortCourses.length}
                          height={Math.max(260, cohortCourses.length * 32 + 40)}
                        />
                      }
                      table={{
                        headers: ['Course', 'Content score', 'Response rate'],
                        rows: cohortCourses.map((c) => [
                          `${c.courseCode} — ${c.courseName}`,
                          c.score.weighted.toFixed(2),
                          `${c.responseRate}%`,
                        ]),
                      }}
                    />
                  </>
                )}
              </ChartFigure>
            </ChartCard>

            <ChartCard
              variant="normal"
              title={`Teaching scores — ${value}`}
              description={`${cohortFaculty.length} faculty · vs the class median`}
            >
              <ChartFigure
                label={`Faculty who taught ${value}`}
                summary={`Cleveland dot plot of the ${cohortFaculty.length} faculty who taught ${value}, ranked by teaching score against this cohort's median of ${cohortMedians.faculty.toFixed(2)}.`}
                dataLength={cohortFaculty.length}
              >
                {() => (
                  <>
                    <FacultyLeaderboardDots
                      faculty={cohortFaculty.slice(0, 6)}
                      median={cohortMedians.faculty}
                    />
                    <ChartDataTable
                      caption={`Faculty who taught ${value}`}
                      headers={['Faculty', 'Teaching score', 'Courses', 'Response rate']}
                      rows={cohortFaculty.map(f => [
                        f.name,
                        f.score.weighted.toFixed(2),
                        f.courses,
                        `${f.responseRate}%`,
                      ])}
                    />
                    <ChartCardActions
                      title={`Teaching scores — ${value}`}
                      description={`All ${cohortFaculty.length} faculty who taught this class, ranked.`}
                      detail={
                        <FacultyLeaderboardDots
                          faculty={cohortFaculty}
                          median={cohortMedians.faculty}
                          height={Math.max(260, cohortFaculty.length * 34 + 40)}
                        />
                      }
                      table={{
                        headers: ['Faculty', 'Teaching score', 'Courses', 'Response rate'],
                        rows: cohortFaculty.map((f) => [
                          f.name,
                          f.score.weighted.toFixed(2),
                          f.courses,
                          `${f.responseRate}%`,
                        ]),
                      }}
                    />
                  </>
                )}
              </ChartFigure>
            </ChartCard>
          </div>
        </>
      )}

      {/* Row 2 continued — the term-scoped viz this tab was missing.
          §9.1 maps it explicitly: "5 — spread across a term's courses | Q2 | Cleveland dot
          (N=8)". The trend above answers "which way is the program heading"; these answer
          "what happened INSIDE this term", which is the question the term selector implies. */}
      {axis === 'term' && (termSlopeData !== null || termGaps.length > 0) && (
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
          <ChartCard
            variant="normal"
            title={termSlopeData ? `What moved — ${termSlopeData.from} → ${value}` : `What moved — ${value}`}
            description="Previous term to this one · crossings are rank swaps"
            leoInsight={termSlopeLeo}
          >
            <ChartFigure
              label={`Course movement into ${value}`}
              summary={
                termSlopeData
                  ? `Slopegraph of ${termSlopeData.rows.length} courses' content scores from ${termSlopeData.from} to ${value}.`
                  : 'No previous term to compare against.'
              }
              dataLength={termSlopeData?.rows.length ?? 0}
              leoInsight={termSlopeLeo}
            >
              {() =>
                !termSlopeData ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    {value} is the earliest term with data — nothing to compare it against yet.
                  </p>
                ) : (
                  <>
                    {/* Card = the 5 biggest moves either way; every course behind Expand.
                        A slope per course grows 26px/row — the contract says the data does
                        not size the card. */}
                    <Slopegraph
                      rows={[...termSlopeData.rows]
                        .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
                        .slice(0, 5)}
                      fromLabel={shortTerm(termSlopeData.from)}
                      toLabel={shortTerm(value)}
                    />
                    <ChartDataTable
                      caption={`Course content score, ${termSlopeData.from} to ${value}`}
                      headers={['Course', termSlopeData.from, value, 'Change']}
                      rows={termSlopeData.rows.map(r => [
                        `${r.courseCode} — ${r.courseName}`,
                        r.from.toFixed(2),
                        r.to.toFixed(2),
                        `${r.delta >= 0 ? '+' : ''}${r.delta.toFixed(2)}`,
                      ])}
                    />
                    <ChartCardActions
                      title="What moved"
                      description={`Every course's content score, ${termSlopeData.from} to ${value}.`}
                      detail={
                        <Slopegraph
                          rows={termSlopeData.rows}
                          fromLabel={shortTerm(termSlopeData.from)}
                          toLabel={shortTerm(value)}
                        />
                      }
                      table={{
                        headers: ['Course', termSlopeData.from, value, 'Change'],
                        rows: termSlopeData.rows.map((r) => [
                          `${r.courseCode} — ${r.courseName}`,
                          r.from.toFixed(2),
                          r.to.toFixed(2),
                          `${r.delta >= 0 ? '+' : ''}${r.delta.toFixed(2)}`,
                        ]),
                      }}
                    />
                  </>
                )
              }
            </ChartFigure>
          </ChartCard>

          <ChartCard
            variant="normal"
            title={`Content vs teaching — ${value}`}
            description="One dot per course · split at the scope means"
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
                  <ChartCardActions
                    title={`Content vs teaching — ${value}`}
                    description="Each dot is one course in this scope, split at the scope means."
                    detail={
                      <GapQuadrant
                        points={termGaps}
                        courseMean={termGapMeans.course}
                        facultyMean={termGapMeans.faculty}
                        height={480}
                      />
                    }
                    table={{
                      headers: ['Course', 'Course score', 'Faculty score'],
                      rows: termGaps.map((g) => [
                        `${g.courseCode} — ${g.courseName}`,
                        g.courseAvg.toFixed(2),
                        g.facultyAvg.toFixed(2),
                      ]),
                    }}
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
            <DataTablePaginated<TermBreakdownRow>
              pagination={{ pageSize: 10 }}
              onRowClick={onSelectCourse ? (row) => onSelectCourse(String(row.courseCode)) : undefined}
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
          <DataTablePaginated<CourseTermRow>
            pagination={{ pageSize: 10 }}
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
  facultyId, onOpenSurvey, extraCharts, heroCarriesRating = false,
}: {
  facultyId: string
  onOpenSurvey: (surveyId: string) => void
  /** The self dashboard's hero already shows the rating as a ScoreBullet — the tile would repeat it. */
  heroCarriesRating?: boolean
  /** Optional viz rendered right after the KPI strip (e.g. profile radar + distribution band). */
  extraCharts?: ReactNode
}) {
  const faculty = MOCK_FACULTY.find(f => f.id === facultyId) ?? null

  const offerings = useMemo(
    () => MOCK_FACULTY_OFFERINGS.filter(o => o.facultyId === facultyId) as FacultyOfferingRow[],
    [facultyId],
  )

  /**
   * KPIs from the CANONICAL layer — same fix as the By Course strip, same reasons.
   *
   * "Courses taught" was `offerings.length`, which counts OFFERINGS: Patel read "9" when she
   * teaches 4 courses, 9 times. The label said courses and the value counted something else.
   * `FacultyStat` has carried both `courses` and `offerings` all along; the panel just wasn't
   * using them.
   *
   * The rating also rounded to 1dp ("4.4/5") while the leaderboard directly above prints 2dp
   * ("4.43") for the same number — the same fact at two precisions on one screen reads as two
   * facts. Both now come from `facultyStats()` at 2dp.
   *
   * (Unlike the course strip, the underlying variable here was right: a faculty member IS
   * scored by `avgRating`. The bug was the label and the precision, not the entity.)
   */
  /* Surveys this faculty member is the PRIMARY instructor on — story 17's corpus. */
  const facultyThemeSurveys = useMemo(() => facultySurveys(facultyId), [facultyId])

  const facultyOfferingCols = useMemo(
    () => facultyOfferingColumnsFor(medianOf(facultyStats().map(f => f.score.weighted))),
    [],
  )

  const facultyKpis: MetricItem[] = useMemo(() => {
    if (!faculty) return []
    const stat = facultyStats().find(f => f.facultyId === facultyId)
    if (!stat) return []
    return [
      { id: 'f-courses', label: 'Courses taught', value: stat.courses, delta: '', trend: 'neutral',
        description: `${stat.offerings} offering${stat.offerings === 1 ? '' : 's'} across ${stat.terms} term${stat.terms === 1 ? '' : 's'}` },
      ...(heroCarriesRating ? [] : [{ id: 'f-rating', label: 'Avg faculty rating', value: fmt2(stat.score.weighted), delta: '', trend: 'neutral',
        description: 'weighted by class size' }]),
      { id: 'f-completion', label: 'Response rate', value: `${stat.responseRate}%`, delta: '', trend: 'neutral',
        description: `target ${RESPONSE_TARGET}%` },
      { id: 'f-terms', label: 'Terms active', value: stat.terms, delta: '', trend: 'neutral',
        description: 'term appearances' },
    ]
  }, [faculty, facultyId, heroCarriesRating])

  /* A blank region is not an empty state (state-review): with real IDs a stale or
     mistyped facultyId is an expected input, and it must say so. */
  if (!faculty) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <i className="fa-light fa-user-slash text-2xl text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-medium">Faculty member not found</p>
        <p className="text-xs text-muted-foreground">
          They may have been removed, or the link is out of date. Pick a person from the list above.
        </p>
      </div>
    )
  }

  return (
    <>
      <h2 className="sr-only">{faculty.name} overview</h2>

      <KeyMetrics variant="compact" metricsSingleRow metrics={facultyKpis} />

      {/* Story 18 — the verbatims, cut on the PERSON axis. §2.2 calls this "the payload":
          the scores say a 3.58 happened, these say why. */}
      {/*
        Story 17 — the theme breakdown on the FACULTY axis. I had this logged as not
        derivable: "sectionScores is keyed by surveyId with no facultyId". The premise was
        true and the conclusion was wrong — surveyId → survey → primary instructor is a JOIN,
        not a data-model change. The blocker I actually feared was ambiguity (two co-teachers,
        whose teaching score is it?) and that case has zero instances: every survey resolves
        to exactly one primary, guests excluded. See `facultySurveys`.

        Same component as the term and course axes, because it is the same question asked of a
        different scope — TermThemesInsight was never term-specific, it just takes surveys.
        Placed ABOVE Student Voice: themes are the summary, verbatims are the evidence, and
        Aarti's D14 puts AI summaries first at every aggregation level.
      */}
      {facultyThemeSurveys.length > 0 && (
        <TermThemesInsight surveys={facultyThemeSurveys}
            minComments={10} scopeLabel={faculty.name} />
      )}

      <StudentVoice axis="faculty" facultyId={faculty.id} scopeLabel={faculty.name} />

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
          <DataTablePaginated<FacultyOfferingRow>
            pagination={{ pageSize: 10 }}
            data={offerings}
            columns={facultyOfferingCols}
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
  courseCode, onOpenSurvey, onSelectFaculty, extraCharts,
}: {
  courseCode: string
  onOpenSurvey: (surveyId: string) => void
  /**
   * Drill from a course to one of its instructors — the round trip that closes the
   * course↔faculty loop. By Faculty could reach a course (the portfolio ranks them); By
   * Course could not reach a person, so the disentangling question ("is this the course or
   * the person?") could only be pursued in one direction.
   */
  onSelectFaculty?: (facultyId: string) => void
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

  /**
   * KPIs from the CANONICAL layer, not a local mean.
   *
   * This used to average `o.avgRating` via a local `weightedAvg` — which is the INSTRUCTOR's
   * score, not the course's. So "Avg rating 4.3/5" here disagreed with Overview listing the
   * same course at 4.17 (its content score). The same course read two different numbers on two
   * tabs, and the trend chart directly below plotted a third thing. `CourseStat.score`'s own
   * doc-comment warns about exactly this mistake; ByCoursePanel reintroduced it by bypassing
   * the layer built to prevent it. Students rate two entities (D27) — keep them apart, and
   * derive both from one place.
   *
   * The 'Trend' tile is gone. Its value was a bare '↗' glyph: no magnitude, no baseline, and a
   * comparison of only the last two terms — while the full 5-term path is charted immediately
   * below it. That is RUBRIC Q4's ❌ ("single delta with arrow — hides the path") in its
   * weakest possible form, and it isn't even a number. Direction now rides on the score tile
   * as the DS `delta`/`trend` chip, where it is attached to the magnitude it describes.
   *
   * 'Instructors' replaces it: a real number the other tiles don't carry, and it sets up the
   * "Who taught" card below.
   */
  const courseOfferingCols = useMemo(
    () => courseOfferingColumnsFor(medianOf(facultyStats().map(f => f.score.weighted))),
    [],
  )

  const courseKpis: MetricItem[] = useMemo(() => {
    if (!courseOfferings.length) return []
    const stat = courseStats().find(c => c.courseCode === courseCode)
    if (!stat) return []
    const trend = courseTrendRows
    const last  = trend[trend.length - 1]
    const prev  = trend.length >= 2 ? trend[trend.length - 2] : undefined
    // courseAvg is nullable on the trend rows — a term with no content score is not a zero.
    const delta =
      last?.courseAvg != null && prev?.courseAvg != null ? last.courseAvg - prev.courseAvg : null
    return [
      { id: 'c-count', label: 'Times offered', value: stat.terms, delta: '', trend: 'neutral',
        description: 'all terms' },
      { id: 'c-rating', label: 'Course content score', value: fmt2(stat.score.weighted),
        delta: delta == null ? '' : `${delta >= 0 ? '+' : ''}${fmt2(delta)}`,
        // Aarti dislikes red in score viz (VIZ-004); the DS maps 'down' to its own warn tone,
        // which is amber in this theme — verified against the token, not assumed.
        trend: delta == null ? 'neutral' : delta >= 0 ? 'up' : 'down',
        description: prev ? `weighted by class size · vs ${prev.short}` : 'weighted by class size' },
      { id: 'c-completion', label: 'Response rate', value: `${stat.responseRate}%`, delta: '', trend: 'neutral',
        description: `target ${RESPONSE_TARGET}%` },
      { id: 'c-faculty', label: 'Instructors', value: courseFaculty.length, delta: '', trend: 'neutral',
        description: courseFaculty.length === 1 ? 'one has taught it' : 'have taught it' },
    ]
  }, [courseOfferings, courseCode, courseTrendRows, courseFaculty])

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

      {/* Story 18 on the COURSE axis — the same corpus the faculty tab reads, in the opposite
          order. §2.3: "same raw comments, re-cut by the axis the persona cares about." */}
      <StudentVoice axis="course" courseCode={courseCode} scopeLabel={courseCode} />

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
            description="Content, teaching and response rate by term"
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
                  <ChartCardActions
                    title={`Score trend — ${courseCode}`}
                    description="Content and teaching scores by term for this course, larger."
                    detail={<CourseTrendStack rows={courseTrendRows} />}
                    table={{
                      headers: ['Term', 'Content', 'Teaching', 'Response rate', 'Faculty'],
                      rows: courseTrendRows.map((d) => [
                        d.term,
                        d.courseAvg != null ? d.courseAvg.toFixed(2) : '—',
                        d.facultyAvg.toFixed(2),
                        `${d.responseRate}%`,
                        d.faculty.join(', '),
                      ]),
                    }}
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
                <FacultyLeaderboardDots
                  faculty={courseFacultyAsStats.slice(0, 6)}
                  median={courseFacultyMedian}
                />

                {/* Same row treatment as the By Faculty leaderboard, deliberately — one
                    ranked-list grammar, not two. Monil's job ends in "view insights → the
                    entire view opens only for Dr. Sandra"; a ranked chart you cannot click is
                    a poster. The rows are also the keyboard path, because the plot above is
                    aria-hidden and a mouse-only drill is not a drill. */}
                <ul className="mt-2 flex flex-col">
                  {courseFaculty.map(f => (
                    <li
                      key={f.facultyId}
                      className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-border py-1.5 last:border-b-0"
                    >
                      <span className="truncate text-sm">{f.name}</span>
                      <span className="text-sm tabular-nums text-muted-foreground">
                        {f.score.weighted.toFixed(2)}
                        {f.score.weighted < courseFacultyMedian && (
                          <span className="ml-1.5 text-xs" style={{ color: 'var(--chip-4)' }}>
                            below median
                          </span>
                        )}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectFaculty?.(f.facultyId)}
                        aria-label={`View insights for ${f.name}`}
                      >
                        View insights
                      </Button>
                    </li>
                  ))}
                </ul>

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
                <ChartCardActions
                  title={`Who taught ${courseCode}`}
                  description={`All ${courseFacultyAsStats.length} instructors of ${courseCode}, ranked.`}
                  detail={
                    <FacultyLeaderboardDots
                      faculty={courseFacultyAsStats}
                      median={courseFacultyMedian}
                      height={Math.max(260, courseFacultyAsStats.length * 34 + 40)}
                    />
                  }
                  table={{
                    headers: ['Faculty', 'Score', 'Simple mean', 'Terms', 'Response rate'],
                    rows: courseFaculty.map((f) => [
                      f.name,
                      f.score.weighted.toFixed(2),
                      f.score.simple.toFixed(2),
                      f.terms,
                      `${f.responseRate}%`,
                    ]),
                  }}
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
          <DataTablePaginated<CourseOfferingRow>
            pagination={{ pageSize: 10 }}
            data={courseOfferings}
            columns={courseOfferingCols}
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
