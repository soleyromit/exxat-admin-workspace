"use client"

import { useEffect, useRef } from "react"
import { useSidebar } from "@/components/ui/sidebar"

/**
 * Collapses the sidebar on mount. Restores previous state on unmount.
 * Used on the new-placement page so the sidebar collapses when entering
 * and reverts to whatever it was when leaving.
 */
export function SidebarAutoCollapse() {
  const { open, setOpen } = useSidebar()
  const prevOpen = useRef(open)

  useEffect(() => {
    prevOpen.current = open
    setOpen(false)
    return () => { setOpen(prevOpen.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
