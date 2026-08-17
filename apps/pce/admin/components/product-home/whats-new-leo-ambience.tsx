"use client"

/**
 * Ask Leo What's new card shell — brand thinking chrome only.
 *
 * No cursor spotlight. Respects `thinkingAnimationStyle`: blobs (one-shot)
 * or pulse perimeter. Search-bar wash is out of scope here.
 */

import * as React from "react"
import { useReducedMotion } from "motion/react"

import { useLeoAmbience } from "@/components/leo-ambience-context"
import { LeoPulseBorder } from "@/components/leo-pulse-border"
import { LeoThinkingBackdrop } from "@/components/leo-thinking-backdrop"
import { cn } from "@/lib/utils"

export function WhatsNewLeoAmbience({
  children,
  className,
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  const reduceMotion = useReducedMotion() ?? false
  const { prefs } = useLeoAmbience()
  const usePulse = prefs.thinkingAnimationStyle === "pulse"

  return (
    <div
      className={cn(
        "relative h-full overflow-hidden rounded-xl border bg-card shadow-xs",
        className,
      )}
      style={style}
    >
      {!reduceMotion && prefs.thinkingBlob && !usePulse ? (
        <LeoThinkingBackdrop
          thinking
          intensity="high"
          opacity={prefs.thinkingBlobOpacity}
          animate={prefs.blobAnimations}
          playOnce
          animationSpeed={prefs.blobAnimationSpeed}
        />
      ) : null}
      {!reduceMotion && prefs.thinkingBlob && usePulse ? (
        <LeoPulseBorder
          active
          strength={prefs.thinkingBlobOpacity}
          animate={prefs.blobAnimations}
          animationSpeed={prefs.blobAnimationSpeed}
        />
      ) : null}
      <div className="relative z-[1] h-full min-w-0">{children}</div>
    </div>
  )
}
