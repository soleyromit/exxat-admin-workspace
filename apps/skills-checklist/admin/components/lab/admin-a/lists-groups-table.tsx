"use client"

/**
 * Groups of skills with row actions (variants C and D, 2026-11-03). Romit on A's optional step: "why assign to student groups at the
 * bottom? what's the relevance of the skip button? what are the other actions for group of skills? I don't see a report around it".
 * Each row carries its own actions: "Assigned to" opens the assign step for that group of skills (an unassigned one shows Assign),
 * a row menu holds Assign to student groups, Make default, Duplicate, Completion rule and Delete (drafts only), and Students
 * counts who it reaches, linking to Reports. D adds how those students stand this term (on track, behind), aggregate first.
 *
 * Reports filters by student group, not by group of skills, so a count that spans several student groups opens a menu with one
 * Reports link per student group (each the same length as its own count) instead of a single link that would not match. When the
 * groups cover every student, the count links to Reports unfiltered. Behind is the Reports flag under "Required this term"
 * (D-X12), pinned in the link so a graduating cohort does not open under "Required to graduate".
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { useLabHref } from "@/components/lab/lab-bar/page-context"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@exxatdesignux/ui/components/ui/dropdown-menu"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import type { ColumnDef } from "@exxatdesignux/ui/components/data-table/types"
import { groupLabel, skillGroups, type SkillList, type StudentGroup } from "@/lib/lab/lists"
import { buildAttainment, REQUIRED_SET_PARAM, defaultRequiredSet, requiredSetQuery } from "@/lib/lab/attainment"
import { EMPTY_SCOPE, type LabScope } from "@/lib/lab/scope"
import { skillNounPlural } from "@/lib/lab/terms"
import { VIZ } from "@/components/lab/viz"
import { ListStatus, RuleDialog, listSize, type ListsModel } from "./lists-parts"
import type { ListsContext, AssignHref } from "./lists-frame"
import { LINK, NUM_LINK, fmt } from "./parts"

// ---------------------------------------------------------------------------------------------------------------------
// Reach: who a group of skills reaches, split by the Reports scopes that can open them.

interface Slice {
  /** "All students" when one unfiltered scope covers the reach, else the student group's label. */
  label: string
  scope: LabScope
  students: number
  behind: number
}

interface Reach {
  students: number
  behind: number
  slices: Slice[]
}

const scopeOf = (g: StudentGroup): LabScope => (g.kind === "cohort" ? { ...EMPTY_SCOPE, cohort: g.label } : { ...EMPTY_SCOPE, group: g.id })

