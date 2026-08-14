'use client'

/* Structure tab — per-section settings: fillTarget, dueDate, instructions, preRead.
   Replaces the old inline-only section rename. Shows a settings card per section. */

import { useState } from 'react'
import { Card, CardContent, Button, Input, Textarea, Badge, ToggleSwitch } from '@exxatdesignux/ui'
import { Icon } from '../icons'
import { type Section, type FillTarget } from '../data'

interface Props {
  sections: Section[]
  setSections: (fn: (s: Section[]) => Section[]) => void
  onAddSection: () => void
}

function Seg<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { v: T; label: string }[] }) {
  return (
    <div style={{ display: 'inline-flex', gap: 2, padding: 2, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--background)' }}>
      {options.map(o => (
        <Button key={o.v} type="button" variant={value === o.v ? 'default' : 'ghost'} size="sm" aria-pressed={value === o.v} onClick={() => onChange(o.v)}>
          {o.label}
        </Button>
      ))}
    </div>
  )
}

function SectionSettingsCard({ sec, onUpdate }: { sec: Section; onUpdate: (fn: (s: Section) => Section) => void }) {
  const [expanded, setExpanded] = useState(true)
  const fillTarget = sec.fillTarget ?? { type: 'count' as const, value: 10 }
  const hasFill = sec.fillTarget != null

  return (
    <Card style={{ borderRadius: 16, marginBottom: 12 }}>
      <CardContent style={{ padding: 0 }}>
        {/* header */}
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          aria-expanded={expanded}
        >
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--muted)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <Icon name="list-check" style={{ fontSize: 14, color: 'var(--brand-color-dark)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{sec.name}</div>
            <div className="hint" style={{ marginTop: 2 }}>
              {sec.questions.length} questions · {sec.timeLimit} min
              {sec.reviewStatus !== 'in-progress' && (
                <Badge variant="secondary" className="ml-2">{sec.reviewStatus.replace('-', ' ')}</Badge>
              )}
            </div>
          </div>
          <Icon name={expanded ? 'chevron-up' : 'chevron-down'} style={{ fontSize: 12, color: 'var(--muted-foreground)', flexShrink: 0 }} />
        </button>

        {expanded && (
          <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--border)' }}>
            {/* Section name */}
            <div style={{ paddingTop: 14, marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Section name</label>
              <Input
                value={sec.name}
                onChange={e => onUpdate(s => ({ ...s, name: e.target.value }))}
                aria-label="Section name"
                style={{ maxWidth: 420 }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              {/* Time limit */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Time limit</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Input
                    type="number"
                    value={sec.timeLimit}
                    onChange={e => onUpdate(s => ({ ...s, timeLimit: +e.target.value }))}
                    aria-label="Section time limit in minutes"
                    style={{ width: 80 }}
                  />
                  <span className="hint">min</span>
                </div>
              </div>

              {/* Due date */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Section due date</label>
                <Input
                  value={sec.dueDate ?? ''}
                  onChange={e => onUpdate(s => ({ ...s, dueDate: e.target.value || null }))}
                  placeholder="MM/DD/YYYY HH:MM AM EST"
                  aria-label="Section due date"
                  style={{ maxWidth: 240 }}
                />
              </div>

              {/* Fill target */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Fill target</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ToggleSwitch
                    checked={hasFill}
                    onChange={() => onUpdate(s => ({ ...s, fillTarget: hasFill ? null : { type: 'count', value: 10 } }))}
                    aria-label="Enable fill target"
                  />
                  {hasFill && (
                    <>
                      <Input
                        type="number"
                        value={fillTarget.value}
                        onChange={e => onUpdate(s => ({ ...s, fillTarget: { ...(s.fillTarget ?? { type: 'count', value: 10 }), value: +e.target.value } as FillTarget }))}
                        aria-label="Fill target value"
                        style={{ width: 72 }}
                      />
                      <Seg
                        value={fillTarget.type}
                        onChange={v => onUpdate(s => ({ ...s, fillTarget: { ...(s.fillTarget ?? { type: 'count', value: 10 }), type: v } as FillTarget }))}
                        options={[{ v: 'count', label: 'Qs' }, { v: 'points', label: 'pts' }]}
                      />
                    </>
                  )}
                </div>
                {hasFill && (
                  <div className="hint" style={{ marginTop: 6 }}>AI and KB search will draw to this target automatically.</div>
                )}
              </div>

              {/* Pre-read toggle */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pre-read document</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ToggleSwitch
                    checked={sec.preRead}
                    onChange={() => onUpdate(s => ({ ...s, preRead: !s.preRead }))}
                    aria-label="Attach pre-read document to this section"
                  />
                  <span className="hint">{sec.preRead ? 'Required before section start' : 'None'}</span>
                </div>
              </div>
            </div>

            {/* Section instructions */}
            <div style={{ marginTop: 18 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Section instructions
                <span className="hint" style={{ marginLeft: 8, textTransform: 'none', letterSpacing: 0 }}>Shown to students at the section boundary</span>
              </label>
              <Textarea
                value={sec.sectionInstructions ?? ''}
                onChange={e => onUpdate(s => ({ ...s, sectionInstructions: e.target.value || null }))}
                placeholder="Instructions appear on the transition screen between sections…"
                rows={3}
                aria-label="Section instructions"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function StructureTab({ sections, setSections, onAddSection }: Props) {
  function updateSection(secId: string, fn: (s: Section) => Section) {
    setSections(prev => prev.map(s => (s.id === secId ? fn(s) : s)))
  }

  if (sections.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '48px 0', color: 'var(--muted-foreground)' }}>
        <Icon name="layer-group" style={{ fontSize: 28 }} />
        <div style={{ fontSize: 14, fontWeight: 500 }}>No sections yet</div>
        <div className="hint">Add your first section to configure its structure.</div>
        <Button type="button" variant="outline" onClick={onAddSection}><Icon name="plus" />Add section</Button>
      </div>
    )
  }

  const totalQ = sections.reduce((t, s) => t + s.questions.length, 0)
  const totalMin = sections.reduce((t, s) => t + s.timeLimit, 0)

  return (
    <div>
      {/* summary row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: '12px 16px', borderRadius: 12, background: 'var(--muted)', border: '1px solid var(--border)' }}>
        <Icon name="layer-group" style={{ color: 'var(--brand-color-dark)' }} />
        <span style={{ fontSize: 13, fontWeight: 600 }}>{sections.length} sections</span>
        <span className="hint">·</span>
        <span className="hint">{totalQ} questions total</span>
        <span className="hint">·</span>
        <span className="hint">{totalMin} min total</span>
      </div>

      {sections.map(sec => (
        <SectionSettingsCard
          key={sec.id}
          sec={sec}
          onUpdate={fn => updateSection(sec.id, fn)}
        />
      ))}

      <Button type="button" variant="outline" onClick={onAddSection}><Icon name="plus" />Add section</Button>
    </div>
  )
}
