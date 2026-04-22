import * as React from "react"
import { FontAwesomeIcon } from "../brand/font-awesome-icon"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { OutlineSearchInput } from "../ui/outline-search-input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { DataTable, type ColumnConfig } from "../shared/data-table"
import { type PaginationInfo } from "../shared/pagination"
import { TableProperties } from "../shared/table-properties"
import FilterBar, { type FilterConfig, type ActiveFilter } from "../shared/filter-bar"
import { BulkActionBar, slotsBulkActions } from "../shared/floating-action-bar"
import { ViewManager, type ViewSettings } from "../shared/view-manager"
import { MetricCard, createMetricCardData } from "../shared/metric-card"
import { slotsData as availabilityData } from "../../data/mock-data"

const approvedSlotsMetrics = [
  createMetricCardData("Total Approved", "124", "checkCircle", "text-chart-2", { change: "+15%", trend: "up", description: "This semester" }),
  createMetricCardData("Active Slots", "98", "activity", "text-muted-foreground", { change: "+12", trend: "up", description: "Currently active" }),
  createMetricCardData("Completion Rate", "94%", "trendingUp", "text-chart-3", { change: "+2%", trend: "up", description: "Success rate" }),
]

interface ViewData { name: string; count: string; id: string; type: string; settings: ViewSettings | null; }
interface ApprovedSlotsPageProps { onItemClick?: (itemId: string) => void }

