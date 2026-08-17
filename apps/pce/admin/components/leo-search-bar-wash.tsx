"use client"

/**
 * Leo search-bar thinking wash — inside the pill or outside as a free-offset halo.
 *
 * The clip frame is pinned to the pill and never translates. Placement offsets
 * are passed into AnimatedBlobBackground and applied per-blob only.
 */

import * as React from "react"

import { AnimatedBlobBackground } from "@/components/animated-blob-background"
import { AiThinkingOverlay } from "@/components/ui/ai-thinking-surface"
import type { LeoAmbiencePrefs } from "@/lib/leo-ambience"
import { cn } from "@/lib/utils"

export function LeoSearchBarWash({
  prefs,
  mode,
  className,
}: {
  prefs: LeoAmbiencePrefs
  mode: "inside" | "outside"
  className?: string
}) {
  if (!prefs.searchBarWash) return null

  const intensity =
    prefs.thinkingBlobIntensity === "high" ? "high" : "normal"

  return (
    <div
      className={cn(
        "pointer-events-none absolute z-0 overflow-hidden leo-ai-blob-layer leo-ai-blob-layer--bar",
        mode === "inside" ? "inset-0 rounded-[inherit]" : "inset-[-2.75rem]",
        className,
      )}
      aria-hidden
    >
      <AnimatedBlobBackground
        enabled={prefs.thinkingBlob}
        thinking
        intensity={intensity}
        density="bar"
        animate={prefs.blobAnimations}
        animationSpeed={prefs.blobAnimationSpeed}
        sheen={prefs.searchBarSheen}
        offsetX={prefs.searchBarOffsetX}
        offsetY={prefs.searchBarOffsetY}
      />
      {prefs.searchBarDots ? (
        <AiThinkingOverlay
          active
          cloudCount={2}
          cloudRadius={160}
          gridSize={9}
          dotRadius={0.75}
          fillClassName="fill-brand/35 dark:fill-brand/45"
          className="z-[1]"
          style={{ opacity: prefs.thinkingOverlayDotsOpacity }}
        />
      ) : null}
    </div>
  )
}
