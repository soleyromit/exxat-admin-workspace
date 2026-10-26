"use client"

/**
 * Settings (REQ SL-03 to SL-08; AUDIT T1 "no settings screen"). Four program-defined lists on DS Tabs with their counts:
 * Categories, Tags, Clinical settings (site counts and what uses each), Lab instructors.
 *
 * Regions (strategy/07 list budget, 4): header · tabs · one toolbar row (search, then "Add a {noun}", which opens the inline
 * name field one click away) · the DataTable. Delete is offered only while an entry is unused; otherwise the menu names what
 * uses it. Deactivate keeps an entry where it is already used and marks it inactive there (SL-06). Every usage count opens
 * the list behind it with the same length. Feedback is a LocalBanner, never a toast. URL: ?tab=, ?uses=, ?state=.
 */
import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { Tabs, TabsContent, TabsCountBadge, TabsList, TabsTrigger } from "@exxatdesignux/ui/components/ui/tabs"
import { FilterBar } from "@exxatdesignux/ui/components/ui/filter-bar"
import { EmptyBlock } from "@/components/lab/empty-block"
import { SampleDataBadge } from "@/components/lab/import/sample-badge"
import { NUM_LINK } from "@/components/lab/link-styles"
import { fmt, plural } from "@/lib/v2/format"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import type { ColumnDef } from "@exxatdesignux/ui/components/data-table/types"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@exxatdesignux/ui/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@exxatdesignux/ui/components/ui/alert-dialog"
import { FloatingSheetPanel, FloatingSheetPanelBody, FloatingSheetPanelContent, FloatingSheetPanelHeader, FloatingSheetPanelToolbar } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { PageFrame } from "@/components/skills/page-header"
import { useV2Hydrated, useV2State } from "@/lib/v2/react"
import { parseDemoState } from "@/lib/lab/dashboard"
import { EMPTY_SETTINGS, NAMING_EXAMPLES, SETTINGS_SECTIONS, categoryRows, clinicalSettingRows, instructorRows, isSettingsSection, isSettingsTab, sectionLabel, settingId, tagRows, usesOf, validateEntry, validateNaming, type NamingErrors, type SettingUse, type SettingsOverlay, type SettingsRow, type SettingsTab } from "@/lib/lab/settings"
import { aNoun, setTerms, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { useTerms } from "@/components/lab/library/use-terms"
import { Field, FieldError, FieldLabel } from "@exxatdesignux/ui/components/ui/field"

const NOUN: Record<SettingsTab, string> = { categories: "category", tags: "tag", settings: "clinical setting", instructors: "lab instructor" }
const NOUNS: Record<SettingsTab, string> = { categories: "categories", tags: "tags", settings: "clinical settings", instructors: "lab instructors" }

export function SettingsPage() {
  const data = useV2State()
  const hydrated = useV2Hydrated()
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname() ?? ""
  const demo = parseDemoState(params?.get("state"))
  const tabRaw = params?.get("tab")
  const section = isSettingsSection(tabRaw) ? tabRaw : "categories"
  const tab: SettingsTab = section === "naming" ? "categories" : section
  const terms = useTerms()
  const usesParam = params?.get("uses") ?? null
  const [overlay, setOverlay] = React.useState<SettingsOverlay>(EMPTY_SETTINGS)
  const [banner, setBanner] = React.useState<{ tone: "success" | "info"; text: string } | null>(null)
  React.useEffect(() => { const t = takeNamingSaved(); if (t) setBanner({ tone: "success", text: t }) }, [])
  const [deleting, setDeleting] = React.useState<SettingsRow | null>(null)
  const [createError, setCreateError] = React.useState<string | null>(null)
  const [query, setQuery] = React.useState("")

  const setParams = (p: Record<string, string | null>) => {
    const q = new URLSearchParams(params?.toString() ?? "")
    for (const [k, v] of Object.entries(p)) (v ? q.set(k, v) : q.delete(k))
    const s = q.toString()
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false })
  }

  const lists = React.useMemo(() => {
    const n = skillNoun()
    const ns = skillNounPlural()
    return { categories: categoryRows(data, overlay, n, ns), tags: tagRows(data, overlay, n, ns), settings: clinicalSettingRows(data, overlay, n, ns), instructors: instructorRows(data, overlay) }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- terms: the noun is read inside the row builders
  }, [data, overlay, terms])

  if (!hydrated || demo === "loading") {
    return (
      <PageFrame title="Settings">
        <div role="status" aria-busy="true" aria-label="Loading settings" className="flex flex-col gap-3">
          <Skeleton aria-hidden="true" className="h-9 w-[28rem]" />
          <Skeleton aria-hidden="true" className="h-8 w-80" />
          {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} aria-hidden="true" className="h-12 w-full" />)}
        </div>
      </PageFrame>
    )
  }

  const all: SettingsRow[] = demo === "empty" ? [] : lists[tab]
  const qq = query.trim().toLowerCase()
  const rows = qq ? all.filter((r) => r.name.toLowerCase().includes(qq) || String((r as SettingsRow & { email?: string }).email ?? "").toLowerCase().includes(qq)) : all
  const names = lists[tab].map((r) => r.name)
  const add = (name: string, email?: string) => {
    setOverlay((o) => ({ ...o, added: [{ tab, name: name.trim(), email: email?.trim() }, ...o.added] }))
    setBanner({ tone: "success", text: `Added "${name.trim()}".` })
  }
  const toggle = (r: SettingsRow) => {
    setOverlay((o) => (r.active ? { ...o, inactive: [...o.inactive, r.id], reactivated: o.reactivated.filter((x) => x !== r.id) } : { ...o, reactivated: [...o.reactivated, r.id], inactive: o.inactive.filter((x) => x !== r.id) }))
    setBanner({ tone: "info", text: r.active ? `"${r.name}" is inactive. It stays where it is used, marked inactive, and is no longer offered.` : `"${r.name}" is active again.` })
  }
  const remove = (r: SettingsRow) => {
    setOverlay((o) => ({ ...o, deleted: [...o.deleted, r.id], added: o.added.filter((a) => settingId(a.tab, a.name) !== r.id) }))
    setBanner({ tone: "success", text: `Deleted "${r.name}".` })
    setDeleting(null)
  }
  const usesRef = usesParam ? parseUses(usesParam) : null
  const usesRow = usesRef ? lists[usesRef.tab].find((r) => r.id === usesRef.id) : null
  const usesLines = usesRef && usesRow ? usesOf(data, usesRef.tab, usesRow.name, usesRow.id, usesRef.what) : []
  const openUses = (r: SettingsRow, what?: SettingUse) => setParams({ uses: `${tab}|${r.id}|${what ?? ""}` })

  return (
    <PageFrame title="Settings" actions={<SampleDataBadge />}>
      <div className="flex flex-col gap-4" data-settings-lab data-page-type="list" data-tab={section}>
        <Tabs value={section} onValueChange={(v) => { setBanner(null); setCreateError(null); setQuery(""); setParams({ tab: v === "categories" ? null : v, uses: null }) }}>
          <TabsList variant="line" ariaLabel="Settings lists">
            {SETTINGS_SECTIONS.map((t) => (
              <TabsTrigger key={t} value={t} data-tab={t}>
                {sectionLabel(t)}
                {t === "naming" ? null : <TabsCountBadge count={lists[t].length} />}
              </TabsTrigger>
            ))}
          </TabsList>
          {/* One panel for the active section, so the selected trigger's aria-controls resolves (axe aria-valid-attr-value).
              Radix renders only the active TabsContent; inactive triggers carry aria-selected="false", which axe allows. */}
          <TabsContent key={section} value={section} className="mt-2 flex flex-col gap-4" data-tab-panel={section}>
        {banner ? <LocalBanner variant={banner.tone} dismissible onDismiss={() => setBanner(null)}>{banner.text}</LocalBanner> : null}
        {demo === "error" ? (
          <LocalBanner variant="error" title="Settings could not be loaded" retry={{ label: "Try again", onClick: () => setParams({ state: null }) }}>Nothing was changed.</LocalBanner>
        ) : section === "naming" ? (
          <NamingSection idPrefix="settings" onSaved={(text) => setBanner({ tone: "success", text })} />
        ) : (
          <>
            {demo === "partial" ? <LocalBanner variant="info" title="Usage counts are still loading">Delete stays off until they finish.</LocalBanner> : null}
            {createError ? <p id="settings-new-error" role="alert" className="text-sm text-destructive">{createError}</p> : null}
            <FilterBar aria-label={`Find or add ${NOUNS[tab]}`} className="gap-2" data-region="toolbar">
              <Label htmlFor="settings-search" className="sr-only">{`Search ${NOUNS[tab]}`}</Label>
              <Input id="settings-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${NOUNS[tab]}`} className="h-8 w-64" />
              <InlineCreate key={tab} tab={tab} names={names} onAdd={add} error={createError} setError={setCreateError} />
            </FilterBar>
            <SettingsTable tab={tab} rows={rows} filtered={!!qq} onClear={() => setQuery("")} partial={demo === "partial"} onToggle={toggle} onDelete={setDeleting} onUses={openUses} />
          </>
        )}
          </TabsContent>
        </Tabs>
      </div>
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{`Delete "${deleting?.name ?? ""}"?`}</AlertDialogTitle>
            <AlertDialogDescription>Nothing uses it, so nothing else changes. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline" size="sm">Keep it</AlertDialogCancel>
            <AlertDialogAction variant="destructive" size="sm" onClick={() => deleting && remove(deleting)}>Delete</AlertDialogAction>
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
    </PageFrame>
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

/**
 * Naming (CALL 10-26 item 7): what the program calls these, singular and plural. Shared by Settings A (a tab) and B (the
 * detail pane). Saving sets the noun in lib/lab/terms.ts for every screen. One filled primary, the save.
 */
export const NAMING_SAVED_KEY = "lab:naming-saved"

/** The naming confirmation kept across the re-render a noun change causes; read once. */
export function takeNamingSaved(): string | null {
  try {
    const t = window.sessionStorage.getItem(NAMING_SAVED_KEY)
    if (t) window.sessionStorage.removeItem(NAMING_SAVED_KEY)
    return t
  } catch { return null }
}

export function NamingSection({ idPrefix, onSaved }: { idPrefix: string; onSaved: (text: string) => void }) {
  const terms = useTerms()
  const [one, setOne] = React.useState(terms.skillNoun)
  const [many, setMany] = React.useState(terms.skillNounPlural)
  const [errors, setErrors] = React.useState<NamingErrors>({})
  // The stored noun arrives after mount; follow it until the user types.
  const touched = React.useRef(false)
  React.useEffect(() => {
    if (touched.current) return
    setOne(terms.skillNoun)
    setMany(terms.skillNounPlural)
  }, [terms.skillNoun, terms.skillNounPlural])
  const oneId = `${idPrefix}-noun-one`
  const manyId = `${idPrefix}-noun-many`
  const save = () => {
    const e = validateNaming(one, many)
    setErrors(e)
    if (e.one) return document.getElementById(oneId)?.focus()
    if (e.many) return document.getElementById(manyId)?.focus()
    const text = `Every screen now says "${many.trim()}".`
    // Saving the noun re-renders every lab screen (lab-frame TermsBoundary), which resets page state: keep the confirmation
    // for the page that mounts next, then confirm on this one too.
    try { window.sessionStorage.setItem(NAMING_SAVED_KEY, text) } catch { /* the banner below still shows when nothing remounts */ }
    setTerms({ skillNoun: one, skillNounPlural: many })
    touched.current = false
    onSaved(text)
  }
  const pick = (x: { one: string; many: string }) => {
    touched.current = true
    setOne(x.one)
    setMany(x.many)
    setErrors({})
  }
  return (
    <section aria-labelledby={`${idPrefix}-naming-heading`} className="flex max-w-xl flex-col gap-4" data-region="naming" data-naming>
      <div className="flex flex-col gap-0.5">
        <h2 id={`${idPrefix}-naming-heading`} className="text-base font-semibold text-foreground">What do you call these?</h2>
        <p className="text-sm text-muted-foreground">Every screen uses these words, for every role.</p>
      </div>
      <form noValidate className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); save() }}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={!!errors.one || undefined}>
            <FieldLabel htmlFor={oneId}>For one</FieldLabel>
            <Input id={oneId} value={one} onChange={(e) => { touched.current = true; setOne(e.target.value) }} aria-invalid={!!errors.one || undefined} aria-describedby={errors.one ? `${oneId}-error` : undefined} className="h-8" />
            {errors.one ? <FieldError id={`${oneId}-error`}>{errors.one}</FieldError> : null}
          </Field>
          <Field data-invalid={!!errors.many || undefined}>
            <FieldLabel htmlFor={manyId}>For more than one</FieldLabel>
            <Input id={manyId} value={many} onChange={(e) => { touched.current = true; setMany(e.target.value) }} aria-invalid={!!errors.many || undefined} aria-describedby={errors.many ? `${manyId}-error` : undefined} className="h-8" />
            {errors.many ? <FieldError id={`${manyId}-error`}>{errors.many}</FieldError> : null}
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Examples">
          <span className="text-sm text-muted-foreground">Examples</span>
          {NAMING_EXAMPLES.map((x) => (
            <Button key={x.one} type="button" variant="outline" size="xs" aria-pressed={one.trim() === x.one && many.trim() === x.many} aria-label={`Use ${x.one} and ${x.many}`} onClick={() => pick(x)}>
              {x.one}
            </Button>
          ))}
        </div>
        <div>
          <Button type="submit" variant="default" size="sm">Save names</Button>
        </div>
      </form>
    </section>
  )
}

