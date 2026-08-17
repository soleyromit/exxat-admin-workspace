"use client"

/**
 * Shared page shell for the four Exxat One hubs.
 *
 * All four are the same shape — a titled hub with a flat KPI band over a single
 * table — so they compose one client rather than four near-identical copies
 * (`exxat-reuse-before-custom`). Anything genuinely per-hub (columns, rows,
 * empty copy) arrives as a prop.
 *
 * Table-only on purpose: none of these has a board, folder, or dashboard
 * renderer, and `exxat-hub-supported-views` says not to advertise views that
 * are not implemented.
 */

import * as React from "react"

import { HubTable, ListPageTemplate, type ViewTab } from "@/components/data-views"
import type { ColumnDef } from "@/components/data-table/types"
import { KeyMetrics, type MetricItem } from "@/components/key-metrics"
import { PageHeader } from "@/components/page-header"
import { PrimaryPageTemplate } from "@/components/templates/primary-page-template"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tip } from "@/components/ui/tip"
import { useProduct } from "@/contexts/product-context"
import { productPersistKey } from "@/stores/app-store"

export interface OneHubClientProps<TRow extends Record<string, unknown>> {
  title: string
  /** Meta line under the title (count, record ID, freshness). Omit it unless
   *  the hub has a fact to show; never a blurb that restates the title. */
  subtitle?: string
  /** Slug for `productPersistKey` — never pass a bare, unnamespaced key. */
  hubKey: string
  rows: TRow[]
  columns: ColumnDef<TRow>[]
  metrics: MetricItem[]
  tabLabel: string
  searchAriaLabel: string
  emptyState: string
  getRowId: (row: TRow) => string
  getRowSelectionLabel: (row: TRow) => string
  defaultSort: { key: string; dir: "asc" | "desc" }
}

export function OneHubClient<TRow extends Record<string, unknown>>({
  title,
  subtitle,
  hubKey,
  rows,
  columns,
  metrics,
  tabLabel,
  searchAriaLabel,
  emptyState,
  getRowId,
  getRowSelectionLabel,
  defaultSort,
}: OneHubClientProps<TRow>) {
  const { product, customProducts, activeCustomIndex } = useProduct()
  const persistKey = productPersistKey(product, hubKey, customProducts, activeCustomIndex)
  const [exportOpen, setExportOpen] = React.useState(false)

  const defaultTabs = React.useMemo<ViewTab[]>(
    () => [
      {
        id: hubKey,
        label: tabLabel,
        viewType: "table",
        icon: "fa-table",
        filterId: "all",
      },
    ],
    [hubKey, tabLabel],
  )

  return (
    <PrimaryPageTemplate siteHeader={{ title }}>
      <ListPageTemplate
        defaultTabs={defaultTabs}
        supportedViewTypes={["table"]}
        getTabCount={() => rows.length}
        exportOpen={exportOpen}
        onExportOpenChange={setExportOpen}
        exportTotalRows={rows.length}
        header={
          <PageHeader
            title={title}
            subtitle={subtitle}
            actions={
              <DropdownMenu>
                <Tip side="bottom" label="More actions">
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      aria-label="More actions"
                    >
                      <i className="fa-light fa-ellipsis text-base" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                </Tip>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setExportOpen(true)}>
                    <i className="fa-light fa-arrow-down-to-line" aria-hidden="true" />
                    Export
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            }
          />
        }
        metrics={
          <KeyMetrics
        variant="cards"
        size="sm"
            metrics={metrics}
            showHeader={false}
            metricsSingleRow
          />
        }
        renderContent={() => (
          <HubTable<TRow>
            rows={rows}
            columns={columns}
            view="table"
            hubLabel={title}
            lifecycleTabLabel={tabLabel}
            searchAriaLabel={searchAriaLabel}
            getRowId={getRowId}
            getRowSelectionLabel={getRowSelectionLabel}
            defaultSort={defaultSort}
            emptyState={emptyState}
            renderers={{}}
            supportedViewTypes={["table"]}
            persistKey={persistKey}
            selectable={false}
            pagination
            paginationInitialPageSize={25}
          />
        )}
      />
    </PrimaryPageTemplate>
  )
}
