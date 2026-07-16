'use client'

/**
 * One faculty member's portfolio: standing vs benchmarks, courses ranked with their trends,
 * and their response-rate path. Stories 15, 16, 19 and 11.
 *
 * Extracted so BOTH entry points to a faculty member render the same thing — the directory
 * profile (`/admin/faculty/[id]`) and the analytics drill-down (`/analytics?tab=faculty`).
 * They previously diverged: the analytics tab rendered `ByFacultyPanel` with no
 * `extraCharts`, so it promised "their portfolio" in the section copy and delivered a KPI
 * strip and a table. Two doors to the same entity showing different things is the bug.
 *
 * `lens` carries the RBAC boundary through — see `BenchmarkDistribution.showPeers`. The
 * self-view (`/my-dashboard`) may see its own numbers against the department and university
 * averages, but not the peer distribution (§7.3: percentile "reverse-encodes peer rank").
 */

import { useMemo } from 'react'
import {
  ChartCard,
  ChartFigure,
  ChartDataTable,
  type ChartLeoInsight,
} from '@/components/charts-overview'
import {
  BenchmarkDistribution,
  CourseRankSpark,
  ResponseCompareLines,
} from '@/components/pce/analytics-plots'
import {
  benchmarks, facultyCourseStats, facultyCourseResponseTrend, medianOf, RESPONSE_TARGET,
} from '@/lib/pce-analytics'
import { ChartCardActions, CHART_CARD_PLOT_PX } from '@/components/pce/chart-card-actions'

const fmt2 = (v: number) => v.toFixed(2)

/** Shared inline empty state — mirrors the DriftDumbbell pattern in analytics-plots. */
function ChartEmpty({ note }: { note: string }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{note}</p>
}