/** "Add a {noun}" opens the inline name field (one click away); it stays open for several entries until Cancel. */
function InlineCreate({ tab, names, onAdd, error, setError }: { tab: SettingsTab; names: string[]; onAdd: (name: string, email?: string) => void; error: string | null; setError: (e: string | null) => void }) {
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const ref = React.useRef<HTMLInputElement>(null)
  const submit = () => {
    const e = validateEntry(tab, name, names, tab === "instructors" ? email : undefined)
    setError(e)
    if (e) return ref.current?.focus()
    onAdd(name, tab === "instructors" ? email : undefined)
    setName("")
    setEmail("")
    ref.current?.focus()
  }
  React.useEffect(() => { if (open) ref.current?.focus() }, [open])
  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)} data-inline-create-open>
        {`Add a ${NOUN[tab]}`}
      </Button>
    )
  }
  return (
    <form noValidate aria-label={`Add a ${NOUN[tab]}`} className="flex items-center" onSubmit={(e) => { e.preventDefault(); submit() }} data-inline-create>
      <div className="flex items-center gap-2">
        <Label htmlFor="settings-new" className="sr-only">{tab === "instructors" ? "Name" : `New ${NOUN[tab]}`}</Label>
        <Input ref={ref} id="settings-new" value={name} onChange={(e) => setName(e.target.value)} placeholder={tab === "instructors" ? "Instructor name" : `New ${NOUN[tab]}`} className="h-8 w-64" aria-invalid={!!error || undefined} aria-describedby={error ? "settings-new-error" : undefined} />
        {tab === "instructors" ? (
          <>
            <Label htmlFor="settings-email" className="sr-only">Email</Label>
            <Input id="settings-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="h-8 w-64" aria-invalid={!!error || undefined} aria-describedby={error ? "settings-new-error" : undefined} />
          </>
        ) : null}
        <Button type="submit" variant="default" size="sm">Add</Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => { setOpen(false); setName(""); setEmail(""); setError(null) }}>Cancel</Button>
      </div>
    </form>
  )
}

