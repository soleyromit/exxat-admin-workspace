'use client'

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
          <button
            onClick={() => onChange('')}
            aria-label="Clear search"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', padding: 0, display: 'flex' }}
          >
            <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 12 }} />
          </button>
        )}
        <span style={{ fontSize: 12, color: 'var(--muted-foreground)', background: 'var(--muted)', padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>↵</span>
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
              <button
                onClick={() => onRemoveFilter(f.key, f.label)}
                aria-label={`Remove ${f.label} filter`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', padding: 0, lineHeight: 1, fontSize: 13 }}
              >×</button>
            </span>
          ))}
        </div>
      )}

      {/* Result count */}
      <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 6 }}>
        {resultCount} question{resultCount !== 1 ? 's' : ''} · sorted by relevance + PBI
      </p>
    </div>
  )
}
