"use client"

/**
 * The list's draft for Add skills, variant H (D-ADD1117, Decided): what the panel added, shown on the list as Unsaved rows until Save changes or Discard.
 * - Header: "n unsaved changes", Discard, Save changes (the prototype's draft then save).
 * - Save on a list students use, that already had skills: "Who gets these changes?" (Everyone on this list, or A new list; the spec's simplified copy, flagged for content
 *   review). Otherwise it saves at once and says so in a LocalBanner, never a toast.
 * - "A new list": name, who gets it (cohorts and groups), the overlap said in one line, a description on request; Create list saves the new list with the draft, leaves the
 *   original as it was saved, opens the new list and says "New list created. {Original} is unchanged." (decision 3).
 * A skill created in the panel reaches the library only here, on Save (decision 1).
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Checkbox } from "@exxatdesignux/ui/components/ui/checkbox"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@exxatdesignux/ui/components/ui/command"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@exxatdesignux/ui/components/ui/popover"
import { Textarea } from "@exxatdesignux/ui/components/ui/textarea"
import { StatusBadge } from "@exxatdesignux/ui"
import { useV2State, useV2Store } from "@/lib/v2/react"
import { DEMO_TODAY, IDS } from "@/lib/v2/seed-core"
import { longDate, plural } from "@/lib/v2/format"
import { ABOVE_PANEL, ABOVE_PANEL_MENU } from "@/components/lab/overlay-layer"
import { TYPE } from "@/components/lab/type-scale"
import { customGroupsStore } from "@/components/lab/admin-a/use-admin-data"
import { pushPageUrl } from "@/components/lab/shared/unsaved-guard"
import { focusAfterBanner } from "@/components/lab/shared/focus"
import { buildLibrary, countLibrary, type LibraryRow } from "@/lib/lab/library"
import { ALL_STUDENTS_GROUP, LIST_NAME_MAX, createList, detachGroup, groupLabel, skillLists, studentCount, studentGroups, studentsOnList, validateListName, type SkillList, type StudentGroup } from "@/lib/lab/lists"
import { applyDraft, draftListChange, newIntakeName, type DraftEntry } from "@/lib/lab/list-draft"
import { countSkills } from "@/lib/lab/terms"
import type { LibraryApi } from "./use-library"

const ACTOR = IDS.ross
const at = () => `${DEMO_TODAY}T${new Date().toISOString().slice(11)}`
const KIND_HEADING: Record<string, string> = { all: "Everyone", cohort: "Cohorts", track: "Tracks", custom: "Groups" }

/** The draft, its preview on the page and its save. Off (no rows, no header) unless `enabled`. */
export function useListDraft(api: LibraryApi, enabled: boolean) {
  const store = useV2Store()
  const state = useV2State()
  const custom = customGroupsStore.use()
  const list = api.list
  const [entries, setEntries] = React.useState<DraftEntry[]>([])
  const [asking, setAsking] = React.useState<"who" | "new-list" | null>(null)
  // A different list (Create list opens the new one) starts with no draft. So does the lab's Reset edits.
  const listId = list?.id
  React.useEffect(() => { setEntries([]); setAsking(null) }, [listId])
  React.useEffect(() => {
    const onReset = () => { setEntries([]); setAsking(null) }
    window.addEventListener("lab:reset", onReset)
    return () => window.removeEventListener("lab:reset", onReset)
  }, [])
  const active = enabled && !!list && entries.length > 0
  const ids = React.useMemo(() => new Set(entries.map((e) => e.id)), [entries])
  // The store as Save will leave it: the Unsaved rows show their method and times from the same computation as the save.
  const preview = React.useMemo(() => (active ? applyDraft(state, entries, { actorId: ACTOR, at: `${DEMO_TODAY}T00:00:00.000Z` }) : state), [active, state, entries])
  const rows = React.useMemo<LibraryRow[]>(() => {
    if (!active) return api.rows
    const built = new Map(buildLibrary(preview).map((r) => [r.id, r]))
    // From the preview, so a renamed or moved library skill reads as it will after Save; its courses and lists stay the saved row's.
    const extra = entries.map((e) => {
      const was = api.byId.get(e.id)
      const b = built.get(e.id)
      return b ? { ...b, isNew: false, courses: was?.courses ?? 0, mandatoryCourses: was?.mandatoryCourses ?? 0, onLists: was?.onLists ?? 0 } : was ?? null
    }).filter((r): r is LibraryRow => !!r)
    return [...api.rows.filter((r) => !ids.has(r.id)), ...extra]
  }, [active, api.rows, api.byId, preview, entries, ids])
  const counts = React.useMemo(() => countLibrary(rows), [rows])
  const groups = React.useMemo(() => studentGroups(state, custom), [state, custom])
  const students = list ? studentCount(list, groups) : 0

  const add = (more: DraftEntry[]) => setEntries((now) => [...now.filter((e) => !more.some((m) => m.id === e.id)), ...more])
  const discard = () => { setEntries([]); setAsking(null) }

  /** Writes the store (new skills, methods, times) once. */
  const writeSkills = () => {
    const fresh = entries.filter((e) => e.isNew).length
    store.update((s) => applyDraft(s, entries, { actorId: ACTOR, at: at(), ...(fresh ? { batch: { id: `add-skills-${Date.now().toString(36)}`, label: `Add skills, ${longDate(DEMO_TODAY)}`, ...(list ? { listId: list.id } : {}) } } : {}) }))
  }
  const madeHere = () => { const n = entries.filter((e) => e.isNew).length; return n ? ` ${n} ${n === 1 ? "is" : "are"} new in the library.` : "" }

  const saveForEveryone = () => {
    if (!list) return
    const change = draftListChange(list, entries)
    writeSkills()
    api.setLists(api.lists.map((l) => (l.id === list.id ? { ...l, ...change } : l)))
    api.setBanner({ variant: "success", title: `${countSkills(entries.length)} added to ${list.name}.${madeHere()}` })
    setEntries([])
    setAsking(null)
    focusAfterBanner()
  }
  /** Save changes: asks who gets them when students use a list that already had skills; otherwise saves for the list as it is. */
  const save = () => {
    if (!list || !entries.length) return
    if (students > 0 && list.skillIds.length > 0) { setAsking("who"); return }
    saveForEveryone()
  }
  const createNewList = (input: { name: string; groupIds: string[]; description: string }) => {
    if (!list) return
    const change = draftListChange(list, entries)
    const base = createList(api.lists, { name: input.name, noun: list.noun, nounPlural: list.nounPlural, standard: input.description, fromListId: list.id }, `list-${Date.now().toString(36)}`)
    const made: SkillList = { ...base, ...change, groupIds: [...input.groupIds], isDefault: false }
    // One list per cohort or group: a picked one leaves the list it was on (D-LS1116-d). The original keeps its skills as saved.
    const moved = input.groupIds.reduce<SkillList[]>((acc, g) => detachGroup(acc, g), api.lists)
    writeSkills()
    api.setLists([...moved, made])
    const original = list.name
    setEntries([])
    setAsking(null)
    const q = new URLSearchParams(window.location.search)
    q.set("list", made.id)
    pushPageUrl(`${window.location.pathname}?${q.toString()}`)
    api.setBanner({ variant: "success", title: `New list created. ${original} is unchanged.` })
    focusAfterBanner()
  }

  return { allLists: api.lists, enabled, active, entries, ids, rows, counts, preview, students, groups, add, discard, save, saveForEveryone, createNewList, asking, setAsking }
}

