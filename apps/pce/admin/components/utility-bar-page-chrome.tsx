"use client"

/**
 * Page → utility bar chrome bridge.
 *
 * Compact hubs keep the full Comfort/Dense bar. Detail / focus routes switch the
 * bar into Back or Breadcrumb mode: leading back link or ancestor trail, no
 * toggle, product, actions, or identity. `SiteHeader` publishes the mode;
 * `UtilityBarSlot` consumes it — both sit in different subtrees under this
 * provider.
 */

import * as React from "react"

import type {
  PageBreadcrumbMenuOption,
  PageBreadcrumbTrailItem,
} from "@/components/page-breadcrumb-trail"

export type UtilityBarPageChrome =
  | { mode: "default" }
  | {
      mode: "back"
      href: string
      /** Parent destination — spoken on the icon, not shown at rest. */
      label: string
      /** Current page title — shown beside the back icon in Back mode. */
      scrollTitle?: string
      scrollTitleMenu?: PageBreadcrumbMenuOption[]
      scrollTitleMenuAriaLabel?: string
    }
  | {
      mode: "breadcrumb"
      items?: PageBreadcrumbTrailItem[]
      /** Final trail segment. Omit on record detail when the H1 carries the title. */
      currentPage?: string
      currentPageMenu?: PageBreadcrumbMenuOption[]
      currentPageMenuAriaLabel?: string
    }

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
