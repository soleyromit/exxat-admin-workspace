"use client"
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@exxatdesignux/ui/components/ui/table"
import { STATE_META, type VizState } from "./tokens"

export type HeatColumn = { id: string; label: string; sublabel?: string }
export type HeatRow = { id: string; label: string; sublabel?: string; cells: Record<string, VizState | undefined>
  /** Short text shown beside the glyph in a cell, for example "2/3". Keyed by column id. */
  cellText?: Record<string, string | undefined>
}

export type HeatGridProps = {
  /** Accessible name for the scroll region and table. */
  caption: string
  rowHeader: string
  columns: HeatColumn[]
  rows: HeatRow[]
  /** Rows sortable by number of Met cells. Default true. Starts lagging first (ascending). */
  sortable?: boolean
  /** Show the state word beside the glyph in each cell. Default false (glyph only, word in the accessible name). */
  showWords?: boolean
  /** Makes each cell a focusable button. */
  onCellSelect?: (rowId: string, columnId: string, state: VizState) => void
  /** Show the state key above the grid. Default true. */
  showKey?: boolean
  className?: string
}

const ORDER: VizState[] = ["met", "notMet", "notYet", "pending", "none"]

function Glyph({ state, size = "text-sm" }: { state: VizState; size?: string }) {
  const m = STATE_META[state]
  return <i className={`${m.icon} ${size}`} style={{ color: m.fg }} aria-hidden="true" />
}

export function HeatGridKey({ states = ORDER }: { states?: VizState[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm" aria-label="Key">
      {states.map((s) => (
        <li key={s} className="flex items-center gap-2">
          <span
            className="inline-flex h-6 min-w-6 items-center justify-center rounded-sm border border-border"
            style={{ background: STATE_META[s].fill, borderStyle: STATE_META[s].dashed ? "dashed" : "solid" }}
          >
            <Glyph state={s} />
          </span>
          <span className="text-foreground">{STATE_META[s].word}</span>
        </li>
      ))}
    </ul>
  )
}

export function HeatGrid({ caption, rowHeader, columns, rows, sortable = true, showWords = false, onCellSelect, showKey = true, className }: HeatGridProps) {
  const [dir, setDir] = React.useState<"asc" | "desc" | null>(sortable ? "asc" : null)
  const metCount = (r: HeatRow) => columns.filter((c) => r.cells[c.id] === "met").length
  const sorted = React.useMemo(() => {
    if (!dir) return rows
    return [...rows].sort((a, b) => (dir === "asc" ? metCount(a) - metCount(b) : metCount(b) - metCount(a)) || a.label.localeCompare(b.label))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, columns, dir])
  const ariaSort = dir === "asc" ? "ascending" : dir === "desc" ? "descending" : undefined

  return (
    <div className={`flex flex-col gap-3 ${className ?? ""}`} data-viz="heat-grid">
      {showKey ? <HeatGridKey /> : null}
      <p className="text-xs text-muted-foreground md:hidden" data-scroll-hint>
        <i className="fa-light fa-arrows-left-right mr-1" aria-hidden="true" />
        Scroll sideways for {columns.length === 1 ? "the column" : `all ${columns.length} columns`}.
      </p>
      <Table scrollLabel={caption} containerClassName="max-h-[70vh]">
        <TableHeader className="sticky top-0 z-20 bg-background">
          <TableRow>
            <TableHead scope="col" aria-sort={ariaSort} className="sticky left-0 z-30 min-w-36 bg-background">
              {sortable ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="-ml-2 gap-1.5 font-medium"
                  onClick={() => setDir((d) => (d === "asc" ? "desc" : "asc"))}
                >
                  {rowHeader}
                  <span className="text-xs font-normal text-muted-foreground">{dir === "desc" ? "most met first" : "fewest met first"}</span>
                  <i className={`fa-light ${dir === "desc" ? "fa-arrow-down" : "fa-arrow-up"} text-xs`} aria-hidden="true" />
                </Button>
              ) : (
                rowHeader
              )}
            </TableHead>
            {columns.map((c) => (
              <TableHead key={c.id} scope="col" className="min-w-24 whitespace-normal align-bottom">
                <span className="block text-foreground">{c.label}</span>
                {c.sublabel ? <span className="block text-xs font-normal text-muted-foreground">{c.sublabel}</span> : null}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((r) => (
            <TableRow key={r.id} data-heat-row={r.id}>
              <TableHead scope="row" className="sticky left-0 z-10 bg-background font-medium">
                <span className="block text-foreground">{r.label}</span>
                {r.sublabel ? <span className="block text-xs font-normal text-muted-foreground">{r.sublabel}</span> : null}
              </TableHead>
              {columns.map((c) => {
                const st: VizState = r.cells[c.id] ?? "none"
                const m = STATE_META[st]
                const text = r.cellText?.[c.id]
                const name = `${r.label}, ${c.label}: ${m.word}${text ? `, ${text}` : ""}`
                const inner = (
                  <>
                    <Glyph state={st} />
                    {showWords ? <span className="text-xs" style={{ color: m.fg }}>{m.word}</span> : <span className="sr-only">{m.word}</span>}
                    {text ? <span className="text-xs tabular-nums text-foreground" aria-hidden="true">{text}</span> : null}
                  </>
                )
                return (
                  <TableCell
                    key={c.id}
                    data-cell-state={st}
                    className="p-1 text-center"
                    style={{ background: m.fill, outline: m.dashed ? "1px dashed var(--border-control-35)" : undefined, outlineOffset: -3 }}
                  >
                    {onCellSelect ? (
                      <Button type="button" variant="ghost" size="xs" aria-label={name} className="min-h-6 min-w-6 gap-1.5 px-1" onClick={() => onCellSelect(r.id, c.id, st)}>
                        {inner}
                      </Button>
                    ) : (
                      <span role="img" aria-label={name} className="inline-flex min-h-6 min-w-6 items-center justify-center gap-1.5">
                        {inner}
                      </span>
                    )}
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
