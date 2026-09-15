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
import { DataTablePaginated } from '@/components/data-table/pagination'
import type { ColumnDef } from '@/components/data-table/types'
import {
  termsKpis,
  termOfferingsEvaluated,
  termsPrevTermDelta,
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

/** "+0.21" style KPI trend against the previous term (see `termsPrevTermDelta`). */
function prevTermTrend(delta: number | null): { value: string; trend: 'up' | 'down' | 'neutral' } {
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
  /* Each rating column flags against ITS OWN median, independently — a course can be weak on
     content and fine on teaching (or vice versa), and a single shared flag painted both cells
     red together whenever either one dipped. Flat fields, not nested — DataTable's sort
     comparator reads one top-level property via `sortKey`. */
  courseBelow: boolean
  facultyBelow: boolean
}

/** One row per (faculty, role) pair — a person holding two roles is counted twice, same as the
 *  reference's own Faculty Leaderboard. Flat and role-scoped rather than nested under course:
 *  "which individual is rated lowest, in which role" is a different question from "who taught
 *  this underperforming course" (the Course card's own Faculty column already answers that
 *  one), and a real DataTable here (sortable, paginated) replaces the earlier hand-rolled
 *  `<div>` grid this file used only because DataTable's own grouping read as a table-inside-a-
 *  table — that objection doesn't apply to a flat, ungrouped list. */
interface FacultyRoleRow extends Record<string, unknown> {
  facultyId: string
  name: string
  role: FacultyEvalRoleId
  roleLabel: string
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
  // Same padding whether or not the tint applies (Romit's catch, 2026-09-15) — the un-tinted
  // branch used to render with NO padding at all, so a tinted number's digits started 8px
  // further right than a plain one in the same column, misaligning every row that mixed both.
  return (
    <span
      className="inline-block rounded font-semibold tabular-nums text-foreground"
      style={{ background: below ? 'var(--conditional-rule-red)' : 'transparent', padding: '2px 8px' }}
    >
      {fmt2(value)}
    </span>
  )
}

export function AnalyticsOverviewPanel({
  terms,
  onOpenCourse,
  onOpenFaculty,
}: {
  /** One or more selected terms — Term is a multi-select; every stat below pools across all
   *  of them, same rule "all terms" (omitted term) already follows elsewhere in this file. */
  terms: string[]
  /** Course rows open the SAME browser tab's course analytics tab now (Vishal, 2026-09-15) —
   *  was a `window.open(...'_blank'...)` new tab; reuses the same `openCourseTab` mechanism
   *  `CourseOfferingList` already receives, wired from `app/(app)/analytics/page.tsx`. */
  onOpenCourse: (courseCode: string) => void
  /** Faculty rows open the SAME tab's By Faculty scroll target (existing pattern). */
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

  /* "+0.21 vs Spring 2026" — always the term immediately before the EARLIEST selected term
     (Vishal, 2026-09-15), not a season-matched year-over-year comparison. */
  const prevDelta = useMemo(() => termsPrevTermDelta(terms), [terms])
  const courseDelta = prevTermTrend(prevDelta.courseAvg)
  const facultyDelta = prevTermTrend(prevDelta.facultyAvg)
  const responseDelta = prevTermTrend(prevDelta.responseRate)

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
  /* ── Course Leaderboard — every course in scope, not just scored ones (reference: "Distribution
        of every course in scope... plus the full ranked list"). An unscored course (0 responses
        yet) still gets a row with its offering count and dashes, rather than silently
        disappearing — hiding it would hide a real course, not a non-event. Sorted lowest-first
        by default (Monil's "order by the lowest one" decision) on the new Overall column, every
        column sortable so the reader can flip to descending for the "five best" half of the
        same requirement. ── */
  const allCourseStats = useMemo(() => courseStats(terms), [terms])
  const scoredCourses = useMemo(
    () =>
      allCourseStats.filter(
        (c): c is typeof c & { score: { state: 'value'; value: DualMean } } => c.score.state === 'value',
      ),
    [allCourseStats],
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
      allCourseStats.map((c) => {
        const courseVal = c.score.state === 'value' ? c.score.value.weighted : null
        const facultyVal = c.facultyScore.state === 'value' ? c.facultyScore.value.weighted : null
        const offerings = offeringPoints().filter((o) => o.courseCode === c.courseCode && terms.includes(o.term)).length
        return {
          courseCode: c.courseCode,
          courseName: c.courseName,
          offerings,
          courseScore: courseVal,
          facultyScore: facultyVal,
          responseRate: c.responseRate,
          courseBelow: courseVal != null && courseVal < courseMedian,
          facultyBelow: facultyVal != null && facultyVal < courseFacultyMedian,
        }
      }),
    [allCourseStats, courseMedian, courseFacultyMedian, terms],
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
        cell: (row) => <RatingCell value={row.courseScore} below={row.courseBelow} />,
      },
      {
        key: 'facultyScore',
        label: 'Faculty rating',
        sortable: true,
        sortKey: 'facultyScore',
        width: 120,
        cell: (row) => <RatingCell value={row.facultyScore} below={row.facultyBelow} />,
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
    const scoredRows = courseRows.filter((r) => r.courseScore != null)
    if (!scoredRows.length) return null
    const worst = [...scoredRows].sort((a, b) => (a.courseScore as number) - (b.courseScore as number))[0]!
    const below = scoredRows.filter((r) => r.courseBelow || r.facultyBelow)
    return {
      headline: `${worst.courseCode} rates lowest at ${fmt2(worst.courseScore as number)}`,
      explanation: `${below.length} of ${scoredRows.length} scored courses fall below the ${fmt2(courseMedian)} course-rating median or the ${fmt2(courseFacultyMedian)} faculty-rating median for ${termsLabel}. Sort by any rating column to see the full spread.`,
      kind: below.length > 0 ? 'anomaly' : 'trend',
      delta: { value: fmt2(worst.courseScore as number), label: worst.courseCode },
      bullets: [
        `${worst.courseCode} · ${worst.courseName}: ${worst.courseScore != null ? fmt2(worst.courseScore) : '—'} course, ${worst.facultyScore != null ? fmt2(worst.facultyScore) : '—'} faculty.`,
        `${below.length} of ${scoredRows.length} scored courses below either median.`,
      ],
    }
  }, [courseRows, courseMedian, courseFacultyMedian, termsLabel])

  /* ── Faculty Leaderboard — flat Faculty × Role rows (reference: "a person holding two roles
        is counted twice"), not nested under course. This answers a different question than the
        Course card's own Faculty column: "which individual, in which role, rates lowest" rather
        than "who taught this underperforming course". A real, sortable, paginated DataTable —
        same component the Course card uses — since a flat list has no grouping to fight with
        (the earlier nested `<div>` list existed only to avoid DataTable's own group-banding
        look, which doesn't apply once course is dropped from the grain entirely). Role stays a
        card-local filter (the reference's own "All Roles/Instructor/Coordinator" split) — it
        has no meaning against the flat Course table, so it lives only on this card. ── */
  const roleOptions = useMemo(() => facultyEvalRoleOptions(), [])
  const [roleFilter, setRoleFilter] = useState<FacultyEvalRoleId | undefined>(undefined)
  const facultyRoleRows: FacultyRoleRow[] = useMemo(() => {
    const roleLabelById = new Map(roleOptions.map((r) => [r.id, r.label]))
    const offs = offeringPoints().filter((o) => terms.includes(o.term) && (!roleFilter || o.evalRole === roleFilter))
    const byKey = new Map<string, typeof offs>()
    offs.forEach((o) => {
      const k = `${o.facultyId}::${o.evalRole}`
      const list = byKey.get(k) ?? []
      list.push(o)
      byKey.set(k, list)
    })
    const unranked = [...byKey.values()].map((rows) => {
      const enrolled = rows.reduce((s, r) => s + r.enrolled, 0)
      const responded = rows.reduce((s, r) => s + r.responded, 0)
      const role = rows[0]!.evalRole
      return {
        facultyId: rows[0]!.facultyId,
        name: rows[0]!.facultyName,
        role,
        roleLabel: roleLabelById.get(role) ?? role,
        rating: dualMean(rows.map((r) => r.avgRating), rows.map((r) => r.enrolled)).weighted,
        responseRate: enrolled > 0 ? Math.round((responded / enrolled) * 100) : 0,
        offerings: rows.length,
        belowThreshold: false,
      }
    })
    const median = medianOf(unranked.map((r) => r.rating).filter((v): v is number => v != null))
    return unranked.map((r) => ({ ...r, belowThreshold: r.rating != null && r.rating < median }))
  }, [terms, roleFilter, roleOptions])

  const facultyRoleColumns: ColumnDef<FacultyRoleRow>[] = useMemo(
    () => [
      {
        key: 'name',
        label: 'Faculty',
        sortable: true,
        sortKey: 'name',
        width: 200,
        cell: (row) => <span className="block truncate font-medium text-foreground">{row.name}</span>,
      },
      {
        key: 'roleLabel',
        label: 'Role',
        sortable: true,
        sortKey: 'roleLabel',
        width: 140,
        cell: (row) => <span className="text-sm text-muted-foreground">{row.roleLabel}</span>,
      },
      {
        // Rating 3rd, Offerings 4th (Vishal, 2026-09-15) — was Response rate/Offerings/Rating;
        // Response rate moves to last.
        key: 'rating',
        label: 'Rating',
        sortable: true,
        sortKey: 'rating',
        width: 100,
        cell: (row) => <RatingCell value={row.rating} below={row.belowThreshold} />,
      },
      {
        key: 'offerings',
        label: 'Offerings',
        sortable: true,
        sortKey: 'offerings',
        width: 100,
        cell: (row) => <span className="tabular-nums">{row.offerings}</span>,
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

  const facultyMedianRating = useMemo(
    () => medianOf(facultyRoleRows.map((r) => r.rating).filter((v): v is number => v != null)),
    [facultyRoleRows],
  )

  const facultyLeaderboardLeo: ChartLeoInsight | null = useMemo(() => {
    const scoredRows = facultyRoleRows.filter((r) => r.rating != null)
    if (!scoredRows.length) return null
    const worst = [...scoredRows].sort((a, b) => (a.rating as number) - (b.rating as number))[0]!
    const below = scoredRows.filter((r) => r.belowThreshold)
    return {
      headline: `${worst.name} rates lowest at ${fmt2(worst.rating as number)} (${worst.roleLabel})`,
      explanation: `${below.length} of ${scoredRows.length} faculty-role pairings fall below the ${fmt2(facultyMedianRating)} rating median for ${termsLabel}. Sort the Rating column to move between the best and lowest five.`,
      kind: below.length > 0 ? 'anomaly' : 'trend',
      delta: { value: fmt2(worst.rating as number), label: worst.name },
      bullets: [
        `${worst.name} · ${worst.roleLabel}: ${fmt2(worst.rating as number)} across ${worst.offerings} offering${worst.offerings === 1 ? '' : 's'}.`,
        `${below.length} of ${scoredRows.length} faculty-role pairings below the median.`,
      ],
    }
  }, [facultyRoleRows, facultyMedianRating, termsLabel])

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

      {/* ── KPIs — Course avg, Faculty avg, Response rate, Offerings evaluated. No `description`
             (Vishal, 2026-09-15: "remove 'Spring 2026' as it already shows in the filter" — the
             term is stated once, in the filter row above this whole panel). No sparkline: the
             https://exxat-surveys-24f.pages.dev/surveys/analytics/summer-2025 reference's tiles
             are a label, a number + delta, and a comparison line — nothing else — and matching
             that means dropping VIZ-010's usual "no bare number" spark for this leaner shape.
             The reference also puts the delta value INLINE next to the trend arrow (`trendDelta`)
             and leaves the caption below as just "vs Term" — verified live against the reference
             page, this file previously ran both together as one caption string.
             `trendPolarity: 'higher_is_better'` (not this file's usual 'informational') so the
             arrow tone (green/amber, never red — Aarti VIZ-004) matches metricTrendTone. ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ChartCard hideAskLeo variant="kpi-chart" title="Course avg" miniMetrics={[{ label: prevDelta.prevTerm ? `vs ${prevDelta.prevTerm}` : 'No prior term to compare', trendDelta: prevDelta.prevTerm ? courseDelta.value : undefined, value: kpis.courseAvg != null ? fmt2(kpis.courseAvg) : '—', trend: courseDelta.trend, trendPolarity: 'higher_is_better' }]}>{null}</ChartCard>

        <ChartCard hideAskLeo variant="kpi-chart" title="Faculty avg" miniMetrics={[{ label: prevDelta.prevTerm ? `vs ${prevDelta.prevTerm}` : 'No prior term to compare', trendDelta: prevDelta.prevTerm ? facultyDelta.value : undefined, value: kpis.facultyAvg != null ? fmt2(kpis.facultyAvg) : '—', trend: facultyDelta.trend, trendPolarity: 'higher_is_better' }]}>{null}</ChartCard>

        {/* One line, same shape as the other three tiles (Romit, 2026-09-15: match
            https://pce-three.vercel.app/analytics-2's compact cards) — used to append
            "· N of M responded" onto this same label, which wrapped to a second line and, via
            this grid row's default `items-stretch`, forced all four tiles to that taller
            height. The raw response count still exists, just not spliced into this line. */}
        <ChartCard hideAskLeo variant="kpi-chart" title="Response rate" miniMetrics={[{ label: prevDelta.prevTerm ? `vs ${prevDelta.prevTerm}` : `${kpis.responded.toLocaleString()} of ${kpis.enrolled.toLocaleString()} responded`, trendDelta: prevDelta.prevTerm ? `${responseDelta.value}pp` : undefined, value: kpis.responseRate != null ? `${kpis.responseRate}%` : '—', trend: responseDelta.trend, trendPolarity: 'higher_is_better' }]}>{null}</ChartCard>

        {/* Subtext is always the coverage sentence, never a prev-term delta (Vishal, 2026-09-15:
            "subtext should be '100% coverage of 7 offerings'") — unlike the three rating/rate
            tiles above, this one states the current fact, not a comparison. */}
        <ChartCard hideAskLeo variant="kpi-chart" title="Offerings evaluated" miniMetrics={[{ label: `${offeringsEval.total > 0 ? Math.round((offeringsEval.evaluated / offeringsEval.total) * 100) : 0}% coverage of ${offeringsEval.total} offering${offeringsEval.total === 1 ? '' : 's'}`, value: `${offeringsEval.evaluated}`, trend: 'neutral', trendPolarity: 'higher_is_better' }]}>{null}</ChartCard>
      </div>

      {/* ── Course vs faculty (square) beside Rating trend + Response-rate trend, stacked
             (Romit, 2026-09-15: "make [Course vs faculty] a square... and accommodate rating
             and response rate trend for the space that is left" — was three separate full-width
             rows; the two trend cards now share this one row with the quadrant instead of a
             second row below it). Quadrant labels stay the subtle, non-judgmental wording this
             chart already used ("Both need attention" / "Course strong · faculty gap", never
             "Teaching support recommended" — the reference's phrasing the PRD explicitly asks
             to soften). Trend cards: term only, no AY/Term toggle (the PRD drops it — term is
             already the anchor), no program-average line, last 6 terms with every selected term
             highlighted. `items-start` so the shorter trend-card column doesn't stretch to
             match the taller square card's height. */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <ChartCard hideAskLeo variant="normal" title="Course vs faculty" description={`One dot per course, split at this selection's own means`} leoInsight={gapLeo}>
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
                <CourseFacultyQuadrant points={gaps} courseMean={courseMean} facultyMean={facultyMean} palette="domain" square />
                <ChartDataTable
                  caption="Course rating versus faculty rating"
                  headers={['Course', 'Course rating', 'Faculty rating', 'Enrolled']}
                  rows={gaps.map((g) => [`${g.courseCode} · ${g.courseName}`, fmt2(g.courseAvg), fmt2(g.facultyAvg), g.enrolled])}
                />
              </>
            )}
          </ChartFigure>
        </ChartCard>

        <div className="flex flex-col gap-4">
          <ChartCard hideAskLeo variant="normal" title="Rating trend" description={`Course and faculty rating, last ${window6.length} terms`} leoInsight={ratingTrendLeo}>
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

          <ChartCard hideAskLeo variant="normal" title="Response rate trend" description={`Responded ÷ enrolled, last ${window6.length} terms`} leoInsight={responseTrendLeo}>
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
      </div>

      {/* ── Leaderboards — TWO side-by-side cards, each a real sortable/paginated DataTable
             (Romit, 2026-09-14, reference screenshot: dedicated "Overall" column + per-column
             below-median highlighting on Course; flat Faculty × Role rows, no course grouping,
             on Faculty — "a person holding two roles is counted twice"). Course: every course
             in scope, including unscored ones (dashes, not hidden), ranked by the new Overall
             column with Course/Faculty still broken out beside it (D27 — never the only number
             shown), row → new course tab. Faculty: one row per (faculty, role) pair — a
             different question from the Course card's own Faculty column ("who taught this
             underperforming course" vs "which individual, in which role, rates lowest") — with
             a card-local Role filter, row → By Faculty. Both cards use `headerAction` /
             `variant="selector"` to put "View all" and the Role filter in the actual card
             header, not floating above an unrelated chart. */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
      <ChartCard
        hideAskLeo
        variant="normal"
        title="Course Leaderboard"
        leoInsight={courseLeaderboardLeo}
        // "View all courses →" is a card-level exit, not a control on the histogram below it —
        // it belongs in the header next to the title (Romit, 2026-09-14: the link floating
        // alone above an unrelated chart read as if it controlled that chart). Same fix as the
        // Faculty card's role filter, which also moved into the header for the same reason.
        headerAction={
          <Button asChild variant="outline" size="sm">
            <Link href="/analytics?tab=course">View all courses →</Link>
          </Button>
        }
      >
        <p className="text-xs font-medium text-muted-foreground">Rating distribution</p>
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
          emptyState={<p className="py-8 text-center text-sm text-muted-foreground">No courses for {termsLabel} yet.</p>}
          // Same-tab now (Vishal, 2026-09-15) — was `window.open(...'_blank'...)`. Reuses the
          // page's own `openCourseTab` mechanism via the `onOpenCourse` prop, same as
          // `CourseOfferingList` already does; still the `tab=course:<code>` + `courseTabs=`
          // closable-tab scheme underneath.
          onRowClick={(row) => onOpenCourse(row.courseCode)}
        />
      </ChartCard>

      <ChartCard
        hideAskLeo
        // The role filter scopes the WHOLE card (table + histogram below), so it belongs in
        // the header next to the title, not floating in the body above a chart it also isn't
        // about (Romit, 2026-09-14). `variant="selector"` is this DS's own header-filter slot
        // — the same mechanism the KPI/metrics cards elsewhere in this codebase already use for
        // a card-scoped Select, so this isn't a one-off pattern invented for this card.
        variant="selector"
        title="Faculty Leaderboard"
        leoInsight={facultyLeaderboardLeo}
        filterOptions={[{ value: 'all', label: 'All roles' }, ...roleOptions.map((r) => ({ value: r.id, label: r.label }))]}
        defaultFilter={roleFilter ?? 'all'}
        onFilterChange={(v) => setRoleFilter(v === 'all' ? undefined : (v as FacultyEvalRoleId))}
        headerAction={
          <Button asChild variant="outline" size="sm">
            <Link href="/analytics?tab=faculty">View all faculty →</Link>
          </Button>
        }
      >
        <p className="text-xs font-medium text-muted-foreground">Rating distribution</p>
        <RatingDistributionHistogram values={facultyRoleRows.map((r) => r.rating).filter((v): v is number => v != null)} />
        <DataTablePaginated<FacultyRoleRow>
          key="faculty"
          data={facultyRoleRows}
          columns={facultyRoleColumns}
          getRowId={(r) => `${r.facultyId}::${r.role}`}
          selectable={false}
          searchable={false}
          showQueryControls={false}
          edgeInset={false}
          defaultSort={{ key: 'rating', dir: 'asc' }}
          pagination={{ pageSize: 5, pageSizeOptions: [5, 10, 25] }}
          emptyState={<p className="py-8 text-center text-sm text-muted-foreground">No scored faculty for {termsLabel} yet.</p>}
          onRowClick={(row) => onOpenFaculty(row.facultyId)}
        />
      </ChartCard>
      </div>
    </div>
  )
}
