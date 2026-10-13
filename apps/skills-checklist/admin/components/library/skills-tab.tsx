"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@exxatdesignux/ui/components/ui/dropdown-menu"
import { FilterBar, FilterBarClearButton } from "@exxatdesignux/ui/components/ui/filter-bar"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { EmptyState } from "@/components/skills"
import { buttons, skillsExtra as X, surface } from "@/lib/copy"
import { prototypeCriteria, r1 } from "@/lib/copy/r1-library"
import { ok, listSkills, setSkillActive, unconfiguredCount } from "@/lib/store"
import { useDb } from "@/lib/store/react"
import { ROUTES } from "@/lib/skills-routes"
import { useLibraryDialogs } from "./dialog-bridge"
import { ActiveBadge, BannerStack, TableSkeleton, useBanners, useRunner } from "./library-ui"
import { useMounted } from "./use-mounted"

// ---------------------------------------------------------------- filters in the query string (SL-10)

interface Filters {
  q: string
  category: string
  tag: string
  status: string
  batch: string
  /** S-06 "Required by": only skills whose minimum names this clinical setting. */
  setting: string
}
const NO_FILTERS: Filters = { q: "", category: "", tag: "", status: "", batch: "", setting: "" }
const KEYS = Object.keys(NO_FILTERS) as Array<keyof Filters>
const STATUSES = ["active", "unconfigured", "inactive"] as const

function parseFilters(query: string): Filters {
  const sp = new URLSearchParams(query)
  const status = sp.get("status") ?? ""
  return {
    q: sp.get("q") ?? "",
    category: sp.get("category") ?? "",
    tag: sp.get("tag") ?? "",
    status: (STATUSES as readonly string[]).includes(status) ? status : "",
    batch: sp.get("batch") ?? "",
    setting: sp.get("setting") ?? "",
  }
}
const sameFilters = (a: Filters, b: Filters) => KEYS.every((k) => a[k] === b[k])

/**
 * Filters are state first and the URL second: the URL carries shareable state and also feeds links from other surfaces
 * (?status=unconfigured, ?batch=, ?setting=, ?category=, ?tag=). Keys that are not filters (`tab`, `dialog`, `imported`) are kept.
 */
function useSkillFilters() {
  const pathname = usePathname()
  const router = useRouter()
  const params = useSearchParams()
  const key = params?.toString() ?? ""
  const [filters, setFilters] = React.useState<Filters>(() => parseFilters(key))
  const ref = React.useRef(filters)
  ref.current = filters
  const keyRef = React.useRef(key)
  keyRef.current = key
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    const next = parseFilters(key)
    if (!sameFilters(next, ref.current)) {
      ref.current = next
      setFilters(next)
    }
  }, [key])
  React.useEffect(() => () => void (timer.current && clearTimeout(timer.current)), [])

  const update = React.useCallback(
    (patch: Partial<Filters>, opts: { debounce?: boolean } = {}) => {
      const next = { ...ref.current, ...patch }
      ref.current = next
      setFilters(next)
      const go = () => {
        const sp = new URLSearchParams(keyRef.current)
        for (const k of KEYS) {
          if (next[k]) sp.set(k, next[k])
          else sp.delete(k)
        }
        const q = sp.toString()
        router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false })
      }
      if (timer.current) clearTimeout(timer.current)
      if (opts.debounce) timer.current = setTimeout(go, 250)
      else go()
    },
    [pathname, router],
  )
  return { filters, update, clear: () => update({ ...NO_FILTERS }) }
}

// ---------------------------------------------------------------- rows

type SkillTableRow = {
  id: string
  name: string
  description: string
  tags: Array<{ id: string; name: string; inactive: boolean }>
  categoryLabel: string
  model: string
  criteria: string
  courses: number
  configured: boolean
  active: boolean
  batchLabel: string
}

/** Stable "Import n" labels: the order batches were confirmed (IM-11). */
function useBatchLabels() {
  const db = useDb()
  return React.useMemo(() => {
    const confirmed = db.importBatches.filter((b) => b.status === "confirmed").sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    return new Map(confirmed.map((b, i) => [b.id, i + 1]))
  }, [db.importBatches])
}

const s04 = surface.s04
/** The DataTable toggles a row's selection on any click inside the row; controls inside a cell must not. */
const stopRowToggle = (e: React.SyntheticEvent) => e.stopPropagation()

