"use client"

/**
 * Program-defined lists on DS Tabs with their counts (REQ SL-03 to SL-08; AUDIT T1 "no settings screen"), one component for two
 * pages (D-L21, Romit 2026-10-27: "why are categories and tags at Settings?"):
 * - scope "vocabulary": Categories and tags (admin/categories-tags A), its own page under Skills, Thursday step A2. Categories
 *   and tags are created, renamed, deactivated and deleted in the SHARED store (lib/v2/vocabulary.ts), so Add a skill offers
 *   the same list (SL-03 to SL-06).
 * - scope "program": Settings (admin/settings A): Clinical settings (site counts and what uses each), Evaluators (every person
 *   who signs, lab instructors included; components/lab/admin-a/evaluators-section.tsx, D-L24). Naming has no UI (D-L25).
 *
 * Regions (strategy/07 list budget, 4): header · tabs with "Add a {noun}" at their right end, which opens the name field beside it and stays where
 * it is as the form's submit · one toolbar row (search) · the DataTable. The form is a row above the table and not a row in it: the DS table sorts every row it holds and has no pinned row, so a draft row
 * would land anywhere in the sort, and a search would hide it. While the form is open a result sits under it, so a banner never moves the field, and the row pins under the page's top edge; rows added on
 * this visit lead the list, newest first, directly under the form. Delete is offered only while an entry is unused; otherwise the menu
 * names what uses it. The Status switch acts at once, with no dialog and no banner: it keeps an entry where it is already used
 * and marks it inactive there (SL-06). A skill count opens the Library filtered to it (map D5); a clinical setting's counts open
 * the list behind them with the same length. Results are one ResultBanner, in view wherever the page is scrolled, never a toast. A name typed
 * and not added is unsaved work: every way off it asks (map section E rule 6). A dialog from a row menu gives focus back to that row's menu.
 * URL: ?tab=, ?uses=, ?state=, ?q= (the search, so Back from a count finds it).
 */
