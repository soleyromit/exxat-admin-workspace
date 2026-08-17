"use client"

import * as React from "react"
import { useReducedMotion } from "motion/react"
import { useTheme } from "@exxatdesignux/ui/hooks/use-color-scheme"

import {
  LEO_BLOB_ANIM_RATE,
  type LeoBlobAnimationSpeed,
} from "@/lib/leo-ambience"
import { cn } from "@/lib/utils"

export type BlobIntensity = "high" | "normal"

export type AnimatedBlobBackgroundProps = {
  className?: string
  intensity?: BlobIntensity
  /** When false, unmounts entirely (saves GPU while Leo is hidden). */
  enabled?: boolean
  /** When true, blobs animate faster (thinking / analyzing). */
  thinking?: boolean
  /** Float / think keyframes. Honours prefers-reduced-motion. */
  animate?: boolean
  /**
   * Run the entrance spread + one gentle float cycle, then settle.
   * Used on short-lived surfaces (What's new Leo cards) where an infinite
   * drift would keep competing with the copy.
   */
  playOnce?: boolean
  animationSpeed?: LeoBlobAnimationSpeed
  /**
   * `bar` — compact wash sized for a search / composer pill (blobs live inside
   * the rounded shell). `default` — full-panel hero / rail wash.
   */
  density?: "default" | "bar"
  /**
   * Bar density only. `pill` sizes the lobes for a composer / search pill.
   * `chip` sizes them for a control roughly one line tall (the utility bar's
   * Ask Leo chip): the lobes scale to the box instead of being clipped by it, so
   * each one's drift crosses the control top to bottom rather than showing a
   * flat middle band of a much taller lobe.
   */
  fit?: "pill" | "chip"
  /** Soft sheen sweep (bar density + thinking only). Default true. */
  sheen?: boolean
  /**
   * Free placement for bar blobs only (px). Applied on each blob's position
   * shell — never on a full-bleed layer — so the pill chrome stays put.
   */
  offsetX?: number
  offsetY?: number
}

/**
 * Bar lobes are sized and centred as a share of the pill width so they keep the
 * same overlap at any pill size. Neighbouring lobes overlap by ~20% of the pill
 * — enough that the wash reads as one field with three hot spots rather than
 * three detached circles.
 */
const BAR_LOBES = [
  { slot: 1 as const, centerPct: 24, widthPct: 54, heightClass: "h-32" },
  { slot: 3 as const, centerPct: 50, widthPct: 46, heightClass: "h-24" },
  { slot: 2 as const, centerPct: 76, widthPct: 52, heightClass: "h-28" },
]

/**
 * Same three slots, heights as a share of the control instead of fixed pixels.
 * A lobe taller than the control is what makes drift legible — the vertical
 * keyframes move each lobe by ~10-14% of its own height, and a lobe the exact
 * height of the box would leave a bald edge at the extremes. Between 1.2x and
 * 1.6x the box, that travel stays inside the fill while still reading as motion
 * from top to bottom, which pixel heights against a 32px chip cannot: at `h-32`
 * the chip only ever shows the lobe's flat middle.
 */
const CHIP_LOBES = [
  { slot: 1 as const, centerPct: 22, widthPct: 50, heightClass: "h-[160%]" },
  { slot: 3 as const, centerPct: 50, widthPct: 42, heightClass: "h-[125%]" },
  { slot: 2 as const, centerPct: 78, widthPct: 48, heightClass: "h-[145%]" },
]

