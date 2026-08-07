"use client"

import * as React from "react"

export type ClosePanelOptions = {
  mainSidebar?: "restore" | "expand" | "collapse" | "leave"
}

interface SecondaryPanelContextValue {
  activePanel: string | null
  openPanel: (id: string) => void
  closePanel: (opts?: ClosePanelOptions) => void
  secondaryPanelCompact: boolean
  collapseActiveSecondaryPanel: () => void
  libraryFolderBridge: null
  setLibraryFolderBridge: (bridge: null) => void
  libraryAccessBridge: null
  setLibraryAccessBridge: (bridge: null) => void
}

const SecondaryPanelContext = React.createContext<SecondaryPanelContextValue>({
  activePanel: null,
  openPanel: () => {},
  closePanel: () => {},
  secondaryPanelCompact: false,
  collapseActiveSecondaryPanel: () => {},
  libraryFolderBridge: null,
  setLibraryFolderBridge: () => {},
  libraryAccessBridge: null,
  setLibraryAccessBridge: () => {},
})

export function useSecondaryPanel() {
  return React.useContext(SecondaryPanelContext)
}

export function SecondaryPanelProvider({ children }: { children: React.ReactNode }) {
  const [activePanel, setActivePanel] = React.useState<string | null>(null)
  const [secondaryPanelCompact, setSecondaryPanelCompact] = React.useState(false)

  const openPanel = React.useCallback((id: string) => {
    setActivePanel(id)
    setSecondaryPanelCompact(false)
  }, [])

  const closePanel = React.useCallback((_opts?: ClosePanelOptions) => {
    setActivePanel(null)
    setSecondaryPanelCompact(false)
  }, [])

  const collapseActiveSecondaryPanel = React.useCallback(() => {
    setSecondaryPanelCompact(true)
  }, [])

  return (
    <SecondaryPanelContext.Provider value={{
      activePanel,
      openPanel,
      closePanel,
      secondaryPanelCompact,
      collapseActiveSecondaryPanel,
      libraryFolderBridge: null,
      setLibraryFolderBridge: () => {},
      libraryAccessBridge: null,
      setLibraryAccessBridge: () => {},
    }}>
      {children}
    </SecondaryPanelContext.Provider>
  )
}

/** PCE Phase 1: no secondary panels. Renders null. */
export function SecondaryPanel() {
  return null
}

export function useAutoPanel(_panelId: string) {
  // no-op in PCE Phase 1
}
