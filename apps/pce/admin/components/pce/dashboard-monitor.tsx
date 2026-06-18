'use client'

/**
 * DashboardMonitor — the at-a-glance monitoring layer on the Course Evaluation
 * Dashboard (`/analytics`, default "Overview" tab). Answers "what needs me right
 * now?" for the current evaluation cycle, above the analytical tabs.
 *
 * Viz is distribution- and trend-led (build-plan §3), NOT flat progress/segmented
 * bars (see feedback_no_basic_progress_bar_viz):
 *   • Response distribution — multi-dimensional scatter strip: x = response rate,
 *     dot size = enrollment, color = risk tier, with threshold + median reference
 *     lines. Shows spread, laggards and center at a glance.
 *   • Response rate over time — trend line across terms, current cycle marked.
 *   • At-risk worklist — actionable rows (no bars), inline Nudge.
 * DS: KeyMetrics + Card + ChartContainer + Button + tokens. No red (aarti_no_red);
 * amber TEXT uses --chip-4 (AA), amber FILLS use --chart-4.
 */

import { useMemo } from 'react'
import {
  KeyMetrics, Button,
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  ChartContainer, ChartTooltip,
} from '@exxatdesignux/ui'
import type { MetricItem, MetricInsight, ChartConfig } from '@exxatdesignux/ui'
import {
  ScatterChart, Scatter, Cell, XAxis, YAxis, ZAxis, ReferenceLine,
  AreaChart, Area, CartesianGrid,
} from 'recharts'
import type { PceSurvey } from '@/lib/pce-mock-data'

export interface MonitorNudgeTarget {
  id: string; courseCode: string; courseName: string; nonResponders: number
}

const TERM_ORDER = [
  'Spring 2022', 'Fall 2022', 'Spring 2023', 'Fall 2023',
  'Spring 2024', 'Fall 2024', 'Spring 2025', 'Fall 2025', 'Spring 2026',
]

const AT_RISK_THRESHOLD = 60
const RESPONSE_TARGET = 70

const STATUS_GROUPS: { key: string; label: string; statuses: string[]; color: string }[] = [
  { key: 'live',      label: 'Live',      statuses: ['active', 'collecting'], color: 'var(--brand-color)' },
  { key: 'scheduled', label: 'Scheduled', statuses: ['scheduled', 'planned'], color: 'var(--chart-1)' },
  { key: 'review',    label: 'In review', statuses: ['pending_review'],        color: 'var(--chart-4)' },
  { key: 'released',  label: 'Released',  statuses: ['released'],              color: 'var(--chart-2)' },
  { key: 'closed',    label: 'Closed',    statuses: ['closed'],                color: 'var(--muted-foreground)' },
  { key: 'draft',     label: 'Draft',     statuses: ['draft'],                 color: 'var(--border-control-35)' },
]

/** Risk tier → FILL token (fills don't need AA contrast). No red. */
const dotFill = (rate: number) =>
  rate >= RESPONSE_TARGET ? 'var(--chart-2)' : rate >= AT_RISK_THRESHOLD ? 'var(--brand-color)' : 'var(--chart-4)'

function weightedRate(surveys: PceSurvey[]): number | null {
  const enrolled = surveys.reduce((s, x) => s + x.enrollmentCount, 0)
  if (enrolled === 0) return null
  return Math.round(surveys.reduce((s, x) => s + x.responseRate * x.enrollmentCount, 0) / enrolled)
}

function median(nums: number[]): number | null {
  if (nums.length === 0) return null
  const s = [...nums].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2)
}

/** Deterministic vertical jitter in [0.18, 0.82] so the strip reads as a cloud. */
function jitter(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 1000
  return 0.18 + (h / 1000) * 0.64
}

/** Deadlines arrive as 'MMM DD, YYYY' or ISO — both parse via new Date(). Null when unparseable. */
function daysUntil(dateStr: string): number | null {
  const t = new Date(dateStr).getTime()
  if (!Number.isFinite(t)) return null
  return Math.ceil((t - Date.now()) / 86_400_000)
}

const distConfig: ChartConfig = { rate: { label: 'Response rate', color: 'var(--brand-color)' } }
const trendConfig: ChartConfig = { rate: { label: 'Response rate', color: 'var(--brand-color)' } }

