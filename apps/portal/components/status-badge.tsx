'use client'

import { Badge } from '@exxatdesignux/ui'

export interface StatusTint {
  bg: string
  fg: string
  border: string
}

export function StatusBadge({
  label,
  icon,
  tint,
  className,
}: {
  label: string
  icon: string
  tint: StatusTint
  className?: string
}) {
  return (
    <Badge
      variant="secondary"
      className={`rounded-full gap-1.5 px-3 py-1 text-[12px] font-semibold whitespace-nowrap border ${className ?? ''}`}
      style={{ backgroundColor: tint.bg, color: tint.fg, borderColor: tint.border }}
    >
      <i className={`fa-regular ${icon}`} aria-hidden="true" style={{ fontSize: 11 }} />
      {label}
    </Badge>
  )
}

export const STATUS_TINT_SUCCESS: StatusTint = {
  bg:     'var(--qb-status-saved-bg)',
  fg:     'var(--qb-status-saved-fg)',
  border: 'var(--qb-status-saved-border)',
}
export const STATUS_TINT_WARNING: StatusTint = {
  bg:     'var(--qb-status-draft-bg)',
  fg:     'var(--qb-status-draft-fg)',
  border: 'var(--qb-status-draft-border)',
}
export const STATUS_TINT_NEUTRAL: StatusTint = {
  bg:     'var(--qb-status-archived-bg)',
  fg:     'var(--qb-status-archived-fg)',
  border: 'var(--qb-status-archived-border)',
}
