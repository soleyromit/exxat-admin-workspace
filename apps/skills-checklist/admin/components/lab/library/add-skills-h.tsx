"use client"

/**
 * Add skills, variant H (D-ADD1117, Decided; Romit's handoff spec "Variant A, side panel"). One "Add skills" button opens this one panel:
 * - Library (default): a source picker inside the search field (Whole library or another list, D-X17: a copy is always asked for), a substring search with a
 *   "Close matches" group under it (decision 4), Select all over what is shown, a "Select all n" per category, rows already on the list ticked and disabled.
 *   A name the library does not have offers one click, Add "{name}" as a new skill; it joins the selection with defaults and no form (spec 3.4).
 * - Upload or paste (D-ADD1117-z, Decided): a plain list. Every line read is a row, ticked, under the file's headings as categories [REQ IM-07];
 *   only formatting is dropped. In the lab any file shows the sample file (D-ADD1117-x, demo mode); a pasted list is read as typed.
 * - Review, inside the panel: times needed and Required per skill; a new skill's name, category and method are edited on its row (decision 7: no configure step).
 * "Add n skills" hands the selection to the list's draft (list-draft.tsx); nothing is written to the store here (decision 1).
 * Only Active skills with an evaluation method are offered [REQ IM-09]; the rest are counted once at the bottom.
 */
