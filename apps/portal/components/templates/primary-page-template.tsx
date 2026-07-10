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
  /** Optional extra classes on `SidebarInset` (advanced — rarely needed). */
  sidebarInsetClassName?: string
  /**
   * New question (`form-inspector`) only — viewport-height inset with scroll inside
   * builder/inspector cards. Hub routes scroll inside `[data-page-scroll]` so
   * `SiteHeader` stays pinned (window scroll breaks sticky under shell overflow).
   */
  containScroll?: boolean
  /**
   * Optional full-page canvas behind `SiteHeader` + body (e.g. FigJam dot grid on New question).
   * Renders as `absolute inset-0` on `SidebarInset` — not inside scroll panes or cards.
   */
  pageCanvas?: React.ReactNode
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
  containScroll = false,
  pageCanvas,
  sidebarInsetClassName,
}: PrimaryPageTemplateProps) {
  return (
    <SidebarInset
      id="main-content"
      tabIndex={-1}
      className={cn(
        pageCanvas && "relative",
        "flex min-h-0 flex-1 flex-col overflow-hidden !my-0 h-full",
        containScroll &&
          "max-h-[calc(100svh-0.75rem)] px-2 pb-4 [--composer-card-shadow-inset:0.75rem]",
        sidebarInsetClassName,
      )}
    >
      {pageCanvas}
      {beforeSiteHeader}
      {siteHeader ? (
        <div className="relative z-30 shrink-0" data-site-header="">
          <SiteHeader {...siteHeader} />
        </div>
      ) : null}
      <div
        data-page-scroll=""
        className={cn(
          "flex min-h-0 flex-1 flex-col outline-none",
          containScroll
            ? "relative z-[1] min-h-0 flex-1 overflow-hidden py-1"
            : "overflow-y-auto",
          bodyClassName,
        )}
      >
        <div
          className={cn(
            "@container/main mx-auto flex min-h-min w-full min-w-0 flex-1 flex-col",
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