function SettingsTable({ tab, rows, filtered, onClear, partial, onToggle, onDelete, onUses }: { tab: SettingsTab; rows: SettingsRow[]; filtered: boolean; onClear: () => void; partial: boolean; onToggle: (r: SettingsRow) => void; onDelete: (r: SettingsRow) => void; onUses: (r: SettingsRow, what?: SettingUse) => void }) {
  const count = (r: SettingsRow, n: number, label: string, what?: SettingUse) =>
    n === 0 ? <span className="tabular-nums text-muted-foreground">0</span> : (
      <Button type="button" variant="link" size="sm" className={`h-auto p-0 text-sm font-normal ${NUM_LINK}`} aria-label={`${r.name}: ${label}. Open the list`} onClick={() => onUses(r, what)}>{fmt(n)}</Button>
    )
  const nameCol: ColumnDef<SettingsRow> = {
    key: "name",
    label: "Name",
    width: 300,
    sortable: true,
    cell: (r) => (
      <span className="flex min-w-0 items-center gap-2">
        <span className={r.active ? "truncate text-foreground" : "truncate text-muted-foreground"}>{r.name}</span>
        {r.isNew ? <Badge variant="outline">New</Badge> : null}
      </span>
    ),
  }
  const statusCol: ColumnDef<SettingsRow> = { key: "active", label: "Status", width: 130, cell: (r) => (r.active ? <span className="text-sm text-muted-foreground">Active</span> : <StatusBadge label="Inactive" tone="neutral" icon="fa-circle-minus" size="sm" />) }
  const actionsCol: ColumnDef<SettingsRow> = {
    key: "actions",
    label: "Actions",
    width: 80,
    cell: (r) => {
      const blocked = partial ? "Usage still loading" : r.blocked
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon-sm" aria-label={`Actions for ${r.name}`}>
              <i className="fa-light fa-ellipsis" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuItem onSelect={() => onToggle(r)}>{r.active ? "Deactivate" : "Reactivate"}</DropdownMenuItem>
            <DropdownMenuItem disabled={!!blocked} onSelect={() => onDelete(r)} className="flex flex-col items-start gap-0">
              <span>Delete</span>
              {blocked ? <span className="text-xs text-muted-foreground">{`${blocked}, so it cannot be deleted`}</span> : null}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  }
  type R = SettingsRow & Record<string, number | string | boolean>
  const n = (r: SettingsRow, k: string) => Number((r as R)[k] ?? 0)
  const middle: ColumnDef<SettingsRow>[] =
    tab === "categories"
      ? [{ key: "skills", label: `${skillNounPlural().replace(/^./, (c) => c.toUpperCase())}`, width: 120, sortable: true, cell: (r) => count(r, n(r, "skills"), plural(n(r, "skills"), skillNoun(), skillNounPlural())) }]
      : tab === "tags"
        ? [
            { key: "skills", label: `${skillNounPlural().replace(/^./, (c) => c.toUpperCase())}`, width: 120, sortable: true, cell: (r) => count(r, n(r, "skills"), plural(n(r, "skills"), skillNoun(), skillNounPlural())) },
            { key: "categories", label: "Across categories", width: 150, sortable: true, cell: (r) => <span className="tabular-nums">{fmt(n(r, "categories"))}</span> },
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
  const columns = [nameCol, ...middle, statusCol, actionsCol]
  const empty = filtered ? (
    <EmptyBlock compact title={`No ${NOUNS[tab]} match this search`} action={{ label: "Clear search" }} onAction={onClear} />
  ) : (
    <EmptyBlock compact title={`No ${NOUNS[tab]} yet`} body={tab === "instructors" ? "Add the first one above; a name and an email are enough." : `Add the first one above, or while editing ${aNoun()}.`} />
  )
  // The page owns the one search above; the table's own query controls stay off (no second filter system).
  return <DataTable<SettingsRow> key={tab} data={rows} columns={columns} getRowId={(r) => r.id} selectable={false} searchable={false} showQueryControls={false} edgeInset={false} emptyState={empty} />
}
