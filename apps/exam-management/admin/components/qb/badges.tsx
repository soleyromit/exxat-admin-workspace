import { Badge } from '@exxat/ds/packages/ui/src'
import type { QType, QDiff, QBlooms } from '@/lib/qb-types'

// ── Status Badge — pill + icon ────────────────────────────────────────────────
type QStatusReduced = 'Saved' | 'Draft'

const STATUS_MAP: Record<QStatusReduced, { bg: string; fg: string; icon: string }> = {
  Saved: { bg: 'var(--qb-status-saved-bg)', fg: 'var(--qb-status-saved-fg)', icon: 'fa-circle' },
  Draft: { bg: 'var(--qb-status-draft-bg)', fg: 'var(--qb-status-draft-fg)', icon: 'fa-circle-half-stroke' },
}

export function StatusBadge({ status }: { status: QStatusReduced }) {
  const s = STATUS_MAP[status]
  if (!s) return null
  return (
    <Badge
      variant="secondary"
      className="rounded-full px-2.5 py-0.5 gap-1 font-semibold whitespace-nowrap text-[10px]"
      style={{ backgroundColor: s.bg, color: s.fg }}
    >
      <i className={`fa-light ${s.icon}`} aria-hidden="true" style={{ fontSize: 8 }} />
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
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
      <i className={`fa-light ${TYPE_ICONS[type]}`} aria-hidden="true" style={{ fontSize: 11 }} />
      {type}
    </span>
  )
}

// ── Difficulty — neutral weight text ─────────────────────────────────────────
export function DiffBadge({ diff }: { diff: QDiff }) {
  return (
    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted-foreground)' }}>
      {diff}
    </span>
  )
}

// ── Blooms Badge ──────────────────────────────────────────────────────────────
export function BloomsBadge({ blooms }: { blooms: QBlooms }) {
  return (
    <span style={{ fontSize: 12, color: 'var(--muted-foreground)', fontWeight: 500 }}>
      {blooms}
    </span>
  )
}

// ── pBIS Cell ─────────────────────────────────────────────────────────────────
export function PBisCell({ pbis, pbisDir }: { pbis: number | null; pbisDir: 'up' | 'down' | 'flat' | null }) {
  if (pbis === null) return <span style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>—</span>
  const arrow = pbisDir === 'up' ? 'fa-arrow-up' : pbisDir === 'down' ? 'fa-arrow-down' : 'fa-minus'
  const color = pbisDir === 'up' ? 'var(--qb-status-saved-fg)' : pbisDir === 'down' ? 'var(--destructive)' : 'var(--muted-foreground)'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color }}>
      <i className={`fa-solid ${arrow}`} aria-hidden="true" style={{ fontSize: 9 }} />
      {pbis.toFixed(2)}
    </span>
  )
}
