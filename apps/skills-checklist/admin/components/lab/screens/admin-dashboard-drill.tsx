"use client"

/**
 * Dashboard drill list (strategy/06 section 3.4, R1 to R5). Opens from any dashboard figure as a route, so it has a URL and
 * a breadcrumb. Same scope, same basis, same as-of rules as the dashboard, read through the same selectors, so its length
 * equals the figure. The condition behind the figure is a removable chip; removing it widens the list to the scope.
 * Lists: students (?cond=behind, &skill=), skills, sites, requests (?cond=waiting|stalled|old|approval|approval-old, &siteId=).
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@exxatdesignux/ui/components/ui/breadcrumb"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import { FilterBar } from "@exxatdesignux/ui/components/ui/filter-bar"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { PersonIdentityCell } from "@exxatdesignux/ui/components/data-views/person-identity-cell"
import { PageFrame } from "@/components/skills/page-header"
import { ScopeBar } from "@/components/lab/dashboard/scope-bar"
import { BehindBadge, ListLoadError, LoadingShape } from "@/components/lab/dashboard/cards"
import { LINK_IN_TABLE } from "@/components/lab/link-styles"
import { EmptyBlock } from "@/components/lab/empty-block"
import { ConditionLine } from "@/components/lab/dashboard/drill-peek"
import { SampleDataBadge } from "@/components/lab/import/sample-badge"
import { fmt, initialsOf } from "@/lib/v2/format"
import { asOfLabel, useDashboardUrl, useLoadTimeout, useSnapshot } from "@/components/lab/dashboard/use-dashboard"
import { buildDrill, chipValue, conditionLabel, dashboardHref, drillHref, scopeOptions, studentHref, resolveTerm, type DrillParams, type DrillRequest, type DrillSkill, type DrillStudent } from "@/lib/lab/dashboard"
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
    cond: (CONDS as readonly string[]).includes(condRaw ?? "") ? (condRaw as DrillParams["cond"]) : undefined,
    skill: url.param("skill") ?? undefined,
    siteId: url.param("siteId") ?? undefined,
  }
  const from = url.param("from") ?? ""
  const [query, setQuery] = React.useState("")
  const model = React.useMemo(() => (snap.state ? buildDrill(snap.state, url.scope, params) : null), [snap.state, url.scope, params.list, params.cond, params.skill, params.siteId]) // eslint-disable-line react-hooks/exhaustive-deps
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

  return (
    <PageFrame title={model.title} actions={<SampleDataBadge />}>
      <div className="flex flex-col gap-4" data-drill={params.list} data-drill-count={model.count}>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={back}>Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{model.crumb}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {/* List budget (strategy/07): Course sits in Filters and the comparison is the dashboard's (named in the condition
            line below, changed on the dashboard), so the visible row is term, cohort, Filters, Refresh, then the table search. */}
        <ScopeBar scope={url.scope} options={options} termName={term.name} onChange={url.setScope} chipValue={(k, v) => chipValue(state, k, v)} asOf={asOfLabel(snap.at)} onRefresh={snap.refresh} courseInFilters showBasis={false} />
        {/* Condition and search on one row (the same row as variant B); the table's own query controls stay off, so the page
            has one search, not two filter systems. */}
        <FilterBar aria-label="Condition and search">
          {model.condition ? <ConditionLine label={model.condition.label} caption={params.list === "students" && params.cond === "behind" ? model.basisCaption : undefined} removeHref={url.hrefWith(Object.fromEntries(Object.entries(model.condition.remove).map(([k, v]) => [k, v ?? null])))} /> : null}
          <span className="ms-auto flex items-center gap-2">
            <Label htmlFor="drill-a-search" className="sr-only">Search the list</Label>
            <Input id="drill-a-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="h-8 w-56" />
          </span>
        </FilterBar>
        {url.demo === "error" ? <ListLoadError onRetry={() => url.setParams({ state: null })} /> : null}
        {url.demo === "error" ? null : model.students ? <StudentsTable rows={match(model.students, (r) => r.name)} scope={url.scope} flagLabel={conditionLabel(basis)} skillCol={!!params.skill} /> : null}
        {url.demo !== "error" && model.skills ? <SkillsTable rows={match(model.skills, (r) => `${r.name} ${r.category}`)} scope={url.scope} /> : null}
        {url.demo !== "error" && model.sites ? <SitesTable rows={match(model.sites, (r) => r.name)} scope={url.scope} /> : null}
        {url.demo !== "error" && model.requests ? <RequestsTable rows={match(model.requests, (r) => `${r.student} ${r.evaluator} ${r.skills} ${r.site}`)} scope={url.scope} /> : null}
      </div>
    </PageFrame>
  )
}

