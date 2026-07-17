'use client'

/**
 * The designed detail view for large-N dialogs — the anti-wall.
 *
 * The naive expand was "the card's chart, but taller": at 34 faculty that is 34 stacked
 * panels in a one-column scroll, which is exactly the wall the card was built to avoid,
 * relocated into a dialog. This explorer replaces it (decided with Romit, 2026-07-15):
 *
 *   rail (ranked, searchable)  ↔  ONE large shared-axis chart  ↔  paginated deep-dive table
 *
 * One selection state drives all three: pick a person in the rail or a row in the table and
 * their line goes solid + labelled on the chart; everyone else stays ghost context. Density
 * is handled by interaction, not by scroll length.
 *
 * The chart itself is injected (`renderChart`) so the explorer stays entity-agnostic —
 * faculty scores today, response rates beside it, course slopes on By Term tomorrow. It owns
 * only the selection, search and sort mechanics.
 */

import * as React from 'react'
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@exxatdesignux/ui'
/* DS-023: NEW files import DataTable primitives from the package, never the vendored copy
   (the vendored path in analytics-panels.tsx predates the rule). */
import { DataTablePaginated } from '@exxatdesignux/ui'
import type { ColumnDef } from '@exxatdesignux/ui'

export interface ExplorerEntity {
  id: string
  label: string
  /** Formatted headline value shown in the rail ("3.51", "54%"). */
  value: string
  /** Numeric value the sort runs on. */
  sortValue: number
  /** Direction of travel, when known. Renders as the rail's ▲/▼/— glyph. */
  trend?: 'up' | 'down' | 'flat' | null
}

type SortKey = 'worst' | 'best' | 'name'

export function EntityTrendExplorer({
  entities,
  renderChart,
  table,
  entityNoun = 'entries',
}: {
  /** Ranked entities. `sortValue` ascending = worst; the rail defaults to worst-first. */
  entities: ExplorerEntity[]
  /** The large shared-axis chart. `selected` = entity label to highlight, null = default movers. */
  renderChart: (selected: string | null) => React.ReactNode
  /** Deep-dive rows. `entityOfRow` maps a row back to an entity label for click-to-highlight. */
  table: {
    headers: string[]
    rows: (string | number)[][]
    entityOfRow?: (row: (string | number)[]) => string
  }
  entityNoun?: string
}) {
  const [query, setQuery] = React.useState('')
  const [sort, setSort] = React.useState<SortKey>('worst')
  const [selected, setSelected] = React.useState<string | null>(null)
  const railRef = React.useRef<HTMLDivElement>(null)

  /* Arrow-key navigation — a radiogroup navigates with arrows, not Tab-through
     (state-review 2026-07-15; same contract as ViewSegmentedControl). */
  const onRailKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    const radios = [...(railRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]') ?? [])]
    if (!radios.length) return
    const idx = radios.findIndex((r) => r === document.activeElement)
    let next = -1
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = Math.min(idx + 1, radios.length - 1)
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = Math.max(idx - 1, 0)
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = radios.length - 1
    else return
    e.preventDefault()
    radios[next]?.focus()
  }, [])

  const railEntities = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q ? entities.filter((e) => e.label.toLowerCase().includes(q)) : entities
    const sorted = [...filtered]
    if (sort === 'worst') sorted.sort((a, b) => a.sortValue - b.sortValue)
    if (sort === 'best') sorted.sort((a, b) => b.sortValue - a.sortValue)
    if (sort === 'name') sorted.sort((a, b) => a.label.localeCompare(b.label))
    return sorted
  }, [entities, query, sort])

  /* The deep-dive table, built generically from headers. Row click selects the row's entity —
     same state the rail writes, so the chart can never disagree with either. */
  const tableData = React.useMemo(
    () =>
      table.rows.map((r, i) => {
        const rec: Record<string, unknown> = { __id: String(i) }
        table.headers.forEach((h, j) => (rec[h] = r[j]))
        rec.__entity = table.entityOfRow ? table.entityOfRow(r) : String(r[0])
        return rec
      }),
    [table],
  )
  const tableColumns = React.useMemo<ColumnDef<Record<string, unknown>>[]>(
    () => table.headers.map((h) => ({ key: h, label: h })),
    [table.headers],
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${entityNoun}…`}
          aria-label={`Search ${entityNoun}`}
          className="max-w-56"
        />
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="w-40" aria-label="Sort rail">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="worst">Worst first</SelectItem>
            <SelectItem value="best">Best first</SelectItem>
            <SelectItem value="name">By name</SelectItem>
          </SelectContent>
        </Select>
        {selected ? (
          <Button variant="link" size="sm" onClick={() => setSelected(null)}>
            Clear highlight — {selected}
          </Button>
        ) : (
          <span className="text-sm text-muted-foreground">
            {entities.length} {entityNoun} — select one to trace their line
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[220px_1fr]">
        {/* The rail. A radiogroup — one choice, one highlighted line. */}
        <div
          ref={railRef}
          role="radiogroup"
          aria-label={`Ranked ${entityNoun}`}
          tabIndex={0}
          onKeyDown={onRailKeyDown}
          className="max-h-[380px] overflow-y-auto rounded-md border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {railEntities.map((e, i) => {
            const active = selected === e.label
            return (
              <Button
                key={e.id}
                variant="ghost"
                size="sm"
                role="radio"
                aria-checked={active}
                onClick={() => setSelected(active ? null : e.label)}
                className={`h-auto w-full justify-start gap-2 rounded-none border-b border-border px-2.5 py-1.5 font-normal last:border-b-0 ${
                  active ? 'bg-muted font-medium' : ''
                }`}
              >
                <span className="w-6 shrink-0 text-left text-xs tabular-nums text-muted-foreground">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-left">{e.label}</span>
                <span className="shrink-0 font-mono text-xs tabular-nums">{e.value}</span>
                <span className="w-3 shrink-0 text-xs text-muted-foreground" aria-hidden="true">
                  {e.trend === 'down' ? '▼' : e.trend === 'up' ? '▲' : e.trend === 'flat' ? '—' : ''}
                </span>
              </Button>
            )
          })}
          {!railEntities.length && (
            <p className="px-3 py-4 text-sm text-muted-foreground">No {entityNoun} match “{query}”.</p>
          )}
        </div>

        <div className="min-w-0">{renderChart(selected)}</div>
      </div>

      <DataTablePaginated<Record<string, unknown>>
        data={tableData}
        columns={tableColumns}
        pagination={{ pageSize: 10 }}
        getRowId={(row) => String(row.__id)}
        searchable={false}
        toolbarSlot={() => null}
        onRowClick={(row) => setSelected(String(row.__entity))}
        emptyState={
          <p className="py-6 text-center text-sm text-muted-foreground">
            No {entityNoun} to list yet.
          </p>
        }
      />
    </div>
  )
}
