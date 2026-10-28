"use client"

/**
 * One frame for every skills library option set (list template T1, docs/knowledge/design/skill-setup-journey/01 section 2):
 * - Title zone: "Skills" and ONE split button at the top right: "Add a skill", plus a chevron menu of every way to add
 *   (one at a time, several by name, Bulk upload tagged Later; in the lab only, copy from a starter library).
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
import { ButtonGroup, ButtonGroupSeparator } from "@exxatdesignux/ui/components/ui/button-group"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@exxatdesignux/ui/components/ui/dropdown-menu"
import { PageFrame } from "@/components/skills/page-header"
import { LaterBadge } from "@/components/lab/import/sample-badge"
import { usePresent } from "@/components/lab/lab-bar/present"
import { withFrom } from "@/lib/lab/return-to"
import { TYPE } from "@/components/lab/type-scale"
import {
  LIBRARY_TABS,
  STATUS_META,
  importHref,
  isLibraryTab,
  starterHref,
  tabCount,
  type LibraryCounts,
  type LibraryStatus,
  type LibraryTab,
} from "@/lib/lab/library"
import { aNoun, capitalize, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import type { LibraryApi } from "./use-library"
import { useTerms } from "./use-terms"

/** Names inside the library table, tree and board: the shared hover-underline link (consistency audit item 7). */
export { LINK_IN_TABLE as LINK } from "@/components/lab/link-styles"

/** "Add several by name": bringing in a list is the import step, in the reviewer's option set. */
export const addSeveralHref = "/lab/admin/import-ai-review"

/**
 * The status in the requirement's words, plus a quiet "Draft saved" when a Not configured skill has a configuration saved part way
 * (decision D-X31; REQ IM-10 "a part-configured library is a visible state of progress"). The draft is a note, not a fourth status.
 */
export function LibraryStatusBadge({ status, draft = false }: { status: LibraryStatus; draft?: boolean }) {
  const m = STATUS_META[status]
  return (
    // Chip, then the draft note stacked under it with tight spacing: a wrap-when-narrow row put the note beside the chip
    // in a wide cell and under it in a narrow one, so rows changed height with the column width.
    <span className="inline-flex flex-col items-start gap-0.5">
      <StatusBadge label={m.short} tone={m.tone} icon={m.icon} size="sm" surface="table" />
      {draft && status === "not-configured" ? <span className="text-xs text-muted-foreground" data-draft-note>Draft saved</span> : null}
    </span>
  )
}

/** One way to add skills, as a menu row: a leading icon, the label, and one muted line that says what it takes. */
function AddWayRow({ icon, label, description, later = false }: { icon: string; label: string; description: string; later?: boolean }) {
  return (
    <>
      <i className={`fa-light ${icon} mt-0.5 w-4 text-center text-muted-foreground`} aria-hidden="true" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-2">
          <span className={TYPE.label}>{label}</span>
          {later ? <LaterBadge /> : null}
        </span>
        <span className={TYPE.meta}>{description}</span>
      </span>
    </>
  )
}

const ADD_WAY_ITEM = "items-start gap-3 px-2 py-2"

/**
 * Title-zone actions: ONE split button (Romit 2026-10-27, "can we do a better UI for this?"). The main part adds one skill;
 * the chevron opens every way to add, each with what it takes: one at a time, several by name (a sheet on this page), or a
 * file (Bulk upload, opened with ?from=skills so its breadcrumb and Cancel lead back here, lib/lab/return-to.ts).
 * "New group of skills" is not here: it lives on Skills > Groups of skills, which has its own action and keeps ?new=1.
 * "Copy from a starter library" is Prism-supplied content (REQ SL-01, open decision) and this menu is its only link, so it
 * stays as the last row in the lab, under a rule, and is hidden when presenting.
 * `primaryElsewhere` steps the whole button down to outline while a sheet or panel shows its own primary (rule L2).
 */
export function LibraryActions({ onAdd, onAddSeveral, primaryElsewhere = false }: { onAdd: () => void; onAddSeveral?: () => void; primaryElsewhere?: boolean }) {
  const { present } = usePresent()
  const variant = primaryElsewhere ? "outline" : "default"
  const several = <AddWayRow icon="fa-list" label="Add several" description="Paste a list of names" />
  return (
    <ButtonGroup aria-label={`Add ${skillNounPlural()}`} data-add-menu>
      <Button type="button" variant={variant} size="sm" onClick={onAdd} data-add-skill-trigger>
        {`Add ${aNoun()}`}
      </Button>
      {/* Filled halves need a visible divider; outline halves already share a border. */}
      {primaryElsewhere ? null : <ButtonGroupSeparator className="bg-primary-foreground/30" />}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant={variant} size="sm" className="px-2" aria-label={`More ways to add ${skillNounPlural()}`} data-add-menu-trigger>
            <i className="fa-light fa-chevron-down text-xs" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuItem className={ADD_WAY_ITEM} onSelect={onAdd}>
            <AddWayRow icon="fa-plus" label={`Add ${aNoun()}`} description="One at a time, with details" />
          </DropdownMenuItem>
          {onAddSeveral ? (
            <DropdownMenuItem className={ADD_WAY_ITEM} onSelect={onAddSeveral}>{several}</DropdownMenuItem>
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
          {present ? null : (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem className={ADD_WAY_ITEM} asChild>
                <Link href={withFrom(starterHref, "skills")}>
                  <AddWayRow icon="fa-copy" label="Copy from a starter library" description={`Start from a ready-made set of ${skillNounPlural()}`} later />
                </Link>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
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
  // The standing "Skills not configured cannot be sent or mapped. Configure next" banner is removed for now (Romit
  // 2026-10-28, "Remove this for now"). The rule stays visible on the Not configured tab, the row chips and their tooltip
  // [REQ IM-09, IM-10]; the configure receipt still offers "Configure next".
  void tab
  return null
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
 * Empty library: the same three ways as the title-zone menu, with the same labels (Add a skill, Add several, Bulk upload),
 * so the empty page and the header never disagree. Same box as EmptyBlock; it needs three actions, so it composes the box
 * here. Every action is outline: the page's one filled primary stays the title-zone split button.
 */
export function LibraryEmpty({ onAdd, onAddSeveral }: { onAdd?: () => void; onAddSeveral?: () => void }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-lg border border-dashed border-border p-6" data-region="empty">
      <h2 className={TYPE.section}>{`Your ${skillNounPlural()} library is empty`}</h2>
      <p className={`max-w-prose ${TYPE.helper}`}>{`Add one ${skillNoun()} with details, paste a list of names, or upload a PDF, Word or Excel file.`}</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
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
