"use client"

/**
 * Sections x scope matrix (strategy/06 section 5.2). Rows are skill categories, worst shortfall first. One column for the
 * scope by default; Split by adds one column per cohort or group (subgroups under 5 hidden and named). Each cell is a link
 * (it navigates, so it is not a Button) whose name says the section, the column, the share counted and its basis; it opens the students of that cell.
 *
 * Encoding (docs/knowledge/design/visual-language.md): the cell fill is a calm brand-tint ramp for the share counted (the
 * printed value carries the number; the ramp only groups). A cell 8 or more points under its basis carries a triangle; only
 * the 3 largest gaps also get the amber outline (strategy/07 B3, Von Restorff). Never red, never colour alone.
 * DS Table primitives: the DS has no matrix DataTable (ds-usage-map section 4, documented cross-tab composition).
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@exxatdesignux/ui/components/ui/table"
import { drillHref, plural, type SectionMatrix } from "@/lib/lab/dashboard"
import type { Basis, LabScope } from "@/lib/lab/scope"
import { skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { SEQ_BINS, VIZ, seqIndex } from "@/components/lab/viz"

const OUTLINED = 3

export function SectionMatrixTable({ matrix, scope, basis }: { matrix: SectionMatrix; scope: LabScope; basis: Basis }) {
  const basisWord = basis === "expected" ? "expected now" : basis === "median" ? "scope median" : "all required"
  // The 3 largest gaps on the page get the outline; every short cell keeps its triangle.
  const worst = new Set(
    matrix.rows
      .flatMap((r) => r.cells.filter((c) => c.short > 0).map((c) => ({ key: `${r.section}|${c.colId}`, short: c.short })))
      .sort((a, b) => b.short - a.short)
      .slice(0, OUTLINED)
      .map((x) => x.key),
  )
  return (
    <div className="flex flex-col gap-3">
      <Table scrollLabel="Sections by scope">
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Section</TableHead>
            {matrix.columns.map((c) => (
              <TableHead key={c.id} scope="col" className="text-center">{c.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {matrix.rows.map((r) => (
            <TableRow key={r.section}>
              <TableHead scope="row" className="font-normal">
                <span className="block text-sm text-foreground">{r.section}</span>
                <span className="block text-xs text-muted-foreground">{plural(r.skills, `required ${skillNoun()}`, `required ${skillNounPlural()}`)}</span>
              </TableHead>
              {r.cells.map((cell) => {
                const col = matrix.columns.find((c) => c.id === cell.colId)!
                if (cell.pct === null) {
                  return (
                    <TableCell key={cell.colId} className="text-center text-xs text-muted-foreground">
                      Not required
                    </TableCell>
                  )
                }
                const short = cell.short > 0
                const outlined = worst.has(`${r.section}|${cell.colId}`)
                const cellScope: LabScope = { ...scope, cat: r.section, ...(col.cohort ? { cohort: col.cohort, group: col.group ?? "" } : {}) }
                const name = `${r.section}, ${col.label.replace(/ \(\d+\)$/, "")}: ${cell.pct}% of required evaluations counted, ${cell.expected}% ${basisWord}${short ? `, ${cell.short} points short` : ""}. Open the ${cell.n} students`
                return (
                  <TableCell key={cell.colId} className="p-1 text-center">
                    <Link
                      href={drillHref(cellScope, { list: "students", from: "matrix" })}
                      aria-label={name}
                      data-cell-short={short ? "1" : undefined}
                      data-cell-outlined={outlined ? "1" : undefined}
                      className="flex min-w-[7rem] items-center justify-between gap-2 rounded-md px-3 py-2 outline-none transition-[filter] hover:brightness-95 focus-visible:ring-2 focus-visible:ring-ring"
                      style={{ background: VIZ.seq[seqIndex(cell.pct)], boxShadow: outlined ? `inset 0 0 0 2px ${VIZ.behind}` : `inset 0 0 0 1px ${VIZ.grid}` }}
                    >
                      <span className="flex items-center gap-1 text-sm font-semibold tabular-nums text-foreground">
                        {short ? <i className="fa-solid fa-triangle-exclamation text-xs" style={{ color: VIZ.behindInk }} aria-hidden="true" /> : null}
                        {`${cell.pct}%`}
                      </span>
                      <span className="text-xs tabular-nums text-muted-foreground">{basis === "all" ? "of 100%" : `${cell.expected}% ${basis === "expected" ? "expected" : "median"}`}</span>
                    </Link>
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Legend">
        <li>Share counted</li>
        {SEQ_BINS.map((b, i) => (
          <li key={b.min} className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded-sm" style={{ background: VIZ.seq[i], boxShadow: `inset 0 0 0 1px ${VIZ.grid}` }} aria-hidden="true" />
            {b.label}
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <i className="fa-solid fa-triangle-exclamation" style={{ color: VIZ.behindInk }} aria-hidden="true" />
          8 or more points under
        </li>
        <li className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded-sm" style={{ boxShadow: `inset 0 0 0 2px ${VIZ.behind}` }} aria-hidden="true" />
          {`The ${OUTLINED} largest gaps`}
        </li>
      </ul>
      {matrix.hidden.length > 0 ? <p className="text-xs text-muted-foreground" data-hidden-subgroups>{`${plural(matrix.hidden.length, "group", "groups")} under 5 students hidden: ${matrix.hidden.map((h) => `${h.label} (${h.n})`).join(", ")}.`}</p> : null}
    </div>
  )
}
