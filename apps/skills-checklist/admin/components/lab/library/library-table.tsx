"use client"

/**
 * The library as one DS DataTable, grouped by category (list template T1):
 * - The status tabs above it filter the rows (the table is given the rows of the selected tab), so the table has no
 *   status filter of its own (say it once).
 * - The toolbar is two controls on the tab row (search, view), bound to the same table state, so tabs and toolbar read as
 *   one row. Column headers still sort; the DS filter bar is left out (tabs, grouping and search already narrow the list).
 * - Saved views are small: "By category" and "One list", plus any the coordinator saves; a view is a layout, never a filter.
 * - The bulk bar appears only on selection. A row opens the detail panel (the record goes in the URL as ?skill=).
 * - Lazy row rendering at 178 rows.
 */
import * as React from "react"
import { useConfigureMany } from "@/components/lab/library/configure-many"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { FieldError } from "@exxatdesignux/ui/components/ui/field"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@exxatdesignux/ui/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { railTriggerProps } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import { useTableState } from "@exxatdesignux/ui/components/data-table/use-table-state"
import type { ColumnDef } from "@exxatdesignux/ui/components/data-table/types"
import { SAVED_VIEWS, type LibraryRow, type LibraryTab, type SavedView } from "@/lib/lab/library"
import { capitalize, countSkills, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { fmt, plural } from "@/lib/v2/format"
import { EmptyBlock } from "@/components/lab/empty-block"
import { LINK, LibraryStatusBadge } from "./library-chrome"
import { RowActions, type RowActionHandlers } from "./row-actions"

export function libraryColumns(handlers: RowActionHandlers, onOpen: (id: string) => void): ColumnDef<LibraryRow>[] {
  return [
    {
      key: "name",
      label: capitalize(skillNoun()),
      width: 360,
      minWidth: 240,
      sortable: true,
      cell: (r) => (
        <span className="flex min-w-0 flex-col py-0.5">
          <span className="flex items-center gap-2">
            {/* The name opens the detail panel; the href carries the record so it also works as a link. */}
            <Link
              className={`${LINK} truncate`}
              href={`?skill=${encodeURIComponent(r.id)}`}
              scroll={false}
              {...railTriggerProps()}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpen(r.id) }}
            >
              {r.name}
            </Link>
            {r.isNew ? <Badge variant="outline">New</Badge> : null}
          </span>
          {r.group || r.requiredToGraduate ? (
            <span className="truncate text-xs text-muted-foreground">{[r.group, r.requiredToGraduate ? "Required to graduate" : ""].filter(Boolean).join(", ")}</span>
          ) : null}
        </span>
      ),
    },
    // No column filter: the tabs filter by status, the default view groups by category and search finds a name, so a
    // filter bar would be a fourth way to narrow the same list (list toolbar budget, rule L3).
    { key: "section", label: "Category", width: 200, sortable: true },
    { key: "status", label: "Status", width: 170, sortable: true, cell: (r) => <LibraryStatusBadge status={r.status} /> },
    { key: "modelLabel", label: "How it's judged", width: 190, sortable: true, cell: (r) => (r.modelLabel ? r.modelLabel : <span className="text-muted-foreground">Not chosen</span>) },
    {
      key: "courses",
      label: "Courses",
      width: 150,
      sortable: true,
      cell: (r) =>
        r.status === "not-configured" || r.status === "inactive" ? <span className="text-muted-foreground">None</span>
          : r.courses === 0 ? <span className="text-muted-foreground">Not mapped</span>
            : <span className="tabular-nums">{plural(r.courses, "course", "courses")}</span>,
    },
    { key: "evidence", label: "Evaluations", width: 130, sortable: true, cell: (r) => (r.evidence ? <span className="tabular-nums">{fmt(r.evidence)}</span> : <span className="text-muted-foreground">None</span>) },
    {
      key: "tags",
      label: "Tags",
      width: 200,
      cell: (r) => (r.tags.length ? <span className="flex flex-wrap gap-1">{r.tags.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}</span> : <span className="text-muted-foreground">None</span>),
    },
    { key: "source", label: "Came from", width: 160, sortable: true },
    { key: "actions", label: "Actions", width: 64, resizable: false, defaultPin: "right", lockPin: true, header: () => <span className="sr-only">Actions</span>, cell: (r) => <RowActions row={r} handlers={handlers} /> },
  ]
}

const VIEWS_KEY = "lab-skills-library:views:v2"

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
  onCopySettings: (rows: LibraryRow[]) => void
  onClearTab: () => void
  /** Renders the tab row with this table's toolbar on its right. */
  renderFrame: (toolbar: React.ReactNode, table: React.ReactNode) => React.ReactNode
  /** Called with the rows in view, in order (Previous and Next in the detail panel). */
  onRowsInView?: (rows: LibraryRow[]) => void
}

