'use client'

/**
 * Shared analytics panels — the SINGLE source of design for the By Term / By Faculty /
 * By Course views. Rendered both in the Dashboard tabs (driven by a selector) and in the
 * matching Directory profile pages (driven by the route entity), so the two are always
 * pixel-identical. Each panel owns no dialogs — it calls back to the host via
 * `onOpenSurvey` / `onNudge`, and the host renders the EvaluationCardSheet + Nudge dialog.
 */

import { useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  Button, KeyMetrics, Avatar, AvatarFallback,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  DataTablePaginated as DsDataTablePaginated,
} from '@exxatdesignux/ui'
import type { MetricItem, ColumnDef as DsColumnDef, ConditionalRule as DsConditionalRule } from '@exxatdesignux/ui'
import type { ChartConfig } from '@exxatdesignux/ui/components/ui/chart'
import {
  ChartCard, ChartFigure, ChartDataTable,
  type ChartLeoInsight,
} from '@/components/charts-core'
import {
  GapQuadrant, FacultyLeaderboardDots, Slopegraph, ProgramResponseTrend,
  CourseRankDots, CohortStudentWaffle, ProgramScoreTrend, CourseVsProgramTrend,
  CourseFacultyHeatmap, CourseFacultyQuadrant, CourseQuestionTrendLines, ResponseCompareLines,
} from '@/components/pce/analytics-plots'
import { TruncatedText } from '@/components/truncated-text'
// Vendored table — used only by `ByFacultyPanel`'s offerings table and `ByTermPanel` below.
// `@exxatdesignux/ui`'s own `DataTablePaginated` (imported above as `DsDataTablePaginated`) is
// the canonical DS source and is what By Course's offerings table uses; the two coexist in this
// file only because migrating the Faculty/Term tables' vendored usage is a separate change.
import { DataTablePaginated } from '@/components/data-table/pagination'
import { ChartCardActions, CHART_CARD_PLOT_PX } from '@/components/pce/chart-card-actions'
import type { ColumnDef } from '@/components/data-table/types'
import { SurveyStatusBadge } from '@/components/pce/pce-badges'
import { scoreText } from '@/components/pce/score-cell'
import { TermThemesInsight } from '@/components/pce/term-themes-insight'
import { usePce } from '@/components/pce/pce-state'
import { MOCK_SURVEYS, MOCK_FACULTY, MOCK_FACULTY_OFFERINGS, EVAL_BENCHMARKS } from '@/lib/pce-mock-data'
import {
  termKpis, cohortKpis, termCourseBreakdown, termSeries, gapPoints, medianOf,
  courseTrend, courseFacultyStats, courseStats, facultyStats, termSlope,
  shortTerm, RESPONSE_TARGET, RATING_THRESHOLD, facultyEvalRoleOptions,
  courseFacultyHeatCells, courseOfferingQuadrantPoints, courseRatingTrendByTerm,
  courseResponseRateSeries, courseQuestionTrend, courseOfferingListRows,
  facultyHeatCells, facultyRatingTrendByTerm, facultyRatingRangeByTerm,
  facultyResponseRateSeries, facultyContentAvg, facultyCourseStats, facultyCourseResponseTrend,
  facultyOfferings, academicYearOf, compareTerms,
  type TermCourseRow, type DualMean, type FacultyEvalRoleId, type CourseOfferingListRow,
} from '@/lib/pce-analytics'
import type { FacultyOfferingRecord, SurveyStatus } from '@/lib/pce-mock-data'

/* ── shared helpers ── */
export const TERM_ORDER = [
  'Spring 2022', 'Fall 2022', 'Spring 2023', 'Fall 2023',
  'Spring 2024', 'Fall 2024', 'Spring 2025', 'Fall 2025', 'Spring 2026',
]

/* Select sentinels for By Course's Faculty/Role filters — same pattern as the By Faculty
   leaderboard's ALL_TERMS/ALL_ROLES (faculty-leaderboard-section.tsx). */
const ALL_FACULTY = '__all__'
const ALL_ROLES = '__all__'

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

type CourseTermRow = {
  id: string; courseCode: string; courseName: string
  primaryFaculty: string; primaryFacultyInitials: string
  enrolled: number; completion: number
  status: string; isReleased: boolean
} & Record<string, unknown>
type TermBreakdownRow = TermCourseRow & Record<string, unknown>

export type NudgeTarget = { id: string; courseCode: string; courseName: string; nonResponders: number }

