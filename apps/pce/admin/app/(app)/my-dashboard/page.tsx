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
  KeyMetrics,
  Popover,
  PopoverContent,
  PopoverTrigger,
  StatusBadge,
} from '@exxatdesignux/ui'
import type { MetricItem } from '@exxatdesignux/ui'
import {
  ChartCard, ChartFigure, ChartDataTable,
  type ChartLeoInsight,
} from '@/components/charts-overview'
import { SiteHeader } from '@/components/site-header'
import { usePce } from '@/components/pce/pce-state'
import { ResponseProgressCell } from '@/components/pce/response-gauge'
import { MOCK_FACULTY, MOCK_FACULTY_OFFERINGS, MOCK_RESPONSES, MOCK_SURVEY_QUESTION_DATA } from '@/lib/pce-mock-data'
import { deriveResults, programScoreBenchmarks, offeringKeyOf } from '@/lib/pce-results'
import { deriveThemes, type ThemeComment } from '@/lib/pce-themes'
import { withFrom } from '@/lib/pce-nav-origin'
import { RatingLegend, RatingStackedBar } from '@/components/pce/rating-viz'

const TERM_ORDER = [
  'Spring 2022', 'Fall 2022', 'Spring 2023', 'Fall 2023',
  'Spring 2024', 'Fall 2024', 'Spring 2025', 'Fall 2025', 'Spring 2026',
]

interface TrajectoryDatum {
  term: string
  min: number
  range: number
  median: number
  /** Middle 50% of the faculty distribution — the boxplot's box. */
  p25: number
  p75: number
  /** Every faculty offering average that term — the popover's strip plot. */
  scores: number[]
  faculty: number | null
}

