"use client"

import * as React from "react"
import {
  Settings,
  Eye,
  EyeOff,
  Pin,
  GripVertical,
  Filter,
  ArrowUpDown,
  Grid,
  X,
  Check,
  SortAsc,
  SortDesc,
  Plus,
  PinOff,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Palette,
  Table2,
  MoreHorizontal,
  Trash2,
} from "lucide-react"
import { Button } from "../ui/button"
import { Label } from "../ui/label"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"
import { Switch } from "../ui/switch"
import { Badge } from "../ui/badge"
import { Checkbox } from "../ui/checkbox"
import { cn } from "../ui/utils"
import { FontAwesomeIcon, type IconName } from "../brand/font-awesome-icon"
import { Drawer } from "./drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "../ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import {
  FilterClauseEditor,
  FilterClause,
  FilterClauseConnector,
} from "./filter-clause"
/** Preset date range options for date filters */
export const DATE_PRESET_OPTIONS = [
  "Today",
  "Yesterday",
  "Last 7 days",
  "Next 7 days",
  "Last 30 days",
  "Next 30 days",
  "This week",
  "Last week",
  "This month",
  "Last month",
] as const

export interface ColumnConfig {
  key: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  isPinned: boolean
  pinSide?: 'left' | 'right'
  isVisible: boolean
  width: number
  minWidth: number
  sortable?: boolean
  filterable?: boolean
  groupable?: boolean
  options?: string[]
  /** Filter UI variant: "date" = presets + exact dates, "status" = chips with badges */
  filterType?: "date" | "status"
  /** Badge className per option value (for status filters) */
  optionVariantMap?: Record<string, string>
}

interface FilterConfig {
  id: string
  columnKey: string
  label: string
  values: string[]
  /** Operator before this filter: "and" | "or" (default: "and") */
  operator?: "and" | "or"
}

interface SortConfig {
  id: string
  columnKey: string
  direction: string
  label: string
}

export interface TableDisplayConfig {
  pinExpandRowButton?: boolean
  bottomNewRowButton?: boolean
  gridlines?: boolean
  freezeColumns?: "none" | "left" | "right"
  rowHeight?: "compact" | "comfortable" | "all-lines"
}

interface TablePropertiesProps {
  columns: ColumnConfig[]
  onColumnChange: (columns: ColumnConfig[]) => void
  filters?: FilterConfig[]
  onFiltersChange?: (filters: FilterConfig[]) => void
  sorts?: SortConfig[]
  onSortsChange?: (sorts: SortConfig[]) => void
  groupBy?: any
  onGroupByChange?: (groupBy: any) => void
  /** Optional view title (e.g. "View of Projects 2026") */
  viewTitle?: string
  /** Table display options — local state if not provided */
  tableDisplay?: TableDisplayConfig
  onTableDisplayChange?: (config: TableDisplayConfig) => void
}

type SettingsSection = "table-display" | "filter" | "sort" | "group" | "columns" | "conditional-format" | null

const defaultTableDisplay: TableDisplayConfig = {
  pinExpandRowButton: false,
  bottomNewRowButton: false,
  gridlines: true,
  freezeColumns: "none",
  rowHeight: "comfortable",
}

