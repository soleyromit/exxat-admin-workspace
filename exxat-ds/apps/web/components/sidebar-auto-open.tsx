"use client"

import { useEffect, useRef } from "react"
import { useSidebar } from "@/components/ui/sidebar"

/** Reopens the sidebar once when the data-list page mounts (after returning from new-placement). */
export function SidebarAutoOpen() {
  const { setOpen } = useSidebar()
  const ran = useRef(false)
  useEffect(() => {
    if (!ran.current) {
      ran.current = true
      setOpen(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}
