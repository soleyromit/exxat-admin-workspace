import React, { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";

/** Show search bar in filter popover when options exceed this count (single or multiple selection) */
const FILTER_SEARCH_THRESHOLD = 10;
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import { Slider } from "../ui/slider";
import { Calendar } from "../ui/calendar";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { FontAwesomeIcon, type IconName } from "../brand/font-awesome-icon";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { cn } from "../ui/utils";
import { formatDate, parseDate } from "@/utils/date-utils";

function SalaryRangeSelector({
  filter,
  config,
  onRangeChange,
  parseRangeValues,
}: {
  filter: ActiveFilter;
  config: FilterConfig;
  onRangeChange: (min: number, max: number) => void;
  parseRangeValues: (f: ActiveFilter) => [number, number];
}) {
  const minVal = config.rangeMin ?? 50;
  const maxVal = config.rangeMax ?? 200;
  const step = config.rangeStep ?? 5;
  const [min, max] = parseRangeValues(filter);
  const [localMin, setLocalMin] = React.useState(min);
  const [localMax, setLocalMax] = React.useState(max);

  React.useEffect(() => {
    const [a, b] = parseRangeValues(filter);
    setLocalMin(a);
    setLocalMax(b);
  }, [filter.values, parseRangeValues]);

  const handleSliderChange = (value: number[]) => {
    const [a, b] = value;
    setLocalMin(a);
    setLocalMax(b);
    onRangeChange(a, b);
  };

  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.min(Number(e.target.value) || minVal, localMax - step);
    setLocalMin(v);
    onRangeChange(v, localMax);
  };

  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.max(Number(e.target.value) || maxVal, localMin + step);
    setLocalMax(v);
    onRangeChange(localMin, v);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Label htmlFor={`${filter.id}-min`} className="text-xs text-muted-foreground">Min (k)</Label>
          <Input
            id={`${filter.id}-min`}
            type="number"
            variant="outline"
            min={minVal}
            max={maxVal}
            step={step}
            value={localMin}
            onChange={handleMinInputChange}
            className="h-8 text-sm"
          />
        </div>
        <span className="text-muted-foreground pt-5">–</span>
        <div className="flex-1">
          <Label htmlFor={`${filter.id}-max`} className="text-xs text-muted-foreground">Max (k)</Label>
          <Input
            id={`${filter.id}-max`}
            type="number"
            variant="outline"
            min={minVal}
            max={maxVal}
            step={step}
            value={localMax}
            onChange={handleMaxInputChange}
            className="h-8 text-sm"
          />
        </div>
      </div>
      <div className="space-y-2 pt-2 min-w-0">
        <Slider
          value={[localMin, localMax]}
          onValueChange={handleSliderChange}
          min={minVal}
          max={maxVal}
          step={step}
          className="w-full min-w-0"
        />
      </div>
    </div>
  );
}

const PUBLISH_DATE_PRESETS = ["Last 24 hours", "Last 7 days", "Last 30 days"] as const;
const CUSTOM_OPTION = "Custom";

function isCustomDateValue(value: string): boolean {
  return parseDate(value) !== null;
}

function PublishDateSelector({
  filter,
  onSelect,
  onClear,
}: {
  filter: ActiveFilter;
  onSelect: (value: string) => void;
  onClear: () => void;
}) {
  const selectedValue = filter.values[0];
  const isCustomDate = selectedValue && isCustomDateValue(selectedValue);
  const showCalendar = isCustomDate || selectedValue === CUSTOM_OPTION;
  const calendarDate = isCustomDate && selectedValue ? parseDate(selectedValue) : null;
  const radioValue = isCustomDate ? CUSTOM_OPTION : (selectedValue || "");

  return (
    <div className="p-4 space-y-4">
      <RadioGroup
        value={radioValue}
        onValueChange={onSelect}
        className="flex flex-col gap-3"
      >
        {[...PUBLISH_DATE_PRESETS, CUSTOM_OPTION].map((option) => (
          <div
            key={option}
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => onSelect(option)}
          >
            <RadioGroupItem value={option} id={`publish-date-${option}`} />
            <Label
              htmlFor={`publish-date-${option}`}
              className="text-sm cursor-pointer font-normal"
            >
              {option}
            </Label>
          </div>
        ))}
      </RadioGroup>
      {showCalendar && (
        <div className="rounded-md border p-2 w-full min-w-[252px] overflow-visible">
          <Calendar
            mode="single"
            selected={calendarDate ?? undefined}
            onSelect={(date) => {
              if (date) onSelect(formatDate(date));
            }}
            className="rounded-md w-full"
          />
        </div>
      )}
      {filter.values.length > 0 && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onClear}
            className="text-sm text-chart-1 hover:text-chart-1/90 focus:text-chart-1"
          >
            Clear selection
          </DropdownMenuItem>
        </>
      )}
    </div>
  );
}

