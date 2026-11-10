"use client"

/**
 * One frame for every skills library option set (list template T1, docs/knowledge/design/skill-setup-journey/01 section 2):
 * - Title zone: "Skills" and ONE split button at the top right: "Add a skill", plus a chevron menu of every way to add
 *   (one at a time, several by name, Bulk upload tagged Later; in the lab only, copy from a starter library).
 * - One banner slot under the title: the result of the last action, or else the "not configured" warning (said once,
 *   hidden on the Not configured tab where the badge already says it).
 * - Status tabs that carry the counts (no KPI strip), with the toolbar on the same row.
 * - Loading, empty and error states in the place of the region they replace.
 * The words of Status and Configuration live in STATUS_META and CONFIGURATION_META (lib/lab/library.ts); the counts come from countLibrary over the shared store.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import type { ColumnDef } from "@exxatdesignux/ui/components/data-table/types"
import { useIsMobile } from "@exxatdesignux/ui/hooks/use-mobile"
import { LabLocalBanner as LocalBanner } from "@/components/lab/lab-bar/lab-banner"
import { StatusBadge } from "@exxatdesignux/ui"
import { Tabs, TabsContent, TabsCountBadge, TabsList, TabsTrigger } from "@exxatdesignux/ui/components/ui/tabs"
import { ButtonGroup, ButtonGroupSeparator } from "@exxatdesignux/ui/components/ui/button-group"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@exxatdesignux/ui/components/ui/dropdown-menu"
import { PageFrame } from "@/components/skills/page-header"
import { LaterBadge } from "@/components/lab/import/sample-badge"
import { withFrom } from "@/lib/lab/return-to"
import { TYPE } from "@/components/lab/type-scale"
import { ResultBanner } from "@/components/lab/shared/result-banner"
import { URL_PARAM_CHANGED } from "@/components/lab/shared/unsaved-guard"
import { useLibraryFilter } from "./library-filter"
import { focusAfterBanner } from "@/components/lab/shared/focus"
import { ADD_MENU_TRIGGER, ADD_SKILL_TRIGGER, rememberSheetOpener } from "@/components/lab/shared/focus"
import {
  CONFIGURATION_META,
  LAB_ADMIN,
  LIBRARY_TABS,
  STATUS_META,
  importHref,
  isLibraryTab,
  starterHref,
  tabCount,
  type LibraryCounts,
  type Configuration,
  type LibraryStatus,
  type LibraryTab,
} from "@/lib/lab/library"
import { aNoun, capitalize, countSkills, skillListNoun, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { FirstRun } from "@/components/lab/first-run"
import type { LibraryApi } from "./use-library"
import { useTerms } from "./use-terms"

/** Names inside the library table, tree and board: the shared hover-underline link (consistency audit item 7). */
export { LINK_IN_TABLE as LINK } from "@/components/lab/link-styles"

/** "Add several by name": bringing in a list is the import step, in the reviewer's option set. */
export const addSeveralHref = "/lab/admin/import-ai-review"

/** Status: Active or Inactive and nothing else (map D0). Always a status tag, so a column reads one way (D-L127, replacing D-L97). */
export function LibraryStatusBadge({ status }: { status: LibraryStatus }) {
  const m = STATUS_META[status]
  return <StatusBadge label={m.label} tone={m.tone} icon={m.icon} size="sm" surface="table" data-status={status} />
}

/** Configuration: Default, Custom or Not configured (map D0). Always a status tag (D-L127, replacing D-L97). */
export function ConfigurationBadge({ value }: { value: Configuration }) {
  const m = CONFIGURATION_META[value]
  return <StatusBadge label={m.label} tone={m.tone} icon={m.icon} size="sm" surface="table" data-configuration={value} />
}

/** One way to add skills, as a menu row: a leading icon and the label (no description line, Romit 2026-11-02: no subtext). */
function AddWayRow({ icon, label, later = false }: { icon: string; label: string; description?: string; later?: boolean }) {
  return (
    <>
      <i className={`fa-light ${icon} mt-0.5 w-4 text-center text-muted-foreground`} aria-hidden="true" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-2">
          <span className={TYPE.label}>{label}</span>
          {later ? <LaterBadge /> : null}
        </span>
      </span>
    </>
  )
}

