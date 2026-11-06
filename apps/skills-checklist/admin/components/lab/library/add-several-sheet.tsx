"use client"

/**
 * Add several. A coordinator pastes or types names (from an email or a spreadsheet column); each becomes a skill (REQ IM-12, IM-09, SL-03).
 * - Only the first cell of a pasted line is the name (REQ IM-03). Other cells are reported, never read as anything (REQ IM-08).
 * - Category and tags for all of them (REQ SL-03, SL-04, SL-05; decision D-X28).
 * - Live check as you type: how many are new, repeated and not read, and what configuration they will take, in the words the result banner uses.
 *   A repeated name offers the one duplicate rule (duplicateChoices, REQ IM-06), with the name a Keep both will produce.
 * - MODAL, like Add a skill: a half-filled list is a door in front of the work. On opening, focus is in the names box and typing and Tab stay in the sheet; on close it returns to the
 *   button that opened it. Every way out (Close, Cancel, Esc, a click outside, the panel rows and crumbs behind it, browser Back) goes through the unsaved-change guard.
 * - One filled primary "Add {n} skills" ("Replace {n} skills" when that is all it will do; never a bare "Skip", rule E4). An empty box or lines that cannot be read keep it enabled and a
 *   failed attempt shows a FieldError and moves focus to the list (rule E4). When every line is a repeat set to Skip, the program has chosen to add nothing: it is disabled and says so.
 * - Lines that were not read stay in the box with their text after Add, to fix or leave out (REQ IM-08).
 * - Unsaved-change guard on close. Success is a LocalBanner on the library (never a toast), with Show them.
 * No evaluation model is asked or assumed (REQ SC-02).
 */
