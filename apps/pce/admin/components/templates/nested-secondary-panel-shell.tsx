'use client'

import * as React from 'react'

// Defaults for the Ask Leo panel variant (consumed by ask-leo-sidebar.tsx).
export const ASK_LEO_PANEL_WIDTH_KEY = 'ask-leo-panel-width'
export const ASK_LEO_PANEL_WIDTH_DEFAULT = 320

interface NestedSecondaryPanelShellProps {
  open: boolean
  compact?: boolean
  overlay?: false | 'mobile' | 'desktop'
  side?: 'left' | 'right'
  dataSlot?: string
  widthPersistKey?: string
  widthDefault?: number
  contentClassName?: string
  'aria-label'?: string
  children?: React.ReactNode
}

export function NestedSecondaryPanelShell({
  open,
  compact,
  side = 'left',
  dataSlot,
  widthDefault = 240,
  contentClassName,
  children,
  ...rest
}: NestedSecondaryPanelShellProps) {
  if (!open) return null
  const border = side === 'right' ? 'borderLeft' : 'borderRight'
  return (
    <div
      data-slot={dataSlot}
      data-compact={compact || undefined}
      aria-label={rest['aria-label']}
      className={contentClassName}
      style={{ width: compact ? 48 : widthDefault, flexShrink: 0, [border]: '1px solid var(--border)', overflowY: 'auto' }}
    >
      {children}
    </div>
  )
}