export interface FilterConfig {
  key: string;
  label: string;
  icon: IconName;
  options: string[];
  /** When "range", renders min/max slider. When "date", renders presets + custom date picker. */
  type?: "options" | "range" | "date";
  rangeMin?: number;
  rangeMax?: number;
  rangeStep?: number;
  /** When true, only one option can be selected at a time */
  singleSelect?: boolean;
  /** Override threshold for showing search bar (default: FILTER_SEARCH_THRESHOLD). Search shows when options.length > threshold. */
  searchThreshold?: number;
  /** Optional logo URL per option value — renders Avatar before option text in dropdown */
  optionLogos?: Record<string, string>;
}

/** Exported for use when defining filter configs */
export { FILTER_SEARCH_THRESHOLD };

export interface ActiveFilter {
  id: string;
  key: string;
  label: string;
  values: string[];
  /** When true, shows remove icon — user-added filters only. Default filters have no remove icon. */
  removable?: boolean;
}

interface FilterBarProps {
  filterConfigs: FilterConfig[];
  activeFilters: ActiveFilter[];
  onAddFilter: (filterKey: string) => void;
  onToggleFilterValue: (filterId: string, value: string) => void;
  onRemoveFilter: (filterId: string) => void;
  onClearAll: () => void;
  /** For range filters: (filterId, min, max) */
  onFilterRangeChange?: (filterId: string, min: number, max: number) => void;
  className?: string;
  /** Optional results count to display. Combined with resultsLabel (default "results found") */
  resultsCount?: number;
  /** Label after the count, e.g. "Jobs found" or "students" (default: "results found") */
  resultsLabel?: string;
  /** Optional content to render right after the results count (e.g. Search input) */
  afterResultsContent?: React.ReactNode;
  /** Optional content to render on the right (e.g. Sort button) */
  rightContent?: React.ReactNode;
  /** Label for the add-filter button, e.g. "More filters" (default: "Add filter" for aria-label) */
  addFilterLabel?: string;
}

