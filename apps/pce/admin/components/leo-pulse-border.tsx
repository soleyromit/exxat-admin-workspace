"use client"

/**
 * LeoPulseBorder — breathing brand perimeter while Leo is thinking.
 *
 * IA from Border Beam Pulse (inner glow): a contained breathe on the surface
 * edge, not a rotating beam and not multi-hue chart fills. Brand tokens only.
 *
 * @see https://beam.jakubantalik.com/pulse
 */

import * as React from "react"
import { useReducedMotion } from "motion/react"

import { LEO_BLOB_ANIM_RATE, type LeoBlobAnimationSpeed } from "@/lib/leo-ambience"
import { cn } from "@/lib/utils"

export type LeoPulseBorderProps = {
  /** When false, unmounts (idle / wash disabled). */
  active?: boolean
  /** 0.05–1 — maps from `thinkingBlobOpacity`. */
  strength?: number
  animationSpeed?: LeoBlobAnimationSpeed
  /** Honour `blobAnimations` pref — static ring when false. */
  animate?: boolean
  className?: string
}

export function LeoPulseBorder({
  active = true,
  strength = 0.7,
  animationSpeed = "normal",
  animate = true,
  className,
}: LeoPulseBorderProps) {
  const reduceMotion = useReducedMotion() ?? false
  if (!active) return null

  const clamped = Math.min(1, Math.max(0.05, strength))
  const durationSec = 2.3 * LEO_BLOB_ANIM_RATE[animationSpeed]
  const run = animate && !reduceMotion

  return (
    <div
      aria-hidden
      data-slot="leo-pulse-border"
      data-animate={run ? "true" : "false"}
      className={cn(
        "leo-pulse-border pointer-events-none absolute inset-0 z-[2] overflow-hidden rounded-[inherit]",
        className,
      )}
      style={
        {
          "--leo-pulse-strength": String(clamped),
          "--leo-pulse-duration": `${durationSec}s`,
        } as React.CSSProperties
      }
    >
      {/* Soft inner wash — densest at the edge, clear in the centre. */}
      <div className="leo-pulse-border__glow absolute inset-0 rounded-[inherit]" />
      {/* Hairline brand ring that breathes with the glow. */}
      <div className="leo-pulse-border__ring absolute inset-0 rounded-[inherit]" />
    </div>
  )
}
