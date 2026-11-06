"use client"

/**
 * Set up skills, step 1, the list design (Setup summary variant D, D-L46, Proposed; concept A of
 * docs/build/2026-11-04-setup-step1-add-skills-concepts.md). Romit 2026-11-04: "really simple and minimal flow with less or no
 * subtext and better layout and UX and UI patterns".
 *
 * The list is the page. One add row on top ("Add a skill, or paste a list"): Enter adds one; a multi-line paste shows one check
 * line ("148 new · 3 repeated") with "Add n skills" (outline) and Cancel, and lines that could not be read are listed with their
 * text [REQ IM-01, IM-08, IM-12, IM-13]. Below, the list as a DS DataTable: name, category and tags edited in place
 * [REQ IM-05, SL-03 to SL-05], a row menu (Add description, Remove) [REQ SL-02], selection with Set category, Add tags and Remove.
 * Removal is immediate with a LocalBanner and Undo (nothing is tracked yet, D-X15). Repeated names are flagged "Possible
 * duplicate" with Keep both or Remove; never blocking [REQ IM-06]. Exact matches only, case and spaces ignored (normName).
 * No helper text (D-L34): labels, the placeholder, errors and the check line. The noun is "list"; the wizard never says "library".
 * Writes through useLibrary, the hub Library's writer; parsing and duplicates come from lib/lab/library.ts.
 */
