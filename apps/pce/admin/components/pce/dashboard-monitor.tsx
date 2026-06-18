'use client'

/**
 * DashboardMonitor — the at-a-glance monitoring layer on the Course Evaluation
 * Dashboard (`/analytics`). Answers "what needs me right now?" for the current
 * evaluation cycle, above the analytical By Term/Faculty/Course tabs.
 *
 * Blocks (build-plan §5): KPI strip (deltas + absolute counts) · evaluation
 * status (segmented bar) · response-by-course-type (bullets vs 70% target) ·
 * at-risk evaluations (ranked, below 60%, inline Nudge).
 *
 * DS: KeyMetrics + Card + Button + tokens. The segmented bar and bullet are
 * token-styled compositions (DS has no such primitive). No red in score/risk
 * viz (aarti_no_red) — "below threshold" = amber (--chart-4).
 */

import { useMemo } from 'react'
import {
  KeyMetrics, Button,
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@exxatdesignux/ui'
import type { MetricItem } from '@exxatdesignux/ui'
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

/** Status → display group + token color. No red (aarti_no_red). */
const STATUS_GROUPS: { key: string; label: string; statuses: string[]; color: string }[] = [
  { key: 'live',      label: 'Live',      statuses: ['active', 'collecting'],  color: 'var(--brand-color)' },
  { key: 'scheduled', label: 'Scheduled', statuses: ['scheduled', 'planned'],  color: 'var(--chart-1)' },
  { key: 'review',    label: 'In review', statuses: ['pending_review'],         color: 'var(--chart-4)' },
  { key: 'released',  label: 'Released',  statuses: ['released'],               color: 'var(--chart-2)' },
  { key: 'closed',    label: 'Closed',    statuses: ['closed'],                 color: 'var(--muted-foreground)' },
  { key: 'draft',     label: 'Draft',     statuses: ['draft'],                  color: 'var(--border-control-35)' },
]

function weightedRate(surveys: PceSurvey[]): number | null {
  const enrolled = surveys.reduce((s, x) => s + x.enrollmentCount, 0)
  if (enrolled === 0) return null
  return Math.round(surveys.reduce((s, x) => s + x.responseRate * x.enrollmentCount, 0) / enrolled)
}

/** Deadlines arrive as 'MMM DD, YYYY' (e.g. "Apr 30, 2026") or ISO — both
 *  parse via `new Date(str)`. Returns null for unparseable/missing dates so the
 *  "days left" line hides rather than rendering a NaN-derived "closing today". */
function daysUntil(dateStr: string): number | null {
  const t = new Date(dateStr).getTime()
  if (!Number.isFinite(t)) return null
  return Math.ceil((t - Date.now()) / 86_400_000)
}

/** Token-styled bullet: fill + qualitative track + target tick. */
function Bullet({ value, color, target }: { value: number; color: string; target?: number }) {
  return (
    <div className="relative h-2.5 w-full rounded-full" style={{ background: 'var(--muted)' }}>
      <div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }}
      />
      {target != null && (
        <div
          className="absolute w-0.5 rounded-full"
          style={{ left: `${target}%`, top: -2, bottom: -2, background: 'var(--foreground)' }}
          aria-hidden="true"
        />
      )}
    </div>
  )
}

