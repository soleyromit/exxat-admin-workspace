import type { UpdateEntry } from '@/lib/types'

const TYPE_META: Record<string, { label: string; color: string; bg: string }> = {
  'prd-change':           { label: 'PRD Change',    color: '#2563eb', bg: '#eff6ff' },
  'prd-flagged':          { label: 'PRD Flagged',   color: '#d97706', bg: '#fffbeb' },
  'compliance-violation': { label: 'Compliance',    color: '#dc2626', bg: '#fef2f2' },
  'compliance-resolved':  { label: 'Resolved',      color: '#16a34a', bg: '#f0fdf4' },
  'new-doc':              { label: 'New Doc',        color: '#7c3aed', bg: '#f5f3ff' },
  'pattern-update':       { label: 'Pattern',       color: '#0d9488', bg: '#f0fdfa' },
  'claude-correction':    { label: 'Correction',    color: '#ea580c', bg: '#fff7ed' },
}
const SEV: Record<string, string> = { P1: '#dc2626', P2: '#d97706', P3: '#64748b' }

export function UpdateEntryCard({ entry }: { entry: UpdateEntry }) {
  const meta = TYPE_META[entry.type] ?? { label: entry.type, color: '#64748b', bg: '#f8fafc' }
  const isP1 = entry.severity === 'P1'
  return (
    <div style={{ padding: '14px 16px', borderRadius: 8, border: `1px solid ${isP1 ? '#fca5a5' : 'var(--border)'}`, borderLeft: `4px solid ${isP1 ? '#dc2626' : meta.color}`, display: 'flex', flexDirection: 'column', gap: 8, background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: meta.bg, color: meta.color }}>{meta.label}</span>
        {entry.severity && <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 700, color: SEV[entry.severity], background: SEV[entry.severity] + '15' }}>{entry.severity}</span>}
        <span style={{ fontSize: 12, color: 'var(--muted-foreground)', marginLeft: 'auto' }}>{entry.product} &middot; {entry.date}</span>
      </div>
      <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{entry.title}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
        <p style={{ margin: 0 }}><strong>What:</strong> {entry.what}</p>
        <p style={{ margin: 0, color: 'var(--muted-foreground)' }}><strong>Why:</strong> {entry.why}</p>
      </div>
      {entry.files.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {entry.files.map(f => <code key={f} style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: 'var(--muted)', color: 'var(--muted-foreground)' }}>{f.split('/').pop()}</code>)}
        </div>
      )}
    </div>
  )
}
