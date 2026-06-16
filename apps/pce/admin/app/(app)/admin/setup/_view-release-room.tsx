'use client'

import { Button } from '@exxatdesignux/ui'

const LOW_N_THRESHOLD = 8

interface ReleaseRoomViewProps {
  selectedTermName: string
  termSurveys: any[]
  onOpenSurvey: (id: string) => void
}

export function ReleaseRoomView({ selectedTermName, termSurveys, onOpenSurvey }: ReleaseRoomViewProps) {
  const ce = termSurveys.filter(s => s.surveyType === 'course_evaluation')

  const surveys = ce.map(s => {
    const n = s.responseCount ?? Math.round((s.responseRate ?? 0) * (s.enrollmentCount ?? 0) / 100)
    const isLowN = n < LOW_N_THRESHOLD && n > 0
    const isReady = !isLowN && ['closed', 'pending_review'].includes(s.status) && ((s.responseRate ?? 0) >= 40)
    const isPending = s.status === 'pending_review' && !isReady
    return { ...s, n, isLowN, isReady, isPending }
  })

  const readyCount = surveys.filter(s => s.isReady).length
  const lowNCount = surveys.filter(s => s.isLowN).length
  const pendingCount = surveys.filter(s => s.isPending && !s.isReady && !s.isLowN).length
  const total = ce.length

  // SVG ring segments
  const RADIUS = 38; const CX = 50; const CY = 50
  function segmentPath(startPct: number, endPct: number, r: number) {
    const start = (startPct / 100) * 360 - 90
    const end = (endPct / 100) * 360 - 90
    const s = start * Math.PI / 180
    const e = end * Math.PI / 180
    const x1 = CX + r * Math.cos(s); const y1 = CY + r * Math.sin(s)
    const x2 = CX + r * Math.cos(e); const y2 = CY + r * Math.sin(e)
    const large = (endPct - startPct) > 50 ? 1 : 0
    return `M ${CX} ${CY} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`
  }

  const readyPct = (readyCount / Math.max(total, 1)) * 100
  const lowNPct = (lowNCount / Math.max(total, 1)) * 100

  return (
    <div className="flex flex-col gap-6">
      {/* Release readiness */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <svg width={110} height={110} viewBox="0 0 100 100">
            {/* gray base */}
            <circle cx={CX} cy={CY} r={RADIUS} fill="none" stroke="var(--muted)" strokeWidth={10} />
            {/* ready (green) */}
            {readyPct > 0 && (
              <path d={segmentPath(0, readyPct, RADIUS)} fill="var(--chart-2)" opacity={0.85} />
            )}
            {/* low-n (amber) */}
            {lowNPct > 0 && (
              <path d={segmentPath(readyPct, readyPct + lowNPct, RADIUS)} fill="var(--chart-4)" opacity={0.85} />
            )}
            {/* white inner circle for donut */}
            <circle cx={CX} cy={CY} r={28} fill="white" />
            <text x={CX} y={CY - 4} textAnchor="middle" style={{ fontSize: 16, fontWeight: 700, fill: 'var(--foreground)' }}>{readyCount}</text>
            <text x={CX} y={CY + 10} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--muted-foreground)' }}>of {total} ready</text>
          </svg>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 12, backgroundColor: 'rgba(22,163,74,0.1)', color: 'var(--chart-2)', fontWeight: 500 }}>{readyCount} ready to release</span>
            {lowNCount > 0 && <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 12, backgroundColor: 'rgba(217,119,6,0.1)', color: 'var(--chart-4)', fontWeight: 500 }}>{lowNCount} low response count</span>}
            {pendingCount > 0 && <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 12, backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', fontWeight: 500 }}>{pendingCount} pending review</span>}
          </div>
          <p style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
            {readyCount > 0 ? `Release all ${readyCount} ready evaluations at once, or review individually below.` : 'No evaluations are ready to release yet.'}
          </p>
          {readyCount > 0 && (
            <Button variant="default" size="sm" style={{ width: 'fit-content' }}>
              Release all {readyCount} ready
            </Button>
          )}
        </div>
      </div>

      {/* Decision table */}
      <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '200px 100px 60px 160px 140px 100px', padding: '8px 16px', backgroundColor: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
          {['Course', 'Rate', 'N', 'Confidence', 'Status', ''].map(h => (
            <span key={h} style={{ fontSize: 11, color: 'var(--muted-foreground)', fontWeight: 500 }}>{h}</span>
          ))}
        </div>
        {surveys.map((s, i) => {
          const leftColor = s.isReady ? 'var(--chart-2)' : s.isLowN ? 'var(--chart-4)' : 'var(--border)'
          const statusLabel = s.isReady ? 'Ready to release' : s.isLowN ? 'Low n — hold?' : 'Pending review'
          const statusBg = s.isReady ? 'rgba(22,163,74,0.1)' : s.isLowN ? 'rgba(217,119,6,0.1)' : 'var(--muted)'
          const statusColor = s.isReady ? 'var(--chart-2)' : s.isLowN ? 'var(--chart-4)' : 'var(--muted-foreground)'
          return (
            <div
              key={s.id}
              style={{ display: 'grid', gridTemplateColumns: '200px 100px 60px 160px 140px 100px', alignItems: 'center', padding: '10px 16px', borderTop: i > 0 ? '1px solid var(--border)' : undefined, borderLeft: `3px solid ${leftColor}` }}
            >
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--foreground)' }}>{s.courseCode}</p>
                <p style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{s.instructors?.[0]?.name ?? '—'}</p>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: 'var(--muted)', overflow: 'hidden', maxWidth: 60 }}>
                    <div style={{ height: '100%', width: `${s.responseRate ?? 0}%`, backgroundColor: s.isReady ? 'var(--chart-2)' : s.isLowN ? 'var(--chart-4)' : 'var(--border)', borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)' }}>{s.responseRate ?? 0}%</span>
                </div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)' }}>{s.n}</span>
              <span style={{ fontSize: 12, color: s.isLowN ? 'var(--chart-4)' : 'var(--chart-2)' }}>
                {s.isLowN ? `⚠ Low n=${s.n}` : `✓ Reliable (n=${s.n})`}
              </span>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, backgroundColor: statusBg, color: statusColor, fontWeight: 500, width: 'fit-content' }}>
                {statusLabel}
              </span>
              <div>
                {s.isReady && (
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => s.id && onOpenSurvey(s.id)}>Release</Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Low-n guidance */}
      {lowNCount > 0 && (
        <details className="rounded-lg border" style={{ borderColor: 'rgba(217,119,6,0.3)', backgroundColor: 'rgba(217,119,6,0.04)' }}>
          <summary style={{ padding: '10px 16px', fontSize: 13, color: 'var(--chart-4)', cursor: 'pointer', fontWeight: 500 }}>
            ⚠ {lowNCount} evaluation{lowNCount > 1 ? 's have' : ' has'} fewer than {LOW_N_THRESHOLD} responses — guidance
          </summary>
          <p style={{ padding: '0 16px 12px', fontSize: 13, color: 'var(--muted-foreground)', lineHeight: 1.6 }}>
            Evaluations with fewer than {LOW_N_THRESHOLD} responses may not fairly represent a faculty member's performance. Consider waiting for any pending responses, or marking the evaluation as insufficient data before releasing to the faculty member.
          </p>
        </details>
      )}

      {/* What faculty will see */}
      <p style={{ fontSize: 12, color: 'var(--muted-foreground)', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        When released, faculty receive an email with their results summary. Individual student responses remain anonymous.
      </p>
    </div>
  )
}