export function TableProperties({
  columns,
  onColumnChange,
  filters = [],
  onFiltersChange,
  sorts = [],
  onSortsChange,
  groupBy,
  onGroupByChange,
  viewTitle = "View Settings",
  tableDisplay: tableDisplayProp,
  onTableDisplayChange,
}: TablePropertiesProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [activeSection, setActiveSection] = React.useState<SettingsSection>(null)
  const [tableDisplay, setTableDisplay] = React.useState<TableDisplayConfig>(
    () => tableDisplayProp ?? defaultTableDisplay
  )
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null)
  const [openFilterId, setOpenFilterId] = React.useState<string | null>(null)
  const [searchTerms, setSearchTerms] = React.useState<Record<string, string>>({})
  const [expandedFilterIds, setExpandedFilterIds] = React.useState<Set<string>>(new Set())
  const [showGetStartedCard, setShowGetStartedCard] = React.useState(true)

  const visibleColumns = columns.filter(col => col.isVisible)
  const filterableColumns = columns.filter(col => col.filterable)
  const sortableColumns = columns.filter(col => col.sortable)
  const groupableColumns = columns.filter(col => col.groupable)
  const hiddenColumnsCount = columns.filter(col => !col.isVisible).length

  // Sync tableDisplay when controlled
  React.useEffect(() => {
    if (tableDisplayProp) setTableDisplay(tableDisplayProp)
  }, [tableDisplayProp])

  const handleTableDisplayChange = React.useCallback(
    (updates: Partial<TableDisplayConfig>) => {
      const next = { ...tableDisplay, ...updates }
      setTableDisplay(next)
      onTableDisplayChange?.(next)
    },
    [tableDisplay, onTableDisplayChange]
  )

  // Column drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index.toString())
    
    // Add drag styling to the dragged element
    const target = e.currentTarget as HTMLElement
    target.style.opacity = '0.5'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear drag over if we're leaving the entire element
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverIndex(null)
    }
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    setDragOverIndex(null)
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      return
    }

    const newColumns = [...columns]
    const draggedColumn = newColumns[draggedIndex]
    
    newColumns.splice(draggedIndex, 1)
    newColumns.splice(dropIndex, 0, draggedColumn)
    
    onColumnChange(newColumns)
    setDraggedIndex(null)
  }

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement
    target.style.opacity = '1'
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleToggleColumnVisibility = (columnKey: string) => {
    const newColumns = columns.map(col => 
      col.key === columnKey ? { ...col, isVisible: !col.isVisible } : col
    )
    onColumnChange(newColumns)
  }

  const handleToggleColumnPin = (columnKey: string, pinSide?: 'left' | 'right') => {
    const newColumns = columns.map(col => {
      if (col.key === columnKey) {
        if (pinSide) {
          return { ...col, isPinned: true, pinSide }
        } else {
          return { ...col, isPinned: false, pinSide: undefined }
        }
      }
      return col
    })
    onColumnChange(newColumns)
  }

  // Filter handlers
  const handleAddFilter = (columnKey: string) => {
    if (!onFiltersChange) return
    
    const column = columns.find(col => col.key === columnKey)
    if (!column) return

    const newFilter: FilterConfig = {
      id: `filter-${Date.now()}`,
      columnKey: columnKey,
      label: column.label,
      values: [],
      operator: filters.length > 0 ? "and" : undefined,
    }
    onFiltersChange([...filters, newFilter])
    setExpandedFilterIds(prev => new Set([...prev, newFilter.id]))
    setTimeout(() => setOpenFilterId(newFilter.id), 0)
  }

  const handleRemoveFilter = (filterId: string) => {
    if (!onFiltersChange) return
    onFiltersChange(filters.filter(filter => filter.id !== filterId))
    setOpenFilterId(null)
  }

  const handleToggleFilterValue = (filterId: string, value: string) => {
    if (!onFiltersChange) return
    
    const newFilters = filters.map(filter => {
      if (filter.id !== filterId) return filter
      
      const newValues = filter.values.includes(value)
        ? filter.values.filter(v => v !== value)
        : [...filter.values, value]
      
      return { ...filter, values: newValues }
    })
    onFiltersChange(newFilters)
  }

  const handleClearAllFilterValues = (filterId: string) => {
    if (!onFiltersChange) return

    const newFilters = filters.map(filter =>
      filter.id === filterId ? { ...filter, values: [] } : filter
    )
    onFiltersChange(newFilters)
  }

  const handleReplaceFilterValues = (filterId: string, values: string[]) => {
    if (!onFiltersChange) return
    const newFilters = filters.map(filter =>
      filter.id === filterId ? { ...filter, values } : filter
    )
    onFiltersChange(newFilters)
  }

  const handleSearchChange = (filterId: string, searchTerm: string) => {
    setSearchTerms(prev => ({
      ...prev,
      [filterId]: searchTerm
    }))
  }

  const handleToggleFilterExpand = (filterId: string) => {
    setExpandedFilterIds(prev => {
      const next = new Set(prev)
      if (next.has(filterId)) next.delete(filterId)
      else next.add(filterId)
      return next
    })
  }

  const handleSetFilterOperator = (filterIndex: number, operator: "and" | "or") => {
    if (!onFiltersChange || filterIndex < 1) return
    const newFilters = [...filters]
    newFilters[filterIndex] = { ...newFilters[filterIndex], operator }
    onFiltersChange(newFilters)
  }

  const getFilteredOptions = (filter: FilterConfig) => {
    const column = columns.find(col => col.key === filter.columnKey)
    if (!column || !column.options) return []
    
    const searchTerm = searchTerms[filter.id] || ''
    if (!searchTerm) return column.options
    
    return column.options.filter(option =>
      option.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const getFilterConditionText = (filter: FilterConfig) => {
    if (filter.values.length === 0) return "is any of"
    if (filter.values.length === 1) return `is ${filter.values[0]}`
    return `is ${filter.values.slice(0, 2).join(" or ")}${filter.values.length > 2 ? ` +${filter.values.length - 2}` : ""}`
  }

  // Sort handlers
  const handleAddSortColumn = (columnKey: string, direction: 'asc' | 'desc' = 'asc') => {
    if (!onSortsChange) return
    
    const column = columns.find(col => col.key === columnKey)
    if (!column) return

    const newSort: SortConfig = {
      id: `sort-${Date.now()}`,
      columnKey: columnKey,
      direction: direction,
      label: column.label,
    }
    onSortsChange([...sorts, newSort])
  }

  const handleRemoveSort = (sortId: string) => {
    if (!onSortsChange) return
    onSortsChange(sorts.filter(sort => sort.id !== sortId))
  }

  const handleUpdateSort = (sortId: string, updates: Partial<SortConfig>) => {
    if (!onSortsChange) return
    const newSorts = sorts.map((sort) => {
      if (sort.id !== sortId) return sort
      const next = { ...sort, ...updates }
      if (updates.columnKey) {
        const col = columns.find((c) => c.key === updates.columnKey)
        if (col) next.label = col.label
      }
      return next
    })
    onSortsChange(newSorts)
  }

  // Group handlers
  const handleSetGroup = (column: any) => {
    if (!onGroupByChange) return
    onGroupByChange(groupBy?.key === column.key ? null : column)
  }

  const addedFilterKeys = filters.map(filter => filter.columnKey)
  const availableFilters = filterableColumns.filter(
    col => !addedFilterKeys.includes(col.key)
  )

  const getFilterOperatorLabel = (filter: FilterConfig) => {
    if (filter.values.length === 0) return "is any of"
    if (filter.values.length === 1) return `is ${filter.values[0]}`
    return `is ${filter.values.length} selected`
  }

  const renderFilterSection = () => (
    <div className="space-y-4">
      {/* Filter clauses */}
      {filters.length > 0 && (
        <div className="space-y-0">
          {filters.map((filter, index) => {
            const column = columns.find(col => col.key === filter.columnKey)
            if (!column) return null
            const isExpanded = expandedFilterIds.has(filter.id)
            const operator = filter.operator ?? "and"
            const filteredOptions = getFilteredOptions(filter)
            const editorProps = {
              values: filter.values,
              searchValue: searchTerms[filter.id] || "",
              onSearchChange: (v: string) => handleSearchChange(filter.id, v),
              options: filteredOptions,
              onToggleValue: (v: string) => handleToggleFilterValue(filter.id, v),
              onClearAll: () => handleClearAllFilterValues(filter.id),
              onReplaceValues: (v: string[]) => handleReplaceFilterValues(filter.id, v),
              operatorLabel: getFilterOperatorLabel(filter),
              filterType: column.filterType,
              optionVariantMap: column.optionVariantMap,
            }
            return (
              <React.Fragment key={filter.id}>
                {index > 0 && (
                  <FilterClauseConnector
                    operator={operator}
                    onOperatorChange={(op) => handleSetFilterOperator(index, op)}
                    modal={false}
                  />
                )}
                <FilterClause
                  label={filter.label}
                  conditionText={getFilterConditionText(filter)}
                  isExpanded={isExpanded}
                  onToggleExpand={() => handleToggleFilterExpand(filter.id)}
                  onRemove={() => handleRemoveFilter(filter.id)}
                  expandedContent={<FilterClauseEditor {...editorProps} variant="inline" />}
                  moreActionsContent={<FilterClauseEditor {...editorProps} variant="dropdown" />}
                  moreActionsOpen={openFilterId === filter.id}
                  onMoreActionsOpenChange={(open) => {
                    setOpenFilterId(open ? filter.id : null)
                    if (!open) setSearchTerms(prev => ({ ...prev, [filter.id]: "" }))
                  }}
                />
              </React.Fragment>
            )
          })}
        </div>
      )}

      {/* Add filter / Remove all */}
      <div className="flex items-center gap-3">
        {availableFilters.length > 0 ? (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Plus className="h-4 w-4 mr-2" />
                Add filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent sideOffset={4} collisionPadding={8}>
              <DropdownMenuLabel className="text-xs">Select column</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {availableFilters.map((col) => (
                <DropdownMenuItem key={col.key} onClick={() => handleAddFilter(col.key)}>
                  {typeof col.icon === "string" ? <FontAwesomeIcon name={col.icon as IconName} className="h-3 w-3 mr-2" /> : React.createElement(col.icon as React.ComponentType<{ className?: string }>, { className: "h-3 w-3 mr-2" })}
                  {col.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="outline" size="sm" className="h-8" disabled>
            <Plus className="h-4 w-4 mr-2" />
            Add filter
          </Button>
        )}
        {filters.length > 0 && (
          <button type="button" onClick={() => onFiltersChange?.([])} className="text-sm text-primary hover:underline">
            Remove all
          </button>
        )}
      </div>

      {/* Get started with filters card */}
      {showGetStartedCard && (
        <div className="rounded-lg border bg-primary/5 p-4 relative">
          <div className="flex items-start justify-between gap-2">
            <div className="font-medium text-sm">Get started with filters</div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="min-h-11 min-w-11 md:h-6 md:w-6 p-0 shrink-0 touch-manipulation" onClick={() => setShowGetStartedCard(false)} aria-label="Close">
                  <X className="h-4 w-4" aria-hidden />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Close</TooltipContent>
            </Tooltip>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Find precisely the data you need—without affecting others&apos; views. Learn more in this four-minute video:</p>
          <button type="button" className="text-sm text-primary font-medium mt-2 hover:underline">
            Watch the video
          </button>
        </div>
      )}
    </div>
  )

  const renderSortSection = () => (
    <div className="space-y-6">
      {/* Groups section - when groupBy is set */}
      {groupBy && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Groups</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {typeof groupBy.icon === "string" ? (
                <FontAwesomeIcon name={groupBy.icon as IconName} className="h-4 w-4 text-muted-foreground" />
              ) : (
                React.createElement(groupBy.icon as React.ComponentType<{ className?: string }>, { className: "h-4 w-4 text-muted-foreground" })
              )}
              <span className="text-sm flex-1">{groupBy.label}</span>
              <Select value="custom">
                <SelectTrigger className="w-[120px] h-8 text-sm border-border">
                  <GripVertical className="h-3 w-3 mr-1.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Rows section */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Rows</h3>
        <div className="space-y-2">
          {sorts.map((sort) => {
            const col = columns.find((c) => c.key === sort.columnKey)
            const Icon = col && typeof col.icon !== "string" ? col.icon : null
            const iconName = col && typeof col.icon === "string" ? col.icon : null
            return (
              <div key={sort.id} className="flex items-center gap-2">
                <Select
                  value={sort.columnKey}
                  onValueChange={(value) => handleUpdateSort(sort.id, { columnKey: value })}
                >
                  <SelectTrigger className="h-8 flex-1 min-w-0 text-sm border-border">
                    {iconName ? (
                      <FontAwesomeIcon name={iconName as IconName} className="h-3 w-3 mr-1.5 shrink-0" />
                    ) : Icon ? (
                      <Icon className="h-3 w-3 mr-1.5 shrink-0" />
                    ) : null}
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortableColumns.map((column) => (
                      <SelectItem key={column.key} value={column.key} className="text-sm">
                        {typeof column.icon === "string" ? (
                          <FontAwesomeIcon name={column.icon as IconName} className="h-3 w-3 mr-2" />
                        ) : (
                          React.createElement(column.icon as React.ComponentType<{ className?: string }>, { className: "h-3 w-3 mr-2" })
                        )}
                        {column.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={sort.direction}
                  onValueChange={(value) => handleUpdateSort(sort.id, { direction: value })}
                >
                  <SelectTrigger className="w-[130px] h-8 text-sm border-border shrink-0">
                    {sort.direction === "desc" ? (
                      <SortDesc className="h-3 w-3 mr-1.5" />
                    ) : (
                      <SortAsc className="h-3 w-3 mr-1.5" />
                    )}
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc" className="text-sm">
                      <SortAsc className="h-3 w-3 mr-2" />
                      Ascending
                    </SelectItem>
                    <SelectItem value="desc" className="text-sm">
                      <SortDesc className="h-3 w-3 mr-2" />
                      Descending
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSort(sort.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive shrink-0"
                      aria-label="Remove sort"
                    >
                      <X className="h-3 w-3" aria-hidden />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Remove sort</TooltipContent>
                </Tooltip>
              </div>
            )
          })}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-sm">
              <Plus className="h-4 w-4 mr-2" />
              Add sort
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel className="text-xs">Sort by column</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-sm">
                <SortAsc className="h-3 w-3 mr-2" />
                Ascending
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {sortableColumns.map((column) => (
                  <DropdownMenuItem
                    key={`${column.key}-asc`}
                    onClick={() => handleAddSortColumn(column.key, "asc")}
                    className="text-sm"
                  >
                    {typeof column.icon === "string" ? (
                      <FontAwesomeIcon name={column.icon as IconName} className="h-3 w-3 mr-2" />
                    ) : (
                      React.createElement(column.icon as React.ComponentType<{ className?: string }>, { className: "h-3 w-3 mr-2" })
                    )}
                    {column.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-sm">
                <SortDesc className="h-3 w-3 mr-2" />
                Descending
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {sortableColumns.map((column) => (
                  <DropdownMenuItem
                    key={`${column.key}-desc`}
                    onClick={() => handleAddSortColumn(column.key, "desc")}
                    className="text-sm"
                  >
                    {typeof column.icon === "string" ? (
                      <FontAwesomeIcon name={column.icon as IconName} className="h-3 w-3 mr-2" />
                    ) : (
                      React.createElement(column.icon as React.ComponentType<{ className?: string }>, { className: "h-3 w-3 mr-2" })
                    )}
                    {column.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )

  const sections: { id: SettingsSection; icon: React.ReactNode; title: string; subtitle: string }[] = [
    { id: "table-display", icon: <LayoutGrid className="h-5 w-5" />, title: "Table display", subtitle: "Hide gridlines, and more." },
    { id: "filter", icon: <Filter className="h-5 w-5" />, title: "Filter", subtitle: filters.length > 0 ? `${filters.length} filter${filters.length === 1 ? "" : "s"} applied` : "Showing all rows" },
    { id: "sort", icon: <SortAsc className="h-5 w-5" />, title: "Sort", subtitle: sorts.length > 0 ? `Sorted by ${sorts[0]?.label}.` : "No sorting" },
    { id: "group", icon: <Grid className="h-5 w-5" />, title: "Group", subtitle: groupBy ? `Grouped by ${groupBy.label}` : "No grouping" },
    { id: "columns", icon: <Table2 className="h-5 w-5" />, title: "Columns", subtitle: hiddenColumnsCount > 0 ? `${hiddenColumnsCount} columns hidden` : "All columns visible" },
    { id: "conditional-format", icon: <Palette className="h-5 w-5" />, title: "Conditional format", subtitle: "Add rules to style text and colors." },
  ]

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => { setIsOpen(open); if (!open) setActiveSection(null) }}
      trigger={
        <Button variant="outline" size="sm" className="h-8 w-8 p-0" aria-label="View settings">
          <Settings className="h-4 w-4" aria-hidden />
        </Button>
      }
      header={
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <div className="flex items-center gap-4">
            {activeSection && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={() => setActiveSection(null)} aria-label="Back">
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Back</TooltipContent>
              </Tooltip>
            )}
            <span className="text-xl font-semibold truncate">{activeSection ? sections.find(s => s.id === activeSection)?.title ?? viewTitle : viewTitle}</span>
          </div>
          {activeSection && (() => {
            const s = sections.find(sec => sec.id === activeSection)
            return s?.subtitle ? <span className="text-sm text-muted-foreground truncate">{s.subtitle}</span> : null
          })()}
        </div>
      }
      size="md"
      side="right"
      modal={false}
    >
      <div className="flex-1 min-h-0 overflow-y-auto">
          {!activeSection ? (
            <div className="px-6 pb-6 pt-2 space-y-1">
              {sections.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveSection(s.id)}
                  className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 text-left transition-colors"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
                    {s.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{s.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{s.subtitle}</div>
                  </div>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground rotate-[-90deg]" />
                </button>
              ))}
            </div>
          ) : (
            <div className="px-6 pb-6 pt-2">
            {activeSection === "table-display" && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <Label htmlFor="pin-expand" className="text-sm font-medium text-foreground">Pin expand row button</Label>
                    <Switch id="pin-expand" checked={tableDisplay.pinExpandRowButton} onCheckedChange={(v) => handleTableDisplayChange({ pinExpandRowButton: v })} />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <Label htmlFor="bottom-new-row" className="text-sm font-medium text-foreground">Bottom new row button</Label>
                    <Switch id="bottom-new-row" checked={tableDisplay.bottomNewRowButton} onCheckedChange={(v) => handleTableDisplayChange({ bottomNewRowButton: v })} />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <Label htmlFor="gridlines" className="text-sm font-medium text-foreground">Gridlines</Label>
                    <Switch id="gridlines" checked={tableDisplay.gridlines} onCheckedChange={(v) => handleTableDisplayChange({ gridlines: v })} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="freeze-columns" className="text-sm font-medium text-foreground">Freeze columns</Label>
                    <Select value={tableDisplay.freezeColumns ?? "none"} onValueChange={(v: "none" | "left" | "right") => handleTableDisplayChange({ freezeColumns: v })}>
                      <SelectTrigger id="freeze-columns" className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="row-height" className="text-sm font-medium text-foreground">Row height</Label>
                    <Select value={tableDisplay.rowHeight ?? "comfortable"} onValueChange={(v: "compact" | "comfortable" | "all-lines") => handleTableDisplayChange({ rowHeight: v })}>
                      <SelectTrigger id="row-height" className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compact">Compact</SelectItem>
                        <SelectItem value="comfortable">Comfortable</SelectItem>
                        <SelectItem value="all-lines">All lines</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "columns" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm">
                  Columns ({visibleColumns.length} visible)
                </Label>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newColumns = columns.map(col => ({ ...col, isVisible: true }))
                      onColumnChange(newColumns)
                    }}
                    className="h-7 text-xs px-2"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newColumns = columns.map(col => 
                        col.key === 'actions' ? col : { ...col, isVisible: false }
                      )
                      onColumnChange(newColumns)
                    }}
                    className="h-7 text-xs px-2"
                  >
                    <EyeOff className="h-3 w-3 mr-1" />
                    None
                  </Button>
                </div>
              </div>
              
              <div className="space-y-1">
                {columns.map((column, index) => (
                  <div
                    key={column.key}
                    className={cn(
                      "flex items-center gap-2 p-2 hover:bg-muted/50 rounded cursor-move transition-all duration-200",
                      "border border-transparent",
                      draggedIndex === index && "opacity-50 scale-[0.98]",
                      dragOverIndex === index && "border-primary border-dashed bg-primary/5",
                      "select-none"
                    )}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => handleDragEnter(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="drag-handle cursor-move p-1 -m-1 hover:bg-muted/30 rounded">
                      <GripVertical className="h-3 w-3 text-muted-foreground" />
                    </div>
                    {column.icon ? (typeof column.icon === 'string' ? <FontAwesomeIcon name={column.icon as IconName} className="h-3 w-3 text-muted-foreground" /> : React.createElement(column.icon as React.ComponentType<{ className?: string }>, { className: "h-3 w-3 text-muted-foreground" })) : <FontAwesomeIcon name="circle" className="h-3 w-3 text-muted-foreground opacity-50" />}
                    <span className="flex-1 text-sm">{column.label}</span>
                    <DropdownMenu>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onMouseDown={(e) => e.stopPropagation()}
                              onDragStart={(e) => e.preventDefault()}
                              className={cn(
                                "min-h-11 min-w-11 md:h-6 md:w-6 p-0 relative touch-manipulation",
                                column.isPinned ? "text-primary" : "text-muted-foreground"
                              )}
                              aria-label={column.isPinned ? `Pin column ${column.label}` : `Pin column ${column.label}`}
                            >
                              <Pin className="h-3 w-3" aria-hidden />
                          {column.isPinned && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 min-w-3 min-h-3 bg-primary rounded-full flex items-center justify-center">
                              <span className="text-xs leading-none text-primary-foreground font-bold">
                                {column.pinSide === 'left' ? 'L' : 'R'}
                              </span>
                            </div>
                          )}
                        </Button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>Pin column {column.label}</TooltipContent>
                      </Tooltip>
                      <DropdownMenuContent 
                        className="w-32 z-[120]" 
                        align="center"
                        side="left"
                        avoidCollisions={true}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleColumnPin(column.key, 'left')
                          }}
                          className={cn(
                            "text-xs cursor-pointer",
                            column.isPinned && column.pinSide === 'left' && "bg-accent"
                          )}
                        >
                          <Pin className="h-3 w-3 mr-2" />
                          Pin Left
                          {column.isPinned && column.pinSide === 'left' && (
                            <Check className="h-3 w-3 ml-auto" />
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleColumnPin(column.key, 'right')
                          }}
                          className={cn(
                            "text-xs cursor-pointer",
                            column.isPinned && column.pinSide === 'right' && "bg-accent"
                          )}
                        >
                          <Pin className="h-3 w-3 mr-2 scale-x-[-1]" />
                          Pin Right
                          {column.isPinned && column.pinSide === 'right' && (
                            <Check className="h-3 w-3 ml-auto" />
                          )}
                        </DropdownMenuItem>
                        {column.isPinned && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleToggleColumnPin(column.key)
                              }}
                              className="text-xs cursor-pointer text-muted-foreground"
                            >
                              <PinOff className="h-3 w-3 mr-2" />
                              Unpin
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <div onMouseDown={(e) => e.stopPropagation()} onDragStart={(e) => e.preventDefault()}>
                      <Switch
                        checked={column.isVisible}
                        onCheckedChange={() => handleToggleColumnVisibility(column.key)}
                        size="sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}

            {activeSection === "filter" && (
            <div>
              {renderFilterSection()}
            </div>
            )}

            {activeSection === "sort" && (
            <div>
              {renderSortSection()}
            </div>
            )}

            {activeSection === "group" && (
            <div className="space-y-4">
              <Label className="text-sm">
                Group By {groupBy && `(${groupBy.label})`}
              </Label>
              {groupBy ? (
                <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg">
                  {typeof groupBy.icon === 'string' ? <FontAwesomeIcon name={groupBy.icon as IconName} className="h-4 w-4 text-primary" /> : React.createElement(groupBy.icon as React.ComponentType<{ className?: string }>, { className: "h-4 w-4 text-primary" })}
                  <span className="text-sm text-primary flex-1">{groupBy.label}</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onGroupByChange?.(null)}
                        className="min-h-11 min-w-11 md:h-6 md:w-6 p-0 text-primary hover:text-destructive touch-manipulation"
                        aria-label="Remove grouping"
                      >
                        <X className="h-3 w-3" aria-hidden />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Remove grouping</TooltipContent>
                  </Tooltip>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No grouping applied</div>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start h-8 text-xs">
                    <Grid className="h-3 w-3 mr-2" />
                    {groupBy ? 'Change Group' : 'Select Column'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full" avoidCollisions={true}>
                  <DropdownMenuLabel className="text-xs">Group by column</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {groupBy && (
                    <>
                      <DropdownMenuItem onClick={() => onGroupByChange?.(null)} className="text-sm">
                        <X className="h-3 w-3 mr-2" />
                        Remove grouping
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {groupableColumns.map((column) => (
                    <DropdownMenuItem
                      key={column.key}
                      onClick={() => handleSetGroup(column)}
                      className="text-sm"
                    >
                      {typeof column.icon === 'string' ? <FontAwesomeIcon name={column.icon as IconName} className="h-3 w-3 mr-2" /> : React.createElement(column.icon as React.ComponentType<{ className?: string }>, { className: "h-3 w-3 mr-2" })}
                      {column.label}
                      {groupBy?.key === column.key && (
                        <Check className="h-3 w-3 ml-auto" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            )}

            {activeSection === "conditional-format" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Add rules to style text and colors based on cell values. Coming soon.
              </p>
              <Button variant="outline" size="sm" className="w-full" disabled>
                <Plus className="h-3 w-3 mr-2" />
                Add rule
              </Button>
            </div>
            )}
            </div>
          )}
        </div>
    </Drawer>
  )
}
