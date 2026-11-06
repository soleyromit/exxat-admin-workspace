"use client"

/**
 * Skill lists: the model hook, the page's actions and the small dialogs around them (designer 2026-11-05, D-L106). A list is like a shared document: you make it, choose who it
 * applies to, and one can be what new student groups get. Who is on a list is added and removed at once, each with a result banner and Undo; there is no Save on the page.
 * The panel is lists-panel.tsx and Add students lists-add-students.tsx. A new standard is a new list; standards are managed in Program details, so a list carries no standards field [CALL 10-26 B.12].
 */
import { skillListNoun, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import * as React from "react"
import { useV2State } from "@/lib/v2/react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { ResultBanner } from "@/components/lab/shared/result-banner"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@exxatdesignux/ui/components/ui/alert-dialog"
import { DiscardChangesDialog, useDialogDiscard, useLeaveGuard } from "@/components/lab/shared/unsaved-guard"
import { useUrlParam } from "@/components/lab/library/library-chrome"
import {
  addToList,
  assign,
  ALL_STUDENTS_GROUP,
  customGroup,
  defaultForNewGroup,
  detachGroup,
  groupRuleOptions,
  leftWithNoList,
  listById,
  listSizeParts,
  makeDefault,
  namesOf,
  namesUpTo,
  newVersion,
  removeStudent,
  renameList,
  ruleIsEmpty,
  skillLists,
  studentGroups,
  studentsForRule,
  unassign,
  GROUP_NAME_MAX,
  LIST_NAME_MAX,
  nameTooLong,
  validateCustomGroup,
  validateListName,
  type GroupRule,
  type SkillList,
  type StudentGroup,
} from "@/lib/lab/lists"
import type { V2State } from "@/lib/v2/types"
import { parseCustomGroup, type CustomGroup } from "@/lib/v2/filters"
import { fmt, plural } from "./parts"
import { customGroupsStore, useLists } from "./use-admin-data"
import { ListPanel, type PanelView } from "@/components/lab/admin-a/lists-panel"
import { AssignWizard, type AddedStudents } from "@/components/lab/admin-a/lists-add-students"
import { ListSetupLevel, NewListPage } from "@/components/lab/admin-a/lists-new-page"
import { useRovingChecks } from "./lists-focus"
import { Checkbox } from "@exxatdesignux/ui/components/ui/checkbox"
import { AppliedFilterChips, FiltersControl, SearchField, type FilterField } from "./parts"
import { Field, FieldError, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { TYPE } from "@/components/lab/type-scale"
import { addStudentsButton, focusPanel, LIST_PANEL, listLink, useFocusBack, useOpeningPress, type FocusBack } from "./lists-focus"

// ---------------------------------------------------------------------------------------------------------------------
// Model

export interface ListsModel {
  state: V2State
  lists: SkillList[]
  groups: StudentGroup[]
  setLists: (next: SkillList[]) => void
  /** Custom groups made this session (filter rules); they also appear in the scope bar's Group filter. */
  addGroup: (g: CustomGroup) => void
  renameGroup: (id: string, name: string) => void
  /** Takes the group off the page. Its lists are the caller's to clear, through `applyNow`. */
  removeGroup: (id: string) => void
  /** Writes a change from the lists as they are now. */
  applyNow: (change: (lists: SkillList[]) => SkillList[]) => void
}

export function useListsModel(snapshot: V2State): ListsModel {
  // The reviewer's snapshot re-reads only on new evidence; a skill added inside a list must show at once.
  const liveSkills = useV2State().skills
  const state = React.useMemo(() => (snapshot.skills === liveSkills ? snapshot : { ...snapshot, skills: liveSkills }), [snapshot, liveSkills])
  const { lists, setLists } = useLists(state)
  const custom = customGroupsStore.use()
  const groups = React.useMemo(() => studentGroups(state, custom), [state, custom])
  const addGroup = React.useCallback((g: CustomGroup) => customGroupsStore.set((prev) => (prev.some((x) => x.id === g.id && !x.removed) ? prev : [...prev.filter((x) => x.id !== g.id), g])), [])
  const upsertGroup = React.useCallback((id: string, name: string, removed: boolean) => {
    customGroupsStore.set((prev) => {
      const rule = parseCustomGroup(id)
      if (!rule) return prev
      return [...prev.filter((x) => x.id !== id), { id, name, rule, ...(removed ? { removed } : {}) }]
    })
  }, [])
  const renameGroup = React.useCallback((id: string, name: string) => upsertGroup(id, name.trim(), false), [upsertGroup])
  const removeGroup = React.useCallback((id: string) => upsertGroup(id, "", true), [upsertGroup])
  const applyNow = React.useCallback((change: (lists: SkillList[]) => SkillList[]) => setLists(change(lists)), [setLists, lists])
  return { state, lists, groups, setLists, addGroup, renameGroup, removeGroup, applyNow }
}

export const GROUP_KIND_LABEL: Record<StudentGroup["kind"], string> = { all: "All students", cohort: "Cohort", track: "Track", custom: "Custom group" }

// ---------------------------------------------------------------------------------------------------------------------
// Actions

export interface Feedback {
  title: string
  body: string
  /** The list it is about. */
  listId?: string
  /** A refusal rather than a result. */
  tone?: "warning"
  /** The next job, or undo. */
  action?: { label: string; href?: string; onClick?: () => void }
}

/** Who a removal is about, once the alert has what it needs to say. */
interface Removing {
  listId: string
  who: { kind: "group"; id: string; label: string } | { kind: "student"; id: string; label: string }
  /** Students it leaves on no list. */
  stranded: number
}

export function useListActions(model: ListsModel) {
  const { lists, setLists, groups } = model
  // Dialogs return to what opened them, the panel to its row: two doors, two memories.
  const back = useFocusBack()
  const panelBack = useFocusBack()
  // The record the panel shows (?list=), as the Library's ?skill=: a reload keeps it and a link can open it.
  const [openId, setOpenId] = useUrlParam("list")
  // The list asked for in the New skill list dialog. It is held here, not on the program, until Save list: every other way out leaves nothing to clean up.
  const [fresh, setFresh] = React.useState<SkillList | null>(null)
  const [view, setView] = React.useState<PanelView>("list")
  const [switchTo, setSwitchTo] = React.useState<string | null>(null)
  const [renaming, setRenaming] = React.useState<string | null>(null)
  const [deleting, setDeleting] = React.useState<SkillList | null>(null)
  const [creating, setCreating] = React.useState(false)
  const [adding, setAdding] = React.useState<{ listId: string; query: string } | null>(null)
  const [removing, setRemoving] = React.useState<Removing | null>(null)
  const [feedback, setFeedback] = React.useState<Feedback | null>(null)
  const panelDirty = React.useRef(false)
  const levelLeave = React.useRef<(() => void) | null>(null)
  // New skill list goes on in this panel: step 2, then step 3 (D-L122).
  const [setup, setSetup] = React.useState<{ listId: string; step: 2 | 3 } | null>(null)
  const levelDirty = React.useRef(false)
  // A double click on New version: the second press makes nothing.
  const versioning = React.useRef(false)

  const shownId = fresh?.id ?? openId
  const shown = fresh ?? listById(lists, openId) ?? null

  /** Every change to who is on a list says so once and can be undone: the banner is replaced by the next result, so the snapshot it holds is never stale. */
  const withUndo = (listId: string, next: SkillList[], title: string) => {
    const before = lists
    setLists(next)
    setFeedback({
      title,
      body: "",
      listId,
      action: {
        label: "Undo",
        onClick: () => {
          setLists(before)
          setFeedback({ title: "Change undone.", body: "", listId })
          requestAnimationFrame(() => { if (!document.activeElement || document.activeElement === document.body) (addStudentsButton() ?? document.querySelector<HTMLElement>("[data-new-list]"))?.focus({ preventScroll: true }) })
        },
      },
    })
  }

  /** One door for a row click and its name: asks while the picker holds unsaved choices, otherwise goes there. */
  const openList = (id: string) => {
    if (id === shownId) return
    if (shownId && (panelDirty.current || levelDirty.current)) return setSwitchTo(id)
    setAdding(null)
    setSetup(null)
    if (!shownId) panelBack.remember(listLink(id))
    setFresh(null)
    setView("list")
    setOpenId(id)
  }
  const closePanel = () => {
    setAdding(null)
    setSetup(null)
    // Leaving a change of skills goes back to the list it started from, unchanged.
    const backToList = !!fresh?.versionOf
    setFresh(null)
    setView("list")
    if (!backToList) setOpenId(null)
  }

  /** Change skills on a list someone has: the skills open ticked, in this panel. Nothing exists until Save (Romit 2026-11-06, D-L119): leaving creates no stray copy, and the students stay where they are. */
  const makeVersion = (id: string) => {
    if (versioning.current) return
    versioning.current = true
    window.setTimeout(() => { versioning.current = false }, 800)
    const created = newVersion(lists, id, `list-${Date.now().toString(36)}`)
    if (!created) return
    if (!shownId) panelBack.remember(listLink(id))
    setOpenId(id)
    setFeedback(null)
    setFresh(created)
    setView("skills")
    requestAnimationFrame(focusPanel)
  }

  const removeNow = (r: Omit<Removing, "stranded">) => {
    const list = listById(lists, r.listId)
    if (!list) return
    const next = r.who.kind === "group" ? unassign(lists, r.listId, r.who.id) : removeStudent(lists, r.listId, r.who.id)
    withUndo(r.listId, next, `${r.who.label} removed from ${list.name}.`)
  }
  const requestRemove = (r: Omit<Removing, "stranded">) => {
    const next = r.who.kind === "group" ? unassign(lists, r.listId, r.who.id) : removeStudent(lists, r.listId, r.who.id)
    const stranded = leftWithNoList(lists, next, groups).length
    if (!stranded) return removeNow(r)
    back.remember(addStudentsButton())
    setRemoving({ ...r, stranded })
  }

  const added = (listId: string, a: AddedStudents) => {
    const list = listById(lists, listId)
    if (!list) return
    const groupNames = a.groupIds.map((id) => groups.find((g) => g.id === id)?.label ?? id)
    const people = a.studentIds.length
    const nameOf = (id: string) => model.state.people.find((p) => p.id === id)?.name ?? id
    const who = [groupNames.length ? namesOf(groupNames) : "", people ? (groupNames.length ? plural(people, "student", "students") : namesUpTo(a.studentIds.map(nameOf))) : ""].filter(Boolean)
    withUndo(listId, addToList(lists, listId, a, groups), a.groupIds.includes(ALL_STUDENTS_GROUP) ? `${list.name} assigned to all students.` : `${list.name} assigned to ${namesOf(who)}.`)
    setAdding(null)
    setSetup(null)
    requestAnimationFrame(focusPanel)
  }

  const setAsDefault = (id: string) => {
    const list = listById(lists, id)
    if (!list) return
    withUndo(id, makeDefault(lists, id), `New student groups now get ${list.name}.`)
    // The switch has just disabled itself (off is not offered): focus stays in the panel.
    requestAnimationFrame(focusPanel)
  }

  const addingList = adding ? listById(lists, adding.listId) ?? null : null
  const setupList = setup ? listById(lists, setup.listId) ?? null : null
  const dialogs = (
    <>
      {creating ? (
        <NewListPage
          model={model}
          onClose={() => setCreating(false)}
          onSaved={(l) => {
            setCreating(false)
            setOpenId(l.id)
            setView("list")
            setFeedback(null)
            setSetup({ listId: l.id, step: 2 })
            requestAnimationFrame(focusPanel)
          }}
        />
      ) : null}
      <ListPanel
        model={model}
        list={creating ? null : shown}
        level={setupList && setup?.step === 2 ? (
          <ListSetupLevel model={model} list={setupList} leaveRef={levelLeave} onBack={() => setSetup(null)} onNext={() => setSetup({ listId: setupList.id, step: 3 })} />
        ) : setupList ? (
          <AssignWizard key={setupList.id} model={model} list={setupList} initialQuery="" stepLabel="Step 3 of 3" leaveRef={levelLeave} dirtyRef={levelDirty} onClose={() => setSetup({ listId: setupList.id, step: 2 })} onAdd={(a) => added(setupList.id, a)} />
        ) : addingList ? <AssignWizard key={addingList.id} model={model} list={addingList} initialQuery={adding?.query ?? ""} leaveRef={levelLeave} dirtyRef={levelDirty} onClose={() => { setAdding(null); requestAnimationFrame(() => addStudentsButton()?.focus({ preventScroll: true })) }} onAdd={(a) => added(addingList.id, a)} /> : null}
        levelLeave={levelLeave}
        isFresh={!!fresh}
        view={view}
        // A result belongs to the level it happened on: moving between levels clears it.
        onView={(v) => { setFeedback(null); setView(v) }}
        dirtyRef={panelDirty}
        back={panelBack}
        onClose={closePanel}
        onSaved={(l, n) => {
          setFeedback({ title: `${l.name} saved, ${plural(n, skillNoun(), skillNounPlural())}.`, body: "", listId: l.id })
          // The next step, in place (365abc25 ch 9): the panel shows the list, with Add students as its one filled button.
          if (fresh?.id === l.id) { setFresh(null); setOpenId(l.id) }
          setView("list")
        }}
        onAddStudents={() => { if (shown) { back.remember(addStudentsButton()); setAdding({ listId: shown.id, query: "" }) } }}
        onRemove={(who) => { if (shown) requestRemove({ listId: shown.id, who }) }}
        onDefault={setAsDefault}
        onNewVersion={makeVersion}
        onRename={(id) => { back.remember(listLink(id)); setRenaming(id) }}
        onDelete={(l) => { back.remember(listLink(l.id)); setDeleting(l) }}
      />
      <DiscardChangesDialog
        open={switchTo !== null}
        onKeep={() => setSwitchTo(null)}
        onDiscard={() => {
          const id = switchTo
          setAdding(null)
          setSetup(null)
          setFresh(null)
          setView("list")
          setOpenId(id)
          setSwitchTo(null)
        }}
        body={`The ${skillNounPlural()} you selected have not been saved.`}
      />
      <RemoveFromListDialog
        target={removing}
        listName={removing ? listById(lists, removing.listId)?.name ?? "" : ""}
        back={back}
        onKeep={() => setRemoving(null)}
        onConfirm={() => { if (removing) removeNow(removing); setRemoving(null) }}
      />
      <NameDialog
        open={!!renaming}
        title={`Rename ${listById(lists, renaming)?.name ?? ""}`}
        id="rename-list"
        initial={listById(lists, renaming)?.name ?? ""}
        maxLength={LIST_NAME_MAX}
        back={back}
        validate={(name) => validateListName(lists, name, renaming ?? undefined)}
        onClose={() => setRenaming(null)}
        onSave={(name) => {
          const was = listById(lists, renaming)?.name
          if (renaming) model.applyNow((ls) => renameList(ls, renaming, name))
          setFeedback({ title: `${was} renamed to ${name}.`, body: "", listId: renaming ?? undefined })
        }}
      />
      <DeleteListDialog
        list={deleting}
        back={back}
        onClose={() => setDeleting(null)}
        onConfirm={(l) => {
          // Row menu or panel menu: the row has gone, and focus lands on New skill list either way. Set on both, since the dialog and the panel each hand focus back as they close.
          const next = document.querySelector<HTMLElement>("[data-new-list]")
          back.point(next)
          panelBack.point(next)
          if (shown?.id === l.id) closePanel()
          setLists(lists.filter((x) => x.id !== l.id))
          setFeedback({ title: `${l.name} deleted.`, body: "", listId: l.id })
          setDeleting(null)
        }}
      />
    </>
  )

  // A result is about one list: it shows on the page or in that list's panel, never in another's, where its Undo would change a list the admin is not looking at. It does not come back.
  const aboutAnother = !!feedback && !!shownId && feedback.listId !== shownId
  React.useEffect(() => {
    if (aboutAnother) setFeedback(null)
  }, [aboutAnother])
  const banner = feedback && !aboutAnother ? (
    <ResultBanner inPanel banner={{ variant: feedback.tone ?? "success", title: feedback.title, body: feedback.body || undefined, action: feedback.action }} onDismiss={() => {
      setFeedback(null)
      // Dismiss has gone with the banner: focus stays where the admin was working.
      requestAnimationFrame(() => { if (document.activeElement === document.body) { if (document.querySelector(LIST_PANEL)) focusPanel(); else document.querySelector<HTMLElement>("[data-new-list]")?.focus({ preventScroll: true }) } })
    }} />
  ) : null

  return {
    // Every door remembers what opened it, while that control is still known (a menu's item is gone a moment later).
    openNew: () => { if (levelDirty.current) return; setAdding(null); setSetup(null); back.remember(); panelBack.remember(); setCreating(true) },
    openRename: (id: string) => { back.remember(listLink(id)); setRenaming(id) },
    openDelete: (l: SkillList) => { back.remember(listLink(l.id)); setDeleting(l) },
    openList,
    /** An old link named a group that is not on this list: Add students, already searching for that group. */
    askToAdd: (listId: string, group: string) => setAdding({ listId, query: group }),
    closePanel,
    openId: shownId,
    makeVersion,
    back,
    dialogs,
    banner,
    setFeedback,
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// Dialogs. z-[90]: they can open over the panel (z-80); the DS gives a dialog z-50.

const LAYER = "z-[90]"

/** A dialog holding typed work: every way out asks first while it is dirty (map E rule 6), and Back does too. */
function useDirtyDialog(open: boolean, dirty: boolean, onClose: () => void) {
  const { close, question } = useDialogDiscard(open && dirty, onClose)
  const leave = useLeaveGuard(open && dirty)
  return {
    close,
    question: (
      <>
        {question}
        <DiscardChangesDialog layer="z-[97]" open={leave.asking} onKeep={() => leave.setAsking(false)} onDiscard={() => leave.go(onClose)} />
      </>
    ),
  }
}

/** One name, Enter saves. The button waits for a change; too long a name is refused with the limit, as soon as it is typed. */
export function NameDialog({ open, title, id, initial, maxLength, back, validate, onClose, onSave }: { open: boolean; title: string; id: string; initial: string; maxLength: number; back: Pick<FocusBack, "onCloseAutoFocus">; validate: (name: string) => string | null; onClose: () => void; /** A string keeps the dialog open and shows it at the field. */ onSave: (name: string) => string | null | void }) {
  const [name, setName] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  // Set while rendering, not in an effect: a commit with the opening name not yet in the field would read as typed work and arm the leave guard. The name it opened on, not one that changes behind the dialog.
  const [wasOpen, setWasOpen] = React.useState(false)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setName(initial)
      setError(null)
    }
  }
  const changed = name.trim() !== initial
  const { close, question } = useDirtyDialog(open, name !== initial, onClose)
  const openingPress = useOpeningPress(open)
  return (
    <>
      <Dialog open={open} onOpenChange={(o) => (o ? null : close())}>
        <DialogContent className={`${LAYER} sm:max-w-md`} overlayClassName={LAYER} aria-describedby={undefined} onCloseAutoFocus={back.onCloseAutoFocus} onInteractOutside={openingPress}>
          <DialogHeader>
            <DialogTitle className="break-words">{title}</DialogTitle>
          </DialogHeader>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (!changed) return
              const err = validate(name)
              if (err) return setError(err)
              const refused = onSave(name.trim())
              if (typeof refused === "string") return setError(refused)
              onClose()
            }}
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={id}>Name</Label>
              <Input id={id} value={name} onChange={(e) => { setName(e.target.value); setError(nameTooLong(e.target.value, maxLength)) }} autoFocus aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} />
              {error ? <p id={`${id}-error`} className="text-sm text-destructive" role="alert">{error}</p> : null}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={close}>Cancel</Button>
              <Button type="submit" variant="default" size="sm" disabled={!changed}>Save name</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {question}
    </>
  )
}

