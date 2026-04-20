import { Badge } from '@exxat/ds/packages/ui/src'
import type { QStatus, QType, QDiff, QBlooms } from '@/lib/qb-types'

// ── Status Badge — pill + icon ────────────────────────────────────────────────
const STATUS_MAP: Record<QStatus, { bg: string; fg: string; icon: string }> = {
  Saved: { bg: 'var(--qb-status-saved-bg)', fg: 'var(--qb-status-saved-fg)', icon: 'fa-circle-check' },
  Draft: { bg: 'var(--qb-status-draft-bg)', fg: 'var(--qb-status-draft-fg)', icon: 'fa-hourglass' },
}

export function StatusBadge({ status }: { status: QStatus }) {
  const s = STATUS_MAP[status]
  return (
    <Badge
      variant="secondary"
      className="rounded-full px-2.5 py-0.5 gap-1.5 font-semibold whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.fg }}
    >
      <i className={`fa-light ${s.icon}`} aria-hidden="true" style={{ fontSize: 10 }} />
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

// ── Difficulty — neutral muted text ───────────────────────────────────────────
export function DiffBadge({ difficulty }: { difficulty: QDiff }) {
  return (
    <span style={{ fontSize: 12, color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
      {difficulty}
    </span>
  )
}

// ── Blooms Badge ──────────────────────────────────────────────────────────────
const BLOOMS_COLORS: Record<QBlooms, string> = {
  Remember:   'var(--chart-3)',
  Understand: 'var(--chart-2)',
  Apply:      'var(--chart-1)',
  Analyze:    'var(--chart-4)',
  Evaluate:   'var(--chart-5)',
  Create:     'var(--brand-color)',
}

export function BloomsBadge({ blooms }: { blooms: QBlooms }) {
  return (
    <Badge
      variant="secondary"
      className="rounded font-medium whitespace-nowrap"
      style={{ fontSize: 10, padding: '1px 6px', color: BLOOMS_COLORS[blooms], backgroundColor: `color-mix(in oklch, ${BLOOMS_COLORS[blooms]} 12%, var(--background))` }}
    >
      {blooms}
    </Badge>
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
