"use client"

/**
 * Split out of `components/ask-leo-shell.tsx` so that file exports components
 * and nothing else. A module that mixes components with plain functions is not
 * a Fast Refresh boundary, and this one is imported by the app shell: every
 * edit to a Leo shell invalidated `App.tsx` and remounted the whole tree, which
 * closed every open rail and dialog in the app.
 */

import { useAskLeo } from "@/components/ask-leo-context"
import { useIsMobile } from "@/hooks/use-mobile"
import { useSidebarReflowZoom } from "@/hooks/use-sidebar-reflow-zoom"

/**
 * True when Leo is open as the docked right rail (or a panel fallback).
 * False for the floating window — that shell must leave hub layout alone.
 */
export function useAskLeoDockedPanelOpen() {
  const { open, dock } = useAskLeo()
  const isMobile = useIsMobile()
  const reflowZoom = useSidebarReflowZoom()
  const windowMode = dock === "window" && !isMobile && !reflowZoom
  return open && !windowMode
}