function StudentsTable({ rows, scope, flagLabel, skillCol }: { rows: DrillStudent[]; scope: ReturnType<typeof useDashboardUrl>["scope"]; flagLabel: string; skillCol: boolean }) {
  const columns = [
    { key: "student", label: "Student", width: 240, cell: (r: DrillStudent) => <PersonIdentityCell name={r.name} initials={initialsOf(r.name)} renderName={(n) => <Link className={LINK_IN_TABLE} href={studentHref(scope, r.id)}>{n}</Link>} /> },
    { key: "cohort", label: "Cohort", width: 130, cell: (r: DrillStudent) => (r.group ? `${r.cohort}, ${r.group}` : r.cohort) },
    { key: "counted", label: "Evaluations counted", width: 160, cell: (r: DrillStudent) => `${r.collected} of ${r.needed}` },
    { key: "achieved", label: "Required achieved", width: 150, cell: (r: DrillStudent) => `${r.achieved} of ${r.required}` },
    ...(skillCol ? [{ key: "skill", label: `On this ${skillNoun()}`, width: 140, cell: (r: DrillStudent) => r.skillState ?? "" }] : []),
    // When every row carries the same flag (the list is filtered on it), the chip above already says it: no column of
    // identical amber badges (strategy/07 Von Restorff, say it once).
    ...(rows.length > 0 && rows.every((r) => r.behind) ? [] : [{ key: "status", label: "Status", width: 200, cell: (r: DrillStudent) => (r.behind ? <BehindBadge label={flagLabel} /> : <span className="text-sm text-muted-foreground">On track</span>) }]),
  ]
  return <DataTable data={rows as never} columns={columns as never} getRowId={(r) => String((r as unknown as DrillStudent).id)} selectable={false} searchable={false} showQueryControls={false} edgeInset={false} emptyState={<EmptyBlock compact title="No students match these filters" body="Remove the condition to see everyone in scope." />} />
}

function SkillsTable({ rows, scope }: { rows: DrillSkill[]; scope: ReturnType<typeof useDashboardUrl>["scope"] }) {
  const columns = [
    { key: "name", label: capitalize(skillNoun()), width: 280, cell: (r: DrillSkill) => <Link className={LINK_IN_TABLE} href={drillHref(scope, { list: "students", skill: r.skillId })}>{r.name}</Link> },
    { key: "category", label: "Category", width: 200, cell: (r: DrillSkill) => r.category },
    { key: "students", label: "Required for", width: 130, cell: (r: DrillSkill) => fmt(r.students) },
    { key: "achieved", label: "Achieved", width: 120, cell: (r: DrillSkill) => fmt(r.achieved) },
    { key: "short", label: "Not yet achieved", width: 150, cell: (r: DrillSkill) => fmt(r.short) },
  ]
  return <DataTable data={rows as never} columns={columns as never} getRowId={(r) => String((r as unknown as DrillSkill).skillId)} selectable={false} searchable={false} showQueryControls={false} edgeInset={false} emptyState={<EmptyBlock compact title={`No required ${skillNounPlural()} in this scope`} />} />
}

function SitesTable({ rows, scope }: { rows: SiteRow[]; scope: ReturnType<typeof useDashboardUrl>["scope"] }) {
  const columns = [
    { key: "name", label: "Site", width: 300, cell: (r: SiteRow) => <Link className={LINK_IN_TABLE} href={drillHref(scope, { list: "requests", cond: "waiting", siteId: r.siteId })}>{r.name}</Link> },
    { key: "total", label: "Requests waiting", width: 150, cell: (r: SiteRow) => fmt(r.total) },
    { key: "old", label: "15 days or more", width: 140, cell: (r: SiteRow) => fmt(r.buckets[3]) },
    { key: "oldest", label: "Oldest, days", width: 120, cell: (r: SiteRow) => fmt(r.oldest) },
  ]
  return <DataTable data={rows as never} columns={columns as never} getRowId={(r) => String((r as unknown as SiteRow).siteId)} selectable={false} searchable={false} showQueryControls={false} edgeInset={false} emptyState={<EmptyBlock compact title="No requests waiting in this scope" />} />
}

function RequestsTable({ rows, scope }: { rows: DrillRequest[]; scope: ReturnType<typeof useDashboardUrl>["scope"] }) {
  const columns = [
    { key: "student", label: "Student", width: 220, cell: (r: DrillRequest) => <PersonIdentityCell name={r.student} initials={initialsOf(r.student)} renderName={(n) => <Link className={LINK_IN_TABLE} href={studentHref(scope, r.studentId)}>{n}</Link>} /> },
    { key: "skills", label: capitalize(skillNounPlural()), width: 260, cell: (r: DrillRequest) => r.skills },
    { key: "evaluator", label: "Evaluator", width: 180, cell: (r: DrillRequest) => r.evaluator },
    { key: "site", label: "Site", width: 240, cell: (r: DrillRequest) => r.site },
    { key: "days", label: "Days waiting", width: 120, cell: (r: DrillRequest) => fmt(r.days) },
    { key: "status", label: "Status", width: 150, cell: (r: DrillRequest) => r.status },
  ]
  return <DataTable data={rows as never} columns={columns as never} getRowId={(r) => String((r as unknown as DrillRequest).id)} selectable={false} searchable={false} showQueryControls={false} edgeInset={false} emptyState={<EmptyBlock compact title="No requests match these filters" body="Remove the condition to see every waiting request." />} />
}

