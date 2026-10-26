"use client"

import * as React from "react"
import { Outlet, useLocation } from "react-router-dom"

import { PrimaryPageTemplate } from "@/components/templates/primary-page-template"
import { PageHeader } from "@/components/page-header"
import { DesignSystemDocPreviewControls } from "@/components/sidebar/design-system-doc-preview-controls"
import { useProductDashboardHref } from "@/contexts/product-route-sync"
import { DESIGN_SYSTEM_HUB_LABEL } from "@/lib/design-system/hub-label"
import { getComponentDocSpec } from "@/lib/design-system/component-docs"
import { DESIGN_SYSTEM_DOC_ARTICLE } from "@/lib/design-system/component-doc-shell"
import { getDesignSystemEntry } from "@/lib/design-system/registry"
import { cn } from "@/lib/utils"

function activeSlugFromPath(pathname: string, basePath: string): string | undefined {
  if (pathname === basePath || pathname === `${basePath}/`) return undefined
  const prefix = `${basePath}/`
  if (!pathname.startsWith(prefix)) return undefined
  return pathname.slice(prefix.length).split("/")[0] || undefined
}

export function DesignSystemShell() {
  const location = useLocation()
  const dashboardHref = useProductDashboardHref()
  const productBase = dashboardHref.replace(/\/dashboard$/, "")
  const basePath = `${productBase}/design-system`

  const activeSlug = activeSlugFromPath(location.pathname, basePath)
  const entry = getDesignSystemEntry(activeSlug)
  const componentDoc = activeSlug ? getComponentDocSpec(activeSlug) : undefined

  const isIndex = !activeSlug

  const headerTitle = entry?.name ?? DESIGN_SYSTEM_HUB_LABEL
  const headerSubtitle = entry
    ? (componentDoc?.summary ?? entry.description)
    : undefined

  const breadcrumbs = isIndex
    ? [{ label: "Dashboard", href: dashboardHref }]
    : [
        { label: "Dashboard", href: dashboardHref },
        { label: DESIGN_SYSTEM_HUB_LABEL, href: basePath },
      ]

  return (
    <PrimaryPageTemplate
      siteHeader={{
        breadcrumbs,
        title: isIndex ? DESIGN_SYSTEM_HUB_LABEL : headerTitle,
        trailing: <DesignSystemDocPreviewControls />,
      }}
    >
      {/*
        Single scroll owner: PrimaryPageTemplate `[data-page-scroll]`.
        Do NOT nest overflow-y-auto here — that pins PageHeader while only the
        outlet scrolls (violates hub shell contract in primary-page-template).
      */}
      <div className="flex min-h-0 flex-1 flex-col px-4 pb-8 lg:px-6">
        {!isIndex ? (
          <div className={DESIGN_SYSTEM_DOC_ARTICLE}>
            <PageHeader
              className="!px-0 pt-2 lg:!px-0"
              title={headerTitle}
              subtitle={headerSubtitle}
            />
          </div>
        ) : null}
        <div className={cn("min-h-0 min-w-0 flex-1", isIndex ? "" : "pt-6")}>
          <Outlet />
        </div>
      </div>
    </PrimaryPageTemplate>
  )
}
