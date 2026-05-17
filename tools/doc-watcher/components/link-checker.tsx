'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { checkLinks, addEntry, type CheckResult } from '@/app/actions/registry'

const BTN: React.CSSProperties = { padding: '8px 16px', borderRadius: 'var(--radius)', background: 'var(--brand)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500 }
const CARD: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--muted)', fontSize: 13 }

export function LinkChecker() {
  const router = useRouter()
  const [text, setText] = useState('')
  const [results, setResults] = useState<CheckResult[]>([])
  const [pending, start] = useTransition()

  const handleCheck = () => start(async () => setResults(await checkLinks(text)))
  const handleAdd = (url: string) => {
    const product = prompt('Product? (pce / exam-management / other):') ?? 'other'
    const label = prompt('Label for this doc:') ?? url
    start(async () => { await addEntry(url, product, label); setResults(r => r.filter(x => x.url !== url)); router.refresh() })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <label style={{ fontSize: 14, fontWeight: 500 }}>Paste links (one or many)</label>
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder="https://exxatsystems-my.sharepoint.com/..." rows={4}
        style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', fontSize: 14, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
      <button onClick={handleCheck} disabled={pending || !text.trim()} style={{ ...BTN, alignSelf: 'flex-start', opacity: pending ? 0.6 : 1 }}>
        {pending ? 'Checking…' : 'Check Links'}
      </button>
      {results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted-foreground)', margin: 0 }}>Results</p>
          {results.map(r => (
            <div key={r.url} style={CARD}>
              <span>{r.status === 'watching' ? '✅' : '➕'}</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.status === 'watching' ? `Already watching — ${r.entry?.label}` : r.url}
              </span>
              {r.status === 'new' && (
                <button onClick={() => handleAdd(r.url)} style={{ padding: '4px 10px', borderRadius: 4, background: 'var(--brand)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12 }}>Add</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
