import * as React from "react"
import { Badge, NewBadge } from "../ui/badge"
import { Button } from "../ui/button"
import {
  User,
  Briefcase,
  Building2,
  MapPin,
  CalendarDays,
  Clock,
  Shield,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  MoreHorizontal,
  TrendingUp,
  AlertTriangle,
  Activity,
  Bell,
  Eye,
  FileText,
  Download,
  Calendar,
  Award,
  Target,
  XCircle,
} from "lucide-react"
import { cn } from "../ui/utils"
import { DataTable, type ColumnConfig, type PaginationInfo } from "../shared/data-table"
import type { ActiveFilter, FilterConfig } from "../shared/filter-bar"
import { createSimpleMetricData } from "../shared/simple-metric"
import type { ViewSettings } from "../shared/view-manager"
import { generateStudentScheduleData } from "../../data/mock-data"
import { formatDaysUntil, datePresetMatches, DATE_PRESET_LABELS } from "../../utils/date-utils"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "../ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { FontAwesomeIcon, type IconName } from "../brand/font-awesome-icon"
import { InsightCard, createInsightCardData } from "../shared/insight-card"
import {
  PrimaryPageTemplate,
  type ViewConfig,
  type PrimaryPageFilterConfig,
  type PrimaryPageTablePropertiesConfig,
  type PrimaryPageBulkAction,
} from "../shared/primary-page-template"

// ─── Mock notifications for schedule items ────────────────────────────────────

function getScheduleNotifications(item: { studentName: string; siteName: string }): { id: string; title: string; message: string; time: string; type: string; icon: IconName }[] {
  return [
    { id: "n1", title: "Compliance Reminder", message: `${item.studentName} has 2 documents pending upload before rotation at ${item.siteName}.`, time: "2 hours ago", type: "warning", icon: "upload" },
    { id: "n2", title: "Preceptor Confirmation", message: `Preceptor at ${item.siteName} has confirmed availability for the scheduled start date.`, time: "1 day ago", type: "success", icon: "checkCircle" },
    { id: "n3", title: "Site Requirements Updated", message: `${item.siteName} updated HIPAA training requirements. Action may be required.`, time: "2 days ago", type: "info", icon: "circleInfo" },
  ]
}

// ─── Tab icon map ───────────────────────────────────────────────────────────

const TAB_ICONS: Record<string, React.ReactNode> = {
  upcoming: <FontAwesomeIcon name="clock" className="h-4 w-4" />,
  ongoing: <FontAwesomeIcon name="trendingUp" className="h-4 w-4" />,
  completed: <FontAwesomeIcon name="checkCircle" className="h-4 w-4" />,
  compliance: <FontAwesomeIcon name="shield" className="h-4 w-4" />,
}

// ─── Column Definitions ─────────────────────────────────────────────────────

const upcomingColumns: ColumnConfig[] = [
  { key: "studentName", label: "Student Name", icon: "user", isPinned: true, pinSide: "left", isVisible: true, width: 200, minWidth: 150, sortable: true, filterable: true, groupable: true, wrapText: true },
  { key: "siteName", label: "Site & Location", icon: "building2", isPinned: false, isVisible: true, width: 200, minWidth: 150, sortable: true, filterable: true, groupable: true },
  { key: "preceptor", label: "Preceptor", icon: "user", isPinned: false, isVisible: true, width: 180, minWidth: 150, sortable: true, filterable: true, groupable: true },
  { key: "internshipName", label: "Internship", icon: "briefcase", isPinned: false, isVisible: true, width: 220, minWidth: 180, sortable: true, filterable: true, groupable: true },
  { key: "specialization", label: "Specialization", icon: "bookOpen", isPinned: false, isVisible: true, width: 180, minWidth: 150, sortable: true, filterable: true, groupable: true },
  { key: "startDate", label: "Start Date", icon: "calendarDays", isPinned: false, isVisible: true, width: 140, minWidth: 120, sortable: true, filterable: true },
  { key: "compliancePercent", label: "Compliance", icon: "shield", isPinned: false, isVisible: true, width: 120, minWidth: 100, sortable: true },
  { key: "readinessStatus", label: "Readiness", icon: "shield", isPinned: true, pinSide: "right", isVisible: true, width: 140, minWidth: 120, sortable: true, filterable: true },
  { key: "daysUntilStart", label: "Days Until Start", icon: "clock", isPinned: false, isVisible: true, width: 150, minWidth: 120, sortable: true },
  { key: "actions", label: "Action", icon: "moreHorizontal", isPinned: true, pinSide: "right", isVisible: true, width: 120, minWidth: 120, sortable: false },
]

