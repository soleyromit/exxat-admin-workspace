"use client"

/**
 * Floating Ask Leo launcher — the corner button, in two jobs.
 *
 * 1. **Products home** (`/home`, `/home/:product`). The utility bar's
 *    `AskLeoToggle` is hidden there (no active product, so most of the bar is
 *    stripped), which left a buyer with no way to ask "which of these do I
 *    actually need?" — every card can only pitch itself.
 * 2. **A minimised window.** Minimise has to park Leo somewhere visible, or the
 *    conversation is simply gone. This is that somewhere.
 *
 * Move parity with FloatingWindow (P6): drag to reposition; while focused,
 * arrow keys nudge, Shift is coarse, Home resets. Position persists under
 * `shell:leo-launcher-fab:offset` (suggestion invite tracks the same key).
 *
 * Pointer capture starts only after the drag threshold so a plain click still
 * opens / closes Ask Leo.
 *
 * Composes `AskLeoButton` rather than adding a shared FAB primitive: the ⌘⌥K
 * tooltip, the accessible name, and the star's motion states are all already
 * correct there.
 *
 * @see components/floating-marketing-banner-slot.tsx — the corner-slot precedent
 * @see components/ask-leo-window.tsx — what minimise collapses into this
 * @see lib/leo-launcher-fab-geometry.ts — drag + nudge + clamp
 */

import * as React from "react"
import { createPortal } from "react-dom"

import { AskLeoButton } from "@/components/ask-leo-button"
import { useAskLeo } from "@/components/ask-leo-context"
import {
  LEO_FAB_DEFAULT_OFFSET,
  LEO_FAB_OFFSET_STORAGE_KEY,
  clampLeoFabOffset,
  leoFabOffsetFromKeyboard,
  leoFabOffsetFromPointerDelta,
  type LeoFabOffset,
} from "@/lib/leo-launcher-fab-geometry"
import { cn } from "@/lib/utils"
import { usePersistedState } from "@exxatdesignux/ui/lib/persisted-state"

/** Past this movement, the gesture is a drag — not a click. */
const DRAG_THRESHOLD_PX = 6

/**
 * The app shell's main column, which is a flex sibling of the Ask Leo panel and
 * therefore narrows when the panel opens. Anchoring to it keeps the launcher
 * beside the panel without reading the panel's (user-resizable) width — a fixed
 * offset off the viewport would drift the moment someone dragged the panel edge.
 */
function useAppShellMain(): HTMLElement | null {
  const [host, setHost] = React.useState<HTMLElement | null>(null)
  React.useEffect(() => {
    setHost(document.querySelector<HTMLElement>("[data-app-shell-main]"))
  }, [])
  return host
}

