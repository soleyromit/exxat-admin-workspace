'use client'

/**
 * LiveCollectionCard — real-time "filled vs yet-to-fill" monitor for published
 * surveys that are collecting against a deadline (course evaluations OR
 * programmatic). Shows the aggregate collected/outstanding split + a per-survey
 * breakdown sorted by URGENCY, with at-risk rows emphasised.
 *
 * At-risk evaluation (the refined model — emphasis was too weak before):
 *   at-risk = live & ( response rate < 60%  OR  (rate < 70% target AND closes ≤ 3 days) )
 *   urgency = gap-to-target ÷ days-left  (+ a big boost if at-risk) → most urgent first.
 * No red (aarti_no_red) — at-risk = amber (--chip-4 text / --chart-4 fill).
 */

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Badge } from '@exxatdesignux/ui'
import type { PceSurvey } from '@/lib/pce-mock-data'
import type { MonitorNudgeTarget } from '@/components/pce/dashboard-monitor'

const TARGET = 70
const AT_RISK = 60

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
  // Published + actively collecting + has a deadline.
  const live = useMemo(
    () => surveys.filter(s => (s.status === 'active' || s.status === 'collecting') && !!s.deadline),
    [surveys],
  )

  const rows = useMemo(() =>
    live.map(s => {
      const days = daysUntil(s.deadline!)
      const gap = Math.max(0, TARGET - s.responseRate)
      const atRisk = s.responseRate < AT_RISK || (s.responseRate < TARGET && days != null && days <= 3)
      const urgency = (days != null ? gap / Math.max(1, days) : gap) + (atRisk ? 1000 : 0)
      return {
        s, days, atRisk, urgency,
        filled: s.responseCount,
        outstanding: Math.max(0, s.enrollmentCount - s.responseCount),
        enrolled: s.enrollmentCount,
        rate: s.responseRate,
      }
    }).sort((a, b) => b.urgency - a.urgency),
    [live],
  )

  if (live.length === 0) return null

  const filled = live.reduce((a, s) => a + s.responseCount, 0)
  const enrolled = live.reduce((a, s) => a + s.enrollmentCount, 0)
  const outstanding = Math.max(0, enrolled - filled)
  const pctFilled = enrolled > 0 ? Math.round((filled / enrolled) * 100) : 0
  const nearest = rows.reduce<number | null>((m, r) => (r.days != null && (m == null || r.days < m)) ? r.days : m, null)
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
          {nearest != null && (
            <span className="text-xs tabular-nums" style={{ color: nearest <= 3 ? 'var(--chip-4)' : 'var(--muted-foreground)' }}>
              nearest deadline {nearest <= 0 ? 'today' : `in ${nearest} day${nearest !== 1 ? 's' : ''}`}
            </span>
          )}
        </div>
        <CardDescription>
          <span className="font-medium text-foreground tabular-nums">{filled.toLocaleString()}</span> of {enrolled.toLocaleString()} responses in
          {' · '}<span className="font-medium tabular-nums" style={{ color: 'var(--chip-4)' }}>{outstanding.toLocaleString()} yet to fill</span>
          {' · '}{live.length} live {noun}{live.length !== 1 ? 's' : ''}{atRiskCount > 0 ? ` · ${atRiskCount} at risk` : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* aggregate filled vs outstanding */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 flex h-3 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }} role="img" aria-label={`${pctFilled}% of invited have responded`}>
            <div style={{ width: `${pctFilled}%`, background: 'var(--chart-2)' }} title={`${filled} filled`} />
          </div>
          <span className="text-sm font-semibold tabular-nums w-10 text-right">{pctFilled}%</span>
        </div>

        {/* per-survey, urgency-sorted */}
        <div className="flex flex-col">
          {rows.map(r => {
            const barColor = r.rate >= TARGET ? 'var(--chart-2)' : r.rate >= AT_RISK ? 'var(--brand-color)' : 'var(--chart-4)'
            const urgent = r.days != null && r.days <= 3
            return (
              <div key={r.s.id} className="flex items-center gap-4 py-2.5 border-b border-border last:border-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">
                      {r.s.courseCode} <span className="text-muted-foreground font-normal">{r.s.courseName}</span>
                    </p>
                    {r.atRisk && (
                      <Badge variant="outline" className="text-[10px] leading-none py-0.5 shrink-0" style={{ color: 'var(--chip-4)', borderColor: 'var(--chip-4)' }}>
                        At risk
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 max-w-[320px]">
                    <div className="flex-1 flex h-2 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
                      <div style={{ width: `${r.enrolled > 0 ? (r.filled / r.enrolled) * 100 : 0}%`, background: barColor }} />
                    </div>
                    <span className="text-xs tabular-nums text-muted-foreground w-14 text-right">{r.filled}/{r.enrolled}</span>
                  </div>
                </div>
                <div className="text-right shrink-0 w-20 hidden sm:block">
                  <p className="text-xs tabular-nums font-semibold" style={{ color: urgent ? 'var(--chip-4)' : 'var(--muted-foreground)' }}>
                    {r.days == null ? '—' : r.days <= 0 ? 'closes today' : `${r.days}d left`}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">{r.outstanding} to fill</p>
                </div>
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
      </CardContent>
    </Card>
  )
}
