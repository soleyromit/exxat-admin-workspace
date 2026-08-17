"use client"

/**
 * Design OS delivery tracker hub.
 *
 * Rows are seeded from `DESIGN_SYSTEM_REGISTRY_ENTRIES` (package tiers).
 * UI delivery status, comment, and Storybook URL persist in a local overlay.
 */

import * as React from "react"

import { HubTable, ListPageTemplate, type ViewTab } from "@/components/data-views"
import { KeyMetrics } from "@/components/key-metrics"
import { PageHeader } from "@/components/page-header"
import { PrimaryPageTemplate } from "@/components/templates/primary-page-template"
import { LocalBanner } from "@/components/ui/banner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Shortcut,
} from "@/components/ui/dropdown-menu"
import { Tip } from "@/components/ui/tip"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { buildDeliveryTrackerColumns } from "@/components/delivery-tracker-columns"
import { DeliveryTrackerEditSheet } from "@/components/delivery-tracker-edit-sheet"
import { useProduct } from "@/contexts/product-context"
import { useProductDashboardHref } from "@/contexts/product-route-sync"
import { useAltKeyLabel, useModKeyLabel } from "@/hooks/use-mod-key-label"
import {
  buildDeliveryTrackerRows,
  deliveryTrackerKpiMetrics,
  exportDeliveryOverlayJson,
  formatDeliveryShareSummary,
  loadDeliveryOverlay,
  parseDeliveryOverlayImport,
  patchDeliveryOverlay,
  patchDeliveryOverlayMany,
  saveDeliveryOverlay,
  type DeliveryOverlayBundle,
  type DeliveryTrackerRow,
  type UiDeliveryStatus,
} from "@/lib/delivery-tracker"
import { productPersistKey } from "@/stores/app-store"

const HUB_KEY = "delivery"
const TAB_ID = "delivery-all"

const DEFAULT_TABS: ViewTab[] = [
  {
    id: TAB_ID,
    label: "All items",
    viewType: "table",
    icon: "fa-table",
    filterId: "all",
  },
]

type BannerState =
  | { kind: "success"; title: string; body: string }
  | { kind: "error"; title: string; body: string }
  | null

