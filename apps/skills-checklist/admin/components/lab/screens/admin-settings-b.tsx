"use client"

/**
 * Settings, variant B: master and detail (REQ SL-03 to SL-08).
 *
 * Variant A puts each list in a tab with a table and opens "what uses it" in a side panel. B is a three-pane master-detail:
 * the four lists on the left with their counts, the entries of the chosen list in the middle (search and inline create on
 * top), and the chosen entry on the right with everything that uses it shown in place, so deciding whether to deactivate
 * or delete happens next to the evidence. Same rules and data as A (lib/lab/settings.ts): delete only while nothing uses an
 * entry, the count that blocks it is the reason; deactivate keeps it where it is used, marked inactive (SL-06).
 * URL: ?list= · ?entry= · ?state=loading|empty|error.
 *
 * Regions (list budget 4): header · banner (after an action) · lists pane · entries and detail.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { LabLocalBanner as LocalBanner } from "@/components/lab/lab-bar/lab-banner"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { TabsCountBadge } from "@exxatdesignux/ui/components/ui/tabs"
import { EmptyBlock } from "@/components/lab/empty-block"
import { SampleDataBadge } from "@/components/lab/import/sample-badge"
import { fmt, plural } from "@/lib/v2/format"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@exxatdesignux/ui/components/ui/alert-dialog"
import { PageFrame } from "@/components/skills/page-header"
import { useV2Hydrated, useV2State } from "@/lib/v2/react"
import { parseDemoState } from "@/lib/lab/dashboard"
import { EMPTY_SETTINGS, SETTINGS_SECTIONS, SETTINGS_TAB_LABEL, categoryRows, clinicalSettingRows, instructorRows, isSettingsSection, sectionLabel, settingId, tagRows, usesOf, validateEntry, type ClinicalSettingRow, type InstructorRow, type SettingUse, type SettingsOverlay, type SettingsRow, type SettingsTab } from "@/lib/lab/settings"
import { skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { useTerms } from "@/components/lab/library/use-terms"
import { NamingSection, takeNamingSaved } from "@/components/lab/admin-b/settings-page"

/** A list row that opens a record: a real link (it changes the URL), selected state as aria-current, row-sized target. */
const ROW_LINK = "flex min-h-8 w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[current]:bg-secondary aria-[current]:font-medium"
const NOUN: Record<SettingsTab, string> = { categories: "category", tags: "tag", settings: "clinical setting", instructors: "lab instructor" }
const NOUNS: Record<SettingsTab, string> = { categories: "categories", tags: "tags", settings: "clinical settings", instructors: "lab instructors" }
const ICON: Record<SettingsTab | "naming", string> = { categories: "fa-folder", tags: "fa-tag", settings: "fa-hospital", instructors: "fa-user", naming: "fa-input-text" }
const FIRST = 12

