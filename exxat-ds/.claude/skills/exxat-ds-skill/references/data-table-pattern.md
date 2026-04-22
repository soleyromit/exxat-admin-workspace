# Data Table Pattern — Full Implementation Guide

Reference implementation: `components/team-table.tsx` (Team) and `components/data-list-table.tsx` (Placements).

---

## Stack Summary

```
DataTable                         ← base table component
  └── useTableState               ← manages sort/filter/column/group state
  └── toolbarSlot                 ← renders the properties button + drawer
        └── TablePropertiesDrawer ← columns, density, filters, sort, conditional rules
```

All imports:
```ts
import { DataTable } from "@/components/data-table"
import type { ColumnDef } from "@/components/data-table/types"
import { useTableState } from "@/components/data-table/use-table-state"
import { TablePropertiesDrawer } from "@/components/table-properties"
import type {
  ConditionalRule,
  FilterFieldDef,
  FilterOperator,
} from "@/components/table-properties/types"
import {
  DEFAULT_DATA_LIST_DISPLAY_OPTIONS,
  type DataListDisplayOptions,
} from "@/lib/data-list-display-options"
```

---

## Column Definition Patterns

### Text column with filter
```ts
{
  key: "name",
  label: "Name",
  width: 240,
  minWidth: 160,
  sortable: true,
  sortKey: "name",
  defaultPin: "left",          // pin to left (optional)
  filter: {
    type: "text",
    icon: "fa-user",
    operators: ["contains", "not_contains"],
  },
  cell: row => (
    <span className="text-sm font-medium text-foreground truncate">{row.name}</span>
  ),
}
```

### Select (enum) column with filter
```ts
{
  key: "status",
  label: "Status",
  width: 120,
  minWidth: 100,
  sortable: true,
  sortKey: "status",
  filter: {
    type: "select",
    icon: "fa-circle-dot",
    operators: ["is", "is_not"],
    options: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ],
  },
  cell: row => (
    <Badge variant="outline" className={cn("text-[10px] font-medium uppercase tracking-wide", STATUS_BADGE[row.status])}>
      {STATUS_LABEL[row.status]}
    </Badge>
  ),
}
```

### Select column (pinned right, no filter)
```ts
{
  key: "select",
  label: "",
  width: 40,
  minWidth: 40,
  defaultPin: "left",
  lockPin: true,
}
```

### Actions column (pinned right)
```ts
{
  key: "actions",
  label: "",
  width: 48,
  minWidth: 48,
  defaultPin: "right",
  lockPin: true,
  cell: row => (
    <div className="flex items-center justify-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon-sm" variant="ghost" aria-label={`Actions for ${row.name}`}>
            <i className="fa-light fa-ellipsis text-sm" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem disabled>
            <i className="fa-light fa-pen" aria-hidden="true" />
            Edit
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
}
```

---

## Status Badge Pattern

```ts
const STATUS_LABEL: Record<MyType["status"], string> = {
  active: "Active",
  inactive: "Inactive",
  pending: "Pending",
}

const STATUS_BADGE: Record<MyType["status"], string> = {
  active:   "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border-emerald-500/20",
  inactive: "bg-slate-500/10 text-slate-700 dark:text-slate-200 border-border",
  pending:  "bg-amber-500/15 text-amber-900 dark:text-amber-100 border-amber-500/20",
}
```

---

## Filter Field Derivation

Convert column defs to filter field defs for the drawer:

```ts
function columnToFilterFieldDef(c: ColumnDef<T>): FilterFieldDef | null {
  if (!c.filter) return null
  const f = c.filter
  const defaultOps: FilterOperator[] =
    f.type === "select" || f.type === "date" ? ["is", "is_not"] : ["contains", "not_contains"]
  return {
    key: c.key,
    label: c.label,
    icon: f.icon ?? "fa-filter",
    type: f.type,
    operators: (f.operators ?? defaultOps) as FilterOperator[],
    options: f.options,
  }
}
```

---

## Drawer Toolbar Component

The `toolbarSlot` renders the Properties button and the drawer. Full pattern:

