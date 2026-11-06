"use client"

/**
 * New skill list, the start of setup [Aarti and Sankalp, 741d1f1c ch 9-10, D-L122]: step 1 names the list and shows only what is on it (D-L123), with Add new and Add from library, a level in this panel; step 2 says how they are judged; step 3 assigns it. Course mapping is separate.
 */
import * as React from "react"
import { usePresent } from "@/components/lab/lab-bar/present"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { FloatingSheetPanel } from "@/components/lab/shared/sheet"
import { FloatingSheetPanelBody, FloatingSheetPanelContent, FloatingSheetPanelHeader, FloatingSheetPanelToolbar, FloatingSheetPanelWorkflowFooter } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { Field, FieldError, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { DiscardChangesDialog, useLeaveGuard } from "@/components/lab/shared/unsaved-guard"
import { createList, setListSkills, skillLists, validateNewList, type SkillList } from "@/lib/lab/lists"
import { capitalize, countSkills, skillListNoun, skillNoun, skillNounPlural } from "@/lib/lab/terms"
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
  const [newCategory, setNewCategory] = React.useState("")
  // Skills added here, whose category can still be set here. A skill that already has one keeps it: that is the Library's to change.
  const [addedHere, setAddedHere] = React.useState<ReadonlySet<string>>(new Set())
  const vocab = useVocabOptions()
  const stamp = () => `${DEMO_TODAY}T${new Date().toISOString().slice(11)}`
  const setCategoryOf = (id: string, category: string) => store.update((st) => setSkillDetailsInStore(category ? ensureVocab(st, "categories", [category], IDS.ross, stamp()) : st, [id], { category }, IDS.ross, stamp()))
  const rows = React.useMemo(() => model.state.skills.filter((k) => k.active !== false).sort((a, b) => a.name.localeCompare(b.name)), [model.state])
  const onList = rows.filter((k) => picked.has(k.id))
  const others = skillLists(model.lists).filter((l) => l.skillIds.length > 0)
  const none = React.useMemo(() => new Set<string>(), [])
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
    // One name, or a pasted list, one per line. A name already in the library goes on the list as it is.
    const names = [...new Set(raw.split(/\r?\n/).map((n) => n.trim().replace(/\s+/g, " ")).filter(Boolean))]
    if (!names.length) return
    const existing = new Map(model.state.skills.map((k) => [normName(k.name), k.id]))
    const fresh: AddedSkill[] = []
    const ids: string[] = []
    names.forEach((n, i) => {
      const had = existing.get(normName(n))
      if (had) { ids.push(had); return }
      const id = `lab-skill-${Date.now().toString(36)}-${i}`
      fresh.push(draftToSkill({ ...EMPTY_DRAFT, name: n, category: newCategory, section: newCategory }, id))
      ids.push(id)
    })
    if (fresh.length) {
      store.update((st) => addSkillsToStore(newCategory ? ensureVocab(st, "categories", [newCategory], IDS.ross, stamp()) : st, fresh, IDS.ross, stamp()))
      setAddedHere((x) => new Set([...x, ...fresh.map((k) => k.id)]))
    }
    setPicked((x) => new Set([...x, ...ids]))
    setTyped("")
    setSkillError(null)
    focusOn("#new-skill-name")
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
  // Nothing on the list yet: the drawing carries the two ways in. Once there is something to count, they move up beside the count.
  const started = onList.length > 0 || adding
  const hasLibrary = rows.length > 0
  const addButtons = (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => { setAdding(true); focusOn("#new-skill-name") }} data-add-new>Add new</Button>
      {hasLibrary ? <Button type="button" variant="outline" size="sm" onClick={openLibrary} data-add-library>Add from library</Button> : null}
    </>
  )
  return (
    <>
    <FloatingSheetPanel open onOpenChange={(o) => (o ? null : draft ? leaveLibrary() : cancel())}>
      <FloatingSheetPanelContent contentSlot="lab-new-list" style={present ? { top: "2.75rem", height: "calc(100dvh - 3.25rem)" } : undefined} side="right" size="lg" onOpenAutoFocus={(e) => { e.preventDefault(); document.getElementById("list-name")?.focus() }}>
        {draft ? (
          <>
            <FloatingSheetPanelToolbar onBack={leaveLibrary} backLabel="Back to the list" closeLabel="Close" showSize={false} />
            <FloatingSheetPanelHeader title="Add from library" subtitle={name.trim() || `New ${skillListNoun()}`} />
            <FloatingSheetPanelBody className="flex min-w-0 flex-col gap-2 px-4 pb-4 pt-1" data-new-list-library>
              <SkillPicker skills={rows} savedIds={picked} selected={draft} others={others} onChange={(ids) => setDraft(ids)} idPrefix="new-list" library bulkHref={to("admin/import-ai-review", {})} />
            </FloatingSheetPanelBody>
            <FloatingSheetPanelWorkflowFooter cancelLabel="Back" onCancel={leaveLibrary} primaryLabel={draftRemoved ? "Update the list" : draftNew ? `Add ${countSkills(draftNew)}` : "Add"} primaryDisabled={!draftChanged} onPrimary={() => { setPicked(draft); setSkillError(null); closeLibrary() }} primaryIconClassName="fa-light fa-plus text-xs" />
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
                    {started ? <span className="text-sm font-normal tabular-nums text-muted-foreground" data-picked-count={onList.length}>{fmt(onList.length)}</span> : null}
                  </h2>
                  {started ? <span className="flex items-center gap-2">{addButtons}</span> : null}
                </div>
                {adding ? (
                  <div className="flex items-center gap-2" data-add-new-row>
                    <Input id="new-skill-name" aria-label={`Name of the new ${noun}`} placeholder={`Name of the new ${noun}`} className="min-w-0 flex-1" value={typed} onChange={(e) => setTyped(e.target.value)} onPaste={(e) => { const text = e.clipboardData.getData("text"); if (/\r?\n/.test(text.trim())) { e.preventDefault(); addTyped(text) } }} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); addTyped(typed) } }} />
                    <div className="w-48 shrink-0" data-add-new-category><span id="new-skill-category-label" className="sr-only">{`Category for the new ${noun}`}</span><CategoryPicker id="new-skill-category" labelId="new-skill-category-label" value={newCategory} options={vocab.categories} inactive={vocab.inactiveCategories} onChange={setNewCategory} emptyLabel="No category" /></div>
                    <Button type="button" variant="outline" size="default" disabled={!typed.trim()} onClick={() => addTyped(typed)}>Add</Button>
                    <Button type="button" variant="ghost" size="default" onClick={() => { setAdding(false); setTyped(""); focusOn("[data-add-new]") }}>Done</Button>
                  </div>
                ) : null}
                {skillError && started ? <FieldError data-skill-error>{skillError}</FieldError> : null}
                {onList.length ? (
                  <ul className="flex flex-col rounded-[var(--radius)] border border-border ps-3 pe-1" aria-label={`${capitalize(skillNounPlural())} on this list`} data-list-rows={onList.length}>
                    {onList.map((k) => (
                      <li key={k.id} className="flex min-h-11 items-center gap-3 border-b border-border py-1 text-sm last:border-b-0 [contain-intrinsic-size:auto_2.75rem] [content-visibility:auto]">
                        <span className="min-w-0 flex-1 truncate" title={k.name}>{k.name}</span>
                        {addedHere.has(k.id) || !k.category?.trim() || k.category === NO_CATEGORY ? (
                          <div className="flex w-48 shrink-0 justify-end" data-row-category><span id={`category-label-${k.id}`} className="sr-only">{`Category for ${k.name}`}</span><CategoryPicker id={`category-${k.id}`} labelId={`category-label-${k.id}`} value={k.category === NO_CATEGORY ? "" : k.category ?? ""} options={vocab.categories} inactive={vocab.inactiveCategories} onChange={(c) => setCategoryOf(k.id, c)} size="sm" emptyLabel="No category" /></div>
                        ) : <span className="shrink-0 text-muted-foreground">{k.category}</span>}
                        <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove ${k.name}`} onClick={() => setPicked((x) => { const next = new Set(x); next.delete(k.id); return next })}>
                          <i className="fa-light fa-xmark" aria-hidden="true" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : adding ? null : (
                  <FirstRun data-no-skills-yet scene="newList" title={`Add the ${skillNounPlural()} for this list`} body={hasLibrary ? "Write new ones, or pick from your library." : "Write them here, or paste a list."} actions={addButtons} error={skillError ? <FieldError data-skill-error>{skillError}</FieldError> : null} />
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
        <ul className="flex flex-col rounded-[var(--radius)] border border-border px-3" aria-label={capitalize(skillNounPlural())} data-list-setup-rows={skills.length}>
          {skills.map((k) => {
            const word = configurationOf(state, k)
            const spec = CONFIGURATION_META[word]
            return (
              <li key={k.id} className="flex min-h-12 items-center gap-3 border-b border-border py-1.5 text-sm last:border-b-0 [contain-intrinsic-size:auto_3rem] [content-visibility:auto]">
                <span className="min-w-0 flex-1 truncate" title={k.name}>{k.name}</span>
                <Link href={configureHref(k.id)} aria-label={`Configure ${k.name}, ${spec.label}`} className="shrink-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <StatusBadge label={spec.label} tone={spec.tone} icon={spec.icon} size="sm" />
                </Link>
                <span className="w-20 shrink-0"><TimesNeededCell id={k.id} name={k.name} /></span>
              </li>
            )
          })}
        </ul>
      </FloatingSheetPanelBody>
      <FloatingSheetPanelWorkflowFooter cancelLabel="Back" onCancel={onBack} primaryLabel="Next" onPrimary={onNext} primaryIconClassName="fa-light fa-arrow-right text-xs" />
    </>
  )
}
