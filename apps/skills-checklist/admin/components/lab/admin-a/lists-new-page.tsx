"use client"

/**
 * New skill list, the start of setup [Aarti and Sankalp, 741d1f1c ch 9-10, D-L122]: step 1 names the list; step 2 adds skills, where the library is the step
 * (AddSkillsStep in lists-add-skills-step.tsx, D-L156: tick, Copy a list, select all, search or add); step 3 configures (optional); step 4 assigns. Course mapping is separate.
 */
import * as React from "react"
import { usePresent } from "@/components/lab/lab-bar/present"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@exxatdesignux/ui/components/ui/input-group"
import { railTriggerProps } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { FloatingSheetPanel } from "@/components/lab/shared/sheet"
import { FloatingSheetPanelBody, FloatingSheetPanelContent, FloatingSheetPanelHeader, FloatingSheetPanelToolbar, FloatingSheetPanelWorkflowFooter } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { Field, FieldError, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { DISCARD_TITLE, DiscardChangesDialog, useLeaveGuard } from "@/components/lab/shared/unsaved-guard"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@exxatdesignux/ui/components/ui/alert-dialog"
import { ABOVE_PANEL } from "@/components/lab/overlay-layer"
import { parseTimes, progressChanges } from "@/components/lab/library/times-needed"
import { TIMES_MAX, setTimesNeededMany, timesCellOf, timesNeededImpact } from "@/lib/lab/program-settings"
import { ASSIGN_UNSAVED, createList, renameList, setListSkills, startFromOptions, validateListName, validateNewList, type SkillList } from "@/lib/lab/lists"
import { capitalize, countSkills, skillListNoun, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { fmt } from "./parts"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import type { ListsModel } from "./lists-parts"
import { AddSkillsStep, ADD_SKILLS_ALL, ADD_SKILLS_SEARCH } from "./lists-add-skills-step"
import { StatusBadge } from "@exxatdesignux/ui"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { useLabHref } from "@/components/lab/lab-bar/page-context"
import { TimesNeededCell } from "@/components/lab/library/times-needed"
import { configureManyLabel, useConfigureMany } from "@/components/lab/library/configure-many"
import { useV2Store } from "@/lib/v2/react"
import { DEMO_TODAY, IDS } from "@/lib/v2/seed-core"
import { CONFIGURATION_META, EMPTY_DRAFT, addSkillsToStore, configureHref, draftToSkill, normName, type AddedSkill } from "@/lib/lab/library"
import { configurationOf, programSettingsOf } from "@/lib/lab/program-settings"
import { SettingsSummary } from "@/components/lab/library/settings-summary"
import { TYPE } from "@/components/lab/type-scale"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { fromSetup } from "@/lib/lab/return-to"

/** Esc in a field that holds text clears the text (its own handler) and closes nothing: the panel's Esc waits for an empty field. */
export const escClears = (e: KeyboardEvent): boolean => {
  const t = e.target as HTMLInputElement | null
  if (t?.matches?.("[data-esc-clears]") && t.value) { e.preventDefault(); return true }
  return false
}

export function NewListPage({ model, onClose, onSaved, editList }: { model: ListsModel; onClose: () => void; onSaved: (l: SkillList, n: number) => void; /** Back from step 3: the saved list opens again on step 2, and Save and continue updates it instead of making another. */ editList?: SkillList }) {
  const { present } = usePresent()
  useLabHref()
  const store = useV2Store()
  const [name, setName] = React.useState(editList?.name ?? "")
  // Name first, then the skills under it (Sankalp 2026-11-15, ADMIN-D6 amendment a). Nothing is saved at step 1.
  const [stage, setStage] = React.useState<"name" | "skills">(editList ? "skills" : "name")
  // Stored oldest first; the rows show newest first.
  const [picked, setPicked] = React.useState<ReadonlySet<string>>(() => new Set(editList ? [...editList.skillIds].reverse() : []))
  const [nameError, setNameError] = React.useState<string | null>(null)
  const [skillError, setSkillError] = React.useState<string | null>(null)
  const [asking, setAsking] = React.useState(false)
  // Step 2 v3: the search text of the Add skills table (find or add); counted as unsaved.
  const [typed, setTyped] = React.useState("")
  // A name already on the list says so under the field and keeps the text; the polite line tells a screen reader what was added, since the field clears.
  const [typedError, setTypedError] = React.useState<string | null>(null)
  const [announce, setAnnounce] = React.useState("")
  // Skills added here, whose category can still be set here. A skill that already has one keeps it: that is the Library's to change.
  const [addedHere, setAddedHere] = React.useState<ReadonlySet<string>>(new Set())
  const stamp = () => `${DEMO_TODAY}T${new Date().toISOString().slice(11)}`
  const rows = React.useMemo(() => model.state.skills.filter((k) => k.active !== false).sort((a, b) => a.name.localeCompare(b.name)), [model.state])
  const byId = React.useMemo(() => new Map(rows.map((k) => [k.id, k])), [rows])
  // Newest first: what was just added sits under the field, so it is seen without scrolling a long list. `picked` keeps the order things were added.
  const onList = React.useMemo(() => [...picked].reverse().flatMap((id) => { const k = byId.get(id); return k ? [k] : [] }), [picked, byId])
  const others = startFromOptions(model.lists)
  const dirty = editList ? name.trim() !== editList.name || picked.size !== editList.skillIds.length || editList.skillIds.some((id) => !picked.has(id)) || !!typed.trim() : !!name.trim() || picked.size > 0 || !!typed.trim()
  // Esc steps back one level (the footer's Back says Esc); X and a press outside leave the flow for the Skill lists table (Sankalp point 7).
  const escaped = React.useRef(false)
  const leave = useLeaveGuard(dirty)
  const unsaved = editList ? "Your changes to this list have not been saved." : "This list has not been saved."
  const noun = skillNoun()
  const FIELD = `#${ADD_SKILLS_SEARCH}`
  const focusOn = (sel: string) => requestAnimationFrame(() => document.querySelector<HTMLElement>(sel)?.focus({ preventScroll: true }))
  const cancel = () => (dirty ? setAsking(true) : onClose())
  const nameErrorOf = () => (editList ? validateListName(model.lists, name, editList.id) : validateNewList(model.lists, { name, noun, nounPlural: skillNounPlural(), standard: "", fromListId: null }))
  const goSkills = () => {
    const err = nameErrorOf()
    setNameError(err)
    if (err) return focusOn("#list-name")
    setStage("skills")
    // Step 2 v3: focus starts in the search (typing is the quickest way to a skill); Tab reaches the header box and the rows.
    focusOn(FIELD)
  }
  const backToName = () => { setStage("name"); focusOn("#list-name") }
  const addTyped = (raw: string) => {
    // One name, or a pasted list, one per line. A name already in the library goes on the list as it is; one already on the list is not added twice.
    const names = [...new Set(raw.split(/\r?\n/).map((n) => n.trim().replace(/\s+/g, " ")).filter(Boolean))]
    if (!names.length) return
    const existing = new Map(model.state.skills.map((k) => [normName(k.name), k.id]))
    const fresh: AddedSkill[] = []
    const ids: string[] = []
    const already: string[] = []
    names.forEach((n, i) => {
      const had = existing.get(normName(n))
      if (had && picked.has(had)) { already.push(n); return }
      if (had) { ids.push(had); return }
      const id = `lab-skill-${Date.now().toString(36)}-${i}`
      fresh.push(draftToSkill({ ...EMPTY_DRAFT, name: n }, id))
      ids.push(id)
    })
    if (!ids.length) {
      setTypedError(already.length === 1 ? `${already[0]} is already on this list.` : `These ${skillNounPlural()} are already on this list.`)
      focusOn(FIELD)
      return
    }
    if (fresh.length) {
      store.update((st) => addSkillsToStore(st, fresh, IDS.ross, stamp()))
      setAddedHere((x) => new Set([...x, ...fresh.map((k) => k.id)]))
    }
    // Stored in reverse so a pasted list reads top to bottom in the order it was pasted.
    setPicked((x) => new Set([...x, ...[...ids].reverse()]))
    setTypedError(null)
    setSkillError(null)
    setAnnounce(ids.length === 1 ? `Added ${names.find((n) => !already.includes(n)) ?? ""}.` : `Added ${countSkills(ids.length)}.`)
    // Step 2 v3: one new skill keeps its name in the search, so its row shows ticked with "Select category", which takes focus. Else the search clears.
    if (fresh.length === 1 && ids.length === 1) {
      setTyped(fresh[0].name)
      requestAnimationFrame(() => focusOn(`#category-${fresh[0].id}`))
      return
    }
    setTyped("")
    focusOn(FIELD)
  }
  const save = () => {
    const input = { name, noun, nounPlural: skillNounPlural(), standard: "", fromListId: null }
    const err = nameErrorOf()
    const noSkills = picked.size ? null : `Select at least one ${noun}.`
    setNameError(err)
    setSkillError(noSkills)
    if (err) { setStage("name"); return focusOn("#list-name") }
    // Step 2 v3: the header box, which the message describes (any tick clears it).
    if (noSkills) return focusOn(`#${ADD_SKILLS_ALL}`)
    if (editList) {
      const ids = onList.map((k) => k.id)
      model.applyNow((ls) => setListSkills(renameList(ls, editList.id, name), editList.id, ids))
      return onSaved({ ...editList, name: name.trim(), skillIds: ids }, ids.length)
    }
    const list = createList(model.lists, input, `list-${Date.now().toString(36)}`)
    const ids = onList.map((k) => k.id)
    model.applyNow((ls) => setListSkills([...ls, list], list.id, ids))
    onSaved(list, ids.length)
  }
  return (
    <>
    <FloatingSheetPanel open onOpenChange={(o) => { if (o) return; const esc = escaped.current; escaped.current = false; if (!esc) return cancel(); if (stage === "skills") return backToName(); cancel() }}>
      <FloatingSheetPanelContent onEscapeKeyDown={(e) => { if (escClears(e)) return; escaped.current = true }} contentSlot="lab-new-list" style={present ? { top: "2.75rem", height: "calc(100dvh - 3.25rem)" } : undefined} side="right" size="lg" onOpenAutoFocus={(e) => { e.preventDefault(); document.getElementById("list-name")?.focus() }}>
            <FloatingSheetPanelToolbar closeLabel="Close" showSize={false} onBack={stage === "skills" ? backToName : undefined} backLabel={`Back to ${editList ? "Name" : `New ${skillListNoun()}`}`} />
            <FloatingSheetPanelHeader title={stage === "skills" ? `Add ${skillNounPlural()}` : editList ? "Name" : `New ${skillListNoun()}`} subtitle={stage === "skills" ? `Step 2 of 4 · ${name.trim()}` : "Step 1 of 4"} />
            <FloatingSheetPanelBody className="flex min-w-0 flex-col gap-5 px-4 pb-4 pt-1" data-new-list-page data-new-list-stage={stage}>
              {stage === "name" ? (
                <>
                  <Field data-invalid={nameError ? true : undefined}>
                    <FieldLabel htmlFor="list-name">Name</FieldLabel>
                    <Input id="list-name" value={name} onChange={(e) => { setName(e.target.value); setNameError(null) }} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); goSkills() } }} aria-invalid={!!nameError} aria-describedby={nameError ? "list-name-error" : undefined} autoComplete="off" />
                    {nameError ? <FieldError id="list-name-error">{nameError}</FieldError> : null}
                  </Field>
                </>
              ) : (
              <AddSkillsStep
                skills={rows}
                picked={picked}
                onPickedChange={(next) => setPicked(next)}
                others={others}
                typed={typed}
                onTypedChange={setTyped}
                typedError={typedError}
                onTypedErrorChange={setTypedError}
                onAddNames={addTyped}
                addedHere={addedHere}
                skillError={skillError}
                onClearSkillError={() => setSkillError(null)}
                announce={announce}
                onAnnounce={setAnnounce}
              />
              )}
            </FloatingSheetPanelBody>
            {stage === "name" ? (
              <FloatingSheetPanelWorkflowFooter onCancel={cancel} primaryLabel="Next" onPrimary={goSkills} primaryIconClassName="fa-light fa-arrow-right text-xs" />
            ) : (
              <FloatingSheetPanelWorkflowFooter cancelLabel="Back" onCancel={backToName} primaryLabel="Save and continue" onPrimary={save} primaryIconClassName="fa-light fa-arrow-right text-xs" />
            )}
      </FloatingSheetPanelContent>
    </FloatingSheetPanel>
    <DiscardChangesDialog open={asking} onKeep={() => setAsking(false)} onDiscard={() => { setAsking(false); onClose() }} body={unsaved} />
    <DiscardChangesDialog open={leave.asking} onKeep={() => leave.setAsking(false)} onDiscard={() => leave.go(onClose)} body={unsaved} />
    </>
  )
}

