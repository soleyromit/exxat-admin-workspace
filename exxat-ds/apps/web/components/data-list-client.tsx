"use client"

/**
 * DataListClient — Placements page built on the reusable ListPageTemplate.
 *
 * Uses centralized exports from `@/components/data-views` (same pattern as Team / Compliance).
 */

import * as React from "react"
import { useRouter }   from "next/navigation"
import { useSidebar }  from "@/components/ui/sidebar"
import {
  ListPageTemplate,
  type ViewTab,
  DataListTable,
  type DataListTableHandle,
  type PlacementLifecycleTabId,
  type DataListViewType,
  dataListViewIcon,
} from "@/components/data-views"
import {
  emptyCopyForPlacementLifecycleTab,
  getPlacementColumnsForLifecycle,
  placementLifecycleDrawerLabels,
} from "@/components/placements-table-columns"
import { PlacementsPageHeader } from "@/components/placements-page-header"
import {
  DEFAULT_DATA_LIST_DISPLAY_OPTIONS,
  type DataListDisplayOptions,
} from "@/lib/data-list-display-options"
import { loadPageFromStorage, schedulePageSave } from "@/lib/data-list-persistence"
import { KeyMetrics }  from "@/components/key-metrics"
import { placementsForPhase } from "@/lib/mock/placements"
import { PLACEMENT_KPI_INSIGHT, PLACEMENT_KPI_METRICS } from "@/lib/mock/placements-kpi"
import { useAskLeoPageContext } from "@/components/ask-leo-sidebar"
import { CoachMark } from "@/components/ui/coach-mark"
import { useCoachMark, type CoachMarkStep } from "@/hooks/use-coach-mark"

// ─────────────────────────────────────────────────────────────────────────────
// Coach mark flow — Views & Properties tour
// ─────────────────────────────────────────────────────────────────────────────

