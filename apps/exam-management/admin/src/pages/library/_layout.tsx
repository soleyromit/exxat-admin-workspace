import * as React from "react"
import { Outlet } from "react-router-dom"

import { useSecondaryPanel } from "@/components/sidebar"

/**
 * Library layout — nested routes under `/library/*`.
 *
 * Hub list routes and focused authoring (`/new`) share the library scope rail when
 * it was already open; dedicated search surfaces stay full-width without the rail.
 */
export function LibraryLayout() {
  const { closePanel } = useSecondaryPanel()
  const closePanelRef = React.useRef(closePanel)

  React.useEffect(() => {
    closePanelRef.current = closePanel
  })

  // Leaving `/library/*` entirely — close the nested panel without
  // forcing the primary sidebar open (⌘B / cookie controls that).
  // Open/close while staying on library routes is handled in `SecondaryPanelProvider`.
  React.useEffect(() => {
    return () => {
      closePanelRef.current({ mainSidebar: "leave" })
    }
  }, [])

  return <Outlet />
}
