"use client"

/**
 * Column types — hub client.
 *
 * Catalog surface: table-only, no KPI strip, no view tabs — the grid is the focus.
 * Cell patterns live in `columns-showcase.tsx`.
 */

import * as React from "react"

import { PrimaryPageTemplate } from "@/components/templates/primary-page-template"
import { PageHeader } from "@/components/page-header"
import { useProductDashboardHref } from "@/contexts/product-route-sync"
import {
  ListPageTemplate,
  type ViewTab,
} from "@/components/data-views"
import { ColumnsShowcase } from "@/components/columns-showcase"

const COLUMNS_DEFAULT_TABS: ViewTab[] = [
  {
    id: "columns-all",
    label: "All columns",
    viewType: "table",
    icon: "fa-table",
    filterId: "all",
  },
]

const COLUMNS_SUBTITLE =
  "Every cell pattern the design system ships — checkbox select, primary identity, avatar group, status chip, inline toggle, tag overflow, rating stars, progress bar, currency, attachments, external link, relative time, absolute date, and row actions overflow."

const COLUMNS_TABLE_ANCHOR = "columns-table"

export function ColumnsClient() {
  const dashboardHref = useProductDashboardHref()

  return (
    <PrimaryPageTemplate
      siteHeader={{
        breadcrumbs: [{ label: "Dashboard", href: dashboardHref }],
        title: "Column types",
      }}
    >
      <ListPageTemplate
        hideViewsToolbar
        defaultShowMetrics={false}
        defaultTabs={COLUMNS_DEFAULT_TABS}
        header={
          <PageHeader
            title="Column types"
            subtitle={COLUMNS_SUBTITLE}
          />
        }
        renderContent={() => (
          <div id={COLUMNS_TABLE_ANCHOR}>
            <ColumnsShowcase view="table" onViewChange={() => {}} />
          </div>
        )}
      />
    </PrimaryPageTemplate>
  )
}
