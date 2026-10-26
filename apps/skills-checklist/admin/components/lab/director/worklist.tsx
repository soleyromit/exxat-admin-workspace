"use client"

/**
 * The verification worklist table (DS DataTable): one row per graduating student, status first, then what stops the record or
 * what is left, required skills achieved with the gap mark, last verification, and Open. Dashboard A shows the ready rows
 * compactly; Dashboard C shows every row with selection and the bulk "Open for verification" for like rows.
 */
import * as React from "react"
import { useLabRouter } from "@/components/lab/lab-bar/lab-link"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import { PersonIdentityCell } from "@exxatdesignux/ui/components/data-views/person-identity-cell"
import type { ColumnDef } from "@exxatdesignux/ui/components/data-table/types"
import { bulkAlike, detailHref, shortDate, type ReadinessRow } from "@/lib/lab/director"
import type { LabScope } from "@/lib/lab/scope"
import { GapMark, LINK, StatusMark, initialsOf } from "@/components/lab/director/parts"

export type WorkRow = ReadinessRow & Record<string, unknown>

function columns(scope: LabScope, compact: boolean): ColumnDef<WorkRow>[] {
  const cols: ColumnDef<WorkRow>[] = [
    {
      key: "name",
      label: "Student",
      width: 200,
      sortable: true,
      cell: (r) => <PersonIdentityCell name={r.name} initials={initialsOf(r.name)} renderName={(n) => <Link className={LINK} href={detailHref(scope, r.id)}>{n}</Link>} />,
    },
    { key: "status", label: "Status", width: 212, sortable: true, cell: (r) => <StatusMark status={r.status} /> },
    {
      key: "next",
      label: "What stops it",
      width: 300,
      cell: (r) => (
        <span className="block truncate text-sm text-muted-foreground" title={r.next}>
          {r.next}
        </span>
      ),
    },
    { key: "achieved", label: "Required", width: 168, sortable: true, cell: (r) => <GapMark n={r.gaps.length} achieved={r.achieved} required={r.required} /> },
  ]
  if (compact) cols.splice(2, 1)
  cols.push({
      key: "verifiedAt",
      label: "Last verified",
      width: 132,
      sortable: true,
      cell: (r) => <span className="text-sm text-muted-foreground">{r.verifiedAt ? `Version ${r.version}, ${shortDate(r.verifiedAt)}` : "Never"}</span>,
    })
  if (!compact) cols.push({
    key: "open",
    label: "Open",
    width: 88,
    resizable: false,
    defaultPin: "right",
    header: () => <span className="sr-only">Open</span>,
    cell: (r) => (
      <Button asChild variant="ghost" size="sm">
        <Link href={detailHref(scope, r.id)} aria-label={`Open ${r.name}'s record`}>
          Open
        </Link>
      </Button>
    ),
  })
  return cols
}

export function WorklistTable({ rows, scope, compact = false, selectable = false, empty }: { rows: ReadinessRow[]; scope: LabScope; compact?: boolean; selectable?: boolean; empty: string }) {
  const cols = React.useMemo(() => {
    const c = columns(scope, compact)
    return selectable ? [{ key: "select", label: "Select", width: 44, resizable: false } as ColumnDef<WorkRow>, ...c] : c
  }, [scope, compact, selectable])
  return (
    <DataTable<WorkRow>
      data={rows as WorkRow[]}
      columns={cols}
      getRowId={(r) => r.id}
      getRowSelectionLabel={(r) => r.name}
      selectable={selectable}
      searchable={false}
      showQueryControls={false}
      edgeInset={false}
      bulkActionsSlot={selectable ? (selected) => <BulkOpen rows={rows} selected={selected} scope={scope} /> : undefined}
      emptyState={<p className="p-4 text-sm text-muted-foreground">{empty}</p>}
    />
  )
}

function BulkOpen({ rows, selected, scope }: { rows: ReadinessRow[]; selected: Set<string | number>; scope: LabScope }) {
  const router = useLabRouter()
  const chosen = rows.filter((r) => selected.has(r.id))
  const check = bulkAlike(chosen)
  if (!check.alike) return <span className="text-sm text-muted-foreground">{check.reason}</span>
  return (
    <Button type="button" variant="default" size="sm" onClick={() => router.push(detailHref(scope, chosen[0].id, { queue: chosen.map((r) => r.id).join(",") }))}>
      {`Open ${chosen.length} for verification`}
    </Button>
  )
}
