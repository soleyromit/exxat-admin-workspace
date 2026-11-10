"use client"

/**
 * The Skill lists table (designer 2026-11-05, D-L106): Name with a Default tag on one, Skills with any inactive count under it, Assigned to as tags, and a row menu of Rename, Change skills and Delete where allowed. A row click opens the
 * panel. No Status column and no action in a cell. At phone width: Name, Skills and the menu, with Assigned to under the name.
 */
import * as React from "react"
import { StatusBadge } from "@exxatdesignux/ui"
import { plural } from "@/lib/v2/format"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Tip } from "@exxatdesignux/ui/components/ui/tip"
import { useIsMobile } from "@exxatdesignux/ui/hooks/use-mobile"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import type { ColumnDef } from "@exxatdesignux/ui/components/data-table/types"
import { useDsTableToolbar } from "@/components/lab/shared/ds-table-toolbar"
import { RowMenu, type RowMenuEntry } from "@/components/lab/shared/row-menu"
import { assignedToText, listCanEdit, listHasAssignment, listSizeParts, skillLists, type SkillList } from "@/lib/lab/lists"
import { capitalize, skillListsNoun, skillNounPlural } from "@/lib/lab/terms"
import type { ListsContext } from "./lists-frame"
import { fmt, useTextCut } from "./parts"

interface Row extends Record<string, unknown> {
  id: string
  list: SkillList
  name: string
  size: number
  assigned: string
}

/**
 * Rename, New version where someone is on the list (one on no one is edited in place), Delete where nobody is and it is not the default [INFER: a program always has one once it has chosen one].
 * The same menu on the row and in the panel.
 */
export function ListRowMenu({ list, onRename, onNewVersion, onDelete }: { list: SkillList; onRename: (id: string) => void; onNewVersion: (id: string) => void; onDelete: (list: SkillList) => void }) {
  const entries: RowMenuEntry[] = [
    { slot: "edit", label: "Rename", icon: "fa-pen", onSelect: () => onRename(list.id) },
    ...(listHasAssignment(list) ? [{ slot: "lifecycle" as const, label: `Change ${skillNounPlural()}`, icon: "fa-pen", onSelect: () => onNewVersion(list.id) }] : []),
    ...(listCanEdit(list) && !list.isDefault ? [{ slot: "delete" as const, label: "Delete", icon: "fa-trash", onSelect: () => onDelete(list) }] : []),
  ]
  return <RowMenu label={`Actions for ${list.name}`} entries={entries} />
}

/** The list's name, opening its panel. Cut off, it gives the whole name on hover or focus (the button already takes focus). */
function ListNameLink({ name, id, onOpen }: { name: string; id: string; onOpen: (id: string) => void }) {
  const { ref, cut } = useTextCut<HTMLSpanElement>(name)
  return (
    <Tip label={name} disabled={!cut} triggerClassName="min-w-0 max-w-full">
      <Button type="button" variant="link" size="sm" className="h-auto min-w-0 max-w-full justify-start p-0 text-left text-sm font-medium text-foreground no-underline underline-offset-2 hover:underline" onClick={(e) => { e.stopPropagation(); onOpen(id) }} data-list-link={id}>
        <span ref={ref} className="truncate">{name}</span>
      </Button>
    </Tip>
  )
}

/** Who has this list, as tags: at most two groups named, then how many more. Not assigned is amber, the one row that still wants something done. */
function AssignedTo({ list, groups }: { list: SkillList; groups: ListsContext["model"]["groups"] }) {
  if (!listHasAssignment(list)) return <StatusBadge label="Not assigned" tone="warning" icon="fa-circle-exclamation" size="sm" surface="table" data-not-assigned-tag />
  const labelOf = (id: string) => groups.find((g) => g.id === id)?.label ?? id
  const shown = list.groupIds.slice(0, 2)
  const more = list.groupIds.length - shown.length
  const named = list.studentIds?.length ?? 0
  const extra = [more ? `+ ${more} more ${more === 1 ? "group" : "groups"}` : "", named ? `+ ${plural(named, "student", "students")}` : ""].filter(Boolean).join(" ")
  const tags = (
    <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
      {shown.map((id) => <StatusBadge key={id} label={labelOf(id)} tone="neutral" icon="fa-users" size="sm" surface="table" />)}
      {!shown.length && named ? <StatusBadge label={plural(named, "student", "students")} tone="neutral" icon="fa-user" size="sm" surface="table" /> : null}
      {extra && shown.length ? <span className="text-sm text-muted-foreground" data-assigned-extra>{extra}</span> : null}
    </span>
  )
  // Only a cell that holds back a name has more to say; on hover or focus it gives the whole of it.
  if (list.groupIds.length <= 2) return tags
  return (
    <Tip label={assignedToText(list, groups)}>
      <span tabIndex={0} className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" data-assigned-more>{tags}</span>
    </Tip>
  )
}

