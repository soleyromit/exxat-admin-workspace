"use client"

/**
 * LeoCursorDots — one DotPattern field that follows the pointer.
 * Click ripples the **same** field via mask waves (no second dot layer).
 * Scatter count + radius come from measured panel size × density.
 */

import * as React from "react"

import { DotPattern } from "@/components/ui/dot-pattern"
import { cn } from "@/lib/utils"

export type LeoCursorSpotlight = {
  x: number
  y: number
  active: boolean
  /** Incremented on click so `DotPattern` plays a wave on the existing mask. */
  burstKey: number
}

function pointerPercent(
  event: React.PointerEvent<HTMLElement>,
): { x: number; y: number } | null {
  const rect = event.currentTarget.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return null
  return {
    x: ((event.clientX - rect.left) / rect.width) * 100,
    y: ((event.clientY - rect.top) / rect.height) * 100,
  }
}

export function LeoCursorDots({
  spotlight,
  className,
  radius = 160,
  /**
   * Relative field density (`0.6` sparse → `1` normal → `1.75` dense).
   * Window shells default slightly denser than the docked rail.
   */
  density = 1.5,
  /** Layer opacity for the cursor spotlight field. */
  opacity = 1,
}: {
  spotlight: LeoCursorSpotlight
  className?: string
  radius?: number
  density?: number
  opacity?: number
  /** @deprecated Unused — density + size drive the field now. */
  gridSize?: number
}) {
  return (
    <div
      aria-hidden
      style={{ opacity: Math.min(1, Math.max(0, opacity)) }}
      className={cn(
        "pointer-events-none absolute inset-0 z-0 overflow-hidden",
        className,
      )}
    >
      <DotPattern
        cursorSpotlight
        scatter
        scatterDensity={density}
        spotlightX={spotlight.x}
        spotlightY={spotlight.y}
        spotlightActive={spotlight.active}
        spotlightBurstKey={spotlight.burstKey}
        glowRadius={radius}
        className="absolute inset-0 size-full fill-brand/70 dark:fill-brand/80"
      />
    </div>
  )
}

/**
 * Tracks pointer % for `LeoCursorDots`. Click bumps `burstKey` so the
 * existing field waves — skipped on the interactive Leo star.
 *
 * `pulseWaves` re-fires that same click ripple on an interval (thinking
 * chrome), so the thinking state uses the cursor wave — not a second effect.
 */
export function useLeoCursorSpotlight(
  enabled: boolean,
  options?: {
    pulseWaves?: boolean
    /** Gap between wave bursts while pulsing. Default 1400ms. */
    pulseIntervalMs?: number
  },
) {
  const pulseWaves = options?.pulseWaves ?? false
  const pulseIntervalMs = options?.pulseIntervalMs ?? 1400

  const [spotlight, setSpotlight] = React.useState<LeoCursorSpotlight>({
    x: 50,
    y: 42,
    active: false,
    burstKey: 0,
  })
  const rafRef = React.useRef(0)
  const pendingRef = React.useRef<{ x: number; y: number } | null>(null)

  const flush = React.useCallback(() => {
    rafRef.current = 0
    const next = pendingRef.current
    if (!next) return
    setSpotlight(prev => ({ ...prev, x: next.x, y: next.y, active: true }))
  }, [])

  const onPointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (!enabled) return
      const next = pointerPercent(event)
      if (!next) return
      pendingRef.current = next
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(flush)
      }
    },
    [enabled, flush],
  )

  const onPointerEnter = React.useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (!enabled) return
      const next = pointerPercent(event)
      if (!next) return
      setSpotlight(prev => ({ ...prev, ...next, active: true }))
    },
    [enabled],
  )

  const onPointerLeave = React.useCallback(() => {
    if (!enabled) return
    pendingRef.current = null
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
    // Keep the field lit while wave-pulsing (thinking); only idle dims on leave.
    if (pulseWaves) return
    setSpotlight(prev => ({ ...prev, active: false }))
  }, [enabled, pulseWaves])

  const onPointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (!enabled) return
      if (event.button !== 0) return
      const target = event.target
      if (
        target instanceof Element &&
        target.closest("[data-leo-icon-interactive]")
      ) {
        return
      }
      const next = pointerPercent(event)
      if (!next) return
      pendingRef.current = next
      setSpotlight(prev => ({
        ...prev,
        ...next,
        active: true,
        burstKey: prev.burstKey + 1,
      }))
    },
    [enabled],
  )

  React.useEffect(() => {
    if (enabled) return
    setSpotlight(prev => (prev.active ? { ...prev, active: false } : prev))
  }, [enabled])

  // Thinking: auto-fire the same mask wave as a click, from the current spot.
  React.useEffect(() => {
    if (!enabled || !pulseWaves) return
    const fire = () => {
      setSpotlight(prev => ({
        ...prev,
        active: true,
        burstKey: prev.burstKey + 1,
      }))
    }
    fire()
    const id = window.setInterval(fire, Math.max(600, pulseIntervalMs))
    return () => window.clearInterval(id)
  }, [enabled, pulseWaves, pulseIntervalMs])

  React.useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    },
    [],
  )

  return {
    spotlight,
    onPointerMove,
    onPointerEnter,
    onPointerLeave,
    onPointerDown,
  }
}