export function DashboardMonitor({
  surveys,
  onNudge,
}: {
  surveys: PceSurvey[]
  onNudge: (t: MonitorNudgeTarget) => void
}) {
  const live = surveys

  // Current evaluation cycle = latest term present (chronological).
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

  // Catch-all so an unknown/future status still segments (and the bar always
  // sums to the full cycle) rather than silently dropping out.
  const matchedStatuses = new Set(STATUS_GROUPS.flatMap(g => g.statuses))
  const otherCount = cycle.filter(s => !matchedStatuses.has(s.status)).length
  const segments = [
    ...STATUS_GROUPS.map(g => ({ key: g.key, label: g.label, color: g.color, count: counts[g.key] ?? 0 })),
    ...(otherCount > 0 ? [{ key: 'other', label: 'Other', color: 'var(--border)', count: otherCount }] : []),
  ].filter(s => s.count > 0)
  const totalCount = cycle.length

  const liveSurveys = cycle.filter(s => s.status === 'active' || s.status === 'collecting')
  const responsesCollected = cycle.reduce((s, x) => s + x.responseCount, 0)
  const enrolledTotal = cycle.reduce((s, x) => s + x.enrollmentCount, 0)
  const avgRate = weightedRate(cycle)
  const prevAvgRate = prevTerm ? weightedRate(live.filter(s => s.term === prevTerm)) : null
  const rateDelta = avgRate != null && prevAvgRate != null ? avgRate - prevAvgRate : null
  const facultyEvaluated = new Set(cycle.flatMap(s => s.instructors.map(i => i.id))).size

  const atRisk = useMemo(() =>
    liveSurveys
      .filter(s => s.responseRate < AT_RISK_THRESHOLD)
      .sort((a, b) => a.responseRate - b.responseRate),
    [liveSurveys],
  )

  // Response by course type (current cycle, only types with data).
  const byType = useMemo(() => {
    return (['didactic', 'clinical'] as const)
      .map(type => {
        const subset = cycle.filter(s => s.courseType === type)
        const rate = weightedRate(subset)
        return rate == null ? null : { type, rate, courses: subset.length }
      })
      .filter((x): x is { type: 'didactic' | 'clinical'; rate: number; courses: number } => x !== null)
  }, [cycle])

  const kpis: MetricItem[] = [
    {
      id: 'active', label: 'Active evaluations', value: liveSurveys.length,
      delta: `${counts.scheduled ?? 0} scheduled · ${counts.closed ?? 0} closed`, trend: 'neutral',
    },
    {
      id: 'rate', label: 'Avg response rate', value: avgRate != null ? `${avgRate}%` : '—',
      delta: rateDelta != null ? `${rateDelta >= 0 ? '+' : ''}${rateDelta}% vs ${prevTerm}` : '',
      trend: rateDelta == null ? 'neutral' : rateDelta > 0 ? 'up' : rateDelta < 0 ? 'down' : 'neutral',
    },
    {
      id: 'responses', label: 'Responses collected', value: responsesCollected.toLocaleString(),
      delta: `of ${enrolledTotal.toLocaleString()} students`, trend: 'neutral',
    },
    { id: 'faculty', label: 'Faculty evaluated', value: facultyEvaluated, delta: '', trend: 'neutral' },
    {
      id: 'atrisk', label: 'Courses at risk', value: atRisk.length,
      delta: `below ${AT_RISK_THRESHOLD}%`, trend: 'neutral',
    },
  ]

  if (!currentTerm || cycle.length === 0) return null

  return (
    <div className="flex flex-col gap-4 max-w-5xl">
      <div className="flex items-baseline justify-between">
        <p className="text-sm text-muted-foreground">
          Monitoring <span className="font-medium text-foreground">{currentTerm}</span> — the active evaluation cycle.
        </p>
      </div>

      <div className="[&_*]:!border-e-0">
        <KeyMetrics variant="compact" showHeader={false} metricsSingleRow metrics={kpis} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Evaluation status — segmented bar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Evaluation status</CardTitle>
            <CardDescription>{totalCount} evaluation{totalCount !== 1 ? 's' : ''} this cycle</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-2.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--muted)' }} role="img" aria-label="Evaluation status distribution">
              {segments.map(s => (
                <div key={s.key} style={{ width: `${(s.count / totalCount) * 100}%`, background: s.color }} title={`${s.label}: ${s.count}`} />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
              {segments.map(s => (
                <span key={s.key} className="flex items-center gap-1.5 text-xs">
                  <span className="size-2 rounded-full" style={{ background: s.color }} aria-hidden="true" />
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="font-semibold tabular-nums">{s.count}</span>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Response by course type — bullets vs target */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Response by course type</CardTitle>
            <CardDescription>Completion vs {RESPONSE_TARGET}% target</CardDescription>
          </CardHeader>
          <CardContent>
            {byType.length === 0 ? (
              <p className="text-sm text-muted-foreground">No course-type data this cycle.</p>
            ) : (
              <div className="flex flex-col gap-3.5">
                {byType.map(({ type, rate, courses }) => (
                  <div key={type} className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="capitalize font-medium">{type} <span className="text-muted-foreground font-normal">· {courses} course{courses !== 1 ? 's' : ''}</span></span>
                      <span className="tabular-nums font-semibold" style={{ color: rate >= RESPONSE_TARGET ? 'var(--chart-2)' : 'var(--chip-4)' }}>{rate}%</span>
                    </div>
                    <Bullet value={rate} target={RESPONSE_TARGET} color={rate >= RESPONSE_TARGET ? 'var(--chart-2)' : 'var(--brand-color)'} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* At-risk evaluations */}
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
              {atRisk.map(s => {
                const nonResponders = Math.max(0, s.enrollmentCount - s.responseCount)
                const days = s.deadline ? daysUntil(s.deadline) : null
                return (
                  <div key={s.id} className="flex items-center gap-4 py-2.5 border-b border-border last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {s.courseCode} <span className="text-muted-foreground font-normal">{s.courseName}</span>
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 max-w-[280px]">
                        <Bullet value={s.responseRate} target={AT_RISK_THRESHOLD} color="var(--chart-4)" />
                        <span className="text-xs tabular-nums font-semibold w-9 text-right" style={{ color: 'var(--chip-4)' }}>{s.responseRate}%</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 hidden sm:block">
                      <p className="text-xs text-muted-foreground tabular-nums">{nonResponders} non-responders</p>
                      {days != null && (
                        <p className="text-xs text-muted-foreground tabular-nums">{days > 0 ? `${days} days left` : 'closing today'}</p>
                      )}
                    </div>
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
