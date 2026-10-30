"use client"

/**
 * Settings > Evaluators (Romit 2026-10-27, "sure"; ledger D-L24): the full list of people who sign (preceptors, clinical faculty,
 * lab instructors) for lookup and edits, a Settings section in place of the former evaluator directory page and the Lab
 * instructors list (the same records: a lab instructor is an evaluator with that role, recorded by name and email, REQ SL-08).
 * Unverified names show "Not verified", linking to Approvals, New evaluators, where they are adopted or merged (REQ SL-09). Where
 * evaluator records live platform-wide stays open (OD-05).
 *
 * Settings A renders A (people first: one paginated table with search, role, site and status), Settings B renders B (site first:
 * the sites, then one site's people). The role filter on Lab instructor is the former Lab instructors list (`?role=lab-instructor`).
 * URL: ?q= &role= &site= &setting= &filter=. Demo states: ?state=loading | empty | error.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import type { ColumnDef } from "@exxatdesignux/ui/components/data-table/types"
import { directoryLink, filterDirectory, settingOptions, siteRows, statusFromParam, type EvaluatorRoleKey, type SiteRow } from "@/lib/lab/evaluators"
import { EvaluatorFrame, type DirectoryContext } from "@/components/lab/admin-a/evaluator-frame"
import { DirectoryTable, RoleSelect, SiteSelect, STATUS_OPTS } from "@/components/lab/admin-a/evaluator-parts"
import { FilterSelect, LINK, PaneHeading, SearchField, Toolbar, fmt, plural } from "@/components/lab/admin-a/parts"
import { EmptyBlock } from "@/components/lab/empty-block"

export function EvaluatorsSection({ layout }: { layout: "people" | "sites" }) {
  return layout === "sites" ? (
    <EvaluatorFrame variant="B" embedded summaryInToolbar>{(c) => <SiteFirst c={c} />}</EvaluatorFrame>
  ) : (
    <EvaluatorFrame variant="A" embedded>{(c) => <PeopleFirst c={c} />}</EvaluatorFrame>
  )
}

function PeopleFirst({ c }: { c: DirectoryContext }) {
  const { query } = c
  const q = query.get("q")
  const role = query.get("role") as "" | EvaluatorRoleKey
  const site = query.get("site")
  const status = statusFromParam(query.get("filter"))
  const rows = React.useMemo(() => filterDirectory(c.rows, { q, role, site, status }), [c.rows, q, role, site, status])
  return (
    <>
      <Toolbar label="Find an evaluator">
        <SearchField value={q} onChange={(v) => query.set({ q: v || null })} label="Search evaluators by name, email or site" placeholder="Search name or email" />
        <RoleSelect value={role} onChange={(v) => query.set({ role: v || null })} />
        <SiteSelect value={site} onChange={(v) => query.set({ site: v || null })} sites={c.sites} />
        <FilterSelect value={status === "awaiting" ? "awaiting" : status} onChange={(v) => query.set({ filter: v === "awaiting" ? "unverified" : v || null })} label="Status" allLabel="Any status" options={STATUS_OPTS} className="w-48" />
      </Toolbar>
      <DirectoryTable rows={rows} programRate={c.summary.programRate} />
    </>
  )
}

const NO_SITE = "program"

function SiteFirst({ c }: { c: DirectoryContext }) {
  const { query } = c
  const q = query.get("q")
  const setting = query.get("setting")
  const filter = query.get("filter")
  const role = query.get("role") as "" | EvaluatorRoleKey
  const all = React.useMemo(() => {
    const sites = siteRows(c.state, c.rows)
    const noSite = c.rows.filter((r) => !r.siteId)
    const program: SiteRow = {
      id: NO_SITE,
      facility: "Program",
      unit: "Faculty and lab instructors",
      setting: "Lab or campus",
      evaluators: noSite.length,
      awaiting: noSite.filter((r) => !r.verified).length,
      evaluations: noSite.reduce((n, r) => n + r.evaluations, 0),
      openRequests: noSite.reduce((n, r) => n + r.openRequests, 0),
      oldestDays: noSite.reduce((n, r) => Math.max(n, r.oldestDays), 0),
      flagged: noSite.filter((r) => r.consistency === "above").length,
      haystack: "program faculty lab instructors campus",
    }
    return noSite.length ? [...sites, program] : sites
  }, [c.state, c.rows])
  const sites = React.useMemo(() => {
    const t = q.trim().toLowerCase()
    return all.filter((s) => (!t || s.haystack.includes(t)) && (!setting || s.setting === setting) && (filter !== "unverified" || s.awaiting > 0) && (filter !== "open" || s.openRequests > 0))
  }, [all, q, setting, filter])
  // The former Lab instructors list (?role=lab-instructor) opens on the program row, where lab instructors are.
  const wanted = query.get("site") || (role === "lab-instructor" ? NO_SITE : "")
  const selected = sites.find((s) => s.id === wanted) ?? all.find((s) => s.id === wanted) ?? sites[0]
  const people = React.useMemo(() => (selected ? c.rows.filter((r) => (selected.id === NO_SITE ? !r.siteId : r.siteId === selected.id) && (!role || r.role === role)) : []), [c.rows, selected, role])

  const columns = React.useMemo<ColumnDef<SiteRow>[]>(
    () => [
      {
        key: "facility",
        label: "Site",
        width: 170,
        sortable: true,
        cell: (s) => (
          <span className="flex min-w-0 flex-col py-0.5">
            <Link className={`${LINK} whitespace-normal`} href={directoryLink({ site: s.id, q: q || undefined, filter: filter || undefined })} scroll={false} onClick={(e) => e.stopPropagation()} aria-current={s.id === selected?.id ? "true" : undefined}>{s.facility}</Link>
            <span className="truncate text-xs text-muted-foreground">{`${s.unit} · ${s.setting}`}</span>
          </span>
        ),
      },
      { key: "evaluators", label: "Evaluators", width: 96, sortable: true, cell: (s) => <span className="flex flex-col py-0.5"><span className="text-sm tabular-nums">{fmt(s.evaluators)}</span>{s.awaiting ? <span className="text-xs text-muted-foreground">{`${fmt(s.awaiting)} unverified`}</span> : null}</span> },
      { key: "openRequests", label: "Open requests", width: 112, sortable: true, cell: (s) => (s.openRequests ? <span className="flex flex-col py-0.5"><span className="text-sm tabular-nums">{fmt(s.openRequests)}</span><span className="text-xs text-muted-foreground">{`oldest ${s.oldestDays} d`}</span></span> : <span className="text-sm text-muted-foreground">None</span>) },
    ],
    [q, filter, selected],
  )

  return (
    <>
      <Toolbar label="Find a site" end={c.summaryLine}>
        <SearchField value={q} onChange={(v) => query.set({ q: v || null })} label="Search sites by facility, unit or setting" placeholder="Search sites" className="w-56" />
        <FilterSelect value={setting} onChange={(v) => query.set({ setting: v || null })} label="Setting" allLabel="All settings" options={settingOptions(all).map((s) => ({ value: s, label: s }))} className="w-44" />
        <FilterSelect
          value={filter}
          onChange={(v) => query.set({ filter: v || null })}
          label="Show"
          allLabel="All sites"
          options={[
            { value: "unverified", label: "Unverified names" },
            { value: "open", label: "With open requests" },
          ]}
          className="w-48"
        />
      </Toolbar>
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,23.5rem)_minmax(0,1fr)]">
        <div data-region="sites" className="min-w-0">
          <DataTable<SiteRow>
            data={sites}
            columns={columns}
            getRowId={(s) => s.id}
            openRowId={selected?.id ?? null}
            onRowClick={(s) => query.set({ site: s.id })}
            searchable={false}
            showQueryControls={false}
            edgeInset={false}
            lazyLoading={{ enabled: sites.length > 60, threshold: 60, chunkSize: 40, loadingLabel: "Loading more" }}
            emptyState={<EmptyBlock compact title="No sites match these filters" body="Clear a filter to see more." />}
          />
        </div>
        {selected ? (
          <section aria-labelledby="site-heading" className="flex min-w-0 flex-col gap-3" data-region="site">
            <PaneHeading title={<span id="site-heading">{`${selected.facility}, ${selected.unit}`}</span>} meta={`${selected.setting} · ${plural(selected.evaluators, "evaluator", "evaluators")} · ${plural(selected.evaluations, "evaluation", "evaluations")}`} />
            <DirectoryTable rows={people} programRate={c.summary.programRate} showSite={false} pageSize={25} />
          </section>
        ) : null}
      </div>
    </>
  )
}