const ongoingColumns: ColumnConfig[] = [
  { key: "studentName", label: "Student Name", icon: "user", isPinned: true, pinSide: "left", isVisible: true, width: 200, minWidth: 150, sortable: true, filterable: true, groupable: true, wrapText: true },
  { key: "siteName", label: "Site & Location", icon: "building2", isPinned: false, isVisible: true, width: 200, minWidth: 150, sortable: true, filterable: true, groupable: true },
  { key: "preceptor", label: "Preceptor", icon: "user", isPinned: false, isVisible: true, width: 180, minWidth: 150, sortable: true, filterable: true, groupable: true },
  { key: "internshipName", label: "Internship", icon: "briefcase", isPinned: false, isVisible: true, width: 220, minWidth: 180, sortable: true, filterable: true, groupable: true },
  { key: "specialization", label: "Specialization", icon: "bookOpen", isPinned: false, isVisible: true, width: 180, minWidth: 150, sortable: true, filterable: true, groupable: true },
  { key: "progress", label: "Progress", icon: "target", isPinned: false, isVisible: true, width: 150, minWidth: 120, sortable: false },
  { key: "endDate", label: "End Date", icon: "calendarDays", isPinned: false, isVisible: true, width: 140, minWidth: 120, sortable: true, filterable: true },
  { key: "lastCheckin", label: "Last Check-in", icon: "clock", isPinned: false, isVisible: true, width: 120, minWidth: 100, sortable: true },
  { key: "actions", label: "Action", icon: "moreHorizontal", isPinned: true, pinSide: "right", isVisible: true, width: 120, minWidth: 120, sortable: false },
]

const completedColumns: ColumnConfig[] = [
  { key: "studentName", label: "Student Name", icon: "user", isPinned: true, pinSide: "left", isVisible: true, width: 200, minWidth: 150, sortable: true, filterable: true, groupable: true, wrapText: true },
  { key: "siteName", label: "Site & Location", icon: "building2", isPinned: false, isVisible: true, width: 200, minWidth: 150, sortable: true, filterable: true, groupable: true },
  { key: "preceptor", label: "Preceptor", icon: "user", isPinned: false, isVisible: true, width: 180, minWidth: 150, sortable: true, filterable: true, groupable: true },
  { key: "internshipName", label: "Internship", icon: "briefcase", isPinned: false, isVisible: true, width: 220, minWidth: 180, sortable: true, filterable: true, groupable: true },
  { key: "specialization", label: "Specialization", icon: "bookOpen", isPinned: false, isVisible: true, width: 180, minWidth: 150, sortable: true, filterable: true, groupable: true },
  { key: "completionDate", label: "Completion Date", icon: "calendarDays", isPinned: false, isVisible: true, width: 160, minWidth: 140, sortable: true, filterable: true },
  { key: "finalStatus", label: "Final Status", icon: "checkCircle", isPinned: false, isVisible: true, width: 160, minWidth: 120, sortable: true, filterable: true },
  { key: "finalEvaluation", label: "Final Evaluation", icon: "award", isPinned: false, isVisible: true, width: 140, minWidth: 120, sortable: true },
  { key: "actions", label: "Action", icon: "moreHorizontal", isPinned: true, pinSide: "right", isVisible: true, width: 120, minWidth: 120, sortable: false },
]

function getColumnsForTab(tab: string): ColumnConfig[] {
  switch (tab) {
    case "upcoming": return upcomingColumns
    case "ongoing": return ongoingColumns
    case "completed": return completedColumns
    case "compliance": return complianceMatrixColumns
    default: return upcomingColumns
  }
}

// ─── Bulk actions ───────────────────────────────────────────────────────────

const bulkActionDefs = [
  { label: "Start Review", icon: "eye" as const, action: "start-review", variant: "default" as const },
  { label: "Send Reminder", icon: "alertCircle" as const, action: "send-reminder", variant: "outline" as const },
  { label: "Export Selected", icon: "download" as const, action: "export", variant: "outline" as const },
]

// Compliance matrix columns — optimized for faculty to review 20–50 students at a glance (no pinning)
const complianceMatrixColumns: ColumnConfig[] = [
  { key: "studentName", label: "Student", icon: "user", isPinned: false, isVisible: true, width: 220, minWidth: 180, sortable: true, filterable: true, groupable: true, wrapText: true },
  { key: "siteName", label: "Site", icon: "building2", isPinned: false, isVisible: true, width: 220, minWidth: 180, sortable: true, filterable: true, groupable: true },
  { key: "compliancePercent", label: "Status", icon: "shield", isPinned: false, isVisible: true, width: 140, minWidth: 120, sortable: true },
  { key: "complianceMatrix", label: "Requirements", icon: "shield", isPinned: false, isVisible: true, width: 400, minWidth: 340, sortable: false, flex: true },
  { key: "actions", label: "Actions", icon: "eye", isPinned: false, isVisible: true, width: 140, minWidth: 120, sortable: false },
]

// ─── Component ──────────────────────────────────────────────────────────────

interface StudentSchedulePageProps {
  onItemClick?: (itemId: string, studentName?: string, siteName?: string) => void
}