import * as React from "react"
import { useEmbeddedStep } from "@/components/lab/layout/embedded"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useIsMobile } from "@exxatdesignux/ui/hooks/use-mobile"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { ToggleSwitch } from "@exxatdesignux/ui/components/ui/toggle-switch"
import { Tabs, TabsContent, TabsCountBadge, TabsList, TabsTrigger } from "@exxatdesignux/ui/components/ui/tabs"
import { Tip } from "@exxatdesignux/ui/components/ui/tip"
import { FilterBar } from "@exxatdesignux/ui/components/ui/filter-bar"
import { EmptyBlock } from "@/components/lab/empty-block"
import { SampleDataBadge } from "@/components/lab/import/sample-badge"
import { NUM_LINK } from "@/components/lab/link-styles"
import { fmt, plural } from "@/lib/v2/format"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import type { ColumnDef } from "@exxatdesignux/ui/components/data-table/types"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@exxatdesignux/ui/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@exxatdesignux/ui/components/ui/alert-dialog"
import { FloatingSheetPanelBody, FloatingSheetPanelContent, FloatingSheetPanelHeader, FloatingSheetPanelToolbar } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { FloatingSheetPanel } from "@/components/lab/shared/sheet"
import { PageFrame } from "@/components/skills/page-header"
import { useV2Hydrated, useV2State } from "@/lib/v2/react"
import { parseDemoState } from "@/lib/lab/dashboard"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { useClinicalSettingActions, useVocabularyActions, isVocabKind, RenameDialog, renamedText } from "@/components/lab/admin-b/use-vocabulary"
import { pageTitle, returnFocus } from "@/components/lab/shared/focus"
import { ResultBanner, type ResultBannerValue } from "@/components/lab/shared/result-banner"
import { writeUrlParam } from "@/components/lab/library/library-chrome"
import { DiscardChangesDialog, useLeaveGuard } from "@/components/lab/shared/unsaved-guard"
import { LAB_ADMIN, STATUS_META, normName } from "@/lib/lab/library"
import { EMPTY_SETTINGS, inactiveLast, rememberSeededVocabulary, SCOPE_SECTIONS, VOCABULARY_TITLE, categoryRows, clinicalSettingRows, instructorRows, isSettingsTab, scopeSection, sectionLabel, tagRows, usesOf, validateEntry, type SettingUse, type SettingsOverlay, type SettingsRow, type SettingsScope, type SettingsSection, type SettingsTab } from "@/lib/lab/settings"
import { aNoun, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { useTerms } from "@/components/lab/library/use-terms"
import { EvaluatorsSection } from "@/components/lab/admin-a/evaluators-section"
import { StudentGroupsCount, StudentGroupsSection } from "@/components/lab/admin-a/student-groups-section"
import { directory } from "@/lib/lab/evaluators"

const NOUN: Record<SettingsTab, string> = { categories: "category", tags: "tag", settings: "clinical setting", instructors: "lab instructor" }
const NOUNS: Record<SettingsTab, string> = { categories: "categories", tags: "tags", settings: "clinical settings", instructors: "lab instructors" }

/** The page's H1: "Categories and tags" for that page, the open section's name on Settings ("Clinical settings"). */
export const scopeTitle = (scope: SettingsScope, section: SettingsSection): string => (scope === "vocabulary" ? VOCABULARY_TITLE : sectionLabel(section))

/** Same height closed and open, as tall as the tabs beside it, so the primary does not move when the form opens and an error under the field only grows downward. */
const ADD_ROW = "ms-auto flex min-h-10 max-w-full items-center"
/** The second press of a double click: on the opener it would land on the submit now in its place; on Add or a switch it would do the job twice. */
const dropRepeatPress = (e: React.MouseEvent) => {
  if (e.detail < 2) return
  e.preventDefault()
  e.stopPropagation()
}
const PAGE_SCROLL_MARK = "labScrollTop"
const pagePort = () => document.querySelector<HTMLElement>("[data-page-scroll]")
/** Held on this history entry as a count link leaves, so only Back to this entry finds it. No URL, so Next's router keeps its own marks. */
const rememberPageScroll = () => {
  const y = pagePort()?.scrollTop
  if (y) window.history.replaceState({ ...window.history.state, [PAGE_SCROLL_MARK]: y }, "")
}

export function SettingsPage({ scope = "program" }: { scope?: SettingsScope }) {
  const data = useV2State()
  const hydrated = useV2Hydrated()
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname() ?? ""
  const demo = parseDemoState(params?.get("state"))
  const sections = SCOPE_SECTIONS[scope]
  const section = scopeSection(scope, params?.get("tab") ?? params?.get("list"))
  const tab: SettingsTab = section === "evaluators" || section === "student-groups" ? "settings" : section
  const terms = useTerms()
  const usesParam = params?.get("uses") ?? null
  const [overlay] = React.useState<SettingsOverlay>(EMPTY_SETTINGS)
  const [banner, setBanner] = React.useState<(ResultBannerValue & { atForm?: boolean }) | null>(null)
  const [deleting, setDeleting] = React.useState<SettingsRow | null>(null)
  const [createError, setCreateError] = React.useState<string | null>(null)
  // Local for the keystroke, written through to the URL: a controlled field cannot wait for the router's transition.
  const [query, setQueryState] = React.useState(() => params?.get("q") ?? "")
  const setQuery = (v: string) => {
    setQueryState(v)
    writeUrlParam("q", v || null)
  }
  const vocab = useVocabularyActions()
  const clinical = useClinicalSettingActions()
  const [renaming, setRenaming] = React.useState<SettingsRow | null>(null)
  const [creating, setCreating] = React.useState(false)
  // Rows switched on this visit hold their place until the list is next opened; the announcement stands in for the removed banner.
  const [held, setHeld] = React.useState<ReadonlySet<string>>(new Set<string>())
  const [announcement, setAnnouncement] = React.useState("")
  const addRef = React.useRef<HTMLButtonElement>(null)
  // Entries added on this visit: the "New" mark, which does not survive a reload, and what an empty demo list shows once it has an entry.
  const [fresh, setFresh] = React.useState<ReadonlySet<string>>(new Set<string>())
  // The height of a result that an error on the add field has replaced: held, so nothing below moves as the error comes and goes.
  const [band, setBand] = React.useState(0)
  const bannerAtForm = React.useRef<HTMLDivElement>(null)
  // A name typed and not yet added. Links, Back and reload go through the leave guard; Cancel, Esc and the tabs through `waiting`.
  const [typedDirty, setTypedDirty] = React.useState(false)
  const [waiting, setWaiting] = React.useState<(() => void) | null>(null)
  const leave = useLeaveGuard(typedDirty)
  // The row whose menu opened a dialog: focus returns to that menu, or to a neighbour's once the row is gone.
  const menuRow = React.useRef<string | null>(null)
  const backToRowMenu = (e: Event) => {
    e.preventDefault()
    returnFocus(menuRow.current ? document.querySelector(`[data-row-menu="${CSS.escape(menuRow.current)}"]`) : null)
  }

  // Back from a count link: the place in the list, once the table has drawn enough rows to hold it.
  React.useEffect(() => {
    if (!hydrated) return
    const state = window.history.state as Record<string, unknown> | null
    const y = Number(state?.[PAGE_SCROLL_MARK] ?? 0)
    if (!y) return
    const { [PAGE_SCROLL_MARK]: _used, ...rest } = state ?? {}
    window.history.replaceState(rest, "")
    let tries = 0
    let frame = 0
    const place = () => {
      const port = pagePort()
      if (port) port.scrollTop = y
      if ((!port || port.scrollTop < y - 1) && ++tries < 60) frame = requestAnimationFrame(place)
    }
    place()
    return () => cancelAnimationFrame(frame)
  }, [hydrated])

  const setParams = (p: Record<string, string | null>) => {
    const q = new URLSearchParams(params?.toString() ?? "")
    for (const [k, v] of Object.entries(p)) { if (v) q.set(k, v); else q.delete(k) }
    const s = q.toString()
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false })
  }

  const lists = React.useMemo(() => {
    const n = skillNoun()
    const ns = skillNounPlural()
    rememberSeededVocabulary(data)
    return { categories: categoryRows(data, overlay, n, ns), tags: tagRows(data, overlay, n, ns), settings: clinicalSettingRows(data, overlay, n, ns), instructors: instructorRows(data, overlay) }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- terms: the noun is read inside the row builders
  }, [data, overlay, terms])
  const evaluatorCount = React.useMemo(() => (scope === "program" ? directory(data).rows.length : 0), [data, scope])

  if (!hydrated || demo === "loading") {
    return (
      <PageFrame title={scope === "vocabulary" ? VOCABULARY_TITLE : "Settings"}>
        <div role="status" aria-busy="true" aria-label={scope === "vocabulary" ? "Loading categories and tags" : "Loading settings"} className="flex flex-col gap-3">
          <Skeleton aria-hidden="true" className="h-9 w-[28rem]" />
          <Skeleton aria-hidden="true" className="h-8 w-80" />
          {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} aria-hidden="true" className="h-12 w-full" />)}
        </div>
      </PageFrame>
    )
  }

  const freshKey = (t: SettingsTab, name: string) => `${t}|${normName(name)}`
  const shownCount = (t: SettingsTab) => (demo === "empty" ? lists[t].filter((r) => fresh.has(freshKey(t, r.name))).length : lists[t].length)
  const ordered: SettingsRow[] = demo === "empty" ? lists[tab].filter((r) => fresh.has(freshKey(tab, r.name))) : inactiveLast<SettingsRow>(lists[tab], held)
  // Added on this visit: first, the newest at the top, directly under the form, until the list is next opened. A column the admin sorts by still decides.
  const newest = [...fresh].reverse()
  const all = [
    ...ordered.filter((r) => fresh.has(freshKey(tab, r.name))).sort((a, b) => newest.indexOf(freshKey(tab, a.name)) - newest.indexOf(freshKey(tab, b.name))),
    ...ordered.filter((r) => !fresh.has(freshKey(tab, r.name))),
  ]
  const qq = query.trim().toLowerCase()
  const rows = qq ? all.filter((r) => r.name.toLowerCase().includes(qq) || String((r as SettingsRow & { email?: string }).email ?? "").toLowerCase().includes(qq)) : all
  // `isNew` is the DS row's tint as well as the chip: added on this visit only, so neither survives a reload.
  const marked = rows.map((r) => ({ ...r, isNew: fresh.has(freshKey(tab, r.name)) }))
  const names = lists[tab].map((r) => r.name)
  const unsavedNote = () => (clinical.saved() ? "" : " It could not be saved in this browser and will be lost on reload.")
  /**
   * The row is marked new and the result is said; the page does not scroll, so an admin adding several keeps the field. A search is the admin's own and stays as typed: when it hides the
   * new row, the result says so and offers the way to see it [INFER, recommendation; Romit may overrule].
   */
  const added = (name: string) => {
    const clean = name.trim()
    const title = `${clean} added.${unsavedNote()}`
    setFresh((f) => new Set(f).add(freshKey(tab, clean)))
    setBand(0)
    if (qq && !clean.toLowerCase().includes(qq)) {
      setBanner({
        variant: "success",
        title: `${clean} added. Your search hides it.${unsavedNote()}`,
        atForm: true,
        action: {
          label: "Clear search",
          onClick: () => {
            setQuery("")
            setBanner({ variant: "success", title, atForm: true })
            window.requestAnimationFrame(() => document.getElementById("settings-new")?.focus({ preventScroll: true }))
          },
        },
      })
    } else setBanner({ variant: "success", title, atForm: true })
  }
  /** Categories and tags write to lib/v2/vocabulary.ts, clinical settings to the program; both persist. Returns false when refused. */
  const add = (name: string): boolean => {
    const res = isVocabKind(tab) ? vocab.add(tab, name) : clinical.add(name)
    if (!res.ok) { reportCreateError(res.error); return false }
    added(name)
    return true
  }
  /** An error on the add field replaces whatever result was showing (map section E rule 10), in the same room: nothing moves as it comes or goes (F C8). */
  const reportCreateError = (e: string | null) => {
    setCreateError(e)
    if (!e || !banner) return
    if (bannerAtForm.current) setBand(bannerAtForm.current.offsetHeight)
    setBanner(null)
  }
  const toggle = (r: SettingsRow) => {
    setCreateError(null)
    const res = isVocabKind(tab) ? vocab.setActive(tab, r.id, !r.active) : clinical.setActive(r.name, !r.active)
    if (!res.ok) return setBanner({ variant: "info", title: res.error })
    setBanner(null)
    setHeld((h) => {
      const next = new Set(h)
      if (!next.delete(r.id)) next.add(r.id)
      return next
    })
    setAnnouncement(r.active ? `"${r.name}" is inactive. It stays where it is used, marked inactive, and is no longer offered.` : `"${r.name}" is active again.`)
  }
  const remove = (r: SettingsRow) => {
    const res = isVocabKind(tab) ? vocab.remove(tab, r.id) : clinical.remove(r.name)
    if (res.ok) {
      const at = rows.findIndex((x) => x.id === r.id)
      menuRow.current = (rows[at + 1] ?? rows[at - 1])?.name ?? null
    }
    setBanner(res.ok ? { variant: "success", title: `${r.name} deleted.${unsavedNote()}` } : { variant: "info", title: res.error })
    setDeleting(null)
  }
  const askRename = (r: SettingsRow) => { menuRow.current = r.name; setCreateError(null); setRenaming(r) }
  const askDelete = (r: SettingsRow) => { menuRow.current = r.name; setCreateError(null); setDeleting(r) }
  const closeCreate = () => {
    setCreating(false)
    setTypedDirty(false)
    setCreateError(null)
    setBand(0)
    window.requestAnimationFrame(() => addRef.current?.focus())
  }
  /** Cancel, Esc and the tabs: at once with nothing typed, otherwise after the question. */
  const afterAsking = (then: () => void) => {
    if (typedDirty) setWaiting(() => then)
    else then()
  }
  const dismissBanner = () => {
    setBanner(null)
    setBand(0)
    // Dismiss has gone with the banner: focus stays where the admin was working. Never the body.
    window.requestAnimationFrame(() => {
      if (document.activeElement !== document.body) return
      const to = document.getElementById("settings-new") ?? addRef.current ?? pageTitle()
      to?.focus({ preventScroll: true })
    })
  }
  const changeTab = (v: string) => {
    setBanner(null); setBand(0); setCreateError(null); setCreating(false); setTypedDirty(false); setHeld(new Set<string>()); setAnnouncement(""); setQueryState("")
    setParams({ tab: v === sections[0] ? null : v, list: null, uses: null, ...EVALUATOR_FILTERS_OFF })
  }
  const usesRef = usesParam ? parseUses(usesParam) : null
  const usesRow = usesRef ? lists[usesRef.tab].find((r) => r.id === usesRef.id) : null
  const usesLines = usesRef && usesRow ? usesOf(data, usesRef.tab, usesRow.name, usesRow.id, usesRef.what) : []
  const openUses = (r: SettingsRow, what?: SettingUse) => { setCreateError(null); setParams({ uses: `${tab}|${r.id}|${what ?? ""}` }) }

  return (
    <div className="flex min-h-[calc(100dvh-5.5rem)] w-full flex-col">
    <PageFrame title={scopeTitle(scope, section)} actions={<SampleDataBadge />} className="flex-1">
      <div className="flex flex-col gap-4" data-settings-lab data-settings-scope={scope} data-page-type="list" data-tab={section}>
        <p role="status" aria-live="polite" className="sr-only" data-status-announcement>{announcement}</p>
        <Tabs value={section} onValueChange={(v) => afterAsking(() => changeTab(v))}>
          {/* While the form is open: in view wherever the page is scrolled, at every width above a phone, where this row would hold too much of the screen. The DS table's fixed head stacks under this slot. */}
          <div {...(creating ? { "data-slot": "tabs-sticky-subheader" } : {})} className={creating ? "z-30 flex flex-col gap-2 bg-background pb-2 md:sticky md:top-0" : "flex flex-col gap-2"}>
          <div className="flex flex-wrap items-start gap-x-4 gap-y-2" data-region="tabs">
            <div className="min-w-0 flex-1 basis-56">
            <TabsList variant="line" ariaLabel={scope === "vocabulary" ? VOCABULARY_TITLE : "Settings lists"}>
              {sections.map((t) => (
                <TabsTrigger key={t} value={t} data-tab={t}>
                  {sectionLabel(t)}
                  {/* No counts over a list that did not load. */}
                  {demo === "error" ? null : t === "student-groups" ? <StudentGroupsCount empty={demo === "empty"} /> : <TabsCountBadge count={t === "evaluators" ? (demo === "empty" ? 0 : evaluatorCount) : shownCount(t)} />}
                </TabsTrigger>
              ))}
            </TabsList>
            </div>
            {/* The one filled button on the page (map E5), in one place: it opens the form, then submits it. */}
            {section !== "evaluators" && section !== "student-groups" && demo !== "error" ? (
              creating ? (
                <InlineCreate key={tab} tab={tab} names={names} onAdd={add} onClose={() => afterAsking(closeCreate)} error={createError} setError={reportCreateError} onTyped={setTypedDirty} />
              ) : (
                <div className={ADD_ROW}>
                  <Button ref={addRef} type="button" variant="default" size="sm" onClick={() => { setBanner(null); setBand(0); setCreating(true) }} data-inline-create-open>
                    {`Add a ${NOUN[tab]}`}
                  </Button>
                </div>
              )
            ) : null}
          </div>
          {banner && (creating || banner.atForm) ? (
            <div ref={bannerAtForm} data-region="banner" className="[overflow-wrap:anywhere]">
              <LocalBanner variant={banner.variant} dismissible onDismiss={dismissBanner} action={banner.action}>{banner.title}</LocalBanner>
            </div>
          ) : creating && band > 0 ? <div aria-hidden="true" style={{ height: band }} data-held-band /> : null}
          </div>
          {/* One panel for the active section, so the selected trigger's aria-controls resolves (axe aria-valid-attr-value).
              Radix renders only the active TabsContent; inactive triggers carry aria-selected="false", which axe allows. */}
          <TabsContent key={section} value={section} className="mt-2 flex flex-col gap-4" data-tab-panel={section}>
        {demo === "error" ? (
          <LocalBanner variant="error" title={`${scope === "vocabulary" ? VOCABULARY_TITLE : "Settings"} could not be loaded`} action={{ label: "Try again", onClick: () => setParams({ state: null }) }}>Nothing was changed.</LocalBanner>
        ) : section === "student-groups" ? (
          <StudentGroupsSection />
        ) : section === "evaluators" ? (
          <EvaluatorsSection layout="people" />
        ) : (
          <>
            {demo === "partial" ? <LocalBanner variant="info" title="Usage counts are still loading">Delete stays off until they finish.</LocalBanner> : null}
            <FilterBar aria-label={`Find ${NOUNS[tab]}`} className="gap-2" data-region="toolbar">
              <Label htmlFor="settings-search" className="sr-only">{`Search ${NOUNS[tab]}`}</Label>
              <Input id="settings-search" type="search" value={query} onChange={(e) => { setCreateError(null); setQuery(e.target.value) }} placeholder={`Search ${NOUNS[tab]}`} className="h-8 w-64 max-w-full" />
            </FilterBar>
            <SettingsTable tab={tab} rows={marked} filtered={!!qq} onClear={() => setQuery("")} partial={demo === "partial"} onToggle={toggle} onDelete={askDelete} onUses={openUses} onRename={tab === "instructors" ? undefined : askRename} />
          </>
        )}
          </TabsContent>
        </Tabs>
      </div>
      {tab !== "instructors" ? (
        <RenameDialog
          kind={tab}
          state={data}
          target={renaming ? { id: renaming.id, name: renaming.name, uses: renaming.uses, usedBy: isVocabKind(tab) ? null : renaming.blocked } : null}
          onClose={() => setRenaming(null)}
          onCloseAutoFocus={backToRowMenu}
          onRename={(id, name) => {
            const from = renaming?.name ?? ""
            const res = isVocabKind(tab) ? vocab.rename(tab, id, name) : clinical.rename(from, name)
            if (!res.ok) return res.error
            menuRow.current = name.trim()
            setFresh((f) => {
              if (!f.has(freshKey(tab, from))) return f
              // Keeps its place among the new rows.
              return new Set([...f].map((k) => (k === freshKey(tab, from) ? freshKey(tab, name) : k)))
            })
            setBanner({ variant: "success", title: `${renamedText(from)}${unsavedNote()}` })
            setRenaming(null)
            return null
          }}
        />
      ) : null}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent onCloseAutoFocus={backToRowMenu}>
          <AlertDialogHeader>
            <AlertDialogTitle className="[overflow-wrap:anywhere]">{`Delete "${deleting?.name ?? ""}"?`}</AlertDialogTitle>
            <AlertDialogDescription>{deleteEffect(tab)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline" size="sm">Keep it</AlertDialogCancel>
            <AlertDialogAction variant="destructive" size="sm" onClick={() => deleting && remove(deleting)}>{`Delete ${NOUN[tab]}`}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <FloatingSheetPanel open={!!usesRow} onOpenChange={(o) => (!o ? setParams({ uses: null }) : undefined)}>
        <FloatingSheetPanelContent contentSlot="lab-settings-uses" size="sm">
          <FloatingSheetPanelToolbar />
          <FloatingSheetPanelHeader title={usesRow?.name ?? "Used by"} subtitle={usesRow ? usesTitle(usesRef!.tab, usesLines.length, usesRef!.what) : undefined} />
          <FloatingSheetPanelBody className="px-4 pb-4" data-uses-count={usesLines.length}>
            <ul className="flex flex-col divide-y divide-border">
              {usesLines.map((l) => (
                <li key={l.key} className="flex flex-col py-2">
                  <span className="text-sm text-foreground">{l.primary}</span>
                  <span className="text-xs text-muted-foreground">{l.secondary}</span>
                </li>
              ))}
            </ul>
          </FloatingSheetPanelBody>
        </FloatingSheetPanelContent>
      </FloatingSheetPanel>
      <ResultBanner banner={banner && !creating && !banner.atForm ? banner : null} onDismiss={dismissBanner} />
      <DiscardChangesDialog
        open={leave.asking || !!waiting}
        body={`The ${NOUN[tab]} you typed has not been added.`}
        onKeep={() => { leave.setAsking(false); setWaiting(null) }}
        onDiscard={() => {
          if (waiting) { const then = waiting; setWaiting(null); then() }
          else leave.go(() => { setTypedDirty(false); setCreating(false) })
        }}
      />
    </PageFrame>
    </div>
  )
}

