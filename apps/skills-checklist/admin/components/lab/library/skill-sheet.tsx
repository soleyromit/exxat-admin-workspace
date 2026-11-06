"use client"

/**
 * Add a skill, option set 1 (docs/knowledge/design/skill-setup-journey/02 section 6): a short DS FloatingSheetPanel over
 * the library, so the list stays in view. Four fields: Name, Description (optional, REQ SL-02), Category, Tags.
 * - MODAL (strategy/07 section 3 "Modal surfaces count alone", the same rule as the Export A panel): a half-filled form
 *   is a door in front of the work, not an inspector beside it, so the page behind is inert (Radix modal: focus trap,
 *   pointer lock, aria-hidden siblings). Escape, an outside click, Open it and browser Back go through the unsaved-change guard. On opening, focus is in Name; on
 *   close it returns to the button that opened the sheet (Add a skill or the chevron), even when the sheet opened by default.
 * - No evaluation model here. Evaluation settings owns it and nothing is preselected (REQ SC-01, SC-02); the skill takes the configuration the
 *   result banner names (REQ IM-09, IM-12).
 * - Category (one, optional, REQ SL-03) and tags (any number, REQ SL-04) are picked from the program's own lists or created
 *   in the picker (REQ SL-05; components/lab/library/category-tag-pickers.tsx, decision D-X28).
 * - Errors: a FieldError under the name and focus moved to it after a failed save. Name is the only field that can fail, so a ValidationSummary
 *   above it would say the same sentence twice (rule L11).
 * - A name already in the library warns as it is typed and offers the Add several choices (REQ IM-06), with Open it, instead of a hard block.
 * - Unsaved-change guard on close. Success is a LocalBanner on the library (never a toast).
 * - One filled primary and Cancel (map D2). It says what it will do (rule E4): Add skill for Keep both, Replace skill for Replace. With Skip chosen nothing would happen, so Add skill
 *   is disabled and the line beside the choice says why; a second press or Enter after the sheet closed does nothing.
 * The same sheet edits a skill's details (mode="edit"), where a repeated name is still an error: there is nothing to keep both of.
 */