/** A Times needed number typed on step 3 and not yet written (the cell writes on blur). */
export interface TypedTimes { id: string; name: string; need: number | null; students: ReadonlyArray<{ id: string; name: string }>; /** Why the number cannot be saved (the skill's rule refuses it), said in the question. */ error?: string }
const TIMES_CELL = "input[id^='times-cell-']"
/** The presses that leave step 3: a link, the toolbar's Back and Close, the footer's Back and Next. */
const LEAVE_CONTROL = "a[href], [data-slot=floating-sheet-panel-toolbar] button, [data-slot=floating-sheet-panel-footer] button"
/** A number that moves nobody saves as a blur would; one that moves students, or is not a number, is asked about. */
export const typedNeedsAsking = (t: TypedTimes) => t.need === null || t.students.length > 0
const timesStamp = () => ({ at: `${DEMO_TODAY}T${new Date().toISOString().slice(11, 19)}Z`, byId: IDS.ross })

/** Puts a value into a React-controlled input as typing would, so the cell's own draft follows (Discard). */
function typeInto(input: HTMLInputElement, value: string) {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, value)
  input.dispatchEvent(new Event("input", { bubbles: true }))
}

/** Step 2: program settings apply; a skill differs only where the admin says so, and only its number sits here [Sankalp, 11-02, 11-04]. */
export function ListSetupLevel({ model, list, leaveRef, exitRef, onBack, onNext, backLabel, picksPending = false, onDiscardPicks }: {
  model: ListsModel
  list: SkillList
  /** Esc: one step back, through the same check as the Back buttons. */
  leaveRef: React.MutableRefObject<(() => void) | null>
  /** X and a press outside: the panel hands over where it is going, and this step settles a typed number first. */
  exitRef?: React.MutableRefObject<((go: () => void) => void) | null>
  onBack: () => void
  onNext: () => void
  /** Where the arrow goes, in that step's own words. */
  backLabel?: string
  /** Students ticked on step 4 and kept while stepping back: leaving the wizard from here asks about them too. */
  picksPending?: boolean
  onDiscardPicks?: () => void
}) {
  const to = useLabHref()
  const store = useV2Store()
  const state = model.state
  const skills = React.useMemo(() => { const on = new Set(list.skillIds); return state.skills.filter((k) => on.has(k.id)).sort((a, b) => a.name.localeCompare(b.name)) }, [state.skills, list.skillIds])
  const notConfigured = skills.filter((k) => configurationOf(state, k) === "not-configured")
  const noSettings = skills.length > 0 && notConfigured.length === skills.length
  const configureMany = useConfigureMany()
  const configure = notConfigured.length ? configureMany(notConfigured.map((k) => k.id)) : null

  // Every way out treats a typed Times needed number the same (Sankalp 2026-11-15, "walk it forwards and backwards"): Esc, the arrow, Back, Next, X,
  // a press outside, a link (crumb, sidebar, the links on this step) and browser Back. A number that moves nobody is saved, as a blur saves it, and
  // the move goes on. One that changes students' progress, or is not a number, asks once: Save and leave, Discard, or Keep editing; the first two
  // then go where the admin was going [REQ AE-02 names the students first].
  const tableRef = React.useRef<HTMLDivElement>(null)
  const typedIn = React.useCallback((input: HTMLInputElement): TypedTimes | null => {
    const id = input.id.slice("times-cell-".length)
    const s = store.getSnapshot()
    const value = timesCellOf(s, id).value
    if (input.value.trim() === (value === null ? "" : String(value))) return null
    const name = s.skills.find((k) => k.id === id)?.name ?? ""
    const need = parseTimes(input.value)
    if (need === null) return { id, name, need, students: [], error: `Times needed for ${name} must be a whole number from 1 to ${TIMES_MAX}.` }
    // A number the skill's rule refuses (two evaluators cannot sign one evaluation) cannot be saved on the way out: it is asked about as a mistake.
    const refused = setTimesNeededMany(s, [id], need, timesStamp()).failed[0]
    if (refused) return { id, name, need: null, students: [], error: refused.error }
    return { id, name, need, students: timesNeededImpact(s, id, need) }
  }, [store])
  const typedNow = React.useCallback((): TypedTimes | null => {
    for (const input of tableRef.current?.querySelectorAll<HTMLInputElement>(TIMES_CELL) ?? []) {
      const t = typedIn(input)
      if (t) return t
    }
    return null
  }, [typedIn])
  // The cell is asking with its own dialog (after Tab or a press inside the step): that question is answered first.
  const cellAsking = () => !!document.querySelector("[data-impact-dialog]")
  const [asking, setAsking] = React.useState<{ t: TypedTimes; go: () => void; forward: boolean; viaGuard: boolean } | null>(null)
  // Set the moment a question is asked, before React has drawn it: the blur that its opening causes must not reach the cell.
  const askingNow = React.useRef(false)
  // A press on a way out, between pointerdown and the click it becomes: the blur in between leaves the number for the question.
  const held = React.useRef(false)
  const [picksAsk, setPicksAsk] = React.useState(false)
  const saveTyped = (t: TypedTimes): boolean => {
    if (t.need === null) return false
    let ok = false
    store.update((s) => { const r = setTimesNeededMany(s, [t.id], t.need!, timesStamp()); ok = !r.failed.length; return r.state })
    return ok
  }
  const settle = (go: () => void, forward = false, viaGuard = false) => {
    if (cellAsking()) return
    const t = typedNow()
    if (t && typedNeedsAsking(t)) {
      askingNow.current = true
      setAsking({ t, go, forward, viaGuard })
      return
    }
    if (t) saveTyped(t)
    go()
  }
  // Armed from the moment the step opens, not from the first keystroke. Arming writes the guard's history entry, and in Chrome that write, landing
  // while the admin typed, put the cell back to its saved number (Next's router takes the write and the row's draft was reset): the number was
  // gone before any way out could ask about it (walk3 rework, 2026-11-15). With nothing typed and nobody kept, a link or Back just goes on.
  const leave = useLeaveGuard(true)
  // A link or browser Back while a number is typed or students are kept: the shared guard has stopped it; settle the number, then the kept students.
  const leaveGo = () => leave.go(() => {})
  const leaveWizard = () => (picksPending ? setPicksAsk(true) : leaveGo())
  React.useEffect(() => {
    if (!leave.asking || askingNow.current) return
    if (cellAsking()) return leave.setAsking(false)
    settle(leaveWizard, false, true)
  }, [leave.asking]) // eslint-disable-line react-hooks/exhaustive-deps
  const cellInput = (id: string) => document.getElementById(`times-cell-${id}`) as HTMLInputElement | null
  const closeQuestion = () => { askingNow.current = false; held.current = false; setAsking(null) }
  const keepEditing = () => {
    const a = asking
    closeQuestion()
    if (a?.viaGuard) leave.setAsking(false)
    if (a) requestAnimationFrame(() => cellInput(a.t.id)?.focus({ preventScroll: true }))
  }
  const discardTyped = () => {
    const a = asking
    if (!a) return
    const input = cellInput(a.t.id)
    const value = timesCellOf(store.getSnapshot(), a.t.id).value
    if (input) typeInto(input, value === null ? "" : String(value))
    closeQuestion()
    a.go()
  }
  const saveAndGo = () => {
    const a = asking
    if (!a) return
    closeQuestion()
    if (saveTyped(a.t)) a.go()
    else { if (a.viaGuard) leave.setAsking(false); requestAnimationFrame(() => cellInput(a.t.id)?.focus({ preventScroll: true })) }
  }
  React.useEffect(() => {
    const cellOf = (t: EventTarget | null) => (t instanceof HTMLInputElement && t.matches(TIMES_CELL) && tableRef.current?.contains(t) ? t : null)
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || askingNow.current || e.defaultPrevented) return
      const input = cellOf(e.target)
      if (!input || !typedIn(input)) return
      // Esc is a way out like the others: the cell does not undo the number first, and the panel does not close before the question.
      e.preventDefault()
      e.stopPropagation()
      leaveRef.current?.()
    }
    const onDown = (e: PointerEvent) => {
      if (askingNow.current) return
      const input = cellOf(document.activeElement)
      const t = input ? typedIn(input) : null
      if (!t || !typedNeedsAsking(t)) return
      const target = e.target as Element | null
      if (!target?.closest?.(LEAVE_CONTROL) || target.closest("[role=alertdialog]")) return
      held.current = true
    }
    const onUp = () => {
      if (!held.current) return
      window.setTimeout(() => {
        if (!held.current || askingNow.current) return
        held.current = false
        // The press led nowhere (dragged off, or a disabled control): what the blur would have done happens now.
        const input = [...(tableRef.current?.querySelectorAll<HTMLInputElement>(TIMES_CELL) ?? [])].find((x) => typedIn(x))
        if (!input || document.activeElement === input) return
        const was = document.activeElement instanceof HTMLElement ? document.activeElement : null
        input.focus({ preventScroll: true })
        if (was?.isConnected) was.focus({ preventScroll: true })
        else input.blur()
      }, 300)
    }
    const onFocusOut = (e: FocusEvent) => {
      if (!cellOf(e.target)) return
      if (held.current || askingNow.current) e.stopPropagation()
    }
    window.addEventListener("keydown", onKey, true)
    window.addEventListener("pointerdown", onDown, true)
    window.addEventListener("pointerup", onUp, true)
    window.addEventListener("focusout", onFocusOut, true)
    return () => {
      window.removeEventListener("keydown", onKey, true)
      window.removeEventListener("pointerdown", onDown, true)
      window.removeEventListener("pointerup", onUp, true)
      window.removeEventListener("focusout", onFocusOut, true)
    }
  }, [typedIn, leaveRef])
  const goBack = () => settle(onBack)
  const goNext = () => settle(onNext, true)
  // Set after each commit and cleared only if still its own. Set during render and cleared on unmount, it was undone by the dev double
  // effect and by this step's cleanup running after step 4 (Assign) had set its Back, so Esc on step 4 closed the whole wizard.
  React.useLayoutEffect(() => {
    leaveRef.current = goBack
    const exit = (go: () => void) => settle(go)
    if (exitRef) exitRef.current = exit
    return () => {
      if (leaveRef.current === goBack) leaveRef.current = null
      if (exitRef?.current === exit) exitRef.current = null
    }
  })
  // Links out of this step carry the way back to it (`?from=setup&list=`): the crumb on the page reached returns to step 3 of this list.
  const back = (href: string) => fromSetup(href, list.id)
  // Find a skill to change its Times needed without scrolling 150 rows (Romit 2026-11-15). Name only; which rows can be edited does not change.
  const [query, setQuery] = React.useState("")
  const sq = React.useDeferredValue(query).trim().toLowerCase()
  const shownRows = sq ? skills.filter((k) => k.name.toLowerCase().includes(sq)) : skills
  const clearSearch = () => { setQuery(""); requestAnimationFrame(() => document.getElementById("list-setup-search")?.focus()) }
  return (
    <>
      <FloatingSheetPanelToolbar onBack={goBack} backLabel={backLabel ?? `Back to Add ${skillNounPlural()}`} closeLabel="Close" showSize={false} />
      <FloatingSheetPanelHeader title={`Configure ${skillNounPlural()}`} subtitle={`Step 3 of 4 · Optional · ${list.name}`} />
      <FloatingSheetPanelBody className="flex min-w-0 flex-col gap-4 px-4 pb-4 pt-1" data-list-setup>
        {/* Adding and configuring are separate (REQ SC-01): the list is saved, and this step is optional. Not configured skills stay on the list; REQ IM-09 limits mapping and submitting only. */}
        <div className="flex flex-wrap items-center justify-between gap-3" data-configure-summary={notConfigured.length}>
          <p className="min-w-0 flex-1 text-sm text-muted-foreground" id="list-setup-note">
            {notConfigured.length
              ? `${fmt(notConfigured.length)} of ${fmt(skills.length)} ${skills.length === 1 ? skillNoun() : skillNounPlural()} ${notConfigured.length === 1 ? "is" : "are"} not configured.`
              : `All ${fmt(skills.length)} ${skills.length === 1 ? skillNoun() : skillNounPlural()} ${skills.length === 1 ? "is" : "are"} configured.`}
          </p>
          {configure ? <Button asChild variant="outline" size="sm"><Link href={back(configure.href)} aria-describedby="list-setup-note" data-configure-skills>{configureManyLabel(notConfigured.length)}</Link></Button> : null}
        </div>
        <SettingsSummary
          id="list-setup-settings"
          rule={programSettingsOf(state)?.rule ?? null}
          emptyText={`Your program has not set how ${skillNounPlural()} are judged.`}
          action={<Button asChild variant="outline" size="sm"><Link href={to("admin/evaluation-settings", { from: "setup", list: list.id })} data-setup-settings-link>{noSettings ? "Set them" : "Change"}<i className="fa-light fa-arrow-right text-xs" aria-hidden="true" /></Link></Button>}
        />
        {/* The number is each skill's Times needed (2026-11-11, Romit: "the number isn't clear to me"). One column caption, as the Library's Times needed
            column and the settings times table do, not a unit on every row; a number the skill keeps of its own reads bold, as in the Library. The
            configuration badge sits with the name, so it never reads as the number's label. */}
        <div ref={tableRef} className="flex flex-col rounded-[var(--radius)] border border-border" data-list-setup-table>
          {/* The search and the column heads stay in view while the rows scroll under them (the panel body is the scroller). */}
          <div className="sticky -top-1 z-10 flex flex-col rounded-t-[var(--radius)] bg-background pt-1" data-list-setup-toolbar>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border p-2">
              <InputGroup className="min-w-0 flex-1">
                <InputGroupAddon><i className="fa-light fa-magnifying-glass text-xs" aria-hidden="true" /></InputGroupAddon>
                <InputGroupInput id="list-setup-search" type="text" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Escape" && query) { e.preventDefault(); e.stopPropagation(); setQuery("") } }} data-esc-clears placeholder={`Search ${skillNounPlural()}`} aria-label={`Search ${skillNounPlural()} on ${list.name}`} autoComplete="off" />
                {query ? (
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton variant="ghost" size="icon-xs" aria-label="Clear search" onClick={clearSearch} data-clear-search><i className="fa-light fa-xmark" aria-hidden="true" /></InputGroupButton>
                  </InputGroupAddon>
                ) : null}
              </InputGroup>
              {sq ? <span className="shrink-0 text-sm tabular-nums text-muted-foreground" role="status" aria-live="polite" data-setup-match-count={shownRows.length}>{`${fmt(shownRows.length)} of ${countSkills(skills.length)}`}</span> : null}
            </div>
            <div className="flex items-center gap-3 border-b border-border px-3 py-1.5" aria-hidden="true">
              <span className={cn(TYPE.meta, "min-w-0 flex-1")}>{capitalize(skillNoun())}</span>
              <span className={cn(TYPE.meta, "w-28 shrink-0 whitespace-nowrap")}>Times needed</span>
            </div>
          </div>
          {sq && !shownRows.length ? (
            <p className="flex min-h-11 flex-wrap items-center gap-2 px-3 text-sm text-muted-foreground" data-setup-no-match>
              {`No ${skillNounPlural()} match.`}
              <Button type="button" variant="ghost" size="sm" onClick={clearSearch}>Clear search</Button>
            </p>
          ) : null}
          <ul className="flex flex-col px-3" aria-label={capitalize(skillNounPlural())} data-list-setup-rows={shownRows.length}>
            {shownRows.map((k) => {
              const word = configurationOf(state, k)
              const spec = CONFIGURATION_META[word]
              return (
                <li key={k.id} className="flex min-h-12 items-center gap-3 border-b border-border py-1.5 text-sm last:border-b-0 [contain-intrinsic-size:auto_3rem] [content-visibility:auto]">
                  <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="min-w-0 max-w-full truncate" title={k.name}>{k.name}</span>
                    <Link href={back(configureHref(k.id))} aria-label={`Configure ${k.name}, ${spec.label}`} className="shrink-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <StatusBadge label={spec.label} tone={spec.tone} icon={spec.icon} size="sm" />
                    </Link>
                  </span>
                  <span className="w-28 shrink-0"><TimesNeededCell id={k.id} name={k.name} /></span>
                </li>
              )
            })}
          </ul>
        </div>
      </FloatingSheetPanelBody>
      <FloatingSheetPanelWorkflowFooter cancelLabel="Back" onCancel={goBack} primaryLabel="Next" onPrimary={goNext} primaryIconClassName="fa-light fa-arrow-right text-xs" />
      <AlertDialog open={!!asking} onOpenChange={(o) => { if (!o) keepEditing() }}>
        <AlertDialogContent className={ABOVE_PANEL} overlayClassName={ABOVE_PANEL} {...railTriggerProps()} onCloseAutoFocus={(e) => e.preventDefault()} data-setup-leave-dialog>
          {asking ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>{asking.t.need === null ? DISCARD_TITLE : `Change times needed for ${asking.t.name}?`}</AlertDialogTitle>
                <AlertDialogDescription>{asking.t.error ?? progressChanges(asking.t.students)}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel variant="outline" size="sm">Keep editing</AlertDialogCancel>
                {asking.t.need === null ? (
                  <AlertDialogAction variant="default" size="sm" onClick={discardTyped}>Discard</AlertDialogAction>
                ) : (
                  <>
                    <AlertDialogAction variant="outline" size="sm" onClick={discardTyped}>Discard</AlertDialogAction>
                    <AlertDialogAction variant="default" size="sm" onClick={saveAndGo}>{asking.forward ? "Save and continue" : "Save and leave"}</AlertDialogAction>
                  </>
                )}
              </AlertDialogFooter>
            </>
          ) : null}
        </AlertDialogContent>
      </AlertDialog>
      <DiscardChangesDialog open={picksAsk} onKeep={() => { setPicksAsk(false); leave.setAsking(false) }} onDiscard={() => { setPicksAsk(false); onDiscardPicks?.(); leaveGo() }} body={ASSIGN_UNSAVED} />
    </>
  )
}
