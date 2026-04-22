"use client"

// ─────────────────────────────────────────────────────────────────────────────
// useTableState — all non-display state shared by DataTable and DataTablePaginated
// ─────────────────────────────────────────────────────────────────────────────

import * as React from "react"
import type { RowHeight } from "@/lib/row-height"
import type { ColumnDef, SortDir } from "./types"
import type { ActiveFilter, FilterOperator, SortRule } from "@/components/table-properties/types"
import { parseRowDateToYmd } from "@/lib/date-filter"

let _filterId = 0
function nextFilterId() { return `f-${++_filterId}` }

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Build the default widths map from column defs */
function buildDefaultWidths<TData>(columns: ColumnDef<TData>[]): Record<string, number> {
  const map: Record<string, number> = {}
  for (const col of columns) {
    if (col.width !== undefined) map[col.key] = col.width
  }
  return map
}

/** Build the initial pin state from column defs */
function buildDefaultPins<TData>(columns: ColumnDef<TData>[]): Record<string, "left" | "right"> {
  const map: Record<string, "left" | "right"> = {}
  for (const col of columns) {
    if (col.defaultPin) map[col.key] = col.defaultPin
  }
  return map
}

function compareUnknownSort(a: unknown, b: unknown): number {
  if (a === b) return 0
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  if (typeof a === "number" && typeof b === "number") return a < b ? -1 : a > b ? 1 : 0
  if (typeof a === "string" && typeof b === "string") return a < b ? -1 : a > b ? 1 : 0
  const as = String(a)
  const bs = String(b)
  return as < bs ? -1 : as > bs ? 1 : 0
}

