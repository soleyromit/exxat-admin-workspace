"use client"

/**
 * Lists and cohort assignment building blocks: the model hook, the lists table, the assignment checklist and what it does, the
 * completion rule dialog with "what would change" (standalone Lists only), and
 * the dialogs that keep every change visible before it lands (attach to a group that already uses a list of the same noun, detach,
 * make default, start a new list). A new standard is a new list; standards themselves are managed in Program details, so a list
 * carries no standards field [CALL 10-26 B.12]. Nothing replaces a program's established list silently [CALL].
 */
import { TYPE } from "@/components/lab/type-scale"
import { skillNoun, skillNounPlural } from "@/lib/lab/terms"
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Checkbox as CheckboxDs } from "@exxatdesignux/ui/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@exxatdesignux/ui/components/ui/collapsible"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { RadioGroup, RadioGroupItem } from "@exxatdesignux/ui/components/ui/radio-group"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import type { ColumnDef } from "@exxatdesignux/ui/components/data-table/types"
import {
  achievedByStudent,
  assign,
  assignCheck,
  assignmentSummary,
  skillGroups,
  clinicalOfferingsFor,
  countNoun,
  createList,
  customGroup,
  groupLabel,
  groupRuleOptions,
  groupStanding,
  listById,
  makeDefault,
  ruleImpact,
  ruleIsEmpty,
  studentGroups,
  studentsForRule,
  validateCustomGroup,
  type GroupRule,
  unassign,
  validateMinTotal,
  validateNewList,
  type AssignMode,
  type GroupStanding,
  type SkillList,
  type StudentGroup,
} from "@/lib/lab/lists"
import type { V2State } from "@/lib/v2/types"
import type { CustomGroup } from "@/lib/v2/filters"
import { FilterSelect, LINK, fmt, plural } from "./parts"
import { customGroupsStore, useLists } from "./use-admin-data"

// ---------------------------------------------------------------------------------------------------------------------
// Model

export interface ListsModel {
  state: V2State
  lists: SkillList[]
  groups: StudentGroup[]
  setLists: (next: SkillList[]) => void
  standing: (list: SkillList, groupId: string) => GroupStanding | null
  /** Custom groups made this session (filter rules); they also appear in the scope bar's Group filter. */
  addGroup: (g: CustomGroup) => void
}

export function useListsModel(state: V2State): ListsModel {
  const { lists, setLists } = useLists(state)
  const custom = customGroupsStore.use()
  const groups = React.useMemo(() => studentGroups(state, custom), [state, custom])
  const addGroup = React.useCallback((g: CustomGroup) => customGroupsStore.set((prev) => (prev.some((x) => x.id === g.id) ? prev : [...prev, g])), [])
  const achieved = React.useMemo(() => achievedByStudent(state), [state])
  const standing = React.useCallback(
    (list: SkillList, groupId: string) => {
      const g = groups.find((x) => x.id === groupId)
      return g ? groupStanding(state, list, g, achieved) : null
    },
    [state, groups, achieved],
  )
  return { state, lists, groups, setLists, standing, addGroup }
}

export const GROUP_KIND_LABEL: Record<StudentGroup["kind"], string> = { cohort: "Cohort", track: "Track", custom: "Custom group" }

export function ListStatus({ list }: { list: SkillList }) {
  return list.status === "live" ? <StatusBadge label="Live" tone="neutral" icon="fa-circle-check" size="sm" /> : <StatusBadge label="Draft" tone="neutral" icon="fa-pen" size="sm" />
}

// ---------------------------------------------------------------------------------------------------------------------
// Actions with their confirmations

export interface Feedback {
  title: string
  body: string
}

