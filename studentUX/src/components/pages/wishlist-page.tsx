import * as React from "react"
import { cn } from "../ui/utils"
import { FontAwesomeIcon, type IconName } from "../brand/font-awesome-icon"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { DataTable, type ColumnConfig, autoSuggestColumnPinning } from "../shared/data-table"
import { type PaginationInfo } from "../shared/pagination"
import { type ActiveFilter, type FilterConfig } from "../shared/filter-bar"
import { type ViewSettings } from "../shared/view-manager"
import { createSimpleMetricData } from "../shared/simple-metric"
import { InsightCard, createInsightCardData } from "../shared/insight-card"
import {
  PrimaryPageTemplate, type ViewConfig, type PrimaryPageFilterConfig,
  type PrimaryPageTablePropertiesConfig, type PrimaryPageBulkAction,
} from "../shared/primary-page-template"

interface WishlistItem {
  id: string; name: string; specialization: string; rotationPeriod: string; startDate: string; endDate: string
  totalStudents: number; preferencesSubmitted: number; avgPreferencesPerStudent: number; matchRate: number
  status: "Collecting" | "In Review" | "Matching" | "Completed" | "Closed"
  priority: "High" | "Medium" | "Low"; createdDate: string; deadline: string
  topSites: string[]; createdBy: string; notes: string
}

