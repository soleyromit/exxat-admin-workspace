"use client"

/**
 * Library — thin wrapper around the centralized `<HubTable>`. Owns column defs,
 * folder/panel/tree-panel custom views, the new-folder + customize-folder sheet, and
 * forwards URL search via `HubTable.syncedSearchFromUrl`.
 *
 * Single dataset rule: `HubTable` runs one `useTableState(tableSourceItems, columns, …)`.
 * Every non-table renderer (list, board, folder, panel, tree-panel, dashboard) reads
 * `state.rows` — the same filtered/sorted/searched bag as the grid.
 */

import * as React from "react"
import { initialsFromDisplayName } from "@/lib/initials-from-name"
import {
  PersonIdentityCell,
  PillCell,
  SignalBarsCell,
} from "@/components/data-views"
import type { DataListViewType } from "@/lib/data-list-view"
import type { ColumnDef } from "@/components/data-table/types"
import {
  HubTable,
  type HubTableHandle,
  type HubTableRenderers,
  type BulkAction,
  type CreatedViewSpec,
} from "@/components/data-views"
import { Skeleton } from "@/components/ui/skeleton"
import { LIBRARY_SUPPORTED_VIEWS } from "@/lib/library-supported-views"

let demoFolderIdSeq = 0

function nextDemoFolderId(): string {
  demoFolderIdSeq += 1
  return `fld-${demoFolderIdSeq}`
}

import { DataTableToolbar } from "@/components/data-table"
import { TablePropertiesDrawerButton } from "@/components/table-properties"
import { CoachMark } from "@/components/ui/coach-mark"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tip } from "@/components/ui/tip"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ListPageSplitHubChrome } from "@/components/data-views/list-page-split-hub-chrome"
import {
  LIST_PAGE_SPLIT_MILLER_DETAIL_PANEL_CLASS,
  LIST_PAGE_SPLIT_RESIZABLE_HANDLE_CLASS,
  LIST_PAGE_SPLIT_MILLER_COLUMN_PANEL_CLASS,
} from "@/components/data-views/list-page-split-hub-tokens"
import { ListPageTreeColumnHeader } from "@/components/data-views/list-page-tree-column-header"
import { LibraryBoardView, LIBRARY_BOARD_GROUP_OPTIONS, LibraryListRowCard } from "@/components/library-board-view"
import {
  LibraryFavoriteButton,
  LIBRARY_FAVORITE_HOVER_GROUP,
} from "@/components/library-favorite-button"
import { LibraryOsFolderView } from "@/components/library-os-folder-view"
import { LibraryNewFolderSheet } from "@/components/library-new-folder-sheet"
import { FolderDetailsShell } from "@/components/folder-details-shell"
import { HubTreePanelView } from "@/components/hub-tree-panel-view"
import { cn } from "@/lib/utils"
import { formatDateUS } from "@/lib/date-filter"
import {
  newLibraryQuestionId,
  type LibraryLevel,
  type LibraryItem,
  type LibraryItemType,
} from "@/lib/mock/library"
import {
  type LibraryFolder,
  LIBRARY_FOLDER_COLOR_STYLES,
  LIBRARY_FOLDER_ICON_COLORS,
} from "@/lib/mock/library-folders"
import {
  toggleLibraryItemFavorite,
  applyLibraryHubDisplayFilters,
  isLibraryItemFavorite,
  type LibraryLandingFilterState,
  type LibraryNavState,
} from "@/lib/library-nav"
import { KEY_METRICS_KPI_COUNT_DEFAULT } from "@/lib/dashboard-layout-merge"
import { DASHBOARD_CUSTOMIZE_COACH_STEPS } from "@/lib/dashboard-customize-coach-mark"
import type { ChartType, DashboardLayout } from "@/lib/data-view-dashboard-library-layout"
import {
  ALL_DASHBOARD_CARDS,
  DEFAULT_CHART_TYPES,
  DEFAULT_SPANS,
  DEFAULT_VISIBLE_CARDS,
  loadDashboardLayout,
  mergeDashboardLayout,
  saveDashboardLayout,
} from "@/lib/data-view-dashboard-library-layout"
import { useCoachMark } from "@/hooks/use-coach-mark"

// ─── Lazy dashboard charts section ───────────────────────────────────────────
// React.lazy + Suspense replaces the previous Next `dynamic()` wrapper after
// PR-6. Same call-site shape (`<LibraryDashboardChartsSection />`) — the
// Suspense boundary is internal so consumers don't need to wrap.

const LibraryDashboardChartsLazy = React.lazy(() =>
  import("@/components/library-dashboard-charts").then(mod => ({
    default: mod.LibraryDashboardChartsSection,
  })),
)

function LibraryDashboardChartsFallback() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 pb-2 lg:px-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="min-h-[220px] w-full rounded-lg" />
        </div>
        <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="min-h-[220px] w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}

