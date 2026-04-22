import * as React from "react"
import { FontAwesomeIcon } from "../brand/font-awesome-icon"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { OutlineSearchInput } from "../ui/outline-search-input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover"
import { DataTable, type ColumnConfig } from "../shared/data-table"
import { type PaginationInfo } from "../shared/pagination"
import { TableProperties } from "../shared/table-properties"
import FilterBar, { type FilterConfig, type ActiveFilter } from "../shared/filter-bar"
import { BulkActionBar, slotsBulkActions } from "../shared/floating-action-bar"
import { ViewManager, type ViewSettings } from "../shared/view-manager"
import { MetricCard, createMetricCardData } from "../shared/metric-card"
import { slotsData as availabilityData } from "../../data/mock-data"

const requestedSlotsMetrics = [
  createMetricCardData(
    "Pending Requests",
    "48",
    "clock",
    "text-chart-4",
    {
      change: "+8%",
      trend: "up",
      description: "Awaiting review",
    }
  ),
  createMetricCardData(
    "This Week",
    "12",
    "calendar",
    "text-muted-foreground",
    {
      change: "+2",
      trend: "up",
      description: "New requests",
    }
  ),
  createMetricCardData(
    "Avg. Response Time",
    "2.5 days",
    "activity",
    "text-chart-3",
    {
      change: "-0.5",
      trend: "down",
      description: "Faster processing",
    }
  ),
]

interface ViewData {
  name: string;
  count: string;
  id: string;
  type: string;
  settings: ViewSettings | null;
}

interface RequestedSlotsPageProps {
  onItemClick?: (itemId: string) => void
}

