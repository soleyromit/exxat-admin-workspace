'use client'

// ============================================================================
// /my-dashboard — Faculty home (Romit-confirmed brief, 2026-07-16).
// De-dup contract vs /results: the dashboard owns TRAJECTORY, STANDING, LIVE
// activity, and FOLLOW-UPS; per-course outcomes stay in My Results. The old
// page reused the admin ByFacultyPanel (brand-pink data marks, offerings
// table duplicating results) — replaced.
// DS OS: KeyMetrics(flat) · ChartCard/ChartFigure + leoInsight · StatusBadge ·
// ResponseProgressCell. Data marks never wear brand (chart-2 replaces pink).
// ============================================================================

import { useMemo } from 'react'
import Link from 'next/link'
import {
  Avatar,
  AvatarFallback,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  chartTooltipKeyboardSyncProps,
  KeyMetrics,
  StatusBadge,
} from '@exxatdesignux/ui'
import type { ChartConfig, MetricItem } from '@exxatdesignux/ui'
import {
  Area, CartesianGrid, ComposedChart, LabelList, Line, XAxis, YAxis,
} from 'recharts'
import {
  ChartCard, ChartFigure, ChartDataTable,
  ChartLeoPlotInsightOverlay,
  type ChartLeoInsight,
} from '@/components/charts-overview'
import { CHART_AXIS_TICK } from '@/lib/chart-typography'
import { SiteHeader } from '@/components/site-header'
import { usePce } from '@/components/pce/pce-state'
import { ResponseProgressCell } from '@/components/pce/response-gauge'
import { MOCK_FACULTY, MOCK_FACULTY_OFFERINGS, MOCK_RESPONSES, MOCK_SURVEY_QUESTION_DATA } from '@/lib/pce-mock-data'
import { deriveResults, programScoreBenchmarks } from '@/lib/pce-results'
import { deriveThemes, type ThemeComment } from '@/lib/pce-themes'
import { withFrom } from '@/lib/pce-nav-origin'
import { RatingLegend, RatingStackedBar } from '@/components/pce/rating-viz'

const TERM_ORDER = [
  'Spring 2022', 'Fall 2022', 'Spring 2023', 'Fall 2023',
  'Spring 2024', 'Fall 2024', 'Spring 2025', 'Fall 2025', 'Spring 2026',
]

const trendChartConfig: ChartConfig = {
  range:   { label: 'Faculty range', color: 'var(--border)' },
  median:  { label: 'Median',        color: 'var(--muted-foreground)' },
  faculty: { label: 'You',           color: 'var(--chart-2)' },
}
const LOOP_BADGE: Record<'resolved' | 'improved' | 'persistent', { label: string; tone: 'success' | 'info' | 'warning' }> = {
  resolved:   { label: 'Resolved',   tone: 'success' },
  improved:   { label: 'Improved',   tone: 'info' },
  persistent: { label: 'Persistent', tone: 'warning' },
}

