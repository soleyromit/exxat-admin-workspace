'use client'

/* OverviewPanel — live composition + psychometric overview (sidebar layout).
   Faithful port of the sidebar branch of OverviewPanel + OverviewContent from
   the Claude Design overview.jsx. (Prototype-only topbar/floating layouts are
   intentionally dropped; product ships the sidebar default.) */

import { Card, CardContent, Badge, Button } from '@exxatdesignux/ui'
import { Icon, LeoStar } from '../icons'
import {
  aggregatePsy, totalQuestions, totalPoints, estTime, flaggedCount,
  fmt2, fmtPct, diffColor, discColor, pbiColor, type Section,
} from '../data'

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
      <div style={{ width: `${Math.min(100, pct)}%`, background: color }} className="h-full rounded-full" />
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
      <Bar pct={raw * 100} color={color} />
      {hint && <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

export function OverviewPanel({ sections, onAskLeo, onJumpFlags }: { sections: Section[]; onAskLeo?: () => void; onJumpFlags?: () => void }) {
  const all = sections.flatMap(s => s.questions)
  const nQ = totalQuestions(sections)
  const pts = totalPoints(sections)
  const time = estTime(sections)
  const psy = aggregatePsy(all)
  const flags = flaggedCount(sections)

  const comp = [
    { ic: 'list-check', l: 'Questions', v: String(nQ) },
    { ic: 'scale-balanced', l: 'Total score', v: `${pts} pts` },
    { ic: 'clock', l: 'Est. time', v: `${time} min` },
  ]

  return (
    <div style={{ position: 'sticky', top: 20 }}>
      <Card>
        <CardContent style={{ padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
          <Icon name="gauge-high" style={{ color: 'var(--brand-color-dark)', fontSize: 15 }} />
          <div style={{ fontSize: 14, fontWeight: 600 }}>Exam overview</div>
        </div>

        {/* composition tiles */}
        {comp.map(c => (
          <div key={c.l} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--muted)', display: 'grid', placeItems: 'center', color: 'var(--brand-color-dark)', flexShrink: 0 }}>
              <Icon name={c.ic} style={{ fontSize: 14 }} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 20, lineHeight: 1 }}>{c.v}</div>
              <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2 }}>{c.l}</div>
            </div>
          </div>
        ))}

        {/* psychometric quality */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '18px 0 12px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)' }}>Psychometric quality</div>
          <Badge variant="outline">{psy.covered}/{nQ} with history</Badge>
        </div>

        <PsyRow label="Difficulty index" value={fmt2(psy.p)} raw={psy.p} color={diffColor(psy.p)} hint="proportion answering correctly (target 0.4–0.8)" />
        <div style={{ display: 'flex', gap: 10, marginBottom: 13 }}>
          <div style={{ flex: 1, background: 'var(--muted)', borderRadius: 12, padding: '9px 11px' }}>
            <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Upper 27%</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 18, color: 'var(--chart-2)' }}>{fmtPct(psy.upper)}</div>
          </div>
          <div style={{ flex: 1, background: 'var(--muted)', borderRadius: 12, padding: '9px 11px' }}>
            <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Lower 27%</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 18, color: 'var(--chart-4)' }}>{fmtPct(psy.lower)}</div>
          </div>
        </div>
        <PsyRow label="Discrimination index" value={fmt2(psy.disc)} raw={psy.disc} color={discColor(psy.disc)} hint="separates strong from weak (target > 0.30)" />
        <PsyRow label="Avg. point-biserial" value={fmt2(psy.pbi)} raw={Math.max(0, psy.pbi)} color={pbiColor(psy.pbi)} hint="item–total alignment (target > 0.25)" />

        {flags > 0 && (
          <Button type="button" variant="ghost" onClick={onJumpFlags} className="flag-banner w-full h-auto justify-start whitespace-normal text-left font-normal" style={{ marginTop: 14 }}>
            <Icon name="triangle-exclamation" style={{ fontSize: 14, marginTop: 1 }} />
            <div><b>{flags} outlier question{flags > 1 ? 's' : ''} flagged.</b> Pulling the assessment&apos;s profile out of range — review before publishing.</div>
          </Button>
        )}
        <div style={{ marginTop: 14, display: 'flex' }}>
          <Button type="button" variant="ghost" size="sm" onClick={onAskLeo}><LeoStar />Ask Leo to balance this exam</Button>
        </div>
        </CardContent>
      </Card>
    </div>
  )
}
