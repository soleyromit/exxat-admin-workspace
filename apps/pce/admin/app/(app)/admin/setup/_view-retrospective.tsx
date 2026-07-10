'use client'

import Link from 'next/link'
import { Button, Card, CardContent } from '@exxatdesignux/ui'

const THRESHOLD = 60

function completionColor(pct: number) {
  return pct >= 80 ? 'var(--chart-2)' : pct >= 60 ? 'var(--chart-4)' : 'var(--brand-color)'
}

interface FacultyEntry {
  id: string; name: string; initials: string
  avgCompletion: number; delta: number | null
  courses: string[]; courseOffs: { code: string; rate: number }[]
  needsAttention: boolean
}

interface RetrospectiveViewProps {
  selectedTermName: string
  avgCompletion: number
  completionDelta: number | null
  priorTermName: string | null
  statusCounts: { collecting: number; scheduled: number; pending: number; released: number; closed: number }
  facultyForTerm: FacultyEntry[]
  attentionCount: number
  trendData: Array<{ term: string; rate: number; termFull: string }>
}

export function RetrospectiveView({
  selectedTermName, avgCompletion, completionDelta, priorTermName,
  statusCounts, facultyForTerm, attentionCount, trendData,
}: RetrospectiveViewProps) {
  // Slope chart SVG
  const WIDTH = 320; const HEIGHT = 140; const PAD = { l: 20, r: 80, t: 16, b: 24 }
  const chartH = HEIGHT - PAD.t - PAD.b

  const priorFaculty = facultyForTerm.map(f => ({
    ...f,
    priorRate: f.delta !== null ? f.avgCompletion - f.delta : null,
  }))

  function yPos(rate: number) {
    return PAD.t + chartH * (1 - rate / 100)
  }

  const insights = [
    facultyForTerm.length > 0 ? {
      text: `${facultyForTerm.reduce((best, f) => f.avgCompletion > best.avgCompletion ? f : best).name} achieved ${Math.max(...facultyForTerm.map(f => f.avgCompletion))}% — highest this term. Consider their approach as a benchmark.`,
      color: 'var(--chart-2)',
    } : null,
    {
      text: attentionCount > 0
        ? `${attentionCount} faculty finished below ${THRESHOLD}% — plan earlier nudges next term.`
        : `All faculty finished above ${THRESHOLD}% — strong completion across the board.`,
      color: attentionCount > 0 ? 'var(--chart-4)' : 'var(--chart-2)',
    },
    completionDelta !== null ? {
      text: `Response rate ${completionDelta >= 0 ? 'improved' : 'declined'} ${Math.abs(completionDelta)}% from ${priorTermName ?? 'last term'}${completionDelta >= 0 ? ' — trend is positive.' : ' — worth investigating.'}`,
      color: completionDelta >= 0 ? 'var(--chart-2)' : 'var(--chart-4)',
    } : null,
  ].filter(Boolean) as { text: string; color: string }[]

  return (
    <div className="flex flex-col gap-6">
      {/* Hero 3-number summary */}
      <div style={{ display: 'flex', alignItems: 'stretch', borderBottom: '1px solid var(--border)', paddingBottom: 20 }}>
        {[
          { value: `${avgCompletion}%`, label: 'avg completion', color: completionColor(avgCompletion) },
          { value: completionDelta !== null ? `${completionDelta >= 0 ? '+' : ''}${completionDelta}%` : '—', label: `vs ${priorTermName?.replace('Spring','Spr').replace('Fall','Fal') ?? 'last term'}`, color: completionDelta !== null ? (completionDelta >= 0 ? 'var(--chart-2)' : 'var(--chart-4)') : 'var(--muted-foreground)' },
          { value: String(statusCounts.released), label: 'evaluations released', color: 'var(--foreground)' },
        ].map((item, i) => (
          <div key={i} style={{ flex: 1, paddingLeft: i > 0 ? 24 : 0, borderLeft: i > 0 ? '1px solid var(--border)' : undefined, marginLeft: i > 0 ? 24 : 0 }}>
            <p style={{ fontSize: 28, fontWeight: 800, color: item.color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{item.value}</p>
            <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 6 }}>{item.label}</p>
          </div>
        ))}
      </div>

      {/* Slope chart */}
      {priorFaculty.some(f => f.priorRate !== null) && (
        <div>
          <p className="text-xs font-medium mb-3" style={{ color: 'var(--muted-foreground)' }}>
            FACULTY COMPLETION — {priorTermName?.replace('Spring','Spr').replace('Fall','Fal') ?? 'PRIOR'} → {selectedTermName.replace('Spring','Spr').replace('Fall','Fal')}
          </p>
          <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ overflow: 'visible' }}>
            {/* Threshold line */}
            <line x1={PAD.l} x2={WIDTH - PAD.r} y1={yPos(THRESHOLD)} y2={yPos(THRESHOLD)} stroke="var(--border)" strokeDasharray="4 3" strokeWidth={1} />
            <text x={PAD.l - 4} y={yPos(THRESHOLD) + 4} textAnchor="end" style={{ fontSize: 9, fill: 'var(--muted-foreground)' }}>{THRESHOLD}%</text>

            {/* Faculty lines */}
            {priorFaculty.filter(f => f.priorRate !== null).map(f => {
              const x1 = PAD.l; const y1 = yPos(f.priorRate!)
              const x2 = WIDTH - PAD.r; const y2 = yPos(f.avgCompletion)
              const color = f.avgCompletion < THRESHOLD || ((f.priorRate ?? 100) < THRESHOLD) ? 'var(--chart-4)' : 'var(--chart-2)'
              return (
                <g key={f.id}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1.5} strokeOpacity={0.7} />
                  <circle cx={x1} cy={y1} r={3} fill={color} />
                  <circle cx={x2} cy={y2} r={3} fill={color} />
                  <text x={x2 + 8} y={y2 + 4} style={{ fontSize: 10, fill: color, fontWeight: 600 }}>
                    {f.name.split(' ').pop()} {f.avgCompletion}%
                  </text>
                </g>
              )
            })}

            {/* X axis labels */}
            <text x={PAD.l} y={HEIGHT - 4} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--muted-foreground)' }}>
              {priorTermName?.replace('Spring','Spr').replace('Fall','Fal') ?? 'Prior'}
            </text>
            <text x={WIDTH - PAD.r} y={HEIGHT - 4} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--muted-foreground)' }}>
              {selectedTermName.replace('Spring','Spr').replace('Fall','Fal')}
            </text>
          </svg>
        </div>
      )}

      {/* What to carry forward */}
      <div>
        <p className="text-xs font-medium mb-3" style={{ color: 'var(--muted-foreground)' }}>WHAT TO CARRY FORWARD</p>
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          {insights.map((ins, i) => (
            <div
              key={i}
              style={{ display: 'flex', gap: 12, padding: '12px 16px', borderTop: i > 0 ? '1px solid var(--border)' : undefined, borderLeft: `3px solid ${ins.color}` }}
            >
              <p style={{ fontSize: 13, color: 'var(--foreground)', lineHeight: 1.5 }}>{ins.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Next term prompt */}
      <Card>
        <CardContent className="flex items-center gap-4 py-4">
          <div className="flex-1">
            <p className="text-sm font-medium">Ready to set up the next term?</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>All configuration is ready — activate when your scheduling is confirmed.</p>
          </div>
          <Button variant="outline" size="sm" className="shrink-0" asChild>
            <Link href="/surveys/push">Set up next term</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