const ADD_WAY_ITEM = "items-start gap-3 px-2 py-2"

/**
 * Title-zone actions: ONE split button (Romit 2026-10-27, "can we do a better UI for this?"). The main part adds one skill;
 * the chevron opens every way to add, each with what it takes: one at a time, several by name (a sheet on this page), or a
 * file (Bulk upload, opened with ?from=skills so its breadcrumb and Cancel lead back here, lib/lab/return-to.ts).
 * "New skill list" is not here: it lives on Skills > Skill lists, which has its own action and keeps ?new=1.
 * Bulk upload and Starting points are marked Later and stay marked when presenting: neither adds skills yet (map D2). Prism ships no
 * default library (REQ SL-01).
 * `primaryElsewhere` steps the whole button down to outline while a sheet or panel shows its own primary (rule L2).
 */
export function LibraryActions({ onAdd, onAddSeveral, primaryElsewhere = false }: { onAdd: () => void; onAddSeveral?: () => void; primaryElsewhere?: boolean }) {
  const variant = primaryElsewhere ? "outline" : "default"
  // A menu row that opens a sheet: focus belongs in the sheet, not back on the chevron, until the sheet closes and returns it there.
  const openingSheet = React.useRef(false)
  const fromMenu = (open: () => void) => () => { openingSheet.current = true; rememberSheetOpener(ADD_MENU_TRIGGER); open() }
  const several = <AddWayRow icon="fa-list" label="Add several" description="Paste a list of names" />
  return (
    <ButtonGroup aria-label={`Add ${skillNounPlural()}`} data-add-menu>
      <Button type="button" variant={variant} size="sm" onClick={() => { rememberSheetOpener(ADD_SKILL_TRIGGER); onAdd() }} data-add-skill-trigger>
        {`Add ${aNoun()}`}
      </Button>
      {/* Both halves share one look. Filled halves need a visible divider; outline halves already share a border. */}
      {variant === "default" ? <ButtonGroupSeparator orientation="vertical" className="bg-background/40" /> : null}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant={variant} size="sm" className="px-2" aria-label={`More ways to add ${skillNounPlural()}`} data-add-menu-trigger>
            <i className="fa-light fa-chevron-down text-xs" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72" onCloseAutoFocus={(e) => { if (openingSheet.current) { openingSheet.current = false; e.preventDefault() } }}>
          {onAddSeveral ? (
            <DropdownMenuItem className={ADD_WAY_ITEM} onSelect={fromMenu(onAddSeveral)}>{several}</DropdownMenuItem>
          ) : (
            <DropdownMenuItem className={ADD_WAY_ITEM} asChild>
              <Link href={withFrom(addSeveralHref, "skills")}>{several}</Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem className={ADD_WAY_ITEM} asChild>
            <Link href={withFrom(importHref, "skills")}>
              <AddWayRow icon="fa-file-arrow-up" label="Bulk upload" description="From a PDF, Word or Excel file" later />
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className={ADD_WAY_ITEM} asChild>
            <Link href={withFrom(starterHref, "skills")}>
              <AddWayRow icon="fa-copy" label="Starting points" description={`Look through ready-made sets of ${skillNounPlural()}`} later />
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  )
}

/**
 * Export (D-L120), after Add a skill in the table's toolbar, as the DS table's secondary action: outline, with its glyph (Romit 2026-11-09: "the export button cannot
 * come before add skills"). It hands over the whole library as a CSV, whatever the filters. The DS ExportDrawer only pretends to export, so the CSV stays ours.
 */
export function LibraryExport({ onExport, canExport }: { onExport: () => void; canExport: boolean }) {
  return (
    <Button type="button" variant="outline" size="sm" disabled={!canExport} onClick={onExport} data-library-export>
      <i className="fa-light fa-arrow-down-to-line" aria-hidden="true" />
      Export
    </Button>
  )
}

/** The page's actions, handed from the frame to the table's toolbar (the DS places a table's commands after its search, filter and Properties). */
const LibraryToolbarActions = React.createContext<React.ReactNode>(null)
/** Reads them where they render, so a change to the actions renders this slot and not the table's rows. */
export function LibraryToolbarActionsSlot() {
  const actions = React.useContext(LibraryToolbarActions)
  if (!actions) return null
  return <><div className="h-4 w-px bg-border/70" aria-hidden="true" />{actions}</>
}

const onUrlChange = (cb: () => void) => {
  window.addEventListener(URL_PARAM_CHANGED, cb)
  window.addEventListener("popstate", cb)
  return () => {
    window.removeEventListener(URL_PARAM_CHANGED, cb)
    window.removeEventListener("popstate", cb)
  }
}

/**
 * One URL param, read from the location itself rather than through Next's router: the router takes the new URL in a transition, and that transition renders after everything else
 * queued, which held the edit panel on screen for 0.8 to 0.95 s after X (and off screen as long after a row press). This one changes in the frame of the press, and only its own
 * readers render; nothing happens when another param changes. The panel, and only what must answer a press at once, reads it.
 */
export function useLiveUrlParam(name: string): string | null {
  return React.useSyncExternalStore(onUrlChange, () => new URLSearchParams(window.location.search).get(name), () => null)
}

/** The write half of `useUrlParam`, for a cell that must not subscribe to the URL: 178 rows of them would all render on every change to it. */
export function writeUrlParam(name: string, v: string | null) {
  const q = new URLSearchParams(window.location.search)
  if (v) q.set(name, v)
  else q.delete(name)
  const s = q.toString()
  window.history.replaceState(null, "", s ? `${window.location.pathname}?${s}` : window.location.pathname)
  window.dispatchEvent(new Event(URL_PARAM_CHANGED))
}

/**
 * Writes or removes one URL param without a scroll jump and without a trip to the server. These params (the open skill, the status tab, the replace flow) only ever
 * reach client components, and the page holds nothing a server render would change. router.replace asked the server for the whole route on each press, so the edit panel
 * stayed on screen for 1.2 to 3 seconds after X, which reads as a dead button (designer's "I cannot close the panel", 2026-11-05). `history.replaceState(null, ...)` is the
 * Next.js shallow update: useSearchParams follows it at once, and the location is already current for a second change in the same click. Null, since Next.js copies its own
 * state in and passes straight through anything carrying its marker.
 */
export function useUrlParam(name: string): [string | null, (v: string | null) => void] {
  const params = useSearchParams()
  const value = params?.get(name) ?? null
  const set = React.useCallback((v: string | null) => writeUrlParam(name, v), [name])
  return [value, set]
}

/** The status tab lives in the URL (?status=), so a filtered library can be linked, reloaded and reached with Back. */
export function useStatusTab(): [LibraryTab, (t: LibraryTab) => void] {
  const [raw, set] = useUrlParam("status")
  // Older links named a configuration word as a tab: the words moved to the Configuration filter (map D1).
  const [, setFilter] = useLibraryFilter()
  const older = raw === "not-configured" ? "not-configured" : raw === "own-settings" ? "edited" : raw === "program-default" ? "default" : null
  React.useEffect(() => { if (older) { set(null); window.setTimeout(() => setFilter({ config: older }), 0) } }, [older]) // eslint-disable-line react-hooks/exhaustive-deps
  const tab: LibraryTab = isLibraryTab(raw) ? raw : "all"
  const change = React.useCallback((t: LibraryTab) => set(t === "all" ? null : t), [set])
  return [tab, change]
}

/** The record the detail panel shows (?skill=), so a peeked skill survives reload and can be shared. */
export function useOpenSkill(): [string | null, (id: string | null) => void] {
  const value = useLiveUrlParam("skill")
  const set = React.useCallback((id: string | null) => writeUrlParam("skill", id), [])
  return [value, set]
}

/**
 * Status tabs with their counts, the toolbar on the same row (tabs left, toolbar right), and the content under them.
 * The tabs are the counts: there is no KPI strip on a list that has tabs (strategy/07 list budget).
 */
export function LibraryTabs({ counts, value, onChange, toolbar, children }: {
  counts: LibraryCounts
  value: LibraryTab
  onChange: (t: LibraryTab) => void
  toolbar?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Tabs value={value} onValueChange={(v) => isLibraryTab(v) && onChange(v)} className="@container flex flex-col gap-3">
      {/* The DS line tablist wraps itself in a full-width sticky subheader; here it shares its row with the toolbar, so the
          subheader takes the remaining width (its overflow ladder then measures the real space) and the row owns the rule. */}
      {/* In less than 58rem of page, at 1024 or beside the edit panel, the toolbar drops under the tabs (right aligned), so the tabs keep their labels. */}
      <div className="flex flex-col gap-2 @min-[58rem]:flex-row @min-[58rem]:items-end @min-[58rem]:gap-4 @min-[58rem]:border-b @min-[58rem]:border-border @min-[58rem]:[&>[data-slot=tabs-sticky-subheader]]:w-auto @min-[58rem]:[&>[data-slot=tabs-sticky-subheader]]:min-w-0 @min-[58rem]:[&>[data-slot=tabs-sticky-subheader]]:flex-1 @min-[58rem]:[&>[data-slot=tabs-sticky-subheader]]:border-b-0">
        <TabsList variant="line" ariaLabel={`${capitalize(skillNounPlural())} by status`}>
          {LIBRARY_TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
              <TabsCountBadge count={tabCount(counts, t.value)} />
            </TabsTrigger>
          ))}
        </TabsList>
        {toolbar ? <div className="flex min-w-0 items-center justify-end gap-2 @min-[58rem]:shrink-0 @min-[58rem]:pb-1">{toolbar}</div> : null}
      </div>
      <TabsContent value={value} className="mt-0">
        {children}
      </TabsContent>
    </Tabs>
  )
}

