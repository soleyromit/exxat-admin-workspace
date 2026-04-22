"use client"

/**
 * DataTablePaginated<TData> — DataTable with a bottom pagination bar
 *
 * Adds:
 *   • "Rows per page" selector
 *   • First / Previous / Next / Last page buttons
 *   • "{from}–{to} of {total}" status span (role="status" aria-live="polite")
 *   • Keyboard: Left/Right arrow keys on the pagination bar change page
 *
 * Everything else (columns, pinning, resize, DnD, sort, filters, group,
 * selection) is identical to DataTable — they share useTableState.
 *
 * Props: DataTableProps<TData> & { pagination?: PaginationConfig }
 */

import * as React from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tip } from "@/components/ui/tip"
import { TooltipProvider } from "@/components/ui/tooltip"
import { DataTable, type DataTableExtendedProps } from "./index"
import type { PaginationConfig } from "./types"
import type { useTableState } from "./use-table-state"

// ─────────────────────────────────────────────────────────────────────────────
// PaginationBar
// ─────────────────────────────────────────────────────────────────────────────

interface PaginationBarProps {
  page: number
  pageSize: number
  total: number
  pageSizeOptions: number[]
  onPageChange: (p: number) => void
  onPageSizeChange: (n: number) => void
}

export function PaginationBar({
  page,
  pageSize,
  total,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
}: PaginationBarProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = Math.min((page - 1) * pageSize + 1, total)
  const to   = Math.min(page * pageSize, total)

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowLeft" && page > 1) {
      e.preventDefault()
      onPageChange(page - 1)
    } else if (e.key === "ArrowRight" && page < totalPages) {
      e.preventDefault()
      onPageChange(page + 1)
    }
  }

  return (
    <div
      className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-background text-sm select-none"
      onKeyDown={handleKeyDown}
    >
      {/* Rows per page */}
      <div className="flex items-center gap-2 text-muted-foreground">
        <span>Rows per page</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Rows per page"
              className="inline-flex items-center gap-1 px-2 py-1 rounded border border-input bg-background hover:bg-interactive-hover text-foreground text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {pageSize}
              <i className="fa-light fa-chevron-down text-xs" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-20">
            {pageSizeOptions.map(n => (
              <DropdownMenuItem key={n} onClick={() => onPageSizeChange(n)}>
                {n}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Nav */}
      <div className="flex items-center gap-3">
        <span
          role="status"
          aria-live="polite"
          className="text-muted-foreground tabular-nums"
        >
          {total === 0 ? "0 results" : `${from}–${to} of ${total}`}
        </span>
        <TooltipProvider>
          <div className="flex items-center gap-1">
            <Tip label="First page" side="top">
              <button
                type="button"
                aria-label="First page"
                disabled={page === 1}
                onClick={() => onPageChange(1)}
                className="inline-flex items-center justify-center size-7 rounded hover:bg-interactive-hover disabled:opacity-40 disabled:pointer-events-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <i className="fa-light fa-chevrons-left text-xs" aria-hidden="true" />
              </button>
            </Tip>
            <Tip label="Previous page" side="top">
              <button
                type="button"
                aria-label="Previous page"
                disabled={page === 1}
                onClick={() => onPageChange(page - 1)}
                className="inline-flex items-center justify-center size-7 rounded hover:bg-interactive-hover disabled:opacity-40 disabled:pointer-events-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <i className="fa-light fa-chevron-left text-xs" aria-hidden="true" />
              </button>
            </Tip>
            <span className="px-2 text-muted-foreground tabular-nums">
              {page} / {totalPages}
            </span>
            <Tip label="Next page" side="top">
              <button
                type="button"
                aria-label="Next page"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
                className="inline-flex items-center justify-center size-7 rounded hover:bg-interactive-hover disabled:opacity-40 disabled:pointer-events-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <i className="fa-light fa-chevron-right text-xs" aria-hidden="true" />
              </button>
            </Tip>
            <Tip label="Last page" side="top">
              <button
                type="button"
                aria-label="Last page"
                disabled={page >= totalPages}
                onClick={() => onPageChange(totalPages)}
                className="inline-flex items-center justify-center size-7 rounded hover:bg-interactive-hover disabled:opacity-40 disabled:pointer-events-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <i className="fa-light fa-chevrons-right text-xs" aria-hidden="true" />
              </button>
            </Tip>
          </div>
        </TooltipProvider>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DataTablePaginated<TData>
// ─────────────────────────────────────────────────────────────────────────────

export interface DataTablePaginatedProps<TData extends Record<string, unknown>>
  extends DataTableExtendedProps<TData> {
  pagination?: PaginationConfig
}

export function DataTablePaginated<TData extends Record<string, unknown>>({
  data,
  columns,
  pagination,
  defaultSort,
  ...rest
}: DataTablePaginatedProps<TData>) {
  const config = {
    pageSize: pagination?.pageSize ?? 10,
    pageSizeOptions: pagination?.pageSizeOptions ?? [10, 25, 50, 100],
  }

  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(config.pageSize)

  // filteredCount: total rows after filters (driven by inner table state via CountSyncer)
  const [filteredCount, setFilteredCount] = React.useState(data.length)

  const totalPages = Math.max(1, Math.ceil(filteredCount / pageSize))
  const safePage   = Math.min(page, totalPages)

  function handlePageSizeChange(n: number) {
    setPageSize(n)
    setPage(1)
  }

  // Wrap toolbarSlot to intercept state.rows.length (a number — no circular ref)
  const originalToolbarSlot = rest.toolbarSlot
  const toolbarSlot = React.useCallback(
    (state: ReturnType<typeof useTableState<TData>>) => (
      <>
        <CountSyncer count={state.rows.length} onSync={setFilteredCount} onReset={() => setPage(1)} />
        {originalToolbarSlot ? originalToolbarSlot(state) : null}
      </>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [originalToolbarSlot],
  )

  return (
    <div className="flex flex-col gap-0">
      <DataTable
        {...rest}
        data={data}
        columns={columns}
        defaultSort={defaultSort}
        toolbarSlot={toolbarSlot}
        paginationOverride={{ page: safePage, pageSize }}
        hasFooter
      />
      <div className="mx-4 lg:mx-6 border-x border-b border-border rounded-b-lg overflow-hidden">
        <PaginationBar
          page={safePage}
          pageSize={pageSize}
          total={filteredCount}
          pageSizeOptions={config.pageSizeOptions}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CountSyncer — syncs filtered row count (a number) to parent without loops.
// Syncing a primitive avoids the circular-reference issue of syncing an array.
// ─────────────────────────────────────────────────────────────────────────────

export function CountSyncer({
  count,
  onSync,
  onReset,
}: {
  count: number
  onSync: (n: number) => void
  onReset: () => void
}) {
  const prevCount = React.useRef(count)
  React.useLayoutEffect(() => {
    if (prevCount.current !== count) {
      prevCount.current = count
      onSync(count)
      onReset()
    }
  }, [count, onSync, onReset])
  return null
}
