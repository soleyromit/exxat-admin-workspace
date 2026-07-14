'use client'

/**
 * Analytics → Overview. The "brief me on the program" landing.
 *
 * This tab was deleted in July ("'overview' retired Jul 2026 — the monitoring layer moved
 * to the Dashboard home", `analytics/page.tsx:21`), but the monitoring layer never arrived:
 * `dashboard-home.tsx` is a response-collection ops surface and imports no charts. Eight of
 * the twenty ADMIN analytics stories had no home as a result. Monil's accepted 2026-07-13
 * model has four tabs — "three tabs, in fact four: overview, by faculty, by course and by
 * term" — so this restores it rather than inventing it.
 *
 * Structure follows the tab template Monil stated for every tab:
 *   (1) KPIs → (2) trend graphs across all terms → (3) deep-dive.
 *
 * Every card names the action it enables (Monil: "I want to investigate. What we can help
 * them is what we need to build") and carries a sentence headline, not a noun label —
 * a chart without a takeaway is a banned pattern (Knaflic, via claude-practices).
 */

import { useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@exxatdesignux/ui'
import {
  ChartCard,
  ChartFigure,
  ChartDataTable,
  type ChartLeoInsight,
} from '@/components/charts-overview'
import {
  GapQuadrant,
  CourseTermHeat,
  ProgramTrendStack,
  DriftDumbbell,
  CourseRankDots,
  KpiSpark,
  type DriftRow,
} from '@/components/pce/analytics-plots'
import {
  programSummary,
  termSeries,
  facultyStats,
  courseStats,
  gapPoints,
  courseTermMatrix,
  medianOf,
} from '@/lib/pce-analytics'

const fmt2 = (v: number) => v.toFixed(2)

export function AnalyticsOverviewPanel() {
  const summary = useMemo(() => programSummary(), [])
  const series = useMemo(() => termSeries(), [])
  const faculty = useMemo(() => facultyStats(), [])
  const courses = useMemo(() => courseStats(), [])
  const gaps = useMemo(() => gapPoints(), [])
  const matrix = useMemo(() => courseTermMatrix(), [])

  const courseMedian = useMemo(() => medianOf(courses.map((c) => c.score.weighted)), [courses])

  /* The quadrant split is the mean of the PLOTTED points, not the program-wide mean — a
     split line that doesn't match its own dots is the "numbers disagree with each other"
     bug the legacy prototype shipped eight times over (§4 of the walkthrough). */
  const courseMean = useMemo(
    () => (gaps.length ? gaps.reduce((s, g) => s + g.courseAvg, 0) / gaps.length : 0),
    [gaps],
  )
  const facultyMean = useMemo(
    () => (gaps.length ? gaps.reduce((s, g) => s + g.facultyAvg, 0) / gaps.length : 0),
    [gaps],
  )

  /* ── Story 1 — key numbers. Never a bare number: each tile carries its own
        sparkline (VIZ-010) and an n-of-total caption. Trend polarity is
        `informational` so the DS tints the arrow muted rather than
        `text-destructive` — red is banned in score viz (VIZ-004, Aarti). ── */

  const scoreDelta = (spark: { y: number }[]) => {
    if (spark.length < 2) return { value: '', trend: 'neutral' as const }
    const d = spark[spark.length - 1]!.y - spark[spark.length - 2]!.y
    return {
      value: `${d >= 0 ? '+' : ''}${d.toFixed(2)}`,
      trend: d > 0 ? ('up' as const) : d < 0 ? ('down' as const) : ('neutral' as const),
    }
  }

  const facultyDelta = scoreDelta(summary.facultySpark)
  const courseDelta = scoreDelta(summary.courseSpark)
  const responseDelta = (() => {
    const s = summary.responseSpark
    if (s.length < 2) return { value: '', trend: 'neutral' as const }
    const d = Math.round(s[s.length - 1]!.y - s[s.length - 2]!.y)
    return {
      value: `${d >= 0 ? '+' : ''}${d}%`,
      trend: d > 0 ? ('up' as const) : d < 0 ? ('down' as const) : ('neutral' as const),
    }
  })()

  /* ── Leo insights — derived from the chart's own data, never hand-written prose. ── */

  const gapLeo: ChartLeoInsight | null = useMemo(() => {
    if (gaps.length < 3) return null
    // The widest faculty-over-course gap: the instructor is carrying a weak course.
    const widest = [...gaps].sort(
      (a, b) => (b.facultyAvg - b.courseAvg) - (a.facultyAvg - a.courseAvg),
    )[0]!
    const gap = widest.facultyAvg - widest.courseAvg
    const bothLow = gaps.filter((g) => g.courseAvg < courseMean && g.facultyAvg < facultyMean)
    return {
      headline: `${widest.courseCode} scores ${fmt2(gap)} higher on teaching than on content`,
      explanation:
        `Students rate two different things — the course and the person teaching it. When faculty score runs ` +
        `well above course score, the instructor is carrying material that needs a redesign; coaching the person ` +
        `will not move it. ${bothLow.length} offering${bothLow.length === 1 ? '' : 's'} sit in the both-need-attention quadrant.`,
      kind: 'anomaly',
      delta: { value: `+${fmt2(gap)}`, label: 'faculty over course' },
      bullets: [
        `${widest.courseCode} · ${widest.short}: course ${fmt2(widest.courseAvg)} vs faculty ${fmt2(widest.facultyAvg)}.`,
        `${bothLow.length} of ${gaps.length} offerings are below both program means.`,
        'Dots off the shaded band are anomalous for their kind, not merely low.',
      ],
      // Plot charts position the marker through `leoAnchor` + the live Plot scales; the
      // anchor here carries the data-space Y and marks the insight as plot-anchored.
      anchor: { yValue: widest.facultyAvg },
    }
  }, [gaps, courseMean, facultyMean])

  const trendLeo: ChartLeoInsight | null = useMemo(() => {
    const scored = series.filter((s) => s.courseAvg != null)
    if (scored.length < 2) return null
    const last = scored[scored.length - 1]!
    const prev = scored[scored.length - 2]!
    const d = (last.courseAvg as number) - (prev.courseAvg as number)
    const lowRate = series.filter((s) => s.responseRate != null && s.responseRate < 80)
    return {
      headline:
        d < 0
          ? `Course scores fell ${fmt2(Math.abs(d))} in ${last.term}`
          : `Course scores rose ${fmt2(d)} in ${last.term}`,
      explanation:
        `The two plots share a term axis on purpose: a score dip that lands in the same term as a response-rate ` +
        `collapse is usually a sampling artefact, not a quality change. ${lowRate.length} of ${series.length} terms ` +
        `came in under the 80% response target.`,
      kind: d < 0 ? 'dip' : 'trend',
      delta: { value: `${d >= 0 ? '+' : ''}${fmt2(d)}`, label: `vs ${prev.term}` },
      bullets: [
        `${last.term}: course ${fmt2(last.courseAvg as number)}${last.facultyAvg != null ? ` · faculty ${fmt2(last.facultyAvg)}` : ''}.`,
        `${series.length} terms of history in view.`,
      ],
      anchor: { xValue: last.short, yDataKeys: ['courseAvg'] },
    }
  }, [series])

  const heatLeo: ChartLeoInsight | null = useMemo(() => {
    if (!matrix.cells.length) return null
    const worst = [...matrix.cells].sort((a, b) => a.courseAvg - b.courseAvg)[0]!
    const filled = matrix.cells.length
    const possible = matrix.courses.length * matrix.terms.length
    return {
      headline: `${worst.courseCode} in ${worst.term} is the weakest cell at ${fmt2(worst.courseAvg)}`,
      explanation:
        `Rows are ordered worst to best, so the courses that need work band together at the top rather than ` +
        `scattering alphabetically. ${filled} of ${possible} course-term cells carry data — the blanks are terms ` +
        `a course was not offered or not evaluated.`,
      kind: 'anomaly',
      delta: { value: fmt2(worst.courseAvg), label: `${worst.courseCode} · ${worst.term}` },
      bullets: [
        `${matrix.courses.length} courses × ${matrix.terms.length} terms.`,
        `${filled} of ${possible} cells populated.`,
      ],
      anchor: { xValue: worst.term, yDataKeys: ['courseAvg'] },
    }
  }, [matrix])

  const facultyDriftRows: DriftRow[] = useMemo(
    () => faculty.map((f) => ({ label: f.name, avg1y: f.avg1y, avg3y: f.avg3y, drift: f.drift })),
    [faculty],
  )
  const courseDriftRows: DriftRow[] = useMemo(
    () => courses.map((c) => ({ label: c.courseCode, avg1y: c.avg1y, avg3y: c.avg3y, drift: c.drift })),
    [courses],
  )

  const facultyDriftLeo: ChartLeoInsight | null = useMemo(() => {
    const movers = facultyDriftRows.filter((r) => r.drift != null) as (DriftRow & { drift: number })[]
    if (!movers.length) return null
    const worst = [...movers].sort((a, b) => a.drift - b.drift)[0]!
    const declining = movers.filter((m) => m.drift < 0)
    return {
      headline:
        declining.length > 0
          ? `${declining.length} of ${movers.length} faculty are rated lower this year than over three`
          : `Every faculty member is level or improving vs their three-year mean`,
      explanation:
        `The arrow runs from a person's 3-year mean to their 1-year mean, so direction and size read in one mark. ` +
        `A short arrow is stability, not a lack of data. Start with the longest amber arrow — that is the biggest ` +
        `change in the shortest time.`,
      kind: declining.length > 0 ? 'dip' : 'trend',
      delta: { value: `${worst.drift >= 0 ? '+' : ''}${fmt2(worst.drift)}`, label: worst.label },
      bullets: [
        `${worst.label}: ${fmt2(worst.avg3y as number)} → ${fmt2(worst.avg1y as number)} over the last year.`,
        `${movers.length} faculty have enough history for both windows.`,
      ],
      anchor: { yValue: worst.avg1y as number },
    }
  }, [facultyDriftRows])

  const courseDriftLeo: ChartLeoInsight | null = useMemo(() => {
    const below = courses.filter((c) => c.score.weighted < courseMedian)
    if (!courses.length) return null
    const worst = courses[courses.length - 1]!
    return {
      // Frequency count, not a percentage — Aarti D17 ("8 of 20 questions" beats "40%").
      headline: `${below.length} of ${courses.length} courses sit below the ${fmt2(courseMedian)} median`,
      explanation:
        `${worst.courseCode} is lowest at ${fmt2(worst.score.weighted)}. Course scores that fall while faculty ` +
        `scores hold usually mean content or workload, not teaching — check the open-text before booking a ` +
        `conversation with the instructor.`,
      kind: below.length > 0 ? 'anomaly' : 'trend',
      delta: { value: fmt2(worst.score.weighted), label: worst.courseCode },
      bullets: [
        `Lowest: ${worst.courseCode} — ${worst.courseName} at ${fmt2(worst.score.weighted)}.`,
        `Median across ${courses.length} courses: ${fmt2(courseMedian)}.`,
      ],
      anchor: { yValue: worst.score.weighted },
    }
  }, [courses, courseMedian])

  const anchorGap = useMemo(() => {
    if (gaps.length < 3) return undefined
    const widest = [...gaps].sort(
      (a, b) => (b.facultyAvg - b.courseAvg) - (a.facultyAvg - a.courseAvg),
    )[0]!
    return { x: widest.courseAvg, y: widest.facultyAvg }
  }, [gaps])

  return (
    <div className="flex flex-col gap-4">
      {/* ChartCard renders its title as an h3. The page h1 is "Analytics", so without a
          section h2 the document skips a level (axe `heading-order`). The section is real,
          it just doesn't need to be seen. */}
      <h2 className="sr-only">Program overview</h2>

      {/* ── Row 1 — story 1. Three tiles, each a number WITH its trajectory. ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ChartCard
          variant="kpi-chart"
          title="Average faculty score"
          description={`Weighted by class size · simple mean ${fmt2(summary.facultyScore.simple)}`}
          miniMetrics={[
            {
              label: `across ${summary.facultyScore.n} offerings`,
              value: fmt2(summary.facultyScore.weighted),
              trend: facultyDelta.trend,
              trendPolarity: 'informational',
            },
          ]}
        >
          {/* seriesIndex 1 = --chart-2 = the "Faculty" line in Program trajectory below.
              One metric, one colour, down the whole tab. */}
          <KpiSpark points={summary.facultySpark} seriesIndex={1} />
        </ChartCard>

        <ChartCard
          variant="kpi-chart"
          title="Average course score"
          description={`Course content only · simple mean ${fmt2(summary.courseScore.simple)}`}
          miniMetrics={[
            {
              label: `across ${summary.courseScore.n} course-terms`,
              value: fmt2(summary.courseScore.weighted),
              trend: courseDelta.trend,
              trendPolarity: 'informational',
            },
          ]}
        >
          {/* seriesIndex 0 = --chart-1 = the "Course content" line below. */}
          <KpiSpark points={summary.courseSpark} seriesIndex={0} />
        </ChartCard>

        <ChartCard
          variant="kpi-chart"
          title="Overall response rate"
          description={`${summary.responded.toLocaleString()} of ${summary.enrolled.toLocaleString()} students responded`}
          miniMetrics={[
            {
              label: `${summary.termCount} terms · target 80%`,
              value: `${summary.responseRate}%`,
              trend: responseDelta.trend,
              trendPolarity: 'informational',
            },
          ]}
        >
          {/* Response rate keeps the amber/target semantic rather than a series colour:
              unlike the two scores it has a stated bar (80%), so below-target is a state,
              not an identity. seriesIndex 2 = --chart-3 = its line in Program trajectory. */}
          <KpiSpark
            points={summary.responseSpark}
            {...(summary.responseRate < 80 ? { tone: 'warn' as const } : { seriesIndex: 2 })}
          />
        </ChartCard>
      </div>

      {/* ── Row 2 — stories 5, 6, 7. One card, two plots, one shared term axis. ── */}
      <ChartCard
        variant="normal"
        title="Program trajectory"
        description="Scores and response rate share a term axis — a dip in both at once is a sampling problem, not a quality one."
        leoInsight={trendLeo}
      >
        <ChartFigure
          label="Program trajectory"
          summary="Course content and faculty scores by term above; response rate against an 80% target below."
          dataLength={series.length}
          leoInsight={trendLeo}
        >
          {() => (
            <>
              <ProgramTrendStack series={series} />
              <ChartDataTable
                caption="Program trajectory by term"
                headers={['Term', 'Course score', 'Faculty score', 'Response rate', 'Responded', 'Enrolled']}
                rows={series.map((s) => [
                  s.term,
                  s.courseAvg != null ? fmt2(s.courseAvg) : '—',
                  s.facultyAvg != null ? fmt2(s.facultyAvg) : '—',
                  s.responseRate != null ? `${s.responseRate}%` : '—',
                  s.responded,
                  s.enrolled,
                ])}
              />
            </>
          )}
        </ChartFigure>
      </ChartCard>

      {/* ── Story 8 — the hero. Marked NEW on the task list; the legacy app had it. ── */}
      <ChartCard
        variant="normal"
        title="Course score vs faculty score"
        description="Separates a course that needs redesigning from an instructor who needs support — two problems, two different fixes."
        leoInsight={gapLeo}
      >
        <ChartFigure
          label="Course score versus faculty score"
          summary="Scatter plot. Each dot is one course in one term, sized by enrolment, split into quadrants at the program means, with a fitted trend and 95% confidence band."
          dataLength={gaps.length}
          leoInsight={gapLeo}
        >
          {() => (
            <>
              <GapQuadrant
                points={gaps}
                courseMean={courseMean}
                facultyMean={facultyMean}
                leoAnchor={anchorGap}
              />
              <ChartDataTable
                caption="Course score versus faculty score by offering"
                headers={['Course', 'Term', 'Course score', 'Faculty score', 'Enrolled']}
                rows={gaps.map((g) => [
                  `${g.courseCode} — ${g.courseName}`,
                  g.term,
                  fmt2(g.courseAvg),
                  fmt2(g.facultyAvg),
                  g.enrolled,
                ])}
              />
            </>
          )}
        </ChartFigure>
      </ChartCard>

      {/* ── Story 4 — heatmap. ── */}
      {/* Scope is stated on the card because it genuinely differs from the ranked-courses
          card below: course-CONTENT scores exist for only some courses, while faculty
          ratings exist for others. Two cards showing different course counts with no
          explanation is the "numbers disagree with each other" failure this rebuild is
          meant to end — so the scope is surfaced rather than smoothed over. */}
      <ChartCard
        variant="normal"
        title="Course quality across terms"
        description={`Content scores for ${matrix.courses.length} of ${courses.length} courses across ${matrix.terms.length} terms. Worst-scoring band at the top; blank cells are terms a course was not evaluated — absence is an accreditation signal, not a rendering gap.`}
        leoInsight={heatLeo}
      >
        <ChartFigure
          label="Course quality across terms"
          summary="Heatmap of course content score by course and term. Darker cells score higher."
          dataLength={matrix.cells.length}
          leoInsight={heatLeo}
        >
          {() => (
            <>
              <CourseTermHeat cells={matrix.cells} courses={matrix.courses} terms={matrix.terms} />
              <ChartDataTable
                caption="Course content score by course and term"
                headers={['Course', 'Term', 'Course score', 'Faculty score']}
                rows={matrix.cells.map((c) => [
                  c.courseCode,
                  c.term,
                  fmt2(c.courseAvg),
                  c.facultyAvg != null ? fmt2(c.facultyAvg) : '—',
                ])}
              />
            </>
          )}
        </ChartFigure>
      </ChartCard>

      {/* ── Stories 2 + 3 — who needs attention.
             items-start: the two charts have different row counts, and stretching the
             shorter card to match leaves a block of dead space under its plot. ── */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <ChartCard
          variant="normal"
          title="Faculty needing attention"
          description="Each arrow runs from a three-year mean to a one-year mean — direction and size in one mark."
          leoInsight={facultyDriftLeo}
        >
          <ChartFigure
            label="Faculty needing attention"
            summary="Arrow chart from each faculty member's three-year mean score to their one-year mean, sorted by change."
            dataLength={facultyDriftRows.length}
            leoInsight={facultyDriftLeo}
          >
            {() => (
              <>
                <DriftDumbbell
                  rows={facultyDriftRows}
                  emptyNote="No faculty has offerings in both the 1-year and 3-year windows yet."
                />
                <ChartDataTable
                  caption="Faculty score change, three-year mean to one-year mean"
                  headers={['Faculty', '3-year mean', '1-year mean', 'Change']}
                  rows={facultyDriftRows.map((r) => [
                    r.label,
                    r.avg3y != null ? fmt2(r.avg3y) : '—',
                    r.avg1y != null ? fmt2(r.avg1y) : '—',
                    r.drift != null ? `${r.drift >= 0 ? '+' : ''}${fmt2(r.drift)}` : '—',
                  ])}
                />
                <div className="mt-2 flex justify-end">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/analytics?tab=faculty">Open By Faculty</Link>
                  </Button>
                </div>
              </>
            )}
          </ChartFigure>
        </ChartCard>

        <ChartCard
          variant="normal"
          title="Courses needing attention"
          description="Ranked against the program median, with every offering behind each course drawn as a faint dot."
          leoInsight={courseDriftLeo}
        >
          <ChartFigure
            label="Courses needing attention"
            summary="Ranked dot plot of course scores against the program median, with every individual offering drawn behind each course's mean."
            dataLength={courses.length}
            leoInsight={courseDriftLeo}
          >
            {() => (
              <>
                {/* Story 3 asks to flag courses on LOW SCORES, not on drift — so this is the
                    ranked dot plot against the median, not the 1Y/3Y arrow chart used for
                    faculty (story 2, which does ask for the two windows). */}
                <CourseRankDots courses={courses} median={courseMedian} />
                <ChartDataTable
                  caption="Course scores against the program median"
                  headers={['Course', 'Weighted score', 'Simple mean', 'Terms', 'Response rate']}
                  rows={courses.map((c) => [
                    `${c.courseCode} — ${c.courseName}`,
                    fmt2(c.score.weighted),
                    fmt2(c.score.simple),
                    c.terms,
                    `${c.responseRate}%`,
                  ])}
                />
                <div className="mt-2 flex justify-end">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/analytics?tab=course">Open By Course</Link>
                  </Button>
                </div>
              </>
            )}
          </ChartFigure>
        </ChartCard>
      </div>
    </div>
  )
}
