import { Badge } from '@exxat/ds/packages/ui/src'
import type { QStatus, QType, QDiff, QBlooms } from '@/lib/qb-types'

// ─── StatusBadge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<QStatus, { bg: string; fg: string; icon: string }> = {
  'Active':    { bg: 'var(--qb-status-active-bg)',   fg: 'var(--qb-status-active-fg)',   icon: 'fa-circle-check'  },
  'Ready':     { bg: 'var(--qb-status-ready-bg)',    fg: 'var(--qb-status-ready-fg)',    icon: 'fa-circle-check'  },
  'In Review': { bg: 'var(--qb-status-review-bg)',   fg: 'var(--qb-status-review-fg)',   icon: 'fa-eye'           },
  'Draft':     { bg: 'var(--qb-status-draft-bg)',    fg: 'var(--qb-status-draft-fg)',    icon: 'fa-hourglass'     },
  'Flagged':   { bg: 'var(--qb-status-flagged-bg)',  fg: 'var(--qb-status-flagged-fg)',  icon: 'fa-circle-xmark'  },
  'Approved':  { bg: 'var(--qb-status-approved-bg)', fg: 'var(--qb-status-approved-fg)', icon: 'fa-circle-check' },
  'Locked':    { bg: 'var(--qb-status-locked-bg)',   fg: 'var(--qb-status-locked-fg)',   icon: 'fa-lock'          },
}

export function StatusBadge({ status }: { status: QStatus }) {
  const s = STATUS_STYLES[status]
  return (
    <Badge
      variant="secondary"
      className="rounded-full px-3 py-1 gap-1.5 font-semibold whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.fg }}
    >
      <i className={`fa-light ${s.icon}`} aria-hidden="true" style={{ fontSize: 11 }} />
      {status}
    </Badge>
  )
}

// ─── TypeBadge ───────────────────────────────────────────────────────────────

export function TypeBadge({ type }: { type: QType }) {
  return (
    <Badge variant="secondary" className="rounded whitespace-nowrap">
      {type}
    </Badge>
  )
}

// ─── DiffBadge ───────────────────────────────────────────────────────────────

const DIFF_STYLES: Record<QDiff, { color: string; weight: number }> = {
  'Easy':   { color: 'var(--qb-trust-senior-color)',  weight: 500 },
  'Medium': { color: 'var(--qb-diff-medium-color)',   weight: 600 },
  'Hard':   { color: 'var(--qb-diff-hard-color)',       weight: 700 },
}

export function DiffBadge({ diff }: { diff: QDiff }) {
  const s = DIFF_STYLES[diff]
  return (
    <span style={{ fontSize: 12, fontWeight: s.weight, color: s.color, whiteSpace: 'nowrap' }}>
      {diff}
    </span>
  )
}

// ─── PBisCell ────────────────────────────────────────────────────────────────

export function PBisCell({ value, dir }: { value: number | null; dir: 'up' | 'down' | 'flat' | null }) {
  if (value === null) return <span style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>—</span>
  const isGood = value >= 0.30
  const color = isGood ? 'var(--qb-trust-senior-color)' : 'var(--qb-diff-hard-color)'
  const icon = dir === 'up' ? 'fa-arrow-trend-up' : dir === 'down' ? 'fa-arrow-trend-down' : 'fa-minus'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color }}>
      <i className={`fa-regular ${icon}`} aria-hidden="true" style={{ fontSize: 10 }} />
      {value.toFixed(2)}
    </span>
  )
}

// ─── BloomsBadge ─────────────────────────────────────────────────────────────

export function BloomsBadge({ blooms }: { blooms: QBlooms }) {
  return <span style={{ fontSize: 12, color: 'var(--foreground)' }}>{blooms}</span>
}
