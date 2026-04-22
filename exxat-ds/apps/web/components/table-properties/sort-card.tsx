"use client"
import * as React from "react"
import { Tip } from "@/components/ui/tip"
import { DragHandleGripIcon } from "@/components/ui/drag-handle-grip"
import { type SortRule, COLUMNS } from "./types"

/** Sort rule card inside the Sort drawer panel */
export type DrawerSortCardProps = {
  rule: SortRule
  /** When the active table uses dynamic columns (e.g. placements), pass the resolved label. */
  fieldLabel?: string
  isPrimary: boolean
  onRemove: () => void
  onToggleDir: () => void
}

export function DrawerSortCard(props: DrawerSortCardProps) {
  const { rule, fieldLabel, isPrimary, onRemove, onToggleDir } = props
  const col = COLUMNS.find(c => c.key === rule.fieldKey)
  const label = fieldLabel ?? col?.label ?? rule.fieldKey
  if (!label) return null
  return (
    <div className="rounded-lg border border-border bg-background overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <DragHandleGripIcon className="text-[13px] text-muted-foreground/40" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {isPrimary && (
              <span className="text-xs font-bold text-accent-foreground bg-accent rounded px-1 py-0.5 leading-none uppercase tracking-wide shrink-0">
                Primary
              </span>
            )}
            <p className="text-sm font-medium text-foreground truncate">{label}</p>
          </div>
          <button
            type="button"
            aria-label={`Direction: ${rule.direction === "asc" ? "Ascending" : "Descending"} — click to toggle`}
            onClick={onToggleDir}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-interactive-hover-foreground transition-colors mt-0.5"
          >
            <i className={`fa-light ${rule.direction === "asc" ? "fa-arrow-up-az" : "fa-arrow-down-az"} text-xs`} aria-hidden="true" />
            {rule.direction === "asc" ? "Ascending" : "Descending"}
            <i className="fa-light fa-chevron-down text-xs" aria-hidden="true" />
          </button>
        </div>
        <Tip label={`Remove ${label} sort`} side="top">
          <button
            type="button"
            aria-label={`Remove ${label} sort`}
            onClick={onRemove}
            className="inline-flex items-center justify-center size-7 rounded text-muted-foreground hover:text-destructive hover:bg-interactive-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
          >
            <i className="fa-light fa-trash text-xs" aria-hidden="true" />
          </button>
        </Tip>
      </div>
    </div>
  )
}