function parseUses(raw: string): { tab: SettingsTab; id: string; what?: SettingUse } | null {
  const [tab, id, what] = raw.split("|")
  if (!isSettingsTab(tab) || !id) return null
  return { tab, id, ...(what === "sites" || what === "rules" || what === "courses" ? { what } : {}) }
}

function usesTitle(tab: SettingsTab, n: number, what?: SettingUse): string {
  if (tab === "categories" || tab === "tags") return `Used by ${plural(n, skillNoun(), skillNounPlural())}`
  if (tab === "instructors") return plural(n, "evaluation signed", "evaluations signed")
  if (what === "rules") return `${plural(n, skillNoun(), skillNounPlural())} with a minimum here`
  if (what === "courses") return plural(n, "course places students here", "courses place students here")
  return plural(n, "active site", "active sites")
}

/** What a delete does: only an unused entry can be deleted, so nothing that uses it changes. */
function deleteEffect(tab: SettingsTab): string {
  if (tab === "categories" || tab === "tags") return `It leaves this list and Add ${aNoun()}. No ${skillNounPlural()} use it, so none change. This cannot be undone.`
  if (tab === "settings") return "It leaves this list and Add minimum. Nothing uses it, so nothing changes. This cannot be undone."
  return "It leaves this list. This cannot be undone."
}

