"use client"

/**
 * DotPattern — dot grid revealed by a soft drifting "cloud" mask.
 *
 * Inspiration: Google/Apple AI loading states — a diffuse dot field that
 * softly fades in, drifts diagonally across the surface, then fades out.
 * No bright glow cores, no particles — just one or two large soft halos
 * sliding across the grid so the dots appear as an ambient cloud.
 */

import * as React from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

interface DotPatternProps extends React.SVGProps<SVGSVGElement> {
  width?: number
  height?: number
  x?: number
  y?: number
  cx?: number
  cy?: number
  cr?: number
  className?: string
  glow?: boolean
  /** Number of drifting soft clouds (keep small: 1–2). */
  glowCount?: number
  /** Cloud radius — large values produce a wide, diffuse reveal. */
  glowRadius?: number
}

type Cloud = {
  key: number
  xs: string[]
  ys: string[]
  duration: number
  delay: number
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

export function DotPattern({
  width = 14,
  height = 14,
  x = 0,
  y = 0,
  cx = 1,
  cy = 1,
  cr = 0.8,
  className,
  glow = false,
  glowCount = 2,
  glowRadius = 240,
  ...props
}: DotPatternProps) {
  const id = React.useId()
  const maskId = `${id}-mask`
  const gradId = `${id}-grad`

  const clouds = React.useMemo<Cloud[]>(
    () =>
      Array.from({ length: glowCount }).map((_, i) => {
        // Drift diagonally: bottom-right → top-left. Start/end partly off-canvas
        // so the cloud enters and exits softly without a visible edge.
        const startX = rand(85, 120)
        const endX = rand(-20, 15)
        const midX = (startX + endX) / 2 + rand(-6, 6)

        const startY = rand(85, 115)
        const endY = rand(-15, 10)
        const midY = (startY + endY) / 2 + rand(-4, 4)

        const duration = rand(8, 12)
        // Offset clouds by half a cycle so one is arriving as the other leaves.
        const delay = -(i / glowCount) * duration

        return {
          key: i,
          xs: [`${startX}%`, `${midX}%`, `${endX}%`],
          ys: [`${startY}%`, `${midY}%`, `${endY}%`],
          duration,
          delay,
        }
      }),
    [glowCount],
  )

  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full fill-neutral-400/80",
        className,
      )}
      {...props}
    >
      <defs>
        <pattern
          id={id}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          patternContentUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <circle cx={cx} cy={cy} r={cr} />
        </pattern>

        {glow ? (
          <>
            {/* Very soft falloff — no visible ring edge, dots dissolve gradually. */}
            <radialGradient id={gradId}>
              <stop offset="0%"   stopColor="white" stopOpacity="0.9" />
              <stop offset="40%"  stopColor="white" stopOpacity="0.55" />
              <stop offset="75%"  stopColor="white" stopOpacity="0.18" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>

            <mask id={maskId}>
              {clouds.map((c) => (
                <motion.circle
                  key={`cloud-${c.key}`}
                  r={glowRadius}
                  fill={`url(#${gradId})`}
                  initial={{ cx: c.xs[0], cy: c.ys[0], opacity: 0 }}
                  animate={{
                    cx: c.xs,
                    cy: c.ys,
                    // Long hold with soft fade at both ends.
                    opacity: [0, 1, 1, 0],
                  }}
                  transition={{
                    duration: c.duration,
                    delay: c.delay,
                    repeat: Infinity,
                    ease: "linear",
                    times: [0, 0.3, 0.7, 1],
                  }}
                />
              ))}
            </mask>
          </>
        ) : null}
      </defs>

      {/* Dot grid — only visible inside the drifting soft clouds when glow is on. */}
      <rect
        width="100%"
        height="100%"
        strokeWidth={0}
        fill={`url(#${id})`}
        mask={glow ? `url(#${maskId})` : undefined}
      />
    </svg>
  )
}
