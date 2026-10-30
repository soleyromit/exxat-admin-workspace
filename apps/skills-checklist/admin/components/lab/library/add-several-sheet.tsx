"use client"

/**
 * Add a skill, option set 3 "Many at once": add several by name. A coordinator pastes or types 5 to 30 names (from an email
 * or a spreadsheet column); each becomes a skill that is not configured, in one category or none (REQ IM-12, IM-09, SL-03).
 * - Category and tags for all of them (REQ SL-03, SL-04, SL-05; decision D-X28); a line pasted from a sheet keeps its own
 *   Category and Tags cells (parseSeveral), and its own category wins over the one chosen for all.
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
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Field, FieldDescription, FieldError, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { FloatingSheetPanel, FloatingSheetPanelBody, FloatingSheetPanelContent, FloatingSheetPanelFooter, FloatingSheetPanelHeader } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@exxatdesignux/ui/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { duplicateChoices, editPastedLine, normName, parseSeveral, severalItemsWithChoices, type DuplicateChoice, type LibraryRow, type PastedLine, type SeveralItem } from "@/lib/lab/library"
import { countSkills, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { CategoryPicker, TagsPicker, useVocabOptions } from "./category-tag-pickers"

const DUPLICATE_LABEL: Record<DuplicateChoice, string> = { skip: "Skip, keep the library one", "keep-both": "Keep both", replace: "Replace the library one" }

const SKIP_REASON: Record<Exclude<PastedLine["kind"], "ready">, string> = {
  "in-library": "already in the library",
  "in-paste": "repeated in your list",
  "too-long": "longer than 120 characters",
}

export function AddSeveralSheet({ open, onOpenChange, rows, onAdd }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  rows: readonly LibraryRow[]
  /** Each ready line (with the category and tags its own cells carried) and the category and tags chosen for all. */
  onAdd: (items: SeveralItem[], defaults: { category: string; tags: string[] }) => void
}) {
  const [text, setText] = React.useState("")
  const [category, setCategory] = React.useState("")
  const [tags, setTags] = React.useState<string[]>([])
  /** Descriptions typed per name (REQ SL-02), keyed by the name as parsed; a sheet's Description cell is the starting value. */
  const [descriptions, setDescriptions] = React.useState<Record<string, string>>({})
  /** Review each line (REQ IM-05): rename, describe or leave out a line, and decide on names already in the library. */
  const [showDescriptions, setShowDescriptions] = React.useState(false)
  /** Skip, keep both or replace, per name already in the library (REQ IM-06); keyed by the normalised name; skip by default. */
  const [dup, setDup] = React.useState<Record<string, DuplicateChoice>>({})
  const [attempted, setAttempted] = React.useState(false)
  const [guard, setGuard] = React.useState(false)
  React.useEffect(() => { if (open) { setText(""); setCategory(""); setTags([]); setDescriptions({}); setDup({}); setShowDescriptions(false); setAttempted(false) } }, [open])
  const names = React.useMemo(() => rows.map((r) => r.name), [rows])
  const twins = React.useMemo(() => new Map(rows.map((r) => [normName(r.name), r])), [rows])
  const opts = useVocabOptions()
  const parsed = React.useMemo(() => parseSeveral(text, names), [text, names])
  const items = React.useMemo(() => severalItemsWithChoices(parsed, rows, dup), [parsed, rows, dup])
  const replacing = items.filter((it) => it.replaces).length
  const n = items.length - replacing
  const skippedCount = parsed.lines.length - items.length
  const skipped = parsed.lines.filter((l) => l.kind !== "ready")
  const error = attempted && items.length === 0 ? (parsed.lines.length ? `Every name is already in the library or repeated. Add a new ${skillNoun()} name, or keep both.` : `Paste or type at least one ${skillNoun()} name.`) : undefined
  const dirty = text.trim() !== "" || category !== "" || tags.length > 0 || Object.values(descriptions).some((x) => x.trim() !== "")
  // Keyed by the pasted name, so a kept or replacing copy picks up the description typed on its line.
  const descriptionOf = (it: SeveralItem) => descriptions[it.source ?? it.name] ?? it.description ?? ""
  const fromColumns = parsed.items.filter((it) => it.category || it.tags?.length || it.description).length
  const choiceOf = (l: PastedLine): DuplicateChoice => dup[normName(l.name)] ?? "skip"
  const duplicateSelect = (l: PastedLine, i: number) => (
    <Select value={choiceOf(l)} onValueChange={(v) => setDup((m) => ({ ...m, [normName(l.name)]: v as DuplicateChoice }))}>
      <SelectTrigger id={`several-dup-${i}`} size="sm" className="h-8 w-44" aria-label={`${l.name} is already in the library`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {duplicateChoices(twins.get(normName(l.name))).map((c) => (
          <SelectItem key={c} value={c}>{DUPLICATE_LABEL[c]}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  const requestClose = () => (dirty ? setGuard(true) : onOpenChange(false))
  const submit = () => {
    setAttempted(true)
    if (items.length === 0) return document.getElementById("several-names")?.focus()
    onAdd(items.map((it) => {
      const { description: _ignored, source: _src, ...rest } = it
      const d = descriptionOf(it).trim()
      return d ? { ...rest, description: d } : rest
    }), { category, tags })
    onOpenChange(false)
  }

  return (
    <>
      <FloatingSheetPanel open={open} onOpenChange={(o) => (o ? onOpenChange(true) : requestClose())}>
        <FloatingSheetPanelContent contentSlot="lab-add-several" side="right" size="lg">
          {/* CALL 10-26: the phase 1 bulk path. */}
          <FloatingSheetPanelHeader title={`Add several ${skillNounPlural()}`} onClose={requestClose} />
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
                <FieldDescription id="several-names-help">Paste from an email, or from a sheet with Name, Category, Tags and Description columns.</FieldDescription>
                {error ? <FieldError id="several-names-error">{error}</FieldError> : null}
              </Field>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field>
                  <FieldLabel id="several-category-label" htmlFor="several-category">Category for all of them</FieldLabel>
                  <CategoryPicker id="several-category" labelId="several-category-label" value={category} options={opts.categories} inactive={opts.inactiveCategories} onChange={setCategory} className="w-full" />
                </Field>
                <Field>
                  <FieldLabel id="several-tags-label" htmlFor="several-tags">Tags for all of them</FieldLabel>
                  <TagsPicker id="several-tags" labelId="several-tags-label" value={tags} options={opts.tags} inactive={opts.inactiveTags} onChange={setTags} />
                </Field>
              </div>
              {parsed.lines.length ? (
                <section aria-label="What will be added" className="flex flex-col gap-2" aria-live="polite">
                  <p className="text-sm text-foreground">
                    <span className="font-medium tabular-nums">{countSkills(n)}</span>
                    {" will be added, not configured."}
                    {replacing ? <span>{` ${replacing} ${replacing === 1 ? "replaces a library" : "replace library"} ${replacing === 1 ? skillNoun() : skillNounPlural()}.`}</span> : null}
                    {fromColumns ? <span className="text-muted-foreground">{` ${fromColumns} keep the category, tags or description from your sheet.`}</span> : null}
                    {skippedCount ? <span className="text-muted-foreground">{` ${skippedCount} skipped.`}</span> : null}
                  </p>
                  {/* Each line, one click away (REQ IM-05, SL-02): rename, describe or leave it out, and decide on a name already in
                      the library (REQ IM-06). The list is the pasted text, so an edit here is an edit there. */}
                  {showDescriptions ? (
                    <ul className="flex max-h-96 flex-col gap-2 overflow-y-auto pe-1" aria-label="Each line" data-several-lines>
                      {parsed.lines.map((l, i) => {
                        const it = parsed.items.find((x) => x.name === l.name)
                        return (
                          <li key={l.line} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_auto] sm:gap-3">
                            <Input id={`several-name-${i}`} className="h-8" aria-label={`Name on line ${l.line}`} value={l.name} onChange={(e) => setText((t) => editPastedLine(t, l.line, e.target.value))} />
                            <span className="col-span-2 row-start-2 min-w-0 sm:col-span-1 sm:row-start-auto">
                              {l.kind === "ready" && it ? (
                                <Input id={`several-desc-${i}`} className="h-8" maxLength={600} placeholder="Description (optional)" aria-label={`Description for ${l.name}`} value={descriptionOf(it)} onChange={(e) => setDescriptions((m) => ({ ...m, [it.name]: e.target.value }))} />
                              ) : l.kind === "in-library" ? (
                                // Why this row asks a question instead of a description: the name is already in the library (REQ IM-06).
                                // Kept or replacing, the line still takes a description, so the field returns under the choice.
                                <span className="flex flex-col gap-1.5" data-several-duplicate>
                                  <span className="flex min-h-8 flex-wrap items-center gap-x-3 gap-y-1">
                                    <span id={`several-dup-${i}-why`} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                      <i className="fa-light fa-clone" aria-hidden="true" />
                                      Already in the library
                                    </span>
                                    {duplicateSelect(l, i)}
                                  </span>
                                  {choiceOf(l) !== "skip" ? (
                                    <Input id={`several-desc-${i}`} className="h-8" maxLength={600} placeholder="Description (optional)" aria-label={`Description for ${l.name}`} value={descriptions[l.name] ?? l.description ?? ""} onChange={(e) => setDescriptions((m) => ({ ...m, [l.name]: e.target.value }))} />
                                  ) : null}
                                </span>
                              ) : (
                                <span className="text-sm text-muted-foreground">{`Skipped, ${SKIP_REASON[l.kind as Exclude<PastedLine["kind"], "ready">]}`}</span>
                              )}
                            </span>
                            <Button type="button" variant="ghost" size="icon-sm" aria-label={`Leave out line ${l.line}, ${l.name}`} onClick={() => setText((t) => editPastedLine(t, l.line, null))}>
                              <i className="fa-light fa-xmark" aria-hidden="true" />
                            </Button>
                          </li>
                        )
                      })}
                    </ul>
                  ) : (
                    <>
                      <Button type="button" variant="link" size="sm" className="h-auto self-start px-0" onClick={() => setShowDescriptions(true)}>
                        Review each line
                      </Button>
                      {skipped.length ? (
                        <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto text-sm" aria-label="Lines not added as they are">
                          {skipped.map((l, i) => (
                            <li key={`${l.line}-${l.name}`} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
                              <span className="text-foreground">{l.name}</span>
                              {l.kind === "in-library" ? duplicateSelect(l, i + 1000) : <span>{`, ${SKIP_REASON[l.kind as Exclude<PastedLine["kind"], "ready">]}`}</span>}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </>
                  )}
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
