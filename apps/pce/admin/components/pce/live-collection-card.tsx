'use client'

/**
 * LiveCollectionCard — real-time monitor for published surveys collecting against
 * a deadline (course evaluations OR programmatic).
 *
 * Form follows the strongest survey products (Mobbin: Typeform "Big picture",
 * Hotjar "Survey overview/breakdown", Wayyy recent-surveys) — a clean per-survey
 * MONITORING LIST, not charts/bars/scatter. Each row carries a tiny inline
 * cumulative SPARKLINE (the "live graph" of how responses are accruing toward
 * close), completion, time-left and a Nudge. Urgency-sorted; at-risk emphasised
 * in amber (no red — aarti_no_red). Aggregate is plain text.
 */

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Badge } from '@exxatdesignux/ui'
import type { PceSurvey } from '@/lib/pce-mock-data'
import type { MonitorNudgeTarget } from '@/components/pce/dashboard-monitor'

const TARGET = 70
const AT_RISK = 60
const SOON_DAYS = 3

function daysUntil(dateStr: string): number | null {
  const t = new Date(dateStr).getTime()
  if (!Number.isFinite(t)) return null
  return Math.ceil((t - Date.now()) / 86_400_000)
}

const smooth = (x: number) => x * x * (3 - 2 * x)

/** Synthesised cumulative-collection sparkline (open → now), S-curve to current
 *  rate. Illustrative momentum, not a logged time-series. 64×18 viewBox. */
function sparkPoints(s: PceSurvey): string {
  const open = s.openDate ? new Date(s.openDate).getTime() : NaN
  const close = s.deadline ? new Date(s.deadline).getTime() : NaN
  const closed = s.status === 'closed' || s.status === 'released'
  const elapsed = (Number.isFinite(open) && Number.isFinite(close) && close > open)
    ? (closed ? 1 : Math.min(0.95, Math.max(0.15, (Date.now() - open) / (close - open))))
    : 1
  const N = 14
  return Array.from({ length: N + 1 }, (_, k) => {
    const t = (k / N) * elapsed
    const v = s.responseRate * smooth(elapsed === 0 ? 0 : t / elapsed) // 0..rate
    return `${(t / 1) * 64},${18 - (v / 100) * 16}`
  }).join(' ')
}

export function LiveCollectionCard({
  surveys,
  onNudge,
  noun = 'evaluation',
}: {
  surveys: PceSurvey[]
  onNudge: (t: MonitorNudgeTarget) => void
  noun?: string
}) {
  const rows = useMemo(() => {
    const live = surveys.filter(s => (s.status === 'active' || s.status === 'collecting') && !!s.deadline)
    return live.map(s => {
      const days = daysUntil(s.deadline!) ?? 0
      const atRisk = s.responseRate < AT_RISK || (s.responseRate < TARGET && days <= SOON_DAYS)
      return {
        s, days: Math.max(0, days), rate: s.responseRate, atRisk,
        filled: s.responseCount,
        enrolled: s.enrollmentCount,
        outstanding: Math.max(0, s.enrollmentCount - s.responseCount),
        urgency: (s.responseRate < TARGET ? (TARGET - s.responseRate) / Math.max(1, days) : 0) + (atRisk ? 1000 : 0),
      }
    }).sort((a, b) => b.urgency - a.urgency)
  }, [surveys])

  if (rows.length === 0) return null

  const filled = rows.reduce((a, r) => a + r.filled, 0)
  const outstanding = rows.reduce((a, r) => a + r.outstanding, 0)
  const nearest = rows.reduce((m, r) => Math.min(m, r.days), Infinity)
  const atRiskCount = rows.filter(r => r.atRisk).length

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <span className="relative flex size-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping" style={{ background: 'var(--chart-2)' }} />
              <span className="relative inline-flex size-2 rounded-full" style={{ background: 'var(--chart-2)' }} />
            </span>
            Live collection
          </CardTitle>
          {Number.isFinite(nearest) && (
            <span className="text-xs tabular-nums" style={{ color: nearest <= SOON_DAYS ? 'var(--chip-4)' : 'var(--muted-foreground)' }}>
              closes {nearest <= 0 ? 'today' : `in ${nearest}d`}
            </span>
          )}
        </div>
        <CardDescription>
          <span className="font-medium text-foreground tabular-nums">{filled.toLocaleString()}</span> responses in
          {' · '}<span className="font-medium tabular-nums" style={{ color: 'var(--chip-4)' }}>{outstanding.toLocaleString()} yet to fill</span>
          {' · '}{rows.length} live {noun}{rows.length !== 1 ? 's' : ''}{atRiskCount > 0 ? ` · ${atRiskCount} at risk` : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col">
          {rows.map(r => {
            const rateColor = r.rate >= TARGET ? 'var(--chart-2)' : r.atRisk ? 'var(--chip-4)' : 'var(--foreground)'
            const sparkStroke = r.rate >= TARGET ? 'var(--chart-2)' : r.atRisk ? 'var(--chart-4)' : 'var(--brand-color)'
            return (
              <div key={r.s.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
                <div className="min-w-0 flex-1 flex items-center gap-2">
                  <p className="text-sm font-medium truncate">
                    {r.s.courseCode} <span className="text-muted-foreground font-normal">{r.s.courseName}</span>
                  </p>
                  {r.atRisk && (
                    <Badge variant="outline" className="text-[10px] leading-none py-0.5 shrink-0" style={{ color: 'var(--chip-4)', borderColor: 'var(--chip-4)' }}>At risk</Badge>
                  )}
                </div>
                {/* per-survey cumulative sparkline — the "live graph" */}
                <svg width="64" height="18" viewBox="0 0 64 18" className="shrink-0 hidden sm:block" aria-hidden="true" preserveAspectRatio="none">
                  <polyline points={sparkPoints(r.s)} fill="none" stroke={sparkStroke} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                </svg>
                <span className="text-sm font-semibold tabular-nums w-10 text-right shrink-0" style={{ color: rateColor }}>{r.rate}%</span>
                <span className="text-xs text-muted-foreground tabular-nums w-14 text-right shrink-0 hidden md:block">{r.filled}/{r.enrolled}</span>
                <span className="text-xs tabular-nums w-16 text-right shrink-0" style={{ color: r.days <= SOON_DAYS ? 'var(--chip-4)' : 'var(--muted-foreground)' }}>
                  {r.days <= 0 ? 'closes today' : `${r.days}d left`}
                </span>
                <Button
                  variant="outline" size="sm" className="shrink-0"
                  onClick={() => onNudge({ id: r.s.id, courseCode: r.s.courseCode, courseName: r.s.courseName, nonResponders: r.outstanding })}
                  aria-label={`Send ad-hoc reminder for ${r.s.courseCode}`}
                >
                  Nudge
                </Button>
              </div>
            )
          })}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">Sparkline = responses accrued so far · sorted by urgency</p>
      </CardContent>
    </Card>
  )
}