import * as React from "react"
import { flushSync } from "react-dom"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Checkbox } from "@exxatdesignux/ui/components/ui/checkbox"
import { FloatingSheetPanelBody, FloatingSheetPanelContent, FloatingSheetPanelFooter, FloatingSheetPanelHeader } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@exxatdesignux/ui/components/ui/input-group"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@exxatdesignux/ui/components/ui/accordion"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { BulkSelectionBar } from "@exxatdesignux/ui/components/data-table/bulk-selection-bar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@exxatdesignux/ui/components/ui/dropdown-menu"
import { useIsMobile } from "@exxatdesignux/ui/hooks/use-mobile"
import { Tooltip, TooltipContent, TooltipTrigger } from "@exxatdesignux/ui/components/ui/tooltip"
import { Textarea } from "@exxatdesignux/ui/components/ui/textarea"
import { ViewSegmentedControl } from "@exxatdesignux/ui/components/ui/view-segmented-control"
import { Field, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { StatusBadge } from "@exxatdesignux/ui"
import { FloatingSheetPanel } from "@/components/lab/shared/sheet"
import { DiscardChangesDialog } from "@/components/lab/shared/unsaved-guard"
import { focusSheetOpener } from "@/components/lab/shared/focus"
import { ABOVE_PANEL_MENU } from "@/components/lab/overlay-layer"
import { TYPE } from "@/components/lab/type-scale"
import { ACCEPT } from "@/components/lab/import/import-parts"
import { useV2State } from "@/lib/v2/react"
import { activeNames } from "@/lib/v2/vocabulary"
import { NO_CATEGORY, duplicateChoices, keepBothSeveralName, libraryTwins, normName, type DuplicateChoice, type LibraryRow } from "@/lib/lab/library"
import { DuplicateChoiceSelect } from "./add-several-sheet"
import { BulkTimesPopover } from "./bulk-times-popover"
import { PanelEmpty } from "./panel-empty"
import { skillLists, type SkillList } from "@/lib/lab/lists"
import { choosableMethods, PROGRAM_METHOD_ID } from "@/lib/lab/methods"
import { TIMES_MAX, timesCellOf } from "@/lib/lab/program-settings"
import { namesExisting, searchSkills } from "@/lib/lab/skill-search"
import { readImportText, type ImportLine } from "@/lib/lab/import-triage"
import { SAMPLE_FILE, SAMPLE_TEXT } from "@/lib/lab/import-sample"
import type { DraftEntry } from "@/lib/lab/list-draft"
import { aNoun, capitalize, countSkills, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import type { LibraryApi } from "./use-library"

const fmt = (n: number) => n.toLocaleString("en-US")
const WHOLE = "library"
/** The From control's file source. */
const FILE = "file"
/** The one upload icon, on the Upload a file button, the menu item, the From trigger, the drop zone and the drag overlay. */
const UPLOAD_ICON = "fa-arrow-up-from-bracket"
const ROW = "flex min-h-11 items-center gap-3 border-b border-border px-3 py-2 last:border-b-0 [contain-intrinsic-size:auto_2.75rem] [content-visibility:auto]"
/** One grouping style on both steps (D-ADD1117-d): an icon, the name and a count above one bordered list. Neutral, no tint. */
const GROUP_HEAD = "flex min-h-8 items-center justify-between gap-3"
/** Review's fields: every label on top, the same size; the open row's body on the neutral table-group surface. */
/** Neutral, not the theme's tinted muted: the table group surface (app/globals.css), which has its own dark value. */
const SURFACE = "bg-[var(--dt-group-bg)]"
const FIELD = "flex flex-col gap-1.5"
/** A selection menu's title (D-ADD1117-p): reads as the menu's question ("Move 2 skills to"), not the DS label's 12 px muted caption. */
const MENU_TITLE = "px-2 pt-2 pb-1.5 text-sm font-semibold text-foreground"
/** Purposeful icons only, one size and colour. */
const ICON = "fa-light text-sm text-muted-foreground"
const slug = (s: string) => s.replace(/[^a-z0-9]+/gi, "-").toLowerCase()

interface Offered { id: string; name: string; category: string }
interface Fresh { id: string; name: string; category: string; description?: string }
/** What Review edits per row (D-ADD1117-r): name, category, times needed, required. Nothing else; the method is set silently on a new skill. */
interface Setting { times?: number; required?: boolean; name?: string; category?: string }
interface ReviewRow { id: string; isNew: boolean; name: string; category: string }
/** A line of the upload; `key` survives edits. */
/** A line of the upload; `key` survives edits. */
type ImpRow = ImportLine & { key: string }
interface Imported { file: string | null; rows: ImpRow[]; noise: number; lineCount: number }

let seq = 0
const newId = () => `lab-skill-h-${Date.now().toString(36)}-${++seq}`

/** Rows drawn at first, and added per "Show more": a 150-skill source draws in one frame, and the order stays the reading order (scale, brief section 9). */
export const ROW_STEP = 60

/** The lists each skill is on, for the row's right side: one name, "On n lists", or nothing when it is on none (D-ADD1117-d). One pass over the lists, not one per row. */
function listsTextById(lists: readonly SkillList[]): Map<string, string> {
  const on = new Map<string, string[]>()
  for (const l of lists) for (const id of l.skillIds) { const a = on.get(id); if (a) a.push(l.name); else on.set(id, [l.name]) }
  const out = new Map<string, string>()
  for (const [id, names] of on) out.set(id, names.length === 1 ? names[0]! : `On ${fmt(names.length)} lists`)
  return out
}

/** The empty state when every skill of the chosen source is already on this list: names both lists, singular and plural. */
export function allInSourceTitle(n: number, source: string | null, current: string): string {
  if (!source) return `Every library ${skillNoun()} is already on ${current}`
  return n === 1 ? `The 1 ${skillNoun()} in ${source} is already on ${current}` : `All ${fmt(n)} ${skillNounPlural()} in ${source} are already on ${current}`
}

/** Focus the first of these that exists in the panel (an element, or a selector inside the panel). */
function focusFirst(targets: ReadonlyArray<HTMLElement | string | undefined>) {
  for (const t of targets) {
    const el = typeof t === "string" ? document.querySelector<HTMLElement>(`[data-h-panel] ${t}`) : t
    if (el) { el.focus(); return }
  }
}

function grouped<T extends { category: string }>(rows: readonly T[]): Array<[string, T[]]> {
  const by = new Map<string, T[]>()
  for (const r of rows) { const a = by.get(r.category); if (a) a.push(r); else by.set(r.category, [r]) }
  // "No category" last, the prototype's order.
  return [...by].sort(([a], [b]) => (a === NO_CATEGORY ? 1 : b === NO_CATEGORY ? -1 : a.localeCompare(b)))
}

/**
 * The real reader: the extract route for Word, PDF and Excel, plain text read here. Kept, unused in the lab while demo mode is on
 * (D-ADD1117-x, Romit 2026-11-17): every file shows the sample instead.
 */
export async function readFileText(f: File): Promise<{ text: string; columns: boolean } | null> {
  try {
    const body = new FormData()
    body.append("file", f)
    const res = await fetch("/api/import/extract", { method: "POST", body })
    if (res.ok) {
      const out = (await res.json()) as { text?: string; columns?: boolean }
      if (typeof out.text === "string") return { text: out.text, columns: !!out.columns }
    }
  } catch { /* read below when it is plain text */ }
  if (/\.(csv|tsv|txt|md)$/i.test(f.name)) {
    try { return { text: await f.text(), columns: /\.csv$/i.test(f.name) } } catch { return null }
  }
  return null
}

/** Times needed as typed: the field can be emptied while retyping; only a whole number from 1 to the maximum is committed. Empty commits null when `allowEmpty`. */
function TimesField({ value, onCommit, allowEmpty = false, className, ...rest }: Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> & { value: number | null; onCommit: (n: number | null) => void; allowEmpty?: boolean }) {
  const [text, setText] = React.useState(value === null ? "" : String(value))
  const focused = React.useRef(false)
  React.useEffect(() => { if (!focused.current) setText(value === null ? "" : String(value)) }, [value])
  return (
    <Input
      {...rest}
      type="number"
      inputMode="numeric"
      min={1}
      max={TIMES_MAX}
      value={text}
      onFocus={() => { focused.current = true }}
      onBlur={() => { focused.current = false; setText(value === null ? "" : String(value)) }}
      onChange={(e) => {
        setText(e.target.value)
        if (e.target.value === "") { if (allowEmpty) onCommit(null); return }
        const n = Number(e.target.value)
        if (Number.isInteger(n) && n >= 1 && n <= TIMES_MAX) onCommit(n)
      }}
      className={`h-8 w-20 text-right tabular-nums ${className ?? ""}`}
    />
  )
}

export function AddSkillsSidePanel({ api, open, onOpenChange, onAdd, draftIds, initialTab = "library", initialSource = null }: {
  api: LibraryApi
  open: boolean
  onOpenChange: (o: boolean) => void
  /** The selection, as draft entries for the list. */
  onAdd: (entries: DraftEntry[]) => void
  /** Skills already on the list's draft: shown as on the list, never added twice. */
  draftIds: ReadonlySet<string>
  /** The tab it opens on: Import from a "Upload a file" link (`?addTab=import`). */
  initialTab?: "library" | "import"
  /** A list to open on (`?source=<listId>`): its skills, as from the Skills from select. */
  initialSource?: string | null
}) {
  const state = useV2State()
  const list = api.list
  const lists = React.useMemo(() => skillLists(api.lists), [api.lists])
  const others = React.useMemo(() => lists.filter((l) => l.id !== list?.id), [lists, list?.id])
  const onList = React.useMemo(() => new Set([...(list?.skillIds ?? []), ...draftIds]), [list?.skillIds, draftIds])
  const methods = React.useMemo(() => choosableMethods(state), [state])
  const programMethod = methods.find((m) => m.id === PROGRAM_METHOD_ID) ?? methods.find((m) => m.program) ?? null
  const categories = React.useMemo(() => activeNames(state, "categories").filter((c) => c !== NO_CATEGORY), [state])
  const names = React.useMemo(() => api.allRows.map((r) => r.name), [api.allRows])
  const byName = React.useMemo(() => new Map(api.allRows.map((r) => [normName(r.name), r])), [api.allRows])
  const twins = React.useMemo(() => libraryTwins(api.allRows), [api.allRows])
  // Offered: Active, with an evaluation method [REQ IM-09]. The rest are counted once.
  const usable = React.useCallback((r: LibraryRow) => r.status === "active" && r.configuration !== "not-configured", [])
  const pool = React.useMemo<Offered[]>(() => api.allRows.filter(usable).map((r) => ({ id: r.id, name: r.name, category: r.categoryName ?? r.section })).sort((a, b) => a.name.localeCompare(b.name)), [api.allRows, usable])

  // Three tabs (D-ADD1117-s): Library, Import, and Selected, which holds what Review held. No separate review page, no back arrow, no "Keep browsing".
  // Step 1 (D-ADD1117-d, draft7): a mode switch (Choose skills | Upload or paste); in Choose, "Skills from" (the library or another list), the search and New skill.
  // Two steps in one panel (D-ADD1117-s, revised): pick from Library or Import, then Review. Back returns to the tab and selection as they were.
  const [step, setStep] = React.useState<"pick" | "review">("pick")
  const isMobile = useIsMobile()
  const view: "browse" | "review" = step === "review" ? "review" : "browse"
  /** To Review, focus on its first control (Select all). */
  const goSelected = () => { setStep("review"); requestAnimationFrame(() => document.querySelector<HTMLElement>("[data-h-select-mode]")?.focus()) }
  const setView = (v: "browse" | "review") => (v === "review" ? goSelected() : setStep("pick"))
  const [source, setSource] = React.useState<string>(WHOLE)
  // The library source to return to from Upload or paste.
  const lastLibrarySource = React.useRef<string>(WHOLE)
  React.useEffect(() => { if (source !== FILE) lastLibrarySource.current = source }, [source])
  // New skill: an inline form, the first row of "Created here".
  const [formOpen, setFormOpen] = React.useState(false)
  const [formName, setFormName] = React.useState("")
  const [formError, setFormError] = React.useState<{ text: string; twin?: LibraryRow } | null>(null)
  const tab: "library" | "import" = source === FILE ? "import" : "library"
  // Where each picked skill came from, for step 2's summary: the library, a list's name, the file, or typed here (new).
  const [origin, setOrigin] = React.useState<Record<string, string>>({})
  const [query, setQuery] = React.useState("")
  // Skills already on this list are hidden until asked for (D-ADD1117-s, revised).
  const [showInList, setShowInList] = React.useState(false)
  const [picked, setPicked] = React.useState<Set<string>>(new Set())
  const [fresh, setFresh] = React.useState<Fresh[]>([])
  const [settings, setSettings] = React.useState<Record<string, Setting>>({})
  const [guard, setGuard] = React.useState(false)
  const search = React.useRef<HTMLInputElement>(null)
  // Import
  const [paste, setPaste] = React.useState("")
  const [imp, setImp] = React.useState<Imported | null>(null)
  const read = imp
  const file = imp?.file ?? null
  const [readError, setReadError] = React.useState<string | null>(null)
  // What is ticked to add, by row key: every line read starts ticked (D-ADD1117-z).
  const [ticked, setTicked] = React.useState<Set<string>>(new Set())
  const [editingLine, setEditingLine] = React.useState<string | null>(null)
  const [editValue, setEditValue] = React.useState("")
  // A detected category is created only while its Create box is ticked [REQ IM-07, IM-13].
  // A file line that names a library skill: Use library skill (default), Keep both or Replace [REQ IM-05, IM-06], the Add several choices.
  const [dupChoice, setDupChoice] = React.useState<Record<string, DuplicateChoice>>({})
  // Library skills a file line replaces: its description and category go on the skill on Save, never before.
  const [replacing, setReplacing] = React.useState<Record<string, { description?: string }>>({})
  // A file dragged over the panel on step 1: a full-panel drop target; dropping reads it (keyboard and screen readers use Upload a file).
  const [dragging, setDragging] = React.useState(false)
  const hasFiles = (e: React.DragEvent) => [...e.dataTransfer.types].includes("Files")
  const fileInput = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (!open) return
    setStep("pick"); setShowInList(false); setSource(initialTab === "import" ? FILE : WHOLE); setOrigin({}); setFormOpen(false); setFormName(""); setFormError(null); setQuery(""); setPicked(new Set()); setFresh([]); setSettings({})
    setPaste(""); setImp(null); setReadError(null); setTicked(new Set()); setDupChoice({}); setReplacing({}); setEditingLine(null)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // `?source=<listId>`: open on that list, as if chosen in Skills from.
  React.useEffect(() => { if (open && initialSource && others.some((l) => l.id === initialSource)) pickSource(initialSource) }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // 150 ms after typing stops (spec 5).
  const [q, setQ] = React.useState("")
  React.useEffect(() => { const t = window.setTimeout(() => setQ(query.trim()), 150); return () => window.clearTimeout(t) }, [query])
  const sourceList = source === WHOLE || source === FILE ? null : others.find((l) => l.id === source) ?? null
  // Clearing the search hides in-list rows again on the whole library; a list source keeps them, since picking a list is to see it.
  React.useEffect(() => { if (!q && !sourceList) setShowInList(false) }, [q, sourceList])
  // Another source starts with its in-list rows hidden, and with the first rows only.
  React.useEffect(() => { setShowInList(false) }, [source])
  const [limit, setLimit] = React.useState(ROW_STEP)
  React.useEffect(() => { setLimit(ROW_STEP) }, [source, q, showInList, open])
  // A list source reads whole (Romit 2026-11-17: "shouldn't I see the skills?"): its rows already on this list stay in place, ticked, disabled, "In list".
  const reveal = showInList || !!sourceList

  const inSource = React.useMemo(() => { if (!sourceList) return pool; const ids = new Set(sourceList.skillIds); return pool.filter((r) => ids.has(r.id)) }, [pool, sourceList])
  const { exact, close } = React.useMemo(() => searchSkills(inSource, q), [inSource, q])
  const shown = React.useMemo(() => [...exact, ...close], [exact, close])
  const addable = React.useMemo(() => shown.filter((r) => !onList.has(r.id)), [shown, onList])
  const alreadyIn = shown.length - addable.length
  const onListsText = React.useMemo(() => listsTextById(lists), [lists])
  // What is drawn, in reading order: Created here, the categories, then Close matches; each capped by `limit` (Show more adds the next rows).
  const drawn = React.useMemo(() => {
    let left = limit
    const take = <T,>(rows: readonly T[]): T[] => { const out = rows.slice(0, Math.max(0, left)); left -= out.length; return out }
    const visibleExact = reveal ? exact : exact.filter((r) => !onList.has(r.id))
    const groups = grouped(visibleExact).map(([name, rows]) => ({ name, rows, draw: take(rows) })).filter((g) => g.draw.length > 0)
    const closeVisible = reveal ? close : close.filter((r) => !onList.has(r.id))
    const closeDraw = take(closeVisible)
    const total = visibleExact.length + closeVisible.length
    return { groups, closeVisible, closeDraw, total, more: Math.max(0, total - limit) }
  }, [exact, close, reveal, onList, limit])
  // "Show n already in list" while searching (D-ADD1117-v), and always on a list source: picking a list is to see what it holds.
  const inListLink = q && !sourceList && alreadyIn > 0 ? (
    <Button type="button" variant="link" size="sm" className="h-auto shrink-0 p-0 text-muted-foreground" aria-pressed={showInList} onClick={() => setShowInList((v) => !v)} data-h-already={alreadyIn}>{`${showInList ? "Hide" : "Show"} ${fmt(alreadyIn)} already in list`}</Button>
  ) : null
  const allPicked = addable.length > 0 && addable.every((r) => picked.has(r.id))
  const somePicked = addable.some((r) => picked.has(r.id))
  const hidden = React.useMemo(() => api.allRows.filter((r) => r.status === "active" && !usable(r) && !onList.has(r.id) && (!sourceList || sourceList.skillIds.includes(r.id))).length, [api.allRows, usable, onList, sourceList])
  const typed = query.trim()
  const canCreate = !!typed && !namesExisting(typed, names) && !fresh.some((f) => normName(f.name) === normName(typed))
  const total = picked.size + fresh.length
  const dirty = total > 0

  const toggle = (ids: readonly string[], on: boolean, from: string = sourceList ? sourceList.name : "library") => {
    setPicked((p) => { const n = new Set(p); for (const id of ids) { if (on) n.add(id); else n.delete(id) } return n })
    if (on) setOrigin((o) => { const n = { ...o }; for (const id of ids) n[id] ??= from; return n })
  }
  const pickSource = (v: string) => {
    setSource(v)
    // Arriving from another list, what it holds that this list does not is selected (spec 3.9).
    const l = others.find((x) => x.id === v)
    if (l) toggle(pool.filter((r) => l.skillIds.includes(r.id) && !onList.has(r.id)).map((r) => r.id), true, l.name)
  }
  const freshShown = q ? fresh.filter((f) => f.name.toLowerCase().includes(q.toLowerCase())) : fresh
  const createFromForm = () => {
    const name = formName.trim().replace(/\s+/g, " ")
    if (!name) { setFormError({ text: "Enter a name." }); return }
    const twin = byName.get(normName(name))
    if (twin) { setFormError({ text: `${capitalize(aNoun())} called "${twin.name}" already exists.`, twin }); return }
    if (fresh.some((f) => normName(f.name) === normName(name))) { setFormError({ text: `${capitalize(aNoun())} called "${name}" is already created here.` }); return }
    const id = newId()
    setFresh((f) => [{ id, name, category: "" }, ...f])
    setOrigin((o) => ({ ...o, [id]: "new" }))
    setFormName(""); setFormError(null); setFormOpen(false)
    requestAnimationFrame(() => document.querySelector<HTMLElement>("[data-h-new-button]")?.focus())
  }
  const cancelForm = () => { setFormName(""); setFormError(null); setFormOpen(false); requestAnimationFrame(() => document.querySelector<HTMLElement>("[data-h-new-button]")?.focus()) }
  const create = () => {
    if (!canCreate) return
    const id = newId()
    setFresh((f) => [{ id, name: typed.replace(/\s+/g, " "), category: "" }, ...f])
    setOrigin((o) => ({ ...o, [id]: "new" }))
    setQuery("")
    search.current?.focus()
  }

  // Review: one row per selected skill, library ones first in name order, new ones on top.
  const timesFor = React.useCallback((id: string, methodId: string | null): number | null => {
    const cell = timesCellOf(state, id)
    if (cell.value !== null) return cell.value
    const m = methods.find((x) => x.id === methodId)
    return m && m.rule.need > 0 ? m.rule.need : cell.programNeed
  }, [state, methods])
  const reviewRows = React.useMemo(() => {
    const lib = [...picked].map((id) => api.byId.get(id)).filter((r): r is LibraryRow => !!r).sort((a, b) => a.name.localeCompare(b.name))
    return { lib, fresh }
  }, [picked, fresh, api.byId])
  const rowsAll = React.useMemo<ReviewRow[]>(() => [
    ...reviewRows.fresh.map((f) => ({ id: f.id, isNew: true, name: f.name, category: f.category })),
    ...reviewRows.lib.map((r) => { const c = r.categoryName ?? r.section; return { id: r.id, isNew: false, name: r.name, category: c === NO_CATEGORY ? "" : c } }),
  ], [reviewRows])
  // Review, concept A (Romit 2026-11-17): one batch line for all, rows read-only and grouped by category; a row opens to edit, and what differs from the batch is its note.
  // `settings` holds only a row's own values; a skill with none follows the batch.
  const defaultTimes = (r: ReviewRow) => timesFor(r.id, r.isNew ? programMethod?.id ?? null : null)
  const [openRow, setOpenRow] = React.useState<string | null>(null)
  const [reviewSel, setReviewSel] = React.useState<Set<string>>(new Set())
  // Select mode (D-ADD1117-u): boxes and the bar only after "Select"; "Done" ends it.
  const [selecting, setSelecting] = React.useState(false)
  React.useEffect(() => { if (open) { setReviewSel(new Set()); setOpenRow(null); setSelecting(false) } }, [open])
  // Rows start collapsed every time Review opens, at any width (a rule, not a fixture).
  React.useEffect(() => { if (step === "review") setOpenRow(null); else setSelecting(false) }, [step])
  const own = (id: string): Setting => settings[id] ?? {}
  const patch = (id: string, p: Partial<Setting>) => setSettings((s) => ({ ...s, [id]: { ...s[id], ...p } }))
  // Each skill's own values (D-ADD1117-b): its current times needed (the skill's, D-ADD1117-t), Required on, unless edited here.
  const timesOf = (r: ReviewRow): number | null => own(r.id).times ?? defaultTimes(r)
  const requiredOf = (r: ReviewRow): boolean => own(r.id).required ?? true
  const nameOf = (r: ReviewRow) => own(r.id).name ?? r.name
  const categoryOf = (r: ReviewRow) => own(r.id).category ?? r.category
  /** The row's note: only what differs from the batch line. */
  /** The collapsed row's values, as read: "1 time · Required". */
  const valuesOf = (r: ReviewRow): string => { const t = timesOf(r); return `${t === null ? "Times not set" : t === 1 ? "1 time" : `${fmt(t)} times`} · ${requiredOf(r) ? "Required" : "Optional"}` }
  const remove = (id: string, isNew: boolean) => {
    if (isNew) setFresh((f) => f.filter((x) => x.id !== id))
    else toggle([id], false)
    setReviewSel((sel) => { const n = new Set(sel); n.delete(id); return n })
    setOpenRow((o) => (o === id ? null : o))
    setReplacing((m) => { if (!(id in m)) return m; const { [id]: _gone, ...rest } = m; return rest })
  }
  const selRows = rowsAll.filter((r) => reviewSel.has(r.id))
  const setMany = (p: Partial<Setting>) => setSettings((s) => { const n = { ...s }; for (const r of selRows) n[r.id] = { ...s[r.id], ...p }; return n })
  // A name another skill already has, in the library or in this Review, is refused on its row (D-ADD1117-r).
  const nameError = (r: ReviewRow): string | null => {
    const name = nameOf(r).trim().replace(/\s+/g, " ")
    if (!name) return "Enter a name."
    const n = normName(name)
    const libTwin = api.allRows.find((x) => x.id !== r.id && normName(x.name) === n)
    const reviewTwin = rowsAll.find((x) => x.id !== r.id && normName(nameOf(x)) === n)
    if (!libTwin && !reviewTwin) return null
    if (!r.isNew && n === normName(r.name)) return null
    return `${capitalize(aNoun())} called "${name}" already exists.`
  }
  const firstError = rowsAll.find((r) => nameError(r)) ?? null
  const selRequired = selRows.filter((r) => requiredOf(r)).length
  // Several at once (Romit 2026-11-17): the DS selection bar takes the footer's place; each action opens a small menu and changes nothing until a choice; the result is said once.
  const [bulkNote, setBulkNote] = React.useState<{ text: string; undo?: () => void } | null>(null)
  React.useEffect(() => { if (step === "pick") setBulkNote(null) }, [step])
  const [timesOpen, setTimesOpen] = React.useState(false)
  const lastTicked = React.useRef<string | null>(null)
  React.useEffect(() => { if (open) setBulkNote(null) }, [open])
  const tick = (id: string, on: boolean) => { if (on) lastTicked.current = id; setReviewSel((sel) => { const n = new Set(sel); if (on) n.add(id); else n.delete(id); return n }) }
  const startSelecting = () => { setSelecting(true); requestAnimationFrame(() => document.getElementById("h-review-all")?.focus()) }
  const endSelecting = () => { setSelecting(false); setReviewSel(new Set()); requestAnimationFrame(() => document.querySelector<HTMLElement>("[data-h-select-mode]")?.focus()) }
  const endSelection = () => {
    setReviewSel(new Set())
    const id = lastTicked.current
    requestAnimationFrame(() => (id ? document.querySelector<HTMLElement>(`[data-h-review-row-id="${CSS.escape(id)}"] [data-h-review-select]`) : null)?.focus())
  }
  const sharedCategory = (() => { const c = [...new Set(selRows.map((r) => categoryOf(r) || NO_CATEGORY))]; return c.length === 1 ? c[0]! : "" })()
  const sharedRequired = selRequired === selRows.length ? "required" : selRequired === 0 ? "optional" : ""
  const n = selRows.length
  const moveTo = (c: string) => { setMany({ category: c === NO_CATEGORY ? "" : c }); setBulkNote({ text: `Moved ${fmt(n)} to ${c === NO_CATEGORY ? "No category" : c}.` }) }
  const setTimesFor = (t: number) => { setMany({ times: t }); setTimesOpen(false); setBulkNote({ text: `Times needed set to ${fmt(t)} for ${countSkills(n)}.` }) }
  const setRequiredFor = (v: string) => { setMany({ required: v === "required" }); setBulkNote({ text: `${countSkills(n)} set to ${v === "required" ? "required" : "optional"}.` }) }
  const removeMany = () => {
    const before = { picked, fresh, settings, replacing }
    const count = n
    for (const r of selRows) remove(r.id, r.isNew)
    setReviewSel(new Set())
    setBulkNote({ text: `${fmt(count)} removed.`, undo: () => { setPicked(before.picked); setFresh(before.fresh); setSettings(before.settings); setReplacing(before.replacing); setBulkNote(null) } })
  }
  const categoryChoices = React.useMemo(() => [...new Set([...categories, ...rowsAll.map((r) => r.category).filter(Boolean), ...Object.values(settings).map((x) => x.category ?? "").filter(Boolean)])].sort((a, b) => a.localeCompare(b)), [categories, rowsAll, settings])
  // The shared values, said once, in plain counts (D-ADD1117-u): "All new · 26 at 1 time, 2 at 2 times · 2 optional".
  const timesWord = (t: number | null) => (t === null ? "times not set" : t === 1 ? "1 time" : `${fmt(t)} times`)
  const tally = <T,>(xs: readonly T[]) => [...xs.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map<T, number>()).entries()].sort((a, b) => b[1] - a[1])
  const timesTally = tally(rowsAll.map((r) => timesOf(r)))
  const timesMajor = timesTally[0]?.[0] ?? null
  const optionalN = rowsAll.filter((r) => !requiredOf(r)).length
  const requiredMajor = optionalN * 2 <= rowsAll.length
  const newN = rowsAll.filter((r) => r.isNew).length
  const sharedLine = [
    newN === rowsAll.length ? "All new" : newN === 0 ? "All from the library" : `${fmt(newN)} new, ${fmt(rowsAll.length - newN)} from the library`,
    timesTally.length === 1 ? (timesMajor === null ? "Times not set" : `${timesWord(timesMajor)} each`) : timesTally.map(([t, c]) => `${fmt(c)} at ${timesWord(t)}`).join(", "),
    optionalN === 0 ? "Required" : optionalN === rowsAll.length ? "Optional" : `${fmt(optionalN)} optional`,
  ].join(" · ")
  /** What differs from the summary, one form. */
  const factsOf = (r: ReviewRow): string => {
    const t = timesOf(r)
    return [t !== timesMajor ? timesWord(t) : "", requiredOf(r) !== requiredMajor ? (requiredOf(r) ? "Required" : "Optional") : ""].filter(Boolean).join(" · ")
  }
  /** Provenance, only on the minority (a tie marks the new ones). */
  const originTag = (r: ReviewRow): string => {
    if (newN === 0 || newN === rowsAll.length) return ""
    const markNew = newN * 2 <= rowsAll.length
    return r.isNew === markNew ? (r.isNew ? "New" : "From library") : ""
  }
  // Grouped as the library groups: by category, "No category" last.
  const reviewGroups = grouped(rowsAll.map((r) => ({ ...r, category: categoryOf(r) || NO_CATEGORY })).sort((a, b) => nameOf(a).localeCompare(nameOf(b))))
  React.useEffect(() => { if (step === "review" && total === 0) setStep("pick") }, [step, total])

  const finish = () => {
    // A name to fix: the row opens on its field instead of adding (the primary stays enabled; the first failed press shows where).
    if (firstError) {
      setOpenRow(firstError.id)
      requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-h-row-name="${firstError.id}"]`)?.focus())
      return
    }
    const entries: DraftEntry[] = rowsAll.map((r) => {
      const f = r.isNew ? fresh.find((x) => x.id === r.id) : undefined
      return {
        id: r.id,
        isNew: r.isNew,
        name: nameOf(r).trim() || r.name,
        category: categoryOf(r),
        // A new skill takes the program's method silently (D-ADD1117-r); none means Not configured [REQ SC-02, IM-09].
        methodId: r.isNew ? programMethod?.id ?? null : null,
        ...(f?.description ? { description: f.description } : !r.isNew && replacing[r.id]?.description ? { description: replacing[r.id]!.description } : {}),
        times: timesOf(r),
        required: requiredOf(r),
      }
    })
    onAdd(entries)
  }

  // Import (D-ADD1117-z, plain list): each line read with its library twin, if any. A name the file repeats is read once.
  const importRows = React.useMemo(() => {
    if (!imp) return []
    const seen = new Set<string>()
    return imp.rows.map((l) => {
      const twin = byName.get(normName(l.text))
      const status: "new" | "library" | "in-list" | "unusable" = !twin ? "new" : onList.has(twin.id) ? "in-list" : usable(twin) ? "library" : "unusable"
      const k = normName(l.text)
      const repeat = seen.has(k)
      seen.add(k)
      return { ...l, twin, status, repeat }
    }).filter((r) => !r.repeat)
  }, [imp, byName, onList, usable])
  const canTick = (r: (typeof importRows)[number]) => r.status === "new" || r.status === "library"
  const toAdd = importRows.filter((r) => canTick(r) && ticked.has(r.key))
  const newCategories = React.useMemo(() => [...new Set(importRows.filter((r) => r.category).map((r) => r.category!))].filter((c) => !categories.some((x) => normName(x) === normName(c))), [importRows, categories])
  const takeText = (text: string, columns: boolean, name: string | null) => {
    const t = readImportText(text, { columns })
    if (!t.lines.length) { setImp(null); setReadError(`We couldn't find any ${skillNounPlural()} in this text.`); return }
    const rows = t.lines.map((l): ImpRow => ({ ...l, key: `l${l.line}` }))
    setReadError(null)
    setImp({ file: name, rows, noise: t.noise, lineCount: text.split(/\r?\n/).length })
    // Every line read is ticked; the admin unticks what is not a skill (D-ADD1117-z).
    setTicked(new Set(rows.map((r) => r.key)))
    setEditingLine(null); setDupChoice({})
  }
  // Demo mode (D-ADD1117-x, Romit 2026-11-17): in the lab no file is read; every file shows the sample, under the sample's name.
  const loadSample = () => takeText(SAMPLE_TEXT, false, SAMPLE_FILE)
  const onFile = (_f: File) => loadSample()
  const tickLine = (key: string, on: boolean) => setTicked((s) => { const n = new Set(s); if (on) n.add(key); else n.delete(key); return n })
  const setRows = (f: (rows: ImpRow[]) => ImpRow[]) => setImp((m) => (m ? { ...m, rows: f(m.rows) } : m))
  // Edit name, in place: Enter or Save keeps it, Esc or Cancel leaves it as read.
  const editLine = (r: ImpRow) => { setEditingLine(r.key); setEditValue(r.text) }
  const cancelLine = (key: string) => { setEditingLine(null); requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-h-line-edit="${key}"]`)?.focus()) }
  const saveLine = (key: string) => {
    const v = editValue.trim().replace(/\s+/g, " ")
    if (!v) return
    setRows((r) => r.map((l) => (l.key === key ? { ...l, text: v } : l)))
    cancelLine(key)
  }
  const choiceOf = (key: string): DuplicateChoice => dupChoice[key] ?? "skip"
  const reviewImport = () => {
    // A file heading the program does not have becomes a new category on Save (D-ADD1117-z); where skills go is changed in Review.
    const catOf = (c?: string): string => c ?? ""
    const libRows = toAdd.filter((r) => r.status === "library")
    const use = libRows.filter((r) => choiceOf(r.key) !== "keep-both")
    const replace = libRows.filter((r) => choiceOf(r.key) === "replace")
    const taken = [...names, ...fresh.map((f) => f.name)]
    const keepBoth: Fresh[] = libRows.filter((r) => choiceOf(r.key) === "keep-both").map((r) => {
      const name = keepBothSeveralName(r.text, taken)
      taken.push(name)
      return { id: newId(), name, category: catOf(r.category), ...(r.description ? { description: r.description } : {}) }
    })
    const add: Fresh[] = toAdd.filter((r) => r.status === "new").filter((r) => !fresh.some((f) => normName(f.name) === normName(r.text))).map((r) => ({
      id: newId(),
      name: r.text,
      category: catOf(r.category),
      ...(r.description ? { description: r.description } : {}),
    }))
    // Step 2 names where these came from: the file's name, or a pasted list.
    const fromHere = `file:${file ?? ""}`
    toggle(use.map((r) => r.twin!.id), true, fromHere)
    setOrigin((o) => ({ ...o, ...Object.fromEntries([...keepBoth, ...add].map((f) => [f.id, fromHere])) }))
    if (replace.length) {
      setReplacing((m) => ({ ...m, ...Object.fromEntries(replace.map((r) => [r.twin!.id, { ...(r.description ? { description: r.description } : {}) }])) }))
      setSettings((s) => { const n = { ...s }; for (const r of replace) { const c = catOf(r.category); if (c) n[r.twin!.id] = { ...s[r.twin!.id], category: c } } return n })
    }
    setFresh((f) => [...keepBoth, ...add, ...f])
    setView("review")
  }

  const requestClose = () => (dirty ? setGuard(true) : onOpenChange(false))
  // One title on both steps, then one muted step line (D-ADD1117-d).
  const title = `Add ${skillNounPlural()} to ${list?.name ?? "this list"}`
  const reviewPrimary = `Add ${countSkills(total)}`
  // Step 2's summary: counts by source, in a fixed order (library, each list, file, new).
  const summaryParts = (() => {
    const ids = [...picked, ...fresh.map((f) => f.id)]
    const by = new Map<string, number>()
    for (const id of ids) { const o = origin[id] ?? "library"; by.set(o, (by.get(o) ?? 0) + 1) }
    const keys = [...by.keys()]
    const order = ["library", ...keys.filter((k) => k !== "library" && k !== "new" && !k.startsWith("file:")), ...keys.filter((k) => k.startsWith("file:")), "new"]
    const words = (k: string) => (k === "new" ? "new" : k === "library" ? "from library" : k.startsWith("file:") ? (k.slice(5) ? `from ${k.slice(5)}` : "from a pasted list") : `from ${k}`)
    return order.filter((k) => by.get(k)).map((k) => `${fmt(by.get(k)!)} ${words(k)}`).join(" · ")
  })()
  const summaryText = `${countSkills(total)}${summaryParts ? `: ${summaryParts}` : ""}`
  // The title names the one source when there is one: "24 skills from sample-nursing-skills.xlsx".
  const summaryTitle = (() => {
    const keys = [...new Set([...picked, ...fresh.map((f) => f.id)].map((id) => origin[id] ?? "library"))]
    const k = keys.length === 1 ? keys[0]! : null
    if (!k || k === "new") return countSkills(total)
    return `${countSkills(total)} ${k === "library" ? "from the library" : k.startsWith("file:") ? (k.slice(5) ? `from ${k.slice(5)}` : "from a pasted list") : `from ${k}`}`
  })()
  // On Import the footer and the primary count the same thing: what is already selected plus what the file adds to it.
  const fromFile = toAdd.filter((r) => (r.status === "library" ? choiceOf(r.key) === "keep-both" || !picked.has(r.twin!.id) : !fresh.some((f) => normName(f.name) === normName(r.text)))).length
  const shownTotal = tab === "import" && read ? total + fromFile : total
  const browsePrimary = `Review ${countSkills(tab === "import" && read ? shownTotal : total)}`
  const browseDisabled = tab === "import" && read ? toAdd.length === 0 : total === 0

  const libraryRow = (r: Offered, describedBy?: string) => {
    const inList = onList.has(r.id)
    if (inList && !reveal) return null
    const id = `h-add-${r.id}`
    const onLists = inList ? "" : onListsText.get(r.id) ?? ""
    return (
      <li key={r.id} className={ROW} data-h-row={r.id} data-h-in-list={inList || undefined}>
        <Checkbox id={id} aria-describedby={describedBy} checked={inList || picked.has(r.id)} disabled={inList} onCheckedChange={(v) => toggle([r.id], v === true)} />
        <Label htmlFor={id} className="min-w-0 flex-1 whitespace-normal font-normal [overflow-wrap:anywhere]">{r.name}</Label>
        {/* The list(s) a skill is on, only when it is on one (D-ADD1117-d). */}
        {inList ? <StatusBadge label="In list" tone="neutral" size="sm" /> : onLists ? <span className="max-w-[40%] shrink-0 truncate text-xs text-muted-foreground" title={onLists} data-h-on-lists>{onLists}</span> : null}
      </li>
    )
  }
  /** A group heading, the same on both steps: icon, name, count; an action on the right. */
  const heading = (icon: string, name: string, count: number, id: string, action?: React.ReactNode) => (
    <div className={GROUP_HEAD} data-h-group={name}>
      <span id={id} className={`${TYPE.group} flex items-center gap-2`}><i className={`${ICON} ${icon}`} aria-hidden="true" />{name}<Badge variant="outline" className="tabular-nums">{fmt(count)}</Badge></span>
      {action}
    </div>
  )
  /** A category: `visible` is every row it shows (the heading counts them, Select all takes them), `draw` the ones rendered so far. */
  const group = (name: string, visible: readonly Offered[], draw: readonly Offered[], prefix: string) => {
    const open = visible.filter((r) => !onList.has(r.id))
    if (!draw.length) return null
    const all = open.length > 0 && open.every((r) => picked.has(r.id))
    const headId = `h-${prefix}-${slug(name)}`
    return (
      <section key={`${prefix}-${name}`} className="flex flex-col gap-1.5" aria-labelledby={headId}>
        {heading("fa-folder", name, visible.length, headId, open.length ? (
          <Button type="button" variant="link" size="sm" className="h-auto p-0" aria-label={all ? `Clear ${name}` : `Select all ${fmt(open.length)} in ${name}`} onClick={() => toggle(open.map((r) => r.id), !all)} data-h-group-all>
            {all ? "Clear" : `Select all ${fmt(open.length)}`}
          </Button>
        ) : undefined)}
        <ul className="flex flex-col overflow-hidden rounded-[var(--radius)] border border-border">{draw.map((r) => libraryRow(r, headId))}</ul>
      </section>
    )
  }
  return (
    <>
      <FloatingSheetPanel open={open} onOpenChange={(o) => (o ? onOpenChange(true) : requestClose())} modal>
        <FloatingSheetPanelContent
          contentSlot="lab-add-skills-h"
          side="right"
          // md (32rem): Review is read-only text rows now (concept A), and the Library list reads best at this width; one size, so switching never jumps.
          size="md"
          aria-modal="true"
          data-h-panel
          onDragEnter={(e) => { if (step === "pick" && hasFiles(e)) { e.preventDefault(); setDragging(true) } }}
          onDragOver={(e) => { if (dragging) e.preventDefault() }}
          onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false) }}
          onDrop={(e) => { if (!dragging) return; e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) { setSource(FILE); onFile(f) } }}
          // Esc closes the top thing first: the New skill form, then a selection, then the panel. The DS layer hears Escape in the capture phase, so the form is closed here.
          onEscapeKeyDown={(e) => { if (formOpen) { e.preventDefault(); cancelForm(); return } if (editingLine) { e.preventDefault(); cancelLine(editingLine); return } if (view === "review" && reviewSel.size) { e.preventDefault(); endSelection(); return } if (view === "review" && selecting) { e.preventDefault(); endSelecting() } }}
          onOpenAutoFocus={(e) => { e.preventDefault(); search.current?.focus() }}
          onCloseAutoFocus={(e) => { e.preventDefault(); focusSheetOpener() }}
          onInteractOutside={(e) => {
            const t = (e.detail.originalEvent.target as Element | null) ?? null
            if (t && (!t.isConnected || t.closest("[data-slot=select-content], [data-radix-popper-content-wrapper], [role=alertdialog]"))) e.preventDefault()
          }}
        >
          {dragging ? (
            <div className="pointer-events-none absolute inset-2 z-30 flex flex-col items-center justify-center gap-2 rounded-[var(--radius)] border-2 border-dashed border-border bg-background" data-h-drop-overlay>
              <i className={`fa-light ${UPLOAD_ICON} text-3xl text-muted-foreground`} aria-hidden="true" />
              <span className={TYPE.label}>Drop to read this file</span>
            </div>
          ) : null}
          <FloatingSheetPanelHeader title={title} subtitle={<span data-h-step-line>{step === "pick" ? "Step 1 of 2 · Choose" : "Step 2 of 2 · Review"}</span>} onClose={requestClose} closeLabel="Close" />
          {step === "pick" ? (
            <>
              {/* Controls band (D-ADD1117-d, draft7): a neutral surface above the results, holding how and where to look. The results scroll under it. */}
              <div className={`flex shrink-0 flex-col gap-3 border-b border-border px-4 py-3 ${SURFACE}`} data-h-band>
                <ViewSegmentedControl
                  value={source === FILE ? "upload" : "library"}
                  onValueChange={(v) => setSource(v === "upload" ? FILE : lastLibrarySource.current)}
                  aria-label={`How to add ${skillNounPlural()}`}
                  options={[
                    { value: "library", label: `Choose ${skillNounPlural()}`, icon: "fa-light fa-magnifying-glass" },
                    { value: "upload", label: "Upload or paste", icon: `fa-light ${UPLOAD_ICON}` },
                  ]}
                  // On the band the track takes the DS border grey, so the white selected segment reads. The DS track is bg-muted/60, which Prism tints rose; local class (D-ADD1117-d).
                  className="flex w-full bg-[var(--border)] [&>*]:min-h-9 [&>*]:flex-1 [&>*]:justify-center [&>*]:text-sm"
                />
                {source === FILE ? null : (
                  <>
                    {/* Where to look is a first-class choice: it is how a program copies from another list (D-X17). */}
                    <Field className="gap-1.5" data-h-skills-from>
                      <FieldLabel htmlFor="h-skills-from">{`${capitalize(skillNounPlural())} from`}</FieldLabel>
                      <Select value={source} onValueChange={pickSource}>
                        <SelectTrigger id="h-skills-from" className="w-full bg-background" data-h-source><SelectValue /></SelectTrigger>
                        <SelectContent position="popper" sideOffset={4} className={`${ABOVE_PANEL_MENU} w-[var(--radix-select-trigger-width)]`}>
                          <SelectItem value={WHOLE} data-h-source-option="library"><i className="fa-light fa-books text-muted-foreground" aria-hidden="true" />Whole library</SelectItem>
                          {others.map((l) => <SelectItem key={l.id} value={l.id} data-h-source-list={l.id}><i className="fa-light fa-list-check text-muted-foreground" aria-hidden="true" />{`${l.name} · ${countSkills(l.skillIds.length)}`}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                    {/* The search, and the one way to create: an outline button, the band's action. */}
                    <div className="flex items-center gap-2">
                      <InputGroup className="min-w-0 flex-1 bg-background">
                        <InputGroupAddon align="inline-start"><i className="fa-light fa-magnifying-glass" aria-hidden="true" /></InputGroupAddon>
                        <InputGroupInput
                          ref={search}
                          type="search"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); create() } }}
                          aria-label={sourceList ? `Search in ${sourceList.name}` : `Search ${skillNounPlural()}`}
                          placeholder={sourceList ? `Search in ${sourceList.name}` : `Search ${skillNounPlural()}`}
                          data-h-search
                        />
                      </InputGroup>
                      <Button type="button" variant="outline" size="default" className="shrink-0 bg-background" onClick={() => { setFormOpen(true); setFormError(null) }} data-h-new-button>
                        <i className="fa-light fa-plus" aria-hidden="true" />{`New ${skillNoun()}`}
                      </Button>
                    </div>
                  </>
                )}
              </div>
              {source === FILE ? (
                <FloatingSheetPanelBody className="flex flex-col gap-4 px-4 pt-3 pb-4" data-h-import>
                  <input ref={fileInput} type="file" accept={`${ACCEPT},.tsv,.md`} className="sr-only" tabIndex={-1} aria-hidden="true" data-h-file-input onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) onFile(f) }} />
                  {!read ? (
                    <>
                      <section
                        className="flex flex-col items-center gap-2 rounded-[var(--radius)] border border-dashed border-border px-4 py-6 text-center"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) onFile(f) }}
                        data-h-dropzone
                      >
                        <i className={`fa-light ${UPLOAD_ICON} text-2xl text-muted-foreground`} aria-hidden="true" />
                        <p className={TYPE.body}>
                          {"Drop a file here or "}
                          <Button type="button" variant="link" size="sm" className="h-auto p-0 align-baseline text-sm" onClick={() => fileInput.current?.click()} data-h-upload>Choose a file</Button>
                        </p>
                        <p className={TYPE.meta}>CSV, Excel, Word, PDF or text</p>
                        {/* Demo mode (D-ADD1117-x): the lab reads no file; this says so by doing it. */}
                        <Button type="button" variant="link" size="sm" className="h-auto p-0 text-muted-foreground" onClick={loadSample} data-h-use-sample>Use sample file</Button>
                      </section>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="h-paste" className={TYPE.group}>Or paste a list</Label>
                        <Textarea id="h-paste" rows={8} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={`One ${skillNoun()} per line`} data-h-paste />
                        <div className="flex justify-end">
                          <Button type="button" variant="outline" size="sm" disabled={!paste.trim()} onClick={() => takeText(paste, false, null)} data-h-read>Read the list</Button>
                        </div>
                      </div>
                      {readError ? <p className="text-sm text-[var(--status-badge-warning-fg)]" role="alert" data-h-read-error>{readError}</p> : null}
                    </>
                  ) : (() => {
                    // D-ADD1117-z (Decided, Romit 2026-11-17): a plain list. Every line read is a row, ticked; headings group it; nothing is judged.
                    const tickable = importRows.filter(canTick)
                    const allOn = tickable.length > 0 && tickable.every((r) => ticked.has(r.key))
                    const cats = [...new Set(importRows.map((r) => r.category).filter((c): c is string => !!c))]
                    // The edit affordance shows on hover and keyboard focus; on a phone, always (no hover there).
                    const quiet = isMobile ? "" : "opacity-0 transition-opacity group-hover/line:opacity-100 group-focus-within/line:opacity-100"
                    const row = (r: (typeof importRows)[number]) => {
                      const id = `h-import-${r.key}`
                      const off = !canTick(r)
                      if (editingLine === r.key) {
                        return (
                          <li key={r.key} className="flex min-h-11 items-center gap-2 py-1" data-h-import-row={r.text} data-h-line-editing={r.key}>
                            <Input
                              autoFocus
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveLine(r.key) } if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); cancelLine(r.key) } }}
                              aria-label={`${capitalize(skillNoun())} name`}
                              className="h-8 min-w-0 flex-1"
                              data-h-line-input
                            />
                            <Button type="button" variant="default" size="sm" disabled={!editValue.trim()} onClick={() => saveLine(r.key)} data-h-line-save>Save</Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => cancelLine(r.key)}>Cancel</Button>
                          </li>
                        )
                      }
                      return (
                        <li key={r.key} className="group/line flex min-h-11 items-center gap-3 py-1" data-h-import-row={r.text}>
                          <Checkbox id={id} checked={r.status === "in-list" || (!off && ticked.has(r.key))} disabled={off} onCheckedChange={(v) => tickLine(r.key, v === true)} />
                          <Label htmlFor={id} className="min-w-0 flex-1 whitespace-normal font-normal [overflow-wrap:anywhere]">{r.text}</Label>
                          {r.status === "new" ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button type="button" variant="ghost" size="icon-sm" className={`shrink-0 ${quiet}`} aria-label={`Edit name: ${r.text}`} onClick={() => editLine(r)} data-h-line-edit={r.key}><i className="fa-light fa-pen" aria-hidden="true" /></Button>
                              </TooltipTrigger>
                              <TooltipContent className={ABOVE_PANEL_MENU}>Edit name</TooltipContent>
                            </Tooltip>
                          ) : null}
                          {r.status === "in-list" ? <StatusBadge label="In list" tone="neutral" size="sm" />
                            : r.status === "unusable" ? <span className="shrink-0 text-xs text-muted-foreground">No evaluation method yet</span>
                            : r.status === "library" ? (
                              <span className="shrink-0" data-h-dup-choice={choiceOf(r.key)}>
                                <DuplicateChoiceSelect id={`h-dup-${r.key}`} value={choiceOf(r.key)} choices={duplicateChoices(twins.get(normName(r.text)))} onChange={(c) => setDupChoice((m) => ({ ...m, [r.key]: c }))}
                                  label={`${r.text} is in the library`} skipLabel={`Use library ${skillNoun()}`} triggerClassName="w-40" contentClassName={ABOVE_PANEL_MENU} />
                              </span>
                            ) : null}
                        </li>
                      )
                    }
                    return (
                      <div className="flex flex-col gap-5" data-h-import-rows={importRows.length}>
                        <div className="flex items-center gap-2" data-h-file-line>
                          <i className="fa-light fa-file-lines text-muted-foreground" aria-hidden="true" />
                          <span className={`${TYPE.label} min-w-0 truncate`} data-h-file-name>{file ?? "Pasted list"}</span>
                          <span className={`${TYPE.meta} shrink-0`}>{`· ${fmt(read.lineCount)} ${read.lineCount === 1 ? "line" : "lines"}`}</span>
                          <span className="flex-1" aria-hidden="true" />
                          <Button type="button" variant="ghost" size="sm" onClick={() => setImp(null)} data-h-replace>Replace</Button>
                        </div>
                        <div className="flex min-h-6 items-center gap-3">
                          <Checkbox id="h-import-all" checked={allOn ? true : tickable.some((r) => ticked.has(r.key)) ? "indeterminate" : false} disabled={!tickable.length} onCheckedChange={() => setTicked((s) => { const x = new Set(s); for (const r of tickable) { if (allOn) x.delete(r.key); else x.add(r.key) } return x })} data-h-import-all />
                          <Label htmlFor="h-import-all" className="font-normal">{`Select all ${fmt(tickable.length)}`}</Label>
                        </div>
                        {importRows.some((r) => !r.category) ? <ul className="flex flex-col" aria-label={`${capitalize(skillNounPlural())} read`}>{importRows.filter((r) => !r.category).map(row)}</ul> : null}
                        {cats.map((c) => {
                          const isNew = newCategories.includes(c)
                          const rowsIn = importRows.filter((r) => r.category === c)
                          return (
                            <section key={c} className="flex flex-col" aria-label={c} data-h-import-category={c}>
                              {/* The same heading as step 2: semibold name and a count, rows aligned under it. */}
                              <div className="flex min-h-8 items-center gap-3 border-b border-border pb-1">
                                <h4 className={`${TYPE.group} min-w-0 truncate`}>{c}</h4>
                                <Badge variant="outline" className="tabular-nums" aria-label={countSkills(rowsIn.length)}>{fmt(rowsIn.length)}</Badge>
                                {isNew ? <Badge variant="outline" className="shrink-0 font-normal text-muted-foreground">New category</Badge> : null}
                              </div>
                              <ul className="flex flex-col">{rowsIn.map(row)}</ul>
                            </section>
                          )
                        })}
                      </div>
                    )
                  })()}
                </FloatingSheetPanelBody>
              ) : (
                <FloatingSheetPanelBody className="flex flex-col gap-4 px-4 pt-3 pb-4">
                  {/* Results, in order: Select all, the Create row while searching, skills created here (with the New skill form first), then the categories. */}
                    {addable.length > 0 ? <div className="flex min-h-6 items-center justify-between gap-3 px-3">
                      {addable.length > 0 ? <div className="flex min-w-0 items-center gap-3">
                        <Checkbox id="h-select-all" checked={allPicked ? true : somePicked ? "indeterminate" : false} disabled={addable.length === 0} onCheckedChange={() => toggle(addable.map((r) => r.id), !allPicked)} data-h-select-all={addable.length} />
                        <Label htmlFor="h-select-all" className="font-normal">{`Select all ${fmt(addable.length)} not ${sourceList ? "on" : "in"} this list`}</Label>
                      </div> : null}
                      {addable.length > 0 && inListLink ? <span className="ms-auto">{inListLink}</span> : null}
                    </div> : null}
                  {canCreate && q ? (
                    <Button type="button" variant="outline" size="default" className="h-auto min-h-11 w-full justify-start gap-2 whitespace-normal border-dashed text-start font-normal" onClick={create} data-h-create>
                      <i className="fa-light fa-plus text-muted-foreground" aria-hidden="true" />{`Create "${typed}" as a new ${skillNoun()}`}
                    </Button>
                  ) : null}
                  <div className="flex flex-col gap-5" aria-label={`${skillNounPlural()} to choose from`} data-h-rows={shown.length}>
                    {/* Created here follows the search like every other group. */}
                    {freshShown.length || formOpen ? (
                      <section className="flex flex-col gap-1.5" aria-labelledby="h-created-group" data-h-created>
                        {/* fa-seedling: started here; distinct from the New skill button's plus, and not sparkles, which is Leo. No "New" tag inside: the group says it. */}
                        {heading("fa-seedling", "Created here", freshShown.length, "h-created-group")}
                        <ul className="flex flex-col overflow-hidden rounded-[var(--radius)] border border-transparent bg-[var(--status-badge-success-fill)]">
                          {formOpen ? (
                            <li className="flex flex-col gap-1.5 border-b border-[var(--border)] bg-background px-3 py-2 last:border-b-0" data-h-new-form>
                              <div className="flex items-center gap-2">
                                <i className="fa-light fa-plus text-sm text-muted-foreground" aria-hidden="true" />
                                <Input
                                  autoFocus
                                  value={formName}
                                  onChange={(e) => { setFormName(e.target.value); setFormError(null) }}
                                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); createFromForm() } if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); cancelForm() } }}
                                  aria-label={`${capitalize(skillNoun())} name`}
                                  placeholder={`${capitalize(skillNoun())} name`}
                                  aria-invalid={!!formError}
                                  aria-describedby={formError ? "h-new-form-error" : undefined}
                                  className="h-8 min-w-0 flex-1"
                                  data-h-new-name
                                />
                                <Button type="button" variant="default" size="sm" onClick={createFromForm} data-h-new-add>Add</Button>
                                <Button type="button" variant="ghost" size="sm" onClick={cancelForm} data-h-new-cancel>Cancel</Button>
                              </div>
                              {formError ? (
                                <p id="h-new-form-error" className="flex flex-wrap items-center gap-x-2 text-sm text-destructive" role="alert" data-h-new-error>
                                  {formError.text}
                                  {formError.twin && usable(formError.twin) && !onList.has(formError.twin.id) ? (
                                    <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={() => { toggle([formError.twin!.id], true, "library"); cancelForm() }} data-h-new-select-twin>Select it</Button>
                                  ) : null}
                                </p>
                              ) : null}
                            </li>
                          ) : null}
                          {freshShown.map((f) => (
                            <li key={f.id} className={`${ROW} border-[var(--border)]`} data-h-new-row={f.name}>
                              <Checkbox id={`h-new-${f.id}`} checked onCheckedChange={() => remove(f.id, true)} />
                              <Label htmlFor={`h-new-${f.id}`} className="min-w-0 flex-1 whitespace-normal font-normal [overflow-wrap:anywhere]">{f.name}</Label>
                              {/* The tint is never the only signal (critique 8): each row repeats the group's seedling glyph; the heading carries the words. */}
                              <i className={`${ICON} fa-seedling shrink-0`} aria-hidden="true" data-h-new-glyph />
                            </li>
                          ))}
                        </ul>
                      </section>
                    ) : null}
                    {drawn.groups.map((g) => group(g.name, g.rows, g.draw, "x"))}
                    {drawn.closeDraw.length ? (
                      <section className="flex flex-col gap-1.5" aria-labelledby="h-close-group" data-h-close-matches={close.length}>
                        {heading("fa-magnifying-glass", "Close matches in the library", drawn.closeVisible.length, "h-close-group")}
                        <ul className="flex flex-col overflow-hidden rounded-[var(--radius)] border border-border">{drawn.closeDraw.map((r) => libraryRow(r, "h-close-group"))}</ul>
                      </section>
                    ) : null}
                    {drawn.more > 0 ? (
                      // The rest of a long source, in order after what is drawn; focus moves to the first new row, so keyboard and screen-reader order carry on.
                      <Button type="button" variant="outline" size="default" className="w-full" data-h-show-more={drawn.more}
                        onClick={() => {
                          const from = limit
                          // Synchronously, so focus is placed before the panel's focus trap sees the button leave and refocuses the panel.
                          flushSync(() => setLimit((n) => n + ROW_STEP * 3))
                          const boxes = [...document.querySelectorAll<HTMLButtonElement>("[data-h-panel] [data-h-row] button[role=checkbox]")].slice(from)
                          focusFirst([boxes.find((b) => !b.disabled), "[data-h-show-more]", "[data-h-already]", "[data-h-search]"])
                        }}>
                        {drawn.more <= ROW_STEP * 3 ? `Show ${fmt(drawn.more)} more` : `Show ${fmt(ROW_STEP * 3)} more of ${fmt(drawn.more)}`}
                      </Button>
                    ) : null}
                    {q && !addable.length && !reveal ? (
                      // Only skills already on the list match: say so, and offer them right under it.
                      <div className="flex flex-col items-center" data-h-none>
                        <PanelEmpty icon="fa-magnifying-glass" title={alreadyIn ? `No ${skillNounPlural()} to add match "${typed}"` : `No ${skillNounPlural()} match "${typed}"`} className="flex flex-col items-center gap-3 pt-8 pb-2 text-center" />
                        {inListLink}
                      </div>
                    ) : null}
                    {q && sourceList && !shown.length ? <PanelEmpty icon="fa-magnifying-glass" title={`No ${skillNounPlural()} in ${sourceList.name} match "${typed}"`} data-h-none /> : null}
                    {q && !sourceList && !addable.length && showInList ? <div className="flex" data-h-hide-inlist>{inListLink}</div> : null}
                    {!q && !sourceList && shown.length > 0 && addable.length === 0 && !fresh.length && !showInList ? (
                      // D-ADD1117-e: an illustration and the fact, naming both lists; on a list source, the way to see them right under it.
                      <div className="flex flex-col items-center" data-h-all-in-wrap>
                        <PanelEmpty icon="fa-layer-group" marker="fa-check" title={allInSourceTitle(shown.length, null, list?.name ?? "this list")} className="flex flex-col items-center gap-3 pt-10 pb-2 text-center" data-h-all-in />
                      </div>
                    ) : null}
                    {!q && shown.length === 0 && !hidden && !fresh.length && !formOpen ? (
                      <PanelEmpty icon="fa-list-ul" title={sourceList ? `${sourceList.name} has no ${skillNounPlural()}` : `The library has no ${skillNounPlural()}`} data-h-source-empty />
                    ) : null}
                  </div>
                  {hidden ? <p className={`${TYPE.helper} mt-3`} data-h-hidden-note={hidden}>{`${countSkills(hidden)} ${hidden === 1 ? "is" : "are"} not listed because ${hidden === 1 ? "it has" : "they have"} no evaluation method yet.`}</p> : null}
                </FloatingSheetPanelBody>
              )}
            </>
          ) : (
            <FloatingSheetPanelBody className="flex flex-col gap-4 px-4 pt-3 pb-4" data-h-review>
              {/* Review (D-ADD1117-u, Decided): every listed skill is included; Select turns on boxes for bulk edits. The summary says the shared values once. */}
              <div className="flex flex-col gap-0.5" data-h-summary={summaryText}>
                <div className="flex items-baseline gap-2">
                  <p className={`${TYPE.card} min-w-0 [overflow-wrap:anywhere]`} data-h-summary-title>{summaryTitle}</p>
                  <span className="flex-1" aria-hidden="true" />
                  <Button type="button" variant="link" size="sm" className="h-auto shrink-0 p-0" aria-pressed={selecting} onClick={() => (selecting ? endSelecting() : startSelecting())} data-h-select-mode>{selecting ? "Done" : "Select"}</Button>
                </div>
                <p className={TYPE.helper} data-h-shared>{sharedLine}</p>
              </div>
              {selecting ? (
                <div className="flex min-h-8 items-center gap-3" data-h-review-head>
                  <Checkbox id="h-review-all" checked={reviewSel.size && reviewSel.size === rowsAll.length ? true : reviewSel.size ? "indeterminate" : false} onCheckedChange={() => { const all = reviewSel.size === rowsAll.length; for (const r of rowsAll) tick(r.id, !all) }} data-h-review-all />
                  <Label htmlFor="h-review-all" className={`${TYPE.helper} font-normal`}>{`Select all ${fmt(rowsAll.length)}`}</Label>
                </div>
              ) : null}
              <Accordion type="single" collapsible value={openRow ?? ""} onValueChange={(v) => setOpenRow(v || null)} className="flex flex-col gap-4" aria-label={`${skillNounPlural()} to add`}>
                {reviewGroups.map(([g, rows]) => (
                  <section key={g} className="flex flex-col" aria-labelledby={`h-group-${slug(g)}`} data-h-review-group={g}>
                    <div className="flex min-h-8 items-center gap-3 border-b border-border pb-1">
                      {selecting ? (() => {
                        const inG = rows.filter((x) => reviewSel.has(x.id)).length
                        return <Checkbox checked={inG === rows.length ? true : inG ? "indeterminate" : false} onCheckedChange={() => { const all = inG === rows.length; for (const x of rows) tick(x.id, !all) }} aria-label={`Select all ${countSkills(rows.length)} in ${g}`} data-h-group-select={g} />
                      })() : null}
                      <h3 id={`h-group-${slug(g)}`} className={TYPE.group}>{g}</h3>
                      <Badge variant="outline" className="tabular-nums" aria-label={`${countSkills(rows.length)}`}>{fmt(rows.length)}</Badge>
                    </div>
                    {rows.map((row) => {
                      const r = rowsAll.find((x) => x.id === row.id)!
                      const name = nameOf(r)
                      const err = nameError(r)
                      const values = valuesOf(r)
                      const facts = factsOf(r)
                      const tag = originTag(r)
                      const errId = `h-name-error-${r.id}`
                      const times = timesOf(r)
                      return (
                        <AccordionItem key={r.id} value={r.id} className="border-b border-border last:border-b-0" data-h-review-row-id={r.id} data-h-review-row={r.name} data-h-review-new={r.isNew || undefined} data-h-values={values}>
                          <div className="flex items-center gap-3">
                            {selecting ? <Checkbox checked={reviewSel.has(r.id)} onCheckedChange={(v) => tick(r.id, v === true)} aria-label={`Select ${name}`} data-h-review-select /> : null}
                            <div className="min-w-0 flex-1">
                              <AccordionTrigger className="min-h-11 items-center gap-3 py-2 text-start font-normal" data-h-row-toggle={r.id}>
                                <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2">
                                  <span className="min-w-0 [overflow-wrap:anywhere]">{name}</span>
                                  {/* Provenance, the minority only, by the name (D-ADD1117-u). */}
                                  {tag ? <span className={TYPE.meta} {...(tag === "New" ? { "data-h-new-tag": "" } : { "data-h-library-tag": "" })}>{tag}</span> : null}
                                </span>
                                <span className="flex shrink-0 items-center gap-2 text-muted-foreground">
                                  {err ? <StatusBadge label="Fix name" tone="warning" icon="fa-triangle-exclamation" size="sm" data-h-fix-name /> : null}
                                  {r.isNew && !programMethod ? <StatusBadge label="Not configured" tone="warning" icon="fa-triangle-exclamation" size="sm" data-h-not-configured /> : null}
                                  {replacing[r.id] ? <span className={TYPE.meta} data-h-replaces>{`Replaces library ${skillNoun()}`}</span> : null}
                                  {/* Only what differs from the summary, one form: "2 times", "Optional", "2 times · Optional". */}
                                  {!err && facts ? <span className={`${TYPE.meta} tabular-nums`} data-h-row-values>{facts}</span> : null}
                                </span>
                              </AccordionTrigger>
                            </div>
                          </div>
                          {/* The open row is light: an indent and a rule, no fill (D-ADD1117-u). */}
                          <AccordionContent className="mb-3 ms-1 flex flex-col gap-3 border-s-2 border-border ps-4 pt-1 text-foreground" data-h-row-editor={r.id}>
                            <div className={FIELD}>
                              <Label htmlFor={`h-row-name-${r.id}`} className={TYPE.label}>Name</Label>
                              <Input id={`h-row-name-${r.id}`} value={name} onChange={(e) => patch(r.id, { name: e.target.value })} aria-invalid={!!err} aria-describedby={err ? errId : undefined} data-h-row-name={r.id} data-h-name />
                              {err ? <p id={errId} className="text-sm text-destructive" role="alert" data-h-name-error>{err}</p> : null}
                            </div>
                            <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
                              <div className={`${FIELD} min-w-[10rem] flex-1`}>
                                <Label htmlFor={`h-row-category-${r.id}`} className={TYPE.label}>Category</Label>
                                <Select value={categoryOf(r) || NO_CATEGORY} onValueChange={(v) => { patch(r.id, { category: v === NO_CATEGORY ? "" : v }); requestAnimationFrame(() => document.querySelector<HTMLElement>(`#h-row-category-${CSS.escape(r.id)}`)?.focus()) }}>
                                  <SelectTrigger id={`h-row-category-${r.id}`} className="w-full" data-h-category><SelectValue /></SelectTrigger>
                                  <SelectContent className={ABOVE_PANEL_MENU}>
                                    <SelectItem value={NO_CATEGORY}>No category</SelectItem>
                                    {categoryChoices.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className={FIELD}>
                                <Label htmlFor={`h-row-times-${r.id}`} className={TYPE.label}>Times needed</Label>
                                {times !== null ? <TimesField id={`h-row-times-${r.id}`} value={times} onCommit={(n) => { if (n !== null) patch(r.id, { times: n }) }} className="h-10" data-h-times />
                                  : <span className="flex h-10 items-center text-sm text-muted-foreground">Not set</span>}
                              </div>
                              <div className="flex h-10 items-center gap-2">
                                <Checkbox id={`h-row-required-${r.id}`} checked={requiredOf(r)} onCheckedChange={(v) => patch(r.id, { required: v === true })} data-h-required />
                                <Label htmlFor={`h-row-required-${r.id}`} className="font-normal">Required</Label>
                              </div>
                            </div>
                            <div className="flex justify-end">
                              <Button type="button" variant="ghost" size="sm" onClick={() => remove(r.id, r.isNew)} aria-label={`Remove ${name} from this batch`} data-h-remove>Remove</Button>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )
                    })}
                  </section>
                ))}
              </Accordion>
            </FloatingSheetPanelBody>
          )}
          {/* The result of a selection action, said once, politely, right above where it was done (D-ADD1117-s, revised). */}
          {view === "review" && bulkNote ? (
            <div className="flex items-center gap-3 border-t border-border px-4 pt-2 text-sm" role="status" aria-live="polite" data-h-bulk-note>
              <i className="fa-light fa-circle-check text-muted-foreground" aria-hidden="true" />
              <span className="min-w-0 flex-1">{bulkNote.text}</span>
              {bulkNote.undo ? <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={bulkNote.undo} data-h-bulk-undo>Undo</Button> : null}
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Dismiss" onClick={() => setBulkNote(null)}><i className="fa-light fa-xmark" aria-hidden="true" /></Button>
            </div>
          ) : null}
          {view === "review" && selRows.length ? (
            <div className={`${bulkNote ? "" : "border-t border-border "}p-3`} data-h-bar={n}>
              <BulkSelectionBar
                // The DS count badge is the red notification "count"; BulkSelectionBar has no prop for it, so it is drawn neutral here, in the bar's own ink.
                className="[&_[data-slot=badge]]:border-current/45 [&_[data-slot=badge]]:bg-transparent [&_[data-slot=badge]]:text-current"
                selected={reviewSel}
                rows={selRows}
                onClear={endSelection}
                actionsSlot={() => (
                  <>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="outline" size={isMobile ? "icon-sm" : "sm"} aria-label={`Category for ${countSkills(n)}`} data-h-bar-category>
                          <i className="fa-light fa-folder-arrow-right" aria-hidden="true" />{isMobile ? null : "Category"}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="top" align="start" sideOffset={8} collisionPadding={16} className={`${ABOVE_PANEL_MENU} max-h-72 w-60 overflow-y-auto`} data-h-bar-category-menu>
                        <DropdownMenuLabel className={MENU_TITLE}>{`Move ${countSkills(n)} to`}</DropdownMenuLabel>
                        <DropdownMenuRadioGroup value={sharedCategory} onValueChange={moveTo}>
                          {[...categoryChoices, NO_CATEGORY].map((c) => <DropdownMenuRadioItem key={c} value={c} data-h-bar-category-option={c}>{c}</DropdownMenuRadioItem>)}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <BulkTimesPopover current={selRows.map((r) => timesOf(r))} onApply={setTimesFor} compact={isMobile} open={timesOpen} onOpenChange={setTimesOpen} />
                    {isMobile ? (
                      // A phone: Required and Remove fold into More, so the bar never scrolls an action out of sight.
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="outline" size="sm" aria-label={`More actions for ${countSkills(n)}`} data-h-bar-more>More</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="top" align="end" sideOffset={8} collisionPadding={16} className={`${ABOVE_PANEL_MENU} w-56`}>
                          <DropdownMenuLabel className={MENU_TITLE}>{`Set ${countSkills(n)} as`}</DropdownMenuLabel>
                          <DropdownMenuRadioGroup value={sharedRequired} onValueChange={setRequiredFor}>
                            <DropdownMenuRadioItem value="required">Required</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="optional">Optional</DropdownMenuRadioItem>
                          </DropdownMenuRadioGroup>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={removeMany} data-h-bar-more-remove><i className="fa-light fa-trash" aria-hidden="true" />{`Remove ${countSkills(n)}`}</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="outline" size="sm" aria-label={`Required or optional for ${countSkills(n)}`} data-h-bar-required>
                          Required
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="top" align="start" sideOffset={8} collisionPadding={16} className={`${ABOVE_PANEL_MENU} w-56`} data-h-bar-required-menu>
                        <DropdownMenuLabel className={MENU_TITLE}>{`Set ${countSkills(n)} as`}</DropdownMenuLabel>
                        <DropdownMenuRadioGroup value={sharedRequired} onValueChange={setRequiredFor}>
                          <DropdownMenuRadioItem value="required" data-h-bar-required-option="required">Required</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="optional" data-h-bar-required-option="optional">Optional</DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button type="button" variant="outline" size="icon-sm" aria-label={`Remove ${countSkills(n)} from this batch`} onClick={removeMany} data-h-bar-remove>
                          <i className="fa-light fa-trash" aria-hidden="true" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className={ABOVE_PANEL_MENU}>Remove</TooltipContent>
                    </Tooltip>
                      </>
                    )}
                  </>
                )}
              />
            </div>
          ) : (
          <FloatingSheetPanelFooter className="flex items-center justify-end gap-2">
            {view === "review" ? (
              <>
                {/* Own keys: step 1's dark primary must not morph into Back (its background would fade from dark). */}
                <Button key="back" type="button" variant="outline" size="sm" onClick={() => setStep("pick")} data-h-back><i className="fa-light fa-arrow-left" aria-hidden="true" />Back</Button>
                <Button key="add" type="button" variant="default" size="sm" disabled={total === 0} onClick={finish} data-h-add>{reviewPrimary}</Button>
              </>
            ) : (
              <>
                {/* Step 1's count on the left (D-ADD1117-d; lost with the tabs and restored), politely announced; the primary on the right. */}
                <span className="me-auto text-sm tabular-nums text-muted-foreground" role="status" aria-live="polite" data-h-footer-count>{`${fmt(tab === "import" && read ? shownTotal : total)} selected`}</span>
                <Button type="button" variant="default" size="sm" disabled={browseDisabled} onClick={() => (tab === "import" && read ? reviewImport() : goSelected())} data-h-review-open data-h-selected={tab === "import" && read ? shownTotal : total}>{browsePrimary}</Button>
              </>
            )}
          </FloatingSheetPanelFooter>
          )}
        </FloatingSheetPanelContent>
      </FloatingSheetPanel>
      <DiscardChangesDialog open={guard} onKeep={() => setGuard(false)} onDiscard={() => { setGuard(false); onOpenChange(false) }} body={`Your selection of ${countSkills(total)} will be cleared. Nothing has been added.`} />
    </>
  )
}
