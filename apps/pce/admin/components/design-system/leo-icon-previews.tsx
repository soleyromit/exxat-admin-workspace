"use client"

/**
 * Leo animation catalog — every motion Leo has, running side by side.
 *
 * Everything here plays on its own. A catalog that needs to be clicked before
 * it shows anything is a list of names, not a catalog.
 */

import * as React from "react"

import { LeoIcon, type LeoIconMotionState } from "@/components/ui/leo-icon"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface LeoAnimation {
  id: string
  name: string
  state: LeoIconMotionState
  /** One-shots hold their final frame, so the catalog remounts them to replay. */
  loops: boolean
  what: string
  when: string
}

const LEO_ANIMATIONS: readonly LeoAnimation[] = [
  {
    id: "rest",
    name: "Rest",
    state: "rest",
    loops: true,
    what: "Still.",
    when: "Default. Chrome does not loop unprompted.",
  },
  {
    id: "invited",
    name: "Invited",
    state: "invited",
    loops: false,
    what: "One-shot lift as the sparkles open outward.",
    when: "Hover or focus on a control that hands the surface to Leo.",
  },
  {
    id: "working",
    name: "Working",
    state: "working",
    loops: true,
    what: "Quarter-turn in the picture plane under a travelling sparkle wave.",
    when: "Any run in flight. It reads the same at every size, so it is safe inside a control.",
  },
  {
    id: "answered",
    name: "Answered",
    state: "answered",
    loops: false,
    what: "One-shot settle as the sparkles draw back in.",
    when: "The beat after Leo finishes. Return to rest once it has played.",
  },
]

/** Replays every one-shot on a shared clock so the catalog is never frozen. */
function useReplayTick(ms: number) {
  const [tick, setTick] = React.useState(0)
  React.useEffect(() => {
    const id = window.setInterval(() => setTick(n => n + 1), ms)
    return () => window.clearInterval(id)
  }, [ms])
  return tick
}

function AnimationCard({
  animation,
  tick,
}: {
  animation: LeoAnimation
  tick: number
}) {
  // Remounting is what replays a one-shot: a fresh mount starts at `initial`
  // and animates into the state.
  const runKey = animation.loops ? animation.id : `${animation.id}-${tick}`

  return (
    <li className="flex list-none gap-3 rounded-xl border border-border/80 bg-card/40 p-3">
      <span className="inline-flex size-10 shrink-0 items-center justify-center [--leo-icon-fill:var(--brand-color)]">
        <LeoIcon
          key={runKey}
          variant="ambient"
          size="lg"
          state={animation.state}
        />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium">{animation.name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{animation.what}</p>
        <p className="mt-1 text-xs text-muted-foreground">{animation.when}</p>
      </div>
    </li>
  )
}

export function LeoAnimationCatalogPreview() {
  const tick = useReplayTick(2600)

  return (
    <ul className="m-0 grid gap-2 p-0 sm:grid-cols-2">
      {LEO_ANIMATIONS.map(animation => (
        <AnimationCard key={animation.id} animation={animation} tick={tick} />
      ))}
    </ul>
  )
}

/** The working loop at every size, so it can be judged where it will be used. */
export function LeoWorkingMotionPreview() {
  return (
    <Card className="flex-row flex-wrap items-center gap-8 p-6">
      {(["xl", "lg", "md", "xs"] as const).map(size => (
        <span
          key={size}
          className={cn(
            "inline-flex items-center justify-center",
            "[--leo-icon-fill:var(--brand-color)]",
          )}
        >
          <LeoIcon variant="ambient" size={size} state="working" />
        </span>
      ))}
      <p className="text-sm text-muted-foreground">
        One loop at every size. The turn stays in the picture plane, so a 20px
        mark in a button says the same thing as an 80px one on a hero.
      </p>
    </Card>
  )
}