function LibraryDashboardChartsSection(
  props: React.ComponentProps<typeof LibraryDashboardChartsLazy>,
) {
  return (
    <React.Suspense fallback={<LibraryDashboardChartsFallback />}>
      <LibraryDashboardChartsLazy {...props} />
    </React.Suspense>
  )
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<LibraryItemType, string> = {
  multiple_choice: "Type 1",
  true_false: "Type 2",
  short_answer: "Type 3",
}

const TYPE_ICON: Record<LibraryItemType, string> = {
  multiple_choice: "fa-list-check",
  true_false: "fa-toggle-on",
  short_answer: "fa-pen-line",
}

const DIFFICULTY_LABEL: Record<LibraryLevel, string> = {
  easy: "Low",
  medium: "Normal",
  hard: "High",
}

const DIFFICULTY_LEVEL: Record<LibraryLevel, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
}

const DIFFICULTY_TONE: Record<LibraryLevel, "success" | "warning" | "danger"> = {
  easy: "success",
  medium: "warning",
  hard: "danger",
}

const TYPE_FILTER_OPTS = (Object.keys(TYPE_LABEL) as LibraryItemType[]).map(k => ({
  value: k,
  label: TYPE_LABEL[k],
}))

const DIFFICULTY_FILTER_OPTS = (Object.keys(DIFFICULTY_LABEL) as LibraryLevel[]).map(k => ({
  value: k,
  label: DIFFICULTY_LABEL[k],
}))

