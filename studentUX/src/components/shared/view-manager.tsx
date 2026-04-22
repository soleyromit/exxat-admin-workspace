"use client"

import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import { cn } from "../ui/utils";
import { FontAwesomeIcon, type IconName } from "../brand/font-awesome-icon";
import {
  Plus,
  X,
  Table2,
  Kanban,
  Calendar,
  Eye,
  EyeOff,
  Pin,
  GripVertical,
  Check,
  SortAsc,
  SortDesc,
  Grid,
  Search,
  DoorOpen,
  Users,
  User,
  MapPin,
  Activity,
  AlertCircle,
  Hash,
  Settings,
  UserCheck,
  Clock,
  Timer,
  CheckCircle,
  School,
  Shield,
  ArrowLeft,
  ChevronDown,
  Trash2,
  Copy,
  Edit,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../ui/tabs";

// Column interface that matches DataTable
export interface ColumnConfig {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isVisible: boolean;
  isPinned: boolean;
  filterable?: boolean;
  sortable?: boolean;
  groupable?: boolean;
  options?: string[];
  width?: number;
  minWidth?: number;
}

// Mock column data with proper structure
const mockColumns: ColumnConfig[] = [
  { key: "name", label: "Availability", icon: DoorOpen, isVisible: true, isPinned: false, filterable: true, sortable: true, groupable: true, options: ["Internal Medicine", "Surgery", "Pediatrics", "Cardiology", "Emergency Medicine", "Radiology"], width: 300, minWidth: 200 },
  { key: "experienceType", label: "Experience Type", icon: Users, isVisible: true, isPinned: false, filterable: true, sortable: true, groupable: true, options: ["Individual", "Group", "Team", "Solo"], width: 140, minWidth: 120 },
  { key: "location", label: "Location", icon: MapPin, isVisible: true, isPinned: false, filterable: true, sortable: true, groupable: true, options: ["Rochester, MN", "Phoenix, AZ", "Jacksonville, FL", "London, UK", "Boston, MA"], width: 160, minWidth: 140 },
  { key: "discipline", label: "Discipline", icon: Activity, isVisible: true, isPinned: false, filterable: true, sortable: true, groupable: true, options: ["Medicine", "Surgery", "Nursing", "Therapy", "Administration"], width: 160, minWidth: 150 },
  { key: "slots", label: "Slots", icon: User, isVisible: true, isPinned: false, filterable: false, sortable: true, groupable: false, options: [], width: 120, minWidth: 100 },
  { key: "schedule", label: "Schedule", icon: Calendar, isVisible: true, isPinned: false, filterable: true, sortable: true, groupable: true, options: ["Full-time", "Part-time", "Weekend", "Night", "On-call"], width: 180, minWidth: 160 },
  { key: "lastRequested", label: "Last Requested", icon: Clock, isVisible: false, isPinned: false, filterable: false, sortable: true, groupable: false, options: [], width: 140, minWidth: 120 },
  { key: "actions", label: "Actions", icon: Settings, isVisible: true, isPinned: false, filterable: false, sortable: false, groupable: false, options: [], width: 80, minWidth: 80 },
];

interface FilterConfig {
  id: string;
  columnKey: string;
  label: string;
  values: string[];
}

interface SortConfig {
  id: string;
  columnKey: string;
  direction: string;
  label: string;
}

export interface ViewSettings {
  type: string;
  columns: ColumnConfig[];
  filters: FilterConfig[];
  sorts: SortConfig[];
  groupBy: any;
}

interface ViewManagerProps {
  onAddView?: (viewName: string, viewSettings: ViewSettings) => void;
  onUpdateView?: (viewSettings: ViewSettings) => void;
  onDeleteView?: () => void;
  onDuplicateView?: () => void;
  mode?: 'create' | 'edit';
  existingViewData?: {
    name: string;
    type: string;
    settings?: ViewSettings;
    id?: string;
  };
  triggerElement?: React.ReactNode;
  canDelete?: boolean;
}

const viewTypes = [
  { 
    value: "table", 
    label: "Table", 
    icon: Table2, 
    description: "Traditional rows and columns",
    hasSettings: true
  },
  { 
    value: "board", 
    label: "Board", 
    icon: Kanban, 
    description: "Kanban-style cards",
    hasSettings: false
  },
  { 
    value: "calendar", 
    label: "Calendar", 
    icon: Calendar, 
    description: "Timeline and dates",
    hasSettings: false
  },
];

type Step = 'type-selection' | 'table-settings';

export function ViewManager({ 
  onAddView, 
  onUpdateView, 
  onDeleteView,
  onDuplicateView,
  mode = 'create',
  existingViewData,
  triggerElement,
  canDelete = false
}: ViewManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>('type-selection');
  const [viewName, setViewName] = useState(existingViewData?.name || '');
  const [selectedType, setSelectedType] = useState(existingViewData?.type || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Initialize settings with existing data or defaults
  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    if (existingViewData?.settings?.columns) {
      return existingViewData.settings.columns;
    }
    return mockColumns;
  });
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [filters, setFilters] = useState<FilterConfig[]>(existingViewData?.settings?.filters || []);
  const [sorts, setSorts] = useState<SortConfig[]>(existingViewData?.settings?.sorts || []);
  const [groupBy, setGroupBy] = useState<any>(existingViewData?.settings?.groupBy || null);
  const [openFilterId, setOpenFilterId] = useState<string | null>(null);
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  const [activeSettingsTab, setActiveSettingsTab] = useState("columns");

  const visibleColumns = columns.filter(col => col.isVisible);
  const filterableColumns = columns.filter(col => col.filterable);
  const sortableColumns = columns.filter(col => col.sortable);
  const groupableColumns = columns.filter(col => col.groupable);

  // Initialize with existing data if in edit mode
  React.useEffect(() => {
    if (mode === 'edit' && existingViewData) {
      setViewName(existingViewData.name);
      setSelectedType(existingViewData.type);
      if (existingViewData.type === 'table') {
        setCurrentStep('table-settings');
      }
      if (existingViewData.settings) {
        setColumns(existingViewData.settings.columns || mockColumns);
        setFilters(existingViewData.settings.filters || []);
        setSorts(existingViewData.settings.sorts || []);
        setGroupBy(existingViewData.settings.groupBy || null);
      }
    }
  }, [mode, existingViewData]);

  const handleClose = () => {
    setIsOpen(false);
    setCurrentStep('type-selection');
    setOpenFilterId(null);
    setSearchTerms({});
    if (mode === 'create') {
      setViewName('');
      setSelectedType('');
      setColumns(mockColumns);
      setFilters([]);
      setSorts([]);
      setGroupBy(null);
    }
  };

  const handleTypeSelection = (type: string) => {
    setSelectedType(type);
    if (type === 'table') {
      setCurrentStep('table-settings');
    } else {
      // For non-table types, create view immediately
      handleCreateView(type);
    }
  };

  const handleCreateView = (type?: string) => {
    const viewType = type || selectedType;
    const name = viewName.trim() || `New ${viewType.charAt(0).toUpperCase() + viewType.slice(1)} View`;
    
    if (onAddView || onUpdateView) {
      const viewSettings: ViewSettings = {
        type: viewType,
        columns: viewType === 'table' ? columns : mockColumns,
        filters: viewType === 'table' ? filters : [],
        sorts: viewType === 'table' ? sorts : [],
        groupBy: viewType === 'table' ? groupBy : null,
      };
      
      if (mode === 'edit' && onUpdateView) {
        onUpdateView(viewSettings);
      } else if (onAddView) {
        onAddView(name, viewSettings);
      }
    }
    
    handleClose();
  };

  const handleDeleteView = () => {
    if (onDeleteView) {
      onDeleteView();
      setShowDeleteConfirm(false);
      handleClose();
    }
  };

  const handleDuplicateView = () => {
    if (onDuplicateView) {
      onDuplicateView();
      handleClose();
    }
  };

  const handleBackToTypeSelection = () => {
    setCurrentStep('type-selection');
    setSelectedType('');
  };

  // Column handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const newColumns = [...columns];
    const draggedColumn = newColumns[draggedIndex];
    
    newColumns.splice(draggedIndex, 1);
    newColumns.splice(dropIndex, 0, draggedColumn);
    
    setColumns(newColumns);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleToggleColumnVisibility = (columnKey: string) => {
    setColumns(prev => prev.map(col => 
      col.key === columnKey ? { ...col, isVisible: !col.isVisible } : col
    ));
  };

  const handleToggleColumnPin = (columnKey: string) => {
    setColumns(prev => prev.map(col => 
      col.key === columnKey ? { ...col, isPinned: !col.isPinned } : col
    ));
  };

  // Filter handlers
  const handleAddFilter = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column) return;

    const newFilter: FilterConfig = {
      id: `filter-${Date.now()}`,
      columnKey: columnKey,
      label: column.label,
      values: [],
    };
    setFilters(prev => [...prev, newFilter]);
    
    setTimeout(() => {
      setOpenFilterId(newFilter.id);
    }, 0);
  };

  const handleRemoveFilter = (filterId: string) => {
    setFilters(prev => prev.filter(filter => filter.id !== filterId));
    setOpenFilterId(null);
  };

  const handleToggleFilterValue = (filterId: string, value: string) => {
    setFilters(prev => prev.map(filter => {
      if (filter.id !== filterId) return filter;
      
      const newValues = filter.values.includes(value)
        ? filter.values.filter(v => v !== value)
        : [...filter.values, value];
      
      return { ...filter, values: newValues };
    }));
  };

  const handleClearAllFilterValues = (filterId: string) => {
    setFilters(prev => prev.map(filter =>
      filter.id === filterId ? { ...filter, values: [] } : filter
    ));
  };

  const handleSearchChange = (filterId: string, searchTerm: string) => {
    setSearchTerms(prev => ({
      ...prev,
      [filterId]: searchTerm
    }));
  };

  const getFilteredOptions = (filter: FilterConfig) => {
    const column = columns.find(col => col.key === filter.columnKey);
    if (!column) return [];
    
    const searchTerm = searchTerms[filter.id] || '';
    if (!searchTerm) return column.options || [];
    
    return (column.options || []).filter(option =>
      option.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getFilterDisplayText = (filter: FilterConfig) => {
    if (filter.values.length === 0) {
      return filter.label;
    } else if (filter.values.length === 1) {
      return `${filter.label}: ${filter.values[0]}`;
    } else {
      return `${filter.label}: ${filter.values.length} selected`;
    }
  };

  // Sort handlers
  const handleAddSortColumn = (columnKey: string, direction: 'asc' | 'desc' = 'asc') => {
    const column = columns.find(col => col.key === columnKey);
    if (!column) return;

    const newSort: SortConfig = {
      id: `sort-${Date.now()}`,
      columnKey: columnKey,
      direction: direction,
      label: column.label,
    };
    setSorts(prev => [...prev, newSort]);
  };

  const handleRemoveSort = (sortId: string) => {
    setSorts(prev => prev.filter(sort => sort.id !== sortId));
  };

  const handleUpdateSort = (sortId: string, field: string, value: string) => {
    setSorts(prev => prev.map(sort =>
      sort.id === sortId ? { ...sort, [field]: value } : sort
    ));
  };

  // Group handlers
  const handleSetGroup = (column: any) => {
    setGroupBy(groupBy?.key === column.key ? null : column);
  };

  const addedFilterKeys = filters.map(filter => filter.columnKey);
  const availableFilters = filterableColumns.filter(
    col => !addedFilterKeys.includes(col.key)
  );

  // Render view management dropdown (for edit mode)
  const renderViewManagementDropdown = () => {
    if (mode !== 'edit') return null;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {triggerElement || (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="View settings">
              <Settings className="h-4 w-4" aria-hidden />
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            View Options
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit View
          </DropdownMenuItem>
          {onDuplicateView && (
            <DropdownMenuItem onClick={handleDuplicateView}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate View
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {canDelete && onDeleteView && (
            <DropdownMenuItem 
              onClick={() => setShowDeleteConfirm(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete View
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const renderTypeSelection = () => (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <h3 className="text-base">
          {mode === 'edit' ? 'Edit View' : 'Create New View'}
        </h3>
        <p className="text-sm text-muted-foreground">
          Choose how you want to display your data.
        </p>
      </div>

      {mode === 'create' && (
        <div className="space-y-2">
          <Label htmlFor="view-name" className="text-sm">
            View Name
          </Label>
          <Input
            id="view-name"
            placeholder="Enter view name"
            value={viewName}
            onChange={(e) => setViewName(e.target.value)}
            className="h-9"
          />
        </div>
      )}

      <div className="space-y-3">
        <Label className="text-sm">View Type</Label>
        <div className="space-y-2">
          {viewTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => handleTypeSelection(type.value)}
              className="w-full p-3 text-left rounded-lg border hover:bg-accent/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-muted group-hover:bg-muted/80">
                  <type.icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="text-sm">{type.label}</div>
                  <div className="text-xs text-muted-foreground">{type.description}</div>
                </div>
                {type.hasSettings && (
                  <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    Configurable
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderFilterBar = () => {
    if (filters.length === 0) return null;

    return (
      <div className="space-y-2">
        {filters.map((filter) => {
          const column = columns.find(col => col.key === filter.columnKey);
          if (!column) return null;
          
          const hasValues = filter.values.length > 0;
          const showSearch = (column.options?.length || 0) > 10;
          const filteredOptions = getFilteredOptions(filter);
          
          return (
            <div key={filter.id} className="flex items-center gap-1">
              <DropdownMenu 
                open={openFilterId === filter.id} 
                onOpenChange={(open) => {
                  setOpenFilterId(open ? filter.id : null);
                  if (!open) {
                    setSearchTerms(prev => ({
                      ...prev,
                      [filter.id]: ''
                    }));
                  }
                }}
              >
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={cn(
                      "max-w-[200px] gap-1 justify-start h-8 text-sm",
                      hasValues && "border-primary bg-primary/10 text-primary"
                    )}
                  >
                    {typeof column.icon === 'string' ? <FontAwesomeIcon name={column.icon as IconName} className="h-4 w-4 flex-shrink-0" /> : React.createElement(column.icon as React.ComponentType<{ className?: string }>, { className: "h-4 w-4 flex-shrink-0" })}
                    <span className="truncate">{getFilterDisplayText(filter)}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 z-50">
                  <div className="px-2 py-1.5 text-sm border-b">
                    {filter.label} is
                  </div>
                  
                  {showSearch && (
                    <div className="p-2 border-b">
                      <div className="relative">
                        <Search className="h-4 w-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search options..."
                          value={searchTerms[filter.id] || ''}
                          onChange={(e) => handleSearchChange(filter.id, e.target.value)}
                          className="pl-8 h-8 text-sm"
                          autoFocus
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="max-h-48 overflow-y-auto" role="listbox">
                    {filteredOptions.length > 0 ? (
                      filteredOptions.map((option) => (
                        <div 
                          key={option}
                          className="flex items-center gap-3 px-2 py-2 hover:bg-accent cursor-pointer rounded-sm"
                          onClick={(e) => {
                            e.preventDefault();
                            handleToggleFilterValue(filter.id, option);
                          }}
                          role="option"
                          aria-selected={filter.values.includes(option)}
                        >
                          <Checkbox 
                            checked={filter.values.includes(option)}
                            onCheckedChange={(checked) => {
                              if (checked !== filter.values.includes(option)) {
                                handleToggleFilterValue(filter.id, option);
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="text-sm flex-1 select-none">{option}</span>
                        </div>
                      ))
                    ) : (
                      <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                        No options found
                      </div>
                    )}
                  </div>
                  
                  {filter.values.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleClearAllFilterValues(filter.id)}
                        className="text-sm text-muted-foreground"
                      >
                        Clear all selections
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveFilter(filter.id)}
                className="h-8 w-8 p-0 hover:bg-destructive/10"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSortBar = () => {
    if (sorts.length === 0) return null;

    return (
      <div className="space-y-2">
        {sorts.map((sort, index) => (
          <div key={sort.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
            <Badge variant="secondary" className="text-xs">
              {sort.label}
            </Badge>
            {index === 0 && sorts.length > 1 && (
              <Badge variant="outline" className="text-xs">Primary</Badge>
            )}
            <Select
              value={sort.direction}
              onValueChange={(value) => handleUpdateSort(sort.id, 'direction', value)}
            >
              <SelectTrigger className="w-20 h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc" className="text-xs">
                  <div className="flex items-center gap-1">
                    <SortAsc className="h-3 w-3" />
                    Asc
                  </div>
                </SelectItem>
                <SelectItem value="desc" className="text-xs">
                  <div className="flex items-center gap-1">
                    <SortDesc className="h-3 w-3" />
                    Desc
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveSort(sort.id)}
              className="min-h-11 min-w-11 md:h-7 md:w-7 p-0 text-muted-foreground hover:text-destructive touch-manipulation"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    );
  };

  const renderTableSettings = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToTypeSelection}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h3 className="text-sm">Table View Settings</h3>
            <p className="text-xs text-muted-foreground">
              {mode === 'edit' ? `Editing "${viewName}"` : 'Configure your table view'}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4">
        <Tabs value={activeSettingsTab} onValueChange={setActiveSettingsTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="columns" className="text-xs">Columns</TabsTrigger>
            <TabsTrigger value="filters" className="text-xs">Filters</TabsTrigger>
            <TabsTrigger value="sort" className="text-xs">Sort</TabsTrigger>
            <TabsTrigger value="group" className="text-xs">Group</TabsTrigger>
          </TabsList>

          <div className="mt-4 max-h-[min(320px,50vh)] overflow-y-auto">
            <TabsContent value="columns" className="mt-0 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">
                  Columns ({visibleColumns.length} visible)
                </Label>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setColumns(prev => prev.map(col => ({ ...col, isVisible: true })));
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
                      setColumns(prev => prev.map(col => 
                        col.key === 'actions' ? col : { ...col, isVisible: false }
                      ));
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
                    className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded cursor-move"
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <GripVertical className="h-3 w-3 text-muted-foreground" />
                    {column.icon ? (typeof column.icon === 'string' ? <FontAwesomeIcon name={column.icon as IconName} className="h-3 w-3 text-muted-foreground" /> : React.createElement(column.icon as React.ComponentType<{ className?: string }>, { className: "h-3 w-3 text-muted-foreground" })) : <FontAwesomeIcon name="circle" className="h-3 w-3 text-muted-foreground opacity-50" />}
                    <span className="flex-1 text-sm">{column.label}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleColumnPin(column.key);
                      }}
                      className={cn(
                        "min-h-11 min-w-11 md:h-6 md:w-6 p-0 touch-manipulation",
                        column.isPinned ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      <Pin className="h-3 w-3" />
                    </Button>
                    <Switch
                      checked={column.isVisible}
                      onCheckedChange={() => handleToggleColumnVisibility(column.key)}
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="filters" className="mt-0 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">
                  Filters {filters.length > 0 && `(${filters.length})`}
                </Label>
                {availableFilters.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 text-xs px-2">
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel className="text-xs">Select column</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {availableFilters.map((column) => (
                        <DropdownMenuItem
                          key={column.key}
                          onClick={() => handleAddFilter(column.key)}
                          className="text-sm"
                        >
                          {typeof column.icon === 'string' ? <FontAwesomeIcon name={column.icon as IconName} className="h-3 w-3 mr-2" /> : React.createElement(column.icon as React.ComponentType<{ className?: string }>, { className: "h-3 w-3 mr-2" })}
                          {column.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              {renderFilterBar()}
              {filters.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setFilters([])} 
                  className="h-7 text-xs w-full"
                >
                  Clear All Filters
                </Button>
              )}
            </TabsContent>

            <TabsContent value="sort" className="mt-0 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">
                  Sort {sorts.length > 0 && `(${sorts.length})`}
                </Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 text-xs px-2">
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel className="text-xs">Sort by column</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {sortableColumns.map((column) => (
                      <React.Fragment key={column.key}>
                        <DropdownMenuItem
                          onClick={() => handleAddSortColumn(column.key, 'asc')}
                          className="text-sm"
                        >
                          {typeof column.icon === 'string' ? <FontAwesomeIcon name={column.icon as IconName} className="h-3 w-3 mr-2" /> : React.createElement(column.icon as React.ComponentType<{ className?: string }>, { className: "h-3 w-3 mr-2" })}
                          <SortAsc className="h-3 w-3 mr-1" />
                          {column.label} (A-Z)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleAddSortColumn(column.key, 'desc')}
                          className="text-sm"
                        >
                          {typeof column.icon === 'string' ? <FontAwesomeIcon name={column.icon as IconName} className="h-3 w-3 mr-2" /> : React.createElement(column.icon as React.ComponentType<{ className?: string }>, { className: "h-3 w-3 mr-2" })}
                          <SortDesc className="h-3 w-3 mr-1" />
                          {column.label} (Z-A)
                        </DropdownMenuItem>
                      </React.Fragment>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {renderSortBar()}
            </TabsContent>

            <TabsContent value="group" className="mt-0 space-y-3">
              <Label className="text-sm">
                Group By {groupBy && `(${groupBy.label})`}
              </Label>
              {groupBy ? (
                <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg">
                  <groupBy.icon className="h-4 w-4 text-primary" />
                  <span className="text-sm text-primary flex-1">{groupBy.label}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setGroupBy(null)}
                    className="min-h-11 min-w-11 md:h-6 md:w-6 p-0 text-primary hover:text-destructive touch-manipulation"
                  >
                    <X className="h-3 w-3" />
                  </Button>
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
                <DropdownMenuContent className="w-full">
                  <DropdownMenuLabel className="text-xs">Group by column</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {groupBy && (
                    <>
                      <DropdownMenuItem onClick={() => setGroupBy(null)} className="text-sm">
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
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-4 border-t bg-muted/20">
        <Button variant="outline" onClick={handleClose} className="h-9">
          Cancel
        </Button>
        <Button onClick={() => handleCreateView()} className="h-9">
          {mode === 'edit' ? 'Save Changes' : 'Create View'}
        </Button>
      </div>
    </div>
  );

  const defaultTrigger = (
    <Button 
      variant="ghost" 
      size="sm" 
      className="h-8 w-8 p-0 transition-colors hover:bg-muted"
      aria-label="Add view"
    >
      <Plus className="h-4 w-4" aria-hidden />
    </Button>
  );

  return (
    <>
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete View</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{existingViewData?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteView}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete View
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Main View Manager */}
      {mode === 'edit' ? (
        renderViewManagementDropdown()
      ) : (
        <Popover open={isOpen} onOpenChange={setIsOpen} modal>
          <PopoverTrigger asChild>
            {triggerElement || defaultTrigger}
          </PopoverTrigger>
          <PopoverContent className="w-96 p-0 max-h-[min(85vh,520px)] overflow-y-auto" align="start" side="left" avoidCollisions={true} collisionPadding={16}>
            {currentStep === 'type-selection' ? renderTypeSelection() : renderTableSettings()}
          </PopoverContent>
        </Popover>
      )}
    </>
  );
}
