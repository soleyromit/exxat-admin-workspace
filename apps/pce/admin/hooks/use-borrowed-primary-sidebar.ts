"use client"

/**
 * Lend the primary sidebar's space to a surface that needs the width, then give
 * back what was borrowed.
 *
 * Ask Leo's docked panel is the caller: it collapses the primary nav while it
 * holds layout space. Expanding on close instead of restoring is what stranded a
 * scope rail — hubs open with the primary collapsed and the rail expanded, and an
 * expanded primary makes the secondary panel compact itself for width, so closing
 * Leo handed the user labels on the wrong rail.
 *
 * Neither edge persists. The cookie belongs to real user gestures (⌘B, the
 * sidebar button); a panel borrowing space must not rewrite what the user chose.
 */

import * as React from "react"

import { useSidebar } from "@/components/ui/sidebar"

export function useBorrowedPrimarySidebar(borrowing: boolean) {
  const { setOpen, open } = useSidebar()
  const wasBorrowing = React.useRef(borrowing)
  const openBeforeBorrow = React.useRef(open)

  React.useEffect(() => {
    if (borrowing && !wasBorrowing.current) {
      openBeforeBorrow.current = open
      setOpen(false, { persist: false })
    }
    if (!borrowing && wasBorrowing.current) {
      setOpen(openBeforeBorrow.current, { persist: false })
    }
    wasBorrowing.current = borrowing
  }, [borrowing, open, setOpen])
}
