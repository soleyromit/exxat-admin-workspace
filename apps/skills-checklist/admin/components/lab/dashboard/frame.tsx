"use client"

/**
 * Page chrome shared by every admin dashboard variant (strategy/06 section 4.1): PageHeader with one action (Export), the
 * Sample data chip, no subtitle (D-L8b), the page-wide Filters button in the header beside Export with the applied chips on
 * one line under it only when something is applied (Romit 2026-10-30), or the inline Filters group in the variant's own table
 * toolbar, figures that update on their own, the evidence-recount line, the impossible-filter and
 * empty-scope explanations, the polite announcement, and the demo states. The variant only lays out the regions.
 */
import * as React from "react"
import { SampleDataBadge } from "@/components/lab/import/sample-badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { ExportDrawer } from "@exxatdesignux/ui/components/ui/export-drawer"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { PageFrame } from "@/components/skills/page-header"
import type { V2State } from "@/lib/v2/types"
import { DrillBack } from "@/components/lab/dashboard/drill-back"
import { DASHBOARD_EXPORT_COLUMNS, buildDashboard, chipValue, dashboardHref, removeKeys, withClearState, type DashboardModel, type DemoState, type Split } from "@/lib/lab/dashboard"
import { skillNounPlural } from "@/lib/lab/terms"
import { SCOPE_LABEL, removeScope, type LabScope, type ScopeKey } from "@/lib/lab/scope"
import { ScopeAppliedLine, ScopeBar, ScopeFiltersButton, type ScopeBarProps } from "@/components/lab/dashboard/scope-bar"
import { LoadingShape } from "@/components/lab/dashboard/cards"
import { useDashboardUrl, useSnapshot } from "@/components/lab/dashboard/use-dashboard"

export interface DashboardContext {
  model: DashboardModel
  /** The frozen state the figures were read from (as of the stamp). */
  data: V2State
  scope: LabScope
  split: Split
  demo: DemoState | null
  setSplit: (s: Split) => void
  setParams: (p: Record<string, string | null>) => void
  param: (k: string) => string | null
  clearDemo: () => void
  /** Set the comparison basis (for a chart that carries its own Compare with control). */
  setScope: (next: LabScope) => void
  /**
   * The one Filters group (button, scope summary, removable chips, Clear all). With `filtersInBody` the variant places it in
   * the toolbar of the table or chart it filters (D-L8b); otherwise the frame puts it on the toolbar row above the first figure.
   */
  filters: React.ReactNode
}

/**
 * `basisInChart`: the variant puts Compare with on the chart it changes (variant A, the behind tile), so Filters leaves it out.
 */
