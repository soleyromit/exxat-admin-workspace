"use client"

/**
 * The library as one DS DataTable, grouped by category (list template T1):
 * - The status tabs above it filter the rows (the table is given the rows of the selected tab), so the table has no
 *   status filter of its own (say it once).
 * - The toolbar is on the tab row (search, Filters, Columns, view), bound to the same table state, so tabs and toolbar read as
 *   one row. Column headers still sort; the DS filter bar is left out (tabs, grouping and search already narrow the list).
 * - Saved views are small: "By category" and "Plain list", plus any the coordinator saves; a view is a layout, never a filter.
 * - The bulk bar appears only on selection. A row opens the detail panel (the record goes in the URL as ?skill=).
 * - Lazy row rendering at 178 rows.
 */
import * as React from "react"
import { configureManyLabel, useConfigureMany } from "@/components/lab/library/configure-many"
import NextLink from "next/link"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { useLabLinkContext } from "@/components/lab/lab-bar/page-context"
import { rewriteLabUrl } from "@/lib/lab/links"
import { takeReturnSearch } from "@/lib/lab/configure-origin"
import { configureSkillHref } from "@/components/lab/configure/shell"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { FieldError } from "@exxatdesignux/ui/components/ui/field"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@exxatdesignux/ui/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { railTriggerProps } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import { useTableState } from "@exxatdesignux/ui/components/data-table/use-table-state"
import type { ColumnDef } from "@exxatdesignux/ui/components/data-table/types"
import { CONFIGURATION_META, NO_CATEGORY, SAVED_VIEWS, countLibrary, filterLibrary, isUsableRow, type LibraryCounts, type LibraryFilter, type LibraryRow, type LibraryTab, type SavedView } from "@/lib/lab/library"
import { capitalize, countSkills, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { plural } from "@/lib/v2/format"
import { EmptyBlock } from "@/components/lab/empty-block"
import { keepFocus, pageTitle, returnFocus, rowLink } from "@/components/lab/shared/focus"
import { ConfigurationBadge, LINK, LibraryStatusBadge, useUrlParam } from "./library-chrome"
import { CategoryName, TagBadges, tagLineText } from "./category-tag-pickers"
import { RowActions, type RowActionHandlers } from "./row-actions"
import { anyFilterOn, LibraryFilterChips, LibraryFilterMenu, NO_FILTER, useLibraryFilter } from "./library-filter"
import { TimesNeededCell } from "./times-needed"
import { BulkEditSheet } from "./bulk-edit-sheet"
import { BulkCount } from "@/components/lab/shared/bulk-count"
import { useV2State } from "@/lib/v2/react"
import { timesCellOf } from "@/lib/lab/program-settings"
import type { BulkEdit } from "./use-library"
import { afterPaint, useBesideWidth } from "./beside-panel"

/** The Configuration word is a link to the skill's full page (map D1c). A plain next/link, with the set-aware address worked out once at the table: a lab link subscribes to the URL, and 178 of them would render on every change to it. */
function ConfigurationCell({ row, hrefOf }: { row: LibraryRow; hrefOf: (id: string) => string }) {
  return (
    <NextLink
      href={hrefOf(row.id)}
      className="inline-flex min-h-6 items-center rounded-sm no-underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
      aria-label={`Configuration: ${CONFIGURATION_META[row.configuration].label}. Configure ${row.name}`}
      {...railTriggerProps()}
      onClick={(e) => e.stopPropagation()}
    >
      <ConfigurationBadge value={row.configuration} />
    </NextLink>
  )
}

/** A row's own address, for a new tab: the set and the program stay. A plain next/link: a lab link subscribes to the URL, and 178 of them would render on every change to it. */
function rowHref(id: string): string {
  const q = new URLSearchParams()
  const now = typeof window === "undefined" ? null : new URLSearchParams(window.location.search)
  for (const k of ["set", "program"]) { const v = now?.get(k); if (v) q.set(k, v) }
  q.set("skill", id)
  return `?${q.toString()}`
}

/** From a selected row, one Tab to here and Enter reaches the selection bar, which otherwise sits behind every remaining row's stops (map D1). Shown on focus. */
function SkipToBar() {
  return (
    <Button
      type="button"
      variant="outline"
      size="xs"
      className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:z-30"
      data-skip-to-bar
      onClick={(e) => { e.stopPropagation(); document.querySelector<HTMLElement>("[data-exxat-bulk-bar] button:not(:disabled), [data-exxat-bulk-bar] a[href]")?.focus() }}
    >
      Go to selection actions
    </Button>
  )
}

export function libraryColumns(handlers: RowActionHandlers, onOpen: (id: string) => void, configureHrefOf: (id: string) => string): ColumnDef<LibraryRow>[] {
  return [
    // The DS select column (the DS convention, as in the DS starter's library table): without it `selectable` draws a
    // group checkbox but no row checkboxes, and the group checkbox has no column slot to sit in, so it lands on the
    // table's edge. With it, group and row checkboxes share one 40px leading column and the group label starts on the
    // first column's text axis.
    { key: "select", label: "", width: 40, minWidth: 40, defaultPin: "left", lockPin: true, resizable: false },
    {
      key: "name",
      label: capitalize(skillNoun()),
      width: 230,
      minWidth: 220,
      sortable: true, sortKey: "name",
      // At most two lines (name, then one quiet line), and every row holds the two-line height, so rows are one height
      // whatever they carry and the content sits centred in it.
      cell: (r, ctx) => (
        <span className="flex min-h-10 min-w-0 flex-col justify-center gap-0.5" data-row-inactive={r.status === "inactive" || undefined}>
          {ctx?.selected ? <SkipToBar /> : null}
          <span className="flex min-w-0 items-center gap-2">
            {/* The name opens the detail panel; the href carries the record so it also works as a link. A long name wraps to two lines, and its title holds the rest. */}
            <NextLink
              className={`${LINK} line-clamp-2 whitespace-normal [overflow-wrap:anywhere]`}
              href={rowHref(r.id)}
              scroll={false}
              title={r.name.length > 40 ? r.name : undefined}
              data-skill-link={r.id}
              {...railTriggerProps()}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpen(r.id) }}
            >
              {r.name}
            </NextLink>
            {r.isNew ? <Badge variant="outline">New</Badge> : r.justUpdated ? <Badge variant="outline">Updated</Badge> : null}
          </span>
          {/* One quiet line under the name: the description, then the tags (02 section 7), so tags show in every view without a wide extra column and the row never grows to a third line.
              The source list's second heading (`group`) does not show here: a skill has one category (glossary), and that word beside the Category column read as a second one (Nasogastric tube care: NG TUBE, Nutrition). */}
          {r.description || r.tags.length ? (
            <span className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
              {r.description ? <span className="min-w-0 flex-1 truncate" title={r.description} data-row-description>{r.description}</span> : null}
              {r.tags.length ? (
                <span className={`flex min-w-0 items-center gap-1 ${r.description ? "max-w-[50%]" : ""}`} title={tagLineText(r.tags, r.inactiveTags)} data-row-tags><i className="fa-light fa-tag shrink-0" aria-hidden="true" /><span className="sr-only">Tags: </span><span className="min-w-0 truncate">{tagLineText(r.tags, r.inactiveTags)}</span></span>
              ) : null}
            </span>
          ) : null}
        </span>
      ),
    },
    // Times needed [CALL 11-02]: the program's number on every row, edited in place; one source with Evaluation settings.
    // Beside the name so the row being edited stays in view at 1024 (the name column is not pinned).
    { key: "times", label: "Times needed", width: 120, sortable: true, sortKey: "times", cell: (r) => <TimesNeededCell id={r.id} name={r.name} /> },
    // No column filter: the tabs filter by status, search finds a name and the one Filter control (category, tag; REQ SL-10)
    // sits on the tab row, so a DS filter bar would be another way to narrow the same list (list toolbar budget, rule L3).
    { key: "section", label: "Category", width: 200, sortable: true, sortKey: "section", cell: (r) => <CategoryName name={r.categoryName ?? r.section} inactive={r.categoryInactive} /> },
    // Plain Default, a badge only for the exceptions (D-L97). The word opens the panel on Evaluation, where the word is decided; the rest of the row opens it on Details.
    { key: "configuration", label: "Configuration", width: 150, sortable: true, sortKey: "configuration", cell: (r) => <ConfigurationCell row={r} hrefOf={configureHrefOf} /> },
    { key: "status", label: "Status", width: 120, sortable: true, sortKey: "status", cell: (r) => <LibraryStatusBadge status={r.status} /> },
    { key: "modelLabel", label: "How it's judged", width: 180, sortable: true, cell: (r) => (r.modelLabel ? <span className="block whitespace-normal" data-model-label>{r.modelLabel}</span> : <span className="text-muted-foreground">Not chosen</span>) },
    {
      key: "courses",
      label: "Courses",
      width: 110,
      sortable: true,
      cell: (r) =>
        !isUsableRow(r) ? <span className="text-muted-foreground">None</span>
          : r.courses === 0 ? <span className="text-muted-foreground">Not mapped</span>
            : <span className="tabular-nums">{plural(r.courses, "course", "courses")}</span>,
    },
    // No Evaluations column (Sankalp 2026-11-04 via Romit, D-L45): the count stays where it acts, in the row menu's Delete reason and
    // the skill panel.
    {
      key: "tags",
      label: "Tags",
      width: 200,
      cell: (r) => (r.tags.length ? <TagBadges tags={r.tags} inactive={r.inactiveTags} /> : <span className="text-muted-foreground">None</span>),
    },
    { key: "source", label: "Came from", width: 160, sortable: true },
    { key: "actions", label: "Actions", width: 64, resizable: false, defaultPin: "right", lockPin: true, header: () => <span className="sr-only">Actions</span>, cell: (r) => <RowActions row={r} handlers={handlers} /> },
  ]
}