import * as React from "react"
import { useV2State } from "@/lib/v2/react"
import { ruleForNewSkill } from "@/lib/lab/program-settings"
import { SettingsSummary } from "./settings-summary"
import { useEmbeddedStep } from "@/components/lab/layout/embedded"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Textarea } from "@exxatdesignux/ui/components/ui/textarea"
import { Field, FieldError, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { FloatingSheetPanelBody, FloatingSheetPanelContent, FloatingSheetPanelFooter, FloatingSheetPanelHeader } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { FloatingSheetPanel } from "@/components/lab/shared/sheet"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@exxatdesignux/ui/components/ui/alert-dialog"
import { EMPTY_DRAFT, NO_CATEGORY, duplicateChoices, findDuplicate, keepBothSeveralName, libraryTwins, normName, validateDraft, type DraftErrors, type DuplicateChoice, type LibraryRow, type SkillDraft } from "@/lib/lab/library"
import { aNoun, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { useLeaveGuard } from "@/components/lab/shared/unsaved-guard"
import { focusSheetOpener } from "@/components/lab/shared/focus"
import { CategoryPicker, TagsPicker, useVocabOptions } from "./category-tag-pickers"
import { DuplicateChoiceSelect } from "./add-several-sheet"

export function draftFromRow(r: LibraryRow): SkillDraft {
  return { name: r.name, description: r.description, section: r.section === NO_CATEGORY ? "" : r.section, group: r.group, category: r.category, tags: r.tags, model: r.model, mandatoryDefault: null }
}

export interface SkillSheetProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  rows: readonly LibraryRow[]
  mode?: "add" | "edit"
  editing?: LibraryRow | null
  /** Prefills the category (add from a category in the grouped view). */
  defaultSection?: string
  /** `duplicate`: the name is already in the library and this is what the program chose (add only). */
  onSave: (d: SkillDraft, duplicate?: { choice: DuplicateChoice; twin: Pick<LibraryRow, "id" | "name"> }) => void
  /** "Open it" on a repeated name: show the existing skill instead. */
  onOpenExisting?: (id: string) => void
}

export function SkillSheet({ open, onOpenChange, rows, mode = "add", editing, defaultSection, onSave, onOpenExisting }: SkillSheetProps) {
  const newSkillRule = ruleForNewSkill(useV2State())
  const initial = React.useMemo(() => (mode === "edit" && editing ? draftFromRow(editing) : { ...EMPTY_DRAFT, section: defaultSection ?? "" }), [mode, editing, defaultSection])
  const [d, setD] = React.useState<SkillDraft>(initial)
  const [errors, setErrors] = React.useState<DraftErrors>({})
  const [attempted, setAttempted] = React.useState(false)
  const [guard, setGuard] = React.useState(false)
  const [choice, setChoice] = React.useState<DuplicateChoice>("skip")
  /** Open it, held back by "Discard your changes?". */
  const [openAfter, setOpenAfter] = React.useState<string | null>(null)
  /** The sheet is leaving for the skill it found, whose panel takes focus. */
  const leavingForSkill = React.useRef(false)
  React.useEffect(() => { if (open) { setD(initial); setErrors({}); setAttempted(false); setChoice("skip") } }, [open, initial])
  // The shared categories and tags Settings edits (SL-03 to SL-06): active ones offered, inactive ones marked.
  const opts = useVocabOptions()
  const inWorkflow = useEmbeddedStep() !== null
  const others = React.useMemo(() => rows.filter((r) => r.id !== editing?.id), [rows, editing])
  const names = React.useMemo(() => others.map((r) => r.name), [others])
  const adding = mode === "add"
  // Adding checks everything except a repeat, which is a choice here. Editing still refuses one.
  const check = (draft: SkillDraft) => validateDraft(draft, adding ? [] : names, inWorkflow ? "list" : "library")
  const dirty = JSON.stringify(d) !== JSON.stringify(initial)
  const set = <K extends keyof SkillDraft>(k: K, v: SkillDraft[K]) => {
    setD((p) => {
      const next = { ...p, [k]: v }
      if (attempted) setErrors(check(next))
      return next
    })
  }

  // Reload, closing the tab and browser Back ask too (rule E6).
  const leave = useLeaveGuard(open && dirty)

  // While the sheet closes after an add, its own new row must not read as a repeat.
  const twinRow = adding && open ? findDuplicate(d.name, others) : null
  const twin = twinRow ? libraryTwins(others).get(normName(twinRow.name)) ?? null : null
  const choices = duplicateChoices(twin ?? undefined)
  const chosen = choices.includes(choice) ? choice : "skip"
  const typedName = d.name.trim().replace(/\s+/g, " ")
  const skipping = !!twin && chosen === "skip"
  // Skip chosen and only the repeated name typed: nothing is left to lose, so Cancel simply closes [INFER]. Anything else typed still asks.
  const onlyName = JSON.stringify({ ...d, name: initial.name }) === JSON.stringify(initial)
  const requestClose = () => (dirty && !(skipping && onlyName) ? setGuard(true) : onOpenChange(false))
  const openExisting = (id: string) => {
    // The same as Cancel: only the repeated name typed and Skip chosen is nothing to lose.
    if (dirty && !(skipping && onlyName)) { setOpenAfter(id); setGuard(true); return }
    leavingForSkill.current = true
    onOpenChange(false)
    onOpenExisting?.(id)
  }
  const discard = () => {
    const after = openAfter
    setGuard(false)
    setOpenAfter(null)
    if (leave.asking) { leave.go(() => onOpenChange(false)); return }
    if (after) leavingForSkill.current = true
    onOpenChange(false)
    if (after) onOpenExisting?.(after)
  }
  const submit = () => {
    // A double click or a second Enter lands here while the sheet is closing, when the name just added reads as a repeat.
    if (!open || skipping) return
    const e = check(d)
    setAttempted(true)
    setErrors(e)
    if (Object.keys(e).length) {
      document.getElementById("skill-name")?.focus()
      return
    }
    onSave(d, twin ? { choice: chosen, twin } : undefined)
    onOpenChange(false)
  }

  const openRef = React.useRef(open)
  openRef.current = open
  const noun = skillNoun()
  const duplicate = errors.name ? findDuplicate(d.name, others) : null
  const place = inWorkflow ? "list" : "library"
  return (
    <>
      <FloatingSheetPanel open={open} onOpenChange={(o) => (o ? onOpenChange(true) : requestClose())} modal>
        <FloatingSheetPanelContent
          contentSlot="lab-add-skill"
          side="right"
          size="sm"
          aria-modal="true"
          onOpenAutoFocus={(e) => { e.preventDefault(); document.getElementById("skill-name")?.focus() }}
          onCloseAutoFocus={(e) => {
            if (mode !== "add") return
            e.preventDefault()
            if (leavingForSkill.current) { leavingForSkill.current = false; return }
            focusSheetOpener()
          }}
        >
          <FloatingSheetPanelHeader title={mode === "add" ? `Add ${aNoun(noun)}` : `Edit ${editing?.name ?? noun}`} onClose={requestClose} />
          <form id="lab-skill-form" noValidate className="flex min-h-0 flex-1 flex-col" onSubmit={(e) => { e.preventDefault(); submit() }}>
            <FloatingSheetPanelBody className="flex flex-col gap-5 px-4 pt-1 pb-4">
              <Field data-invalid={!!errors.name || undefined}>
                <FieldLabel htmlFor="skill-name">Name</FieldLabel>
                <Input id="skill-name" autoFocus value={d.name} onChange={(e) => set("name", e.target.value)} aria-invalid={!!errors.name || undefined} aria-describedby={errors.name ? "skill-name-error" : undefined} />
                {errors.name ? (
                  <FieldError id="skill-name-error">
                    <span className="flex flex-wrap items-center gap-x-2">
                      {errors.name}
                      {duplicate && onOpenExisting ? (
                        <Button type="button" variant="link" size="xs" className="h-auto p-0" onClick={() => openExisting(duplicate.id)}>Open it</Button>
                      ) : null}
                    </span>
                  </FieldError>
                ) : null}
                {twin ? (
                  <span className="flex flex-col gap-2" data-add-duplicate>
                    <span role="status" className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--status-badge-warning-fg)]">
                      <i className="fa-light fa-triangle-exclamation" aria-hidden="true" />
                      {`${twin.name} is already in the ${place}.`}
                      {onOpenExisting ? <Button type="button" variant="link" size="xs" className="h-auto p-0" onClick={() => openExisting(twin.id)}>Open it</Button> : null}
                    </span>
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <DuplicateChoiceSelect id="skill-duplicate" value={chosen} choices={choices} onChange={setChoice} label={`${twin.name} is already in the ${place}`} />
                      <span className="text-sm text-muted-foreground" data-duplicate-outcome>
                        {chosen === "skip" ? "Nothing is added." : chosen === "keep-both" ? `Added as ${keepBothSeveralName(typedName, rows.map((r) => r.name))}.` : "Its settings stay. What you enter here replaces its details."}
                      </span>
                    </span>
                  </span>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="skill-description">Description (optional)</FieldLabel>
                <Textarea id="skill-description" rows={3} maxLength={600} value={d.description} onChange={(e) => set("description", e.target.value)} />
              </Field>
              <Field>
                <FieldLabel id="skill-category-label" htmlFor="skill-category">Category (optional)</FieldLabel>
                <CategoryPicker id="skill-category" labelId="skill-category-label" value={d.category || d.section} options={opts.categories} inactive={opts.inactiveCategories} onChange={(v) => setD((p) => ({ ...p, category: v, section: v }))} className="w-full" />
              </Field>
              <Field>
                <FieldLabel id="skill-tags-label" htmlFor="skill-tags">Tags (optional)</FieldLabel>
                <TagsPicker id="skill-tags" labelId="skill-tags-label" value={d.tags} options={opts.tags} inactive={opts.inactiveTags} onChange={(t) => set("tags", t)} />
              </Field>
              {/* What the new skill starts with: read here, changed on Evaluation settings or on the skill once it exists. */}
              {adding ? <SettingsSummary id="add-skill-settings" rule={newSkillRule} emptyText={`Your program has not set how ${skillNounPlural()} are judged. This ${skillNoun()} waits until it has.`} /> : null}
            </FloatingSheetPanelBody>
            <FloatingSheetPanelFooter className="flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={requestClose}>Cancel</Button>
              {adding ? (
                <Button type="submit" variant="default" size="sm" disabled={skipping}>{twin && chosen === "replace" ? `Replace ${noun}` : `Add ${noun}`}</Button>
              ) : (
                <Button type="submit" variant="default" size="sm" disabled={!dirty}>Save changes</Button>
              )}
            </FloatingSheetPanelFooter>
          </form>
        </FloatingSheetPanelContent>
      </FloatingSheetPanel>
      <AlertDialog open={guard || leave.asking} onOpenChange={(o) => { if (!o) { setGuard(false); setOpenAfter(null); leave.setAsking(false) } }}>
        {/* Above the floating sheet (z-80), so the guard is not hidden behind the panel it protects. */}
        <AlertDialogContent
          className="z-[90]"
          overlayClassName="z-[90]"
          onCloseAutoFocus={(e) => {
            // "Keep editing" returns focus to the name field inside the modal sheet, not to the inert page behind it. Discard leaves it to the sheet's own close.
            e.preventDefault()
            if (openRef.current) document.getElementById("skill-name")?.focus()
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Discard your changes?</AlertDialogTitle>
            <AlertDialogDescription>{mode === "add" ? `The ${noun} has not been added.` : "Your edits have not been saved."}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline" size="sm">Keep editing</AlertDialogCancel>
            <AlertDialogAction variant="default" size="sm" onClick={discard}>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
