"use client"

/**
 * Page → utility bar chrome bridge.
 *
 * Compact hubs keep the full Comfort/Dense bar. Detail / focus routes that use
 * the back pattern (or record-detail trails we derive a parent from) switch the
 * bar into Back mode: leading back link only, no toggle, product, actions, or
 * identity. `SiteHeader` publishes the mode; `UtilityBarSlot` consumes it —
 * both sit in different subtrees under this provider.
 */

import * as React from "react"

export type UtilityBarPageChrome =
  | { mode: "default" }
  | { mode: "back"; href: string; label: string }

const DEFAULT_CHROME: UtilityBarPageChrome = { mode: "default" }

const UtilityBarPageChromeContext =
  React.createContext<UtilityBarPageChrome>(DEFAULT_CHROME)
const UtilityBarPageChromeSetterContext = React.createContext<
  (chrome: UtilityBarPageChrome) => void
>(() => {})

export function useUtilityBarPageChrome() {
  return React.useContext(UtilityBarPageChromeContext)
}

export function useSetUtilityBarPageChrome() {
  return React.useContext(UtilityBarPageChromeSetterContext)
}

export function UtilityBarPageChromeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [chrome, setChrome] = React.useState<UtilityBarPageChrome>(DEFAULT_CHROME)

  return (
    <UtilityBarPageChromeSetterContext.Provider value={setChrome}>
      <UtilityBarPageChromeContext.Provider value={chrome}>
        {children}
      </UtilityBarPageChromeContext.Provider>
    </UtilityBarPageChromeSetterContext.Provider>
  )
}

/** Last ancestor crumb with an href — parent destination for Back mode. */
export function deriveBackFromBreadcrumbs(
  breadcrumbs:
    | ReadonlyArray<{ label: string; href?: string }>
    | undefined,
): { href: string; label: string } | null {
  if (!breadcrumbs?.length) return null
  for (let i = breadcrumbs.length - 1; i >= 0; i -= 1) {
    const crumb = breadcrumbs[i]
    if (crumb?.href) return { href: crumb.href, label: crumb.label }
  }
  return null
}
