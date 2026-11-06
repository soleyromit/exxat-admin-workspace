"use client"

/**
 * One result at a time, in view wherever the admin is (map section E rule 10). The shell keeps one slot between its bars and the scrolling area;
 * every surface hands its result to `ResultBanner`, which renders in that slot. The slot is in flow and outside the scrollport, so the banner covers
 * nothing: the scroll area gets shorter while it shows, and the scroll position does not change. It stays until dismissed or replaced by the next
 * result. "{Object} {past verb}." with at most one action: the next job or undo. Pressing it does not dismiss an open panel.
 */
import * as React from "react"
import { createPortal } from "react-dom"
import { railTriggerProps } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { LabLocalBanner as LocalBanner } from "@/components/lab/lab-bar/lab-banner"
import { isRestoringScroll } from "@/lib/lab/configure-origin"

export interface ResultBannerValue {
  variant: "success" | "info" | "warning" | "promo"
  title: string
  body?: React.ReactNode
  action?: { label: string; href?: string; onClick?: () => void }
  /** Only where a result has both a next job and a way to see what it did (Add several on a program with no settings). */
  secondaryAction?: { label: string; href?: string; onClick?: () => void }
}

const SLOT = "data-result-slot"
/** Below this the panel fills the screen: there is no visible area left to fit the banner into. */
const MIN_BANNER_WIDTH = 280
/** The side panels sit against the right edge of the window, inset by a few pixels. A centred dialog does not. */
const RIGHT_EDGE = 24
const PANEL_GAP = 16

/** How much of the slot an open side panel covers, in pixels. */
function panelOverlap(slot: HTMLElement): number {
  const box = slot.getBoundingClientRect()
  let overlap = 0
  for (const el of document.querySelectorAll<HTMLElement>('[role="dialog"]')) {
    const r = el.getBoundingClientRect()
    if (r.right < window.innerWidth - RIGHT_EDGE || r.left <= box.left) continue
    overlap = Math.max(overlap, box.right - r.left)
  }
  if (overlap <= 0) return 0
  return box.width - overlap - PANEL_GAP < MIN_BANNER_WIDTH ? 0 : overlap + PANEL_GAP
}

/** A side panel leaves the page's slot less room than a banner needs: full width on a phone, and most of the page up to about 830 px. */
function panelCoversPage(panel: Element): boolean {
  const slot = document.querySelector(`[${SLOT}]`)
  if (!slot) return false
  return panel.getBoundingClientRect().left - slot.getBoundingClientRect().left - PANEL_GAP < MIN_BANNER_WIDTH
}

const panelSlots = new Set<HTMLElement>()
const panelSlotListeners = new Set<() => void>()
const coveredSlot = (): HTMLElement | null => [...panelSlots].find((el) => el.closest('[role="dialog"]') && panelCoversPage(el.closest('[role="dialog"]')!)) ?? null
const anyPanelSlot = (): HTMLElement | null => [...panelSlots][0] ?? null
const subscribePanelSlot = (cb: () => void) => { panelSlotListeners.add(cb); return () => { panelSlotListeners.delete(cb) } }

/**
 * Where the result shows while a side panel covers the page (map section E rule 10): one slot in the panel, above its scrolling body, so a save has a visible result wherever the
 * form was scrolled. Still the one banner: `ResultBanner` renders here instead of the page's slot, never in both. Empty, it takes no room.
 */
export function PanelResultSlot() {
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const say = () => panelSlotListeners.forEach((cb) => cb())
    panelSlots.add(el)
    say()
    // The panel slides in and can be resized, so its edge is known only as it moves.
    const panel = el.closest('[role="dialog"]')
    const sized = panel ? new ResizeObserver(say) : null
    if (panel) sized!.observe(panel)
    document.addEventListener("animationend", say, true)
    window.addEventListener("resize", say)
    return () => {
      panelSlots.delete(el)
      sized?.disconnect()
      document.removeEventListener("animationend", say, true)
      window.removeEventListener("resize", say)
      say()
    }
  }, [])
  return <div ref={ref} data-panel-result-slot="" className="shrink-0 px-4 pb-2 empty:hidden" />
}

