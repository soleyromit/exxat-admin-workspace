import { Badge } from '@exxat/ds/packages/ui/src'
import type { QStatus, QType, QDiff, QBlooms } from '@/lib/qb-types'

// ── Status Badge — pill + colored border + icon ───────────────────────────────
const STATUS_MAP: Record<QStatus, { bg: string; fg: string; border: string; icon: string }> = {
  'Saved': { bg: 'var(--qb-status-saved-bg)', fg: 'var(--qb-status-saved-fg)', border: 'var(--qb-status-saved-border)', icon: 'fa-circle-check' },
  'Draft': { bg: 'var(--qb-status-draft-bg)', fg: 'var(--qb-status-draft-fg)', border: 'var(--qb-status-draft-border)', icon: 'fa-hourglass'    },
}

export function StatusBadge({ status }: { status: QStatus }) {
  const s = STATUS_MAP[status]
  if (!s) return null
  return (
    <Badge
      variant="secondary"
      className="rounded-full px-3 py-1 gap-1.5 font-semibold whitespace-nowrap text-[12px] border"
      style={{ backgroundColor: s.bg, color: s.fg, borderColor: s.border }}
    >
      <i className={`fa-regular ${s.icon}`} aria-hidden="true" style={{ fontSize: 11 }} />
      {status}
    </Badge>
  )
}

// ── Type Badge — neutral muted text + icon ────────────────────────────────────
const TYPE_ICONS: Record<QType, string> = {
  'MCQ':        'fa-list-ul',
  'Fill blank': 'fa-input-text',
  'Hotspot':    'fa-crosshairs',
  'Ordering':   'fa-arrow-up-arrow-down',
  'Matching':   'fa-arrows-left-right-to-line',
}

export function TypeBadge({ type }: { type: QType }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-foreground whitespace-nowrap">
      <i className={`fa-light ${TYPE_ICONS[type]}`} aria-hidden="true" style={{ fontSize: 11 }} />
      {type}
    </span>
  )
}

// ── Difficulty — plain cell text ─────────────────────────────────────────────
export function DiffBadge({ diff }: { diff: QDiff }) {
  return (
    <span className="text-sm text-foreground">
      {diff}
    </span>
  )
}

// ── Blooms Badge ──────────────────────────────────────────────────────────────
export function BloomsBadge({ blooms }: { blooms: QBlooms }) {
  return (
    <span className="text-sm text-foreground">
      {blooms}
    </span>
  )
}

// ── pBIS Cell ─────────────────────────────────────────────────────────────────
//
// Embedded workflow intelligence (Aarti differentiator): point-biserial is the
// most decision-relevant psychometric for question quality, so we render it
// as a colored bar — not a plain number. Red = negative (broken question),
// yellow = weak, green = healthy. Surfaces problems at decision time.
export function PBisCell({ pbis }: { pbis: number | null }) {
  if (pbis === null) {
    return <span className="text-xs text-muted-foreground italic">—</span>
  }

  const tone =
    pbis < 0     ? { fg: 'var(--destructive)',  label: 'negative · review' } :
    pbis < 0.15  ? { fg: 'var(--chart-4)',      label: 'weak' } :
    pbis < 0.30  ? { fg: 'var(--chart-1)',      label: 'fair' } :
                   { fg: 'var(--chart-2)',      label: 'healthy' }

  // Bar width: |pbis| scaled to 0..40px. Negative values share the same length
  // logic but the bar starts from the right of the centerline.
  const magnitude = Math.min(Math.abs(pbis), 0.5) / 0.5  // 0..1
  const barWidth = 4 + Math.round(magnitude * 36)        // 4..40 px

  const isNegative = pbis < 0

  return (
    <div className="flex items-center gap-2 min-w-0" title={`Point-biserial ${pbis.toFixed(2)} · ${tone.label}`}>
      <div className="flex items-center gap-0.5" style={{ width: 44 }}>
        {/* Negative side (4px reserved) */}
        <div className="flex justify-end" style={{ width: 4 }}>
          {isNegative && (
            <span
              className="block rounded-sm"
              style={{
                width: barWidth,
                height: 8,
                backgroundColor: tone.fg,
                marginRight: -barWidth + 4,
              }}
            />
          )}
        </div>
        {/* Centerline */}
        <span
          aria-hidden="true"
          style={{ width: 1, height: 12, backgroundColor: 'var(--border)' }}
        />
        {/* Positive side */}
        <div style={{ width: 40 }}>
          {!isNegative && (
            <span
              className="block rounded-sm"
              style={{
                width: barWidth,
                height: 8,
                backgroundColor: tone.fg,
              }}
            />
          )}
        </div>
      </div>
      <span
        className="text-xs font-mono font-semibold tabular-nums"
        style={{ color: tone.fg }}
      >
        {pbis > 0 ? '+' : ''}{pbis.toFixed(2)}
      </span>
    </div>
  )
}
