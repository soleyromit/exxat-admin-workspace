"use client"

/**
 * Evaluator directory B (alternative): site first. Sites with their setting, evaluators, unverified names, open requests and
 * the oldest wait, filterable by setting (site and setting as the lens, as in RP-08); select a site to see and decide on its
 * evaluators in the pane beside it. Evaluators with no site (program faculty, lab instructors) are one row. Regions: header,
 * toolbar (the program summary on its right, list budget 4), sites and site panes. URL: ?q= &setting= &site= &filter=. Demo states: ?state=loading | empty | error.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import type { ColumnDef } from "@exxatdesignux/ui/components/data-table/types"
import { directoryLink, settingOptions, siteRows, type SiteRow } from "@/lib/lab/evaluators"
import { EvaluatorFrame, type DirectoryContext } from "@/components/lab/admin-a/evaluator-frame"
import { DirectoryTable } from "@/components/lab/admin-a/evaluator-parts"
import { FilterSelect, LINK, PaneHeading, SearchField, Toolbar, fmt, plural } from "@/components/lab/admin-a/parts"
import { EmptyBlock } from "@/components/lab/empty-block"

const NO_SITE = "program"

export function AdminEvaluatorDirectoryB() {
  return <EvaluatorFrame variant="B" summaryInToolbar>{(c) => <SiteFirst c={c} />}</EvaluatorFrame>
}

function SiteFirst({ c }: { c: DirectoryContext }) {
  const { query } = c
  const q = query.get("q")
  const setting = query.get("setting")
  const filter = query.get("filter")
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
  const selected = sites.find((s) => s.id === query.get("site")) ?? all.find((s) => s.id === query.get("site")) ?? sites[0]
  const people = React.useMemo(() => (selected ? c.rows.filter((r) => (selected.id === NO_SITE ? !r.siteId : r.siteId === selected.id)) : []), [c.rows, selected])

  const columns = React.useMemo<ColumnDef<SiteRow>[]>(
    () => [
      {
        key: "facility",
        label: "Site",
        width: 196,
        sortable: true,
        cell: (s) => (
          <span className="flex min-w-0 flex-col py-0.5">
            <Link className={`${LINK} truncate`} href={directoryLink({ site: s.id, q: q || undefined, filter: filter || undefined })} scroll={false} onClick={(e) => e.stopPropagation()} aria-current={s.id === selected?.id ? "true" : undefined}>{s.facility}</Link>
            <span className="truncate text-xs text-muted-foreground">{`${s.unit} · ${s.setting}`}</span>
          </span>
        ),
      },
      { key: "evaluators", label: "Evaluators", width: 104, sortable: true, cell: (s) => <span className="flex flex-col py-0.5"><span className="text-sm tabular-nums">{fmt(s.evaluators)}</span>{s.awaiting ? <span className="text-xs text-muted-foreground">{`${fmt(s.awaiting)} unverified`}</span> : null}</span> },
      { key: "openRequests", label: "Open requests", width: 116, sortable: true, cell: (s) => (s.openRequests ? <span className="flex flex-col py-0.5"><span className="text-sm tabular-nums">{fmt(s.openRequests)}</span><span className="text-xs text-muted-foreground">{`oldest ${s.oldestDays} d`}</span></span> : <span className="text-sm text-muted-foreground">None</span>) },
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
      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
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
            <DirectoryTable rows={people} programRate={c.summary.programRate} onAdopt={c.openAdopt} showSite={false} pageSize={25} />
          </section>
        ) : null}
      </div>
    </>
  )
}
