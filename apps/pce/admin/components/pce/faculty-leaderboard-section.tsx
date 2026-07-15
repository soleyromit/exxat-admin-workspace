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

import { useMemo, useState } from 'react'
import {
  Button, ScrollRegion,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@exxatdesignux/ui'
import {
  ChartCard,
  ChartFigure,
  ChartDataTable,
  type ChartLeoInsight,
} from '@/components/charts-overview'
import {
  FacultyLeaderboardDots, FacultyCompareLines, ResponseCompareLines,
  FacultyScoreStrip, LARGE_ROSTER_N,
} from '@/components/pce/analytics-plots'
import {
  facultyStats, facultyTermSeries, facultyResponseSeries, medianOf, benchmarks, termSeries,
  RESPONSE_TARGET,
} from '@/lib/pce-analytics'

const fmt2 = (v: number) => v.toFixed(2)

const ALL_TERMS = '__all__'

/** How many faculty the collapsed card lists — the lowest scorers, the only actionable ones. */
const LOWEST_SHOWN = 5

/** ~8 rows. Enough to read a run of the roster without the card header leaving the screen. */
const EXPANDED_LIST_MAX_H = 420

export function FacultyLeaderboardSection({
  term,
  onTermChange,
  onSelectFaculty,
}: {
  /** Scoped term, or undefined for all terms. */
  term?: string
  onTermChange?: (term: string | undefined) => void
  /** Drill into one faculty member — the "view insights" step. */
  onSelectFaculty?: (facultyId: string) => void
}) {
  /**
   * Term scope. Monil, on these tables: "Filters are global — scope to a term or span all
   * terms." An all-time-only leaderboard cannot answer "who struggled THIS term", which is
   * the question an admin arrives with at term close.
   *
   * The terms offered are only those that HAVE data — a dropdown listing terms that render
   * an empty board is the legacy app's "term dropdown ≠ term table" bug (§4.7).
   */
  const termOptions = useMemo(
    () => termSeries().filter((t) => t.enrolled > 0).map((t) => t.term).reverse(),
    [],
  )

  const faculty = useMemo(() => facultyStats(term), [term])
  const median = useMemo(() => medianOf(faculty.map((f) => f.score.weighted)), [faculty])

  /**
   * Scale, and the expand pattern it forces.
   *
   * `LARGE_ROSTER_N` is the rubric's own N≤30 boundary for a Cleveland dot, not a number I
   * picked. Below it nothing changes — the ranked dot plot and the full row list are still the
   * best answer, and a roster of 8 gains nothing from an expand control. Above it the card has
   * to summarise or it stops being a card.
   */
  const isLarge = faculty.length > LARGE_ROSTER_N
  const [expanded, setExpanded] = useState(false)

  /* `facultyStats` sorts best-first, so the LAST rows are the ones worth acting on. Collapsed,
     show those — the top of a best-first list is precisely the people who need nothing. */
  const collapsedRows = useMemo(
    () => (isLarge && !expanded ? faculty.slice(-LOWEST_SHOWN).reverse() : faculty),
    [faculty, isLarge, expanded],
  )
  const series = useMemo(() => facultyTermSeries(), [])
  const responseSeries = useMemo(() => facultyResponseSeries(), [])
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

  /* ── §2.2's SECOND trend — response rate across the roster. ── */
  const responseLeo: ChartLeoInsight | null = useMemo(() => {
    if (!responseSeries.length) return null
    const below = responseSeries.filter((r) => r.responseRate < RESPONSE_TARGET)
    const byFaculty = new Map<string, number[]>()
    responseSeries.forEach((r) => byFaculty.set(r.name, [...(byFaculty.get(r.name) ?? []), r.responseRate]))
    const worst = [...byFaculty.entries()]
      .map(([name, rates]) => ({ name, mean: rates.reduce((s, v) => s + v, 0) / rates.length }))
      .sort((a, b) => a.mean - b.mean)[0]!
    return {
      // Frequency count, not a percentage — Aarti D17.
      headline: `${below.length} of ${responseSeries.length} faculty-terms came in under the ${RESPONSE_TARGET}% target`,
      explanation:
        `${worst.name} averages ${worst.mean.toFixed(0)}% across their terms — the lowest on the roster. ` +
        `A collection problem is not a teaching problem, and the leaderboard above will not surface it: a ` +
        `faculty member can be rated perfectly well by the handful of students who answered.`,
      kind: below.length > 0 ? 'dip' : 'trend',
      delta: { value: `${worst.mean.toFixed(0)}%`, label: `lowest — ${worst.name}` },
      bullets: [
        `${worst.name}: ${worst.mean.toFixed(0)}% average response.`,
        `Target ${RESPONSE_TARGET}% · ${below.length} of ${responseSeries.length} faculty-terms below it.`,
      ],
      anchor: { yValue: worst.mean },
    }
  }, [responseSeries])

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

      {/* Global term scope for the tables below — Monil: "scope to a term or span all terms". */}
      <div className="flex items-center gap-3">
        <label className="shrink-0 text-sm text-muted-foreground" htmlFor="leaderboard-term">
          Scope
        </label>
        <Select
          value={term ?? ALL_TERMS}
          onValueChange={(v) => onTermChange?.(v === ALL_TERMS ? undefined : v)}
        >
          <SelectTrigger id="leaderboard-term" className="h-8 w-44 text-sm" aria-label="Scope the leaderboard to a term">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_TERMS}>All terms</SelectItem>
            {termOptions.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {term
            ? `${faculty.length} faculty taught in ${term}.`
            : `${faculty.length} faculty across all terms — 1-year and 3-year windows always span full history.`}
        </p>
      </div>

      <ChartCard
        variant="normal"
        title="Faculty leaderboard"
        description={
          isLarge && !expanded
            ? `${faculty.length} faculty${term ? ` in ${term}` : ''}. Every one is a tick — where they pile up is the body of the roster; a tick out on its own is the person to open. Expand for the ranked view.`
            : term
              ? `${term} only. Each faculty member's class-size-weighted mean, with that term's offerings drawn behind it.`
              : 'Each faculty member\'s class-size-weighted mean, with every one of their offerings drawn behind it — so a steady 4.2 and a volatile 4.2 stop looking identical.'
        }
        leoInsight={leaderLeo}
      >
        <ChartFigure
          label="Faculty leaderboard"
          summary={
            isLarge && !expanded
              ? `Strip plot of all ${faculty.length} faculty scores against the program median of ${fmt2(median)}. The ${collapsedRows.length} lowest are listed below; expand for the full ranked view.`
              : 'Ranked dot plot of faculty scores against the program median, with each faculty member\'s individual offering scores drawn as faint dots behind their weighted mean.'
          }
          dataLength={faculty.length}
          leoInsight={leaderLeo}
        >
          {() => (
            <>
              {/*
                The summary→expand pattern, per Romit's 2026-07-15 review: a short crisp idea
                first, then an enlarged view and a grid on expand — the monday.com widget shape.

                The mark switches with N because the rubric switches with N: `cleveland-dot.md:25`
                gives the dot plot to N≤30 and a strip to anything larger. At 34 the ranked dot
                plot is 34 labelled rows, which is not a summary of anything — you have to read
                all of it to learn one thing. The strip answers "how is the roster doing" in one
                line and hands the ranked view to whoever asks for it.

                Six faculty is why this never surfaced: the fixture was smaller than the rule.
              */}
              {isLarge && !expanded ? (
                <FacultyScoreStrip faculty={faculty} median={median} />
              ) : (
                <FacultyLeaderboardDots faculty={faculty} median={median} leoAnchor={leaderAnchor} />
              )}

              {/* Every aggregate is a door (§3 of the walkthrough): the leaderboard's whole
                  job is to end in "view insights → the entire view opens only for Dr. Sandra"
                  (Monil). A ranked chart you cannot click is a poster. Rows are also the
                  keyboard path to the drill-down — the plot itself is aria-hidden, so the
                  navigable affordance has to be real DOM.

                  Collapsed, the rows are the LOWEST few rather than the first few: the card's
                  question is who needs attention, and `facultyStats` sorts best-first, so the
                  head of the list is the people you never have to open. */}
              {/* Expanded, 34 rows is ~1700px of list. Capping the viewport keeps the strip and
                  the card header on screen while you read down the roster — an expand that
                  scrolls its own context away has just moved the problem.

                  ScrollRegion, not `style={{overflowY:'auto'}}` on the <ul>: a clipped overflow
                  container that isn't a DS primitive fails axe `scrollable-region-focusable`,
                  because a keyboard user cannot focus it to scroll it. The DS ships the wrapper
                  precisely for this. */}
              <ScrollRegion
                label={`All ${faculty.length} faculty, ranked`}
                className="mt-2"
                style={expanded ? { maxHeight: EXPANDED_LIST_MAX_H, overflowY: 'auto' } : undefined}
              >
              <ul className="flex flex-col">
                {collapsedRows.map((f) => (
                  <li
                    key={f.facultyId}
                    className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-border py-1.5 last:border-b-0"
                  >
                    <span className="truncate text-sm">{f.name}</span>
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {fmt2(f.score.weighted)}
                      {f.score.weighted < median && (
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
              </ScrollRegion>

              {/* No silent caps — the control says exactly what is being withheld and what
                  expanding will show, so a truncated list never reads as the whole roster.
                  Expanded, the roster SCROLLS rather than growing the page to 2889px: the point
                  of expanding is to explore the list, not to lose the chart above it off the top
                  of the screen. */}
              {isLarge && (
                <div className="mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpanded((v) => !v)}
                    aria-expanded={expanded}
                  >
                    {expanded
                      ? `Show the ${LOWEST_SHOWN} lowest only`
                      : `Show all ${faculty.length} faculty`}
                  </Button>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {expanded
                      ? `All ${faculty.length} faculty, ranked best first — scroll the list.`
                      : `Showing the ${collapsedRows.length} lowest of ${faculty.length}. The strip above is all ${faculty.length}.`}
                  </p>
                </div>
              )}

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

      {/*
        The two trends are a PAIR, and the pairing is the point — so they sit side by side with
        their panels in the same faculty order, and you read ACROSS one person: score on the
        left, collection on the right.

        They answer different questions with different fixes. A low score is a coaching
        conversation. A low response rate is a reminder — and the leaderboard cannot surface it,
        because someone can be rated perfectly well by the handful of students who answered.
        Stacked full-width (where these started) you must hold panel 4 of chart 1 in your head
        while scrolling to panel 4 of chart 2; the comparison never happens. Side by side it is
        one saccade. This is also Romit's width rule: a line chart does not earn 100%.
      */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          variant="normal"
          title="Scores over time"
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

        <ChartCard
          variant="normal"
          title="Response rate over time"
          description={`The same six people, same order — read across. A low rate is a collection problem, not a teaching one, and the fix is a reminder rather than a conversation.`}
          leoInsight={responseLeo}
        >
          <ChartFigure
            label="Faculty response rate over time"
            summary={`Small multiples: one panel per faculty member showing their response rate by term against a ${RESPONSE_TARGET}% target, with all other faculty drawn faintly behind for context.`}
            dataLength={responseSeries.length}
            leoInsight={responseLeo}
          >
            {() => (
              <>
                <ResponseCompareLines
                  rows={responseSeries.map((r) => ({ ...r, label: r.name }))}
                  target={RESPONSE_TARGET}
                />
                <ChartDataTable
                  caption="Faculty response rate by term"
                  headers={['Faculty', 'Term', 'Response rate']}
                  rows={responseSeries.map((r) => [r.name, r.term, `${r.responseRate}%`])}
                />
              </>
            )}
          </ChartFigure>
        </ChartCard>
      </div>
    </div>
  )
}
