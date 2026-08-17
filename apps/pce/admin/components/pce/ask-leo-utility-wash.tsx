"use client"

/**
 * The wash inside the utility bar's Ask Leo chip — the same drifting bar
 * lobes the Leo Assist search bar uses, fitted to the chip. Ported from the
 * DS's `AskLeoLauncherWash` (`apps/web/components/ask-leo-launcher-wash.tsx`),
 * paired with `app/styles/ask-leo-utility-chip.css` (halo/glow/sheen) and
 * `app/styles/leo-blob-animations.css` (the lobes themselves).
 *
 * PCE's `useAskLeo()` doesn't track a `busy` (Leo-is-answering) state or a
 * `previewThinking` settings-panel preview the way the DS's does — both are
 * treated as `false` here rather than faked, so "emphatic" only reacts to
 * arrival (`introActive`) and the panel being open.
 */

import * as React from "react"
import { useReducedMotion } from "motion/react"

import { AnimatedBlobBackground } from "@/components/animated-blob-background"
import { useAskLeo } from "@/components/ask-leo-context"
import { useLeoAmbience } from "@/components/leo-ambience-context"
import { cn } from "@/lib/utils"

export function AskLeoUtilityWash({
  introActive,
  className,
}: {
  /** True while the launcher's arrival is playing. */
  introActive: boolean
  className?: string
}) {
  const { prefs } = useLeoAmbience()
  const { open } = useAskLeo()
  const reduceMotion = useReducedMotion() ?? false

  if (reduceMotion || !prefs.launcherWash) return null

  const emphatic = introActive || open

  const intensity =
    emphatic && prefs.launcherWashIntensity === "high" ? "high" : "normal"

  return (
    <span
      aria-hidden
      data-ask-leo-utility-wash=""
      data-emphatic={emphatic ? "" : undefined}
      style={
        {
          "--ask-leo-chip-blob-scale": prefs.launcherWashStrength,
        } as React.CSSProperties
      }
      className={cn(
        "leo-ai-blob-layer leo-ai-blob-layer--bar",
        "pointer-events-none absolute inset-0 z-0 overflow-hidden",
        className,
      )}
    >
      <AnimatedBlobBackground
        enabled={prefs.thinkingBlob}
        thinking
        intensity={intensity}
        density="bar"
        fit="chip"
        animate={prefs.blobAnimations}
        animationSpeed={prefs.blobAnimationSpeed}
        sheen={prefs.launcherWashSheen && emphatic}
      />
    </span>
  )
}