export function DashboardPage({ title = "Dashboard", variant, basisInChart = false, drillTitle, filtersInBody, toolbar, children }: {
  title?: string
  variant: string
  basisInChart?: boolean
  /** An in-page drill list (variant C ?list=records): the h1 names what it lists and a back link leads to the dashboard (anatomy A2, A3). */
  drillTitle?: (ctx: DashboardContext) => string | null
  /** The variant places ctx.filters itself (in a table's or a tab list's toolbar) for this state; the frame shows it otherwise. */
  filtersInBody?: (ctx: DashboardContext) => boolean
  /** View controls that share the Filters row, right-aligned (tabs, segments). */
  toolbar?: (ctx: DashboardContext) => React.ReactNode
  children: (ctx: DashboardContext) => React.ReactNode
}) {
  const url = useDashboardUrl()
  const snap = useSnapshot()
  const [exportOpen, setExportOpen] = React.useState(false)
  const built = React.useMemo(() => (snap.state ? buildDashboard(snap.state, url.scope) : null), [snap.state, url.scope])
  const model = built && url.demo === "clear" ? withClearState(built) : built

  const header = title
  const sample = <SampleDataBadge />
  const actionItems = [{ id: "export", label: "Export", icon: "fa-arrow-down-to-line", variant: "outline" as const, onSelect: () => setExportOpen(true) }]

  if (!model) {
    return (
      <PageFrame title={header}>
        <LoadingShape />
      </PageFrame>
    )
  }

  const scopeProps: ScopeBarProps = {
    scope: url.scope,
    options: model.options,
    termName: model.term.name,
    onChange: url.setScope,
    chipValue: (k, v) => (snap.state ? chipValue(snap.state, k, v) : v),
    showBasis: !basisInChart,
    stale: url.demo === "stale",
  }
  const filters = <ScopeBar {...scopeProps} />
  const ctx: DashboardContext = {
    filters,
    model,
    data: snap.state!,
    scope: url.scope,
    split: url.split,
    demo: url.demo,
    setSplit: (s) => url.setParams({ split: s === "none" ? null : s }),
    setParams: url.setParams,
    param: url.param,
    clearDemo: () => url.setParams({ state: null }),
    setScope: url.setScope,
  }
  const applied = (["cohort", "group", "course", "cat", "tag", "loc", "setting"] as ScopeKey[]).filter((k) => !!url.scope[k])
  const drill = drillTitle?.(ctx) ?? null
  // The body shows the variant's own content (not a banner or a loading shape): only then may the variant own the Filters place.
  const bodyShown = url.demo !== "loading" && !(model.kind === "impossible" && model.explained) && !(model.kind === "empty" && url.demo !== "empty")
  const inBody = bodyShown && !!filtersInBody?.(ctx)
  const views = toolbar && bodyShown ? toolbar(ctx) : null

  // Page-wide Filters (Romit 2026-10-30, "filters buttons at wrong places"): in the header beside Export, the applied chips on
  // one line under the header only when something is applied. A variant that filters one table owns the inline group instead.
  const headerFilters = inBody ? null : <ScopeFiltersButton {...scopeProps} />

  return (
    // Header: title, Filters and Export; no subtitle (D-L8b).
    <PageFrame title={drill ?? header} lead={drill ? <DrillBack href={dashboardHref(url.scope)} /> : undefined} actionItems={actionItems} actions={<>{headerFilters}{sample}</>}>
      <div className="flex flex-col gap-6" data-dashboard-lab={`admin-${variant}`} data-page-type="dashboard">
        {inBody ? null : views ? (
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2" data-region="toolbar">
            <ScopeAppliedLine {...scopeProps} />
            {views}
          </div>
        ) : (
          <ScopeAppliedLine {...scopeProps} />
        )}
        <p role="status" aria-live="polite" className="sr-only" data-announce>{url.demo === "loading" ? "Loading dashboard" : model.announce}</p>
        {model.recount ? <p className="text-sm text-muted-foreground" data-recount>{model.recount}</p> : null}
        {url.demo === "loading" ? (
          <LoadingShape />
        ) : model.kind === "impossible" && model.explained ? (
          <LocalBanner variant="info" title="These filters cannot match any evidence">
            <span className="flex flex-col gap-2">
              <span>{model.explained.text}</span>
              <span className="flex flex-wrap gap-2">
                {model.explained.remove.map((r) => (
                  <Button key={r.key} type="button" variant="outline" size="sm" onClick={() => url.setScope(removeKeys(url.scope, [r.key]))}>
                    {`Remove ${SCOPE_LABEL[r.key].toLowerCase()}`}
                  </Button>
                ))}
              </span>
            </span>
          </LocalBanner>
        ) : model.kind === "empty" && url.demo !== "empty" ? (
          <LocalBanner variant="info" title="No students in this scope">
            <span className="flex flex-col gap-2">
              <span>{`${emptyScopeText(model, url.scope, (k, v) => (snap.state ? chipValue(snap.state, k, v) : v))}`}</span>
              <span className="flex flex-wrap gap-2">
                {applied.map((k) => (
                  <Button key={k} type="button" variant="outline" size="sm" onClick={() => url.setScope(removeScope(url.scope, k))}>
                    {`Remove ${SCOPE_LABEL[k].toLowerCase()}`}
                  </Button>
                ))}
              </span>
            </span>
          </LocalBanner>
        ) : (
          children(ctx)
        )}
      </div>
      <ExportDrawer open={exportOpen} onOpenChange={setExportOpen} totalRows={model.inScope} visibleColumns={DASHBOARD_EXPORT_COLUMNS.length} />
    </PageFrame>
  )
}

function emptyScopeText(m: DashboardModel, scope: LabScope, label: (k: ScopeKey, v: string) => string): string {
  const who = scope.group ? `${scope.cohort}, ${scope.group}` : scope.cohort || "Nobody in this scope"
  const course = scope.course ? ` in ${label("course", scope.course)}` : ` in ${m.term.name}`
  const what = scope.cat || scope.tag ? ` with required ${[scope.cat, scope.tag].filter(Boolean).join(", ")} ${skillNounPlural()}` : ""
  return scope.cohort ? `${who} has no students${course}${what}.` : `${who} takes a course${course}${what}.`
}
