import * as React from "react"

import { SiteHeader, type SiteHeaderProps } from "@/components/site-header"
import { SidebarInset } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

/** Default max width for primary hub pages (Placements, Team, Compliance, …). */
export const PRIMARY_PAGE_MAX_WIDTH_CLASS = "max-w-[1440px]"

export interface PrimaryPageTemplateProps {
  /** Optional chrome before `SiteHeader` (e.g. `RotationsPanelActivator`, `SidebarAutoCollapse`). */
  beforeSiteHeader?: React.ReactNode
  /** Top bar — breadcrumbs and Ask Leo. Omit for focused flows (e.g. full-page form with no chrome). */
  siteHeader?: SiteHeaderProps
  /** Page body — typically `*Client` with `ListPageTemplate` inside. */
  children: React.ReactNode
  /** Override default `max-w-[1440px]` for narrower shells (patterns showcase, detail routes). */
  maxWidthClassName?: string
  /** Extra classes on the `@[container]main` content column. */
  contentClassName?: string
  /** Extra classes on the flex wrapper between `SiteHeader` and the content column. */
  bodyClassName?: string
}

/**
 * Primary page shell — same composition as Placements / Team / Compliance routes:
 * `SidebarInset` (single `main` landmark) + `SiteHeader` + max-width content column.
 *
 * Use with `ListPageTemplate` + data client per `AGENTS.md` §6.3 and `docs/data-views-pattern.md`.
 */
export function PrimaryPageTemplate({
  beforeSiteHeader,
  siteHeader,
  children,
  maxWidthClassName = PRIMARY_PAGE_MAX_WIDTH_CLASS,
  contentClassName,
  bodyClassName,
}: PrimaryPageTemplateProps) {
  return (
    <SidebarInset id="main-content" tabIndex={-1}>
      {beforeSiteHeader}
      {siteHeader ? <SiteHeader {...siteHeader} /> : null}
      <div className={cn("flex min-h-0 flex-1 flex-col outline-none", bodyClassName)}>
        <div
          className={cn(
            "@container/main mx-auto flex w-full flex-col",
            maxWidthClassName,
            contentClassName,
          )}
        >
          {children}
        </div>
      </div>
    </SidebarInset>
  )
}