export function StudentSchedulePage({ onItemClick }: StudentSchedulePageProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [activeTab, setActiveTab] = React.useState("upcoming")
  const [selectedItems, setSelectedItems] = React.useState<string[]>([])
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(25)
  const [showFilters, setShowFilters] = React.useState(false)
  const [activeFilters, setActiveFilters] = React.useState<ActiveFilter[]>([])
  const [activeMetricFilter, setActiveMetricFilter] = React.useState<string | null>(null)
  const [showBanner, setShowBanner] = React.useState(true)

  const deferredSearchQuery = React.useDeferredValue(searchQuery)
  const [isTabPending, startTabTransition] = React.useTransition()

  const handleTabChange = React.useCallback((tab: string) => {
    startTabTransition(() => {
      setActiveTab(tab)
    })
  }, [])

  const [views, setViews] = React.useState<ViewConfig[]>([
    { name: "Upcoming", count: "28", id: "upcoming", type: "table", settings: null, icon: TAB_ICONS["upcoming"] },
    { name: "Ongoing", count: "142", id: "ongoing", type: "table", settings: null, icon: TAB_ICONS["ongoing"] },
    { name: "Completed", count: "315", id: "completed", type: "table", settings: null, icon: TAB_ICONS["completed"] },
    { name: "Compliance", count: "0", id: "compliance", type: "table", settings: null, icon: TAB_ICONS["compliance"] },
  ])

  const [columns, setColumns] = React.useState<ColumnConfig[]>(getColumnsForTab("upcoming"))
  const [tableFilters, setTableFilters] = React.useState<any[]>([])
  const [tableSorts, setTableSorts] = React.useState<any[]>([])
  const [tableGroupBy, setTableGroupBy] = React.useState<any>(null)

  const studentScheduleData = React.useMemo(() => generateStudentScheduleData(50), [])

  React.useEffect(() => {
    setColumns(getColumnsForTab(activeTab))
    setCurrentPage(1)
    setSelectedItems([])
  }, [activeTab])

  const activeView = views.find((v) => v.id === activeTab)
  React.useEffect(() => {
    if (activeView?.settings?.columns) {
      setColumns(activeView.settings.columns as ColumnConfig[])
    }
  }, [activeView])

  const computedMetrics = React.useMemo(() => {
    const totalPlacements = studentScheduleData.length
    const startingThisWeek = studentScheduleData.filter((s) => s.daysUntilStart <= 7).length
    const complianceAlerts = studentScheduleData.filter((s) => s.compliancePercent < 85).length
    const avgCompliance = Math.round(
      studentScheduleData.reduce((sum, s) => sum + s.compliancePercent, 0) / totalPlacements
    )
    return [
      createSimpleMetricData("Total Placements", String(totalPlacements), { trend: "up", trendValue: "+12" }),
      createSimpleMetricData("Starting This Week", String(startingThisWeek), {
        trend: startingThisWeek > 5 ? "up" : "down",
        trendValue: startingThisWeek > 5 ? `+${startingThisWeek - 5}` : `-${5 - startingThisWeek}`,
      }),
      createSimpleMetricData("Compliance Alerts", String(complianceAlerts), {
        trend: complianceAlerts > 10 ? "up" : "down",
        trendValue: complianceAlerts > 10 ? `+${complianceAlerts - 10}` : `-${10 - complianceAlerts}`,
      }),
      createSimpleMetricData("Avg Compliance", `${avgCompliance}%`, {
        trend: avgCompliance >= 85 ? "up" : "down",
        trendValue: avgCompliance >= 85 ? "+3" : "-2",
      }),
    ]
  }, [studentScheduleData])

  const readinessVariantMap: Record<string, string> = {
    Ready: "bg-chart-2/10 text-chip-2 border-chip-2/40",
    Pending: "bg-chart-4/10 text-chip-4 border-chip-4/40",
    "Action Required": "bg-destructive/10 text-chip-destructive border-chip-destructive/40",
    "Not Started": "bg-muted text-muted-foreground border-border",
  }

  const filterConfigs: FilterConfig[] = React.useMemo(
    () => [
      { key: "readinessStatus", label: "Readiness Status", icon: "shield", options: Array.from(new Set(studentScheduleData.map((s) => s.readinessStatus))).sort(), filterType: "status" as const, optionVariantMap: readinessVariantMap },
      { key: "studentName", label: "Student Name", icon: "user", options: Array.from(new Set(studentScheduleData.map((s) => s.studentName))).sort() },
      { key: "siteName", label: "Site", icon: "building2", options: Array.from(new Set(studentScheduleData.map((s) => s.siteName))).sort() },
      { key: "preceptorName", label: "Preceptor", icon: "user", options: Array.from(new Set(studentScheduleData.map((s) => s.preceptorName))).sort() },
      { key: "internshipName", label: "Internship", icon: "briefcase", options: Array.from(new Set(studentScheduleData.map((s) => s.internshipName))).sort() },
      { key: "discipline", label: "Discipline", icon: "bookOpen", options: Array.from(new Set(studentScheduleData.map((s) => s.discipline))).sort() },
      { key: "specialization", label: "Specialization", icon: "briefcase", options: Array.from(new Set(studentScheduleData.map((s) => s.specialization))).sort() },
      { key: "startDate", label: "Start Date", icon: "calendarDays", options: Array.from(new Set(studentScheduleData.map((s) => s.startDate))).sort(), filterType: "date" as const },
      { key: "endDate", label: "End Date", icon: "calendarDays", options: Array.from(new Set(studentScheduleData.map((s) => s.endDate))).sort(), filterType: "date" as const },
      { key: "location", label: "Location", icon: "mapPin", options: Array.from(new Set(studentScheduleData.map((s) => s.location))).sort() },
      { key: "duration", label: "Duration", icon: "clock", options: Array.from(new Set(studentScheduleData.map((s) => s.duration))).sort() },
      { key: "experienceType", label: "Experience Type", icon: "briefcase", options: Array.from(new Set(studentScheduleData.map((s) => s.experienceType))).sort() },
      { key: "courseName", label: "Course", icon: "book", options: Array.from(new Set(studentScheduleData.map((s) => s.courseName))).sort() },
      { key: "availabilityName", label: "Availability", icon: "calendar", options: Array.from(new Set(studentScheduleData.map((s) => s.availabilityName))).sort() },
      { key: "lastCheckin", label: "Last Check-in", icon: "clock", options: Array.from(new Set(studentScheduleData.map((s) => s.lastCheckin))).sort() },
      { key: "progress", label: "Progress", icon: "target", options: Array.from(new Set(studentScheduleData.map((s) => s.progress))).sort() },
      { key: "finalStatus", label: "Final Status", icon: "checkCircle", options: Array.from(new Set(studentScheduleData.map((s) => s.finalStatus))).sort(), filterType: "status" as const, optionVariantMap: { Complete: "bg-chart-2/10 text-chip-2 border-chip-2/40", "In Progress": "bg-chart-4/10 text-chip-4 border-chip-4/40", Pending: "bg-chart-4/10 text-chip-4 border-chip-4/40", Overdue: "bg-destructive/10 text-chip-destructive border-chip-destructive/40" } },
      { key: "finalEvaluation", label: "Final Evaluation", icon: "award", options: Array.from(new Set(studentScheduleData.map((s) => s.finalEvaluation))).sort() },
    ],
    [studentScheduleData]
  )

  const filteredData = React.useMemo(() => {
    let data = studentScheduleData
    if (activeTab === "compliance") {
      data = data.filter((item) => (item.stage === "upcoming" || item.stage === "ongoing") && item.compliancePercent < 100)
    } else {
      data = data.filter((item) => item.stage === activeTab)
    }
    if (activeMetricFilter) {
      if (activeMetricFilter === "starting-this-week") data = data.filter((item) => item.daysUntilStart <= 7)
      else if (activeMetricFilter === "compliance-alerts") data = data.filter((item) => item.compliancePercent < 85)
      else if (activeMetricFilter === "at-risk") data = data.filter((item) => item.progressPercent < 50 || item.lastCheckin === "7+ days ago")
    }
    const applyFilter = (
      item: (typeof studentScheduleData)[0],
      key: string,
      values: string[],
      config?: { filterType?: "date" | "status" }
    ) => {
      const itemValue = (item as any)[key]
      const effectiveValues = values.filter((v) => v !== "Custom")
      if (effectiveValues.length === 0) return true
      const isDateFilter = config?.filterType === "date"
      return effectiveValues.some((v) => {
        if (isDateFilter && (DATE_PRESET_LABELS as readonly string[]).includes(v)) {
          return datePresetMatches(itemValue, v)
        }
        return String(itemValue) === v
      })
    }
    if (activeFilters.length > 0) {
      activeFilters.forEach((filter) => {
        if (filter.values.length > 0) {
          const config = filterConfigs.find((c) => c.key === filter.key) as { filterType?: "date" | "status" } | undefined
          data = data.filter((item) => applyFilter(item, filter.key, filter.values, config))
        }
      })
    }
    if (tableFilters.length > 0) {
      tableFilters.forEach((filter: { columnKey: string; values: string[] }) => {
        if (filter.values.length > 0) {
          const config = filterConfigs.find((c) => c.key === filter.columnKey) as { filterType?: "date" | "status" } | undefined
          data = data.filter((item) => applyFilter(item, filter.columnKey, filter.values, config))
        }
      })
    }
    if (deferredSearchQuery.trim()) {
      const q = deferredSearchQuery.toLowerCase()
      data = data.filter(
        (item) =>
          item.studentName.toLowerCase().includes(q) ||
          item.studentEmail.toLowerCase().includes(q) ||
          item.studentId.toLowerCase().includes(q) ||
          item.scheduleId.toLowerCase().includes(q) ||
          item.internshipName.toLowerCase().includes(q) ||
          item.courseName.toLowerCase().includes(q) ||
          item.availabilityName.toLowerCase().includes(q) ||
          item.discipline.toLowerCase().includes(q) ||
          item.specialization.toLowerCase().includes(q) ||
          item.siteName.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q)
      )
    }
    if (tableSorts.length > 0) {
      const primarySort = tableSorts[0]
      data = [...data].sort((a, b) => {
        let aVal = (a as any)[primarySort.columnKey]
        let bVal = (b as any)[primarySort.columnKey]
        if (typeof aVal === "string") aVal = aVal.toLowerCase()
        if (typeof bVal === "string") bVal = bVal.toLowerCase()
        if (aVal < bVal) return primarySort.direction === "asc" ? -1 : 1
        if (aVal > bVal) return primarySort.direction === "asc" ? 1 : -1
        return 0
      })
    } else {
      if (activeTab === "upcoming") data = [...data].sort((a, b) => a.daysUntilStart - b.daysUntilStart)
      else if (activeTab === "compliance") data = [...data].sort((a, b) => a.compliancePercent - b.compliancePercent)
    }
    return data
  }, [studentScheduleData, activeTab, deferredSearchQuery, activeMetricFilter, activeFilters, tableFilters, tableSorts, filterConfigs])

  React.useEffect(() => {
    setCurrentPage(1)
  }, [tableFilters, tableSorts])

  React.useEffect(() => {
    const complianceNeeding = studentScheduleData.filter(
      (item) => (item.stage === "upcoming" || item.stage === "ongoing") && item.compliancePercent < 100
    ).length
    const counts: Record<string, number> = {
      upcoming: studentScheduleData.filter((item) => item.stage === "upcoming").length,
      ongoing: studentScheduleData.filter((item) => item.stage === "ongoing").length,
      completed: studentScheduleData.filter((item) => item.stage === "completed").length,
      compliance: complianceNeeding,
    }
    setViews((prev) => prev.map((v) => ({ ...v, count: String(counts[v.id] ?? v.count) })))
  }, [studentScheduleData])

  const paginationInfo: PaginationInfo = React.useMemo(() => {
    const totalItems = filteredData.length
    const totalPages = Math.ceil(totalItems / pageSize)
    const startItem = (currentPage - 1) * pageSize + 1
    const endItem = Math.min(currentPage * pageSize, totalItems)
    return { currentPage, totalPages, pageSize, totalItems, startItem, endItem }
  }, [filteredData.length, currentPage, pageSize])

  const currentData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, currentPage, pageSize])

  const handleAddFilter = React.useCallback(
    (filterKey: string) => {
      const existing = activeFilters.find((f) => f.key === filterKey)
      if (existing) { setShowFilters(true); return }
      const newFilter: ActiveFilter = { id: `${filterKey}_${Date.now()}`, key: filterKey, label: filterConfigs.find((c) => c.key === filterKey)?.label || filterKey, values: [], removable: true }
      setActiveFilters((prev) => [...prev, newFilter])
      setShowFilters(true)
    },
    [activeFilters, filterConfigs]
  )

  const handleToggleFilterValue = React.useCallback((filterId: string, value: string) => {
    setActiveFilters((prev) => prev.map((f) => {
      if (f.id === filterId) {
        const newValues = f.values.includes(value) ? f.values.filter((v) => v !== value) : [...f.values, value]
        return { ...f, values: newValues }
      }
      return f
    }))
    setCurrentPage(1)
  }, [])

  const handleRemoveFilter = React.useCallback((filterId: string) => {
    setActiveFilters((prev) => prev.filter((f) => f.id !== filterId))
    setCurrentPage(1)
  }, [])

  const handleClearAllFilters = React.useCallback(() => { setActiveFilters([]); setCurrentPage(1) }, [])
  const handleClearSelection = React.useCallback(() => setSelectedItems([]), [])

  const handleBulkAction = React.useCallback((action: string, ids: string[]) => {
    if ((action === "start-review" || action === "upload-documents") && ids.length > 0) {
      const item = studentScheduleData.find((s) => s.id === ids[0])
      if (item) onItemClick?.(item.id, item.studentName, item.siteName)
    } else if (action === "send-reminder") {
      // TODO: send reminder
    } else if (action === "export") {
      // TODO: export
    }
    setSelectedItems([])
  }, [studentScheduleData, onItemClick])

  const handleAddView = React.useCallback((viewName: string, viewSettings: ViewSettings) => {
    const newView: ViewConfig = { name: viewName, count: "0", id: `view_${Date.now()}`, type: viewSettings.type, settings: viewSettings }
    setViews((prev) => [...prev, newView])
    setActiveTab(newView.id)
  }, [])

  const handleMetricClick = React.useCallback((index: number) => {
    startTabTransition(() => {
      if (index === 0) { setActiveTab("upcoming"); setActiveMetricFilter(null); setCurrentPage(1) }
      else if (index === 1) { setActiveTab("upcoming"); setActiveMetricFilter("starting-this-week"); setCurrentPage(1) }
      else if (index === 2) { setActiveTab("upcoming"); setActiveMetricFilter("compliance-alerts"); setCurrentPage(1) }
      else if (index === 3) { setActiveTab("completed"); setActiveMetricFilter(null); setCurrentPage(1) }
    })
  }, [startTabTransition])

  React.useEffect(() => {
    const timer = setTimeout(() => setActiveMetricFilter(null), 100)
    return () => clearTimeout(timer)
  }, [activeTab])

  const hasActiveFilterValues = activeFilters.some((f) => f.values.length > 0)

  const getRowClassName = React.useCallback((item: any) => {
    if (activeTab === "upcoming") {
      const isUrgent = item.daysUntilStart >= 1 && item.daysUntilStart <= 4
      const isNotReady = item.compliancePercent < 100 || item.readinessStatus !== "Ready"
      if (isUrgent && isNotReady) return "bg-destructive/10 hover:bg-destructive/15"
    }
    return ""
  }, [activeTab])

  const renderCell = React.useCallback(
    (column: ColumnConfig, item: any, _index: number) => {
      switch (column.key) {
        case "studentName":
          return (
            <div className="flex items-start gap-2 w-full overflow-hidden">
              <div className="flex-1 space-y-1 min-w-0">
                <div className={cn("data-table-clickable font-medium text-base", !column.wrapText && "line-clamp-1")} role="button" tabIndex={0} onClick={() => onItemClick?.(item.id, item.studentName, item.siteName)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onItemClick?.(item.id, item.studentName, item.siteName); } }}>
                  {item.studentName}
                </div>
                <div className={cn("text-xs text-foreground", !column.wrapText && "truncate")}>{item.studentEmail}</div>
              </div>
              {activeTab === "upcoming" && (
                <TooltipProvider>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {item.hasNewActivity && (
                      <Tooltip>
                        <TooltipTrigger asChild><div><NewBadge /></div></TooltipTrigger>
                        <TooltipContent side="top" className="bg-popover text-popover-foreground border border-border"><p className="text-xs">New activity on this schedule</p></TooltipContent>
                      </Tooltip>
                    )}
                    {item.hasNotification && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="relative p-0.5 rounded hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1" aria-label="View notifications">
                            <Bell className="h-3.5 w-3.5 text-chart-1" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent side="top" align="start" className="w-80 p-0" alignOffset={4}>
                          <div className="border-b border-border px-3 py-2">
                            <p className="text-sm font-semibold text-foreground">Notifications</p>
                            <p className="text-xs text-muted-foreground">{item.studentName} • {item.siteName}</p>
                          </div>
                          <div className="max-h-64 overflow-y-auto">
                            {getScheduleNotifications(item).map((n) => (
                              <div key={n.id} className="px-3 py-2.5 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors">
                                <div className="flex items-start gap-2">
                                  <FontAwesomeIcon name={n.icon} className={cn("h-4 w-4 mt-0.5 flex-shrink-0", n.type === "success" ? "text-chart-2" : n.type === "warning" ? "text-chart-4" : "text-chart-1")} />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </TooltipProvider>
              )}
            </div>
          )
        case "internshipName":
          return (
            <div className="space-y-1 w-full overflow-hidden">
              <div className="truncate font-medium text-base">{item.internshipName}</div>
              <div className="text-xs text-foreground truncate">{item.courseName} &bull; {item.availabilityName}</div>
              <div className="text-xs text-foreground truncate">ID: {item.scheduleId}</div>
            </div>
          )
        case "siteName":
          return (
            <div className="space-y-1 w-full overflow-hidden">
              <div className="truncate font-medium text-base data-table-clickable">{item.siteName}</div>
              <div className="text-xs text-foreground truncate">{item.location}</div>
            </div>
          )
        case "preceptor":
          return (
            <div className="space-y-1 w-full overflow-hidden">
              <div className="truncate font-medium text-base">{item.preceptorName}</div>
              <div className="text-xs text-foreground truncate">{item.preceptorTitle}</div>
            </div>
          )
        case "specialization":
          return <div className="font-medium text-base">{item.specialization}</div>
        case "startDate":
          return (<div className="space-y-1"><div className="font-medium text-base">{item.startDate}</div><div className="text-xs text-muted-foreground">{item.duration}</div></div>)
        case "endDate":
          return (<div className="space-y-1"><div className="font-medium text-base">{item.endDate}</div><div className="text-xs text-muted-foreground">{item.duration}</div></div>)
        case "readinessStatus":
          return (
            <Badge variant="secondary" className={item.readinessStatus === "Ready" ? "bg-chart-2/10 text-chip-2 border-chip-2/40" : item.readinessStatus === "Action Required" ? "bg-destructive/10 text-chip-destructive border-chip-destructive/40" : "bg-chart-4/10 text-chip-4 border-chip-4/40"}>
              {item.readinessStatus === "Ready" && <FontAwesomeIcon name="checkCircle" className="h-3 w-3 mr-1" weight="light" />}
              {item.readinessStatus === "Action Required" && <FontAwesomeIcon name="alertTriangle" className="h-3 w-3 mr-1" weight="light" />}
              {item.readinessStatus === "Pending" && <FontAwesomeIcon name="clock" className="h-3 w-3 mr-1" weight="light" />}
              {item.readinessStatus}
            </Badge>
          )
        case "daysUntilStart":
          return (
            <div className="space-y-1">
              <div className="font-medium text-base">{formatDaysUntil(item.daysUntilStart)}</div>
              <div className="text-xs text-muted-foreground">
                {item.daysUntilStart < 7 ? (<span className="flex items-center gap-1 text-chart-4"><AlertCircle className="h-3 w-3" />Starting soon</span>)
                  : item.daysUntilStart < 30 ? (<span className="flex items-center gap-1"><Clock className="h-3 w-3" />This month</span>)
                  : item.daysUntilStart < 90 ? (<span className="flex items-center gap-1"><Clock className="h-3 w-3" />This quarter</span>)
                  : (<span className="flex items-center gap-1"><Clock className="h-3 w-3" />Long-term</span>)}
              </div>
            </div>
          )
        case "progress":
          return (
            <div className="space-y-1">
              <div className="font-medium text-base">{item.progress}</div>
              <div className="w-full bg-muted rounded-full h-1.5 mt-1"><div className="bg-chart-1 h-1.5 rounded-full transition-all" style={{ width: `${item.progressPercent}%` }} /></div>
            </div>
          )
        case "compliancePercent":
          return (
            <div className="space-y-1">
              <div className="font-medium text-base">{item.compliancePercent}%</div>
              <div className="text-xs text-muted-foreground">
                {item.compliancePercent === 100 ? (<span className="flex items-center gap-1 text-chart-2"><CheckCircle className="h-3 w-3 shrink-0" />Complete</span>)
                  : item.compliancePercent >= 85 ? (<span className="flex items-center gap-1 text-chart-1"><Activity className="h-3 w-3 shrink-0" />On track</span>)
                  : (<span className="flex items-center gap-1 text-chart-4"><AlertTriangle className="h-3 w-3 shrink-0" />Action needed</span>)}
              </div>
            </div>
          )
        case "complianceMatrix": {
          const reqs = (item as any).complianceRequirements ?? []
          return (
            <div className="flex flex-wrap gap-1.5 items-center" title={reqs.map((r: any) => `${r.name}: ${r.status}`).join(", ")}>
              {reqs.map((r: any) => (
                <span
                  key={r.key}
                  className={cn(
                    "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium",
                    r.status === "Complete" && "bg-chart-2/15 text-chip-2",
                    r.status === "In Review" && "bg-chart-4/15 text-chip-4",
                    (r.status === "Missing" || r.status === "Expired") && "bg-destructive/15 text-chip-destructive"
                  )}
                >
                  {r.status === "Complete" ? <FontAwesomeIcon name="checkCircle" className="h-3 w-3" weight="light" /> : r.status === "In Review" ? <FontAwesomeIcon name="clock" className="h-3 w-3" weight="light" /> : <FontAwesomeIcon name="circleXmark" className="h-3 w-3" weight="light" />}
                  {r.name.split("/")[0]}
                </span>
              ))}
            </div>
          )
        }
        case "lastCheckin":
          return <div className="font-medium text-base">{item.lastCheckin}</div>
        case "completionDate":
          return (<div className="space-y-1"><div className="font-medium text-base">{item.completionDate}</div><div className="text-xs text-muted-foreground">{item.duration}</div></div>)
        case "finalStatus":
          return (<Badge variant="secondary" className="bg-chart-2/10 text-chip-2 border-chip-2/40"><FontAwesomeIcon name="checkCircle" className="h-3 w-3 mr-1" weight="light" />{item.finalStatus}</Badge>)
        case "finalEvaluation":
          return (
            <div className="space-y-1">
              <div className="font-medium text-base">{item.finalEvaluation}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                {parseFloat(item.finalEvaluation) >= 4.7 ? (<><CheckCircle className="h-3 w-3 text-chart-2" /><span className="text-chart-2">Excellent</span></>) : (<><CheckCircle className="h-3 w-3 text-chart-1" /><span className="text-chart-1">Good</span></>)}
              </div>
            </div>
          )
        case "actions": {
          const getPrimaryAction = () => {
            if (activeTab === "compliance") return { label: "Review", icon: Eye, onClick: () => onItemClick?.(item.id, item.studentName, item.siteName) }
            if (activeTab === "upcoming") return { label: "View", icon: Eye, onClick: () => onItemClick?.(item.id, item.studentName, item.siteName) }
            if (activeTab === "ongoing") return { label: "Progress", icon: Activity, onClick: () => onItemClick?.(item.id, item.studentName, item.siteName) }
            return { label: "Report", icon: FileText, onClick: () => onItemClick?.(item.id, item.studentName, item.siteName) }
          }
          const getMenuItems = () => {
            if (activeTab === "compliance") {
              return (<><DropdownMenuItem onClick={() => onItemClick?.(item.id, item.studentName, item.siteName)}><Eye className="h-4 w-4 mr-2" />Review Student</DropdownMenuItem><DropdownMenuItem><FileText className="h-4 w-4 mr-2" />View Documents</DropdownMenuItem></>)
            }
            if (activeTab === "upcoming") {
              return (<><DropdownMenuItem><AlertCircle className="h-4 w-4 mr-2" />Send Reminder</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem><User className="h-4 w-4 mr-2" />Contact Student</DropdownMenuItem><DropdownMenuItem><Clock className="h-4 w-4 mr-2" />Postpone Start</DropdownMenuItem></>)
            }
            if (activeTab === "ongoing") {
              return (<><DropdownMenuItem><Activity className="h-4 w-4 mr-2" />View Evaluations</DropdownMenuItem><DropdownMenuItem><Calendar className="h-4 w-4 mr-2" />Schedule Check-in</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem><User className="h-4 w-4 mr-2" />Contact Student</DropdownMenuItem><DropdownMenuItem><AlertTriangle className="h-4 w-4 mr-2" />Report Issue</DropdownMenuItem></>)
            }
            return (<><DropdownMenuItem><Download className="h-4 w-4 mr-2" />Download Certificate</DropdownMenuItem><DropdownMenuItem><FileText className="h-4 w-4 mr-2" />View Full History</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem><Download className="h-4 w-4 mr-2" />Export Records</DropdownMenuItem></>)
          }
          const primaryAction = getPrimaryAction()
          const PrimaryIcon = primaryAction.icon
          return (
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-7 px-2" onClick={primaryAction.onClick}><PrimaryIcon className="h-3.5 w-3.5 mr-1" />{primaryAction.label}</Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="min-h-11 min-w-11 md:h-7 md:w-7 p-0 touch-manipulation" aria-label="More actions"><MoreHorizontal className="h-4 w-4" aria-hidden="true" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">{getMenuItems()}</DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        }
        default:
          return <div className="font-medium text-base">{item[column.key]}</div>
      }
    },
    [activeTab, onItemClick]
  )

  const getItemId = React.useCallback((item: any) => item.id, [])

  const filtersConfig: PrimaryPageFilterConfig = {
    showFilters,
    onToggleFilters: () => setShowFilters((p) => !p),
    filterConfigs,
    activeFilters,
    onAddFilter: handleAddFilter,
    onToggleFilterValue: handleToggleFilterValue,
    onRemoveFilter: handleRemoveFilter,
    onClearAllFilters: handleClearAllFilters,
    hasActiveFilterValues,
  }

  const columnsWithOptions = React.useMemo(() => {
    return columns.map((col) => {
      const filterConfig = filterConfigs.find((f) => f.key === col.key)
      if (!filterConfig) return col
      const { options, filterType, optionVariantMap } = filterConfig as FilterConfig & { filterType?: "date" | "status"; optionVariantMap?: Record<string, string> }
      return { ...col, options, filterType, optionVariantMap }
    })
  }, [columns, filterConfigs])

  const tablePropertiesConfig: PrimaryPageTablePropertiesConfig = {
    columns: columnsWithOptions,
    onColumnChange: setColumns,
    filters: tableFilters,
    onFiltersChange: setTableFilters,
    sorts: tableSorts,
    onSortsChange: setTableSorts,
    groupBy: tableGroupBy,
    onGroupByChange: setTableGroupBy,
  }

  const sortConfigFromTable = React.useMemo(
    () => (tableSorts.length > 0 ? { columnKey: tableSorts[0].columnKey, direction: tableSorts[0].direction as "asc" | "desc" } : null),
    [tableSorts]
  )
  const groupConfigFromTable = React.useMemo(
    () => (tableGroupBy ? { columnKey: tableGroupBy.key, expanded: true } : null),
    [tableGroupBy]
  )
  const handleSortConfigChange = React.useCallback(
    (config: { columnKey: string; direction: "asc" | "desc" } | null) => {
      if (!config) {
        setTableSorts([])
        return
      }
      const col = columns.find((c) => c.key === config.columnKey)
      setTableSorts([{ id: `sort-${Date.now()}`, columnKey: config.columnKey, direction: config.direction, label: col?.label ?? config.columnKey }])
    },
    [columns]
  )
  const handleGroupConfigChange = React.useCallback(
    (config: { columnKey: string; expanded: boolean } | null) => {
      if (!config) {
        setTableGroupBy(null)
        return
      }
      const col = columns.find((c) => c.key === config.columnKey)
      setTableGroupBy(col ?? null)
    },
    [columns]
  )

  const bulkActions: PrimaryPageBulkAction[] = bulkActionDefs.map((a) => ({
    label: a.label,
    icon: a.icon,
    onClick: () => handleBulkAction(a.action, selectedItems),
    variant: a.variant,
  }))

  const complianceAlertCount = React.useMemo(
    () => studentScheduleData.filter((s) => s.compliancePercent < 85).length,
    [studentScheduleData]
  )

  const metricsBanner = showBanner ? (
    <InsightCard
      variant="compact"
      data={createInsightCardData(
        "Compliance action needed",
        `${complianceAlertCount} students are below 85% compliance and need documentation before their rotation starts.`,
        "sparkles"
      )}
      onClick={() => { setActiveTab("upcoming"); setActiveMetricFilter("compliance-alerts"); setCurrentPage(1) }}
    />
  ) : null

  const renderTabContent = React.useCallback(
    (tabId: string) => {
      return (
        <div className="w-full min-w-0 flex-1 flex flex-col">
        <DataTable
          data={currentData}
          columns={columns}
          onColumnChange={setColumns}
          selectedItems={selectedItems}
          onSelectionChange={setSelectedItems}
          renderCell={renderCell}
          getItemId={getItemId}
          showSelection={true}
          paginationInfo={paginationInfo}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => { setPageSize(newSize); setCurrentPage(1) }}
          onColumnFilter={handleAddFilter}
          getRowClassName={tabId === "upcoming" ? getRowClassName : undefined}
          sortConfig={sortConfigFromTable}
          onSortConfigChange={handleSortConfigChange}
          groupConfig={groupConfigFromTable}
          onGroupConfigChange={handleGroupConfigChange}
        />
        </div>
      )
    },
    [currentData, columns, selectedItems, paginationInfo, renderCell, getItemId, getRowClassName, handleAddFilter, sortConfigFromTable, handleSortConfigChange, groupConfigFromTable, handleGroupConfigChange]
  )

  return (
    <PrimaryPageTemplate
      title="Student Schedule"
      description="Review compliance documents for 20–100 students. Verify documents meet guidelines and quickly move through students one by one."
      metrics={{ data: computedMetrics, onMetricClick: handleMetricClick, columns: 4, banner: metricsBanner }}
      views={views}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onAddView={handleAddView}
      searchPlaceholder="Search students..."
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      filters={filtersConfig}
      tableProperties={tablePropertiesConfig}
      renderTabContent={renderTabContent}
      selectedItems={selectedItems}
      onClearSelection={handleClearSelection}
      bulkActions={bulkActions}
      className="student-schedule-page-container"
    />
  )
}