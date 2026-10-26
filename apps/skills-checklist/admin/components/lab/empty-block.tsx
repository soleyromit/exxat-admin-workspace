"use client"

/**
 * The one empty state for lab screens (consistency audit item 3). Wording rule: "No {noun} yet" when nothing is recorded,
 * "No {noun} match these filters" with a clear action when filters hide everything. `compact` drops the dashed box for use
 * inside a table's emptyState slot, where the table already draws the border.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"

export function EmptyBlock({ title, body, action, onAction, compact = false }: { title: string; body?: string; action?: { label: string; href?: string }; onAction?: () => void; compact?: boolean }) {
  return (
    <div className={compact ? "flex flex-col items-start gap-2 p-4" : "flex flex-col items-start gap-2 rounded-lg border border-dashed border-border p-6"} data-region={compact ? undefined : "empty"}>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {body ? <p className="max-w-prose text-sm text-muted-foreground">{body}</p> : null}
      {action?.href ? (
        <Button asChild variant="outline" size="sm" className="mt-1">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      ) : action ? (
        <Button type="button" variant="outline" size="sm" className="mt-1" onClick={onAction}>
          {action.label}
        </Button>
      ) : null}
    </div>
  )
}
