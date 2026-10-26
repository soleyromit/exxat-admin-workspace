"use client"

/**
 * Admin Dashboard, variant A: status board ("is anything off?"), concept A in docs/knowledge/design/dashboard-concepts.
 * A monitoring wall: four figures with mini charts, then six equal small multiples, one question per tile, each linking to
 * the list behind it with the same scope. The first viewport holds the figure strip and the first row of three tiles
 * (who is behind, which skill blocks, which sections lag); approvals, sites and evidence flow sit in a collapsed
 * "Requests and evidence" group (one click, ?more=1 opens it).
 * Every figure comes from the single behind calculation in lib/lab/dashboard.ts. Demo states: ?state=loading|empty|clear|
 * error|partial|stale.
 */
import * as React from "react"
import { DashboardPage, type DashboardContext } from "@/components/lab/dashboard/frame"
import { CardError, NeedsYou, SetupHero, setupOnly } from "@/components/lab/dashboard/cards"
import { ApprovalAgeTile, BlockingTile, FlowTile, SectionsTile, SitesTile, StatusFigures, WhereBehindTile } from "@/components/lab/dashboard/status-tiles"
import { behindSeries, countedPerWeek, sectionGaps } from "@/lib/lab/dashboard"
import { queueItems } from "@/lib/v2/queue"
import { DEMO_TODAY } from "@/lib/v2/seed-core"
import { useSearchParams } from "next/navigation"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@exxatdesignux/ui/components/ui/collapsible"

/** The second tile group behind one disclosure: a heading-level trigger that names the group and how many views it holds. */
function MoreViews({ defaultOpen, children }: { defaultOpen: boolean; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(defaultOpen)
  const count = React.Children.count(children)
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mt-2 flex flex-col gap-3" data-region="tiles-requests">
      <h2 className="text-sm font-semibold text-foreground">
        <CollapsibleTrigger asChild>
          <Button type="button" variant="ghost" size="sm" aria-controls="tiles-requests-content" className="-ml-2 gap-2">
            <i className={`fa-light ${open ? "fa-chevron-up" : "fa-chevron-down"}`} aria-hidden="true" />
            Requests and evidence
            <span className="font-normal text-muted-foreground">{open ? "" : `${count} more views`}</span>
          </Button>
        </CollapsibleTrigger>
      </h2>
      <CollapsibleContent id="tiles-requests-content">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}

const daysSince = (iso: string) => Math.round((Date.parse(`${DEMO_TODAY}T00:00:00Z`) - Date.parse(`${iso.slice(0, 10)}T00:00:00Z`)) / 86_400_000)

function Board({ ctx }: { ctx: DashboardContext }) {
  const { data, model, scope, demo, clearDemo } = ctx
  const moreOpen = useSearchParams()?.get("more") === "1"
  const series = React.useMemo(() => (model.kind === "clear" && demo === "clear" ? null : { behind: behindSeries(data, scope) }), [data, scope, model.kind, demo])
  const gaps = React.useMemo(() => sectionGaps(model.pop), [model.pop])
  const weeks = React.useMemo(() => countedPerWeek(model.pop), [model.pop])
  const approvalDays = React.useMemo(() => queueItems(data).filter((q) => model.pop.ids.has(q.studentId)).flatMap((q) => q.evaluations.map(() => daysSince(q.since))), [data, model.pop.ids])
  return (
    <div className="flex flex-col gap-6">
      <StatusFigures model={model} series={series} />
      {/* Six equal tiles, one question each, in two rows of three. The first row (attainment) fills the first viewport; the
          second (requests and evidence) sits below the fold under its own group label. */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" data-region="tiles" aria-label="Attainment">
        {demo === "error" ? <CardError title="Where are the students behind?" onRetry={clearDemo} /> : <WhereBehindTile model={model} scope={scope} partial={demo === "partial"} />}
        <BlockingTile model={model} scope={scope} />
        <SectionsTile model={model} scope={scope} gaps={gaps} />
      </section>
      {/* Progressive disclosure (strategy/07 K5, one click): the second group (requests and evidence) starts collapsed, so
          the first viewport holds the figure strip and the first row of three tiles at any height (1280 x 800, 1440 x 900,
          1440 x 1000), not by pixel luck. ?more=1 opens it (a drill back link can restore it). Groups sit gap-8 apart. */}
      <MoreViews defaultOpen={moreOpen}>
        <ApprovalAgeTile model={model} scope={scope} days={approvalDays} />
        <SitesTile model={model} scope={scope} />
        <FlowTile scope={scope} weeks={weeks} />
      </MoreViews>
    </div>
  )
}

export function AdminDashboardA() {
  return (
    <DashboardPage variant="A">
      {(ctx) =>
        ctx.demo === "empty" ? (
          <div className="flex flex-col gap-4">
            <SetupHero termName={ctx.model.term.name} />
            <NeedsYou model={setupOnly(ctx.model)} />
          </div>
        ) : (
          <Board ctx={ctx} />
        )
      }
    </DashboardPage>
  )
}
