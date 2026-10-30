"use client"

/**
 * Lists and cohort assignment B (alternative): every group and every list at once. One grid of student groups by lists: check a
 * cell to assign a list to a group, the way an announcement is checked off for the cohorts it applies to [CALL]. The last row is
 * the next new cohort, which gets the default list automatically.
 *
 * Assign mode (set-up flow step "Assign to cohort or group", sets 2 One page and 3 Many at once): the grid is the whole job, under
 * the step's own title, with one line saying what a check does now (a cohort's clinical courses offer the list's skills; course
 * mapping can still change the level per course [CALL 10-26; LEDGER D-X27]). Manage mode (standalone Lists, set 2) adds New list.
 * Neither shows reporting figures (Sankalp 2026-10-27: the old per-cell attainment counts belong in Attainment).
 * "Create a group" builds a custom group from rules [CALL 10-26]. How a group that spans enrollment years maps to course offerings
 * is still open: the legend states only what happens today (no course picks a non-cohort group's list up by itself).
 * Regions: header, toolbar, grid, one-line legend. Demo states: ?state=loading | empty | error.
 */
import { TYPE } from "@/components/lab/type-scale"
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Tip } from "@exxatdesignux/ui/components/ui/tip"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import type { ColumnDef } from "@exxatdesignux/ui/components/data-table/types"
import { clinicalOfferingsFor, individualSkillsFor, listsHref, skillGroups, type SkillList, type StudentGroup } from "@/lib/lab/lists"
import { FloatingSheetPanel, FloatingSheetPanelBody, FloatingSheetPanelContent, FloatingSheetPanelHeader, FloatingSheetPanelToolbar, railTriggerProps } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { IndividualSkills } from "@/components/lab/admin-a/lists-individual"
import { ListsFrame, type ListsContext } from "@/components/lab/admin-a/lists-frame"
import { CheckboxCell, GROUP_KIND_LABEL, ListStatus, listSize } from "@/components/lab/admin-a/lists-parts"
import { LINK, fmt, plural } from "@/components/lab/admin-a/parts"
import { skillNoun, skillNounPlural } from "@/lib/lab/terms"

export function AdminListsCohortsB() {
  return (
    <ListsFrame variant="B" footerContext={footerLine}>
      {(c) => <GroupFirst c={c} />}
    </ListsFrame>
  )
}

function footerLine(c: ListsContext): string {
  const live = c.model.lists.filter((l) => l.status === "live")
  const covered = c.model.groups.filter((g) => live.some((l) => l.groupIds.includes(g.id))).length
  return `${fmt(covered)} of ${plural(c.model.groups.length, "group", "groups")} have ${skillNounPlural()} assigned`
}

interface Row extends Record<string, unknown> {
  id: string
  group: StudentGroup | null
}

const NEXT = "__next"

function groupMeta(c: ListsContext, g: StudentGroup): string {
  const students = plural(g.studentIds.length, "student", "students")
  const courses = clinicalOfferingsFor(c.model.state, g)
  return courses === null ? `${GROUP_KIND_LABEL[g.kind]} · ${students}` : `${students} · ${plural(courses, "clinical course", "clinical courses")}`
}