const VIEWS_KEY = "lab-skills-library:views:v2"
/** The view chosen and the columns set, for the next visit (map D1). */
const CHOICE_KEY = "lab-skills-library:view-choice"

function loadChoice(): { viewId?: string; hidden?: string[] } {
  try { return JSON.parse(window.localStorage.getItem(CHOICE_KEY) ?? "{}") as { viewId?: string; hidden?: string[] } } catch { return {} }
}
function saveChoice(viewId: string, hidden: readonly string[]) {
  try { window.localStorage.setItem(CHOICE_KEY, JSON.stringify({ viewId, hidden })) } catch { /* private window: the choice lasts this page */ }
}

/** The columns the admin can turn on and off (map D1). The name, the select box and the row menu stay; How it's judged and Courses are not library columns (map D1, D-L65). */
/** A layer above the table that Esc belongs to (see `escIsForLayer`). */
const LAYER_OVER_TABLE = ['[role=dialog]', '[role=alertdialog]', '[role=menu]', '[role=listbox]'].map((r) => `${r}:not([data-state=closed])`).join(", ")

const COLUMN_CHOICES: Array<{ key: string; label: string }> = [
  { key: "times", label: "Times needed" },
  { key: "section", label: "Category" },
  { key: "configuration", label: "Configuration" },
  { key: "status", label: "Status" },
  { key: "tags", label: "Tags" },
  { key: "source", label: "Came from" },
]

