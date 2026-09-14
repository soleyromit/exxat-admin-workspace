'use client'

/**
 * Analytics → Overview — term-scoped landing (Romit, 2026-09-14 PRD; layout + multi-select
 * correction 2026-09-14 later the same day).
 *
 * Supersedes the whole-program Overview this file held since 2026-07 (Monil's 2026-07-13
 * model had Overview aggregate across ALL terms). The new brief is explicit that Overview's
 * job is RELATIVE COMPARISON within the chosen scope — "which are the better courses, which
 * are the worst courses" only holds still if every course being compared sat the same term(s).
 * The old whole-program story (trend across every term, drift arrows, response funnel,
 * course×term heatmap) is real and still needed — it now belongs to By Term/By Course/By
 * Faculty, which already answer the longitudinal question this tab used to.
 *
 * Structure, in order: KPIs → course-vs-faculty quadrant → rating trend + response-rate trend
 * (term-only, no AY/Term toggle, no program average) → Course Leaderboard → Faculty Leaderboard.
 * The quadrant moved directly under the KPIs (Romit, 2026-09-14) — the PRD's original order had
 * it after the trend charts. Filters are exactly what the PRD allows: the AY/Term pair, now rendered
 * by the page shell OUTSIDE this panel and the tab bar entirely (confirmed against the
 * reference's own DOM, 2026-09-14: its filter row is a SIBLING of the tab bar under one shared
 * header, not nested inside a tab panel) — this component only receives the resolved `terms`.
 * Term itself is a MULTI-select (Romit, 2026-09-14) — every stat below pools across whichever
 * term(s) are selected, the same way "all terms" already pools in the rest of this file.
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@exxatdesignux/ui'
import {
  ChartCard,
  ChartFigure,
  ChartDataTable,
  type ChartLeoInsight,
} from '@/components/charts-core'
import {
  CourseFacultyQuadrant,
  TermRatingTrend,
  TermResponseTrend,
  RatingDistributionHistogram,
} from '@/components/pce/analytics-plots'
import { DataTablePaginated, PaginationBar } from '@/components/data-table/pagination'
import type { ColumnDef } from '@/components/data-table/types'
import { ToggleGroup, ToggleGroupItem } from '@exxatdesignux/ui'
import {
  termsKpis,
  termOfferingsEvaluated,
  termsYoyDelta,
  recentTermsWindow,
  courseStats,
  facultyEvalRoleOptions,
  offeringPoints,
  gapPoints,
  medianOf,
  dualMean,
  RESPONSE_TARGET,
  type DualMean,
  type FacultyEvalRoleId,
} from '@/lib/pce-analytics'
import { CHART_CARD_PLOT_PX } from '@/components/pce/chart-card-actions'

const fmt2 = (v: number) => v.toFixed(2)

/** "▲ 0.21 vs. previous year" style KPI trend, from a year-over-year delta rather than the
 *  window's last-vs-prior-term step. */
function yoyTrend(delta: number | null): { value: string; trend: 'up' | 'down' | 'neutral' } {
  if (delta == null) return { value: '', trend: 'neutral' }
  return {
    value: `${delta >= 0 ? '+' : ''}${fmt2(delta)}`,
    trend: delta > 0 ? 'up' : delta < 0 ? 'down' : 'neutral',
  }
}

interface CourseLeaderboardRow extends Record<string, unknown> {
  courseCode: string
  courseName: string
  offerings: number
  courseScore: number | null
  facultyScore: number | null
  responseRate: number
  belowThreshold: boolean
}

/** One row per (course, faculty) pair — the grain the Faculty entity toggle groups by course. */
interface FacultyByCourseRow extends Record<string, unknown> {
  courseCode: string
  courseName: string
  facultyId: string
  name: string
  rating: number | null
  responseRate: number
  offerings: number
  belowThreshold: boolean
}

/** Below-threshold rating cell — a pale tinted chip, not full-saturation text. Deliberate,
 *  SCOPED exception to VIZ-004/Aarti's amber house rule (every other score visual in this
 *  codebase stays amber); Romit's 2026-09-14 PRD asks for red by name, twice, for these two
 *  leaderboards specifically — same class of explicit override already made once this session
 *  for `DASHBOARD_TREND_CONFIG.below`. Background tint matches the reference
 *  (https://pce-three.vercel.app/analytics-2, confirmed via its rendered cell backgrounds,
 *  2026-09-14) via this DS's own `--conditional-rule-red` token rather than a literal hex.
 *  Text stays `--foreground`, NOT `--destructive` — the first pass paired the red text with
 *  the red tint (matching intent, not the reference's own pairing) and axe caught it at
 *  3.66:1 against the pale background, short of AA's 4.5:1; `--foreground` on that same tint
 *  is comfortably compliant and is this DS's own established pattern for `conditional-rule-*`
 *  cell tints (`table-properties/types.ts`'s `ConditionalRule`) — the tint alone carries the
 *  flag, the text stays legible. */
