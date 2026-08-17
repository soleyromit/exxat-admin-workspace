"use client"

/**
 * Domain state shared between a mounted hub and the scope rail beside it.
 *
 * The Library hub owns its folder tree and its collaborators sheet; the rail
 * renders that tree and opens that sheet. Neither can import the other — the hub
 * is a route, the rail is nav — so the hub registers a bridge here on mount and
 * the rail reads it.
 *
 * This sits outside `components/sidebar/` on purpose. `SecondaryPanel` held these
 * bridges when it was the only shared context in the tree, which gave DS shell
 * code a typed dependency on `LibraryFolder` and `LibraryItem`. The shell never
 * reads a bridge; only app hub routes and app nav components do. Per ADR 0003
 * that makes this L5 domain state, and its path is what says so — the sidebar
 * tree moves into `@exxatdesignux/ui` and this file does not, so it must not be
 * inside that tree or re-exported from its barrel.
 */

import * as React from "react"

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

interface PanelBridgesValue {
  /** Library folder tree shared with the secondary nav while the hub is mounted. */
  libraryFolderBridge: LibraryFolderBridge | null
  setLibraryFolderBridge: (bridge: LibraryFolderBridge | null) => void
  /** Opens the hub collaborators sheet from the secondary nav. */
  libraryAccessBridge: LibraryAccessBridge | null
  setLibraryAccessBridge: (bridge: LibraryAccessBridge | null) => void
  /** Learning activities group tree shared with the secondary nav while the hub is mounted. */
  learningActivitiesFolderBridge: LearningActivitiesFolderBridge | null
  setLearningActivitiesFolderBridge: (bridge: LearningActivitiesFolderBridge | null) => void
}

const PanelBridgesContext = React.createContext<PanelBridgesValue>({
  libraryFolderBridge: null,
  setLibraryFolderBridge: () => {},
  libraryAccessBridge: null,
  setLibraryAccessBridge: () => {},
  learningActivitiesFolderBridge: null,
  setLearningActivitiesFolderBridge: () => {},
})

/**
 * Read the registered bridges. A `null` bridge means the owning hub is not
 * mounted, which the rail reads as "this affordance is unavailable here" — see
 * `canManageFolders` in `library-secondary-nav.tsx`.
 */
export function usePanelBridges() {
  return React.useContext(PanelBridgesContext)
}

export function PanelBridgesProvider({ children }: { children: React.ReactNode }) {
  const [libraryFolderBridge, setLibraryFolderBridge] =
    React.useState<LibraryFolderBridge | null>(null)
  const [libraryAccessBridge, setLibraryAccessBridge] =
    React.useState<LibraryAccessBridge | null>(null)
  const [learningActivitiesFolderBridge, setLearningActivitiesFolderBridge] =
    React.useState<LearningActivitiesFolderBridge | null>(null)

  const value = React.useMemo(
    () => ({
      libraryFolderBridge,
      setLibraryFolderBridge,
      libraryAccessBridge,
      setLibraryAccessBridge,
      learningActivitiesFolderBridge,
      setLearningActivitiesFolderBridge,
    }),
    [libraryFolderBridge, libraryAccessBridge, learningActivitiesFolderBridge],
  )

  return (
    <PanelBridgesContext.Provider value={value}>
      {children}
    </PanelBridgesContext.Provider>
  )
}

/** Sync hub folder state into the library secondary nav while the route is mounted. */
export function LibraryFolderBridge({
  folders,
  onFoldersChange,
  items,
  onItemsChange,
}: LibraryFolderBridge) {
  const { setLibraryFolderBridge } = usePanelBridges()

  // Stable identities that still call the latest prop — a call site that wraps
  // its setState dispatcher in an inline arrow hands us a new function every
  // render, and re-registering the bridge on each one would tear the panel's
  // folder state down mid-interaction.
  const emitFoldersChange: typeof onFoldersChange = React.useEffectEvent(value =>
    onFoldersChange(value),
  )
  const emitItemsChange: typeof onItemsChange = React.useEffectEvent(value =>
    onItemsChange(value),
  )

  React.useEffect(() => {
    setLibraryFolderBridge({
      folders,
      onFoldersChange: (v) => emitFoldersChange(v),
      items,
      onItemsChange: (v) => emitItemsChange(v),
    })
    return () => setLibraryFolderBridge(null)
  }, [folders, items, setLibraryFolderBridge])

  return null
}

export function LibraryAccessBridge({ openManageAccess }: LibraryAccessBridge) {
  const { setLibraryAccessBridge } = usePanelBridges()

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
  const { setLearningActivitiesFolderBridge } = usePanelBridges()

  const emitFoldersChange: typeof onFoldersChange = React.useEffectEvent(value =>
    onFoldersChange(value),
  )

  React.useEffect(() => {
    setLearningActivitiesFolderBridge({
      folders,
      onFoldersChange: (v) => emitFoldersChange(v),
    })
    return () => setLearningActivitiesFolderBridge(null)
  }, [folders, setLearningActivitiesFolderBridge])

  return null
}
