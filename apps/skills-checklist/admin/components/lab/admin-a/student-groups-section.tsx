"use client"

/**
 * Settings, Student groups (D-L79): where a student group is created, renamed and removed. It left the Assign page because every page has one reason (Sankalp 11-04, Granola 365abc25
 * ch 10-11), and he expects it in the student area once Prism has student groups (10-28, 655e2cbd ch 2). Until then this section stands in for that feature.
 * Cohorts and tracks come from the program, so only a custom group has a row menu. The dialogs are the ones Assign used, with the same rule-based creation; a new group gets the default
 * list (205da2dd ch 9). Every change writes at once: there is no page draft here.
 */
import * as React from "react"
import { useSearchParams } from "next/navigation"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { useLabHref } from "@/components/lab/lab-bar/page-context"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import type { ColumnDef } from "@exxatdesignux/ui/components/data-table/types"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@exxatdesignux/ui/components/ui/dropdown-menu"
import { TabsCountBadge } from "@exxatdesignux/ui/components/ui/tabs"
import { useIsMobile } from "@exxatdesignux/ui/hooks/use-mobile"
import { EmptyBlock } from "@/components/lab/empty-block"
import { NUM_LINK } from "@/components/lab/link-styles"
import { GROUP_NAME_MAX, skillLists, studentGroups, validateGroupName, type StudentGroup } from "@/lib/lab/lists"
import { useV2State } from "@/lib/v2/react"
import { skillListsNoun } from "@/lib/lab/terms"
import { ResultBanner } from "@/components/lab/shared/result-banner"
import { useFocusBack } from "./lists-focus"
import { CreateGroupDialog, GROUP_KIND_LABEL, NameDialog, RemoveGroupDialog, useListsModel, type Feedback } from "./lists-parts"
import { LINK, SearchField, fmt, plural } from "./parts"
import { customGroupsStore } from "./session-store"

/** The tab's count, apart from the page's other counts: it reads the session's custom groups. */
export function StudentGroupsCount({ empty }: { empty: boolean }) {
  const state = useV2State()
  const custom = customGroupsStore.use()
  const n = React.useMemo(() => studentGroups(state, custom).filter((g) => g.kind !== "all").length, [state, custom])
  return <TabsCountBadge count={empty ? 0 : n} />
}

interface Row extends Record<string, unknown> {
  id: string
  group: StudentGroup
  name: string
  type: string
  students: number
  lists: string
}

