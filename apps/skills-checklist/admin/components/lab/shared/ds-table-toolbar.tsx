"use client"

/**
 * The DS table toolbar for every lab table (Romit 2026-11-09: "filters, columns, or any data table dropdown filters" should look like the DS):
 * the DataTable's own search and filter icons, then the DS Properties button (filter, sort, group, columns, conditional rules). Pass the
 * result to DataTable as `toolbarSlot` and `conditionalRules` with `searchable` and `showQueryControls` on.
 */
import * as React from "react"
import type { ColumnDef, ConditionalRule } from "@exxatdesignux/ui/components/data-table/types"
import type { useTableState } from "@exxatdesignux/ui/components/data-table/use-table-state"
import { TablePropertiesDrawerButton } from "@exxatdesignux/ui/components/table-properties"
import { columnsToFieldDefinitions, columnsToFilterFields } from "@exxatdesignux/ui/components/data-views"
import { DEFAULT_DATA_LIST_DISPLAY_OPTIONS } from "@exxatdesignux/ui/lib/data-list-display-options"

const NOOP = () => {}

export function useDsTableToolbar<T extends Record<string, unknown>>(columns: ColumnDef<T>[], label: string, after?: React.ReactNode) {
  const [rules, setRules] = React.useState<ConditionalRule[]>([])
  const addRule = React.useCallback((r: Omit<ConditionalRule, "id">) => setRules((now) => [...now, { ...r, id: `rule-${Date.now().toString(36)}` }]), [])
  const removeRule = React.useCallback((id: string) => setRules((now) => now.filter((r) => r.id !== id)), [])
  const updateRule = React.useCallback((id: string, patch: Partial<ConditionalRule>) => setRules((now) => now.map((r) => (r.id === id ? { ...r, ...patch } : r))), [])
  const fieldDefinitions = React.useMemo(() => columnsToFieldDefinitions(columns.filter((c) => !c.filterOnly)), [columns])
  const filterFields = React.useMemo(() => columnsToFilterFields(columns), [columns])
  const toolbarSlot = React.useCallback((state: ReturnType<typeof useTableState<T>>) => (
    <>
      <TablePropertiesDrawerButton
        state={state}
        totalRows={state.rows.length}
        filterFields={filterFields}
        fieldDefinitions={fieldDefinitions}
        displayOptions={DEFAULT_DATA_LIST_DISPLAY_OPTIONS}
        onDisplayOptionsChange={NOOP}
        conditionalRules={rules}
        onAddConditionalRule={addRule}
        onRemoveConditionalRule={removeRule}
        onUpdateConditionalRule={updateRule}
        lifecycleTabLabel={label}
      />
      {after}
    </>
  ), [filterFields, fieldDefinitions, rules, addRule, removeRule, updateRule, label, after])
  return { toolbarSlot, conditionalRules: rules }
}