/**
 * The group a row just added sits in, until the next add or a reload. The DS sorts groups by name, and a leading space sorts first and does not
 * show, so these rows open the table whatever their category. The Category column still reads their real one (`categoryName`).
 */
const JUST_ADDED_GROUP = " Just added"
const JUST_UPDATED_GROUP = " Just updated"

function loadCustomViews(): SavedView[] {
  try {
    const raw = window.localStorage.getItem(VIEWS_KEY)
    return raw ? (JSON.parse(raw) as SavedView[]) : []
  } catch {
    return []
  }
}

export interface LibraryTableProps {
  /** All library rows (for filter options). */
  rows: LibraryRow[]
  /** The rows of the selected status tab. */
  visible: LibraryRow[]
  tab: LibraryTab
  handlers: RowActionHandlers
  openId: string | null
  onOpen: (id: string) => void
  /** Edit N skills (map D1b). */
  onBulkEdit: (ids: string[], edit: BulkEdit) => void
  onClearTab: () => void
  /** Renders the tab row with this table's toolbar on its right. `counts`: what the tabs show, after the filters and the search, so a tab's number equals the rows under it. */
  renderFrame: (toolbar: React.ReactNode, table: React.ReactNode, counts: LibraryCounts) => React.ReactNode
  /** Called with the rows in view, in order (Previous and Next in the detail panel). */
  onRowsInView?: (rows: LibraryRow[]) => void
  /** Skills the last add put in or replaced: shown first and brought into view (map D2). */
  justAdded?: readonly string[]
  /** Of those, the ones replaced in place: they read Updated (map D2). */
  justReplaced?: readonly string[]
}

/** The row's own markers, set on the DOM: see `useOpenRow`. */
function markOpenRow(row: Element | null) {
  for (const el of document.querySelectorAll("[data-library-table] tr[data-open]")) {
    if (el === row) continue
    el.removeAttribute("data-open")
    el.removeAttribute("aria-current")
  }
  if (row) { row.setAttribute("data-open", "true"); row.setAttribute("aria-current", "true") }
}

/**
 * The open row: its marker and its place on screen. The DS draws the marker from `data-open` and `aria-current` on the row, and its `openRowId` prop sets them by rendering the whole table:
 * 178 rows in one go, about 0.8 s on the dev server and 8 to 10 frames at best, with the panel's opening or closing waiting behind it (the designer's "I cannot close the panel"). So the table is
 * given a constant, which still means "rows open a rail", and the two attributes are set here on the DOM. React leaves them alone, since it never rendered them.
 */
