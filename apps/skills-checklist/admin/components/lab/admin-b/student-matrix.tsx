"use client"

/**
 * Students by sections heat matrix (dashboard-concepts D "matrix explorer", recommended Attainment view; REQ RP-02, RP-05,
 * RP-06). Rows are students in scope, furthest behind first (the dashboard order). Columns are sections with a required skill,
 * lowest share achieved first. A cell prints "achieved/required" for that student and section; its fill only groups (neutral
 * attention ramp, amber for none achieved), the printed numbers carry the value. A blank cell is "not required". Clicking a cell opens the evidence peek with exactly that many records.
 *
 * 123 rows: 25 per page through the DS PaginationBar; the name column stays pinned while sections scroll.
 * DS Table primitives: the DS has no matrix DataTable (ds-usage-map section 4, documented cross-tab composition).
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@exxatdesignux/ui/components/ui/table"
import { PaginationBar } from "@exxatdesignux/ui/components/data-table/pagination"
import type { AttainmentModel, PeekRef } from "@/lib/lab/attainment"
import { DiamondGlyph, VIZ } from "@/components/lab/viz"
import { BehindMark } from "@/components/lab/admin-b/state-viz"
import { graduationStageOf } from "@/lib/v2/population"

const PAGE_SIZES = [25, 50, 100]
/** Pinned columns: fixed widths so their sticky offsets line up. Student fits the longest name on one line or wraps at a space. */
const COL = { student: "13rem", pace: "7.5rem", achieved: "5.5rem" }
const PIN = "sticky bg-background"

/**
 * Fill bins by share achieved (2026-10-30 review: the brand-rose tints made "Half or more" and "All achieved" look alike and
 * gave no anchor for the worst area; then the amber "none" tier made 40% of cells shout, coordinator 2026-10-30). Neutral steps
 * only, darkest where least is achieved: none, under half, half or more, all (white). No amber and no brand hue on cells; the
 * printed "achieved/required" carries the detail. Amber stays at the student level: the Pace "Behind" mark and a thin amber
 * rule on a behind student's row (one highlight rule).
 */
type Bin = { label: string; fill: string; ink: string; edge: string }
const BINS: Bin[] = [
  { label: "None achieved", fill: "var(--border-control)", ink: "var(--foreground)", edge: "var(--border-control)" },
  { label: "Under half", fill: "var(--border)", ink: "var(--foreground)", edge: VIZ.grid },
  { label: "Half or more", fill: "var(--status-badge-neutral-fill)", ink: "var(--foreground)", edge: VIZ.grid },
  { label: "All achieved", fill: "var(--background)", ink: "var(--muted-foreground)", edge: VIZ.grid },
]
function binOf(achieved: number, total: number): Bin {
  if (achieved === 0) return BINS[0]
  if (achieved === total) return BINS[3]
  return achieved / total >= 0.5 ? BINS[2] : BINS[1]
}

/** Legend order follows the ramp, worst first. Each swatch also draws its cell edge. */
export const MATRIX_BINS = BINS.map((b) => ({ label: b.label, fill: b.fill, edge: b.edge }))
/** What a blank cell means: the student has no required skill in that section under the chosen set. */
export const BLANK_CELL_LABEL = "Blank: not required"

