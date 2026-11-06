"use client"

/**
 * The row "..." menu, same order everywhere (map section E rule 8): Edit, lifecycle (Assign, Make default, New version), Deactivate or
 * Reactivate, Replace, then a separator and Delete in destructive style. The caller lists what applies; this sets the order.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@exxatdesignux/ui/components/ui/dropdown-menu"
import { railTriggerProps } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"

export type RowMenuSlot = "edit" | "lifecycle" | "status" | "delete"
const ORDER: RowMenuSlot[] = ["edit", "lifecycle", "status", "delete"]

export interface RowMenuEntry {
  slot: RowMenuSlot
  label: string
  icon: string
  onSelect?: () => void
  href?: string
  /** Why it cannot be done. The entry stays in the menu, disabled, with the reason in view under it and in aria-describedby. */
  blockedBecause?: string | null
}

const stopRowClick = (e: React.MouseEvent) => e.stopPropagation()

export function RowMenu({ label, entries }: { label: string; entries: readonly RowMenuEntry[] }) {
  const sorted = [...entries].sort((a, b) => ORDER.indexOf(a.slot) - ORDER.indexOf(b.slot))
  const blockId = `row-menu-block-${React.useId()}`
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" aria-label={label} onClick={stopRowClick} {...railTriggerProps()}>
          <i className="fa-light fa-ellipsis" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      {/* Marked as a rail trigger: a choice made from the panel must not dismiss the panel first. React events bubble through the portal to
          the table row, so they stop here too. z-[90]: the DS gives a menu z-50, under the floating panel (z-80) it also opens from. */}
      <DropdownMenuContent align="end" className="z-[90] w-60" onClick={stopRowClick} {...railTriggerProps()}>
        {sorted.map((e, i) => {
          const destructive = e.slot === "delete"
          const icon = <i className={`fa-light ${e.icon}`} aria-hidden="true" />
          const item = e.blockedBecause ? (
            /* The reason is in view with the menu, not behind a hover: a disabled entry cannot be hovered on touch or reached by keyboard. */
            <>
              <DropdownMenuItem variant={destructive ? "destructive" : undefined} disabled aria-describedby={blockId}>{icon}{e.label}</DropdownMenuItem>
              <p id={blockId} className="px-2 pb-1.5 text-xs text-muted-foreground" data-row-menu-reason>{e.blockedBecause}</p>
            </>
          ) : e.href ? (
            <DropdownMenuItem key={e.label} asChild variant={destructive ? "destructive" : undefined}><Link href={e.href}>{icon}{e.label}</Link></DropdownMenuItem>
          ) : (
            <DropdownMenuItem key={e.label} variant={destructive ? "destructive" : undefined} onSelect={e.onSelect}>{icon}{e.label}</DropdownMenuItem>
          )
          return (
            <React.Fragment key={e.label}>
              {destructive && i > 0 ? <DropdownMenuSeparator /> : null}
              {item}
            </React.Fragment>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
