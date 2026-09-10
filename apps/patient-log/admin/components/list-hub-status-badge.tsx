"use client"

/**
 * @deprecated Prefer `StatusBadge` from `@/components/ui/status-badge` with `tone`, `icon`, and `size`.
 */

import * as React from "react"
import {
  StatusBadge,
  STATUS_BADGE_SEMANTIC_MD_SHELL,
  STATUS_BADGE_SEMANTIC_SM_SHELL,
  type StatusBadgeSemanticSize,
  type StatusBadgeSurface,
} from "@/components/ui/status-badge"

/** @deprecated Use `STATUS_BADGE_SEMANTIC_SM_SHELL` */
export const LIST_HUB_STATUS_BADGE_TABLE_SHELL = STATUS_BADGE_SEMANTIC_SM_SHELL

/** @deprecated Use `STATUS_BADGE_SEMANTIC_MD_SHELL` */
export const LIST_HUB_STATUS_BADGE_BOARD_SHELL = STATUS_BADGE_SEMANTIC_MD_SHELL

/** @deprecated Use `STATUS_BADGE_SEMANTIC_MD_SHELL` */
export const LIST_HUB_INSPECTOR_CHIP_SHELL = STATUS_BADGE_SEMANTIC_MD_SHELL

export interface ListHubStatusBadgeProps {
  label: string
  tintClassName: string
  icon?: string
  size?: StatusBadgeSemanticSize
  /** @deprecated Use `size`. `table` → sm; `board` | `detail` → md. */
  surface?: StatusBadgeSurface
  className?: string
}

export function ListHubStatusBadge({
  label,
  tintClassName,
  icon,
  size,
  surface,
  className,
}: ListHubStatusBadgeProps) {
  return (
    <StatusBadge
      label={label}
      icon={icon}
      tintClassName={tintClassName}
      size={size}
      surface={surface}
      className={className}
    />
  )
}
