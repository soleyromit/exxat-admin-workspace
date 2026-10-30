'use client'

/**
 * One filter entry point per table (anatomy rule A9, Romit 2026-10-30).
 *
 * The DS DataTable opens with its filter bar visible, so an unfiltered table shows two ways in: the dashed
 * "+ Add filter" chip and the toolbar filter icon. This wrapper starts every lab table with the bar hidden, using the
 * DS's own `setFilterBarVisible` (the same state its filter icon toggles). The toolbar filter icon is then the single
 * entry: it opens "Filter by field", and applied filters still show as removable chips with the DS Add filter and
 * Clear controls beside them.
 *
 * `next.config.ts` and `vitest.config.ts` alias the exact specifier `@exxatdesignux/ui/components/data-table` here, so
 * every screen gets this without an import change. This file imports the real module through its `/index` subpath,
 * which the alias does not catch, so there is one DS module instance.
 */
import * as React from 'react'
import {
  DataTable as DSDataTable,
  type DataTableExtendedProps,
} from '@exxatdesignux/ui/components/data-table/index'

export * from '@exxatdesignux/ui/components/data-table/index'

type ToolbarState<TData extends Record<string, unknown>> = Parameters<
  NonNullable<DataTableExtendedProps<TData>['toolbarSlot']>
>[0]

const useIsoLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect

/** Hides the empty filter bar once, on mount. Renders nothing. */
function StartWithFilterBarHidden<TData extends Record<string, unknown>>({ state }: { state: ToolbarState<TData> }) {
  const done = React.useRef(false)
  const { activeFilters, setFilterBarVisible } = state
  useIsoLayoutEffect(() => {
    if (done.current) return
    done.current = true
    if (activeFilters.length === 0) setFilterBarVisible(false)
  }, [activeFilters.length, setFilterBarVisible])
  return null
}

export function DataTable<TData extends Record<string, unknown>>(props: DataTableExtendedProps<TData>) {
  const { toolbarSlot } = props
  const slot = React.useCallback(
    (state: ToolbarState<TData>) => (
      <>
        <StartWithFilterBarHidden<TData> state={state} />
        {toolbarSlot ? toolbarSlot(state) : null}
      </>
    ),
    [toolbarSlot],
  )
  return <DSDataTable<TData> {...props} toolbarSlot={slot} />
}
