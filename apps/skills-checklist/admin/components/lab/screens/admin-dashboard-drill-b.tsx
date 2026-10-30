"use client"

/**
 * Dashboard drill list, variant B: grouped, with an inline peek (strategy/06 section 3.4, R1 to R5).
 *
 * Same list as variant A (same buildDrill model, same scope, same condition chip, same count), but a different mental model:
 * the rows are grouped by the dimension the admin acts on (students by cohort, skills by section, sites by how old their
 * oldest request is, requests by site), each group collapsible with its count, and choosing a row opens a peek beside the list
 * that answers "what is left, and why" without leaving the page. URL: the dashboard scope plus list, cond, skill, siteId, row.
 *
 * Regions (list budget 4): header with a back link · scope bar · condition chip and search on one row · groups and peek.
 */
import * as React from "react"
import { DrillBack } from "@/components/lab/dashboard/drill-back"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@exxatdesignux/ui/components/ui/collapsible"
import { FilterBar } from "@exxatdesignux/ui/components/ui/filter-bar"
import { EmptyBlock } from "@/components/lab/empty-block"
import { SampleDataBadge } from "@/components/lab/import/sample-badge"
import { ConditionLine } from "@/components/lab/dashboard/drill-peek"
import { fmt, initialsOf } from "@/lib/v2/format"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import { PersonIdentityCell } from "@exxatdesignux/ui/components/data-views/person-identity-cell"
import { PageFrame } from "@/components/skills/page-header"
import { ScopeBar } from "@/components/lab/dashboard/scope-bar"
import { ImpossibleScopeBanner } from "@/components/lab/dashboard/impossible-scope"
import { BehindBadge, ListLoadError, LoadingShape } from "@/components/lab/dashboard/cards"
import { DrillPeek, type PeekTarget } from "@/components/lab/dashboard/drill-peek"
import { useDashboardUrl, useLoadTimeout, useSnapshot } from "@/components/lab/dashboard/use-dashboard"
import { buildDrill, chipValue, conditionLabel, dashboardHref, explainScope, recountText, parseDemoState, pipelineRecords, populationRows, resolveTerm, scopeOptions, type DrillParams, type DrillRequest, type DrillSkill, type DrillStudent, type SiteRow } from "@/lib/lab/dashboard"
import { basisOf } from "@/lib/lab/scope"
import { capitalize, skillNoun, skillNounPlural } from "@/lib/lab/terms"

const LISTS = ["students", "skills", "sites", "requests"] as const
const CONDS = ["behind", "waiting", "stalled", "old", "approval", "approval-old"] as const
const OPEN_FIRST = 3

type Row = Record<string, unknown> & { _id: string; _name: string }
interface Group { key: string; label: string; rows: Row[] }

function groupBy<T>(rows: T[], keyOf: (r: T) => string, idOf: (r: T) => string, nameOf: (r: T) => string, order?: (a: string, b: string) => number): Group[] {
  const m = new Map<string, Row[]>()
  for (const r of rows) m.set(keyOf(r), [...(m.get(keyOf(r)) ?? []), { ...(r as object), _id: idOf(r), _name: nameOf(r) } as Row])
  return [...m].map(([key, rs]) => ({ key, label: key, rows: rs })).sort((a, b) => (order ? order(a.key, b.key) : 0) || b.rows.length - a.rows.length || a.label.localeCompare(b.label))
}

