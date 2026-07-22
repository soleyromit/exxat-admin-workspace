"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export interface SearchRecentsPopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: string[]
  onSelect: (query: string) => void
  onClear?: () => void
  anchor: React.ReactNode
  title?: string
  clearLabel?: string
  className?: string
}

export function SearchRecentsPopover({
  open,
  onOpenChange,
  items,
  onSelect,
  onClear,
  anchor,
  title = "Recent searches",
  clearLabel = "Clear",
  className,
}: SearchRecentsPopoverProps) {
  const headingId = React.useId()

  if (items.length === 0) {
    return <>{anchor}</>
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverAnchor asChild>{anchor}</PopoverAnchor>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={8}
        className={cn("w-[var(--radix-popover-trigger-width)] min-w-72 max-w-xl p-0", className)}
        onOpenAutoFocus={e => e.preventDefault()}
      >
        <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
          <h2 id={headingId} className="text-sm font-semibold text-foreground">
            {title}
          </h2>
          {onClear ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto min-h-6 px-2 py-1 text-xs text-muted-foreground"
              onClick={() => onClear()}
            >
              {clearLabel}
            </Button>
          ) : null}
        </div>
        <ul className="max-h-64 overflow-y-auto py-1" aria-labelledby={headingId}>
          {items.map((query, index) => (
            <li key={`${query}-${index}`}>
              <Button
                type="button"
                variant="ghost"
                className="flex h-auto w-full min-h-10 items-center justify-start gap-2.5 px-3 py-2 text-left text-sm font-normal"
                onMouseDown={e => e.preventDefault()}
                onClick={() => {
                  onSelect(query)
                  onOpenChange(false)
                }}
              >
                <i className="fa-light fa-clock-rotate-left size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate font-medium text-foreground">{query}</span>
              </Button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
