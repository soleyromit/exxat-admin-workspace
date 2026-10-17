"use client"

/**
 * SecondaryPanel — nested rail between the primary icon sidebar and content.
 * Full width shows hub scope nav; **compact** matches the primary sidebar icon rail (`w-12`).
 *
 * Chrome uses {@link NestedSecondaryPanelShell}. Library body stays in
 * `library-secondary-nav.tsx` (domain-specific), not duplicated here.
 */

import * as React from "react"
import { useLocation } from "react-router-dom"
import { useRegisterNavFlyoutToggle, useSidebar } from "@/components/ui/sidebar"
import { Tip } from "@/components/ui/tip"
import { Button } from "@/components/ui/button"
import { LibrarySecondaryNav } from "@/components/library-secondary-nav"
import { LearningActivitiesSecondaryNav } from "@/components/learning-activities-secondary-nav"
import { NestedSecondaryPanelShell } from "@/components/templates/nested-secondary-panel-shell"
import { NAV_FLYOUT_SCROLL_BODY } from "@exxatdesignux/ui/lib/nav-flyout-inset"
import { Shortcut } from "@/components/ui/dropdown-menu"
import { useIsMobile } from "@/hooks/use-mobile"
import { useSidebarReflowZoom } from "@/hooks/use-sidebar-reflow-zoom"
import {
  isLibrarySecondaryPanelRoute,
  isLibrarySecondaryPanelVisible,
  shouldLibrarySecondaryPanelBeOpen,
} from "@/lib/library-nav"
import {
  isLearningActivitiesSecondaryPanelRoute,
  isLearningActivitiesSecondaryPanelVisible,
  shouldLearningActivitiesSecondaryPanelBeOpen,
} from "@/lib/learning-activities-nav"
import { isSidebarHiddenPath } from "@/lib/focus-workflow"
import { cn } from "@/lib/utils"
import type { LibraryItem } from "@/lib/mock/library"
import type { LibraryFolder } from "@/lib/mock/library-folders"

export type LibraryFolderBridge = {
  folders: LibraryFolder[]
  onFoldersChange: React.Dispatch<React.SetStateAction<LibraryFolder[]>>
  items: LibraryItem[]
  onItemsChange: React.Dispatch<React.SetStateAction<LibraryItem[]>>
}

export type LibraryAccessBridge = {
  openManageAccess: () => void
}

