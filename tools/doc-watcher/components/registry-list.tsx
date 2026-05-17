'use client'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { removeEntry } from '@/app/actions/registry'
import type { RegistryEntry } from '@/lib/types'

const COLORS: Record<string, string> = { pce: '#0ea5e9', 'exam-management': '#8b5cf6' }

export function RegistryList({ entries }: { entries: RegistryEntry[] }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const remove = (id: string, label: string) => {
    if (!confirm(`Stop watching "${label}"?`)) return
    start(async () => { await removeEntry(id); router.refresh() })
  }
  if (entries.length === 0) return <p style={{ color: 'var(--muted-foreground)', fontSize: 14 }}>No docs being watched yet.</p>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {entries.map(e => (
        <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }}>
          <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: (COLORS[e.product] ?? '#64748b') + '20', color: COLORS[e.product] ?? '#64748b' }}>{e.product}</span>
          <span style={{ flex: 1, fontWeight: 500 }}>{e.label}</span>
          <span style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>{e.lastSynced ? `synced: ${e.lastSynced}` : 'not yet synced'}</span>
          <button onClick={() => remove(e.id, e.label)} disabled={pending} style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontSize: 12, color: 'var(--muted-foreground)' }}>Remove</button>
        </div>
      ))}
    </div>
  )
}
