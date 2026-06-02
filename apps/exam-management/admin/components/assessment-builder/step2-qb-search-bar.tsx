'use client'

import { Button } from '@exxatdesignux/ui'

export interface QbFilter {
  key: 'difficulty' | 'type' | 'blooms'
  label: string
}

interface QbSearchBarProps {
  value: string
  onChange: (v: string) => void
  activeFilters: QbFilter[]
  onRemoveFilter: (key: QbFilter['key'], label: string) => void
  resultCount: number
}

export function QbSearchBar({
  value, onChange, activeFilters, onRemoveFilter, resultCount,
}: QbSearchBarProps) {
  return (
    <div style={{ padding: '10px 16px 6px', borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'var(--background)' }}>
      {/* Search input */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        border: '1.5px solid var(--foreground)', borderRadius: 8,
        padding: '8px 12px', background: 'var(--background)',
      }}>
        <i className="fa-light fa-sparkles" aria-hidden="true" style={{ color: 'var(--muted-foreground)', fontSize: 13, flexShrink: 0 }} />
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Search by topic, type, difficulty…"
          aria-label="Search question bank"
          style={{
            flex: 1, fontSize: 13, border: 'none', outline: 'none',
            background: 'transparent', color: 'var(--foreground)', fontFamily: 'inherit',
          }}
        />
        {value && (
          <Button variant="ghost" size="icon-xs" aria-label="Clear search" onClick={() => onChange('')} className="h-auto w-auto p-0 text-muted-foreground">
            <i className="fa-light fa-xmark text-xs" aria-hidden="true" />
          </Button>
        )}
        <span aria-hidden="true" style={{ fontSize: 12, color: 'var(--muted-foreground)', background: 'var(--muted)', padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>↵</span>
      </div>

      {/* Active filter tags */}
      {activeFilters.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Filters:</span>
          {activeFilters.map(f => (
            <span
              key={`${f.key}-${f.label}`}
              style={{
                fontSize: 12, padding: '2px 8px', borderRadius: 20,
                background: 'var(--muted)', color: 'var(--foreground)',
                border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', gap: 4,
              }}
            >
              {f.label}
              <Button variant="ghost" size="icon-xs" aria-label={`Remove ${f.label} filter`} onClick={() => onRemoveFilter(f.key, f.label)} className="h-auto w-auto p-0 text-muted-foreground">
                <i className="fa-light fa-xmark text-[11px]" aria-hidden="true" />
              </Button>
            </span>
          ))}
        </div>
      )}

      {/* Result count */}
      <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: '6px 0 0' }}>
        {resultCount} question{resultCount !== 1 ? 's' : ''} · sorted by relevance + PBI
      </p>
    </div>
  )
}
