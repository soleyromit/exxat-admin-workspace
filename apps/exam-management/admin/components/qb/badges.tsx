import { Badge } from '@exxat/ds/packages/ui/src'
import type { QStatus, QType, QDiff, QBlooms } from '@/lib/qb-types'

// ── Status Badge — pill + colored border + icon ───────────────────────────────
const STATUS_MAP: Record<QStatus, { bg: string; fg: string; border: string; icon: string }> = {
  'Saved':    { bg: 'var(--qb-status-saved-bg)',    fg: 'var(--qb-status-saved-fg)',    border: 'var(--qb-status-saved-border)', icon: 'fa-circle-check' },
  'Draft':    { bg: 'var(--qb-status-draft-bg)',    fg: 'var(--qb-status-draft-fg)',    border: 'var(--qb-status-draft-border)', icon: 'fa-hourglass'    },
  'Archived': { bg: 'var(--qb-status-archived-bg)', fg: 'var(--qb-status-archived-fg)', border: 'var(--qb-status-archived-fg)',  icon: 'fa-box-archive'  },
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
    <span className="flex items-center gap-1.5 text-sm text-foreground" title={type} style={{ overflow: 'hidden', minWidth: 0 }}>
      <i className={`fa-light ${TYPE_ICONS[type]} shrink-0`} aria-hidden="true" style={{ fontSize: 11 }} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{type}</span>
    </span>
  )
}

// ── Difficulty — plain cell text ─────────────────────────────────────────────
export function DiffBadge({ diff }: { diff: QDiff }) {
  return (
    <span className="text-sm text-foreground" title={diff} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {diff}
    </span>
  )
}

// ── Blooms Badge ──────────────────────────────────────────────────────────────
export function BloomsBadge({ blooms }: { blooms: QBlooms }) {
  return (
    <span className="text-sm text-foreground" title={blooms} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {blooms}
    </span>
  )
}

// ── pBIS Cell ─────────────────────────────────────────────────────────────────
export function PBisCell({ pbis }: { pbis: number | null }) {
  if (pbis === null) {
    return <span className="text-xs text-muted-foreground italic">—</span>
  }

  const sign = pbis >= 0 ? '+' : ''
  return (
    <span className="text-sm text-foreground" title={`Point-biserial ${sign}${pbis.toFixed(2)}`}>
      {sign}{pbis.toFixed(2)}
    </span>
  )

}
