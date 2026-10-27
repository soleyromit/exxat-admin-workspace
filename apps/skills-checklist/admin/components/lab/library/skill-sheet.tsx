"use client"

/**
 * Add a skill, option set 1 (docs/knowledge/design/skill-setup-journey/02 section 6): a short DS FloatingSheetPanel over
 * the library, so the list stays in view. Five fields: Name, Description (optional, REQ SL-02), Category, Tags, Required to
 * graduate.
 * - MODAL (strategy/07 section 3 "Modal surfaces count alone", the same rule as the Export A panel): a half-filled form
 *   is a door in front of the work, not an inspector beside it, so the page behind is inert (Radix modal: focus trap,
 *   pointer lock, aria-hidden siblings). Escape and an outside click go through the unsaved-change guard. On close, focus
 *   returns to the page's "Add a skill" button ([data-add-skill-trigger]) even when the sheet opened by default.
 * - No evaluation model here. Configure owns it and nothing is preselected (REQ SC-01, SC-02); the skill is saved as
 *   Not configured (REQ IM-09, IM-12).
 * - Category (one, optional, REQ SL-03) and tags (any number, REQ SL-04) are picked from the program's own lists or created
 *   in the picker (REQ SL-05; components/lab/library/category-tag-pickers.tsx, decision D-X28).
 * - Errors: a FieldError under the name and focus moved to it after a failed save; a repeated name offers "Open it".
 *   Name is the only field that can fail, so a ValidationSummary above it would say the same sentence twice (rule L11).
 * - Unsaved-change guard on close. Success is a LocalBanner on the library (never a toast).
 * - One filled primary, "Save and configure". "Save for later" is the outline alternative.
 * The same sheet edits a skill's details (mode="edit"); evaluation settings stay on Configure.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Textarea } from "@exxatdesignux/ui/components/ui/textarea"
import { ToggleSwitch } from "@exxatdesignux/ui/components/ui/toggle-switch"
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { FloatingSheetPanel, FloatingSheetPanelBody, FloatingSheetPanelContent, FloatingSheetPanelFooter, FloatingSheetPanelHeader } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@exxatdesignux/ui/components/ui/alert-dialog"
import { EMPTY_DRAFT, NO_CATEGORY, findDuplicate, validateDraft, type DraftErrors, type LibraryRow, type SkillDraft } from "@/lib/lab/library"
import { aNoun, skillNoun } from "@/lib/lab/terms"
import { CategoryPicker, TagsPicker, useVocabOptions } from "./category-tag-pickers"

export function draftFromRow(r: LibraryRow): SkillDraft {
  return { name: r.name, description: r.description, section: r.section === NO_CATEGORY ? "" : r.section, group: r.group, category: r.category, tags: r.tags, model: r.model, mandatoryDefault: null, requiredToGraduate: r.requiredToGraduate }
}

export interface SkillSheetProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  rows: readonly LibraryRow[]
  mode?: "add" | "edit"
  editing?: LibraryRow | null
  /** Prefills the category (add from a category in the grouped view). */
  defaultSection?: string
  onSave: (d: SkillDraft, next: "close" | "configure") => void
  /** "Open it" on a repeated name: show the existing skill instead. */
  onOpenExisting?: (id: string) => void
}

