import * as React from "react"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"
import { cn } from "../ui/utils"
import { SimpleMetric, type SimpleMetricData } from "./simple-metric"
import FilterBar, { type ActiveFilter, type FilterConfig } from "./filter-bar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { ViewManager, type ViewSettings } from "./view-manager"
import { OutlineSearchInput } from "../ui/outline-search-input"
import { TableProperties } from "./table-properties"
import { FontAwesomeIcon, type IconName } from "../brand/font-awesome-icon"
import type { ColumnConfig } from "./data-table"

// Re-export common types for convenience when building primary pages
export type { SimpleMetricData } from "./simple-metric"
export type { ActiveFilter, FilterConfig } from "./filter-bar"
export type { ColumnConfig } from "./data-table"
export type { ViewSettings } from "./view-manager"
export type { PaginationInfo } from "./data-table"

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ViewConfig {
  name: string
  count: string
  id: string
  type: string
  settings: ViewSettings | null
  icon?: React.ReactNode
}

export type SimpleMetricVariant = import("./simple-metric").SimpleMetricVariant

export interface PrimaryPageMetricsConfig {
  data: SimpleMetricData[]
  onMetricClick?: (index: number) => void
  /** Number of columns in the metric grid. Defaults to data.length or 4. */
  columns?: number
  /**
   * Optional banner rendered to the right of the metrics grid.
   * Typically an ActionCard with a contextual insight or CTA.
   */
  banner?: React.ReactNode
  /** Variant for metrics: "compact" uses smaller numbers for inside pages. Default: "compact" */
  variant?: SimpleMetricVariant
}

export interface PrimaryPageFilterConfig {
  showFilters: boolean
  onToggleFilters: () => void
  filterConfigs: FilterConfig[]
  activeFilters: ActiveFilter[]
  onAddFilter: (filterKey: string) => void
  onToggleFilterValue: (filterId: string, value: string) => void
  onRemoveFilter: (filterId: string) => void
  onClearAllFilters: () => void
  hasActiveFilterValues: boolean
}

export interface PrimaryPageTablePropertiesConfig {
  columns: ColumnConfig[]
  onColumnChange: (columns: ColumnConfig[]) => void
  filters?: any[]
  onFiltersChange?: (filters: any[]) => void
  sorts?: any[]
  onSortsChange?: (sorts: any[]) => void
  groupBy?: any
  onGroupByChange?: (groupBy: any) => void
}

export interface PrimaryPageBulkAction {
  label: string
  icon: IconName
  onClick: () => void
  variant: "default" | "secondary" | "outline" | "destructive"
}

export interface PrimaryPageTemplateProps {
  /** Page title displayed in the header */
  title: string
  /** Page description displayed below the title */
  description: string

  /** Metrics configuration for the key metrics section */
  metrics?: PrimaryPageMetricsConfig

  /** View/tab configuration */
  views: ViewConfig[]
  activeTab: string
  onTabChange: (tab: string) => void
  onAddView?: (viewName: string, viewSettings: ViewSettings) => void

  /** Search configuration */
  searchPlaceholder?: string
  searchQuery: string
  onSearchChange: (query: string) => void

  /** Filter bar configuration */
  filters: PrimaryPageFilterConfig

  /** Table properties configuration */
  tableProperties?: PrimaryPageTablePropertiesConfig

  /** Render function for tab content — receives the active tab id */
  renderTabContent: (tabId: string) => React.ReactNode

  /** Selected items for bulk actions */
  selectedItems?: string[]
  onClearSelection?: () => void
  bulkActions?: PrimaryPageBulkAction[]

  /** Optional elements rendered to the right of the page title */
  headerActions?: React.ReactNode

  /** Optional elements rendered between metrics and toolbar */
  afterMetrics?: React.ReactNode

  /** Whether the key metrics section is visible. Omit for uncontrolled (default: true) */
  showMetrics?: boolean
  /** Callback when user toggles metrics visibility. Pass with showMetrics for controlled mode. */
  onMetricsVisibilityChange?: (visible: boolean) => void

  /**
   * When true, the entire page (header, metrics, tabs, content) scrolls as one unit.
   * Use for content-heavy pages (e.g. Reports with dashboard-style sections).
   * When false (default), only the tab content area scrolls; header/metrics/toolbar stay fixed.
   */
  fullPageScroll?: boolean

  /** Additional class names on the root container */
  className?: string
}

// ─── Component ──────────────────────────────────────────────────────────────

