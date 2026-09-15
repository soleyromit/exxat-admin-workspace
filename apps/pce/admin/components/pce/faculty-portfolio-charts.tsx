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
import Link from 'next/link'
import {
  ChartCard,
  ChartFigure,
  ChartDataTable,
  type ChartLeoInsight,
} from '@/components/charts-core'
import {
  BenchmarkDistribution,
  CourseRankSpark,
} from '@/components/pce/analytics-plots'
import {
  benchmarks, facultyCourseStats, medianOf,
} from '@/lib/pce-analytics'
import { ChartCardActions } from '@/components/pce/chart-card-actions'

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

  const benchLeo: ChartLeoInsight | null = avgRating != null
    ? {
        headline:
          avgRating >= bench.department
            ? `Rated ${fmt2(avgRating - bench.department)} above the department average`
            : `Rated ${fmt2(bench.department - avgRating)} below the department average`,
        explanation:
          lens === 'admin'
            ? 'Position against two benchmarks, not a rank. Each grey dot is another faculty member with ' +
              'no name attached. The shape shows whether the department is tightly clustered (a small gap ' +
              'means a lot) or widely spread (it means little).'
            : 'Position against the department and university averages. No peer ranking is shown. A small ' +
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
            ? 'A one-course portfolio cannot be ranked, and the spread between courses, usually the most ' +
              'useful signal about a person, is not available. The per-term trend is the only comparison here.'
            : `The gap between ${best.courseCode} (${fmt2(best.score.weighted)}) and ${worst.courseCode} ` +
              `(${fmt2(worst.score.weighted)}) is ${fmt2(best.score.weighted - worst.score.weighted)}. ` +
              'A person strong in one course and weak in another is a course-fit conversation, not a teaching one.',
          kind: single ? 'trend' : 'anomaly',
          delta: {
            value: fmt2(worst.score.weighted),
            label: single ? best.courseCode : `lowest · ${worst.courseCode}`,
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

      {/* Self lens drops the standing swarm (the hero carries it), leaving one card in
          this pair — a half-width orphan beside dead space unless the grid collapses. */}
      <div className={`grid grid-cols-1 items-start gap-4 ${lens === 'admin' ? 'lg:grid-cols-2' : ''}`}>
        {/* Story 15 — "avg score, PERCENTILE, response rate", answered without a percentile.
            §7.3 bans percentile by name; Aarti validated the substitute ("compared to the
            department average to the university average") and cited Watermark/Anthology as
            proof faculty accept it. Peer swarm is admin-only via showPeers. */}
        {/* Admin only: the self dashboard's HERO carries standing (two ScoreBullets vs
            dept/university), so this card would repeat it one screen later. The swarm
            stays for admins, where the unnamed peer distribution is the value. */}
        {lens === 'admin' && (
        <ChartCard
          variant="normal"
          title="Standing vs benchmarks"
          description={
            lens === 'admin'
              ? 'Position against the department and university averages, not a rank. Each grey dot is an unnamed faculty member.'
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
                <ChartEmpty note="No evaluated offerings yet, nothing to place against a benchmark." />
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
        )}

        {/* Stories 16 + 19 — one component, because they are one idea: the course as the
            unit of analysis WITHIN a person. Guarded for n=1: some faculty teach a single
            course, so "ranked best to worst" over a list of one must still read sanely. */}
        <ChartCard
          variant="normal"
          title="Courses taught"
          description={
            courseRank.length === 1
              ? 'One course in this portfolio. Ranking needs at least two, so the per-term trend is the comparison.'
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
                        className="grid grid-cols-[1.5rem_1fr_5rem_3.5rem_1.5rem] items-center gap-3 border-b border-border py-2 last:border-b-0"
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
                        {/* The aggregate's door (Round-3 §1.6). Archived offerings carry no
                            surveyId — the cell stays empty rather than linking nowhere. */}
                        {c.latestSurveyId ? (
                          <Link
                            href={`/results/${encodeURIComponent(`${c.latestSurveyId}:${facultyId}`)}`}
                            aria-label={`Open latest result for ${c.courseCode}`}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <i className="fa-light fa-chevron-right text-xs" aria-hidden="true" />
                          </Link>
                        ) : (
                          <span aria-hidden="true" />
                        )}
                      </div>
                    ))}
                  </div>
                  <ChartDataTable
                    caption="Courses taught, ranked by weighted score"
                    headers={['Rank', 'Course', 'Weighted score', 'Simple mean', 'Terms', 'Response rate']}
                    rows={courseRank.map((c, i) => [
                      i + 1,
                      `${c.courseCode} · ${c.courseName}`,
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
                        `${c.courseCode} · ${c.courseName}`,
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
        Story 19's response half, BY COURSE, moved 2026-09-15 into `ByFacultyPanel`'s own
        "Response rate trend" card (`analytics-panels.tsx`) as that card's `ChartCardActions`
        detail — the PRD's new faculty-scoped AGGREGATE response trend became the primary
        card there, and this per-course view is demoted one level down rather than deleted:
        it is real evidence an aggregate line can flatten (Patel's aggregate used to read
        [71,70,78,74,82] while her courses actually sat at 72–83). Removed from here so the
        analytics drill-down (which renders this file via `extraCharts`) doesn't show the
        same fact as two separate top-level cards on one page.
      */}
    </>
  )
}
