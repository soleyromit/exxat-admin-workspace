'use client'

/* Assessment Settings panel — high-stakes flags, scoring rules, nav constraints.
   Opens as a right-side Sheet from the builder header Settings button. */

import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, Button, Input, ToggleSwitch, Badge } from '@exxatdesignux/ui'
import { Icon } from '../icons'
import { type BuilderMeta } from '../data'

interface Props {
  meta: BuilderMeta
  setMeta: (fn: (m: BuilderMeta) => BuilderMeta) => void
  onClose: () => void
}

function Row({ label, hint, children, last }: { label: string; hint?: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0', borderBottom: last ? 'none' : '1px solid var(--border)' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
        {hint && <div className="hint" style={{ marginTop: 2, maxWidth: 320 }}>{hint}</div>}
      </div>
      {children}
    </div>
  )
}

function SectionHeading({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '18px 0 10px', borderBottom: '1px solid var(--border)', marginBottom: 2 }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--muted)', display: 'grid', placeItems: 'center', color: 'var(--brand-color-dark)', flexShrink: 0 }}>
        <Icon name={icon} style={{ fontSize: 13 }} />
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
        {sub && <div className="hint" style={{ marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  )
}

export function SettingsPanel({ meta, setMeta, onClose }: Props) {
  const set = <K extends keyof BuilderMeta>(k: K, v: BuilderMeta[K]) => setMeta(m => ({ ...m, [k]: v }))
  const tog = (k: keyof BuilderMeta) => setMeta(m => ({ ...m, [k]: !m[k] }))

  const [refInput, setRefInput] = useState('')
  const refs = meta.referenceMaterials ?? []
  const addRef = () => { if (refInput.trim()) { set('referenceMaterials', [...refs, refInput.trim()]); setRefInput('') } }
  const removeRef = (i: number) => set('referenceMaterials', refs.filter((_, idx) => idx !== i))

  return (
    <Sheet open onOpenChange={o => { if (!o) onClose() }}>
      <SheetContent side="right" className="w-[480px] p-0 flex flex-col gap-0 overflow-y-auto">
        <SheetHeader className="px-5 py-4 border-b border-border space-y-0">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--muted)', display: 'grid', placeItems: 'center', color: 'var(--brand-color-dark)' }}>
              <Icon name="gear" style={{ fontSize: 14 }} />
            </div>
            <SheetTitle style={{ fontSize: 15, fontWeight: 600 }}>Assessment settings</SheetTitle>
          </div>
        </SheetHeader>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 24px' }}>

          {/* Stakes & integrity */}
          <SectionHeading icon="flag" title="Stakes & integrity" />
          <Row label="High-stakes exam" hint="Holds all scores until faculty manually releases results — students see no score until you act.">
            <ToggleSwitch checked={!!meta.isHighStakes} onChange={() => tog('isHighStakes')} aria-label="High-stakes exam" />
          </Row>
          <Row label="Passing score" hint="Faculty-facing threshold only — never displayed to students.">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Input type="number" value={meta.passingScore ?? ''} onChange={e => set('passingScore', e.target.value ? +e.target.value : null)} placeholder="—" aria-label="Passing score" style={{ width: 80 }} />
              <span className="hint">/ 100</span>
            </div>
          </Row>
          <Row label="Allow student comments" hint="Adds a per-question text box for students to flag confusion or provide feedback." last>
            <ToggleSwitch checked={!!meta.allowComments} onChange={() => tog('allowComments')} aria-label="Allow student comments" />
          </Row>

          {/* Reference materials */}
          <SectionHeading icon="file-lines" title="Reference materials" sub="PDFs students can open in the exam toolbar" />
          <div style={{ paddingTop: 12 }}>
            {refs.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                {refs.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: 'var(--muted)', border: '1px solid var(--border)' }}>
                    <Icon name="file-pdf" style={{ fontSize: 13, color: 'var(--muted-foreground)' }} />
                    <span style={{ fontSize: 13, flex: 1 }}>{r}</span>
                    <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove ${r}`} onClick={() => removeRef(i)}>
                      <Icon name="xmark" style={{ fontSize: 12 }} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <Input value={refInput} onChange={e => setRefInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addRef() }} placeholder="PDF title or URL…" aria-label="Reference material title" style={{ flex: 1 }} />
              <Button type="button" variant="outline" size="sm" onClick={addRef}><Icon name="plus" />Add</Button>
            </div>
            <div className="hint" style={{ marginTop: 8 }}>Attach at least one PDF to enable the toolbar. Students cannot download or print references.</div>
          </div>

          {/* Score & display */}
          <SectionHeading icon="chart-simple" title="Score display to students" />
          <Row label="Show raw score" hint="e.g. 84 / 100">
            <ToggleSwitch checked={meta.scoreDisplay !== 'none'} onChange={() => set('scoreDisplay', meta.scoreDisplay === 'none' ? 'raw' : 'none')} aria-label="Show raw score" />
          </Row>
          <Row label="Show percentage" hint="e.g. 84%">
            <ToggleSwitch checked={meta.scoreDisplay === 'raw+pct'} onChange={() => set('scoreDisplay', meta.scoreDisplay === 'raw+pct' ? 'raw' : 'raw+pct')} aria-label="Show percentage" />
          </Row>
          <Row label="Early submit button visible" hint="Students can submit before time runs out. Hides the button if off." last>
            <ToggleSwitch checked={meta.submitVisible !== false} onChange={() => set('submitVisible', !(meta.submitVisible !== false))} aria-label="Early submit button visible" />
          </Row>

          {/* Timer */}
          <SectionHeading icon="clock" title="Timer warnings" />
          <Row label="Warn students at" hint="Shows a prominent timer warning in the taker UI." last>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Input type="number" value={meta.warnMinutes ?? 5} onChange={e => set('warnMinutes', +e.target.value)} aria-label="Warn at minutes remaining" style={{ width: 72 }} />
              <span className="hint">min remaining</span>
            </div>
          </Row>

        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          {meta.isHighStakes && (
            <Badge variant="secondary" style={{ marginRight: 'auto' }}><Icon name="flag" />High-stakes</Badge>
          )}
          <Button type="button" variant="default" onClick={onClose}>Done</Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