function GroupFirst({ c }: { c: ListsContext }) {
  const { model } = c
  const [picking, setPicking] = React.useState<string | null>(null)
  const rows: Row[] = [...model.groups.map((g) => ({ id: g.id, group: g })), { id: NEXT, group: null }]
  const columns = React.useMemo<ColumnDef<Row>[]>(() => {
    const cols: ColumnDef<Row>[] = [
      {
        key: "group",
        label: "Student group",
        width: 240,
        defaultPin: "left",
        cell: (r) =>
          r.group ? (
            <span className="flex flex-col py-0.5">
              <span className="font-medium">{r.group.label}</span>
              {r.group.kind === "cohort" ? (
                <span className="text-xs text-muted-foreground">{groupMeta(c, r.group)}</span>
              ) : (
                <Tip label={`No course picks up this group's ${skillNounPlural()} by itself.`}>
                  <span tabIndex={0} className="w-fit rounded-sm text-xs text-muted-foreground underline decoration-dotted underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{groupMeta(c, r.group)}</span>
                </Tip>
              )}
            </span>
          ) : (
            <span className="flex flex-col py-0.5">
              <span className="font-medium">Next new cohort</span>
              <span className="text-xs text-muted-foreground">{`Gets the default group of ${skillNounPlural()}`}</span>
            </span>
          ),
      },
    ]
    // Individual skills, one at a time, no group of skills needed (Sankalp's A5): assign mode only, picked in a side panel. Second
    // column, so it is never scrolled out of view behind the groups of skills.
    if (c.mode === "assign") cols.push(individualColumn(c, setPicking))
    for (const l of skillGroups(model.lists)) cols.push(listColumn(l, c))
    return cols
  }, [model, c])
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2" data-region="toolbar">
        <h2 className={TYPE.section}>Student groups</h2>
        <span className="ms-auto flex items-center gap-2">
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
      {c.mode === "manage" ? <p className="text-xs text-muted-foreground" data-region="legend"><span data-standards-pointer>Standards are managed in Program details.</span></p> : null}
      <IndividualPanel c={c} groupId={picking} onClose={() => setPicking(null)} />
    </div>
  )
}

function individualColumn(c: ListsContext, open: (groupId: string) => void): ColumnDef<Row> {
  return {
    key: "individual",
    label: `Individual ${skillNounPlural()}`,
    width: 160,
    cell: (r) => {
      if (!r.group) return <span className="text-sm text-muted-foreground">None</span>
      const n = individualSkillsFor(c.model.lists, r.group.id).length
      return (
        <Button type="button" variant="ghost" size="sm" className="-ms-2" onClick={() => open(r.group!.id)} aria-label={`Individual ${skillNounPlural()} for ${r.group.label}: ${n}`} {...railTriggerProps()}>
          {n ? plural(n, skillNoun(), skillNounPlural()) : "Choose"}
        </Button>
      )
    },
  }
}

/** Picks individual skills for one group beside the grid (non-modal, the grid stays usable). */
function IndividualPanel({ c, groupId, onClose }: { c: ListsContext; groupId: string | null; onClose: () => void }) {
  const g = c.model.groups.find((x) => x.id === groupId)
  return (
    <FloatingSheetPanel open={!!g} onOpenChange={(o) => (o ? null : onClose())}>
      <FloatingSheetPanelContent contentSlot="lab-admin-individual-skills" size="md">
        <FloatingSheetPanelToolbar />
        {g ? (
          <>
            <FloatingSheetPanelHeader title={`Individual ${skillNounPlural()} for ${g.label}`} subtitle={`${g.label} clinical courses offer what you pick here.`} />
            <FloatingSheetPanelBody className="flex flex-col gap-3 px-4 pb-4">
              <IndividualSkills model={c.model} group={g} />
            </FloatingSheetPanelBody>
          </>
        ) : null}
      </FloatingSheetPanelContent>
    </FloatingSheetPanel>
  )
}

function listColumn(l: SkillList, c: ListsContext): ColumnDef<Row> {
  const { actions } = c
  return {
    key: `l:${l.id}`,
    label: l.name,
    width: 284,
    header: () => (
      <span className="flex min-w-0 flex-col gap-0.5 py-1 leading-tight">
        <span className="flex items-center gap-1.5">
          {c.mode === "manage" ? <Link className={`${LINK} truncate text-xs`} href={listsHref({ list: l.id })}>{l.name}</Link> : <span className="truncate text-xs">{l.name}</span>}
          {l.isDefault ? <Badge variant="secondary">Default</Badge> : null}
        </span>
        <span className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
          {listSize(l)}
          <ListStatus list={l} />
        </span>
      </span>
    ),
    cell: (r) => {
      if (!r.group) return l.isDefault ? <span className="text-sm">Added automatically</span> : <span className="text-sm text-muted-foreground" aria-label="Not added">None</span>
      const uses = l.groupIds.includes(r.group.id)
      return <CheckboxCell checked={uses} label={`${r.group.label} uses ${l.name}`} onChange={(on) => actions.toggle(l.id, r.group!.id, on)} />
    },
  }
}
