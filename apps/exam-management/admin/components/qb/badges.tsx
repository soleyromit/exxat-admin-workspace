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
      <i className={`fa-solid ${s.icon}`} aria-hidden="true" style={{ fontSize: 8 }} />
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
  const styles: Record<QDiff, { fontWeight: number; color: string }> = {
    Easy:   { fontWeight: 400, color: 'var(--qb-diff-easy)' },
    Medium: { fontWeight: 600, color: 'var(--qb-diff-medium)' },
    Hard:   { fontWeight: 800, color: 'var(--qb-diff-hard)' },
  }
  const s = styles[diff]
  return (
    <span style={{ fontSize: 11.5, fontWeight: s.fontWeight, color: s.color, letterSpacing: diff === 'Hard' ? '-0.01em' : undefined }}>
      {diff}
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