const wishlistData: WishlistItem[] = [
  { id: "WL-001", name: "Spring 2026 Orthopedics Preferences", specialization: "Orthopedics", rotationPeriod: "Spring 2026", startDate: "03/15/2026", endDate: "05/10/2026", totalStudents: 24, preferencesSubmitted: 18, avgPreferencesPerStudent: 3.2, matchRate: 72, status: "Matching", priority: "High", createdDate: "01/05/2026", deadline: "02/28/2026", topSites: ["Mayo Clinic", "Cleveland Clinic", "Johns Hopkins"], createdBy: "Dr. Sarah Johnson", notes: "Priority cohort — graduation timeline" },
  { id: "WL-002", name: "Spring 2026 Neurology Preferences", specialization: "Neurology", rotationPeriod: "Spring 2026", startDate: "03/15/2026", endDate: "05/10/2026", totalStudents: 16, preferencesSubmitted: 16, avgPreferencesPerStudent: 2.8, matchRate: 88, status: "In Review", priority: "Medium", createdDate: "01/08/2026", deadline: "02/28/2026", topSites: ["Stanford Medical", "UCLA Medical", "UCSF"], createdBy: "Dr. Sarah Johnson", notes: "" },
  { id: "WL-003", name: "Summer 2026 Pediatrics Preferences", specialization: "Pediatrics", rotationPeriod: "Summer 2026", startDate: "06/01/2026", endDate: "08/15/2026", totalStudents: 20, preferencesSubmitted: 8, avgPreferencesPerStudent: 2.1, matchRate: 0, status: "Collecting", priority: "Medium", createdDate: "01/20/2026", deadline: "04/15/2026", topSites: ["Boston Children's", "Children's Hospital of Philadelphia"], createdBy: "Dr. Sarah Johnson", notes: "Early collection for summer cohort" },
  { id: "WL-004", name: "Spring 2026 Cardiology Preferences", specialization: "Cardiology", rotationPeriod: "Spring 2026", startDate: "03/01/2026", endDate: "04/30/2026", totalStudents: 12, preferencesSubmitted: 12, avgPreferencesPerStudent: 3.5, matchRate: 92, status: "Matching", priority: "High", createdDate: "12/15/2025", deadline: "02/15/2026", topSites: ["Mayo Clinic", "Cleveland Clinic", "Mass General"], createdBy: "Dr. Sarah Johnson", notes: "High demand specialization" },
  { id: "WL-005", name: "Summer 2026 Sports Medicine Preferences", specialization: "Sports Medicine", rotationPeriod: "Summer 2026", startDate: "06/15/2026", endDate: "08/30/2026", totalStudents: 10, preferencesSubmitted: 3, avgPreferencesPerStudent: 1.7, matchRate: 0, status: "Collecting", priority: "Low", createdDate: "02/01/2026", deadline: "05/01/2026", topSites: ["Andrews Institute", "Hospital for Special Surgery"], createdBy: "Dr. Sarah Johnson", notes: "" },
  { id: "WL-006", name: "Spring 2026 Geriatrics Preferences", specialization: "Geriatrics", rotationPeriod: "Spring 2026", startDate: "03/15/2026", endDate: "05/10/2026", totalStudents: 8, preferencesSubmitted: 8, avgPreferencesPerStudent: 2.5, matchRate: 75, status: "In Review", priority: "Medium", createdDate: "01/10/2026", deadline: "02/28/2026", topSites: ["Mount Sinai", "Johns Hopkins", "Duke Medical"], createdBy: "Dr. Sarah Johnson", notes: "" },
  { id: "WL-007", name: "Summer 2026 Acute Care Preferences", specialization: "Acute Care", rotationPeriod: "Summer 2026", startDate: "06/01/2026", endDate: "08/15/2026", totalStudents: 14, preferencesSubmitted: 6, avgPreferencesPerStudent: 2.3, matchRate: 0, status: "Collecting", priority: "Medium", createdDate: "01/25/2026", deadline: "04/30/2026", topSites: ["Cedars-Sinai", "NYU Langone", "Northwestern"], createdBy: "Dr. Sarah Johnson", notes: "New specialization track" },
  { id: "WL-100", name: "Fall 2025 Orthopedics Preferences", specialization: "Orthopedics", rotationPeriod: "Fall 2025", startDate: "09/01/2025", endDate: "11/15/2025", totalStudents: 22, preferencesSubmitted: 22, avgPreferencesPerStudent: 3.1, matchRate: 95, status: "Completed", priority: "High", createdDate: "06/10/2025", deadline: "08/01/2025", topSites: ["Mayo Clinic", "Cleveland Clinic", "Johns Hopkins"], createdBy: "Dr. Sarah Johnson", notes: "Successfully matched all students" },
  { id: "WL-101", name: "Fall 2025 Neurology Preferences", specialization: "Neurology", rotationPeriod: "Fall 2025", startDate: "09/01/2025", endDate: "11/15/2025", totalStudents: 14, preferencesSubmitted: 14, avgPreferencesPerStudent: 2.9, matchRate: 86, status: "Completed", priority: "Medium", createdDate: "06/15/2025", deadline: "08/01/2025", topSites: ["Stanford Medical", "UCLA Medical"], createdBy: "Dr. Sarah Johnson", notes: "2 students required reassignment" },
  { id: "WL-102", name: "Fall 2025 Pediatrics Preferences", specialization: "Pediatrics", rotationPeriod: "Fall 2025", startDate: "09/15/2025", endDate: "12/01/2025", totalStudents: 18, preferencesSubmitted: 18, avgPreferencesPerStudent: 3.4, matchRate: 100, status: "Completed", priority: "High", createdDate: "06/01/2025", deadline: "08/15/2025", topSites: ["Boston Children's", "Children's Hospital of Philadelphia", "Texas Children's"], createdBy: "Dr. Sarah Johnson", notes: "Best match rate this year" },
  { id: "WL-103", name: "Summer 2025 Cardiology Preferences", specialization: "Cardiology", rotationPeriod: "Summer 2025", startDate: "06/01/2025", endDate: "08/15/2025", totalStudents: 10, preferencesSubmitted: 10, avgPreferencesPerStudent: 2.6, matchRate: 80, status: "Closed", priority: "Medium", createdDate: "03/01/2025", deadline: "05/01/2025", topSites: ["Cleveland Clinic", "Mass General"], createdBy: "Dr. Sarah Johnson", notes: "Closed early due to limited slots" },
  { id: "WL-104", name: "Summer 2025 Geriatrics Preferences", specialization: "Geriatrics", rotationPeriod: "Summer 2025", startDate: "06/15/2025", endDate: "08/30/2025", totalStudents: 6, preferencesSubmitted: 6, avgPreferencesPerStudent: 2.0, matchRate: 67, status: "Closed", priority: "Low", createdDate: "03/15/2025", deadline: "05/15/2025", topSites: ["Mount Sinai", "Duke Medical"], createdBy: "Dr. Sarah Johnson", notes: "Low enrollment" },
]

const TAB_ICONS: Record<string, React.ReactNode> = { open: <FontAwesomeIcon name="heart" className="h-4 w-4" />, closed: <FontAwesomeIcon name="archive" className="h-4 w-4" /> }