export function FacultyPortfolioCharts({
  facultyId,
  avgRating,
  lens = 'admin',
}: {
  facultyId: string
  /** The faculty member's weighted mean, or null when they have no offerings. */
  avgRating: number | null
  lens?: 'admin' | 'self'
}) {
  const bench = useMemo(() => benchmarks(facultyId), [facultyId])
  const courseRank = useMemo(() => facultyCourseStats(facultyId), [facultyId])
  const courseMedian = useMemo(() => medianOf(courseRank.map((c) => c.score.weighted)), [courseRank])
  const courseResponse = useMemo(() => facultyCourseResponseTrend(facultyId), [facultyId])

  const benchLeo: ChartLeoInsight | null = avgRating != null
    ? {
        headline:
          avgRating >= bench.department
            ? `Rated ${fmt2(avgRating - bench.department)} above the department average`
            : `Rated ${fmt2(bench.department - avgRating)} below the department average`,
        explanation:
          lens === 'admin'
            ? 'Position against two benchmarks, not a rank. Each grey dot is another faculty member with ' +
              'no name attached — the shape shows whether the department is tightly clustered (a small gap ' +
              'means a lot) or widely spread (it means little).'
            : 'Position against the department and university averages. No peer ranking is shown — a small ' +
              'gap and a large one mean different things depending on how spread the department is.',
        kind: avgRating >= bench.department ? 'trend' : 'dip',
        delta: {
          value: `${avgRating >= bench.department ? '+' : ''}${fmt2(avgRating - bench.department)}`,
          label: 'vs dept average',
        },
        bullets: [
          `Own ${fmt2(avgRating)}/5 · department ${fmt2(bench.department)}/5 · university ${fmt2(bench.university)}/5.`,
          `${bench.distribution.length} faculty in the department.`,
        ],
        anchor: { yValue: avgRating },
      }
    : null

  const courseRankLeo: ChartLeoInsight | null = courseRank.length
    ? (() => {
        const best = courseRank[0]!
        const worst = courseRank[courseRank.length - 1]!
        const single = courseRank.length === 1
        return {
          headline: single
            ? `${best.courseCode} is the only course in this portfolio`
            : `${worst.courseCode} is the weakest of ${courseRank.length} courses at ${fmt2(worst.score.weighted)}`,
          explanation: single
            ? 'A one-course portfolio cannot be ranked, and the spread between courses — usually the most ' +
              'useful signal about a person — is not available. The per-term trend is the only comparison here.'
            : `The gap between ${best.courseCode} (${fmt2(best.score.weighted)}) and ${worst.courseCode} ` +
              `(${fmt2(worst.score.weighted)}) is ${fmt2(best.score.weighted - worst.score.weighted)}. ` +
              'A person strong in one course and weak in another is a course-fit conversation, not a teaching one.',
          kind: single ? 'trend' : 'anomaly',
          delta: {
            value: fmt2(worst.score.weighted),
            label: single ? best.courseCode : `lowest — ${worst.courseCode}`,
          },
          bullets: courseRank.map(
            (c) => `${c.courseCode}: ${fmt2(c.score.weighted)}/5 across ${c.terms} term${c.terms === 1 ? '' : 's'}.`,
          ),
        }
      })()
    : null

  return (
    <>
      {/* ChartCard titles are h3; the section h2 keeps the document from jumping h1 → h3
          (axe `heading-order`). Real section, no need to see it. */}
      <h2 className="sr-only">Performance</h2>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        {/* Story 15 — "avg score, PERCENTILE, response rate", answered without a percentile.
            §7.3 bans percentile by name; Aarti validated the substitute ("compared to the
            department average to the university average") and cited Watermark/Anthology as
            proof faculty accept it. Peer swarm is admin-only via showPeers. */}
        <ChartCard
          variant="normal"
          title="Standing vs benchmarks"
          description={
            lens === 'admin'
              ? 'Position against the department and university averages — not a rank. Each grey dot is an unnamed faculty member.'
              : 'Your average against the department and university averages.'
          }
          leoInsight={benchLeo}
        >
          <ChartFigure
            label="Standing versus benchmarks"
            summary={
              avgRating == null
                ? 'No rating data for this faculty member yet.'
                : `This faculty member scores ${fmt2(avgRating)} out of 5, against a department average of ${fmt2(bench.department)} and a university average of ${fmt2(bench.university)}.${lens === 'admin' ? ' Peers are shown as an anonymous distribution.' : ''}`
            }
            dataLength={avgRating == null ? 0 : lens === 'admin' ? bench.distribution.length : 1}
            leoInsight={benchLeo}
          >
            {() =>
              avgRating == null ? (
                <ChartEmpty note="No evaluated offerings yet — nothing to place against a benchmark." />
              ) : (
                <>
                  <BenchmarkDistribution
                    distribution={bench.distribution}
                    value={avgRating}
                    department={bench.department}
                    university={bench.university}
                    showPeers={lens === 'admin'}
                  />
                  <ChartDataTable
                    caption="Standing versus benchmarks"
                    headers={['Measure', 'Score']}
                    rows={[
                      ['This faculty', fmt2(avgRating)],
                      ['Department average', fmt2(bench.department)],
                      ['University average', fmt2(bench.university)],
                    ]}
                  />
                  <ChartCardActions
                    title="Standing vs benchmarks"
                    description="This faculty member's mean against the unnamed peer distribution and both benchmarks, larger."
                    detail={
                      <BenchmarkDistribution
                        distribution={bench.distribution}
                        value={avgRating}
                        department={bench.department}
                        university={bench.university}
                        showPeers={lens === 'admin'}
                        height={420}
                      />
                    }
                    table={{
                      headers: ['Measure', 'Score'],
                      rows: [
                        ['This faculty', fmt2(avgRating)],
                        ['Department average', fmt2(bench.department)],
                        ['University average', fmt2(bench.university)],
                      ],
                    }}
                  />
                </>
              )
            }
          </ChartFigure>
        </ChartCard>

        {/* Stories 16 + 19 — one component, because they are one idea: the course as the
            unit of analysis WITHIN a person. Guarded for n=1: some faculty teach a single
            course, so "ranked best to worst" over a list of one must still read sanely. */}
        <ChartCard
          variant="normal"
          title="Courses taught"
          description={
            courseRank.length === 1
              ? 'One course in this portfolio — ranking needs at least two, so the per-term trend is the comparison.'
              : 'Ranked best to worst, each with its own trend. Strong in one course and weak in another is a course-fit problem, not a teaching one.'
          }
          leoInsight={courseRankLeo}
        >
          <ChartFigure
            label="Courses taught"
            summary={`${courseRank.length} course${courseRank.length === 1 ? '' : 's'} ranked by weighted score, each with a per-term trend line.`}
            dataLength={courseRank.length}
            leoInsight={courseRankLeo}
          >
            {() =>
              courseRank.length === 0 ? (
                <ChartEmpty note="No course records for this faculty member." />
              ) : (
                <>
                  <div className="flex flex-col">
                    {courseRank.map((c, i) => (
                      <div
                        key={c.courseCode}
                        className="grid grid-cols-[1.5rem_1fr_5rem_3.5rem] items-center gap-3 border-b border-border py-2 last:border-b-0"
                      >
                        <span className="text-xs tabular-nums text-muted-foreground">{i + 1}</span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{c.courseCode}</p>
                          <p className="truncate text-xs text-muted-foreground">{c.courseName}</p>
                        </div>
                        <CourseRankSpark course={c} median={courseMedian} />
                        <span className="text-right text-sm font-medium tabular-nums">
                          {fmt2(c.score.weighted)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <ChartDataTable
                    caption="Courses taught, ranked by weighted score"
                    headers={['Rank', 'Course', 'Weighted score', 'Simple mean', 'Terms', 'Response rate']}
                    rows={courseRank.map((c, i) => [
                      i + 1,
                      `${c.courseCode} — ${c.courseName}`,
                      fmt2(c.score.weighted),
                      fmt2(c.score.simple),
                      c.terms,
                      `${c.responseRate}%`,
                    ])}
                  />
                  {/* Rows already carry their own sparks — export is the missing door here. */}
                  <ChartCardActions
                    title="Courses taught"
                    table={{
                      headers: ['Rank', 'Course', 'Weighted score', 'Simple mean', 'Terms', 'Response rate'],
                      rows: courseRank.map((c, i) => [
                        i + 1,
                        `${c.courseCode} — ${c.courseName}`,
                        fmt2(c.score.weighted),
                        fmt2(c.score.simple),
                        c.terms,
                        `${c.responseRate}%`,
                      ]),
                    }}
                  />
                </>
              )
            }
          </ChartFigure>
        </ChartCard>
      </div>

      {/*
        Story 19's response half, BY COURSE — this card used to draw ONE aggregate line for
        the whole portfolio, which is the same "average hides the problem" mistake the
        leaderboard's spread dots exist to prevent, one level down.

        The old `facultyResponseTrend` (deleted with this change) summed enrolled/responded
        across ALL of a person's courses, so a course collecting 45% and a course collecting
        95% averaged to a reassuring line and neither was visible. Measured on the real data
        before deleting it: every faculty member's per-course means span ~11 points that the
        aggregate flattened. Patel's aggregate reads [71,70,78,74,82]
        while her courses sit at 72–83 — a calm line over a spread.

        Course is the right unit because response is a property of the OFFERING, not the
        person: students skip a survey over timing and workload, not over who is teaching.
        Story 19 asks for trends "by course" and this is the half that wasn't.

        Own data on both lenses, so no RBAC gate. RUBRIC Q4's ❌ is "single % delta with arrow
        — hides the path"; the path is now per course.
      */}
      {courseResponse.length > 1 && (
        <ChartCard
          variant="normal"
          title="Response rate by course"
          /* Shared axis, not facets — the sibling-coverage miss the verification review caught:
             every other ResponseCompareLines call site was converted to the card contract and
             this one still grew 76px per course. One faculty member's courses are ≤5 series,
             exactly the ≤5-series shape the small-multiples pattern excludes anyway. */
          description={`Response rate per course · target ${RESPONSE_TARGET}% · lowest labelled`}
        >
          <ChartFigure
            label="Response rate by course"
            summary={`All of this faculty member's courses' response rates by term on one shared axis against a ${RESPONSE_TARGET}% target; the lowest course is highlighted.`}
            dataLength={courseResponse.length}
          >
            {() => {
              const byCourse = new Map<string, number>()
              for (const r of courseResponse) {
                const prev = byCourse.get(r.courseCode)
                if (prev == null || r.responseRate < prev) byCourse.set(r.courseCode, r.responseRate)
              }
              const lowest = [...byCourse.entries()].sort((a, b) => a[1] - b[1]).slice(0, 2).map(([c]) => c)
              const rows = courseResponse.map((r) => ({ ...r, label: r.courseCode }))
              const table = {
                headers: ['Course', 'Term', 'Response rate'],
                rows: courseResponse.map((r) => [
                  `${r.courseCode} — ${r.courseName}`, r.term, `${r.responseRate}%`,
                ] as (string | number)[]),
              }
              return (
                <>
                  <ResponseCompareLines
                    mode="shared"
                    rows={rows}
                    target={RESPONSE_TARGET}
                    highlight={lowest}
                    height={CHART_CARD_PLOT_PX}
                  />
                  <ChartDataTable
                    caption="Response rate by course and term"
                    headers={['Course', 'Term', 'Response rate']}
                    rows={courseResponse.map((r) => [
                      `${r.courseCode} — ${r.courseName}`, r.term, `${r.responseRate}%`,
                    ])}
                  />
                  <ChartCardActions
                    title="Response rate by course"
                    description={`Response rate by term for each course, against the ${RESPONSE_TARGET}% target.`}
                    detail={
                      <ResponseCompareLines
                        mode="shared"
                        rows={rows}
                        target={RESPONSE_TARGET}
                        highlight={lowest}
                        height={380}
                      />
                    }
                    table={table}
                  />
                </>
              )
            }}
          </ChartFigure>
        </ChartCard>
      )}
    </>
  )
}
