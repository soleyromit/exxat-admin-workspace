"use client"

/**
 * Dashboard drill list (strategy/06 section 3.4, R1 to R5). Opens from any dashboard figure as a route, so it has a URL and
 * a breadcrumb. Same scope, same basis, same as-of rules as the dashboard, read through the same selectors, so its length
 * equals the figure. The condition behind the figure is a removable chip; removing it widens the list to the scope.
 * Lists: students (?cond=behind, &skill=), skills, sites, requests (?cond=waiting|stalled|old|approval|approval-old, &siteId=).
 * RP-06: a row opens an evidence peek beside the table (?row=), the same pane as variant B, so reading a row never leaves the
 * report; the link to the full record sits inside the peek.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { DrillBack } from "@/components/lab/dashboard/drill-back"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import { DrillToolbar } from "@/components/lab/dashboard/drill-toolbar"
import { PersonIdentityCell } from "@exxatdesignux/ui/components/data-views/person-identity-cell"
import { PageFrame } from "@/components/skills/page-header"
import { ScopeBar } from "@/components/lab/dashboard/scope-bar"
import { ImpossibleScopeBanner } from "@/components/lab/dashboard/impossible-scope"
import { BehindBadge, ListLoadError, LoadingShape } from "@/components/lab/dashboard/cards"
import { LINK_IN_TABLE } from "@/components/lab/link-styles"
import { EmptyBlock } from "@/components/lab/empty-block"
import { ConditionLine, DrillPeek, type PeekTarget } from "@/components/lab/dashboard/drill-peek"
import { SampleDataBadge } from "@/components/lab/import/sample-badge"
import { fmt, initialsOf } from "@/lib/v2/format"
import { useDashboardUrl, useLoadTimeout, useSnapshot } from "@/components/lab/dashboard/use-dashboard"
import { buildDrill, chipValue, conditionLabel, dashboardHref, drillHref, pipelineRecords, populationRows, scopeOptions, resolveTerm, type DrillParams, type DrillRequest, type DrillSkill, type DrillStudent, explainScope, recountText } from "@/lib/lab/dashboard"
import type { SiteRow } from "@/lib/lab/dashboard"
import { basisOf } from "@/lib/lab/scope"
import { capitalize, skillNoun, skillNounPlural } from "@/lib/lab/terms"

const LISTS = ["students", "skills", "sites", "requests"] as const
const CONDS = ["behind", "waiting", "stalled", "old", "approval", "approval-old"] as const

export function AdminDashboardDrill() {
  const url = useDashboardUrl()
  const snap = useSnapshot()
  const listRaw = url.param("list")
  const condRaw = url.param("cond")
  const params: DrillParams = {
    list: (LISTS as readonly string[]).includes(listRaw ?? "") ? (listRaw as DrillParams["list"]) : "students",
    // Opened bare (the walkthrough's "Drill list" step, no list or condition), the drill is the dashboard's headline figure:
    // students behind. Its title and length then equal that figure (2026-10-30 review: "123 students in scope" came from
    // "28 behind"). Removing the condition writes list=students, so the list widens to the scope instead of snapping back.
    cond: (CONDS as readonly string[]).includes(condRaw ?? "") ? (condRaw as DrillParams["cond"]) : listRaw === null && condRaw === null ? "behind" : undefined,
    skill: url.param("skill") ?? undefined,
    siteId: url.param("siteId") ?? undefined,
  }
  const from = url.param("from") ?? ""
  const [query, setQuery] = React.useState("")
  const model = React.useMemo(() => (snap.state ? buildDrill(snap.state, url.scope, params) : null), [snap.state, url.scope, params.list, params.cond, params.skill, params.siteId]) // eslint-disable-line react-hooks/exhaustive-deps
  const rowId = url.param("row")
  const records = React.useMemo(() => (snap.state && (params.list === "students" || params.list === "skills") ? pipelineRecords(snap.state, populationRows(snap.state, url.scope)) : []), [snap.state, url.scope, params.list])
  const back = `${dashboardHref(url.scope)}${from ? `#${from}` : ""}`
  const load = useLoadTimeout(!!model && !!snap.state)

  // Bounded loading: the skeleton never stays forever (?state=error is handled in the page below, keeping the scope bar).
  if ((!model || !snap.state) && load.timedOut) {
    return (
      <PageFrame title="Dashboard list" actions={<SampleDataBadge />}>
        <ListLoadError
          onRetry={() => {
            load.reset()
            snap.refresh()
          }}
        />
      </PageFrame>
    )
  }
  if (!model || !snap.state) {
    return (
      <PageFrame title="Loading">
        <LoadingShape />
      </PageFrame>
    )
  }
  const state = snap.state
  const basis = basisOf(url.scope)
  const options = scopeOptions(state, url.scope)
  const term = resolveTerm(state, url.scope)
  const q = query.trim().toLowerCase()
  const match = <T,>(rows: T[], text: (r: T) => string): T[] => (q ? rows.filter((r) => text(r).toLowerCase().includes(q)) : rows)
  const impossible = explainScope(state, url.scope)
  // The row in the peek (RP-06): the same lookup as variant B, so both variants peek the same facts.
  const target: PeekTarget | null = (() => {
    if (!rowId) return null
    if (model.students) { const r = model.students.find((x) => x.id === rowId); return r ? { kind: "student", row: r } : null }
    if (model.skills) { const r = model.skills.find((x) => x.skillId === rowId); return r ? { kind: "skill", row: r } : null }
    if (model.sites) { const r = model.sites.find((x) => x.siteId === rowId); return r ? { kind: "site", row: r, requests: buildDrill(state, url.scope, { list: "requests", cond: "waiting", siteId: r.siteId }).requests ?? [] } : null }
    if (model.requests) { const r = model.requests.find((x) => x.id === rowId); return r ? { kind: "request", row: r } : null }
    return null
  })()
  const peek: Peek = { activeId: rowId, hrefFor: (id) => url.hrefWith({ row: id === rowId ? null : id }), open: (id) => url.setParams({ row: id === rowId ? null : id }) }

  return (
    <PageFrame title={model.title} actions={<SampleDataBadge />} lead={<DrillBack href={back} />}>
      <div className="flex flex-col gap-4" data-drill={params.list} data-drill-count={model.count}>
        {/* One toolbar on the list (D-L8b): scope Filters with its chips (Course sits inside; the comparison is the
            dashboard's, named in the condition chip), the condition, then search. The table's own query controls stay off. */}
        <DrillToolbar id="drill-a-search" filters={<ScopeBar scope={url.scope} options={options} termName={term.name} onChange={url.setScope} chipValue={(k, v) => chipValue(state, k, v)} showBasis={false} />} query={query} onQuery={impossible ? undefined : setQuery}>
          {!impossible && model.condition ? <ConditionLine label={model.condition.label} caption={params.list === "students" && params.cond === "behind" ? model.basisCaption : undefined} removeHref={url.hrefWith(Object.fromEntries(Object.entries({ ...model.condition.remove, list: params.list }).map(([k, v]) => [k, v ?? null])))} /> : null}
        </DrillToolbar>
        {/* RP-08: under a location or setting filter the list counts only evidence from there; said once, as on the dashboard. */}
        {!impossible && recountText(url.scope) ? <p className="text-sm text-muted-foreground" data-recount>{recountText(url.scope)}</p> : null}
        {/* RP-09: a scope that cannot produce evidence is explained in place of the list, never "0 of 3" rows. */}
        <ImpossibleScopeBanner state={state} scope={url.scope} onChange={url.setScope} />
        {impossible ? null : (
        <>
        {url.demo === "error" ? <ListLoadError onRetry={() => url.setParams({ state: null })} /> : null}
        {url.demo === "error" ? null : (
          <div className={`grid items-start gap-4 ${target ? "lg:grid-cols-[minmax(0,1fr)_22rem]" : ""}`} data-region="list">
            <div className="min-w-0">
              {model.students ? <StudentsTable rows={match(model.students, (r) => r.name)} peek={peek} flagLabel={conditionLabel(basis)} skillCol={!!params.skill} /> : null}
              {model.skills ? <SkillsTable rows={match(model.skills, (r) => `${r.name} ${r.category}`)} scope={url.scope} peek={peek} /> : null}
              {model.sites ? <SitesTable rows={match(model.sites, (r) => r.name)} scope={url.scope} peek={peek} /> : null}
              {model.requests ? <RequestsTable rows={match(model.requests, (r) => `${r.student} ${r.evaluator} ${r.skills} ${r.site}`)} peek={peek} /> : null}
            </div>
            {target ? (
              <div className="lg:sticky lg:top-4">
                <DrillPeek target={target} records={records} scope={url.scope} onClose={() => url.setParams({ row: null })} />
              </div>
            ) : null}
          </div>
        )}
        </>
        )}
      </div>
    </PageFrame>
  )
}