import * as React from "react"
import { SectionTitle } from "@/components/lab/first-run"
import { TYPE } from "@/components/lab/type-scale"
import { SettingsSummary } from "./settings-summary"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Textarea } from "@exxatdesignux/ui/components/ui/textarea"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Field, FieldError, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { FloatingSheetPanelBody, FloatingSheetPanelContent, FloatingSheetPanelFooter, FloatingSheetPanelHeader } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { FloatingSheetPanel } from "@/components/lab/shared/sheet"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@exxatdesignux/ui/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { configurationWords, defaultDuplicateChoice, duplicateChoices, editPastedLine, libraryTwins, notReadReason, type ListPlace, normName, parseSeveral, severalItemsWithChoices, type DuplicateChoice, type LibraryRow, type PastedLine, type SeveralItem } from "@/lib/lab/library"
import { ruleForNewSkill } from "@/lib/lab/program-settings"
import { useV2State } from "@/lib/v2/react"
import { countSkills, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { CategoryPicker, TagsPicker, useVocabOptions } from "./category-tag-pickers"
import { useEmbeddedStep } from "@/components/lab/layout/embedded"
import { useLeaveGuard } from "@/components/lab/shared/unsaved-guard"
import { focusSheetOpener } from "@/components/lab/shared/focus"

/** One row shape for the repeated names, so the selects line up however long a name is: name, why, the choice, what it will do. On a phone the name and the outcome take their own lines, and the selects still line up. */
const REPEAT_ROW = "grid grid-cols-[minmax(0,1fr)_8rem] items-center gap-x-2 gap-y-1 sm:grid-cols-[minmax(0,1fr)_11.5rem_8rem_minmax(7rem,1fr)]"
const REASON_WIDTH = "sm:w-[11.5rem]"

const DUPLICATE_LABEL: Record<DuplicateChoice, string> = { skip: "Skip", replace: "Replace", "keep-both": "Keep both" }

/** The one duplicate control, on Add a skill and Add several (REQ IM-06). The offered choices come from `duplicateChoices`. */
export function DuplicateChoiceSelect({ id, value, choices, onChange, label }: { id: string; value: DuplicateChoice; choices: DuplicateChoice[]; onChange: (c: DuplicateChoice) => void; label: string }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as DuplicateChoice)}>
      <SelectTrigger id={id} size="sm" className="h-8 w-32" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {choices.map((c) => <SelectItem key={c} value={c}>{DUPLICATE_LABEL[c]}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

/** Inside Set up skills the step builds the new program's list, so the wording says "list", never "library" (bug fix 2026-11-04). */
const repeatReason = (l: PastedLine, place: ListPlace): string => (l.kind === "in-library" ? `Already in the ${place}` : place === "list" ? "Repeated in what you pasted" : "Repeated in your list")

export function AddSeveralSheet({ open, onOpenChange, rows, onAdd }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  rows: readonly LibraryRow[]
  /** Each ready line (with the category and tags its own cells carried) and the category and tags chosen for all. */
  onAdd: (items: SeveralItem[], defaults: { category: string; tags: string[] }) => void
}) {
  const place: ListPlace = useEmbeddedStep() ? "list" : "library"
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
  /** Lines left in the box by the last Add, which said it added the rest (REQ IM-08). */
  const [left, setLeft] = React.useState(0)
  /** What that Add added, for a screen reader: the banner behind a modal sheet is hidden from it. */
  const [justAdded, setJustAdded] = React.useState(0)
  /** A second press of a double click, while the box still holds only the lines left behind. */
  const lastAdd = React.useRef(0)
  const openRef = React.useRef(open)
  openRef.current = open
  React.useEffect(() => { if (open) { setText(""); setCategory(""); setTags([]); setDescriptions({}); setDup({}); setShowDescriptions(false); setAttempted(false); setLeft(0); setJustAdded(0) } }, [open])
  const names = React.useMemo(() => rows.map((r) => r.name), [rows])
  const twins = React.useMemo(() => libraryTwins(rows), [rows])
  const opts = useVocabOptions()
  // The words the result banner will use: what a new skill really takes in this program.
  const newSkillRule = ruleForNewSkill(useV2State())
  const configuration = newSkillRule ? "default" : "not-configured"
  const parsed = React.useMemo(() => parseSeveral(text, names), [text, names])
  const items = React.useMemo(() => severalItemsWithChoices(parsed, rows, dup), [parsed, rows, dup])
  const replacing = items.filter((it) => it.replaces).length
  const n = items.length - replacing
  const repeated = parsed.lines.filter((l) => l.kind === "in-library" || l.kind === "in-paste")
  const unread = parsed.lines.filter((l) => l.kind === "not-read" || l.kind === "too-long")
  const withExtra = parsed.lines.filter((l) => l.extra?.length).length
  const fresh = parsed.lines.length - repeated.length - unread.length
  const counted = [fresh ? `${fresh} new` : "", repeated.length ? `${repeated.length} repeated` : "", unread.length ? `${unread.length} not read` : ""].filter(Boolean).join(", ")
  // Every line is a repeat left on Skip: the program's own choice, so the primary is off and the summary says what would change that.
  const allSkipped = items.length === 0 && repeated.length > 0
  const error = attempted && items.length === 0 && !allSkipped ? (parsed.lines.length ? (unread.length === 1 ? "This line could not be read. Fix it or leave it out." : "These lines could not be read. Fix them or leave them out.") : `Paste or type at least one ${skillNoun()} name.`) : undefined
  // After an add, the sentence under the box already says these lines were not read: the summary does not say it again.
  const notReadSaid = !!left && unread.length > 0 && unread.length === parsed.lines.length
  const dirty = text.trim() !== "" || category !== "" || tags.length > 0 || Object.values(descriptions).some((x) => x.trim() !== "")
  // Keyed by the pasted name, so a kept or replacing copy picks up the description typed on its line.
  const descriptionOf = (it: SeveralItem) => descriptions[it.source ?? it.name] ?? it.description ?? ""
  const choiceOf = (l: PastedLine): DuplicateChoice => dup[normName(l.name)] ?? defaultDuplicateChoice(l.kind)
  const choicesOf = (l: PastedLine) => duplicateChoices(l.kind === "in-library" ? twins.get(normName(l.name)) : undefined)
  const duplicateSelect = (l: PastedLine, i: number) => (
    <DuplicateChoiceSelect id={`several-dup-${i}`} value={choiceOf(l)} choices={choicesOf(l)} onChange={(c) => setDup((m) => ({ ...m, [normName(l.name)]: c }))} label={`${l.name}: ${repeatReason(l, place)}`} />
  )
  // One choice for all of them, above the lines (100+ scale, standing rule 4). A line that cannot take the choice keeps what it has: Replace needs a library skill with no evidence [REQ IM-06].
  const repeatChoices = repeated.map(choiceOf)
  const allChoice = repeatChoices.length && repeatChoices.every((c) => c === repeatChoices[0]) ? repeatChoices[0]! : "mixed"
  const canReplaceAny = repeated.some((l) => choicesOf(l).includes("replace"))
  const chooseForAll = (c: DuplicateChoice) => setDup((m) => {
    const next = { ...m }
    for (const l of repeated) if (choicesOf(l).includes(c)) next[normName(l.name)] = c
    return next
  })
  /** What this repeated line will do, shown before adding: the name a Keep both will produce. */
  const outcomeOf = (l: PastedLine): string => {
    const choice = choiceOf(l)
    if (choice === "skip") return "Not added"
    if (choice === "replace") return "Its settings stay. What you enter here replaces its details"
    const made = items.find((it) => it.line === l.line)?.name
    return made ? `Added as ${made}` : "Added"
  }

  const leave = useLeaveGuard(open && dirty)
  const requestClose = () => (dirty ? setGuard(true) : onOpenChange(false))
  const discard = () => {
    setGuard(false)
    if (leave.asking) leave.go(() => onOpenChange(false))
    else onOpenChange(false)
  }
  const submit = () => {
    if (!open || allSkipped || Date.now() - lastAdd.current < 700) return
    setAttempted(true)
    if (items.length === 0) return document.getElementById("several-names")?.focus()
    lastAdd.current = Date.now()
    onAdd(items.map((it) => {
      const { description: _ignored, source: _src, line: _line, ...rest } = it
      const d = descriptionOf(it).trim()
      return d ? { ...rest, description: d } : rest
    }), { category, tags })
    // Lines not read stay in the box as pasted, with the page behind already showing what was added (REQ IM-08).
    if (!unread.length) { onOpenChange(false); return }
    setText(unread.map((l) => l.raw).join("\n"))
    setLeft(unread.length)
    setJustAdded(items.length)
    setCategory(""); setTags([]); setDescriptions({}); setDup({}); setAttempted(false)
    document.getElementById("several-names")?.focus()
  }

  return (
    <>
      <FloatingSheetPanel open={open} onOpenChange={(o) => (o ? onOpenChange(true) : requestClose())} modal>
        <FloatingSheetPanelContent
          contentSlot="lab-add-several"
          side="right"
          size="lg"
          aria-modal="true"
          onOpenAutoFocus={(e) => { e.preventDefault(); document.getElementById("several-names")?.focus() }}
          onCloseAutoFocus={(e) => { e.preventDefault(); focusSheetOpener() }}
        >
          {/* CALL 10-26: the phase 1 bulk path. */}
          <FloatingSheetPanelHeader title="Add several" onClose={requestClose} />
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
                  aria-describedby={error ? "several-names-error" : undefined}
                  className="font-normal"
                  placeholder={"Sterile dressing change\nWound irrigation\nIV catheter insertion"}
                />
                {!parsed.lines.length && !error ? <p className="text-sm text-muted-foreground" data-several-hint>Paste a column from a spreadsheet or an email, or type them.</p> : null}
                {error ? <FieldError id="several-names-error">{error}</FieldError> : null}
                {left && unread.length && !error ? <p className="text-sm text-muted-foreground" role="status" data-several-left>{justAdded ? <span className="sr-only">{`${countSkills(justAdded)} added. `}</span> : null}{unread.length === 1 ? "This line was not read. Fix it or leave it out." : `These ${unread.length} lines were not read. Fix them or leave them out.`}</p> : null}
              </Field>
              {parsed.lines.length ? (
                <section aria-label="What will be added" className="flex flex-col gap-2" aria-live="polite">
                  <p className="text-sm text-foreground empty:hidden" data-several-summary>
                    {notReadSaid ? null : <span className="font-medium tabular-nums">{`${counted}.`}</span>}
                    {n ? ` ${n} will be added. ${configurationWords(n, configuration)}` : ""}
                    {allSkipped ? ` Nothing will be added. Choose Keep both or Replace for a repeated name, or add a new ${skillNoun()} name.` : ""}
                    {replacing ? ` ${replacing} ${replacing === 1 ? "replaces" : "replace"} ${place === "list" ? `${replacing === 1 ? "one" : skillNounPlural()} in the list` : `${replacing === 1 ? `a library ${skillNoun()}` : `library ${skillNounPlural()}`}`}.` : ""}
                  </p>
                  {withExtra ? <p className="text-sm text-muted-foreground" data-several-extra>{`${withExtra} ${withExtra === 1 ? "line has" : "lines have"} other columns. Only the first is read as the name; the rest are not added.`}</p> : null}
                  {/* Each line, one click away (REQ IM-05, SL-02): rename, describe or leave it out, and decide on a name already in
                      the library (REQ IM-06). The list is the pasted text, so an edit here is an edit there. */}
                  <Button type="button" variant="link" size="sm" className="h-auto self-start px-0" aria-expanded={showDescriptions} onClick={() => setShowDescriptions((v) => !v)}>
                    {showDescriptions ? "Close review" : "Review each line"}
                  </Button>
                  {repeated.length > 1 ? (
                    <span className={`${REPEAT_ROW} text-sm`} data-several-all>
                      <span id="several-all-label" className="col-span-2 text-muted-foreground">{`All ${repeated.length} repeated names`}</span>
                      <Select value={allChoice} onValueChange={(v) => { if (v !== "mixed") chooseForAll(v as DuplicateChoice) }}>
                        <SelectTrigger id="several-all" size="sm" className="col-span-2 h-8 w-full sm:w-56" aria-labelledby="several-all-label">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {allChoice === "mixed" ? <SelectItem value="mixed" disabled>Mixed</SelectItem> : null}
                          <SelectItem value="skip">Skip all</SelectItem>
                          <SelectItem value="keep-both">Keep both for all</SelectItem>
                          {canReplaceAny ? <SelectItem value="replace">Replace where allowed</SelectItem> : null}
                        </SelectContent>
                      </Select>
                    </span>
                  ) : null}
                  {showDescriptions ? (
                    <ul className="flex flex-col gap-2 pe-1" aria-label="Each line" data-several-lines>
                      {parsed.lines.map((l, i) => {
                        const it = parsed.items.find((x) => x.name === l.name)
                        return (
                          <li key={l.line} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_auto] sm:gap-3">
                            <Input id={`several-name-${i}`} className="h-8" aria-label={`Name on line ${l.line}`} value={l.name} onChange={(e) => setText((t) => editPastedLine(t, l.line, e.target.value))} />
                            <span className="col-span-2 row-start-2 min-w-0 sm:col-span-1 sm:row-start-auto">
                              {l.extra?.length ? <span className="mb-1 block text-xs text-muted-foreground" data-line-extra>{`Not read: ${l.extra.join(", ")}`}</span> : null}
                              {l.kind === "ready" && it ? (
                                <Input id={`several-desc-${i}`} className="h-8" maxLength={600} placeholder="Description (optional)" aria-label={`Description for ${l.name}`} value={descriptionOf(it)} onChange={(e) => setDescriptions((m) => ({ ...m, [it.name]: e.target.value }))} />
                              ) : l.kind === "in-library" || l.kind === "in-paste" ? (
                                // Why this row asks a question instead of a description: the name repeats (REQ IM-06).
                                // Kept or replacing, the line still takes a description, so the field returns under the choice.
                                <span className="flex flex-col gap-1.5" data-several-duplicate>
                                  <span className="flex min-h-8 flex-wrap items-center gap-x-3 gap-y-1">
                                    <span id={`several-dup-${i}-why`} className={`flex items-center gap-1.5 text-sm text-muted-foreground ${REASON_WIDTH}`}>
                                      <i className="fa-light fa-clone" aria-hidden="true" />
                                      {repeatReason(l, place)}
                                    </span>
                                    {duplicateSelect(l, i)}
                                    <span className="text-sm text-muted-foreground" data-duplicate-outcome>{outcomeOf(l)}</span>
                                  </span>
                                  {choiceOf(l) !== "skip" ? (
                                    <Input id={`several-desc-${i}`} className="h-8" maxLength={600} placeholder="Description (optional)" aria-label={`Description for ${l.name}`} value={descriptions[l.name] ?? ""} onChange={(e) => setDescriptions((m) => ({ ...m, [l.name]: e.target.value }))} />
                                  ) : null}
                                </span>
                              ) : (
                                <span className="text-sm text-muted-foreground">{`Stays in the box, ${notReadReason(l)}`}</span>
                              )}
                            </span>
                            <Button type="button" variant="ghost" size="icon-sm" aria-label={`Leave out line ${l.line}, ${l.name}`} onClick={() => setText((t) => editPastedLine(t, l.line, null))}>
                              <i className="fa-light fa-xmark" aria-hidden="true" />
                            </Button>
                          </li>
                        )
                      })}
                    </ul>
                  ) : repeated.length || unread.length ? (
                        <ul className="flex flex-col gap-1 text-sm" aria-label="Lines not added as they are" data-several-repeats>
                          {[...repeated, ...unread].map((l, i) => (
                            <li key={`${l.line}-${l.name}`} className={`${REPEAT_ROW} text-muted-foreground`}>
                              <span className="col-span-2 min-w-0 break-words text-foreground sm:col-span-1">{l.kind === "too-long" || l.kind === "not-read" ? l.raw.trim() : l.name}</span>
                              {l.kind === "in-library" || l.kind === "in-paste" ? (
                                <>
                                  <span>{repeatReason(l, place)}</span>
                                  {duplicateSelect(l, i + 1000)}
                                  <span className="col-span-2 sm:col-span-1" data-duplicate-outcome>{outcomeOf(l)}</span>
                                </>
                              ) : <span className="col-span-2 sm:col-span-3">{`Stays in the box, ${notReadReason(l)}`}</span>}
                            </li>
                          ))}
                        </ul>
                  ) : null}
                </section>
              ) : null}
              {/* What all of them get: chosen here for all, then what the program's settings give them. */}
              <section className="flex flex-col gap-3 rounded-[var(--radius)] border border-border p-3" aria-labelledby="several-all-title" data-several-for-all>
                <SectionTitle icon="fa-tags" id="several-all-title" className={TYPE.group}>For all of them</SectionTitle>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel id="several-category-label" htmlFor="several-category">Category (optional)</FieldLabel>
                    <CategoryPicker id="several-category" labelId="several-category-label" value={category} options={opts.categories} inactive={opts.inactiveCategories} onChange={setCategory} className="min-h-10 w-full" />
                  </Field>
                  <Field>
                    <FieldLabel id="several-tags-label" htmlFor="several-tags">Tags (optional)</FieldLabel>
                    <TagsPicker id="several-tags" labelId="several-tags-label" value={tags} options={opts.tags} inactive={opts.inactiveTags} onChange={setTags} />
                  </Field>
                </div>
              </section>
              <SettingsSummary id="several-settings" rule={newSkillRule} emptyText={`Your program has not set how ${skillNounPlural()} are judged. These ${skillNounPlural()} wait until it has.`} />
            </FloatingSheetPanelBody>
            <FloatingSheetPanelFooter className="flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={requestClose}>Cancel</Button>
              <Button type="submit" variant="default" size="sm" disabled={allSkipped}>{n && replacing ? `Add ${n}, replace ${replacing}` : n ? `Add ${countSkills(n)}` : replacing ? `Replace ${countSkills(replacing)}` : `Add ${skillNounPlural()}`}</Button>
            </FloatingSheetPanelFooter>
          </form>
        </FloatingSheetPanelContent>
      </FloatingSheetPanel>
      <AlertDialog open={guard || leave.asking} onOpenChange={(o) => { if (!o) { setGuard(false); leave.setAsking(false) } }}>
        <AlertDialogContent
          className="z-[90]"
          overlayClassName="z-[90]"
          onCloseAutoFocus={(e) => {
            // Keep editing returns to the names box inside the modal sheet. Discard leaves it to the sheet's own close.
            e.preventDefault()
            if (openRef.current) document.getElementById("several-names")?.focus()
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Discard your changes?</AlertDialogTitle>
            <AlertDialogDescription>{!left ? `No ${skillNounPlural()} have been added.` : parsed.lines.length === 1 ? "1 line in the box has not been added." : parsed.lines.length ? `${parsed.lines.length} lines in the box have not been added.` : "The category and tags you chose have not been used."}</AlertDialogDescription>
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
