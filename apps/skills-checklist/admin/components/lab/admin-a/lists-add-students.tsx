"use client"

/**
 * Assign to students: one side panel, one job (designer 2026-11-06: the pop-up was crowded, a full page left the screen empty, and a Review step repeated what the panel already shows; D-L117).
 * A whole list goes to a group in one go [Aarti, 205da2dd ch 9], so groups come first; a student shows only when searched or filtered for [Sankalp, 365abc25 ch 9].
 * Anyone already on this list is ticked and disabled, "Has it". A ticked row on another list reads "Also on {list}"; adding keeps other lists.
 * New student group is shown in this panel, not over it, so nothing chosen here is lost, and the new group comes back ticked. Renaming or removing a group stays under Settings.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Checkbox } from "@exxatdesignux/ui/components/ui/checkbox"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { TYPE } from "@/components/lab/type-scale"
import { ALL_STUDENTS_GROUP, groupRuleOptions, namesOf, skillLists, studentFilterIsEmpty, studentsMatching, studentsOnList, type SkillList, type StudentFilter } from "@/lib/lab/lists"
import type { Person } from "@/lib/v2/types"
import { AppliedFilterChips, FiltersControl, SearchField, fmt, plural, type FilterField } from "./parts"
import { RadioGroup, RadioGroupItem } from "@exxatdesignux/ui/components/ui/radio-group"
import type { ListsModel } from "./lists-parts"
import { useRovingChecks } from "./lists-focus"
import { useGroupForm } from "./lists-parts"
import { FloatingSheetPanelBody, FloatingSheetPanelHeader, FloatingSheetPanelToolbar, FloatingSheetPanelWorkflowFooter } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { DiscardChangesDialog, useLeaveGuard } from "@/components/lab/shared/unsaved-guard"
import { skillNoun, skillNounPlural } from "@/lib/lab/terms"

export interface AddedStudents {
  groupIds: string[]
  studentIds: string[]
}

/** Long lists stay quick: rows out of view skip their layout and paint, at the height they will take. */
const ROW = "flex min-h-11 items-center gap-3 border-b border-border py-1.5 last:border-b-0 [contain-intrinsic-size:auto_2.75rem] [content-visibility:auto]"
const byName = (a: Person, b: Person) => a.name.localeCompare(b.name)
const idOf = (raw: string) => `add-${raw.replace(/[^a-z0-9]+/gi, "-")}`

function PickRow({ id, checked, disabled, onChange, name, meta, notes }: { id: string; checked: boolean; disabled?: boolean; onChange: (on: boolean) => void; name: string; meta: string; notes: readonly string[] }) {
  return (
    <li className={ROW}>
      <Checkbox id={id} checked={checked} disabled={disabled} onCheckedChange={(v) => onChange(v === true)} />
      <Label htmlFor={id} className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-0.5 font-normal peer-disabled:opacity-100">
        <span className="min-w-0 break-words font-medium text-foreground">{name}</span>
        <span className="text-sm tabular-nums text-muted-foreground">{meta}</span>
        {notes.some(Boolean) ? (
          <span className="flex min-w-0 flex-wrap gap-x-3 break-words text-sm text-muted-foreground sm:ms-auto sm:justify-end sm:text-end" data-add-note>
            {notes.filter(Boolean).map((n) => <span key={n} className="min-w-0">{n}</span>)}
          </span>
        ) : null}
      </Label>
    </li>
  )
}