export function RequestedSlotsPage({ onItemClick }: RequestedSlotsPageProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [activeTab, setActiveTab] = React.useState("all")
  const [selectedItems, setSelectedItems] = React.useState<string[]>([])
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(25)
  const [showFilters, setShowFilters] = React.useState(false)
  const [activeFilters, setActiveFilters] = React.useState<ActiveFilter[]>([])
  const [views, setViews] = React.useState<ViewData[]>([
    { name: "All Requests", count: "48", id: "all", type: "table", settings: null },
    { name: "Urgent", count: "5", id: "urgent", type: "table", settings: null },
    { name: "This Week", count: "12", id: "this-week", type: "table", settings: null }
  ])

  const [tableFilters, setTableFilters] = React.useState<any[]>([])
  const [tableSorts, setTableSorts] = React.useState<any[]>([])
  const [tableGroupBy, setTableGroupBy] = React.useState<any>(null)

  const filterConfigs: FilterConfig[] = React.useMemo(() => [
    { key: "location", label: "Location", icon: "mapPin", options: Array.from(new Set(availabilityData.map(item => item.location))).sort() },
    { key: "discipline", label: "Discipline", icon: "graduation-cap", options: Array.from(new Set(availabilityData.map(item => item.discipline))).sort() },
    { key: "experienceType", label: "Experience Type", icon: "users", options: Array.from(new Set(availabilityData.map(item => item.experienceType))).sort() },
  ], [])

  const activeView = views.find(view => view.id === activeTab);

  const [columns, setColumns] = React.useState<ColumnConfig[]>(() => {
    const defaultColumns: ColumnConfig[] = [
      { key: "select", label: "Select", icon: "checkCircle", isPinned: false, pinSide: undefined, isVisible: true, width: 60, minWidth: 60 },
      { key: "siteName", label: "Site Name", icon: "mapPin", isPinned: false, pinSide: undefined, isVisible: true, width: 280, minWidth: 200, sortable: true, filterable: true, groupable: true },
      { key: "experienceType", label: "Experience Type", icon: "users", isPinned: false, pinSide: undefined, isVisible: true, width: 140, minWidth: 120, sortable: true, filterable: true, groupable: true, options: ["Individual", "Group"] },
      { key: "discipline", label: "Discipline/Specialization", icon: "graduation-cap", isPinned: false, pinSide: undefined, isVisible: true, width: 220, minWidth: 180, sortable: true, filterable: true, groupable: true },
      { key: "shiftAndDays", label: "Shift & Days", icon: "clock", isPinned: false, pinSide: undefined, isVisible: true, width: 220, minWidth: 180, sortable: true },
      { key: "requestedDuration", label: "Requested Duration", icon: "calendar", isPinned: false, pinSide: undefined, isVisible: true, width: 200, minWidth: 180, sortable: true },
      { key: "slots", label: "Slots", icon: "user", isPinned: false, pinSide: undefined, isVisible: true, width: 180, minWidth: 160, sortable: true },
      { key: "dateOfRequest", label: "Date of Request", icon: "calendar", isPinned: false, pinSide: undefined, isVisible: true, width: 140, minWidth: 120, sortable: true },
      { key: "lastUpdated", label: "Last Updated", icon: "clock", isPinned: false, pinSide: undefined, isVisible: true, width: 140, minWidth: 120, sortable: true },
      { key: "pendingDuration", label: "Pending Duration", icon: "clock", isPinned: false, pinSide: undefined, isVisible: true, width: 140, minWidth: 120, sortable: true },
      { key: "status", label: "Status", icon: "alertCircle", isPinned: false, pinSide: undefined, isVisible: true, width: 140, minWidth: 120, sortable: true, filterable: true, groupable: true, options: ["Request Pending", "Approved"] },
      { key: "actions", label: "Actions", icon: "activity", isPinned: false, pinSide: undefined, isVisible: true, width: 80, minWidth: 80 },
    ];
    return defaultColumns;
  });

  React.useEffect(() => {
    if (activeView?.settings?.columns) {
      setColumns(activeView.settings.columns);
    }
  }, [activeView]);

  const filteredData = React.useMemo(() => {
    let data = availabilityData.filter(item => item.isNewRequest || item.hasRecentRequest);
    if (searchQuery.trim()) {
      data = data.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.discipline.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    activeFilters.forEach((filter) => {
      if (filter.values.length > 0) {
        data = data.filter((item) => filter.values.includes(String((item as any)[filter.key])));
      }
    });
    return data;
  }, [activeTab, searchQuery, activeFilters])

  const paginationInfo: PaginationInfo = React.useMemo(() => {
    const totalItems = filteredData.length
    const totalPages = Math.ceil(totalItems / pageSize)
    const startItem = (currentPage - 1) * pageSize + 1
    const endItem = Math.min(currentPage * pageSize, totalItems)
    return { currentPage, totalPages, pageSize, totalItems, startItem, endItem }
  }, [filteredData.length, currentPage, pageSize])

  const currentData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredData.slice(startIndex, startIndex + pageSize)
  }, [filteredData, currentPage, pageSize])

  const handleAddFilter = (filterKey: string) => {
    const existingFilter = activeFilters.find(filter => filter.key === filterKey);
    if (existingFilter) { setShowFilters(true); return; }
    setActiveFilters(prev => [...prev, { id: `${filterKey}_${Date.now()}`, key: filterKey, label: filterConfigs.find(c => c.key === filterKey)?.label || filterKey, values: [], removable: true }]);
    setShowFilters(true);
  };

  const handleToggleFilterValue = (filterId: string, value: string) => {
    setActiveFilters(prev => prev.map(filter => {
      if (filter.id === filterId) {
        const newValues = filter.values.includes(value) ? filter.values.filter(v => v !== value) : [...filter.values, value]
        return { ...filter, values: newValues }
      }
      return filter
    }))
    setCurrentPage(1)
  }

  const handleRemoveFilter = (filterId: string) => { setActiveFilters(prev => prev.filter(filter => filter.id !== filterId)); setCurrentPage(1) }
  const handleClearAllFilters = () => { setActiveFilters([]); setCurrentPage(1) }

  const renderCell = (column: ColumnConfig, item: any, index: number) => {
    switch (column.key) {
      case "siteName":
        return (
          <div className="space-y-1 w-full overflow-hidden">
            <div className="flex items-center gap-2 min-w-0">
              <div className="line-clamp-2 data-table-clickable min-w-0 flex-1 break-words font-medium text-base" role="button" tabIndex={0} onClick={() => onItemClick?.(item.id)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onItemClick?.(item.id); } }}>{item.location}</div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
              <span>Request ID: {item.id}</span>
              {item.requestedBy === "school" && item.program && (<><span>•</span><span>{item.program} Program</span></>)}
            </div>
          </div>
        )
      case "experienceType":
        return (<Badge variant="secondary" withIcon iconPosition="left" className="w-fit">{item.experienceType === "Group" ? <FontAwesomeIcon name="users" className="h-3 w-3" weight="light" /> : <FontAwesomeIcon name="user" className="h-3 w-3" weight="light" />}{item.experienceType}</Badge>)
      case "discipline":
        return (<div className="space-y-1 w-full overflow-hidden"><div className="truncate font-medium text-base">{item.discipline}</div><div className="text-xs text-muted-foreground truncate">{item.specialization}</div></div>)
      case "shiftAndDays":
        return (<div className="space-y-1 w-full overflow-hidden"><div className="truncate font-medium text-base">Evening (13:00 - 17:00)</div><div className="text-xs text-muted-foreground truncate">Mon, Wed, Fri</div></div>)
      case "requestedDuration":
        return (<div className="space-y-1 w-full overflow-hidden"><div className="truncate font-medium text-base">{item.startDate} - {item.endDate}</div><div className="text-xs text-muted-foreground"><div className="flex items-center gap-1"><Calendar className="h-3 w-3 text-muted-foreground" />{item.duration}</div></div></div>)
      case "slots":
        return (<div className="space-y-1"><div className="font-medium text-base">{item.totalRequest || 5} Requested</div><div className="text-xs text-muted-foreground"><span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-chart-2" />{item.pendingReview || 2} confirmed</span></div></div>)
      case "dateOfRequest":
        return (<div className="font-medium text-base">01/15/2026</div>)
      case "lastUpdated":
        return (<div className="font-medium text-base text-muted-foreground">{Math.floor(Math.random() * 24) + 1}hr ago</div>)
      case "pendingDuration":
        return (<div className="font-medium text-base">{Math.floor(Math.random() * 10) + 1} days</div>)
      case "status":
        return (<Badge variant={item.isNewRequest ? "default" : "secondary"} className={item.isNewRequest ? "bg-chart-4/10 text-chip-4 border-chip-4/40" : "bg-chart-2/10 text-chip-2 border-chip-2/40"}>{item.isNewRequest ? "Request Pending" : "Approved"}</Badge>)
      case "actions":
        return (<div className="flex items-center gap-1"><Button variant="ghost" size="sm" className="min-h-11 min-w-11 md:h-7 md:w-7 p-0 touch-manipulation" aria-label="Edit"><Edit className="h-4 w-4" aria-hidden="true" /></Button><Button variant="ghost" size="sm" className="min-h-11 min-w-11 md:h-7 md:w-7 p-0 touch-manipulation" aria-label="More actions"><MoreHorizontal className="h-4 w-4" aria-hidden="true" /></Button></div>)
      default:
        return <div className="font-medium text-base">{item[column.key]}</div>
    }
  }

  const getItemId = (item: any) => item.id
  const hasActiveFilterValues = activeFilters.some(filter => filter.values.length > 0)
  const handleClearSelection = () => { setSelectedItems([]) }
  const handleBulkAction = (_action: string, _selectedIds: string[]) => { setSelectedItems([]) }

  const handleAddView = (viewName: string, viewSettings: ViewSettings) => {
    const newView: ViewData = { name: viewName, count: "0", id: `view_${Date.now()}`, type: viewSettings.type, settings: viewSettings }
    setViews(prev => [...prev, newView])
    setActiveTab(newView.id)
  }

  return (
    <div className="requested-slots-page-container px-4 lg:px-6 pt-4 lg:pt-6 space-y-6 max-w-full overflow-clip" data-page="requested-slots">
      <div className="space-y-2">
        <h1 className="page-title-sm">Requested Slots</h1>
        <p className="text-muted-foreground">Review and manage incoming slot requests from students</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {requestedSlotsMetrics.map((metric, index) => (<MetricCard key={index} data={metric} variant="small" className="p-4" />))}
      </div>

      <div className="bg-card border border-border rounded-lg overflow-clip min-w-0">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-fit">
              <TabsList>
                {views.map((view) => (<TabsTrigger key={view.id} value={view.id}><div className="flex items-center gap-2"><span>{view.name}</span><Badge variant="secondary" className="h-4 px-1.5">{view.count}</Badge></div></TabsTrigger>))}
              </TabsList>
            </Tabs>
            <ViewManager onAddView={handleAddView} />
          </div>
          <div className="flex items-center gap-4">
            <OutlineSearchInput placeholder="Search requests..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-64" expandable />
            <Button variant={showFilters || hasActiveFilterValues ? "default" : "outline"} size="sm" className="h-8 w-8 p-0" onClick={() => setShowFilters(!showFilters)} aria-label={showFilters ? "Hide filters" : "Show filters"}><Filter className="h-4 w-4" aria-hidden="true" /></Button>
            <TableProperties columns={columns} onColumnChange={setColumns} filters={tableFilters} onFiltersChange={setTableFilters} sorts={tableSorts} onSortsChange={setTableSorts} groupBy={tableGroupBy} onGroupByChange={setTableGroupBy} />
          </div>
        </div>

        {showFilters && (<FilterBar filterConfigs={filterConfigs} activeFilters={activeFilters} onAddFilter={handleAddFilter} onToggleFilterValue={handleToggleFilterValue} onRemoveFilter={handleRemoveFilter} onClearAll={handleClearAllFilters} />)}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="all" className="m-0">
            <DataTable data={currentData} columns={columns} onColumnChange={setColumns} selectedItems={selectedItems} onSelectionChange={setSelectedItems} renderCell={renderCell} getItemId={getItemId} showSelection={true} paginationInfo={paginationInfo} onPageChange={setCurrentPage} onPageSizeChange={(newSize) => { setPageSize(newSize); setCurrentPage(1) }} onColumnFilter={handleAddFilter} />
          </TabsContent>
          <TabsContent value="urgent" className="min-h-[400px] m-0"><div className="p-8 text-center text-muted-foreground h-full flex flex-col items-center justify-center"><FontAwesomeIcon name="clock" className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" /><p>No urgent requests found</p></div></TabsContent>
          <TabsContent value="this-week" className="min-h-[400px] m-0"><div className="p-8 text-center text-muted-foreground h-full flex flex-col items-center justify-center"><FontAwesomeIcon name="calendar" className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" /><p>No requests from this week</p></div></TabsContent>
        </Tabs>
      </div>

      {selectedItems.length > 0 && (
        <BulkActionBar selectedCount={selectedItems.length} selectedItems={selectedItems} onClearSelection={handleClearSelection} onBulkAction={handleBulkAction} actions={slotsBulkActions} />
      )}
    </div>
  )
}