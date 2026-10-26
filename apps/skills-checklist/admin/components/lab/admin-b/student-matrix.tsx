"use client"

/**
 * Students by sections heat matrix (dashboard-concepts D "matrix explorer", recommended Attainment view; REQ RP-02, RP-05,
 * RP-06). Rows are students in scope, furthest behind first (the dashboard order). Columns are sections with a required skill,
 * lowest share achieved first. A cell prints "achieved/required" for that student and section; its fill only groups (brand
 * tint ramp), the printed numbers carry the value. Clicking a cell opens the evidence peek with exactly that many records.
 *
 * 123 rows: 25 per page through the DS PaginationBar; the name column stays pinned while sections scroll.
 * DS Table primitives: the DS has no matrix DataTable (ds-usage-map section 4, documented cross-tab composition).
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@exxatdesignux/ui/components/ui/table"
import { PaginationBar } from "@exxatdesignux/ui/components/data-table/pagination"
import type { AttainmentModel, PeekRef } from "@/lib/lab/attainment"
import { VIZ } from "@/components/lab/viz"
import { BehindMark } from "@/components/lab/admin-b/state-viz"
import { graduationStageOf } from "@/lib/v2/population"

const PAGE_SIZES = [25, 50, 100]

/** Fill bins by share achieved: none, some, most, all. */
function fillOf(achieved: number, total: number): string {
  if (achieved === 0) return VIZ.seq[0]
  if (achieved === total) return VIZ.seq[3]
  return achieved / total >= 0.5 ? VIZ.seq[2] : VIZ.seq[1]
}

export const MATRIX_BINS = [
  { label: "None achieved", fill: VIZ.seq[0] },
  { label: "Under half", fill: VIZ.seq[1] },
  { label: "Half or more", fill: VIZ.seq[2] },
  { label: "All achieved", fill: VIZ.seq[3] },
]

export function StudentMatrix({ model, peekHref, behindLabel, activePeek }: { model: AttainmentModel; peekHref: (r: PeekRef) => string; behindLabel: string; activePeek: PeekRef | null }) {
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(PAGE_SIZES[0])
  const rows = model.students.slice((page - 1) * pageSize, page * pageSize)
  React.useEffect(() => setPage(1), [model])
  const cohortSize = React.useMemo(() => {
    const m = new Map<string, number>()
    for (const s of model.students) m.set(s.cohort, (m.get(s.cohort) ?? 0) + 1)
    return m
  }, [model])
  // Students per missing band (complete / one short / short / far, D-X11) over every row, not just this page: under "Required to
  // graduate" these equal the director's readiness figures (checked by tests/lab/consistency.mjs).
  const bands = React.useMemo(() => {
    const c = { complete: 0, "one-short": 0, short: 0, far: 0 }
    for (const s of model.students) c[graduationStageOf(s.total - s.counts.achieved)]++
    return `${c.complete}/${c["one-short"]}/${c.short}/${c.far}`
  }, [model])
  return (
    <div className="flex flex-col gap-0" data-matrix data-required-basis={model.basis} data-missing-bands={bands}>
      <Table scrollLabel="Students by section" className="border-separate border-spacing-0">
        <TableHeader>
          <TableRow>
            <TableHead scope="col" className="sticky left-0 z-20 min-w-56 bg-background align-bottom">Student</TableHead>
            <TableHead scope="col" className="min-w-24 align-bottom text-right">Achieved</TableHead>
            {model.sections.map((s) => (
              <TableHead key={s} scope="col" className="h-auto min-w-[5.25rem] max-w-[5.25rem] px-1 pb-2 align-bottom text-center">
                <span className="line-clamp-3 block whitespace-normal text-xs font-medium leading-tight text-muted-foreground [hyphens:auto] [overflow-wrap:break-word]" lang="en" title={s}>{s.replace(/\//g, " / ")}</span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, i) => (
            <React.Fragment key={r.id}>
            {i === 0 || rows[i - 1].cohort !== r.cohort ? (
              <TableRow data-cohort-row={r.cohort} className="hover:bg-transparent">
                <TableHead scope="colgroup" colSpan={2} className="sticky left-0 z-10 h-8 bg-background pt-3 text-xs font-medium text-muted-foreground">
                  {`${r.cohort} · ${cohortSize.get(r.cohort) ?? 0} students`}
                </TableHead>
                <TableCell colSpan={model.sections.length} className="h-8" />
              </TableRow>
            ) : null}
            <TableRow data-student-row={r.id}>
              <TableHead scope="row" className="sticky left-0 z-10 bg-background font-normal">
                <span className="flex min-w-0 items-center justify-between gap-3">
                  <span className="flex min-w-0 flex-col">
                    <Link href={peekHref({ kind: "student", id: r.id })} scroll={false} className="truncate text-sm font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{r.name}</Link>
                    <span className="truncate text-xs text-muted-foreground">{r.group ? `${r.cohort}, ${r.group}` : r.cohort}</span>
                  </span>
                  {r.behind ? <BehindMark label={behindLabel} /> : null}
                </span>
              </TableHead>
              <TableCell className="text-right">
                <Link href={peekHref({ kind: "student", id: r.id })} scroll={false} aria-label={`${r.name}: ${r.counts.achieved} of ${r.total} required achieved. Open the evidence`} className="rounded-sm text-sm tabular-nums text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {`${r.counts.achieved} of ${r.total}`}
                </Link>
              </TableCell>
              {model.sections.map((s) => {
                const c = r.cells[s]
                if (!c) return <TableCell key={s} className="p-0.5 text-center"><span className="sr-only">{`${s}: not required`}</span></TableCell>
                const open = activePeek?.kind === "cell" && activePeek.id === r.id && activePeek.section === s
                return (
                  <TableCell key={s} className="p-0.5 text-center">
                    <Link
                      href={peekHref({ kind: "cell", id: r.id, section: s })}
                      scroll={false}
                      aria-label={`${c.achieved}/${c.total} achieved, ${r.name}, ${s}. Open the evidence`}
                      aria-current={open ? "true" : undefined}
                      data-cell={`${c.achieved}/${c.total}`}
                      className={`flex h-8 items-center justify-center rounded-sm text-xs tabular-nums outline-none transition-[filter] hover:brightness-95 focus-visible:ring-2 focus-visible:ring-ring ${c.achieved === 0 ? "text-muted-foreground" : "font-medium text-foreground"}`}
                      style={{ background: fillOf(c.achieved, c.total), boxShadow: open ? `inset 0 0 0 2px ${VIZ.zero}` : `inset 0 0 0 1px ${VIZ.grid}` }}
                    >
                      {`${c.achieved}/${c.total}`}
                    </Link>
                  </TableCell>
                )
              })}
            </TableRow>
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
      <PaginationBar page={page} pageSize={pageSize} total={model.students.length} pageSizeOptions={PAGE_SIZES} onPageChange={setPage} onPageSizeChange={(n) => { setPageSize(n); setPage(1) }} />
    </div>
  )
}