/**
 * The one banner: a result (added, deactivated, saved) wins; otherwise, while any Active skill is Not configured, the count once [REQ IM-10] with one
 * action. Before the program's first save that is the way to Evaluation settings; after it, what is left wants its questions, so the action sets the
 * Configuration filter (map D1).
 */
export function LibraryBanner({ api }: { api: LibraryApi; tab?: LibraryTab }) {
  // Below the title (map D1): the banner's place while the title is on screen. ResultBanner uses the shell's slot once the title has scrolled away, so a save far down the list is still seen.
  const [below, setBelow] = React.useState<HTMLElement | null>(null)
  // The new program's action stays on the new program (lib/lab/links.ts SCOPE_CARRY).
  const program = useSearchParams()?.get("program")
  const [filter, setFilter] = useLibraryFilter()
  const [dismissed, setDismissed] = React.useState(false)
  // Say it once: with a skill's panel open, its Configure holds the way to the skill's full page and on to Evaluation settings (map D1a, D1c); the banner keeps the count.
  const [panelOpen] = useOpenSkill()
  const setUpLabel = `Set how ${skillNounPlural()} are judged`
  const n = api.rows.filter((r) => r.status === "active" && r.configuration === "not-configured").length
  // A banner remembers being dismissed for as long as it is mounted (the DS keeps that inside it), so each new banner gets its own, or the next one never shows.
  const said = React.useRef<{ banner: LibraryApi["banner"]; seq: number }>({ banner: null, seq: 0 })
  if (api.banner && said.current.banner !== api.banner) said.current = { banner: api.banner, seq: said.current.seq + 1 }
  let shown: React.ReactNode = null
  if (api.banner) {
    const result = panelOpen && api.banner.action?.label === setUpLabel ? { ...api.banner, action: undefined } : api.banner
    shown = <ResultBanner key={`result-${said.current.seq}`} banner={result} underTitle={below} onDismiss={() => { api.setBanner(null); focusAfterBanner() }} />
  } else if (n && !dismissed) {
    const action = !api.programSaved
      ? panelOpen ? undefined : { label: setUpLabel, href: `${LAB_ADMIN}/evaluation-settings${program ? `?program=${program}` : ""}` }
      : filter.config === "not-configured" ? undefined : { label: "Show them", onClick: () => { setDismissed(true); setFilter({ config: "not-configured" }, { push: true }); focusAfterBanner() } }
    shown = <ResultBanner key="not-configured" pageOnly underTitle={below} banner={{ variant: "warning", title: `${countSkills(n)} not configured.`, action }} onDismiss={() => { setDismissed(true); focusAfterBanner() }} />
  }
  return <><div ref={setBelow} data-banner-below-title="" className="empty:hidden" />{shown}</>
}