```tsx
function FooDrawerToolbar({ state, totalRows, filterFields, fieldDefinitionsForDrawer, resolveColumnLabel, displayOptions, onDisplayOptionsChange, conditionalRules, onAddConditionalRule, onRemoveConditionalRule, onUpdateConditionalRule }) {
  const { sheetOpen, setSheetOpen, showGridlines, setShowGridlines, rowHeight, setRowHeight,
    activeFilters, addFilter, updateFilter, removeFilter, getConnector, toggleConnector,
    filterBarVisible, setFilterBarVisible, drawerExpandedFilters, setDrawerExpandedFilters,
    rows, sortRules, setSortRules, addSortRule, removeSortRule, toggleSortDir,
    colOrder, setColOrder, hiddenCols, toggleColVisibility, moveCol, groupBy, setGroupBy, sortKey,
  } = state

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button" variant="ghost" size="icon-sm" aria-label="Properties"
              onClick={() => setSheetOpen(true)}
              className={cn(sheetOpen ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-interactive-hover-foreground hover:bg-interactive-hover")}
            >
              <i className="fa-light fa-sliders text-[13px]" aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Properties</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TablePropertiesDrawer
        open={sheetOpen} onOpenChange={setSheetOpen}
        showGridlines={showGridlines} onShowGridlinesChange={setShowGridlines}
        rowHeight={rowHeight} onRowHeightChange={setRowHeight}
        pagination={false} onPaginationChange={() => {}}
        activeFilters={activeFilters} onAddFilter={k => addFilter(k, true)}
        onUpdateFilter={updateFilter} onRemoveFilter={removeFilter}
        getFilterConnector={getConnector} onToggleFilterConnector={toggleConnector}
        filterBarVisible={filterBarVisible} onFilterBarVisibleChange={setFilterBarVisible}
        drawerExpandedFilters={drawerExpandedFilters} onDrawerExpandedFiltersChange={setDrawerExpandedFilters}
        totalRows={totalRows} filteredRows={rows.length}
        sortRules={sortRules} onSortRulesChange={setSortRules}
        onAddSortRule={addSortRule} onRemoveSortRule={removeSortRule} onToggleSortDir={toggleSortDir}
        colOrder={colOrder} onColOrderChange={setColOrder}
        hiddenCols={hiddenCols} onToggleColVisibility={toggleColVisibility} onMoveCol={moveCol}
        groupBy={groupBy} onGroupByChange={setGroupBy} primarySortKey={sortKey}
        conditionalRules={conditionalRules}
        onAddConditionalRule={onAddConditionalRule}
        onRemoveConditionalRule={onRemoveConditionalRule}
        onUpdateConditionalRule={onUpdateConditionalRule}
        filterFields={filterFields}
        lifecycleTabLabel="Foo"      // ← change to entity name
        fieldDefinitions={fieldDefinitionsForDrawer}
        resolveColumnLabel={resolveColumnLabel}
        displayOptions={displayOptions}
        onDisplayOptionsChange={onDisplayOptionsChange}
      />
    </>
  )
}
```

---

## Full Table Component Skeleton

```tsx
"use client"

import * as React from "react"
// ... all imports above

export interface FooTableHandle {
  openPropertiesDrawer: () => void
}

export const FooTable = React.forwardRef<FooTableHandle, { items: Foo[] }>(
  function FooTable({ items }, ref) {
    const columns = React.useMemo(() => buildFooColumns(), [])
    const filterFields = React.useMemo(() => columnsToFilterFields(columns), [columns])
    const fieldDefinitionsForDrawer = React.useMemo(
      () => columns.filter(c => c.key !== "select" && c.key !== "actions")
                   .map(c => ({ key: c.key, label: c.label, sortable: !!(c.sortable && (c.sortKey ?? c.key)) })),
      [columns],
    )
    const resolveColumnLabel = React.useCallback((key: string) => columns.find(c => c.key === key)?.label ?? key, [columns])

    const [displayOptions, setDisplayOptions] = React.useState<DataListDisplayOptions>(DEFAULT_DATA_LIST_DISPLAY_OPTIONS)
    const patchDisplay = React.useCallback((patch: Partial<DataListDisplayOptions>) => setDisplayOptions(prev => ({ ...prev, ...patch })), [])

    const [conditionalRules, setConditionalRules] = React.useState<ConditionalRule[]>([])
    const addConditionalRule = React.useCallback((rule: Omit<ConditionalRule, "id">) => setConditionalRules(prev => [...prev, { ...rule, id: `cr-${Date.now()}` }]), [])
    const removeConditionalRule = React.useCallback((id: string) => setConditionalRules(prev => prev.filter(r => r.id !== id)), [])
    const updateConditionalRule = React.useCallback((id: string, patch: Partial<ConditionalRule>) => setConditionalRules(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r)), [])

    const tableState = useTableState(items, columns, { key: "name", dir: "asc" })

    React.useImperativeHandle(ref, () => ({
      openPropertiesDrawer: () => tableState.setSheetOpen(true),
    }), [tableState.setSheetOpen])

    return (
      <div className="pb-6">
        <DataTable<Foo>
          data={items}
          columns={columns}
          getRowId={row => row.id}
          getRowSelectionLabel={row => row.name}
          selectable
          searchable={displayOptions.showToolbarSearch}
          showColumnHeaders={displayOptions.showColumnLabels}
          groupable
          defaultSort={{ key: "name", dir: "asc" as const }}
          emptyState={<p className="text-sm text-muted-foreground">No items found.</p>}
          conditionalRules={conditionalRules}
          state={tableState}
          toolbarSlot={s => (
            <FooDrawerToolbar
              state={s} totalRows={items.length} filterFields={filterFields}
              fieldDefinitionsForDrawer={fieldDefinitionsForDrawer} resolveColumnLabel={resolveColumnLabel}
              displayOptions={displayOptions} onDisplayOptionsChange={patchDisplay}
              conditionalRules={conditionalRules} onAddConditionalRule={addConditionalRule}
              onRemoveConditionalRule={removeConditionalRule} onUpdateConditionalRule={updateConditionalRule}
            />
          )}
          bulkActionsSlot={selected => {
            if (selected.size === 0) return null
            return (
              <>
                <span className="sr-only">{selected.size} selected</span>
                <Tip label="Export selection (demo)">
                  <Button size="sm" variant="outline" type="button">
                    <i className="fa-light fa-arrow-down-to-line" aria-hidden="true" />
                    Export
                  </Button>
                </Tip>
              </>
            )
          }}
        />
      </div>
    )
  }
)

FooTable.displayName = "FooTable"
```