function newLibraryItemId() {
  return `q-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function defaultFolderIdForColumnParent(parentId: string | null, folders: LibraryFolder[]): string | null {
  if (parentId !== null) return parentId
  const roots = [...folders].filter(f => f.parentId === null).sort((a, b) => a.name.localeCompare(b.name))
  return roots[0]?.id ?? null
}

function uniqueTopics(items: LibraryItem[]) {
  return [...new Set(items.map(i => i.topic))].toSorted().map(t => ({ value: t, label: t }))
}

function buildLibraryColumns(
  items: LibraryItem[],
  opts: { onToggleFavorite: (row: LibraryItem) => void },
): ColumnDef<LibraryItem>[] {
  const topicOpts = uniqueTopics(items)
  const { onToggleFavorite } = opts
  return [
    { key: "select", label: "", width: 40, minWidth: 40, defaultPin: "left", lockPin: true },
    {
      key: "stem",
      label: "Question",
      width: 300,
      minWidth: 160,
      sortable: true,
      sortKey: "stem",
      defaultPin: "left",
      cellKind: "text",
      filter: { type: "text", icon: "fa-file-lines", operators: ["contains", "not_contains"] },
      favoriteFilter: true,
      cell: row => (
        <div className={cn(LIBRARY_FAVORITE_HOVER_GROUP, "flex min-w-0 items-start gap-2")}>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 pe-1">
            <span className="line-clamp-2 text-sm font-medium text-foreground">{row.stem}</span>
            <span className="font-mono text-xs text-muted-foreground">{row.questionId}</span>
          </div>
          <LibraryFavoriteButton row={row} onToggleFavorite={onToggleFavorite} />
        </div>
      ),
    },
    {
      key: "topic",
      label: "Topic",
      width: 160,
      minWidth: 120,
      sortable: true,
      sortKey: "topic",
      cellKind: "text",
      filter: { type: "select", icon: "fa-layer-group", operators: ["is", "is_not"], options: topicOpts },
      cell: row => <span className="text-sm text-foreground/90">{row.topic}</span>,
    },
    {
      key: "type",
      label: "Type",
      width: 140,
      minWidth: 120,
      sortable: true,
      sortKey: "type",
      cellKind: "pill",
      filter: { options: TYPE_FILTER_OPTS },
      cell: row => <PillCell label={TYPE_LABEL[row.type]} icon={TYPE_ICON[row.type]} />,
    },
    {
      key: "difficulty",
      label: "Difficulty",
      width: 110,
      minWidth: 96,
      sortable: true,
      sortKey: "difficulty",
      cellKind: "signal-bars",
      filter: { options: DIFFICULTY_FILTER_OPTS },
      cell: row => (
        <SignalBarsCell
          level={DIFFICULTY_LEVEL[row.difficulty]}
          tone={DIFFICULTY_TONE[row.difficulty]}
          label={`Difficulty: ${DIFFICULTY_LABEL[row.difficulty]}`}
        />
      ),
    },
    {
      key: "updatedAt",
      label: "Updated",
      width: 120,
      minWidth: 100,
      sortable: true,
      sortKey: "updatedAt",
      cellKind: "date",
      filter: { type: "date", icon: "fa-calendar-days", operators: ["is", "is_not"] },
      cell: row => (
        <span className="text-sm tabular-nums text-foreground/90 whitespace-nowrap">{formatDateUS(row.updatedAt)}</span>
      ),
    },
    {
      key: "author",
      label: "Author",
      width: 260,
      minWidth: 200,
      sortable: true,
      sortKey: "author",
      cellKind: "person",
      cell: row => (
        <PersonIdentityCell
          name={row.author}
          email={row.authorEmail}
          initials={initialsFromDisplayName(row.author)}
        />
      ),
    },
    {
      key: "actions",
      label: "",
      width: 48,
      minWidth: 48,
      defaultPin: "right",
      lockPin: true,
      cell: row => (
        <div className="flex items-center justify-center">
          <DropdownMenu>
            <Tip label={`Actions for question ${row.id}`} side="left">
              <DropdownMenuTrigger asChild>
                <Button size="icon-sm" variant="ghost" aria-label={`Actions for question ${row.id}`}>
                  <i className="fa-light fa-ellipsis text-sm" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
            </Tip>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled>
                <i className="fa-light fa-eye" aria-hidden="true" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <i className="fa-light fa-pen" aria-hidden="true" />
                Edit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]
}

// ─── Folder columns panel (custom multi-column miller view) ─────────────────

interface HubFolderColumnsPanelProps {
  folders: LibraryFolder[]
  rows: LibraryItem[]
  panelRenderDetail: (row: LibraryItem) => React.ReactNode
  onAddFolder: (parentId: string | null) => void
  onAddQuestion: (parentId: string | null) => void
  onCustomizeFolder?: (folder: LibraryFolder) => void
}

type HierarchyItem = LibraryFolder | LibraryItem

function isFolder(item: HierarchyItem): item is LibraryFolder {
  return "parentId" in item
}

function isQuestion(item: HierarchyItem): item is LibraryItem {
  return "stem" in item
}

function buildInitialSelectedPath(
  folders: LibraryFolder[],
  rows: LibraryItem[],
): HierarchyItem[] {
  const rootFolders = folders
    .filter(f => f.parentId === null)
    .sort((a, b) => a.name.localeCompare(b.name))
  if (rootFolders.length === 0) return []
  const first = rootFolders[0]!
  const subfolders = folders.filter(f => f.parentId === first.id).sort((a, b) => a.name.localeCompare(b.name))
  const questionsInFolder = rows.filter(r => r.folderId === first.id)
  const items: HierarchyItem[] = [...subfolders, ...questionsInFolder]
  if (items.length > 0) return [first, items[0]!]
  return [first]
}

function HubFolderColumnsPanel({
  folders,
  rows,
  panelRenderDetail,
  onAddFolder,
  onAddQuestion,
  onCustomizeFolder,
}: HubFolderColumnsPanelProps) {
  const [selectedPath, setSelectedPath] = React.useState<HierarchyItem[]>(() =>
    buildInitialSelectedPath(folders, rows),
  )

  const rootFolders = React.useMemo(
    () => folders.filter(f => f.parentId === null).sort((a, b) => a.name.localeCompare(b.name)),
    [folders],
  )

  const handleSelect = (item: HierarchyItem, depth: number) => {
    setSelectedPath(prev => [...prev.slice(0, depth), item])
  }

  const columns: Array<{ items: HierarchyItem[]; depth: number; parentId?: string | null }> = React.useMemo(() => {
    const cols: Array<{ items: HierarchyItem[]; depth: number; parentId?: string | null }> = [
      { items: rootFolders, depth: 0, parentId: null },
    ]
    for (let i = 0; i < selectedPath.length; i++) {
      const item = selectedPath[i]
      if (isFolder(item)) {
        const subfolders = folders.filter(f => f.parentId === item.id).sort((a, b) => a.name.localeCompare(b.name))
        const questionsInFolder = rows.filter(r => r.folderId === item.id)
        const items: HierarchyItem[] = [...subfolders, ...questionsInFolder]
        if (items.length > 0) cols.push({ items, depth: i + 1, parentId: item.id })
      }
    }
    return cols
  }, [selectedPath, rootFolders, folders, rows])

  const selectedLeaf = selectedPath.length > 0 ? selectedPath.at(-1)! : null
  const selectedQuestion = selectedLeaf && isQuestion(selectedLeaf) ? (selectedLeaf as LibraryItem) : null
  const selectedFolderLeaf = selectedLeaf && isFolder(selectedLeaf) ? (selectedLeaf as LibraryFolder) : null

  return (
    <ResizablePanelGroup direction="horizontal" className="flex h-full min-h-0 w-full flex-1 overflow-hidden">
      {columns.map(({ items, depth, parentId }, columnIdx) => (
        <React.Fragment key={`col-${depth}`}>
          {columnIdx > 0 && <ResizableHandle withHandle className={LIST_PAGE_SPLIT_RESIZABLE_HANDLE_CLASS} />}
          <ResizablePanel
            id={`col-${depth}`}
            defaultSize={columnIdx === 0 ? 35 : columnIdx === 1 ? 35 : 30}
            minSize={15}
            className={LIST_PAGE_SPLIT_MILLER_COLUMN_PANEL_CLASS}
          >
            <ListPageTreeColumnHeader
              title={
                depth === 0
                  ? "Categories"
                  : selectedPath[depth - 1] && isFolder(selectedPath[depth - 1])
                    ? (selectedPath[depth - 1] as LibraryFolder).name
                    : "Items"
              }
              trailing={
                <>
                  <span className="shrink-0 text-xs font-medium text-muted-foreground tabular-nums">{items.length}</span>
                  {depth < columns.length - 1 && items.length > 0 ? (
                    <div className="flex shrink-0 items-center gap-0.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => onAddFolder(parentId ?? null)}
                            aria-label="Add folder"
                          >
                            <i className="fa-light fa-folder-plus text-xs" aria-hidden="true" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={4}>
                          Add folder
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => onAddQuestion(parentId ?? null)}
                            aria-label="Add question"
                          >
                            <i className="fa-light fa-plus text-xs" aria-hidden="true" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={4}>
                          Add question
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  ) : null}
                </>
              }
            />
            <div className="min-h-0 flex-1 overflow-y-auto py-1">
              {items.map(item => {
                const isSelected = selectedPath[depth]?.id === item.id
                const isFolder_ = isFolder(item)
                const folder = isFolder_ ? item : null
                const question = isQuestion(item) ? item : null
                const subfolderCount = isFolder_ ? folders.filter(f => f.parentId === item.id).length : 0
                const questionCount = isFolder_ ? rows.filter(r => r.folderId === item.id).length : 0
                const itemCount = subfolderCount + questionCount
                return (
                  <div key={item.id} className="group flex items-center hover:bg-muted/50">
                    <button
                      type="button"
                      onClick={() => handleSelect(item, depth)}
                      className={cn(
                        "flex flex-1 items-center gap-3 px-3 py-2 text-left text-sm transition-colors duration-75",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                        isSelected ? "bg-accent text-accent-foreground" : "text-foreground",
                        isFolder_ && !isSelected && folder?.colorKey && depth > 0
                          ? LIBRARY_FOLDER_COLOR_STYLES[folder.colorKey]?.tile
                          : "",
                      )}
                      aria-selected={isSelected}
                      role="option"
                    >
                      {isFolder_ ? (
                        <i
                          className={cn(
                            "fa-folder text-sm shrink-0",
                            isSelected ? "fa-solid" : "fa-light",
                            folder?.colorKey && LIBRARY_FOLDER_ICON_COLORS[folder.colorKey],
                          )}
                          aria-hidden="true"
                        />
                      ) : (
                        <i className={cn("fa-file text-sm shrink-0", isSelected ? "fa-solid" : "fa-light")} aria-hidden="true" />
                      )}
                      <span className={cn("min-w-0 flex-1 truncate leading-tight", isSelected && "font-medium")}>
                        {isFolder_ ? folder?.name : question?.stem}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 tabular-nums text-xs ms-auto",
                          isSelected ? "text-accent-foreground/70" : "text-muted-foreground",
                        )}
                      >
                        {isFolder_
                          ? itemCount
                          : question?.type === "multiple_choice"
                            ? "T1"
                            : question?.difficulty?.charAt(0).toUpperCase()}
                      </span>
                    </button>
                    {isFolder_ && folder && (
                      <DropdownMenu>
                        <Tip label={`Actions for folder ${folder.name}`} side="left">
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              size="icon-xs"
                              variant="ghost"
                              aria-label={`Actions for folder ${folder.name}`}
                              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <i className="fa-light fa-ellipsis text-xs" aria-hidden="true" />
                            </Button>
                          </DropdownMenuTrigger>
                        </Tip>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => onCustomizeFolder?.(folder)}>
                            <i className="fa-light fa-wand-magic-sparkles text-xs" aria-hidden="true" />
                            Customize
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                )
              })}
            </div>
          </ResizablePanel>
        </React.Fragment>
      ))}
      {(selectedQuestion || selectedFolderLeaf) && (
        <>
          <ResizableHandle withHandle className={LIST_PAGE_SPLIT_RESIZABLE_HANDLE_CLASS} />
          <ResizablePanel id="col-detail" defaultSize={30} minSize={20} className={LIST_PAGE_SPLIT_MILLER_DETAIL_PANEL_CLASS}>
            {selectedQuestion ? (
              <>
                <ListPageTreeColumnHeader title="Details" className="px-4" />
                <div className="min-h-0 flex-1 overflow-y-auto p-4">
                  {panelRenderDetail(selectedQuestion)}
                </div>
              </>
            ) : selectedFolderLeaf ? (
              <div className="min-h-0 flex-1 overflow-hidden">
                <FolderDetailsShell folder={selectedFolderLeaf} folders={folders} questions={rows} />
              </div>
            ) : null}
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  )
}

// ─── Detail renderer reused by panel + tree-panel ───────────────────────────

function libraryPanelDetail(row: LibraryItem) {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2">Question</h3>
        <p className="text-sm text-foreground">{row.stem}</p>
        <p className="mt-1 font-mono text-xs text-muted-foreground">{row.questionId}</p>
      </div>
      <div className="flex gap-3 flex-wrap">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">Type</span>
          <span className="text-sm text-foreground">{TYPE_LABEL[row.type]}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">Difficulty</span>
          <span className="text-sm text-foreground">{DIFFICULTY_LABEL[row.difficulty]}</span>
        </div>
      </div>
      {row.topic && (
        <div>
          <span className="text-xs font-medium text-muted-foreground">Topic</span>
          <p className="text-sm text-foreground mt-1">{row.topic}</p>
        </div>
      )}
      {row.type === "multiple_choice" && row.options && row.options.length > 0 && (
        <div>
          <span className="text-xs font-medium text-muted-foreground block mb-2">Options</span>
          <div className="flex flex-col gap-2">
            {row.options.map((option, idx) => (
              <div key={idx} className="flex items-start gap-2 p-2 rounded bg-muted/30">
                <span className="text-xs font-medium text-muted-foreground mt-0.5 shrink-0">
                  {String.fromCharCode(65 + idx)}.
                </span>
                <span className={cn("text-sm", option.isCorrect ? "text-foreground font-medium" : "text-foreground/80")}>
                  {option.text}
                </span>
                {option.isCorrect && (
                  <i className="fa-light fa-check text-emerald-600 text-sm ms-auto shrink-0" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Public component ───────────────────────────────────────────────────────

export type LibraryTableHandle = HubTableHandle

export interface LibraryTableHubLabels {
  hubLabel: string
  lifecycleTabLabel: string
  searchAriaLabel: string
  listAriaLabel?: string
  defaultSort?: { key: string; dir: "asc" | "desc" }
}

export interface LibraryTableProps {
  items: LibraryItem[]
  /** When set, table / board / tree rows are limited to this nav scope (secondary sidebar). */
  navState?: LibraryNavState
  /** URL toolbar search binding (`?q=`) — omit on search landing so hub `q` does not pre-fill the grid search. */
  urlListSearch?: string
  /** When true, dedicated search shell: hub landing row filters; table toolbar search stays independent of URL `q`. */
  searchLanding?: boolean
  /** Applied with nav filters before `useTableState` when {@link searchLanding} is true. */
  landingFilters?: LibraryLandingFilterState | null
  view?: DataListViewType
  onViewChange?: (v: DataListViewType) => void
  /**
   * Active view's display name + commit handler — forwarded to `HubTable` so
   * the Properties drawer renders an editable Name input on its main panel.
   * Bind to the active `ViewTab.label` + an `updateTab({ label })` callback.
   * Omit both to keep the legacy read-only header.
   */
  viewName?: string
  onViewNameChange?: (name: string) => void
  folders: LibraryFolder[]
  onFoldersChange: React.Dispatch<React.SetStateAction<LibraryFolder[]>>
  onItemsChange: React.Dispatch<React.SetStateAction<LibraryItem[]>>
  /** e.g. Column types showcase — custom `ColumnDef`s while reusing list/board/folder renderers. */
  columnDefs?: ColumnDef<LibraryItem>[]
  /** Override default Library copy when {@link columnDefs} is set. */
  hubLabels?: LibraryTableHubLabels
  pagination?: boolean
  onPaginationChange?: (v: boolean) => void
  paginationInitialPageSize?: number
  paginationPageSizeOptions?: number[]
  /** Embedded/dashboard cap — forwards to `HubTable.embeddedPreviewRowLimit`. */
  embeddedPreview?: boolean
  embeddedPreviewRowLimit?: number
  embeddedPreviewExpanded?: boolean
  onEmbeddedPreviewExpandedChange?: (expanded: boolean) => void
  onEmbeddedPreviewViewMore?: () => void
  embeddedPreviewViewMoreLabel?: string
  showBulkActions?: boolean
  /**
   * Structured bulk-action definitions (Polaris IndexTable parity). When set,
   * each entry renders as a button inside the floating bulk-action bar and
   * receives the selected `LibraryItem` rows on click. Wins over the legacy
   * single-button slot when both are configured.
   */
  bulkActions?: BulkAction<LibraryItem>[]
  showViewCounts?: boolean
  onShowViewCountsChange?: (v: boolean) => void
  /**
   * Forwarded to `<HubTable>`. When set, the table lifecycle (sort /
   * filters / column layout / row height / gridlines / conditional rules /
   * pagination) is persisted to `localStorage` and restored on reload.
   * Two consumers of `LibraryTable` MUST use distinct keys (e.g. `"library"`
   * vs `"columns-showcase"`) so they don't overwrite each other.
   *
   * @see `apps/web/docs/persisted-state-pattern.md`
   */
  persistKey?: string
  /** Forwarded to `<HubTable>`. Defaults to `"main"`. */
  persistTabId?: string

  // ─── 2-step "Add view" creation flow (pass-through to HubTable) ─────────
  /** When non-null, opens the creation drawer wired to an ephemeral state buffer. */
  creatingViewType?: DataListViewType | null
  /** Controlled new-view name input. Required when `creatingViewType` is non-null. */
  creatingViewName?: string
  onCreatingViewNameChange?: (name: string) => void
  /** Fired when the user dismisses the creation drawer (Cancel / Esc). */
  onCancelCreation?: () => void
  /** Fired when the user commits the creation drawer. Receives a typed spec. */
  onCommitCreation?: (spec: CreatedViewSpec) => void
}

export const LibraryTable = React.forwardRef<LibraryTableHandle, LibraryTableProps>(
  function LibraryTable(
    {
      items,
      navState,
      urlListSearch,
      searchLanding,
      landingFilters,
      view = "table",
      onViewChange,
      viewName,
      onViewNameChange,
      folders,
      onFoldersChange,
      onItemsChange,
      columnDefs,
      hubLabels,
      pagination,
      onPaginationChange,
      paginationInitialPageSize,
      paginationPageSizeOptions,
      embeddedPreview,
      embeddedPreviewRowLimit,
      embeddedPreviewExpanded,
      onEmbeddedPreviewExpandedChange,
      onEmbeddedPreviewViewMore,
      embeddedPreviewViewMoreLabel,
      showBulkActions = true,
      bulkActions,
      showViewCounts,
      onShowViewCountsChange,
      persistKey,
      persistTabId,
      creatingViewType,
      creatingViewName,
      onCreatingViewNameChange,
      onCancelCreation,
      onCommitCreation,
    },
    ref,
  ) {
    const tableSourceItems = React.useMemo(() => {
      const nav = navState ?? { scope: "all" as const, folderId: null }
      const landing = searchLanding ? (landingFilters ?? null) : null
      return applyLibraryHubDisplayFilters(items, folders, nav, landing).map(item => ({
        ...item,
        isStarred: isLibraryItemFavorite(item),
      }))
    }, [items, folders, navState, searchLanding, landingFilters])

    const toggleFavorite = React.useCallback(
      (row: LibraryItem) => {
        onItemsChange(prev => prev.map(r => (r.id === row.id ? toggleLibraryItemFavorite(r) : r)))
      },
      [onItemsChange],
    )

    const columns = React.useMemo(
      () =>
        columnDefs ??
        buildLibraryColumns(tableSourceItems, { onToggleFavorite: toggleFavorite }),
      [columnDefs, tableSourceItems, toggleFavorite],
    )

    const hubLabel = hubLabels?.hubLabel ?? "Library"
    const lifecycleTabLabel = hubLabels?.lifecycleTabLabel ?? "Library"
    const searchAriaLabel = hubLabels?.searchAriaLabel ?? "Search questions"
    const listAriaLabel = hubLabels?.listAriaLabel ?? "Questions"
    const defaultSort = hubLabels?.defaultSort ?? { key: "updatedAt", dir: "desc" as const }

    // ─ New-folder / customize-folder modal state (shared by panel + tree-panel) ────
    const [newFolderOpen, setNewFolderOpen] = React.useState(false)
    const [newFolderParentId, setNewFolderParentId] = React.useState<string | null>(null)
    const [customizingFolder, setCustomizingFolder] = React.useState<LibraryFolder | null>(null)

    const openNewFolderForColumn = React.useCallback((parentId: string | null) => {
      setNewFolderParentId(parentId)
      setCustomizingFolder(null)
      setNewFolderOpen(true)
    }, [])

    const openCustomizeFolderSheet = React.useCallback((folder: LibraryFolder) => {
      setCustomizingFolder(folder)
      setNewFolderOpen(true)
    }, [])

    const [visibleCards, setVisibleCards] = React.useState(() => [...DEFAULT_VISIBLE_CARDS])
    const [cardOrder, setCardOrder] = React.useState(() => ALL_DASHBOARD_CARDS.map(c => c.id))
    const [cardSpans, setCardSpans] = React.useState<Record<string, 1 | 2>>(() => ({ ...DEFAULT_SPANS }))
    const [cardChartTypes, setCardChartTypes] = React.useState<Record<string, ChartType>>(() => ({
      ...DEFAULT_CHART_TYPES,
    }))
    const [keyMetricsKpiCount, setKeyMetricsKpiCount] = React.useState<number>(KEY_METRICS_KPI_COUNT_DEFAULT)
    const [dashboardLayoutEdit, setDashboardLayoutEdit] = React.useState(false)
    const dashboardLayoutHydrated = React.useRef(false)
    const dashboardLayoutEditBaselineRef = React.useRef<DashboardLayout | null>(null)

    React.useEffect(() => {
      const saved = loadDashboardLayout()
      const m = mergeDashboardLayout(saved)
      setVisibleCards(m.visible)
      setCardOrder(m.order)
      setCardSpans(m.spans ?? { ...DEFAULT_SPANS })
      setCardChartTypes(m.chartTypes ?? { ...DEFAULT_CHART_TYPES })
      setKeyMetricsKpiCount(m.keyMetricsKpiCount ?? KEY_METRICS_KPI_COUNT_DEFAULT)
      dashboardLayoutHydrated.current = true
    }, [])

    React.useEffect(() => {
      if (!dashboardLayoutHydrated.current) return
      saveDashboardLayout({
        visible: visibleCards,
        order: cardOrder,
        spans: cardSpans,
        chartTypes: cardChartTypes,
        keyMetricsKpiCount,
      })
    }, [visibleCards, cardOrder, cardSpans, cardChartTypes, keyMetricsKpiCount])

    const handleDashboardLayoutEditStart = React.useCallback(() => {
      dashboardLayoutEditBaselineRef.current = {
        visible: [...visibleCards],
        order: [...cardOrder],
        spans: { ...cardSpans },
        chartTypes: { ...cardChartTypes },
        keyMetricsKpiCount,
      }
      setDashboardLayoutEdit(true)
    }, [visibleCards, cardOrder, cardSpans, cardChartTypes, keyMetricsKpiCount])

    const handleDashboardLayoutEditDone = React.useCallback(() => {
      setDashboardLayoutEdit(false)
    }, [])

    const handleDashboardLayoutEditCancel = React.useCallback(() => {
      const b = dashboardLayoutEditBaselineRef.current
      if (b) {
        setVisibleCards(b.visible)
        setCardOrder(b.order)
        setCardSpans(b.spans ?? { ...DEFAULT_SPANS })
        setCardChartTypes(b.chartTypes ?? { ...DEFAULT_CHART_TYPES })
        setKeyMetricsKpiCount(b.keyMetricsKpiCount ?? KEY_METRICS_KPI_COUNT_DEFAULT)
      }
      setDashboardLayoutEdit(false)
    }, [])

    const handleResetDashboardLayout = React.useCallback(() => {
      setVisibleCards(ALL_DASHBOARD_CARDS.map(c => c.id))
      setCardOrder(ALL_DASHBOARD_CARDS.map(c => c.id))
      setCardSpans({ ...DEFAULT_SPANS })
      setCardChartTypes({ ...DEFAULT_CHART_TYPES })
      setKeyMetricsKpiCount(KEY_METRICS_KPI_COUNT_DEFAULT)
    }, [])

    const dashboardCustomizeCoach = useCoachMark({
      flowId: "data-list-dashboard-customize",
      steps: DASHBOARD_CUSTOMIZE_COACH_STEPS,
      delay: 700,
      dependsOnDismissedFlowId: "data-list-views-tour",
      enabled: view === "dashboard",
    })

    const addQuestionInColumn = React.useCallback(
      (parentId: string | null) => {
        const folderId = defaultFolderIdForColumnParent(parentId, folders)
        if (!folderId) return
        const today = new Date()
        const y = today.getFullYear()
        const m = String(today.getMonth() + 1).padStart(2, "0")
        const d = String(today.getDate()).padStart(2, "0")
        onItemsChange(prev => [
          ...prev,
          {
            id: newLibraryItemId(),
            questionId: newLibraryQuestionId(),
            stem: "New question",
            topic: "General",
            type: "short_answer",
            difficulty: "medium",
            author: "Demo user",
            authorEmail: "demo.user@demo.exxat.io",
            updatedAt: `${y}-${m}-${d}`,
            folderId,
          },
        ])
      },
      [folders, onItemsChange],
    )

    const renderFilterOptionValue = React.useCallback(
      (fieldKey: string, value: string): React.ReactNode => {
        const col = columns.find(c => c.key === fieldKey)
        const opt = col?.filter?.options?.find(o => o.value === value)
        // Per-option `node` lets a column author colocate the chip / swatch
        // markup with the column definition (see `columns-showcase.tsx`
        // → reviewStatus). Plain text is the default fallback.
        if (opt?.node) return opt.node
        return <span className="text-foreground">{opt?.label ?? value}</span>
      },
      [columns],
    )

    // ─ Renderers ──────────────────────────────────────────────────────────────
    const renderers: HubTableRenderers<LibraryItem> = {
      "board-with-toolbar": ({ state, toolbarShell, displayOptions }) => {
        const boardGroupKey = LIBRARY_BOARD_GROUP_OPTIONS.some(
          o => o.key === displayOptions.boardGroupByColumnKey,
        )
          ? displayOptions.boardGroupByColumnKey
          : "topic"
        return toolbarShell(
          <LibraryBoardView
            rows={state.rows as LibraryItem[]}
            groupByColumnKey={boardGroupKey}
            onToggleFavorite={toggleFavorite}
            onRowActivate={row => state.toggleRow(row.id)}
          />,
        )
      },
      "folder-with-toolbar": ({ state, viewportToolbarShell }) =>
        viewportToolbarShell(
          <LibraryOsFolderView
            folders={folders}
            onFoldersChange={onFoldersChange}
            questions={state.rows as LibraryItem[]}
            onQuestionsChange={onItemsChange}
          />,
        ),
      "panel-with-toolbar": ({ state, viewportToolbarShell }) =>
        viewportToolbarShell(
          <ListPageSplitHubChrome aria-label="Library folder columns">
            <HubFolderColumnsPanel
              folders={folders}
              rows={state.rows as LibraryItem[]}
              panelRenderDetail={libraryPanelDetail}
              onAddFolder={openNewFolderForColumn}
              onAddQuestion={addQuestionInColumn}
              onCustomizeFolder={openCustomizeFolderSheet}
            />
          </ListPageSplitHubChrome>,
        ),
      "tree-panel-with-toolbar": ({ state, viewportToolbarShell }) =>
        viewportToolbarShell(
          <HubTreePanelView
            items={state.rows as LibraryItem[]}
            folders={folders}
            onItemsChange={onItemsChange}
            onFoldersChange={onFoldersChange}
          />,
        ),
      "dashboard-with-toolbar": ({ state, drawerToolbarProps }) => (
        <div className="flex min-h-0 flex-1 flex-col">
          {!dashboardLayoutEdit ? (
            <DataTableToolbar
              state={state}
              columns={columns}
              searchable={drawerToolbarProps.displayOptions.showToolbarSearch}
              searchAriaLabel={searchAriaLabel}
              renderFilterOptionValue={renderFilterOptionValue}
              toolbarSlot={s => (
                <TablePropertiesDrawerButton
                  {...drawerToolbarProps}
                  state={s}
                  extraActions={
                    <Tip side="bottom" label="Edit dashboard layout on canvas">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Edit dashboard layout"
                        onClick={handleDashboardLayoutEditStart}
                        className="text-muted-foreground hover:text-interactive-hover-foreground hover:bg-interactive-hover"
                      >
                        <i className="fa-light fa-pen-ruler text-xs" aria-hidden="true" />
                      </Button>
                    </Tip>
                  }
                />
              )}
            />
          ) : null}
          <LibraryDashboardChartsSection
            rows={state.rows as LibraryItem[]}
            visibleCards={visibleCards}
            cardOrder={cardOrder}
            cardSpans={cardSpans}
            cardChartTypes={cardChartTypes}
            keyMetricsKpiCount={keyMetricsKpiCount}
            layoutEditMode={dashboardLayoutEdit}
            onVisibleChange={setVisibleCards}
            onOrderChange={setCardOrder}
            onSpanChange={(id, span) => setCardSpans(prev => ({ ...prev, [id]: span }))}
            onChartTypeChange={(id, t) => setCardChartTypes(prev => ({ ...prev, [id]: t }))}
            onKeyMetricsKpiCountChange={setKeyMetricsKpiCount}
            onResetLayout={handleResetDashboardLayout}
            onLayoutEditDone={handleDashboardLayoutEditDone}
            onLayoutEditCancel={handleDashboardLayoutEditCancel}
          />
        </div>
      ),
    }

    return (
      <>
        <CoachMark state={dashboardCustomizeCoach} />
        <HubTable<LibraryItem>
          rows={tableSourceItems}
          columns={columns}
          view={view}
          onViewChange={onViewChange}
          viewName={viewName}
          onViewNameChange={onViewNameChange}
          supportedViewTypes={LIBRARY_SUPPORTED_VIEWS}
          hubLabel={hubLabel}
          lifecycleTabLabel={lifecycleTabLabel}
          searchAriaLabel={searchAriaLabel}
          getRowId={row => row.id}
          getRowSelectionLabel={row => row.stem}
          defaultSort={defaultSort}
          // Persist sort / filters / column layout / row height / gridlines /
          // conditional rules / pagination across reloads when the consumer
          // opts in by passing `persistKey`. v0.5.18+ — see
          // `apps/web/docs/persisted-state-pattern.md`.
          {...(persistKey ? { persistKey } : {})}
          {...(persistTabId ? { persistTabId } : {})}
          emptyState={<p className="text-sm text-muted-foreground">No questions in the bank.</p>}
          boardGroupByColumnOptions={[...LIBRARY_BOARD_GROUP_OPTIONS]}
          renderFilterOptionValue={renderFilterOptionValue}
          syncedSearchFromUrl={searchLanding ? undefined : urlListSearch}
          listAriaLabel={listAriaLabel}
          listEmptyState="No questions match your filters."
          pagination={pagination}
          onPaginationChange={onPaginationChange}
          showViewCounts={showViewCounts}
          onShowViewCountsChange={onShowViewCountsChange}
          paginationInitialPageSize={paginationInitialPageSize}
          paginationPageSizeOptions={paginationPageSizeOptions}
          embeddedPreview={embeddedPreview}
          embeddedPreviewRowLimit={embeddedPreviewRowLimit}
          embeddedPreviewExpanded={embeddedPreviewExpanded}
          onEmbeddedPreviewExpandedChange={onEmbeddedPreviewExpandedChange}
          onEmbeddedPreviewViewMore={onEmbeddedPreviewViewMore}
          embeddedPreviewViewMoreLabel={embeddedPreviewViewMoreLabel}
          renderListRow={row => (
            <LibraryListRowCard row={row} onToggleFavorite={toggleFavorite} />
          )}
          // Structured bulkActions (Polaris parity) win when the consumer passes them.
          // Falls back to the single Export slot for callers that have not opted in yet.
          bulkActions={showBulkActions ? bulkActions : undefined}
          bulkActionsSlot={
            showBulkActions && !bulkActions
              ? selected => {
                  if (selected.size === 0) return null
                  return (
                    <>
                      <span className="sr-only">{selected.size} selected</span>
                      <Tip label="Export selection (demo)">
                        <Button size="sm" variant="outline" type="button">
                          <i className="fa-light fa-arrow-down-to-line" aria-hidden="true" />
                          Export
                        </Button>
                      </Tip>
                    </>
                  )
                }
              : undefined
          }
          renderers={renderers}
          handleRef={ref}
          creatingViewType={creatingViewType}
          creatingViewName={creatingViewName}
          onCreatingViewNameChange={onCreatingViewNameChange}
          onCancelCreation={onCancelCreation}
          onCommitCreation={onCommitCreation}
        />
        <LibraryNewFolderSheet
          open={newFolderOpen}
          onOpenChange={setNewFolderOpen}
          parentFolderId={customizingFolder?.parentId ?? newFolderParentId}
          customizingFolder={customizingFolder}
          onCreated={(newFolder) => {
            if (customizingFolder) {
              onFoldersChange(prev =>
                prev.map(f =>
                  f.id === customizingFolder.id
                    ? { ...f, name: newFolder.name, icon: newFolder.icon, colorKey: newFolder.colorKey }
                    : f,
                ),
              )
              setCustomizingFolder(null)
            } else {
              onFoldersChange(prev => [
                ...prev,
                {
                  id: nextDemoFolderId(),
                  name: newFolder.name,
                  icon: newFolder.icon,
                  colorKey: newFolder.colorKey,
                  parentId: newFolder.parentId,
                },
              ])
            }
            setNewFolderOpen(false)
          }}
        />
      </>
    )
  },
)

LibraryTable.displayName = "LibraryTable"

/** Column defs for catalog / docs previews — same cells as the live Library hub. */
export function buildLibraryHubColumnDefs(
  items: LibraryItem[],
  onToggleFavorite: (row: LibraryItem) => void,
): ColumnDef<LibraryItem>[] {
  return buildLibraryColumns(items, { onToggleFavorite })
}