/** The matrix legend: the four tiers, the blank cell, and the behind mark, in one row. */
export function MatrixLegend({ behindLabel, blankLabel = BLANK_CELL_LABEL, className = "" }: { behindLabel: string; blankLabel?: string; className?: string }) {
  return (
    <ul className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground ${className}`} aria-label="Legend" data-matrix-legend>
      {MATRIX_BINS.map((b) => (
        <li key={b.label} className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded-sm" style={{ background: b.fill, boxShadow: `inset 0 0 0 1px ${b.edge}` }} aria-hidden="true" />
          {b.label}
        </li>
      ))}
      <li className="flex items-center gap-1.5">
        <span className="inline-block size-3 rounded-sm border border-dashed border-border" aria-hidden="true" />
        {blankLabel}
      </li>
      <li className="flex items-center gap-1.5"><DiamondGlyph size={10} />{behindLabel}</li>
    </ul>
  )
}

export function StudentMatrix({ model, peekHref, behindLabel, activePeek, legend }: { model: AttainmentModel; peekHref: (r: PeekRef) => string; behindLabel: string; activePeek: PeekRef | null; /** Legend text for the behind mark: draws the legend under the table (admin Reports). */ legend?: string }) {
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
  // Scroll cue: the right-edge fade shows only while sections are hidden to the right (anatomy A10, Romit 2026-10-30).
  const wrap = React.useRef<HTMLDivElement>(null)
  const [moreRight, setMoreRight] = React.useState(false)
  React.useEffect(() => {
    const box = wrap.current?.querySelector<HTMLElement>("[data-slot=table-container]")
    if (!box) return
    const update = () => setMoreRight(box.scrollLeft + box.clientWidth < box.scrollWidth - 2)
    update()
    box.addEventListener("scroll", update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(box)
    return () => { box.removeEventListener("scroll", update); ro.disconnect() }
  }, [model, rows.length])
  return (
    <div className="flex flex-col gap-0" data-matrix data-required-basis={model.basis} data-missing-bands={bands}>
      {/* Design (rework 2026-10-30): Student, Pace and Achieved stay pinned on the left; the sections scroll sideways at a
          readable width with a fade on the right edge while more are hidden. Headers wrap only at spaces, never inside a word,
          and each section column is at least as wide as its longest word; names are never abbreviated. Angled headers were
          rejected: the DS Table has no rotated header, and rotated text is harder to read and to hit. */}
      <div ref={wrap} className="relative">
      <Table scrollLabel="Students by section" className="border-separate border-spacing-0">
        <TableHeader>
          <TableRow>
            <TableHead scope="col" className={`${PIN} left-0 z-20 align-bottom`} style={{ width: COL.student, minWidth: COL.student }}>Student</TableHead>
            <TableHead scope="col" className={`${PIN} z-20 align-bottom`} style={{ left: COL.student, width: COL.pace, minWidth: COL.pace }}>Pace</TableHead>
            <TableHead scope="col" className={`${PIN} z-20 border-r border-border align-bottom text-right`} style={{ left: `calc(${COL.student} + ${COL.pace})`, width: COL.achieved, minWidth: COL.achieved }}>Achieved</TableHead>
            {model.sections.map((s) => {
              // "Emotional / Cognitive": the slash stays with the word before it (no-break space), so it never sits alone on a line.
              const label = s.replace(/\s*\/\s*/g, "\u00a0/ ")
              const longest = Math.max(...label.split(" ").map((w) => w.length))
              return (
                <TableHead key={s} scope="col" className="h-auto px-2 pb-2 align-bottom text-center" style={{ minWidth: `calc(${Math.max(longest, 4)}ch + 1rem)` }}>
                  <span className="block whitespace-normal text-xs font-medium leading-tight text-muted-foreground [hyphens:none] [overflow-wrap:normal] [word-break:normal]">{label}</span>
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, i) => (
            <React.Fragment key={r.id}>
            {i === 0 || rows[i - 1].cohort !== r.cohort ? (
              <TableRow data-cohort-row={r.cohort} className="hover:bg-transparent">
                <TableHead scope="colgroup" colSpan={3} className={`${PIN} left-0 z-10 h-8 border-r border-border pt-3 text-xs font-medium text-muted-foreground`}>
                  {`${r.cohort} · ${cohortSize.get(r.cohort) ?? 0} students`}
                </TableHead>
                <TableCell colSpan={model.sections.length} className="h-8" />
              </TableRow>
            ) : null}
            <TableRow data-student-row={r.id}>
              <TableHead scope="row" className={`${PIN} left-0 z-10 font-normal`} style={{ width: COL.student, minWidth: COL.student, boxShadow: r.behind ? `inset 3px 0 0 ${VIZ.behind}` : undefined }} data-behind-rule={r.behind || undefined}>
                <span className="flex flex-col">
                  <Link href={peekHref({ kind: "student", id: r.id })} scroll={false} className="whitespace-normal text-sm font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{r.name}</Link>
                  {/* The cohort is the group header above; the row names only its group. */}
                  {r.group ? <span className="text-xs text-muted-foreground">{r.group}</span> : null}
                </span>
              </TableHead>
              <TableCell className={`${PIN} z-10`} style={{ left: COL.student, width: COL.pace, minWidth: COL.pace }}>
                {r.behind ? <BehindMark label={behindLabel} /> : <span className="sr-only">On pace</span>}
              </TableCell>
              <TableCell className={`${PIN} z-10 border-r border-border text-right`} style={{ left: `calc(${COL.student} + ${COL.pace})`, width: COL.achieved, minWidth: COL.achieved }}>
                <Link href={peekHref({ kind: "student", id: r.id })} scroll={false} aria-label={`${r.name}: ${r.counts.achieved} of ${r.total} required achieved. Open the evidence`} className="rounded-sm text-sm tabular-nums text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {`${r.counts.achieved} of ${r.total}`}
                </Link>
              </TableCell>
              {model.sections.map((s) => {
                const c = r.cells[s]
                if (!c) return <TableCell key={s} className="p-0.5 text-center" data-cell="none"><span className="sr-only">{`${s}: not required`}</span></TableCell>
                const open = activePeek?.kind === "cell" && activePeek.id === r.id && activePeek.section === s
                const bin = binOf(c.achieved, c.total)
                return (
                  <TableCell key={s} className="p-0.5 text-center">
                    <Link
                      href={peekHref({ kind: "cell", id: r.id, section: s })}
                      scroll={false}
                      aria-label={`${c.achieved}/${c.total} achieved, ${r.name}, ${s}. Open the evidence`}
                      aria-current={open ? "true" : undefined}
                      data-cell={`${c.achieved}/${c.total}`}
                      data-bin={bin.label}
                      className={`flex h-8 items-center justify-center rounded-sm text-xs tabular-nums outline-none transition-[filter] hover:brightness-95 focus-visible:ring-2 focus-visible:ring-ring ${c.achieved === c.total ? "" : "font-medium"}`}
                      style={{ background: bin.fill, color: bin.ink, boxShadow: open ? `inset 0 0 0 2px ${VIZ.zero}` : `inset 0 0 0 1px ${bin.edge}` }}
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
      {moreRight ? <span role="presentation" data-edge-fade className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[var(--background)] to-transparent" /> : null}
      </div>
      {legend ? <MatrixLegend behindLabel={legend} className="pt-3" /> : null}
      <PaginationBar page={page} pageSize={pageSize} total={model.students.length} pageSizeOptions={PAGE_SIZES} onPageChange={setPage} onPageSizeChange={(n) => { setPageSize(n); setPage(1) }} />
    </div>
  )
}
