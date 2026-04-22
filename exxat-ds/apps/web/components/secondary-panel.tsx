"use client"

/**
 * SecondaryPanel — nested sidebar panel that appears between the icon-rail
 * sidebar and the main content. When active, the main sidebar collapses to
 * icon-only mode; when dismissed, the sidebar expands back.
 *
 * Pattern: VS Code / Figma icon-rail + detail panel.
 */

import * as React from "react"
import { cn }          from "@/lib/utils"
import { useSidebar }  from "@/components/ui/sidebar"
import { Tip }         from "@/components/ui/tip"

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

interface SecondaryPanelContextValue {
  /** Currently active panel id, or null if none */
  activePanel: string | null
  /** Open a panel by id */
  openPanel: (id: string) => void
  /** Close the panel */
  closePanel: () => void
}

const SecondaryPanelContext = React.createContext<SecondaryPanelContextValue>({
  activePanel: null,
  openPanel: () => {},
  closePanel: () => {},
})

export function useSecondaryPanel() {
  return React.useContext(SecondaryPanelContext)
}

export function SecondaryPanelProvider({ children }: { children: React.ReactNode }) {
  const [activePanel, setActivePanel]     = React.useState<string | null>(null)
  const { setOpen } = useSidebar()

  const openPanel = React.useCallback((id: string) => {
    setActivePanel(id)
    setOpen(false) // collapse main sidebar to icon rail
  }, [setOpen])

  const closePanel = React.useCallback(() => {
    setActivePanel(null)
    setOpen(true) // expand main sidebar back
  }, [setOpen])

  const value = React.useMemo(() => ({
    activePanel, openPanel, closePanel,
  }), [activePanel, openPanel, closePanel])

  return (
    <SecondaryPanelContext.Provider value={value}>
      {children}
    </SecondaryPanelContext.Provider>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Panel content — Rotations
// ─────────────────────────────────────────────────────────────────────────────

const ROTATION_ITEMS = [
  { id: "all",        label: "All Rotations",               icon: "fa-folder",  iconActive: "fa-folder", meta: "12 active" },
  { id: "rotation-1", label: "Clinical Nursing — Fall 2026", icon: "fa-folder",  iconActive: "fa-folder", meta: "8 students" },
  { id: "rotation-2", label: "PT Fieldwork — Spring 2026",   icon: "fa-folder",  iconActive: "fa-folder", meta: "6 students" },
  { id: "rotation-3", label: "OT Level II — Summer 2026",    icon: "fa-folder",  iconActive: "fa-folder", meta: "4 students" },
]

function RotationsPanel() {
  const { closePanel } = useSecondaryPanel()
  const [activeRotation, setActiveRotation] = React.useState("all")

  return (
    <>
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Rotations
        </p>
        <Tip label="Close panel" side="bottom">
          <button
            type="button"
            onClick={closePanel}
            className="size-5 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-interactive-hover-foreground hover:bg-interactive-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close panel"
          >
            <i className="fa-light fa-xmark text-xs" aria-hidden="true" />
          </button>
        </Tip>
      </div>
      <ul className="flex-1 px-2 pb-2 space-y-0.5" role="listbox">
        {ROTATION_ITEMS.map(item => {
          const isActive = item.id === activeRotation
          return (
            <li key={item.id}>
              <Tip label={item.label} side="right">
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => setActiveRotation(item.id)}
                  className={cn(
                    "flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm transition-colors text-left",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  <i className={cn("text-[13px] w-4 text-center shrink-0", isActive ? `fa-solid ${item.iconActive}` : `fa-light ${item.icon}`)} aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <span className="block truncate text-sm">{item.label}</span>
                    {item.meta && (
                      <span className="block truncate text-xs text-muted-foreground mt-0.5">{item.meta}</span>
                    )}
                  </div>
                </button>
              </Tip>
            </li>
          )
        })}
      </ul>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SecondaryPanel — the actual rendered panel
// ─────────────────────────────────────────────────────────────────────────────

const PANELS: Record<string, React.FC> = {
  rotations: RotationsPanel,
}

export function SecondaryPanel() {
  const { activePanel } = useSecondaryPanel()
  const PanelContent = activePanel ? PANELS[activePanel] : null

  return (
    <nav
      aria-label="Secondary navigation"
      data-state={activePanel ? "open" : "closed"}
      className={cn(
        "flex flex-col overflow-hidden",
        "transition-[width,margin,opacity] duration-200 ease-linear",
        activePanel
          ? "w-56 shrink-0 m-2 mr-0 rounded-xl ring-1 ring-sidebar-border shadow-sm sticky top-2 h-[calc(100svh-1rem)]"
          : "h-0 min-h-0 shrink overflow-hidden border-0 p-0 m-0 min-w-0 w-0 max-w-0 opacity-0 pointer-events-none"
      )}
      style={activePanel ? { backgroundColor: "var(--secondary-panel-bg, #FAFBFF)" } : undefined}
    >
      <div
        className={cn(
          "flex flex-1 flex-col overflow-y-auto",
          activePanel ? "min-w-[224px]" : "hidden min-w-0 w-0 p-0"
        )}
      >
        {PanelContent && <PanelContent />}
      </div>
    </nav>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Auto-open hook — pages call this to show/hide a panel on mount/unmount
// ─────────────────────────────────────────────────────────────────────────────

export function useAutoPanel(panelId: string) {
  const { openPanel, closePanel } = useSecondaryPanel()

  React.useEffect(() => {
    openPanel(panelId)
    return () => { closePanel() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelId])
}