export default function FilterBar({
  filterConfigs,
  activeFilters,
  onAddFilter,
  onToggleFilterValue,
  onRemoveFilter,
  onClearAll,
  onFilterRangeChange,
  className = "",
  resultsCount,
  resultsLabel = "results found",
  afterResultsContent,
  rightContent,
  addFilterLabel = "Add filter",
}: FilterBarProps) {
  const [openFilterId, setOpenFilterId] = useState<string | null>(null);
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  const prevFilterCountRef = useRef(activeFilters.length);

  const addedFilterKeys = activeFilters.map(filter => filter.key);
  const availableFilters = filterConfigs.filter(
    config => !addedFilterKeys.includes(config.key)
  );

  // Open popover when user adds a filter from the add-filter dropdown
  useEffect(() => {
    if (activeFilters.length > prevFilterCountRef.current) {
      const lastFilter = activeFilters[activeFilters.length - 1];
      if (lastFilter) setOpenFilterId(lastFilter.id);
    }
    prevFilterCountRef.current = activeFilters.length;
  }, [activeFilters]);

  const handleAddFilter = (filterKey: string) => {
    onAddFilter(filterKey);
  };

  const getDisplayText = (filter: ActiveFilter) => {
    const config = getFilterConfig(filter.key);
    const isRange = config?.type === "range";
    const isDate = config?.type === "date";
    const count = filter.values.length;
    if (count === 0) {
      return filter.label;
    }
    if (isRange && filter.values[0]?.includes(":")) {
      const [min, max] = filter.values[0].split(":").map(Number);
      return `${filter.label} ${min}k–${max}k`;
    }
    if (isDate && filter.values[0] && isCustomDateValue(filter.values[0])) {
      return `${filter.label} ${filter.values[0]}`;
    }
    return `${filter.label} ${count}`;
  };

  const getChipLabelAndCount = (filter: ActiveFilter): { label: string; count: number | null; value?: string } => {
    const config = getFilterConfig(filter.key);
    const isRange = config?.type === "range";
    const isDate = config?.type === "date";
    const count = filter.values.length;
    if (count === 0) {
      return { label: filter.label, count: null };
    }
    if (isRange && filter.values[0]?.includes(":")) {
      const [min, max] = filter.values[0].split(":").map(Number);
      return { label: filter.label, count: null, value: `${min}k–${max}k` };
    }
    if (isDate && filter.values[0] && isCustomDateValue(filter.values[0])) {
      return { label: filter.label, count: null, value: filter.values[0] };
    }
    return { label: filter.label, count };
  };

  const sortedActiveFilters = [...activeFilters].sort((a, b) => {
    const aHas = a.values.length > 0;
    const bHas = b.values.length > 0;
    if (aHas && !bHas) return -1;
    if (!aHas && bHas) return 1;
    return 0;
  });

  const getFilterConfig = (filterKey: string) => {
    return filterConfigs.find(config => config.key === filterKey);
  };

  const hasActiveFilters = activeFilters.some(filter => filter.values.length > 0);

  const handleSearchChange = (filterId: string, searchTerm: string) => {
    setSearchTerms(prev => ({
      ...prev,
      [filterId]: searchTerm
    }));
  };

  const getFilteredOptions = (filter: ActiveFilter) => {
    const config = getFilterConfig(filter.key);
    if (!config) return [];
    
    const searchTerm = searchTerms[filter.id] || '';
    if (!searchTerm) return config.options;
    
    return config.options.filter(option =>
      option.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const parseRangeValues = (filter: ActiveFilter): [number, number] => {
    const config = getFilterConfig(filter.key);
    const min = config?.rangeMin ?? 50;
    const max = config?.rangeMax ?? 200;
    if (filter.values[0]?.includes(":")) {
      const [a, b] = filter.values[0].split(":").map(Number);
      return [a, b];
    }
    return [min, max];
  };

  const clearAllFilterValues = (filterId: string) => {
    const filter = activeFilters.find(f => f.id === filterId);
    if (filter) {
      filter.values.forEach(value => onToggleFilterValue(filterId, value));
    }
  };

  const replaceFilterValues = (filterId: string, value: string) => {
    const filter = activeFilters.find(f => f.id === filterId);
    if (!filter) return;
    filter.values.forEach(v => onToggleFilterValue(filterId, v));
    onToggleFilterValue(filterId, value);
  };

  return (
    <div className={cn(
      "p-4 bg-background",
      className
    )} role="region" aria-label="Filters">
      <div className="flex flex-col md:flex-row md:flex-wrap md:items-center gap-2">
        {/* Row 1 (mobile) / inline (desktop): Results count + search */}
        {resultsCount !== undefined && (
          <div className="flex items-center gap-2 shrink-0 min-w-0">
            <span className="text-sm font-semibold text-foreground shrink-0">
              {resultsCount} {resultsLabel}
            </span>
            {afterResultsContent}
          </div>
        )}
        {/* Row 2 (mobile) / inline (desktop): Filter chips + add filter + rightContent — flex-1 on chips pushes add/sort right */}
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0 md:min-w-0">
          {sortedActiveFilters.map((filter) => {
            const config = getFilterConfig(filter.key);
            if (!config) return null;
            
            const hasValues = filter.values.length > 0;
            const searchThreshold = config.searchThreshold ?? FILTER_SEARCH_THRESHOLD;
            const showSearch = config.options.length > searchThreshold;
            const filteredOptions = getFilteredOptions(filter);
            
            return (
              <div key={filter.id} className="flex items-center">
                <DropdownMenu 
                  open={openFilterId === filter.id} 
                  onOpenChange={(open) => {
                    setOpenFilterId(open ? filter.id : null);
                    if (!open) {
                      // Clear search term when closing
                      setSearchTerms(prev => ({
                        ...prev,
                        [filter.id]: ''
                      }));
                    }
                  }}
                >
                  <DropdownMenuTrigger asChild>
                    <div
                      role="button"
                      tabIndex={0}
                      className={cn(
                        "h-9 max-w-[200px] gap-2 justify-start px-3 rounded-full border flex items-center transition-colors cursor-pointer",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        hasValues && "filter-chip-selected",
                        !hasValues && "border-border bg-background hover:bg-accent hover:text-accent-foreground",
                        filter.removable ? "pr-1.5" : "pr-3"
                      )}
                      aria-label={`Filter by ${getDisplayText(filter)}`}
                    >
                      <FontAwesomeIcon name={config.icon} className="h-4 w-4 flex-shrink-0" weight="light" />
                      <span className="truncate text-sm flex-1 min-w-0 flex items-center gap-1.5">
                        {(() => {
                          const { label, count, value } = getChipLabelAndCount(filter);
                          return (
                            <>
                              <span>{label}</span>
                              {count !== null && (
                                <span className="min-w-5 h-5 flex items-center justify-center rounded-full bg-background text-foreground text-xs font-medium px-1.5">
                                  {count}
                                </span>
                              )}
                              {value !== undefined && (
                                <span className="truncate">{value}</span>
                              )}
                            </>
                          );
                        })()}
                      </span>
                      {filter.removable && (
                        <button
                          type="button"
                          onPointerDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onRemoveFilter(filter.id);
                          }}
                          className={cn(
                            "ml-0.5 h-5 w-5 flex items-center justify-center rounded-full shrink-0 touch-manipulation",
                            hasValues ? "text-background hover:bg-background/20" : "hover:bg-muted"
                          )}
                          aria-label={`Remove ${filter.label} filter`}
                        >
                          <FontAwesomeIcon name="x" className="h-3 w-3" weight="light" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className={cn(
                      "z-50",
                      config.type === "date" ? "min-w-[280px] w-auto overflow-visible" : "w-64"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 px-2 py-1.5 text-sm font-semibold border-b border-border">
                      <span>{filter.label} is</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 -mr-1"
                        aria-label="Close filter"
                        onClick={() => {
                          setOpenFilterId(null);
                          if (filter.removable && filter.values.length === 0) {
                            onRemoveFilter(filter.id);
                          }
                        }}
                      >
                        <FontAwesomeIcon name="x" className="h-4 w-4" weight="light" aria-hidden />
                      </Button>
                    </div>
                    
                    {config.type === "date" ? (
                      <PublishDateSelector
                        filter={filter}
                        onSelect={(value) => replaceFilterValues(filter.id, value)}
                        onClear={() => clearAllFilterValues(filter.id)}
                      />
                    ) : config.type === "range" && onFilterRangeChange ? (
                      <>
                        <SalaryRangeSelector
                          filter={filter}
                          config={config}
                          parseRangeValues={parseRangeValues}
                          onRangeChange={(min, max) => {
                            onFilterRangeChange(filter.id, min, max);
                          }}
                        />
                        {filter.values.length > 0 && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => clearAllFilterValues(filter.id)}
                              className="text-sm text-chart-1 hover:text-chart-1/90 focus:text-chart-1"
                            >
                              Clear selection
                            </DropdownMenuItem>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                    {showSearch && (
                      <div className="p-2 border-b border-border">
                        <div className="relative">
                          <FontAwesomeIcon name="search" className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" weight="light" aria-hidden />
                          <Input
                            variant="outline"
                            placeholder="Search options..."
                            value={searchTerms[filter.id] || ''}
                            onChange={(e) => handleSearchChange(filter.id, e.target.value)}
                            className="pl-8 h-8 text-sm"
                            autoFocus
                            aria-label={`Search ${filter.label} options`}
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="max-h-48 overflow-y-auto" role="listbox">
                      {filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => {
                          const isSelected = filter.values.includes(option);
                          const handleSelect = () => {
                            if (config.singleSelect) {
                              if (isSelected) {
                                clearAllFilterValues(filter.id);
                              } else {
                                replaceFilterValues(filter.id, option);
                              }
                            } else {
                              onToggleFilterValue(filter.id, option);
                            }
                          };
                          const logoUrl = config.optionLogos?.[option];
                          return (
                          <div 
                            key={option}
                            className="flex items-center gap-3 px-2 py-2 hover:bg-accent cursor-pointer rounded-sm"
                            onClick={(e) => {
                              e.preventDefault();
                              handleSelect();
                            }}
                            role="option"
                            aria-selected={isSelected}
                          >
                            <span onClick={(e) => e.stopPropagation()} className="flex items-center shrink-0">
                              <Checkbox 
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  if (checked !== isSelected) handleSelect();
                                }}
                                aria-label={`Toggle ${option}`}
                              />
                            </span>
                            {logoUrl && (
                              <Avatar className="h-6 w-6 shrink-0 rounded">
                                <AvatarImage src={logoUrl} alt="" className="rounded object-contain bg-muted" referrerPolicy="origin" />
                                <AvatarFallback className="text-xs font-medium">{option.slice(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                            )}
                            <span className="text-sm flex-1 select-none">{option}</span>
                          </div>
                          );
                        })
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
                          onClick={() => clearAllFilterValues(filter.id)}
                          className="text-sm text-chart-1 hover:text-chart-1/90 focus:text-chart-1"
                        >
                          Clear all selections
                        </DropdownMenuItem>
                      </>
                    )}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}

        {/* Add filter + rightContent — ml-auto pushes to the right */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
        {availableFilters.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label={addFilterLabel}
                className="h-9 w-9 shrink-0"
              >
                <FontAwesomeIcon name="filter" className="h-4 w-4" weight="light" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 z-50">
              {availableFilters.map((config) => (
                <DropdownMenuItem 
                  key={config.key} 
                  onClick={() => handleAddFilter(config.key)}
                >
                  <FontAwesomeIcon name={config.icon} className="h-4 w-4 mr-2" weight="light" />
                  {config.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {rightContent}
        </div>
        </div>
      </div>
    </div>
  );
}