function RatingCell({ value, below }: { value: number | null; below: boolean }) {
  if (value == null) return <span className="text-muted-foreground">—</span>
  if (!below) return <span className="font-semibold tabular-nums">{fmt2(value)}</span>
  return (
    <span
      className="inline-block rounded font-semibold tabular-nums text-foreground"
      style={{ background: 'var(--conditional-rule-red)', padding: '2px 8px' }}
    >
      {fmt2(value)}
    </span>
  )
}

export function AnalyticsOverviewPanel({
  terms,
  onOpenFaculty,
}: {
  /** One or more selected terms — Term is a multi-select; every stat below pools across all
   *  of them, same rule "all terms" (omitted term) already follows elsewhere in this file. */
  terms: string[]
  /** Faculty rows open the SAME tab's By Faculty scroll target (existing pattern) — course
   *  rows open a new tab instead, per PRD, so no callback is needed for those. */
  onOpenFaculty: (facultyId: string) => void
}) {
  /** "Fall 2025" for one term, "3 terms" for several — every card description below reads off
   *  this rather than repeating the full list. */
  const termsLabel = terms.length === 1 ? terms[0]! : `${terms.length} terms`
  const termsListLabel = terms.length === 1 ? terms[0]! : terms.join(', ')

  const kpis = useMemo(() => termsKpis(terms), [terms])
  const offeringsEval = useMemo(() => termOfferingsEvaluated(terms), [terms])
  const window6 = useMemo(() => recentTermsWindow(terms, 6), [terms])
  const gaps = useMemo(() => gapPoints(terms), [terms])

  /* "▲ 0.21 vs. previous year" — the reference's KPI delta. Year-over-year (same season, one
     AY back per selected term), so a Fall term compares to the Fall before it rather than to
     the Spring right next to it in the trend window. */
  const yoy = useMemo(() => termsYoyDelta(terms), [terms])
  const courseDelta = yoyTrend(yoy.courseAvg)
  const facultyDelta = yoyTrend(yoy.facultyAvg)
  const responseDelta = yoyTrend(yoy.responseRate)
  const offeringsDelta = yoyTrend(yoy.offeringsPct)

  /* Quadrant split at the plotted courses' OWN mean, scoped to this selection — same rule the
     whole-program version used, so a split line that matches its own dots isn't lost in the
     term-scoping. */
  const courseMean = useMemo(
    () => (gaps.length ? gaps.reduce((s, g) => s + g.courseAvg, 0) / gaps.length : 0),
    [gaps],
  )
  const facultyMean = useMemo(
    () => (gaps.length ? gaps.reduce((s, g) => s + g.facultyAvg, 0) / gaps.length : 0),
    [gaps],
  )
  /* ── Course Leaderboard — course-only (PRD drops the Course/Faculty toggle), no Overall
        column, + the two question-extreme columns the PRD adds. Sorted lowest-first by
        default (Monil's "order by the lowest one" decision), every column sortable so the
        reader can flip to descending for the "five best" half of the same requirement. ── */
  const scoredCourses = useMemo(
    () =>
      courseStats(terms).filter(
        (c): c is typeof c & { score: { state: 'value'; value: DualMean } } => c.score.state === 'value',
      ),
    [terms],
  )
  const courseMedian = useMemo(
    () => medianOf(scoredCourses.map((c) => c.score.value.weighted)),
    [scoredCourses],
  )
  const courseFacultyMedian = useMemo(
    () =>
      medianOf(
        scoredCourses
          .filter((c): c is typeof c & { facultyScore: { state: 'value'; value: DualMean } } => c.facultyScore.state === 'value')
          .map((c) => c.facultyScore.value.weighted),
      ),
    [scoredCourses],
  )
  const courseRows: CourseLeaderboardRow[] = useMemo(
    () =>
      scoredCourses.map((c) => {
        const facultyVal = c.facultyScore.state === 'value' ? c.facultyScore.value.weighted : null
        const below = c.score.value.weighted < courseMedian || (facultyVal != null && facultyVal < courseFacultyMedian)
        const offerings = offeringPoints().filter((o) => o.courseCode === c.courseCode && terms.includes(o.term)).length
        return {
          courseCode: c.courseCode,
          courseName: c.courseName,
          offerings,
          courseScore: c.score.value.weighted,
          facultyScore: facultyVal,
          responseRate: c.responseRate,
          belowThreshold: below,
        }
      }),
    [scoredCourses, courseMedian, courseFacultyMedian, terms],
  )

  const courseColumns: ColumnDef<CourseLeaderboardRow>[] = useMemo(
    () => [
      {
        key: 'courseCode',
        label: 'Course',
        sortable: true,
        // Every sortable column needs an EXPLICIT sortKey — DataTable's header only renders
        // the sort button and aria-sort when `col.sortKey` is truthy (`col.sortable` alone
        // is not enough); the sort comparator itself falls back to `col.key` when absent, so
        // the table quietly sorted correctly while the header never showed it was sortable.
        sortKey: 'courseCode',
        width: 220,
        cell: (row) => (
          <span className="block truncate">
            <span className="font-medium text-foreground">{row.courseCode}</span>
            <span className="block truncate text-xs text-muted-foreground">{row.courseName}</span>
          </span>
        ),
      },
      {
        key: 'offerings',
        label: '# of Offerings',
        sortable: true,
        sortKey: 'offerings',
        width: 120,
        cell: (row) => <span className="tabular-nums">{row.offerings}</span>,
      },
      {
        key: 'courseScore',
        label: 'Course rating',
        sortable: true,
        sortKey: 'courseScore',
        width: 120,
        cell: (row) => <RatingCell value={row.courseScore} below={row.belowThreshold} />,
      },
      {
        key: 'facultyScore',
        label: 'Faculty rating',
        sortable: true,
        sortKey: 'facultyScore',
        width: 120,
        cell: (row) => <RatingCell value={row.facultyScore} below={row.belowThreshold} />,
      },
      {
        key: 'responseRate',
        label: 'Response rate',
        sortable: true,
        sortKey: 'responseRate',
        width: 120,
        cell: (row) => <span className="tabular-nums">{row.responseRate}%</span>,
      },
    ],
    [],
  )

  const courseLeaderboardLeo: ChartLeoInsight | null = useMemo(() => {
    if (!courseRows.length) return null
    const worst = [...courseRows].sort((a, b) => (a.courseScore ?? 99) - (b.courseScore ?? 99))[0]!
    const below = courseRows.filter((r) => r.belowThreshold)
    return {
      headline: `${worst.courseCode} rates lowest at ${worst.courseScore != null ? fmt2(worst.courseScore) : '—'}`,
      explanation: `${below.length} of ${courseRows.length} courses fall below the ${fmt2(courseMedian)} course-rating median or the ${fmt2(courseFacultyMedian)} faculty-rating median for ${termsLabel}. Sort by either rating column to see the full spread.`,
      kind: below.length > 0 ? 'anomaly' : 'trend',
      delta: { value: worst.courseScore != null ? fmt2(worst.courseScore) : '—', label: worst.courseCode },
      bullets: [
        `${worst.courseCode} · ${worst.courseName}: ${worst.courseScore != null ? fmt2(worst.courseScore) : '—'} course, ${worst.facultyScore != null ? fmt2(worst.facultyScore) : '—'} faculty.`,
        `${below.length} of ${courseRows.length} courses below threshold.`,
      ],
    }
  }, [courseRows, courseMedian, courseFacultyMedian, termsLabel])

  /* ── Faculty, grouped by course (Romit, 2026-09-14: "in the faculty toggle, i need to see
        courses and underneath i will see the list of faculties" — a single leaderboard card
        with a Course/Faculty entity toggle, matching the reference's own layout, rather than
        the two side-by-side cards this session had shipped. Faculty mode needs one row per
        (course, faculty) pair, not one row per faculty pooled across every course — `facultyStats`
        gives the latter, so this reads `offeringPoints()` directly at its finest grain (faculty ×
        course × term) and aggregates per course instead. Role stays a card-local toggle (the
        reference's own "All Roles/Instructor/Coordinator" split), now shown only in Faculty
        mode since it has no meaning against the flat Course table. ── */
  const roleOptions = useMemo(() => facultyEvalRoleOptions(), [])
  const [roleFilter, setRoleFilter] = useState<FacultyEvalRoleId | undefined>(undefined)
  const [leaderboardEntity, setLeaderboardEntity] = useState<'course' | 'faculty'>('course')
  const facultyByCourseRows: FacultyByCourseRow[] = useMemo(() => {
    const offs = offeringPoints().filter((o) => terms.includes(o.term) && (!roleFilter || o.evalRole === roleFilter))
    const byKey = new Map<string, typeof offs>()
    offs.forEach((o) => {
      const k = `${o.courseCode}::${o.facultyId}`
      const list = byKey.get(k) ?? []
      list.push(o)
      byKey.set(k, list)
    })
    const unranked = [...byKey.values()].map((rows) => {
      const enrolled = rows.reduce((s, r) => s + r.enrolled, 0)
      const responded = rows.reduce((s, r) => s + r.responded, 0)
      return {
        courseCode: rows[0]!.courseCode,
        courseName: rows[0]!.courseName,
        facultyId: rows[0]!.facultyId,
        name: rows[0]!.facultyName,
        rating: dualMean(rows.map((r) => r.avgRating), rows.map((r) => r.enrolled)).weighted,
        responseRate: enrolled > 0 ? Math.round((responded / enrolled) * 100) : 0,
        offerings: rows.length,
        belowThreshold: false,
      }
    })
    const median = medianOf(unranked.map((r) => r.rating).filter((v): v is number => v != null))
    return unranked.map((r) => ({ ...r, belowThreshold: r.rating != null && r.rating < median }))
  }, [terms, roleFilter])

  /* Faculty mode (2026-09-14, second correction — Romit: "don't show grouped based rows in a
     table. make it a course row, and below that show the list of faculties.") — DataTable's
     own grouping (round 1 of this feature) rendered the band-inside-a-table look he explicitly
     rejected. This is a real nested list instead: one course block per course (its own row of
     stats), the faculty who taught it listed underneath, no `<table>` anywhere. Paginated by
     COURSE COUNT, not row count — pagination-by-row-count was what caused a course's faculty to
     split across pages in the DataTable version; paginating the outer list of course blocks
     means a page always shows whole blocks. */
  const facultyByCourse = useMemo(() => {
    const byCourse = new Map<string, FacultyByCourseRow[]>()
    facultyByCourseRows.forEach((r) => {
      const list = byCourse.get(r.courseCode) ?? []
      list.push(r)
      byCourse.set(r.courseCode, list)
    })
    byCourse.forEach((list) => list.sort((a, b) => (a.rating ?? 99) - (b.rating ?? 99)))
    return byCourse
  }, [facultyByCourseRows])

  /* Only courses that actually have a faculty row in this scope/role-filter combination, in
     the same worst-first order the Course table itself defaults to. */
  const coursesWithFaculty = useMemo(
    () => [...courseRows].sort((a, b) => (a.courseScore ?? 99) - (b.courseScore ?? 99)).filter((c) => facultyByCourse.has(c.courseCode)),
    [courseRows, facultyByCourse],
  )

  const [facultyPage, setFacultyPage] = useState(1)
  const [facultyPageSize, setFacultyPageSize] = useState(5)
  const facultyTotalPages = Math.max(1, Math.ceil(coursesWithFaculty.length / facultyPageSize))
  const facultySafePage = Math.min(facultyPage, facultyTotalPages)
  const pagedCoursesWithFaculty = coursesWithFaculty.slice(
    (facultySafePage - 1) * facultyPageSize,
    facultySafePage * facultyPageSize,
  )

  const facultyMedianRating = useMemo(
    () => medianOf(facultyByCourseRows.map((r) => r.rating).filter((v): v is number => v != null)),
    [facultyByCourseRows],
  )

  const facultyLeaderboardLeo: ChartLeoInsight | null = useMemo(() => {
    if (!facultyByCourseRows.length) return null
    const worst = [...facultyByCourseRows].sort((a, b) => (a.rating ?? 99) - (b.rating ?? 99))[0]!
    const below = facultyByCourseRows.filter((r) => r.belowThreshold)
    return {
      headline: `${worst.name} rates lowest at ${worst.rating != null ? fmt2(worst.rating) : '—'} (${worst.courseCode})`,
      explanation: `${below.length} of ${facultyByCourseRows.length} course-faculty pairings fall below the ${fmt2(facultyMedianRating)} rating median for ${termsLabel}. Sort the Rating column to move between the best and lowest five.`,
      kind: below.length > 0 ? 'anomaly' : 'trend',
      delta: { value: worst.rating != null ? fmt2(worst.rating) : '—', label: worst.name },
      bullets: [
        `${worst.name} · ${worst.courseCode}: ${worst.rating != null ? fmt2(worst.rating) : '—'} across ${worst.offerings} offering${worst.offerings === 1 ? '' : 's'}.`,
        `${below.length} of ${facultyByCourseRows.length} course-faculty pairings below the median.`,
      ],
    }
  }, [facultyByCourseRows, facultyMedianRating, termsLabel])

  const ratingTrendLeo: ChartLeoInsight | null = useMemo(() => {
    const scored = window6.filter((s) => s.courseAvg != null)
    if (scored.length < 2) return null
    const last = scored[scored.length - 1]!
    const prev = scored[scored.length - 2]!
    const d = (last.courseAvg as number) - (prev.courseAvg as number)
    return {
      headline: d < 0 ? `Course rating fell ${fmt2(Math.abs(d))} into ${last.term}` : `Course rating rose ${fmt2(d)} into ${last.term}`,
      explanation: `Course and faculty ratings, last ${window6.length} terms, ${termsListLabel} highlighted. No program average line — students rate the course and the person separately, and a third blended line would answer neither question.`,
      kind: d < 0 ? 'dip' : 'trend',
      delta: { value: `${d >= 0 ? '+' : ''}${fmt2(d)}`, label: `vs ${prev.term}` },
      bullets: [
        `${termsLabel}: course ${kpis.courseAvg != null ? fmt2(kpis.courseAvg) : '—'} · faculty ${kpis.facultyAvg != null ? fmt2(kpis.facultyAvg) : '—'}.`,
      ],
      anchor: { xValue: last.short, yDataKeys: ['courseAvg'] },
    }
  }, [window6, termsLabel, termsListLabel, kpis])

  const responseTrendLeo: ChartLeoInsight | null = useMemo(() => {
    if (kpis.responseRate == null) return null
    const belowTarget = window6.filter((s) => s.responseRate != null && s.responseRate < RESPONSE_TARGET)
    return {
      headline:
        kpis.responseRate < RESPONSE_TARGET
          ? `${termsLabel}'s response rate sits ${RESPONSE_TARGET - kpis.responseRate}pp under the ${RESPONSE_TARGET}% target`
          : `${termsLabel}'s response rate clears the ${RESPONSE_TARGET}% target`,
      explanation: `${belowTarget.length} of ${window6.length} terms shown missed the target. A low rate here should read alongside the ratings above it — a rating on a thin sample is less certain than the same rating on a full one.`,
      kind: kpis.responseRate < RESPONSE_TARGET ? 'anomaly' : 'trend',
      delta: { value: `${kpis.responseRate}%`, label: termsLabel },
      bullets: [`${kpis.responded.toLocaleString()} of ${kpis.enrolled.toLocaleString()} students responded.`],
      anchor: { xValue: window6.find((s) => terms.includes(s.term))?.short ?? '', yDataKeys: ['responseRate'] },
    }
  }, [window6, termsLabel, terms, kpis])

  const gapLeo: ChartLeoInsight | null = useMemo(() => {
    if (gaps.length < 3) return null
    const widest = [...gaps].sort((a, b) => b.facultyAvg - b.courseAvg - (a.facultyAvg - a.courseAvg))[0]!
    const gap = widest.facultyAvg - widest.courseAvg
    const bothLow = gaps.filter((g) => g.courseAvg < courseMean && g.facultyAvg < facultyMean)
    return {
      headline: `${widest.courseCode} scores ${fmt2(Math.abs(gap))} ${gap >= 0 ? 'higher on teaching than on content' : 'higher on content than on teaching'}`,
      explanation: `Course content and faculty teaching are two different things to fix. ${bothLow.length} course${bothLow.length === 1 ? '' : 's'} sit in the both-need-attention quadrant.`,
      kind: 'anomaly',
      delta: { value: `${gap >= 0 ? '+' : ''}${fmt2(gap)}`, label: 'faculty vs course' },
      bullets: [
        `${widest.courseCode} · ${widest.courseName}: course ${fmt2(widest.courseAvg)} vs faculty ${fmt2(widest.facultyAvg)}.`,
        `${bothLow.length} of ${gaps.length} courses below both quadrant lines.`,
      ],
      anchor: { yValue: widest.facultyAvg },
    }
  }, [gaps, courseMean, facultyMean])

  return (
    <div className="flex flex-col gap-4">
      <h2 className="sr-only">Term overview — {termsListLabel}</h2>

      {/* ── KPIs — Course rating, Faculty rating, Response rate, Offerings evaluated. No
             sparkline: the reference's tiles are a number and a year-over-year delta line,
             nothing else, and matching it here means dropping VIZ-010's usual "no bare
             number" spark in favour of that leaner two-line shape. `trendPolarity:
             'higher_is_better'` (not this file's usual 'informational') so the arrow actually
             colors green/red — the reference's own delta line is colored, and Overview's
             below-threshold red is already a confirmed, scoped exception to the amber house
             rule; the trend arrow follows the same exception rather than reading informational
             next to a leaderboard that reads alarmed. ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ChartCard variant="kpi-chart" title="Course rating" description={termsLabel} miniMetrics={[{ label: courseDelta.value ? `${courseDelta.value} vs. previous year` : 'No prior-year comparison yet', value: kpis.courseAvg != null ? fmt2(kpis.courseAvg) : '—', trend: courseDelta.trend, trendPolarity: 'higher_is_better' }]}>{null}</ChartCard>

        <ChartCard variant="kpi-chart" title="Faculty rating" description={termsLabel} miniMetrics={[{ label: facultyDelta.value ? `${facultyDelta.value} vs. previous year` : 'No prior-year comparison yet', value: kpis.facultyAvg != null ? fmt2(kpis.facultyAvg) : '—', trend: facultyDelta.trend, trendPolarity: 'higher_is_better' }]}>{null}</ChartCard>

        <ChartCard variant="kpi-chart" title="Response rate" description={termsLabel} miniMetrics={[{ label: responseDelta.value ? `${responseDelta.value}pp vs. previous year · ${kpis.responded.toLocaleString()} of ${kpis.enrolled.toLocaleString()} responded` : `${kpis.responded.toLocaleString()} of ${kpis.enrolled.toLocaleString()} responded`, value: kpis.responseRate != null ? `${kpis.responseRate}%` : '—', trend: responseDelta.trend, trendPolarity: 'higher_is_better' }]}>{null}</ChartCard>

        <ChartCard variant="kpi-chart" title="Offerings evaluated" description={termsLabel} miniMetrics={[{ label: offeringsDelta.value ? `${offeringsDelta.value}pp coverage vs. previous year` : `${offeringsEval.total > 0 ? Math.round((offeringsEval.evaluated / offeringsEval.total) * 100) : 0}% coverage of ${offeringsEval.total} course offerings`, value: `${offeringsEval.evaluated}`, trend: offeringsDelta.trend, trendPolarity: 'higher_is_better' }]}>{null}</ChartCard>
      </div>

      {/* ── Course vs faculty — the innovative piece, positioned right after the KPIs (Romit,
             2026-09-14: it belongs above the trend charts, not below them). Quadrant labels
             stay the subtle, non-judgmental wording this chart already used ("Both need
             attention" / "Course strong · faculty gap", never "Teaching support recommended"
             — the reference's phrasing the PRD explicitly asks to soften). ── */}
      <ChartCard variant="normal" title="Course vs faculty" description={`One dot per course, split at this selection's own means`} leoInsight={gapLeo}>
        <ChartFigure
          label="Course rating versus faculty rating"
          summary="Scatter plot. Each dot is one course, sized by enrolment, split into quadrants at the selection's course and faculty means."
          dataLength={gaps.length}
          leoInsight={gapLeo}
        >
          {() => (
            <>
              {/* Palette toggle retired (Romit, 2026-09-14) — `domain` kept as the fixed
                  treatment, no longer a reader-facing choice. */}
              <CourseFacultyQuadrant points={gaps} courseMean={courseMean} facultyMean={facultyMean} height={CHART_CARD_PLOT_PX} palette="domain" />
              <ChartDataTable
                caption="Course rating versus faculty rating"
                headers={['Course', 'Course rating', 'Faculty rating', 'Enrolled']}
                rows={gaps.map((g) => [`${g.courseCode} · ${g.courseName}`, fmt2(g.courseAvg), fmt2(g.facultyAvg), g.enrolled])}
              />
            </>
          )}
        </ChartFigure>
      </ChartCard>

      {/* ── Rating trend + Response-rate trend — term only, no AY/Term toggle (the PRD drops
             it: term is already the anchor and the offering happens at term grain), no
             program-average line, last 6 terms with every selected term highlighted. ── */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <ChartCard variant="normal" title="Rating trend" description={`Course and faculty rating, last ${window6.length} terms`} leoInsight={ratingTrendLeo}>
          <ChartFigure
            label="Rating trend"
            summary={`Course-content and faculty rating by term, last ${window6.length} terms, with ${termsListLabel} highlighted. No program-average line.`}
            dataLength={window6.length}
            leoInsight={ratingTrendLeo}
          >
            {() => (
              <>
                <TermRatingTrend series={window6} scopedTerms={terms} height={CHART_CARD_PLOT_PX} />
                <ChartDataTable
                  caption="Rating trend"
                  headers={['Term', 'Course rating', 'Faculty rating']}
                  rows={window6.map((s) => [s.term, s.courseAvg != null ? fmt2(s.courseAvg) : '—', s.facultyAvg != null ? fmt2(s.facultyAvg) : '—'])}
                />
              </>
            )}
          </ChartFigure>
        </ChartCard>

        <ChartCard variant="normal" title="Response rate trend" description={`Responded ÷ enrolled, last ${window6.length} terms`} leoInsight={responseTrendLeo}>
          <ChartFigure
            label="Response rate trend"
            summary={`Response rate by term, last ${window6.length} terms, against the ${RESPONSE_TARGET}% target, with ${termsListLabel} highlighted.`}
            dataLength={window6.length}
            leoInsight={responseTrendLeo}
          >
            {() => (
              <>
                <TermResponseTrend series={window6} target={RESPONSE_TARGET} scopedTerms={terms} height={CHART_CARD_PLOT_PX} />
                <ChartDataTable
                  caption="Response rate trend"
                  headers={['Term', 'Response rate', 'Responded', 'Enrolled']}
                  rows={window6.map((s) => [s.term, s.responseRate != null ? `${s.responseRate}%` : '—', s.responded, s.enrolled])}
                />
              </>
            )}
          </ChartFigure>
        </ChartCard>
      </div>

      {/* ── Leaderboard — ONE card, Course/Faculty entity toggle (Romit, 2026-09-14: "in the
             faculty toggle, i need to see courses and underneath i will see the list of
             faculties" — supersedes the prior side-by-side two-card layout). Course mode: the
             flat, course-only table (no Overall column, no per-question columns — the
             reference doesn't carry them), every column sortable, below-threshold ratings in
             red, row → new course tab. Faculty mode: the SAME courses as group headers
             (`defaultGroupBy="courseCode"`, ordered worst-first to match Course mode's own
             default sort), faculty nested underneath each — a card-local Role toggle (the
             reference's own "All Roles/Instructor/Coordinator" split) filters which faculty
             show, row → By Faculty. Both paginated — Faculty mode defaults to a taller page
             (10 vs Course's 5) since `DataTablePaginated` groups the PAGED slice, not the full
             set, so a 5-row page can cut a course's faculty list mid-group. ── */}
      <ChartCard
        variant="normal"
        title="Course Leaderboard"
        description={
          leaderboardEntity === 'course'
            ? `${courseRows.length} course${courseRows.length === 1 ? '' : 's'} in ${termsLabel}, ranked by rating`
            : `${facultyByCourseRows.length} faculty-course pairing${facultyByCourseRows.length === 1 ? '' : 's'} in ${termsLabel}, grouped by course`
        }
        leoInsight={leaderboardEntity === 'course' ? courseLeaderboardLeo : facultyLeaderboardLeo}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ToggleGroup type="single" value={leaderboardEntity} onValueChange={(v) => { if (v) { setLeaderboardEntity(v as 'course' | 'faculty'); setFacultyPage(1) } }} variant="outline" size="sm">
            <ToggleGroupItem value="course" aria-label="Show courses">Course</ToggleGroupItem>
            <ToggleGroupItem value="faculty" aria-label="Show faculty, grouped by course">Faculty</ToggleGroupItem>
          </ToggleGroup>
          <Button asChild variant="link" size="sm" className="h-auto p-0 text-sm">
            <Link href={leaderboardEntity === 'course' ? '/analytics?tab=course' : '/analytics?tab=faculty'}>
              {leaderboardEntity === 'course' ? 'View all courses →' : 'View all faculty →'}
            </Link>
          </Button>
        </div>
        {leaderboardEntity === 'faculty' && (
          <ToggleGroup type="single" value={roleFilter ?? 'all'} onValueChange={(v) => { if (v) { setRoleFilter(v === 'all' ? undefined : (v as FacultyEvalRoleId)); setFacultyPage(1) } }} variant="outline" size="sm">
            <ToggleGroupItem value="all" aria-label="All roles">All Roles</ToggleGroupItem>
            {roleOptions.map((r) => (
              <ToggleGroupItem key={r.id} value={r.id} aria-label={r.label}>{r.label}</ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}
        <p className="text-sm text-muted-foreground">
          {leaderboardEntity === 'course' ? 'Distribution of course ratings.' : 'Distribution of faculty ratings.'}
        </p>
        {leaderboardEntity === 'course' ? (
          <>
            <RatingDistributionHistogram values={courseRows.map((r) => r.courseScore).filter((v): v is number => v != null)} />
            <DataTablePaginated<CourseLeaderboardRow>
              key="course"
              data={courseRows}
              columns={courseColumns}
              getRowId={(r) => r.courseCode}
              selectable={false}
              searchable={false}
              showQueryControls={false}
              edgeInset={false}
              defaultSort={{ key: 'courseScore', dir: 'asc' }}
              pagination={{ pageSize: 5, pageSizeOptions: [5, 10, 25] }}
              emptyState={<p className="py-8 text-center text-sm text-muted-foreground">No scored courses for {termsLabel} yet.</p>}
              onRowClick={(row) => {
                // `tab=course:<code>` + `courseTabs=<code>` — the closable-tab URL scheme
                // (2026-09-14), not the retired `courseCode=`/`term=` pair: that param is no
                // longer read anywhere, so a row click here silently landed on the bare course
                // list instead of the course it named.
                const code = encodeURIComponent(row.courseCode)
                window.open(`/analytics?tab=course:${code}&courseTabs=${code}`, '_blank', 'noopener,noreferrer')
              }}
            />
          </>
        ) : (
          <>
            <RatingDistributionHistogram values={facultyByCourseRows.map((r) => r.rating).filter((v): v is number => v != null)} />
            {coursesWithFaculty.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No scored faculty for {termsLabel} yet.</p>
            ) : (
              <div className="flex flex-col rounded-md border border-border">
                {/* Shared column grid — course rows and faculty rows line up under the same
                    header, without ever being a `<table>`. */}
                <div className="grid grid-cols-[1fr_100px_120px_90px] gap-3 border-b border-border bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
                  <span>Course / Faculty</span>
                  <span className="text-right">Rating</span>
                  <span className="text-right">Response rate</span>
                  <span className="text-right">Offerings</span>
                </div>
                {pagedCoursesWithFaculty.map((course, i) => (
                  <div key={course.courseCode} className={i > 0 ? 'border-t border-border' : undefined}>
                    {/* The course row — course-level stats, same shape as the Course table's
                        own row, so switching entities doesn't relearn the layout. */}
                    <div className="grid grid-cols-[1fr_100px_120px_90px] items-center gap-3 bg-muted/20 px-3 py-2">
                      <span className="truncate">
                        <span className="font-medium text-foreground">{course.courseCode}</span>
                        <span className="block truncate text-xs text-muted-foreground">{course.courseName}</span>
                      </span>
                      <span className="text-right"><RatingCell value={course.courseScore} below={course.belowThreshold} /></span>
                      <span className="text-right tabular-nums text-sm">{course.responseRate}%</span>
                      <span className="text-right tabular-nums text-sm">{course.offerings}</span>
                    </div>
                    {/* The faculty who taught it, worst-first, indented under their course. */}
                    {(facultyByCourse.get(course.courseCode) ?? []).map((f) => (
                      <div
                        key={f.facultyId}
                        role="button"
                        tabIndex={0}
                        onClick={() => onOpenFaculty(f.facultyId)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenFaculty(f.facultyId) } }}
                        className="grid cursor-pointer grid-cols-[1fr_100px_120px_90px] items-center gap-3 px-3 py-2 pl-6 text-sm hover:bg-muted/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
                      >
                        <span className="truncate">{f.name}</span>
                        <span className="text-right"><RatingCell value={f.rating} below={f.belowThreshold} /></span>
                        <span className="text-right tabular-nums">{f.responseRate}%</span>
                        <span className="text-right tabular-nums">{f.offerings}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
            {coursesWithFaculty.length > 0 && (
              <PaginationBar
                page={facultySafePage}
                pageSize={facultyPageSize}
                total={coursesWithFaculty.length}
                pageSizeOptions={[5, 10, 25]}
                onPageChange={setFacultyPage}
                onPageSizeChange={(n) => { setFacultyPageSize(n); setFacultyPage(1) }}
              />
            )}
          </>
        )}
      </ChartCard>
    </div>
  )
}