/** Removing a student group from the program: says who it reaches and which lists it holds before anything goes. Evidence belongs to the student, so it stays. */
export function RemoveGroupDialog({ model, group, back, onClose, onDone }: { model: ListsModel; group: StudentGroup | null; back: FocusBack; onClose: () => void; onDone: (f: Feedback) => void }) {
  const using = group ? skillLists(model.lists).filter((l) => l.groupIds.includes(group.id)) : []
  const students = group ? plural(group.studentIds.length, "student", "students") : ""
  const names = namesOf(using.map((l) => l.name))
  return (
    <AlertDialog open={!!group} onOpenChange={(o) => (o ? null : onClose())}>
      <AlertDialogContent className="sm:max-w-md" onCloseAutoFocus={back.onCloseAutoFocus}>
        <AlertDialogHeader>
          <AlertDialogTitle className="break-words">{`Remove ${group?.label ?? "this group"}?`}</AlertDialogTitle>
          <AlertDialogDescription>{using.length ? `It uses ${names}. Its ${students} stop getting ${using.length === 1 ? "that list" : "those lists"} through this group. Evidence is kept.` : `No ${skillListNoun()} uses it. Its ${students} stay in their cohorts.`}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline" size="sm">Keep it</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            size="sm"
            onClick={() => {
              if (!group) return
              model.applyNow((ls) => detachGroup(ls, group.id))
              model.removeGroup(group.id)
              onDone({ title: `${group.label} removed.`, body: using.length ? `${names} no longer ${using.length === 1 ? "uses" : "use"} it.` : "" })
              onClose()
            }}
          >
            Remove group
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/**
 * Create a group from filter rules (category, enrollment year, graduation year) with a live student count [CALL 10-26]. For programs
 * without a lockstep cohort; useful beyond skills. The group joins Add students and the scope bar's Group filter.
 */
/** The form itself, for the Settings dialog and for the Assign to students panel, which shows it in place (designer 2026-11-06: a pop-up over the panel was confusing). */
export function useGroupForm(model: ListsModel, onDone: (f: Feedback, id: string) => void) {
  const ANY = ""
  const [name, setName] = React.useState("")
  const [cat, setCat] = React.useState(ANY)
  const [enr, setEnr] = React.useState(ANY)
  const [grad, setGrad] = React.useState(ANY)
  const [error, setError] = React.useState<string | null>(null)
  const reset = React.useCallback(() => { setName(""); setCat(ANY); setEnr(ANY); setGrad(ANY); setQuery(""); setPicked(new Set()); setError(null) }, [])
  const opts = React.useMemo(() => groupRuleOptions(model.state), [model.state])
  // Filters and search only narrow the list; the group is the students ticked (D-L118).
  const [query, setQuery] = React.useState("")
  const [picked, setPicked] = React.useState<ReadonlySet<string>>(new Set())
  const needle = query.trim().toLowerCase()
  const narrow: GroupRule = { ...(cat ? { category: cat } : {}), ...(enr ? { enrollmentYear: Number(enr) } : {}), ...(grad ? { graduationYear: Number(grad) } : {}) }
  const shown = React.useMemo(() => (ruleIsEmpty(narrow) ? model.state.people.filter((p) => p.kind === "student") : studentsForRule(model.state, narrow)).filter((p) => !needle || p.name.toLowerCase().includes(needle)).sort((x, y) => x.name.localeCompare(y.name)), [model.state, cat, enr, grad, needle]) // eslint-disable-line react-hooks/exhaustive-deps
  const allOn = shown.length > 0 && shown.every((p) => picked.has(p.id))
  const roving = useRovingChecks()
  const rule: GroupRule = { studentIds: [...picked] }
  const count = picked.size
  const dirty = !!name.trim() || count > 0
  const submit = () => {
    const err = validateCustomGroup(model.groups, name, rule)
    if (err) { setError(err); return false }
    const g = customGroup(name.trim(), rule)
    model.addGroup(g)
    // The default is what any new group gets (Aarti, 205da2dd ch 9), written with the group for all to see.
    const start = defaultForNewGroup(model.lists)
    if (start) model.applyNow((ls) => assign(ls, start.id, g.id))
    onDone({ title: `${g.name} created.`, body: `${plural(count, "student", "students")}.${start ? ` On ${start.name}, the default.` : ""}` }, g.id)
    return true
  }
  const narrowBy = (id: string, label: string, value: string, set: (v: string) => void, options: Array<string | number>): FilterField => ({ id, label, value, allLabel: "Any", options: options.map((o) => ({ value: String(o), label: String(o) })), onChange: set })
  const fields: FilterField[] = [
    narrowBy("group-cat", "Enrollment type", cat, setCat, opts.categories),
    narrowBy("group-enr", "Enrolled in", enr, setEnr, opts.enrollmentYears),
    narrowBy("group-grad", "Graduates in", grad, setGrad, opts.graduationYears),
  ]
  const body = (
    <>
      <Field data-invalid={!!error && !name.trim() ? true : undefined}>
        <FieldLabel htmlFor="group-name">Name</FieldLabel>
        <Input id="group-name" value={name} onChange={(e) => { setName(e.target.value); setError(nameTooLong(e.target.value, GROUP_NAME_MAX)) }} autoFocus placeholder="For example, Hybrid re-entry" aria-invalid={!!error} aria-describedby={error ? "group-error" : undefined} />
      </Field>
      <section className="flex min-w-0 flex-col gap-3" aria-labelledby="group-students-heading">
        <div className="flex min-h-8 items-center justify-between gap-2">
          <h2 id="group-students-heading" className={TYPE.group}>Students</h2>
          <p className="text-sm tabular-nums text-muted-foreground" role="status" aria-live="polite" data-group-count={count}>{`${count} selected`}</p>
        </div>
        <div className="flex items-center gap-2">
          <SearchField value={query} onChange={setQuery} label="Search students" placeholder="Search students" className="min-w-0 flex-1" />
          <FiltersControl fields={fields} align="end" layer="z-[92]" />
        </div>
        <AppliedFilterChips fields={fields} />
        {error ? <FieldError id="group-error">{error}</FieldError> : null}
        {shown.length ? (
          <>
            <ul className="flex flex-col rounded-[var(--radius)] border border-border px-3" aria-label="Students" data-group-students={shown.length} {...roving}>
              {shown.map((p) => {
                const id = `group-student-${p.id}`
                return (
                  <li key={p.id} className="flex min-h-11 items-center gap-3 border-b border-border py-1.5 text-sm last:border-b-0 [contain-intrinsic-size:auto_2.75rem] [content-visibility:auto]">
                    <Checkbox id={id} checked={picked.has(p.id)} onCheckedChange={(v) => { setPicked((x) => { const next = new Set(x); if (v === true) next.add(p.id); else next.delete(p.id); return next }); setError(null) }} />
                    <Label htmlFor={id} className="flex min-w-0 flex-1 items-baseline justify-between gap-3 font-normal">
                      <span className="min-w-0 truncate" title={p.name}>{p.name}</span>
                      <span className="shrink-0 text-muted-foreground">{p.cohort ?? ""}</span>
                    </Label>
                  </li>
                )
              })}
            </ul>
            <Button type="button" variant="ghost" size="sm" className="w-fit" onClick={() => setPicked((x) => { const next = new Set(x); for (const p of shown) { if (allOn) next.delete(p.id); else next.add(p.id) } return next })} data-group-all>{allOn ? "Clear all shown" : `Select all ${shown.length} shown`}</Button>
          </>
        ) : <p className="text-sm text-muted-foreground">No students match.</p>}
      </section>
    </>
  )
  return { body, submit, dirty, reset }
}

export function CreateGroupDialog({ model, open, back, onClose, onDone }: { model: ListsModel; open: boolean; back: FocusBack; onClose: () => void; onDone: (f: Feedback) => void }) {
  const form = useGroupForm(model, (f) => onDone(f))
  const { reset } = form
  React.useEffect(() => { if (open) reset() }, [open, reset])
  const { close, question } = useDirtyDialog(open, form.dirty, onClose)
  return (
    <>
    <Dialog open={open} onOpenChange={(o) => (o ? null : close())}>
      <DialogContent className="sm:max-w-lg" aria-describedby={undefined} onCloseAutoFocus={back.onCloseAutoFocus}>
        <DialogHeader>
          <DialogTitle>New student group</DialogTitle>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); if (form.submit()) onClose() }}>
          {form.body}
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={close}>Cancel</Button>
            <Button type="submit" variant="default" size="sm">Create group</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    {question}
    </>
  )
}

