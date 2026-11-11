"use client"

/**
 * New skill list, the start of setup [Aarti and Sankalp, 741d1f1c ch 9-10, D-L122]: step 1 names the list and shows only what is on it (D-L123), with Add new and Add from library, a level in this panel; step 2 says how they are judged; step 3 assigns it. Course mapping is separate.
 */
import * as React from "react"
import { usePresent } from "@/components/lab/lab-bar/present"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { FloatingSheetPanel } from "@/components/lab/shared/sheet"
import { FloatingSheetPanelBody, FloatingSheetPanelContent, FloatingSheetPanelHeader, FloatingSheetPanelToolbar, FloatingSheetPanelWorkflowFooter } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { Field, FieldDescription, FieldError, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { DiscardChangesDialog, useLeaveGuard } from "@/components/lab/shared/unsaved-guard"
import { createList, setListSkills, skillLists, validateNewList, type SkillList } from "@/lib/lab/lists"
import { aNoun, capitalize, countSkills, skillListNoun, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { fmt } from "./parts"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import type { ListsModel } from "./lists-parts"
import { SkillPicker } from "./lists-panel"
import { CategoryPicker, useVocabOptions } from "@/components/lab/library/category-tag-pickers"
import { ensureVocab } from "@/lib/v2/vocabulary"
import { StatusBadge } from "@exxatdesignux/ui"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { useLabHref } from "@/components/lab/lab-bar/page-context"
import { TimesNeededCell } from "@/components/lab/library/times-needed"
import { useV2Store } from "@/lib/v2/react"
import { DEMO_TODAY, IDS } from "@/lib/v2/seed-core"
import { CONFIGURATION_META, EMPTY_DRAFT, NO_CATEGORY, setSkillDetailsInStore, addSkillsToStore, configureHref, draftToSkill, normName, type AddedSkill } from "@/lib/lab/library"
import { configurationOf, programSettingsOf } from "@/lib/lab/program-settings"
import { SettingsSummary } from "@/components/lab/library/settings-summary"
import { TYPE } from "@/components/lab/type-scale"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { FirstRun } from "@/components/lab/first-run"

export function NewListPage({ model, onClose, onSaved }: { model: ListsModel; onClose: () => void; onSaved: (l: SkillList, n: number) => void }) {
  const { present } = usePresent()
  const to = useLabHref()
  const store = useV2Store()
  const [name, setName] = React.useState("")
  const [picked, setPicked] = React.useState<ReadonlySet<string>>(new Set())
  const [nameError, setNameError] = React.useState<string | null>(null)
  const [skillError, setSkillError] = React.useState<string | null>(null)
  const [asking, setAsking] = React.useState(false)
  // Add from library: a level in this panel, on a draft, so Back changes nothing.
  const [draft, setDraft] = React.useState<Set<string> | null>(null)
  const [askingDraft, setAskingDraft] = React.useState(false)
  const [adding, setAdding] = React.useState(false)
  const [typed, setTyped] = React.useState("")
  // A name already on the list says so under the field and keeps the text; the polite line tells a screen reader what was added, since the field clears.
  const [typedError, setTypedError] = React.useState<string | null>(null)
  const [announce, setAnnounce] = React.useState("")
  // Skills added here, whose category can still be set here. A skill that already has one keeps it: that is the Library's to change.
  const [addedHere, setAddedHere] = React.useState<ReadonlySet<string>>(new Set())
  const vocab = useVocabOptions()
  const stamp = () => `${DEMO_TODAY}T${new Date().toISOString().slice(11)}`
  const setCategoryOf = (id: string, category: string) => store.update((st) => setSkillDetailsInStore(category ? ensureVocab(st, "categories", [category], IDS.ross, stamp()) : st, [id], { category }, IDS.ross, stamp()))
  const rows = React.useMemo(() => model.state.skills.filter((k) => k.active !== false).sort((a, b) => a.name.localeCompare(b.name)), [model.state])
  const byId = React.useMemo(() => new Map(rows.map((k) => [k.id, k])), [rows])
  // Newest first: what was just added sits under the field, so it is seen without scrolling a long list. `picked` keeps the order things were added.
  const onList = React.useMemo(() => [...picked].reverse().flatMap((id) => { const k = byId.get(id); return k ? [k] : [] }), [picked, byId])
  const others = skillLists(model.lists).filter((l) => l.skillIds.length > 0)
  const dirty = !!name.trim() || picked.size > 0 || !!typed.trim()
  const leave = useLeaveGuard(dirty)
  const unsaved = "This list has not been saved."
  const noun = skillNoun()
  const draftChanged = !!draft && (draft.size !== picked.size || [...draft].some((id) => !picked.has(id)))
  // The button counts only what is new: skills already on the list open ticked.
  const draftNew = draft ? [...draft].filter((id) => !picked.has(id)).length : 0
  const draftRemoved = draft ? [...picked].some((id) => !draft.has(id)) : false
  const focusOn = (sel: string) => requestAnimationFrame(() => document.querySelector<HTMLElement>(sel)?.focus({ preventScroll: true }))
  const openLibrary = () => { setDraft(new Set(picked)); focusOn("[data-new-list-library] input") }
  const closeLibrary = () => { setAskingDraft(false); setDraft(null); focusOn("[data-add-library]") }
  const leaveLibrary = () => (draftChanged ? setAskingDraft(true) : closeLibrary())
  const cancel = () => (dirty ? setAsking(true) : onClose())
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
      focusOn("#new-skill-name")
      return
    }
    if (fresh.length) {
      store.update((st) => addSkillsToStore(st, fresh, IDS.ross, stamp()))
      setAddedHere((x) => new Set([...x, ...fresh.map((k) => k.id)]))
    }
    // Stored in reverse so a pasted list reads top to bottom in the order it was pasted.
    setPicked((x) => new Set([...x, ...[...ids].reverse()]))
    setTyped("")
    setTypedError(null)
    setSkillError(null)
    setAnnounce(ids.length === 1 ? `Added ${names.find((n) => !already.includes(n)) ?? ""}.` : `Added ${countSkills(ids.length)}.`)
    focusOn("#new-skill-name")
  }
  // Kept skills keep their place; new ones from the library go on top, A to Z.
  const fromLibrary = (d: ReadonlySet<string>) => {
    const added = [...d].filter((id) => !picked.has(id)).sort((a, b) => (byId.get(b)?.name ?? "").localeCompare(byId.get(a)?.name ?? ""))
    return new Set([...[...picked].filter((id) => d.has(id)), ...added])
  }
  const remove = (id: string) => {
    // Focus goes to the next row's remove, else the one before, else the field, else Choose from library.
    const i = onList.findIndex((k) => k.id === id)
    const next = onList[i + 1] ?? onList[i - 1]
    setPicked((x) => { const s = new Set(x); s.delete(id); return s })
    focusOn(next ? `[data-remove-skill="${next.id}"]` : adding ? "#new-skill-name" : "[data-add-new]")
  }
  const save = () => {
    const input = { name, noun, nounPlural: skillNounPlural(), standard: "", fromListId: null }
    const err = validateNewList(model.lists, input)
    const noSkills = picked.size ? null : `Add at least one ${noun}.`
    setNameError(err)
    setSkillError(noSkills)
    if (err) return document.getElementById("list-name")?.focus()
    if (noSkills) return
    const list = createList(model.lists, input, `list-${Date.now().toString(36)}`)
    const ids = onList.map((k) => k.id)
    model.applyNow((ls) => setListSkills([...ls, list], list.id, ids))
    onSaved(list, ids.length)
  }
  // Nothing on the list yet: the drawing carries the two ways in. Once started, the field is the one way to write and Choose from library sits beside the count.
  const started = onList.length > 0 || adding
  const hasLibrary = rows.length > 0
  const chooseFromLibrary = hasLibrary ? <Button type="button" variant="outline" size="sm" onClick={openLibrary} data-add-library>Choose from library</Button> : null
  const addButtons = (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => { setAdding(true); focusOn("#new-skill-name") }} data-add-new>{`Write ${aNoun()}`}</Button>
      {chooseFromLibrary}
    </>
  )
  const fieldError = typedError ?? skillError
  const describedBy = [fieldError ? "new-skill-error" : "", "new-skill-hint"].filter(Boolean).join(" ")
  return (
    <>
    <FloatingSheetPanel open onOpenChange={(o) => (o ? null : draft ? leaveLibrary() : cancel())}>
      <FloatingSheetPanelContent contentSlot="lab-new-list" style={present ? { top: "2.75rem", height: "calc(100dvh - 3.25rem)" } : undefined} side="right" size="lg" onOpenAutoFocus={(e) => { e.preventDefault(); document.getElementById("list-name")?.focus() }}>
        {draft ? (
          <>
            <FloatingSheetPanelToolbar onBack={leaveLibrary} backLabel="Back to the list" closeLabel="Close" showSize={false} />
            <FloatingSheetPanelHeader title="Choose from library" subtitle={name.trim() || `New ${skillListNoun()}`} />
            <FloatingSheetPanelBody className="flex min-w-0 flex-col gap-2 px-4 pb-4 pt-1" data-new-list-library>
              <SkillPicker skills={rows} savedIds={picked} selected={draft} others={others} onChange={(ids) => setDraft(ids)} idPrefix="new-list" library bulkHref={to("admin/import-ai-review", {})} />
            </FloatingSheetPanelBody>
            <FloatingSheetPanelWorkflowFooter cancelLabel="Back" onCancel={leaveLibrary} primaryLabel={draftRemoved ? "Update the list" : draftNew ? `Add ${countSkills(draftNew)}` : "Add"} primaryDisabled={!draftChanged} onPrimary={() => { setPicked(fromLibrary(draft)); setSkillError(null); setTypedError(null); closeLibrary() }} primaryIconClassName="fa-light fa-plus text-xs" />
          </>
        ) : (
          <>
            <FloatingSheetPanelToolbar closeLabel="Close" showSize={false} />
            <FloatingSheetPanelHeader title={`New ${skillListNoun()}`} subtitle="Step 1 of 3" />
            <FloatingSheetPanelBody className="flex min-w-0 flex-col gap-5 px-4 pb-4 pt-1" data-new-list-page>
              <Field data-invalid={nameError ? true : undefined}>
                <FieldLabel htmlFor="list-name">Name</FieldLabel>
                <Input id="list-name" value={name} onChange={(e) => { setName(e.target.value); setNameError(null) }} aria-invalid={!!nameError} aria-describedby={nameError ? "list-name-error" : undefined} />
                {nameError ? <FieldError id="list-name-error">{nameError}</FieldError> : null}
              </Field>
              <section className="flex min-w-0 flex-col gap-3" aria-labelledby="new-list-skills">
                <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
                  <h2 id="new-list-skills" className={`${TYPE.group} flex items-baseline gap-2`}>
                    {`${capitalize(skillNounPlural())} on this list`}
                    {onList.length ? <span className="text-sm font-normal tabular-nums text-muted-foreground" data-picked-count={onList.length}>{fmt(onList.length)}</span> : null}
                  </h2>
                  {started ? chooseFromLibrary : null}
                </div>
                {started ? (
                  <Field data-invalid={fieldError ? true : undefined} className="gap-1.5" data-add-new-row>
                    {/* A visible label and a real button beside the field (2026-11-11, Romit: "the Add button isn't clear"): the ghost Add inside the field read as
                        text. Outline, so the panel's Next stays the one filled button; off until there is a name. Enter still adds; focus stays in the field. */}
                    <FieldLabel htmlFor="new-skill-name">{`Name of a new ${noun}`}</FieldLabel>
                    <div className="flex min-w-0 items-center gap-2" data-add-row>
                      <Input
                        id="new-skill-name"
                        className="min-w-0 flex-1"
                        enterKeyHint="enter"
                        autoComplete="off"
                        aria-invalid={!!fieldError}
                        aria-describedby={describedBy}
                        value={typed}
                        onChange={(e) => { setTyped(e.target.value); setTypedError(null) }}
                        onPaste={(e) => { const text = e.clipboardData.getData("text"); if (/\r?\n/.test(text.trim())) { e.preventDefault(); addTyped(text) } }}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); addTyped(typed) } }}
                      />
                      <Button type="button" variant="outline" size="default" className="shrink-0" disabled={!typed.trim()} onClick={() => addTyped(typed)} data-add-typed>{`Add ${noun}`}</Button>
                    </div>
                    {fieldError ? <FieldError id="new-skill-error" data-skill-error={skillError && !typedError ? true : undefined} data-typed-error={typedError ? true : undefined}>{fieldError}</FieldError> : null}
                    <FieldDescription id="new-skill-hint">Paste a list to add several.</FieldDescription>
                  </Field>
                ) : null}
                <p role="status" className="sr-only">{announce}</p>
                {onList.length ? (
                  <ul className="flex flex-col rounded-[var(--radius)] border border-border ps-3 pe-1" aria-label={`${capitalize(skillNounPlural())} on this list`} data-list-rows={onList.length}>
                    {onList.map((k) => {
                      const settable = addedHere.has(k.id) || !k.category?.trim() || k.category === NO_CATEGORY
                      return (
                        <li key={k.id} className="flex min-h-11 items-center gap-2 border-b border-border py-1 text-sm last:border-b-0 [contain-intrinsic-size:auto_2.75rem] [content-visibility:auto]">
                          <span className="min-w-0 flex-1 truncate" title={k.name}>{k.name}</span>
                          {settable ? (
                            <span className="flex min-w-0 max-w-[45%] shrink-0 justify-end" data-row-category>
                              <span id={`category-label-${k.id}`} className="sr-only">{`Category for ${k.name}`}</span>
                              <CategoryPicker id={`category-${k.id}`} labelId={`category-label-${k.id}`} value={k.category === NO_CATEGORY ? "" : k.category ?? ""} options={vocab.categories} inactive={vocab.inactiveCategories} onChange={(c) => setCategoryOf(k.id, c)} size="sm" appearance="quiet" emptyLabel="Add category" />
                            </span>
                          ) : <span className="min-w-0 max-w-[45%] shrink-0 truncate px-2 text-muted-foreground" title={k.category}>{k.category}</span>}
                          <Button type="button" variant="ghost" size="icon-sm" className="max-md:size-11" aria-label={`Remove ${k.name}`} onClick={() => remove(k.id)} data-remove-skill={k.id}>
                            <i className="fa-light fa-xmark" aria-hidden="true" />
                          </Button>
                        </li>
                      )
                    })}
                  </ul>
                ) : adding ? null : (
                  <FirstRun data-no-skills-yet scene="newList" title={`No ${skillNounPlural()} on this list yet`} body={hasLibrary ? `Write your own, or reuse ${skillNounPlural()} from your library.` : "Write them here, or paste a list."} actions={addButtons} error={skillError ? <FieldError data-skill-error>{skillError}</FieldError> : null} />
                )}
              </section>
            </FloatingSheetPanelBody>
            <FloatingSheetPanelWorkflowFooter onCancel={cancel} primaryLabel="Next" onPrimary={save} primaryIconClassName="fa-light fa-arrow-right text-xs" />
          </>
        )}
      </FloatingSheetPanelContent>
    </FloatingSheetPanel>
    <DiscardChangesDialog open={asking} onKeep={() => setAsking(false)} onDiscard={() => { setAsking(false); onClose() }} body={unsaved} />
    <DiscardChangesDialog open={askingDraft} onKeep={() => setAskingDraft(false)} onDiscard={closeLibrary} body="Your selection has not been added." />
    <DiscardChangesDialog open={leave.asking} onKeep={() => leave.setAsking(false)} onDiscard={() => leave.go(onClose)} body={unsaved} />
    </>
  )
}

