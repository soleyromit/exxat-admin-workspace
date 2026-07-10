'use client'

import { Button, Avatar, AvatarFallback, KeyMetrics } from '@exxatdesignux/ui'
import type { MetricItem } from '@exxatdesignux/ui'
import Link from 'next/link'

const THRESHOLD = 60

function completionColor(pct: number) {
  return pct >= 80 ? 'var(--chart-2)' : pct >= 60 ? 'var(--chart-4)' : 'var(--brand-color)'
}

interface FacultyEntry {
  id: string; name: string; initials: string
  avgCompletion: number; delta: number | null; courses: string[]
  courseOffs: { code: string; rate: number }[]
  needsAttention: boolean
}

interface CollectingViewProps {
  selectedTermName: string
  termSurveys: any[]
  facultyForTerm: FacultyEntry[]
  avgCompletion: number
  completionDelta: number | null
  priorTermName: string | null
  statusCounts: { collecting: number; scheduled: number; pending: number; released: number; closed: number }
  attentionCount: number
  onNudge: (t: { id: string; name: string; courses: string[] }) => void
}

export function CollectingView({
  selectedTermName, termSurveys, facultyForTerm,
  avgCompletion, completionDelta, priorTermName,
  statusCounts, attentionCount, onNudge,
}: CollectingViewProps) {
  // Build unique course columns
  const courseCols = Array.from(new Set(facultyForTerm.flatMap(f => f.courseOffs.map(c => c.code))))

  const kpis: MetricItem[] = [
    { id: 'evals', label: 'Evaluations', value: String(termSurveys.filter(s => s.surveyType === 'course_evaluation').length), delta: `${statusCounts.collecting} collecting`, trend: 'neutral' },
    { id: 'rate', label: 'Avg completion', value: `${avgCompletion}%`, delta: completionDelta !== null ? `${completionDelta >= 0 ? '+' : ''}${completionDelta}% from ${priorTermName?.replace('Spring','Spr').replace('Fall','Fal') ?? 'last term'}` : 'No prior data', trend: completionDelta !== null ? (completionDelta >= 0 ? 'up' : 'down') : 'neutral' },
    { id: 'nudge', label: 'Need nudging', value: String(attentionCount), delta: attentionCount > 0 ? `Below ${THRESHOLD}%` : 'All on track', trend: attentionCount > 0 ? 'down' : 'up' },
  ]

  const swimLane = [
    { label: 'Scheduled', count: statusCounts.scheduled, color: 'var(--muted-foreground)', bg: 'var(--muted)' },
    { label: 'Collecting', count: statusCounts.collecting, color: 'var(--brand-color)', bg: 'var(--brand-tint)' },
    { label: 'Closed', count: statusCounts.closed, color: 'var(--foreground)', bg: 'var(--muted)' },
    { label: 'Pending review', count: statusCounts.pending, color: 'var(--chart-4)', bg: 'rgba(217,119,6,0.08)' },
    { label: 'Released', count: statusCounts.released, color: 'var(--chart-2)', bg: 'rgba(22,163,74,0.08)' },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Faculty × Course Heatmap */}
      <div>
        <p className="text-xs font-medium mb-3" style={{ color: 'var(--muted-foreground)' }}>
          COMPLETION BY FACULTY & COURSE — {selectedTermName}
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 400 }}>
            <thead>
              <tr>
                <th style={{ width: 180, padding: '0 12px 8px 0', textAlign: 'left' }} />
                {courseCols.map(code => (
                  <th key={code} style={{ padding: '0 4px 8px', textAlign: 'center', fontSize: 10, color: 'var(--muted-foreground)', fontFamily: 'monospace', fontWeight: 500, minWidth: 56 }}>
                    {code}
                  </th>
                ))}
                <th style={{ padding: '0 0 8px 12px', textAlign: 'right', fontSize: 10, color: 'var(--muted-foreground)', fontWeight: 500, width: 60 }}>Avg</th>
              </tr>
            </thead>
            <tbody>
              {facultyForTerm.map(f => (
                <tr key={f.id}>
                  <td style={{ paddingRight: 12, paddingBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarFallback className="text-xs font-semibold" style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}>{f.initials}</AvatarFallback>
                      </Avatar>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--foreground)', whiteSpace: 'nowrap' }}>{f.name.split(' ').pop()}</span>
                    </div>
                  </td>
                  {courseCols.map(code => {
                    const co = f.courseOffs.find(c => c.code === code)
                    if (!co) return (
                      <td key={code} style={{ padding: '0 4px 6px', textAlign: 'center' }}>
                        <div style={{ width: 52, height: 32, margin: '0 auto', borderRadius: 4, border: '1px dashed var(--border)', backgroundColor: 'var(--muted)' }} />
                      </td>
                    )
                    const bg = co.rate >= 80 ? 'rgba(22,163,74,0.12)' : co.rate >= 60 ? 'rgba(217,119,6,0.10)' : 'rgba(198,42,91,0.10)'
                    const fg = co.rate >= 80 ? 'var(--chart-2)' : co.rate >= 60 ? 'var(--chart-4)' : 'var(--brand-color)'
                    return (
                      <td key={code} style={{ padding: '0 4px 6px', textAlign: 'center' }}>
                        <div style={{ width: 52, height: 32, margin: '0 auto', borderRadius: 4, backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: fg, fontVariantNumeric: 'tabular-nums' }}>{co.rate}%</span>
                        </div>
                      </td>
                    )
                  })}
                  <td style={{ paddingLeft: 12, paddingBottom: 6, textAlign: 'right' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: completionColor(f.avgCompletion), fontVariantNumeric: 'tabular-nums' }}>{f.avgCompletion}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
          {([['rgba(22,163,74,0.12)', 'var(--chart-2)', '≥80% on track'], ['rgba(217,119,6,0.10)', 'var(--chart-4)', '60–79% watch'], ['rgba(198,42,91,0.10)', 'var(--brand-color)', '<60% nudge needed']] as const).map(([bg, fg, label]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: bg }} />
              <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Who needs a nudge */}
      {attentionCount > 0 && (
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--muted-foreground)' }}>
            NEEDS A REMINDER — {attentionCount} BELOW {THRESHOLD}%
          </p>
          <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            {facultyForTerm.filter(f => f.needsAttention).slice(0, 3).map((f, i) => (
              <div
                key={f.id}
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}
              >
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback className="text-xs font-semibold" style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}>{f.initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">{f.name}</span>
                  <span className="text-xs ms-2" style={{ color: 'var(--muted-foreground)' }}>{f.courses.join(', ')}</span>
                </div>
                <span className="text-sm font-bold tabular-nums shrink-0" style={{ color: 'var(--chart-4)' }}>{f.avgCompletion}%</span>
                {f.delta !== null && (
                  <span className="text-xs shrink-0" style={{ color: f.delta >= 0 ? 'var(--chart-2)' : 'var(--chart-4)' }}>
                    {f.delta > 0 ? '+' : ''}{f.delta}%
                  </span>
                )}
                <Button variant="outline" size="sm" className="h-7 text-xs shrink-0" onClick={() => onNudge({ id: f.id, name: f.name, courses: f.courses })}>
                  Send reminder
                </Button>
              </div>
            ))}
          </div>
          {attentionCount > 3 && (
            <p className="text-xs mt-2">
              <Link href="/analytics" style={{ color: 'var(--brand-color)' }}>+{attentionCount - 3} more · View all in Analytics</Link>
            </p>
          )}
        </div>
      )}

      {/* Swim lane */}
      <div>
        <p className="text-xs font-medium mb-3" style={{ color: 'var(--muted-foreground)' }}>
          EVALUATION LIFECYCLE
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {swimLane.map((stage, i) => (
            <div key={stage.label} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: stage.bg, border: `2px solid ${stage.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: stage.color, fontVariantNumeric: 'tabular-nums' }}>{stage.count}</span>
                </div>
                <span style={{ fontSize: 10, color: 'var(--muted-foreground)', whiteSpace: 'nowrap', textAlign: 'center' }}>{stage.label}</span>
              </div>
              {i < swimLane.length - 1 && (
                <div style={{ width: 24, height: 1, backgroundColor: 'var(--border)', flexShrink: 0, marginBottom: 14 }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* KeyMetrics */}
      <KeyMetrics variant="compact" showHeader={false} metricsSingleRow metrics={kpis} />
    </div>
  )
}
