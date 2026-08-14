'use client'

/* Dual-view Preview & Simulation: Student View + Proctor Simulator.
   Faithful 1:1 port of the Claude Design preview-sim.jsx. */

import { useEffect, useState } from 'react'
import { Button, Input, Textarea, Badge } from '@exxatdesignux/ui'
import { Icon } from '../icons'
import {
  QTYPE,
  qIcon,
  type Section,
  type BuilderMeta,
} from '../data'

interface SimEvent { t: string; who: string; msg: string; kind: 'ok' | 'warn' | 'info' }

export function PreviewSim({ sections, meta, onClose }: { sections: Section[]; meta: BuilderMeta; onClose: () => void }) {
  const allQ = ([] as Array<Section['questions'][number] & { sec: string }>).concat(
    ...sections.map(s => s.questions.map(q => ({ ...q, sec: s.name }))),
  )
  const [idx, setIdx] = useState(0)
  const [view, setView] = useState<'split' | 'student' | 'proctor'>('split')
  const [events, setEvents] = useState<SimEvent[]>([{ t: '09:00:02', who: 'System', msg: 'Exam cached · ready to start', kind: 'info' }])
  const [secs, setSecs] = useState(90 * 60)
  const q = allQ[idx] || ({} as (typeof allQ)[number])

  useEffect(() => { const iv = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000); return () => clearInterval(iv) }, [])
  const mm = String(Math.floor(secs / 60)).padStart(2, '0'), ss = String(secs % 60).padStart(2, '0')

  function fireEvent(kind: 'start' | 'hand' | 'break' | 'tech' | 'print') {
    const map: Record<typeof kind, Omit<SimEvent, 't'>> = {
      start: { who: 'Sarah Johnson', msg: 'Started the exam', kind: 'ok' },
      hand: { who: 'Priya Patel', msg: 'Raised hand — requesting help', kind: 'warn' },
      break: { who: 'Alex Chen', msg: 'Entered authorized break', kind: 'info' },
      tech: { who: 'Maya Rodriguez', msg: 'Reported a technical issue', kind: 'warn' },
      print: { who: 'Proctor', msg: 'Issued printout to Maya Rodriguez', kind: 'info' },
    }
    const ts = `09:0${Math.min(9, events.length)}:${String(10 + events.length).slice(-2)}`
    setEvents(e => [{ ...map[kind], t: ts }, ...e])
  }

  const studentPane = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', minWidth: 0 }}>
      <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, background: meta.security === 'Secure' ? 'oklch(from var(--chip-1) l c h / 0.05)' : 'var(--card)' }}>
        <Icon name={meta.security === 'Secure' ? 'lock' : 'lock-open'} style={{ color: 'var(--brand-color-dark)' }} />
        <div style={{ fontSize: 13, fontWeight: 600 }}>{meta.name}</div>
        <Badge variant="secondary">Student view</Badge>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600, color: secs < 300 ? 'var(--destructive)' : 'var(--foreground)' }}><Icon name="clock" /> {mm}:{ss}</span>
        </div>
      </div>
      <div style={{ padding: '8px 18px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: 'var(--muted-foreground)' }}>
        <span title="Scientific calculator"><Icon name="calculator" /></span>
        <span title="Highlighter"><Icon name="highlighter" /></span>
        <span title="Scratchpad"><Icon name="note-sticky" /></span>
        <span style={{ marginLeft: 'auto' }}>{q.sec}</span>
      </div>
      <div style={{ flex: 1, padding: '22px 22px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Question {idx + 1} of {allQ.length}</span>
          <Badge variant="secondary"><Icon name={qIcon(q.type)} />{QTYPE[q.type]?.short}</Badge>
          <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600 }}>{q.points} pts</span>
        </div>
        <div style={{ fontSize: 16, lineHeight: 1.5, marginBottom: 18 }}>{q.stem}</div>
        {(q.type === 'mcq' || q.type === 'msq' || q.type === 'tf') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(q.options || []).map((o, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 15px', border: '1px solid var(--border-control-3)', borderRadius: 12, cursor: 'pointer', fontSize: 14 }}>
                <Icon name={q.type === 'msq' ? 'square' : 'circle'} style={{ color: 'var(--muted-foreground)' }} />{o.text}
              </div>
            ))}
          </div>
        )}
        {q.type === 'essay' && <Textarea rows={6} placeholder="Type your response…" />}
        {q.type === 'fitb' && <Input style={{ maxWidth: 280 }} placeholder="Your answer" />}
        {(q.type === 'match' || q.type === 'hotspot') && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '32px 0', color: 'var(--muted-foreground)', fontSize: 13 }}>
            <Icon name={qIcon(q.type)} style={{ fontSize: 22 }} />{QTYPE[q.type]?.label} interaction
          </div>
        )}
      </div>
      <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
        {/* Forward-only exam flow — no Previous/back navigation */}
        <Button variant="ghost" size="sm"><Icon name="flag" />Flag for review</Button>
        <Button variant="default" size="sm" style={{ marginLeft: 'auto' }} onClick={() => setIdx(i => Math.min(allQ.length - 1, i + 1))}>Next<Icon name="arrow-right" /></Button>
      </div>
    </div>
  )

  const kindColor: Record<SimEvent['kind'], string> = { ok: 'var(--chip-2)', warn: 'var(--chart-4)', info: 'var(--chart-1)' }
  const proctorPane = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', minWidth: 0 }}>
      <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon name="shield-check" style={{ color: 'var(--brand-color-dark)' }} />
        <div style={{ fontSize: 13, fontWeight: 600 }}>Proctoring dashboard</div>
        <Badge variant="secondary">Simulator</Badge>
      </div>
      <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, borderBottom: '1px solid var(--border)' }}>
        {([['Cached', 24, 'var(--chip-1)'], ['Started', 21, 'var(--chip-2)'], ['Issues', 2, 'var(--chart-4)']] as Array<[string, number, string]>).map(([l, v, c]) => (
          <div key={l} style={{ background: 'var(--muted)', borderRadius: 12, padding: '9px 11px' }}>
            <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{l}</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontSize: 20, color: c }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <span className="hint" style={{ width: '100%', marginBottom: 2 }}>Simulate student action:</span>
        <Button variant="ghost" size="sm" onClick={() => fireEvent('start')}><Icon name="play" />Start</Button>
        <Button variant="ghost" size="sm" onClick={() => fireEvent('hand')}><Icon name="hand" />Raise hand</Button>
        <Button variant="ghost" size="sm" onClick={() => fireEvent('break')}><Icon name="clock" />Break</Button>
        <Button variant="ghost" size="sm" onClick={() => fireEvent('tech')}><Icon name="triangle-exclamation" />Tech issue</Button>
      </div>
      <div style={{ flex: 1, padding: '12px 16px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {events.map((e, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '9px 11px', borderRadius: 12, background: 'var(--muted)' }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: kindColor[e.kind], marginTop: 5, flexShrink: 0 }}></span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5 }}><b>{e.who}</b> · {e.msg}</div>
                <div className="hint">{e.t} EST</div>
              </div>
              {e.kind === 'warn' && (
                <div style={{ display: 'flex', gap: 5 }}>
                  <Button variant="ghost" size="icon-sm" aria-label="Issue printout" onClick={() => fireEvent('print')}><Icon name="print" /></Button>
                  <Button variant="ghost" size="icon-sm" aria-label="Dismiss" style={{ color: 'var(--destructive)' }}><Icon name="ban" /></Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="exam-creation-overlay exam-creation" style={{ background: 'oklch(0.18 0.01 270 / 0.6)' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ margin: 'auto', width: 'min(1280px, 96vw)', height: '92vh', display: 'flex', flexDirection: 'column', background: 'var(--background)', borderRadius: 18, padding: 18, boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontSize: 22 }}>Preview & simulation</div>
          <span className="hint">Validates navigation rules, tools & proctor controls before publishing</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            <Button variant={view === 'split' ? 'secondary' : 'ghost'} size="sm" aria-pressed={view === 'split'} onClick={() => setView('split')}>Split</Button>
            <Button variant={view === 'student' ? 'secondary' : 'ghost'} size="sm" aria-pressed={view === 'student'} onClick={() => setView('student')}>Student</Button>
            <Button variant={view === 'proctor' ? 'secondary' : 'ghost'} size="sm" aria-pressed={view === 'proctor'} onClick={() => setView('proctor')}>Proctor</Button>
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={onClose}><Icon name="xmark" /></Button>
        </div>
        <div style={{ flex: 1, display: 'flex', gap: 16, minHeight: 0 }}>
          {(view === 'split' || view === 'student') && studentPane}
          {(view === 'split' || view === 'proctor') && proctorPane}
        </div>
      </div>
    </div>
  )
}
