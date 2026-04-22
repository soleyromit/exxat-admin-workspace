"use client"

/**
 * DataTable<TData> — generic reusable table (no pagination)
 *
 * Column features:
 *   • Resizable     — drag right-edge handle on any non-locked column
 *   • Drag-to-reorder — drag header cell for free (unpinned) columns
 *   • Pin Left / Pin Right / Unpin — per-column context menu
 *   • Sort Asc / Desc — per-column context menu (sortable columns)
 *   • Wrap Text / Unwrap — per-column context menu
 *   • Per-column quick search
 *   • Row selection (checkboxes + floating bulk action bar)
 *   • Group by (collapsible group rows)
 *   • Hidden columns
 *
 * WCAG 2.1 AA:
 *   ✓ aria-sort on sortable <th>
 *   ✓ aria-label on every icon-only button
 *   ✓ Select / Actions columns: sr-only header text + resolved labels for controls
 *   ✓ Row checkboxes: visible on row focus-within, stop row click propagation (default control size; extended hit slop on Checkbox)
 *   ✓ Bulk-action bar: role="status" aria-live="polite"
 *   ✓ Resize handles: role="separator" aria-label
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Tip } from "@/components/ui/tip"
import { useModKeyLabel } from "@/hooks/use-mod-key-label"
import { isEditableTarget } from "@/lib/editable-target"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { OPERATOR_LABELS } from "@/components/table-properties/types"
import type { ActiveFilter } from "@/components/table-properties/types"
import { formatYmdForDisplay } from "@/lib/date-filter"
import { FilterDateCalendar } from "@/components/data-table/filter-date-calendar"
import type { DataTableProps, ColumnDef, SortDir } from "./types"
import { useTableState } from "./use-table-state"

/** When `ColumnDef.label` is empty, use a standard name for select/actions columns. */
function defaultColumnHeaderLabel(key: string): string | undefined {
  switch (key) {
    case "select":
      return "Select"
    case "actions":
      return "Actions"
    default:
      return undefined
  }
}

