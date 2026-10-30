"use client"

/**
 * Page chrome for concept E (sites and evaluators). Same parts as the shared DashboardPage (PageFrame with Export and the
 * Sample data chip, no subtitle (D-L8b), page-wide Filters in the header with applied chips under it, the polite announcement, the impossible-filter and empty-scope
 * banners, the demo states) with one difference: no Compare with control. Waiting has no basis to compare against
 * (dashboard-concepts README section 4 E), so an inert control would mislead. Reuses the shared hooks and ScopeBar; it
 * does not fork their logic.
 */
import * as React from "react"
import { SampleDataBadge } from "@/components/lab/import/sample-badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { ExportDrawer } from "@exxatdesignux/ui/components/ui/export-drawer"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { PageFrame } from "@/components/skills/page-header"
import type { V2State } from "@/lib/v2/types"
import { DrillBack } from "@/components/lab/dashboard/drill-back"
import { opsExportColumns, buildDashboard, chipValue, dashboardHref, removeKeys, type DashboardModel, type DemoState } from "@/lib/lab/dashboard"
import { SCOPE_LABEL, removeScope, type LabScope, type ScopeKey } from "@/lib/lab/scope"
import { ScopeAppliedLine, ScopeBar, ScopeFiltersButton, type ScopeBarProps } from "@/components/lab/dashboard/scope-bar"
import { LoadingShape } from "@/components/lab/dashboard/cards"
import { useDashboardUrl, useSnapshot } from "@/components/lab/dashboard/use-dashboard"
import { fmt } from "@/lib/v2/format"

export interface OpsContext {
  model: DashboardModel
  data: V2State
  scope: LabScope
  demo: DemoState | null
  param: (k: string) => string | null
  setParams: (p: Record<string, string | null>) => void
  clearDemo: () => void
  /** The one Filters group; with `filtersInBody` the variant places it in its table toolbar (D-L8b). */
  filters: React.ReactNode
}

export function OpsPage({ variant, drillTitle, filtersInBody, children }: { variant: string; /** An in-page drill list (?list=holders|holder): the h1 names it and a back link leads to the dashboard (anatomy A2, A3). */ drillTitle?: (ctx: OpsContext) => string | null; /** The variant places ctx.filters itself for this state (a drill table's toolbar). */ filtersInBody?: (ctx: OpsContext) => boolean; children: (ctx: OpsContext) => React.ReactNode }) {
  const url = useDashboardUrl()
  const snap = useSnapshot()
  const [exportOpen, setExportOpen] = React.useState(false)
  const model = React.useMemo(() => (snap.state ? buildDashboard(snap.state, url.scope) : null), [snap.state, url.scope])
  const actionItems = [{ id: "export", label: "Export", icon: "fa-arrow-down-to-line", variant: "outline" as const, onSelect: () => setExportOpen(true) }]
  if (!model || !snap.state) {
    return (
      <PageFrame title="Dashboard">
        <LoadingShape />
      </PageFrame>
    )
  }
  const label = (k: ScopeKey, v: string) => chipValue(snap.state!, k, v)
  const applied = (["cohort", "group", "course", "cat", "tag", "loc", "setting"] as ScopeKey[]).filter((k) => !!url.scope[k])
  const scopeProps: ScopeBarProps = { scope: url.scope, options: model.options, termName: model.term.name, onChange: url.setScope, chipValue: label, showBasis: false, stale: url.demo === "stale" }
  const filters = <ScopeBar {...scopeProps} />
  const ctx: OpsContext = { model, data: snap.state, scope: url.scope, demo: url.demo, param: url.param, setParams: url.setParams, clearDemo: () => url.setParams({ state: null }), filters }
  const drill = drillTitle?.(ctx) ?? null
  const bodyShown = url.demo !== "loading" && !(model.kind === "impossible" && model.explained) && !(model.kind === "empty" && url.demo !== "empty")
  const inBody = bodyShown && !!filtersInBody?.(ctx)
  const announce = url.demo === "loading" ? "Loading dashboard" : url.demo === "clear" ? "Nothing is waiting with an evaluator" : `${fmt(model.waitingCount)} requests waiting with evaluators`
  return (
    // Sample data sits in the page header beside Export, as on every dashboard variant (consistency audit item 10).
    <PageFrame title={drill ?? "Dashboard"} lead={drill ? <DrillBack href={dashboardHref(url.scope)} /> : undefined} actionItems={actionItems} actions={<>{inBody ? null : <ScopeFiltersButton {...scopeProps} />}<SampleDataBadge /></>}>
      <div className="flex flex-col gap-6" data-dashboard-lab={`admin-${variant}`} data-page-type="dashboard">
        {/* No subtitle (D-L8b). Page-wide Filters sits in the header beside Export (Romit 2026-10-30); the applied chips show on
            one line here only when something is applied. A drill table owns the inline group instead. */}
        {inBody ? null : <ScopeAppliedLine {...scopeProps} />}
        <p role="status" aria-live="polite" className="sr-only" data-announce>{announce}</p>
        {/* RP-08: under a location or setting filter only requests at sites there count, said once, as on A to D and F. */}
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
              <span>Nobody in this scope takes a course this term. Remove a filter to see requests again.</span>
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
      <ExportDrawer open={exportOpen} onOpenChange={setExportOpen} totalRows={model.waitingCount} visibleColumns={opsExportColumns().length} />
    </PageFrame>
  )
}