export function DashboardMonitor({
  surveys,
  onNudge,
}: {
  surveys: PceSurvey[]
  onNudge: (t: MonitorNudgeTarget) => void
}) {
  const live = surveys

  const { currentTerm, prevTerm } = useMemo(() => {
    const present = new Set(live.map(s => s.term))
    const ordered = TERM_ORDER.filter(t => present.has(t))
    return {
      currentTerm: ordered[ordered.length - 1] ?? live[0]?.term ?? null,
      prevTerm: ordered[ordered.length - 2] ?? null,
    }
  }, [live])

  const cycle = useMemo(
    () => currentTerm ? live.filter(s => s.term === currentTerm) : [],
    [live, currentTerm],
  )

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const g of STATUS_GROUPS) c[g.key] = cycle.filter(s => g.statuses.includes(s.status)).length
    return c
  }, [cycle])

  const matchedStatuses = new Set(STATUS_GROUPS.flatMap(g => g.statuses))
  const otherCount = cycle.filter(s => !matchedStatuses.has(s.status)).length
  const statusChips = [
    ...STATUS_GROUPS.map(g => ({ key: g.key, label: g.label, color: g.color, count: counts[g.key] ?? 0 })),
    ...(otherCount > 0 ? [{ key: 'other', label: 'Other', color: 'var(--border)', count: otherCount }] : []),
  ].filter(s => s.count > 0)

  const liveSurveys = cycle.filter(s => s.status === 'active' || s.status === 'collecting')
  const responsesCollected = cycle.reduce((s, x) => s + x.responseCount, 0)
  const enrolledTotal = cycle.reduce((s, x) => s + x.enrollmentCount, 0)
  const avgRate = weightedRate(cycle)
  const prevAvgRate = prevTerm ? weightedRate(live.filter(s => s.term === prevTerm)) : null
  const rateDelta = avgRate != null && prevAvgRate != null ? avgRate - prevAvgRate : null
  const facultyEvaluated = new Set(cycle.flatMap(s => s.instructors.map(i => i.id))).size
  const closingThisWeek = liveSurveys.filter(s => {
    const d = s.deadline ? daysUntil(s.deadline) : null
    return d != null && d >= 0 && d <= 7
  }).length

  const atRisk = useMemo(() =>
    liveSurveys.filter(s => s.responseRate < AT_RISK_THRESHOLD).sort((a, b) => a.responseRate - b.responseRate),
    [liveSurveys],
  )

  // Distribution strip: every cycle course as a point (x = rate, size = enrollment, color = tier).
  const distData = useMemo(() =>
    cycle.map(s => ({
      rate: s.responseRate,
      y: jitter(s.id || s.courseCode),
      z: s.enrollmentCount,
      code: s.courseCode,
      name: s.courseName,
    })),
    [cycle],
  )
  const cycleMedian = useMemo(() => median(cycle.map(s => s.responseRate)), [cycle])

  // Response-rate trend across terms (real, weighted), current cycle marked.
  const trendData = useMemo(() => {
    const present = new Set(live.map(s => s.term))
    return TERM_ORDER.filter(t => present.has(t)).map(t => ({
      term: t.replace('Spring ', 'Sp ').replace('Fall ', 'Fa '),
      rate: weightedRate(live.filter(s => s.term === t)),
      current: t === currentTerm,
    }))
  }, [live, currentTerm])

  const byTypeNote = useMemo(() => {
    return (['didactic', 'clinical'] as const)
      .map(type => {
        const r = weightedRate(cycle.filter(s => s.courseType === type))
        return r == null ? null : `${type[0].toUpperCase()}${type.slice(1)} ${r}%`
      })
      .filter(Boolean).join('  ·  ')
  }, [cycle])

  // Prose goes in `description` (delta is reserved for the trend chip). The rate
  // delta uses `informational` polarity so a decline shows muted, never red.
  const kpis: MetricItem[] = [
    { id: 'active', label: 'Active evaluations', value: liveSurveys.length, delta: '', trend: 'neutral', description: `${counts.scheduled ?? 0} scheduled · ${counts.closed ?? 0} closed` },
    { id: 'rate', label: 'Avg response rate', value: avgRate != null ? `${avgRate}%` : '—', delta: rateDelta != null ? `${rateDelta >= 0 ? '+' : ''}${rateDelta}%` : '', trend: rateDelta == null ? 'neutral' : rateDelta > 0 ? 'up' : 'down', trendPolarity: 'informational', description: prevTerm ? `vs ${prevTerm}` : '' },
    { id: 'responses', label: 'Responses collected', value: responsesCollected.toLocaleString(), delta: '', trend: 'neutral', description: `of ${enrolledTotal.toLocaleString()} students` },
    { id: 'faculty', label: 'Faculty evaluated', value: facultyEvaluated, delta: '', trend: 'neutral' },
    { id: 'atrisk', label: 'Courses at risk', value: atRisk.length, delta: '', trend: 'neutral', description: `below ${AT_RISK_THRESHOLD}%` },
    { id: 'closing', label: 'Closing this week', value: closingThisWeek, delta: '', trend: 'neutral', description: 'within 7 days' },
  ]

  // Fill the KeyMetrics insight rail with a real, actionable summary (was empty → grey box).
  const worst = atRisk[0]
  const insight: MetricInsight = worst ? {
    title: `${atRisk.length} course${atRisk.length !== 1 ? 's' : ''} at risk`,
    description: `${worst.courseCode} (${worst.courseName}) is at ${worst.responseRate}% — nudge before it closes.`,
    severity: 'warning',
    actionLabel: `Nudge ${worst.courseCode}`,
    onAction: () => onNudge({ id: worst.id, courseCode: worst.courseCode, courseName: worst.courseName, nonResponders: Math.max(0, worst.enrollmentCount - worst.responseCount) }),
  } : {
    title: 'On track',
    description: `All ${liveSurveys.length} live evaluation${liveSurveys.length !== 1 ? 's are' : ' is'} at or above the ${AT_RISK_THRESHOLD}% threshold.`,
    severity: 'info',
  }

  if (!currentTerm || cycle.length === 0) return null

  return (
    <div className="flex flex-col gap-4 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">
          Monitoring <span className="font-medium text-foreground">{currentTerm}</span> — the active evaluation cycle.
        </p>
        {statusChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {statusChips.map(s => (
              <span key={s.key} className="flex items-center gap-1.5 text-xs">
                <span className="size-2 rounded-full" style={{ background: s.color }} aria-hidden="true" />
                <span className="text-muted-foreground">{s.label}</span>
                <span className="font-semibold tabular-nums">{s.count}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <KeyMetrics variant="compact" showHeader={false} metricsSingleRow insightCompact metrics={kpis} insight={insight} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Response distribution — multi-dimensional scatter strip */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Response distribution</CardTitle>
            <CardDescription>
              Each course by response rate · dot size = enrolment{byTypeNote ? ` · ${byTypeNote}` : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={distConfig} className="h-44 w-full" role="img" aria-label="Response-rate distribution across cycle courses">
              <ScatterChart margin={{ top: 18, right: 12, bottom: 0, left: 4 }}>
                <CartesianGrid horizontal={false} stroke="var(--border)" />
                <XAxis type="number" dataKey="rate" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v: number) => `${v}%`} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis type="number" dataKey="y" domain={[0, 1]} hide />
                <ZAxis type="number" dataKey="z" range={[50, 360]} />
                {/* threshold label sits low, median label sits high — no collision */}
                <ReferenceLine x={AT_RISK_THRESHOLD} stroke="var(--chip-4)" strokeDasharray="4 3" label={{ value: `${AT_RISK_THRESHOLD}% target`, position: 'insideBottomLeft', fontSize: 10, fill: 'var(--chip-4)' }} />
                {cycleMedian != null && (
                  <ReferenceLine x={cycleMedian} stroke="var(--muted-foreground)" strokeDasharray="2 2" label={{ value: `median ${cycleMedian}%`, position: 'insideTopRight', fontSize: 10, fill: 'var(--muted-foreground)' }} />
                )}
                <ChartTooltip
                  cursor={false}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0].payload as { code: string; name: string; rate: number; z: number }
                    return (
                      <div className="rounded-lg border border-border bg-popover px-2.5 py-1.5 text-xs shadow-md">
                        <p className="font-medium">{d.code} <span className="font-semibold tabular-nums" style={{ color: dotFill(d.rate) === 'var(--chart-4)' ? 'var(--chip-4)' : dotFill(d.rate) }}>{d.rate}%</span></p>
                        <p className="text-muted-foreground">{d.name} · {d.z} enrolled</p>
                      </div>
                    )
                  }}
                />
                <Scatter data={distData}>
                  {distData.map((d, i) => <Cell key={i} fill={dotFill(d.rate)} fillOpacity={0.8} stroke={dotFill(d.rate)} />)}
                </Scatter>
              </ScatterChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Response rate over time — trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Response rate over time</CardTitle>
            <CardDescription>Enrolment-weighted average per term · {RESPONSE_TARGET}% target</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={trendConfig} className="h-44 w-full" role="img" aria-label="Average response rate per term">
              <AreaChart data={trendData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="rateFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand-color)" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="var(--brand-color)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="term" interval={0} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v: number) => `${v}%`} width={40} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <ReferenceLine y={RESPONSE_TARGET} stroke="var(--muted-foreground)" strokeDasharray="4 3" label={{ value: `${RESPONSE_TARGET}% target`, position: 'insideTopRight', fontSize: 10, fill: 'var(--muted-foreground)' }} />
                <ChartTooltip
                  cursor={{ stroke: 'var(--border)' }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    const v = payload[0].value as number | null
                    return (
                      <div className="rounded-lg border border-border bg-popover px-2.5 py-1.5 text-xs shadow-md">
                        <p className="font-medium">{label} <span className="font-semibold tabular-nums">{v != null ? `${v}%` : '—'}</span></p>
                      </div>
                    )
                  }}
                />
                <Area
                  type="monotone" dataKey="rate" stroke="var(--brand-color)" strokeWidth={2}
                  fill="url(#rateFill)" connectNulls
                  dot={(props: { cx?: number; cy?: number; payload?: { current?: boolean } }) => {
                    const { cx, cy, payload } = props
                    if (cx == null || cy == null) return <g />
                    const cur = payload?.current
                    return <circle cx={cx} cy={cy} r={cur ? 5 : 3} fill={cur ? 'var(--brand-color)' : 'var(--card)'} stroke="var(--brand-color)" strokeWidth={2} />
                  }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* At-risk worklist — actionable rows, no bars */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">At-risk evaluations</CardTitle>
          <CardDescription>Live courses below {AT_RISK_THRESHOLD}% response — send an ad-hoc reminder</CardDescription>
        </CardHeader>
        <CardContent>
          {atRisk.length === 0 ? (
            <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
              <i className="fa-light fa-circle-check" aria-hidden="true" style={{ color: 'var(--chart-2)' }} />
              No courses below the {AT_RISK_THRESHOLD}% threshold this cycle.
            </div>
          ) : (
            <div className="flex flex-col">
              {atRisk.map((s, i) => {
                const nonResponders = Math.max(0, s.enrollmentCount - s.responseCount)
                const days = s.deadline ? daysUntil(s.deadline) : null
                return (
                  <div key={s.id} className="flex items-center gap-4 py-2.5 border-b border-border last:border-0">
                    <span className="text-xs tabular-nums text-muted-foreground w-4 text-center shrink-0">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {s.courseCode} <span className="text-muted-foreground font-normal">{s.courseName}</span>
                      </p>
                      <p className="text-xs text-muted-foreground tabular-nums mt-0.5">
                        {nonResponders} non-responders{days != null ? ` · ${days > 0 ? `${days} days left` : 'closing today'}` : ''}
                      </p>
                    </div>
                    <span className="text-base font-semibold tabular-nums shrink-0" style={{ color: 'var(--chip-4)' }}>{s.responseRate}%</span>
                    <Button
                      variant="outline" size="sm" className="shrink-0"
                      onClick={() => onNudge({ id: s.id, courseCode: s.courseCode, courseName: s.courseName, nonResponders })}
                      aria-label={`Send ad-hoc reminder for ${s.courseCode}`}
                    >
                      Nudge
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
