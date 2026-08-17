"use client"

import type * as React from "react"

import { Button } from "@/components/ui/button"
import { Tip } from "@/components/ui/tip"
import { cn } from "@/lib/utils"

import type { ExamLockColorMode } from "./exam-lock-color-mode"
import { ExamLockSettingsPopover } from "./exam-lock-settings-popover"

export interface ExamLockHeaderToolbarProps {
  colorMode: ExamLockColorMode
  onColorModeChange: (mode: ExamLockColorMode) => void
  onKeyboardOpen: () => void
  onCalculatorOpen: () => void
  /** Optional extra rows inside the settings popover. */
  settingsContent?: React.ReactNode
  className?: string
}

function ExamToolButton({
  label,
  iconClass,
  onClick,
}: {
  label: string
  iconClass: string
  onClick: () => void
}) {
  return (
    <Tip label={label} side="bottom">
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        aria-label={label}
        onClick={onClick}
      >
        <i className={cn("fa-light", iconClass, "text-sm")} aria-hidden="true" />
      </Button>
    </Tip>
  )
}

export function ExamLockHeaderToolbar({
  colorMode,
  onColorModeChange,
  onKeyboardOpen,
  onCalculatorOpen,
  settingsContent,
  className,
}: ExamLockHeaderToolbarProps) {
  return (
    <div
      className={cn("flex flex-wrap items-center gap-2", className)}
      role="toolbar"
      aria-label="Exam tools"
    >
      <ExamToolButton
        label="On-screen keyboard"
        iconClass="fa-keyboard"
        onClick={onKeyboardOpen}
      />
      <ExamToolButton
        label="Calculator"
        iconClass="fa-calculator"
        onClick={onCalculatorOpen}
      />
      <ExamLockSettingsPopover
        colorMode={colorMode}
        onColorModeChange={onColorModeChange}
      >
        {settingsContent}
      </ExamLockSettingsPopover>
    </div>
  )
}