export function SkillSheet({ open, onOpenChange, rows, mode = "add", editing, defaultSection, onSave, onOpenExisting }: SkillSheetProps) {
  const initial = React.useMemo(() => (mode === "edit" && editing ? draftFromRow(editing) : { ...EMPTY_DRAFT, section: defaultSection ?? "" }), [mode, editing, defaultSection])
  const [d, setD] = React.useState<SkillDraft>(initial)
  const [errors, setErrors] = React.useState<DraftErrors>({})
  const [attempted, setAttempted] = React.useState(false)
  const [guard, setGuard] = React.useState(false)
  React.useEffect(() => { if (open) { setD(initial); setErrors({}); setAttempted(false) } }, [open, initial])
  // The shared categories and tags Settings edits (SL-03 to SL-06): active ones offered, inactive ones marked.
  const opts = useVocabOptions()
  const others = React.useMemo(() => rows.filter((r) => r.id !== editing?.id), [rows, editing])
  const names = React.useMemo(() => others.map((r) => r.name), [others])
  const dirty = JSON.stringify(d) !== JSON.stringify(initial)
  const set = <K extends keyof SkillDraft>(k: K, v: SkillDraft[K]) => {
    setD((p) => {
      const next = { ...p, [k]: v }
      if (attempted) setErrors(validateDraft(next, names))
      return next
    })
  }

  React.useEffect(() => {
    if (!open || !dirty) return
    const h = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener("beforeunload", h)
    return () => window.removeEventListener("beforeunload", h)
  }, [open, dirty])

  const requestClose = () => (dirty ? setGuard(true) : onOpenChange(false))
  const submit = (next: "close" | "configure") => {
    const e = validateDraft(d, names)
    setAttempted(true)
    setErrors(e)
    if (Object.keys(e).length) {
      document.getElementById("skill-name")?.focus()
      return
    }
    onSave(d, next)
    onOpenChange(false)
  }

  const noun = skillNoun()
  const duplicate = errors.name ? findDuplicate(d.name, others) : null
  return (
    <>
      <FloatingSheetPanel open={open} onOpenChange={(o) => (o ? onOpenChange(true) : requestClose())} modal>
        <FloatingSheetPanelContent
          contentSlot="lab-add-skill"
          side="right"
          size="sm"
          aria-modal="true"
          onCloseAutoFocus={(e) => {
            if (mode !== "add") return
            const trigger = document.querySelector<HTMLElement>("[data-add-skill-trigger]")
            if (trigger) { e.preventDefault(); trigger.focus() }
          }}
        >
          <FloatingSheetPanelHeader title={mode === "add" ? `Add ${aNoun(noun)}` : `Edit ${editing?.name ?? noun}`} onClose={requestClose} />
          <form id="lab-skill-form" noValidate className="flex min-h-0 flex-1 flex-col" onSubmit={(e) => { e.preventDefault(); submit(mode === "add" ? "configure" : "close") }}>
            <FloatingSheetPanelBody className="flex flex-col gap-5 px-4 pt-1 pb-4">
              <Field data-invalid={!!errors.name || undefined}>
                <FieldLabel htmlFor="skill-name">Name</FieldLabel>
                <Input id="skill-name" autoFocus value={d.name} maxLength={160} onChange={(e) => set("name", e.target.value)} aria-invalid={!!errors.name || undefined} aria-describedby={errors.name ? "skill-name-error" : undefined} />
                {errors.name ? (
                  <FieldError id="skill-name-error">
                    <span className="flex flex-wrap items-center gap-x-2">
                      {errors.name}
                      {duplicate && onOpenExisting ? (
                        <Button type="button" variant="link" size="xs" className="h-auto p-0" onClick={() => { onOpenChange(false); onOpenExisting(duplicate.id) }}>Open it</Button>
                      ) : null}
                    </span>
                  </FieldError>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="skill-description">Description (optional)</FieldLabel>
                <Textarea id="skill-description" rows={3} maxLength={600} value={d.description} onChange={(e) => set("description", e.target.value)} />
              </Field>
              <Field>
                <FieldLabel id="skill-category-label" htmlFor="skill-category">Category</FieldLabel>
                <CategoryPicker id="skill-category" labelId="skill-category-label" value={d.category || d.section} options={opts.categories} inactive={opts.inactiveCategories} onChange={(v) => setD((p) => ({ ...p, category: v, section: v }))} className="w-full" />
              </Field>
              <Field>
                <FieldLabel id="skill-tags-label" htmlFor="skill-tags">Tags (optional)</FieldLabel>
                <TagsPicker id="skill-tags" labelId="skill-tags-label" value={d.tags} options={opts.tags} inactive={opts.inactiveTags} onChange={(t) => set("tags", t)} describedBy="skill-tags-help" />
                <FieldDescription id="skill-tags-help">Type to find or create one.</FieldDescription>
              </Field>
              <Field orientation="horizontal" className="items-start justify-between gap-4">
                <FieldContent>
                  <FieldLabel id="skill-required-label" htmlFor="skill-required">Required to graduate</FieldLabel>
                </FieldContent>
                <ToggleSwitch id="skill-required" checked={d.requiredToGraduate} onChange={(v) => set("requiredToGraduate", v)} aria-labelledby="skill-required-label" />
              </Field>
            </FloatingSheetPanelBody>
            <FloatingSheetPanelFooter className="flex items-center justify-end gap-2">
              {/* Add: the header's close (and Escape) is the one way out, so the footer holds the two saves only (density
                  budget: Description, REQ SL-02, took the place of a second Cancel). */}
              {mode === "add" ? null : <Button type="button" variant="ghost" size="sm" onClick={requestClose}>Cancel</Button>}
              {mode === "add" ? (
                <>
                  <Button type="button" variant="outline" size="sm" onClick={() => submit("close")}>Save for later</Button>
                  <Button type="submit" variant="default" size="sm">Save and configure</Button>
                </>
              ) : (
                <Button type="submit" variant="default" size="sm" disabled={!dirty}>Save changes</Button>
              )}
            </FloatingSheetPanelFooter>
          </form>
        </FloatingSheetPanelContent>
      </FloatingSheetPanel>
      <AlertDialog open={guard} onOpenChange={setGuard}>
        {/* Above the floating sheet (z-80), so the guard is not hidden behind the panel it protects. */}
        <AlertDialogContent
          className="z-[90]"
          overlayClassName="z-[90]"
          onCloseAutoFocus={(e) => {
            // "Keep editing" returns focus to the name field inside the modal sheet, not to the inert page behind it.
            const name = document.getElementById("skill-name")
            if (name) { e.preventDefault(); name.focus() }
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>{mode === "add" ? `Discard this ${noun}?` : "Discard your changes?"}</AlertDialogTitle>
            <AlertDialogDescription>{mode === "add" ? `The ${noun} has not been added.` : "Your edits have not been saved."}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline" size="sm">Keep editing</AlertDialogCancel>
            <AlertDialogAction variant="default" size="sm" onClick={() => { setGuard(false); onOpenChange(false) }}>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
