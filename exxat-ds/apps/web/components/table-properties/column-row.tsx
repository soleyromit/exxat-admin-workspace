"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { Tip } from "@/components/ui/tip"
import { DragHandleGripIcon } from "@/components/ui/drag-handle-grip"
import { ToggleSwitch } from "@/components/ui/toggle-switch"

export interface ColumnRowProps {
  label: string
  isFirst: boolean
  isLast: boolean
  visible: boolean
  onToggleVisible: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  // drag-and-drop props spread from useDraggableList
  draggable: true
  onDragStart: React.DragEventHandler
  onDragOver: React.DragEventHandler
  onDrop: React.DragEventHandler
  onDragEnd: React.DragEventHandler
  isDragging: boolean
  isOver: boolean
}

export function ColumnRow({
  label,
  isFirst,
  isLast,
  visible,
  onToggleVisible,
  onMoveUp,
  onMoveDown,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
  isOver,
}: ColumnRowProps) {
  return (
    <div
      role="listitem"
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        "flex items-center gap-2 px-2 py-2 rounded-lg group hover:bg-interactive-hover-subtle transition-colors cursor-grab active:cursor-grabbing",
        isDragging && "opacity-40",
        isOver && "ring-2 ring-ring bg-accent/30",
      )}
    >
      <DragHandleGripIcon className="text-[13px] text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" />
      <span className="flex-1 text-sm text-foreground">{label}</span>
      {/* Up / Down priority buttons */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Tip label={`Move ${label} up`} side="top">
          <button
            type="button"
            aria-label={`Move ${label} up`}
            disabled={isFirst}
            onClick={onMoveUp}
            className="inline-flex items-center justify-center size-6 rounded text-muted-foreground hover:text-interactive-hover-foreground hover:bg-interactive-hover disabled:opacity-30 disabled:pointer-events-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <i className="fa-light fa-chevron-up text-xs" aria-hidden="true" />
          </button>
        </Tip>
        <Tip label={`Move ${label} down`} side="top">
          <button
            type="button"
            aria-label={`Move ${label} down`}
            disabled={isLast}
            onClick={onMoveDown}
            className="inline-flex items-center justify-center size-6 rounded text-muted-foreground hover:text-interactive-hover-foreground hover:bg-interactive-hover disabled:opacity-30 disabled:pointer-events-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <i className="fa-light fa-chevron-down text-xs" aria-hidden="true" />
          </button>
        </Tip>
      </div>
      {/* Visibility toggle */}
      <ToggleSwitch
        checked={visible}
        onChange={onToggleVisible}
      />
    </div>
  )
}
