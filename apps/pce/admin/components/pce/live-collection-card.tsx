'use client'

/**
 * LiveCollectionCard — real-time monitor for published surveys collecting against
 * a deadline (course evaluations OR programmatic).
 *
 * Viz = a "collection risk map" bubble scatter (NOT progress bars — Romit has
 * repeatedly rejected bars/gauges; see feedback_no_basic_progress_bar_viz):
 *   x = days to deadline (closing-soon on the left)
 *   y = % responded (0 bottom → 100 top), 70% target line
 *   bubble size = people still outstanding (yet to fill)
 *   color = risk tier; bottom-left "danger zone" (closing soon + low response) is
 *   shaded so at-risk surveys are emphasised SPATIALLY.
 * No red (aarti_no_red) — at-risk = amber (--chart-4 / --chip-4).
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

export function LiveCollectionCard({
  surveys,
  onNudge,
  noun = 'evaluation',
}: {
  surveys: PceSurvey[]
  onNudge: (t: MonitorNudgeTarget) => void
  noun?: string
}) {
  const live = useMemo(
    () => surveys.filter(s => (s.status === 'active' || s.status === 'collecting') && !!s.deadline),
    [surveys],
  )

  const points = useMemo(() => {
    const maxOut = Math.max(1, ...live.map(s => Math.max(0, s.enrollmentCount - s.responseCount)))
    return live.map(s => {
      const days = daysUntil(s.deadline!) ?? 0
      const rate = s.responseRate
      const outstanding = Math.max(0, s.enrollmentCount - s.responseCount)
      const atRisk = rate < AT_RISK || (rate < TARGET && days <= SOON_DAYS)
      return {
        s, days: Math.max(0, days), rate, outstanding, atRisk,
        urgency: (rate < TARGET ? (TARGET - rate) / Math.max(1, days) : 0) + (atRisk ? 1000 : 0),
        r: 5 + Math.sqrt(outstanding / maxOut) * 11, // px radius, area-proportional
      }
    }).sort((a, b) => b.urgency - a.urgency)
  }, [live])

  if (live.length === 0) return null

  const filled = live.reduce((a, s) => a + s.responseCount, 0)
  const enrolled = live.reduce((a, s) => a + s.enrollmentCount, 0)
  const outstanding = Math.max(0, enrolled - filled)
  const nearest = points.reduce<number>((m, p) => Math.min(m, p.days), Infinity)
  const atRisk = points.filter(p => p.atRisk)

  // x-axis: 0 → XMAX days (closing-soon at the left)
  const XMAX = Math.min(21, Math.max(7, ...points.map(p => p.days)))
  const tierColor = (rate: number) =>
    rate >= TARGET ? 'var(--chart-2)' : rate >= AT_RISK ? 'var(--brand-color)' : 'var(--chart-4)'
  // map data → plot %, inset so edge bubbles stay inside
  const xPct = (days: number) => 4 + (Math.min(days, XMAX) / XMAX) * 92
  const yPct = (rate: number) => 6 + (1 - Math.min(100, Math.max(0, rate)) / 100) * 88
  const xTicks = [0, Math.round(XMAX / 2), XMAX]

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
              nearest deadline {nearest <= 0 ? 'today' : `in ${nearest} day${nearest !== 1 ? 's' : ''}`}
            </span>
          )}
        </div>
        <CardDescription>
          <span className="font-medium text-foreground tabular-nums">{filled.toLocaleString()}</span> responses in
          {' · '}<span className="font-medium tabular-nums" style={{ color: 'var(--chip-4)' }}>{outstanding.toLocaleString()} yet to fill</span>
          {' · '}{live.length} live {noun}{live.length !== 1 ? 's' : ''}{atRisk.length > 0 ? ` · ${atRisk.length} at risk` : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Collection risk map */}
        <div className="flex" style={{ height: 196 }}>
          {/* y-axis gutter */}
          <div className="relative w-8 shrink-0 text-[10px] text-muted-foreground">
            {[100, 70, 40, 0].map(v => (
              <span key={v} className="absolute right-1 tabular-nums -translate-y-1/2" style={{ top: `${yPct(v)}%` }}>{v}%</span>
            ))}
          </div>
          {/* plot */}
          <div className="relative flex-1" style={{ overflow: 'visible' }}>
            {/* danger zone: closing soon + below at-risk floor */}
            <div
              className="absolute rounded-sm"
              style={{ left: 0, width: `${xPct(SOON_DAYS)}%`, top: `${yPct(AT_RISK)}%`, bottom: 0, background: 'var(--chart-4)', opacity: 0.08 }}
              aria-hidden="true"
            />
            {/* target line (70%) */}
            <div className="absolute inset-x-0 border-t border-dashed" style={{ top: `${yPct(TARGET)}%`, borderColor: 'var(--muted-foreground)' }} aria-hidden="true">
              <span className="absolute right-0 -top-3.5 text-[10px] text-muted-foreground">{TARGET}% target</span>
            </div>
            {/* closing-soon line (3d) */}
            <div className="absolute inset-y-0 border-l border-dashed" style={{ left: `${xPct(SOON_DAYS)}%`, borderColor: 'var(--chip-4)' }} aria-hidden="true" />
            {/* bubbles */}
            {points.map(p => (
              <div key={p.s.id} className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center" style={{ left: `${xPct(p.days)}%`, top: `${yPct(p.rate)}%` }}>
                <div
                  className="rounded-full"
                  style={{ width: p.r * 2, height: p.r * 2, background: tierColor(p.rate), opacity: 0.85, border: p.atRisk ? '1.5px solid var(--chip-4)' : 'none' }}
                  title={`${p.s.courseCode}: ${p.rate}% · ${p.outstanding} outstanding · ${p.days <= 0 ? 'closes today' : `${p.days}d left`}`}
                />
                <span className="text-[9px] text-muted-foreground mt-0.5 whitespace-nowrap leading-none">{p.s.courseCode}</span>
              </div>
            ))}
          </div>
        </div>
        {/* x-axis */}
        <div className="flex">
          <div className="w-8 shrink-0" />
          <div className="flex-1 flex justify-between text-[10px] text-muted-foreground mt-1">
            {xTicks.map((t, i) => <span key={i}>{t === 0 ? 'today' : `${t}d`}</span>)}
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 ps-8">Bubble size = people still to respond · shaded corner = closing soon &amp; below {AT_RISK}%</p>

        {/* at-risk actions — text only, no bars */}
        {atRisk.length > 0 && (
          <div className="flex flex-col mt-3 pt-3 border-t border-border">
            {atRisk.map(p => (
              <div key={p.s.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <Badge variant="outline" className="text-[10px] leading-none py-0.5 shrink-0" style={{ color: 'var(--chip-4)', borderColor: 'var(--chip-4)' }}>At risk</Badge>
                <p className="text-sm font-medium truncate flex-1 min-w-0">
                  {p.s.courseCode} <span className="text-muted-foreground font-normal">{p.s.courseName}</span>
                </p>
                <span className="text-xs tabular-nums shrink-0" style={{ color: 'var(--chip-4)' }}>{p.rate}%</span>
                <span className="text-xs tabular-nums text-muted-foreground shrink-0 w-20 text-right">
                  {p.days <= 0 ? 'closes today' : `${p.days}d left`} · {p.outstanding} left
                </span>
                <Button
                  variant="outline" size="sm" className="shrink-0"
                  onClick={() => onNudge({ id: p.s.id, courseCode: p.s.courseCode, courseName: p.s.courseName, nonResponders: p.outstanding })}
                  aria-label={`Send ad-hoc reminder for ${p.s.courseCode}`}
                >
                  Nudge
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
