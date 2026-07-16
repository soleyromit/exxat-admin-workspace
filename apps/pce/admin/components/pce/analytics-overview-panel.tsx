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
  ProgramTrendStack,
  DriftDumbbell,
  CourseRankDots,
  COURSE_RANK_LIMIT,
  KpiSpark,
  type DriftRow,
} from '@/components/pce/analytics-plots'
import { CourseTermGrid } from '@/components/pce/course-term-grid'
import { responseFunnel } from '@/lib/pce-funnel'
import { ResponseFunnelSankey } from '@/components/pce/response-funnel-sankey'
import { AnalyticsSurveyDetails } from '@/components/pce/analytics-survey-details'
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



/** Scores occupy a narrow high band; the ramp is spent there, not on 0–3 nobody scores. */
const SCORE_HEAT_DOMAIN: readonly [number, number] = [3, 5]

/**
 * §2.1 calls the three Aggregate cards "the cleverest move here: they double as a preview of
 * and a table of contents for the other three tabs. Each card's three KPIs are count /
 * average / % below benchmark — the same rhetorical shape three times, so one glance compares
 * dimensions."
 *
 * The insight is the SHAPE, not navigation. A first pass added "All 6 faculty →" CTAs under
 * each spark; wrong on both counts — a metric tile's job is to state a number, not to carry a
 * CTA, and the tab bar sits 40px above with the same three destinations. Redundant navigation
 * inside a tile is noise. The tiles keep the rhetorical shape; the tabs stay the doors.
 */