function resolvedColumnLabel<TData>(col: ColumnDef<TData>): string {
  const t = col.label?.trim()
  if (t) return t
  return defaultColumnHeaderLabel(col.key) ?? col.key
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal sub-components
// ─────────────────────────────────────────────────────────────────────────────

const SortChevron = React.memo(function SortChevron({ dir }: { dir: SortDir }) {
  return (
    <i className={`fa-solid fa-arrow-${dir === "asc" ? "up" : "down"} ml-1 text-xs`} aria-hidden="true" />
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// FilterPill — active filter pill with inline editor popover
// (driven by ColumnDef.filter config rather than FILTER_FIELDS)
// ─────────────────────────────────────────────────────────────────────────────

interface FilterPillProps<TData> {
  filter: ActiveFilter
  columns: ColumnDef<TData>[]
  defaultOpen?: boolean
  onUpdate: (id: string, patch: Partial<ActiveFilter>) => void
  onRemove: (id: string) => void
  /** Optional custom cell renderer for filter option values */
  renderOptionValue?: (fieldKey: string, value: string) => React.ReactNode
}

function FilterPillBase<TData>({
  filter,
  columns,
  defaultOpen = false,
  onUpdate,
  onRemove,
  renderOptionValue,
}: FilterPillProps<TData>) {
  const [open, setOpen] = React.useState(false)
  const [optSearch, setOptSearch] = React.useState("")
  const justAutoOpenedRef = React.useRef(false)

  React.useEffect(() => {
    if (defaultOpen) {
      justAutoOpenedRef.current = true
      const t = setTimeout(() => {
        setOpen(true)
        setTimeout(() => { justAutoOpenedRef.current = false }, 400)
      }, 0)
      return () => clearTimeout(t)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const col = columns.find(c => c.key === filter.fieldKey)
  const filterDef = col?.filter
  if (!filterDef) return null

  const options = filterDef.options ?? []
  const showSearch = options.length > 8
  const filteredOpts = optSearch
    ? options.filter(o => o.label.toLowerCase().includes(optSearch.toLowerCase()))
    : options

  const operators = filterDef.operators ?? (
    filterDef.type === "select" || filterDef.type === "date"
      ? (["is", "is_not"] as const)
      : (["contains", "not_contains"] as const)
  )

  React.useEffect(() => {
    if (filterDef.type !== "select" && filterDef.type !== "date") return
    if (filter.operator !== "is" && filter.operator !== "is_not") {
      onUpdate(filter.id, { operator: "is" })
    }
  }, [filter.id, filterDef.type, filter.operator, onUpdate])

  const valueLabel = (() => {
    if (filterDef.type === "select") {
      if (filter.values.length === 0) return "…"
      if (filter.values.length === 1) {
        return options.find(o => o.value === filter.values[0])?.label ?? filter.values[0]
      }
      return `${filter.values.length} selected`
    }
    if (filterDef.type === "date") {
      const ymd = filter.values[0]
      return ymd ? formatYmdForDisplay(ymd) : "…"
    }
    return filter.values[0] || "…"
  })()

  function toggleValue(val: string) {
    const next = filter.values.includes(val)
      ? filter.values.filter(v => v !== val)
      : [...filter.values, val]
    onUpdate(filter.id, { values: next })
  }

  function cycleOperator() {
    const idx = operators.indexOf(filter.operator as typeof operators[number])
    const i = idx === -1 ? 0 : idx
    onUpdate(filter.id, { operator: operators[(i + 1) % operators.length] })
  }

  const isActive =
    filterDef.type === "date"
      ? Boolean(filter.values[0])
      : filter.values.length > 0
  const iconClass = filterDef.icon ? `fa-light ${filterDef.icon}` : "fa-light fa-filter"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
      <div
        className={cn(
          "inline-flex items-center rounded border text-xs transition-colors",
          isActive ? "border-brand/45 bg-brand/10" : "border-input bg-background"
        )}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1 h-6 pl-2 pr-1.5 rounded-l transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
              isActive ? "hover:bg-brand/15" : "hover:bg-interactive-hover",
            )}
          >
            <i
              className={cn(iconClass, "text-xs", isActive ? "text-brand" : "text-muted-foreground")}
              aria-hidden="true"
            />
            <span className="text-foreground">{col.label}</span>
            {isActive && <span className="text-foreground font-medium">{valueLabel}</span>}
          </button>
        </PopoverTrigger>
        <button
          type="button"
          aria-label={`Remove ${col.label} filter`}
          onClick={() => onRemove(filter.id)}
          className={cn(
            "inline-flex items-center justify-center h-6 w-5 rounded-r transition-colors",
            "text-muted-foreground hover:text-destructive",
            isActive ? "hover:bg-brand/15" : "hover:bg-interactive-hover",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
          )}
        >
          <i className="fa-light fa-xmark text-xs" aria-hidden="true" />
        </button>
      </div>
      </PopoverAnchor>

      <PopoverContent
        className={cn(
          "p-0",
          filterDef.type === "date"
            ? "w-auto max-w-[min(calc(100vw-2rem),22rem)]"
            : "w-64",
        )}
        align="start"
        onFocusOutside={e => e.preventDefault()}
        onInteractOutside={e => {
          if (justAutoOpenedRef.current) {
            e.preventDefault()
            justAutoOpenedRef.current = false
          }
        }}
      >
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <div className="flex items-center gap-1 text-sm text-foreground">
            <span className="font-medium">{col.label}</span>
            <button
              type="button"
              onClick={cycleOperator}
              className="inline-flex items-center gap-0.5 text-muted-foreground hover:text-interactive-hover-foreground transition-colors rounded px-1 py-0.5 hover:bg-interactive-hover"
            >
              {OPERATOR_LABELS[filter.operator]}
              <i className="fa-light fa-chevron-down text-xs" aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            aria-label="Remove filter"
            onClick={() => onRemove(filter.id)}
            className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded hover:bg-interactive-hover"
          >
            <i className="fa-light fa-trash text-xs" aria-hidden="true" />
          </button>
        </div>

        {filterDef.type === "date" && (
          <div className="p-2">
            <FilterDateCalendar
              label={`${col.label} — choose date`}
              valueYmd={filter.values[0]}
              onChangeYmd={(ymd) =>
                onUpdate(filter.id, { values: ymd ? [ymd] : [] })
              }
            />
            {filter.values[0] ? (
              <div className="mt-2 flex justify-end border-t border-border pt-2">
                <button
                  type="button"
                  onClick={() => onUpdate(filter.id, { values: [] })}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-interactive-hover-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1 py-0.5"
                >
                  <i className="fa-light fa-xmark text-xs" aria-hidden="true" />
                  Clear selection
                </button>
              </div>
            ) : null}
          </div>
        )}

        {filterDef.type === "select" && (
          <div className="py-1 max-h-64 overflow-y-auto">
            {showSearch && (
              <div className="px-2 pt-1 pb-1">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search options…"
                    value={optSearch}
                    onChange={e => setOptSearch(e.target.value)}
                    className={cn("h-7 text-xs", optSearch ? "pr-8" : "pr-2")}
                    autoFocus
                  />
                  {optSearch ? (
                    <button
                      type="button"
                      aria-label="Clear option search"
                      onClick={() => setOptSearch("")}
                      className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:text-interactive-hover-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <i className="fa-light fa-xmark text-xs" aria-hidden="true" />
                    </button>
                  ) : null}
                </div>
              </div>
            )}
            {filteredOpts.map(opt => {
              const checked = filter.values.includes(opt.value)
              return (
                <div
                  key={opt.value}
                  role="option"
                  aria-selected={checked}
                  tabIndex={0}
                  onClick={() => toggleValue(opt.value)}
                  onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleValue(opt.value) } }}
                  className="flex w-full items-center gap-2.5 px-3 py-1.5 text-sm hover:bg-interactive-hover transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:bg-interactive-hover"
                >
                  <span
                    aria-hidden="true"
                    data-slot="checkbox"
                    data-state={checked ? "checked" : "unchecked"}
                    className={cn(
                      "inline-flex items-center justify-center size-3.5 shrink-0 rounded-[4px] border transition-colors",
                      checked ? "bg-primary border-primary text-primary-foreground" : "border-input bg-background"
                    )}
                  >
                    {checked && <i className="fa-solid fa-check text-current" style={{ fontSize: "8px" }} />}
                  </span>
                  {renderOptionValue
                    ? renderOptionValue(filter.fieldKey, opt.value)
                    : <span className="text-foreground">{opt.label}</span>
                  }
                </div>
              )
            })}
            {filteredOpts.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground">No options found</p>
            )}
            {filter.values.length > 0 && (
              <div className="border-t border-border px-2 py-2">
                <button
                  type="button"
                  onClick={() => onUpdate(filter.id, { values: [] })}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-border bg-background py-1.5 text-xs text-muted-foreground transition-colors hover:bg-interactive-hover hover:text-interactive-hover-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <i className="fa-light fa-xmark text-xs" aria-hidden="true" />
                  Clear selection
                </button>
              </div>
            )}
          </div>
        )}

        {filterDef.type === "text" && (
          <div className="p-2">
            <Input
              placeholder={`Enter ${col.label.toLowerCase()}…`}
              value={filter.values[0] ?? ""}
              onChange={e => onUpdate(filter.id, { values: [e.target.value] })}
              className="h-8 text-xs focus-visible:border-ring focus-visible:ring-ring/50"
              autoFocus
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

// React.memo wrapper — preserves generic signature via cast.
// FilterPillBase is a pure function of its props; memoizing it prevents
// re-renders when unrelated table state (hover, scroll) changes.
const FilterPill = React.memo(FilterPillBase) as typeof FilterPillBase

// ─────────────────────────────────────────────────────────────────────────────
// Sticky shadow utility
// ─────────────────────────────────────────────────────────────────────────────

function stickyShadow(pin: "left" | "right" | undefined): string {
  if (!pin) return ""
  const base = "after:content-[''] after:absolute after:top-0 after:bottom-0 after:w-3 after:pointer-events-none"
  if (pin === "left") {
    return cn(
      base,
      "after:left-full",
      "after:bg-[linear-gradient(to_right,var(--sticky-edge-fade),transparent)]",
    )
  }
  return cn(
    base,
    "after:right-full",
    "after:bg-[linear-gradient(to_left,var(--sticky-edge-fade),transparent)]",
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DataTableToolbar — search, filter bar, properties slot (shared by table + board)
// ─────────────────────────────────────────────────────────────────────────────

export function DataTableToolbar<TData extends Record<string, unknown>>({
  state,
  columns,
  searchable = true,
  /** When false, hides filter pills, search, and filter controls (e.g. dashboard canvas edit mode). */
  showQueryControls = true,
  renderFilterOptionValue,
  toolbarSlot,
  searchAriaLabel = "Search table",
}: {
  state: ReturnType<typeof useTableState<TData>>
  columns: ColumnDef<TData>[]
  searchable?: boolean
  showQueryControls?: boolean
  renderFilterOptionValue?: (fieldKey: string, value: string) => React.ReactNode
  toolbarSlot?: (state: ReturnType<typeof useTableState<TData>>) => React.ReactNode
  /** Passed to the search input `aria-label` (e.g. "Search placements") */
  searchAriaLabel?: string
}) {
  const {
    search, setSearch, searchOpen, setSearchOpen, searchRef,
    activeFilters, setActiveFilters, openFilterId,
    filterBarVisible, setFilterBarVisible,
    addFilter, updateFilter, removeFilter,
  } = state

  const filterableCols = columns.filter(c => c.filter)
  const searchModLabel = useModKeyLabel()
  const effectiveSearchable = showQueryControls && searchable

  React.useEffect(() => {
    if (!effectiveSearchable) return
    function onGlobalKeyDown(e: KeyboardEvent) {
      if (!e.metaKey && !e.ctrlKey) return
      if (e.altKey) return
      if (e.key.toLowerCase() !== "k") return
      if (isEditableTarget(e.target)) return
      e.preventDefault()
      setSearchOpen(true)
      queueMicrotask(() => searchRef.current?.focus())
    }
    document.addEventListener("keydown", onGlobalKeyDown)
    return () => document.removeEventListener("keydown", onGlobalKeyDown)
  }, [effectiveSearchable, setSearchOpen, searchRef])

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-4 lg:px-6",
        showQueryControls ? "min-h-10 pt-2 pb-2" : "min-h-0 justify-end py-1.5",
      )}
    >

      {showQueryControls && filterBarVisible && filterableCols.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
          {activeFilters.map(filter => (
            <React.Fragment key={filter.id}>
              <FilterPill
                filter={filter}
                columns={columns}
                defaultOpen={filter.id === openFilterId}
                onUpdate={updateFilter}
                onRemove={removeFilter}
                renderOptionValue={renderFilterOptionValue}
              />
            </React.Fragment>
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button"
                className="inline-flex items-center gap-1 h-6 px-2 rounded text-xs text-muted-foreground hover:text-interactive-hover-foreground border border-dashed border-input/70 hover:border-input hover:bg-interactive-hover-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <i className="fa-light fa-plus text-xs" aria-hidden="true" />
                Add filter
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel className="text-xs">Filter by field</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {filterableCols.map(c => (
                <DropdownMenuItem key={c.key} onClick={() => addFilter(c.key)}>
                  {c.filter?.icon && <i className={`fa-light ${c.filter.icon}`} aria-hidden="true" />}
                  {c.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {activeFilters.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveFilters([])}
              className="text-xs text-muted-foreground hover:text-interactive-hover-foreground transition-colors px-1"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      <div
        className={cn(
          "flex items-center gap-1 shrink-0",
          showQueryControls && "ml-auto",
        )}
      >

        {effectiveSearchable && (
          searchOpen ? (
            <div className="relative flex items-center">
              <i className="fa-light fa-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs pointer-events-none" aria-hidden="true" />
              <Input
                ref={searchRef}
                type="text"
                role="searchbox"
                inputMode="search"
                autoComplete="off"
                placeholder="Search…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onBlur={() => { if (!search) setSearchOpen(false) }}
                onKeyDown={e => { if (e.key === "Escape") { setSearch(""); setSearchOpen(false) } }}
                className={cn("h-8 w-48 pl-7 text-xs", search ? "pr-8" : "pr-2")}
                aria-label={searchAriaLabel}
              />
              {search ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearch("")}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:text-interactive-hover-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <i className="fa-light fa-xmark text-xs" aria-hidden="true" />
                </button>
              ) : null}
            </div>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" aria-label="Search"
                    onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 10) }}
                    className="inline-flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-interactive-hover-foreground hover:bg-interactive-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <i className="fa-light fa-magnifying-glass text-[13px]" aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <span>{searchAriaLabel}</span>
                  <KbdGroup>
                    <Kbd>{searchModLabel}</Kbd>
                    <Kbd>K</Kbd>
                  </KbdGroup>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        )}

        {showQueryControls && filterableCols.length > 0 && (
          <>
            <div className="h-4 w-px bg-border/70" aria-hidden="true" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  {activeFilters.length > 0 ? (
                    <button type="button"
                      aria-label={filterBarVisible ? "Hide filters" : "Show filters"}
                      onClick={() => setFilterBarVisible(v => !v)}
                      className={cn(
                        "inline-flex items-center gap-1 size-8 justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        filterBarVisible
                          ? "bg-accent text-accent-foreground hover:bg-accent/90"
                          : "text-muted-foreground hover:text-interactive-hover-foreground hover:bg-interactive-hover",
                      )}
                    >
                      <i className="fa-light fa-filter text-[13px]" aria-hidden="true" />
                      <span className="text-xs font-semibold tabular-nums">{activeFilters.length}</span>
                    </button>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button type="button" aria-label="Add filter"
                          onClick={() => setFilterBarVisible(true)}
                          className="inline-flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-interactive-hover-foreground hover:bg-interactive-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <i className="fa-light fa-filter text-[13px]" aria-hidden="true" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel className="text-xs">Filter by field</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {filterableCols.map(c => (
                          <DropdownMenuItem key={c.key} onClick={() => addFilter(c.key)}>
                            {c.filter?.icon && <i className={`fa-light ${c.filter.icon}`} aria-hidden="true" />}
                            {c.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {activeFilters.length > 0
                    ? (filterBarVisible ? "Hide filters" : "Show filters")
                    : "Filter"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}

        {toolbarSlot && toolbarSlot(state)}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DataTable<TData>
// ─────────────────────────────────────────────────────────────────────────────

export interface DataTableExtendedProps<TData extends Record<string, unknown>>
  extends DataTableProps<TData> {
  /** Slot for a toolbar drawer button + drawer itself (e.g. TablePropertiesDrawer) */
  toolbarSlot?: (state: ReturnType<typeof useTableState<TData>>) => React.ReactNode
  /** Slot rendered inside the floating bulk-action bar (after the "N selected" label) */
  bulkActionsSlot?: (selected: Set<string | number>, rows: TData[]) => React.ReactNode
  /** Optional "add new row" row text — pass false to hide */
  addRowLabel?: string | false
  /** Custom option-value renderer for filter pills */
  renderFilterOptionValue?: (fieldKey: string, value: string) => React.ReactNode
  /** When set by DataTablePaginated — drives row slicing inside useTableState */
  paginationOverride?: { page: number; pageSize: number }
  /** When true, removes rounded bottom corners so a pagination bar can attach flush */
  hasFooter?: boolean
  /** Conditional formatting rules — apply bg color to cells based on value */
  conditionalRules?: import("./types").ConditionalRule[]
  /** When false, the column header row is hidden (Display options). */
  showColumnHeaders?: boolean
  /** When set, table uses this state (e.g. shared with board view) instead of internal useTableState. */
  state?: ReturnType<typeof useTableState<TData>>
}

type DataTableInnerProps<TData extends Record<string, unknown>> = DataTableExtendedProps<TData> & {
  state: ReturnType<typeof useTableState<TData>>
}

function DataTableInner<TData extends Record<string, unknown>>({
  data,
  columns,
  getRowId: getRowIdProp,
  getRowSelectionLabel,
  selectable = true,
  searchable = true,
  emptyState,
  onRowClick,
  defaultSort,
  toolbarSlot,
  bulkActionsSlot,
  addRowLabel = false,
  renderFilterOptionValue,
  hasFooter = false,
  conditionalRules,
  showColumnHeaders = true,
  state,
}: DataTableInnerProps<TData>) {
  const {
    sortRules, setSortRules,
    sortKey, sortDir,
    handleSortByKey,
    addFilter,
    groupBy, setGroupBy,
    colMenuSearch, setColMenuSearch,
    selected, setSelected, toggleRow, toggleAll, getRowId,
    colWidths, startResize,
    colOrder,
    colPins, lockedPins,
    pinColumn, unpinColumn,
    colWrap, toggleWrap,
    draggedKey, dragOverKey,
    handleDragStart, handleDragOver, handleDrop, handleDragEnd,
    scrollRef, handleScroll, checkOverflow,
    isOverflowing,
    hoveredRow, setHoveredRow,
    rows, pagedRows, groupedRows,
    effectivePins, displayCols,
    stickyStyle,
    totalWidth,
    rowHeight,
    showGridlines,
    setSheetOpen,
  } = state

  // Mount overflow check
  React.useEffect(() => {
    checkOverflow()
    const el = scrollRef.current
    if (!el) return
    const ro = new ResizeObserver(checkOverflow)
    ro.observe(el)
    return () => ro.disconnect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** One-time horizontal nudge when the grid overflows and pins are active — hints that more columns scroll (overlay scrollbars, esp. Windows, are often invisible until interaction). */
  const pinnedScrollHintDoneRef = React.useRef(false)
  React.useEffect(() => {
    if (!isOverflowing || Object.keys(colPins).length === 0) return
    if (pinnedScrollHintDoneRef.current) return
    const el = scrollRef.current
    if (!el) return
    if (el.scrollLeft > 2) return
    const maxScroll = el.scrollWidth - el.clientWidth
    if (maxScroll < 16) return
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      pinnedScrollHintDoneRef.current = true
      return
    }

    pinnedScrollHintDoneRef.current = true
    const delta = Math.min(96, Math.max(28, Math.round(maxScroll * 0.14)))
    const startDelayMs = 320
    const dwellMs = 520

    const t1 = window.setTimeout(() => {
      el.scrollTo({ left: delta, behavior: "smooth" })
    }, startDelayMs)
    const t2 = window.setTimeout(() => {
      el.scrollTo({ left: 0, behavior: "smooth" })
    }, startDelayMs + dwellMs)

    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [isOverflowing, colPins, scrollRef])

  const lastLeftPinKey   = [...displayCols].reverse().find(c => effectivePins[c.key] === "left")?.key
  const firstRightPinKey = displayCols.find(c => effectivePins[c.key] === "right")?.key

  // Row IDs for the current visible rows
  const allRowIds = rows.map((r, i) => getRowId(r, i, getRowIdProp))
  const allSelected  = rows.length > 0 && selected.size === rows.length
  const someSelected = selected.size > 0 && !allSelected
  const anySelected  = selected.size > 0

  function ariaSortAttr(colKey: string): React.AriaAttributes["aria-sort"] {
    return sortKey !== colKey ? "none" : sortDir === "asc" ? "ascending" : "descending"
  }

  function cellStyle(key: string): React.CSSProperties {
    return stickyStyle(key)
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-0">

      <DataTableToolbar
        state={state}
        columns={columns}
        searchable={searchable}
        renderFilterOptionValue={renderFilterOptionValue}
        toolbarSlot={toolbarSlot}
        searchAriaLabel="Search table"
      />

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={cn("mx-4 lg:mx-6 overflow-x-auto border border-border", hasFooter ? "rounded-t-lg" : "rounded-lg")}
      >
        <table
          className="w-full text-sm border-separate border-spacing-0"
          style={{ tableLayout: "fixed", minWidth: totalWidth }}
        >
          <colgroup>
            {displayCols.map(col => (
              <col key={col.key} style={{ width: colWidths[col.key] ?? col.width ?? 100 }} />
            ))}
          </colgroup>

          {/* ── Table head ──────────────────────────────────────────────── */}
          <thead className={cn(!showColumnHeaders && "hidden")}>
            <tr>
              {displayCols.map(col => {
                const isPinned   = !!effectivePins[col.key]
                const isLocked   = !!lockedPins[col.key]
                const isFree     = !colPins[col.key]
                const isResizable = !isLocked || (col.key !== "select")

                const isEdgePinCol = col.key === lastLeftPinKey || col.key === firstRightPinKey

                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={col.sortable && col.sortKey ? ariaSortAttr(col.sortKey as string) : undefined}
                    draggable={isFree}
                    onDragStart={isFree ? e => handleDragStart(col.key, e) : undefined}
                    onDragOver={isFree  ? e => handleDragOver(col.key, e)  : undefined}
                    onDrop={isFree      ? () => handleDrop(col.key)        : undefined}
                    onDragEnd={isFree   ? handleDragEnd                    : undefined}
                    style={stickyStyle(col.key, true)}
                    className={cn(
                      "group/th relative h-9 px-3 text-left align-middle select-none",
                      "text-xs font-medium text-muted-foreground tracking-wide",
                      "bg-dt-header-bg border-b border-border",
                      showGridlines && (!isEdgePinCol
                        ? "border-r border-border last:border-r-0"
                        : "last:border-r-0"),
                      isPinned ? "z-30" : "z-10",
                      isFree && "cursor-grab active:cursor-grabbing",
                      dragOverKey === col.key && draggedKey.current !== col.key && "bg-accent/40",
                      isEdgePinCol && stickyShadow(effectivePins[col.key])
                    )}
                  >
                    <div className="flex items-center justify-between gap-1 min-w-0">
                      <div className="flex items-center min-w-0 flex-1">
                        {col.header ? (
                          col.header()
                        ) : col.key === "select" ? (
                          selectable && (
                            <div className="flex items-center justify-center">
                              <span className="sr-only">{resolvedColumnLabel(col)}</span>
                              <Checkbox
                                checked={allSelected ? true : someSelected ? "indeterminate" : false}
                                onCheckedChange={() => toggleAll(allRowIds)}
                                aria-label="Select all rows"
                              />
                            </div>
                          )
                        ) : col.sortable && col.sortKey ? (
                          <Tip label={`Sort by ${resolvedColumnLabel(col)}`} side="top">
                            <button
                              type="button"
                              onClick={() => handleSortByKey(col.key)}
                              className={cn(
                                "inline-flex items-center hover:text-interactive-hover-foreground transition-colors whitespace-nowrap",
                                sortKey === col.key && "text-foreground"
                              )}
                            >
                              {col.label?.trim() ? col.label : resolvedColumnLabel(col)}
                              {sortKey === col.key && <SortChevron dir={sortDir} />}
                            </button>
                          </Tip>
                        ) : (
                          <Tip label={resolvedColumnLabel(col)} side="top">
                            <span className="whitespace-nowrap">
                              {col.label?.trim() ? (
                                col.label
                              ) : defaultColumnHeaderLabel(col.key) ? (
                                <span className="sr-only">{defaultColumnHeaderLabel(col.key)}</span>
                              ) : (
                                <span className="sr-only">{col.key}</span>
                              )}
                            </span>
                          </Tip>
                        )}
                      </div>

                      {/* Column context menu — not on checkbox or locked-right columns */}
                      {col.key !== "select" && !lockedPins[col.key]?.includes("right") && col.key !== (columns.find(c => c.lockPin && c.defaultPin === "right")?.key) && (
                        <DropdownMenu>
                          <Tip label="Column options" side="top">
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                aria-label={`${resolvedColumnLabel(col)} column options`}
                                onClick={e => e.stopPropagation()}
                                className={cn(
                                  "opacity-0 group-hover/th:opacity-100 group-focus-within/th:opacity-100",
                                  "inline-flex items-center justify-center size-7 rounded-md",
                                  "text-muted-foreground hover:text-interactive-hover-foreground hover:bg-interactive-hover-row",
                                  "transition-opacity focus-visible:opacity-100",
                                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                )}
                              >
                                <i className="fa-light fa-ellipsis-vertical text-xs" aria-hidden="true" />
                              </button>
                            </DropdownMenuTrigger>
                          </Tip>
                          <DropdownMenuContent align="start" className="min-w-44">

                            {/* Column quick-search */}
                            <div className="px-2 pt-2 pb-1">
                              <div className="relative">
                                <i className="fa-light fa-magnifying-glass absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs pointer-events-none" aria-hidden="true" />
                                <Input
                                  placeholder={`Search ${resolvedColumnLabel(col)}…`}
                                  value={colMenuSearch[col.key] ?? ""}
                                  onChange={e => setColMenuSearch(prev => ({ ...prev, [col.key]: e.target.value }))}
                                  onKeyDown={e => e.stopPropagation()}
                                  className="h-7 pl-6 text-xs"
                                />
                                {colMenuSearch[col.key] && (
                                  <button
                                    type="button"
                                    aria-label="Clear search"
                                    onClick={() => setColMenuSearch(prev => ({ ...prev, [col.key]: "" }))}
                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-interactive-hover-foreground transition-colors"
                                  >
                                    <i className="fa-light fa-xmark text-xs" aria-hidden="true" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <DropdownMenuSeparator />

                            {/* Pin options */}
                            {!isLocked && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => pinColumn(col.key, "left")}
                                  disabled={colPins[col.key] === "left"}
                                >
                                  <i className="fa-light fa-arrow-left-to-line" aria-hidden="true" />
                                  Pin Left
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => pinColumn(col.key, "right")}
                                  disabled={colPins[col.key] === "right"}
                                >
                                  <i className="fa-light fa-arrow-right-to-line" aria-hidden="true" />
                                  Pin Right
                                </DropdownMenuItem>
                                {colPins[col.key] && (
                                  <DropdownMenuItem onClick={() => unpinColumn(col.key)}>
                                    <i className="fa-light fa-thumbtack-slash" aria-hidden="true" />
                                    Unpin
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                              </>
                            )}

                            {/* Sort options */}
                            {col.sortable && col.sortKey && (
                              <>
                                <DropdownMenuItem onClick={() => setSortRules(prev => {
                                  const filtered = prev.filter(r => r.fieldKey !== col.key)
                                  return [{ id: `sort-${Date.now()}`, fieldKey: col.key, direction: "asc" as const }, ...filtered]
                                })}>
                                  <i className="fa-light fa-arrow-up-az" aria-hidden="true" />
                                  Sort Ascending
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSortRules(prev => {
                                  const filtered = prev.filter(r => r.fieldKey !== col.key)
                                  return [{ id: `sort-${Date.now()}`, fieldKey: col.key, direction: "desc" as const }, ...filtered]
                                })}>
                                  <i className="fa-light fa-arrow-down-az" aria-hidden="true" />
                                  Sort Descending
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}

                            {/* Text wrap toggle */}
                            <DropdownMenuItem onClick={() => toggleWrap(col.key)}>
                              <i className="fa-light fa-text-width" aria-hidden="true" />
                              {colWrap[col.key] ? "Unwrap Text" : "Wrap Text"}
                            </DropdownMenuItem>

                            {/* Filter / Group by */}
                            <DropdownMenuSeparator />
                            {col.filter && (
                              <DropdownMenuItem onClick={() => addFilter(col.key)}>
                                <i className="fa-light fa-filter" aria-hidden="true" />
                                Filter by this column
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => setGroupBy(groupBy === col.key ? null : col.key)}
                            >
                              <i className="fa-light fa-layer-group" aria-hidden="true" />
                              {groupBy === col.key ? "Remove Grouping" : "Group by this Column"}
                            </DropdownMenuItem>

                            {/* Conditional rule shortcut */}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setSheetOpen(true)}>
                              <i className="fa-light fa-palette" aria-hidden="true" />
                              Add Conditional Rule
                            </DropdownMenuItem>

                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    {/* Resize handle */}
                    {isResizable && col.key !== "select" && (
                      <div
                        role="separator"
                        aria-label={`Resize ${resolvedColumnLabel(col)} column`}
                        aria-orientation="vertical"
                        onMouseDown={e => startResize(col.key, e)}
                        className="absolute right-0 top-1 bottom-1 w-1.5 cursor-col-resize rounded-full hover:bg-interactive-hover-foreground/50 active:bg-muted-foreground/70 transition-colors"
                      />
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>

          {/* ── Table body ───────────────────────────────────────────────── */}
          <tbody>
            {(pagedRows !== rows
              ? [{ groupKey: null as string | null, groupLabel: null as string | null, rows: pagedRows }]
              : groupedRows
            ).map(({ groupKey, groupLabel, rows: groupRows }) => (
              <React.Fragment key={groupKey ?? "__all__"}>
                {groupLabel && (
                  <tr>
                    <td
                      colSpan={displayCols.length}
                      className={cn(
                        "px-4 py-1.5 text-xs font-semibold text-muted-foreground tracking-wide bg-dt-group-bg select-none sticky left-0",
                        "border-b border-border",
                      )}
                    >
                      {groupLabel}
                      <span className="ml-2 font-normal normal-case opacity-60 tracking-normal">
                        {groupRows.length} record{groupRows.length !== 1 ? "s" : ""}
                      </span>
                    </td>
                  </tr>
                )}
                {groupRows.map((row, rowIndex) => {
                  const rowId = getRowId(row, rowIndex, getRowIdProp)
                  const isSelected = selected.has(rowId)
                  const isHovered  = hoveredRow === rowId
                  return (
                    <tr
                      key={String(rowId)}
                      data-state={isSelected ? "selected" : undefined}
                      onMouseEnter={() => setHoveredRow(rowId)}
                      onMouseLeave={() => setHoveredRow(null)}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      data-new={Boolean((row as Record<string, unknown>).isNew) || undefined}
                      className={cn(
                        "group/row transition-colors",
                        "hover:bg-dt-row-hover",
                        isSelected && "bg-dt-row-selected text-dt-row-selected-fg",
                        onRowClick && "cursor-pointer",
                        Boolean((row as Record<string, unknown>).isNew) && "bg-dt-new-row-bg border-l-2 border-l-dt-new-row-border"
                      )}
                    >
                      {displayCols.map(col => {
                        const isPinned   = !!effectivePins[col.key]
                        const wrap       = colWrap[col.key]
                        const isEdgePin  = col.key === lastLeftPinKey || col.key === firstRightPinKey
                        const rowPy      = rowHeight === "compact" ? "py-1" : rowHeight === "comfortable" ? "py-4" : "py-2.5"
                        const cs         = cellStyle(col.key)

                        const tdBase = cn(
                          `px-3 ${rowPy} align-middle`,
                          showGridlines && !isEdgePin && "border-r border-border last:border-r-0",
                          "border-b border-border group-last/row:border-b-0",
                          isPinned && [
                            "z-20 pinned-cell",
                            "bg-dt-row-bg",
                            "group-data-[state=selected]/row:bg-dt-row-selected",
                            "group-hover/row:bg-dt-row-hover",
                            isEdgePin && stickyShadow(effectivePins[col.key]),
                          ]
                        )

                        // Conditional rule background for this cell
                        const conditionalBg = conditionalRules?.find(rule => {
                          if (rule.fieldKey !== col.key) return false
                          const cellVal = String(row[rule.fieldKey as keyof TData] ?? "")
                          const v = cellVal.trim()
                          const empty = v === ""
                          switch (rule.operator) {
                            case "is":
                              return rule.values.length > 0 && rule.values.includes(v)
                            case "is_not":
                              return rule.values.length > 0 && !rule.values.includes(v)
                            case "contains":
                              return rule.values.length > 0 && rule.values.some(val => v.toLowerCase().includes(val.toLowerCase()))
                            case "not_contains":
                              return rule.values.length > 0 && !rule.values.some(val => v.toLowerCase().includes(val.toLowerCase()))
                            default:
                              return false
                          }
                        })?.bgColor

                        const tdStyle = conditionalBg
                          ? { ...cs, background: conditionalBg }
                          : cs

                        // Special synthetic columns
                        if (col.key === "select") {
                          const selectionLabel = getRowSelectionLabel?.(row, rowIndex)
                          const ariaLabel = selectionLabel
                            ? `Select row, ${selectionLabel}`
                            : `Select row ${rowIndex + 1}`
                          return (
                            <td key="select" className={tdBase} style={tdStyle}>
                              {selectable && (
                                <div
                                  className={cn(
                                    "flex items-center justify-center shrink-0 transition-opacity",
                                    anySelected
                                      ? "opacity-100"
                                      : "opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100",
                                  )}
                                  onClick={e => e.stopPropagation()}
                                >
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => toggleRow(rowId)}
                                    aria-label={ariaLabel}
                                    onClick={e => e.stopPropagation()}
                                  />
                                </div>
                              )}
                            </td>
                          )
                        }

                        // Custom cell renderer
                        if (col.cell) {
                          return (
                            <td
                              key={col.key}
                              className={cn(
                                tdBase,
                                // When wrap is on, override truncate/overflow on any descendant
                                wrap && "[&_.truncate]:!whitespace-normal [&_.truncate]:!overflow-visible [&_.truncate]:!text-clip",
                              )}
                              style={tdStyle}
                            >
                              {col.cell(row, {
                                rowIndex,
                                selected: isSelected,
                                onSelect: checked => checked ? setSelected(prev => new Set([...prev, rowId])) : toggleRow(rowId),
                              })}
                            </td>
                          )
                        }

                        // Default: render string value with optional truncation
                        const rawVal = String(row[col.key] ?? "")
                        return (
                          <td key={col.key} className={cn(tdBase, "text-sm text-foreground/80")} style={tdStyle}>
                            <span className={wrap ? "whitespace-normal" : "block truncate"} title={!wrap ? rawVal : undefined}>
                              {rawVal}
                            </span>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </React.Fragment>
            ))}

            {/* Empty state */}
            {rows.length === 0 && (
              <tr>
                <td colSpan={displayCols.length} className="h-24 px-3 text-center text-sm text-muted-foreground">
                  {emptyState ?? "No results match your filters."}
                </td>
              </tr>
            )}

            {/* Add new row stub */}
            {addRowLabel !== false && (
              <tr
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === "Enter" || e.key === " ") e.preventDefault() }}
                className="cursor-pointer hover:bg-dt-row-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                aria-label={`Add new ${addRowLabel}`}
              >
                <td colSpan={displayCols.length} className="px-3 py-2.5 align-middle">
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <i className="fa-light fa-plus text-xs" aria-hidden="true" />
                    {addRowLabel}
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Floating bulk-action bar ──────────────────────────────────────── */}
      {anySelected && (
        <div
          role="status"
          aria-live="polite"
          aria-label={`${selected.size} row${selected.size !== 1 ? "s" : ""} selected`}
          className={cn(
            "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
            "flex items-center gap-2 rounded-lg border border-border",
            "bg-background shadow-lg px-4 py-2.5",
            "animate-in fade-in-0 slide-in-from-bottom-3 duration-150"
          )}
        >
          <span className="text-sm font-medium text-foreground mr-1">{selected.size} selected</span>
          <div className="h-4 w-px bg-border mx-1" aria-hidden="true" />
          {bulkActionsSlot ? (
            bulkActionsSlot(selected, rows)
          ) : (
            <>
              <Button size="sm" variant="outline">
                <i className="fa-light fa-arrow-down-to-line" aria-hidden="true" /> Export
              </Button>
              <Button size="sm" variant="destructive">
                <i className="fa-light fa-trash" aria-hidden="true" /> Delete
              </Button>
            </>
          )}
          <Tip label="Clear selection" side="top">
            <Button size="icon-sm" variant="ghost" aria-label="Clear selection" onClick={() => setSelected(new Set())} className="ml-1">
              <i className="fa-light fa-xmark" aria-hidden="true" />
            </Button>
          </Tip>
        </div>
      )}
    </div>
  )
}

function DataTableWithInternalState<TData extends Record<string, unknown>>(props: DataTableExtendedProps<TData>) {
  const state = useTableState(props.data, props.columns, props.defaultSort, props.paginationOverride)
  return <DataTableInner {...props} state={state} />
}

export function DataTable<TData extends Record<string, unknown>>(props: DataTableExtendedProps<TData>) {
  if (props.state) {
    return <DataTableInner {...props} state={props.state} />
  }
  return <DataTableWithInternalState {...props} />
}
