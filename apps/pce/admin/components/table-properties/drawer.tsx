"use client"

/**
 * Table Properties Drawer (stripped vendor) — PCE.
 *
 * Vendored 2026-05-11 from `exxat-ds/apps/web/components/table-properties/`
 * per `docs/governance/component-depth-audits/organisms-templates.md`
 * + `docs/governance/ds-adoption.md` (kind="vendor").
 *
 * Strip rationale: PCE has 13 DataTable pages, none with column-visibility UI.
 * The canonical (1041 LoC) carries conditional-formatting rules, group-by config,
 * view-type switcher, row-density, and table-display options that PCE doesn't
 * need yet. This stripped vendor (~340 LoC) keeps:
 *   - Columns: visibility toggle + drag-reorder
 *   - Sort:    add/remove rules, toggle direction, drag-reorder priority
 *   - Filter:  add/remove rules, edit values (text / select / date), AND/OR connectors
 *
 * Wire via DataTable's `toolbarSlot` prop — see /admin/students/page.tsx.
 *
 * When the canonical's Display + Group + Conditional sections are needed in PCE,
 * either re-vendor the full file or pull the missing panels into this file behind
 * `show*` props (per the workspace registry's vendor-when-extending convention).
 */

import * as React from "react"
import {
  cn,
  Button,
  DragHandleGripIcon,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Sheet,
  SheetContent,
  SheetTitle,
  Tip,
  ToggleSwitch,
} from "@exxat/ds/packages/ui/src"
import { FilterDateCalendar } from "@/components/data-table/filter-date-calendar"
import {
  type ActiveFilter,
  type FilterFieldDef,
  type FilterOperator,
  type SortRule,
  OPERATOR_LABELS,
} from "./types"

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export interface TablePropertiesDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void

  // Filters
  activeFilters: ActiveFilter[]
  onAddFilter: (fieldKey: string) => void
  onUpdateFilter: (id: string, patch: Partial<ActiveFilter>) => void
  onRemoveFilter: (id: string) => void
  /** Combiner above this filter (default "and"). Connector is keyed on `leftFilterId`. */
  getFilterConnector: (leftFilterId: string) => "and" | "or"
  onToggleFilterConnector: (leftFilterId: string) => void
  filterFields: FilterFieldDef[]
  totalRows: number
  filteredRows: number

  // Sort
  sortRules: SortRule[]
  onSortRulesChange: (rules: SortRule[]) => void
  onAddSortRule: (fieldKey: string) => void
  onRemoveSortRule: (id: string) => void
  onToggleSortDir: (id: string) => void

  // Columns
  colOrder: string[]
  onColOrderChange: (order: string[]) => void
  hiddenCols: Set<string>
  onToggleColVisibility: (key: string) => void
  onMoveCol: (key: string, dir: "up" | "down") => void
  /** Resolve a column-key → display label (built from the active ColumnDef[]). */
  resolveColumnLabel: (key: string) => string
  /** Keys that can be hidden / reordered (excludes synthetic "select", "actions"). */
  orderableKeys: string[]
}

type SheetPanel = "main" | "filter" | "sort" | "columns"

// ─────────────────────────────────────────────────────────────────────────────
// Drawer
// ─────────────────────────────────────────────────────────────────────────────