function useOpenRow(openId: string | null, inView: readonly LibraryRow[]) {
  const scrolledFor = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (!openId) { markOpenRow(null); scrolledFor.current = null; return }
    let tries = 0
    // Rows render in chunks, so a row far down may take a moment to exist.
    const place = () => {
      const row = rowLink(openId)?.closest("tr") ?? null
      tries += 1
      markOpenRow(row)
      if (row && scrolledFor.current !== openId) { scrolledFor.current = openId; bringRowIntoView(row) }
      return !!row || tries > 40
    }
    if (place()) return
    const timer = window.setInterval(() => { if (place()) window.clearInterval(timer) }, 50)
    return () => window.clearInterval(timer)
  }, [openId, inView])
}

const NO_OPEN_ROW = null

/** `value`, once the frame of the press has painted: the column that steps aside beside the panel renders every row, and the panel's slide must not wait for that. */
function useAfterFirstFrame(value: boolean): boolean {
  const [settled, setSettled] = React.useState(value)
  React.useEffect(() => {
    if (settled === value) return
    return afterPaint(() => React.startTransition(() => setSettled(value)))
  }, [value, settled])
  return settled
}

/** Wide enough for the Category column beside the edit panel, with the Skills nav open: its 200 on top of the columns that must show. */
const ROOM_FOR_CATEGORY = "(min-width: 1880px)"
/** Where the list's rows start showing: under the scrollport's top and the table's fixed head with its group row. */
function stickyBottom(): number {
  const top = document.querySelector("[data-page-scroll]")?.getBoundingClientRect().top ?? 0
  const head = [...document.querySelectorAll<HTMLElement>('div[style*="position: fixed"]')].find((el) => el.querySelector("th"))
  return Math.max(top, head?.getBoundingClientRect().bottom ?? 0)
}

/** A row clipped by the head, or below the fold, comes to the middle of the list. */
function bringRowIntoView(row: Element) {
  const r = row.getBoundingClientRect()
  if (r.top < stickyBottom() + 4 || r.bottom > window.innerHeight - 8) row.scrollIntoView({ block: "center" })
}

const useRoomForCategory = (): boolean => React.useSyncExternalStore(
  (cb) => { const m = window.matchMedia(ROOM_FOR_CATEGORY); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb) },
  () => window.matchMedia(ROOM_FOR_CATEGORY).matches,
  () => true,
)

type TableBodyProps = Omit<LibraryTableProps, "openId"> & {
  panelOpen: boolean
  filter: LibraryFilter
  setFilter: (f: Partial<LibraryFilter>, how?: { push?: boolean }) => void
  carried: string | null
  setCarried: (v: string | null) => void
}

/**
 * Everything that reads the URL or the open record stays out here, so the rows do not render when the panel opens or closes, when its form turns dirty, or when the router takes a new URL. Only
 * what the table is really showing reaches `TableBody`.
 */
export function LibraryTable({ openId, onRowsInView, ...rest }: LibraryTableProps) {
  const [filter, setFilter] = useLibraryFilter()
  const [carried, setCarried] = useUrlParam("selected")
  const [inView, setInView] = React.useState<LibraryRow[]>([])
  const report = React.useCallback((r: LibraryRow[]) => { setInView(r); onRowsInView?.(r) }, [onRowsInView])
  useOpenRow(openId, inView)
  const panelOpen = useAfterFirstFrame(!!openId)
  return <TableBody {...rest} onRowsInView={report} panelOpen={panelOpen} filter={filter} setFilter={setFilter} carried={carried} setCarried={setCarried} />
}

/** Where focus goes when Edit N's panel closes: the bar's Edit button, or with the bar gone, the page title (never the body). */
function focusAfterBulkPanel() {
  // After Radix's own return of focus, which aims at whatever was focused before the panel.
  window.setTimeout(() => {
    const target = document.querySelector<HTMLElement>("[data-bulk-edit-trigger]") ?? pageTitle()
    if (target) target.focus({ preventScroll: true })
    else returnFocus(null)
  }, 30)
}