export function DeliveryTrackerClient() {
  const dashboardHref = useProductDashboardHref()
  const { product, customProducts, activeCustomIndex } = useProduct()
  const persistKey = productPersistKey(
    product,
    HUB_KEY,
    customProducts,
    activeCustomIndex,
  )
  const mod = useModKeyLabel()
  const alt = useAltKeyLabel()

  const [overlay, setOverlay] = React.useState<DeliveryOverlayBundle>(() =>
    loadDeliveryOverlay(persistKey),
  )
  const [editRow, setEditRow] = React.useState<DeliveryTrackerRow | null>(null)
  const [editOpen, setEditOpen] = React.useState(false)
  const [exportOpen, setExportOpen] = React.useState(false)
  const [banner, setBanner] = React.useState<BannerState>(null)
  const importInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    setOverlay(loadDeliveryOverlay(persistKey))
  }, [persistKey])

  const commitOverlay = React.useCallback(
    (next: DeliveryOverlayBundle) => {
      setOverlay(next)
      saveDeliveryOverlay(persistKey, next)
    },
    [persistKey],
  )

  const rows = React.useMemo(
    () => buildDeliveryTrackerRows(overlay),
    [overlay],
  )
  const metrics = React.useMemo(() => deliveryTrackerKpiMetrics(rows), [rows])

  const onDeliveryChange = React.useCallback(
    (row: DeliveryTrackerRow, next: UiDeliveryStatus) => {
      commitOverlay(
        patchDeliveryOverlay(overlay, row.id, { delivery: next }),
      )
    },
    [commitOverlay, overlay],
  )

  const onMarkDelivered = React.useCallback(
    (row: DeliveryTrackerRow) => {
      commitOverlay(
        patchDeliveryOverlay(overlay, row.id, { delivery: "delivered" }),
      )
    },
    [commitOverlay, overlay],
  )

  const onEdit = React.useCallback((row: DeliveryTrackerRow) => {
    setEditRow(row)
    setEditOpen(true)
  }, [])

  const columns = React.useMemo(
    () =>
      buildDeliveryTrackerColumns({
        rows,
        onDeliveryChange,
        onEdit,
        onMarkDelivered,
      }),
    [rows, onDeliveryChange, onEdit, onMarkDelivered],
  )

  const handleSaveEdit = React.useCallback(
    (values: {
      delivery: UiDeliveryStatus
      comment: string
      storybookUrl: string
    }) => {
      if (!editRow) return
      commitOverlay(
        patchDeliveryOverlay(overlay, editRow.id, values),
      )
      setBanner({
        kind: "success",
        title: "Delivery updated",
        body: `${editRow.name} saved on this device.`,
      })
    },
    [commitOverlay, editRow, overlay],
  )

  const handleBulkMarkDelivered = React.useCallback(
    (selected: DeliveryTrackerRow[]) => {
      if (selected.length === 0) return
      commitOverlay(
        patchDeliveryOverlayMany(
          overlay,
          selected.map(r => r.id),
          { delivery: "delivered" },
        ),
      )
      setBanner({
        kind: "success",
        title: "Marked delivered",
        body: `${selected.length} item${selected.length === 1 ? "" : "s"} marked delivered.`,
      })
    },
    [commitOverlay, overlay],
  )

  const handleCopySummary = React.useCallback(async () => {
    const text = formatDeliveryShareSummary(rows)
    try {
      await navigator.clipboard.writeText(text)
      setBanner({
        kind: "success",
        title: "Summary copied",
        body: "Paste into Slack or a PR description to share with the team.",
      })
    } catch {
      setBanner({
        kind: "error",
        title: "Copy failed",
        body: "Clipboard access was blocked. Export JSON instead.",
      })
    }
  }, [rows])

  const handleExportJson = React.useCallback(() => {
    const json = exportDeliveryOverlayJson(persistKey, overlay)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `exxat-delivery-overlay-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setBanner({
      kind: "success",
      title: "Overlay exported",
      body: "Share the JSON file so teammates can import the same delivery marks.",
    })
  }, [overlay, persistKey])

  const handleImportFile = React.useCallback(
    (file: File | undefined) => {
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        const text = typeof reader.result === "string" ? reader.result : ""
        const parsed = parseDeliveryOverlayImport(text)
        if (!parsed) {
          setBanner({
            kind: "error",
            title: "Import failed",
            body: "That file is not a valid delivery overlay export.",
          })
          return
        }
        commitOverlay(parsed)
        setBanner({
          kind: "success",
          title: "Overlay imported",
          body: `${Object.keys(parsed.bySlug).length} delivery marks loaded.`,
        })
      }
      reader.readAsText(file)
    },
    [commitOverlay],
  )

  const subtitle = `${rows.length} package items · Local overlay`

  return (
    <PrimaryPageTemplate
      siteHeader={{
        breadcrumbs: [{ label: "Dashboard", href: dashboardHref }],
        title: "Delivery",
      }}
    >
      <ListPageTemplate
        defaultTabs={DEFAULT_TABS}
        supportedViewTypes={["table"]}
        getTabCount={() => rows.length}
        exportOpen={exportOpen}
        onExportOpenChange={setExportOpen}
        exportTotalRows={rows.length}
        header={
          <PageHeader
            title="Delivery"
            subtitle={subtitle}
            actions={
              <div className="flex items-center gap-2">
                <Tip side="bottom" label="Copy team summary">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void handleCopySummary()}
                  >
                    Copy summary
                    <KbdGroup className="ml-1.5">
                      <Kbd variant="bare">{`${mod}${alt}C`}</Kbd>
                    </KbdGroup>
                  </Button>
                </Tip>
                <Shortcut keys={`${mod}${alt}C`} onInvoke={() => void handleCopySummary()} />
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
                    <DropdownMenuItem
                      shortcut={`${mod}${alt}E`}
                      onSelect={() => setExportOpen(true)}
                    >
                      <i className="fa-light fa-arrow-down-to-line" aria-hidden="true" />
                      Export
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={handleExportJson}>
                      <i className="fa-light fa-file-export" aria-hidden="true" />
                      Export overlay JSON
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      shortcut={`${mod}${alt}I`}
                      onSelect={() => importInputRef.current?.click()}
                    >
                      <i className="fa-light fa-arrow-up-from-line" aria-hidden="true" />
                      Import overlay JSON
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Shortcut keys={`${mod}${alt}E`} onInvoke={() => setExportOpen(true)} />
                <Shortcut
                  keys={`${mod}${alt}I`}
                  onInvoke={() => importInputRef.current?.click()}
                />
                <input
                  ref={importInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="sr-only"
                  aria-label="Import delivery overlay JSON"
                  onChange={e => {
                    handleImportFile(e.target.files?.[0])
                    e.target.value = ""
                  }}
                />
              </div>
            }
          />
        }
        metrics={
          <div className="flex flex-col gap-3">
            {banner ? (
              <div className="px-4 lg:px-6">
                <LocalBanner
                  variant={banner.kind === "success" ? "success" : "error"}
                  title={banner.title}
                  dismissible
                  onDismiss={() => setBanner(null)}
                >
                  {banner.body}
                </LocalBanner>
              </div>
            ) : null}
            <KeyMetrics
              variant="flat"
              size="sm"
              metrics={metrics}
              showHeader={false}
              metricsSingleRow
            />
          </div>
        }
        renderContent={() => (
          <HubTable<DeliveryTrackerRow>
            rows={rows}
            columns={columns}
            view="table"
            hubLabel="Delivery"
            lifecycleTabLabel="All items"
            searchAriaLabel="Search package items"
            getRowId={row => row.id}
            getRowSelectionLabel={row => row.name}
            defaultSort={{ key: "name", dir: "asc" }}
            emptyState="No package items in the registry for this filter."
            renderers={{}}
            supportedViewTypes={["table"]}
            persistKey={persistKey}
            selectable
            pagination
            paginationInitialPageSize={25}
            bulkActions={[
              {
                id: "mark-delivered",
                label: "Mark delivered",
                icon: "fa-circle-check",
                shortcut: `${mod}${alt}D`,
                onSelect: handleBulkMarkDelivered,
              },
            ]}
          />
        )}
      />
      <DeliveryTrackerEditSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        row={editRow}
        onSave={handleSaveEdit}
      />
    </PrimaryPageTemplate>
  )
}