export function useListActions(model: ListsModel) {
  const { lists, setLists, groups } = model
  const [attach, setAttach] = React.useState<{ listId: string; groupId: string } | null>(null)
  const [detach, setDetach] = React.useState<{ listId: string; groupId: string } | null>(null)
  const [defaulting, setDefaulting] = React.useState<string | null>(null)
  const [creating, setCreating] = React.useState<{ fromId: string | null } | null>(null)
  const [grouping, setGrouping] = React.useState(false)
  const [feedback, setFeedback] = React.useState<Feedback | null>(null)

  const toggle = React.useCallback(
    (listId: string, groupId: string, on: boolean) => {
      if (!on) return setDetach({ listId, groupId })
      const check = assignCheck(lists, listId, groupId)
      const list = listById(lists, listId)
      if (check.sameNoun.length || list?.status === "draft") return setAttach({ listId, groupId })
      setLists(assign(lists, listId, groupId, "add"))
      const g = groups.find((x) => x.id === groupId)
      const courses = g ? clinicalOfferingsFor(model.state, g) : null
      const reach = courses === null ? `Its students see these ${skillNounPlural()} on their progress page.` : `Its ${plural(courses, "clinical course", "clinical courses")} now offer these ${list?.nounPlural ?? skillNounPlural()}.`
      setFeedback({ title: `${groupLabel(groups, groupId)} now uses ${list?.name ?? `this ${G()}`}`, body: check.existing.length ? `${reach} It keeps ${check.existing.map((l) => l.name).join(" and ")}.` : reach })
    },
    [lists, setLists, groups, model.state],
  )

  const dialogs = (
    <>
      <AttachDialog model={model} target={attach} onClose={() => setAttach(null)} onDone={setFeedback} />
      <DetachDialog model={model} target={detach} onClose={() => setDetach(null)} onDone={setFeedback} />
      <DefaultDialog
        model={model}
        listId={defaulting}
        onClose={() => setDefaulting(null)}
        onConfirm={(id) => {
          setLists(makeDefault(lists, id))
          setFeedback({ title: `${listById(lists, id)?.name} is the default`, body: "New cohorts get it automatically. Existing student groups keep what they use." })
          setDefaulting(null)
        }}
      />
      <NewListDialog model={model} target={creating} onClose={() => setCreating(null)} onDone={setFeedback} />
      <CreateGroupDialog model={model} open={grouping} onClose={() => setGrouping(false)} onDone={setFeedback} />
    </>
  )

  const banner = feedback ? (
    <div role="status" aria-live="polite">
      <LocalBanner variant="promo" title={feedback.title} dismissible onDismiss={() => setFeedback(null)}>
        {feedback.body}
      </LocalBanner>
    </div>
  ) : null

  return { toggle, requestDefault: setDefaulting, openNew: (fromId: string | null = null) => setCreating({ fromId }), openGroup: () => setGrouping(true), dialogs, banner, setFeedback }
}

const ANY_RULE = ""

/** Sankalp's word for a list in UI copy: "group of skills" (Thursday flow A4). */
const G = () => `group of ${skillNounPlural()}`

/**
 * Create a group from filter rules (category, enrollment year, graduation year) with a live student count [CALL 10-26]. For programs
 * without a lockstep cohort; useful beyond skills. The group joins the assignment grid and the scope bar's Group filter.
 */