export default function MyDashboardPage() {
  const { user, surveys, hiddenComments } = usePce()
  const facultyId = user.facultyId ?? ''
  const faculty = MOCK_FACULTY.find((f) => f.id === facultyId)

  /* ── KPIs — own outcomes aggregated (no per-course rows here) ───────────── */
  const results = useMemo(() => deriveResults(surveys), [surveys])
  const own = useMemo(
    () => results.filter((r) => r.facultyId === facultyId),
    [results, facultyId],
  )
  const scored = own.filter((r) => r.status === 'available' && r.avgScore != null)
  const avgScore = scored.length
    ? scored.reduce((a, r) => a + (r.avgScore as number), 0) / scored.length
    : null
  const benchmarks = useMemo(() => programScoreBenchmarks(results), [results])
  const programAvg = own.length ? benchmarks.get(own[0].program) ?? null : null
  const progDelta = avgScore != null && programAvg != null ? avgScore - programAvg : null
  const avgRate = own.length
    ? Math.round(own.reduce((a, r) => a + r.responseRate, 0) / own.length)
    : null
  const liveSurveys = useMemo(
    () =>
      surveys.filter(
        (s) =>
          (s.status === 'collecting' || s.status === 'active') &&
          s.instructors.some((i) => i.id === facultyId),
      ),
    [surveys, facultyId],
  )

  const kpis: MetricItem[] = [
    {
      id: 'avg', label: 'Avg rating',
      value: avgScore != null ? `${avgScore.toFixed(2)}/5` : '—',
      delta: '', trend: 'neutral',
      description: `${scored.length} released course${scored.length !== 1 ? 's' : ''}`,
    },
    {
      id: 'vs-program', label: 'Vs program average',
      value: progDelta != null ? `${progDelta >= 0 ? '+' : '−'}${Math.abs(progDelta).toFixed(2)}` : '—',
      delta: '', trend: 'neutral',
      description: programAvg != null ? `Program at ${programAvg.toFixed(2)}` : 'No benchmark yet',
    },
    {
      id: 'rate', label: 'Avg response rate',
      value: avgRate != null ? `${avgRate}%` : '—',
      delta: '', trend: 'neutral',
      description: 'Across your offerings',
    },
    {
      id: 'live', label: 'Collecting now',
      value: liveSurveys.length,
      delta: '', trend: 'neutral',
      description: liveSurveys.length ? 'Live evaluations below' : 'No live evaluations',
    },
  ]

  /* ── Trajectory: rating-over-time inside the faculty distribution band ──── */
  const offerings = useMemo(
    () => MOCK_FACULTY_OFFERINGS.filter((o) => o.facultyId === facultyId),
    [facultyId],
  )
    const trendData = useMemo(() => {
    const termsWithData = TERM_ORDER.filter((t) => MOCK_FACULTY_OFFERINGS.some((o) => o.term === t))
    return termsWithData.map((term) => {
      const scores = MOCK_FACULTY_OFFERINGS.filter((o) => o.term === term).map((o) => o.avgRating)
      const min = Math.min(...scores)
      const max = Math.max(...scores)
      const sorted = [...scores].sort((a, b) => a - b)
      const median = sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)]
      const own = offerings.find((o) => o.term === term)
      return {
        term: term.replace('Spring ', 'Sp ').replace('Fall ', 'F '),
        min: +min.toFixed(2),
        range: +(max - min).toFixed(2),
        median: +median.toFixed(2),
        faculty: own ? +own.avgRating.toFixed(2) : null,
      }
    })
  }, [offerings])


  /* ── Follow-ups — feedback-loop concerns across own courses (Romit) ─────── */
  const followUps = useMemo(() => {
    const rows: {
      key: string
      label: string
      courseCode: string
      surveyId: string
      resultId: string
      occurrences: number
      status: 'resolved' | 'improved' | 'persistent'
    }[] = []
    for (const s of surveys) {
      if (!s.instructors.some((i) => i.id === facultyId)) continue
      const concerns = s.priorOfferings?.at(-1)?.concerns ?? []
      if (concerns.length === 0) continue
      const hiddenIdx = hiddenComments[s.id] ?? []
      const comments = (MOCK_RESPONSES.find((r) => r.surveyId === s.id)?.comments ?? [])
        .filter((_, index) => !hiddenIdx.includes(index))
      const themes = deriveThemes(comments as ThemeComment[])
      for (const label of concerns) {
        const now = themes.find((t) => t.label === label)
        rows.push({
          key: `${s.id}:${label}`,
          label,
          courseCode: s.courseCode,
          surveyId: s.id,
          resultId: `${s.id}:${facultyId}`,
          occurrences: now?.occurrences ?? 0,
          status: !now ? 'resolved' : now.sentiment === 'concern' ? 'persistent' : 'improved',
        })
      }
    }
    const rank = { persistent: 0, improved: 1, resolved: 2 }
    return rows.sort((a, b) => rank[a.status] - rank[b.status]).slice(0, 6)
  }, [surveys, facultyId, hiddenComments])

  /* ── Rating mix by term — every rating this faculty received, aggregated
     from real per-question distributions (replaces the admin radar, whose
     "dimensions" were synthetic seeded offsets). ─────────────────────────── */
  const mixByTerm = useMemo(() => {
    const acc = new Map<string, { counts: number[]; courses: Set<string> }>()
    for (const s of surveys) {
      if (!s.instructors.some((i) => i.id === facultyId)) continue
      const qd = MOCK_SURVEY_QUESTION_DATA.find((d) => d.surveyId === s.id)
      if (!qd) continue
      const counts = [0, 0, 0, 0, 0]
      for (const arr of Object.values(qd.sectionScores)) {
        for (const q of arr) (q.distribution ?? []).forEach((n, i) => { if (i < 5) counts[i] += n })
      }
      for (const b of qd.instructorBlocks ?? []) {
        if (b.instructorId !== facultyId) continue
        for (const q of b.scores) (q.distribution ?? []).forEach((n, i) => { if (i < 5) counts[i] += n })
      }
      if (counts.every((n) => n === 0)) continue
      const cur = acc.get(s.term) ?? { counts: [0, 0, 0, 0, 0], courses: new Set<string>() }
      counts.forEach((n, i) => { cur.counts[i] += n })
      cur.courses.add(s.courseCode)
      acc.set(s.term, cur)
    }
    return [...acc.entries()]
      .sort((a, b) => TERM_ORDER.indexOf(b[0]) - TERM_ORDER.indexOf(a[0]))
      .map(([term, v]) => {
        const total = v.counts.reduce((a, n) => a + n, 0)
        return {
          term,
          counts: v.counts,
          total,
          courses: v.courses.size,
          avg: total ? v.counts.reduce((a, n, i) => a + n * (i + 1), 0) / total : 0,
        }
      })
  }, [surveys, facultyId])

  const favShare = (row: { counts: number[]; total: number }) =>
    row.total ? ((row.counts[3] ?? 0) + (row.counts[4] ?? 0)) / row.total : 0

  const mixLeo: ChartLeoInsight | null =
    mixByTerm.length >= 2
      ? (() => {
          const [latest, prev] = mixByTerm
          const pts = Math.round((favShare(latest) - favShare(prev)) * 100)
          return {
            headline:
              pts === 0
                ? `Favorable share held steady vs ${prev.term}`
                : `Favorable share ${pts > 0 ? 'up' : 'down'} ${Math.abs(pts)} point${Math.abs(pts) !== 1 ? 's' : ''} vs ${prev.term}`,
            explanation: `${Math.round(favShare(latest) * 100)}% of ${latest.total} ratings in ${latest.term} were 4 or 5.`,
            kind: pts < 0 ? 'dip' : 'trend',
            delta: { value: `${pts >= 0 ? '+' : ''}${pts}`, label: 'pts favorable' },
          }
        })()
      : null

  if (!faculty) {
    return (
      <>
        <SiteHeader title="My Dashboard" />
        <div className="flex flex-col flex-1 items-center justify-center gap-2">
          <i className="fa-light fa-user-slash text-3xl text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Faculty not found</p>
        </div>
      </>
    )
  }

    const lastWithFaculty = [...trendData].reverse().find((d) => d.faculty != null) ?? null
  const bandLeo: ChartLeoInsight | null = lastWithFaculty
    ? (() => {
        const diff = +(lastWithFaculty.faculty! - lastWithFaculty.median).toFixed(2)
        return {
          headline:
            diff < 0
              ? `Rated ${Math.abs(diff).toFixed(2)} below the faculty median in ${lastWithFaculty.term}`
              : diff > 0
                ? `Rated ${diff.toFixed(2)} above the faculty median in ${lastWithFaculty.term}`
                : `Right on the faculty median in ${lastWithFaculty.term}`,
          explanation:
            'The grey band is the full faculty distribution per term — position within the band matters more than the absolute number.',
          kind: diff < 0 ? 'dip' : 'trend',
          delta: { value: `${diff >= 0 ? '+' : ''}${diff.toFixed(2)}`, label: 'vs median' },
          bullets: [
            `${lastWithFaculty.term}: own ${lastWithFaculty.faculty!.toFixed(2)}/5 · median ${lastWithFaculty.median.toFixed(2)}/5.`,
            `Band spans ${lastWithFaculty.min.toFixed(2)}–${(lastWithFaculty.min + lastWithFaculty.range).toFixed(2)} this term.`,
          ],
          anchor: { xValue: lastWithFaculty.term, yDataKeys: ['faculty'] },
        }
      })()
    : null

  return (
    <>
      <h1 className="sr-only">My Dashboard</h1>
      <SiteHeader title="My Dashboard" />

      {/* Profile header — kept from the previous page (DS-clean) */}
      <div className="shrink-0 flex items-start gap-4" style={{ padding: '20px 28px 16px' }}>
        <Avatar className="h-12 w-12 rounded-full shrink-0">
          <AvatarFallback
            className="rounded-full text-base font-semibold"
            style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}
          >
            {faculty.initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-lg font-semibold leading-tight">{faculty.name}</p>
            {faculty.employmentStatus && (
              <Badge variant={faculty.employmentStatus === 'inactive' ? 'outline' : 'secondary'} className="text-xs capitalize">
                {faculty.employmentStatus}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {[faculty.rank, faculty.department, faculty.position].filter(Boolean).join(' · ') || 'Faculty'}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto" tabIndex={0} style={{ padding: '8px 28px 28px' }}>
        <div className="flex flex-col gap-6 max-w-4xl">
          <KeyMetrics variant="flat" showHeader={false} metricsSingleRow metrics={kpis} />

          {/* Trajectory — the hero. Full width, your points value-labeled at
              the marks (RUBRIC v2 Gate 5.3), cohort band + median as context. */}
          <ChartCard
            variant="normal"
            title="Rating over time"
            description="Your average per term · grey band = full faculty range · dashed = median"
            leoInsight={bandLeo}
          >
            <ChartFigure
              label="Rating over time"
              summary="Your rating per term plotted inside the full faculty distribution band, with the median as a dashed line."
              dataLength={trendData.length}
            >
              {(activeIndex) => (
                <>
                  <div className="relative w-full">
                    <ChartContainer config={trendChartConfig} className="h-64 w-full text-xs">
                      <ComposedChart data={trendData} margin={{ top: 20, right: 12, bottom: 0, left: -16 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="term" tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} />
                        <YAxis domain={[2.5, 5]} ticks={[3.0, 3.5, 4.0, 4.5, 5.0]} tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} />
                        <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
                        <Area dataKey="min" stackId="band" stroke="none" fill="transparent" isAnimationActive={false} />
                        <Area dataKey="range" stackId="band" stroke="none" fill="var(--muted)" fillOpacity={0.5} isAnimationActive={false} />
                        <Line dataKey="median" stroke="var(--muted-foreground)" strokeWidth={1.5} strokeDasharray="4 3" dot={false} isAnimationActive={false} />
                        <Line dataKey="faculty" stroke="var(--chart-2)" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--chart-2)', strokeWidth: 0 }} activeDot={{ r: 5, stroke: 'var(--ring)', strokeWidth: 2 }} connectNulls isAnimationActive={false}>
                          <LabelList
                            dataKey="faculty"
                            position="top"
                            offset={10}
                            formatter={(v: number | null) => (v != null ? v.toFixed(2) : '')}
                            style={{ fill: 'var(--foreground)', fontSize: 12 }}
                            className="tabular-nums"
                          />
                        </Line>
                      </ComposedChart>
                    </ChartContainer>
                    <ChartLeoPlotInsightOverlay
                      data={trendData.map(({ term: t, faculty: f, median }) => ({ term: t, faculty: f, median }))}
                      xDataKey="term"
                    />
                  </div>
                  <ChartDataTable
                    caption="Rating over time"
                    headers={['Term', 'You', 'Median']}
                    rows={trendData.map((d) => [d.term, d.faculty != null ? d.faculty.toFixed(2) : '—', d.median.toFixed(2)])}
                  />
                </>
              )}
            </ChartFigure>
          </ChartCard>

          {/* Rating mix by term — the faculty-purpose distribution view: the
              SAME stacked-bar form as the results detail, aggregated across
              every rating this faculty received per term. Replaces the admin
              radar (which drew synthetic seeded data). */}
          <ChartCard
            variant="normal"
            title="Rating mix by term"
            description="Every rating your students gave, per term · rated 1–5"
            leoInsight={mixLeo}
          >
            <ChartFigure
              label="Rating mix by term"
              summary={`Distribution of all ratings you received per term. ${mixByTerm.length ? `Latest term favorable share ${Math.round(favShare(mixByTerm[0]) * 100)} percent.` : ''}`}
              dataLength={mixByTerm.length}
            >
              {() => (
                <>
                  <div className="flex flex-col">
                    <div className="grid grid-cols-[minmax(120px,180px)_1fr_auto] items-end gap-6 pb-2 border-b border-border">
                      <span className="text-xs text-muted-foreground">Term</span>
                      <RatingLegend />
                      <span className="text-xs text-muted-foreground text-right">Avg</span>
                    </div>
                    {mixByTerm.map((row) => (
                      <div
                        key={row.term}
                        role="img"
                        aria-label={`${row.term}: average ${row.avg.toFixed(1)} of 5 from ${row.total} ratings across ${row.courses} course${row.courses !== 1 ? 's' : ''}`}
                        className="grid grid-cols-[minmax(120px,180px)_1fr_auto] items-center gap-6 py-3 border-b border-border last:border-0"
                      >
                        <div className="min-w-0">
                          <p className="text-sm truncate">{row.term}</p>
                          <p className="text-xs text-muted-foreground">
                            {row.courses} course{row.courses !== 1 ? 's' : ''} · {row.total} ratings
                          </p>
                        </div>
                        <RatingStackedBar counts={row.counts} total={row.total} />
                        <p className="text-xs text-muted-foreground tabular-nums text-right whitespace-nowrap">
                          Avg <span className="text-sm font-semibold text-foreground">{row.avg.toFixed(1)}</span>
                        </p>
                      </div>
                    ))}
                    {mixByTerm.length === 0 && (
                      <p className="text-sm text-muted-foreground py-3">
                        No rating data yet — the mix appears once your evaluations collect responses.
                      </p>
                    )}
                  </div>
                  <ChartDataTable
                    caption="Rating mix by term"
                    headers={['Term', 'Rated 1', 'Rated 2', 'Rated 3', 'Rated 4', 'Rated 5', 'Average', 'Courses']}
                    rows={mixByTerm.map((row) => [row.term, ...row.counts, row.avg.toFixed(2), row.courses])}
                  />
                </>
              )}
            </ChartFigure>
          </ChartCard>

          {/* Collecting now — live evaluations (never shown on /results) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm" aria-level={2}>Collecting now</CardTitle>
              <CardDescription>
                Live evaluations for your courses — results appear in My Results after close.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {liveSurveys.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No evaluations collecting right now.
                </p>
              ) : (
                <div className="flex flex-col">
                  {liveSurveys.map((s) => (
                    <Link
                      key={s.id}
                      href={withFrom(`/results/${encodeURIComponent(`${s.id}:${facultyId}`)}`, 'my-dashboard')}
                      className="grid grid-cols-[minmax(180px,1fr)_minmax(200px,260px)_auto] items-center gap-6 py-3 border-b border-border last:border-0 rounded-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 hover:bg-muted/40 -mx-2 px-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{s.courseCode} — {s.courseName}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.deadline ? `Closes ${s.deadline}` : s.term}
                        </p>
                      </div>
                      <ResponseProgressCell
                        rate={s.responseRate}
                        responseCount={s.responseCount}
                        enrollmentCount={s.enrollmentCount}
                        target={70}
                        detail="full"
                      />
                      <i className="fa-light fa-chevron-right text-muted-foreground" aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Follow-ups — feedback-loop concerns across courses (Romit) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm" aria-level={2}>Follow-ups</CardTitle>
              <CardDescription>
                Concerns logged last term vs this term&rsquo;s student themes, across your courses.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {followUps.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No follow-ups — no concerns were logged for your courses last term.
                </p>
              ) : (
                <div className="flex flex-col">
                  {followUps.map((f) => {
                    const badge = LOOP_BADGE[f.status]
                    return (
                      <Link
                        key={f.key}
                        href={withFrom(`/results/${encodeURIComponent(f.resultId)}`, 'my-dashboard')}
                        className="flex items-center gap-4 py-3 border-b border-border last:border-0 rounded-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 hover:bg-muted/40 -mx-2 px-2"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{f.label}</p>
                          <p className="text-xs text-muted-foreground">{f.courseCode}</p>
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                          {f.occurrences} mention{f.occurrences !== 1 ? 's' : ''} this term
                        </span>
                        <StatusBadge label={badge.label} tone={badge.tone} />
                        <i className="fa-light fa-chevron-right text-muted-foreground" aria-hidden="true" />
                      </Link>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground">
            Looking for a specific course?{' '}
            <Link href="/results" className="underline underline-offset-2 hover:text-foreground">
              View all results
            </Link>
          </p>
        </div>
      </div>
    </>
  )
}