/** Only when a removal leaves someone with no list. Any other removal is at once, with Undo. */
function RemoveFromListDialog({ target, listName, back, onKeep, onConfirm }: { target: Removing | null; listName: string; back: FocusBack; onKeep: () => void; onConfirm: () => void }) {
  const who = !target ? "" : target.who.kind === "student" ? `${target.who.label} will have no ${skillListNoun()}. Their evaluations are kept.` : `${plural(target.stranded, "student", "students")} will have no ${skillListNoun()}. Their evaluations are kept.`
  return (
    <AlertDialog open={!!target} onOpenChange={(o) => (o ? null : onKeep())}>
      <AlertDialogContent className={`${LAYER} sm:max-w-md`} overlayClassName={LAYER} data-remove-from-list onCloseAutoFocus={back.onCloseAutoFocus}>
        <AlertDialogHeader>
          <AlertDialogTitle className="break-words">{target ? `Remove ${target.who.label} from ${listName}?` : "Remove"}</AlertDialogTitle>
          <AlertDialogDescription>{who}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline" size="sm">Cancel</AlertDialogCancel>
          <AlertDialogAction variant="default" size="sm" className="h-auto min-h-8 whitespace-normal [overflow-wrap:anywhere]" onClick={onConfirm}>{target ? `Remove ${target.who.label}` : "Remove"}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function DeleteListDialog({ list, back, onClose, onConfirm }: { list: SkillList | null; back: FocusBack; onClose: () => void; onConfirm: (l: SkillList) => void }) {
  const n = list?.skillIds.length ?? 0
  const body = !list ? "" : n === 0 ? `It holds no ${skillNounPlural()}.` : n === 1 ? `It holds 1 ${skillNoun()}. It stays in the library.` : `It holds ${fmt(n)} ${skillNounPlural()}. They stay in the library.`
  return (
    <AlertDialog open={!!list} onOpenChange={(o) => (o ? null : onClose())}>
      <AlertDialogContent className={`${LAYER} sm:max-w-md`} overlayClassName={LAYER} onCloseAutoFocus={back.onCloseAutoFocus}>
        <AlertDialogHeader>
          <AlertDialogTitle className="break-words">{list ? `Delete ${list.name}?` : "Delete"}</AlertDialogTitle>
          <AlertDialogDescription>{body}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline" size="sm">Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" size="sm" onClick={() => { if (list) onConfirm(list) }}>{`Delete ${skillListNoun()}`}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// List sizes, in the program's noun.

/** "154 skills", in the program's noun whatever the list is called. */
export const listSize = (l: Pick<SkillList, "skillIds">): string => {
  const n = l.skillIds.length
  return `${fmt(n)} ${n === 1 ? skillNoun() : skillNounPlural()}`
}

/** "154 skills, 2 inactive": what the Skill lists table and the panel both say. */
export const listSizeText = (s: V2State, l: Pick<SkillList, "skillIds">): string => {
  const { inactive } = listSizeParts(s, l)
  return inactive ? `${listSize(l)}, ${inactive} inactive` : listSize(l)
}
