'use client'

import { Button, Avatar, AvatarFallback } from '@exxatdesignux/ui'

const MOCK_TODAY = new Date('2026-05-01')
const NUDGE_LIFT = 9
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

interface CountdownViewProps {
  selectedTermName: string
  termSurveys: any[]
  facultyForTerm: FacultyEntry[]
  avgCompletion: number
  statusCounts: { collecting: number; scheduled: number; pending: number; released: number; closed: number }
  onNudge: (t: { id: string; name: string; courses: string[] }) => void
}

export function CountdownView({ selectedTermName, termSurveys, facultyForTerm, avgCompletion, statusCounts, onNudge }: CountdownViewProps) {
  const collectingCE = termSurveys.filter(s => s.status === 'collecting' && s.surveyType === 'course_evaluation')
  const deadlines = collectingCE.map(s => new Date(s.deadline ?? '2099-01-01'))
  const minDl = deadlines.length > 0 ? deadlines.reduce((a, b) => a < b ? a : b) : null
  const daysLeft = minDl ? Math.max(0, Math.ceil((minDl.getTime() - MOCK_TODAY.getTime()) / 86_400_000)) : 0
  const projectedWithNudge = Math.min(100, avgCompletion + NUDGE_LIFT)

  // SVG arc helpers
  const R = 38; const CX = 50; const CY = 50; const STROKE = 8
  function arcPath(pct: number, r: number) {
    const angle = (pct / 100) * 270 - 135  // -135° to +135° span = 270° arc
    const startAngle = -135 * Math.PI / 180
    const endAngle = (angle) * Math.PI / 180
    const x1 = CX + r * Math.cos(startAngle)
    const y1 = CY + r * Math.sin(startAngle)
    const x2 = CX + r * Math.cos(endAngle)
    const y2 = CY + r * Math.sin(endAngle)
    const largeArc = pct > 50 ? 1 : 0
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`
  }

  // Dot grid
  const totalEnrolled = collectingCE.reduce((s, x) => s + (x.enrollmentCount ?? 0), 0)
  const totalResponded = collectingCE.reduce((s, x) => s + Math.round((x.responseRate ?? 0) * (x.enrollmentCount ?? 0) / 100), 0)
  const totalPending = Math.max(0, totalEnrolled - totalResponded)
  const DOTS_CAP = 60
  const dotsToShow = Math.min(totalEnrolled, DOTS_CAP)
  const respondedDots = totalEnrolled > 0 ? Math.round((totalResponded / totalEnrolled) * dotsToShow) : 0

  return (
    <div className="flex flex-col gap-6">
      {/* Countdown hero */}
      <div
        className="rounded-lg border-l-4 border px-5 py-4"
        style={{ borderLeftColor: 'var(--chart-4)', borderColor: 'var(--border)', backgroundColor: 'rgba(217,119,6,0.04)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--foreground)', lineHeight: 1 }}>{daysLeft} {daysLeft === 1 ? 'day' : 'days'} left</p>
            <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginTop: 4 }}>
              {selectedTermName} · evaluation window closes {minDl?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) ?? '—'}
            </p>
            <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 12 }}>
              Historical nudge lift: <strong style={{ color: 'var(--chart-2)' }}>+{NUDGE_LIFT} points avg</strong>
            </p>
          </div>

          {/* SVG overlapping arcs */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <svg width={120} height={120} viewBox="0 0 100 100">
              {/* Background track */}
              <path d={arcPath(100, R)} fill="none" stroke="var(--muted)" strokeWidth={STROKE} strokeLinecap="round" />
              {/* Current rate */}
              <path d={arcPath(avgCompletion, R)} fill="none" stroke="var(--chart-4)" strokeWidth={STROKE} strokeLinecap="round" />
              {/* Projected */}
              <path d={arcPath(projectedWithNudge, R - 6)} fill="none" stroke="var(--chart-2)" strokeWidth={4} strokeLinecap="round" strokeDasharray="4 3" />
              <text x={CX} y={CY - 4} textAnchor="middle" style={{ fontSize: 14, fontWeight: 700, fill: 'var(--foreground)' }}>{avgCompletion}%</text>
              <text x={CX} y={CY + 10} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--chart-2)' }}>{projectedWithNudge}% projected</text>
            </svg>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 4 }}>
              <span style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--muted-foreground)' }}>
                <span style={{ display: 'inline-block', width: 16, height: 3, backgroundColor: 'var(--chart-4)', borderRadius: 2 }} /> Now
              </span>
              <span style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--muted-foreground)' }}>
                <span style={{ display: 'inline-block', width: 16, height: 2, backgroundImage: `repeating-linear-gradient(90deg, var(--chart-2) 0, var(--chart-2) 4px, transparent 4px, transparent 7px)` }} /> Projected
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Projected impact table */}
      <div>
        <p className="text-xs font-medium mb-3" style={{ color: 'var(--muted-foreground)' }}>
          PROJECTED IMPACT — SEND REMINDER TODAY
        </p>
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 24px 80px 120px', borderBottom: '1px solid var(--border)', padding: '6px 16px', backgroundColor: 'var(--muted)' }}>
            <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Faculty</span>
            <span style={{ fontSize: 11, color: 'var(--muted-foreground)', textAlign: 'right' }}>Without action</span>
            <span />
            <span style={{ fontSize: 11, color: 'var(--chart-2)', textAlign: 'right' }}>After reminder</span>
            <span />
          </div>
          {facultyForTerm.map((f, i) => {
            const projected = Math.min(100, f.avgCompletion + NUDGE_LIFT)
            const delta = projected - f.avgCompletion
            return (
              <div
                key={f.id}
                style={{ display: 'grid', gridTemplateColumns: '1fr 80px 24px 80px 120px', alignItems: 'center', padding: '10px 16px', borderTop: i > 0 ? '1px solid var(--border)' : undefined, backgroundColor: f.needsAttention ? 'rgba(217,119,6,0.04)' : undefined }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarFallback className="text-xs" style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}>{f.initials}</AvatarFallback>
                  </Avatar>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{f.name.split(' ').pop()}</span>
                </div>
                <span style={{ fontSize: 13, color: completionColor(f.avgCompletion), textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{f.avgCompletion}%</span>
                <span style={{ textAlign: 'center', color: 'var(--chart-2)', fontSize: 12 }}>→</span>
                <span style={{ fontSize: 13, color: 'var(--chart-2)', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>{projected}%</span>
                <span style={{ fontSize: 11, color: 'var(--chart-2)', textAlign: 'right' }}>+{delta} pts</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Dot grid */}
      {totalEnrolled > 0 && (
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--muted-foreground)' }}>
            {totalPending} OF {totalEnrolled} STUDENTS HAVEN'T RESPONDED
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 400, marginBottom: 12 }}>
            {Array.from({ length: dotsToShow }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 10, height: 10, borderRadius: '50%',
                  backgroundColor: i < respondedDots ? 'var(--chart-2)' : 'var(--border)',
                }}
              />
            ))}
            {totalEnrolled > DOTS_CAP && (
              <span style={{ fontSize: 10, color: 'var(--muted-foreground)', alignSelf: 'center' }}>+{totalEnrolled - DOTS_CAP} more</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Button variant="default" size="sm" onClick={() => facultyForTerm.filter(f => f.needsAttention).forEach(f => onNudge({ id: f.id, name: f.name, courses: f.courses }))}>
              Send to all {facultyForTerm.filter(f => f.needsAttention).length} below threshold
            </Button>
            <Button variant="outline" size="sm">Preview email</Button>
          </div>
        </div>
      )}

      {/* Mini Gantt */}
      {collectingCE.length > 0 && (
        <div>
          <p className="text-xs font-medium mb-3" style={{ color: 'var(--muted-foreground)' }}>WHAT CLOSES WHEN</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {collectingCE.map(s => {
              const dl = new Date(s.deadline ?? '2099-01-01')
              const days = Math.max(0, Math.ceil((dl.getTime() - MOCK_TODAY.getTime()) / 86_400_000))
              /* Urgency in words + amber, not a decorative countdown bar —
                 the days-left number IS the datum. */
              const urgencyColor = days <= 3 ? 'var(--chip-4)' : 'var(--muted-foreground)'
              return (
                <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '160px 1fr', alignItems: 'baseline', gap: 12 }}>
                  <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.courseCode}</span>
                  <span style={{ fontSize: 12, textAlign: 'right', whiteSpace: 'nowrap' }} className="tabular-nums">
                    <span style={{ color: 'var(--muted-foreground)' }}>closes {dl.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · </span>
                    <span style={{ color: urgencyColor, fontWeight: 500 }}>{days} {days === 1 ? 'day' : 'days'} left</span>
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