/** The columns the table opens with (map D1), so nothing moves when the rows arrive. Below md only the name and the number, as the table's own width allows without scrolling the page. */
const LOADING_COLUMNS: Array<{ label: string; cell: string; wide?: boolean }> = [
  { label: "Times needed", cell: "h-8 w-14" },
  { label: "Category", cell: "h-4 w-28", wide: true },
  { label: "Configuration", cell: "h-4 w-20", wide: true },
  { label: "Status", cell: "h-4 w-14", wide: true },
]
type LoadingRow = { id: string; index: number }
const LOADING_ROWS: LoadingRow[] = Array.from({ length: 9 }, (_, index) => ({ id: `loading-${index}`, index }))

/** Skeleton in the final table shape (map D1): the tab row, the column heads, a group row, then rows at their two-line height. */
export function LibraryLoading() {
  const isMobile = useIsMobile()
  const columns: ColumnDef<LoadingRow>[] = [
    { key: "box", label: "", width: 40, minWidth: 40, resizable: false, cell: () => <Skeleton aria-hidden="true" className="size-4" /> },
    {
      key: "name",
      label: capitalize(skillNoun()),
      width: isMobile ? 180 : 320,
      // The first row stands for the group row, the others for rows at their two-line height.
      cell: (r) => r.index === 0 ? <Skeleton aria-hidden="true" className="h-4 w-32 bg-border" data-loading-group /> : (
        <span className="flex min-h-10 flex-col justify-center gap-1.5">
          <Skeleton aria-hidden="true" className="h-4 w-44 max-w-full" />
          {r.index % 2 ? <Skeleton aria-hidden="true" className="h-3 w-28 max-w-full" /> : null}
        </span>
      ),
    },
    ...LOADING_COLUMNS.filter((c) => !isMobile || !c.wide).map((c): ColumnDef<LoadingRow> => ({ key: c.label, label: c.label, width: 150, cell: (r) => (r.index === 0 ? null : <Skeleton aria-hidden="true" className={c.cell} />) })),
  ]
  return (
    <div role="status" aria-busy="true" aria-label="Loading the library" className="flex flex-col gap-3" data-loading>
      <span className="sr-only">Loading the library</span>
      <div className="flex items-end justify-between gap-4 border-b border-border pb-2">
        <div className="flex gap-6">
          {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} aria-hidden="true" className="h-6 w-16 md:w-24" />)}
        </div>
        <Skeleton aria-hidden="true" className="hidden h-8 w-48 sm:block" />
      </div>
      <div aria-hidden="true" data-loading-table>
        <DataTable<LoadingRow> key={isMobile ? "phone" : "wide"} data={LOADING_ROWS} columns={columns} getRowId={(r) => r.id} searchable={false} selectable={false} showQueryControls={false} edgeInset={false} />
      </div>
    </div>
  )
}

