import * as React from "react"
import {
  Activity,
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  MoreHorizontal,
  XCircle,
} from "lucide-react"

import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { DataTable, type ColumnConfig, autoSuggestColumnPinning } from "../shared/data-table"
import { type PaginationInfo } from "../shared/pagination"
import { type ActiveFilter, type FilterConfig } from "../shared/filter-bar"
import { type ViewSettings } from "../shared/view-manager"
import { createSimpleMetricData } from "../shared/simple-metric"
import { InsightCard, createInsightCardData } from "../shared/insight-card"
import { slotsData as availabilityData } from "../../data/mock-data"
import { FontAwesomeIcon } from "../brand/font-awesome-icon"
import { cn } from "../ui/utils"
import {
  PrimaryPageTemplate,
  type ViewConfig,
  type PrimaryPageFilterConfig,
  type PrimaryPageTablePropertiesConfig,
  type PrimaryPageBulkAction,
} from "../shared/primary-page-template"

// ─── Tab icons ──────────────────────────────────────────────────────────────

const TAB_ICONS: Record<string, React.ReactNode> = {
  requested: <FontAwesomeIcon name="clock" className="h-4 w-4" />,
  "pending-review": <FontAwesomeIcon name="eye" className="h-4 w-4" />,
  confirmed: <FontAwesomeIcon name="checkCircle" className="h-4 w-4" />,
}

// ─── Column definitions ─────────────────────────────────────────────────────

const requestedColumns: ColumnConfig[] = autoSuggestColumnPinning([
  { key: "select", label: "Select", icon: "checkCircle", isPinned: false, isVisible: true, width: 60, minWidth: 60 },
  { key: "siteName", label: "Site Name", icon: "mapPin", isPinned: false, isVisible: true, width: 280, minWidth: 200, sortable: true, filterable: true, groupable: true },
  { key: "experienceType", label: "Experience Type", icon: "users", isPinned: false, isVisible: true, width: 140, minWidth: 120, sortable: true, filterable: true, groupable: true, options: ["Individual", "Group"] },
  { key: "discipline", label: "Discipline/Specialization", icon: "bookOpen", isPinned: false, isVisible: true, width: 220, minWidth: 180, sortable: true, filterable: true, groupable: true },
  { key: "shiftAndDays", label: "Shift & Days", icon: "clock", isPinned: false, isVisible: true, width: 220, minWidth: 180, sortable: true },
  { key: "requestedDuration", label: "Requested Duration", icon: "calendar", isPinned: false, isVisible: true, width: 200, minWidth: 180, sortable: true },
  { key: "slots", label: "Slots", icon: "user", isPinned: false, isVisible: true, width: 180, minWidth: 160, sortable: true },
  { key: "dateOfRequest", label: "Date of Request", icon: "calendar", isPinned: false, isVisible: true, width: 140, minWidth: 120, sortable: true },
  { key: "pendingDuration", label: "Pending Duration", icon: "clock", isPinned: false, isVisible: true, width: 140, minWidth: 120, sortable: true },
  { key: "status", label: "Status", icon: "alertCircle", isPinned: false, isVisible: true, width: 140, minWidth: 120, sortable: true, filterable: true, groupable: true, options: ["Request Pending", "Approved"] },
  { key: "actions", label: "Actions", icon: "activity", isPinned: false, isVisible: true, width: 80, minWidth: 80 },
])

const approvedColumns: ColumnConfig[] = autoSuggestColumnPinning([
  { key: "select", label: "Select", icon: "checkCircle", isPinned: false, isVisible: true, width: 60, minWidth: 60 },
  { key: "name", label: "Confirmed Slot", icon: "doorOpen", isPinned: false, isVisible: true, width: 300, minWidth: 200, sortable: true, filterable: true, groupable: true },
  { key: "experienceType", label: "Experience Type", icon: "users", isPinned: false, isVisible: true, width: 140, minWidth: 120, sortable: true, filterable: true, groupable: true },
  { key: "location", label: "Location", icon: "mapPin", isPinned: false, isVisible: true, width: 160, minWidth: 140, sortable: true, filterable: true, groupable: true },
  { key: "discipline", label: "Discipline", icon: "activity", isPinned: false, isVisible: true, width: 160, minWidth: 150, sortable: true, filterable: true, groupable: true },
  { key: "schedule", label: "Duration", icon: "calendar", isPinned: false, isVisible: true, width: 180, minWidth: 160, sortable: true },
  { key: "slots", label: "Slots", icon: "userCheck", isPinned: false, isVisible: true, width: 180, minWidth: 160, sortable: true },
  { key: "lastRequested", label: "Confirmed Date", icon: "checkCircle", isPinned: false, isVisible: true, width: 140, minWidth: 120, sortable: true },
  { key: "actions", label: "Actions", icon: "activity", isPinned: false, isVisible: true, width: 80, minWidth: 80 },
])

