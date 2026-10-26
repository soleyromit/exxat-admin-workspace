"use client"

/**
 * Page chrome for concept E (sites and evaluators). Same parts as the shared DashboardPage (PageFrame with Export and the
 * Sample data chip, the shared ScopeBar, as-of and Refresh, the polite announcement, the impossible-filter and empty-scope
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
import { opsExportColumns, buildDashboard, chipValue, removeKeys, type DashboardModel, type DemoState } from "@/lib/lab/dashboard"
import { SCOPE_LABEL, removeScope, type LabScope, type ScopeKey } from "@/lib/lab/scope"
import { ScopeBar } from "@/components/lab/dashboard/scope-bar"
import { LoadingShape } from "@/components/lab/dashboard/cards"
import { asOfLabel, timeLabel, useDashboardUrl, useSnapshot } from "@/components/lab/dashboard/use-dashboard"
import { fmt } from "@/lib/v2/format"

export interface OpsContext {
  model: DashboardModel
  data: V2State
  scope: LabScope
  demo: DemoState | null
  param: (k: string) => string | null
  setParams: (p: Record<string, string | null>) => void
  clearDemo: () => void
}

export function OpsPage({ variant, children }: { variant: string; children: (ctx: OpsContext) => React.ReactNode }) {
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
  const ctx: OpsContext = { model, data: snap.state, scope: url.scope, demo: url.demo, param: url.param, setParams: url.setParams, clearDemo: () => url.setParams({ state: null }) }
  const announce = url.demo === "loading" ? "Loading dashboard" : url.demo === "clear" ? "Nothing is waiting with an evaluator" : `${fmt(model.waitingCount)} requests waiting with evaluators`
  return (
    // Sample data sits in the page header beside Export, as on every dashboard variant (consistency audit item 10).
    <PageFrame title="Dashboard" actionItems={actionItems} actions={<SampleDataBadge />}>
      <div className="flex flex-col gap-6" data-dashboard-lab={`admin-${variant}`} data-page-type="dashboard">
        <ScopeBar
          scope={url.scope}
          options={model.options}
          termName={model.term.name}
          onChange={url.setScope}
          chipValue={label}
          asOf={asOfLabel(snap.at)}
          onRefresh={snap.refresh}
          stale={url.demo === "stale"}
          showBasis={false}
        />
        <p role="status" aria-live="polite" className="sr-only" data-announce>{announce}</p>
        {snap.fresh ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground" data-new-evidence>
            <i className="fa-light fa-circle-info" aria-hidden="true" />
            {`New evidence since ${timeLabel(snap.at)}.`}
            <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={snap.refresh}>Refresh to update</Button>
          </p>
        ) : null}
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
