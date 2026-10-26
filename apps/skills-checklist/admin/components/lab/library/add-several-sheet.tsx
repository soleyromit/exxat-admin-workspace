"use client"

/**
 * Add a skill, option set 3 "Many at once": add several by name. A coordinator pastes or types 5 to 30 names (from an email
 * or a spreadsheet column); each becomes a skill that is not configured, in one category or none (REQ IM-12, IM-09, SL-03).
 * - Live check as you type: how many will be added, and which lines are skipped (already in the library, repeated in the
 *   list, too long), so nothing is created twice (REQ IM-06 spirit; the same normalised-name rule as the add sheet).
 * - One filled primary "Add {n} skills". A failed attempt shows a FieldError and moves focus to the list (one field, so no
 *   separate summary that would repeat it).
 * - Unsaved-change guard on close. Success is a LocalBanner on the library (never a toast), offering to configure them together.
 * No evaluation model is asked or assumed (REQ SC-02).
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Textarea } from "@exxatdesignux/ui/components/ui/textarea"
import { Field, FieldDescription, FieldError, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { FloatingSheetPanel, FloatingSheetPanelBody, FloatingSheetPanelContent, FloatingSheetPanelFooter, FloatingSheetPanelHeader } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@exxatdesignux/ui/components/ui/alert-dialog"
import { parseSeveral, pickerOptions, type LibraryRow, type PastedLine } from "@/lib/lab/library"
import { countSkills, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { CreatableSelect } from "./skill-sheet"

const SKIP_REASON: Record<Exclude<PastedLine["kind"], "ready">, string> = {
  "in-library": "already in the library",
  "in-paste": "repeated in your list",
  "too-long": "longer than 120 characters",
}

export function AddSeveralSheet({ open, onOpenChange, rows, onAdd }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  rows: readonly LibraryRow[]
  onAdd: (names: string[], category: string) => void
}) {
  const [text, setText] = React.useState("")
  const [category, setCategory] = React.useState("")
  const [attempted, setAttempted] = React.useState(false)
  const [guard, setGuard] = React.useState(false)
  React.useEffect(() => { if (open) { setText(""); setCategory(""); setAttempted(false) } }, [open])
  const names = React.useMemo(() => rows.map((r) => r.name), [rows])
  const opts = React.useMemo(() => pickerOptions(rows), [rows])
  const parsed = React.useMemo(() => parseSeveral(text, names), [text, names])
  const skipped = parsed.lines.filter((l) => l.kind !== "ready")
  const n = parsed.ready.length
  const error = attempted && n === 0 ? (parsed.lines.length ? `Every name is already in the library or repeated. Add a new ${skillNoun()} name.` : `Paste or type at least one ${skillNoun()} name.`) : undefined
  const dirty = text.trim() !== "" || category !== ""

  const requestClose = () => (dirty ? setGuard(true) : onOpenChange(false))
  const submit = () => {
    setAttempted(true)
    if (n === 0) return document.getElementById("several-names")?.focus()
    onAdd(parsed.ready, category)
    onOpenChange(false)
  }

  return (
    <>
      <FloatingSheetPanel open={open} onOpenChange={(o) => (o ? onOpenChange(true) : requestClose())}>
        <FloatingSheetPanelContent contentSlot="lab-add-several" side="right" size="lg">
          {/* CALL 10-26: this is the phase 1 bulk path, done once by the school or by the implementation team for it. */}
          <FloatingSheetPanelHeader title={`Add several ${skillNounPlural()}`} description="For a one-time bulk add by the school or the implementation team." onClose={requestClose} />
          <form id="lab-add-several-form" noValidate className="flex min-h-0 flex-1 flex-col" onSubmit={(e) => { e.preventDefault(); submit() }}>
            <FloatingSheetPanelBody className="flex flex-col gap-5 px-4 pt-1 pb-4">
              <Field data-invalid={!!error || undefined}>
                <FieldLabel htmlFor="several-names">Names, one per line</FieldLabel>
                <Textarea
                  id="several-names"
                  autoFocus
                  rows={10}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  aria-invalid={!!error || undefined}
                  aria-describedby={error ? "several-names-error several-names-help" : "several-names-help"}
                  className="font-normal"
                />
                <FieldDescription id="several-names-help">Paste from a spreadsheet or an email. Bullets and numbering are removed.</FieldDescription>
                {error ? <FieldError id="several-names-error">{error}</FieldError> : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="several-category">Category for all of them</FieldLabel>
                <CreatableSelect id="several-category" value={category} options={opts.sections} onChange={setCategory} placeholder="None" newLabel="New category" allowNone />
              </Field>
              {parsed.lines.length ? (
                <section aria-label="What will be added" className="flex flex-col gap-2" aria-live="polite">
                  <p className="text-sm text-foreground">
                    <span className="font-medium tabular-nums">{countSkills(n)}</span>
                    {" will be added, not configured."}
                    {skipped.length ? <span className="text-muted-foreground">{` ${skipped.length} skipped.`}</span> : null}
                  </p>
                  {skipped.length ? (
                    <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto text-sm" aria-label="Skipped lines">
                      {skipped.map((l) => (
                        <li key={`${l.line}-${l.name}`} className="text-muted-foreground">
                          <span className="text-foreground">{l.name}</span>
                          {`, ${SKIP_REASON[l.kind as Exclude<PastedLine["kind"], "ready">]}`}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ) : null}
            </FloatingSheetPanelBody>
            <FloatingSheetPanelFooter className="flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={requestClose}>Cancel</Button>
              <Button type="submit" variant="default" size="sm">{n ? `Add ${countSkills(n)}` : `Add ${skillNounPlural()}`}</Button>
            </FloatingSheetPanelFooter>
          </form>
        </FloatingSheetPanelContent>
      </FloatingSheetPanel>
      <AlertDialog open={guard} onOpenChange={setGuard}>
        <AlertDialogContent className="z-[90]" overlayClassName="z-[90]">
          <AlertDialogHeader>
            <AlertDialogTitle>Discard this list?</AlertDialogTitle>
            <AlertDialogDescription>{`No ${skillNounPlural()} have been added.`}</AlertDialogDescription>
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