export function AssignWizard({ model, list, initialQuery, stepLabel, leaveRef, dirtyRef, onClose, onAdd }: { model: ListsModel; list: SkillList; initialQuery: string; /** "Step 3 of 3" inside New skill list. */ stepLabel?: string; /** How the panel's Close, Esc and an outside press leave this level. */ leaveRef: React.MutableRefObject<(() => void) | null>; dirtyRef: React.MutableRefObject<boolean>; onClose: () => void; onAdd: (a: AddedStudents) => void }) {
  const s = model.state
  // All students is the usual answer [Aarti, Sankalp, 741d1f1c ch 7-9], so it starts chosen unless the list is already on someone or a link named a group.
  const [who, setWho] = React.useState<"all" | "specific">(initialQuery || list.groupIds.length || list.studentIds?.length ? "specific" : "all")
  const [creating, setCreating] = React.useState(false)
  const [askingBack, setAskingBack] = React.useState(false)
  const form = useGroupForm(model, (_f, id) => { setGroupIds((x) => new Set(x).add(id)); setCreating(false) })
  const stepBack = () => { setAskingBack(false); setCreating(false); requestAnimationFrame(() => document.querySelector<HTMLElement>("[data-new-group]")?.focus({ preventScroll: true })) }
  const [asking, setAsking] = React.useState(false)
  const [query, setQuery] = React.useState(initialQuery)
  const [filter, setFilter] = React.useState<StudentFilter>({})
  const [groupIds, setGroupIds] = React.useState<ReadonlySet<string>>(new Set())
  const [studentIds, setStudentIds] = React.useState<ReadonlySet<string>>(new Set())
  const deferred = React.useDeferredValue(query)
  const needle = deferred.trim().toLowerCase()
  const everyone = React.useMemo(() => s.people.filter((p) => p.kind === "student").sort(byName), [s])
  const opts = React.useMemo(() => groupRuleOptions(s), [s])
  const onThis = React.useMemo(() => studentsOnList(list, model.groups), [list, model.groups])
  const otherReach = React.useMemo(() => skillLists(model.lists).filter((l) => l.id !== list.id).map((l) => ({ name: l.name, groupIds: l.groupIds, students: studentsOnList(l, model.groups) })), [model.lists, list.id, model.groups])
  const alsoOn = (names: string[]) => (names.length ? `Also on ${namesOf(names)}` : "")
  const alreadyOn = (ids: readonly string[]) => {
    const n = ids.filter((id) => onThis.has(id)).length
    return n ? `${n} already ${n === 1 ? "has" : "have"} it` : ""
  }
  const filtered = !studentFilterIsEmpty(filter)
  const pool = React.useMemo(() => (filtered ? studentsMatching(s, filter) : everyone), [filtered, s, filter, everyone])
  const students = needle ? pool.filter((p) => p.name.toLowerCase().includes(needle) || (p.cohort ?? "").toLowerCase().includes(needle) || (p.studentNumber ?? "").toLowerCase().includes(needle)) : pool
  // A filter is about students: while one is on, the results are what it found [INFER].
  const named = model.groups.filter((g) => g.kind !== "all")
  const groups = filtered ? [] : needle ? named.filter((g) => g.label.toLowerCase().includes(needle)) : named
  const inPicked = React.useMemo(() => {
    const out = new Map<string, string>()
    for (const g of model.groups) if (groupIds.has(g.id)) for (const id of g.studentIds) if (!out.has(id)) out.set(id, g.label)
    return out
  }, [groupIds, model.groups])
  const selectable = students.filter((p) => !onThis.has(p.id) && !inPicked.has(p.id))
  const allOn = selectable.length > 0 && selectable.every((p) => studentIds.has(p.id))
  const toggle = (set: ReadonlySet<string>, id: string, on: boolean) => { const next = new Set(set); if (on) next.add(id); else next.delete(id); return next }
  // Everyone this would put on the list: the button names it, so a tick that adds nobody new changes nothing.
  const newcomers = new Set<string>()
  for (const id of inPicked.keys()) if (!onThis.has(id)) newcomers.add(id)
  for (const id of studentIds) if (!onThis.has(id)) newcomers.add(id)
  const count = newcomers.size
  const anything = groupIds.size > 0 || count > 0
  const fields: FilterField[] = [
    { id: "add-cohort", label: "Cohort", value: filter.cohort ?? "", allLabel: "All cohorts", options: s.program.cohorts.map((c) => ({ value: c, label: c })), onChange: (v) => setFilter((f) => ({ ...f, cohort: v || undefined })) },
    { id: "add-track", label: "Track", value: filter.trackId ?? "", allLabel: "All tracks", options: (s.tracks ?? []).map((t) => ({ value: t.id, label: t.name })), onChange: (v) => setFilter((f) => ({ ...f, trackId: v || undefined })) },
    { id: "add-term", label: "Term", value: filter.termId ?? "", allLabel: "All terms", options: (s.terms ?? []).map((t) => ({ value: t.id, label: t.name })), onChange: (v) => setFilter((f) => ({ ...f, termId: v || undefined })) },
    { id: "add-category", label: "Enrollment type", value: filter.category ?? "", allLabel: "Any type", options: opts.categories.map((c) => ({ value: c, label: c })), onChange: (v) => setFilter((f) => ({ ...f, category: v || undefined })) },
    { id: "add-enrolled", label: "Enrolled in", value: filter.enrollmentYear ? String(filter.enrollmentYear) : "", allLabel: "Any year", options: opts.enrollmentYears.map((y) => ({ value: String(y), label: String(y) })), onChange: (v) => setFilter((f) => ({ ...f, enrollmentYear: v ? Number(v) : undefined })) },
  ]
  const rovingGroups = useRovingChecks()
  const rovingStudents = useRovingChecks()
  const showStudents = !!needle || filtered
  const chosen = who === "specific" && anything
  const leave = useLeaveGuard(chosen || (creating && form.dirty))
  const unsaved = "Nobody has been assigned yet."
  const cancel = () => (chosen ? setAsking(true) : onClose())
  const leaveForm = () => (form.dirty ? setAskingBack(true) : stepBack())
  const namedStudents = [...studentIds].filter((id) => !inPicked.has(id))
  const assignLabel = count ? `Assign to ${plural(count, "student", "students")}` : `Assign to ${plural(groupIds.size, "group", "groups")}`
  const skills = plural(list.skillIds.length, skillNoun(), skillNounPlural())
  leaveRef.current = creating ? leaveForm : cancel
  dirtyRef.current = chosen || (creating && form.dirty)
  React.useEffect(() => () => { leaveRef.current = null; dirtyRef.current = false }, [leaveRef, dirtyRef])
  React.useEffect(() => { if (!creating) requestAnimationFrame(() => document.querySelector<HTMLElement>("[data-add-dialog] input")?.focus({ preventScroll: true })) }, [creating])
  const everyoneCount = model.state.people.filter((p) => p.kind === "student").length
  const assignNow = () => onAdd(who === "all" ? { groupIds: [ALL_STUDENTS_GROUP], studentIds: [] } : { groupIds: [...groupIds], studentIds: namedStudents })
  return (
    <>
      {/* One panel, as the DS rail: a level replaces the content, Back in the toolbar, Close beside it. */}
      <FloatingSheetPanelToolbar onBack={creating ? leaveForm : cancel} backLabel={creating ? "Back to Assign to students" : `Back to ${list.name}`} closeLabel="Close" showSize={false} />
      <FloatingSheetPanelHeader title={creating ? "New student group" : "Assign to students"} subtitle={creating ? undefined : `${stepLabel ? `${stepLabel} · ` : ""}${list.name}, ${skills}`} />
      {creating ? (
        <>
          <FloatingSheetPanelBody className="flex min-w-0 flex-col gap-4 px-4 pb-4 pt-1" data-new-group-form>{form.body}</FloatingSheetPanelBody>
          <FloatingSheetPanelWorkflowFooter onCancel={leaveForm} primaryLabel="Create group" onPrimary={() => { form.submit() }} primaryIconClassName="fa-light fa-plus text-xs" />
        </>
      ) : (
      <>
      <FloatingSheetPanelBody className="flex min-w-0 flex-col gap-4 px-4 pb-4 pt-1" data-add-dialog>
        <RadioGroup value={who} onValueChange={(v) => setWho(v as "all" | "specific")} aria-label="Who gets this list" className="flex flex-col gap-2" data-assign-who>
          <div className="flex items-baseline gap-2">
            <RadioGroupItem id="assign-all" value="all" />
            <Label htmlFor="assign-all" className="flex flex-col items-start gap-0.5 font-normal">
              <span className="font-medium text-foreground">All students</span>
              <span className="text-sm text-muted-foreground">{`${fmt(everyoneCount)} now, and anyone who joins later`}</span>
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem id="assign-specific" value="specific" />
            <Label htmlFor="assign-specific" className="font-medium text-foreground">Specific cohorts or students</Label>
          </div>
        </RadioGroup>
        {who === "all" ? null : (
          <div className="flex min-w-0 flex-col gap-4">
            <div className="flex min-w-0 flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <SearchField value={query} onChange={setQuery} label="Search groups or students" placeholder="Search groups or students" className="min-w-0 flex-1" />
                  <FiltersControl fields={fields} align="end" layer="z-[92]" />
                </div>
                <AppliedFilterChips fields={fields} />
              </div>
              <div className="flex min-w-0 flex-col gap-4" tabIndex={-1} data-add-results>
                {groups.length ? (
                  <section aria-labelledby="add-groups-heading" className="flex flex-col" data-add-groups>
                    <div className="flex min-h-8 items-center justify-between gap-2">
                      <h2 id="add-groups-heading" className={TYPE.group}>Student groups</h2>
                      <Button type="button" variant="outline" size="sm" onClick={() => { form.reset(); setCreating(true) }} data-new-group>New student group</Button>
                    </div>
                    <ul className="flex flex-col rounded-[var(--radius)] border border-border px-3" aria-labelledby="add-groups-heading" {...rovingGroups}>
                      {groups.map((g) => {
                        const has = list.groupIds.includes(g.id)
                        const ticked = groupIds.has(g.id)
                        return <PickRow key={g.id} id={idOf(g.id)} checked={has || ticked} disabled={has} onChange={(on) => setGroupIds((x) => toggle(x, g.id, on))} name={g.label} meta={plural(g.studentIds.length, "student", "students")} notes={has ? ["Has it"] : ticked ? [alreadyOn(g.studentIds), alsoOn(otherReach.filter((l) => l.groupIds.includes(g.id)).map((l) => l.name))] : []} />
                      })}
                    </ul>
                  </section>
                ) : null}
                {showStudents && students.length ? (
                  <section aria-labelledby="add-students-heading" className="flex flex-col" data-add-students-section>
                    <div className="flex min-h-8 items-center justify-between gap-2">
                      <h2 id="add-students-heading" className={TYPE.group}>Students</h2>
                      {selectable.length ? (
                        <Button type="button" variant="ghost" size="sm" aria-label={allOn ? `Clear all ${selectable.length} shown` : `Select all ${selectable.length} shown`} onClick={() => setStudentIds((x) => { const next = new Set(x); for (const p of selectable) { if (allOn) next.delete(p.id); else next.add(p.id) } return next })} data-select-all>{allOn ? "Clear all" : "Select all"}</Button>
                      ) : null}
                    </div>
                    <ul className="flex flex-col rounded-[var(--radius)] border border-border px-3" aria-labelledby="add-students-heading" data-add-student-rows={students.length} {...rovingStudents}>
                      {students.map((p) => {
                        const has = onThis.has(p.id)
                        const via = inPicked.get(p.id)
                        const ticked = studentIds.has(p.id)
                        return <PickRow key={p.id} id={idOf(p.id)} checked={has || !!via || ticked} disabled={has || !!via} onChange={(on) => setStudentIds((x) => toggle(x, p.id, on))} name={p.name} meta={p.cohort ?? ""} notes={[has ? "Has it" : via ? `In ${via}` : ticked ? alsoOn(otherReach.filter((l) => l.students.has(p.id)).map((l) => l.name)) : ""]} />
                      })}
                    </ul>
                  </section>
                ) : null}
                {!groups.length && !(showStudents && students.length) ? (
                  <div className="flex flex-col items-start gap-2 py-4 text-sm text-muted-foreground">
                    <p>{needle ? "No groups or students match this search." : "No students match these filters."}</p>
                    <Button type="button" variant="ghost" size="sm" onClick={() => { setQuery(""); setFilter({}) }}>Clear</Button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </FloatingSheetPanelBody>
      <FloatingSheetPanelWorkflowFooter cancelLabel={stepLabel ? "Back" : "Cancel"} onCancel={cancel} primaryLabel={who === "all" ? `Assign to all ${fmt(everyoneCount)} students` : count || groupIds.size ? assignLabel : "Assign"} onPrimary={assignNow} primaryDisabled={who === "specific" && !anything} primaryIconClassName="fa-light fa-user-plus text-xs" />
      </>
      )}
      <DiscardChangesDialog open={askingBack} onKeep={() => setAskingBack(false)} onDiscard={stepBack} body="This group has not been created." />
      <DiscardChangesDialog open={asking} onKeep={() => setAsking(false)} onDiscard={() => { setAsking(false); onClose() }} body={unsaved} />
      <DiscardChangesDialog open={leave.asking} onKeep={() => leave.setAsking(false)} onDiscard={() => leave.go(onClose)} body={unsaved} />
    </>
  )
}