export type ListDraft = ReturnType<typeof useListDraft>

/** The header while the list has unsaved changes: the count, Discard, Save changes (the one filled button). */
export function DraftHeaderActions({ draft }: { draft: ListDraft }) {
  if (!draft.active) return null
  const n = draft.entries.length
  return (
    <div className="flex items-center gap-2" data-h-draft-bar>
      <span className="text-sm tabular-nums text-muted-foreground" role="status" aria-live="polite" data-h-unsaved={n}>{`${n} unsaved ${n === 1 ? "change" : "changes"}`}</span>
      <Button type="button" variant="ghost" size="sm" onClick={draft.discard} data-h-discard>Discard</Button>
      <Button type="button" variant="default" size="sm" onClick={draft.save} data-h-save>Save changes</Button>
    </div>
  )
}

/** "Who gets these changes?" (spec 3.6). Each choice is a button that names its scope; the close icon keeps the changes unsaved. */
export function WhoGetsDialog({ draft, listName }: { draft: ListDraft; listName: string }) {
  const n = draft.students
  const who = plural(n, "student", "students")
  return (
    <Dialog open={draft.asking === "who"} onOpenChange={(o) => { if (!o) draft.setAsking(null) }}>
      <DialogContent className={`sm:max-w-md ${ABOVE_PANEL}`} overlayClassName={ABOVE_PANEL} data-h-who-gets>
        <DialogHeader>
          <DialogTitle>Who gets these changes?</DialogTitle>
          <DialogDescription>{`${who} already use this list.`}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3" role="group" aria-label="Who gets these changes">
          <Button type="button" variant="outline" size="lg" className="h-auto w-full flex-col items-start gap-1 whitespace-normal py-3 text-start" onClick={draft.saveForEveryone} data-h-who="everyone">
            <span className={TYPE.label}>Everyone on this list</span>
            <span className={TYPE.helper}>{`All ${who} get the changes. Their past evaluations still count.`}</span>
          </Button>
          <Button type="button" variant="outline" size="lg" className="h-auto w-full flex-col items-start gap-1 whitespace-normal py-3 text-start" onClick={() => draft.setAsking("new-list")} data-h-who="new">
            <span className={TYPE.label}>A new list</span>
            <span className={TYPE.helper}>{`Current students keep ${listName} as it is. Next, you choose who gets the new one.`}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** "A new list" (spec 3.7). Create list stays disabled until there is a name and at least one cohort or group; each field says what it still needs. */
export function NewListFromDraftDialog({ draft, list }: { draft: ListDraft; list: SkillList }) {
  const open = draft.asking === "new-list"
  const all = skillLists(draft.allLists)
  const [name, setName] = React.useState("")
  const [picks, setPicks] = React.useState<string[]>([])
  const [describing, setDescribing] = React.useState(false)
  const [description, setDescription] = React.useState("")
  const [menu, setMenu] = React.useState(false)
  React.useEffect(() => {
    if (!open) return
    setName(newIntakeName(list.name)); setPicks([]); setDescribing(false); setDescription(`Changes to ${list.name}, for students from here on.`)
  }, [open, list.name])
  const nameError = name.trim() ? validateListName(all, name) : null
  // All students only when no other list already covers everyone (spec 3.7).
  const allTaken = all.some((l) => l.groupIds.includes(ALL_STUDENTS_GROUP))
  const offered = draft.groups.filter((g) => g.kind !== "all" || !allTaken)
  const kinds = (["all", "cohort", "track", "custom"] as const).filter((k) => offered.some((g) => g.kind === k))
  const reach = studentsOnList({ groupIds: picks, studentIds: [] }, draft.groups)
  const each = list.skillIds.length + draft.entries.filter((e) => !list.skillIds.includes(e.id)).length
  // Students picked here who use another list today: saving moves them (one list per cohort or group).
  const overlap = React.useMemo(() => {
    const out: Array<{ list: SkillList; students: number }> = []
    for (const l of all) {
      const theirs = studentsOnList(l, draft.groups)
      const n = [...reach].filter((id) => theirs.has(id)).length
      if (n && picks.some((g) => l.groupIds.includes(g))) out.push({ list: l, students: n })
    }
    return out
  }, [all, draft.groups, reach, picks])
  const canCreate = !!name.trim() && !nameError && picks.length > 0
  const toggle = (id: string) => setPicks((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  const submit = () => { if (canCreate) draft.createNewList({ name: name.trim(), groupIds: picks, description: describing ? description.trim() : "" }) }
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) draft.setAsking(null) }}>
      <DialogContent className={`sm:max-w-[500px] ${ABOVE_PANEL}`} overlayClassName={ABOVE_PANEL} data-h-new-list>
        <DialogHeader>
          <DialogTitle>A new list</DialogTitle>
          <DialogDescription>{`Current students keep ${list.name} as it is.`}</DialogDescription>
        </DialogHeader>
        <form id="h-new-list-form" className="flex flex-col gap-4" noValidate onSubmit={(e) => { e.preventDefault(); submit() }}>
          <Field data-invalid={nameError ? true : undefined}>
            <FieldLabel htmlFor="h-new-list-name">Name</FieldLabel>
            <Input id="h-new-list-name" value={name} maxLength={LIST_NAME_MAX + 20} onChange={(e) => setName(e.target.value)} aria-invalid={!!nameError} aria-describedby="h-new-list-name-hint" autoComplete="off" data-h-new-list-name />
            {nameError ? <FieldError id="h-new-list-name-hint">{nameError}</FieldError> : !name.trim() ? <p id="h-new-list-name-hint" className={TYPE.meta}>Give the list a name.</p> : null}
          </Field>
          <Field>
            <FieldLabel id="h-who-label">Who gets it</FieldLabel>
            <Popover open={menu} onOpenChange={setMenu}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="default" className="h-auto min-h-10 w-full justify-between gap-2 py-1.5 font-normal" aria-describedby="h-who-hint" data-h-who-trigger>
                  <span className="sr-only">Who gets it: </span>
                  <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
                    {picks.length ? picks.map((id) => <StatusBadge key={id} label={groupLabel(draft.groups, id)} tone="neutral" size="sm" />) : <span className="text-muted-foreground">Add a cohort or group</span>}
                  </span>
                  <i className="fa-light fa-chevron-down text-xs" aria-hidden="true" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className={`${ABOVE_PANEL_MENU} w-[var(--radix-popover-trigger-width)] p-0`}>
                <Command>
                  <CommandInput placeholder="Find a cohort or group" aria-label="Find a cohort or group" />
                  <CommandList>
                    <CommandEmpty>No cohort or group matches.</CommandEmpty>
                    {kinds.map((k) => (
                      <CommandGroup key={k} heading={KIND_HEADING[k]}>
                        {offered.filter((g) => g.kind === k).map((g: StudentGroup) => (
                          <CommandItem key={g.id} value={g.label} onSelect={() => toggle(g.id)} data-h-who-option={g.id}>
                            <Checkbox checked={picks.includes(g.id)} aria-hidden="true" tabIndex={-1} className="pointer-events-none" />
                            <span className="min-w-0 truncate">{g.label}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <p id="h-who-hint" className={TYPE.meta} data-h-reach>
              {picks.length ? `${plural(reach.size, "student", "students")} · each needs ${countSkills(each)}` : "Choose at least one cohort or group."}
            </p>
            {overlap.map((o) => (
              <p key={o.list.id} className="text-sm text-[var(--status-badge-warning-fg)]" data-h-overlap>{`${o.students} of these students use ${o.list.name} today. Saving moves them to this list.`}</p>
            ))}
          </Field>
          {describing ? (
            <Field>
              <FieldLabel htmlFor="h-new-list-description">Description</FieldLabel>
              <Textarea id="h-new-list-description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            </Field>
          ) : (
            <div className="flex">
              <Button type="button" variant="link" size="sm" className="h-auto p-0 font-normal" onClick={() => setDescribing(true)} data-h-new-list-more>Add a description</Button>
            </div>
          )}
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={() => draft.setAsking("who")} data-h-new-list-back>Back</Button>
          <Button type="button" variant="default" size="sm" disabled={!canCreate} onClick={submit} data-h-create-list>Create list</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