export function AdminDashboardDrillB() {
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
  const demo = parseDemoState(url.param("state"))
  const rowId = url.param("row")
  const [query, setQuery] = React.useState("")
  const from = url.param("from") ?? ""
  const model = React.useMemo(() => (snap.state ? buildDrill(snap.state, url.scope, params) : null), [snap.state, url.scope, params.list, params.cond, params.skill, params.siteId]) // eslint-disable-line react-hooks/exhaustive-deps
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
  if (!model || !snap.state || demo === "loading") {
    return (
      <PageFrame title="Loading">
        <LoadingShape />
      </PageFrame>
    )
  }
  const state = snap.state
  const basis = basisOf(url.scope)
  const flag = conditionLabel(basis)
  const term = resolveTerm(state, url.scope)
  const q = query.trim().toLowerCase()
  // RP-09: a scope that cannot produce evidence is explained in place of the groups, never "0 students".
  const impossible = explainScope(state, url.scope)

  let groups: Group[] = []
  let columns: unknown[] = []
  let unit = "students"
  if (model.students) {
    groups = groupBy(model.students, (r) => r.cohort, (r) => r.id, (r) => r.name)
    const allFlagged = model.students.length > 0 && model.students.every((r) => r.behind)
    columns = [
      { key: "student", label: "Student", width: 260, cell: (r: DrillStudent) => <PersonIdentityCell name={r.name} initials={initialsOf(r.name)} /> },
      { key: "group", label: "Group", width: 120, cell: (r: DrillStudent) => r.group ?? "None" },
      { key: "achieved", label: "Required achieved", width: 150, cell: (r: DrillStudent) => <span className="tabular-nums">{`${r.achieved} of ${r.required}`}</span> },
      ...(params.skill ? [{ key: "skill", label: `On this ${skillNoun()}`, width: 160, cell: (r: DrillStudent) => r.skillState ?? "" }] : []),
      ...(allFlagged ? [] : [{ key: "status", label: "Status", width: 200, cell: (r: DrillStudent) => (r.behind ? <BehindBadge label={flag} /> : <span className="text-sm text-muted-foreground">On track</span>) }]),
    ]
  } else if (model.skills) {
    unit = skillNounPlural()
    groups = groupBy(model.skills, (r) => r.category, (r) => r.skillId, (r) => r.name)
    columns = [
      { key: "name", label: capitalize(skillNoun()), width: 300, cell: (r: DrillSkill) => <span className="font-medium text-foreground">{r.name}</span> },
      { key: "students", label: "Required for", width: 130, cell: (r: DrillSkill) => <span className="tabular-nums">{fmt(r.students)}</span> },
      { key: "achieved", label: "Achieved", width: 110, cell: (r: DrillSkill) => <span className="tabular-nums">{fmt(r.achieved)}</span> },
      { key: "short", label: "Not yet achieved", width: 150, cell: (r: DrillSkill) => <span className="tabular-nums">{fmt(r.short)}</span> },
    ]
  } else if (model.sites) {
    unit = "sites"
    const OLD = "Oldest request 15 days or more"
    groups = groupBy(model.sites, (r) => (r.buckets[3] > 0 ? OLD : "Every request under 15 days"), (r) => r.siteId, (r) => r.name, (a) => (a === OLD ? -1 : 1))
    columns = [
      { key: "name", label: "Site", width: 320, cell: (r: SiteRow) => <span className="font-medium text-foreground">{r.name}</span> },
      { key: "total", label: "Requests waiting", width: 150, cell: (r: SiteRow) => <span className="tabular-nums">{fmt(r.total)}</span> },
      { key: "oldest", label: "Oldest, days", width: 120, cell: (r: SiteRow) => <span className="tabular-nums">{fmt(r.oldest)}</span> },
    ]
  } else if (model.requests) {
    unit = "requests"
    groups = groupBy(model.requests, (r) => r.site, (r) => r.id, (r) => `${r.student} ${r.evaluator} ${r.skills}`)
    columns = [
      { key: "student", label: "Student", width: 220, cell: (r: DrillRequest) => <PersonIdentityCell name={r.student} initials={initialsOf(r.student)} /> },
      { key: "skills", label: capitalize(skillNounPlural()), width: 260, cell: (r: DrillRequest) => r.skills },
      { key: "evaluator", label: "Evaluator", width: 180, cell: (r: DrillRequest) => r.evaluator },
      { key: "days", label: "Days waiting", width: 120, cell: (r: DrillRequest) => <span className="tabular-nums">{fmt(r.days)}</span> },
    ]
  }
  const shown = groups.map((g) => ({ ...g, rows: q ? g.rows.filter((r) => r._name.toLowerCase().includes(q)) : g.rows })).filter((g) => g.rows.length > 0)
  const shownCount = shown.reduce((n, g) => n + g.rows.length, 0)

  const target: PeekTarget | null = (() => {
    if (!rowId) return null
    if (model.students) { const r = model.students.find((x) => x.id === rowId); return r ? { kind: "student", row: r } : null }
    if (model.skills) { const r = model.skills.find((x) => x.skillId === rowId); return r ? { kind: "skill", row: r } : null }
    if (model.sites) { const r = model.sites.find((x) => x.siteId === rowId); return r ? { kind: "site", row: r, requests: buildDrill(state, url.scope, { list: "requests", cond: "waiting", siteId: r.siteId }).requests ?? [] } : null }
    if (model.requests) { const r = model.requests.find((x) => x.id === rowId); return r ? { kind: "request", row: r } : null }
    return null
  })()

  // Say the count once (anatomy A5): when the title already carries it, the toolbar names only the groups.
  const countInTitle = model.title.includes(fmt(model.count))
  return (
    <PageFrame title={model.title} actions={<SampleDataBadge />} lead={<DrillBack href={back} />}>
      <div className="flex flex-col gap-4" data-drill={params.list} data-drill-count={model.count} data-drill-variant="B" data-page-type="list">
        {/* One toolbar on the list (D-L8b): scope Filters with its chips (Course inside; the comparison is the dashboard's, as on
            variant A), the condition, the count, then search. */}
        <FilterBar aria-label="Filters, condition and search" data-region="toolbar">
          <ScopeBar scope={url.scope} options={scopeOptions(state, url.scope)} termName={term.name} onChange={url.setScope} chipValue={(k, v) => chipValue(state, k, v)} showBasis={false} />
          {impossible ? null : <>
          {model.condition ? <ConditionLine label={model.condition.label} removeHref={url.hrefWith({ ...Object.fromEntries(Object.entries({ ...model.condition.remove, list: params.list }).map(([k, v]) => [k, v ?? null])), row: null })} /> : null}
          <span className="text-sm tabular-nums text-muted-foreground" aria-live="polite">{q ? `${fmt(shownCount)} of ${fmt(model.count)} ${unit}` : `${countInTitle ? "" : `${fmt(model.count)} ${unit} in `}${fmt(groups.length)} ${groups.length === 1 ? "group" : "groups"}`}</span>
          <span className="ms-auto flex items-center gap-2">
            <Label htmlFor="drill-b-search" className="sr-only">Search the list</Label>
            <Input id="drill-b-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="h-8 w-56" />
          </span>
          </>}
        </FilterBar>
        {/* RP-08: under a location or setting filter the list counts only evidence from there; said once, as on the dashboard. */}
        {!impossible && recountText(url.scope) ? <p className="text-sm text-muted-foreground" data-recount>{recountText(url.scope)}</p> : null}
        <ImpossibleScopeBanner state={state} scope={url.scope} onChange={url.setScope} />
        {impossible ? null : (
        <>
        {demo === "error" ? (
          <ListLoadError onRetry={() => url.setParams({ state: null })} />
        ) : model.count === 0 || demo === "empty" ? (
          <EmptyBlock title={model.condition ? `No ${unit} match these filters` : `No ${unit} in this scope yet`} body={model.condition ? "Remove the condition to see everyone in scope." : "Widen the scope to see more."} />
        ) : (
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]" data-region="list">
            <div className="flex min-w-0 flex-col gap-3">
              {shown.length === 0 ? <EmptyBlock title={`No ${unit} match "${query}"`} action={{ label: "Clear search" }} onAction={() => setQuery("")} /> : null}
              {shown.map((g, i) => (
                <GroupBlock key={`${g.key}-${q ? "q" : ""}`} group={g} columns={columns} defaultOpen={!!q || i < OPEN_FIRST} activeId={rowId} onRow={(id) => url.setParams({ row: id === rowId ? null : id })} />
              ))}
            </div>
            <div className="lg:sticky lg:top-4">
              <DrillPeek target={target} records={records} scope={url.scope} onClose={() => url.setParams({ row: null })} />
            </div>
          </div>
        )}
        </>
        )}
      </div>
    </PageFrame>
  )
}

function GroupBlock({ group, columns, defaultOpen, activeId, onRow }: { group: Group; columns: unknown[]; defaultOpen: boolean; activeId: string | null; onRow: (id: string) => void }) {
  const [open, setOpen] = React.useState(defaultOpen)
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="flex flex-col gap-1" data-drill-group={group.key} data-group-count={group.rows.length}>
      <CollapsibleTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="justify-start gap-2 self-start px-1" aria-label={`${group.label}, ${group.rows.length}. ${open ? "Collapse" : "Expand"}`}>
          <i className={`fa-light ${open ? "fa-chevron-down" : "fa-chevron-right"} text-xs text-muted-foreground`} aria-hidden="true" />
          <span className="text-sm font-semibold text-foreground">{group.label}</span>
          <span className="text-sm tabular-nums text-muted-foreground">{fmt(group.rows.length)}</span>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <DataTable data={group.rows as never} columns={columns as never} getRowId={(r) => String((r as unknown as Row)._id)} selectable={false} searchable={false} showQueryControls={false} edgeInset={false} onRowClick={(r) => onRow(String((r as unknown as Row)._id))} openRowId={activeId} />
      </CollapsibleContent>
    </Collapsible>
  )
}