const openColumns: ColumnConfig[] = autoSuggestColumnPinning([
  { key: "select", label: "Select", icon: "checkCircle", isPinned: false, isVisible: true, width: 60, minWidth: 60 },
  { key: "name", label: "Wishlist Name", icon: "heart", isPinned: false, isVisible: true, width: 300, minWidth: 220, sortable: true, filterable: true },
  { key: "specialization", label: "Specialization", icon: "graduation-cap", isPinned: false, isVisible: true, width: 160, minWidth: 140, sortable: true, filterable: true, groupable: true },
  { key: "rotationPeriod", label: "Rotation Period", icon: "calendar", isPinned: false, isVisible: true, width: 180, minWidth: 160, sortable: true },
  { key: "students", label: "Students", icon: "users", isPinned: false, isVisible: true, width: 180, minWidth: 160, sortable: true },
  { key: "matchRate", label: "Match Rate", icon: "percent", isPinned: false, isVisible: true, width: 140, minWidth: 120, sortable: true },
  { key: "priority", label: "Priority", icon: "star", isPinned: false, isVisible: true, width: 120, minWidth: 100, sortable: true, filterable: true, groupable: true, options: ["High", "Medium", "Low"] },
  { key: "deadline", label: "Deadline", icon: "clock", isPinned: false, isVisible: true, width: 130, minWidth: 110, sortable: true },
  { key: "status", label: "Status", icon: "alertCircle", isPinned: false, isVisible: true, width: 140, minWidth: 120, sortable: true, filterable: true, groupable: true, options: ["Collecting", "In Review", "Matching"] },
  { key: "actions", label: "Actions", icon: "activity", isPinned: false, isVisible: true, width: 80, minWidth: 80 },
])

const closedColumns: ColumnConfig[] = autoSuggestColumnPinning([
  { key: "select", label: "Select", icon: "checkCircle", isPinned: false, isVisible: true, width: 60, minWidth: 60 },
  { key: "name", label: "Wishlist Name", icon: "heart", isPinned: false, isVisible: true, width: 300, minWidth: 220, sortable: true, filterable: true },
  { key: "specialization", label: "Specialization", icon: "graduation-cap", isPinned: false, isVisible: true, width: 160, minWidth: 140, sortable: true, filterable: true, groupable: true },
  { key: "rotationPeriod", label: "Rotation Period", icon: "calendar", isPinned: false, isVisible: true, width: 180, minWidth: 160, sortable: true },
  { key: "students", label: "Students", icon: "users", isPinned: false, isVisible: true, width: 180, minWidth: 160, sortable: true },
  { key: "matchRate", label: "Final Match Rate", icon: "percent", isPinned: false, isVisible: true, width: 160, minWidth: 140, sortable: true },
  { key: "closedDate", label: "Closed Date", icon: "calendar", isPinned: false, isVisible: true, width: 140, minWidth: 120, sortable: true },
  { key: "status", label: "Outcome", icon: "checkCircle", isPinned: false, isVisible: true, width: 140, minWidth: 120, sortable: true, filterable: true, groupable: true, options: ["Completed", "Closed"] },
  { key: "actions", label: "Actions", icon: "activity", isPinned: false, isVisible: true, width: 80, minWidth: 80 },
])

function getColumnsForTab(tab: string): ColumnConfig[] { return tab === "closed" ? closedColumns : openColumns }

const bulkActionDefs = [
  { label: "Send Reminder", icon: "clock", action: "remind", variant: "default" as const },
  { label: "Close Selected", icon: "archive", action: "close", variant: "default" as const },
]

interface WishlistPageProps { onItemClick?: (itemId: string) => void }