function useHostSize(host: HTMLElement | null) {
  const [size, setSize] = React.useState({ width: 0, height: 0 })
  React.useEffect(() => {
    if (!host) return
    const measure = () => {
      const rect = host.getBoundingClientRect()
      setSize({ width: rect.width, height: rect.height })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(host)
    return () => observer.disconnect()
  }, [host])
  return size
}

export function LeoLauncherFab({
  /** Products home wording — names the decision the reader is actually making. */
  salesFraming = false,
}: {
  salesFraming?: boolean
}) {
  const { open, busy, minimized, setMinimized, toggle } = useAskLeo()
  const host = useAppShellMain()
  const hostSize = useHostSize(host)
  const [offset, setOffset] = usePersistedState<LeoFabOffset>(
    LEO_FAB_OFFSET_STORAGE_KEY,
    LEO_FAB_DEFAULT_OFFSET,
    { debounceMs: 0 },
  )
  const [dragging, setDragging] = React.useState(false)
  const draggedRef = React.useRef(false)
  const releaseDragRef = React.useRef<(() => void) | null>(null)
  const offsetRef = React.useRef(offset)
  const hostSizeRef = React.useRef(hostSize)

  React.useEffect(() => {
    offsetRef.current = offset
    hostSizeRef.current = hostSize
  })

  React.useEffect(() => () => releaseDragRef.current?.(), [])

  const clamped = React.useMemo(
    () =>
      hostSize.width > 0
        ? clampLeoFabOffset(offset, hostSize)
        : offset,
    [offset, hostSize],
  )

  React.useEffect(() => {
    if (hostSize.width <= 0) return
    const next = clampLeoFabOffset(offset, hostSize)
    if (next.end !== offset.end || next.bottom !== offset.bottom) {
      setOffset(next)
    }
  }, [hostSize, offset, setOffset])

  const onKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (hostSize.width <= 0) return
      const next = leoFabOffsetFromKeyboard(
        clamped,
        event.key,
        event.shiftKey,
        hostSize,
      )
      if (!next) return
      event.preventDefault()
      event.stopPropagation()
      setOffset(next)
    },
    [clamped, hostSize, setOffset],
  )

  const onPointerDownCapture = React.useCallback(
    (event: React.PointerEvent) => {
      if (event.button !== 0) return
      if (hostSizeRef.current.width <= 0 || !host) return

      const target = event.currentTarget
      const pointerId = event.pointerId
      const startX = event.clientX
      const startY = event.clientY
      const startOffset = offsetRef.current
      const rtl = getComputedStyle(host).direction === "rtl"
      let activeDrag = false
      draggedRef.current = false

      const onMove = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerId) return
        const dx = ev.clientX - startX
        const dy = ev.clientY - startY
        if (
          !activeDrag &&
          (Math.abs(dx) > DRAG_THRESHOLD_PX || Math.abs(dy) > DRAG_THRESHOLD_PX)
        ) {
          activeDrag = true
          draggedRef.current = true
          setDragging(true)
          // Capture only after the threshold so a plain click still reaches the button.
          try {
            target.setPointerCapture(pointerId)
          } catch {
            /* ignore */
          }
        }
        if (!activeDrag) return
        setOffset(
          leoFabOffsetFromPointerDelta(
            startOffset,
            dx,
            dy,
            hostSizeRef.current,
            rtl,
          ),
        )
      }

      const release = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerId) return
        releaseDragRef.current = null
        setDragging(false)
        try {
          if (target.hasPointerCapture(pointerId)) {
            target.releasePointerCapture(pointerId)
          }
        } catch {
          /* already released */
        }
        window.removeEventListener("pointermove", onMove)
        window.removeEventListener("pointerup", release)
        window.removeEventListener("pointercancel", release)
        // Leave `draggedRef` set so a post-drag click is ignored; the next
        // pointerdown clears it, and onActivate clears it when suppressing.
      }

      releaseDragRef.current = () =>
        release({ pointerId } as PointerEvent)
      window.addEventListener("pointermove", onMove)
      window.addEventListener("pointerup", release)
      window.addEventListener("pointercancel", release)
    },
    [host, setOffset],
  )

  const onActivate = React.useCallback(() => {
    // Suppress only the click that ends a real drag.
    if (draggedRef.current) {
      draggedRef.current = false
      return
    }
    if (minimized) {
      setMinimized(false)
      return
    }
    toggle()
  }, [minimized, setMinimized, toggle])

  const label = minimized ? "Restore Ask Leo" : open ? "Close Ask Leo" : "Ask Leo"
  const tooltip = minimized
    ? "Restore Ask Leo. Your conversation is still here."
    : open
      ? "Close Ask Leo"
      : salesFraming
        ? "Ask Leo which product fits"
        : "Ask Leo"

  if (!host) return null

  return createPortal(
    <div
      data-slot="leo-launcher-fab"
      className="pointer-events-none absolute z-40 flex"
      style={{
        insetInlineEnd: clamped.end,
        bottom: clamped.bottom,
      }}
      onKeyDown={onKeyDown}
    >
      <div
        className={cn("pointer-events-auto", dragging && "touch-none")}
        onPointerDownCapture={onPointerDownCapture}
      >
        <AskLeoButton
          size="lg"
          iconOnly
          introduceOnMount
          aria-busy={busy}
          ariaLabel={`${label}. Drag to move. Arrow keys nudge. Shift for a larger step. Home resets the corner.`}
          tooltipLabel={`${tooltip}. Drag to move · arrows nudge · Shift coarse · Home resets`}
          showShortcut={!minimized && !open}
          onClick={onActivate}
          tone="brand"
          starSize="sm"
          className={cn(
            "size-14 rounded-full shadow-[var(--shadow-sheet-panel)]",
            dragging ? "cursor-grabbing" : "cursor-grab",
          )}
        />
      </div>
    </div>,
    host,
  )
}
