"use client"

/**
 * Portal target that lets the compact shell put the page's breadcrumb on the
 * utility bar.
 *
 * The compact layout follows shadcn `sidebar-16`, which has exactly ONE row of
 * chrome: toggle, breadcrumb, search. Every other variant here has two — the
 * utility bar, and then `SiteHeader` inside the inset carrying the breadcrumb.
 * Collapsing those two rows into one is where most of compact's density comes
 * from, worth ~48px on every page, far more than trimming padding.
 *
 * Breadcrumbs are per-route props on `PrimaryPageTemplate`, not shell state, so
 * there is nothing for the bar to read. Rather than thread a breadcrumb through
 * every route, `SiteHeader` renders into this slot when one is mounted. Routes
 * keep passing `siteHeader` exactly as they do today.
 *
 * `element` is null whenever the compact bar is not on screen — the other three
 * variants, the pages that suppress the bar, chromeless routes. `SiteHeader`
 * treats null as "render normally", so no route has to know which shell it is
 * in, and a page that loses its bar never loses its breadcrumb with it.
 */

import * as React from "react"

const CompactHeaderSlotContext = React.createContext<HTMLElement | null>(null)
const CompactHeaderSlotSetterContext = React.createContext<
  (node: HTMLElement | null) => void
>(() => {})

/** The mounted slot, or null when the compact bar is not rendered. */
export function useCompactHeaderSlot() {
  return React.useContext(CompactHeaderSlotContext)
}

/** Ref callback for the bar to register (and on unmount, clear) its slot. */
export function useCompactHeaderSlotRef() {
  return React.useContext(CompactHeaderSlotSetterContext)
}

export function CompactHeaderSlotProvider({
  children,
}: {
  children: React.ReactNode
}) {
  // State rather than a ref: `SiteHeader` has to re-render once the node
  // exists, and a ref mutation would not tell it.
  const [element, setElement] = React.useState<HTMLElement | null>(null)

  return (
    <CompactHeaderSlotSetterContext.Provider value={setElement}>
      <CompactHeaderSlotContext.Provider value={element}>
        {children}
      </CompactHeaderSlotContext.Provider>
    </CompactHeaderSlotSetterContext.Provider>
  )
}
