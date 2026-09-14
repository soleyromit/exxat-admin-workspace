'use client'

import * as React from 'react'
import { Badge } from '@exxatdesignux/ui'
import type { StatusTint } from '@/lib/list-status-badges'

export interface ListHubStatusBadgeProps {
  label: string
  tint: StatusTint
  icon: string
  className?: string
  /** Background fill only, no border, `font-medium` instead of `font-semibold`
   *  — opt-in, every other call site keeps the default bordered/bold look.
   *  For contexts where the badge sits directly beside a real outline/filled
   *  action Button and needs to read as calmer/secondary information, not
   *  compete with the button for "which of these is clickable" (Romit,
   *  2026-09-02: "unable to determine which is the action button,
   *  considering the tags are loud" — the bordered, semibold badge was the
   *  same visual weight as the outline button next to it). */
  flat?: boolean
  /** `md` (default) is this component's original size — unchanged for every
   *  existing call site. `sm` matches the DS's own semantic-badge "sm" shell
   *  (`px-2.5` instead of `px-3`) for contexts sized against it directly,
   *  e.g. the Operations dashboard rows (Romit, 2026-09-11, against
   *  exxat-surveys-24f.pages.dev/design-os/dashboard). */
  size?: 'sm' | 'md'
}

export function ListHubStatusBadge({ label, tint, icon, className, flat, size = 'md' }: ListHubStatusBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={`rounded-full gap-1.5 text-xs whitespace-nowrap normal-case tracking-normal ${size === 'sm' ? 'px-2.5 py-0.5' : 'px-3 py-1'} ${flat ? 'border-0 font-medium' : 'border font-semibold'} ${className ?? ''}`}
      style={flat ? { backgroundColor: tint.bg, color: tint.fg } : { backgroundColor: tint.bg, color: tint.fg, borderColor: tint.border }}
    >
      <i className={`fa-light ${icon}`} aria-hidden="true" />
      {label}
    </Badge>
  )
}