import * as React from "react"
import { BulkCount } from "@/components/lab/shared/bulk-count"
import { createPortal } from "react-dom"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { InputGroup, InputGroupTextarea } from "@exxatdesignux/ui/components/ui/input-group"
import { InlineEditActions, InlineEditShell, InlineInputEdit, InlineSelectEdit } from "@exxatdesignux/ui/components/ui/inline-edit"
import { Popover, PopoverContent, PopoverTrigger } from "@exxatdesignux/ui/components/ui/popover"
import { Toggle } from "@exxatdesignux/ui/components/ui/toggle"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@exxatdesignux/ui/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { FieldError, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import { useTableState } from "@exxatdesignux/ui/components/data-table/use-table-state"
import type { ColumnDef } from "@exxatdesignux/ui/components/data-table/types"
import { LocalBanner, StatusBadge } from "@exxatdesignux/ui"
import { useLibrary } from "@/components/lab/library/use-library"
import { SkillSheet } from "@/components/lab/library/skill-sheet"
import { CategoryPicker, TagsPicker, useVocabOptions } from "@/components/lab/library/category-tag-pickers"
import { LaterBadge } from "@/components/lab/import/sample-badge"
import { EmptyBlock } from "@/components/lab/empty-block"
import { useEmbeddedStep } from "@/components/lab/layout/embedded"
import { MAX_NAME, mergeTags, normName, notReadReason, parseSeveral, pasteSummary, possibleDuplicates, type LibraryRow, type PastedLine, type Removal } from "@/lib/lab/library"
import { aNoun, capitalize, countSkills, skillNoun, skillNounPlural } from "@/lib/lab/terms"

/** A failed Next on this step: the wizard bumps `at`, the step shows the error under the add row and focuses it. */
export type GateCue = { at: number } | null

type Row = LibraryRow & Record<string, unknown>

const ADD_ID = "setup-add-row"
const KEPT_KEY = "lab:setup-skills:kept"
/** Search appears once the list is long enough to need it (concept A: "more than about 10"). */
const SEARCH_FROM = 11
const HIGHLIGHT_MS = 2000
const NONE = "__none__"
const NEW = "__new__"

function readKept(): string[] {
  try { return JSON.parse(window.localStorage.getItem(KEPT_KEY) ?? "[]") as string[] } catch { return [] }
}
function writeKept(ids: string[]) {
  try { window.localStorage.setItem(KEPT_KEY, JSON.stringify(ids)) } catch { /* blocked storage: kept for this visit */ }
}

/** The check line's own words: only the parts that are not zero, new always first. */
export function checkLine(fresh: number, repeated: number, notRead: number): string {
  return [`${fresh.toLocaleString("en-US")} new`, repeated ? `${repeated.toLocaleString("en-US")} repeated` : "", notRead ? `${notRead.toLocaleString("en-US")} not read` : ""].filter(Boolean).join(" · ")
}

/** After the DS inline select opens, put focus on its trigger (it renders without focus). */
function focusOpenedSelect(e: React.MouseEvent<HTMLElement>) {
  const host = e.currentTarget
  window.requestAnimationFrame(() => host.querySelector<HTMLElement>("[role=combobox]")?.focus())
}

/** What a single typed line says when Enter cannot add it: "{What failed}. {What to do}." */
function singleError(line: PastedLine | undefined): string | null {
  if (!line || line.kind === "not-read") return `Enter ${aNoun()} name.`
  if (line.kind === "too-long") return `Name is too long. Use ${MAX_NAME} characters or fewer.`
  return null
}

/** Wizard step 1 (variant D): the shared editor, with Upload a file on the step heading row. */
export function SkillsListStep({ gateCue }: { gateCue: GateCue }) {
  const embedded = useEmbeddedStep()
  return (
    <>
      {embedded?.actionsTarget ? createPortal(<UploadLaterButton />, embedded.actionsTarget) : <div className="flex justify-end"><UploadLaterButton /></div>}
      <SkillsListEditor gateCue={gateCue} />
    </>
  )
}

/**
 * Upload a file (Later): Phase 2 [CALL 10-26], never a disabled control above the fold; it opens a one-line note and offers
 * paste, which puts focus in the add row. Placed by the page (the step heading row, or the landing Library's header).
 */
export function UploadLaterButton() {
  const [open, setOpen] = React.useState(false)
  const pasteInstead = React.useRef(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-2" data-upload-later>
          Upload a file
          <LaterBadge />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="flex w-72 flex-col items-start gap-3 p-4" onCloseAutoFocus={(e) => { if (pasteInstead.current) { e.preventDefault(); pasteInstead.current = false; document.getElementById(ADD_ID)?.focus() } }}>
        <p className="text-sm text-foreground">Upload comes in a later release.</p>
        <Button type="button" variant="outline" size="sm" onClick={() => { pasteInstead.current = true; setOpen(false) }}>Paste a list instead</Button>
      </PopoverContent>
    </Popover>
  )
}

/**
 * The add row and the editable list of step 1 of Set up skills (variant D, D-L46). The Library of the same new program is the hub Library page on the same store
 * (`?program=new`), so a skill added in one is in the other as entered.
 */
export function SkillsListEditor({ gateCue = null }: { gateCue?: GateCue }) {
  const inWizard = useEmbeddedStep() !== null
  const api = useLibrary()
  const opts = useVocabOptions()
  const noun = skillNoun()
  const nounPl = skillNounPlural()
  // Newest first while adding (the store keeps entry order; Undo puts a row back at its place).
  const rows = React.useMemo(() => api.rows.filter((r) => r.status !== "inactive").reverse() as Row[], [api.rows])
  const names = React.useMemo(() => rows.map((r) => r.name), [rows])

  const [kept, setKept] = React.useState<string[]>([])
  React.useEffect(() => setKept(readKept()), [])
  React.useEffect(() => {
    const clear = () => { setKept([]); writeKept([]) }
    window.addEventListener("lab:reset", clear)
    return () => window.removeEventListener("lab:reset", clear)
  }, [])
  // Oldest first for the flag: the later copy is the possible duplicate.
  const flagged = React.useMemo(() => possibleDuplicates([...rows].reverse(), kept), [rows, kept])
  const keepBoth = (id: string) => setKept((k) => { const n = [...new Set([...k, id])]; writeKept(n); return n })

  // ---- Add row
  const [text, setText] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const [fresh, setFresh] = React.useState<Set<string>>(new Set())
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  const multi = lines.length > 1
  const single = React.useMemo(() => (multi ? undefined : parseSeveral(text, names).lines[0]), [multi, text, names])
  const summary = React.useMemo(() => (multi ? pasteSummary(text, names) : null), [multi, text, names])
  const typedTwin = single?.kind === "in-library" ? rows.find((r) => normName(r.name) === normName(single.name)) ?? null : null

  const flash = (ids: string[]) => {
    setFresh(new Set(ids))
    window.setTimeout(() => setFresh(new Set()), HIGHLIGHT_MS)
  }
  const addItems = (items: Parameters<typeof api.addMany>[0]) => {
    const ids = api.addMany(items, { category: "", tags: [] })
    flash(ids)
    return ids
  }
  const addSingle = (anyway = false) => {
    const e = singleError(single)
    if (e) { setError(e); inputRef.current?.focus(); return }
    if (single!.kind === "in-library" && !anyway) { inputRef.current?.focus(); return }
    addItems([{ name: single!.name }])
    setText("")
    setError(null)
    inputRef.current?.focus()
  }
  const addPasted = () => {
    if (!summary) return
    addItems(summary.toAdd)
    // Lines that could not be read stay in the box, as typed, to fix or clear [REQ IM-08].
    setText(summary.notRead.map((l) => l.raw).join("\n"))
    setError(null)
    inputRef.current?.focus()
  }
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return
    e.preventDefault()
    if (multi) { if (summary?.toAdd.length) addPasted(); return }
    addSingle()
  }

  // Next pressed with no skills: the error sits under the add row and focus moves there.
  const [gateShown, setGateShown] = React.useState(false)
  React.useEffect(() => {
    if (!gateCue) return
    setGateShown(true)
    inputRef.current?.focus()
  }, [gateCue])
  React.useEffect(() => { if (rows.length) setGateShown(false) }, [rows.length])
  // Arrival: the add row has focus, ready to type or paste.
  React.useEffect(() => { inputRef.current?.focus() }, [])

  // ---- Remove and Undo
  const [undo, setUndo] = React.useState<{ removal: Removal; title: string } | null>(null)
  const removeIds = (ids: string[]) => {
    if (!ids.length) return
    const one = ids.length === 1 ? rows.find((r) => r.id === ids[0])?.name : undefined
    const removal = api.removeMany(ids)
    setUndo({ removal, title: `${one ?? countSkills(ids.length)} removed.` })
    // The removed row held focus: hand it to Undo, the one thing a keyboard user may want next.
    window.requestAnimationFrame(() => document.querySelector<HTMLElement>("[data-remove-undo] button")?.focus())
  }
  const undoRemoval = () => {
    if (!undo) return
    api.restore(undo.removal)
    flash(undo.removal.skills.map((e) => e.skill.id))
    setUndo(null)
    // The banner (and its Undo) goes; focus returns to the add row rather than the page.
    inputRef.current?.focus()
  }

  // ---- Table
  const [dupOnly, setDupOnly] = React.useState(false)
  React.useEffect(() => { if (flagged.size === 0) setDupOnly(false) }, [flagged.size])
  const data = React.useMemo(() => (dupOnly ? rows.filter((r) => flagged.has(r.id)) : rows), [dupOnly, rows, flagged])
  const [describing, setDescribing] = React.useState<Row | null>(null)
  const [creating, setCreating] = React.useState<string | null>(null)
  const goTo = (id: string) => {
    ts.setSearch("")
    setDupOnly(false)
    flash([id])
    window.requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(`[data-skill-name="${CSS.escape(id)}"] button`)
      el?.scrollIntoView({ block: "center" })
      el?.focus()
    })
  }

  const categoryOptions = React.useMemo(() => [
    { value: NONE, label: "None" },
    ...opts.categories.map((c) => ({ value: c, label: c })),
    { value: NEW, label: "New category" },
  ], [opts.categories])

  // Memoised: the DS table state re-derives its layout (pins, widths) when the columns change, so a new array on every render
  // made 150 rows re-layout on each keystroke.
  const columns = React.useMemo((): ColumnDef<Row>[] => [
    { key: "select", label: "", width: 40, minWidth: 40, defaultPin: "left", lockPin: true, resizable: false },
    {
      key: "name",
      label: "Name",
      width: 360,
      sortable: true,
      cell: (r) => (
        <span className={`flex min-w-0 flex-col items-start gap-1 rounded-md ${fresh.has(r.id) ? "bg-muted" : ""}`} data-skill-name={r.id} data-fresh={fresh.has(r.id) || undefined}>
          <InlineInputEdit
            value={r.name}
            label={`${noun} name`}
            maxLength={MAX_NAME}
            onCommit={(v) => { if (v.trim()) api.setDetails([r.id], { name: v }) }}
            displayClassName="font-medium text-foreground"
          />
          {flagged.has(r.id) ? (
            <span className="flex flex-wrap items-center gap-2 px-2" data-possible-duplicate>
              <StatusBadge label="Possible duplicate" tone="warning" icon="fa-triangle-exclamation" size="sm" surface="table" />
              <Button type="button" variant="outline" size="xs" onClick={() => keepBoth(r.id)} aria-label={`Keep both: ${r.name}`}>Keep both</Button>
              <Button type="button" variant="outline" size="xs" onClick={() => removeIds([r.id])} aria-label={`Remove ${r.name}`}>Remove</Button>
            </span>
          ) : null}
        </span>
      ),
    },
    {
      key: "category",
      label: "Category",
      width: 210,
      sortable: true,
      cell: (r) =>
        creating === r.id ? (
          <NewCategory onCancel={() => setCreating(null)} onSave={(v) => { setCreating(null); if (v.trim()) api.setDetails([r.id], { category: v }) }} />
        ) : (
          // The DS select opens without moving focus; the wrapper hands focus to it so the keyboard can choose and Escape.
          <span className="contents" onClickCapture={focusOpenedSelect}>
          <InlineSelectEdit
            value={r.category || NONE}
            label="category"
            options={categoryOptions}
            onCommit={(v) => { if (v === NEW) setCreating(r.id); else api.setDetails([r.id], { category: v === NONE ? "" : v }) }}
          />
          </span>
        ),
    },
    { key: "tags", label: "Tags", width: 260, cell: (r) => <TagsCell row={r} options={opts.tags} inactive={opts.inactiveTags} onChange={(t) => api.setDetails([r.id], { tags: t })} /> },
    {
      key: "actions",
      label: "Actions",
      width: 64,
      resizable: false,
      defaultPin: "right",
      lockPin: true,
      header: () => <span className="sr-only">Actions</span>,
      cell: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon-sm" aria-label={`Actions for ${r.name}`}>
              <i className="fa-light fa-ellipsis" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setDescribing(r)}>{r.description ? "Edit description" : "Add description"}</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => removeIds([r.id])}>Remove</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [fresh, flagged, creating, categoryOptions, opts.tags, opts.inactiveTags, noun, api.setDetails, rows]) // eslint-disable-line react-hooks/exhaustive-deps
  const ts = useTableState<Row>(data, columns)

  const [bulk, setBulk] = React.useState<{ kind: "category" | "tags"; ids: string[] } | null>(null)
  const bulkSlot = (selected: Set<string | number>) => {
    const ids = rows.filter((r) => selected.has(r.id)).map((r) => r.id)
    return (
      <span className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setBulk({ kind: "category", ids })}>Set category</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setBulk({ kind: "tags", ids })}>Add tags</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => { removeIds(ids); ts.setSelected(new Set()) }}>Remove</Button>
      </span>
    )
  }
  const applyBulk = (value: { category?: string; tags?: string[] }) => {
    if (!bulk) return
    if (bulk.kind === "category") api.setDetails(bulk.ids, { category: value.category ?? "" })
    else for (const id of bulk.ids) { const r = rows.find((x) => x.id === id); if (r) api.setDetails([id], { tags: mergeTags(r.tags, value.tags ?? []) }) }
    setBulk(null)
    ts.setSelected(new Set())
  }

  const showSearch = rows.length >= SEARCH_FROM
  const showToolbar = showSearch || flagged.size > 0
  const filtersOn = ts.search.trim() !== "" || dupOnly

  const addError = gateShown && !rows.length ? `Add at least one ${noun}.` : error
  return (
    <div className="flex flex-col gap-4" data-setup-list>
      <div className="flex flex-col gap-2" data-region="add-row">
        <FieldLabel htmlFor={ADD_ID} className="sr-only">{`Add ${aNoun()}, or paste a list`}</FieldLabel>
        <InputGroup className="h-auto items-start">
          <InputGroupTextarea
            ref={inputRef}
            id={ADD_ID}
            // One row while typing; a paste opens up to six rows so the admin sees what they pasted.
            rows={multi ? Math.min(text.split(/\r?\n/).length, 6) : 1}
            value={text}
            placeholder={`Add ${aNoun()}, or paste a list`}
            aria-invalid={addError ? true : undefined}
            aria-describedby={addError ? `${ADD_ID}-error` : multi ? `${ADD_ID}-check` : undefined}
            onChange={(e) => { setText(e.target.value); if (error) setError(null) }}
            onKeyDown={onKeyDown}
            className={`min-h-10 resize-none py-2.5 ${multi ? "max-h-40 overflow-y-auto" : "max-h-10 overflow-y-hidden"}`}
            data-setup-add-input
          />
        </InputGroup>
        {addError ? <FieldError id={`${ADD_ID}-error`} data-add-error>{addError}</FieldError> : null}
        {!multi && typedTwin && !addError ? (
          <div className="flex flex-wrap items-center gap-3" data-typed-duplicate>
            <p className="flex items-center gap-2 text-sm text-[var(--status-badge-warning-fg)]" role="status">
              <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
              Already in the list.
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => addSingle(true)}>Add anyway</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => goTo(typedTwin.id)}>Go to it</Button>
          </div>
        ) : null}
        {multi && summary ? (
          <div className="flex flex-col gap-2" data-paste-check>
            <div className="flex flex-wrap items-center gap-3">
              <p id={`${ADD_ID}-check`} className="text-sm text-foreground tabular-nums" role="status">{checkLine(summary.fresh, summary.repeated, summary.notRead.length)}</p>
              {summary.toAdd.length ? <Button type="button" variant="outline" size="sm" onClick={addPasted} data-paste-add>{`Add ${countSkills(summary.toAdd.length)}`}</Button> : null}
              <Button type="button" variant="ghost" size="sm" onClick={() => { setText(""); inputRef.current?.focus() }}>Cancel</Button>
            </div>
            {summary.notRead.length ? (
              <ul className="flex max-h-28 flex-col gap-1 overflow-y-auto text-sm text-muted-foreground" aria-label="Lines not read" data-not-read>
                {summary.notRead.map((l) => (
                  <li key={l.line} className="truncate">
                    <span className="text-xs">{`Line ${l.line}: `}</span>
                    <span className="whitespace-pre text-foreground">{l.raw.trim()}</span>
                    <span className="text-xs">{`, ${notReadReason(l)}`}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>

      {undo ? (
        <LocalBanner variant="success" action={{ label: "Undo", onClick: undoRemoval }} dismissible onDismiss={() => setUndo(null)} data-remove-undo>
          {undo.title}
        </LocalBanner>
      ) : null}

      {/* In the wizard the DS bulk bar (sticky to the bottom edge) would sit behind the sticky footer, so it stops above it. */}
      <section aria-label={`${capitalize(nounPl)} in the list`} className={`flex flex-col gap-3 ${inWizard ? "[&_div.sticky.bottom-0]:bottom-[3.5625rem]" : ""}`} data-region="list">
        {showToolbar ? (
          <div className="flex flex-wrap items-center gap-2" data-list-toolbar>
            {showSearch ? <Input type="search" value={ts.search} onChange={(e) => ts.setSearch(e.target.value)} placeholder={`Search ${nounPl}`} aria-label={`Search ${noun} names`} className="h-8 w-64" /> : null}
            {flagged.size > 0 ? (
              <Toggle variant="outline" size="sm" pressed={dupOnly} onPressedChange={setDupOnly} data-duplicates-filter>
                {`Possible duplicates (${flagged.size})`}
              </Toggle>
            ) : null}
          </div>
        ) : null}
        <DataTable<Row>
          data={data}
          columns={columns}
          state={ts}
          getRowId={(r) => r.id}
          getRowSelectionLabel={(r) => r.name}
          selectable
          searchable={false}
          showQueryControls={false}
          edgeInset={false}
          bulkActionsSlot={(selected) => <><BulkCount n={selected.size} />{bulkSlot(selected)}</>}
          emptyState={
            filtersOn ? (
              <EmptyBlock compact title={`No ${nounPl} match`} action={{ label: "Show all" }} onAction={() => { ts.setSearch(""); setDupOnly(false) }} />
            ) : (
              <EmptyBlock compact title={`No ${nounPl} yet`} />
            )
          }
        />
      </section>

      <SkillSheet
        open={describing !== null}
        onOpenChange={(o) => { if (!o) setDescribing(null) }}
        rows={api.rows}
        mode="edit"
        editing={describing}
        onSave={(d) => { if (describing) api.setDetails([describing.id], { name: d.name, category: d.category || d.section, tags: d.tags, description: d.description }) }}
      />
      <BulkDialog bulk={bulk} options={opts} onCancel={() => setBulk(null)} onApply={applyBulk} />
      <span className="sr-only" aria-live="polite">{rows.length ? `${countSkills(rows.length)} in the list` : ""}</span>
    </div>
  )
}

/** "New category" from the category cell: a DS inline input with the DS save and cancel (SL-05, created where it is needed). */
function NewCategory({ onSave, onCancel }: { onSave: (v: string) => void; onCancel: () => void }) {
  const [v, setV] = React.useState("")
  return (
    <InlineEditShell>
      <Input
        value={v}
        autoFocus
        aria-label="New category"
        placeholder="New category"
        className="h-8 min-w-36"
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          e.stopPropagation()
          if (e.key === "Enter") { e.preventDefault(); onSave(v) }
          if (e.key === "Escape") { e.preventDefault(); onCancel() }
        }}
      />
      <InlineEditActions label="new category" onSave={() => onSave(v)} onCancel={onCancel} />
    </InlineEditShell>
  )
}

/** Tags in a row: the chips as text, and the existing chip text box (TagsPicker) in a popover to change them (D-X28). */
function TagsCell({ row, options, inactive, onChange }: { row: Row; options: readonly string[]; inactive: readonly string[]; onChange: (t: string[]) => void }) {
  const [open, setOpen] = React.useState(false)
  const id = `tags-${row.id}`
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="h-auto min-h-8 max-w-full flex-wrap justify-start gap-1 px-2 py-1 font-normal" aria-label={`Edit tags for ${row.name}: ${row.tags.length ? row.tags.join(", ") : "none"}`}>
          {row.tags.length ? row.tags.map((t) => <Badge key={t} variant="secondary">{t}</Badge>) : <span className="text-muted-foreground">Add tags</span>}
          <i className="fa-light fa-pen ms-1 shrink-0 text-xs" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="flex w-80 flex-col gap-2 p-3">
        <span id={`${id}-label`} className="text-sm font-medium text-foreground">Tags</span>
        <TagsPicker id={id} labelId={`${id}-label`} value={row.tags} options={options} inactive={inactive} onChange={onChange} size="sm" />
      </PopoverContent>
    </Popover>
  )
}

/** Set category or Add tags for the selected rows: one decision, one dialog, the same pickers as every add path. */
function BulkDialog({ bulk, options, onCancel, onApply }: {
  bulk: { kind: "category" | "tags"; ids: string[] } | null
  options: ReturnType<typeof useVocabOptions>
  onCancel: () => void
  onApply: (v: { category?: string; tags?: string[] }) => void
}) {
  const [category, setCategory] = React.useState("")
  const [tags, setTags] = React.useState<string[]>([])
  React.useEffect(() => { if (bulk) { setCategory(""); setTags([]) } }, [bulk])
  const n = bulk?.ids.length ?? 0
  const isCategory = bulk?.kind === "category"
  return (
    <Dialog open={bulk !== null} onOpenChange={(o) => { if (!o) onCancel() }}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isCategory ? `Set category for ${countSkills(n)}` : `Add tags to ${countSkills(n)}`}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <span id="bulk-field-label" className="text-sm font-medium text-foreground">{isCategory ? "Category" : "Tags"}</span>
          {isCategory ? (
            <CategoryPicker id="bulk-category" labelId="bulk-field-label" value={category} options={options.categories} inactive={options.inactiveCategories} onChange={setCategory} className="w-full" />
          ) : (
            <TagsPicker id="bulk-tags" labelId="bulk-field-label" value={tags} options={options.tags} inactive={options.inactiveTags} onChange={setTags} />
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" size="default" onClick={onCancel}>Cancel</Button>
          <Button type="button" variant="default" size="default" disabled={!isCategory && tags.length === 0} onClick={() => onApply(isCategory ? { category } : { tags })}>
            {isCategory ? "Set category" : "Add tags"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