/** Step 2: program settings apply; a skill differs only where the admin says so, and only its number sits here [Sankalp, 11-02, 11-04]. */
export function ListSetupLevel({ model, list, leaveRef, onBack, onNext }: { model: ListsModel; list: SkillList; leaveRef: React.MutableRefObject<(() => void) | null>; onBack: () => void; onNext: () => void }) {
  const to = useLabHref()
  const state = model.state
  const skills = React.useMemo(() => { const on = new Set(list.skillIds); return state.skills.filter((k) => on.has(k.id)).sort((a, b) => a.name.localeCompare(b.name)) }, [state.skills, list.skillIds])
  const noSettings = skills.length > 0 && skills.every((k) => configurationOf(state, k) === "not-configured")
  leaveRef.current = onBack
  React.useEffect(() => () => { leaveRef.current = null }, [leaveRef])
  return (
    <>
      <FloatingSheetPanelToolbar onBack={onBack} backLabel={`Back to ${list.name}`} closeLabel="Close" showSize={false} />
      <FloatingSheetPanelHeader title={`How these ${skillNounPlural()} are judged`} subtitle={`Step 2 of 3 · ${list.name}`} />
      <FloatingSheetPanelBody className="flex min-w-0 flex-col gap-4 px-4 pb-4 pt-1" data-list-setup>
        <SettingsSummary
          id="list-setup-settings"
          rule={programSettingsOf(state)?.rule ?? null}
          emptyText={`Your program has not set how ${skillNounPlural()} are judged.`}
          action={<Button asChild variant="outline" size="sm"><Link href={to("admin/evaluation-settings", {})}>{noSettings ? "Set them" : "Change"}<i className="fa-light fa-arrow-right text-xs" aria-hidden="true" /></Link></Button>}
        />
        {/* The number is each skill's Times needed (2026-11-11, Romit: "the number isn't clear to me"). One column caption, as the Library's Times needed
            column and the settings times table do, not a unit on every row; a number the skill keeps of its own reads bold, as in the Library. The
            configuration badge sits with the name, so it never reads as the number's label. */}
        <div className="flex flex-col rounded-[var(--radius)] border border-border" data-list-setup-table>
          <div className="flex items-center gap-3 border-b border-border px-3 py-1.5" aria-hidden="true">
            <span className={cn(TYPE.meta, "min-w-0 flex-1")}>{capitalize(skillNoun())}</span>
            <span className={cn(TYPE.meta, "w-28 shrink-0 whitespace-nowrap")}>Times needed</span>
          </div>
          <ul className="flex flex-col px-3" aria-label={capitalize(skillNounPlural())} data-list-setup-rows={skills.length}>
            {skills.map((k) => {
              const word = configurationOf(state, k)
              const spec = CONFIGURATION_META[word]
              return (
                <li key={k.id} className="flex min-h-12 items-center gap-3 border-b border-border py-1.5 text-sm last:border-b-0 [contain-intrinsic-size:auto_3rem] [content-visibility:auto]">
                  <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="min-w-0 max-w-full truncate" title={k.name}>{k.name}</span>
                    <Link href={configureHref(k.id)} aria-label={`Configure ${k.name}, ${spec.label}`} className="shrink-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
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
      <FloatingSheetPanelWorkflowFooter cancelLabel="Back" onCancel={onBack} primaryLabel="Next" onPrimary={onNext} primaryIconClassName="fa-light fa-arrow-right text-xs" />
    </>
  )
}
