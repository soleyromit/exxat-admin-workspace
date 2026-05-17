'use client'
import { useState, useTransition } from 'react'
import { getUpdates, type UpdateFilters } from '@/app/actions/updates'
import { UpdateEntryCard } from './update-entry'
import type { UpdateEntry } from '@/lib/types'

const PRODUCTS = ['all', 'pce', 'exam-management']
const PERIODS = ['today', 'week', 'month', 'all']
const TYPES = ['all', 'prd-change', 'prd-flagged', 'compliance-violation', 'compliance-resolved', 'new-doc', 'pattern-update', 'claude-correction']

function groupByDate(entries: UpdateEntry[]) {
  const map = new Map<string, UpdateEntry[]>()
  for (const e of entries) map.set(e.date, [...(map.get(e.date) ?? []), e])
  return map
}

export function UpdatesFeed({ initial }: { initial: UpdateEntry[] }) {
  const [entries, setEntries] = useState(initial)
  const [filters, setFilters] = useState<UpdateFilters>({ product: 'all', period: 'week', type: 'all' })
  const [pending, start] = useTransition()
  const today = new Date().toISOString().slice(0, 10)

  const setFilter = (k: keyof UpdateFilters, v: string) => {
    const next = { ...filters, [k]: v }
    setFilters(next)
    start(async () => setEntries(await getUpdates(next)))
  }

  const grouped = groupByDate(entries)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(['product', 'period', 'type'] as const).map(k => (
          <select key={k} value={filters[k] ?? 'all'} onChange={e => setFilter(k, e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', fontSize: 13, background: '#fff', cursor: 'pointer' }}>
            {(k === 'product' ? PRODUCTS : k === 'period' ? PERIODS : TYPES).map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        ))}
        {pending && <span style={{ fontSize: 13, color: 'var(--muted-foreground)', alignSelf: 'center' }}>Loading…</span>}
      </div>
      {entries.length === 0
        ? <p style={{ color: 'var(--muted-foreground)', fontSize: 14 }}>No updates match these filters.</p>
        : [...grouped.entries()].map(([date, dayEntries]) => (
          <div key={date} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: date === today ? 'var(--brand)' : 'var(--muted)', color: date === today ? '#fff' : 'var(--muted-foreground)' }}>
                {date === today ? `TODAY — ${date}` : date}
              </span>
              {date === today && <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 6px', background: '#fef3c7', color: '#92400e', borderRadius: 4 }}>LATEST</span>}
            </div>
            {dayEntries.map(e => <UpdateEntryCard key={e.id} entry={e} />)}
          </div>
        ))
      }
    </div>
  )
}