export function GroupsActionTable({ c }: { c: ListsContext }) {
  const { model, actions } = c
  const nounPl = skillNounPlural()
  const isMobile = useIsMobile()
  const rows: Row[] = skillLists(model.lists).map((l) => ({ id: l.id, list: l, name: l.name, size: l.skillIds.length, assigned: assignedToText(l, model.groups), fAssigned: listHasAssignment(l) ? "yes" : "no" }))
  const columns = React.useMemo<ColumnDef<Row>[]>(() => {
    const name: ColumnDef<Row> = {
      key: "name",
      label: "Name",
      width: isMobile ? 216 : 320,
      sortable: true,
      cell: (r) => (
        <span className="flex min-w-0 flex-col items-start gap-1 py-0.5">
          <span className="flex min-w-0 max-w-full flex-wrap items-center gap-x-2 gap-y-1">
            <i className="fa-light fa-list-check w-4 shrink-0 text-center text-sm text-muted-foreground" aria-hidden="true" />
            <ListNameLink name={r.name} id={r.id} onOpen={actions.openList} />
            {r.list.isDefault ? <span className="shrink-0"><StatusBadge label="Default" tone="info" icon="fa-star" size="sm" surface="table" /></span> : null}
          </span>
          {isMobile ? <AssignedTo list={r.list} groups={model.groups} /> : null}
        </span>
      ),
    }
    const size: ColumnDef<Row> = {
      key: "size",
      label: capitalize(nounPl),
      width: isMobile ? 76 : 120,
      sortable: true,
      filter: { type: "range", icon: "fa-hashtag", dataBounds: true, rangeStep: 1 },
      cell: (r) => {
        const { inactive } = listSizeParts(model.state, r.list)
        return inactive ? (
          <span className="flex flex-col tabular-nums">
            <span>{fmt(r.size)}</span>
            <span className="text-xs text-muted-foreground">{`${inactive} inactive`}</span>
          </span>
        ) : <span className="tabular-nums">{fmt(r.size)}</span>
      },
    }
    const menu: ColumnDef<Row> = {
      key: "actions",
      label: "",
      width: 48,
      minWidth: 48,
      defaultPin: "right",
      lockPin: true,
      cell: (r) => (
        // The menu is portalled, but its presses still bubble through here: they must not read as a click on the row.
        <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <ListRowMenu list={r.list} onRename={actions.openRename} onNewVersion={actions.makeVersion} onDelete={actions.openDelete} />
        </div>
      ),
    }
    // Filter-only: whether the list reaches anyone, the one question the Assigned to text cannot answer as a pick.
    const reach: ColumnDef<Row> = { key: "fAssigned", label: "Assignment", filterOnly: true, filter: { type: "select", icon: "fa-users", operators: ["is", "is_not"], options: [{ value: "yes", label: "Assigned" }, { value: "no", label: "Not assigned" }] } }
    if (isMobile) return [name, size, menu, reach]
    return [name, size, { key: "assigned", label: "Assigned to", width: 430, sortable: true, filter: { type: "text", icon: "fa-users" }, cell: (r) => <AssignedTo list={r.list} groups={model.groups} /> }, menu, reach]
  }, [nounPl, model.groups, model.state, actions, isMobile])

  const { toolbarSlot, conditionalRules } = useDsTableToolbar<Row>(columns, capitalize(skillListsNoun()))
  return (
    <div data-region="lists">
      <DataTable<Row>
        key={isMobile ? "phone" : "wide"}
        data={rows}
        columns={columns}
        getRowId={(r) => r.id}
        onRowClick={(r) => actions.openList(r.id)}
        openRowId={actions.openId}
        searchable
        showQueryControls
        toolbarSlot={toolbarSlot}
        conditionalRules={conditionalRules}
        // No bulk action on this page: selection would only offer the table's default bar, and a row menu press landing on the row would raise it.
        selectable={false}
        edgeInset={false}
        emptyState={<p className="p-4 text-sm text-muted-foreground">{`No ${skillListsNoun()} yet.`}</p>}
      />
    </div>
  )
}
