"use client"

import type * as React from "react"

import { useSidebarReflowZoom } from "@/hooks/use-sidebar-reflow-zoom"
import { cn } from "@/lib/utils"

export interface ExamLockQuestionBodyProps {
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
  contentClassName?: string
}

/**
 * Question scroll region + footer.
 * At ≥200% zoom (WCAG 1.4.10 reflow), uses normal document flow — no inner scroll pane.
 */
export function ExamLockQuestionBody({
  children,
  footer,
  className,
  contentClassName,
}: ExamLockQuestionBodyProps) {
  const reflowZoom = useSidebarReflowZoom()

  if (reflowZoom) {
    return (
      <div className={cn("flex flex-col", className)}>
        <div className={cn("pt-4 pb-4", contentClassName)}>{children}</div>
        {footer}
      </div>
    )
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className={cn("min-h-0 flex-1 overflow-y-auto pt-4 pb-4", contentClassName)}>
        {children}
      </div>
      {footer}
    </div>
  )
}
