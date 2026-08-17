"use client"

/**
 * LeoAmbientSurface — the ambience every Leo conversation surface wears.
 *
 * Panel, floating window, and the full-screen route all render this, so the
 * three cannot drift. Before it existed the panel and the window shared their
 * ambience through `AskLeoThreadBody` while full screen, which is a route with
 * its own layout, quietly had none of it: no cursor field, no wash, no veil.
 * Ambience that depends on which shell you happened to open is not a system,
 * it is three implementations of the same idea.
 *
 * What lives here is only what is the same everywhere: the cursor spotlight
 * field, the blob wash, and the composer veil, all read from one set of prefs
 * and one reduced-motion check. What legitimately differs stays with each
 * surface: headers, drag and resize chrome, and where the composer sits.
 *
 * @see components/ask-leo-thread-body.tsx — panel and window
 * @see components/leo-landing-client.tsx — full screen
 */

import * as React from "react"
import { useReducedMotion } from "motion/react"

import { useLeoAmbience } from "@/components/leo-ambience-context"
import { LeoCursorDots, useLeoCursorSpotlight } from "@/components/leo-cursor-dots"
import { LeoPulseBorder } from "@/components/leo-pulse-border"
import { LeoThinkingBackdrop } from "@/components/leo-thinking-backdrop"
import type { LeoBlobIntensity } from "@/lib/leo-ambience"
import { LEO_BLOB_ANIM_RATE } from "@/lib/leo-ambience"
import { cn } from "@/lib/utils"

function blobIntensityForBackdrop(level: LeoBlobIntensity): "high" | "normal" {
  return level === "high" ? "high" : "normal"
}

export interface LeoAmbientSurfaceProps {
  /**
   * Whether this surface is the one the user is looking at. The docked shells
   * pass their `open` flag; the route passes true, because a route the user
   * navigated to is by definition on screen.
   */
  active?: boolean
  /** Leo is answering. Lifts the wash and turns the cursor field into a pulse. */
  thinking: boolean
  /** False on the empty state, which gets a fuller wash under the hero. */
  hasThread: boolean
  /**
   * Where the idle field rests when the pointer has not arrived, as a percent
   * down the surface. It should sit on the composer, which is at the foot of a
   * docked shell but mid-canvas on the full-screen hero.
   */
  idleAnchorY?: number
  className?: string
  children: React.ReactNode
}

export function LeoAmbientSurface({
  active = true,
  thinking,
  hasThread,
  idleAnchorY = 82,
  className,
  children,
}: LeoAmbientSurfaceProps) {
  const { prefs } = useLeoAmbience()
  const reduceMotion = useReducedMotion() ?? false

  const thinkingCursorDots = thinking && prefs.thinkingOverlayDots
  const idleCursorDots = !thinking && prefs.idleDots
  const cursorDotsEnabled =
    active && !reduceMotion && (thinkingCursorDots || idleCursorDots)

  // Same click-wave as the idle cursor effect, paced by animation speed.
  const thinkingWaveIntervalMs = Math.round(
    1400 * LEO_BLOB_ANIM_RATE[prefs.blobAnimationSpeed],
  )
  const {
    spotlight,
    onPointerMove,
    onPointerEnter,
    onPointerLeave,
    onPointerDown,
  } = useLeoCursorSpotlight(cursorDotsEnabled, {
    pulseWaves: thinkingCursorDots && prefs.blobAnimations,
    pulseIntervalMs: thinkingWaveIntervalMs,
  })

  // Empty idle: soft spotlight near the composer. Thinking: keep the cursor
  // field lit and wave-pulsing even when the pointer is still.
  const emptyAmbientSpotlight = !hasThread && idleCursorDots
  const effectiveSpotlight = thinkingCursorDots
    ? { ...spotlight, active: true }
    : emptyAmbientSpotlight
      ? {
          ...spotlight,
          y: spotlight.active ? spotlight.y : idleAnchorY,
          active: true,
        }
      : spotlight

  const usePulse = prefs.thinkingAnimationStyle === "pulse"
  const pulseThinking = thinking && usePulse && prefs.thinkingBlob
  // Blobs while idle / empty, or while thinking in blobs mode. Pulse mode
  // swaps the thinking wash for the perimeter breathe.
  const showThinkingBackdrop = !reduceMotion && prefs.thinkingBlob && !pulseThinking
  const showPulse = !reduceMotion && pulseThinking

  return (
    <div
      className={cn("relative flex min-h-0 flex-1 flex-col", className)}
      onPointerMove={onPointerMove}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onPointerDown={onPointerDown}
    >
      {/* Ambience covers the FULL surface (transcript + composer). If it only
          filled the transcript flex region, the composer block sat on opaque
          shell chrome and read as a hard white cut. */}
      {cursorDotsEnabled ? (
        <LeoCursorDots
          spotlight={effectiveSpotlight}
          radius={prefs.idleGlowRadius}
          density={prefs.idleDensity}
          opacity={thinkingCursorDots ? prefs.thinkingOverlayDotsOpacity : 1}
        />
      ) : null}
      {showThinkingBackdrop ? (
        <LeoThinkingBackdrop
          thinking={thinking && !usePulse}
          blobsEnabled={prefs.thinkingBlob}
          // Empty hero uses `high` so idle wash reaches the star; threads stay
          // quieter (`normal` / pref) until thinking lifts the chrome.
          intensity={
            !hasThread || (thinking && !usePulse)
              ? "high"
              : blobIntensityForBackdrop(prefs.thinkingBlobIntensity)
          }
          opacity={prefs.thinkingBlobOpacity}
          animate={prefs.blobAnimations}
          animationSpeed={prefs.blobAnimationSpeed}
          className="animate-in fade-in animation-duration-700"
        />
      ) : null}
      {showPulse ? (
        <LeoPulseBorder
          active
          strength={prefs.thinkingBlobOpacity}
          animate={prefs.blobAnimations}
          animationSpeed={prefs.blobAnimationSpeed}
        />
      ) : null}

      {children}
    </div>
  )
}

/**
 * The blur under the composer, so a transcript scrolling behind it softens
 * rather than sliding under a hard edge.
 *
 * Absolutely positioned against the composer block, which is why it is a
 * sibling of the composer rather than part of `LeoAmbientSurface`: each
 * surface puts its composer in a different place.
 *
 * Every host declares what it fades into with `--leo-thread-surface`; the
 * fallback is the docked panel's own background.
 */
export function LeoComposerVeil({ className }: { className?: string }) {
  const { prefs } = useLeoAmbience()
  if (prefs.composerVeil === "off") return null

  const strong = prefs.composerVeil === "strong"
  const mid = strong ? 28 : 18
  const end = strong ? 58 : 42
  const surface = "var(--leo-thread-surface, var(--secondary-panel-bg))"

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-x-0 -top-20 bottom-0",
        strong ? "backdrop-blur-2xl" : "backdrop-blur-xl",
        className,
      )}
      style={{
        background: [
          "linear-gradient(to bottom,",
          "transparent 0%,",
          `oklch(from ${surface} l c h / ${mid}%) 42%,`,
          `oklch(from ${surface} l c h / ${end}%) 100%)`,
        ].join(" "),
        maskImage:
          "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.35) 35%, black 70%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.35) 35%, black 70%)",
      }}
    />
  )
}
