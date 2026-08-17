"use client"

/**
 * FAB catalog previews — composition patterns, not a second button primitive.
 * Product Leo launcher: `LeoLauncherFab` → `AskLeoButton`.
 */

import * as React from "react"

import { AskLeoButton } from "@/components/ask-leo-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tip } from "@/components/ui/tip"
import {
  LEO_FAB_DEFAULT_OFFSET,
  LEO_FAB_NUDGE,
  LEO_FAB_NUDGE_COARSE,
  clampLeoFabOffset,
  leoFabOffsetFromKeyboard,
  leoFabOffsetFromPointerDelta,
  type LeoFabOffset,
} from "@/lib/leo-launcher-fab-geometry"
import { cn } from "@/lib/utils"

const DRAG_THRESHOLD_PX = 4

function FabStage({
  children,
  className,
  label,
}: {
  children: React.ReactNode
  className?: string
  label: string
}) {
  return (
    <div
      className={cn(
        "relative h-40 w-full max-w-sm overflow-hidden rounded-lg border border-border bg-muted/30",
        className,
      )}
    >
      <p className="absolute start-3 top-2 text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

/** Brand circle — product Leo launcher chrome. */
export function FabBrandPreview() {
  return (
    <FabStage label="Brand · icon only">
      <div className="absolute bottom-4 end-4">
        <AskLeoButton
          size="lg"
          iconOnly
          animatedStar
          tone="brand"
          starSize="sm"
          showShortcut={false}
          ariaLabel="Ask Leo"
          tooltipLabel="Ask Leo"
          onClick={() => undefined}
          className="size-14 rounded-full shadow-[var(--shadow-sheet-panel)]"
        />
      </div>
    </FabStage>
  )
}

/** Outline circle for secondary floating actions. */
export function FabOutlinePreview() {
  return (
    <FabStage label="Outline · secondary">
      <div className="absolute bottom-4 end-4">
        <Tip label="Compose" side="left">
          <Button
            type="button"
            size="icon-lg"
            variant="outline"
            aria-label="Compose"
            className="size-14 rounded-full bg-background shadow-[var(--shadow-sheet-panel)]"
          >
            <i className="fa-light fa-pen" aria-hidden="true" />
          </Button>
        </Tip>
      </div>
    </FabStage>
  )
}

/** Extended FAB with a visible label. */
export function FabExtendedPreview() {
  return (
    <FabStage label="Extended · label">
      <div className="absolute bottom-4 end-4">
        <AskLeoButton
          size="lg"
          animatedStar
          tone="brand"
          label="Ask Leo"
          showShortcut={false}
          onClick={() => undefined}
          className="h-14 rounded-full px-5 shadow-[var(--shadow-sheet-panel)]"
        />
      </div>
    </FabStage>
  )
}

/** Badge affordance for unread / pending count — solid count chip above the FAB. */
export function FabBadgePreview() {
  return (
    <FabStage label="With badge">
      <div className="absolute bottom-4 end-4">
        <div className="relative overflow-visible">
          <AskLeoButton
            size="lg"
            iconOnly
            animatedStar
            tone="brand"
            starSize="sm"
            showShortcut={false}
            ariaLabel="Ask Leo, 3 unread"
            tooltipLabel="Ask Leo"
            onClick={() => undefined}
            className="size-14 overflow-visible rounded-full shadow-[var(--shadow-sheet-panel)]"
          />
          <Badge
            variant="count"
            className="pointer-events-none absolute -end-1.5 -top-1.5 z-10 h-4 min-w-4 justify-center rounded-full border-transparent px-1 py-0"
          >
            3
          </Badge>
        </div>
      </div>
    </FabStage>
  )
}

/** Thinking — star in working motion while Leo is composing. */
export function FabThinkingPreview() {
  return (
    <FabStage label="Thinking · aria-busy">
      <div className="absolute bottom-4 end-4">
        <AskLeoButton
          size="lg"
          iconOnly
          animatedStar
          tone="brand"
          starSize="sm"
          showShortcut={false}
          aria-busy
          busyLabel="Leo is thinking"
          ariaLabel="Ask Leo, thinking"
          tooltipLabel="Leo is thinking"
          onClick={() => undefined}
          className="size-14 rounded-full shadow-[var(--shadow-sheet-panel)]"
        />
      </div>
    </FabStage>
  )
}

const SUGGESTION_CARD_CLASS =
  "group pointer-events-auto flex w-full max-w-[16rem] cursor-pointer items-start gap-2.5 rounded-xl border border-border/80 bg-background p-3 text-start text-[0.8125rem] leading-snug shadow-md transition-[border-color,box-shadow,background-color] hover:border-brand/35 hover:bg-interactive-hover/80 hover:shadow-lg"

/** Marketing-style suggestion card docked above the FAB. */
export function FabSuggestionPreview() {
  return (
    <FabStage label="With suggestion" className="h-52">
      <div className="absolute bottom-4 end-4 flex flex-col items-end gap-3">
        <Button
          type="button"
          variant="ghost"
          className={cn("h-auto font-normal", SUGGESTION_CARD_CLASS)}
          aria-label="How does Exxat Prism fit our program?"
        >
          <span className="flex-1">How does Exxat Prism fit our program?</span>
          <i
            className="fa-light fa-arrow-right mt-[0.2rem] shrink-0 text-[0.7rem] text-muted-foreground transition-colors group-hover:text-brand"
            aria-hidden="true"
          />
        </Button>
        <AskLeoButton
          size="lg"
          iconOnly
          animatedStar
          tone="brand"
          starSize="sm"
          showShortcut={false}
          ariaLabel="Ask Leo"
          tooltipLabel="Ask Leo"
          onClick={() => undefined}
          className="size-14 rounded-full shadow-[var(--shadow-sheet-panel)]"
        />
      </div>
    </FabStage>
  )
}

/** Bounds the nudge maths clamps against. Matches the stage below. */
const NUDGE_HOST_SIZE = { width: 360, height: 160 }

/** Drag + keyboard move demo — same chords and drag as the product Leo launcher. */
export function FabKeyboardNudgePreview() {
  const stageRef = React.useRef<HTMLDivElement>(null)
  const [offset, setOffset] = React.useState<LeoFabOffset>(LEO_FAB_DEFAULT_OFFSET)
  const [dragging, setDragging] = React.useState(false)
  const [status, setStatus] = React.useState(
    "Drag the FAB, or focus it and use arrow keys. Shift for a larger step. Home resets.",
  )
  const draggedRef = React.useRef(false)
  const offsetRef = React.useRef(offset)
  React.useEffect(() => {
    offsetRef.current = offset
  })

  const onKeyDown = (event: React.KeyboardEvent) => {
    const next = leoFabOffsetFromKeyboard(
      offset,
      event.key,
      event.shiftKey,
      NUDGE_HOST_SIZE,
    )
    if (!next) return
    event.preventDefault()
    setOffset(next)
    setStatus(
      event.key === "Home"
        ? "Reset to the default corner."
        : `Moved · end ${next.end}px · bottom ${next.bottom}px`,
    )
  }

  const onPointerDownCapture = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    const target = event.currentTarget
    target.setPointerCapture(event.pointerId)
    const startX = event.clientX
    const startY = event.clientY
    const startOffset = offsetRef.current
    draggedRef.current = false
    setDragging(true)

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      if (Math.abs(dx) > DRAG_THRESHOLD_PX || Math.abs(dy) > DRAG_THRESHOLD_PX) {
        draggedRef.current = true
      }
      if (!draggedRef.current) return
      const next = leoFabOffsetFromPointerDelta(
        startOffset,
        dx,
        dy,
        NUDGE_HOST_SIZE,
        false,
      )
      setOffset(next)
      setStatus(`Dragged · end ${next.end}px · bottom ${next.bottom}px`)
    }
    const release = () => {
      setDragging(false)
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", release)
      window.removeEventListener("pointercancel", release)
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", release)
    window.addEventListener("pointercancel", release)
  }

  const clamped = clampLeoFabOffset(offset, NUDGE_HOST_SIZE)

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {status} Fine step {LEO_FAB_NUDGE}px · coarse {LEO_FAB_NUDGE_COARSE}px.
      </p>
      <div
        ref={stageRef}
        className="relative h-40 w-full overflow-hidden rounded-lg border border-border bg-muted/30"
        onKeyDown={onKeyDown}
      >
        <p className="absolute start-3 top-2 text-xs text-muted-foreground">
          Drag or keyboard
        </p>
        <div
          className="absolute touch-none"
          style={{
            insetInlineEnd: Math.min(clamped.end, 120),
            bottom: Math.min(clamped.bottom, 80),
          }}
          onPointerDownCapture={onPointerDownCapture}
        >
          <AskLeoButton
            size="lg"
            iconOnly
            animatedStar
            tone="brand"
            starSize="sm"
            showShortcut={false}
            ariaLabel="Ask Leo. Drag to move. Arrow keys nudge. Shift for a larger step. Home resets the corner."
            tooltipLabel="Drag to move · arrows nudge · Shift coarse · Home resets"
            onClick={() => {
              if (draggedRef.current) {
                draggedRef.current = false
              }
            }}
            className={cn(
              "size-14 rounded-full shadow-[var(--shadow-sheet-panel)]",
              dragging ? "cursor-grabbing" : "cursor-grab",
            )}
          />
        </div>
      </div>
    </div>
  )
}