export function ApprovedSlotsPage({ onItemClick }: ApprovedSlotsPageProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [activeTab, setActiveTab] = React.useState("active")
  const [selectedItems, setSelectedItems] = React.useState<string[]>([])
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(25)
  const [showFilters, setShowFilters] = React.useState(false)
  const [activeFilters, setActiveFilters] = React.useState<ActiveFilter[]>([])
  const [views, setViews] = React.useState<ViewData[]>([
    { name: "Active", count: "98", id: "active", type: "table", settings: null },
    { name: "Upcoming", count: "26", id: "upcoming", type: "table", settings: null },
    { name: "Completed", count: "85", id: "completed", type: "table", settings: null }
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
  const [columns, setColumns] = React.useState<ColumnConfig[]>(() => [
    { key: "select", label: "Select", icon: "checkCircle", isPinned: false, pinSide: undefined, isVisible: true, width: 60, minWidth: 60 },
    { key: "name", label: "Approved Slot", icon: "door-open", isPinned: false, pinSide: undefined, isVisible: true, width: 300, minWidth: 200, sortable: true, filterable: true, groupable: true, options: Array.from(new Set(availabilityData.map(item => item.name))).sort() },
    { key: "experienceType", label: "Experience Type", icon: "users", isPinned: false, pinSide: undefined, isVisible: true, width: 140, minWidth: 120, sortable: true, filterable: true, groupable: true, options: Array.from(new Set(availabilityData.map(item => item.experienceType))).sort() },
    { key: "location", label: "Location", icon: "mapPin", isPinned: false, pinSide: undefined, isVisible: true, width: 160, minWidth: 140, sortable: true, filterable: true, groupable: true, options: Array.from(new Set(availabilityData.map(item => item.location))).sort() },
    { key: "discipline", label: "Discipline", icon: "activity", isPinned: false, pinSide: undefined, isVisible: true, width: 160, minWidth: 150, sortable: true, filterable: true, groupable: true, options: Array.from(new Set(availabilityData.map(item => item.discipline))).sort() },
    { key: "schedule", label: "Duration", icon: "calendar", isPinned: false, pinSide: undefined, isVisible: true, width: 180, minWidth: 160, sortable: true },
    { key: "slots", label: "Slots", icon: "userCheck", isPinned: false, pinSide: undefined, isVisible: true, width: 180, minWidth: 160, sortable: true },
    { key: "lastRequested", label: "Approved Date", icon: "checkCircle", isPinned: false, pinSide: undefined, isVisible: true, width: 140, minWidth: 120, sortable: true },
    { key: "actions", label: "Actions", icon: "activity", isPinned: false, pinSide: undefined, isVisible: true, width: 80, minWidth: 80 },
  ]);

  React.useEffect(() => { if (activeView?.settings?.columns) setColumns(activeView.settings.columns); }, [activeView]);

  const filteredData = React.useMemo(() => {
    let data = availabilityData.filter(item => !item.isNewRequest);
    if (searchQuery.trim()) { data = data.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.location.toLowerCase().includes(searchQuery.toLowerCase()) || item.discipline.toLowerCase().includes(searchQuery.toLowerCase())); }
    activeFilters.forEach((filter) => {
      if (filter.values.length > 0) {
        data = data.filter((item) => filter.values.includes(String((item as any)[filter.key])));
      }
    });
    return data;
  }, [activeTab, searchQuery, activeFilters])

  const paginationInfo: PaginationInfo = React.useMemo(() => {
    const totalItems = filteredData.length; const totalPages = Math.ceil(totalItems / pageSize); const startItem = (currentPage - 1) * pageSize + 1; const endItem = Math.min(currentPage * pageSize, totalItems);
    return { currentPage, totalPages, pageSize, totalItems, startItem, endItem }
  }, [filteredData.length, currentPage, pageSize])

  const currentData = React.useMemo(() => filteredData.slice((currentPage - 1) * pageSize, (currentPage - 1) * pageSize + pageSize), [filteredData, currentPage, pageSize])

  const handleAddFilter = (filterKey: string) => { const existing = activeFilters.find(f => f.key === filterKey); if (existing) { setShowFilters(true); return; } setActiveFilters(prev => [...prev, { id: `${filterKey}_${Date.now()}`, key: filterKey, label: filterConfigs.find(c => c.key === filterKey)?.label || filterKey, values: [], removable: true }]); setShowFilters(true) }
  const handleToggleFilterValue = (filterId: string, value: string) => { setActiveFilters(prev => prev.map(f => f.id === filterId ? { ...f, values: f.values.includes(value) ? f.values.filter(v => v !== value) : [...f.values, value] } : f)); setCurrentPage(1) }
  const handleRemoveFilter = (filterId: string) => { setActiveFilters(prev => prev.filter(f => f.id !== filterId)); setCurrentPage(1) }
  const handleClearAllFilters = () => { setActiveFilters([]); setCurrentPage(1) }

  const renderCell = (column: ColumnConfig, item: any, index: number) => {
    switch (column.key) {
      case "name":
        return (<div className="space-y-1 w-full overflow-hidden"><div className="flex items-center gap-2 min-w-0"><div className="line-clamp-2 data-table-clickable min-w-0 flex-1 break-words font-medium text-base" role="button" tabIndex={0} onClick={() => onItemClick?.(item.id)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onItemClick?.(item.id); } }}>{item.name}</div></div><div className="text-xs text-muted-foreground truncate">ID: {item.id}</div></div>)
      case "experienceType":
        return (<Badge variant="secondary" withIcon iconPosition="left" className="w-fit">{item.experienceType === "Group" ? <FontAwesomeIcon name="users" className="h-3 w-3" weight="light" /> : <FontAwesomeIcon name="user" className="h-3 w-3" weight="light" />}{item.experienceType}</Badge>)
      case "location":
        return (<div className="truncate w-full font-medium text-base">{item.location}</div>)
      case "discipline":
        return (<div className="space-y-1 w-full overflow-hidden"><div className="truncate font-medium text-base">{item.discipline}</div><div className="text-xs text-muted-foreground truncate">{item.specialization}</div></div>)
      case "schedule":
        return (<div className="space-y-1 w-full overflow-hidden"><div className="truncate font-medium text-base">{item.startDate} - {item.endDate}</div><div className="text-xs text-muted-foreground">{item.duration}</div></div>)
      case "slots":
        return (<div className="space-y-1"><div className="font-medium text-base">{item.totalRequest}/{item.totalSlots || 10} Assigned</div><div className="text-xs text-muted-foreground">{item.totalSlots && item.totalSlots - item.totalRequest > 0 ? (<span className="flex items-center gap-1"><AlertCircle className="h-3 w-3 text-chart-4" />{item.totalSlots - item.totalRequest} to assign</span>) : (<span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-chart-2" />Fully assigned</span>)}</div></div>)
      case "lastRequested":
        return (<div>{item.lastRequestTime ? (<div className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-chart-2" /><span className="text-foreground font-medium text-base">{item.lastRequestTime}</span></div>) : (<span className="text-muted-foreground">N/A</span>)}</div>)
      case "actions":
        return (<DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="min-h-11 min-w-11 md:h-7 md:w-7 p-0 touch-manipulation" aria-label="Open menu"><MoreHorizontal className="h-4 w-4" aria-hidden="true" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-48"><DropdownMenuItem onClick={() => onItemClick?.(item.id)}><Eye className="h-4 w-4 mr-2" />View Details</DropdownMenuItem><DropdownMenuItem><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem className="text-destructive"><XCircle className="h-4 w-4 mr-2" />Revoke Approval</DropdownMenuItem></DropdownMenuContent></DropdownMenu>)
      default:
        return <div className="font-medium text-base">{item[column.key]}</div>
    }
  }

  const getItemId = (item: any) => item.id
  const hasActiveFilterValues = activeFilters.some(f => f.values.length > 0)
  const handleClearSelection = () => setSelectedItems([])
  const handleBulkAction = (_action: string, _selectedIds: string[]) => { setSelectedItems([]) }
  const handleAddView = (viewName: string, viewSettings: ViewSettings) => { setViews(prev => [...prev, { name: viewName, count: "0", id: `view_${Date.now()}`, type: viewSettings.type, settings: viewSettings }]); setActiveTab(`view_${Date.now()}`) }

  return (
    <div className="approved-slots-page-container px-4 lg:px-6 pt-4 lg:pt-6 pb-20 space-y-6 max-w-full overflow-clip" data-page="approved-slots">
      <div className="space-y-2"><h1 className="page-title-sm">Approved Slots</h1><p className="text-muted-foreground">Manage and monitor approved slot assignments for students</p></div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{approvedSlotsMetrics.map((metric, index) => (<MetricCard key={index} data={metric} variant="small" className="p-4" />))}</div>
      <div className="bg-card border border-border rounded-lg overflow-clip min-w-0">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-fit"><TabsList>{views.map((view) => (<TabsTrigger key={view.id} value={view.id}><div className="flex items-center gap-2"><span>{view.name}</span><Badge variant="secondary" className="h-4 px-1.5">{view.count}</Badge></div></TabsTrigger>))}</TabsList></Tabs>
            <ViewManager onAddView={handleAddView} />
          </div>
          <div className="flex items-center gap-4">
            <OutlineSearchInput placeholder="Search approved slots..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-64" expandable />
            <Button variant={showFilters || hasActiveFilterValues ? "default" : "outline"} size="sm" className="h-8 w-8 p-0" onClick={() => setShowFilters(!showFilters)} aria-label={showFilters ? "Hide filters" : "Show filters"}><Filter className="h-4 w-4" aria-hidden="true" /></Button>
            <TableProperties columns={columns} onColumnChange={setColumns} filters={tableFilters} onFiltersChange={setTableFilters} sorts={tableSorts} onSortsChange={setTableSorts} groupBy={tableGroupBy} onGroupByChange={setTableGroupBy} />
          </div>
        </div>
        {showFilters && (<FilterBar filterConfigs={filterConfigs} activeFilters={activeFilters} onAddFilter={handleAddFilter} onToggleFilterValue={handleToggleFilterValue} onRemoveFilter={handleRemoveFilter} onClearAll={handleClearAllFilters} />)}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="active" className="m-0"><DataTable data={currentData} columns={columns} onColumnChange={setColumns} selectedItems={selectedItems} onSelectionChange={setSelectedItems} renderCell={renderCell} getItemId={getItemId} showSelection={true} paginationInfo={paginationInfo} onPageChange={setCurrentPage} onPageSizeChange={(newSize) => { setPageSize(newSize); setCurrentPage(1) }} onColumnFilter={handleAddFilter} /></TabsContent>
          <TabsContent value="upcoming" className="min-h-[400px] m-0"><div className="p-8 text-center text-muted-foreground h-full flex flex-col items-center justify-center"><FontAwesomeIcon name="calendar" className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" /><p>No upcoming approved slots</p></div></TabsContent>
          <TabsContent value="completed" className="min-h-[400px] m-0"><div className="p-8 text-center text-muted-foreground h-full flex flex-col items-center justify-center"><FontAwesomeIcon name="checkCircle" className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" /><p>No completed slots</p></div></TabsContent>
        </Tabs>
      </div>
      {selectedItems.length > 0 && (<BulkActionBar selectedCount={selectedItems.length} selectedItems={selectedItems} onClearSelection={handleClearSelection} onBulkAction={handleBulkAction} actions={slotsBulkActions} />)}
    </div>
  )
}