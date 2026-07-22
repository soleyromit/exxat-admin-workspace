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
  facultyStats, facultyTermSeries, facultyResponseSeries, facultyEvalRoleOptions,
  medianOf, benchmarks, termSeries,
  RESPONSE_TARGET, type FacultyEvalRoleId,
} from '@/lib/pce-analytics'
import { ChartCardActions, CHART_CARD_PLOT_PX } from '@/components/pce/chart-card-actions'
import { EntityTrendExplorer } from '@/components/pce/entity-trend-explorer'

const fmt2 = (v: number) => v.toFixed(2)

const ALL_TERMS = '__all__'
const ALL_ROLES = '__all__'

/** How many faculty the collapsed card lists — the lowest scorers, the only actionable ones. */
const LOWEST_SHOWN = 5

export function FacultyLeaderboardSection({
  term,
  onTermChange,
  role,
  onRoleChange,
  onSelectFaculty,
}: {
  /** Scoped term, or undefined for all terms. */
  term?: string
  onTermChange?: (term: string | undefined) => void
  /** Scoped course-association role, or undefined for all roles. */
  role?: FacultyEvalRoleId
  onRoleChange?: (role: FacultyEvalRoleId | undefined) => void
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

  /**
   * Role scope, beside the term scope — same global-filter grammar (Monil: "Filters are
   * global on these tables"). The question it answers is fairness: a Lab Assistant ranked
   * against a Course Coordinator on one board is comparing different jobs, and the person
   * who looks "lowest" may just hold the hardest role. The vocabulary is the COURSE-
   * ASSOCIATION role (2026-05-19, Monil: roles derive from course associations, not
   * faculty rank) — the same person can appear under different roles in different terms.
   */
  const roleOptions = useMemo(() => facultyEvalRoleOptions(), [])
  const roleLabel = roleOptions.find((r) => r.id === role)?.label

  const faculty = useMemo(() => facultyStats(term, undefined, role), [term, role])
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

  /* `facultyStats` sorts best-first, so the LAST rows are the ones worth acting on. The card
     always shows those; the full roster lives behind Expand like every sibling card. */
  const collapsedRows = useMemo(
    () => (isLarge ? faculty.slice(-LOWEST_SHOWN).reverse() : faculty),
    [faculty, isLarge],
  )
  const series = useMemo(() => facultyTermSeries(role), [role])
  const responseSeries = useMemo(() => facultyResponseSeries(role), [role])

  /* Movers — who the trend cards NAME (decided with Romit, 2026-07-15: highlight-spaghetti).
   *
   * The cards render every faculty member on one shared axis as ghost context; ink and a label
   * go only to the 3 largest moves. The previous design faceted one 76px panel per person
   * (34 people → a 2,600px wall), then "fixed" it by slicing to 5 — which answered nothing.
   * Null drift never counts as a move: a fake flat line is worse than absence.
   */
  const scoreMovers = useMemo(() => {
    return faculty
      .filter((f) => f.drift != null)
      .sort((a, b) => Math.abs(b.drift as number) - Math.abs(a.drift as number))
      .slice(0, 3)
      .map((f) => f.name)
  }, [faculty])

  const driftCounts = useMemo(() => {
    const d = faculty.map((f) => f.drift).filter((v): v is number => v != null)
    return {
      falling: d.filter((v) => v < -0.05).length,
      rising: d.filter((v) => v > 0.05).length,
      steady: d.filter((v) => Math.abs(v) <= 0.05).length,
    }
  }, [faculty])

  /** Latest response rate per faculty; the 3 lowest get the ink on the response card. */
  const latestResponse = useMemo(() => {
    const latest = new Map<string, { year: number; rate: number }>()
    for (const r of responseSeries) {
      const prev = latest.get(r.name)
      if (!prev || r.year > prev.year) latest.set(r.name, { year: r.year, rate: r.responseRate })
    }
    return latest
  }, [responseSeries])
  const responseMovers = useMemo(
    () => [...latestResponse.entries()].sort((a, b) => a[1].rate - b[1].rate).slice(0, 3).map(([n]) => n),
    [latestResponse],
  )

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

      {/* Global scope for the tables below — Monil: "scope to a term or span all terms".
          Role sits beside term with the same grammar: both are global filters over the
          leaderboard AND the two trend cards, never over the individual portfolio below. */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="shrink-0 text-sm text-muted-foreground" htmlFor="leaderboard-term">
          Scope
        </label>
        <Select
          value={term ?? ALL_TERMS}
          onValueChange={(v) => onTermChange?.(v === ALL_TERMS ? undefined : v)}
          /* An enabled dropdown whose only option is "All terms" promises a choice that
             doesn't exist (state-review) — disable until there is data to scope to. */
          disabled={termOptions.length === 0}
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
        <label className="shrink-0 text-sm text-muted-foreground" htmlFor="leaderboard-role">
          Role
        </label>
        <Select
          value={role ?? ALL_ROLES}
          onValueChange={(v) => onRoleChange?.(v === ALL_ROLES ? undefined : (v as FacultyEvalRoleId))}
          /* Same state-review rule as the term scope: no options → no promise. */
          disabled={roleOptions.length === 0}
        >
          <SelectTrigger id="leaderboard-role" className="h-8 w-44 text-sm" aria-label="Scope the leaderboard to a role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_ROLES}>All roles</SelectItem>
            {roleOptions.map((r) => (
              <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {term
            ? `${faculty.length} faculty ${roleLabel ? `taught as ${roleLabel}` : 'taught'} in ${term}.`
            : `${faculty.length} faculty ${roleLabel ? `as ${roleLabel} ` : ''}across all terms — 1-year and 3-year windows always span full history.`}
        </p>
      </div>

      <ChartCard
        variant="normal"
        title="Faculty leaderboard"
        description={`${faculty.length} faculty${roleLabel ? ` · ${roleLabel}` : ''}${term ? ` · ${term}` : ''} · vs the ${fmt2(median)} median`}
        leoInsight={leaderLeo}
      >
        <ChartFigure
          label="Faculty leaderboard"
          summary={
            isLarge
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
              {!faculty.length ? (
                /* A term can have enrollment but no closed CE surveys — the chart and roster
                   would both render empty with no explanation (state-review round 2). */
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No faculty evaluated{roleLabel ? ` as ${roleLabel}` : ''} in {term ?? 'any term'} yet.
                </p>
              ) : isLarge ? (
                <FacultyScoreStrip faculty={faculty} median={median} leoAnchor={leaderAnchor} />
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

              {/* No silent caps — the caption says what is withheld; Expand shows it. The old
                  in-place "Show all 34" toggle was the ONE card on the surface with a different
                  expand grammar than its siblings (correlation review, 2026-07-15) — the dialog
                  leads with the same ranked dot plot, denser, per the correlation rule. */}
              {isLarge && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Showing the {collapsedRows.length} lowest of {faculty.length}. The strip above
                  is all {faculty.length} — Expand for the full ranked list.
                </p>
              )}
              <ChartCardActions
                title="Faculty leaderboard"
                description={
                  faculty.length
                    ? `All ${faculty.length} faculty ranked against the ${fmt2(median)} median — every offering behind each mean as a faint dot.`
                    : 'No faculty evaluated in this scope yet.'
                }
                detail={
                  <FacultyLeaderboardDots
                    faculty={faculty}
                    median={median}
                    height={Math.max(260, faculty.length * 34 + 40)}
                  />
                }
                table={{
                  headers: ['Faculty', 'Weighted score', 'Simple mean', 'Offerings', 'Courses', 'Response rate'],
                  rows: faculty.map((f) => [
                    f.name,
                    fmt2(f.score.weighted),
                    fmt2(f.score.simple),
                    f.offerings,
                    f.courses,
                    `${f.responseRate}%`,
                  ]),
                }}
              />

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
          description={`${driftCounts.falling} falling · ${driftCounts.steady} steady · ${driftCounts.rising} rising · biggest moves labelled`}
          leoInsight={compareLeo}
        >
          <ChartFigure
            label="Faculty scores over time"
            summary="All faculty scores by term on one shared axis against a dashed program-mean reference line; the largest movers are highlighted and labelled."
            dataLength={series.length}
            leoInsight={compareLeo}
          >
            {() => (
              <>
                <FacultyCompareLines
                  mode="shared"
                  rows={series}
                  programMean={bench.university}
                  highlight={scoreMovers}
                  height={CHART_CARD_PLOT_PX}
                />
                <ChartDataTable
                  caption="Faculty score by term"
                  headers={['Faculty', 'Term', 'Score']}
                  rows={series.map((s) => [s.name, s.term, fmt2(s.rating)])}
                />
                <ChartCardActions
                  title="Scores over time"
                  description={`Every faculty member's score by term against the ${fmt2(bench.university)} program mean. Select a person to trace their line.`}
                  detail={
                    <EntityTrendExplorer
                      entityNoun="faculty"
                      entities={faculty.map((f) => ({
                        id: f.facultyId,
                        label: f.name,
                        value: fmt2(f.score.weighted),
                        sortValue: f.score.weighted,
                        trend:
                          f.drift == null ? null : f.drift < -0.05 ? 'down' : f.drift > 0.05 ? 'up' : 'flat',
                      }))}
                      renderChart={(selected) => (
                        <FacultyCompareLines
                          mode="shared"
                          rows={series}
                          programMean={bench.university}
                          highlight={selected ? [selected] : scoreMovers}
                          height={380}
                        />
                      )}
                      table={{
                        headers: ['Faculty', 'Term', 'Score'],
                        rows: series.map((s) => [s.name, s.term, fmt2(s.rating)]),
                      }}
                    />
                  }
                  table={{
                    headers: ['Faculty', 'Term', 'Score'],
                    rows: series.map((s) => [s.name, s.term, fmt2(s.rating)]),
                  }}
                />
              </>
            )}
          </ChartFigure>
        </ChartCard>

        <ChartCard
          variant="normal"
          title="Response rate over time"
          description={`The ${responseMovers.length} lowest collection rates labelled · target ${RESPONSE_TARGET}%`}
          leoInsight={responseLeo}
        >
          <ChartFigure
            label="Faculty response rate over time"
            summary={`All faculty response rates by term on one shared axis against a ${RESPONSE_TARGET}% target; the lowest collectors are highlighted and labelled.`}
            dataLength={responseSeries.length}
            leoInsight={responseLeo}
          >
            {() => (
              <>
                <ResponseCompareLines
                  mode="shared"
                  rows={responseSeries.map((r) => ({ ...r, label: r.name }))}
                  target={RESPONSE_TARGET}
                  highlight={responseMovers}
                  height={CHART_CARD_PLOT_PX}
                />
                <ChartDataTable
                  caption="Faculty response rate by term"
                  headers={['Faculty', 'Term', 'Response rate']}
                  rows={responseSeries.map((r) => [r.name, r.term, `${r.responseRate}%`])}
                />
                <ChartCardActions
                  title="Response rate over time"
                  description={`Every faculty member's response rate by term against the ${RESPONSE_TARGET}% target. Select a person to trace their line.`}
                  detail={
                    <EntityTrendExplorer
                      entityNoun="faculty"
                      entities={[...latestResponse.entries()].map(([name, v]) => ({
                        id: name,
                        label: name,
                        value: `${v.rate}%`,
                        sortValue: v.rate,
                        trend: v.rate < RESPONSE_TARGET ? 'down' : 'flat',
                      }))}
                      renderChart={(selected) => (
                        <ResponseCompareLines
                          mode="shared"
                          rows={responseSeries.map((r) => ({ ...r, label: r.name }))}
                          target={RESPONSE_TARGET}
                          highlight={selected ? [selected] : responseMovers}
                          height={380}
                        />
                      )}
                      table={{
                        headers: ['Faculty', 'Term', 'Response rate'],
                        rows: responseSeries.map((r) => [r.name, r.term, `${r.responseRate}%`]),
                      }}
                    />
                  }
                  table={{
                    headers: ['Faculty', 'Term', 'Response rate'],
                    rows: responseSeries.map((r) => [r.name, r.term, `${r.responseRate}%`]),
                  }}
                />
              </>
            )}
          </ChartFigure>
        </ChartCard>
      </div>
    </div>
  )
}
