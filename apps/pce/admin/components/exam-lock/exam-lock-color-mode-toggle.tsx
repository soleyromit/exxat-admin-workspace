"use client"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { cn } from "@/lib/utils"

import {
  EXAM_LOCK_COLOR_MODE_ICONS,
  EXAM_LOCK_COLOR_MODE_LABELS,
  EXAM_LOCK_COLOR_MODES,
  type ExamLockColorMode,
} from "./exam-lock-color-mode"

export interface ExamLockColorModeToggleProps {
  value: ExamLockColorMode
  onValueChange: (mode: ExamLockColorMode) => void
  className?: string
}

/** Shared `ButtonGroup` for exam lock color mode (light / dark / HC). */
export function ExamLockColorModeToggle({
  value,
  onValueChange,
  className,
}: ExamLockColorModeToggleProps) {
  return (
    <ButtonGroup className={cn("w-full", className)} aria-label="Color mode">
      {EXAM_LOCK_COLOR_MODES.map(mode => {
        const selected = value === mode
        return (
          <Button
            key={mode}
            type="button"
            variant="outline"
            className={cn(
              "min-h-10 min-w-0 flex-1 gap-1.5 px-2",
              selected && "bg-muted text-foreground",
            )}
            aria-pressed={selected}
            aria-label={EXAM_LOCK_COLOR_MODE_LABELS[mode]}
            onClick={() => onValueChange(mode)}
          >
            <i
              className={cn(
                "fa-light text-xs",
                selected && "fa-solid",
                EXAM_LOCK_COLOR_MODE_ICONS[mode],
              )}
              aria-hidden="true"
            />
            <span className="truncate text-xs">{EXAM_LOCK_COLOR_MODE_LABELS[mode]}</span>
          </Button>
        )
      })}
    </ButtonGroup>
  )
}
