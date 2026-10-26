"use client"

/**
 * Lists and cohort assignment building blocks: the model hook, the lists table, the completion rule with "what would change", and
 * the dialogs that keep every change visible before it lands (attach to a group that already uses a list of the same noun, detach,
 * make default, start a new list). A new standard is a new list; standards themselves are managed in Program details, so a list
 * carries no standards field [CALL 10-26 B.12]. Nothing replaces a program's established list silently [CALL].
 */
import { skillNoun, skillNounPlural } from "@/lib/lab/terms"
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { Checkbox as CheckboxDs } from "@exxatdesignux/ui/components/ui/checkbox"
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
      setFeedback({ title: `${groupLabel(groups, groupId)} now uses ${list?.name ?? "this list"}`, body: check.existing.length ? `It keeps ${check.existing.map((l) => l.name).join(" and ")}. Each list is its own report.` : "Its students see the list on their progress page." })
    },
    [lists, setLists, groups],
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
          setFeedback({ title: `${listById(lists, id)?.name} is the default`, body: "New cohorts get it automatically. Existing groups keep their lists." })
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
          <DialogDescription>Pick students by rules. The group updates as students change, and lists can be assigned to it.</DialogDescription>
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
          <DialogTitle>{`Attach ${list?.name ?? "this list"} to ${group}`}</DialogTitle>
          <DialogDescription>{old ? `${group} already uses ${old.name}.` : list?.status === "draft" ? "This list is a draft. Attaching it makes it live for this group." : ""}</DialogDescription>
        </DialogHeader>
        {old ? (
          <RadioGroup value={mode} onValueChange={(v) => setMode(v as AssignMode)} className="gap-3">
            <div className="flex items-start gap-2">
              <RadioGroupItem id="attach-add" value="add" className="mt-0.5" />
              <Label htmlFor="attach-add" className="flex flex-col items-start gap-0.5 font-normal">
                <span className="font-medium">Add as a second list</span>
                <span className="text-xs text-muted-foreground">{`Students see both. Each list is its own report.`}</span>
              </Label>
            </div>
            <div className="flex items-start gap-2">
              <RadioGroupItem id="attach-move" value="move" className="mt-0.5" />
              <Label htmlFor="attach-move" className="flex flex-col items-start gap-0.5 font-normal">
                <span className="font-medium">{`Move ${group} to this list`}</span>
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
              onDone({ title: `${group} now uses ${list.name}`, body: old && mode === "move" ? `${old.name} no longer shows for ${group}. Evidence is kept.` : old ? `It keeps ${old.name}. Each list is its own report.` : "The list is live for this group." })
              onClose()
            }}
          >
            {old && mode === "move" ? "Move group" : "Attach"}
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
          <DialogTitle>{`Stop using ${list?.name ?? "this list"} for ${group}?`}</DialogTitle>
          <DialogDescription>{`${group} students stop seeing this list. Evidence stays on each record and counts again if you attach it later.`}</DialogDescription>
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
          <DialogTitle>{`Make ${list?.name ?? "this list"} the default?`}</DialogTitle>
          <DialogDescription>{`New cohorts get it automatically${current ? ` instead of ${current.name}` : ""}. Existing groups keep the lists they use.`}</DialogDescription>
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
          <DialogTitle>Start a new list</DialogTitle>
          <DialogDescription>It starts as a draft. Live lists and their evidence stay as they are.</DialogDescription>
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
            onDone({ title: `${created.name} created as a draft`, body: "No student sees it until you attach it to a group." })
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
                <Label htmlFor="from-empty" className="font-normal">An empty list</Label>
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
            <Button type="submit" variant="default" size="sm">Create draft</Button>
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
  const rows: ListRow[] = model.lists.map((l) => ({ id: l.id, list: l, name: l.name, size: l.skillIds.length, groups: l.groupIds.length }))
  const columns = React.useMemo<ColumnDef<ListRow>[]>(
    () => [
      {
        key: "name",
        label: "List",
        width: 340,
        sortable: true,
        cell: (r) => (
          <span className="flex min-w-0 items-center gap-2 py-0.5">
            <Link className={`${LINK} truncate`} href={hrefFor(r.id)} scroll={false} onClick={(e) => e.stopPropagation()} aria-current={r.id === selectedId ? "true" : undefined}>{r.name}</Link>
            {r.list.isDefault ? <Badge variant="secondary">Default</Badge> : null}
          </span>
        ),
      },
      { key: "size", label: "Size", width: 200, sortable: true, cell: (r) => <span className="tabular-nums">{`${countNoun(r.list, r.size)}, ${fmt(r.list.requiredIds.length)} required`}</span> },
      {
        key: "groups",
        label: "Used by",
        width: 300,
        sortable: true,
        cell: (r) => (r.groups === 0 ? <span className="text-muted-foreground">No group yet</span> : <span className="truncate">{r.list.groupIds.map((g) => groupLabel(model.groups, g)).join(", ")}</span>),
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
        emptyState={<p className="p-4 text-sm text-muted-foreground">No lists yet.</p>}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Groups for one list (variant A)

interface GroupRow extends Record<string, unknown> {
  id: string
  label: string
  kind: string
  students: number
  uses: boolean
  standing: GroupStanding | null
}

export function GroupsForList({ model, list, onToggle }: { model: ListsModel; list: SkillList; onToggle: (groupId: string, on: boolean) => void }) {
  const rows: GroupRow[] = model.groups.map((g) => {
    const uses = list.groupIds.includes(g.id)
    return { id: g.id, label: g.label, kind: GROUP_KIND_LABEL[g.kind], students: g.studentIds.length, uses, standing: uses ? model.standing(list, g.id) : null }
  })
  const req = list.requiredIds.length
  const columns: ColumnDef<GroupRow>[] = [
    {
      key: "uses",
      label: "Using this list",
      width: 128,
      resizable: false,
      // A visible header: a bare column of checkboxes did not say what ticking one does (UX critique 2026-10-26).
      header: () => <span>Using this list</span>,
      cell: (r) => <CheckboxCell checked={r.uses} label={`${r.label} uses ${list.name}`} onChange={(on) => onToggle(r.id, on)} />,
    },
    { key: "label", label: "Student group", width: 180, cell: (r) => <span className="flex flex-col py-0.5"><span className="font-medium">{r.label}</span><span className="text-xs text-muted-foreground">{`${r.kind} · ${plural(r.students, "student", "students")}`}</span></span> },
    {
      key: "meeting",
      label: "Meet the rule",
      width: 130,
      cell: (r) => (r.standing ? <span className="tabular-nums">{`${fmt(r.standing.meeting)} of ${fmt(r.standing.students)}`}</span> : <span className="text-muted-foreground">Not using</span>),
    },
    {
      key: "median",
      label: "Median achieved",
      width: 190,
      cell: (r) =>
        !r.standing ? null : r.standing.medianTotal === null ? (
          <span className="text-muted-foreground">Too few to show</span>
        ) : (
          <span className="tabular-nums">{`${fmt(r.standing.medianTotal)} of ${fmt(list.skillIds.length)} · ${fmt(r.standing.medianRequired ?? 0)} of ${fmt(req)} required`}</span>
        ),
    },
  ]
  return (
    <DataTable<GroupRow>
      data={rows}
      columns={columns}
      getRowId={(r) => r.id}
      searchable={false}
      showQueryControls={false}
      edgeInset={false}
      emptyState={<p className="p-4 text-sm text-muted-foreground">No student groups yet.</p>}
    />
  )
}

/** The DS Checkbox in a table cell, with its own accessible name. */
export function CheckboxCell({ checked, label, onChange }: { checked: boolean; label: string; onChange: (on: boolean) => void }) {
  return <CheckboxDs checked={checked} aria-label={label} onCheckedChange={(v) => onChange(v === true)} />
}

// ---------------------------------------------------------------------------------------------------------------------
// Completion rule with what would change

export function RuleCard({ model, list, onSaved }: { model: ListsModel; list: SkillList; onSaved: (f: Feedback) => void }) {
  const [value, setValue] = React.useState(String(list.minTotal))
  React.useEffect(() => setValue(String(list.minTotal)), [list.id, list.minTotal])
  const n = Number(value)
  const error = value.trim() === "" ? "Enter a number." : validateMinTotal(list, n)
  const standings = list.groupIds.map((g) => model.standing(list, g)).filter((x): x is GroupStanding => !!x)
  const impact = ruleImpact(standings, list, error ? list.minTotal : n)
  const changed = !error && n !== list.minTotal
  return (
    <Card size="sm" data-region="rule" className="self-start">
      <CardHeader>
        <CardTitle className="text-base">Completion rule</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span>{`Every required ${list.noun} (${fmt(list.requiredIds.length)}) and at least`}</span>
          <Input id={`min-${list.id}`} type="number" inputMode="numeric" className="w-20" value={value} onChange={(e) => setValue(e.target.value)} aria-label={`Minimum ${list.nounPlural} achieved in total`} aria-invalid={!!error} aria-describedby={error ? `min-err-${list.id}` : undefined} />
          <span>{`of ${fmt(list.skillIds.length)} in total`}</span>
        </div>
        {error ? <p id={`min-err-${list.id}`} className="text-sm text-destructive">{error}</p> : null}
        {!standings.length ? (
          <p className="text-sm text-muted-foreground">Attach a group to see who meets it.</p>
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
        {changed ? (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => {
                model.setLists(model.lists.map((l) => (l.id === list.id ? { ...l, minTotal: n } : l)))
                const moved = impact.reduce((a, r) => a + (r.after - r.before), 0)
                onSaved({ title: `Minimum set to ${fmt(n)}`, body: moved === 0 ? "No student changes status." : `${plural(Math.abs(moved), "student", "students")} ${moved > 0 ? "now meet" : "no longer meet"} the rule.` })
              }}
            >
              Save rule
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setValue(String(list.minTotal))}>Cancel</Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