const VIEWS_TOUR_STEPS: CoachMarkStep[] = [
  {
    id: "views-tabs",
    target: "[role='toolbar'][aria-label='Views']",
    side: "bottom",
    align: "start",
    title: "Switch Between Views",
    description:
      "Use these tabs to filter your placements by status — All, Upcoming, Ongoing, or Completed. Each view remembers its own settings.",
  },
  {
    id: "views-settings",
    target: "[aria-label='View settings']",
    side: "bottom",
    align: "start",
    title: "Customise Each View",
    description:
      "Click the dropdown arrow to rename, duplicate, or edit a view. Choose between Table, List, Board, or Dashboard layouts.",
  },
  {
    id: "views-add",
    target: "button:has(.fa-plus) + .fa-plus, [aria-label='Views'] ~ button",
    side: "bottom",
    align: "start",
    title: "Create New Views",
    description:
      "Add custom views with different layouts and filters. Create a Board view for visual tracking, or a Dashboard for charts and KPIs.",
  },
  {
    id: "views-search",
    target: "button[aria-label='Search']",
    side: "bottom",
    align: "end",
    title: "Quick Search",
    description:
      "Instantly search across all visible columns. Press ⌘K to open search from anywhere on the page.",
  },
  {
    id: "views-filter",
    target: "button[aria-label='Add filter']:last-of-type, button:has(.fa-filter-list)",
    side: "bottom",
    align: "end",
    title: "Filter Your Data",
    description:
      "Add filters to narrow down results. Combine multiple conditions — filter by status, date, site, program, and more.",
  },
  {
    id: "views-properties",
    target: "button[aria-label='Properties']",
    side: "bottom",
    align: "end",
    title: "Table Properties",
    description:
      "Open the Properties panel to manage columns, sort order, conditional formatting, density, and gridlines. Everything is saved per view.",
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_TABS: ViewTab[] = [
  { id: "all",       label: "All",       viewType: "table", icon: "fa-table",              filterId: "all"       },
  { id: "upcoming",  label: "Upcoming",  viewType: "table", icon: "fa-calendar-clock",     filterId: "upcoming"  },
  { id: "ongoing",   label: "Ongoing",   viewType: "table", icon: "fa-circle-half-stroke", filterId: "ongoing"   },
  { id: "completed", label: "Completed", viewType: "table", icon: "fa-circle-check",       filterId: "completed" },
]

const LIFECYCLE_OPTIONS = [
  { id: "all",       label: "All"       },
  { id: "upcoming",  label: "Upcoming"  },
  { id: "ongoing",   label: "Ongoing"   },
  { id: "completed", label: "Completed" },
]

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function DataListClient() {
  const router = useRouter()
  const { setOpen } = useSidebar()
  const [showMetrics, setShowMetrics] = React.useState(true)
  const [exportOpen, setExportOpen]   = React.useState(false)
  const [displayOptions, setDisplayOptions] = React.useState<DataListDisplayOptions>(DEFAULT_DATA_LIST_DISPLAY_OPTIONS)
  const [tabs, setTabs] = React.useState<ViewTab[]>(DEFAULT_TABS)
  const [activeTabId, setActiveTabId] = React.useState<string>(DEFAULT_TABS[0]?.id ?? "")
  const tableRef = React.useRef<DataListTableHandle>(null)

  const viewsTour = useCoachMark({
    flowId: "placements-views-tour",
    steps: VIEWS_TOUR_STEPS,
    delay: 1200,
  })

  const activeTab = tabs.find((t) => t.id === activeTabId)
  const placementCount = activeTab
    ? placementsForPhase(activeTab.filterId as PlacementLifecycleTabId).length
    : 0

  useAskLeoPageContext(
    React.useMemo(
      () => ({
        title: "Placements",
        description: activeTab
          ? `${placementCount} row${placementCount === 1 ? "" : "s"} in “${activeTab.label}” · ${activeTab.viewType} view.`
          : undefined,
        suggestions: [
          "Which placements end in the next 30 days?",
          "Summarize what’s in this view after my filters",
          "What columns should I add for site coordinators?",
        ],
      }),
      [activeTab, placementCount],
    ),
  )

  React.useLayoutEffect(() => {
    const p = loadPageFromStorage()
    if (!p) return
    setDisplayOptions(prev => ({ ...DEFAULT_DATA_LIST_DISPLAY_OPTIONS, ...p.displayOptions }))
    setShowMetrics(p.showMetrics)
    setTabs(p.tabs)
    const nextActive = p.tabs.some(t => t.id === p.activeTabId) ? p.activeTabId : (p.tabs[0]?.id ?? "")
    setActiveTabId(nextActive)
  }, [])

  React.useEffect(() => {
    schedulePageSave({
      v: 1,
      displayOptions,
      showMetrics,
      tabs,
      activeTabId,
    })
  }, [displayOptions, showMetrics, tabs, activeTabId])

  function handleNewPlacement() {
    setOpen(false)
    setTimeout(() => router.push("/data-list/new"), 260)
  }

  return (
    <>
    <CoachMark state={viewsTour} />
    <ListPageTemplate
      tabs={tabs}
      onTabsChange={setTabs}
      activeTabId={activeTabId}
      onActiveTabChange={setActiveTabId}
      tablePropertiesRef={tableRef}
      header={
        <PlacementsPageHeader
          onNewPlacement={handleNewPlacement}
          onExport={() => setExportOpen(true)}
          showMetrics={showMetrics}
          onToggleMetrics={() => setShowMetrics(v => !v)}
          showTitleBlock={displayOptions.showViewTitle}
        />
      }
      metrics={
        <KeyMetrics
          variant="flat"
          metrics={PLACEMENT_KPI_METRICS}
          insight={PLACEMENT_KPI_INSIGHT}
          showHeader={false}
          metricsSingleRow
        />
      }
      showMetrics={showMetrics}
      defaultTabs={DEFAULT_TABS}
      filterOptions={LIFECYCLE_OPTIONS}
      filterLabel="Filter lifecycle"
      getTabCount={(filterId) => placementsForPhase(filterId as PlacementLifecycleTabId).length}
      renderContent={(tab, updateTab) => (
        <DataListTable
          key={tab.id}
          ref={tableRef}
          view={tab.viewType}
          onViewChange={(v: DataListViewType) => updateTab({ viewType: v, icon: dataListViewIcon(v) })}
          lifecycleTabId={tab.filterId as PlacementLifecycleTabId}
          getColumnsForLifecycle={getPlacementColumnsForLifecycle}
          emptyTableCopy={emptyCopyForPlacementLifecycleTab(tab.filterId as PlacementLifecycleTabId)}
          lifecycleDrawerLabel={
            placementLifecycleDrawerLabels[tab.filterId as PlacementLifecycleTabId]
          }
          displayOptions={displayOptions}
          onDisplayOptionsChange={patch =>
            setDisplayOptions(prev => ({ ...prev, ...patch }))}
        />
      )}
      exportOpen={exportOpen}
      onExportOpenChange={setExportOpen}
    />
    </>
  )
}