function BarBlob({
  slot,
  centerPct,
  widthPct,
  heightClass,
  offsetX,
  offsetY,
  opacity,
  blurClass,
}: {
  slot: 1 | 2 | 3
  centerPct: number
  widthPct: number
  heightClass: string
  offsetX: number
  offsetY: number
  opacity: number
  blurClass: string
}) {
  // Placement on the position shell; keyframes run on the core (transform).
  const positionStyle: React.CSSProperties = {
    opacity,
    top: "50%",
    left: `${centerPct}%`,
    width: `${widthPct}%`,
    transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`,
  }

  return (
    <div className={cn("absolute", heightClass)} style={positionStyle}>
      <div
        className={cn(
          "leo-ai-blob leo-ai-blob-bar-core size-full rounded-full",
          blurClass,
          slot === 1 && "leo-ai-blob-1",
          slot === 2 && "leo-ai-blob-2",
          slot === 3 && "leo-ai-blob-3",
        )}
      />
    </div>
  )
}

export function AnimatedBlobBackground({
  className,
  intensity = "normal",
  enabled = true,
  thinking = false,
  animate = true,
  playOnce = false,
  animationSpeed = "normal",
  density = "default",
  fit = "pill",
  sheen = true,
  offsetX = 0,
  offsetY = 0,
}: AnimatedBlobBackgroundProps) {
  const reduceMotion = useReducedMotion() ?? false
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const isBar = density === "bar"
  const isChip = isBar && fit === "chip"

  if (!enabled) return null

  const animateFloat = animate && !reduceMotion
  const floatClass = playOnce
    ? (n: 1 | 2 | 3) => `leo-ai-blob-${n}--animate-once`
    : (n: 1 | 2 | 3) => `leo-ai-blob-${n}--animate`
  const isIntro = intensity === "high"
  const baseOpacity = thinking
    ? isDark
      ? 0.95
      : 1
    : isIntro
      ? 1
      : isDark
        ? 0.55
        : 0.85
  const midOpacity = thinking
    ? isDark
      ? 0.9
      : 0.98
    : isIntro
      ? 1
      : isDark
        ? 0.5
        : 0.82
  const tipOpacity = thinking
    ? isDark
      ? 0.92
      : 1
    : isIntro
      ? 1
      : isDark
        ? 0.5
        : 0.85

  // The floor sits well under the lobes so it ties them together without
  // flattening the composite into a single even wash.
  const bridgeOpacity = midOpacity * 0.5

  /* A blur wider than the lobe erases it. The chip's lobes are ~40-50px tall, so
     the pill's 24px blur would spread each one past its own edges and the three
     would fuse into one even film — the flat band again, by a different route. */
  const blurClass = isChip ? "blur-md" : thinking || isBar ? "blur-xl" : "blur-3xl"

  return (
    <div
      data-intensity={intensity}
      data-density={density}
      data-animate={animateFloat ? "true" : "false"}
      style={
        {
          "--leo-blob-anim-rate": String(LEO_BLOB_ANIM_RATE[animationSpeed]),
        } as React.CSSProperties
      }
      className={cn(
        "leo-ai-blob-root pointer-events-none absolute inset-0 z-0 overflow-hidden",
        thinking && "leo-ai-blob-thinking",
        className,
      )}
      aria-hidden
    >
      {isBar ? (
        <div className="absolute inset-0">
          {/* Connective floor under the lobes: keeps colour continuous across the
              pill so the drifting lobes never separate into detached circles. */}
          <div
            className={cn("absolute inset-x-0 top-1/2", isChip ? "h-[70%]" : "h-28")}
            style={{
              opacity: bridgeOpacity,
              transform: `translate(${offsetX}px, calc(-50% + ${offsetY}px))`,
            }}
          >
            <div
              className={cn(
                "leo-ai-blob-bar-bridge size-full rounded-full",
                isChip ? "blur-sm" : "blur-2xl",
              )}
            />
          </div>
          {(isChip ? CHIP_LOBES : BAR_LOBES).map(lobe => (
            <BarBlob
              key={lobe.slot}
              slot={lobe.slot}
              centerPct={lobe.centerPct}
              widthPct={lobe.widthPct}
              heightClass={lobe.heightClass}
              offsetX={offsetX}
              offsetY={offsetY}
              opacity={
                lobe.slot === 1
                  ? baseOpacity
                  : lobe.slot === 2
                    ? midOpacity
                    : tipOpacity
              }
              blurClass={blurClass}
            />
          ))}
          {animateFloat && thinking && sheen ? (
            <div
              className={cn(
                "leo-ai-blob-bar-sheen pointer-events-none absolute inset-y-[-30%] left-0 w-2/5",
                "rounded-full",
                isChip ? "blur-sm" : "blur-lg",
              )}
              style={{
                marginLeft: offsetX,
                marginTop: offsetY,
              }}
            />
          ) : null}
        </div>
      ) : (
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 top-0 mx-auto max-w-[600px]",
            animateFloat && "leo-ai-blob-spread",
          )}
        >
          <div
            className={cn(
              "leo-ai-blob leo-ai-blob-1 absolute rounded-full",
              blurClass,
              animateFloat && floatClass(1),
            )}
            style={{
              bottom: "-5%",
              left: "-5%",
              width: "min(480px, 90vw)",
              height: "min(480px, 90vw)",
              opacity: baseOpacity,
            }}
          />
          <div
            className={cn(
              "leo-ai-blob leo-ai-blob-2 absolute rounded-full",
              blurClass,
              animateFloat && floatClass(2),
            )}
            style={{
              bottom: "-8%",
              right: "-5%",
              width: "min(460px, 85vw)",
              height: "min(460px, 85vw)",
              opacity: midOpacity,
            }}
          />
          <div
            className={cn(
              "leo-ai-blob leo-ai-blob-3 absolute rounded-full",
              blurClass,
              animateFloat && floatClass(3),
            )}
            style={{
              bottom: "-10%",
              left: "50%",
              transform: "translateX(-50%)",
              width: "min(420px, 80vw)",
              height: "min(420px, 80vw)",
              opacity: tipOpacity,
            }}
          />
        </div>
      )}
    </div>
  )
}
