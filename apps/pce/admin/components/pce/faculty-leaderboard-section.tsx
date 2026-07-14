'use client'

/**
 * Analytics → By Faculty, the all-faculty half: leaderboard + cross-faculty trend.
 *
 * ⚠️ ADMIN-ONLY BY CONSTRUCTION. This must never be rendered on the faculty self-view.
 * `course-evaluation.md` §7.3 bans, for `/course-eval/me`, verbatim:
 *   ❌ Cleveland dot plot of faculty rankings (by name)
 *   ❌ Faculty leaderboard
 *   ❌ Any peer-comparison metric ("you're at the 60th percentile" included — that
 *      reverse-encodes peer rank)
 * That is why this lives in its own file rather than inside `ByFacultyPanel`: the panel is
 * shared with `/my-dashboard`, which IS the self-view, so anything added there leaks peer
 * rankings to faculty. Keep the boundary at the file level where it is hard to cross by
 * accident.
 *
 * Placement follows three independent sources that agree: Aarti's D5 ("faculty is one click
 * down" — so the leaderboard is not on the program Overview), the accepted 2026-07-13
 * decision ("By-Faculty … is the most important"), and Monil pointing at the legacy app's
 * Overview leaderboard: "This should be in faculty."
 */

import { useMemo } from 'react'
import {
  ChartCard,
  ChartFigure,
  ChartDataTable,
  type ChartLeoInsight,
} from '@/components/charts-overview'
import { FacultyLeaderboardDots, FacultyCompareLines } from '@/components/pce/analytics-plots'
import { facultyStats, facultyTermSeries, medianOf, benchmarks } from '@/lib/pce-analytics'

const fmt2 = (v: number) => v.toFixed(2)