/** Build the locked-pin set (columns that can never be unpinned) */
function buildLockedPins<TData>(columns: ColumnDef<TData>[]): Record<string, "left" | "right"> {
  const map: Record<string, "left" | "right"> = {}
  for (const col of columns) {
    if (col.lockPin && col.defaultPin) map[col.key] = col.defaultPin
  }
  return map
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useTableState<TData extends Record<string, unknown>>(
  data: TData[],
  columns: ColumnDef<TData>[],
  defaultSort?: { key: string; dir: SortDir },
  paginationOverride?: { page: number; pageSize: number },
) {
  // ── Sort ──────────────────────────────────────────────────────────────────
  const [sortRules, setSortRules] = React.useState<SortRule[]>(() => {
    if (defaultSort) {
      return [{ id: "sort-default", fieldKey: defaultSort.key, direction: defaultSort.dir }]
    }
    return []
  })

  const primarySort = sortRules[0] ?? null
  const sortKey: string = primarySort?.fieldKey ?? ""
  const sortDir: SortDir = primarySort?.direction ?? "asc"

  const addSortRule = React.useCallback((fieldKey: string) => {
    setSortRules(prev => {
      if (prev.some(r => r.fieldKey === fieldKey)) return prev
      return [...prev, { id: `sort-${Date.now()}`, fieldKey, direction: "asc" }]
    })
  }, [setSortRules])

  const removeSortRule = React.useCallback((id: string) => {
    setSortRules(prev => prev.filter(r => r.id !== id))
  }, [setSortRules])

  const toggleSortDir = React.useCallback((id: string) => {
    setSortRules(prev => prev.map(r =>
      r.id === id ? { ...r, direction: r.direction === "asc" ? "desc" : "asc" } : r
    ))
  }, [setSortRules])

  const handleSortByKey = React.useCallback((colKey: string) => {
    setSortRules(prev => {
      const idx = prev.findIndex(r => r.fieldKey === colKey)
      if (idx === 0) {
        return prev.map((r, i) => i === 0 ? { ...r, direction: r.direction === "asc" ? "desc" : "asc" } : r)
      }
      const filtered = prev.filter(r => r.fieldKey !== colKey)
      return [{ id: `sort-${Date.now()}`, fieldKey: colKey, direction: "asc" }, ...filtered]
    })
  }, [setSortRules])

  // ── Filters ───────────────────────────────────────────────────────────────
  const [search, setSearch] = React.useState("")
  const [searchOpen, setSearchOpen] = React.useState(false)
  const searchRef = React.useRef<HTMLInputElement>(null)
  const [activeFilters, setActiveFilters] = React.useState<ActiveFilter[]>([])
  const [filterConnectors, setFilterConnectors] = React.useState<Record<string, "and" | "or">>({})
  const [openFilterId, setOpenFilterId] = React.useState<string | null>(null)
  const [filterBarVisible, setFilterBarVisible] = React.useState(true)
  const [drawerExpandedFilters, setDrawerExpandedFilters] = React.useState<Set<string>>(new Set())

  const toggleConnector = React.useCallback((leftId: string) => {
    setFilterConnectors(prev => ({ ...prev, [leftId]: prev[leftId] === "or" ? "and" : "or" }))
  }, [setFilterConnectors])

  function getConnector(leftId: string): "and" | "or" {
    return filterConnectors[leftId] ?? "and"
  }

  const addFilter = React.useCallback((fieldKey: string, fromDrawer = false) => {
    const col = columns.find(c => c.key === fieldKey)
    if (!col?.filter) return
    const id = nextFilterId()
    const f = col.filter
    const firstOperator: FilterOperator = (() => {
      if (f.type === "select" || f.type === "date") {
        const pick = f.operators?.find(o => o === "is" || o === "is_not")
        return pick ?? "is"
      }
      return f.operators?.[0] ?? "contains"
    })()
    setActiveFilters(prev => [...prev, { id, fieldKey, operator: firstOperator, values: [] }])
    if (fromDrawer) {
      setDrawerExpandedFilters(new Set([id]))
    } else {
      setOpenFilterId(id)
      setFilterBarVisible(true)
    }
  }, [columns, setActiveFilters, setDrawerExpandedFilters, setOpenFilterId, setFilterBarVisible])

  const updateFilter = React.useCallback((id: string, patch: Partial<ActiveFilter>) => {
    setActiveFilters(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f))
  }, [setActiveFilters])

  const removeFilter = React.useCallback((id: string) => {
    // Use functional updates only — no stale-closure risk on activeFilters.
    setActiveFilters(prev => {
      const idx = prev.findIndex(f => f.id === id)
      const next = prev.filter(f => f.id !== id)
      setFilterConnectors(prevC => {
        const c = { ...prevC }
        if (idx > 0 && next.length > 0) {
          const leftId = prev[idx - 1].id
          c[leftId] = prevC[id] ?? prevC[leftId] ?? "and"
        }
        delete c[id]
        return c
      })
      return next
    })
    setOpenFilterId(prev => prev === id ? null : prev)
  }, [setActiveFilters, setFilterConnectors, setOpenFilterId])

  // ── Group by ──────────────────────────────────────────────────────────────
  const [groupBy, setGroupBy] = React.useState<string | null>(null)

  // ── Per-column quick-search ───────────────────────────────────────────────
  const [colMenuSearch, setColMenuSearch] = React.useState<Record<string, string>>({})

  // ── Selection ─────────────────────────────────────────────────────────────
  const [selected, setSelected] = React.useState<Set<string | number>>(new Set())

  // ── Column widths ─────────────────────────────────────────────────────────
  const [colWidths, setColWidths] = React.useState<Record<string, number>>(() => buildDefaultWidths(columns))
  const resizeRef = React.useRef<{ key: string; startX: number; startW: number } | null>(null)

  // ── Column order ──────────────────────────────────────────────────────────
  const [colOrder, setColOrder] = React.useState<string[]>(() => columns.map(c => c.key))

  // ── Column pins ───────────────────────────────────────────────────────────
  const [colPins, setColPins] = React.useState<Record<string, "left" | "right">>(() => buildDefaultPins(columns))
  const lockedPins = React.useMemo(() => buildLockedPins(columns), [columns])

  // ── Column wrap ───────────────────────────────────────────────────────────
  const [colWrap, setColWrap] = React.useState<Record<string, boolean>>({})

  // ── Drawer / display settings ─────────────────────────────────────────────
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [showGridlines, setShowGridlines] = React.useState(true)
  const [rowHeight, setRowHeight] = React.useState<RowHeight>("default")
  const [hiddenCols, setHiddenCols] = React.useState<Set<string>>(new Set())

  const toggleColVisibility = React.useCallback((key: string) => {
    setHiddenCols(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }, [setHiddenCols])

  const moveCol = React.useCallback((key: string, dir: "up" | "down") => {
    setColOrder(prev => {
      const lockedLeft = columns.filter(c => c.lockPin && c.defaultPin === "left").map(c => c.key)
      const lockedRight = columns.filter(c => c.lockPin && c.defaultPin === "right").map(c => c.key)
      const orderable = prev.filter(k => !lockedLeft.includes(k) && !lockedRight.includes(k))
      const idx = orderable.indexOf(key)
      if (dir === "up" && idx <= 0) return prev
      if (dir === "down" && idx >= orderable.length - 1) return prev
      const next = [...orderable]
      const swap = dir === "up" ? idx - 1 : idx + 1
      ;[next[idx], next[swap]] = [next[swap], next[idx]]
      return [...lockedLeft, ...next, ...lockedRight]
    })
  }, [columns, setColOrder])

  // ── Drag-to-reorder ───────────────────────────────────────────────────────
  const draggedKey = React.useRef<string | null>(null)
  const [dragOverKey, setDragOverKey] = React.useState<string | null>(null)

  // ── Scroll / overflow ─────────────────────────────────────────────────────
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = React.useState(false)
  const [scrollEnd, setScrollEnd] = React.useState(false)
  const [isOverflowing, setIsOverflowing] = React.useState(false)

  // ── Hovered row ───────────────────────────────────────────────────────────
  const [hoveredRow, setHoveredRow] = React.useState<string | number | null>(null)

  // ── Derived: filtered + sorted rows ──────────────────────────────────────
  const rows = React.useMemo(() => {
    let result = data.slice()

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(r =>
        Object.values(r).some(v => String(v ?? "").toLowerCase().includes(q))
      )
    }

    const activeWithValues = activeFilters.filter(f => f.values.length > 0)
    if (activeWithValues.length > 0) {
      const matchesFilter = (r: TData, filter: ActiveFilter) => {
        const col = columns.find(c => c.key === filter.fieldKey)
        if (!col?.filter) return true
        const rowVal = String(r[filter.fieldKey] ?? "")
        if (col.filter.type === "select") {
          return filter.operator === "is"
            ? filter.values.includes(rowVal)
            : !filter.values.includes(rowVal)
        }
        if (col.filter.type === "date") {
          const targetYmd = filter.values[0]
          if (!targetYmd) return true
          const rowYmd = parseRowDateToYmd(rowVal)
          const op = filter.operator === "is_not" ? "is_not" : "is"
          if (rowYmd === null) return op === "is_not"
          return op === "is" ? rowYmd === targetYmd : rowYmd !== targetYmd
        } else {
          const q = filter.values[0]?.toLowerCase() ?? ""
          if (!q) return true
          return filter.operator === "contains"
            ? rowVal.toLowerCase().includes(q)
            : !rowVal.toLowerCase().includes(q)
        }
      }
      result = result.filter(r => {
        let res = matchesFilter(r, activeWithValues[0])
        for (let i = 1; i < activeWithValues.length; i++) {
          const connector = getConnector(activeWithValues[i - 1].id)
          const match = matchesFilter(r, activeWithValues[i])
          res = connector === "and" ? res && match : res || match
        }
        return res
      })
    }

    // Column menu quick-search
    Object.entries(colMenuSearch).forEach(([key, q]) => {
      if (!q.trim()) return
      const lower = q.toLowerCase()
      result = result.filter(r => String(r[key] ?? "").toLowerCase().includes(lower))
    })

    // Sort
    if (sortRules.length > 0) {
      result.sort((a, b) => {
        for (const rule of sortRules) {
          const col = columns.find(c => c.key === rule.fieldKey)
          const sk = col?.sortKey ?? col?.key
          if (!sk) continue
          const aVal = a[sk as string]
          const bVal = b[sk as string]
          const cmp = compareUnknownSort(aVal, bVal)
          if (cmp !== 0) return rule.direction === "asc" ? cmp : -cmp
        }
        return 0
      })
    }

    return result
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, search, activeFilters, filterConnectors, colMenuSearch, sortRules, columns])

  // ── Paged rows (slice of rows when pagination is active) ─────────────────
  const pagedRows = React.useMemo(() => {
    if (!paginationOverride || paginationOverride.pageSize <= 0) return rows
    const { page, pageSize } = paginationOverride
    const safePage = Math.max(1, page)
    return rows.slice((safePage - 1) * pageSize, safePage * pageSize)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, paginationOverride?.page, paginationOverride?.pageSize])

  // ── Grouped rows ──────────────────────────────────────────────────────────
  const groupedRows = React.useMemo(() => {
    if (!groupBy) return [{ groupKey: null as string | null, groupLabel: null as string | null, rows }]
    const groups = new Map<string, TData[]>()
    rows.forEach(row => {
      const val = String(row[groupBy] ?? "—")
      if (!groups.has(val)) groups.set(val, [])
      groups.get(val)!.push(row)
    })
    return [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, groupRows]) => ({ groupKey: key, groupLabel: key, rows: groupRows }))
  }, [rows, groupBy])

  // ── Effective pins (respect overflow) ─────────────────────────────────────
  const LOCKED_KEYS = React.useMemo(() => new Set(Object.keys(lockedPins)), [lockedPins])

  // When the table fits within its container (not overflowing) there is no need
  // to sticky-pin any column — even locked ones.  Pins only activate once the
  // user has to scroll horizontally so the selection / action edges stay visible.
  const effectivePins = React.useMemo(() => {
    if (!isOverflowing) return {}
    const result: Record<string, "left" | "right"> = {}
    for (const [key, pin] of Object.entries(colPins)) {
      result[key] = pin
    }
    return result
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colPins, isOverflowing])

  // ── Display columns ───────────────────────────────────────────────────────
  const displayCols = React.useMemo(() => {
    const leftPinned  = colOrder.filter(k => colPins[k] === "left")
    const free        = colOrder.filter(k => !colPins[k])
    const rightPinned = colOrder.filter(k => colPins[k] === "right")
    return [...leftPinned, ...free, ...rightPinned]
      .map(k => columns.find(c => c.key === k))
      .filter((c): c is ColumnDef<TData> => !!c)
      .filter(c => !hiddenCols.has(c.key))
  }, [colOrder, colPins, hiddenCols, columns])

  // ── Column actions ────────────────────────────────────────────────────────
  function startResize(key: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const minW = columns.find(c => c.key === key)?.minWidth ?? 60
    const startW = colWidths[key] ?? (columns.find(c => c.key === key)?.width ?? 100)
    resizeRef.current = { key, startX: e.clientX, startW }
    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return
      const { key: k, startX, startW: sw } = resizeRef.current
      setColWidths(p => ({ ...p, [k]: Math.max(minW, sw + ev.clientX - startX) }))
    }
    const onUp = () => {
      resizeRef.current = null
      document.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseup", onUp)
    }
    document.addEventListener("mousemove", onMove)
    document.addEventListener("mouseup", onUp)
  }

  function handleDragStart(key: string, e: React.DragEvent<HTMLTableCellElement>) {
    draggedKey.current = key
    e.dataTransfer.effectAllowed = "move"
  }
  function handleDragOver(key: string, e: React.DragEvent<HTMLTableCellElement>) {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    if (draggedKey.current && draggedKey.current !== key) setDragOverKey(key)
  }
  function handleDrop(key: string) {
    if (!draggedKey.current || draggedKey.current === key) { setDragOverKey(null); return }
    const order = [...colOrder]
    const from  = order.indexOf(draggedKey.current)
    const to    = order.indexOf(key)
    order.splice(from, 1)
    order.splice(to, 0, draggedKey.current!)
    setColOrder(order)
    draggedKey.current = null
    setDragOverKey(null)
  }
  function handleDragEnd() { draggedKey.current = null; setDragOverKey(null) }

  function pinColumn(key: string, pin: "left" | "right") {
    setColPins(p => ({ ...p, [key]: pin }))
  }
  function unpinColumn(key: string) {
    if (lockedPins[key]) return
    setColPins(p => { const n = { ...p }; delete n[key]; return n })
  }
  function toggleWrap(key: string) {
    setColWrap(p => ({ ...p, [key]: !p[key] }))
  }

  // ── Scroll handlers ───────────────────────────────────────────────────────
  function checkOverflow() {
    const el = scrollRef.current
    if (!el) return
    setIsOverflowing(el.scrollWidth > el.clientWidth + 1)
  }
  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    setScrolled(el.scrollLeft > 1)
    setScrollEnd(el.scrollLeft >= el.scrollWidth - el.clientWidth - 1)
    setIsOverflowing(el.scrollWidth > el.clientWidth + 1)
  }

  // ── Selection helpers ─────────────────────────────────────────────────────
  function getRowId(row: TData, index: number, getIdFn?: (r: TData, i: number) => string | number): string | number {
    return getIdFn ? getIdFn(row, index) : (row.id as string | number ?? index)
  }

  const toggleRow = React.useCallback((id: string | number) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [setSelected])

  const toggleAll = React.useCallback((allRowIds: (string | number)[]) => {
    setSelected(prev => prev.size === allRowIds.length ? new Set() : new Set(allRowIds))
  }, [setSelected])

  // ── Sticky offset calculations ────────────────────────────────────────────
  function getStickyLeft(key: string): number {
    let offset = 0
    for (const col of displayCols) {
      if (effectivePins[col.key] !== "left") break
      if (col.key === key) return offset
      offset += colWidths[col.key] ?? col.width ?? 100
    }
    return 0
  }
  function getStickyRight(key: string): number {
    let offset = 0
    const rightCols = [...displayCols].filter(c => effectivePins[c.key] === "right").reverse()
    for (const col of rightCols) {
      if (col.key === key) return offset
      offset += colWidths[col.key] ?? col.width ?? 100
    }
    return 0
  }
  function stickyStyle(key: string, isHeader = false): React.CSSProperties {
    const pin = effectivePins[key]
    if (pin === "left")  return { position: "sticky", left:  getStickyLeft(key),  ...(isHeader ? { top: 0 } : {}) }
    if (pin === "right") return { position: "sticky", right: getStickyRight(key), ...(isHeader ? { top: 0 } : {}) }
    return isHeader ? { position: "sticky", top: 0 } : {}
  }

  const totalWidth = displayCols.reduce((s, c) => s + (colWidths[c.key] ?? c.width ?? 100), 0)

  return {
    // Sort
    sortRules, setSortRules,
    sortKey, sortDir,
    addSortRule, removeSortRule, toggleSortDir, handleSortByKey,
    // Filters
    search, setSearch,
    searchOpen, setSearchOpen,
    searchRef,
    activeFilters, setActiveFilters,
    filterConnectors, setFilterConnectors, toggleConnector, getConnector,
    openFilterId, setOpenFilterId,
    filterBarVisible, setFilterBarVisible,
    drawerExpandedFilters, setDrawerExpandedFilters,
    addFilter, updateFilter, removeFilter,
    // Group
    groupBy, setGroupBy,
    // Column quick-search
    colMenuSearch, setColMenuSearch,
    // Selection
    selected, setSelected, toggleRow, toggleAll, getRowId,
    // Column widths / order / pins / wrap
    colWidths, setColWidths, resizeRef, startResize,
    colOrder, setColOrder, moveCol,
    colPins, setColPins, lockedPins, LOCKED_KEYS,
    pinColumn, unpinColumn,
    colWrap, setColWrap, toggleWrap,
    // Drag-to-reorder
    draggedKey, dragOverKey,
    handleDragStart, handleDragOver, handleDrop, handleDragEnd,
    // Scroll
    scrollRef, scrolled, scrollEnd, isOverflowing,
    checkOverflow, handleScroll,
    // Hover
    hoveredRow, setHoveredRow,
    // Derived
    rows, pagedRows, groupedRows,
    effectivePins, displayCols,
    getStickyLeft, getStickyRight, stickyStyle,
    totalWidth,
    // Display settings
    sheetOpen, setSheetOpen,
    showGridlines, setShowGridlines,
    rowHeight, setRowHeight,
    hiddenCols, setHiddenCols, toggleColVisibility,
  }
}