/* ── chart configs ── */
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
    course: medianOf(courseStats().map(c => c.score).filter((s): s is { state: 'value'; value: DualMean } => s.state === 'value').map(s => s.value.weighted)),
    faculty: medianOf(facultyStats().map(f => f.score).filter((s): s is { state: 'value'; value: DualMean } => s.state === 'value').map(s => s.value.weighted)),
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
        description: axis === 'term' ? 'Content · vs prior term' : 'Content · vs prior cohort',
      },
      {
        id: 'term-faculty-avg', label: 'Faculty score',
        value: t.facultyAvg != null ? t.facultyAvg.toFixed(2) : '—',
        delta: signed(t.facultyDelta), trend: dir(t.facultyDelta),
        trendPolarity: 'informational',
        description: axis === 'term' ? 'Teaching · vs prior term' : 'Teaching · vs prior cohort',
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
            `and an aggregate trend would average it away. Only the slope shows it MOVED, which is the difference ` +
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
      course: medianOf(cohortCourses.map(c => c.score).filter((s): s is { state: 'value'; value: DualMean } => s.state === 'value').map(s => s.value.weighted)),
      faculty: medianOf(cohortFaculty.map(f => f.score).filter((s): s is { state: 'value'; value: DualMean } => s.state === 'value').map(s => s.value.weighted)),
    }),
    [cohortCourses, cohortFaculty],
  )
  /* Scored subsets — `CourseRankDots`/`FacultyLeaderboardDots` already filter Pending/na rows
     out of their own marks internally (they have no score to rank or plot), so a caption that
     says "All N courses/faculty … ranked" against the raw `cohortCourses`/`cohortFaculty`
     count overclaims whenever some are still Pending. Captions below read this count instead. */
  const cohortCoursesScored = useMemo(
    () => cohortCourses.filter((c) => c.score.state === 'value'),
    [cohortCourses],
  )
  const cohortFacultyScored = useMemo(
    () => cohortFaculty.filter((f) => f.score.state === 'value'),
    [cohortFaculty],
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
        `When the instructor rates well above the material, coaching the person will not move the number. The ` +
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
  /* The full term series. `termSeriesData` feeds the chart directly (via `ProgramScoreTrend`)
     and the response chart below (which needs `term` for the scoped-term band, not just the
     abbreviated `short`). `programTrendData` below is a second, pre-filtered shape — courseAvg/
     facultyAvg only, non-null terms only — for the ChartDataTable rows, ChartCardActions export
     table, and the per-term delta chips; those want a flat `{term, courseAvg, facultyAvg}` row,
     not the canonical points. One derivation, two views. */
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
          `entirely. A drop-and-recovery and a flat line produce the same number.`
        : `Collection runs from ${first}% to ${last}%, with the low at ${lowest}% in ${trough.term}. ` +
          `Read the path: the target is what a rate means, not the rate on its own.`,
      kind: below > 0 ? 'dip' : 'trend',
      delta: { value: `${lowest}%`, label: `low · ${trough.short}` },
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
          ? `Faculty ratings run ${gap.toFixed(2)} above course ratings in the latest term. Students consistently rate people higher than course structure. Course-content follow-ups usually close this gap.`
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
          : 'Every course is at or above the 3.7 tier. The spread below is a quality band, not a problem list.',
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
          ? 'Below-tier faculty ratings usually track specific sections. Check the per-section breakdown before drawing conclusions about the person.'
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
            : `Course rating vs. faculty rating across terms, program-wide, not ${value}. The numbers above are this cohort's.`
        }
        leoInsight={programTrendLeo}
      >
        <ChartFigure
          label="Program trend"
          summary="Line chart of course average versus faculty average rating across historical terms."
          dataLength={programTrendData.length}
        >
          {() => (
            <>
              {programTrendData.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No term history yet. The trend appears once a second term closes.
                </p>
              ) : (
                <ProgramScoreTrend series={termSeriesData} height={168} />
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
            ? `The collection path against the ${RESPONSE_TARGET}% target: the shape, not a single delta. The band marks ${value}.`
            : `The collection path against the ${RESPONSE_TARGET}% target: the shape, not a single delta. Program-wide across all terms, not scoped to ${value}.`
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
            title={`Who answered · ${value}`}
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
                    title={`Who answered · ${value}`}
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
              title={`Course scores · ${value}`}
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
                        `${c.courseCode} · ${c.courseName}`,
                        scoreText(c.score, v => v.weighted.toFixed(2)),
                        `${c.responseRate}%`,
                      ])}
                    />
                    <ChartCardActions
                      title={`Course scores · ${value}`}
                      description={`${cohortCoursesScored.length} scored course${cohortCoursesScored.length === 1 ? '' : 's'} this class was evaluated on, ranked.${cohortCourses.length - cohortCoursesScored.length > 0 ? ` ${cohortCourses.length - cohortCoursesScored.length} pending, not shown.` : ''}`}
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
                          `${c.courseCode} · ${c.courseName}`,
                          scoreText(c.score, v => v.weighted.toFixed(2)),
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
              title={`Teaching scores · ${value}`}
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
                        scoreText(f.score, v => v.weighted.toFixed(2)),
                        f.courses,
                        `${f.responseRate}%`,
                      ])}
                    />
                    <ChartCardActions
                      title={`Teaching scores · ${value}`}
                      description={`${cohortFacultyScored.length} scored faculty who taught this class, ranked.${cohortFaculty.length - cohortFacultyScored.length > 0 ? ` ${cohortFaculty.length - cohortFacultyScored.length} pending, not shown.` : ''}`}
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
                          scoreText(f.score, v => v.weighted.toFixed(2)),
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
            title={termSlopeData ? `What moved · ${termSlopeData.from} → ${value}` : `What moved · ${value}`}
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
                    {value} is the earliest term with data, nothing to compare it against yet.
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
                        `${r.courseCode} · ${r.courseName}`,
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
                          `${r.courseCode} · ${r.courseName}`,
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
            title={`Content vs teaching · ${value}`}
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
                      `${g.courseCode} · ${g.courseName}`,
                      g.courseAvg.toFixed(2),
                      g.facultyAvg.toFixed(2),
                      g.enrolled,
                    ])}
                  />
                  <ChartCardActions
                    title={`Content vs teaching · ${value}`}
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
                        `${g.courseCode} · ${g.courseName}`,
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
            separately. They rarely fail together, and the fix differs.
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
  facultyId, onOpenSurvey, extraCharts, heroCarriesRating = false, scopedTerms,
}: {
  facultyId: string
  onOpenSurvey: (surveyId: string) => void
  /** The self dashboard's hero already shows the rating as a ScoreBullet — the tile would repeat it. */
  heroCarriesRating?: boolean
  /** Optional viz rendered right after the KPI strip (e.g. profile radar + distribution band). */
  extraCharts?: ReactNode
  /**
   * The page-level AY/Term selection (PRD 2026-09-15) — mirrors `ByCoursePanel`'s own
   * `scopedTerms` prop byte for byte: drives "selected term/AY highlighted" on the rating
   * trend, response trend, heat map and offerings list below. Omitted call sites (Directory
   * profile, self-dashboard) fall back to this faculty member's own latest term.
   */
  scopedTerms?: string[]
}) {
  const faculty = MOCK_FACULTY.find(f => f.id === facultyId) ?? null

  /* This person's own offering history (OfferingPoint grain) — the role filter's option list
     and the term-highlight fallback both read off it directly, rather than off the row shapes
     built for the charts/table below. */
  const facultyOwnOfferings = useMemo(() => facultyOfferings(facultyId), [facultyId])
  const facultyRoleOptions = useMemo(() => {
    const present = new Set(facultyOwnOfferings.map(o => o.evalRole))
    return facultyEvalRoleOptions().filter(r => present.has(r.id))
  }, [facultyOwnOfferings])
  const roleLabelById = useMemo(
    () => new Map(facultyEvalRoleOptions().map(r => [r.id, r.label])),
    [],
  )

  /* ── Rating trend / Response rate trend — term-only axis, no AY toggle (PRD 2026-09-15
     drops it, same reasoning as the Course tab: term is already the offering's own anchor). ── */
  const facultyRatingTrend = useMemo(() => facultyRatingTrendByTerm(facultyId), [facultyId])
  const facultyRatingRange = useMemo(() => facultyRatingRangeByTerm(facultyId), [facultyId])
  const facultyResponseTrendSeries = useMemo(() => facultyResponseRateSeries(facultyId), [facultyId])
  /* Demoted into the response-trend card's `ChartCardActions` detail (§2 of the design brief):
     the per-course spread this used to be the ONLY response view is real evidence an aggregate
     line can flatten — kept one level down instead of deleted. */
  const facultyCourseResponse = useMemo(() => facultyCourseResponseTrend(facultyId), [facultyId])
  const latestTermForFaculty = facultyRatingTrend[facultyRatingTrend.length - 1]?.term

  /**
   * The page-level AY/Term selection, falling back to this faculty member's own latest term
   * when the host renders this panel with no such scope — identical fallback rule to
   * `ByCoursePanel`'s `effectiveScopedTerms`.
   */
  const effectiveScopedTerms = useMemo(
    () => (scopedTerms?.length ? scopedTerms : latestTermForFaculty ? [latestTermForFaculty] : []),
    [scopedTerms, latestTermForFaculty],
  )
  const highlightedFacultyShorts = useMemo(
    () => effectiveScopedTerms.map(t => shortTerm(t)),
    [effectiveScopedTerms],
  )

  /**
   * KPIs from the CANONICAL layer, matching the Course tab's own four exactly (PRD 2026-09-15:
   * "faculty avg, course avg, response rate, courses offered") — "Terms active" is retired
   * (KPI strips cap at four, `exxat-kpi-max-four`) and the strip is now `ChartCard
   * variant="kpi-chart"`, the same card language `ByCoursePanel`'s strip already uses, so the
   * two drill-down tabs stop reading as different card systems (Romit, 2026-09-14, the fix
   * already applied on the Course side).
   */
  const facultyKpiData = useMemo(() => {
    const stat = facultyStats().find(f => f.facultyId === facultyId)
    if (!stat) return null
    const last = facultyRatingTrend[facultyRatingTrend.length - 1]
    const prev = facultyRatingTrend.length >= 2 ? facultyRatingTrend[facultyRatingTrend.length - 2] : undefined
    const hasScore = stat.score.state === 'value'
    const delta =
      hasScore && last?.courseAvg != null && prev?.courseAvg != null
        ? last.courseAvg - prev.courseAvg
        : null
    return {
      facultyAvgText: scoreText(stat.score, v => fmt2(v.weighted)),
      facultyDelta: delta,
      prevShort: prev?.short,
      // "Course average" — the content score of the courses this person teaches, kept apart
      // from their own teaching score (D27) — the faculty-axis mirror of the Course tab's
      // own inverse "Faculty average" tile.
      courseAvg: facultyContentAvg(facultyId),
      responseRate: stat.responseRate,
      offerings: stat.offerings,
    }
  }, [facultyId, facultyRatingTrend])

  /* ── Course heat map (PRD 2026-09-15: courses × terms, one faculty; role filter default
     all, instructor/coordinator in prototypes) ── */
  const [heatmapRole, setHeatmapRole] = useState<FacultyEvalRoleId | undefined>(undefined)
  const allFacultyHeat = useMemo(() => facultyHeatCells(facultyId), [facultyId])
  const facultyHeat = useMemo(
    () => facultyHeatCells(facultyId, heatmapRole),
    [facultyId, heatmapRole],
  )
  const heatCells = useMemo(
    () => facultyHeat.cells.map(c => ({ rowLabel: c.courseCode, term: c.term, score: c.courseAvg })),
    [facultyHeat],
  )
  const heatmapEmptyNote = allFacultyHeat.courses.length === 0
    ? 'No courses scored for this faculty member yet.'
    : 'No courses match the current role filter.'
  /* All-faculty average per term — the heatmap's comparison row (PRD: "show average of all
     faculties rating in each term for relative comparison... as the last row"). Identical
     derivation to `ByCoursePanel`'s own `programFacultyAvgByTerm` — both read the same
     program-wide `termSeries()`, so the two tabs' "program average" rows can never disagree. */
  const programFacultyAvgByTerm = useMemo(
    () => new Map(termSeries().filter(s => s.facultyAvg != null).map(s => [s.term, s.facultyAvg as number])),
    [],
  )

  /**
   * The bottom-of-tab "List" (PRD 2026-09-15): "shows the offerings from last 6 terms that
   * the faculty is associated with... offerings from the same term are not aggregated... on
   * click of any row, open course offering analytics in a new browser tab." Built on
   * `courseOfferingListRows()` — the same canonical rows the Course tab's own offerings list
   * and the Faculty landing list both use — filtered to this person, not re-derived.
   */
  const facultyOfferingRows = useMemo(() => {
    const rows = courseOfferingListRows().filter(r => r.facultyId === facultyId)
    const orderedTerms: string[] = []
    rows.forEach(r => { if (!orderedTerms.includes(r.term)) orderedTerms.push(r.term) })
    const recentTerms = new Set(orderedTerms.slice(0, 6))
    return rows.filter(r => recentTerms.has(r.term))
  }, [facultyId])

  const offeringHighlightRules: DsConditionalRule[] = useMemo(
    () =>
      effectiveScopedTerms.length
        ? [{
            id: 'faculty-analytics-scoped-term',
            fieldKey: 'term',
            operator: 'is',
            values: effectiveScopedTerms,
            bgColor: 'var(--conditional-rule-blue)',
          }]
        : [],
    [effectiveScopedTerms],
  )
  const facultyOfferingColumns: DsColumnDef<CourseOfferingListRow>[] = useMemo(
    () => [
      { key: 'academicYear', label: 'AY', sortable: true, sortKey: 'academicYear', width: 90 },
      {
        key: 'term', label: 'Term', sortable: true, sortKey: 'term', width: 130,
        // A real `<a>`, not just the row's own `onClick` — see `ByCoursePanel`'s identical
        // column for why: the DataTable's `onRowClick` has no keyboard path on its own.
        cell: (row) => row.surveyId ? (
          <a
            href={`/results/${encodeURIComponent(row.surveyId)}?from=analytics`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm text-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={(e) => e.stopPropagation()}
          >
            {row.term}
          </a>
        ) : <span className="text-sm">{row.term}</span>,
      },
      {
        key: 'courseCode', label: 'Course', sortable: true, sortKey: 'courseCode',
        cell: (row) => (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{row.courseCode}</p>
            <p className="truncate text-xs text-muted-foreground">{row.courseName}</p>
          </div>
        ),
      },
      {
        key: 'role', label: 'Role', sortable: true, sortKey: 'role', width: 150,
        cell: (row) => <span className="text-sm">{roleLabelById.get(row.role) ?? row.role}</span>,
      },
      {
        key: 'facultyAvg', label: 'Rating', sortable: true, sortKey: 'facultyAvg', width: 100,
        header: () => <span className="block text-right">Rating</span>,
        cell: (row) => <div className="text-right tabular-nums text-sm font-semibold">{row.facultyAvg.toFixed(2)}</div>,
      },
      {
        key: 'responseRate', label: 'Response rate', sortable: true, sortKey: 'responseRate', width: 120,
        header: () => <span className="block text-right">Response rate</span>,
        cell: (row) => <div className="text-right tabular-nums text-sm">{row.responseRate}%</div>,
      },
    ],
    [roleLabelById],
  )

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

      {/* KPI grid — `ByCoursePanel`'s own `kpi-chart` recipe. Self lens drops the Faculty
          average tile (the hero already carries it), so the grid becomes 3-up rather than
          leaving a hole in a 4-up one. */}
      {facultyKpiData && (
        <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${heroCarriesRating ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
          {!heroCarriesRating && (
            <ChartCard
              variant="kpi-chart"
              title="Faculty average"
              miniMetrics={[{
                label: facultyKpiData.facultyDelta == null ? 'No prior-term comparison yet' : `vs ${facultyKpiData.prevShort}`,
                trendDelta: facultyKpiData.facultyDelta == null ? undefined : `${facultyKpiData.facultyDelta >= 0 ? '+' : ''}${fmt2(facultyKpiData.facultyDelta)}`,
                value: facultyKpiData.facultyAvgText,
                // Aarti dislikes red in score viz (VIZ-004); the DS maps 'down' to its own warn
                // tone (amber in this theme).
                trend: facultyKpiData.facultyDelta == null ? 'neutral' : facultyKpiData.facultyDelta >= 0 ? 'up' : 'down',
                trendPolarity: 'higher_is_better',
              }]}
            >{null}</ChartCard>
          )}

          <ChartCard
            variant="kpi-chart"
            title="Course average"
            miniMetrics={[{
              label: 'Content score, their courses',
              value: facultyKpiData.courseAvg != null ? fmt2(facultyKpiData.courseAvg) : '—',
              trend: 'neutral',
            }]}
          >{null}</ChartCard>

          <ChartCard
            variant="kpi-chart"
            title="Response rate"
            miniMetrics={[{
              label: `Target ${RESPONSE_TARGET}%`,
              value: `${facultyKpiData.responseRate}%`,
              trend: facultyKpiData.responseRate >= RESPONSE_TARGET ? 'up' : 'down',
              trendPolarity: 'higher_is_better',
            }]}
          >{null}</ChartCard>

          <ChartCard
            variant="kpi-chart"
            title="Courses offered"
            miniMetrics={[{ label: 'All terms', value: `${facultyKpiData.offerings}`, trend: 'neutral' }]}
          >{null}</ChartCard>
        </div>
      )}

      {/* Course heat map beside Rating trend + Response rate trend, stacked — same row shape
          the Course tab uses for its quadrant + trend pair (`analytics-panels.tsx`'s
          `ByCoursePanel`, "Course vs faculty" quadrant left, Rating/Response trend stacked
          right): one big chart left, two term-trend cards stacked right, so the two drill-down
          tabs read as the same layout system rather than each inventing its own (Romit,
          2026-09-15: "layout aligned with other pages"). Rating + Response trend split into two
          charts, same "is the score movement real, or just fewer students responding"
          reasoning as the Course tab. */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        {allFacultyHeat.courses.length > 0 && (
          <ChartCard
            variant="normal"
            title={`Course heat map · ${faculty.name}`}
            description={`Last ${facultyHeat.terms.length} terms · red below the ${RATING_THRESHOLD.toFixed(1)} threshold, green at or above`}
          >
            {facultyRoleOptions.length > 1 && (
              <div className="flex flex-wrap items-end gap-3 pb-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="faculty-heatmap-role">Role</label>
                  <Select
                    value={heatmapRole ?? ALL_ROLES}
                    onValueChange={(v) => setHeatmapRole(v === ALL_ROLES ? undefined : (v as FacultyEvalRoleId))}
                  >
                    <SelectTrigger id="faculty-heatmap-role" className="h-8 w-44 text-sm" aria-label="Filter the heat map by role"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_ROLES}>All roles</SelectItem>
                      {facultyRoleOptions.map(r => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <ChartFigure
              label={`Course heat map for ${faculty.name}`}
              summary={`Rating by course and term for ${faculty.name}, ${facultyHeat.courses.length} course${facultyHeat.courses.length === 1 ? '' : 's'}.`}
              dataLength={facultyHeat.courses.length}
            >
              {() => (
                <>
                  <CourseFacultyHeatmap
                    rows={facultyHeat.courses}
                    terms={facultyHeat.terms}
                    cells={heatCells}
                    programAvgByTerm={programFacultyAvgByTerm}
                    threshold={RATING_THRESHOLD}
                    highlightedCols={highlightedFacultyShorts}
                    emptyNote={heatmapEmptyNote}
                    height={420}
                  />
                  <ChartDataTable
                    caption={`Course heat map for ${faculty.name}`}
                    headers={['Course', ...facultyHeat.terms.map(shortTerm)]}
                    rows={facultyHeat.courses.map(code => [
                      code,
                      ...facultyHeat.terms.map(t => {
                        const cell = facultyHeat.cells.find(c => c.courseCode === code && c.term === t)
                        return cell ? cell.courseAvg.toFixed(2) : '—'
                      }),
                    ])}
                  />
                  <ChartCardActions
                    title={`Course heat map · ${faculty.name}`}
                    description={`Last ${facultyHeat.terms.length} terms · red below the ${RATING_THRESHOLD.toFixed(1)} threshold, green at or above`}
                    detail={
                      <CourseFacultyHeatmap
                        rows={facultyHeat.courses}
                        terms={facultyHeat.terms}
                        cells={heatCells}
                        programAvgByTerm={programFacultyAvgByTerm}
                        threshold={RATING_THRESHOLD}
                        highlightedCols={highlightedFacultyShorts}
                        emptyNote={heatmapEmptyNote}
                        height={420}
                      />
                    }
                    table={{
                      headers: ['Course', ...facultyHeat.terms.map(shortTerm)],
                      rows: facultyHeat.courses.map(code => [
                        code,
                        ...facultyHeat.terms.map(t => {
                          const cell = facultyHeat.cells.find(c => c.courseCode === code && c.term === t)
                          return cell ? cell.courseAvg.toFixed(2) : '—'
                        }),
                      ]),
                    }}
                  />
                </>
              )}
            </ChartFigure>
          </ChartCard>
        )}

        <div className="flex flex-col gap-4">
        {facultyRatingTrend.length >= 2 && (
          <ChartCard
            variant="normal"
            title="Rating trend"
            description={`Faculty average vs program average, last ${facultyRatingTrend.length} terms`}
          >
            <ChartFigure
              label={`Rating trend for ${faculty.name}`}
              summary={`Faculty average and program average per term for ${faculty.name}, over their last ${facultyRatingTrend.length} terms. Lowest and highest course rating each term shown as a range.`}
              dataLength={facultyRatingTrend.length}
            >
              {() => (
                <>
                  <CourseVsProgramTrend
                    points={facultyRatingTrend}
                    scopedTerm={effectiveScopedTerms}
                    entityLabel="This faculty"
                    band={facultyRatingRange}
                    height={CHART_CARD_PLOT_PX}
                  />
                  <ChartDataTable
                    caption={`Rating trend for ${faculty.name}`}
                    headers={['Term', 'Faculty average', 'Program average']}
                    rows={facultyRatingTrend.map(p => [
                      p.term,
                      p.courseAvg != null ? p.courseAvg.toFixed(2) : '—',
                      p.programAvg != null ? p.programAvg.toFixed(2) : '—',
                    ])}
                  />
                  <ChartCardActions
                    title="Rating trend"
                    description="Every point labelled with its exact value."
                    detail={
                      <CourseVsProgramTrend
                        points={facultyRatingTrend}
                        scopedTerm={effectiveScopedTerms}
                        entityLabel="This faculty"
                        band={facultyRatingRange}
                        detail
                      />
                    }
                    table={{
                      headers: ['Term', 'Faculty average', 'Program average'],
                      rows: facultyRatingTrend.map(p => [
                        p.term,
                        p.courseAvg != null ? p.courseAvg.toFixed(2) : '—',
                        p.programAvg != null ? p.programAvg.toFixed(2) : '—',
                      ]),
                    }}
                  />
                </>
              )}
            </ChartFigure>
          </ChartCard>
        )}

        {facultyResponseTrendSeries.length >= 2 && (
          <ChartCard
            variant="normal"
            title="Response rate trend"
            description={`Against the ${RESPONSE_TARGET}% target, last ${facultyResponseTrendSeries.length} terms`}
          >
            <ChartFigure
              label={`Response rate trend for ${faculty.name}`}
              summary={`Response rate per term for ${faculty.name} against an ${RESPONSE_TARGET}% target, pooled across their courses.`}
              dataLength={facultyResponseTrendSeries.length}
            >
              {() => (
                <>
                  <ProgramResponseTrend series={facultyResponseTrendSeries} target={RESPONSE_TARGET} scopedTerm={effectiveScopedTerms} height={CHART_CARD_PLOT_PX} />
                  <ChartDataTable
                    caption={`Response rate trend for ${faculty.name}`}
                    headers={['Term', 'Response rate']}
                    rows={facultyResponseTrendSeries.map(s => [s.term, s.responseRate != null ? `${s.responseRate}%` : '—'])}
                  />
                  <ChartCardActions
                    title="Response rate trend"
                    description={`Against the ${RESPONSE_TARGET}% target, last ${facultyResponseTrendSeries.length} terms. Pooling across courses can flatten a real per-course spread — the table below shows each course's own path.`}
                    detail={
                      <div className="flex flex-col gap-4">
                        <ProgramResponseTrend series={facultyResponseTrendSeries} target={RESPONSE_TARGET} scopedTerm={effectiveScopedTerms} height={280} />
                        {facultyCourseResponse.length > 1 && (
                          <ResponseCompareLines mode="shared" rows={facultyCourseResponse.map(r => ({ ...r, label: r.courseCode }))} target={RESPONSE_TARGET} highlight={[]} height={280} />
                        )}
                      </div>
                    }
                    table={{
                      headers: ['Term', 'Response rate'],
                      rows: facultyResponseTrendSeries.map(s => [s.term, s.responseRate != null ? `${s.responseRate}%` : '—']),
                    }}
                  />
                </>
              )}
            </ChartFigure>
          </ChartCard>
        )}
        </div>
      </div>

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

      {/* Offerings list — PRD 2026-09-15: "shows the offerings from last 6 terms... offerings
          from the same term are not aggregated... on click of any row, open course offering
          analytics in a new browser tab. Offerings from the selected term/AY should be
          highlighted." Same canonical rows + new-tab behavior as `ByCoursePanel`'s own
          offerings list — see `facultyOfferingRows`'s doc comment. Replaces the old vendored
          `DataTablePaginated` table (no AY/Role columns, unwindowed, same-tab sheet click),
          which had none of the PRD's asks. */}
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Offerings</h2>
        {facultyOfferingRows.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Last {new Set(facultyOfferingRows.map(r => r.term)).size} terms.
            {effectiveScopedTerms.length > 0 && ' Selected term/AY highlighted.'}
          </p>
        )}
        <DsDataTablePaginated<CourseOfferingListRow>
          data={facultyOfferingRows}
          columns={facultyOfferingColumns}
          getRowId={(row) => `${row.courseCode}-${row.term}-${row.facultyId}`}
          selectable={false}
          searchable={false}
          showQueryControls={false}
          edgeInset={false}
          conditionalRules={offeringHighlightRules}
          pagination={{ pageSize: 10 }}
          onRowClick={(row) => {
            if (!row.surveyId) return
            window.open(`/results/${encodeURIComponent(row.surveyId)}?from=analytics`, '_blank', 'noopener,noreferrer')
          }}
          emptyState={
            <div className="flex flex-col items-center gap-2 py-6">
              <i className="fa-light fa-chalkboard-user text-muted-foreground" aria-hidden="true" style={{ fontSize: 24 }} />
              <p className="text-sm font-medium">No offerings for this faculty</p>
              <p className="text-xs text-muted-foreground">Course offerings appear here once this faculty member is assigned to a term.</p>
            </div>
          }
        />
      </div>
    </>
  )
}

/* ════════════════════ By Course panel ════════════════════ */
export function ByCoursePanel({
  courseCode,
  hideAskLeo = false,
  scopedTerms,
  facultyFilterSlot,
}: {
  courseCode: string
  /** Shared with the offerings/[code] Directory profile page, which keeps Ask Leo — only the
   *  /analytics tab opts out (Romit, 2026-09-14: "remove ask leo buttons from each card from
   *  analytics"). Card-level prop, not a global change. */
  hideAskLeo?: boolean
  /** Portals the Faculty `<Select>` into this DOM node instead of rendering it inline in the
   *  panel body — Romit, 2026-09-15, two follow-up corrections to the same ask: first "shift
   *  the faculty tab to the sticky header when I scroll" (a sticky row of its own, reverted),
   *  then "should be shown beside the Terms dropdown, instead of showing in a tab when I am
   *  scrolling" — it belongs IN `/analytics`'s own top filter row, next to Academic year/Terms,
   *  not as a second sticky row underneath the tabs. `facultyFilter` state and
   *  `facultyFilterOptions` (course-specific) stay owned right here — only the rendered
   *  `<Select>` itself moves, via `createPortal`, into a slot `page.tsx` renders inside its
   *  filter row. Omit for the offerings/[code] Directory profile page's call, which has no such
   *  row to join — the Faculty filter then renders inline in its normal original spot. */
  facultyFilterSlot?: HTMLElement | null
  /**
   * The page-level AY/Term selector (`/analytics`'s own filter row, rendered above every tab —
   * `AnalyticsInner`'s `overviewTerms`). This tab previously had no access to that scope at
   * all and improvised its own "highlight the latest term" instead — which is not what "the
   * selected term/AY should be highlighted" (PRD 2026-09-14, repeated across the quadrant,
   * rating trend, response trend, heat map and offerings list) actually asks for. Optional so
   * the Directory profile page's own `ByCoursePanel` call (no page-level term selector to read)
   * keeps working unchanged — every highlight below no-ops when this is omitted.
   */
  scopedTerms?: string[]
}) {
  /**
   * Filters (PRD 2026-09-14): "Faculty & role" for the course tab. Faculty narrows the
   * quadrant + heatmap to one instructor's story; role is scoped to the heatmap specifically —
   * the PRD places "show all faculty roles by default with an option to select a specific
   * faculty role" under the heat map bullet, not as a tab-wide filter. Local state, not URL
   * scope: these only narrow what this ONE open course tab shows, the same boundary
   * `facultyRole` draws on the By Faculty leaderboard (Monil: "role filtering is for comparing
   * multiple faculty").
   */
  const [facultyFilter, setFacultyFilter] = useState<string | undefined>(undefined)
  const [heatmapRole, setHeatmapRole] = useState<FacultyEvalRoleId | undefined>(undefined)

  /** This course's CE surveys — the AI theme card's scope (story 12). Restored 2026-09-14
   *  (Romit: "ai insights card is missing") after an earlier pass retired it as out of the
   *  written PRD's scope. */
  const courseSurveys = useMemo(
    () => MOCK_SURVEYS.filter(s => s.surveyType !== 'programmatic' && s.courseCode === courseCode),
    [courseCode],
  )

  /* By Course row 2 — both rated entities + the instructor comparison. Deliberately NOT
     scoped by `facultyFilter` — this ranks every instructor against each other, so narrowing
     it to one person would collapse the very comparison it exists to show. */
  const courseTrendRows = useMemo(() => courseTrend(courseCode), [courseCode])
  const courseFaculty = useMemo(() => courseFacultyStats(courseCode), [courseCode])

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
   * KPIs now match the PRD's four exactly: course average, faculty average, response rate,
   * # of course offerings — 'Instructors' (a count) is retired in favor of 'Faculty average'
   * (a score), the number the PRD actually asks for.
   */

  /** Course-wide, deliberately UNFILTERED by `facultyFilter` — the guard below decides whether
   *  this course has any history at all, independent of which instructor is spotlighted. */
  const allCourseOfferings = useMemo(
    () => MOCK_FACULTY_OFFERINGS.filter(o => o.courseCode === courseCode),
    [courseCode],
  )

  /**
   * KPI cards — rebuilt to match Overview's own `kpi-chart` grid (Romit, 2026-09-14 feedback:
   * "you could have just used the same layout and design from Overview and filled the content
   * based on the course data"). Overview's recipe is `ChartCard variant="kpi-chart"` tiles in a
   * `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`, not `KeyMetrics variant="compact"` — the two
   * read as visually different card languages on sibling tabs of the same page, which is
   * exactly the inconsistency being fixed here.
   */
  const courseKpiData = useMemo(() => {
    if (!allCourseOfferings.length) return null
    const stat = courseStats().find(c => c.courseCode === courseCode)
    if (!stat) return null
    const trend = courseTrendRows
    const last  = trend[trend.length - 1]
    const prev  = trend.length >= 2 ? trend[trend.length - 2] : undefined
    // courseAvg is nullable on the trend rows — a term with no content score is not a zero.
    // The trend delta is computed independently of `stat.score`'s gate (courseTrend reads raw
    // per-term offering data, not the closed-survey-gated aggregate), so a course can have a
    // real numeric term-over-term delta while `stat.score` itself is still Pending/na — showing
    // a trend arrow next to a "Pending" value is visually contradictory (final review, fix 4).
    // Suppress the delta whenever the tile's own value has no computed score.
    const hasScore = stat.score.state === 'value'
    const delta =
      hasScore && last?.courseAvg != null && prev?.courseAvg != null
        ? last.courseAvg - prev.courseAvg
        : null
    // Faculty average — mean of this course's own instructors' teaching scores, kept apart
    // from course content per D27. A simple mean of `courseFacultyStats`'s already-weighted
    // per-instructor means, not a second weighting pass over raw offerings.
    const facultyAvgForCourse = courseFaculty.length
      ? courseFaculty.reduce((s, f) => s + f.score.weighted, 0) / courseFaculty.length
      : null
    return {
      courseAvgText: scoreText(stat.score, v => fmt2(v.weighted)),
      courseDelta: delta,
      prevShort: prev?.short,
      facultyAvg: facultyAvgForCourse,
      facultyCount: courseFaculty.length,
      responseRate: stat.responseRate,
      offerings: stat.terms,
    }
  }, [allCourseOfferings, courseCode, courseTrendRows, courseFaculty])

  const facultyFilterOptions = useMemo(
    () => courseFaculty.map(f => ({ id: f.facultyId, name: f.name })),
    [courseFaculty],
  )

  /* ── Faculty heat map (PRD: rows = faculty × role, columns = terms) ── */
  const allCourseHeat = useMemo(() => courseFacultyHeatCells(courseCode), [courseCode])
  const heatmapRoleOptions = useMemo(() => {
    const present = new Set(allCourseHeat.cells.map(c => c.role))
    return facultyEvalRoleOptions().filter(r => present.has(r.id))
  }, [allCourseHeat])
  const courseHeat = useMemo(
    () => courseFacultyHeatCells(courseCode, heatmapRole),
    [courseCode, heatmapRole],
  )
  /* Faculty-filter spotlight applies on top of the role scope, same rows/cells shape. */
  const heatFacultySet = useMemo(
    () => (facultyFilter ? new Set([MOCK_FACULTY.find(f => f.id === facultyFilter)?.name]) : null),
    [facultyFilter],
  )
  const heatFaculty = useMemo(
    () => (heatFacultySet ? courseHeat.faculty.filter(n => heatFacultySet.has(n)) : courseHeat.faculty),
    [courseHeat, heatFacultySet],
  )
  /* `CourseFacultyHeatmap` takes generic `{rowLabel, term, score}` cells (it renders both the
     course and faculty axes) — adapt `courseHeat.cells`' `facultyName`/`score` fields once here
     rather than at each of the two call sites below. */
  const heatCells = useMemo(
    () => courseHeat.cells.map(c => ({ rowLabel: c.facultyName, term: c.term, score: c.score })),
    [courseHeat],
  )
  /* True-empty ("this course has no heat-map data at all") vs filtered-empty ("the role/faculty
     filter matched nobody") read identically without this — `allCourseHeat` is the UNFILTERED
     query (no role, no facultyFilter), so it's empty only when the course itself has none.
     Flagged live (state-review, 2026-09-15): a reader who filtered to a faculty who never
     taught in this role would see "no instructors scored" and conclude the data doesn't exist,
     with no hint to just clear the filter. */
  const heatmapEmptyNote = allCourseHeat.faculty.length === 0
    ? 'No instructors scored for this course yet.'
    : 'No instructors match the current role or faculty filter.'
  /* Program's own faculty average per term — the heatmap's comparison row (PRD: "show faculty
     program average in each term for easy comparison"). Teaching scores, not course content —
     the heatmap's cells are teaching scores, so its benchmark row has to be the same entity. */
  const programFacultyAvgByTerm = useMemo(
    () => new Map(termSeries().filter(s => s.facultyAvg != null).map(s => [s.term, s.facultyAvg as number])),
    [],
  )

  /* ── Course vs faculty quadrant — one point per OFFERING of this course ── */
  const courseQuadrantAllPoints = useMemo(() => courseOfferingQuadrantPoints(courseCode), [courseCode])
  const courseQuadrantPoints = useMemo(
    () => {
      if (!facultyFilter) return courseQuadrantAllPoints
      const name = MOCK_FACULTY.find(f => f.id === facultyFilter)?.name
      return courseQuadrantAllPoints.filter(p => p.courseName === name)
    },
    [courseQuadrantAllPoints, facultyFilter],
  )
  const courseQuadrantMeans = useMemo(() => {
    if (!courseQuadrantAllPoints.length) return { courseMean: 0, facultyMean: 0 }
    return {
      courseMean: courseQuadrantAllPoints.reduce((s, p) => s + p.courseAvg, 0) / courseQuadrantAllPoints.length,
      facultyMean: courseQuadrantAllPoints.reduce((s, p) => s + p.facultyAvg, 0) / courseQuadrantAllPoints.length,
    }
  }, [courseQuadrantAllPoints])

  /* ── Rating trend / Response rate trend — separate charts (PRD splits them explicitly:
     "is the score movement real, or just fewer students responding"). Term-only axis, no
     AY toggle (PRD drops it — term is already the offering's own anchor). ── */
  const courseRatingTrend = useMemo(() => courseRatingTrendByTerm(courseCode), [courseCode])
  const courseResponseTrendSeries = useMemo(() => courseResponseRateSeries(courseCode), [courseCode])
  const latestTermForCourse = courseRatingTrend[courseRatingTrend.length - 1]?.term

  /**
   * The page-level AY/Term selection, falling back to this course's own latest term when the
   * host renders this panel with no such scope (the Directory profile page — see `scopedTerms`'
   * own doc comment). "Same UX feedback as in overview" (Romit, 2026-09-15) for the quadrant,
   * rating trend and response trend means highlighting what the reader actually picked at the
   * top of the page, not a value this tab silently computed on its own — that silent fallback
   * is now the exception, not the rule.
   */
  const effectiveScopedTerms = useMemo(
    () => (scopedTerms?.length ? scopedTerms : latestTermForCourse ? [latestTermForCourse] : []),
    [scopedTerms, latestTermForCourse],
  )
  /* Quadrant points key off the TERM's short label, not the term string (see
     `courseOfferingQuadrantPoints`'s field-reuse comment) — highlight by the same short form. */
  const highlightedOfferingShorts = useMemo(
    () => effectiveScopedTerms.map((t) => shortTerm(t)),
    [effectiveScopedTerms],
  )

  /* "Where does this course stand" (PRD) — only the program-average LINE answered this; lowest/
     highest across the course's own recent history did not exist anywhere on the tab. Derived
     from the same trend rows the chart already plots, so the range can never disagree with the
     line above it. */
  const courseRatingRange = useMemo(() => {
    const vals = courseRatingTrend.map(p => p.courseAvg).filter((v): v is number => v != null)
    return vals.length ? { min: Math.min(...vals), max: Math.max(...vals) } : null
  }, [courseRatingTrend])

  /* ── Question trend — which question is dragging this course down ── */
  const questionTrendRows = useMemo(() => courseQuestionTrend(courseCode), [courseCode])

  /**
   * The bottom-of-tab "List" (PRD 2026-09-14, spec §2.2): "shows the offerings from last 6
   * terms of that course... offerings from the same term are not aggregated... on click of any
   * row, open course offering analytics in a new browser tab." This existed nowhere on the tab
   * before — the four charts above answer "how", this answers "which specific offerings", and
   * without it the PRD's fifth Course Analytics section had no surface at all.
   *
   * Built on `courseOfferingListRows()` (the same canonical rows `CourseOfferingList` — the
   * Course tab's own landing table — already uses), filtered to this course, not re-derived —
   * a second offerings query for the same fact family is how two tabs on this page could start
   * disagreeing about what this course's offerings actually were.
   */
  const courseOfferingRows = useMemo(() => {
    const rows = courseOfferingListRows().filter((r) => r.courseCode === courseCode)
    // Already sorted newest-term-first (`courseOfferingListRows`'s own contract) — collecting
    // distinct terms in that order and keeping the first 6 is "last 6 terms", without a second,
    // possibly-drifting term-comparison pass over the same data.
    const orderedTerms: string[] = []
    rows.forEach((r) => { if (!orderedTerms.includes(r.term)) orderedTerms.push(r.term) })
    const recentTerms = new Set(orderedTerms.slice(0, 6))
    return rows.filter((r) => recentTerms.has(r.term))
  }, [courseCode])

  /* Highlights the selected term/AY's rows (PRD, repeated for every section on this tab) — a
     background tint on the Term cell, not a full-row style the vendored DataTable has no hook
     for (checked: `DataTableProps` exposes `conditionalRules`, cell-scoped, nothing row-scoped). */
  const offeringHighlightRules: DsConditionalRule[] = useMemo(
    () =>
      effectiveScopedTerms.length
        ? [{
            id: 'course-analytics-scoped-term',
            fieldKey: 'term',
            operator: 'is',
            values: effectiveScopedTerms,
            bgColor: 'var(--conditional-rule-blue)',
          }]
        : [],
    [effectiveScopedTerms],
  )
  const courseOfferingColumns: DsColumnDef<CourseOfferingListRow>[] = useMemo(
    () => [
      { key: 'academicYear', label: 'AY', sortable: true, sortKey: 'academicYear', width: 90 },
      {
        key: 'term', label: 'Term', sortable: true, sortKey: 'term', width: 130,
        // A real `<a>`, not just the row's own `onClick` (state-review, 2026-09-15): the
        // DataTable's `onRowClick` renders a plain `<tr onClick>` with no `tabIndex` and no
        // keyboard handler, so "on click of any row, open course offering analytics in a new
        // browser tab" (PRD) had no keyboard path at all. A native anchor gets Enter-to-
        // activate, a focus ring, and correct cmd/middle-click behavior for free.
        cell: (row) => row.surveyId ? (
          <a
            href={`/results/${encodeURIComponent(row.surveyId)}?from=analytics`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm text-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={(e) => e.stopPropagation()}
          >
            {row.term}
          </a>
        ) : <span className="text-sm">{row.term}</span>,
      },
      {
        key: 'facultyName', label: 'Faculty', sortable: true, sortKey: 'facultyName',
        cell: (row) => <FacultyCell name={row.facultyName} />,
      },
      {
        key: 'courseAvg', label: 'Course rating', sortable: true, sortKey: 'courseAvg', width: 120,
        header: () => <span className="block text-right">Course rating</span>,
        cell: (row) => (
          <div className="text-right tabular-nums text-sm font-semibold">
            {row.courseAvg != null ? row.courseAvg.toFixed(2) : '—'}
          </div>
        ),
      },
      {
        key: 'facultyAvg', label: 'Faculty rating', sortable: true, sortKey: 'facultyAvg', width: 120,
        header: () => <span className="block text-right">Faculty rating</span>,
        cell: (row) => <div className="text-right tabular-nums text-sm font-semibold">{row.facultyAvg.toFixed(2)}</div>,
      },
      {
        key: 'responseRate', label: 'Response rate', sortable: true, sortKey: 'responseRate', width: 120,
        header: () => <span className="block text-right">Response rate</span>,
        cell: (row) => <div className="text-right tabular-nums text-sm">{row.responseRate}%</div>,
      },
    ],
    [],
  )

  if (allCourseOfferings.length === 0) {
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

      {/* Filters (PRD 2026-09-14): Faculty & role. Faculty narrows offerings/quadrant/heatmap
          to one instructor; role is the heatmap's own scope (see the state comment above).
          `facultyFilterSlot` present → portal the whole control into `/analytics`'s own top
          filter row, beside Academic year/Terms (Romit, 2026-09-15) — nothing renders here in
          that case. Absent (offerings/[code]'s call) → same control, inline, in its original
          spot. */}
      {(() => {
        const control = (
          <div className="flex flex-col gap-1">
            {/* Sentence-case, 12px floor — was `text-[11px] uppercase tracking-wide`, both on the
                Gate-2 grep blacklist (uppercase tracking-wide) and under the DS's 12px text floor
                (flagged live by two independent reviewers, 2026-09-15). Matches the page's own
                AY/Term filter labels (`analytics/page.tsx`'s `text-xs font-medium
                text-muted-foreground`) rather than inventing a third label style. */}
            <label className="text-xs font-medium text-muted-foreground" htmlFor="course-faculty-filter">Faculty</label>
            <Select
              value={facultyFilter ?? ALL_FACULTY}
              onValueChange={(v) => setFacultyFilter(v === ALL_FACULTY ? undefined : v)}
              disabled={facultyFilterOptions.length === 0}
            >
              <SelectTrigger id="course-faculty-filter" className="h-8 w-48 text-sm" aria-label="Filter by faculty"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FACULTY}>All faculty</SelectItem>
                {facultyFilterOptions.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )
        return facultyFilterSlot ? createPortal(control, facultyFilterSlot) : <div className="flex flex-wrap items-end gap-3">{control}</div>
      })()}

      {/* KPI grid — Overview's own `kpi-chart` recipe (grid-cols-1 sm:grid-cols-2 lg:grid-cols-4),
          course average / faculty average / response rate / course offerings, in that order
          per the PRD. */}
      {courseKpiData && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* No `description` — matches Overview's own `kpi-chart` tiles (Romit, 2026-09-15:
              "same feedback as in Overview" → remove the subtext line under the KPI number).
              The context that line carried lives in `miniMetrics.label` instead, same as
              Overview. */}
          <ChartCard
            hideAskLeo={hideAskLeo}
            variant="kpi-chart"
            title="Course average"
            miniMetrics={[{
              // Delta inline next to the arrow, "vs Term" alone in the caption — same split as
              // Overview's KPI tiles (Romit, 2026-09-16: "kpi card size issue should be solved
              // across" — this card still ran both together as one string).
              label: courseKpiData.courseDelta == null ? 'No prior-term comparison yet' : `vs ${courseKpiData.prevShort}`,
              trendDelta: courseKpiData.courseDelta == null ? undefined : `${courseKpiData.courseDelta >= 0 ? '+' : ''}${fmt2(courseKpiData.courseDelta)}`,
              value: courseKpiData.courseAvgText,
              // Aarti dislikes red in score viz (VIZ-004); the DS maps 'down' to its own warn
              // tone, which is amber in this theme — verified against the token, not assumed.
              trend: courseKpiData.courseDelta == null ? 'neutral' : courseKpiData.courseDelta >= 0 ? 'up' : 'down',
              trendPolarity: 'higher_is_better',
            }]}
          >{null}</ChartCard>

          <ChartCard
            hideAskLeo={hideAskLeo}
            variant="kpi-chart"
            title="Faculty average"
            miniMetrics={[{
              label: courseKpiData.facultyCount === 1 ? 'One instructor' : `Across ${courseKpiData.facultyCount} instructors`,
              value: courseKpiData.facultyAvg != null ? fmt2(courseKpiData.facultyAvg) : '—',
              trend: 'neutral',
            }]}
          >{null}</ChartCard>

          <ChartCard
            hideAskLeo={hideAskLeo}
            variant="kpi-chart"
            title="Response rate"
            miniMetrics={[{
              label: `Target ${RESPONSE_TARGET}%`,
              value: `${courseKpiData.responseRate}%`,
              trend: courseKpiData.responseRate >= RESPONSE_TARGET ? 'up' : 'down',
              trendPolarity: 'higher_is_better',
            }]}
          >{null}</ChartCard>

          <ChartCard
            hideAskLeo={hideAskLeo}
            variant="kpi-chart"
            title="Course offerings"
            miniMetrics={[{ label: 'All terms', value: `${courseKpiData.offerings}`, trend: 'neutral' }]}
          >{null}</ChartCard>
        </div>
      )}

      {/* Course vs faculty (square) beside Rating trend + Response rate trend, stacked — same
          layout Overview's Course vs faculty now uses (Romit, 2026-09-15: "course vs faculty
          requirement that i shared earlier, layout isn't affected just as overview course vs
          faculty" — extends that row shape here too, not just Overview). One point per OFFERING
          of this course (not per course, unlike Overview's program-wide quadrant), split at
          this course's own means. Trend cards: term-only axis, no AY toggle (PRD drops it —
          term is already the offering's own anchor); split into two charts rather than one
          stack — "is the score movement real, or just fewer students responding" needs rating
          and response on independent axes. Each half renders independently — a course with
          &lt;3 scored offerings (no quadrant) can still show its trend cards, and vice versa. */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        {courseQuadrantAllPoints.length >= 3 && (
        <ChartCard
          hideAskLeo={hideAskLeo}
          variant="normal"
          /* Course name dropped from the title (Romit, 2026-09-15: "the tab already has this
             info") — the export dialog's own title below drops it too, for the same reason.
             `ChartFigure`'s `label`/`summary` keep the course code: those are the screen-reader
             accessible name, not the visible title, and a reader using them has no other way to
             know which course this scatter belongs to. */
          title="Course vs faculty"
          description="Each dot is one offering — course rating vs faculty rating for that term/instructor."
        >
          <ChartFigure
            label={`Course vs faculty for ${courseCode}`}
            summary={`Scatter of ${courseQuadrantPoints.length} offerings of ${courseCode}, split into quadrants at the course's own means. ${highlightedOfferingShorts.length ? `${highlightedOfferingShorts.join(', ')} highlighted.` : ''}`}
            dataLength={courseQuadrantPoints.length}
          >
            {() => (
              <>
                <CourseFacultyQuadrant
                  points={courseQuadrantPoints}
                  courseMean={courseQuadrantMeans.courseMean}
                  facultyMean={courseQuadrantMeans.facultyMean}
                  hoverMetric="responded"
                  highlightedTerms={highlightedOfferingShorts}
                  square
                />
                <ChartDataTable
                  caption={`Course vs faculty for ${courseCode}`}
                  headers={['Term', 'Faculty', 'Course rating', 'Faculty rating', 'Responded']}
                  rows={courseQuadrantPoints.map(p => [p.courseCode, p.courseName, p.courseAvg.toFixed(2), p.facultyAvg.toFixed(2), p.responded ?? p.enrolled])}
                />
                <ChartCardActions
                  title="Course vs faculty"
                  description="Each dot is one offering — course rating vs faculty rating for that term/instructor."
                  detail={
                    <CourseFacultyQuadrant
                      points={courseQuadrantPoints}
                      courseMean={courseQuadrantMeans.courseMean}
                      facultyMean={courseQuadrantMeans.facultyMean}
                      hoverMetric="responded"
                      highlightedTerms={highlightedOfferingShorts}
                      height={420}
                    />
                  }
                  table={{
                    headers: ['Term', 'Faculty', 'Course rating', 'Faculty rating', 'Responded'],
                    rows: courseQuadrantPoints.map(p => [p.courseCode, p.courseName, p.courseAvg.toFixed(2), p.facultyAvg.toFixed(2), p.responded ?? p.enrolled]),
                  }}
                />
              </>
            )}
          </ChartFigure>
        </ChartCard>
        )}

        <div className="flex flex-col gap-4">
        {courseRatingTrend.length >= 2 && (
          <ChartCard
            hideAskLeo={hideAskLeo}
            variant="normal"
            title="Rating trend"
            description={
              courseRatingRange
                ? `Course average vs program average, last ${courseRatingTrend.length} terms · range ${courseRatingRange.min.toFixed(2)}–${courseRatingRange.max.toFixed(2)}`
                : `Course average vs program average, last ${courseRatingTrend.length} terms`
            }
          >
            <ChartFigure
              label={`Rating trend for ${courseCode}`}
              summary={`Course average and program average per term for ${courseCode}, over its last ${courseRatingTrend.length} terms.`}
              dataLength={courseRatingTrend.length}
            >
              {() => (
                <>
                  {/* `height={CHART_CARD_PLOT_PX}` — this component's own default (196) is
                      shorter than Overview's `TermRatingTrend` (220), which made this same
                      "Rating trend" card render visibly smaller here than on Overview even
                      though both sit in the identical grid position (Romit, 2026-09-15). */}
                  <CourseVsProgramTrend points={courseRatingTrend} scopedTerm={effectiveScopedTerms} height={CHART_CARD_PLOT_PX} />
                  <ChartDataTable
                    caption={`Rating trend for ${courseCode}`}
                    headers={['Term', 'Course average', 'Program average']}
                    rows={courseRatingTrend.map(p => [
                      p.term,
                      p.courseAvg != null ? p.courseAvg.toFixed(2) : '—',
                      p.programAvg != null ? p.programAvg.toFixed(2) : '—',
                    ])}
                  />
                  <ChartCardActions
                    title="Rating trend"
                    description="Every point labelled with its exact value."
                    detail={<CourseVsProgramTrend points={courseRatingTrend} scopedTerm={effectiveScopedTerms} detail />}
                    table={{
                      headers: ['Term', 'Course average', 'Program average'],
                      rows: courseRatingTrend.map(p => [
                        p.term,
                        p.courseAvg != null ? p.courseAvg.toFixed(2) : '—',
                        p.programAvg != null ? p.programAvg.toFixed(2) : '—',
                      ]),
                    }}
                  />
                </>
              )}
            </ChartFigure>
          </ChartCard>
        )}

        {courseResponseTrendSeries.length >= 2 && (
          <ChartCard
            hideAskLeo={hideAskLeo}
            variant="normal"
            title="Response rate trend"
            description={`Against the ${RESPONSE_TARGET}% target, last ${courseResponseTrendSeries.length} terms`}
          >
            <ChartFigure
              label={`Response rate trend for ${courseCode}`}
              summary={`Response rate per term for ${courseCode} against an ${RESPONSE_TARGET}% target.`}
              dataLength={courseResponseTrendSeries.length}
            >
              {() => (
                <>
                  {/* `height={CHART_CARD_PLOT_PX}` — same fix as `CourseVsProgramTrend` above:
                      this component's own default (168) is shorter than Overview's
                      `TermResponseTrend` (220), same card in a different tab rendering at a
                      different size. */}
                  <ProgramResponseTrend series={courseResponseTrendSeries} target={RESPONSE_TARGET} scopedTerm={effectiveScopedTerms} height={CHART_CARD_PLOT_PX} />
                  <ChartDataTable
                    caption={`Response rate trend for ${courseCode}`}
                    headers={['Term', 'Response rate']}
                    rows={courseResponseTrendSeries.map(s => [s.term, s.responseRate != null ? `${s.responseRate}%` : '—'])}
                  />
                  <ChartCardActions
                    title="Response rate trend"
                    description={`Against the ${RESPONSE_TARGET}% target, last ${courseResponseTrendSeries.length} terms`}
                    detail={
                      <ProgramResponseTrend
                        series={courseResponseTrendSeries}
                        target={RESPONSE_TARGET}
                        scopedTerm={effectiveScopedTerms}
                        height={420}
                      />
                    }
                    table={{
                      headers: ['Term', 'Response rate'],
                      rows: courseResponseTrendSeries.map(s => [s.term, s.responseRate != null ? `${s.responseRate}%` : '—']),
                    }}
                  />
                </>
              )}
            </ChartFigure>
          </ChartCard>
        )}
        </div>
      </div>

      {/* Faculty heat map + Question trend — SIDE BY SIDE, the same two-column pairing Overview
          uses for Course Leaderboard + Faculty Leaderboard: both are ranked breakdowns of "what
          is dragging this course's score," one by instructor and one by question. */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        {courseHeat.faculty.length > 0 && (
          <ChartCard
            hideAskLeo={hideAskLeo}
            variant="normal"
            title={`Faculty heat map · ${courseCode}`}
            description={`Last ${courseHeat.terms.length} terms · red below the ${RATING_THRESHOLD.toFixed(1)} threshold, green at or above`}
          >
            <div className="flex flex-wrap items-end gap-3 pb-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="course-heatmap-role">Role</label>
                <Select
                  value={heatmapRole ?? ALL_ROLES}
                  onValueChange={(v) => setHeatmapRole(v === ALL_ROLES ? undefined : (v as FacultyEvalRoleId))}
                  disabled={heatmapRoleOptions.length === 0}
                >
                  <SelectTrigger id="course-heatmap-role" className="h-8 w-44 text-sm" aria-label="Filter the heat map by role"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_ROLES}>All roles</SelectItem>
                    {heatmapRoleOptions.map(r => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <ChartFigure
              label={`Faculty heat map for ${courseCode}`}
              summary={`Teaching score by instructor and term for ${courseCode}, ${heatFaculty.length} instructor${heatFaculty.length === 1 ? '' : 's'}.`}
              dataLength={heatFaculty.length}
            >
              {() => (
                <>
                  <CourseFacultyHeatmap
                    rows={heatFaculty}
                    terms={courseHeat.terms}
                    cells={heatCells}
                    programAvgByTerm={programFacultyAvgByTerm}
                    threshold={RATING_THRESHOLD}
                    highlightedCols={highlightedOfferingShorts}
                  />
                  <ChartDataTable
                    caption={`Faculty heat map for ${courseCode}`}
                    headers={['Faculty', ...courseHeat.terms.map(shortTerm)]}
                    rows={heatFaculty.map(name => [
                      name,
                      ...courseHeat.terms.map(t => {
                        const cell = courseHeat.cells.find(c => c.facultyName === name && c.term === t)
                        return cell ? cell.score.toFixed(2) : '—'
                      }),
                    ])}
                  />
                  <ChartCardActions
                    title={`Faculty heat map · ${courseCode}`}
                    description={`Last ${courseHeat.terms.length} terms · red below the ${RATING_THRESHOLD.toFixed(1)} threshold, green at or above`}
                    detail={
                      <CourseFacultyHeatmap
                        rows={heatFaculty}
                        terms={courseHeat.terms}
                        cells={heatCells}
                        programAvgByTerm={programFacultyAvgByTerm}
                        threshold={RATING_THRESHOLD}
                        highlightedCols={highlightedOfferingShorts}
                        height={420}
                      />
                    }
                    table={{
                      headers: ['Faculty', ...courseHeat.terms.map(shortTerm)],
                      rows: heatFaculty.map(name => [
                        name,
                        ...courseHeat.terms.map(t => {
                          const cell = courseHeat.cells.find(c => c.facultyName === name && c.term === t)
                          return cell ? cell.score.toFixed(2) : '—'
                        }),
                      ]),
                    }}
                  />
                </>
              )}
            </ChartFigure>
          </ChartCard>
        )}

        {questionTrendRows.length > 0 && (
          <ChartCard
            hideAskLeo={hideAskLeo}
            variant="normal"
            title={`Question trend · ${courseCode}`}
            description={`Course-content questions, last ${Math.max(...questionTrendRows.map(r => r.points.length))} terms — dashed line marks the ${EVAL_BENCHMARKS.targetCourseScore.toFixed(1)} target`}
          >
            {/* Was a per-question sparkline list — Romit, 2026-09-15: "not able to make out the
                trend from this visualization... try a different graph, maybe a line graph."
                One shared term axis puts every question's trajectory on common ground, which N
                isolated 6-point sparklines never could. See `CourseQuestionTrendLines`'s own
                doc comment for the full reasoning.

                `ChartFigure` wrap + inline `ChartDataTable` added after review (state-review,
                2026-09-15) — every OTHER chart in this file has both; this one shipped without
                either, which meant the Plot SVG was `aria-hidden` (`ChartFigure` is what marks
                THAT accessible, via `role="application"` + a real label + arrow-key nav) with
                no text substitute standing in for it, and the default (unexpanded) card had no
                text equivalent for the actual TREND — only the `<ul>` legend's latest-value
                column, one number per question, not the shape `ChartCardActions`' own table
                lived behind an expand click. Same shape as the heat map card above. */}
            <ChartFigure
              label={`Question trend for ${courseCode}`}
              summary={`Course-content question averages by term for ${courseCode}, last ${Math.max(...questionTrendRows.map(r => r.points.length))} terms, ranked weakest first.`}
              dataLength={questionTrendRows.length}
            >
              {() => (
                <>
                  <CourseQuestionTrendLines rows={questionTrendRows} threshold={EVAL_BENCHMARKS.targetCourseScore} />
                  <ChartDataTable
                    caption={`Question trend for ${courseCode}`}
                    headers={['Question', 'Latest', 'Change vs prior term', 'Target']}
                    rows={questionTrendRows.map(row => [
                      row.text,
                      row.latest.toFixed(1),
                      row.delta != null ? `${row.delta >= 0 ? '+' : ''}${row.delta.toFixed(1)}` : '—',
                      row.threshold.toFixed(1),
                    ])}
                  />
                  <ChartCardActions
                    title={`Question trend · ${courseCode}`}
                    description={`Course-content questions, last ${Math.max(...questionTrendRows.map(r => r.points.length))} terms — dashed line marks the ${EVAL_BENCHMARKS.targetCourseScore.toFixed(1)} target`}
                    detail={<CourseQuestionTrendLines rows={questionTrendRows} threshold={EVAL_BENCHMARKS.targetCourseScore} height={420} />}
                    table={{
                      headers: ['Question', 'Latest', 'Change vs prior term', 'Target'],
                      rows: questionTrendRows.map(row => [
                        row.text,
                        row.latest.toFixed(1),
                        row.delta != null ? `${row.delta >= 0 ? '+' : ''}${row.delta.toFixed(1)}` : '—',
                        row.threshold.toFixed(1),
                      ]),
                    }}
                  />
                </>
              )}
            </ChartFigure>
          </ChartCard>
        )}
      </div>

      {/* Offerings list (PRD 2026-09-14, spec §2.2's fifth Course Analytics section — "I don't
          see this. Refer to the requirement" (Romit, 2026-09-15): confirmed absent from this
          tab entirely, not just hidden or empty, by reading this component's full return block
          before this change. "Shows the offerings from last 6 terms of that course. Offerings
          from the same term are not aggregated. On click of any row, open course offering
          analytics in a new browser tab. Offerings from the selected term/AY should be
          highlighted." Same canonical rows + new-tab behavior as `CourseOfferingList` (the
          Course tab's own landing list) — see `courseOfferingRows`'s doc comment. */}
      {/* UNGATED (state-review, 2026-09-15) — this used to be `{courseOfferingRows.length > 0 &&
          (...)}`, which made the `emptyState` below dead code: zero rows meant zero `data`,
          which is exactly the input the whole block was hidden behind, so the empty state could
          never paint. Worse, `courseOfferingRows` reads from `courseOfferingListRows()` →
          `offeringPoints()`, a DIFFERENT source than the panel's own top-level guard
          (`allCourseOfferings`, from `MOCK_FACULTY_OFFERINGS` directly) — a course can clear
          that guard and still land here with zero rows, silently dropping the PRD's fifth
          Course Analytics section with no indication it exists. Same shape as the sibling
          `ByFacultyPanel` offerings table above (`selectable`/`searchable` false, ungated,
          `emptyState` doing the empty-state work), not a special case. */}
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Offerings</h2>
        {courseOfferingRows.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Last {new Set(courseOfferingRows.map(r => r.term)).size} terms.
            {effectiveScopedTerms.length > 0 && ' Selected term/AY highlighted.'}
          </p>
        )}
        {/* `@exxatdesignux/ui`'s DataTablePaginated — the DS canonical source (Romit,
            2026-09-15), matching `CourseOfferingList`'s own wiring (`showQueryControls={false}
            edgeInset={false}`, no wrapper div — `edgeInset` handles the full-bleed layout the
            vendored table needed a manual `-mx-4 lg:-mx-6` div for). */}
        <DsDataTablePaginated<CourseOfferingListRow>
          data={courseOfferingRows}
          columns={courseOfferingColumns}
          getRowId={(row) => `${row.courseCode}-${row.term}-${row.facultyId}`}
          selectable={false}
          searchable={false}
          showQueryControls={false}
          edgeInset={false}
          // No `defaultSort` — `courseOfferingRows` is already newest-term-first via
          // `courseOfferingListRows()`'s own `compareTerms` sort. A `term`-key `defaultSort`
          // would re-sort it LEXICOGRAPHICALLY ("Sp 2025" > "Fa 2025" as strings), which
          // visibly misordered "Fall 2025" after "Spring 2024" when this was tried live —
          // the same trap any string term/date column hits without a real date type behind
          // it. The column stays `sortable` for a reader who wants to sort some other way;
          // it just isn't asked to re-derive the one order the data already has right.
          conditionalRules={offeringHighlightRules}
          pagination={{ pageSize: 10 }}
          onRowClick={(row) => {
            if (!row.surveyId) return
            window.open(`/results/${encodeURIComponent(row.surveyId)}?from=analytics`, '_blank', 'noopener,noreferrer')
          }}
          emptyState={
            <div className="flex flex-col items-center gap-2 py-6">
              <i className="fa-light fa-calendar-days text-muted-foreground" aria-hidden="true" style={{ fontSize: 24 }} />
              <p className="text-sm font-medium">No offerings for this course</p>
              <p className="text-xs text-muted-foreground">Offerings appear here once this course has been evaluated in a term.</p>
            </div>
          }
        />
      </div>

      {/* AI insight — restored 2026-09-14 (Romit: "ai insights card is missing"). Themes are
          the AI lane, NOT a chart — `ai-vs-pulled-lane.md` puts "themes, insights, action
          plans, summaries (LLM-extracted from open-text)" on the AI side and "trends,
          averages, distributions" on the pulled side, so it sits after the quantitative
          sections above rather than interleaved with them. Reuses the existing AiInsightCard
          composition, scoped to the course rather than the term.
          ⚠️ Monil treats themes as conditional — "if we are capturing the theme" — so this
          renders only where comments exist and cites its own source count. */}
      {courseSurveys.length > 0 && (
        <TermThemesInsight surveys={courseSurveys} scopeLabel={courseCode} />
      )}
    </>
  )
}