/** The open row and how a row opens in place (RP-06): the name is a link to this page with ?row=, so the peek is keyboard reachable. */
interface Peek { activeId: string | null; hrefFor: (id: string) => string; open: (id: string) => void }

const PeekName = ({ peek, id, children }: { peek: Peek; id: string; children: React.ReactNode }) => (
  <Link className={LINK_IN_TABLE} href={peek.hrefFor(id)} scroll={false} aria-expanded={peek.activeId === id}>{children}</Link>
)

function StudentsTable({ rows, peek, flagLabel, skillCol }: { rows: DrillStudent[]; peek: Peek; flagLabel: string; skillCol: boolean }) {
  const columns = [
    { key: "student", label: "Student", width: 240, cell: (r: DrillStudent) => <PersonIdentityCell name={r.name} initials={initialsOf(r.name)} renderName={(n) => <PeekName peek={peek} id={r.id}>{n}</PeekName>} /> },
    { key: "cohort", label: "Cohort", width: 130, cell: (r: DrillStudent) => (r.group ? `${r.cohort}, ${r.group}` : r.cohort) },
    { key: "counted", label: "Evaluations counted", width: 160, cell: (r: DrillStudent) => `${r.collected} of ${r.needed}` },
    { key: "achieved", label: "Required achieved", width: 150, cell: (r: DrillStudent) => `${r.achieved} of ${r.required}` },
    ...(skillCol ? [{ key: "skill", label: `On this ${skillNoun()}`, width: 140, cell: (r: DrillStudent) => r.skillState ?? "" }] : []),
    // When every row carries the same flag (the list is filtered on it), the chip above already says it: no column of
    // identical amber badges (strategy/07 Von Restorff, say it once).
    ...(rows.length > 0 && rows.every((r) => r.behind) ? [] : [{ key: "status", label: "Status", width: 200, cell: (r: DrillStudent) => (r.behind ? <BehindBadge label={flagLabel} /> : <span className="text-sm text-muted-foreground">On track</span>) }]),
  ]
  return <DataTable data={rows as never} columns={columns as never} getRowId={(r) => String((r as unknown as DrillStudent).id)} onRowClick={(r) => peek.open((r as unknown as DrillStudent).id)} openRowId={peek.activeId} selectable={false} searchable={false} showQueryControls={false} edgeInset={false} emptyState={<EmptyBlock compact title="No students match these filters" body="Remove the condition to see everyone in scope." />} />
}

