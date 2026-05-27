import { ENCOUNTER_TYPES } from '@/lib/mock-data'

export function EncounterChart() {
  const max = Math.max(...ENCOUNTER_TYPES.map(e => e.percentage))

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        backgroundColor: 'var(--background)',
        padding: '20px 24px',
        height: '100%',
      }}
    >
      <p className="text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
        Encounter Type Breakdown
      </p>
      <p className="text-xs mb-4" style={{ color: 'var(--muted-foreground)' }}>
        Distribution across all logged encounters
      </p>

      <div className="flex flex-col gap-3">
        {ENCOUNTER_TYPES.map((enc) => (
          <div key={enc.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs" style={{ color: 'var(--foreground)' }}>{enc.label}</span>
              <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                {enc.percentage}%
              </span>
            </div>
            <div
              style={{
                height: 6,
                borderRadius: 3,
                backgroundColor: 'var(--muted)',
                overflow: 'hidden',
              }}
              role="img"
              aria-label={`${enc.label}: ${enc.percentage}%`}
            >
              <div
                style={{
                  height: '100%',
                  width: `${(enc.percentage / max) * 100}%`,
                  backgroundColor: 'var(--brand-color)',
                  borderRadius: 3,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
