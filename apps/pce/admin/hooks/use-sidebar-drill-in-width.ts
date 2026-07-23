"use client"

import * as React from "react"

import { usePersistedState } from "@exxatdesignux/ui/lib/persisted-state"

export const SIDEBAR_DRILL_IN_WIDTH_KEY = "shell:sidebar-drill-in-width"
export const SIDEBAR_DRILL_IN_WIDTH_DEFAULT = 280
export const SIDEBAR_DRILL_IN_WIDTH_MIN = 216
export const SIDEBAR_DRILL_IN_WIDTH_MAX = 400

/** Must match `SidebarShell` / `SidebarProvider` default rail width. */
export const SIDEBAR_WIDTH_DEFAULT = "16rem"

function clampSidebarDrillInWidth(width: number) {
  return Math.min(SIDEBAR_DRILL_IN_WIDTH_MAX, Math.max(SIDEBAR_DRILL_IN_WIDTH_MIN, width))
}

/** Widen `--sidebar-width` while a SidebarDrillIn section is open (design system, tokens, …). */
export function useSidebarDrillInWidth(enabled: boolean) {
  const [width, setWidth] = usePersistedState(
    SIDEBAR_DRILL_IN_WIDTH_KEY,
    SIDEBAR_DRILL_IN_WIDTH_DEFAULT,
  )
  const widthRef = React.useRef(width)
  widthRef.current = width

  React.useEffect(() => {
    const wrapper = document.querySelector<HTMLElement>('[data-slot="sidebar-wrapper"]')
    if (!wrapper) return

    if (!enabled) {
      // Never `removeProperty` — that strips React's inline `--sidebar-width` and
      // collapses the sidebar gap to 0px (fixed rail paints over main content).
      wrapper.style.setProperty("--sidebar-width", SIDEBAR_WIDTH_DEFAULT)
      wrapper.removeAttribute("data-drill-in-open")
      return
    }

    wrapper.setAttribute("data-drill-in-open", "true")
    wrapper.style.setProperty(
      "--sidebar-width",
      `${clampSidebarDrillInWidth(width)}px`,
    )

    return () => {
      wrapper.style.setProperty("--sidebar-width", SIDEBAR_WIDTH_DEFAULT)
      wrapper.removeAttribute("data-drill-in-open")
    }
  }, [enabled, width])

  const setClampedWidth = React.useCallback(
    (next: number) => {
      setWidth(clampSidebarDrillInWidth(next))
    },
    [setWidth],
  )

  const resizeByDelta = React.useCallback(
    (deltaPx: number) => {
      setClampedWidth(widthRef.current + deltaPx)
    },
    [setClampedWidth],
  )

  return {
    width: clampSidebarDrillInWidth(width),
    setWidth: setClampedWidth,
    resizeByDelta,
  }
}