function SkillsTable({ rows, scope, peek }: { rows: DrillSkill[]; scope: ReturnType<typeof useDashboardUrl>["scope"]; peek: Peek }) {
  const columns = [
    { key: "name", label: capitalize(skillNoun()), width: 280, cell: (r: DrillSkill) => <Link className={LINK_IN_TABLE} href={drillHref(scope, { list: "students", skill: r.skillId })}>{r.name}</Link> },
    { key: "category", label: "Category", width: 200, cell: (r: DrillSkill) => r.category },
    { key: "students", label: "Required for", width: 130, cell: (r: DrillSkill) => fmt(r.students) },
    { key: "achieved", label: "Achieved", width: 120, cell: (r: DrillSkill) => fmt(r.achieved) },
    { key: "short", label: "Not yet achieved", width: 150, cell: (r: DrillSkill) => fmt(r.short) },
  ]
  return <DataTable data={rows as never} columns={columns as never} getRowId={(r) => String((r as unknown as DrillSkill).skillId)} onRowClick={(r) => peek.open((r as unknown as DrillSkill).skillId)} openRowId={peek.activeId} selectable={false} searchable={false} showQueryControls={false} edgeInset={false} emptyState={<EmptyBlock compact title={`No required ${skillNounPlural()} in this scope`} />} />
}

function SitesTable({ rows, scope, peek }: { rows: SiteRow[]; scope: ReturnType<typeof useDashboardUrl>["scope"]; peek: Peek }) {
  const columns = [
    { key: "name", label: "Site", width: 300, cell: (r: SiteRow) => <Link className={LINK_IN_TABLE} href={drillHref(scope, { list: "requests", cond: "waiting", siteId: r.siteId })}>{r.name}</Link> },
    { key: "total", label: "Requests waiting", width: 150, cell: (r: SiteRow) => fmt(r.total) },
    { key: "old", label: "15 days or more", width: 140, cell: (r: SiteRow) => fmt(r.buckets[3]) },
    { key: "oldest", label: "Oldest, days", width: 120, cell: (r: SiteRow) => fmt(r.oldest) },
  ]
  return <DataTable data={rows as never} columns={columns as never} getRowId={(r) => String((r as unknown as SiteRow).siteId)} onRowClick={(r) => peek.open((r as unknown as SiteRow).siteId)} openRowId={peek.activeId} selectable={false} searchable={false} showQueryControls={false} edgeInset={false} emptyState={<EmptyBlock compact title="No requests waiting in this scope" />} />
}

function RequestsTable({ rows, peek }: { rows: DrillRequest[]; peek: Peek }) {
  const columns = [
    { key: "student", label: "Student", width: 220, cell: (r: DrillRequest) => <PersonIdentityCell name={r.student} initials={initialsOf(r.student)} renderName={(n) => <PeekName peek={peek} id={r.id}>{n}</PeekName>} /> },
    { key: "skills", label: capitalize(skillNounPlural()), width: 260, cell: (r: DrillRequest) => r.skills },
    { key: "evaluator", label: "Evaluator", width: 180, cell: (r: DrillRequest) => r.evaluator },
    { key: "site", label: "Site", width: 240, cell: (r: DrillRequest) => r.site },
    { key: "days", label: "Days waiting", width: 120, cell: (r: DrillRequest) => fmt(r.days) },
    { key: "status", label: "Status", width: 150, cell: (r: DrillRequest) => r.status },
  ]
  return <DataTable data={rows as never} columns={columns as never} getRowId={(r) => String((r as unknown as DrillRequest).id)} onRowClick={(r) => peek.open((r as unknown as DrillRequest).id)} openRowId={peek.activeId} selectable={false} searchable={false} showQueryControls={false} edgeInset={false} emptyState={<EmptyBlock compact title="No requests match these filters" body="Remove the condition to see every waiting request." />} />
}