/**
 * Empty library: the same three ways as the title-zone menu, with the same labels (Add a skill, Add several, Bulk upload),
 * so the empty page and the header never disagree. Same box as EmptyBlock; it needs three actions, so it composes the box
 * here. Every action is outline: the page's one filled primary stays the title-zone split button.
 */
export function LibraryEmpty({ onAdd, onAddSeveral }: { onAdd?: () => void; onAddSeveral?: () => void }) {
  return (
    <FirstRun
      scene="library"
      title={`Add your program's ${skillNounPlural()}`}
      body={`Every ${skillListNoun()} draws from here.`}
      actions={
        <>
          {onAdd ? <Button type="button" variant="outline" size="sm" onClick={onAdd}>{`Add ${aNoun()}`}</Button> : null}
          {onAddSeveral ? (
            <Button type="button" variant="outline" size="sm" onClick={onAddSeveral}>Add several</Button>
          ) : (
            <Button asChild variant="outline" size="sm"><Link href={withFrom(addSeveralHref, "skills")}>Add several</Link></Button>
          )}
          <Button asChild variant="outline" size="sm">
            <Link href={withFrom(importHref, "skills")} className="inline-flex items-center gap-2">
              Bulk upload
              <LaterBadge />
            </Link>
          </Button>
        </>
      }
    />
  )
}