export function TablePropertiesDrawer({
  open,
  onOpenChange,
  activeFilters,
  onAddFilter,
  onUpdateFilter,
  onRemoveFilter,
  getFilterConnector,
  onToggleFilterConnector,
  filterFields,
  totalRows,
  filteredRows,
  sortRules,
  onSortRulesChange,
  onAddSortRule,
  onRemoveSortRule,
  onToggleSortDir,
  colOrder,
  onColOrderChange,
  hiddenCols,
  onToggleColVisibility,
  onMoveCol,
  resolveColumnLabel,
  orderableKeys,
}: TablePropertiesDrawerProps) {
  const [panel, setPanel] = React.useState<SheetPanel>("main")
  const [expandedFilters, setExpandedFilters] = React.useState<Set<string>>(new Set())

  React.useEffect(() => {
    if (!open) setPanel("main")
  }, [open])

  const primarySortLabel = sortRules[0]?.fieldKey
    ? resolveColumnLabel(sortRules[0].fieldKey)
    : "—"

  // ── Sort drag-reorder ─────────────────────────────────────────────────────
  const sortDragId = React.useRef<string | null>(null)
  const [sortOverId, setSortOverId] = React.useState<string | null>(null)
  function handleSortDragStart(id: string, e: React.DragEvent) {
    e.dataTransfer.effectAllowed = "move"
    sortDragId.current = id
  }
  function handleSortDragOver(id: string, e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    if (sortDragId.current && sortDragId.current !== id) setSortOverId(id)
  }
  function handleSortDrop(id: string, e: React.DragEvent) {
    e.preventDefault()
    if (!sortDragId.current || sortDragId.current === id) {
      sortDragId.current = null
      setSortOverId(null)
      return
    }
    const from = sortRules.findIndex(r => r.id === sortDragId.current)
    const to = sortRules.findIndex(r => r.id === id)
    if (from === -1 || to === -1) {
      sortDragId.current = null
      setSortOverId(null)
      return
    }
    const next = [...sortRules]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onSortRulesChange(next)
    sortDragId.current = null
    setSortOverId(null)
  }
  function handleSortDragEnd() {
    sortDragId.current = null
    setSortOverId(null)
  }

  // ── Columns drag-reorder ──────────────────────────────────────────────────
  const colDragKey = React.useRef<string | null>(null)
  const [colOverKey, setColOverKey] = React.useState<string | null>(null)
  function handleColDragStart(key: string, e: React.DragEvent) {
    e.dataTransfer.effectAllowed = "move"
    colDragKey.current = key
  }
  function handleColDragOver(key: string, e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    if (colDragKey.current && colDragKey.current !== key) setColOverKey(key)
  }
  function handleColDrop(key: string, e: React.DragEvent) {
    e.preventDefault()
    if (!colDragKey.current || colDragKey.current === key) {
      colDragKey.current = null
      setColOverKey(null)
      return
    }
    const next = [...colOrder]
    const from = next.indexOf(colDragKey.current)
    const to = next.indexOf(key)
    if (from === -1 || to === -1) {
      colDragKey.current = null
      setColOverKey(null)
      return
    }
    next.splice(from, 1)
    next.splice(to, 0, colDragKey.current)
    onColOrderChange(next)
    colDragKey.current = null
    setColOverKey(null)
  }
  function handleColDragEnd() {
    colDragKey.current = null
    setColOverKey(null)
  }

  function toggleExpandFilter(id: string) {
    setExpandedFilters(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        showOverlay={false}
        className="w-80 sm:max-w-80 p-0 gap-0 flex flex-col border border-border shadow-xl rounded-xl overflow-hidden"
        style={{ top: "0.5rem", bottom: "0.5rem", right: "0.5rem", height: "calc(100vh - 1rem)" }}
      >
        {panel === "main" ? (
          <>
            <div className="flex items-center justify-between gap-3 px-4 pt-5 pb-3">
              <SheetTitle className="text-base font-semibold leading-tight">Properties</SheetTitle>
              <Tip label="Close" side="bottom">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Close"
                  onClick={() => onOpenChange(false)}
                >
                  <i className="fa-light fa-xmark text-[13px]" aria-hidden="true" />
                </Button>
              </Tip>
            </div>

            <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
              {([
                {
                  id: "filter" as SheetPanel,
                  icon: "fa-filter",
                  label: "Filter",
                  desc: activeFilters.length === 0
                    ? `Showing all ${filteredRows} rows.`
                    : `${activeFilters.length} filter${activeFilters.length !== 1 ? "s" : ""} active · ${filteredRows} rows.`,
                },
                {
                  id: "sort" as SheetPanel,
                  icon: "fa-arrow-up-arrow-down",
                  label: "Sort",
                  desc: `Sorted by ${primarySortLabel}.`,
                },
                {
                  id: "columns" as SheetPanel,
                  icon: "fa-table-columns",
                  label: "Columns",
                  desc: hiddenCols.size === 0
                    ? "All columns visible."
                    : `${hiddenCols.size} column${hiddenCols.size !== 1 ? "s" : ""} hidden.`,
                },
              ] as { id: SheetPanel; icon: string; label: string; desc: string }[]).map(item => (
                <Button
                  key={item.id}
                  type="button"
                  variant="ghost"
                  onClick={() => setPanel(item.id)}
                  className={cn(
                    "w-full h-auto justify-start gap-3 px-3 py-3 rounded-2xl font-normal border border-transparent",
                    "hover:bg-muted/60 hover:text-foreground",
                    "focus-visible:bg-muted/60 focus-visible:text-foreground",
                  )}
                >
                  <span className="inline-flex items-center justify-center size-9 rounded-lg bg-secondary border border-border shrink-0">
                    <i className={`fa-light ${item.icon} text-[15px] text-secondary-foreground`} aria-hidden="true" />
                  </span>
                  <span className="flex-1 min-w-0 text-left">
                    <span className="block text-sm font-medium text-foreground">{item.label}</span>
                    <span className="block text-xs text-muted-foreground mt-0.5">{item.desc}</span>
                  </span>
                  <i className="fa-light fa-chevron-right text-xs text-muted-foreground shrink-0" aria-hidden="true" />
                </Button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Tip label="Back to Properties" side="bottom">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0"
                    aria-label="Back to Properties"
                    onClick={() => setPanel("main")}
                  >
                    <i className="fa-light fa-chevron-left text-[13px]" aria-hidden="true" />
                  </Button>
                </Tip>
                <div className="min-w-0">
                  <SheetTitle className="text-base font-semibold text-foreground leading-tight">
                    {{ filter: "Filter", sort: "Sort", columns: "Columns", main: "" }[panel]}
                  </SheetTitle>
                  {panel === "filter" && (
                    <p
                      className="text-xs text-muted-foreground mt-0.5"
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      {activeFilters.length === 0
                        ? `Showing all ${filteredRows} rows`
                        : `${filteredRows} of ${totalRows} rows match · ${activeFilters.length} filter${activeFilters.length !== 1 ? "s" : ""} active`}
                    </p>
                  )}
                </div>
              </div>
              <Tip label="Close" side="bottom">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0"
                  aria-label="Close panel"
                  onClick={() => onOpenChange(false)}
                >
                  <i className="fa-light fa-xmark text-[13px]" aria-hidden="true" />
                </Button>
              </Tip>
            </div>

            <div className="flex-1 overflow-y-auto">
              {panel === "filter" && (
                <FilterPanel
                  activeFilters={activeFilters}
                  filterFields={filterFields}
                  expanded={expandedFilters}
                  onToggleExpand={toggleExpandFilter}
                  onAddFilter={onAddFilter}
                  onUpdateFilter={onUpdateFilter}
                  onRemoveFilter={onRemoveFilter}
                  getFilterConnector={getFilterConnector}
                  onToggleFilterConnector={onToggleFilterConnector}
                />
              )}

              {panel === "sort" && (
                <SortPanel
                  sortRules={sortRules}
                  resolveColumnLabel={resolveColumnLabel}
                  onAddSortRule={onAddSortRule}
                  onRemoveSortRule={onRemoveSortRule}
                  onToggleSortDir={onToggleSortDir}
                  onSortRulesChange={onSortRulesChange}
                  sortFieldList={orderableKeys.map(k => ({ key: k, label: resolveColumnLabel(k) }))}
                  // drag state
                  dragId={sortDragId.current}
                  overId={sortOverId}
                  onDragStart={handleSortDragStart}
                  onDragOver={handleSortDragOver}
                  onDrop={handleSortDrop}
                  onDragEnd={handleSortDragEnd}
                />
              )}

              {panel === "columns" && (
                <ColumnsPanel
                  orderableKeys={orderableKeys.filter(k => colOrder.includes(k))}
                  hiddenCols={hiddenCols}
                  resolveColumnLabel={resolveColumnLabel}
                  onToggleVisibility={onToggleColVisibility}
                  onMoveCol={onMoveCol}
                  // drag state
                  dragKey={colDragKey.current}
                  overKey={colOverKey}
                  onDragStart={handleColDragStart}
                  onDragOver={handleColDragOver}
                  onDrop={handleColDrop}
                  onDragEnd={handleColDragEnd}
                />
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FilterPanel — list + per-card editor + Add/Remove
// ─────────────────────────────────────────────────────────────────────────────

function FilterPanel({
  activeFilters,
  filterFields,
  expanded,
  onToggleExpand,
  onAddFilter,
  onUpdateFilter,
  onRemoveFilter,
  getFilterConnector,
  onToggleFilterConnector,
}: {
  activeFilters: ActiveFilter[]
  filterFields: FilterFieldDef[]
  expanded: Set<string>
  onToggleExpand: (id: string) => void
  onAddFilter: (fieldKey: string) => void
  onUpdateFilter: (id: string, patch: Partial<ActiveFilter>) => void
  onRemoveFilter: (id: string) => void
  getFilterConnector: (leftId: string) => "and" | "or"
  onToggleFilterConnector: (leftId: string) => void
}) {
  return (
    <div className="px-4 py-4 space-y-2">
      {activeFilters.length === 0 ? (
        <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center size-7 rounded-lg bg-background border border-border shrink-0">
              <i className="fa-light fa-filter text-muted-foreground text-xs" aria-hidden="true" />
            </span>
            <p className="text-sm font-medium text-foreground">No filters yet</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Use filters to show only the rows you need. With multiple filters, choose <span className="font-medium text-foreground/80">and</span> / <span className="font-medium text-foreground/80">or</span> between them to control how they combine.
          </p>
        </div>
      ) : (
        activeFilters.map((f, idx) => {
          const fieldDef = filterFields.find(fd => fd.key === f.fieldKey)
          if (!fieldDef) return null
          const leftId = idx > 0 ? activeFilters[idx - 1]!.id : null
          const connector = leftId ? getFilterConnector(leftId) : "and"
          return (
            <React.Fragment key={f.id}>
              {idx > 0 && leftId && (
                <div className="flex items-center gap-2 py-1">
                  <div className="flex-1 h-px bg-border" aria-hidden="true" />
                  <Tip label="Click to switch: AND — every filter must match; OR — any matching filter is enough." side="top">
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => onToggleFilterConnector(leftId)}
                      className={cn(
                        "shrink-0 h-auto px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
                        "bg-muted/40 text-muted-foreground hover:bg-interactive-hover hover:text-interactive-hover-foreground",
                      )}
                      aria-label={connector === "and"
                        ? "Filters are combined with AND. Click to use OR instead."
                        : "Filters are combined with OR. Click to use AND instead."}
                    >
                      {connector}
                    </Button>
                  </Tip>
                  <div className="flex-1 h-px bg-border" aria-hidden="true" />
                </div>
              )}
              <FilterCard
                filter={f}
                fieldDef={fieldDef}
                expanded={expanded.has(f.id)}
                onToggleExpand={() => onToggleExpand(f.id)}
                onUpdate={onUpdateFilter}
                onRemove={onRemoveFilter}
              />
            </React.Fragment>
          )
        })
      )}

      <div className="flex items-center gap-2 pt-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" className="flex-1 gap-1.5 h-8 border-dashed text-muted-foreground">
              <i className="fa-light fa-plus text-xs" aria-hidden="true" />
              Add filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel className="text-xs">Filter by field</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {filterFields.map(f => (
              <DropdownMenuItem key={f.key} onClick={() => onAddFilter(f.key)}>
                <i className={`fa-light ${f.icon}`} aria-hidden="true" />
                {f.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {activeFilters.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => activeFilters.forEach(f => onRemoveFilter(f.id))}
          >
            Remove all
          </Button>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FilterCard — inline editor (collapsed header + expanded values panel)
// ─────────────────────────────────────────────────────────────────────────────

function FilterCard({
  filter,
  fieldDef,
  expanded,
  onToggleExpand,
  onUpdate,
  onRemove,
}: {
  filter: ActiveFilter
  fieldDef: FilterFieldDef
  expanded: boolean
  onToggleExpand: () => void
  onUpdate: (id: string, patch: Partial<ActiveFilter>) => void
  onRemove: (id: string) => void
}) {
  const [optSearch, setOptSearch] = React.useState("")
  const options = fieldDef.options ?? []
  const showSearch = options.length > 8
  const filteredOpts = optSearch
    ? options.filter(o => o.label.toLowerCase().includes(optSearch.toLowerCase()))
    : options

  React.useEffect(() => {
    if (fieldDef.type !== "select" && fieldDef.type !== "date") return
    if (filter.operator !== "is" && filter.operator !== "is_not") {
      onUpdate(filter.id, { operator: "is" })
    }
  }, [filter.operator, filter.id, fieldDef.type, onUpdate])

  function toggleValue(val: string) {
    const next = filter.values.includes(val)
      ? filter.values.filter(v => v !== val)
      : [...filter.values, val]
    onUpdate(filter.id, { values: next })
  }

  function cycleOperator() {
    const ops = fieldDef.operators
    const idx = ops.indexOf(filter.operator as FilterOperator)
    const i = idx === -1 ? 0 : idx
    onUpdate(filter.id, { operator: ops[(i + 1) % ops.length] })
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="flex items-start justify-between px-3 pt-2.5 pb-2 gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{fieldDef.label}</p>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            aria-label={`Operator: ${OPERATOR_LABELS[filter.operator]} — click to cycle`}
            onClick={cycleOperator}
            className="h-auto py-0 px-1 -ms-1 text-xs text-muted-foreground font-normal"
          >
            {OPERATOR_LABELS[filter.operator]}
            <i className="fa-light fa-chevron-down text-xs" aria-hidden="true" />
          </Button>
        </div>
        <div className="flex items-center gap-0.5 shrink-0 self-start">
          <Tip label={`Remove ${fieldDef.label} filter`} side="top">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove ${fieldDef.label} filter`}
              className="text-muted-foreground hover:text-destructive"
              onClick={() => onRemove(filter.id)}
            >
              <i className="fa-light fa-trash text-xs" aria-hidden="true" />
            </Button>
          </Tip>
          <Tip label={expanded ? `Collapse ${fieldDef.label}` : `Expand ${fieldDef.label}`} side="top">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={expanded ? `Collapse ${fieldDef.label}` : `Expand ${fieldDef.label}`}
              onClick={onToggleExpand}
            >
              <i className={`fa-light ${expanded ? "fa-chevron-up" : "fa-chevron-down"} text-xs`} aria-hidden="true" />
            </Button>
          </Tip>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border">
          {fieldDef.type === "select" ? (
            <>
              {showSearch && (
                <div className="px-3 pt-2 pb-1">
                  <Input placeholder="Search…" value={optSearch} onChange={e => setOptSearch(e.target.value)} className="h-7 text-xs" />
                </div>
              )}
              <div
                role="listbox"
                aria-multiselectable="true"
                aria-label={`${fieldDef.label} options`}
                className="py-1 max-h-52 overflow-y-auto"
              >
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
                      className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-interactive-hover cursor-pointer select-none focus-visible:outline-none focus-visible:bg-interactive-hover"
                    >
                      <span
                        aria-hidden="true"
                        data-slot="checkbox"
                        data-state={checked ? "checked" : "unchecked"}
                        className={cn(
                          "inline-flex items-center justify-center size-3.5 shrink-0 rounded-[3px] border transition-colors",
                          checked ? "bg-primary border-primary text-primary-foreground" : "border-input bg-background"
                        )}
                      >
                        {checked && <i className="fa-solid fa-check text-current" style={{ fontSize: "7px" }} />}
                      </span>
                      <span className="text-foreground">{opt.label}</span>
                    </div>
                  )
                })}
                {filteredOpts.length === 0 && (
                  <p className="px-3 py-2 text-xs text-muted-foreground">No options found</p>
                )}
              </div>
            </>
          ) : fieldDef.type === "date" ? (
            <div className="p-2">
              <FilterDateCalendar
                label={`${fieldDef.label} — choose date`}
                valueYmd={filter.values[0]}
                onChangeYmd={(ymd) => onUpdate(filter.id, { values: ymd ? [ymd] : [] })}
              />
            </div>
          ) : (
            <div className="p-3">
              <Input
                aria-label={`${fieldDef.label} value`}
                placeholder={`Enter ${fieldDef.label.toLowerCase()}…`}
                value={filter.values[0] ?? ""}
                onChange={e => onUpdate(filter.id, { values: [e.target.value] })}
                className="text-sm"
                autoFocus
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SortPanel
// ─────────────────────────────────────────────────────────────────────────────

function SortPanel({
  sortRules,
  resolveColumnLabel,
  onAddSortRule,
  onRemoveSortRule,
  onToggleSortDir,
  onSortRulesChange: _onSortRulesChange,
  sortFieldList,
  dragId,
  overId,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  sortRules: SortRule[]
  resolveColumnLabel: (key: string) => string
  onAddSortRule: (fieldKey: string) => void
  onRemoveSortRule: (id: string) => void
  onToggleSortDir: (id: string) => void
  onSortRulesChange: (rules: SortRule[]) => void
  sortFieldList: { key: string; label: string }[]
  dragId: string | null
  overId: string | null
  onDragStart: (id: string, e: React.DragEvent) => void
  onDragOver: (id: string, e: React.DragEvent) => void
  onDrop: (id: string, e: React.DragEvent) => void
  onDragEnd: () => void
}) {
  return (
    <div className="px-4 py-4 space-y-2">
      {sortRules.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center space-y-2">
          <div className="inline-flex items-center justify-center size-9 rounded-lg bg-muted mb-1">
            <i className="fa-light fa-arrow-up-arrow-down text-muted-foreground text-[16px]" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-foreground">No sorts applied</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Add a sort rule to order rows by any field. Multiple rules apply in priority order.
          </p>
        </div>
      ) : (
        sortRules.map((rule, idx) => {
          const fieldLabel = resolveColumnLabel(rule.fieldKey)
          const isDragging = dragId === rule.id
          const isOver = overId === rule.id && dragId !== rule.id
          return (
            <React.Fragment key={rule.id}>
              {idx > 0 && (
                <div className="flex items-center gap-2 py-0.5">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs font-medium text-muted-foreground px-1">then by</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              )}
              <div
                draggable
                onDragStart={e => onDragStart(rule.id, e)}
                onDragOver={e => onDragOver(rule.id, e)}
                onDrop={e => onDrop(rule.id, e)}
                onDragEnd={onDragEnd}
                className={cn(
                  "transition-all rounded-lg",
                  isDragging && "opacity-40",
                  isOver && "ring-2 ring-ring bg-accent/30",
                )}
              >
                <div className="rounded-lg border border-border bg-background overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2.5">
                    <DragHandleGripIcon className="text-[13px] text-muted-foreground/40" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {idx === 0 && (
                          <span className="text-xs font-bold text-accent-foreground bg-accent rounded px-1 py-0.5 leading-none uppercase tracking-wide shrink-0">
                            Primary
                          </span>
                        )}
                        <p className="text-sm font-medium text-foreground truncate">{fieldLabel}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        aria-label={`Direction: ${rule.direction === "asc" ? "Ascending" : "Descending"} — click to toggle`}
                        onClick={() => onToggleSortDir(rule.id)}
                        className="h-auto py-0 px-1 -ms-1 text-xs text-muted-foreground font-normal hover:text-interactive-hover-foreground mt-0.5"
                      >
                        <i className={`fa-light ${rule.direction === "asc" ? "fa-arrow-up-az" : "fa-arrow-down-az"} text-xs`} aria-hidden="true" />
                        {rule.direction === "asc" ? "Ascending" : "Descending"}
                        <i className="fa-light fa-chevron-down text-xs" aria-hidden="true" />
                      </Button>
                    </div>
                    <Tip label={`Remove ${fieldLabel} sort`} side="top">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove ${fieldLabel} sort`}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => onRemoveSortRule(rule.id)}
                      >
                        <i className="fa-light fa-trash text-xs" aria-hidden="true" />
                      </Button>
                    </Tip>
                  </div>
                </div>
              </div>
            </React.Fragment>
          )
        })
      )}

      <div className="flex items-center gap-2 pt-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" className="flex-1 gap-1.5 h-8 border-dashed text-muted-foreground">
              <i className="fa-light fa-plus text-xs" aria-hidden="true" />
              Add sort
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel className="text-xs">Sort by field</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {sortFieldList.filter(f => !sortRules.some(r => r.fieldKey === f.key)).map(col => (
              <DropdownMenuItem key={col.key} onClick={() => onAddSortRule(col.key)}>
                <i className="fa-light fa-arrow-up-arrow-down text-xs" aria-hidden="true" />
                {col.label}
              </DropdownMenuItem>
            ))}
            {sortFieldList.filter(f => !sortRules.some(r => r.fieldKey === f.key)).length === 0 && (
              <p className="px-2 py-1.5 text-xs text-muted-foreground">All fields added</p>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ColumnsPanel — visibility toggle + drag reorder + up/down nudge
// ─────────────────────────────────────────────────────────────────────────────

function ColumnsPanel({
  orderableKeys,
  hiddenCols,
  resolveColumnLabel,
  onToggleVisibility,
  onMoveCol,
  dragKey,
  overKey,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  orderableKeys: string[]
  hiddenCols: Set<string>
  resolveColumnLabel: (key: string) => string
  onToggleVisibility: (key: string) => void
  onMoveCol: (key: string, dir: "up" | "down") => void
  dragKey: string | null
  overKey: string | null
  onDragStart: (key: string, e: React.DragEvent) => void
  onDragOver: (key: string, e: React.DragEvent) => void
  onDrop: (key: string, e: React.DragEvent) => void
  onDragEnd: () => void
}) {
  return (
    <div className="px-4 py-4">
      <p className="text-xs text-muted-foreground mb-3">
        {hiddenCols.size === 0
          ? "All columns visible. Drag to reorder."
          : `${hiddenCols.size} column${hiddenCols.size !== 1 ? "s" : ""} hidden. Drag handle to reorder.`}
      </p>
      <div className="space-y-0.5" role="list" aria-label="Column order and visibility">
        {orderableKeys.map((key, idx, arr) => {
          const label = resolveColumnLabel(key)
          const isDragging = dragKey === key
          const isOver = overKey === key && dragKey !== key
          const isFirst = idx === 0
          const isLast = idx === arr.length - 1
          return (
            <div
              key={key}
              role="listitem"
              draggable
              onDragStart={e => onDragStart(key, e)}
              onDragOver={e => onDragOver(key, e)}
              onDrop={e => onDrop(key, e)}
              onDragEnd={onDragEnd}
              className={cn(
                "flex items-center gap-2 px-2 py-2 rounded-lg group hover:bg-interactive-hover-subtle transition-colors cursor-grab active:cursor-grabbing",
                isDragging && "opacity-40",
                isOver && "ring-2 ring-ring bg-accent/30",
              )}
            >
              <DragHandleGripIcon className="text-[13px] text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" />
              <span className="flex-1 text-sm text-foreground">{label}</span>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Tip label={`Move ${label} up`} side="top">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Move ${label} up`}
                    disabled={isFirst}
                    onClick={() => onMoveCol(key, "up")}
                    className="text-muted-foreground hover:text-interactive-hover-foreground"
                  >
                    <i className="fa-light fa-chevron-up text-xs" aria-hidden="true" />
                  </Button>
                </Tip>
                <Tip label={`Move ${label} down`} side="top">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Move ${label} down`}
                    disabled={isLast}
                    onClick={() => onMoveCol(key, "down")}
                    className="text-muted-foreground hover:text-interactive-hover-foreground"
                  >
                    <i className="fa-light fa-chevron-down text-xs" aria-hidden="true" />
                  </Button>
                </Tip>
              </div>
              <ToggleSwitch
                checked={!hiddenCols.has(key)}
                onChange={() => onToggleVisibility(key)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
