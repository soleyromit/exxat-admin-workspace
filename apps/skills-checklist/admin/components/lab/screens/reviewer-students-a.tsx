"use client"

/**
 * Reviewer Students A, table. One DS DataTable of every student in scope (123 at the default scope), needs-attention first, with
 * PersonIdentityCell names that open the reviewer student record, required achieved, status as glyph + word, and the one row
 * action (Review the oldest waiting submission, or Open record). Question: is one sortable table with an attention filter the
 * fastest way to find who needs the reviewer?
 *
 * Density (strategy/07 list budget, 6 controls): one toolbar row holds the search and the attention filter. The filter narrows
 * one table, so it is a single-choice segmented control with its counts (one decision), not tabs over separate panels. Course,
 * group and the other filters sit in the scope bar's Filters popover. The filters overlap on purpose: Behind and On track match
 * the dashboard, so a behind student with a submission waiting is in both Waiting for you and Behind.
 */
import * as React from "react"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import { PersonIdentityCell } from "@exxatdesignux/ui/components/data-views/person-identity-cell"
import type { ColumnDef } from "@exxatdesignux/ui/components/data-table/types"
import { ViewSegmentedControl } from "@exxatdesignux/ui/components/ui/view-segmented-control"
import { initialsOf } from "@/components/lab/reviewer/parts"
import { EmptyBlock } from "@/components/lab/empty-block"
import { RowAction, StatusCell, StudentLink, StudentsFrame, needsYou, type StudentsContext } from "@/components/lab/rbac/students-frame"
import type { ReviewerStudentRow } from "@/lib/lab/reviewer"

type Filter = "all" | "you" | "behind" | "none"
const isFilter = (v: string | null): v is Filter => v === "all" || v === "you" || v === "behind" || v === "none"
const filterOf = (ctx: StudentsContext): Filter => {
  const raw = ctx.param("show")
  return isFilter(raw) ? raw : "all"
}

export function ReviewerStudentsA() {
  return <StudentsFrame variant="A" toolbar={(ctx) => <AttentionFilter ctx={ctx} />}>{(ctx) => <StudentsTable ctx={ctx} />}</StudentsFrame>
}

function AttentionFilter({ ctx }: { ctx: StudentsContext }) {
  const m = ctx.model
  const options: Array<{ value: Filter; label: string }> = [
    { value: "all", label: `All ${m.rows.length}` },
    { value: "you", label: `Waiting for you ${m.waitingStudents}` },
    { value: "behind", label: `Behind ${m.behind}` },
    { value: "none", label: `On track ${m.onTrack}` },
  ]
  return <ViewSegmentedControl<Filter> aria-label="Show students" value={filterOf(ctx)} onValueChange={(v) => ctx.setParams({ show: v === "all" ? null : v })} options={options} />
}

function StudentsTable({ ctx }: { ctx: StudentsContext }) {
  const filter = filterOf(ctx)
  const keep = (r: ReviewerStudentRow) => filter === "all" || (filter === "you" ? needsYou(r.attention) : filter === "behind" ? r.behind : !r.behind)
  const rows = ctx.students.filter(keep)
  const columns = React.useMemo<ColumnDef<ReviewerStudentRow>[]>(
    () => [
      { key: "name", label: "Student", width: 200, sortable: true, cell: (r) => <PersonIdentityCell name={r.name} initials={initialsOf(r.name)} renderName={() => <StudentLink ctx={ctx} row={r} />} /> },
      { key: "cohort", label: "Cohort", width: 110, sortable: true, cell: (r) => <span className="text-sm">{r.cohort}</span> },
      { key: "achieved", label: "Required achieved", width: 140, sortable: true, cell: (r) => <span className="text-sm tabular-nums">{`${r.achieved} of ${r.required}`}</span> },
      { key: "attention", label: "Status", width: 230, cell: (r) => <StatusCell row={r} /> },
      { key: "next", label: "Detail", width: 250, cell: (r) => <span className="truncate text-sm text-muted-foreground">{r.next}</span> },
      { key: "actions", label: "Action", width: 132, resizable: false, defaultPin: "right", lockPin: true, header: () => <span className="sr-only">Action</span>, cell: (r) => <RowAction ctx={ctx} row={r} /> },
    ],
    [ctx],
  )
  return (
    <div data-region="table">
      <DataTable<ReviewerStudentRow>
        data={rows}
        columns={columns}
        getRowId={(r) => r.id}
        searchable={false}
        showQueryControls={false}
        edgeInset={false}
        lazyLoading={{ enabled: rows.length > 60 }}
        emptyState={<EmptyBlock compact title="No student in this view" />}
      />
    </div>
  )
}
