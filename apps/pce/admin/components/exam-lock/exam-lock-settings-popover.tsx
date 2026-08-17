"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tip } from "@/components/ui/tip"
import { cn } from "@/lib/utils"

import { ExamLockColorModeToggle } from "./exam-lock-color-mode-toggle"
import type { ExamLockColorMode } from "./exam-lock-color-mode"

export interface ExamLockSettingsPopoverProps {
  colorMode: ExamLockColorMode
  onColorModeChange: (mode: ExamLockColorMode) => void
  /** Optional extra settings below color mode. */
  children?: React.ReactNode
  className?: string
}

/** Exam settings — popover with color mode `ButtonGroup` + optional slots. */
export function ExamLockSettingsPopover({
  colorMode,
  onColorModeChange,
  children,
  className,
}: ExamLockSettingsPopoverProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tip label="Exam settings" side="bottom">
        <PopoverTrigger asChild>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            className={className}
            aria-label="Exam settings"
            aria-haspopup="dialog"
            aria-expanded={open}
          >
            <i className="fa-light fa-gear text-sm" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
      </Tip>
      <PopoverContent align="end" className="w-72 p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-foreground">Color mode</p>
            <p className="text-xs text-muted-foreground">
              Uses the same persisted theme as Settings → Appearance.
            </p>
          </div>
          <ExamLockColorModeToggle value={colorMode} onValueChange={onColorModeChange} />
          {children ? <div className={cn("flex flex-col gap-3 border-t border-border pt-3")}>{children}</div> : null}
        </div>
      </PopoverContent>
    </Popover>
  )
}