export function FacultyLeaderboardSection({
  onSelectFaculty,
}: {
  onSelectFaculty?: (facultyId: string) => void
}) {
  const faculty = useMemo(() => facultyStats(), [])
  const median = useMemo(() => medianOf(faculty.map((f) => f.score.weighted)), [faculty])
  const series = useMemo(() => facultyTermSeries(), [])
  const bench = useMemo(() => benchmarks(), [])

  /* ── Story 10 — the leaderboard, as a dot plot with each person's spread behind them. ── */
  const leaderLeo: ChartLeoInsight | null = useMemo(() => {
    if (faculty.length < 2) return null
    const below = faculty.filter((f) => f.score.weighted < median)
    const lowest = faculty[faculty.length - 1]!
    // Widest spread = least consistent, which a ranked bar chart cannot show at all.
    const widest = [...faculty]
      .filter((f) => f.ratings.length > 1)
      .sort(
        (a, b) =>
          (Math.max(...b.ratings) - Math.min(...b.ratings)) -
          (Math.max(...a.ratings) - Math.min(...a.ratings)),
      )[0]
    const spread = widest ? Math.max(...widest.ratings) - Math.min(...widest.ratings) : 0
    return {
      // Frequency count, not a percentage — Aarti D17.
      headline: `${below.length} of ${faculty.length} faculty sit below the ${fmt2(median)} median`,
      explanation:
        widest && spread >= 0.4
          ? `${widest.name} has the widest spread — ${fmt2(spread)} between their best and worst offering. ` +
            `A mean hides that: someone steady at ${fmt2(widest.score.weighted)} and someone swinging ${fmt2(spread)} ` +
            `around the same mean are different conversations. Read the faint dots, not just the solid one.`
          : `Every faculty member's offerings cluster tightly around their mean, so the ranking is stable — ` +
            `no one here is being averaged out of a problem.`,
      kind: below.length > 0 ? 'anomaly' : 'trend',
      delta: { value: fmt2(lowest.score.weighted), label: `lowest — ${lowest.name}` },
      bullets: [
        `${lowest.name}: ${fmt2(lowest.score.weighted)} weighted across ${lowest.offerings} offering${lowest.offerings === 1 ? '' : 's'}.`,
        `Median ${fmt2(median)} · department mean ${fmt2(bench.department)}.`,
        'Faint dots are individual offerings; the solid dot is the class-size-weighted mean.',
      ],
      anchor: { yValue: lowest.score.weighted },
    }
  }, [faculty, median, bench])

  /* ── Story 9 — faculty against each other over time. ── */
  const compareLeo: ChartLeoInsight | null = useMemo(() => {
    if (!series.length) return null
    const terms = [...new Set(series.map((s) => s.short))]
    return {
      headline: `${new Set(series.map((s) => s.facultyId)).size} faculty tracked across ${terms.length} terms`,
      explanation:
        `One panel each rather than six lines on one chart: the DS ships five series colours, so a sixth ` +
        `faculty would silently reuse one and two people would look like the same line. Peers stay ghosted ` +
        `behind each panel, and the dashed rule is the program mean — so "above or below" reads without a legend.`,
      kind: 'trend',
      delta: { value: fmt2(bench.university), label: 'program mean' },
      bullets: [
        `Program mean ${fmt2(bench.university)}/5 across all offerings.`,
        `Department mean ${fmt2(bench.department)}/5.`,
      ],
      anchor: { yValue: bench.university },
    }
  }, [series, bench])

  const lowest = faculty[faculty.length - 1]

  /**
   * Memoised: `PlotFigure` lists `leoAnchor` in its effect deps, and object literals compare
   * by reference — a fresh `{x, y}` each render would tear down the SVG and re-run
   * `Plot.plot()` on every parent render (DOM thrash + a visible repaint).
   */
  const leaderAnchor = useMemo(
    () => (lowest ? { x: lowest.score.weighted, y: lowest.name } : undefined),
    [lowest],
  )

  return (
    <div className="flex flex-col gap-4">
      <h2 className="sr-only">All faculty</h2>

      <ChartCard
        variant="normal"
        title="Faculty leaderboard"
        description="Each faculty member's class-size-weighted mean, with every one of their offerings drawn behind it — so a steady 4.2 and a volatile 4.2 stop looking identical."
        leoInsight={leaderLeo}
      >
        <ChartFigure
          label="Faculty leaderboard"
          summary="Ranked dot plot of faculty scores against the program median, with each faculty member's individual offering scores drawn as faint dots behind their weighted mean."
          dataLength={faculty.length}
          leoInsight={leaderLeo}
        >
          {() => (
            <>
              <FacultyLeaderboardDots faculty={faculty} median={median} leoAnchor={leaderAnchor} />
              <ChartDataTable
                caption="Faculty scores against the program median"
                headers={['Faculty', 'Weighted score', 'Simple mean', 'Offerings', 'Courses', 'Response rate']}
                rows={faculty.map((f) => [
                  f.name,
                  fmt2(f.score.weighted),
                  fmt2(f.score.simple),
                  f.offerings,
                  f.courses,
                  `${f.responseRate}%`,
                ])}
              />
            </>
          )}
        </ChartFigure>
      </ChartCard>

      <ChartCard
        variant="normal"
        title="Faculty scores over time"
        description="One panel per faculty member, every peer ghosted behind them, all on the same axis. A break in a line is a term they did not teach."
        leoInsight={compareLeo}
      >
        <ChartFigure
          label="Faculty scores over time"
          summary="Small multiples: one panel per faculty member showing their score by term against a dashed program-mean reference line, with all other faculty drawn faintly behind for context."
          dataLength={series.length}
          leoInsight={compareLeo}
        >
          {() => (
            <>
              <FacultyCompareLines rows={series} programMean={bench.university} />
              <ChartDataTable
                caption="Faculty score by term"
                headers={['Faculty', 'Term', 'Score']}
                rows={series.map((s) => [s.name, s.term, fmt2(s.rating)])}
              />
            </>
          )}
        </ChartFigure>
      </ChartCard>
    </div>
  )
}