function CreateGroupDialog({ model, open, onClose, onDone }: { model: ListsModel; open: boolean; onClose: () => void; onDone: (f: Feedback) => void }) {
  const [name, setName] = React.useState("")
  const [cat, setCat] = React.useState(ANY_RULE)
  const [enr, setEnr] = React.useState(ANY_RULE)
  const [grad, setGrad] = React.useState(ANY_RULE)
  const [error, setError] = React.useState<string | null>(null)
  React.useEffect(() => {
    if (!open) return
    setName("")
    setCat(ANY_RULE)
    setEnr(ANY_RULE)
    setGrad(ANY_RULE)
    setError(null)
  }, [open])
  const opts = React.useMemo(() => groupRuleOptions(model.state), [model.state])
  const rule: GroupRule = { ...(cat ? { category: cat } : {}), ...(enr ? { enrollmentYear: Number(enr) } : {}), ...(grad ? { graduationYear: Number(grad) } : {}) }
  const count = ruleIsEmpty(rule) ? null : studentsForRule(model.state, rule).length
  const cohortsSpanned = ruleIsEmpty(rule) ? 0 : new Set(studentsForRule(model.state, rule).map((p) => p.cohort)).size
  const field = (id: string, label: string, value: string, set: (v: string) => void, options: Array<string | number>) => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <FilterSelect id={id} value={value} onChange={(v) => { set(v); setError(null) }} label={label} allLabel="Any" options={options.map((o) => ({ value: String(o), label: String(o) }))} className="w-full" />
    </div>
  )
  return (
    <Dialog open={open} onOpenChange={(o) => (o ? null : onClose())}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a group</DialogTitle>
          <DialogDescription>Pick students by rules. The group updates as students change.</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            const err = validateCustomGroup(model.groups, name, rule)
            if (err) return setError(err)
            const g = customGroup(name.trim(), rule)
            model.addGroup(g)
            onDone({ title: `${g.name} created`, body: `${plural(count ?? 0, "student", "students")}. It is now in the Group filter and in the student groups below.` })
            onClose()
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="group-name">Name</Label>
            <Input id="group-name" value={name} onChange={(e) => { setName(e.target.value); setError(null) }} autoFocus maxLength={60} placeholder="For example, Hybrid re-entry" aria-invalid={!!error && !name.trim()} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {field("group-cat", "Category", cat, setCat, opts.categories)}
            {field("group-enr", "Enrolled in", enr, setEnr, opts.enrollmentYears)}
            {field("group-grad", "Graduates in", grad, setGrad, opts.graduationYears)}
          </div>
          <p className="text-sm" role="status" aria-live="polite" data-group-count={count ?? ""}>
            {count === null ? <span className="text-muted-foreground">Choose at least one rule to see who it picks.</span> : (
              <>
                <span className="font-semibold tabular-nums">{plural(count, "student", "students")}</span>
                <span className="text-muted-foreground">{count ? ` match, across ${plural(cohortsSpanned, "cohort", "cohorts")}.` : " match. Loosen a rule."}</span>
              </>
            )}
          </p>
          {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="default" size="sm">Create group</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AttachDialog({ model, target, onClose, onDone }: { model: ListsModel; target: { listId: string; groupId: string } | null; onClose: () => void; onDone: (f: Feedback) => void }) {
  const [mode, setMode] = React.useState<AssignMode>("add")
  React.useEffect(() => setMode("add"), [target])
  const list = target ? listById(model.lists, target.listId) : undefined
  const check = target ? assignCheck(model.lists, target.listId, target.groupId) : null
  const group = target ? groupLabel(model.groups, target.groupId) : ""
  const old = check?.sameNoun[0]
  return (
    <Dialog open={!!target} onOpenChange={(o) => (o ? null : onClose())}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{`Assign ${list?.name ?? `this ${G()}`} to ${group}`}</DialogTitle>
          <DialogDescription>{old ? `${group} already uses ${old.name}.` : list?.status === "draft" ? `This ${G()} is a draft. Assigning it makes it live for this group.` : ""}</DialogDescription>
        </DialogHeader>
        {old ? (
          <RadioGroup value={mode} onValueChange={(v) => setMode(v as AssignMode)} className="gap-3">
            <div className="flex items-start gap-2">
              <RadioGroupItem id="attach-add" value="add" className="mt-0.5" />
              <Label htmlFor="attach-add" className="flex flex-col items-start gap-0.5 font-normal">
                <span className="font-medium">{`Add as a second ${G()}`}</span>
                <span className="text-xs text-muted-foreground">{`Students see both. Each one is its own report.`}</span>
              </Label>
            </div>
            <div className="flex items-start gap-2">
              <RadioGroupItem id="attach-move" value="move" className="mt-0.5" />
              <Label htmlFor="attach-move" className="flex flex-col items-start gap-0.5 font-normal">
                <span className="font-medium">{`Move ${group} to this ${G()}`}</span>
                <span className="text-xs text-muted-foreground">{`${old.name} stops showing for ${group}. Evidence stays on each student's record.`}</span>
              </Label>
            </div>
          </RadioGroup>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => {
              if (!target || !list) return
              model.setLists(assign(model.lists, target.listId, target.groupId, old ? mode : "add"))
              onDone({ title: `${group} now uses ${list.name}`, body: old && mode === "move" ? `${old.name} no longer shows for ${group}. Evidence is kept.` : old ? `It keeps ${old.name}. Each one is its own report.` : `The ${G()} is live for this group.` })
              onClose()
            }}
          >
            {old && mode === "move" ? "Move group" : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DetachDialog({ model, target, onClose, onDone }: { model: ListsModel; target: { listId: string; groupId: string } | null; onClose: () => void; onDone: (f: Feedback) => void }) {
  const list = target ? listById(model.lists, target.listId) : undefined
  const group = target ? groupLabel(model.groups, target.groupId) : ""
  return (
    <Dialog open={!!target} onOpenChange={(o) => (o ? null : onClose())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{`Stop using ${list?.name ?? `this ${G()}`} for ${group}?`}</DialogTitle>
          <DialogDescription>{`${group} students stop seeing this ${G()}. Evidence stays on each record and counts again if you assign it later.`}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>Keep it</Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => {
              if (!target || !list) return
              model.setLists(unassign(model.lists, target.listId, target.groupId))
              onDone({ title: `${group} no longer uses ${list.name}`, body: "Evidence is kept." })
              onClose()
            }}
          >
            Stop using
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DefaultDialog({ model, listId, onClose, onConfirm }: { model: ListsModel; listId: string | null; onClose: () => void; onConfirm: (id: string) => void }) {
  const list = listId ? listById(model.lists, listId) : undefined
  const current = model.lists.find((l) => l.isDefault)
  return (
    <Dialog open={!!list} onOpenChange={(o) => (o ? null : onClose())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{`Make ${list?.name ?? `this ${G()}`} the default?`}</DialogTitle>
          <DialogDescription>{`New cohorts get it automatically${current ? ` instead of ${current.name}` : ""}. Existing student groups keep what they use.`}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="button" variant="default" size="sm" onClick={() => list && onConfirm(list.id)}>Make default</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function NewListDialog({ model, target, onClose, onDone }: { model: ListsModel; target: { fromId: string | null } | null; onClose: () => void; onDone: (f: Feedback) => void }) {
  const [name, setName] = React.useState("")
  const [noun, setNoun] = React.useState(skillNoun)
  const [nounPlural, setNounPlural] = React.useState(skillNounPlural)
  const [from, setFrom] = React.useState<string>("empty")
  const [error, setError] = React.useState<string | null>(null)
  React.useEffect(() => {
    if (!target) return
    const src = target.fromId ? listById(model.lists, target.fromId) : undefined
    setName("")
    setNoun(src?.noun ?? skillNoun())
    setNounPlural(src?.nounPlural ?? skillNounPlural())
    setFrom(src ? src.id : "empty")
    setError(null)
  }, [target, model.lists])
  const live = model.lists.filter((l) => l.status === "live")
  return (
    <Dialog open={!!target} onOpenChange={(o) => (o ? null : onClose())}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{`New group of ${skillNounPlural()}`}</DialogTitle>
          <DialogDescription>{`It starts as a draft. Live groups of ${skillNounPlural()} and their evidence stay as they are.`}</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            // No standards field: standards are managed in Program details (CALL 10-26 B.12). The data keeps an empty value.
            const input = { name, noun, nounPlural, standard: "", fromListId: from === "empty" ? null : from }
            const err = validateNewList(model.lists, input)
            if (err) return setError(err)
            const created = createList(model.lists, input, `list-${Date.now().toString(36)}`)
            model.setLists([...model.lists, created])
            onDone({ title: `${created.name} created as a draft`, body: "No student sees it until you assign it to a group." })
            onClose()
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="list-name">Name</Label>
            <Input id="list-name" value={name} onChange={(e) => { setName(e.target.value); setError(null) }} autoFocus maxLength={80} aria-invalid={!!error && !name.trim()} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="list-noun">It holds one</Label>
              <Input id="list-noun" value={noun} onChange={(e) => { setNoun(e.target.value); setError(null) }} maxLength={30} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="list-noun-plural">Or several</Label>
              <Input id="list-noun-plural" value={nounPlural} onChange={(e) => { setNounPlural(e.target.value); setError(null) }} maxLength={30} />
            </div>
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">Start from</legend>
            <RadioGroup value={from} onValueChange={setFrom} className="gap-2">
              <div className="flex items-center gap-2">
                <RadioGroupItem id="from-empty" value="empty" />
                <Label htmlFor="from-empty" className="font-normal">{`An empty group of ${skillNounPlural()}`}</Label>
              </div>
              {live.map((l) => (
                <div key={l.id} className="flex items-center gap-2">
                  <RadioGroupItem id={`from-${l.id}`} value={l.id} />
                  <Label htmlFor={`from-${l.id}`} className="font-normal">{`A copy of ${l.name} (${countNoun(l, l.skillIds.length)})`}</Label>
                </div>
              ))}
            </RadioGroup>
          </fieldset>
          {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="default" size="sm">{`Create group of ${skillNounPlural()}`}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Lists table (variant A)

interface ListRow extends Record<string, unknown> {
  id: string
  list: SkillList
  name: string
  size: number
  groups: number
}

export function ListsTable({ model, selectedId, hrefFor, onSelect }: { model: ListsModel; selectedId: string; hrefFor: (id: string) => string; onSelect: (id: string) => void }) {
  const rows: ListRow[] = skillGroups(model.lists).map((l) => ({ id: l.id, list: l, name: l.name, size: l.skillIds.length, groups: l.groupIds.length }))
  const columns = React.useMemo<ColumnDef<ListRow>[]>(
    () => [
      {
        key: "name",
        label: `Group of ${skillNounPlural()}`,
        width: 340,
        sortable: true,
        cell: (r) => (
          <span className="flex min-w-0 items-center gap-2 py-0.5">
            <Link className={`${LINK} whitespace-normal`} href={hrefFor(r.id)} scroll={false} onClick={(e) => e.stopPropagation()} aria-current={r.id === selectedId ? "true" : undefined} title={r.name}>{r.name}</Link>
            {r.list.isDefault ? <Badge variant="secondary">Default</Badge> : null}
          </span>
        ),
      },
      { key: "size", label: "Size", width: 260, sortable: true, cell: (r) => <span className="tabular-nums">{listSize(r.list)}</span> },
      {
        key: "groups",
        label: "Assigned to",
        width: 300,
        sortable: true,
        cell: (r) => (r.groups === 0 ? <span className="text-muted-foreground">No group yet</span> : <span className="whitespace-normal">{r.list.groupIds.map((g) => groupLabel(model.groups, g)).join(", ")}</span>),
      },
      { key: "status", label: "Status", width: 110, cell: (r) => <ListStatus list={r.list} /> },
    ],
    [hrefFor, selectedId, model.groups],
  )
  return (
    <div data-region="lists">
      <DataTable<ListRow>
        data={rows}
        columns={columns}
        getRowId={(r) => r.id}
        openRowId={selectedId || null}
        onRowClick={(r) => onSelect(r.id)}
        searchable={false}
        showQueryControls={false}
        edgeInset={false}
        emptyState={<p className="p-4 text-sm text-muted-foreground">{`No groups of ${skillNounPlural()} yet.`}</p>}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Which students use one list (variant A, both modes). Sankalp 2026-10-27: the old table mixed the assignment with reporting
// ("Meet the rule", "Median achieved"); those figures belong in Attainment. One checkbox per group, its size and where the
// skills land (a cohort's clinical courses), nothing else.

/** "154 skills, 52 required to graduate" (decision D-X12 names the list's required set "Required to graduate"). */
export const listSize = (l: SkillList): string => `${countNoun(l, l.skillIds.length)}, ${fmt(l.requiredIds.length)} required to graduate`

function groupMeta(state: V2State, g: StudentGroup): string {
  const students = plural(g.studentIds.length, "student", "students")
  const courses = clinicalOfferingsFor(state, g)
  return courses === null ? `${GROUP_KIND_LABEL[g.kind]} · ${students}` : `${students} · ${plural(courses, "clinical course", "clinical courses")}`
}

function GroupRows({ model, list, groups, onToggle, idPrefix }: { model: ListsModel; list: SkillList; groups: StudentGroup[]; onToggle: (groupId: string, on: boolean) => void; idPrefix: string }) {
  return (
    <ul className="flex flex-col">
      {groups.map((g) => {
        const id = `${idPrefix}-${g.id.replace(/[^a-z0-9]+/gi, "-")}`
        return (
          <li key={g.id} className="flex min-h-11 items-center gap-3 border-b border-border py-2 last:border-b-0">
            <CheckboxDs id={id} checked={list.groupIds.includes(g.id)} onCheckedChange={(v) => onToggle(g.id, v === true)} />
            <Label htmlFor={id} className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-0.5 font-normal">
              <span className="font-medium text-foreground">{g.label}</span>
              <span className="text-sm text-muted-foreground tabular-nums">{groupMeta(model.state, g)}</span>
            </Label>
          </li>
        )
      })}
    </ul>
  )
}

/**
 * The assignment checklist: cohorts first (lockstep programs assign by cohort [CALL 10-26]), then tracks and custom groups (for
 * programs without a lockstep cohort), with "Create a group" beside that heading: it makes a custom group from rules [CALL 10-26].
 * Past OTHERS_VISIBLE groups, the rest sit behind one "Show all" disclosure (open whenever a hidden one uses the list).
 */
const OTHERS_VISIBLE = 5

export function AssignChecklist({ model, list, onToggle, onCreateGroup, idPrefix = "assign" }: { model: ListsModel; list: SkillList; onToggle: (groupId: string, on: boolean) => void; onCreateGroup: () => void; idPrefix?: string }) {
  const cohorts = model.groups.filter((g) => g.kind === "cohort")
  const others = model.groups.filter((g) => g.kind !== "cohort")
  const shown = others.slice(0, OTHERS_VISIBLE)
  const rest = others.slice(OTHERS_VISIBLE)
  const restOn = rest.some((g) => list.groupIds.includes(g.id))
  const [open, setOpen] = React.useState(restOn)
  React.useEffect(() => {
    if (restOn) setOpen(true)
  }, [restOn])
  return (
    <div className="flex flex-col gap-5" data-assign-checklist>
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-muted-foreground" id={`${idPrefix}-cohorts`}>Cohorts</p>
        <div role="group" aria-labelledby={`${idPrefix}-cohorts`}>
          <GroupRows model={model} list={list} groups={cohorts} onToggle={onToggle} idPrefix={idPrefix} />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground" id={`${idPrefix}-others`}>Tracks and custom groups</p>
          <Button type="button" variant="outline" size="sm" onClick={onCreateGroup}>Create a group</Button>
        </div>
        <div role="group" aria-labelledby={`${idPrefix}-others`}>
          {others.length ? <GroupRows model={model} list={list} groups={shown} onToggle={onToggle} idPrefix={idPrefix} /> : <p className="py-2 text-sm text-muted-foreground">No tracks or custom groups yet.</p>}
          {rest.length ? (
            <Collapsible open={open} onOpenChange={setOpen}>
              <CollapsibleContent>
                <GroupRows model={model} list={list} groups={rest} onToggle={onToggle} idPrefix={idPrefix} />
              </CollapsibleContent>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="ghost" size="sm" className="-ms-2 mt-1">{open ? "Show fewer" : `Show all ${others.length}`}</Button>
              </CollapsibleTrigger>
            </Collapsible>
          ) : null}
        </div>
      </div>
    </div>
  )
}

/**
 * What the assignment does, now (decision D-X27, the Oct 26 model "define the skills once, tag them to a cohort"): one sentence,
 * then the numbers it rests on, each shown once. Course mapping stays the override [REQ CM-03, CM-06].
 */
export function AssignConsequence({ model, list }: { model: ListsModel; list: SkillList }) {
  const sum = assignmentSummary(model.state, list, model.groups)
  const noun = list.nounPlural
  const lead =
    sum.groups === 0
      ? `No students use this group of ${skillNounPlural()} yet. Check a cohort and its clinical courses offer these ${noun}.`
      : sum.cohorts > 0
        ? `Their clinical courses offer these ${countNoun(list, sum.offered)}.`
        : `Their students see these ${countNoun(list, list.skillIds.length)} on their progress page.`
  return (
    <section aria-labelledby="assign-consequence" className="flex flex-col gap-3 rounded-[var(--radius)] border border-border p-4" data-assign-consequence>
      <h2 id="assign-consequence" className={TYPE.section}>What this does</h2>
      <p className="text-sm text-foreground">{lead}</p>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
        {sum.cohorts > 0 ? (
          <>
            <dt className="text-muted-foreground">Clinical courses</dt>
            <dd className="tabular-nums">{`${fmt(sum.clinicalCourses)} in ${plural(sum.cohorts, "cohort", "cohorts")}`}</dd>
          </>
        ) : null}
        {sum.waiting > 0 ? (
          <>
            <dt className="text-muted-foreground">Not configured</dt>
            <dd className="tabular-nums">{`${fmt(sum.waiting)} join when configured`}</dd>
          </>
        ) : null}
        {sum.otherGroups > 0 ? (
          <>
            <dt className="text-muted-foreground">Other groups</dt>
            <dd>{`${fmt(sum.otherGroups)}, no course picks it up by itself`}</dd>
          </>
        ) : null}
        {list.isDefault ? (
          <>
            <dt className="text-muted-foreground">New cohorts</dt>
            <dd>{`Get this group of ${skillNounPlural()} automatically`}</dd>
          </>
        ) : null}
      </dl>
    </section>
  )
}

/** The assign mode's footer line: who the list reaches, 10 words or fewer. */
export function assignFooterLine(model: ListsModel, list: SkillList): string {
  const sum = assignmentSummary(model.state, list, model.groups)
  if (sum.groups === 0) return "No student group uses it yet"
  const who = sum.otherGroups === 0 ? plural(sum.cohorts, "cohort", "cohorts") : plural(sum.groups, "group", "groups")
  return `${who}, ${plural(sum.students, "student", "students")} use it`
}

/** The DS Checkbox in a table cell, with its own accessible name. */
export function CheckboxCell({ checked, label, onChange }: { checked: boolean; label: string; onChange: (on: boolean) => void }) {
  return <CheckboxDs checked={checked} aria-label={label} onCheckedChange={(v) => onChange(v === true)} />
}

// ---------------------------------------------------------------------------------------------------------------------
// Completion rule with what would change. A proposal, not REQ: REQ sets achievement per skill (AE-*) and asks for "overall
// attainment" (RP-02) without a list-level rule; the rule comes from the build prompt (section 5) and is an option toggle in
// ledger Q7. Sankalp did not follow it on the assignment step (2026-10-27), so it left the step and lives behind the standalone
// Lists screen's More menu, in this dialog. The data (SkillList.minTotal) is unchanged.

export function RuleDialog({ model, list, open, onClose, onSaved }: { model: ListsModel; list: SkillList; open: boolean; onClose: () => void; onSaved: (f: Feedback) => void }) {
  const [value, setValue] = React.useState(String(list.minTotal))
  React.useEffect(() => setValue(String(list.minTotal)), [list.id, list.minTotal, open])
  const n = Number(value)
  const error = value.trim() === "" ? "Enter a number." : validateMinTotal(list, n)
  const standings = list.groupIds.map((g) => model.standing(list, g)).filter((x): x is GroupStanding => !!x)
  const impact = ruleImpact(standings, list, error ? list.minTotal : n)
  const changed = !error && n !== list.minTotal
  return (
    <Dialog open={open} onOpenChange={(o) => (o ? null : onClose())}>
      <DialogContent className="sm:max-w-lg" data-region="rule">
        <DialogHeader>
          <DialogTitle>{`Completion rule for ${list.name}`}</DialogTitle>
          <DialogDescription>{`When a student counts as done with this ${G()}. Each ${list.noun} keeps its own criteria.`}</DialogDescription>
        </DialogHeader>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span>{`Every required ${list.noun} (${fmt(list.requiredIds.length)}) and at least`}</span>
          <Input id={`min-${list.id}`} type="number" inputMode="numeric" className="w-20" value={value} onChange={(e) => setValue(e.target.value)} aria-label={`Minimum ${list.nounPlural} achieved in total`} aria-invalid={!!error} aria-describedby={error ? `min-err-${list.id}` : undefined} />
          <span>{`of ${fmt(list.skillIds.length)} in total`}</span>
        </div>
        {error ? <p id={`min-err-${list.id}`} className="text-sm text-destructive">{error}</p> : null}
        {!standings.length ? (
          <p className="text-sm text-muted-foreground">Assign a group to see who meets it.</p>
        ) : changed ? (
          <div className="flex flex-col gap-2" aria-live="polite">
            <p className="text-xs font-medium text-muted-foreground">What would change</p>
            <ul className="flex flex-col gap-1.5 text-sm">
              {impact.map((r) => (
                <li key={r.groupId} className="flex items-baseline justify-between gap-3">
                  <span>{r.label}</span>
                  <span className="tabular-nums">
                    <span className="text-muted-foreground">{`${fmt(r.before)} to `}</span>
                    <span className="font-semibold">{fmt(r.after)}</span>
                    <span className="text-muted-foreground">{` of ${fmt(r.students)}`}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Change the minimum to see who would meet it before you save.</p>
        )}
      </div>
        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          {changed ? (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => {
                model.setLists(model.lists.map((l) => (l.id === list.id ? { ...l, minTotal: n } : l)))
                const moved = impact.reduce((a, r) => a + (r.after - r.before), 0)
                onSaved({ title: `Minimum set to ${fmt(n)}`, body: moved === 0 ? "No student changes status." : `${plural(Math.abs(moved), "student", "students")} ${moved > 0 ? "now meet" : "no longer meet"} the rule.` })
                onClose()
              }}
            >
              Save rule
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
