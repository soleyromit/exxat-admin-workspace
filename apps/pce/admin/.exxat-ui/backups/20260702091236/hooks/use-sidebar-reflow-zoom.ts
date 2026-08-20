"use client"

import * as React from "react"
import { rafThrottle } from "@/lib/raf-throttle"

/**
 * When true, the sidebar should **not** pin utilities + profile to the bottom — the whole
 * rail becomes one scroll surface (WCAG 1.4.10 reflow at high zoom / very short viewports).
 *
 * Uses `visualViewport.scale` where available (pinch / some browser zoom) and falls back to
 * short viewport height.
 */
export function useSidebarReflowZoom(): boolean {
  const [reflow, setReflow] = React.useState(false)

  React.useEffect(() => {
    const vv = window.visualViewport
    // Cache the MediaQueryList — calling `matchMedia` on every compute() is
    // measurable on pinch/zoom where visualViewport scroll fires per frame.
    const mql = window.matchMedia("(max-height: 640px)")

    function compute() {
      const scale = vv?.scale ?? 1
      const short = mql.matches
      const veryShort = window.innerHeight <= 420
      const next = scale >= 1.99 || short || veryShort
      // Avoid unnecessary React re-renders when nothing changed.
      setReflow(prev => (prev === next ? prev : next))
    }

    compute()
    // rAF-coalesce: visualViewport.scroll can fire hundreds of times per second
    // during pinch-zoom — without throttling we trigger setReflow + matchMedia
    // per event. One sample per frame is enough for a layout breakpoint flag.
    const scheduled = rafThrottle(compute)
    vv?.addEventListener("resize", scheduled, { passive: true })
    vv?.addEventListener("scroll", scheduled, { passive: true })
    window.addEventListener("resize", scheduled, { passive: true })
    mql.addEventListener("change", scheduled)
    return () => {
      scheduled.cancel()
      vv?.removeEventListener("resize", scheduled)
      vv?.removeEventListener("scroll", scheduled)
      window.removeEventListener("resize", scheduled)
      mql.removeEventListener("change", scheduled)
    }
  }, [])

  return reflow
}