/** Leaving the Evaluators section drops its filters, so they do not ride along to another section. */
export const EVALUATOR_FILTERS_OFF = { q: null, role: null, site: null, setting: null, filter: null } as const

/** The name field "Add a {noun}" opens, with that same button as its submit in the same place; it stays open for several entries until Cancel or Escape. The error sits at the field. */
function InlineCreate({ tab, names, onAdd, onClose, error, setError, onTyped }: { tab: SettingsTab; names: string[]; onAdd: (name: string, email?: string) => boolean; onClose: () => void; error: string | null; setError: (e: string | null) => void; onTyped: (typed: boolean) => void }) {
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const ref = React.useRef<HTMLInputElement>(null)
  // Said in the same event as the keystroke, so an Esc right after it is already asked about.
  const change = (nextName: string, nextEmail: string) => {
    setName(nextName)
    setEmail(nextEmail)
    onTyped(!!nextName.trim() || !!nextEmail.trim())
  }
  const submit = () => {
    const e = validateEntry(tab, name, names, tab === "instructors" ? email : undefined)
    setError(e)
    if (e) return ref.current?.focus()
    if (!onAdd(name, tab === "instructors" ? email : undefined)) return ref.current?.focus()
    change("", "")
    ref.current?.focus()
  }
  React.useEffect(() => { ref.current?.focus() }, [])
  return (
    <form noValidate aria-label={`Add a ${NOUN[tab]}`} className="ms-auto flex w-full flex-col sm:w-auto sm:max-w-full" onSubmit={(e) => { e.preventDefault(); submit() }} onKeyDown={(e) => { if (e.key === "Escape") onClose() }} data-inline-create>
      {/* Field, then room for its error, then the buttons on a phone. From md the buttons sit beside the field and the error hangs under it, over what is below: it adds no height, so nothing moves as it comes or goes (F C8). */}
      <div className="relative grid items-center gap-x-2 gap-y-1 sm:grid-cols-[auto_auto] sm:grid-rows-[2.5rem_minmax(1.25rem,auto)] md:grid-rows-[2.5rem]">
        <div className="flex flex-wrap items-center gap-2">
          <Label htmlFor="settings-new" className="sr-only">{tab === "instructors" ? "Name" : `New ${NOUN[tab]}`}</Label>
          <Input ref={ref} id="settings-new" value={name} onChange={(e) => { setError(null); change(e.target.value, email) }} placeholder={tab === "instructors" ? "Instructor name" : `New ${NOUN[tab]}`} className="h-8 w-full sm:w-64" aria-invalid={!!error || undefined} aria-describedby={error ? "settings-new-error" : undefined} />
          {tab === "instructors" ? (
            <>
              <Label htmlFor="settings-email" className="sr-only">Email</Label>
              <Input id="settings-email" type="email" value={email} onChange={(e) => change(name, e.target.value)} placeholder="Email" className="h-8 w-full sm:w-64" aria-invalid={!!error || undefined} aria-describedby={error ? "settings-new-error" : undefined} />
            </>
          ) : null}
        </div>
        <div className="min-h-5 sm:col-start-1 sm:row-start-2 md:absolute md:col-start-auto md:row-start-auto md:start-0 md:top-10 md:z-10 md:w-64 md:min-h-0">
          {error ? <p id="settings-new-error" role="alert" className="text-sm text-destructive md:rounded-sm md:bg-background">{error}</p> : null}
        </div>
        {/* Together, so Cancel never wraps alone. */}
        <span className="flex items-center justify-end gap-2 sm:col-start-2 sm:row-start-1">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          {/* The second press of a double click stays out of it altogether, focus included: the next name typed goes in the field. */}
          <Button type="submit" variant="default" size="sm" onMouseDownCapture={dropRepeatPress} onClickCapture={dropRepeatPress}>{`Add a ${NOUN[tab]}`}</Button>
        </span>
      </div>
    </form>
  )
}

