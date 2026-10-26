"use client"

/**
 * Page chrome shared by every admin dashboard variant (strategy/06 section 4.1): PageHeader with one action (Export) and the
 * Sample data chip, the scope bar, the quiet "New evidence since" line, the evidence-recount line, the impossible-filter and
 * empty-scope explanations, the polite announcement, and the demo states. The variant only lays out the regions.
 */
import * as React from "react"
import { SampleDataBadge } from "@/components/lab/import/sample-badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { ExportDrawer } from "@exxatdesignux/ui/components/ui/export-drawer"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { PageFrame } from "@/components/skills/page-header"
import type { V2State } from "@/lib/v2/types"
import { DASHBOARD_EXPORT_COLUMNS, buildDashboard, chipValue, removeKeys, withClearState, type DashboardModel, type DemoState, type Split } from "@/lib/lab/dashboard"
import { skillNounPlural } from "@/lib/lab/terms"
import { SCOPE_LABEL, removeScope, type LabScope, type ScopeKey } from "@/lib/lab/scope"
import { ScopeBar } from "@/components/lab/dashboard/scope-bar"
import { LoadingShape } from "@/components/lab/dashboard/cards"
import { asOfLabel, timeLabel, useDashboardUrl, useSnapshot } from "@/components/lab/dashboard/use-dashboard"

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
}

export function DashboardPage({ title = "Dashboard", variant, children }: { title?: string; variant: string; children: (ctx: DashboardContext) => React.ReactNode }) {
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

  const ctx: DashboardContext = {
    model,
    data: snap.state!,
    scope: url.scope,
    split: url.split,
    demo: url.demo,
    setSplit: (s) => url.setParams({ split: s === "none" ? null : s }),
    setParams: url.setParams,
    param: url.param,
    clearDemo: () => url.setParams({ state: null }),
  }
  const applied = (["cohort", "group", "course", "cat", "tag", "loc", "setting"] as ScopeKey[]).filter((k) => !!url.scope[k])

  return (
    // Sample data sits in the page header beside Export (concept frame), so the scope bar stays one row of controls.
    <PageFrame title={header} actionItems={actionItems} actions={sample}>
      <div className="flex flex-col gap-6" data-dashboard-lab={`admin-${variant}`} data-page-type="dashboard">
        <ScopeBar
          scope={url.scope}
          options={model.options}
          termName={model.term.name}
          onChange={url.setScope}
          chipValue={(k, v) => (snap.state ? chipValue(snap.state, k, v) : v)}
          asOf={asOfLabel(snap.at)}
          onRefresh={snap.refresh}
          stale={url.demo === "stale"}
        />
        <p role="status" aria-live="polite" className="sr-only" data-announce>{url.demo === "loading" ? "Loading dashboard" : model.announce}</p>
        {snap.fresh ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground" data-new-evidence>
            <i className="fa-light fa-circle-info" aria-hidden="true" />
            {`New evidence since ${timeLabel(snap.at)}.`}
            <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={snap.refresh}>Refresh to update</Button>
          </p>
        ) : null}
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
