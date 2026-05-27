'use client'

/**
 * Generic row-actions component for tables.
 *
 * Why this exists: see docs/governance/component-depth-audits/organisms-templates.md
 * (top recommendation: 6+ PCE admin entity pages were reinventing the same
 * `DropdownMenu + Trigger + Button(fa-ellipsis) + Content` block — ~15 lines
 * each, ~90 lines duplicated). Canonical pattern in
 * exxat-ds/apps/web/components/data-list-table-cells.tsx — adapted here as a
 * generic `RowActions<TData>` so any PCE admin entity table can pass its own
 * row type without re-typing the DropdownMenu shell.
 *
 * Conventions match the surveys/page.tsx reference:
 *   - hover-revealed kebab Button (variant="ghost" size="icon-sm")
 *   - `e.stopPropagation()` on trigger AND content so row-click doesn't fire
 *   - `align="end"` content with configurable width
 *   - per-action `variant: 'destructive'` plus optional `divider` before it
 *   - per-action `disabled` and `hidden` for LMS-on / status-conditional rows
 */

import { useState } from 'react'
import {
  Button,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@exxatdesignux/ui'

/**
 * A single action in a row's kebab menu.
 *
 * `divider: true` renders a `DropdownMenuSeparator` BEFORE this item — use it
 * to break destructive actions (e.g., Archive, Withdraw) away from neutral
 * actions (Edit, View). Hidden actions don't render at all so the separator
 * never appears alone.
 */
export interface RowAction<TData> {
  label: string
  icon: string
  onClick?: (row: TData) => void
  variant?: 'default' | 'destructive'
  disabled?: boolean
  divider?: boolean
  hidden?: boolean
}

interface RowActionsProps<TData> {
  row: TData
  actions: RowAction<TData>[]
  /** aria-label suffix for the trigger button. Defaults to "row". */
  label?: string
  /** Tailwind class for the DropdownMenuContent. Defaults to `w-44`. */
  contentClassName?: string
}

export function RowActions<TData>({
  row,
  actions,
  label = 'row',
  contentClassName = 'w-44',
}: RowActionsProps<TData>) {
  const [open, setOpen] = useState(false)
  const visible = actions.filter(a => !a.hidden)
  if (visible.length === 0) return null

  return (
    <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${label}`}
          onClick={(e) => e.stopPropagation()}
        >
          <i className="fa-regular fa-ellipsis" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={contentClassName}
        onClick={(e) => e.stopPropagation()}
      >
        {visible.map((a, i) => (
          <RowActionItem key={`${a.label}-${i}`} action={a} row={row} showDivider={!!a.divider && i > 0} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function RowActionItem<TData>({
  action,
  row,
  showDivider,
}: {
  action: RowAction<TData>
  row: TData
  showDivider: boolean
}) {
  return (
    <>
      {showDivider && <DropdownMenuSeparator />}
      <DropdownMenuItem
        variant={action.variant ?? 'default'}
        disabled={action.disabled}
        onClick={action.onClick ? () => action.onClick!(row) : undefined}
      >
        <i className={`fa-light ${action.icon}`} aria-hidden="true" />
        {action.label}
      </DropdownMenuItem>
    </>
  )
}
