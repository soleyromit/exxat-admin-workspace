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
}

export function ListHubStatusBadge({ label, tint, icon, className, flat }: ListHubStatusBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={`rounded-full gap-1.5 px-3 py-1 text-xs whitespace-nowrap normal-case tracking-normal ${flat ? 'border-0 font-medium' : 'border font-semibold'} ${className ?? ''}`}
      style={flat ? { backgroundColor: tint.bg, color: tint.fg } : { backgroundColor: tint.bg, color: tint.fg, borderColor: tint.border }}
    >
      <i className={`fa-light ${icon}`} aria-hidden="true" />
      {label}
    </Badge>
  )
}