export function AdminSettingsB() {
  const data = useV2State()
  const hydrated = useV2Hydrated()
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname() ?? ""
  const demo = parseDemoState(params?.get("state"))
  const listRaw = params?.get("list")
  const section = isSettingsSection(listRaw) ? listRaw : "categories"
  const tab: SettingsTab = section === "naming" ? "categories" : section
  const terms = useTerms()
  const entryParam = params?.get("entry") ?? null
  const [overlay, setOverlay] = React.useState<SettingsOverlay>(EMPTY_SETTINGS)
  const [banner, setBanner] = React.useState<{ tone: "success" | "info"; text: string } | null>(null)
  React.useEffect(() => { const t = takeNamingSaved(); if (t) setBanner({ tone: "success", text: t }) }, [])
  const [deleting, setDeleting] = React.useState<SettingsRow | null>(null)
  const [query, setQuery] = React.useState("")

  const hrefWith = (p: Record<string, string | null>) => {
    const q = new URLSearchParams(params?.toString() ?? "")
    for (const [k, v] of Object.entries(p)) (v ? q.set(k, v) : q.delete(k))
    const s = q.toString()
    return s ? `${pathname}?${s}` : pathname
  }
  const setParams = (p: Record<string, string | null>) => router.replace(hrefWith(p), { scroll: false })
  const lists = React.useMemo(() => {
    const n = skillNoun()
    const ns = skillNounPlural()
    return { categories: categoryRows(data, overlay, n, ns), tags: tagRows(data, overlay, n, ns), settings: clinicalSettingRows(data, overlay, n, ns), instructors: instructorRows(data, overlay) } as Record<SettingsTab, SettingsRow[]>
    // eslint-disable-next-line react-hooks/exhaustive-deps -- terms: the noun is read inside the row builders
  }, [data, overlay, terms])

  if (!hydrated || demo === "loading") {
    return (
      <PageFrame title="Settings">
        <div role="status" aria-busy="true" aria-label="Loading settings" className="grid gap-4 lg:grid-cols-[14rem_20rem_minmax(0,1fr)]">
          <Skeleton aria-hidden="true" className="h-48 w-full" />
          <Skeleton aria-hidden="true" className="h-96 w-full" />
          <Skeleton aria-hidden="true" className="h-96 w-full" />
        </div>
      </PageFrame>
    )
  }

  const all = demo === "empty" ? [] : lists[tab]
  const q = query.trim().toLowerCase()
  const rows = q ? all.filter((r) => r.name.toLowerCase().includes(q) || String((r as InstructorRow).email ?? "").toLowerCase().includes(q)) : all
  const selected = all.find((r) => r.id === entryParam) ?? all[0] ?? null
  const add = (name: string, email?: string) => {
    setOverlay((o) => ({ ...o, added: [{ tab, name: name.trim(), email: email?.trim() }, ...o.added] }))
    setBanner({ tone: "success", text: `Added "${name.trim()}".` })
    setParams({ entry: settingId(tab, name) })
  }
  const toggle = (r: SettingsRow) => {
    setOverlay((o) => (r.active ? { ...o, inactive: [...o.inactive, r.id], reactivated: o.reactivated.filter((x) => x !== r.id) } : { ...o, reactivated: [...o.reactivated, r.id], inactive: o.inactive.filter((x) => x !== r.id) }))
    setBanner({ tone: "info", text: r.active ? `"${r.name}" is inactive. It stays where it is used, marked inactive, and is no longer offered.` : `"${r.name}" is active again.` })
  }
  const remove = (r: SettingsRow) => {
    setOverlay((o) => ({ ...o, deleted: [...o.deleted, r.id], added: o.added.filter((a) => settingId(a.tab, a.name) !== r.id) }))
    setBanner({ tone: "success", text: `Deleted "${r.name}".` })
    setDeleting(null)
    setParams({ entry: null })
  }

  return (
    <PageFrame title="Settings" actions={<SampleDataBadge />}>
      <div className="flex flex-col gap-4" data-settings-lab="B" data-page-type="list" data-tab={section}>
        {banner ? <LocalBanner variant={banner.tone} dismissible onDismiss={() => setBanner(null)}>{banner.text}</LocalBanner> : null}
        {demo === "error" ? (
          <LocalBanner variant="error" title="Settings could not be loaded" retry={{ label: "Try again", onClick: () => setParams({ state: null }) }}>Nothing was changed.</LocalBanner>
        ) : (
          <div className="grid items-start gap-4 lg:grid-cols-[14rem_20rem_minmax(0,1fr)]">
            <nav aria-label="Settings lists" className="flex flex-col gap-1" data-region="lists">
              {/* The four lists are navigation (each is its own URL), so they are links, not buttons. */}
              {SETTINGS_SECTIONS.map((t) => (
                <Link key={t} href={hrefWith({ list: t === "categories" ? null : t, entry: null })} scroll={false} replace className={ROW_LINK} aria-current={t === section ? "page" : undefined} data-list={t} onClick={() => { setQuery(""); setBanner(null) }}>
                  <i className={`fa-light ${ICON[t]} w-4 text-muted-foreground`} aria-hidden="true" />
                  <span className="flex-1 text-start">{sectionLabel(t)}</span>
                  {t === "naming" ? null : <TabsCountBadge count={lists[t].length} />}
                </Link>
              ))}
            </nav>
            {section === "naming" ? (
              <Card className="min-w-0 lg:col-span-2">
                <CardContent>
                  <NamingSection idPrefix="settings-b" onSaved={(text) => setBanner({ tone: "success", text })} />
                </CardContent>
              </Card>
            ) : (
            <>
            <section aria-label={SETTINGS_TAB_LABEL[tab]} className="flex min-w-0 flex-col gap-3 rounded-lg border border-border p-3" data-region="entries">
              <InlineCreate key={tab} tab={tab} names={all.map((r) => r.name)} onAdd={add} />
              <div>
                <Label htmlFor="settings-b-search" className="sr-only">{`Search ${NOUNS[tab]}`}</Label>
                <Input id="settings-b-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${NOUNS[tab]}`} className="h-8" />
              </div>
              {rows.length === 0 ? (
                all.length === 0 ? <EmptyBlock compact title={`No ${NOUNS[tab]} yet`} body="Add the first one above." /> : <EmptyBlock compact title={`No ${NOUNS[tab]} match "${query}"`} action={{ label: "Clear search" }} onAction={() => setQuery("")} />
              ) : (
                <ul className="flex max-h-[34rem] flex-col gap-0.5 overflow-y-auto" aria-label={`${SETTINGS_TAB_LABEL[tab]}, ${rows.length}`}>
                  {rows.map((r) => (
                    <li key={r.id}>
                      {/* Each entry is a record with its own URL (?entry=): a link row, so the list reads as records, not as 45 buttons. */}
                      <Link href={hrefWith({ entry: r.id })} scroll={false} replace className={ROW_LINK} aria-current={selected?.id === r.id ? "true" : undefined} data-entry={r.id}>
                        <span className={`min-w-0 flex-1 truncate text-start ${r.active ? "text-foreground" : "text-muted-foreground"}`} data-viz-label>{r.name}</span>
                        {!r.active ? <i className="fa-light fa-circle-minus text-xs text-muted-foreground" role="img" aria-label="Inactive" /> : null}
                        {r.isNew ? <Badge variant="outline">New</Badge> : null}
                        <span className="tabular-nums text-xs text-muted-foreground" aria-label={`used ${fmt(r.uses)} times`}>{fmt(r.uses)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            {selected ? <Detail tab={tab} row={selected} partial={demo === "partial"} onToggle={toggle} onDelete={setDeleting} /> : <Card size="sm"><CardContent><EmptyBlock compact title={`Choose a ${NOUN[tab]} to see what uses it`} /></CardContent></Card>}
            </>
            )}
          </div>
        )}
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
    </PageFrame>
  )
}

function InlineCreate({ tab, names, onAdd }: { tab: SettingsTab; names: string[]; onAdd: (name: string, email?: string) => void }) {
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const ref = React.useRef<HTMLInputElement>(null)
  const submit = () => {
    const e = validateEntry(tab, name, names, tab === "instructors" ? email : undefined)
    setError(e)
    if (e) return ref.current?.focus()
    onAdd(name, tab === "instructors" ? email : undefined)
    setName("")
    setEmail("")
  }
  return (
    <form noValidate aria-label={`Add a ${NOUN[tab]}`} className="flex flex-col gap-1.5" onSubmit={(e) => { e.preventDefault(); submit() }} data-inline-create>
      <div className="flex items-center gap-2">
        <Label htmlFor="settings-b-new" className="sr-only">{tab === "instructors" ? "Name" : `New ${NOUN[tab]}`}</Label>
        <Input ref={ref} id="settings-b-new" value={name} onChange={(e) => setName(e.target.value)} placeholder={tab === "instructors" ? "Instructor name" : `New ${NOUN[tab]}`} className="h-8 min-w-0 flex-1" aria-invalid={!!error || undefined} aria-describedby={error ? "settings-b-error" : undefined} />
        <Button type="submit" variant="default" size="sm">Add</Button>
      </div>
      {tab === "instructors" ? (
        <>
          <Label htmlFor="settings-b-email" className="sr-only">Email</Label>
          <Input id="settings-b-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="h-8" aria-invalid={!!error || undefined} aria-describedby={error ? "settings-b-error" : undefined} />
        </>
      ) : null}
      {error ? <p id="settings-b-error" role="alert" className="text-sm text-destructive">{error}</p> : null}
    </form>
  )
}

function UseList({ title, lines }: { title: string; lines: Array<{ key: string; primary: string; secondary: string }> }) {
  const [all, setAll] = React.useState(false)
  if (lines.length === 0) return null
  const shown = all ? lines : lines.slice(0, FIRST)
  return (
    <section className="flex flex-col gap-1" data-uses-count={lines.length}>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <ul className="flex flex-col divide-y divide-border">
        {shown.map((l) => (
          <li key={l.key} className="flex items-center justify-between gap-3 py-1.5">
            <span className="min-w-0 truncate text-sm text-foreground">{l.primary}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{l.secondary}</span>
          </li>
        ))}
      </ul>
      {lines.length > FIRST ? <div><Button type="button" variant="ghost" size="sm" onClick={() => setAll((x) => !x)}>{all ? `Show the first ${FIRST}` : `Show all ${fmt(lines.length)}`}</Button></div> : null}
    </section>
  )
}

function Detail({ tab, row, partial, onToggle, onDelete }: { tab: SettingsTab; row: SettingsRow; partial: boolean; onToggle: (r: SettingsRow) => void; onDelete: (r: SettingsRow) => void }) {
  const data = useV2State()
  const blocked = partial ? "Usage counts are still loading" : row.blocked
  const sections: Array<{ title: string; what?: SettingUse }> =
    tab === "settings"
      ? [
          { title: plural((row as ClinicalSettingRow).sites, "active site", "active sites"), what: "sites" },
          { title: `${plural((row as ClinicalSettingRow).rules, skillNoun(), skillNounPlural())} with a minimum here`, what: "rules" },
          { title: plural((row as ClinicalSettingRow).courses, "course places students here", "courses place students here"), what: "courses" },
        ]
      : [{ title: tab === "instructors" ? plural(row.uses, "evaluation signed", "evaluations signed") : `Used by ${plural(row.uses, skillNoun(), skillNounPlural())}` }]
  return (
    <Card size="sm" className="min-w-0" data-settings-detail={row.id} data-region="detail">
      <CardHeader className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">{row.name}</CardTitle>
          {row.active ? <span className="text-sm text-muted-foreground">Active</span> : <StatusBadge label="Inactive" tone="neutral" icon="fa-circle-minus" size="sm" />}
        </div>
        {tab === "instructors" ? <p className="text-sm text-muted-foreground">{(row as InstructorRow).email}</p> : null}
        {tab === "settings" ? <p className="text-sm text-muted-foreground">{`${plural((row as ClinicalSettingRow).evidence, "evaluation", "evaluations")} recorded in this setting.`}</p> : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {row.uses === 0 ? <p className="text-sm text-muted-foreground">{`Nothing uses this ${NOUN[tab]} yet.`}</p> : sections.map((s) => <UseList key={s.title} title={s.title} lines={usesOf(data, tab, row.name, row.id, s.what)} />)}
        <div className="flex flex-col gap-2 border-t border-border pt-4">
          {/* Delete shows only while it can run (strategy/07: no disabled control); the line below says why it is absent. */}
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onToggle(row)}>{row.active ? "Deactivate" : "Reactivate"}</Button>
            {blocked ? null : <Button type="button" variant="outline" size="sm" onClick={() => onDelete(row)}>Delete</Button>}
          </div>
          <p id="settings-b-delete-why" className="text-xs text-muted-foreground">
            {blocked ? `${blocked}, so it cannot be deleted. Deactivate keeps it where it is used and stops offering it.` : `Nothing uses it, so it can be deleted.`}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

