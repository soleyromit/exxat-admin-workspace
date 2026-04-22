"use client"

/**
 * ListPageTemplate — reusable template for any list-based page.
 *
 * Provides: page header slot, optional key metrics, tabbed views
 * (table/list/board/dashboard) with add/remove/configure per-tab,
 * and an export drawer.
 *
 * Usage:
 *   <ListPageTemplate
 *     header={<MyPageHeader />}
 *     metrics={<KeyMetrics ... />}
 *     defaultTabs={DEFAULT_TABS}
 *     renderContent={(tab) => <MyTable members={MOCK_ROWS} view={tab.viewType} />}
 *   />
 *
 * Connected views (table | list | board | dashboard) must share one `useTableState`
 * and pass `tableState.rows` into non-table surfaces — see `docs/data-views-pattern.md`
 * and `AGENTS.md` §4.
 *
 * View chrome is shared with `ViewSegmentedControl` / `viewSegmentedToolbarClass` in
 * `@/components/ui/view-segmented-control` and re-exported from `@/components/data-views`.
 */

import * as React from "react"
import { cn }    from "@/lib/utils"
import { Tip }   from "@/components/ui/tip"
import { ExportDrawer } from "@/components/export-drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Shortcut,
} from "@/components/ui/dropdown-menu"
import type { DataListViewType } from "@/lib/data-list-view"
import { DATA_LIST_VIEW_TILES } from "@/lib/data-list-view"
import {
  createListPageEditViewHandler,
  type OpenTablePropertiesHandle,
} from "@/lib/list-page-table-properties"
import {
  viewSegmentedToolbarClass,
  viewSegmentedButtonClass,
} from "@/components/ui/view-segmented-control"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ViewType = DataListViewType

/** Same labels/icons as Properties drawer `SelectionTileGrid` — single source in `DATA_LIST_VIEW_TILES`. */
export const VIEW_TYPES: { type: ViewType; label: string; icon: string }[] = DATA_LIST_VIEW_TILES.map(t => ({
  type: t.value,
  label: t.label,
  icon: t.icon,
}))

export interface FilterOption {
  id: string
  label: string
}

export interface ViewTab {
  id: string
  label: string
  viewType: ViewType
  icon: string
  /** Optional filter key for lifecycle or category-based filtering */
  filterId: string
}

export interface ListPageTemplateProps {
  /** Page header — rendered above metrics */
  header: React.ReactNode
  /** Optional metrics strip — rendered below header */
  metrics?: React.ReactNode
  /** Whether to show metrics (controlled externally) */
  showMetrics?: boolean
  /** Initial tabs (uncontrolled mode) */
  defaultTabs: ViewTab[]
  /**
   * Controlled tabs — when all four are provided, tab state is owned by the parent
   * (e.g. for localStorage). Otherwise `defaultTabs` + internal state are used.
   */
  tabs?: ViewTab[]
  onTabsChange?: (tabs: ViewTab[]) => void
  activeTabId?: string
  onActiveTabChange?: (id: string) => void
  /** Filter options per tab (e.g. All, Upcoming, Ongoing, Completed) */
  filterOptions?: FilterOption[]
  /** Label for the filter sub-menu (default: "Filter") */
  filterLabel?: string
  /** Get count for a tab's filter (for badge) */
  getTabCount?: (filterId: string) => number
  /** Render the content for the active tab */
  renderContent: (tab: ViewTab, updateTab: (patch: Partial<ViewTab>) => void) => React.ReactNode
  /** Export drawer props */
  exportOpen?: boolean
  onExportOpenChange?: (open: boolean) => void
  /** Row count for export; if omitted, uses `getTabCount(activeTab.filterId)` when provided */
  exportTotalRows?: number
  /**
   * Tab menu — “Edit” (e.g. open table properties). Parent can switch to table view first, then call ref.
   * Overrides `tablePropertiesRef` when both are set.
   */
  onEditView?: (tab: ViewTab, helpers: { updateTab: (patch: Partial<ViewTab>) => void }) => void
  /**
   * Ref to the active tab’s table surface (`openPropertiesDrawer`). Wires “View → Edit” to
   * `TablePropertiesDrawer` when `onEditView` is omitted.
   */
  tablePropertiesRef?: React.RefObject<OpenTablePropertiesHandle | null>
}