/** The one place results show. Rendered once by the shell, directly above the scrollport, in every shell frame. */
export function ResultBannerSlot() {
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const slot = ref.current
    if (!slot) return
    const fit = () => {
      if (!slot.firstChild) return
      const overlap = panelOverlap(slot)
      slot.style.paddingRight = overlap > 0 ? `${overlap}px` : ""
    }
    // The DS table's fixed head reads the scrollport's top, but only on a scroll or a resize. The slot moves that top without either, so say so.
    let height = slot.offsetHeight
    const sized = new ResizeObserver(() => {
      if (slot.offsetHeight !== height) {
        height = slot.offsetHeight
        window.dispatchEvent(new Event("resize"))
        // The head's group row is measured on a scroll, against the head's own position, and the head moves on the frame after the resize. Read before that, the row it names, and how far
        // the next group has pushed it, are stale: a group row clipped under the bar.
        requestAnimationFrame(() => requestAnimationFrame(() => document.querySelector("[data-page-scroll]")?.dispatchEvent(new Event("scroll"))))
      }
      fit()
    })
    sized.observe(slot)
    const panels = new MutationObserver(fit)
    panels.observe(document.body, { childList: true })
    const inSlot = new MutationObserver(fit)
    inSlot.observe(slot, { childList: true })
    // A panel slides in and out, so its final edge is known only when that ends.
    document.addEventListener("animationend", fit, true)
    document.addEventListener("transitionend", fit, true)
    window.addEventListener("resize", fit)
    return () => {
      sized.disconnect()
      panels.disconnect()
      inSlot.disconnect()
      document.removeEventListener("animationend", fit, true)
      document.removeEventListener("transitionend", fit, true)
      window.removeEventListener("resize", fit)
    }
  }, [])
  return <div ref={ref} {...{ [SLOT]: "" }} className="shrink-0 px-4 py-2 empty:hidden md:px-6" />
}

const ignoreRepeatPress = (e: React.MouseEvent) => {
  if (e.detail < 2) return
  e.stopPropagation()
  e.preventDefault()
}

/** The page's title is on screen: a banner can sit under it and be seen. */
function titleInView(): boolean {
  const port = document.querySelector("[data-page-scroll]")
  const title = port?.querySelector("h1")
  // Back from a configure page: the scroll is about to leave the title behind, and the banner must stay on screen (map D1c).
  if (isRestoringScroll()) return false
  return !!port && !!title && title.getBoundingClientRect().bottom > port.getBoundingClientRect().top
}

export function ResultBanner({ banner, onDismiss, pageOnly, inPanel, underTitle }: {
  banner: ResultBannerValue | null
  onDismiss: () => void
  /** A standing warning about the page, not the result of something just done: it waits there. */
  pageOnly?: boolean
  /** In the open panel at every width, not only when it covers the page: the panel loops Tab, so an Undo on the page could not be reached by keyboard. */
  inPanel?: boolean
  /** A place under the page's title (map D1), used while the title is on screen when the banner arrives. Once the title has scrolled away the shell's slot is the place in view, as rule E10 asks. */
  underTitle?: HTMLElement | null
}) {
  const [pageSlot, setSlot] = React.useState<Element | null>(null)
  React.useEffect(() => setSlot(document.querySelector(`[${SLOT}]`)), [])
  const covered = React.useSyncExternalStore(subscribePanelSlot, coveredSlot, () => null)
  const open = React.useSyncExternalStore(subscribePanelSlot, anyPanelSlot, () => null)
  // Decided once per banner: a banner does not jump between places as the page scrolls.
  const placed = React.useRef<{ title: string | undefined; under: boolean }>({ title: undefined, under: false })
  if (banner && placed.current.title !== banner.title && underTitle) placed.current = { title: banner.title, under: titleInView() }
  const slot = (pageOnly ? null : inPanel ? open : covered) ?? (underTitle && placed.current.under ? underTitle : pageSlot)
  if (!banner || !slot) return null
  return createPortal(
    // The live region is the DS banner's own (a result is polite, a warning assertive). A long unbroken name wraps rather than running under Dismiss. The banner appears
    // above the page, so it can arrive under the pointer of a double click: the second press belongs to whatever the first one was on, not to Dismiss.
    <div data-region="banner" className="[overflow-wrap:anywhere]" onClickCapture={ignoreRepeatPress} {...railTriggerProps()}>
      <LocalBanner variant={banner.variant} title={banner.body ? banner.title : undefined} dismissible onDismiss={onDismiss} action={banner.action} secondaryAction={banner.secondaryAction}>
        {banner.body || banner.title}
      </LocalBanner>
    </div>,
    slot,
  )
}
