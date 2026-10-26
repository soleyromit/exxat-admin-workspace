"use client"

/**
 * Shared building blocks for the import screens: variant A (four steps), B (file beside the list), C (paste or drop several).
 * Spec: docs/knowledge/design/skill-setup-journey/02 section 3. DS components only; the dropzone is composed (the DS has none).
 * Copy: sentence case, verb plus object, one helper line per region, no "items", figures come from the engine.
 */
import * as React from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@exxatdesignux/ui/components/ui/accordion"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@exxatdesignux/ui/components/ui/alert-dialog"
import { Attachment, AttachmentAction, AttachmentActions, AttachmentContent, AttachmentDescription, AttachmentMedia, AttachmentTitle } from "@exxatdesignux/ui/components/ui/attachment"
import { LabLocalBanner as LocalBanner } from "@/components/lab/lab-bar/lab-banner"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@exxatdesignux/ui/components/ui/collapsible"
import { Field, FieldDescription, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { InlineInputEdit } from "@exxatdesignux/ui/components/ui/inline-edit"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@exxatdesignux/ui/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@exxatdesignux/ui/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { cn } from "@exxatdesignux/ui/lib/utils"
import {
  CONFIDENCE_ICON,
  CONFIDENCE_WORD,
  EXCEPTION_LABEL,
  IMPORT_GROUPING,
  NEW_LIBRARY,
  NO_CATEGORY,
  categoriesOf,
  confirmSentence,
  decisionKey,
  fixContext,
  fixOptions,
  fixValue,
  notCreated,
  readableText,
  toFix,
  type ExceptionKind,
  type FixGroup,
  type ParsedRow,
} from "@/lib/lab/import"
import { countSkills, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import type { ImportSession } from "./use-import-session"

export const ACCEPT = ".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt"
export const LIBRARY_HREF = "/lab/admin/skills-library"
export const NOT_CONFIGURED_HREF = "/lab/admin/skills-library?tab=not-configured"
const UNREADABLE_WORDS = "Text could not be read"
/** Lines shown per fix group before "Show all"; large files hold hundreds of repeats. */
const GROUP_PAGE = 8

const plural = (count: number, one: string, many: string) => `${count.toLocaleString("en-US")} ${count === 1 ? one : many}`

// ---------------------------------------------------------------------------------------------------------------------
// Upload

/**
 * The hero of step 1: drop or choose, nothing to set first. A label-free group with a hidden file input; the visible
 * "Choose a file" button opens it. Drag over tints the zone with the brand tint (the only tint on the page).
 */
export function Dropzone({ onFiles, multiple = false, title, hint, className }: { onFiles: (files: File[]) => void; multiple?: boolean; title?: string; hint?: string; className?: string }) {
  const input = React.useRef<HTMLInputElement>(null)
  const [over, setOver] = React.useState(false)
  const id = React.useId()
  return (
    <div
      role="group"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-hint`}
      data-dropzone
      data-over={over ? "true" : undefined}
      onDragOver={(e) => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        const files = [...e.dataTransfer.files]
        if (files.length) onFiles(multiple ? files : files.slice(0, 1))
      }}
      className={cn(
        "flex min-h-[17.5rem] flex-col items-center justify-center gap-2 rounded-[var(--radius)] border border-dashed px-6 py-10 text-center",
        over ? "border-[var(--brand-color)] bg-[var(--brand-tint)]" : "border-[var(--border-control-3)] bg-[var(--background)]",
        className,
      )}
    >
      <i className="fa-light fa-file-arrow-up text-2xl text-muted-foreground" aria-hidden="true" />
      <p id={`${id}-title`} className="text-base font-medium text-foreground">{title ?? `Drop your ${skillNounPlural()} list here`}</p>
      <p id={`${id}-hint`} className="text-sm text-muted-foreground">{hint ?? "PDF, Word or Excel. Any layout, no template."}</p>
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        multiple={multiple}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const files = [...(e.target.files ?? [])]
          if (files.length) onFiles(files)
          e.target.value = ""
        }}
      />
      <Button type="button" variant="outline" size="default" className="mt-2" onClick={() => input.current?.click()}>
        {multiple ? "Choose files" : "Choose a file"}
      </Button>
    </div>
  )
}

/** "Adds to Medical-surgical nursing. Change": the destination list as one quiet line, changed in a popover (J1). */
export function TargetLine({ session, className }: { session: ImportSession; className?: string }) {
  const [open, setOpen] = React.useState(false)
  const id = React.useId()
  return (
    <p className={cn("flex flex-wrap items-center gap-x-1 text-sm text-muted-foreground", className)} data-target-line>
      <span>
        {"Adds to "}
        <span className="text-foreground">{session.isNewList ? session.newLibraryName.trim() || "a new list" : session.targetLabel}</span>.
      </span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="link" size="sm" className="h-auto px-1 py-0" aria-label="Change the list this import adds to">Change</Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80">
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-2 text-sm font-medium text-foreground">Add to</legend>
            <RadioGroup value={session.target} onValueChange={(v) => session.setTarget(v)} aria-label="List to add to">
              {session.targets.map((t) => (
                <div key={t.id} className="flex items-center gap-2">
                  <RadioGroupItem id={`${id}-${t.id}`} value={t.id} />
                  <Label htmlFor={`${id}-${t.id}`} className="font-normal">{t.label}<span className="ms-1 tabular-nums text-muted-foreground">{t.count}</span></Label>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <RadioGroupItem id={`${id}-new`} value={NEW_LIBRARY} />
                <Label htmlFor={`${id}-new`} className="font-normal">A new list</Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-muted-foreground">Repeats are checked against this list.</p>
          </fieldset>
        </PopoverContent>
      </Popover>
    </p>
  )
}

const FILE_ICON = (name: string | null) => (/\.xlsx?$|\.csv$/i.test(name ?? "") ? "fa-file-excel" : /\.docx?$/i.test(name ?? "") ? "fa-file-word" : "fa-file-pdf")

/** The chosen file, its state, and the one way to swap it. */
export function FileStatus({ session, className }: { session: ImportSession; className?: string }) {
  if (!session.fileName) return null
  const state = session.phase === "reading" ? "processing" : session.phase === "failed" ? "error" : "done"
  const detail =
    session.phase === "reading" ? "Reading the file" : session.phase === "failed" ? "Could not be read" : session.summary ? `${plural(session.summary.read, skillNoun(), skillNounPlural())} read` : ""
  return (
    <Attachment state={state} size="default" orientation="horizontal" className={cn("w-full", className)} data-file-status>
      <AttachmentMedia variant="icon"><i className={`fa-light ${FILE_ICON(session.fileName)}`} aria-hidden="true" /></AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>{session.fileName}</AttachmentTitle>
        <AttachmentDescription>{session.fileNames.length > 1 ? `${session.fileNames.join(", ")}. ${detail}` : detail}</AttachmentDescription>
      </AttachmentContent>
      {session.phase === "review" ? (
        <AttachmentActions>
          <AttachmentAction variant="ghost" size="sm" onClick={session.reset}>Choose another file</AttachmentAction>
        </AttachmentActions>
      ) : null}
    </Attachment>
  )
}

/** Reading: the file, then the shape of the review (Skeleton, never a bare progress bar or spinner). */
export function ReadingState({ session }: { session: ImportSession }) {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-4" data-import-reading>
      <span className="sr-only">{`Reading ${session.fileName ?? "the file"}`}</span>
      <FileStatus session={session} />
      <div className="flex flex-col gap-2" aria-hidden="true">
        <Skeleton className="h-6 w-2/3" />
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    </div>
  )
}

export function FailedState({ session }: { session: ImportSession }) {
  return (
    <div className="flex flex-col gap-4" data-import-failed>
      <LocalBanner variant="error" title={`We could not read ${session.fileName ?? "this file"}`} retry={{ label: "Choose another file", onClick: session.reset }}>
        It may be a scanned image. A Word or Excel copy usually works.
      </LocalBanner>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Review

/** One sentence with the engine's figures, then the file's legend once (only when the file has one). */
export function ReviewSummary({ session }: { session: ImportSession }) {
  const s = session.summary
  if (!s || !session.review) return null
  const cats = categoriesOf(session.resolved).filter((c) => c.name !== NO_CATEGORY).length
  const legend = session.review.legend
  const where = cats > 0 ? ` in ${plural(cats, IMPORT_GROUPING.category.toLowerCase(), IMPORT_GROUPING.categories)}` : ""
  return (
    <div className="flex flex-col gap-1" data-review-summary>
      <p className="text-base font-medium text-foreground">
        {`${plural(s.read, skillNoun(), skillNounPlural())} read${where}. `}
        {session.left > 0 ? `${plural(session.left, "needs", "need")} a decision.` : "Nothing needs a decision."}
      </p>
      {legend ? <p className="text-sm text-muted-foreground">{`The file's mark means "${legend}". It is kept as a note for course mapping.`}</p> : null}
    </div>
  )
}

/** The line as the reader understood it (bullets, numbers and marks removed), or the quiet "could not be read" state. */
export function LineText({ row, className }: { row: ParsedRow; className?: string }) {
  const text = row.unreadable ? readableText(row) : row.name
  return text ? <span className={cn("text-sm text-foreground", className)}>{text}</span> : <span className={cn("text-sm italic text-muted-foreground", className)}>{UNREADABLE_WORDS}</span>
}

function DecisionBadge() {
  return <StatusBadge size="sm" tone="warning" icon={CONFIDENCE_ICON.look} label={CONFIDENCE_WORD.look} />
}

/**
 * What was read, in the file's own categories, collapsed, with counts (J2: "did it understand my list?"). Inside a category
 * the lines that need a decision come first. Renaming is possible here [REQ IM-05]; decisions are made in Fix.
 */
export function CategoryList({ session }: { session: ImportSession }) {
  const cats = React.useMemo(() => categoriesOf(session.resolved), [session.resolved])
  const furniture = session.review?.furniture ?? []
  return (
    <Accordion type="multiple" className="rounded-[var(--radius)] border border-border" data-category-list>
      {cats.map((c) => (
        <AccordionItem key={c.name} value={c.name} className="px-4">
          <AccordionTrigger className="min-h-12 py-3 hover:no-underline">
            <span className="flex min-w-0 flex-1 items-center gap-3">
              <span className="min-w-0 truncate text-sm font-medium text-foreground">{c.name}</span>
              {c.toDecide > 0 ? <StatusBadge size="sm" tone="warning" icon={CONFIDENCE_ICON.look} label={`${c.toDecide} to decide`} /> : null}
              <span className="ms-auto pe-2 text-sm tabular-nums text-muted-foreground">{c.rows.length}</span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <ul className="flex flex-col divide-y divide-border" aria-label={`${c.name}, ${countSkills(c.rows.length)}`}>
              {c.rows.map((r) => (
                <li key={r.row.id} className="grid min-h-11 grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 py-1.5">
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">{r.row.line}</span>
                  {r.status === "left-out" ? (
                    <span className="flex min-w-0 flex-col">
                      <LineText row={r.row} className="text-muted-foreground line-through" />
                      <span className="text-xs text-muted-foreground">{r.outcome}</span>
                    </span>
                  ) : r.row.unreadable && !readableText(r.row) ? (
                    <LineText row={r.row} />
                  ) : (
                    <span className="flex min-w-0 flex-col">
                      <InlineInputEdit label={`Name for line ${r.row.line}`} value={r.name} onCommit={(v) => session.rename(r.row.id, v.trim())} emptyLabel="Add a name" />
                      {r.row.group ? <span className="text-xs text-muted-foreground">{`${IMPORT_GROUPING.tag[0].toUpperCase()}${IMPORT_GROUPING.tag.slice(1)}: ${r.row.group}`}</span> : null}
                    </span>
                  )}
                  {r.status === "look" ? <DecisionBadge /> : <span />}
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      ))}
      {furniture.length > 0 ? (
        <AccordionItem value="__left-out" className="px-4">
          <AccordionTrigger className="min-h-12 py-3 hover:no-underline">
            <span className="flex min-w-0 flex-1 items-center gap-3">
              <span className="min-w-0 truncate text-sm font-medium text-muted-foreground">Lines left out (page titles, legend, page numbers)</span>
              <span className="ms-auto pe-2 text-sm tabular-nums text-muted-foreground">{furniture.length}</span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <ul className="flex flex-col gap-1" aria-label="Lines left out">
              {furniture.map((f) => (
                <li key={f.line} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3">
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">{f.line}</span>
                  <span className="font-mono text-xs text-foreground">{f.text}</span>
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      ) : null}
    </Accordion>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Fix

export const fixSelectId = (rowId: string, kind: ExceptionKind) => `fix-${rowId}-${kind}`

function FixRow({ session, row, active, onFocusRow }: { session: ImportSession; row: ParsedRow; active?: boolean; onFocusRow?: (id: string) => void }) {
  const review = session.review!
  const kinds = (review.exceptions[row.id] ?? []).slice().sort((a, b) => EXCEPTION_ORDER_INDEX[a] - EXCEPTION_ORDER_INDEX[b])
  const contexts = kinds.map((k) => fixContext(review, row, k)).filter(Boolean) as string[]
  return (
    <li
      data-fix-row={row.id}
      onFocusCapture={onFocusRow ? () => onFocusRow(row.id) : undefined}
      onClick={onFocusRow ? () => onFocusRow(row.id) : undefined}
      data-active={active ? "true" : undefined}
      className={cn("grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-x-4 gap-y-2 py-2.5 sm:min-h-12 sm:grid-cols-[2.5rem_minmax(0,1fr)_18.5rem]", active && "bg-muted")}
    >
      <span className="font-mono text-xs tabular-nums text-muted-foreground">{row.line}</span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <LineText row={row} className="truncate" />
        {contexts.length ? <span className="truncate text-xs text-muted-foreground">{contexts.join(". ")}</span> : null}
      </span>
      <span className="col-span-2 flex flex-col gap-2 sm:col-span-1">
        {kinds.map((k) => {
          const options = fixOptions(review, row, k, session.library)
          const current = session.decisions[decisionKey(row.id, k)]
          return (
            <Select key={k} value={current ? fixValue(current) : ""} onValueChange={(v) => session.decide(row.id, k, v ? toFix(review, row, v) : null)}>
              <SelectTrigger id={fixSelectId(row.id, k)} size="sm" className="w-full" aria-label={`${EXCEPTION_LABEL[k]}: what happens to line ${row.line}`}>
                <SelectValue placeholder={`Suggested: ${options[0].label}`} />
              </SelectTrigger>
              <SelectContent>
                {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          )
        })}
      </span>
    </li>
  )
}

const EXCEPTION_ORDER_INDEX: Record<ExceptionKind, number> = { unread: 0, "duplicate-library": 1, "duplicate-file": 2, continuation: 3, section: 4, mark: 5 }

function FixGroupBlock({ session, group, open, onOpenChange, activeId, onFocusRow }: { session: ImportSession; group: FixGroup; open: boolean; onOpenChange: (o: boolean) => void; activeId?: string | null; onFocusRow?: (id: string) => void }) {
  const [all, setAll] = React.useState(false)
  const headingId = React.useId()
  const done = group.open === 0
  const rows = all ? group.rows : group.rows.slice(0, GROUP_PAGE)
  return (
    <Collapsible open={open} onOpenChange={onOpenChange} data-fix-group={group.kind} className="flex flex-col">
      <div className="flex min-h-10 flex-wrap items-center gap-x-3 gap-y-1 border-b border-border py-1">
        <CollapsibleTrigger asChild>
          <Button type="button" variant="ghost" size="sm" className="-ms-2 gap-2 px-2" id={headingId}>
            <i className={cn("fa-light fa-chevron-right text-xs transition-transform", open && "rotate-90")} aria-hidden="true" />
            <span className="font-medium text-foreground">{EXCEPTION_LABEL[group.kind]}</span>
            <span className="tabular-nums text-muted-foreground">{group.rows.length}</span>
          </Button>
        </CollapsibleTrigger>
        {done ? (
          <StatusBadge size="sm" tone="neutral" icon="fa-check" label="Decided" />
        ) : (
          <Button type="button" variant="ghost" size="sm" className="ms-auto" onClick={() => session.bulkSuggest({ rowIds: new Set(group.rows.map((r) => r.id)) })}>
            {group.open === 1 ? "Accept 1 suggestion" : `Accept ${group.open} suggestions`}
          </Button>
        )}
      </div>
      <CollapsibleContent>
        <ul aria-labelledby={headingId} className="flex flex-col divide-y divide-border">
          {rows.map((r) => <FixRow key={r.id} session={session} row={r} active={activeId === r.id} onFocusRow={onFocusRow} />)}
        </ul>
        {group.rows.length > GROUP_PAGE && !all ? (
          <Button type="button" variant="link" size="sm" className="px-0" onClick={() => setAll(true)}>{`Show all ${group.rows.length.toLocaleString("en-US")} lines`}</Button>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  )
}

/**
 * Only the lines that need a decision, one group per kind, one choice per line (J2). The first three groups with open lines
 * start open; a decided group folds to its header. `openKinds` lets a screen open groups from an error summary.
 */
export function FixList({ session, activeId, openKinds, onlyOpen = false, onFocusRow }: { session: ImportSession; activeId?: string | null; openKinds?: ExceptionKind[]; onlyOpen?: boolean; onFocusRow?: (id: string) => void }) {
  const groups = session.groups.filter((g) => !onlyOpen || g.open > 0)
  const [open, setOpen] = React.useState<Set<ExceptionKind>>(() => new Set(session.groups.filter((g) => g.open > 0).slice(0, 3).map((g) => g.kind)))
  React.useEffect(() => {
    if (openKinds?.length) setOpen((o) => new Set([...o, ...openKinds]))
  }, [openKinds])
  // A row picked elsewhere (variant B, the file pane) opens its group.
  React.useEffect(() => {
    if (!activeId || !session.review) return
    const g = session.groups.find((x) => x.rows.some((r) => r.id === activeId))
    if (g) setOpen((o) => (o.has(g.kind) ? o : new Set([...o, g.kind])))
  }, [activeId, session.groups, session.review])
  if (groups.length === 0) return null
  return (
    <div className="flex flex-col gap-4" data-fix-list>
      {groups.map((g) => (
        <FixGroupBlock
          key={g.kind}
          session={session}
          group={g}
          activeId={activeId}
          onFocusRow={onFocusRow}
          open={open.has(g.kind)}
          onOpenChange={(o) => setOpen((s) => { const n = new Set(s); if (o) n.add(g.kind); else n.delete(g.kind); return n })}
        />
      ))}
    </div>
  )
}

/** The intro line of the fix step. */
export function FixIntro({ session }: { session: ImportSession }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-base font-medium text-foreground">{session.left > 0 ? `${plural(session.left, "line needs", "lines need")} a decision.` : "Every line has a decision."}</p>
      <p className="text-sm text-muted-foreground">A suggestion is shown for each. Nothing is created until you confirm.</p>
    </div>
  )
}

/** After a failed continue: one error banner with a link per open group (rule L9). Focus moves to it. */
export function FixErrorSummary({ session, onOpen }: { session: ImportSession; onOpen: (kind: ExceptionKind) => void }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const openGroups = session.groups.filter((g) => g.open > 0)
  React.useEffect(() => { ref.current?.focus() }, [])
  if (session.left === 0) return null
  return (
    <div ref={ref} tabIndex={-1} className="outline-none" data-region="validation-summary">
      <LocalBanner variant="error" title={`${plural(session.left, "line still needs", "lines still need")} a decision`}>
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {openGroups.map((g) => (
            <li key={g.kind}>
              <Button
                type="button"
                variant="link"
                size="xs"
                className="h-auto p-0"
                onClick={() => {
                  onOpen(g.kind)
                  const first = g.rows.find((r) => (session.review!.exceptions[r.id] ?? []).some((k) => !session.decisions[decisionKey(r.id, k)]))
                  const k = first ? (session.review!.exceptions[first.id] ?? []).find((x) => !session.decisions[decisionKey(first.id, x)]) : undefined
                  if (first && k) window.setTimeout(() => document.getElementById(fixSelectId(first.id, k))?.focus(), 50)
                }}
              >
                {`${EXCEPTION_LABEL[g.kind]}, ${g.open}`}
              </Button>
            </li>
          ))}
        </ul>
      </LocalBanner>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Confirm and done

export function ImportNameField({ session }: { session: ImportSession }) {
  return (
    <Field className="max-w-md">
      <FieldLabel htmlFor="import-batch">Import name</FieldLabel>
      <Input id="import-batch" value={session.batchName} onChange={(e) => session.setBatchName(e.target.value)} aria-describedby="import-batch-help" />
      <FieldDescription id="import-batch-help">{`Shown in the library so you can tell which ${skillNounPlural()} came from this file.`}</FieldDescription>
    </Field>
  )
}

export function NewListField({ session }: { session: ImportSession }) {
  if (!session.isNewList) return null
  return (
    <Field className="max-w-md">
      <FieldLabel htmlFor="import-new-list">List name</FieldLabel>
      <Input id="import-new-list" value={session.newLibraryName} onChange={(e) => session.setNewLibraryName(e.target.value)} placeholder="For example, Associate degree nursing" />
    </Field>
  )
}

/** "Not created: 3 left out, 2 joined to the line above", with the lines behind it [REQ IM-08]. */
export function NotCreatedList({ session }: { session: ImportSession }) {
  const nc = React.useMemo(() => notCreated(session.resolved), [session.resolved])
  const total = nc.leftOut.length + nc.merged.length + nc.joined.length
  if (total === 0) return null
  const parts = [
    nc.leftOut.length ? `${nc.leftOut.length} left out` : null,
    nc.merged.length ? `${nc.merged.length} merged` : null,
    nc.joined.length ? `${nc.joined.length} joined to the line above` : null,
  ].filter(Boolean)
  return (
    <Collapsible className="flex flex-col gap-2">
      <CollapsibleTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="-ms-2 w-fit gap-2 px-2">
          <i className="fa-light fa-chevron-right text-xs" aria-hidden="true" />
          {`Not created: ${parts.join(", ")}`}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="flex flex-col divide-y divide-border">
          {[...nc.leftOut, ...nc.merged, ...nc.joined].map((r) => (
            <li key={r.row.id} className="grid min-h-10 grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 py-1.5">
              <span className="font-mono text-xs tabular-nums text-muted-foreground">{r.row.line}</span>
              <LineText row={r.row} className="truncate" />
              <span className="text-xs text-muted-foreground">{r.outcome}</span>
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  )
}

/** Confirm: one plan sentence, what each new skill starts as, the import name, then what is not created. */
export function ConfirmPanel({ session }: { session: ImportSession }) {
  return (
    <div className="flex flex-col gap-6" data-confirm-panel>
      <div className="flex flex-col gap-1">
        <p className="text-base font-medium text-foreground" data-plan-sentence>
          {confirmSentence(session.plan, session.targetLabel, { one: skillNoun(), many: skillNounPlural() })}
        </p>
        <p className="text-sm text-muted-foreground">Each starts not configured, so students cannot send it until you configure it.</p>
      </div>
      <NewListField session={session} />
      <ImportNameField session={session} />
      <NotCreatedList session={session} />
    </div>
  )
}

/** After Create: the success banner takes focus and names the next step (configure). */
export function DoneBanner({ session }: { session: ImportSession }) {
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    ref.current?.focus()
    ref.current?.scrollIntoView({ block: "nearest" })
  }, [])
  const total = session.plan.create + session.plan.replace
  return (
    <div ref={ref} tabIndex={-1} role="status" className="outline-none" data-import-done>
      <LocalBanner variant="success" title={`${countSkills(total)} added to ${session.targetLabel}`} action={{ label: "Configure them", href: NOT_CONFIGURED_HREF }}>
        They are not configured yet. Students cannot send them until they are.
      </LocalBanner>
    </div>
  )
}

/** Cancel with work in hand asks first; "Keep working" has focus. */
export function DiscardDialog({ open, onOpenChange, onDiscard }: { open: boolean; onOpenChange: (o: boolean) => void; onDiscard: () => void }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Discard this import?</AlertDialogTitle>
          <AlertDialogDescription>Nothing has been created. The file and your decisions will be lost.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline" autoFocus>Keep working</AlertDialogCancel>
          <AlertDialogAction variant="destructive-outline" onClick={onDiscard}>Discard</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/** The title-zone Cancel. With a file read it confirms first; otherwise it goes back to the library. */
export function useCancel(session: ImportSession, go: (href: string) => void) {
  const [asking, setAsking] = React.useState(false)
  const hasWork = session.phase === "review" || session.phase === "reading"
  const onCancel = () => (hasWork ? setAsking(true) : go(LIBRARY_HREF))
  const dialog = <DiscardDialog open={asking} onOpenChange={setAsking} onDiscard={() => { session.reset(); go(LIBRARY_HREF) }} />
  return { onCancel, dialog }
}