export function WishlistPage({ onItemClick }: WishlistPageProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [activeTab, setActiveTab] = React.useState("open")
  const [selectedItems, setSelectedItems] = React.useState<string[]>([])
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(25)
  const [showFilters, setShowFilters] = React.useState(false)
  const [activeFilters, setActiveFilters] = React.useState<ActiveFilter[]>([])

  const deferredSearchQuery = React.useDeferredValue(searchQuery)
  const [, startTabTransition] = React.useTransition()
  const handleTabChange = React.useCallback((tab: string) => { startTabTransition(() => { setActiveTab(tab); setCurrentPage(1); setSelectedItems([]) }) }, [])

  const [views, setViews] = React.useState<ViewConfig[]>([
    { name: "Open Wishlists", count: "7", id: "open", type: "table", settings: null, icon: TAB_ICONS["open"] },
    { name: "Closed Wishlists", count: "5", id: "closed", type: "table", settings: null, icon: TAB_ICONS["closed"] },
  ])

  const [columns, setColumns] = React.useState<ColumnConfig[]>(getColumnsForTab("open"))
  const [tableFilters, setTableFilters] = React.useState<any[]>([])
  const [tableSorts, setTableSorts] = React.useState<any[]>([])
  const [tableGroupBy, setTableGroupBy] = React.useState<any>(null)

  React.useEffect(() => { setColumns(getColumnsForTab(activeTab)) }, [activeTab])
  const activeView = views.find((v) => v.id === activeTab)
  React.useEffect(() => { if (activeView?.settings?.columns) setColumns(activeView.settings.columns as ColumnConfig[]) }, [activeView])

  const openData = React.useMemo(() => wishlistData.filter((item) => item.status === "Collecting" || item.status === "In Review" || item.status === "Matching"), [])
  const closedData = React.useMemo(() => wishlistData.filter((item) => item.status === "Completed" || item.status === "Closed"), [])

  const computedMetrics = React.useMemo(() => {
    const totalOpen = openData.length
    const totalStudents = openData.reduce((sum, w) => sum + w.totalStudents, 0)
    const submittedPrefs = openData.reduce((sum, w) => sum + w.preferencesSubmitted, 0)
    const expectedPrefs = openData.reduce((sum, w) => sum + w.totalStudents, 0)
    const submissionRate = expectedPrefs > 0 ? Math.round((submittedPrefs / expectedPrefs) * 100) : 0
    const matchingItems = openData.filter((w) => w.matchRate > 0)
    const avgMatchRate = matchingItems.length > 0 ? Math.round(matchingItems.reduce((sum, w) => sum + w.matchRate, 0) / matchingItems.length) : 0
    return [
      createSimpleMetricData("Open Wishlists", String(totalOpen), { trend: "up", trendValue: "+2" }),
      createSimpleMetricData("Students Tracked", String(totalStudents), { trend: "up", trendValue: "+14" }),
      createSimpleMetricData("Submission Rate", `${submissionRate}%`, { trend: submissionRate >= 70 ? "up" : "down", trendValue: submissionRate >= 70 ? "+5%" : "-3%" }),
      createSimpleMetricData("Avg Match Rate", `${avgMatchRate}%`, { trend: avgMatchRate >= 70 ? "up" : "down", trendValue: avgMatchRate >= 70 ? "+8%" : "-2%" }),
    ]
  }, [openData])

  const filteredData = React.useMemo(() => {
    let data: WishlistItem[] = activeTab === "closed" ? closedData : openData
    activeFilters.forEach((filter) => { if (filter.values.length > 0) data = data.filter((item) => filter.values.includes(item[filter.key as keyof WishlistItem] as string)) })
    tableFilters.forEach((filter) => { if (filter.values.length > 0) data = data.filter((item) => filter.values.includes(item[filter.columnKey as keyof WishlistItem] as string)) })
    if (deferredSearchQuery.trim()) {
      const q = deferredSearchQuery.toLowerCase()
      data = data.filter((item) => item.name.toLowerCase().includes(q) || item.specialization.toLowerCase().includes(q) || item.rotationPeriod.toLowerCase().includes(q) || item.topSites.some((s) => s.toLowerCase().includes(q)))
    }
    if (tableSorts.length > 0) {
      data = [...data].sort((a, b) => { for (const sort of tableSorts) { const aVal = a[sort.columnKey as keyof WishlistItem]; const bVal = b[sort.columnKey as keyof WishlistItem]; let cmp = 0; if (aVal! < bVal!) cmp = -1; if (aVal! > bVal!) cmp = 1; if (sort.direction === "desc") cmp *= -1; if (cmp !== 0) return cmp } return 0 })
    }
    return data
  }, [activeTab, openData, closedData, activeFilters, tableFilters, deferredSearchQuery, tableSorts])

  const paginationInfo: PaginationInfo = React.useMemo(() => {
    const totalItems = filteredData.length; const totalPages = Math.ceil(totalItems / pageSize)
    return { currentPage, totalPages, pageSize, totalItems, startItem: (currentPage - 1) * pageSize + 1, endItem: Math.min(currentPage * pageSize, totalItems) }
  }, [filteredData.length, currentPage, pageSize])

  const currentData = React.useMemo(() => { const start = (currentPage - 1) * pageSize; return filteredData.slice(start, start + pageSize) }, [filteredData, currentPage, pageSize])

  const filterConfigs: FilterConfig[] = React.useMemo(() => [
    { key: "specialization", label: "Specialization", icon: "graduation-cap", options: Array.from(new Set(wishlistData.map((i) => i.specialization))).sort() },
    { key: "priority", label: "Priority", icon: "star", options: ["High", "Medium", "Low"] },
    { key: "status", label: "Status", icon: "alertCircle", options: Array.from(new Set(wishlistData.map((i) => i.status))).sort() },
  ], [])

  const handleAddFilter = React.useCallback((filterKey: string) => {
    if (activeFilters.find((f) => f.key === filterKey)) { setShowFilters(true); return }
    setActiveFilters((prev) => [...prev, { id: `${filterKey}_${Date.now()}`, key: filterKey, label: filterConfigs.find((c) => c.key === filterKey)?.label || filterKey, values: [], removable: true }]); setShowFilters(true)
  }, [activeFilters, filterConfigs])

  const handleToggleFilterValue = React.useCallback((filterId: string, value: string) => {
    setActiveFilters((prev) => prev.map((f) => { if (f.id === filterId) { const vals = f.values.includes(value) ? f.values.filter((v) => v !== value) : [...f.values, value]; return { ...f, values: vals } } return f })); setCurrentPage(1)
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
    label: a.label, icon: a.icon, onClick: () => { setSelectedItems([]) }, variant: a.variant,
  })), [selectedItems])

  const handleMetricClick = React.useCallback((_index: number) => { setActiveTab("open"); setCurrentPage(1) }, [])

  const lowSubmission = openData.filter((w) => w.preferencesSubmitted < w.totalStudents * 0.5)
  const [showBanner] = React.useState(true)
  const metricsBanner = showBanner && lowSubmission.length > 0 ? (
    <InsightCard
      variant="compact"
      data={createInsightCardData("Low submission rates detected", `${lowSubmission.length} wishlist${lowSubmission.length > 1 ? "s have" : " has"} less than 50% of students submitting preferences. Consider sending reminders before the deadline.`, "sparkles")}
      onClick={() => { setActiveTab("open"); setCurrentPage(1) }}
    />
  ) : null

  const getStatusBadge = React.useCallback((status: WishlistItem["status"]) => {
    switch (status) {
      case "Collecting": return <Badge variant="secondary" className="bg-muted text-muted-foreground border-border"><FontAwesomeIcon name="listChecks" className="h-3 w-3 mr-1" weight="light" />Collecting</Badge>
      case "In Review": return <Badge variant="secondary" className="bg-chart-4/10 text-chip-4 border-chip-4/40"><FontAwesomeIcon name="eye" className="h-3 w-3 mr-1" weight="light" />In Review</Badge>
      case "Matching": return <Badge variant="secondary" className="bg-chart-5/10 text-chip-5 border-chip-5/40"><FontAwesomeIcon name="activity" className="h-3 w-3 mr-1" weight="light" />Matching</Badge>
      case "Completed": return <Badge variant="secondary" className="bg-chart-2/10 text-chip-2 border-chip-2/40"><FontAwesomeIcon name="checkCircle" className="h-3 w-3 mr-1" weight="light" />Completed</Badge>
      case "Closed": return <Badge variant="secondary" className="bg-muted text-muted-foreground border-border"><FontAwesomeIcon name="archive" className="h-3 w-3 mr-1" weight="light" />Closed</Badge>
    }
  }, [])

  const getPriorityBadge = React.useCallback((priority: WishlistItem["priority"]) => {
    switch (priority) {
      case "High": return <Badge variant="secondary" className="bg-destructive/10 text-chip-destructive border-chip-destructive/40">High</Badge>
      case "Medium": return <Badge variant="secondary" className="bg-chart-4/10 text-chip-4 border-chip-4/40">Medium</Badge>
      case "Low": return <Badge variant="secondary" className="bg-muted text-muted-foreground border-border">Low</Badge>
    }
  }, [])

  const renderCell = React.useCallback(
    (column: ColumnConfig, item: WishlistItem, _index: number) => {
      const getTextClass = (baseClass: string = "") => cn(baseClass, column.wrapText ? "break-words" : "truncate")
      switch (column.key) {
        case "name":
          return (<div className="space-y-1 w-full overflow-hidden"><div className="flex items-center gap-2 min-w-0"><div className={cn("line-clamp-2 data-table-clickable min-w-0 flex-1 font-medium text-base", column.wrapText && "break-words")} role="button" tabIndex={0} onClick={() => onItemClick?.(item.id)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onItemClick?.(item.id); } }}>{item.name}</div></div><div className={`flex items-center gap-2 text-xs text-muted-foreground ${getTextClass()}`}><span>{item.id}</span><span>&middot;</span><span>{item.topSites.slice(0, 2).join(", ")}{item.topSites.length > 2 ? ` +${item.topSites.length - 2}` : ""}</span></div></div>)
        case "specialization":
          return <div className={cn("font-medium text-base", column.wrapText ? "break-words" : "truncate")}>{item.specialization}</div>
        case "rotationPeriod":
          return (<div className="space-y-1 w-full overflow-hidden"><div className={getTextClass("font-medium text-base")}>{item.rotationPeriod}</div><div className={getTextClass("text-xs text-muted-foreground")}>{item.startDate} - {item.endDate}</div></div>)
        case "students":
          return (<div className="space-y-1"><div className="font-medium text-base">{item.preferencesSubmitted}/{item.totalStudents} Submitted</div><div className="text-xs text-muted-foreground">{item.preferencesSubmitted < item.totalStudents ? (<span className="flex items-center gap-1"><FontAwesomeIcon name="clock" className="h-3 w-3 text-chart-4" />{item.totalStudents - item.preferencesSubmitted} pending</span>) : (<span className="flex items-center gap-1"><FontAwesomeIcon name="checkCircle" className="h-3 w-3 text-chart-2" />All submitted</span>)}</div></div>)
        case "matchRate":
          return (<div className="space-y-1"><div className="font-medium text-base">{item.matchRate > 0 ? `${item.matchRate}%` : "—"}</div>{item.matchRate > 0 && (<div className="text-xs text-muted-foreground">{item.matchRate >= 85 ? (<span className="flex items-center gap-1 text-chart-2"><FontAwesomeIcon name="checkCircle" className="h-3 w-3" />Strong</span>) : item.matchRate >= 60 ? (<span className="flex items-center gap-1 text-chart-4"><FontAwesomeIcon name="alertCircle" className="h-3 w-3" />Moderate</span>) : (<span className="flex items-center gap-1 text-destructive"><FontAwesomeIcon name="alertCircle" className="h-3 w-3" />Low</span>)}</div>)}</div>)
        case "priority":
          return getPriorityBadge(item.priority)
        case "deadline":
          return <div className="font-medium text-base">{item.deadline}</div>
        case "closedDate":
          return <div className="font-medium text-base">{item.deadline}</div>
        case "status":
          return getStatusBadge(item.status)
        case "actions":
          return (<DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="min-h-11 min-w-11 md:h-7 md:w-7 p-0 touch-manipulation" aria-label="More actions"><FontAwesomeIcon name="moreHorizontal" className="h-4 w-4" aria-hidden="true" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-48"><DropdownMenuItem onClick={() => onItemClick?.(item.id)}><FontAwesomeIcon name="eye" className="h-4 w-4 mr-2" />View Details</DropdownMenuItem><DropdownMenuItem><FontAwesomeIcon name="edit" className="h-4 w-4 mr-2" />Edit</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem className="text-destructive"><FontAwesomeIcon name="circleXmark" className="h-4 w-4 mr-2" />Close Wishlist</DropdownMenuItem></DropdownMenuContent></DropdownMenu>)
        default:
          return <div className="font-medium text-base">{(item as any)[column.key]}</div>
      }
    },
    [onItemClick, getStatusBadge, getPriorityBadge]
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

  const handleCreateWishlist = () => {
    // TODO: Open create wishlist modal/dialog
  }

  return (
    <PrimaryPageTemplate
      title="Wishlist" description="Manage student placement preferences and site matching"
      metrics={{ data: computedMetrics, onMetricClick: handleMetricClick, columns: 4, banner: metricsBanner }}
      views={views} activeTab={activeTab} onTabChange={handleTabChange} onAddView={handleAddView}
      searchPlaceholder="Search wishlists..." searchQuery={searchQuery} onSearchChange={setSearchQuery}
      filters={filtersConfig} tableProperties={tablePropertiesConfig} renderTabContent={renderTabContent}
      selectedItems={selectedItems} onClearSelection={handleClearSelection} bulkActions={bulkActions}
      headerActions={
        <Button onClick={handleCreateWishlist} size="sm" className="h-8">
          <FontAwesomeIcon name="plus" className="h-3.5 w-3.5 mr-1.5" />
          Create Wishlist
        </Button>
      }
      className="wishlist-page-container"
    />
  )
}