function useReach(model: ListsModel): (list: SkillList) => Reach {
  const { state, groups } = model
  // One Reports model per scope, built once: the same function and basis the Reports page uses, so each link's list matches.
  const behindIn = React.useMemo(() => {
    const cache = new Map<string, Set<string>>()
    return (scope: LabScope): Set<string> => {
      const key = `${scope.cohort}|${scope.group}`
      let hit = cache.get(key)
      if (!hit) {
        const m = buildAttainment(state, scope, undefined, { basis: "thisTerm" })
        hit = new Set(m.students.filter((s) => s.behind).map((s) => s.id))
        cache.set(key, hit)
      }
      return hit
    }
  }, [state])
  const everyone = React.useMemo(() => state.people.filter((p) => p.kind === "student").length, [state])
  return React.useCallback(
    (list: SkillList): Reach => {
      const assigned = list.groupIds.map((id) => groups.find((g) => g.id === id)).filter((g): g is StudentGroup => !!g)
      const ids = new Set(assigned.flatMap((g) => g.studentIds))
      if (!ids.size) return { students: 0, behind: 0, slices: [] }
      if (ids.size === everyone) {
        const behind = behindIn(EMPTY_SCOPE).size
        return { students: ids.size, behind, slices: [{ label: "All students", scope: EMPTY_SCOPE, students: ids.size, behind }] }
      }
      const behindIds = new Set<string>()
      const slices = assigned.map((g) => {
        const b = behindIn(scopeOf(g))
        for (const id of b) behindIds.add(id)
        return { label: g.label, scope: scopeOf(g), students: g.studentIds.length, behind: b.size }
      })
      return { students: ids.size, behind: behindIds.size, slices }
    },
    [groups, everyone, behindIn],
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// A count that opens Reports: one link, or a menu of one link per student group.

type Measure = "students" | "behind" | "onTrack"

const valueOf = (x: { students: number; behind: number }, m: Measure): number => (m === "students" ? x.students : m === "behind" ? x.behind : x.students - x.behind)

function useReportHref(model: ListsModel): (scope: LabScope) => string {
  const to = useLabHref()
  return React.useCallback(
    (scope: LabScope) => {
      const pinned = defaultRequiredSet(model.state, scope) === "thisTerm" ? null : requiredSetQuery("thisTerm")
      return to("admin/attainment", { cohort: scope.cohort || null, group: scope.group || null, [REQUIRED_SET_PARAM]: pinned })
    },
    [to, model.state],
  )
}

const WORD: Record<Measure, string> = { students: "", behind: "behind", onTrack: "on track" }

function CountText({ n, measure }: { n: number; measure: Measure }) {
  if (measure === "behind")
    return (
      <span className="inline-flex items-center gap-1.5">
        <i className="fa-solid fa-triangle-exclamation text-xs" style={{ color: VIZ.behindInk }} aria-hidden="true" />
        <span className="tabular-nums">{`${fmt(n)} ${WORD.behind}`}</span>
      </span>
    )
  if (measure === "onTrack")
    return (
      <span className="inline-flex items-center gap-1.5">
        <i className="fa-light fa-circle-check text-xs text-muted-foreground" aria-hidden="true" />
        <span className="tabular-nums">{`${fmt(n)} ${WORD.onTrack}`}</span>
      </span>
    )
  return <span className="tabular-nums">{fmt(n)}</span>
}

function ReportCount({ list, reach, measure, hrefFor }: { list: SkillList; reach: Reach; measure: Measure; hrefFor: (scope: LabScope) => string }) {
  const n = valueOf(reach, measure)
  if (!reach.students) return <span className="text-muted-foreground">None</span>
  // A zero is not a drill: nothing to open, and no attention glyph for an empty count.
  if (n === 0) return <span className="tabular-nums text-muted-foreground">{measure === "students" ? "0" : `0 ${WORD[measure]}`}</span>
  const what = measure === "students" ? "students" : `students ${WORD[measure]}`
  if (reach.slices.length === 1)
    return (
      <Link className={NUM_LINK} href={hrefFor(reach.slices[0]!.scope)} aria-label={`${fmt(n)} ${what} with ${list.name}, open in Reports`}>
        <CountText n={n} measure={measure} />
      </Link>
    )
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="-ms-2 gap-1.5 font-medium" aria-label={`${fmt(n)} ${what} with ${list.name}, by student group`}>
          <CountText n={n} measure={measure} />
          <i className="fa-light fa-chevron-down text-xs text-muted-foreground" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {reach.slices.map((s) => (
          <DropdownMenuItem key={s.label} asChild>
            <Link href={hrefFor(s.scope)} className="flex w-full items-center justify-between gap-4">
              <span>{s.label}</span>
              <span className="tabular-nums text-muted-foreground">{fmt(valueOf(s, measure))}</span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// The table

interface Row extends Record<string, unknown> {
  id: string
  list: SkillList
  name: string
  size: number
  students: number
  behind: number
  onTrack: number
  reach: Reach
}

export function GroupsActionTable({ c, outcome, assignHref }: { c: ListsContext; outcome: boolean; assignHref: AssignHref }) {
  const { model, actions } = c
  const [deleted, setDeleted] = React.useState<string[]>([])
  const [ruleFor, setRuleFor] = React.useState<string | null>(null)
  const [deleting, setDeleting] = React.useState<SkillList | null>(null)
  const reachOf = useReach(model)
  const hrefFor = useReportHref(model)
  const nounPl = skillNounPlural()
  const lists = skillGroups(model.lists).filter((l) => !deleted.includes(l.id))
  const rows: Row[] = lists.map((l) => {
    const reach = reachOf(l)
    return { id: l.id, list: l, name: l.name, size: l.skillIds.length, students: reach.students, behind: reach.behind, onTrack: reach.students - reach.behind, reach }
  })
  const ruleList = lists.find((l) => l.id === ruleFor)

  const columns = React.useMemo<ColumnDef<Row>[]>(() => {
    const cols: ColumnDef<Row>[] = [
      {
        key: "name",
        label: `Group of ${nounPl}`,
        width: outcome ? 230 : 280,
        sortable: true,
        cell: (r) => (
          <span className="flex min-w-0 items-center gap-2 py-0.5">
            <span className="whitespace-normal font-medium">{r.name}</span>
            {r.list.isDefault ? <Badge variant="secondary">Default</Badge> : null}
          </span>
        ),
      },
      { key: "size", label: "Size", width: outcome ? 190 : 220, sortable: true, cell: (r) => <span className="whitespace-normal tabular-nums">{listSize(r.list)}</span> },
      {
        key: "assigned",
        label: "Assigned to",
        width: outcome ? 210 : 260,
        cell: (r) =>
          r.list.groupIds.length ? (
            <Link className={`${LINK} whitespace-normal`} href={assignHref({ list: r.id })} aria-label={`Assigned to ${r.list.groupIds.map((g) => groupLabel(model.groups, g)).join(", ")}. Change who uses ${r.name}`}>
              {r.list.groupIds.map((g) => groupLabel(model.groups, g)).join(", ")}
            </Link>
          ) : (
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href={assignHref({ list: r.id })} aria-label={`Assign ${r.name}`}>Assign</Link>
            </Button>
          ),
      },
      { key: "students", label: "Students", width: outcome ? 96 : 110, sortable: true, cell: (r) => <ReportCount list={r.list} reach={r.reach} measure="students" hrefFor={hrefFor} /> },
    ]
    if (outcome)
      // One column, two counts: the outcome is one fact (how the reached students stand this term), so it takes one place.
      cols.push({
        key: "behind",
        label: "This term",
        width: 230,
        sortable: true,
        cell: (r) =>
          r.reach.students ? (
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <ReportCount list={r.list} reach={r.reach} measure="onTrack" hrefFor={hrefFor} />
              <ReportCount list={r.list} reach={r.reach} measure="behind" hrefFor={hrefFor} />
            </span>
          ) : (
            <span className="text-muted-foreground">Not assigned</span>
          ),
      })
    cols.push(
      { key: "status", label: "Status", width: outcome ? 96 : 110, cell: (r) => <ListStatus list={r.list} /> },
      {
        key: "actions",
        label: "",
        width: 48,
        minWidth: 48,
        defaultPin: "right",
        lockPin: true,
        cell: (r) => (
          <div className="flex items-center justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="icon-sm" aria-label={`Actions for ${r.name}`}>
                  <i className="fa-light fa-ellipsis" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuItem asChild>
                  <Link href={assignHref({ list: r.id })}><i className="fa-light fa-users" aria-hidden="true" />Assign to student groups</Link>
                </DropdownMenuItem>
                {!r.list.isDefault ? (
                  <DropdownMenuItem onSelect={() => actions.requestDefault(r.id)}><i className="fa-light fa-star" aria-hidden="true" />Make default</DropdownMenuItem>
                ) : null}
                <DropdownMenuItem onSelect={() => actions.openNew(r.id)}><i className="fa-light fa-copy" aria-hidden="true" />Duplicate</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setRuleFor(r.id)}><i className="fa-light fa-list-check" aria-hidden="true" />Completion rule</DropdownMenuItem>
                {r.list.status === "draft" ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(r.list)}><i className="fa-light fa-trash" aria-hidden="true" />Delete</DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    )
    return cols
  }, [nounPl, outcome, assignHref, model.groups, hrefFor, actions])

  return (
    <div data-region="lists" data-groups-actions={outcome ? "outcome" : "actions"}>
      <DataTable<Row>
        data={rows}
        columns={columns}
        getRowId={(r) => r.id}
        searchable={false}
        showQueryControls={false}
        edgeInset={false}
        emptyState={<p className="p-4 text-sm text-muted-foreground">{`No groups of ${nounPl} yet.`}</p>}
      />
      {ruleList ? <RuleDialog model={model} list={ruleList} open onClose={() => setRuleFor(null)} onSaved={actions.setFeedback} /> : null}
      <Dialog open={!!deleting} onOpenChange={(o) => (o ? null : setDeleting(null))}>
        <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{deleting ? `Delete ${deleting.name}?` : "Delete"}</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                if (!deleting) return
                setDeleted((d) => [...d, deleting.id])
                actions.setFeedback({ title: `${deleting.name} deleted`, body: "" })
                setDeleting(null)
              }}
            >
              {`Delete group of ${nounPl}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