export function AnalyticsOverviewPanel() {
  const summary = useMemo(() => programSummary(), [])
  const series = useMemo(() => termSeries(), [])
  const faculty = useMemo(() => facultyStats(), [])
  const courses = useMemo(() => courseStats(), [])
  const gaps = useMemo(() => gapPoints(), [])
  const matrix = useMemo(() => courseTermMatrix(), [])

  /**
   * The heatmap at real scale.
   *
   * Romit, 2026-07-15: a program averages 10–15 courses and the viz must stay legible as courses
   * or students grow — then, seeing the result: "can't these charts have a scroll bar or expand
   * so I can explore this data more clearly?"
   *
   * That question retired the first answer. I had made the chart TRUNCATE (15 weakest, rest
   * behind a button), which trades the reader's data for the card's convenience. Every course is
   * in the grid now, always, ordered weakest-first by `courseTermMatrix`; the chart shows a
   * window of them and scrolls. Nothing is hidden and nothing is 1200px tall.
   */
  const heatRows = matrix.courses





  /* The chart draws the lowest N; its data table is the ACCESSIBLE EQUIVALENT of the chart,
     so it must list the same rows. A table of all 15 under a chart of 6 would mean the two
     halves of one figure disagreed about what the figure shows. Derived with the same sort
     the chart uses. */
  const lowestCourses = useMemo(
    () => [...courses].sort((a, b) => a.score.weighted - b.score.weighted).slice(0, COURSE_RANK_LIMIT),
    [courses],
  )

  const courseMedian = useMemo(() => medianOf(courses.map((c) => c.score.weighted)), [courses])

  const funnel = useMemo(() => responseFunnel(), [])

  const funnelLeo: ChartLeoInsight | null = useMemo(() => {
    const w = funnel.worst
    if (!w) return null
    const where =
      w.after === 'Invited'
        ? 'never opened the invitation'
        : w.after === 'Opened'
          ? 'opened it and never started'
          : 'started and abandoned'
    const fix =
      w.after === 'Invited'
        ? 'That is a deliverability or timing problem, not an opinion — students who never saw the ask cannot have declined it. Check send time and whether the invite is reaching inboxes before writing survey copy.'
        : w.after === 'Opened'
          ? 'They saw the ask and judged it not worth starting. That points at length or framing in the invitation, not at the questions themselves.'
          : 'They committed and still quit partway. That is the survey being too long or too repetitive — the only stage where the instrument itself is the suspect.'
    return {
      headline: `${w.value.toLocaleString()} students ${where} — ${w.pct}% of everyone invited`,
      explanation: `${fix} The response rate on this page counts only the final stage, so every stage above it is invisible in that one number.`,
      kind: 'anomaly',
      delta: { value: `${w.pct}%`, label: `lost after ${w.after}` },
      bullets: [
        `Invited ${funnel.counts.invited.toLocaleString()} → opened ${funnel.counts.opened.toLocaleString()} → started ${funnel.counts.started.toLocaleString()} → completed ${funnel.counts.completed.toLocaleString()}.`,
        ...funnel.lost.map((l) => `Lost after ${l.after}: ${l.value.toLocaleString()} (${l.pct}%).`),
      ],
    }
  }, [funnel])

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
        `will not move it. ${bothLow.length} course${bothLow.length === 1 ? '' : 's'} sit in the both-need-attention quadrant.`,
      kind: 'anomaly',
      delta: { value: `+${fmt2(gap)}`, label: 'faculty over course' },
      bullets: [
        `${widest.courseCode} — ${widest.courseName}: course ${fmt2(widest.courseAvg)} vs faculty ${fmt2(widest.facultyAvg)} across ${widest.terms} term${widest.terms === 1 ? '' : 's'}.`,
        `${bothLow.length} of ${gaps.length} courses are below both program means.`,
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

  /* Memoised — PlotFigure compares leoAnchor by reference in its effect deps, so a fresh
     object literal each render would re-create the chart SVG every parent render. */
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
        {/* §6 of the walkthrough — "explicit benchmarks on every KPI": the legacy app stated
            the threshold that produced each percentage (`< 4.00 avg score`), which is the one
            thing that makes a KPI auditable rather than assertive. Frequency counts, not
            percentages (Aarti D17: "4 of 6 faculty" beats "67%"). */}
        <ChartCard
          variant="kpi-chart"
          title="Average faculty score"
          description={`${summary.facultyBelowThreshold} of ${summary.facultyCount} faculty below the ${fmt2(summary.facultyMedian)} median · weighted by class size · simple mean ${fmt2(summary.facultyScore.simple)}`}
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
          description={`${summary.coursesBelowThreshold} of ${summary.courseCount} courses below the ${fmt2(summary.courseMedian)} median · course content only · simple mean ${fmt2(summary.courseScore.simple)}`}
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
          description={`${summary.termsBelowTarget} of ${summary.termCount} terms below the 80% target · ${summary.responded.toLocaleString()} of ${summary.enrolled.toLocaleString()} students responded`}
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

      {/* RANK comes second, before any pattern chart. §2.1 is explicit that Overview is a
          deliberate aggregate → rank → pattern → raw funnel, and this row used to sit at the
          very bottom: the reader got four abstract pattern charts before being told WHO needs
          attention. Rank is the actionable answer; the patterns below exist to explain it,
          which only works if you already know who you are explaining. */}
      {/* ── Stories 2 + 3 — who needs attention.
             items-start: the two charts have different row counts, and stretching the
             shorter card to match leaves a block of dead space under its plot. ── */}
      {/* The two titles name which QUESTION each answers. They used to both read
          "… needing attention", promising the same thing while the charts answered
          differently: this pair is drift (who MOVED) and rank (who is LOW). Under parallel
          titles their amber meant different things — declining on the left, below-median on
          the right — so a faculty member could be amber-left while comfortably above the
          median. The doc calls that exact asymmetry a defect in the legacy app (§7: the two
          leaderboards were "incomplete in OPPOSITE directions"); we had rebuilt a version of
          it. Each description now also says what its chart does NOT tell you. */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <ChartCard
          variant="normal"
          /* NOT "Faculty who are slipping". It listed six people of whom four were RISING
             (+0.03 to +0.11) — a title that promises slippers and delivers a roster is the
             same lie "Courses scoring lowest" was telling one card over. The honest framing
             is the question the chart answers: which way is each person moving. The amber
             arrow and the Leo do the flagging, and "5 of 6 are holding or improving" is
             genuinely the news here — filtering to the one faller would hide it. */
          title="Which way each faculty is moving"
          description="Each arrow runs from a faculty member's own three-year mean to their one-year mean, so the axis is the change itself — not the score. Amber is a fall; this says nothing about who is lowest."
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
          title="Courses scoring lowest"
          description={`The ${Math.min(COURSE_RANK_LIMIT, courses.length)} weakest of ${courses.length}, worst first, against the program median — every offering behind each course drawn as a faint dot. Amber is below the median; this says nothing about who is falling. Open By Course for the full list.`}
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
                  caption={`The ${Math.min(COURSE_RANK_LIMIT, courses.length)} lowest-scoring courses against the program median`}
                  headers={['Course', 'Weighted score', 'Simple mean', 'Terms', 'Response rate']}
                  rows={lowestCourses.map((c) => [
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

      {/* ── Row 2 — stories 5/6/7 beside story 8, 50/50.
             Romit: "line charts don't have to cover 100% width — it doesn't look good."
             He's right twice over: a line stretched across the full content column flattens
             its own slope, which is the one thing the chart exists to show; and the scatter
             beside it WANTS to be square — at full width the x-distance between two dots is
             visually ~2x the y-distance for the same score difference, which quietly lies
             about the gap the chart is entirely about. ── */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
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
        description="One dot per course, split by the two medians. A course scoring well says almost nothing about how its instructor scores — which is exactly why this is a quadrant and not a trend line, and why a course that needs redesigning and an instructor who needs support are two problems with two different fixes."
        leoInsight={gapLeo}
      >
        <ChartFigure
          label="Course score versus faculty score"
          summary="Scatter plot. Each dot is one course, sized by total enrolment, split into quadrants at the program means, with a fitted trend and 95% confidence band."
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
                caption="Course score versus faculty score, by course"
                headers={['Course', 'Terms', 'Course score', 'Faculty score', 'Enrolled']}
                rows={gaps.map((g) => [
                  `${g.courseCode} — ${g.courseName}`,
                  g.terms,
                  fmt2(g.courseAvg),
                  fmt2(g.facultyAvg),
                  g.enrolled,
                ])}
              />
            </>
          )}
        </ChartFigure>
      </ChartCard>

      </div>

      {/* Where the response rate leaks — VIZ-009: "sequential stages with attrition must use
          flow viz, not separated count cards. Drop-off is the story." The 71% above is four
          different problems depending on WHERE it fails, and each has a different fix:
          never opened = deliverability or timing; opened-never-started = the ask looked too
          long; started-abandoned = it WAS too long. Nothing else on this page can tell them
          apart. Full width: a sankey needs horizontal room for its stages to breathe. */}
      <ChartCard
        variant="normal"
        title="Where responses are lost"
        description={
          funnel.worst
            ? `Biggest leak: ${funnel.worst.after === 'Invited' ? 'students who never opened the invitation' : funnel.worst.after === 'Opened' ? 'students who opened it but never started' : 'students who started and abandoned'} — ${funnel.worst.value.toLocaleString()} students, ${funnel.worst.pct}% of everyone invited.`
            : 'Every invited student completed the survey.'
        }
        leoInsight={funnelLeo}
      >
        <ChartFigure
          label="Where responses are lost"
          summary={`Flow diagram of ${funnel.counts.invited.toLocaleString()} invited students through opened, started and completed, with the drop-off at each stage.`}
          dataLength={4}
          leoInsight={funnelLeo}
        >
          {() => (
            <>
              <ResponseFunnelSankey funnel={funnel} />
              {/* The pattern requires a one-line takeaway naming the largest drop-off.
                  Frequency counts, not percentages alone — Aarti D17. */}
              {funnel.worst && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Largest drop-off: after <span className="font-medium text-foreground">{funnel.worst.after}</span> —{' '}
                  {funnel.worst.value.toLocaleString()} of {funnel.counts.invited.toLocaleString()} students ({funnel.worst.pct}%).
                </p>
              )}
              <ChartDataTable
                caption="Response funnel"
                headers={['Stage', 'Students', 'Lost after this stage']}
                rows={[
                  ['Invited', funnel.counts.invited, funnel.counts.invited - funnel.counts.opened],
                  ['Opened', funnel.counts.opened, funnel.counts.opened - funnel.counts.started],
                  ['Started', funnel.counts.started, funnel.counts.started - funnel.counts.completed],
                  ['Completed', funnel.counts.completed, 0],
                ]}
              />
            </>
          )}
        </ChartFigure>
      </ChartCard>

      {/* ── Story 4 — heatmap. Stays FULL width: the mark needs its term columns, and a
             matrix squeezed to half is unreadable. Width is earned per chart, not uniform. ── */}
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
              {/*
                The DS OS heatmap (`components/chart-heatmap.tsx`, ECharts), not a hand-rolled
                Plot one. It was vendored into this app and had ZERO callers while I built
                `CourseTermHeat` alongside it — the DS shipped the component and I re-made it.
                Romit, 2026-07-15: use the DS heatmap.

                WIDTH IS THE DESIGN HERE. A heatmap is a grid of squares, and squares have an
                intrinsic size — stretched across a 1600px card, 5 terms become 300px-wide
                lozenges and the grid stops reading as a matrix. So the figure is capped at its
                natural width (cols x cell + row labels) and left-aligned, rather than filling
                the column because the column exists.
              */}
              {/*
                The tinted DataTable — Romit picked it over the ECharts canvas after seeing both.

                The deciding evidence was not taste. axe on identical data: the canvas reported 0
                violations and the grid reported 34 serious color-contrast failures — and the
                canvas's zero was FALSE. axe cannot see inside a canvas; ECharts labels are
                painted pixels, so both variants had the same failures and only one could say so.
                A chart that cannot be audited cannot be trusted to be accessible.

                Everything else followed: row labels that cannot be dropped for lack of space, a
                table that scrolls like a table, sortable columns, selectable text, no
                aria-label-on-a-div, no pixel overlay covering the worst cell, and no parallel
                sr-only table to keep in sync — the grid IS the accessible artefact.

                Width still matters here, but the table solves it natively: the course column
                takes the text it needs and the term columns are fixed, so nothing stretches into
                lozenges the way a 5-column canvas did across a 1360px card.
              */}
              <div className="-mx-4 lg:-mx-6">
                <CourseTermGrid
                  courses={heatRows}
                  terms={matrix.terms}
                  cells={matrix.cells}
                  domain={SCORE_HEAT_DOMAIN}
                />
              </div>

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


      {/* RAW — the last step of §2.1's aggregate → rank → pattern → raw funnel, and the door
          to Monil's "final node": the single-survey result. Every chart above explains this
          table; without it the tab explains something you cannot reach. */}
      <AnalyticsSurveyDetails />
    </div>
  )
}
