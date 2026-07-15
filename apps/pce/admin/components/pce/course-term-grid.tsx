'use client'

/**
 * VARIATION B of the course × term heatmap — the tinted DataTable.
 *
 * Variation A is `ChartHeatmap` (the DS OS ECharts component). This is the shape every real
 * analytics product actually ships for a matrix like this: Mixpanel retention, Google Analytics
 * cohort exploration and Zoho CRM all render their "heatmap" as a TABLE with conditionally
 * tinted cells, not as a chart canvas. Built so the two can be compared side by side rather
 * than argued about.
 *
 * WHY IT MIGHT WIN. Every defect fought on variation A is a symptom of the canvas, and none of
 * them exist here:
 *   - row labels can never be "dropped for lack of space" — they are table cells
 *   - height needs no prop and no dataZoom; the table scrolls like a table, header sticky
 *   - no `aria-label`-on-a-div problem: a table IS the accessible artefact, so no parallel
 *     sr-only ChartDataTable has to be maintained beside it
 *   - the Leo chip cannot cover a value, because there is no pixel overlay
 *   - values are real text: selectable, copyable, and exportable without a second code path
 *   - columns sort; a canvas cannot
 *
 * WHY IT MIGHT LOSE. A canvas draws the SHAPE faster: squares of equal size read as a field,
 * and the eye finds the pale band without reading. A table row is taller than it is dense, so
 * fewer terms fit on screen and the gestalt is weaker. Cell tint in a table also has to fight
 * the row's own zebra/hover background.
 *
 * COLOUR IS DELIBERATELY IDENTICAL to variation A — same `heatmapCellColor`, same domain, same
 * `heatmapCellUsesLightText` for the label. If the palettes differed, the comparison would be
 * about hue instead of about layout, which is the actual question.
 *
 * NOT built on `getConditionalCellBackground`. The DS conditional-rule engine is categorical —
 * its operators are `is | is_not | contains | not_contains` and `RULE_COLORS` is a named palette
 * (green/yellow/…), which is right for "status = Live → green" and wrong for a continuous 3→5
 * ramp. Expressing a ramp there would mean one rule per discrete score. The DS scale lib is the
 * correct shared primitive, and it is what both variations call.
 */

import * as React from 'react'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import { heatmapCellColor, heatmapCellUsesLightText, readChartToken } from '@/lib/chart-heatmap-scale'
import { shortTerm } from '@/lib/pce-analytics'

export interface CourseTermGridRow {
  /** Row id — the course code. */
  courseCode: string
  courseName: string
  /** One key per term (the FULL term string), value = course-content score or null. */
  [term: string]: string | number | null
}

const fmt2 = (v: number) => v.toFixed(2)

export function CourseTermGrid({
  courses,
  terms,
  cells,
  domain,
}: {
  /** Course codes, already ordered worst → best by the caller. */
  courses: string[]
  /** Full term strings, chronological. */
  terms: string[]
  cells: { courseCode: string; term: string; courseAvg: number; courseName: string }[]
  domain: readonly [number, number]
}) {
  /* Resolve the ramp ends once per paint rather than per cell — `readChartToken` walks the
     cascade, and 15 x 5 cells would do it 75 times for two values that never differ. */
  const [brand, card] = React.useMemo(
    () => [readChartToken('--brand-color', '#4f46e5'), readChartToken('--card', '#ffffff')],
    [],
  )

  const byKey = React.useMemo(() => {
    const m = new Map<string, number>()
    cells.forEach((c) => m.set(`${c.courseCode}::${c.term}`, c.courseAvg))
    return m
  }, [cells])

  const nameByCode = React.useMemo(() => {
    const m = new Map<string, string>()
    cells.forEach((c) => m.set(c.courseCode, c.courseName))
    return m
  }, [cells])

  const rows = React.useMemo<CourseTermGridRow[]>(
    () =>
      courses.map((code) => {
        const row: CourseTermGridRow = {
          courseCode: code,
          courseName: nameByCode.get(code) ?? '',
        }
        terms.forEach((t) => {
          row[t] = byKey.get(`${code}::${t}`) ?? null
        })
        return row
      }),
    [courses, terms, byKey, nameByCode],
  )

  const columns = React.useMemo<ColumnDef<CourseTermGridRow>[]>(() => {
    const [lo, hi] = domain
    const courseCol: ColumnDef<CourseTermGridRow> = {
      key: 'courseCode',
      label: 'Course',
      width: 200,
      sortable: true,
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{row.courseCode}</p>
          <p className="truncate text-xs text-muted-foreground">{row.courseName}</p>
        </div>
      ),
    }
    const termCols: ColumnDef<CourseTermGridRow>[] = terms.map((t) => ({
      key: t,
      label: shortTerm(t),
      width: 96,
      sortable: true,
      cell: (row) => {
        const v = row[t]
        // A term the course did not run is BLANK, not zero — the same rule variation A follows.
        // An em dash would read as a value; empty ground reads as absence.
        if (typeof v !== 'number') return <span className="sr-only">Not evaluated</span>
        const norm = v - lo
        const span = hi - lo
        const light = heatmapCellUsesLightText(norm, span)
        const tint: React.CSSProperties = {
          backgroundColor: heatmapCellColor(norm, span, brand, card),
          color: light ? 'var(--primary-foreground)' : 'var(--foreground)',
        }
        const label = `${row.courseCode} ${shortTerm(t)}: ${fmt2(v)} out of 5`

        /* A plain cell, not a control. The first pass made every scored cell a raw HTML button so
           it could open the survey. Three things wrong with that: raw HTML buttons are banned in
           apps (DS Button with an explicit variant is the rule, and a DS Button would fight a
           tinted background); the handler was never wired, so the branch was dead; and variation
           A's cells are not doors either — a door here would make the two variations differ on
           something other than layout, which is the only thing this A/B exists to measure.

           If the cell should become a door, it becomes one in BOTH variations, on DS Button. */
        return (
          <div
            className="flex h-9 w-full items-center justify-center rounded-md text-sm font-semibold tabular-nums"
            style={tint}
            aria-label={label}
          >
            {fmt2(v)}
          </div>
        )
      },
    }))
    return [courseCol, ...termCols]
  }, [terms, domain, brand, card])

  return (
    <DataTable<CourseTermGridRow>
      data={rows}
      columns={columns}
      getRowId={(row) => row.courseCode}
      /* "No results match your filters" — DataTable's default — would be a lie here: nothing was
         filtered, the program simply has no evaluated offering yet. That is a real state (a
         program in its first term) and an accreditation-relevant one, so it says what is
         actually true and why the grid is empty. */
      emptyState={
        <div className="flex flex-col items-center gap-1 py-8 text-center">
          <i className="fa-light fa-table-cells text-2xl text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium">No course has been evaluated yet</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            This grid fills in as evaluations are released. Until a term closes with responses
            above the anonymity threshold, there is nothing to score.
          </p>
        </div>
      }
      /* Explicit opt-out (DS-022). This grid is a FIGURE inside a ChartCard, not a hub: the card
         already owns the variant toggle and the Leo insight, and a second toolbar strip inside a
         chart would be a control bar for a chart nobody manages. The card is the chrome.
         `() => null`, not `null` — the prop is a render function taking table state, so the
         audit's own suggested opt-out (`toolbarSlot={null}`) does not typecheck. */
      toolbarSlot={() => null}
    />
  )
}
