"use client"

/**
 * CompactHeaderSlot — lets the page's `SiteHeader` (mounted per-route, deep in
 * the tree) portal its breadcrumb/back-link into the global `UtilityBarSlot`
 * (mounted once, above the sidebar+content row). Same reasoning as the DS's
 * `CompactHeaderSlotProvider`: the compact bar and the route's header are in
 * different subtrees, and the breadcrumb has to travel from one to the other.
 *
 * Simplified vs the DS version — PCE has one shell variant (always full-width
 * compact bar), so there's no `showBreadcrumb`/layout-variant branching here;
 * `SiteHeader` decides breadcrumb-vs-back-link content itself and portals
 * whichever it has.
 */

import * as React from "react"

interface CompactHeaderSlotValue {
  node: HTMLDivElement | null
  setNode: (node: HTMLDivElement | null) => void
}

const CompactHeaderSlotContext = React.createContext<CompactHeaderSlotValue | null>(null)

export function CompactHeaderSlotProvider({ children }: { children: React.ReactNode }) {
  const [node, setNode] = React.useState<HTMLDivElement | null>(null)
  const value = React.useMemo(() => ({ node, setNode }), [node])
  return (
    <CompactHeaderSlotContext.Provider value={value}>
      {children}
    </CompactHeaderSlotContext.Provider>
  )
}

/** Called by `UtilityBarSlot`'s slot div — registers the portal target as a ref callback. */
export function useCompactHeaderSlotRef(): (node: HTMLDivElement | null) => void {
  const ctx = React.useContext(CompactHeaderSlotContext)
  if (!ctx) throw new Error("useCompactHeaderSlotRef must be used inside CompactHeaderSlotProvider")
  return ctx.setNode
}

/** Called by `SiteHeader` — the DOM node to portal breadcrumb/back content into. */
export function useCompactHeaderPortalTarget(): HTMLDivElement | null {
  const ctx = React.useContext(CompactHeaderSlotContext)
  if (!ctx) throw new Error("useCompactHeaderPortalTarget must be used inside CompactHeaderSlotProvider")
  return ctx.node
}
