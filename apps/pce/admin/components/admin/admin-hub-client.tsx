"use client"

/**
 * Shared shell for the three Admin console hubs.
 *
 * All three are the same shape: a titled hub, a flat KPI band, one or more
 * table views over a single dataset, and an import as the primary action. They
 * compose one client rather than three near-identical copies
 * (`exxat-reuse-before-custom`); anything genuinely per-hub arrives as a prop.
 *
 * The views prop is what lets People carry All, Students, Faculty and Staff
 * without three datasets. Each view names its own rows and columns, but they
 * all come off the same array upstream, so a record cannot exist on one tab and
 * not another.
 */

import * as React from "react"

import { AdminImportSheet } from "@/components/admin/admin-import-sheet"
import type { ColumnDef } from "@/components/data-table/types"
import { HubTable, ListPageTemplate, type ViewTab } from "@/components/data-views"
import { KeyMetrics, type MetricItem } from "@/components/key-metrics"
import { PageHeader } from "@/components/page-header"
import { PrimaryPageTemplate } from "@/components/templates/primary-page-template"
import { LocalBanner } from "@/components/ui/banner"
import { useAltKeyLabel, useModKeyLabel } from "@/hooks/use-mod-key-label"
import { useProduct } from "@/contexts/product-context"
import { productPersistKey } from "@/stores/app-store"

/** One tab: its own rows and columns over the hub's single dataset. */
export interface AdminHubView<TRow extends Record<string, unknown>> {
  id: string
  label: string
  icon: string
  rows: TRow[]
  columns: ColumnDef<TRow>[]
  /** Shown when this view has no rows. Written for the view, not the hub. */
  emptyState: string
}

export interface AdminHubClientProps<TRow extends Record<string, unknown>> {
  title: string
  /** Meta line under the title (count, record ID, freshness). Omit it unless
   *  the hub has a fact to show; never a blurb that restates the title. */
  subtitle?: string
  /** Slug for `productPersistKey` — never pass a bare, unnamespaced key. */
  hubKey: string
  views: AdminHubView<TRow>[]
  metrics: MetricItem[]
  searchAriaLabel: string
  /** Singular object name, used in the import copy ("Import people"). */
  objectLabel: string
  getRowId: (row: TRow) => string
  getRowSelectionLabel: (row: TRow) => string
  /** Route for a row's record, opened on row click. */
  getRowHref: (row: TRow) => string
  onRowNavigate: (href: string) => void
  defaultSort: { key: string; dir: "asc" | "desc" }
  /** Optional note under the KPI band — omit when the hub needs no prose. */
  sourceNote?: React.ReactNode
}

export function AdminHubClient<TRow extends Record<string, unknown>>({
  title,
  subtitle,
  hubKey,
  views,
  metrics,
  searchAriaLabel,
  objectLabel,
  getRowId,
  getRowSelectionLabel,
  getRowHref,
  onRowNavigate,
  defaultSort,
  sourceNote,
}: AdminHubClientProps<TRow>) {
  const { product, customProducts, activeCustomIndex } = useProduct()
  const persistKey = productPersistKey(product, hubKey, customProducts, activeCustomIndex)
  const mod = useModKeyLabel()
  const alt = useAltKeyLabel()
  const importShortcut = `${mod}${alt}U`
  const exportShortcut = `${mod}${alt}E`
  const [exportOpen, setExportOpen] = React.useState(false)
  const [importOpen, setImportOpen] = React.useState(false)
  const [queuedImport, setQueuedImport] = React.useState<string | null>(null)

  const defaultTabs = React.useMemo<ViewTab[]>(
    () =>
      views.map(view => ({
        id: view.id,
        label: view.label,
        viewType: "table",
        icon: view.icon,
        filterId: view.id,
      })),
    [views],
  )

  const rowsByView = React.useMemo(
    () => new Map(views.map(view => [view.id, view.rows.length])),
    [views],
  )

  const totalRows = views[0]?.rows.length ?? 0

  return (
    <PrimaryPageTemplate siteHeader={{ title }}>
      <ListPageTemplate
        defaultTabs={defaultTabs}
        supportedViewTypes={["table"]}
        getTabCount={filterId => rowsByView.get(filterId) ?? 0}
        exportOpen={exportOpen}
        onExportOpenChange={setExportOpen}
        exportTotalRows={totalRows}
        header={
          <PageHeader
            title={title}
            subtitle={subtitle}
            actionItems={[
              {
                id: "import",
                label: `Import ${objectLabel}`,
                icon: "fa-file-arrow-up",
                variant: "default",
                shortcut: importShortcut,
                onSelect: () => setImportOpen(true),
              },
              {
                id: "export",
                label: "Export",
                icon: "fa-arrow-down-to-line",
                variant: "outline",
                shortcut: exportShortcut,
                onSelect: () => setExportOpen(true),
              },
            ]}
          />
        }
        metrics={
          <div className="flex flex-col gap-3">
            <KeyMetrics variant="cards" size="sm" metrics={metrics} showHeader={false} metricsSingleRow />
            {sourceNote ? (
              <p className="text-sm text-muted-foreground">{sourceNote}</p>
            ) : null}
            {queuedImport ? (
              <LocalBanner
                variant="success"
                title="Import queued"
                dismissible
                onDismiss={() => setQueuedImport(null)}
              >
                {queuedImport}
              </LocalBanner>
            ) : null}
          </div>
        }
        renderContent={tab => {
          const view = views.find(candidate => candidate.id === tab.id) ?? views[0]
          return (
            <HubTable<TRow>
              // Remounting per view is deliberate: the tabs show different
              // columns, so carrying one table's sizing and pinning across them
              // would leave the user with a layout for columns that are gone.
              key={view.id}
              rows={view.rows}
              columns={view.columns}
              view="table"
              hubLabel={title}
              lifecycleTabLabel={view.label}
              searchAriaLabel={searchAriaLabel}
              getRowId={getRowId}
              getRowSelectionLabel={getRowSelectionLabel}
              onRowClick={row => onRowNavigate(getRowHref(row))}
              defaultSort={defaultSort}
              emptyState={view.emptyState}
              renderers={{}}
              supportedViewTypes={["table"]}
              persistKey={`${persistKey}:${view.id}`}
              selectable={false}
              pagination
              paginationInitialPageSize={25}
            />
          )
        }}
      />
      <AdminImportSheet
        open={importOpen}
        onOpenChange={setImportOpen}
        objectLabel={objectLabel}
        onQueued={summary => setQueuedImport(summary)}
      />
    </PrimaryPageTemplate>
  )
}