function getColumnsForTab(tab: string): ColumnConfig[] {
  switch (tab) {
    case "requested": case "pending-review": return requestedColumns
    case "confirmed": return approvedColumns
    default: return requestedColumns
  }
}

const bulkActionDefs = [
  { label: "Approve Selected", icon: "checkCircle" as const, action: "approve", variant: "default" as const },
  { label: "Reject Selected", icon: "circleXmark" as const, action: "reject", variant: "default" as const },
]

interface SlotsPageProps { onItemClick?: (itemId: string) => void }

export function SlotsPage({ onItemClick }: SlotsPageProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [activeTab, setActiveTab] = React.useState("requested")
  const [selectedItems, setSelectedItems] = React.useState<string[]>([])
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(25)
  const [showFilters, setShowFilters] = React.useState(false)
  const [activeFilters, setActiveFilters] = React.useState<ActiveFilter[]>([])

  const deferredSearchQuery = React.useDeferredValue(searchQuery)
  const [, startTabTransition] = React.useTransition()
  const handleTabChange = React.useCallback((tab: string) => {
    startTabTransition(() => { setActiveTab(tab); setCurrentPage(1); setSelectedItems([]) })
  }, [])

  const [views, setViews] = React.useState<ViewConfig[]>([
    { name: "Requested", count: "48", id: "requested", type: "table", settings: null, icon: TAB_ICONS["requested"] },
    { name: "Pending Review", count: "17", id: "pending-review", type: "table", settings: null, icon: TAB_ICONS["pending-review"] },
    { name: "Confirmed", count: "124", id: "confirmed", type: "table", settings: null, icon: TAB_ICONS["confirmed"] },
  ])

  const [columns, setColumns] = React.useState<ColumnConfig[]>(getColumnsForTab("requested"))
  const [tableFilters, setTableFilters] = React.useState<any[]>([])
  const [tableSorts, setTableSorts] = React.useState<any[]>([])
  const [tableGroupBy, setTableGroupBy] = React.useState<any>(null)

  React.useEffect(() => { setColumns(getColumnsForTab(activeTab)) }, [activeTab])
  const activeView = views.find((v) => v.id === activeTab)
  React.useEffect(() => { if (activeView?.settings?.columns) setColumns(activeView.settings.columns as ColumnConfig[]) }, [activeView])

  const requestedData = React.useMemo(() => availabilityData.filter((item) => item.isNewRequest), [])
  const pendingReviewData = React.useMemo(() => availabilityData.filter((item) => !item.isNewRequest && item.hasRecentRequest), [])
  const confirmedData = React.useMemo(() => availabilityData.filter((item) => !item.isNewRequest && !item.hasRecentRequest), [])

  const computedMetrics = React.useMemo(() => {
    const totalSlots = availabilityData.length
    const pendingRequests = requestedData.length
    const pendingReviews = pendingReviewData.length
    const confirmationRate = confirmedData.length > 0 ? Math.round((confirmedData.length / totalSlots) * 100) : 0
    return [
      createSimpleMetricData("Total Slots", String(totalSlots), { trend: "up", trendValue: "+18" }),
      createSimpleMetricData("New Requests", String(pendingRequests), { trend: pendingRequests > 10 ? "up" : "down", trendValue: pendingRequests > 10 ? `+${pendingRequests - 10}` : `-${10 - pendingRequests}` }),
      createSimpleMetricData("Pending Review", String(pendingReviews), { trend: pendingReviews > 10 ? "up" : "down", trendValue: pendingReviews > 10 ? `+${pendingReviews - 10}` : `-${10 - pendingReviews}` }),
      createSimpleMetricData("Confirmation Rate", `${confirmationRate}%`, { trend: confirmationRate >= 60 ? "up" : "down", trendValue: confirmationRate >= 60 ? "+3" : "-2" }),
    ]
  }, [requestedData, pendingReviewData, confirmedData])

  const isRequestedTab = activeTab === "requested" || activeTab === "pending-review"

  const filteredData = React.useMemo(() => {
    let data: typeof availabilityData
    if (activeTab === "requested") data = requestedData
    else if (activeTab === "pending-review") data = pendingReviewData
    else if (activeTab === "confirmed") data = confirmedData
    else data = requestedData
    activeFilters.forEach((filter) => { if (filter.values.length > 0) data = data.filter((item) => filter.values.includes(item[filter.key as keyof typeof item] as string)) })
    tableFilters.forEach((filter) => { if (filter.values.length > 0) data = data.filter((item) => filter.values.includes(item[filter.columnKey as keyof typeof item] as string)) })
    if (deferredSearchQuery.trim()) {
      const q = deferredSearchQuery.toLowerCase()
      data = data.filter((item) => item.name.toLowerCase().includes(q) || item.location.toLowerCase().includes(q) || item.discipline.toLowerCase().includes(q) || item.specialization.toLowerCase().includes(q))
    }
    if (tableSorts.length > 0) {
      data = [...data].sort((a, b) => {
        for (const sort of tableSorts) {
          const aVal = a[sort.columnKey as keyof typeof a]; const bVal = b[sort.columnKey as keyof typeof b]
          let cmp = 0; if (aVal! < bVal!) cmp = -1; if (aVal! > bVal!) cmp = 1; if (sort.direction === "desc") cmp *= -1; if (cmp !== 0) return cmp
        }
        return 0
      })
    }
    return data
  }, [activeTab, requestedData, pendingReviewData, confirmedData, activeFilters, tableFilters, deferredSearchQuery, tableSorts])

  const paginationInfo: PaginationInfo = React.useMemo(() => {
    const totalItems = filteredData.length; const totalPages = Math.ceil(totalItems / pageSize)
    const startItem = (currentPage - 1) * pageSize + 1; const endItem = Math.min(currentPage * pageSize, totalItems)
    return { currentPage, totalPages, pageSize, totalItems, startItem, endItem }
  }, [filteredData.length, currentPage, pageSize])

  const currentData = React.useMemo(() => { const start = (currentPage - 1) * pageSize; return filteredData.slice(start, start + pageSize) }, [filteredData, currentPage, pageSize])

  const filterConfigs: FilterConfig[] = React.useMemo(() => [
    { key: "location", label: "Location", icon: "mapPin", options: Array.from(new Set(availabilityData.map((i) => i.location))).sort() },
    { key: "discipline", label: "Discipline", icon: "bookOpen", options: Array.from(new Set(availabilityData.map((i) => i.discipline))).sort() },
    { key: "experienceType", label: "Experience Type", icon: "users", options: Array.from(new Set(availabilityData.map((i) => i.experienceType))).sort() },
  ], [])

  const handleAddFilter = React.useCallback((filterKey: string) => {
    if (activeFilters.find((f) => f.key === filterKey)) { setShowFilters(true); return }
    const newFilter: ActiveFilter = { id: `${filterKey}_${Date.now()}`, key: filterKey, label: filterConfigs.find((c) => c.key === filterKey)?.label || filterKey, values: [], removable: true }
    setActiveFilters((prev) => [...prev, newFilter]); setShowFilters(true)
  }, [activeFilters, filterConfigs])

  const handleToggleFilterValue = React.useCallback((filterId: string, value: string) => {
    setActiveFilters((prev) => prev.map((f) => { if (f.id === filterId) { const vals = f.values.includes(value) ? f.values.filter((v) => v !== value) : [...f.values, value]; return { ...f, values: vals } } return f }))
    setCurrentPage(1)
  }, [])

  const handleRemoveFilter = React.useCallback((filterId: string) => { setActiveFilters((prev) => prev.filter((f) => f.id !== filterId)); setCurrentPage(1) }, [])
  const handleClearAllFilters = React.useCallback(() => { setActiveFilters([]); setCurrentPage(1) }, [])
  const hasActiveFilterValues = activeFilters.some((f) => f.values.length > 0)

  const handleAddView = React.useCallback((viewName: string, viewSettings: ViewSettings) => {
    const newView: ViewConfig = { name: viewName, count: "0", id: `view_${Date.now()}`, type: viewSettings.type, settings: viewSettings }
    setViews((prev) => [...prev, newView]); setActiveTab(newView.id)
  }, [])

  const handleClearSelection = React.useCallback(() => setSelectedItems([]), [])

  const bulkActions: PrimaryPageBulkAction[] = React.useMemo(() => bulkActionDefs.map((a) => ({
    label: a.label, icon: a.icon,
    onClick: () => { setSelectedItems([]) },
    variant: a.variant,
  })), [selectedItems])

  const handleMetricClick = React.useCallback((index: number) => {
    if (index === 2) setActiveTab("pending-review")
    else if (index === 3) setActiveTab("confirmed")
    else setActiveTab("requested")
    setCurrentPage(1)
  }, [])

  const [showBanner, setShowBanner] = React.useState(true)

  const metricsBanner = showBanner ? (
    <InsightCard
      variant="compact"
      data={createInsightCardData("Review bottleneck detected", `${pendingReviewData.length} slots are pending review with an average wait of 4.2 days. Clearing these could improve confirmation rate by ~8%.`, "sparkles")}
      onClick={() => { setActiveTab("pending-review"); setCurrentPage(1) }}
    />
  ) : null

  const renderCell = React.useCallback(
    (column: ColumnConfig, item: any, _index: number) => {
      const getTextClass = (baseClass: string = "") => cn(baseClass, column.wrapText ? "break-words" : "truncate")
      if (isRequestedTab) {
        switch (column.key) {
          case "siteName":
            return (<div className="space-y-1 w-full overflow-hidden"><div className="flex items-center gap-2 min-w-0"><div className={cn("line-clamp-2 data-table-clickable min-w-0 flex-1 font-medium text-base", column.wrapText && "break-words")} role="button" tabIndex={0} onClick={() => onItemClick?.(item.id)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onItemClick?.(item.id); } }}>{item.location}</div></div><div className={`flex items-center gap-2 text-xs text-muted-foreground ${getTextClass()}`}><span>Request ID: {item.id}</span>{item.requestedBy === "school" && item.program && (<><span>•</span><span>{item.program} Program</span></>)}</div></div>)
          case "shiftAndDays":
            return (<div className="space-y-1 w-full overflow-hidden"><div className={getTextClass("font-medium text-base")}>Evening (13:00 - 17:00)</div><div className={getTextClass("text-xs text-muted-foreground")}>Mon, Wed, Fri</div></div>)
          case "requestedDuration":
            return (<div className="space-y-1 w-full overflow-hidden"><div className={getTextClass("font-medium text-base")}>{item.startDate} - {item.endDate}</div><div className="text-xs text-muted-foreground"><div className="flex items-center gap-1"><Calendar className="h-3 w-3 text-muted-foreground" />{item.duration}</div></div></div>)
          case "slots":
            return (<div className="space-y-1"><div className="font-medium text-base">{item.totalRequest || 5} Requested</div><div className="text-xs text-muted-foreground"><span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-chart-2" />{item.pendingReview || 2} confirmed</span></div></div>)
          case "dateOfRequest":
            return <div className="font-medium text-base">01/15/2026</div>
          case "pendingDuration":
            return <div className="font-medium text-base">{Math.floor(Math.random() * 10) + 1} days</div>
          case "status":
            return (<Badge variant={item.isNewRequest ? "default" : "secondary"} className={item.isNewRequest ? "bg-chart-4/10 text-chip-4 border-chip-4/40" : "bg-chart-2/10 text-chip-2 border-chip-2/40"}>{item.isNewRequest ? "Request Pending" : "Approved"}</Badge>)
          case "actions":
            return (<div className="flex items-center gap-1"><Button variant="ghost" size="sm" className="min-h-11 min-w-11 md:h-7 md:w-7 p-0 touch-manipulation" aria-label="Edit"><Edit className="h-4 w-4" aria-hidden="true" /></Button><Button variant="ghost" size="sm" className="min-h-11 min-w-11 md:h-7 md:w-7 p-0 touch-manipulation" aria-label="More actions"><MoreHorizontal className="h-4 w-4" aria-hidden="true" /></Button></div>)
        }
      }
      if (!isRequestedTab) {
        switch (column.key) {
          case "name":
            return (<div className="space-y-1 w-full overflow-hidden"><div className="flex items-center gap-2 min-w-0"><div className={cn("line-clamp-2 data-table-clickable min-w-0 flex-1 font-medium text-base", column.wrapText && "break-words")} role="button" tabIndex={0} onClick={() => onItemClick?.(item.id)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onItemClick?.(item.id); } }}>{item.name}</div></div><div className={getTextClass("text-xs text-muted-foreground")}>ID: {item.id}</div></div>)
          case "schedule":
            return (<div className="space-y-1 w-full overflow-hidden"><div className={getTextClass("font-medium text-base")}>{item.startDate} - {item.endDate}</div><div className="text-xs text-muted-foreground">{item.duration}</div></div>)
          case "slots":
            return (<div className="space-y-1"><div className="font-medium text-base">{item.totalRequest}/{item.totalSlots || 10} Assigned</div><div className="text-xs text-muted-foreground">{item.totalSlots && item.totalSlots - item.totalRequest > 0 ? (<span className="flex items-center gap-1"><AlertCircle className="h-3 w-3 text-chart-4" />{item.totalSlots - item.totalRequest} to assign</span>) : (<span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-chart-2" />Fully assigned</span>)}</div></div>)
          case "lastRequested":
            return (<div>{item.lastRequestTime ? (<div className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-chart-2" /><span className="text-foreground font-medium text-base">{item.lastRequestTime}</span></div>) : (<span className="text-muted-foreground">N/A</span>)}</div>)
          case "actions":
            return (<DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="min-h-11 min-w-11 md:h-7 md:w-7 p-0 touch-manipulation" aria-label="Open menu"><MoreHorizontal className="h-4 w-4" aria-hidden="true" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-48"><DropdownMenuItem onClick={() => onItemClick?.(item.id)}><Eye className="h-4 w-4 mr-2" />View Details</DropdownMenuItem><DropdownMenuItem><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem className="text-destructive"><XCircle className="h-4 w-4 mr-2" />Revoke Approval</DropdownMenuItem></DropdownMenuContent></DropdownMenu>)
        }
      }
      switch (column.key) {
        case "experienceType":
          return (<Badge variant="secondary" withIcon iconPosition="left" className="w-fit">{item.experienceType === "Group" ? <FontAwesomeIcon name="users" className="h-3 w-3" weight="light" /> : <FontAwesomeIcon name="user" className="h-3 w-3" weight="light" />}{item.experienceType}</Badge>)
        case "location":
          return <div className={getTextClass("w-full font-medium text-base")}>{item.location}</div>
        case "discipline":
          return (<div className="space-y-1 w-full overflow-hidden"><div className={getTextClass("font-medium text-base")}>{item.discipline}</div><div className={getTextClass("text-xs text-muted-foreground")}>{item.specialization}</div></div>)
        default:
          return <div className="font-medium text-base">{item[column.key]}</div>
      }
    },
    [isRequestedTab, onItemClick]
  )

  const getItemId = React.useCallback((item: any) => item.id, [])

  const filtersConfig: PrimaryPageFilterConfig = React.useMemo(() => ({
    showFilters, onToggleFilters: () => setShowFilters((p) => !p), filterConfigs, activeFilters,
    onAddFilter: handleAddFilter, onToggleFilterValue: handleToggleFilterValue,
    onRemoveFilter: handleRemoveFilter, onClearAllFilters: handleClearAllFilters, hasActiveFilterValues,
  }), [showFilters, filterConfigs, activeFilters, handleAddFilter, handleToggleFilterValue, handleRemoveFilter, handleClearAllFilters, hasActiveFilterValues])

  const tablePropertiesConfig: PrimaryPageTablePropertiesConfig = React.useMemo(() => ({
    columns, onColumnChange: setColumns, filters: tableFilters, onFiltersChange: setTableFilters,
    sorts: tableSorts, onSortsChange: setTableSorts, groupBy: tableGroupBy, onGroupByChange: setTableGroupBy,
  }), [columns, tableFilters, tableSorts, tableGroupBy])

  const renderTabContent = React.useCallback(
    (_tabId: string) => (
      <DataTable data={currentData} columns={columns} onColumnChange={setColumns} selectedItems={selectedItems}
        onSelectionChange={setSelectedItems} renderCell={renderCell} getItemId={getItemId} showSelection={true}
        paginationInfo={paginationInfo} onPageChange={setCurrentPage}
        onPageSizeChange={(newSize) => { setPageSize(newSize); setCurrentPage(1) }} onColumnFilter={handleAddFilter} />
    ),
    [currentData, columns, selectedItems, paginationInfo, renderCell, getItemId, handleAddFilter]
  )

  return (
    <PrimaryPageTemplate
      title="Slots" description="Track and manage slot requests, approvals, and assignments"
      metrics={{ data: computedMetrics, onMetricClick: handleMetricClick, columns: 4, banner: metricsBanner }}
      views={views} activeTab={activeTab} onTabChange={handleTabChange} onAddView={handleAddView}
      searchPlaceholder="Search slots..." searchQuery={searchQuery} onSearchChange={setSearchQuery}
      filters={filtersConfig} tableProperties={tablePropertiesConfig} renderTabContent={renderTabContent}
      selectedItems={selectedItems} onClearSelection={handleClearSelection} bulkActions={bulkActions}
      className="slots-page-container"
    />
  )
}