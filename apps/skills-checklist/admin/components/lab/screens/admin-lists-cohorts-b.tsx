"use client"

/**
 * Lists and cohort assignment B (alternative): group first. One grid of student groups by lists: check a cell to attach a list to a
 * group, the way an announcement is checked off for the cohorts it applies to [CALL]. The last row is the next new cohort, which gets
 * the default list automatically. Each cell also says how many in the group meet that list's rule; the rule itself is edited in A.
 * "Create a group" builds a custom group from rules (category, enrollment year, graduation year) with a live count [CALL 10-26]; it
 * joins this grid and the scope bar's Group filter. How such a group maps to offerings is an open question (quiet Badge, not a decision).
 * Regions: header, toolbar, grid, one-line legend. Demo states: ?state=loading | empty | error.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Tip } from "@exxatdesignux/ui/components/ui/tip"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import type { ColumnDef } from "@exxatdesignux/ui/components/data-table/types"
import { countNoun, listsHref, type SkillList, type StudentGroup } from "@/lib/lab/lists"
import { ListsFrame, type ListsContext } from "@/components/lab/admin-a/lists-frame"
import { CheckboxCell, GROUP_KIND_LABEL, ListStatus } from "@/components/lab/admin-a/lists-parts"
import { LINK, fmt, plural } from "@/components/lab/admin-a/parts"

export function AdminListsCohortsB() {
  return <ListsFrame variant="B">{(c) => <GroupFirst c={c} />}</ListsFrame>
}

interface Row extends Record<string, unknown> {
  id: string
  group: StudentGroup | null
}

const NEXT = "__next"

function GroupFirst({ c }: { c: ListsContext }) {
  const { model } = c
  const rows: Row[] = [...model.groups.map((g) => ({ id: g.id, group: g })), { id: NEXT, group: null }]
  const columns = React.useMemo<ColumnDef<Row>[]>(() => {
    const cols: ColumnDef<Row>[] = [
      {
        key: "group",
        label: "Student group",
        width: 210,
        defaultPin: "left",
        cell: (r) =>
          r.group ? (
            <span className="flex flex-col py-0.5">
              <span className="font-medium">{r.group.label}</span>
              <span className="text-xs text-muted-foreground">{`${GROUP_KIND_LABEL[r.group.kind]} · ${plural(r.group.studentIds.length, "student", "students")}`}</span>
            </span>
          ) : (
            <span className="flex flex-col py-0.5">
              <span className="font-medium">Next new cohort</span>
              <span className="text-xs text-muted-foreground">Gets the default list</span>
            </span>
          ),
      },
    ]
    for (const l of model.lists) cols.push(listColumn(l, c))
    return cols
  }, [model, c])
  return (
    <>
      <div className="flex flex-wrap items-center gap-2" data-region="toolbar">
        <h2 className="text-base font-semibold text-foreground">Student groups</h2>
        <span className="text-sm text-muted-foreground">Cohorts, tracks and groups you define by rules</span>
        <span className="ms-auto flex items-center gap-2">
          <Tip label="How a group that spans enrollment years maps to course offerings is still being decided. Lists can be assigned to it now.">
            <span tabIndex={0} className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Badge variant="outline">Open question</Badge>
            </span>
          </Tip>
          <Button type="button" variant="outline" size="sm" onClick={c.actions.openGroup}>Create a group</Button>
        </span>
      </div>
      <div data-region="grid">
        <DataTable<Row>
          data={rows}
          columns={columns}
          getRowId={(r) => r.id}
          searchable={false}
          showQueryControls={false}
          edgeInset={false}
          emptyState={<p className="p-4 text-sm text-muted-foreground">No student groups yet.</p>}
        />
      </div>
      <p className="text-xs text-muted-foreground" data-region="legend"><span data-standards-pointer>Standards are managed in Program details.</span> Check a box to attach a list; you confirm before a group changes lists.</p>
    </>
  )
}

function listColumn(l: SkillList, c: ListsContext): ColumnDef<Row> {
  const { model, actions } = c
  return {
    key: `l:${l.id}`,
    label: l.name,
    width: 284,
    header: () => (
      <span className="flex min-w-0 flex-col gap-0.5 py-1 leading-tight">
        <span className="flex items-center gap-1.5">
          <Link className={`${LINK} truncate text-xs`} href={listsHref({ list: l.id })}>{l.name}</Link>
          {l.isDefault ? <Badge variant="secondary">Default</Badge> : null}
        </span>
        <span className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
          {countNoun(l, l.skillIds.length)}
          <ListStatus list={l} />
        </span>
      </span>
    ),
    cell: (r) => {
      if (!r.group) return l.isDefault ? <span className="text-sm">Added automatically</span> : <span className="text-sm text-muted-foreground" aria-label="Not added">None</span>
      const uses = l.groupIds.includes(r.group.id)
      const s = uses ? model.standing(l, r.group.id) : null
      return (
        <span className="flex items-center gap-3">
          <CheckboxCell checked={uses} label={`${r.group.label} uses ${l.name}`} onChange={(on) => actions.toggle(l.id, r.group!.id, on)} />
          {s ? (
            <Link className={`${LINK} text-sm tabular-nums`} href={listsHref({ list: l.id })} aria-label={`${s.meeting} of ${s.students} in ${r.group.label} meet the ${l.name} rule. Open the rule`}>
              {`${fmt(s.meeting)} of ${fmt(s.students)} meet it`}
            </Link>
          ) : null}
        </span>
      )
    },
  }
}
