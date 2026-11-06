"use client"

/**
 * The page reflows beside the edit panel, so a save can be seen on its row (map tasks E11, E12) [INFER: the map's "Library still visible" read as: the columns the
 * panel changes stay visible]. The panel is the DS FloatingSheetPanel, fixed over the right edge; it reports its width as a CSS variable and the shell's main column
 * (lab-frame.tsx) pads by it, so the path bar, the banner and the one scrollport all narrow together and nothing scrolls sideways. A size chosen in the panel's own menu or
 * by dragging follows through the observer.
 * When the list would still be too narrow the Skills nav folds to its icon strip while the panel is open, and comes back on close, but only as a courtesy: the menu stays the
 * admin's (designer 2026-11-05). A menu the admin folded is never unfolded by closing the panel. Once the admin presses Show labels or Collapse to icons while the panel is open,
 * the fold is theirs: it is not folded again and not restored. Below BESIDE_MIN the panel keeps sitting over the page: beside it there would be no list left, and below 768 it is
 * full width.
 */
import * as React from "react"
import { useSecondaryPanel } from "@exxatdesignux/ui/components/shell"

export const RAIL_INSET_VAR = "--lab-rail-inset"
/** Viewport width from which the page reflows beside the panel. */
const BESIDE_MIN = 1100
/** Main column left beside the panel for the columns that must show: select, name, times, Configuration, Status, actions, plus the page's padding. */
const LIST_MIN = 780
/** The panel's own gap to the window edge (the DS inset) and a gap to the page. */
const GAPS = 16

const beside = () => window.matchMedia(`(min-width: ${BESIDE_MIN}px)`).matches

const subscribe = (cb: () => void) => {
  const mql = window.matchMedia(`(min-width: ${BESIDE_MIN}px)`)
  mql.addEventListener("change", cb)
  return () => mql.removeEventListener("change", cb)
}
/** True when the page sits beside the panel rather than under it. */
export const useBesideWidth = (): boolean => React.useSyncExternalStore(subscribe, beside, () => false)

// ---- The admin's own choice for the Skills menu, kept across panels, pages and reloads (lab-frame.tsx KeepSkillsNavChoice).
const NAV_CHOICE_KEY = "lab-skills-nav-compact"
export const readNavChoice = (): boolean => {
  try { return window.localStorage.getItem(NAV_CHOICE_KEY) === "1" } catch { return false }
}
export const writeNavChoice = (compact: boolean) => {
  try { if (compact) window.localStorage.setItem(NAV_CHOICE_KEY, "1"); else window.localStorage.removeItem(NAV_CHOICE_KEY) } catch { /* private window: the choice lasts this page */ }
}
/** The change the panel itself is about to make to the menu, so it is not taken for the admin's choice. */
let forcedNav: boolean | null = null
/** True when this change to the menu was the panel's own. */
export const takeForcedNavChange = (compact: boolean): boolean => {
  const forced = forcedNav === compact
  if (forced) forcedNav = null
  return forced
}

/** A page's shell starts with nothing pending: an unfold the last page's panel announced on its way out never landed. */
export const clearForcedNavChange = () => { forcedNav = null }

/**
 * After the frame in hand has painted. The reflow beside the panel is a layout of the whole list, 200 to 500 ms on the dev server and still several frames on a build. Done in the press's own task it
 * held back the first frame of the panel's slide (rework, E31); after that frame the slide runs on the compositor and the reflow cannot stop it. Returns the cancel.
 */
export function afterPaint(fn: () => void): () => void {
  let timer = 0
  const frame = requestAnimationFrame(() => { timer = window.setTimeout(fn, 0) })
  return () => { cancelAnimationFrame(frame); window.clearTimeout(timer) }
}

export function useBesidePanel(open: boolean) {
  const { activePanel, secondaryPanelCompact, collapseActiveSecondaryPanel, openPanel } = useSecondaryPanel()
  const latest = React.useRef({ activePanel, secondaryPanelCompact, collapseActiveSecondaryPanel, openPanel })
  latest.current = { activePanel, secondaryPanelCompact, collapseActiveSecondaryPanel, openPanel }
  /** This panel folded the menu and the admin has not touched it since. */
  const folded = React.useRef(false)
  /** The admin changed the menu while this panel was open: hands off until it closes. */
  const handsOff = React.useRef(false)

  // The admin expanded what the panel folded (Show labels). What the panel itself changes is announced first and never lands here as expanded while folded.
  React.useEffect(() => {
    if (open && folded.current && !secondaryPanelCompact && forcedNav !== true) {
      folded.current = false
      handsOff.current = true
    }
  }, [open, secondaryPanelCompact])

  React.useEffect(() => {
    if (!open) return
    const root = document.documentElement
    let frame = 0
    let observer: ResizeObserver | null = null
    const place = () => {
      const panel = document.querySelector<HTMLElement>('[data-slot="lab-skill-detail"]')
      if (!panel) { frame = requestAnimationFrame(place); return }
      if (!observer) { observer = new ResizeObserver(place); observer.observe(panel) }
      if (!beside()) { root.style.removeProperty(RAIL_INSET_VAR); return }
      // offsetWidth: the panel slides in, so its rect is still moving on the first read.
      const inset = panel.offsetWidth + GAPS
      root.style.setProperty(RAIL_INSET_VAR, `${inset}px`)
      const main = document.querySelector("[data-page-scroll]")?.parentElement
      const { activePanel: nav, secondaryPanelCompact: compact, collapseActiveSecondaryPanel: fold } = latest.current
      if (main && nav && !compact && !folded.current && !handsOff.current && main.getBoundingClientRect().width - inset < LIST_MIN) {
        folded.current = true
        forcedNav = true
        fold()
      }
    }
    const cancelFirst = afterPaint(place)
    window.addEventListener("resize", place)
    return () => {
      cancelFirst()
      cancelAnimationFrame(frame)
      observer?.disconnect()
      window.removeEventListener("resize", place)
      handsOff.current = false
      const refold = folded.current
      folded.current = false
      afterPaint(() => {
        // The next panel may already sit beside the page: its own width stands.
        if (!document.querySelector('[data-slot="lab-skill-detail"]:not([data-state=closed])')) root.style.removeProperty(RAIL_INSET_VAR)
        if (!refold) return
        const { activePanel: nav, openPanel: unfold } = latest.current
        if (nav) { forcedNav = false; unfold(nav) }
      })
    }
  }, [open])
}