const TableBody = React.memo(function TableBody({ rows, visible, tab, handlers, onOpen, onBulkEdit, onClearTab, renderFrame, onRowsInView, justAdded, justReplaced, panelOpen, filter, setFilter, carried, setCarried }: TableBodyProps) {
  const linkContext = React.useRef(useLabLinkContext())
  linkContext.current = useLabLinkContext()
  const configureHrefOf = React.useCallback((id: string) => rewriteLabUrl(configureSkillHref(id), linkContext.current), [])
  const columns = React.useMemo(() => libraryColumns(handlers, onOpen, configureHrefOf), [handlers, onOpen, configureHrefOf])
  const v2 = useV2State()
  // Each row carries its times needed so the column sorts like the others (null sorts as "Not set"). What was just added comes first in a plain list too; grouped, its group sorts first.
  const decorate = React.useMemo(() => {
    const just = new Set(justAdded ?? [])
    const updated = new Set(justReplaced ?? [])
    return (list: readonly LibraryRow[]) => {
      const out = list.map((r) => ({
        ...r,
        times: timesCellOf(v2, r.id).value,
        ...(updated.has(r.id) ? { isNew: false, justUpdated: true, categoryName: r.section, section: JUST_UPDATED_GROUP } : just.has(r.id) ? { categoryName: r.section, section: JUST_ADDED_GROUP } : {}),
      }))
      return just.size ? [...out.filter((r) => just.has(r.id)), ...out.filter((r) => !just.has(r.id))] : out
    }
  }, [v2, justAdded, justReplaced])
  // Show them: everything that add touched, what it replaced too (the batch holds both). The other filters read the row.
  const filtered = React.useCallback((list: readonly LibraryRow[]) => {
    const batch = filter.added ? v2.batches.find((b) => b.id === filter.added) : null
    if (!batch) return filterLibrary(list, filter)
    const held = new Set(batch.skillIds)
    return filterLibrary(list, { ...filter, added: null }).filter((r) => held.has(r.id))
  }, [v2.batches, filter])
  const data = React.useMemo(() => decorate(filtered(visible)), [decorate, visible, filtered])
  const ts = useTableState<LibraryRow>(data, columns)
  // Back from a configure page: the search the admin left (map D1c).
  const setTableSearch = ts.setSearch
  React.useEffect(() => { const s = takeReturnSearch(); if (s) setTableSearch(s) }, [setTableSearch])
  // The tabs follow the search as they follow the filters (map D1 Find): "No skills match" never sits beside All 178. The same words the table's own search looks in: every value of the row.
  const searched = React.useDeferredValue(ts.search)
  const counts = React.useMemo(() => {
    const needle = searched.trim().toLowerCase()
    const all = decorate(filtered(rows))
    return countLibrary(needle ? all.filter((r) => Object.values(r).some((v) => v != null && String(v).toLowerCase().includes(needle))) : all)
  }, [decorate, rows, filtered, searched])
  const [viewId, setViewId] = React.useState(SAVED_VIEWS[0]!.id)
  const [custom, setCustom] = React.useState<SavedView[]>([])
  const [naming, setNaming] = React.useState(false)
  const [viewName, setViewName] = React.useState("")
  const [nameTried, setNameTried] = React.useState(false)
  React.useEffect(() => setCustom(loadCustomViews()), [])
  const views = [...SAVED_VIEWS, ...custom]

  const applyView = React.useCallback((v: SavedView) => {
    ts.setGroupBy(v.groupBy)
    ts.setHiddenCols(new Set(v.hiddenColumns))
    setViewId(v.id)
  }, [ts])

  // First paint: the view chosen last time, or grouped by category with the quiet columns hidden.
  const applied = React.useRef(false)
  React.useEffect(() => {
    if (applied.current) return
    applied.current = true
    const saved = loadChoice()
    const view = [...SAVED_VIEWS, ...loadCustomViews()].find((v) => v.id === saved.viewId) ?? SAVED_VIEWS[0]!
    applyView(view)
    if (saved.hidden) ts.setHiddenCols(new Set(saved.hidden))
  }, [applyView]) // eslint-disable-line react-hooks/exhaustive-deps

  // A program with no categories anywhere: a plain list, with no group row and no Category column (map D1, B16).
  const noCategories = rows.length > 0 && rows.every((r) => r.section === NO_CATEGORY)
  const categoryOff = React.useRef(false)
  React.useEffect(() => {
    if (noCategories && !categoryOff.current) {
      categoryOff.current = true
      ts.setGroupBy(null)
      ts.setHiddenCols((now) => new Set([...now, "section"]))
    } else if (!noCategories && categoryOff.current) {
      categoryOff.current = false
      const view = views.find((v) => v.id === viewId) ?? SAVED_VIEWS[0]!
      ts.setGroupBy(view.groupBy)
      ts.setHiddenCols((now) => { const next = new Set(now); if (!view.hiddenColumns.includes("section")) next.delete("section"); return next })
    }
  })

  // Beside the edit panel the list is narrow (beside-panel.ts). Grouped by category, the group bar already says the Category column's word, so it steps aside while the panel
  // is open and Configuration and Status stay in view; in Plain list it steps aside only where there is no room for it [INFER]. Not part of a saved view.
  const besideWidth = useBesideWidth()
  const roomForCategory = useRoomForCategory()
  const hideCategory = panelOpen && besideWidth && (ts.groupBy === "section" || !roomForCategory)
  const categoryAside = React.useRef(false)
  // After every render, and as a change to what is hidden now, not to what this render read: on a reload with the panel open this runs in the same pass as the first view, whose
  // columns a copy of the render's set would overwrite. Choosing a view again is covered by the same line.
  React.useEffect(() => {
    if (hideCategory && !ts.hiddenCols.has("section")) {
      categoryAside.current = true
      ts.setHiddenCols((now) => new Set([...now, "section"]))
    } else if (!hideCategory && categoryAside.current) {
      categoryAside.current = false
      ts.setHiddenCols((now) => { const next = new Set(now); next.delete("section"); return next })
    }
  })

  // A selection stays until an action is confirmed or it is cleared (map D1), across tabs, search and filters; the bar says how many of it are not shown. Only a skill that is gone leaves it.
  const { selected: selectedNow } = ts
  React.useEffect(() => {
    if (!selectedNow.size) return
    const known = new Set<string | number>(rows.map((r) => r.id))
    if ([...selectedNow].some((id) => !known.has(id))) ts.setSelected(new Set([...selectedNow].filter((id) => known.has(id))))
  }, [rows, selectedNow]) // eslint-disable-line react-hooks/exhaustive-deps

  // The clear button goes with the bar: focus moves to the first of the rows it held, when that is on screen, and never to the body.
  const heldSelection = React.useRef<Array<string | number>>([])
  React.useEffect(() => {
    if (!selectedNow.size && heldSelection.current.length) keepFocus(String(heldSelection.current[0]))
    heldSelection.current = [...selectedNow]
  }, [selectedNow])

  // Cancel on Configure N lands here with the selection kept (map D4). Read once and taken off the URL, as ?section= is.
  React.useEffect(() => {
    if (!carried) return
    ts.setSelected(new Set(carried.split(",").map(decodeURIComponent)))
    setCarried(null)
  }, [carried]) // eslint-disable-line react-hooks/exhaustive-deps

  // The order on screen: by group when the view is grouped, so Previous and Next in the panel walk the rows as they read.
  const inView = React.useMemo(() => ts.groupedRows.flatMap((g) => g.rows) as LibraryRow[], [ts.groupedRows])
  React.useEffect(() => { onRowsInView?.(inView) }, [inView, onRowsInView])
  // What was just added stays in view: nothing the admin had narrowed to may hide it. Show them, later, narrows again on purpose.
  React.useEffect(() => {
    const first = justAdded?.[0]
    if (!first) return
    if (ts.search) ts.setSearch("")
    if (anyFilterOn(filter)) setFilter(NO_FILTER)
    if (tab !== "all") window.setTimeout(onClearTab, 0)
    let tries = 0
    const timer = window.setInterval(() => {
      const row = rowLink(first)?.closest("tr")
      tries += 1
      if (row) bringRowIntoView(row)
      if (row || tries > 40) window.clearInterval(timer)
    }, 50)
    return () => window.clearInterval(timer)
  }, [justAdded]) // eslint-disable-line react-hooks/exhaustive-deps

  const nameProblem = (() => {
    const label = viewName.trim()
    if (!label) return "Enter a name for this view."
    if (views.some((v) => v.label.toLowerCase() === label.toLowerCase())) return "A view with this name already exists."
    return null
  })()
  const nameError = nameTried ? nameProblem : null

  const saveView = () => {
    setNameTried(true)
    if (nameProblem) return
    const label = viewName.trim()
    const v: SavedView = { id: `custom-${Date.now().toString(36)}`, label, status: [], groupBy: ts.groupBy, hiddenColumns: [...ts.hiddenCols].filter((k) => !(k === "section" && categoryAside.current)) }
    const next = [...custom, v]
    setCustom(next)
    try { window.localStorage.setItem(VIEWS_KEY, JSON.stringify(next)) } catch { /* private window: keep in memory */ }
    setViewId(v.id)
    setNaming(false)
    setViewName("")
    setNameTried(false)
  }

  const configureMany = useConfigureMany()
  const [editing, setEditing] = React.useState<LibraryRow[] | null>(null)
  const bulk = (selected: Set<string | number>) => {
    const picked = rows.filter((r) => selected.has(r.id))
    const active = picked.filter((r) => r.status !== "inactive")
    const label = configureManyLabel(active.length)
    const shownNow = new Set(inView.map((r) => r.id))
    const notShown = picked.filter((r) => !shownNow.has(r.id)).length
    const inactiveIds = picked.filter((r) => r.status === "inactive").map((r) => r.id)
    return (
      <span className="flex flex-wrap items-center gap-2" data-bulk-actions>
        {/* The same mark as BulkCount, so the DS bar's own chip stays hidden (app/globals.css). */}
        {notShown ? <span className="shrink-0 whitespace-nowrap pe-2 text-sm font-medium tabular-nums" data-bulk-selected data-bulk-not-shown={notShown}>{`${picked.length.toLocaleString("en-US")} selected, ${notShown.toLocaleString("en-US")} not shown`}</span> : <BulkCount n={picked.length} />}
        {/* Actions appear only when they can act (map D1): inactive rows alone leave the count and clear. */}
        {active.length ? (
          <>
            {/* Configured and not configured alike (D-L48). One row goes to that skill's full page (map D1c), two or more to the bulk page (D4). */}
            <Button asChild variant="outline" size="sm">
              <Link href={configureMany(active.map((r) => r.id), inactiveIds).href}>{label}</Link>
            </Button>
            {/* Times needed moved in here, and Copy settings into Configure's Start from (map D1, D1b). Inactive rows are left out and the panel names them. */}
            <Button type="button" variant="outline" size="sm" data-bulk-edit-trigger onClick={() => setEditing(picked)}>{`Edit ${countSkills(active.length)}`}</Button>
            {/* The selection stays until the dialog is confirmed: Keep active and Esc leave it as it was. */}
            <Button type="button" variant="outline" size="sm" onClick={() => handlers.onDeactivate(active, () => ts.setSelected(new Set()))}>{`Deactivate ${active.length.toLocaleString("en-US")}`}</Button>
          </>
        ) : (
          <span className="text-sm text-muted-foreground" data-bulk-why>{`Inactive ${skillNounPlural()} have no bulk actions. Open one to turn it back on.`}</span>
        )}
        {active.length && inactiveIds.length ? <span className="text-sm text-muted-foreground" data-bulk-why>{`${inactiveIds.length.toLocaleString("en-US")} inactive left out`}</span> : null}
      </span>
    )
  }

  // Esc is for the top layer: a panel, a dialog or a menu. The DS table also clears the selection on any Esc, in a listener no prop reaches, and the X on the same panel keeps it (rule E6).
  // So the Esc that arrives while such a layer is open does not clear. It is read first, in the capture phase, since the layer has often closed by the time the table hears the key.
  const escIsForLayer = React.useRef(false)
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      escIsForLayer.current = !!document.querySelector(LAYER_OVER_TABLE)
      window.setTimeout(() => { escIsForLayer.current = false }, 0)
    }
    window.addEventListener("keydown", onKey, true)
    return () => window.removeEventListener("keydown", onKey, true)
  }, [])
  React.useEffect(() => {
    document.documentElement.setAttribute("data-library-page", "")
    return () => document.documentElement.removeAttribute("data-library-page")
  }, [])
  const { setSelected } = ts
  const tableState = {
    ...ts,
    setSelected: ((next) => { if (!escIsForLayer.current) setSelected(next) }) as typeof setSelected,
    // The header box acts on the rows on screen. The DS replaces the whole set, which would drop what is selected and not shown.
    toggleAll: (ids: Array<string | number>) => ts.setRowsSelected(ids, !ids.every((id) => selectedNow.has(id))),
  }

  const chooseView = (id: string) => {
    const v = views.find((x) => x.id === id)
    if (!v) return
    applyView(v)
    saveChoice(v.id, v.hiddenColumns)
  }
  const toggleColumn = (key: string) => {
    const next = new Set([...ts.hiddenCols].filter((k) => !(k === "section" && (categoryAside.current || categoryOff.current))))
    if (next.has(key)) next.delete(key)
    else next.add(key)
    ts.setHiddenCols((now) => { const out = new Set(now); if (out.has(key)) out.delete(key); else out.add(key); return out })
    saveChoice(viewId, [...next])
  }
  const columnsMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="sm" data-library-columns>
          Columns
          <i className="fa-light fa-chevron-down text-xs" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {COLUMN_CHOICES.filter((c) => c.key !== "section" || !noCategories).map((c) => (
          <DropdownMenuCheckboxItem
            key={c.key}
            // Beside the panel the Category column has stepped aside for now, which is not the admin's choice to change.
            disabled={c.key === "section" && categoryAside.current}
            checked={!ts.hiddenCols.has(c.key) || (c.key === "section" && categoryAside.current)}
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={() => toggleColumn(c.key)}
          >
            {c.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const current = views.find((v) => v.id === viewId)
  const viewMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="sm" aria-label={`View: ${current?.label ?? "By category"}`}>
          {current?.label ?? "View"}
          <i className="fa-light fa-chevron-down text-xs" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Views</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={viewId} onValueChange={chooseView}>
          {views.map((v) => <DropdownMenuRadioItem key={v.id} value={v.id}>{v.label}</DropdownMenuRadioItem>)}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setNaming(true)}>Save this view</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const toolbar = (
    <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap" data-library-toolbar>
      <Input type="search" value={ts.search} onChange={(e) => ts.setSearch(e.target.value)} placeholder={`Search ${skillNounPlural()}`} aria-label={`Search ${skillNoun()} names`} className="h-8 w-full sm:w-56" />
      <LibraryFilterMenu rows={rows} value={filter} onChange={setFilter} />
      {columnsMenu}
      {/* With no categories there is one way to read the list, so there is nothing to choose (map D1, B16). A view the admin saved still comes from the menu once a category exists. */}
      {noCategories ? null : viewMenu}
    </div>
  )

  const filtersOn = ts.search.trim() !== "" || ts.activeFilters.some((f) => f.values.length > 0) || anyFilterOn(filter)
  const table = (
    <div role="region" aria-label={`${capitalize(skillNoun())} library, ${countSkills(inView.length)}`} data-library-table className={`${ts.hiddenCols.has("tags") ? "" : "[&_[data-row-tags]]:hidden "}[&_tr:has([data-row-inactive])]:text-muted-foreground [&_tr:has([data-row-inactive])_a]:text-muted-foreground [&_[data-exxat-bulk-bar]_.w-max]:w-auto [&_[data-exxat-bulk-bar]_.w-max]:flex-wrap`}>
      {/* The DS column menus offer Pin, Wrap, Group and Conditional Rule, which this page does not ask for, and it has no prop to leave items out, only to drop Pin. The header sorts by itself and Columns is on the toolbar, so the menu's button goes, on this page alone. The floating header is portalled, hence a mark on the root rather than a selector under the table. */}
      <style>{`[data-library-page] button[aria-label$=" column options"]{display:none}`}</style>
      <DataTable<LibraryRow>
        data={data}
        columns={columns}
        state={tableState}
        getRowId={(r) => r.id}
        getRowSelectionLabel={(r) => `Select ${r.name}`}
        selectable
        searchable={false}
        groupable
        showQueryControls={false}
        edgeInset={false}
        onRowClick={(r) => onOpen(r.id)}
        // A constant: "rows open a rail". Which row is open is set on the DOM (`useOpenRow`), so the table does not render for it.
        openRowId={NO_OPEN_ROW}
        bulkActionsSlot={(selected) => bulk(selected)}
        lazyLoading={{ enabled: true, threshold: 80, chunkSize: 40, loadingLabel: "Loading more" }}
        emptyState={
          filtersOn ? (
            <EmptyBlock compact title={`No ${skillNounPlural()} match`} action={{ label: "Clear" }} onAction={() => { ts.setActiveFilters([]); ts.setSearch(""); setFilter(NO_FILTER) }} />
          ) : (
            <EmptyBlock compact title={`No ${skillNounPlural()} in this tab`} action={{ label: "Show all" }} onAction={onClearTab} />
          )
        }
      />
    </div>
  )

  return (
    <>
      {renderFrame(toolbar, <div className="flex flex-col gap-3"><LibraryFilterChips value={filter} onChange={setFilter} />{table}</div>, counts)}
      <BulkEditSheet rows={editing} onClose={() => { setEditing(null); focusAfterBulkPanel() }} onApply={(ids, edit) => { onBulkEdit(ids, edit); ts.setSelected(new Set()); setEditing(null); focusAfterBulkPanel() }} />
      <Dialog open={naming} onOpenChange={(open) => { setNaming(open); if (!open) setNameTried(false) }}>
        <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Save this view</DialogTitle>
          </DialogHeader>
          <form className="flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); saveView() }}>
            <Label htmlFor="view-name">Name</Label>
            <Input id="view-name" autoFocus value={viewName} onChange={(e) => setViewName(e.target.value)} maxLength={40} aria-invalid={nameError ? true : undefined} aria-describedby={nameError ? "view-name-error" : undefined} />
            {nameError ? <FieldError id="view-name-error">{nameError}</FieldError> : null}
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setNaming(false)}>Cancel</Button>
            <Button type="button" variant="default" size="sm" onClick={saveView}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
})