/** Linear-interpolated quantile over a sorted ascending list. */
function quantileSorted(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0
  const idx = (sorted.length - 1) * q
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

/* Hand-rolled standing-per-term plot on the shared 3–5 window. Round-14 rework
   (Romit: "can't hover and see the data · everything is green, why?"):
   context marks are NEUTRAL (gray range column + median notch — they are the
   cohort, not a signal); color exists ONLY as sentiment on YOUR dot — teal at
   or above the faculty median, amber below (the page-wide rule). Every term
   column is a click-popover with the sectioned stat rows (the session's plot
   vocabulary — click, not hover, so it is keyboard-reachable too). */
function TrajectoryPlot({ data }: { data: TrajectoryDatum[] }) {
  const pos = (v: number) => (Math.min(5, Math.max(3, v)) - 3) / 2
  const n = data.length
  const points = data
    .map((d, i) => (d.faculty != null ? `${((i + 0.5) / n) * 100},${(1 - pos(d.faculty)) * 100}` : null))
    .filter(Boolean)
    .join(' ')
  return (
    <div className="w-full">
      <span className="sr-only">
        {`Your rating per term inside the full faculty range. ${data
          .filter((d) => d.faculty != null)
          .map((d) => `${d.term}: you ${d.faculty!.toFixed(2)}, median ${d.median.toFixed(2)}`)
          .join('; ')}.`}
      </span>
      <div className="flex gap-3">
        {/* Printed axis — 3.0–5.0 window */}
        <div
          className="relative h-60 w-7 shrink-0 text-xs text-muted-foreground tabular-nums"
          aria-hidden="true"
        >
          {[5, 4.5, 4, 3.5, 3].map((v) => (
            <span key={v} className="absolute right-0 -translate-y-1/2" style={{ top: `${(1 - pos(v)) * 100}%` }}>
              {v.toFixed(1)}
            </span>
          ))}
        </div>
        <div className="relative h-60 flex-1">
          {[5, 4.5, 4, 3.5, 3].map((v) => (
            <div
              key={v}
              aria-hidden="true"
              className="absolute inset-x-0 border-t border-dashed border-border"
              style={{ top: `${(1 - pos(v)) * 100}%` }}
            />
          ))}
          {/* Hairline trajectory between your dots — neutral, not a signal */}
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <polyline
              points={points}
              fill="none"
              stroke="var(--muted-foreground)"
              strokeWidth="1.5"
              strokeOpacity="0.35"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div className="absolute inset-0 flex">
            {data.map((d) => {
              const below = d.faculty != null && d.faculty < d.median - 0.005
              const gap = d.faculty != null ? d.faculty - d.median : null
              return (
                <div key={d.term} className="relative flex-1">
                  {/* DS boxplot anatomy (Chart → Statistical → Boxplot), the
                      SAME vocabulary as the results-page plots: whisker =
                      full range (neutral hairline + end caps), box = middle
                      50% (brand, 0.42), line = median (brand). Only YOUR dot
                      wears sentiment. */}
                  <div
                    aria-hidden="true"
                    className="absolute left-1/2 w-px -translate-x-1/2"
                    style={{
                      bottom: `${pos(d.min) * 100}%`,
                      height: `${(pos(d.min + d.range) - pos(d.min)) * 100}%`,
                      background: 'var(--muted-foreground)',
                      opacity: 0.6,
                    }}
                  />
                  {[d.min, d.min + d.range].map((v, i) => (
                    <div
                      key={i}
                      aria-hidden="true"
                      className="absolute left-1/2 h-px w-2.5 -translate-x-1/2"
                      style={{ top: `${(1 - pos(v)) * 100}%`, background: 'var(--muted-foreground)', opacity: 0.6 }}
                    />
                  ))}
                  <div
                    aria-hidden="true"
                    className="absolute left-1/2 w-4 -translate-x-1/2 rounded-[3px]"
                    style={{
                      bottom: `${pos(d.p25) * 100}%`,
                      height: `${Math.max(2, (pos(d.p75) - pos(d.p25)) * 100)}%`,
                      background: 'var(--brand-color)',
                      opacity: 0.42,
                    }}
                  />
                  {/* Median — brand line per the DS boxplot spec */}
                  <div
                    aria-hidden="true"
                    className="absolute left-1/2 h-0.5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{ top: `${(1 - pos(d.median)) * 100}%`, background: 'var(--brand-color)' }}
                  />
                  {/* Your dot + value — teal at/above median, amber below */}
                  {d.faculty != null && (
                    <>
                      <div
                        aria-hidden="true"
                        className="absolute left-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card"
                        style={{
                          top: `${(1 - pos(d.faculty)) * 100}%`,
                          background: below ? 'var(--chip-4)' : 'var(--chart-2)',
                        }}
                      />
                      <span
                        aria-hidden="true"
                        className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-sm bg-card/85 px-0.5 text-xs font-medium tabular-nums"
                        style={{
                          top: `calc(${(1 - pos(d.faculty)) * 100}% - 22px)`,
                          color: below ? 'var(--chip-4)' : 'var(--foreground)',
                        }}
                      >
                        {d.faculty.toFixed(2)}
                      </span>
                    </>
                  )}
                  {/* Whole-column click target → sectioned stat popover */}
                  <Popover>
                    <PopoverTrigger
                      aria-label={`${d.term} — your rating vs the faculty range, details`}
                      className="absolute inset-y-0 left-1/2 w-10 -translate-x-1/2 cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                    <PopoverContent className="w-72 p-0" side="top" align="center" sideOffset={6}>
                      <div className="flex flex-col">
                        <div className="border-b border-border px-3 py-2">
                          <p className="text-sm font-semibold">{d.term}</p>
                          <p className="text-xs text-muted-foreground">
                            {d.scores.length} faculty evaluated this term
                          </p>
                        </div>
                        {/* Where you sat — the term's actual faculty scores as
                            a strip plot on the 3–5 window; you are the only
                            colored mark, median is the brand tick. */}
                        <div className="border-b border-border px-3 py-2">
                          <p className="mb-1.5 text-xs text-muted-foreground">Where you sat</p>
                          <div className="relative h-7" aria-hidden="true">
                            <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
                            {d.scores.map((s, i) => (
                              <span
                                key={i}
                                className="absolute top-1/2 h-2.5 w-px -translate-x-1/2 -translate-y-1/2"
                                style={{ left: `${pos(s) * 100}%`, background: 'var(--muted-foreground)', opacity: 0.5 }}
                              />
                            ))}
                            <span
                              className="absolute top-1/2 h-3.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                              style={{ left: `${pos(d.median) * 100}%`, background: 'var(--brand-color)' }}
                            />
                            {d.faculty != null && (
                              <span
                                className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[var(--popover)]"
                                style={{
                                  left: `${pos(d.faculty) * 100}%`,
                                  background: below ? 'var(--chip-4)' : 'var(--chart-2)',
                                }}
                              />
                            )}
                          </div>
                          <div className="flex justify-between text-xs tabular-nums text-muted-foreground" aria-hidden="true">
                            <span>3.0</span>
                            <span>5.0</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5 px-3 py-2">
                          <div className="flex items-baseline justify-between gap-4">
                            <span className="text-xs text-muted-foreground">You</span>
                            <span className="text-right text-xs tabular-nums">
                              {d.faculty != null ? d.faculty.toFixed(2) : '— (no offering this term)'}
                            </span>
                          </div>
                          <div className="flex items-baseline justify-between gap-4">
                            <span className="text-xs text-muted-foreground">Faculty median</span>
                            <span className="text-right text-xs tabular-nums">{d.median.toFixed(2)}</span>
                          </div>
                          {gap != null && (
                            <div className="flex items-baseline justify-between gap-4">
                              <span className="text-xs text-muted-foreground">vs median</span>
                              <span
                                className="text-right text-xs font-medium tabular-nums"
                                style={{ color: Math.abs(gap) <= 0.005 ? 'var(--muted-foreground)' : below ? 'var(--chip-4)' : 'var(--chart-2)' }}
                              >
                                {Math.abs(gap) <= 0.005 ? 'At median' : `${gap > 0 ? '+' : '−'}${Math.abs(gap).toFixed(2)}`}
                              </span>
                            </div>
                          )}
                          <div className="flex items-baseline justify-between gap-4">
                            <span className="text-xs text-muted-foreground">Middle 50%</span>
                            <span className="text-right text-xs tabular-nums">
                              {d.p25.toFixed(2)}–{d.p75.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-baseline justify-between gap-4">
                            <span className="text-xs text-muted-foreground">Full range</span>
                            <span className="text-right text-xs tabular-nums">
                              {d.min.toFixed(2)}–{(d.min + d.range).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      {/* Term labels */}
      <div className="ms-10 flex" aria-hidden="true">
        {data.map((d) => (
          <span key={d.term} className="flex-1 pt-2 text-center text-xs text-muted-foreground">
            {d.term}
          </span>
        ))}
      </div>
    </div>
  )
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
      description: (() => { const n = new Set(scored.map(offeringKeyOf)).size; return `${n} released course${n !== 1 ? 's' : ''}` })(),
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
        p25: +quantileSorted(sorted, 0.25).toFixed(2),
        p75: +quantileSorted(sorted, 0.75).toFixed(2),
        scores: sorted.map((s) => +s.toFixed(2)),
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

          {/* Trajectory — hand-rolled per-term standing plot (not a library
              default): each term is a soft cohort-range column with a median
              notch; your value-labeled dot shows where you sat, a hairline
              connects the dots for direction. */}
          <ChartCard
            variant="normal"
            title="Rating over time"
            description="Faculty boxplot per term — box = middle 50%, line = median, whisker = full range · your dot (amber = below median) · click a term for details"
            leoInsight={bandLeo}
          >
            <ChartFigure
              label="Rating over time"
              summary="Your rating per term shown as a dot inside the full faculty range column, with the median notched per term."
              dataLength={trendData.length}
            >
              {() => (
                <>
                  <TrajectoryPlot data={trendData} />
                  <ChartDataTable
                    caption="Rating over time"
                    headers={['Term', 'You', 'Median', 'Middle 50%', 'Faculty range', 'Faculty evaluated']}
                    rows={trendData.map((d) => [
                      d.term,
                      d.faculty != null ? d.faculty.toFixed(2) : '—',
                      d.median.toFixed(2),
                      `${d.p25.toFixed(2)}–${d.p75.toFixed(2)}`,
                      `${d.min.toFixed(2)}–${(d.min + d.range).toFixed(2)}`,
                      d.scores.length,
                    ])}
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