---

## ListPageTemplate Client Skeleton

```tsx
"use client"

import * as React from "react"
import { ListPageTemplate, type ViewTab } from "@/components/templates/list-page"
import { FooPageHeader } from "@/components/foo-page-header"
import { FooTable, type FooTableHandle } from "@/components/foo-table"
import { KeyMetrics } from "@/components/key-metrics"
import { FOO_ITEMS } from "@/lib/mock/foo"
import { fooKpiInsight, fooKpiMetrics } from "@/lib/mock/foo-kpi"
import { dataListViewIcon } from "@/lib/data-list-view"
import { Button } from "@/components/ui/button"

const DEFAULT_TABS: ViewTab[] = [
  { id: "all", label: "All Foos", viewType: "table", icon: "fa-table", filterId: "all" },
]

export function FooClient() {
  const [exportOpen, setExportOpen] = React.useState(false)
  const [showMetrics, setShowMetrics] = React.useState(true)
  const tableRef = React.useRef<FooTableHandle>(null)

  const metrics = React.useMemo(() => fooKpiMetrics(FOO_ITEMS), [])
  const insight = React.useMemo(() => fooKpiInsight(FOO_ITEMS), [])

  return (
    <ListPageTemplate
      defaultTabs={DEFAULT_TABS}
      getTabCount={() => FOO_ITEMS.length}
      onEditView={(tab, { updateTab }) => {
        const mustSwitch = tab.viewType !== "table" && tab.viewType !== "list" && tab.viewType !== "board"
        if (mustSwitch) updateTab({ viewType: "table", icon: dataListViewIcon("table") })
        window.setTimeout(() => tableRef.current?.openPropertiesDrawer(), mustSwitch ? 160 : 0)
      }}
      header={
        <FooPageHeader
          itemCount={FOO_ITEMS.length}
          onAdd={() => {}}
          onExport={() => setExportOpen(true)}
          showMetrics={showMetrics}
          onToggleMetrics={() => setShowMetrics(v => !v)}
        />
      }
      metrics={<KeyMetrics variant="flat" metrics={metrics} insight={insight} showHeader={false} metricsSingleRow />}
      showMetrics={showMetrics}
      exportOpen={exportOpen}
      onExportOpenChange={setExportOpen}
      exportTotalRows={FOO_ITEMS.length}
      renderContent={(tab, updateTab) => {
        if (tab.viewType === "table") return <FooTable key={tab.id} ref={tableRef} items={FOO_ITEMS} />
        return (
          <div className="px-4 py-12 text-center lg:px-6">
            <p className="text-sm font-medium text-foreground">{tab.viewType === "list" ? "List" : "Board"} view is not wired in this demo.</p>
            <Button type="button" className="mt-4" size="sm" onClick={() => updateTab({ viewType: "table", icon: dataListViewIcon("table") })}>
              Switch to table
            </Button>
          </div>
        )
      }}
    />
  )
}
```
