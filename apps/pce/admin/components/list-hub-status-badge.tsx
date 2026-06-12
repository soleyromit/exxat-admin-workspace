'use client'

import * as React from 'react'
import { Badge } from '@exxatdesignux/ui'
import type { StatusTint } from '@/lib/list-status-badges'

export interface ListHubStatusBadgeProps {
  label: string
  tint: StatusTint
  icon: string
  className?: string
}

export function ListHubStatusBadge({ label, tint, icon, className }: ListHubStatusBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={`rounded-full gap-1.5 px-3 py-1 text-xs font-semibold whitespace-nowrap border ${className ?? ''}`}
      style={{ backgroundColor: tint.bg, color: tint.fg, borderColor: tint.border }}
    >
      <i className={`fa-regular ${icon}`} aria-hidden="true" style={{ fontSize: 11 }} />
      {label}
    </Badge>
  )
}