export function StudentGroupsSection() {
  const state = useV2State()
  const model = useListsModel(state)
  const back = useFocusBack()
  const narrow = useIsMobile()
  const to = useLabHref()
  const demo = useSearchParams()?.get("state")
  const [q, setQ] = React.useState("")
  const [creating, setCreating] = React.useState(false)
  const [renaming, setRenaming] = React.useState<StudentGroup | null>(null)
  const [removing, setRemoving] = React.useState<StudentGroup | null>(null)
  const [feedback, setFeedback] = React.useState<Feedback | null>(null)
  const all = demo === "empty" ? [] : model.groups.filter((g) => g.kind !== "all")
  const needle = q.trim().toLowerCase()
  const shown = needle ? all.filter((g) => g.label.toLowerCase().includes(needle)) : all
  const rows: Row[] = shown.map((g) => ({ id: g.id, group: g, name: g.label, type: GROUP_KIND_LABEL[g.kind], students: g.studentIds.length, lists: skillLists(model.lists).filter((l) => l.groupIds.includes(g.id)).map((l) => l.name).join(", ") }))
  const reports = (g: StudentGroup) => to("admin/attainment", g.kind === "cohort" ? { cohort: g.label } : { group: g.id })
  const assignTo = (listId: string) => to("admin/lists-cohorts", { list: listId })
  const columns = React.useMemo<ColumnDef<Row>[]>(() => {
    const name: ColumnDef<Row> = {
      key: "name",
      label: "Name",
      width: narrow ? 180 : 300,
      sortable: true,
      cell: (r) => (
        <span className="flex min-w-0 flex-col py-0.5">
          <span className="truncate font-medium text-foreground">{r.name}</span>
          {narrow ? <span className="text-xs text-muted-foreground">{`${r.type}, ${plural(r.students, "student", "students")}`}</span> : null}
        </span>
      ),
    }
    const menu: ColumnDef<Row> = {
      key: "actions",
      label: "Actions",
      width: 48,
      minWidth: 48,
      resizable: false,
      defaultPin: "right",
      lockPin: true,
      header: () => <span className="sr-only">Actions</span>,
      cell: (r) =>
        r.group.kind === "custom" ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon-sm" aria-label={`Actions for ${r.name}`}>
                <i className="fa-light fa-ellipsis" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onSelect={() => { back.remember(); setRenaming(r.group) }}><i className="fa-light fa-pen" aria-hidden="true" />Rename</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => { back.remember(); setRemoving(r.group) }}><i className="fa-light fa-trash" aria-hidden="true" />Remove</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null,
    }
    const listsOf = (r: Row) => skillLists(model.lists).filter((l) => l.groupIds.includes(r.id))
    const wide: ColumnDef<Row>[] = [
      { key: "type", label: "Type", width: 140, sortable: true },
      { key: "students", label: "Students", width: 110, sortable: true, cell: (r) => (r.students ? <Link className={NUM_LINK} href={reports(r.group)} aria-label={`${plural(r.students, "student", "students")} in ${r.name}, open in Reports`}>{fmt(r.students)}</Link> : <span className="tabular-nums text-muted-foreground">0</span>) },
      {
        key: "lists",
        label: skillListsNoun().replace(/^./, (c) => c.toUpperCase()),
        width: 420,
        cell: (r) => {
          const on = listsOf(r)
          if (!on.length) return <span className="text-muted-foreground">None</span>
          return (
            <span className="flex flex-wrap gap-x-3 whitespace-normal">
              {on.map((l) => <Link key={l.id} className={LINK} href={assignTo(l.id)}>{l.name}</Link>)}
            </span>
          )
        },
      },
    ]
    return narrow ? [name, menu] : [name, ...wide, menu]
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reports and assignTo read `to` alone
  }, [narrow, model.lists, to, back])
  return (
    <div className="flex flex-col gap-4" data-student-groups>
      {feedback ? <ResultBanner banner={{ variant: feedback.tone ?? "success", title: feedback.title, body: feedback.body || undefined, action: feedback.action }} onDismiss={() => setFeedback(null)} /> : null}
      <div className="flex flex-wrap items-center justify-between gap-2" data-region="toolbar">
        <SearchField value={q} onChange={setQ} label="Search student groups" placeholder="Search student groups" className="w-full sm:w-64" />
        <Button type="button" variant="default" size="sm" onClick={() => { back.remember(); setCreating(true) }} data-create-group>New student group</Button>
      </div>
      <DataTable<Row>
        key={narrow ? "narrow" : "wide"}
        data={rows}
        columns={columns}
        getRowId={(r) => r.id}
        selectable={false}
        searchable={false}
        showQueryControls={false}
        edgeInset={false}
        emptyState={needle ? <EmptyBlock compact title="No student groups match this search" action={{ label: "Clear search" }} onAction={() => setQ("")} /> : <EmptyBlock compact title="No student groups yet" />}
      />
      <CreateGroupDialog model={model} open={creating} back={back} onClose={() => setCreating(false)} onDone={setFeedback} />
      <NameDialog
        open={!!renaming}
        title={`Rename ${renaming?.label ?? ""}`}
        id="rename-group"
        initial={renaming?.label ?? ""}
        maxLength={GROUP_NAME_MAX}
       
        back={back}
        validate={(name) => (renaming ? validateGroupName(model.groups, name, renaming.id) : null)}
        onClose={() => setRenaming(null)}
        onSave={(name) => {
          if (renaming) model.renameGroup(renaming.id, name)
          setFeedback({ title: `${renaming?.label} renamed to ${name}.`, body: "" })
        }}
      />
      <RemoveGroupDialog model={model} group={removing} back={back} onClose={() => setRemoving(null)} onDone={setFeedback} />
    </div>
  )
}
