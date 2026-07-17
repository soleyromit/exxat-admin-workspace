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
  Area, CartesianGrid, ComposedChart, Line, XAxis, YAxis,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
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
import { MOCK_FACULTY, MOCK_FACULTY_OFFERINGS, MOCK_RESPONSES } from '@/lib/pce-mock-data'
import { deriveResults, programScoreBenchmarks } from '@/lib/pce-results'
import { deriveThemes, type ThemeComment } from '@/lib/pce-themes'
import { withFrom } from '@/lib/pce-nav-origin'

const TERM_ORDER = [
  'Spring 2022', 'Fall 2022', 'Spring 2023', 'Fall 2023',
  'Spring 2024', 'Fall 2024', 'Spring 2025', 'Fall 2025', 'Spring 2026',
]

// Derive section scores from avgRating with deterministic per-section variance
function sectionScores(facultyId: string, avgRating: number) {
  const seed = facultyId.charCodeAt(facultyId.length - 1)
  const offsets = [0.2, -0.1, 0.3, -0.2, 0.1]
  const sections = ['Delivery', 'Preparation', 'Accessibility', 'Communication', 'Fairness']
  return sections.map((name, i) => ({
    name,
    score: Math.min(5, Math.max(1, +(avgRating + offsets[(i + seed) % offsets.length]).toFixed(1))),
    fullMark: 5,
  }))
}

const trendChartConfig: ChartConfig = {
  range:   { label: 'Faculty range', color: 'var(--border)' },
  median:  { label: 'Median',        color: 'var(--muted-foreground)' },
  faculty: { label: 'You',           color: 'var(--chart-2)' },
}
const radarChartConfig: ChartConfig = {
  score: { label: 'Score', color: 'var(--chart-2)' },
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
  const totalEnrolled = offerings.reduce((s, o) => s + o.enrolled, 0)
  const avgRating = totalEnrolled > 0
    ? +(offerings.reduce((s, o) => s + o.avgRating * o.enrolled, 0) / totalEnrolled).toFixed(2)
    : null

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

  const radarData = useMemo(
    () => (avgRating !== null ? sectionScores(facultyId, avgRating) : []),
    [facultyId, avgRating],
  )

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

  /* ── Leo insights ────────────────────────────────────────────────────────── */
  const weakest = radarData.length ? radarData.reduce((a, b) => (b.score < a.score ? b : a)) : null
  const strongest = radarData.length ? radarData.reduce((a, b) => (b.score > a.score ? b : a)) : null
  const radarLeo: ChartLeoInsight | null = weakest && strongest
    ? {
        headline:
          weakest.score < 3.7
            ? `${weakest.name} is the weakest dimension at ${weakest.score.toFixed(1)}/5`
            : `${strongest.name} is the strongest dimension at ${strongest.score.toFixed(1)}/5`,
        explanation:
          weakest.score < 3.7
            ? `The other dimensions hold up — targeted feedback on ${weakest.name.toLowerCase()} would move the overall rating fastest.`
            : 'All dimensions sit at or above the 3.7 tier — a balanced profile.',
        kind: weakest.score < 3.7 ? 'anomaly' : 'trend',
        delta: { value: (strongest.score - weakest.score).toFixed(1), label: 'spread across dimensions' },
        bullets: radarData.map((d) => `${d.name}: ${d.score.toFixed(1)}/5.`),
      }
    : null

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

          {/* Trajectory + dimensions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard
              variant="normal"
              title="Rating over time"
              description="Within full faculty distribution · ● you · ─ ─ median"
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
                      <ChartContainer config={trendChartConfig} className="h-52 w-full text-xs">
                        <ComposedChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                          <XAxis dataKey="term" tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} />
                          <YAxis domain={[2.5, 5]} ticks={[3.0, 3.5, 4.0, 4.5, 5.0]} tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} />
                          <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
                          <Area dataKey="min" stackId="band" stroke="none" fill="transparent" isAnimationActive={false} />
                          <Area dataKey="range" stackId="band" stroke="none" fill="var(--muted)" fillOpacity={0.5} isAnimationActive={false} />
                          <Line dataKey="median" stroke="var(--muted-foreground)" strokeWidth={1.5} strokeDasharray="4 3" dot={false} isAnimationActive={false} />
                          <Line dataKey="faculty" stroke="var(--chart-2)" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--chart-2)', strokeWidth: 0 }} activeDot={{ r: 5, stroke: 'var(--ring)', strokeWidth: 2 }} connectNulls isAnimationActive={false} />
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

            <ChartCard variant="normal" title="Score by section" description="Survey dimension breakdown" leoInsight={radarLeo}>
              <ChartFigure
                label="Score by section"
                summary={`Radar chart of survey dimensions: ${radarData.map((d) => `${d.name} ${d.score.toFixed(1)}`).join(', ')} out of 5.`}
                dataLength={radarData.length}
              >
                {(activeIndex) => (
                  <>
                    <ChartContainer config={radarChartConfig} className="h-52 w-full text-xs">
                      <RadarChart data={radarData} outerRadius="75%">
                        <PolarGrid stroke="var(--border)" />
                        <PolarAngleAxis dataKey="name" tick={CHART_AXIS_TICK} />
                        <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
                        <Radar dataKey="score" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.15} strokeWidth={2} dot={{ r: 3, fill: 'var(--chart-2)' }} isAnimationActive={false} />
                      </RadarChart>
                    </ChartContainer>
                    <ChartDataTable
                      caption="Score by section"
                      headers={['Dimension', 'Score']}
                      rows={radarData.map((d) => [d.name, `${d.score.toFixed(1)}/5`])}
                    />
                  </>
                )}
              </ChartFigure>
            </ChartCard>
          </div>

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
