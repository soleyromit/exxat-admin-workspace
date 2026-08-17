"use client"

import { cn } from "@/lib/utils"

export interface ExamLockCautionStripProps {
  className?: string
}

/**
 * Diagonal hazard strip for high-severity integrity pause surfaces.
 * Top and bottom edges frame the pause surface like caution tape.
 */
export function ExamLockCautionStrip({ className }: ExamLockCautionStripProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "h-3 w-full shrink-0",
        "[background-image:repeating-linear-gradient(-45deg,var(--chip-4)_0_9px,var(--background)_9px_18px)]",
        className,
      )}
    />
  )
}
