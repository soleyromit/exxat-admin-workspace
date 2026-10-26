"use client"

/**
 * One frame for every skills library option set (list template T1, docs/knowledge/design/skill-setup-journey/01 section 2):
 * - Title zone: "Skills", ONE filled primary "Add a skill" at the top right, and one outline "More" menu that holds the
 *   many-at-once routes: phase 1 first (add several by name, start a new list), then phase 2 tagged Later (import a file,
 *   copy from a starter library).
 * - One banner slot under the title: the result of the last action, or else the "not configured" warning (said once,
 *   hidden on the Not configured tab where the badge already says it).
 * - Status tabs that carry the counts (no KPI strip), with the toolbar on the same row.
 * - Loading, empty and error states in the place of the region they replace.
 * The status words live in STATUS_META (lib/lab/library.ts); the counts come from countLibrary over the shared store.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { LabLocalBanner as LocalBanner } from "@/components/lab/lab-bar/lab-banner"
import { StatusBadge } from "@exxatdesignux/ui"
import { Tabs, TabsContent, TabsCountBadge, TabsList, TabsTrigger } from "@exxatdesignux/ui/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@exxatdesignux/ui/components/ui/dropdown-menu"
import { PageFrame } from "@/components/skills/page-header"
import { LaterBadge } from "@/components/lab/import/sample-badge"
import {
  LIBRARY_TABS,
  STATUS_META,
  configureHref,
  importHref,
  isLibraryTab,
  newListHref,
  starterHref,
  tabCount,
  type LibraryCounts,
  type LibraryStatus,
  type LibraryTab,
} from "@/lib/lab/library"
import { aNoun, capitalize, countSkills, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import type { LibraryApi } from "./use-library"
import { useTerms } from "./use-terms"

/** Names inside the library table, tree and board: the shared hover-underline link (consistency audit item 7). */
export { LINK_IN_TABLE as LINK } from "@/components/lab/link-styles"

/** "Add several by name": bringing in a list is the import step, in the reviewer's option set. */
export const addSeveralHref = "/lab/admin/import-ai-review"

export function LibraryStatusBadge({ status }: { status: LibraryStatus }) {
  const m = STATUS_META[status]
  return <StatusBadge label={m.short} tone={m.tone} icon={m.icon} size="sm" surface="table" />
}

/**
 * Title-zone actions. `primaryElsewhere` steps "Add a skill" down to outline while a sheet or panel on the page shows its
 * own filled primary, so the screen never carries two (rule L2).
 */
export function LibraryActions({ onAdd, onAddSeveral, primaryElsewhere = false }: { onAdd: () => void; onAddSeveral?: () => void; primaryElsewhere?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" size="sm">More</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          {/* Phase 1 first (CALL 10-26): the one-time bulk add by name, then a new list. Phase 2 routes sit under the rule,
              each tagged Later; they stay reachable, nothing is removed. */}
          {onAddSeveral ? (
            <DropdownMenuItem onSelect={onAddSeveral}>Add several by name (bulk add)</DropdownMenuItem>
          ) : (
            <DropdownMenuItem asChild>
              <Link href={addSeveralHref}>Add several by name (bulk add)</Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link href={newListHref}>Start a new list</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={importHref} className="flex w-full items-center justify-between gap-2">
              Import a file
              <LaterBadge />
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={starterHref} className="flex w-full items-center justify-between gap-2">
              Copy from a starter library
              <LaterBadge />
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button type="button" variant={primaryElsewhere ? "outline" : "default"} size="sm" onClick={onAdd} data-add-skill-trigger>
        {`Add ${aNoun()}`}
      </Button>
    </div>
  )
}

/** Writes or removes one URL param without a scroll jump. */
export function useUrlParam(name: string): [string | null, (v: string | null) => void] {
  const router = useRouter()
  const pathname = usePathname() ?? ""
  const params = useSearchParams()
  const value = params?.get(name) ?? null
  const set = React.useCallback((v: string | null) => {
    const q = new URLSearchParams(window.location.search)
    if (v) q.set(name, v)
    else q.delete(name)
    const s = q.toString()
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false })
  }, [name, pathname, router])
  return [value, set]
}

/** The status tab lives in the URL (?status=), so a filtered library can be linked, reloaded and reached with Back. */
export function useStatusTab(): [LibraryTab, (t: LibraryTab) => void] {
  const [raw, set] = useUrlParam("status")
  const tab: LibraryTab = isLibraryTab(raw) ? raw : "all"
  const change = React.useCallback((t: LibraryTab) => set(t === "all" ? null : t), [set])
  return [tab, change]
}

/** The record the detail panel shows (?skill=), so a peeked skill survives reload and can be shared. */
export function useOpenSkill(): [string | null, (id: string | null) => void] {
  return useUrlParam("skill")
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
    <Tabs value={value} onValueChange={(v) => isLibraryTab(v) && onChange(v)} className="flex flex-col gap-3">
      {/* The DS line tablist wraps itself in a full-width sticky subheader; here it shares its row with the toolbar, so the
          subheader takes the remaining width (its overflow ladder then measures the real space) and the row owns the rule. */}
      {/* Below 1280 px the toolbar drops under the tabs (right aligned), so all five tabs keep their labels at 1024. */}
      <div className="flex flex-col gap-2 xl:flex-row xl:items-end xl:gap-4 xl:border-b xl:border-border xl:[&>[data-slot=tabs-sticky-subheader]]:w-auto xl:[&>[data-slot=tabs-sticky-subheader]]:min-w-0 xl:[&>[data-slot=tabs-sticky-subheader]]:flex-1 xl:[&>[data-slot=tabs-sticky-subheader]]:border-b-0">
        <TabsList variant="line" ariaLabel={`${capitalize(skillNounPlural())} by status`}>
          {LIBRARY_TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
              <TabsCountBadge count={tabCount(counts, t.value)} />
            </TabsTrigger>
          ))}
        </TabsList>
        {toolbar ? <div className="flex shrink-0 items-center justify-end gap-2 xl:pb-1">{toolbar}</div> : null}
      </div>
      <TabsContent value={value} className="mt-0">
        {children}
      </TabsContent>
    </Tabs>
  )
}