export function LibraryTable({ rows, visible, tab, handlers, openId, onOpen, onCopySettings, onClearTab, renderFrame, onRowsInView }: LibraryTableProps) {
  const columns = React.useMemo(() => libraryColumns(handlers, onOpen), [handlers, onOpen])
  const ts = useTableState<LibraryRow>(visible, columns)
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

  // First paint: grouped by category, quiet columns hidden.
  const applied = React.useRef(false)
  React.useEffect(() => {
    if (applied.current) return
    applied.current = true
    applyView(SAVED_VIEWS[0]!)
  }, [applyView])

  // A new tab is a new set of rows: drop a selection the reader can no longer see.
  React.useEffect(() => { ts.setSelected(new Set()) }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  const inView = ts.rows as LibraryRow[]
  React.useEffect(() => { onRowsInView?.(inView) }, [inView, onRowsInView])

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
    const v: SavedView = { id: `custom-${Date.now().toString(36)}`, label, status: [], groupBy: ts.groupBy, hiddenColumns: [...ts.hiddenCols] }
    const next = [...custom, v]
    setCustom(next)
    try { window.localStorage.setItem(VIEWS_KEY, JSON.stringify(next)) } catch { /* private window: keep in memory */ }
    setViewId(v.id)
    setNaming(false)
    setViewName("")
    setNameTried(false)
  }

  const configureMany = useConfigureMany()
  const bulk = (selected: Set<string | number>) => {
    const picked = rows.filter((r) => selected.has(r.id))
    const active = picked.filter((r) => r.status !== "inactive")
    const unconfigured = picked.filter((r) => r.status === "not-configured")
    return (
      <span className="flex flex-wrap items-center gap-2">
        {unconfigured.length ? (
          <Button asChild variant="outline" size="sm">
            <Link href={configureMany(unconfigured.map((r) => r.id)).href}>{configureMany(unconfigured.map((r) => r.id)).label}</Link>
          </Button>
        ) : null}
        <Button type="button" variant="outline" size="sm" disabled={active.length === 0} onClick={() => { onCopySettings(active); ts.setSelected(new Set()) }}>Copy settings</Button>
        <Button type="button" variant="outline" size="sm" disabled={active.length === 0} onClick={() => { handlers.onDeactivate(active); ts.setSelected(new Set()) }}>Deactivate</Button>
      </span>
    )
  }

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
        <DropdownMenuRadioGroup value={viewId} onValueChange={(id) => { const v = views.find((x) => x.id === id); if (v) applyView(v) }}>
          {views.map((v) => <DropdownMenuRadioItem key={v.id} value={v.id}>{v.label}</DropdownMenuRadioItem>)}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setNaming(true)}>Save this view</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const toolbar = (
    <div className="flex items-center gap-2" data-library-toolbar>
      <Input type="search" value={ts.search} onChange={(e) => ts.setSearch(e.target.value)} placeholder={`Search ${skillNounPlural()}`} aria-label={`Search ${skillNoun()} names`} className="h-8 w-56" />
      {viewMenu}
    </div>
  )

  const filtersOn = ts.search.trim() !== "" || ts.activeFilters.some((f) => f.values.length > 0)
  const table = (
    <div role="region" aria-label={`${capitalize(skillNoun())} library, ${countSkills(inView.length)}`} data-library-table>
      <DataTable<LibraryRow>
        data={visible}
        columns={columns}
        state={ts}
        getRowId={(r) => r.id}
        getRowSelectionLabel={(r) => `Select ${r.name}`}
        selectable
        searchable={false}
        groupable
        showQueryControls={false}
        edgeInset={false}
        onRowClick={(r) => onOpen(r.id)}
        openRowId={openId}
        bulkActionsSlot={(selected) => bulk(selected)}
        lazyLoading={{ enabled: true, threshold: 80, chunkSize: 40, loadingLabel: "Loading more" }}
        emptyState={
          filtersOn ? (
            <EmptyBlock compact title={`No ${skillNounPlural()} match this search`} action={{ label: "Clear search and filters" }} onAction={() => { ts.setActiveFilters([]); ts.setSearch("") }} />
          ) : (
            <EmptyBlock compact title={`No ${skillNounPlural()} in this tab`} action={{ label: "Show all" }} onAction={onClearTab} />
          )
        }
      />
    </div>
  )

  return (
    <>
      {renderFrame(toolbar, table)}
      <Dialog open={naming} onOpenChange={(open) => { setNaming(open); if (!open) setNameTried(false) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save this view</DialogTitle>
            <DialogDescription>Keeps the current grouping and columns. Only you see it.</DialogDescription>
          </DialogHeader>
          <form className="flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); saveView() }}>
            <Label htmlFor="view-name">Name</Label>
            <Input id="view-name" autoFocus value={viewName} onChange={(e) => setViewName(e.target.value)} maxLength={40} aria-invalid={nameError ? true : undefined} aria-describedby={nameError ? "view-name-error" : undefined} />
            {nameError ? <FieldError id="view-name-error">{nameError}</FieldError> : null}
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setNaming(false)}>Cancel</Button>
            <Button type="button" variant="default" size="sm" onClick={saveView}>Save view</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
