"use client"

/**
 * Every Leo surface the app shell mounts, and the rules for which one shows.
 *
 * Leo has grown three shells — the docked panel, the floating window, and the
 * corner FAB — and the choice between them depends on the persisted `dock`
 * preference, whether the window is minimised, the route, and whether the
 * viewport can carry a draggable window at all. That policy used to sit inline
 * in `App.tsx`, which meant the app shell imported four Leo modules and two
 * viewport hooks to answer a question that is entirely Leo's business, and any
 * other host (the generated starter, a consumer app) had to copy the same
 * fifteen lines correctly to get the same behaviour.
 *
 * The shells themselves stay lazy: the panel and the window are only fetched
 * once someone opens Leo, and the FAB is small enough to ship eagerly because
 * it is the thing that opens him. Leo appearance mounts as a **sibling** of
 * Ask Leo (not inside its toolbar tree) so portal pointer events cannot bubble
 * through React and drag both windows together.
 *
 * Window mode must not reflow the hub: it portals as a fixed overlay. Only the
 * docked panel claims flex width and may collapse the primary sidebar. The app
 * row's `data-ask-leo-open` hook follows `useAskLeoDockedPanelOpen`, which lives
 * in `hooks/use-ask-leo-docked-panel-open.ts` so this module can stay a Fast
 * Refresh boundary.
 *
 * @see components/ask-leo-context.tsx — `open`, `dock`, `minimized`
 * @see docs/ask-leo-pattern.md — view modes and their entry points
 */

import * as React from "react"
import { usePathname } from "next/navigation"

import { useAskLeo } from "@/components/ask-leo-context"
import { useLeoAmbience } from "@/components/leo-ambience-context"
import { LeoLauncherFab } from "@/components/leo-launcher-fab"
import { useSecondaryPanel } from "@/components/sidebar/secondary-panel"
import { useSidebar } from "@/components/ui/sidebar"
import { useIsMobile } from "@/hooks/use-mobile"
import { useSidebarReflowZoom } from "@/hooks/use-sidebar-reflow-zoom"
import { isProductsHomePath } from "@/lib/product-home"

const AskLeoSidebar = React.lazy(() =>
  import("@/components/ask-leo-sidebar").then(m => ({
    default: m.AskLeoSidebar,
  })),
)

const AskLeoWindow = React.lazy(() =>
  import("@/components/ask-leo-window").then(m => ({
    default: m.AskLeoWindow,
  })),
)

const LeoAmbienceWindow = React.lazy(() =>
  import("@/components/leo-ambience-window").then(m => ({
    default: m.LeoAmbienceWindow,
  })),
)

/** Collapse the primary nav only while the docked panel claims layout space. */
function AskLeoPrimarySidebarCollapse({ panelOpen }: { panelOpen: boolean }) {
  const { setOpen: setSidebarOpen } = useSidebar()
  const prevOpen = React.useRef(panelOpen)
  React.useEffect(() => {
    if (panelOpen && !prevOpen.current) setSidebarOpen(false)
    if (!panelOpen && prevOpen.current) setSidebarOpen(true)
    prevOpen.current = panelOpen
  }, [panelOpen, setSidebarOpen])
  return null
}

/**
 * One floating layer at a time on mobile / reflow: opening Ask Leo closes the
 * secondary scope sheet. Desktop docked Leo hides secondary in {@link SecondaryPanel}.
 */
function AskLeoSecondaryPanelCollapse({ panelOpen }: { panelOpen: boolean }) {
  const { activePanel, closeSecondaryFlyout, secondaryFlyoutVisible } =
    useSecondaryPanel()
  const isMobile = useIsMobile()
  const reflowZoom = useSidebarReflowZoom()
  const navFlyout = isMobile || reflowZoom
  const prevOpen = React.useRef(panelOpen)

  React.useEffect(() => {
    if (
      panelOpen &&
      !prevOpen.current &&
      navFlyout &&
      activePanel &&
      secondaryFlyoutVisible
    ) {
      closeSecondaryFlyout()
    }
    prevOpen.current = panelOpen
  }, [
    panelOpen,
    activePanel,
    navFlyout,
    secondaryFlyoutVisible,
    closeSecondaryFlyout,
  ])

  return null
}

export function AskLeoShell() {
  const pathname = usePathname()
  const { open, dock, minimized } = useAskLeo()
  const { settingsOpen } = useLeoAmbience()
  const isMobile = useIsMobile()
  const reflowZoom = useSidebarReflowZoom()

  // No floating window on touch or at reflow zoom: dragging a window there
  // fights page scroll, and at that size it would cover the page it is meant to
  // sit beside. Both fall back to the panel, which already has a flyout mode.
  const windowMode = dock === "window" && !isMobile && !reflowZoom
  const dockedPanelOpen = open && !windowMode

  // The products home strips the utility bar's Leo toggle, and a minimised
  // window needs somewhere visible to come back from. One button, two jobs.
  const salesFraming = isProductsHomePath(pathname)
  const showFab = salesFraming || (windowMode && minimized)

  return (
    <>
      <AskLeoPrimarySidebarCollapse panelOpen={dockedPanelOpen} />
      <AskLeoSecondaryPanelCollapse panelOpen={dockedPanelOpen} />
      {open ? (
        <React.Suspense fallback={null}>
          {windowMode ? <AskLeoWindow /> : <AskLeoSidebar />}
        </React.Suspense>
      ) : null}
      {settingsOpen ? (
        <React.Suspense fallback={null}>
          <LeoAmbienceWindow />
        </React.Suspense>
      ) : null}
      {showFab ? <LeoLauncherFab salesFraming={salesFraming} /> : null}
    </>
  )
}