export function LibraryError() {
  const router = useRouter()
  const pathname = usePathname() ?? ""
  const params = useSearchParams()
  const retry = () => {
    const q = new URLSearchParams(params?.toString() ?? "")
    q.delete("state")
    const s = q.toString()
    router.replace(s ? `${pathname}?${s}` : pathname)
  }
  return (
    // `action`, not the banner's `retry`, which draws an icon on a text button (map E rule 5).
    <LocalBanner variant="error" title="The library did not load" action={{ label: "Try again", onClick: retry }}>
      Nothing was changed. Check your connection and try again.
    </LocalBanner>
  )
}

/**
 * Page frame plus the demo states. `children` render only when there is data; `overlays` (sheets, dialogs) always.
 * Every option set uses this frame, so the title, the action placement and the banner slot are identical across sets.
 */
export function LibraryFrame({ api, tab, onAdd, onAddSeveral, primaryElsewhere, overlays, children, pageType = "list", actionsInTable = false }: {
  api: LibraryApi
  tab?: LibraryTab
  onAdd: () => void
  onAddSeveral?: () => void
  primaryElsewhere?: boolean
  overlays?: React.ReactNode
  children: React.ReactNode
  pageType?: "list" | "split"
  /** The table's toolbar holds Add a skill and Export (the DS table pattern); the header keeps only the title. */
  actionsInTable?: boolean
}) {
  // "Skills library" under the crumb "Skills > Library" (D-L64). It follows the program's noun; the hook re-renders the frame when it changes.
  const terms = useTerms()
  const title = `${capitalize(terms.skillNounPlural)} library`
  // Navigation model A (D-L42): the header holds the page's actions, one filled; there is no flow footer.
  // Add a skill first, then Export (Romit 2026-11-09).
  const actions = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <LibraryActions onAdd={onAdd} onAddSeveral={onAddSeveral} primaryElsewhere={primaryElsewhere} />
      <LibraryExport onExport={() => api.exportCsv()} canExport={api.rows.length > 0} />
    </div>
  )
  // In the table only while the table is on screen; loading, error and empty keep their own ways in.
  const inTable = actionsInTable && api.hydrated && !api.demo && api.rows.length > 0
  let body: React.ReactNode = children
  if (!api.hydrated || api.demo === "loading") body = <LibraryLoading />
  else if (api.demo === "error") body = <LibraryError />
  // One empty message, whatever made the library empty: a new program, or the demo state (map D1, D2).
  else if (api.rows.length === 0) body = <LibraryEmpty onAdd={onAdd} onAddSeveral={onAddSeveral} />
  return (
    <div data-page-type={pageType} className="flex min-h-[calc(100dvh-5.5rem)] w-full flex-col">
      <PageFrame title={title} actions={inTable ? undefined : actions} className="flex-1">
        <LibraryBanner api={api} tab={tab} />
        <LibraryToolbarActions.Provider value={inTable ? actions : null}>{body}</LibraryToolbarActions.Provider>
        {overlays}
      </PageFrame>
    </div>
  )
}
