'use client'

import { Button } from '@exxatdesignux/ui'

interface OverviewPanelProps {
  totalQuestions: number
  totalPoints: number
  estimatedMinutes: number
  flagCount?: number
  psychometrics?: {
    p: number       // difficulty index 0-1
    disc: number    // discrimination index 0-1
    pbi: number     // point-biserial 0-1
    covered: number // questions with history
  }
  onAskLeo?: () => void
  onJumpFlags?: () => void
}

function diffColor(p: number) {
  if (p < 0.3) return 'var(--destructive)'
  if (p > 0.85) return 'var(--chip-4)'
  return 'var(--chip-2)'
}
function discColor(d: number) {
  if (d < 0.2) return 'var(--destructive)'
  if (d < 0.3) return 'var(--chip-4)'
  return 'var(--chip-2)'
}
function pbiColor(pbi: number) {
  if (pbi < 0.1) return 'var(--destructive)'
  if (pbi < 0.25) return 'var(--chip-4)'
  return 'var(--chip-2)'
}
function fmt2(n: number) { return n.toFixed(2) }

function Meter({ value, color }: { value: number; color: string }) {
  const pct = Math.min(100, Math.max(0, value * 100)).toFixed(1)
  return (
    <div style={{ height: 5, borderRadius: 99, background: 'var(--muted)', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.5s ease' }} />
    </div>
  )
}

function PsyRow({ label, value, raw, color, hint }: { label: string; value: string; raw: number; color: string; hint?: string }) {
  return (
    <div style={{ marginBottom: 13 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-display)', color }}>{value}</span>
      </div>
      <Meter value={raw} color={color} />
      {hint && <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

export function OverviewPanel({ totalQuestions, totalPoints, estimatedMinutes, flagCount = 0, psychometrics, onAskLeo, onJumpFlags }: OverviewPanelProps) {
  const psy = psychometrics ?? { p: 0, disc: 0, pbi: 0, covered: 0 }
  const hasPsy = psy.covered > 0

  const comp = [
    { icon: 'fa-list-check', label: 'Questions', value: totalQuestions },
    { icon: 'fa-scale-balanced', label: 'Total score', value: `${totalPoints} pts` },
    { icon: 'fa-clock', label: 'Est. time', value: `${estimatedMinutes} min` },
  ]

  return (
    // .card sidebar — the parent wrapper in the builder handles sticky positioning
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}>

        {/* Header — gauge-high + "Exam overview" */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
          <i className="fa-light fa-gauge-high" aria-hidden="true" style={{ color: 'var(--brand-color-dark)', fontSize: 15 }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>Exam overview</div>
        </div>

        {/* Composition tiles — 1-col stack */}
        {comp.map(c => (
          <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
            {/* icon tile */}
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--muted)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <i className={`fa-light ${c.icon}`} aria-hidden="true" style={{ fontSize: 14, color: 'var(--brand-color-dark)' }} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 20, lineHeight: 1, color: 'var(--foreground)' }}>
                {c.value}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2 }}>{c.label}</div>
            </div>
          </div>
        ))}

        {/* Psychometric quality header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '18px 0 12px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)' }}>
            Psychometric quality
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', height: 20, padding: '0 8px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 10, color: 'var(--muted-foreground)', background: 'var(--muted)' }}>
            {psy.covered}/{totalQuestions} with history
          </span>
        </div>

        {hasPsy ? (
          <>
            <PsyRow
              label="Difficulty index"
              value={fmt2(psy.p)}
              raw={psy.p}
              color={diffColor(psy.p)}
              hint="proportion answering correctly (target 0.4–0.8)"
            />
            <PsyRow
              label="Discrimination index"
              value={fmt2(psy.disc)}
              raw={psy.disc}
              color={discColor(psy.disc)}
              hint="separates strong from weak (target > 0.30)"
            />
            <PsyRow
              label="Avg. point-biserial"
              value={fmt2(psy.pbi)}
              raw={Math.max(0, psy.pbi)}
              color={pbiColor(psy.pbi)}
              hint="item–total alignment (target > 0.25)"
            />
          </>
        ) : (
          <div style={{ padding: '12px 0', fontSize: 12, color: 'var(--muted-foreground)', textAlign: 'center' }}>
            Psychometrics available after first exam delivery
          </div>
        )}

        {/* Flag banner */}
        {flagCount > 0 && (
          <div
            role="button"
            tabIndex={0}
            onClick={onJumpFlags}
            onKeyDown={e => { if (e.key === 'Enter') onJumpFlags?.() }}
            style={{ marginTop: 14, display: 'flex', gap: 10, padding: '11px 13px', borderRadius: 10, background: 'oklch(from var(--destructive) l c h / 0.08)', border: '1px solid oklch(from var(--destructive) l c h / 0.28)', fontSize: 12.5, cursor: 'pointer', outline: 'none' }}
          >
            <i className="fa-light fa-triangle-exclamation" aria-hidden="true" style={{ fontSize: 14, marginTop: 1, color: 'var(--destructive)', flexShrink: 0 }} />
            <div style={{ color: 'var(--foreground)' }}>
              <b>{flagCount} outlier question{flagCount > 1 ? 's' : ''} flagged.</b> Review before publishing.
            </div>
          </div>
        )}

        {/* Ask Leo button */}
        <div style={{ marginTop: 14 }}>
          <Button
            variant="default"
            size="sm"
            onClick={onAskLeo}
            style={{
              width: '100%', height: 36, borderRadius: 10,
              background: 'var(--leo-gradient, linear-gradient(135deg, oklch(0.57 0.24 342) 0%, oklch(0.48 0.20 320) 50%, oklch(0.44 0.18 280) 100%))',
              color: 'var(--primary-foreground)',
            }}
          >
            <i className="fa-duotone fa-star-christmas" aria-hidden="true" style={{ fontSize: 14 }} />
            Ask Leo to balance this exam
          </Button>
        </div>
      </div>
  )
}
