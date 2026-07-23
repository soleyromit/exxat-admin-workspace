"use client"

import * as React from "react"

import {
  EDGE_RESIZE_HANDLE_CLASS,
  startEdgeResizeDrag,
  verticalResizeSeparatorAria,
} from "@exxatdesignux/ui/lib/edge-resize-handle"
import { cn } from "@/lib/utils"

export function SidebarDrillInResizeHandle({
  widthPx,
  getWidth,
  onResizeTo,
  valueMin = 200,
  valueMax = 480,
  className,
}: {
  /** Current panel width — drives `aria-valuenow`. */
  widthPx: number
  getWidth: () => number
  onResizeTo: (widthPx: number) => void
  valueMin?: number
  valueMax?: number
  className?: string
}) {
  return (
    <div
      {...verticalResizeSeparatorAria({
        label: "Resize navigation panel",
        valueNow: widthPx,
        valueMin,
        valueMax,
      })}
      data-slot="sidebar-drill-in-resize-handle"
      onMouseDown={(event) => {
        const startX = event.clientX
        const startW = getWidth()
        startEdgeResizeDrag(event, (clientX) => {
          onResizeTo(startW + (clientX - startX))
        })
      }}
      className={cn(EDGE_RESIZE_HANDLE_CLASS, "!z-[2]", className)}
    />
  )
}