/**
 * Cut off with the whole name in a Tip, on hover and on keyboard focus (the Tip pattern of Skill lists' Assigned to): only a name that really is cut off is a tab stop. A phone has no hover, so there it wraps.
 */
function RowName({ name, active, narrow }: { name: string; active: boolean; narrow: boolean }) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const [cut, setCut] = React.useState(false)
  React.useEffect(() => {
    const el = ref.current
    if (!el || narrow) return setCut(false)
    const measure = () => setCut(el.scrollWidth > el.clientWidth + 1)
    measure()
    const sized = new ResizeObserver(measure)
    sized.observe(el)
    return () => sized.disconnect()
  }, [name, narrow])
  return (
    <Tip label={name} disabled={!cut} triggerClassName="min-w-0">
      <span ref={ref} tabIndex={cut ? 0 : undefined} className={`${narrow ? "whitespace-normal [overflow-wrap:anywhere]" : "truncate"} rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${active ? "text-foreground" : "text-muted-foreground"}`} data-settings-name={name}>{name}</span>
    </Tip>
  )
}

/** The words beside a count when it moves under the name on a phone. */
const FACT_WORDS: Record<string, [string, string]> = { categories: ["category", "categories"], sites: ["site", "sites"], courses: ["course", "courses"], evidence: ["evaluation", "evaluations"] }