/**
 * The one banner under the title. A result (added, deactivated, copied) wins; otherwise the hard stop for unconfigured
 * skills is said here once, with the next one to configure as its action. Hidden on the Not configured tab.
 */
export function LibraryBanner({ api, tab }: { api: LibraryApi; tab?: LibraryTab }) {
  const b = api.banner
  if (b) {
    return (
      <div role="status" aria-live="polite" data-region="banner">
        <LocalBanner variant={b.variant} title={b.title} dismissible onDismiss={() => api.setBanner(null)} action={b.action}>
          {b.body}
        </LocalBanner>
      </div>
    )
  }
  const n = api.counts.notConfigured
  if (!n || tab === "not-configured" || !api.hydrated || api.demo) return null
  const next = api.rows.find((r) => r.status === "not-configured")
  return (
    <div data-region="banner">
      {/* The action only: the "Not configured" tab already carries the figure, so the banner does not repeat it as a title
          (UX critique 2026-10-26, say it once). The action opens the first one; the configure page moves to the next. */}
      <LocalBanner variant="warning" action={next ? { label: `Configure ${n.toLocaleString("en-US")} next`, href: configureHref(next.id) } : undefined} data-not-configured-banner>
        {`${capitalize(skillNounPlural())} that are not configured cannot be sent or mapped.`}
      </LocalBanner>
    </div>
  )
}

/** Skeleton in the final layout: the tab row, then table rows at 48 px. */
export function LibraryLoading() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading the library" className="flex flex-col gap-3" data-loading>
      <span className="sr-only">Loading the library</span>
      <div className="flex items-end justify-between gap-4 border-b border-border pb-2">
        <div className="flex gap-6">
          {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} aria-hidden="true" className="h-6 w-24" />)}
        </div>
        <Skeleton aria-hidden="true" className="h-8 w-48" />
      </div>
      {Array.from({ length: 10 }, (_, i) => <Skeleton key={i} aria-hidden="true" className="h-12 w-full" />)}
    </div>
  )
}

/**
 * Empty library: the phase 1 ways in first (add one, add several by name), import second and tagged Later. Same box as
 * EmptyBlock; it needs three actions, so it composes the box here instead of widening the shared one-action component.
 * Every action is outline: the page's one filled primary stays "Add a skill" in the title zone.
 */
export function LibraryEmpty({ onAdd, onAddSeveral }: { onAdd?: () => void; onAddSeveral?: () => void }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-lg border border-dashed border-border p-6" data-region="empty">
      <h2 className="text-base font-semibold text-foreground">{`Your ${skillNounPlural()} library is empty`}</h2>
      <p className="max-w-prose text-sm text-muted-foreground">{`Add one ${skillNoun()} at a time, or several by name at once.`}</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        {onAdd ? <Button type="button" variant="outline" size="sm" onClick={onAdd}>{`Add ${aNoun()}`}</Button> : null}
        {onAddSeveral ? (
          <Button type="button" variant="outline" size="sm" onClick={onAddSeveral}>Add several by name</Button>
        ) : (
          <Button asChild variant="outline" size="sm"><Link href={addSeveralHref}>Add several by name</Link></Button>
        )}
        <Button asChild variant="ghost" size="sm">
          <Link href={importHref} className="inline-flex items-center gap-2">
            Import a file
            <LaterBadge />
          </Link>
        </Button>
      </div>
    </div>
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
    <LocalBanner variant="error" title="The library did not load" retry={{ label: "Try again", onClick: retry }}>
      Nothing was changed. Check your connection and try again.
    </LocalBanner>
  )
}

/**
 * Page frame plus the demo states. `children` render only when there is data; `overlays` (sheets, dialogs) always.
 * Every option set uses this frame, so the title, the action placement and the banner slot are identical across sets.
 */
export function LibraryFrame({ api, tab, onAdd, onAddSeveral, primaryElsewhere, overlays, children, pageType = "list" }: {
  api: LibraryApi
  tab?: LibraryTab
  onAdd: () => void
  onAddSeveral?: () => void
  primaryElsewhere?: boolean
  overlays?: React.ReactNode
  children: React.ReactNode
  pageType?: "list" | "split"
}) {
  // The title follows the program's noun (Settings > Naming); the hook re-renders the frame when it changes.
  const terms = useTerms()
  const title = capitalize(terms.skillNounPlural)
  const actions = <LibraryActions onAdd={onAdd} onAddSeveral={onAddSeveral} primaryElsewhere={primaryElsewhere} />
  let body: React.ReactNode = children
  if (!api.hydrated || api.demo === "loading") body = <LibraryLoading />
  else if (api.demo === "error") body = <LibraryError />
  else if (api.rows.length === 0) body = <LibraryEmpty onAdd={onAdd} onAddSeveral={onAddSeveral} />
  return (
    <div data-page-type={pageType} className="flex w-full flex-col">
      <PageFrame title={title} actions={actions}>
        <LibraryBanner api={api} tab={tab} />
        {body}
        {overlays}
      </PageFrame>
    </div>
  )
}