/** Default / outline / brand / extended row for anatomy. */
export function FabKindsPreview() {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <Tip label="Default">
        <Button
          type="button"
          size="icon-lg"
          variant="default"
          aria-label="Create"
          className="size-14 rounded-full shadow-[var(--shadow-sheet-panel)]"
        >
          <i className="fa-light fa-plus" aria-hidden="true" />
        </Button>
      </Tip>
      <Tip label="Secondary">
        <Button
          type="button"
          size="icon-lg"
          variant="secondary"
          aria-label="Share"
          className="size-14 rounded-full shadow-[var(--shadow-sheet-panel)]"
        >
          <i className="fa-light fa-share" aria-hidden="true" />
        </Button>
      </Tip>
      <Tip label="Outline">
        <Button
          type="button"
          size="icon-lg"
          variant="outline"
          aria-label="Filter"
          className="size-14 rounded-full bg-background shadow-[var(--shadow-sheet-panel)]"
        >
          <i className="fa-light fa-filter" aria-hidden="true" />
        </Button>
      </Tip>
      <AskLeoButton
        size="lg"
        iconOnly
        animatedStar
        tone="brand"
        starSize="sm"
        showShortcut={false}
        ariaLabel="Ask Leo"
        onClick={() => undefined}
        className="size-14 rounded-full shadow-[var(--shadow-sheet-panel)]"
      />
      <AskLeoButton
        size="lg"
        animatedStar
        tone="brand"
        label="Ask Leo"
        showShortcut={false}
        onClick={() => undefined}
        className="h-14 rounded-full px-5 shadow-[var(--shadow-sheet-panel)]"
      />
    </div>
  )
}