// ---------------------------------------------------------------- the tab

/**
 * Skills tab (P-04). Banners (import result, unconfigured count), then ONE table card: toolbar (search, three filters, Import,
 * Add skill) and the seven-column table, exactly as in the prototype. Add skill is the one filled primary. Add, Edit and
 * Configure go through the dialog bridge so R2's dialogs (or the full-page routes until they mount) open.
 */
export function SkillsTab() {
  const mounted = useMounted()
  const db = useDb()
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const dialogs = useLibraryDialogs()
  const batchNo = useBatchLabels()
  const { filters, update, clear } = useSkillFilters()
  const banners = useBanners()
  const attempt = useRunner(banners)
  const tableRef = React.useRef<HTMLDivElement>(null)
  const focusTable = React.useRef(false)
  const lastReturn = React.useRef<string | null>(null)
  const [confirm, setConfirm] = React.useState<{ ids: string[] } | null>(null)

  const importedBatch = params?.get("imported") ?? ""
  const importedSkills = importedBatch ? db.skills.filter((s) => s.importBatchId === importedBatch) : []
  const dismissImported = () => {
    const sp = new URLSearchParams(params?.toString() ?? "")
    sp.delete("imported")
    const q = sp.toString()
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false })
  }

  const status = filters.status
  const rows: SkillTableRow[] = React.useMemo(() => {
    const matched = listSkills(db, {
      q: filters.q || undefined,
      categoryId: filters.category || undefined,
      tagId: filters.tag || undefined,
      status: (status || "all") as "all" | "active" | "inactive" | "unconfigured",
      batchId: filters.batch || undefined,
      settingId: filters.setting || undefined,
    })
    return matched
      .filter((r) => status === "inactive" || r.skill.active)
      .map((r) => ({
        id: r.skill.id,
        name: r.skill.name,
        description: r.skill.description,
        tags: r.tags.map((t) => ({ id: t.id, name: t.name, inactive: t.inactive })),
        categoryLabel: r.category ? (r.category.active ? r.category.name : X.inactiveCategory(r.category.name)) : "",
        model: r.skill.model ? r1.modelNames[r.skill.model.kind] : "",
        criteria: r.configured ? prototypeCriteria(r.criteria) : "",
        courses: r.courseCount,
        configured: r.configured,
        active: r.skill.active,
        batchLabel: r.skill.importBatchId && batchNo.get(r.skill.importBatchId) ? s04.fromImport(batchNo.get(r.skill.importBatchId)!) : "",
      }))
  }, [db, filters, status, batchNo])

  const hiddenInactive = React.useMemo(
    () => (status === "inactive" ? 0 : listSkills(db, { q: filters.q || undefined, categoryId: filters.category || undefined, tagId: filters.tag || undefined, batchId: filters.batch || undefined, settingId: filters.setting || undefined, status: "inactive" }).length),
    [db, filters, status],
  )

  const total = db.skills.length
  const needs = unconfiguredCount(db)
  const anyFilter = Object.values(filters).some(Boolean)
  const byId = React.useMemo(() => new Map(db.skills.map((s) => [s.id, s])), [db.skills])

  React.useEffect(() => {
    if (focusTable.current) {
      focusTable.current = false
      tableRef.current?.focus()
    }
  })

  // ------------------------------------------------ actions
  const deactivate = (ids: string[]) => {
    const names = ids.map((id) => byId.get(id)?.name ?? id)
    return attempt(
      "Deactivating",
      (d) => {
        let cur = d
        for (const id of ids) {
          const r = setSkillActive(cur, id, false)
          if (!r.ok) return r
          cur = r.db
        }
        return ok(cur, undefined)
      },
      ids.length === 1 ? X.deactivated(names[0]) : X.deactivatedMany(ids.length),
    )
  }
  const reactivate = (id: string) => attempt("Reactivating", (d) => setSkillActive(d, id, true), X.reactivated(byId.get(id)?.name ?? ""))
  const focusStatusButton = (id: string | null) => {
    const el = id ? document.querySelector<HTMLElement>(`[data-status-menu="${CSS.escape(id)}"]`) : null
    ;(el ?? tableRef.current)?.focus()
  }

  // ------------------------------------------------ chips: only the filter the toolbar has no control for (setting)
  const settingName = filters.setting ? (db.clinicalSettings.find((x) => x.id === filters.setting)?.name ?? filters.setting) : ""
  const batchOptions = db.importBatches.filter((b) => b.status === "confirmed" && batchNo.has(b.id) && db.skills.some((s) => s.importBatchId === b.id))

  // ------------------------------------------------ columns (P-04: Skill, Category, Evaluation model, Achievement criteria, Courses, Status, action)
  const columns = [
    {
      key: "name",
      label: r1.columns[0],
      width: 200,
      sortable: true,
      cell: (r: SkillTableRow) => (
        <div className="flex min-w-0 flex-col gap-1 py-1">
          <Button type="button" variant="link" size="sm" className="h-auto w-fit justify-start p-0 text-left font-medium text-foreground" onClick={(e) => { stopRowToggle(e); lastReturn.current = r.id; dialogs.openConfigure(r.id) }}>
            {r.name}
          </Button>
          {r.description ? <span className="line-clamp-2 text-xs text-muted-foreground">{r.description}</span> : null}
          {r.tags.length > 0 ? (
            <ul className="flex flex-wrap gap-1" aria-label={`Tags for ${r.name}`}>
              {r.tags.map((t) => (
                <li key={t.id}>
                  <Badge variant="secondary">{t.inactive ? X.inactiveTag(t.name) : t.name}</Badge>
                </li>
              ))}
            </ul>
          ) : null}
          {r.batchLabel ? <span className="text-xs text-muted-foreground">{r.batchLabel}</span> : null}
        </div>
      ),
    },
    { key: "categoryLabel", label: r1.columns[1], width: 100, sortable: true, cell: (r: SkillTableRow) => <span className="text-sm">{r.categoryLabel}</span> },
    {
      key: "model",
      label: r1.columns[2],
      width: 170,
      cell: (r: SkillTableRow) => (r.configured ? <Badge variant="secondary" className="h-auto whitespace-normal text-left">{r.model}</Badge> : <span className="text-sm text-muted-foreground">{r1.notConfigured}</span>),
    },
    { key: "criteria", label: r1.columns[3], width: 300, cell: (r: SkillTableRow) => <span className="text-sm">{r.configured ? r.criteria : r1.dash}</span> },
    {
      key: "courses",
      label: r1.columns[4],
      width: 70,
      sortable: true,
      cell: (r: SkillTableRow) =>
        r.courses > 0 ? (
          <Link onClick={stopRowToggle} className="text-sm text-interactive-hover-foreground underline underline-offset-2" href={`${ROUTES.courseMapping}?skill=${r.id}`} aria-label={`${X.coursesLink(r.courses)}, open course mapping for ${r.name}`}>
            {r.courses}
          </Link>
        ) : (
          <span className="text-sm text-muted-foreground">0</span>
        ),
    },
    {
      key: "status",
      label: r1.columns[5],
      width: 160,
      cell: (r: SkillTableRow) => {
        const shown = !r.active ? r1.statusInactive : !r.configured ? r1.statusNeedsConfiguration : r1.statusActive
        const badge = !r.active ? <ActiveBadge active={false} /> : !r.configured ? <StatusBadge label={r1.statusNeedsConfiguration} tone="warning" icon="fa-circle-exclamation" size="sm" /> : <ActiveBadge active />
        return (
          <div onClick={stopRowToggle} onKeyDown={stopRowToggle}>
            {/* The prototype's status pill is a button; here it opens the deactivate / reactivate menu (SL-11). */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="sm" className="h-auto p-0" data-status-menu={r.id} aria-label={`${shown}. ${X.rowMenu(r.name)}`}>
                  {badge}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {r.active ? (
                  <DropdownMenuItem onSelect={() => { lastReturn.current = r.id; setConfirm({ ids: [r.id] }) }}>{buttons.deactivateSkill}</DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onSelect={() => { reactivate(r.id); window.setTimeout(() => focusStatusButton(r.id), 0) }}>{X.reactivate}</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
    {
      key: "actions",
      label: "Actions",
      width: 110,
      resizable: false,
      defaultPin: "right" as const,
      cell: (r: SkillTableRow) => (
        <Button type="button" variant="ghost" size="sm" aria-label={`${r.configured ? r1.edit : r1.configure}: ${r.name}`} onClick={(e) => { stopRowToggle(e); lastReturn.current = r.id; dialogs.openConfigure(r.id) }}>
          <i className="fa-light fa-pencil" aria-hidden="true" />
          {r.configured ? r1.edit : r1.configure}
        </Button>
      ),
    },
  ]

  // ------------------------------------------------ states
  const emptyLibrary = total === 0
  const emptyState = emptyLibrary ? (
    <EmptyState
      icon="fa-list-check"
      title={s04.emptyLibrary}
      footer={
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={dialogs.openImport}>
            {r1.import}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={dialogs.openAddSkill}>
            {r1.addSkill}
          </Button>
        </div>
      }
    />
  ) : (
    <EmptyState
      icon="fa-filter"
      title={s04.emptyFiltered}
      footer={
        <Button type="button" variant="outline" size="sm" onClick={clear}>
          {buttons.clearFilters}
        </Button>
      }
    />
  )

  const confirmSkills = confirm ? confirm.ids.map((id) => byId.get(id)).filter((s): s is NonNullable<typeof s> => !!s) : []
  const mappedTotal = confirmSkills.reduce((n, s) => n + db.offeringSkillMaps.filter((m) => m.skillId === s.id).length, 0)
  const firstUnconfigured = (importedSkills.length ? importedSkills : db.skills).find((s) => s.model === null)

  return (
    <>
      <h2 className="sr-only">{X.tableLabel}</h2>

      {importedBatch && importedSkills.length > 0 ? (
        <LocalBanner variant="success" dismissible onDismiss={dismissImported} action={firstUnconfigured ? { label: r1.configureNow, onClick: () => dialogs.openConfigure(firstUnconfigured.id) } : undefined}>
          {r1.importedBanner(importedSkills.length)}
        </LocalBanner>
      ) : null}

      {needs > 0 ? (
        <LocalBanner
          variant="info"
          action={{
            label: r1.showThem,
            onClick: () => {
              focusTable.current = true
              update({ status: "unconfigured" })
            },
          }}
        >
          {r1.unconfiguredBanner(needs)} {X.progress(total - needs, total)}.
        </LocalBanner>
      ) : null}

      <BannerStack items={banners.items} onDismiss={banners.dismiss} />

      <Card className="gap-0 overflow-hidden py-0">
        {/* Toolbar inside the card, as in the prototype: search, three filters, Import, Add skill (the one filled primary). */}
        <CardContent className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <div className="relative min-w-56 flex-1">
            <Label htmlFor="skill-search" className="sr-only">
              {X.searchLabel}
            </Label>
            <i className="fa-light fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="skill-search" type="search" className="pl-9" value={filters.q} placeholder={r1.search} onChange={(e) => update({ q: e.target.value }, { debounce: true })} />
          </div>
          <FilterSelect label={X.filterLabels.category} value={filters.category || "all"} shown={filters.category ? (filters.category === "none" ? r1.noCategory : (db.categories.find((c) => c.id === filters.category)?.name ?? r1.allCategories)) : r1.allCategories} onChange={(v) => update({ category: v === "all" ? "" : v })}>
            <SelectItem value="all">{r1.allCategories}</SelectItem>
            <SelectItem value="none">{r1.noCategory}</SelectItem>
            {db.categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.active ? c.name : X.inactiveCategory(c.name)}
              </SelectItem>
            ))}
          </FilterSelect>
          <FilterSelect label={X.filterLabels.tag} value={filters.tag || "all"} shown={filters.tag ? (db.tags.find((t) => t.id === filters.tag)?.name ?? r1.allTags) : r1.allTags} onChange={(v) => update({ tag: v === "all" ? "" : v })}>
            <SelectItem value="all">{r1.allTags}</SelectItem>
            {db.tags.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.active ? t.name : X.inactiveTag(t.name)}
              </SelectItem>
            ))}
          </FilterSelect>
          <FilterSelect label={X.filterLabels.status} value={filters.status || "all"} shown={{ active: r1.statusActive, unconfigured: r1.statusNeedsConfiguration, inactive: r1.statusInactive }[filters.status] ?? r1.allStatuses} onChange={(v) => update({ status: v === "all" ? "" : v })}>
            <SelectItem value="all">{r1.allStatuses}</SelectItem>
            <SelectItem value="active">{r1.statusActive}</SelectItem>
            <SelectItem value="unconfigured">{r1.statusNeedsConfiguration}</SelectItem>
            <SelectItem value="inactive">{r1.statusInactive}</SelectItem>
          </FilterSelect>
          {batchOptions.length > 0 ? (
            <FilterSelect label={X.filterLabels.batch} value={filters.batch || "all"} shown={filters.batch && batchNo.get(filters.batch) ? X.importBatchOption(batchNo.get(filters.batch)!) : s04.filters.allImports} onChange={(v) => update({ batch: v === "all" ? "" : v })}>
              <SelectItem value="all">{s04.filters.allImports}</SelectItem>
              {batchOptions.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {X.importBatchOption(batchNo.get(b.id)!)}
                </SelectItem>
              ))}
            </FilterSelect>
          ) : null}
          <Button type="button" variant="outline" size="default" onClick={dialogs.openImport}>
            <i className="fa-light fa-arrow-up-from-bracket" aria-hidden="true" />
            {r1.import}
          </Button>
          <Button type="button" variant="default" size="default" onClick={dialogs.openAddSkill}>
            <i className="fa-light fa-plus" aria-hidden="true" />
            {r1.addSkill}
          </Button>
        </CardContent>

        {settingName ? (
          <FilterBar aria-label="Applied filters" className="border-b border-border px-3 py-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background py-0.5 pl-3 pr-1 text-xs text-foreground">
              <span>
                {X.filterLabels.setting}: {settingName}
              </span>
              <Button type="button" variant="ghost" size="icon-xs" aria-label={X.removeFilter(X.filterLabels.setting, settingName)} onClick={() => update({ setting: "" })}>
                <i className="fa-light fa-xmark" aria-hidden="true" />
              </Button>
            </span>
            <FilterBarClearButton onClick={clear}>{X.clearAll}</FilterBarClearButton>
          </FilterBar>
        ) : null}

        <p role="status" aria-live="polite" className="sr-only">
          {mounted ? X.resultCount(rows.length) : ""}
        </p>

        {status !== "inactive" && hiddenInactive > 0 ? (
          <p className="border-b border-border px-4 py-2 text-sm text-muted-foreground">
            {X.inactiveHidden(hiddenInactive)}{" "}
            <Button type="button" variant="link" size="sm" onClick={() => update({ status: "inactive" })}>
              {X.showInactive}
            </Button>
          </p>
        ) : null}

        <div ref={tableRef} tabIndex={-1} className="outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={X.tableLabel} role="group">
          {!mounted ? (
            <div className="p-4">
              <TableSkeleton label={X.loading} />
            </div>
          ) : emptyLibrary && !anyFilter ? (
            <div className="p-4">{emptyState}</div>
          ) : (
            <DataTable<SkillTableRow>
              data={rows}
              columns={columns}
              getRowId={(r) => r.id}
              selectable={false}
              searchable={false}
              showQueryControls={false}
              edgeInset={false}
              emptyState={emptyState}
            />
          )}
        </div>
      </Card>

      <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent
          onCloseAutoFocus={(e) => {
            e.preventDefault()
            focusStatusButton(lastReturn.current)
          }}
        >
          <DialogHeader>
            <DialogTitle>{confirmSkills.length === 1 ? s04.deactivate.title(confirmSkills[0].name) : X.deactivateManyTitle(confirmSkills.length)}</DialogTitle>
            <DialogDescription>
              {s04.deactivate.body}
              {mappedTotal > 0 ? ` ${X.mappedWarning(mappedTotal)}` : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button size="default" type="button" variant="outline" onClick={() => setConfirm(null)}>
              {X.cancel}
            </Button>
            <Button
              size="default"
              type="button"
              variant="default"
              onClick={() => {
                if (!confirm) return
                deactivate(confirm.ids)
                setConfirm(null)
              }}
            >
              {X.confirmDeactivate}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/** The trigger's accessible name is "Label: visible value" so the visible text is always inside the name (WCAG 2.5.3). */
function FilterSelect({ label, value, shown, onChange, children }: { label: string; value: string; shown: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger size="default" className="min-w-40" aria-label={`${label}: ${shown}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  )
}