export type LearningActivitiesFolderBridge = {
  folders: LibraryFolder[]
  onFoldersChange: React.Dispatch<React.SetStateAction<LibraryFolder[]>>
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

export type ClosePanelOptions = {
  /**
   * Main app sidebar after the secondary panel closes.
   * - `restore` (default): snap back to the user's saved preference
   *   (`sidebar_state_v2` cookie, or `defaultOpen` if unset). Use this when
   *   leaving a page whose secondary panel caused an incidental collapse — the
   *   rail returns to the state the user explicitly set elsewhere via ⌘B / the
   *   sidebar button.
   * - `leave`: only clear the active panel — keep the rail in whatever state it
   *   was in (rare; prefer `restore`).
   * - `expand`: force the full primary rail open. Use only when the product
   *   explicitly wants the wide rail after dismiss.
   * - `collapse`: keep the icon rail. Use when the next route also wants compact.
   */
  mainSidebar?: "restore" | "expand" | "collapse" | "leave"
}

export type OpenPanelOptions = {
  /** Icon-only nested rail — used on focus shells (`/library/new`) so scope nav stays compact. */
  compact?: boolean
}

interface SecondaryPanelContextValue {
  /** Currently active panel id, or null if none */
  activePanel: string | null
  /**
   * Focus shell (`NewFocusTemplate`) with nested library scope nav — primary
   * sidebar is hidden; secondary stays on the compact icon rail.
   */
  focusShellSupersedesPrimarySidebar: boolean
  /** Open a panel by id. Pass `{ compact: true }` to keep the icon rail. */
  openPanel: (id: string, opts?: OpenPanelOptions) => void
  /** Close the panel (programmatic / route cleanup). */
  closePanel: (opts?: ClosePanelOptions) => void
  /** Icon-only nested rail while the panel stays “open”. Cleared by {@link openPanel} / {@link closePanel}. */
  secondaryPanelCompact: boolean
  /** Narrow icon rail (primary-sidebar-style); keeps {@link activePanel} mounted. */
  collapseActiveSecondaryPanel: () => void
  /** Library folder tree shared with the secondary nav while the hub is mounted. */
  libraryFolderBridge: LibraryFolderBridge | null
  setLibraryFolderBridge: (bridge: LibraryFolderBridge | null) => void
  /** Opens the hub collaborators sheet from the secondary nav. */
  libraryAccessBridge: LibraryAccessBridge | null
  setLibraryAccessBridge: (bridge: LibraryAccessBridge | null) => void
  /** Learning activities group tree shared with the secondary nav while the hub is mounted. */
  learningActivitiesFolderBridge: LearningActivitiesFolderBridge | null
  setLearningActivitiesFolderBridge: (bridge: LearningActivitiesFolderBridge | null) => void
  /**
   * Flyout stack (mobile / ≥200% zoom): temporarily hide the secondary overlay
   * so the primary sidebar underneath is reachable. Cleared by {@link openPanel}.
   */
  secondaryFlyoutHidden: boolean
  hideSecondaryFlyout: () => void
  showSecondaryFlyout: () => void
  /** Flyout sheet visible (mobile / high zoom). False when user closed the sheet but stayed on the hub. */
  secondaryFlyoutVisible: boolean
  /** Hide the scope sheet only — keeps {@link activePanel} for `/library/all`. */
  closeSecondaryFlyout: () => void
}

const SecondaryPanelContext = React.createContext<SecondaryPanelContextValue>({
  activePanel: null,
  focusShellSupersedesPrimarySidebar: false,
  openPanel: () => {},
  closePanel: () => {},
  secondaryPanelCompact: false,
  collapseActiveSecondaryPanel: () => {},
  libraryFolderBridge: null,
  setLibraryFolderBridge: () => {},
  libraryAccessBridge: null,
  setLibraryAccessBridge: () => {},
  learningActivitiesFolderBridge: null,
  setLearningActivitiesFolderBridge: () => {},
  secondaryFlyoutHidden: false,
  hideSecondaryFlyout: () => {},
  showSecondaryFlyout: () => {},
  secondaryFlyoutVisible: true,
  closeSecondaryFlyout: () => {},
})

export function useSecondaryPanel() {
  return React.useContext(SecondaryPanelContext)
}

export function SecondaryPanelProvider({ children }: { children: React.ReactNode }) {
  const [activePanel, setActivePanel] = React.useState<string | null>(null)
  const [secondaryPanelCompact, setSecondaryPanelCompact] = React.useState(false)
  const [libraryFolderBridge, setLibraryFolderBridge] =
    React.useState<LibraryFolderBridge | null>(null)
  const [libraryAccessBridge, setLibraryAccessBridge] =
    React.useState<LibraryAccessBridge | null>(null)
  const [learningActivitiesFolderBridge, setLearningActivitiesFolderBridge] =
    React.useState<LearningActivitiesFolderBridge | null>(null)
  const [secondaryFlyoutHidden, setSecondaryFlyoutHidden] = React.useState(false)
  const [secondaryFlyoutVisible, setSecondaryFlyoutVisible] = React.useState(true)
  const { pathname } = useLocation()
  const isMobile = useIsMobile()
  const reflowZoom = useSidebarReflowZoom()
  const navFlyout = isMobile || reflowZoom
  const librarySecondaryPanelRoute = isLibrarySecondaryPanelRoute(pathname)
  const learningActivitiesSecondaryPanelRoute = isLearningActivitiesSecondaryPanelRoute(pathname)
  const { setOpen, restoreSavedOpen, open: mainSidebarOpen } = useSidebar()

  /**
   * Browser zoom ≥ 200% (or very short viewport) — same `useSidebarReflowZoom`
   * signal the primary sidebar uses (WCAG 1.4.10). At that scale the nested
   * rail must **not** stay pinned as an icon strip beside content. Hide it
   * until the user opens Back / Main menu (one flyout layer at a time).
   */
  const wasReflowZoomRef = React.useRef(false)
  React.useEffect(() => {
    if (reflowZoom && !wasReflowZoomRef.current && activePanel) {
      setOpen(false, { persist: false })
    }
    wasReflowZoomRef.current = reflowZoom
  }, [reflowZoom, activePanel, setOpen])

  /** Icon-only compact rail is desktop-only — flyout sheets always show labels. */
  React.useEffect(() => {
    if (navFlyout && secondaryPanelCompact) {
      setSecondaryPanelCompact(false)
    }
  }, [navFlyout, secondaryPanelCompact])

  const hideSecondaryFlyout = React.useCallback(() => {
    setSecondaryFlyoutHidden(true)
    setOpen(true, { persist: false })
  }, [setOpen])

  const showSecondaryFlyout = React.useCallback(() => {
    setSecondaryFlyoutHidden(false)
    setSecondaryPanelCompact(false)
    setOpen(false, { persist: false })
  }, [setOpen])

  /** Scope sheet visible → keep primary flyout closed (not stacked). */
  React.useEffect(() => {
    if (!navFlyout || !activePanel || secondaryFlyoutHidden || !secondaryFlyoutVisible) {
      return
    }
    setOpen(false, { persist: false })
  }, [navFlyout, activePanel, secondaryFlyoutHidden, secondaryFlyoutVisible, setOpen])

  const closeSecondaryFlyout = React.useCallback(() => {
    setSecondaryPanelCompact(false)
    setSecondaryFlyoutHidden(false)
    setSecondaryFlyoutVisible(false)
    setOpen(false, { persist: false })
  }, [setOpen])

  const openPanel = React.useCallback(
    (id: string, opts?: OpenPanelOptions) => {
      setSecondaryPanelCompact(opts?.compact ?? false)
      setSecondaryFlyoutHidden(false)
      setSecondaryFlyoutVisible(true)
      setActivePanel(id)
      setOpen(false, { persist: false })
    },
    [setOpen],
  )

  const closePanel = React.useCallback((opts?: ClosePanelOptions) => {
    setSecondaryPanelCompact(false)
    setSecondaryFlyoutHidden(false)
    setSecondaryFlyoutVisible(true)
    setActivePanel(null)
    const mainSidebar = opts?.mainSidebar ?? "restore"
    if (mainSidebar === "leave") return
    if (mainSidebar === "restore") {
      restoreSavedOpen()
      return
    }
    if (mainSidebar === "collapse") {
      setOpen(false, { persist: false })
      return
    }
    setOpen(true, { persist: false })
  }, [restoreSavedOpen, setOpen])

  /** URL is source of truth for nested scope rails (avoids empty shell / stuck panel races). */
  React.useEffect(() => {
    if (isSidebarHiddenPath(pathname)) {
      if (activePanel) {
        closePanel({ mainSidebar: "leave" })
      }
      return
    }
    if (shouldLibrarySecondaryPanelBeOpen(pathname)) {
      if (activePanel !== "library") {
        openPanel("library")
      }
      return
    }
    if (shouldLearningActivitiesSecondaryPanelBeOpen(pathname)) {
      if (activePanel !== "learning-activities") {
        openPanel("learning-activities")
      }
      return
    }
    if (activePanel === "library" || activePanel === "learning-activities") {
      closePanel({ mainSidebar: "leave" })
    }
  }, [pathname, activePanel, openPanel, closePanel])

  const handleSecondaryNavFlyoutToggle = React.useCallback((): boolean => {
    if (!navFlyout) return false

    if (librarySecondaryPanelRoute && activePanel !== "library") {
      openPanel("library")
      return true
    }

    if (learningActivitiesSecondaryPanelRoute && activePanel !== "learning-activities") {
      openPanel("learning-activities")
      return true
    }

    if (activePanel !== "library" && activePanel !== "learning-activities") return false

    if (secondaryFlyoutHidden) {
      if (mainSidebarOpen) {
        setOpen(false, { persist: false })
      } else {
        showSecondaryFlyout()
      }
      return true
    }

    if (secondaryFlyoutVisible) {
      closeSecondaryFlyout()
    } else {
      setSecondaryPanelCompact(false)
      setSecondaryFlyoutVisible(true)
      setOpen(false, { persist: false })
    }
    return true
  }, [
    navFlyout,
    librarySecondaryPanelRoute,
    learningActivitiesSecondaryPanelRoute,
    activePanel,
    secondaryFlyoutHidden,
    secondaryFlyoutVisible,
    mainSidebarOpen,
    showSecondaryFlyout,
    closeSecondaryFlyout,
    openPanel,
    setOpen,
  ])

  useRegisterNavFlyoutToggle(handleSecondaryNavFlyoutToggle)

  const collapseActiveSecondaryPanel = React.useCallback(() => {
    setSecondaryPanelCompact(true)
  }, [])

  /**
   * Desktop: when the user expands the primary sidebar (⌘B) while a scope rail
   * is open, collapse the secondary panel to its icon strip so both rails are
   * not fighting for width. Expanding labels via « still collapses primary
   * (`openPanel`).
   */
  React.useEffect(() => {
    if (navFlyout || !activePanel || !mainSidebarOpen || secondaryPanelCompact) {
      return
    }
    setSecondaryPanelCompact(true)
  }, [navFlyout, activePanel, mainSidebarOpen, secondaryPanelCompact])

  const focusShellSupersedesPrimarySidebar = isSidebarHiddenPath(pathname)

  const value = React.useMemo(
    () => ({
      activePanel,
      focusShellSupersedesPrimarySidebar,
      openPanel,
      closePanel,
      secondaryPanelCompact,
      collapseActiveSecondaryPanel,
      libraryFolderBridge,
      setLibraryFolderBridge,
      libraryAccessBridge,
      setLibraryAccessBridge,
      learningActivitiesFolderBridge,
      setLearningActivitiesFolderBridge,
      secondaryFlyoutHidden,
      hideSecondaryFlyout,
      showSecondaryFlyout,
      secondaryFlyoutVisible,
      closeSecondaryFlyout,
    }),
    [
      activePanel,
      focusShellSupersedesPrimarySidebar,
      openPanel,
      closePanel,
      secondaryPanelCompact,
      collapseActiveSecondaryPanel,
      libraryFolderBridge,
      libraryAccessBridge,
      learningActivitiesFolderBridge,
      secondaryFlyoutHidden,
      hideSecondaryFlyout,
      showSecondaryFlyout,
      secondaryFlyoutVisible,
      closeSecondaryFlyout,
    ],
  )

  return (
    <SecondaryPanelContext.Provider value={value}>
      {children}
    </SecondaryPanelContext.Provider>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SecondaryPanel — the actual rendered panel
// ─────────────────────────────────────────────────────────────────────────────

function SecondaryPanelFlyoutHeader({
  title,
  flyout,
}: {
  title: string
  flyout: boolean
}) {
  const { collapseActiveSecondaryPanel, closeSecondaryFlyout, hideSecondaryFlyout } =
    useSecondaryPanel()

  return (
    <div
      className={cn(
        flyout
          ? "flex shrink-0 flex-col gap-1 border-b border-sidebar-border px-2 pb-2 pt-1.5"
          : "flex h-(--header-height) shrink-0 items-center justify-between gap-2 px-3",
      )}
    >
      {flyout ? (
        <Button
          type="button"
          variant="ghost"
          className="h-8 w-full justify-start gap-2 px-2 text-sidebar-foreground"
          onClick={hideSecondaryFlyout}
          aria-label="Main menu"
        >
          <span className="flex size-4 shrink-0 items-center justify-center" aria-hidden="true">
            <i className="fa-light fa-arrow-left" aria-hidden="true" />
          </span>
          <span className="text-sm font-medium">Main menu</span>
        </Button>
      ) : null}
      {flyout ? (
        <div className="flex items-center justify-between gap-2 px-2">
          <h2 className="m-0 min-w-0 truncate text-xl font-semibold leading-none text-sidebar-foreground font-heading">
            {title}
          </h2>
          <Tip label="Close navigation" side="bottom">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => closeSecondaryFlyout()}
              aria-label="Close navigation"
            >
              <i className="fa-light fa-xmark" aria-hidden="true" />
            </Button>
          </Tip>
        </div>
      ) : (
        <>
          <h2 className="m-0 min-w-0 flex-1 truncate text-xl font-semibold leading-none text-sidebar-foreground font-heading">
            {title}
          </h2>
          <Tip label="Collapse to icons" side="bottom">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => collapseActiveSecondaryPanel()}
              aria-label="Collapse to icons"
            >
              <i className="fa-light fa-angles-left" aria-hidden="true" />
            </Button>
          </Tip>
        </>
      )}
    </div>
  )
}

function LibraryPanel() {
  const { secondaryPanelCompact } = useSecondaryPanel()
  const isMobile = useIsMobile()
  const reflowZoom = useSidebarReflowZoom()
  const navFlyout = isMobile || reflowZoom
  const showCompactRail = secondaryPanelCompact && !navFlyout

  if (showCompactRail) {
    return <LibrarySecondaryNav />
  }

  return (
    <>
      <SecondaryPanelFlyoutHeader title="Library" flyout={navFlyout} />
      <div className={NAV_FLYOUT_SCROLL_BODY}>
        <LibrarySecondaryNav />
      </div>
    </>
  )
}

function LearningActivitiesPanelShell() {
  const { secondaryPanelCompact } = useSecondaryPanel()
  const isMobile = useIsMobile()
  const reflowZoom = useSidebarReflowZoom()
  const navFlyout = isMobile || reflowZoom
  const showCompactRail = secondaryPanelCompact && !navFlyout

  if (showCompactRail) {
    return <LearningActivitiesSecondaryNav />
  }

  return (
    <>
      <SecondaryPanelFlyoutHeader title="Learning activities" flyout={navFlyout} />
      <div className={NAV_FLYOUT_SCROLL_BODY}>
        <LearningActivitiesSecondaryNav />
      </div>
    </>
  )
}

/** Register panel components by id when a route opts into `secondaryPanel` in nav. */
const PANELS: Record<string, React.FC> = {
  "library": LibraryPanel,
  "learning-activities": LearningActivitiesPanelShell,
}

export function SecondaryPanel() {
  const { pathname } = useLocation()
  const {
    activePanel,
    secondaryPanelCompact,
    secondaryFlyoutHidden,
    secondaryFlyoutVisible,
    closeSecondaryFlyout,
  } = useSecondaryPanel()
  const isMobile = useIsMobile()
  const reflowZoom = useSidebarReflowZoom()
  /** Render from the route when on a scoped library hub even if `activePanel` lags (Strict Mode / nav races). */
  const panelId = isLibrarySecondaryPanelVisible(pathname, activePanel)
    ? "library"
    : isLearningActivitiesSecondaryPanelVisible(pathname, activePanel)
      ? "learning-activities"
      : activePanel
  const PanelContent = panelId ? PANELS[panelId] : null

  const navFlyout = (isMobile || reflowZoom) && Boolean(panelId)
  const showScopeFlyout =
    navFlyout && secondaryFlyoutVisible && !secondaryFlyoutHidden

  if (navFlyout && !showScopeFlyout) {
    return null
  }

  const shellOpen = Boolean(panelId) && (!navFlyout || secondaryFlyoutVisible)
  const overlay: false | "mobile" | "desktop" = navFlyout
    ? isMobile
      ? "mobile"
      : "desktop"
    : false
  const compact = overlay ? false : secondaryPanelCompact

  return (
    <>
      {showScopeFlyout ? (
        <Shortcut keys="Escape" onInvoke={closeSecondaryFlyout} />
      ) : null}
      <NestedSecondaryPanelShell
        open={shellOpen}
        compact={compact}
        overlay={overlay}
      >
        {PanelContent ? <PanelContent /> : null}
      </NestedSecondaryPanelShell>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Auto-open hook — pages call this to show/hide a panel on mount/unmount
// ─────────────────────────────────────────────────────────────────────────────

export function useAutoPanel(panelId: string) {
  const { openPanel, closePanel } = useSecondaryPanel()

  React.useEffect(() => {
    openPanel(panelId)
    return () => {
      closePanel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelId])
}

/** Sync hub folder state into the library secondary nav while the route is mounted. */
export function LibraryFolderBridge({
  folders,
  onFoldersChange,
  items,
  onItemsChange,
}: LibraryFolderBridge) {
  const { setLibraryFolderBridge } = useSecondaryPanel()

  React.useEffect(() => {
    setLibraryFolderBridge({ folders, onFoldersChange, items, onItemsChange })
    return () => setLibraryFolderBridge(null)
  }, [folders, onFoldersChange, items, onItemsChange, setLibraryFolderBridge])

  return null
}

export function LibraryAccessBridge({ openManageAccess }: LibraryAccessBridge) {
  const { setLibraryAccessBridge } = useSecondaryPanel()

  React.useEffect(() => {
    setLibraryAccessBridge({ openManageAccess })
    return () => setLibraryAccessBridge(null)
  }, [openManageAccess, setLibraryAccessBridge])

  return null
}

/** Sync group folders into the learning activities secondary nav while the hub is mounted. */
export function LearningActivitiesFolderBridge({
  folders,
  onFoldersChange,
}: LearningActivitiesFolderBridge) {
  const { setLearningActivitiesFolderBridge } = useSecondaryPanel()

  React.useEffect(() => {
    setLearningActivitiesFolderBridge({ folders, onFoldersChange })
    return () => setLearningActivitiesFolderBridge(null)
  }, [folders, onFoldersChange, setLearningActivitiesFolderBridge])

  return null
}