/** Collision-proof id for a dynamically-added tab. Module-level counters reset
 *  on HMR while React state survives, so we derive from a timestamp + random. */
function makeTabId(type: string): string {
  const rand = Math.random().toString(36).slice(2, 8)
  return `${type}-${Date.now().toString(36)}-${rand}`
}

/** Count pill on the views toolbar — color by lifecycle/status filter (WCAG: dark text on light inactive; light text on solid active). */
export function viewToolbarCountBadgeClass(filterId: string, isActive: boolean): string {
  const palettes: Record<string, { active: string; inactive: string }> = {
    all: {
      active: "bg-slate-600 text-white dark:bg-slate-500",
      inactive: "bg-slate-100 text-slate-800 dark:bg-slate-800/70 dark:text-slate-100",
    },
    upcoming: {
      active: "bg-amber-600 text-white",
      inactive: "bg-amber-100 text-amber-950 dark:bg-amber-950/45 dark:text-amber-100",
    },
    ongoing: {
      active: "bg-blue-600 text-white",
      inactive: "bg-blue-100 text-blue-950 dark:bg-blue-950/45 dark:text-blue-100",
    },
    completed: {
      active: "bg-emerald-600 text-white",
      inactive: "bg-emerald-100 text-emerald-950 dark:bg-emerald-950/45 dark:text-emerald-100",
    },
  }
  const p = palettes[filterId] ?? palettes.all
  return isActive ? p.active : p.inactive
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function ListPageTemplate({
  header,
  metrics,
  showMetrics = true,
  defaultTabs,
  tabs: tabsProp,
  onTabsChange,
  activeTabId: activeTabIdProp,
  onActiveTabChange,
  getTabCount,
  renderContent,
  exportOpen = false,
  onExportOpenChange,
  exportTotalRows = 0,
  onEditView,
  tablePropertiesRef,
}: ListPageTemplateProps) {
  const controlled =
    tabsProp !== undefined &&
    onTabsChange !== undefined &&
    activeTabIdProp !== undefined &&
    onActiveTabChange !== undefined

  const [internalTabs, setInternalTabs]               = React.useState<ViewTab[]>(defaultTabs)
  const [internalActiveId, setInternalActiveId] = React.useState(defaultTabs[0]?.id ?? "")

  const tabs               = controlled ? tabsProp : internalTabs
  const setTabsState = React.useCallback(
    (action: React.SetStateAction<ViewTab[]>) => {
      if (controlled) {
        const next = typeof action === "function" ? action(tabsProp!) : action
        onTabsChange!(next)
      } else {
        setInternalTabs(action)
      }
    },
    [controlled, onTabsChange, tabsProp, setInternalTabs],
  )
  const activeTabId        = controlled ? activeTabIdProp : internalActiveId
  const setActiveTabId     = controlled ? onActiveTabChange : setInternalActiveId
  const [renameOpen, setRenameOpen]   = React.useState(false)
  const [renameValue, setRenameValue] = React.useState("")
  const [renameTabId, setRenameTabId] = React.useState<string | null>(null)
  const [reviewOpen, setReviewOpen]   = React.useState(false)
  const [reviewTab, setReviewTab]     = React.useState<ViewTab | null>(null)

  const activeTab = tabs.find(t => t.id === activeTabId) ?? tabs[0]

  const editViewFromRef = React.useMemo(
    () => (tablePropertiesRef ? createListPageEditViewHandler(tablePropertiesRef) : undefined),
    [tablePropertiesRef]
  )
  const resolvedOnEditView = onEditView ?? editViewFromRef

  function addView(type: ViewType) {
    const def = VIEW_TYPES.find(d => d.type === type)!
    const count = tabs.filter(t => t.viewType === type).length
    const id = makeTabId(type)
    const label = count === 0 ? def.label : `${def.label} ${count + 1}`
    const newTab: ViewTab = { id, label, viewType: type, icon: def.icon, filterId: "all" }
    setTabsState(prev => [...prev, newTab])
    setActiveTabId(id)
  }

  function removeTab(id: string, e: React.MouseEvent | React.KeyboardEvent) {
    e.stopPropagation()
    setTabsState(prev => {
      const next = prev.filter(t => t.id !== id)
      if (activeTabId === id && next.length > 0) {
        const idx = Math.max(0, prev.findIndex(t => t.id === id) - 1)
        setActiveTabId(next[Math.min(idx, next.length - 1)].id)
      }
      return next
    })
  }

  function updateTab(id: string, patch: Partial<ViewTab>) {
    setTabsState(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t))
  }

  function duplicateTab(tab: ViewTab) {
    const id = makeTabId(tab.viewType)
    const newTab: ViewTab = {
      id,
      label: `Copy of ${tab.label}`,
      viewType: tab.viewType,
      icon: tab.icon,
      filterId: tab.filterId,
    }
    setTabsState(prev => [...prev, newTab])
    setActiveTabId(id)
  }

  function openRename(tab: ViewTab) {
    setRenameTabId(tab.id)
    setRenameValue(tab.label)
    setRenameOpen(true)
  }

  function commitRename() {
    if (!renameTabId) return
    const v = renameValue.trim()
    if (v) updateTab(renameTabId, { label: v })
    setRenameOpen(false)
    setRenameTabId(null)
  }

  return (
    <>
      {VIEW_TYPES.slice(0, 9).map((v, i) => (
        <Shortcut
          key={v.type}
          keys={`⌘⇧${i + 1}`}
          onInvoke={() => addView(v.type)}
        />
      ))}
      {activeTab && (
        <>
          <Shortcut keys="F2" onInvoke={() => openRename(activeTab)} />
          <Shortcut
            keys="⌘E"
            disabled={!resolvedOnEditView}
            onInvoke={() => resolvedOnEditView?.(activeTab, { updateTab: p => updateTab(activeTab.id, p) })}
          />
          <Shortcut keys="⌘D" onInvoke={() => duplicateTab(activeTab)} />
          <Shortcut keys="⌘I" onInvoke={() => { setReviewTab(activeTab); setReviewOpen(true) }} />
          <Shortcut
            keys="⌘⌫"
            disabled={tabs.length <= 1}
            onInvoke={(e) => removeTab(activeTab.id, e as unknown as React.KeyboardEvent)}
          />
        </>
      )}
      {header}

      {showMetrics && metrics}

      {/* ── Views toolbar (not tablist: settings/close are not tabs — WCAG 1.3.1 / ARIA) ── */}
      <div className="mt-3 flex items-center gap-1 px-4 lg:px-6 overflow-x-auto shrink-0">
        <div
          role="toolbar"
          aria-label="Views"
          data-slot="view-segmented-toolbar"
          className={viewSegmentedToolbarClass()}
        >
          {tabs.map(tab => {
            const isActive = tab.id === activeTabId
            const isOnly   = tabs.length === 1
            const count    = getTabCount?.(tab.filterId)
            return (
              <div key={tab.id} className="group relative inline-flex items-center">
                <button
                  type="button"
                  aria-pressed={isActive}
                  data-slot="view-segmented-item"
                  onClick={() => setActiveTabId(tab.id)}
                  className={viewSegmentedButtonClass(isActive)}
                >
                  <i className={`fa-light ${tab.icon} text-xs`} aria-hidden="true" />
                  {tab.label}
                  {count !== undefined && (
                    <span
                      data-slot="view-toolbar-count"
                      className={cn(
                        "text-xs tabular-nums rounded-full px-1 py-px min-w-[1.125rem] text-center font-semibold",
                        viewToolbarCountBadgeClass(tab.filterId, isActive),
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>

                {/* Tab settings — min 24×24px touch target (WCAG 2.5.8) */}
                {isActive && (
                  <DropdownMenu>
                    <Tip label="View settings" side="bottom">
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center size-6 min-h-6 min-w-6 rounded text-muted-foreground hover:text-interactive-hover-foreground transition-colors ml-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label="View settings"
                        >
                          <i className="fa-light fa-chevron-down text-xs" aria-hidden="true" />
                        </button>
                      </DropdownMenuTrigger>
                    </Tip>
                    <DropdownMenuContent align="start" className="w-56">
                      <DropdownMenuLabel className="text-xs text-muted-foreground">
                        View: {VIEW_TYPES.find(v => v.type === tab.viewType)?.label}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        shortcut="F2"
                        onSelect={() => openRename(tab)}
                      >
                        <i className="fa-light fa-pen text-xs" aria-hidden="true" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={!resolvedOnEditView}
                        shortcut="⌘E"
                        onSelect={() =>
                          resolvedOnEditView?.(tab, { updateTab: patch => updateTab(tab.id, patch) })
                        }
                      >
                        <i className="fa-light fa-sliders text-xs" aria-hidden="true" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem shortcut="⌘D" onSelect={() => duplicateTab(tab)}>
                        <i className="fa-light fa-copy text-xs" aria-hidden="true" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        shortcut="⌘I"
                        onSelect={() => { setReviewTab(tab); setReviewOpen(true) }}
                      >
                        <i className="fa-light fa-clipboard-list text-xs" aria-hidden="true" />
                        Review view
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />
                      {!isOnly && (
                        <DropdownMenuItem
                          shortcut="⌘⌫"
                          onSelect={(e) => removeTab(tab.id, e as unknown as React.KeyboardEvent)}
                          className="text-destructive focus:text-destructive"
                        >
                          <i className="fa-light fa-trash text-xs" aria-hidden="true" />
                          Remove view
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* Close on inactive tabs — native button + 24px min target (WCAG 2.5.8) */}
                {!isActive && !isOnly && (
                  <Tip side="bottom" label={`Remove ${tab.label} view`}>
                    <button
                      type="button"
                      aria-label={`Remove ${tab.label} view`}
                      onClick={e => removeTab(tab.id, e)}
                      className="ml-0.5 inline-flex items-center justify-center size-6 min-h-6 min-w-6 rounded transition-opacity opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:text-destructive focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <i className="fa-light fa-xmark text-xs" aria-hidden="true" />
                    </button>
                  </Tip>
                )}
              </div>
            )
          })}
        </div>

        {/* Add view */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="shrink-0 text-muted-foreground"
            >
              <i className="fa-light fa-plus text-sm" aria-hidden="true" />
              Add view
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuLabel className="text-xs">Add a view</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {VIEW_TYPES.map((v, i) => (
              <DropdownMenuItem
                key={v.type}
                shortcut={i < 9 ? `⌘⇧${i + 1}` : undefined}
                onClick={() => addView(v.type)}
              >
                <i className={`fa-light ${v.icon}`} aria-hidden="true" />
                {v.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Content — keyed by tab so each view tab owns its height (no stale min-height). ── */}
      {activeTab ? (
        <div key={activeTab.id} className="flex min-h-0 flex-col">
          {renderContent(activeTab, patch => updateTab(activeTab.id, patch))}
        </div>
      ) : null}

      {/* ── Export ──────────────────────────────────────────────── */}
      {onExportOpenChange && (
        <ExportDrawer
          open={exportOpen}
          onOpenChange={onExportOpenChange}
          totalRows={exportTotalRows ?? getTabCount?.(activeTab.filterId) ?? 0}
        />
      )}

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename view</DialogTitle>
            <DialogDescription>Enter a new name for this view.</DialogDescription>
          </DialogHeader>
          <Input
            className="mt-3 h-9 text-sm"
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") commitRename() }}
            autoFocus
            aria-label="View name"
          />
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={commitRename}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={reviewOpen && !!reviewTab}
        onOpenChange={(open) => {
          setReviewOpen(open)
          if (!open) setReviewTab(null)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review view</DialogTitle>
            <DialogDescription>Summary of this view’s configuration.</DialogDescription>
          </DialogHeader>
          {reviewTab && (
            <dl className="mt-2 space-y-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-border pb-2">
                <dt className="text-muted-foreground">Name</dt>
                <dd className="font-medium text-foreground text-end">{reviewTab.label}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-border pb-2">
                <dt className="text-muted-foreground">View type</dt>
                <dd className="text-foreground text-end">{VIEW_TYPES.find(v => v.type === reviewTab.viewType)?.label}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-border pb-2">
                <dt className="text-muted-foreground">Lifecycle filter</dt>
                <dd className="text-foreground text-end capitalize">{reviewTab.filterId}</dd>
              </div>
              {getTabCount && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Row count</dt>
                  <dd className="tabular-nums text-foreground text-end">{getTabCount(reviewTab.filterId)}</dd>
                </div>
              )}
            </dl>
          )}
          <DialogFooter>
            <Button type="button" size="sm" onClick={() => setReviewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