function SettingsTable({ tab, rows, filtered, onClear, partial, onToggle, onDelete, onUses, onRename }: { tab: SettingsTab; rows: SettingsRow[]; filtered: boolean; onClear: () => void; partial: boolean; onToggle: (r: SettingsRow) => void; onDelete: (r: SettingsRow) => void; onUses: (r: SettingsRow, what?: SettingUse) => void; onRename?: (r: SettingsRow) => void }) {
  const narrow = useIsMobile()
  // A skill count is a link to the Library filtered to this entry, a list of the same length (map D5, F C2).
  const libraryCount = (r: SettingsRow, n: number) =>
    n === 0 ? <span className="tabular-nums text-muted-foreground">0</span> : (
      <Link className={`text-sm ${NUM_LINK}`} onClick={rememberPageScroll} aria-label={`${r.name}: ${plural(n, skillNoun(), skillNounPlural())}. Open in the Library`} href={`${LAB_ADMIN}/skills-library?${tab === "tags" ? "tag" : "cat"}=${encodeURIComponent(r.name)}`}>{fmt(n)}</Link>
    )
  const count = (r: SettingsRow, n: number, label: string, what?: SettingUse) =>
    n === 0 ? <span className="tabular-nums text-muted-foreground">0</span> : (
      <Button type="button" variant="link" size="sm" className={`h-auto p-0 text-sm font-normal ${NUM_LINK}`} aria-label={`${r.name}: ${label}. Open the list`} onClick={() => onUses(r, what)}>{fmt(n)}</Button>
    )
  const nameCol: ColumnDef<SettingsRow> = {
    key: "name",
    label: "Name",
    width: 300,
    sortable: true,
    cell: (r) => {
      const name = (
        <span className="flex min-w-0 items-center gap-2">
          <RowName name={r.name} active={r.active} narrow={narrow} />
          {r.isNew ? <Badge variant="outline">New</Badge> : null}
        </span>
      )
      if (!narrow) return name
      // Below md the DS turns column pins off, so the counts move under the name and Status and the row menu stay on screen.
      const facts = middle.map((c) => {
        const [one, many] = c.key === "skills" ? [skillNoun(), skillNounPlural()] : c.key === "rules" ? [`${skillNoun()} rule`, `${skillNoun()} rules`] : FACT_WORDS[c.key] ?? [c.label, c.label]
        return { key: c.key, label: n(r, c.key) === 1 ? one : many, value: c.cell ? c.cell(r, { rowIndex: 0, selected: false, onSelect: () => {} }) : null }
      })
      return (
        <span className="flex min-w-0 flex-col gap-0.5 py-1">
          {name}
          {facts.length ? (
            <span className="flex flex-wrap gap-x-3 whitespace-normal text-xs text-muted-foreground">
              {facts.map((f) => <span key={f.key} className="inline-flex items-baseline gap-1 [&_*]:text-xs">{f.value}<span>{f.label}</span></span>)}
            </span>
          ) : null}
        </span>
      )
    },
    ...(narrow ? { width: 180, minWidth: 140 } : {}),
  }
  const inWorkflow = useEmbeddedStep() !== null
  const actionsCol: ColumnDef<SettingsRow> = {
    key: "actions",
    label: "Actions",
    width: 48,
    minWidth: 48,
    resizable: false,
    // Pinned and locked right: the DS draws no column menu here, and at wide widths the row menu stays in view when the table scrolls.
    defaultPin: "right",
    lockPin: true,
    header: () => <span className="sr-only">Actions</span>,
    cell: (r) => {
      const blocked = partial ? "Usage still loading" : r.blocked
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon-sm" aria-label={`Actions for ${r.name}`} data-row-menu={r.name}>
              <i className="fa-light fa-ellipsis" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            {onRename ? <DropdownMenuItem onSelect={() => onRename(r)}>Rename</DropdownMenuItem> : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" disabled={!!blocked} onSelect={() => onDelete(r)} className="flex flex-col items-start gap-0">
              <span>Delete</span>
              {blocked ? <span className="text-xs text-muted-foreground">{`${blocked}, so it cannot be deleted`}</span> : null}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  }
  // At once, with no dialog [REQ SL-06, this review 2026-11-05]; the switch and its word are the feedback, the page announces it.
  const statusCol: ColumnDef<SettingsRow> = {
    key: "status",
    label: "Status",
    width: 116,
    resizable: false,
    defaultPin: "right",
    lockPin: true,
    cell: (r) => (
      // A double click is one press, as across Skill lists (map E rule 10): the second would flip it back.
      <span className="flex items-center gap-2" onClickCapture={dropRepeatPress}>
        <ToggleSwitch checked={r.active} onChange={() => onToggle(r)} aria-label={`${r.name} active`} />
        <span className="text-sm text-foreground">{STATUS_META[r.active ? "active" : "inactive"].label}</span>
      </span>
    ),
  }
  type R = SettingsRow & Record<string, number | string | boolean>
  const n = (r: SettingsRow, k: string) => Number((r as R)[k] ?? 0)
  // Inside Set up skills (D-L44) the step creates categories and tags: the usage counts (skills, across categories) are hub only.
  const middle: ColumnDef<SettingsRow>[] =
    inWorkflow && (tab === "categories" || tab === "tags")
      ? []
      : tab === "categories"
      ? [{ key: "skills", label: `${skillNounPlural().replace(/^./, (c) => c.toUpperCase())}`, width: 120, sortable: true, cell: (r) => libraryCount(r, n(r, "skills")) }]
      : tab === "tags"
        ? [
            { key: "skills", label: `${skillNounPlural().replace(/^./, (c) => c.toUpperCase())}`, width: 120, sortable: true, cell: (r) => libraryCount(r, n(r, "skills")) },
            // "Categories" [INFER]: how many categories the tag spans, plainer than "Across categories".
            { key: "categories", label: "Categories", width: 120, sortable: true, cell: (r) => <span className="tabular-nums">{fmt(n(r, "categories"))}</span> },
          ]
        : tab === "settings"
          ? [
              { key: "sites", label: "Sites", width: 100, sortable: true, cell: (r) => count(r, n(r, "sites"), plural(n(r, "sites"), "active site", "active sites"), "sites") },
              { key: "rules", label: `${skillNoun().replace(/^./, (c) => c.toUpperCase())} rules`, width: 120, sortable: true, cell: (r) => count(r, n(r, "rules"), `${plural(n(r, "rules"), skillNoun(), skillNounPlural())} with a minimum`, "rules") },
              { key: "courses", label: "Courses", width: 100, sortable: true, cell: (r) => count(r, n(r, "courses"), plural(n(r, "courses"), "course", "courses"), "courses") },
              { key: "evidence", label: "Evaluations", width: 120, sortable: true, cell: (r) => <span className="tabular-nums">{fmt(n(r, "evidence"))}</span> },
            ]
          : [
              { key: "email", label: "Email", width: 260, sortable: true },
              { key: "evaluations", label: "Evaluations signed", width: 160, sortable: true, cell: (r) => count(r, n(r, "evaluations"), plural(n(r, "evaluations"), "evaluation", "evaluations")) },
            ]
  const columns = [nameCol, ...(narrow ? [] : middle), statusCol, actionsCol]
  const empty = filtered ? (
    <EmptyBlock compact title={`No ${NOUNS[tab]} match this search`} action={{ label: "Clear search" }} onAction={onClear} />
  ) : (
    <EmptyBlock compact title={`No ${NOUNS[tab]} yet`} body={tab === "instructors" ? "Add the first one above; a name and an email are enough." : tab === "categories" ? `Categories are optional. They group ${skillNounPlural()} in the library.` : `Add the first one above, or while editing ${aNoun()}.`} />
  )
  // The page owns the one search above; the table's own query controls stay off (no second filter system).
  return <DataTable<SettingsRow> key={`${tab}-${narrow ? "narrow" : "wide"}`} data={rows} columns={columns} getRowId={(r) => r.id} selectable={false} searchable={false} showQueryControls={false} edgeInset={false} emptyState={empty} />
}
