'use client'

/* BuilderStart — getting-started pathway chooser for an empty (Planned)
   assessment. Faithful port of BuilderStart in the Claude Design builder.jsx. */

import { Card, Badge } from '@exxatdesignux/ui'
import { Icon, LeoStar } from '../icons'

interface PathwayProps {
  name: string
  onRecycle: () => void
  onScratch: () => void
  onAI: () => void
  onBank: () => void
}

export function BuilderStart({ name, onRecycle, onScratch, onAI, onBank }: PathwayProps) {
  const paths = [
    { id: 'recycle', icon: 'recycle', title: 'Recycle a past assessment', body: 'Ingest the sections, question mix & historical difficulty of a prior exam as a fully editable template.', tone: 'var(--brand-color)', rec: true, fn: onRecycle },
    { id: 'ai', icon: '__leo', title: 'Generate with AI', body: 'Let Leo draft questions from your syllabus and target blueprint, then refine.', tone: 'var(--chart-1)', rec: false, fn: onAI },
    { id: 'bank', icon: 'rectangle-list', title: 'Add from the question bank', body: "Search your institution's bank by topic, type and difficulty, and pull items in.", tone: 'var(--chart-2)', rec: false, fn: onBank },
    { id: 'scratch', icon: 'pen-line', title: 'Start from scratch', body: 'Create an empty section and author questions manually, one at a time.', tone: 'var(--muted-foreground)', rec: false, fn: onScratch },
  ]
  return (
    <div style={{ maxWidth: 760, margin: '10px auto 0' }}>
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <span style={{ display: 'inline-grid', placeItems: 'center', width: 52, height: 52, borderRadius: 16, background: 'oklch(from var(--brand-color) l c h / 0.10)', color: 'var(--brand-color-dark)', marginBottom: 12 }}>
          <Icon name="hammer" style={{ fontSize: 22 }} />
        </span>
        <div style={{ fontSize: 19, fontWeight: 700 }}>This assessment is empty — choose how to begin</div>
        <p className="hint" style={{ maxWidth: 460, margin: '6px auto 0', lineHeight: 1.5 }}>
          “{name}” is still <b>Planned</b>. Pick a starting point below; you can mix approaches and add more sections at any time.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {paths.map(p => (
          <Card
            key={p.id}
            role="button"
            tabIndex={0}
            onClick={p.fn}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); p.fn() } }}
            style={{ textAlign: 'left', cursor: 'pointer', padding: '16px 17px', borderColor: p.rec ? 'oklch(from var(--brand-color) l c h / 0.32)' : undefined, display: 'flex', flexDirection: 'row', gap: 13, alignItems: 'flex-start' }}
          >
            <span style={{ display: 'grid', placeItems: 'center', width: 38, height: 38, borderRadius: 12, background: `oklch(from ${p.tone} l c h / 0.12)`, color: p.tone, flexShrink: 0 }}>
              {p.icon === '__leo' ? <LeoStar style={{ fontSize: 17 }} /> : <Icon name={p.icon} style={{ fontSize: 17 }} />}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{p.title}</span>
                {p.rec && <Badge variant="secondary">Recommended</Badge>}
              </div>
              <div className="hint" style={{ lineHeight: 1.45 }}>{p.body}</div>
            </div>
            <Icon name="arrow-right" style={{ fontSize: 14, color: 'var(--muted-foreground)', marginTop: 4 }} />
          </Card>
        ))}
      </div>
    </div>
  )
}