export function PrimaryPageTemplate({
  title,
  description,
  metrics,
  views,
  activeTab,
  onTabChange,
  onAddView,
  searchPlaceholder = "Search...",
  searchQuery,
  onSearchChange,
  filters,
  tableProperties,
  renderTabContent,
  selectedItems = [],
  onClearSelection,
  bulkActions,
  headerActions,
  afterMetrics,
  showMetrics,
  onMetricsVisibilityChange,
  fullPageScroll = false,
  className,
}: PrimaryPageTemplateProps) {
  // Tailwind can't detect dynamic class names, so we map explicitly
  const gridColsMap: Record<number, string> = {
    1: "md:grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
    5: "md:grid-cols-5",
    6: "md:grid-cols-6",
  }

  const metricColCount = metrics?.columns ?? Math.min(metrics?.data.length ?? 4, 4)
  const gridColsClass = gridColsMap[metricColCount] ?? "md:grid-cols-4"
  const metricVariant = metrics?.variant ?? "compact"

  const [internalShowMetrics, setInternalShowMetrics] = React.useState(true)
  const isControlled = showMetrics !== undefined
  const metricsVisible = isControlled ? showMetrics : internalShowMetrics

  const handleToggleMetrics = () => {
    const next = !metricsVisible
    if (isControlled) {
      onMetricsVisibilityChange?.(next)
    } else {
      setInternalShowMetrics(next)
      onMetricsVisibilityChange?.(next)
    }
  }

  const pageContent = (
    <>
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex-none px-4 lg:px-6 pt-4 lg:pt-6 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title-sm">
              {title}
            </h1>
            <p className="text-muted-foreground mt-1">{description}</p>
          </div>
          <div className="flex items-center gap-2">
            {metrics && metrics.data.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={handleToggleMetrics}
                aria-pressed={metricsVisible}
                aria-label={metricsVisible ? "Hide key metrics" : "Show key metrics"}
              >
                <FontAwesomeIcon
                  name={metricsVisible ? "eye" : "eyeOff"}
                  className="h-3.5 w-3.5"
                />
                <span className="text-xs font-medium">
                  {metricsVisible ? "Hide metrics" : "Show metrics"}
                </span>
              </Button>
            )}
            {headerActions}
          </div>
        </div>
      </div>

      {/* ── Key Metrics Section ────────────────────────────────────── */}
      {metrics && metrics.data.length > 0 && (
        <div className="relative">
          {metricsVisible && (
            <>
              {/* Gradient Background */}
              <div
                data-slot="brand-gradient"
                className="absolute inset-0 pointer-events-none"
                aria-hidden
                style={{ background: "linear-gradient(to top, color-mix(in oklch, var(--brand-color) 8%, transparent), transparent)" }}
              />

              <div className="relative overflow-x-auto">
                {/* Metrics + Banner row */}
                <div className={cn(
                  "px-4 lg:px-6 pb-8",
                  metrics.banner ? "flex items-center gap-6 min-w-max" : ""
                )}>
                  {/* Metrics grid */}
                  <div
                    className={cn(
                      "grid grid-cols-1 gap-6 flex-1 min-w-0",
                      gridColsClass
                    )}
                  >
                    {metrics.data.map((metric, index) => (
                      <SimpleMetric
                        key={`metric-${index}`}
                        data={metric}
                        variant={metricVariant}
                        className={cn(
                          metrics.onMetricClick &&
                            "cursor-pointer transition-colors hover:bg-accent/50",
                          index < metrics.data.length - 1 &&
                            "md:border-r border-border md:pr-6"
                        )}
                        onClick={
                          metrics.onMetricClick
                            ? () => metrics.onMetricClick!(index)
                            : undefined
                        }
                      />
                    ))}
                  </div>

                  {/* Banner card (optional, rendered to the right) */}
                  {metrics.banner && (
                    <div className="hidden lg:block w-[340px] flex-shrink-0 py-1">
                      {metrics.banner}
                    </div>
                  )}
                </div>

                {/* Separator */}
                <div className="h-px bg-border" />
              </div>
            </>
          )}
        </div>
      )}

      {/* ── After-Metrics Slot ─────────────────────────────────────── */}
      {afterMetrics}

      {/* ── Tabs + Content Container ───────────────────────────────── */}
      <div
        className={cn(
          "flex flex-col rounded-lg min-w-0",
          fullPageScroll ? "" : "flex-1 min-h-0 overflow-x-auto overflow-y-hidden"
        )}
      >
        {/* Toolbar */}
        <div className="flex-none overflow-x-auto p-4">
          <div className="flex items-center justify-between gap-4 min-w-max">
          {/* Left: Tabs + ViewManager "+" pinned right after last tab */}
          <div className="flex items-center min-w-0 flex-1">
            <div className="overflow-x-auto min-w-0 flex-1 scrollbar-none">
              <div className="flex items-center gap-0 w-max">
                <Tabs value={activeTab} onValueChange={onTabChange}>
                  <TabsList className="flex-nowrap w-max">
                    {views.map((view) => (
                      <TabsTrigger key={view.id} value={view.id} className="flex-shrink-0">
                        <div className="flex items-center gap-2">
                          {view.icon}
                          <span>{view.name}</span>
                          <Badge variant="secondary" className="h-4 px-1.5">
                            {view.count}
                          </Badge>
                        </div>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
                {onAddView && (
                  <div className="flex-shrink-0 ml-1">
                    <ViewManager onAddView={onAddView} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Search + Filter + TableProperties — fixed, never collapses */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <OutlineSearchInput
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-8 w-64"
              expandable
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={
                    filters.showFilters || filters.hasActiveFilterValues
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={filters.onToggleFilters}
                  aria-label={filters.showFilters ? "Hide filters" : "Show filters"}
                >
                  <FontAwesomeIcon name="filter" className="h-4 w-4" aria-hidden />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{filters.showFilters ? "Hide filters" : "Show filters"}</TooltipContent>
            </Tooltip>
            {tableProperties && (
              <TableProperties
                columns={tableProperties.columns}
                onColumnChange={tableProperties.onColumnChange}
                filters={tableProperties.filters ?? []}
                onFiltersChange={tableProperties.onFiltersChange ?? (() => {})}
                sorts={tableProperties.sorts ?? []}
                onSortsChange={tableProperties.onSortsChange ?? (() => {})}
                groupBy={tableProperties.groupBy ?? null}
                onGroupByChange={tableProperties.onGroupByChange ?? (() => {})}
              />
            )}
          </div>
          </div>
        </div>

        {/* Filter Bar */}
        {filters.showFilters && (
          <div className="flex-none overflow-x-auto">
            <FilterBar
              filterConfigs={filters.filterConfigs}
              activeFilters={filters.activeFilters}
              onAddFilter={filters.onAddFilter}
              onToggleFilterValue={filters.onToggleFilterValue}
              onRemoveFilter={filters.onRemoveFilter}
              onClearAll={filters.onClearAllFilters}
            />
          </div>
        )}

        {/* Tab Content */}
        <div
          className={cn(
            "flex flex-col min-w-0 w-full",
            fullPageScroll ? "" : "flex-1 min-h-0"
          )}
        >
          <Tabs value={activeTab} onValueChange={onTabChange} className={cn("min-w-0 w-full", fullPageScroll ? "flex flex-col" : "flex-1 min-h-0 flex flex-col")}>
            {views.map((view) => (
              <TabsContent
                key={view.id}
                value={view.id}
                className={cn("m-0 min-w-0", fullPageScroll ? "" : "flex-1 min-h-0 flex flex-col")}
              >
                {renderTabContent(view.id)}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </>
  )

  return (
    <div
      className={cn(
        "primary-page-container flex flex-col flex-1 min-h-0 min-w-0 w-full overflow-hidden",
        className
      )}
    >
      {fullPageScroll ? (
        <div className="flex-1 min-h-0 overflow-auto pb-6">
          {pageContent}
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0 min-w-0 overflow-x-auto overflow-y-hidden">
          {pageContent}
        </div>
      )}

      {/* ── Floating Bulk Action Bar ───────────────────────────────── */}
      {selectedItems.length > 0 && bulkActions && onClearSelection && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-3 rounded-md border border-border bg-background px-4 py-2 shadow-lg">
            <span className="text-sm font-medium text-foreground">
              {selectedItems.length} selected
            </span>
            <div className="h-4 w-px bg-border" />
            {bulkActions.map((action, idx) => (
              <Button
                key={idx}
                variant={action.variant}
                size="sm"
                className="h-7"
                onClick={action.onClick}
              >
                <FontAwesomeIcon name={action.icon} className="h-3.5 w-3.5 mr-1" />
                {action.label}
              </Button>
            ))}
            <div className="h-4 w-px bg-border" />
            <Button
              variant="ghost"
              size="sm"
              className="h-7"
              onClick={onClearSelection}
            >
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
