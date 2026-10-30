"use client"

/**
 * Admin Dashboard, concept E: sites and evaluators operations ("where is evidence stuck?"). Built from
 * docs/knowledge/design/dashboard-concepts/mockups/e-sites-operations.html with DS components.
 * Regions: page header, scope bar (no Compare with: waiting has no basis), figure strip, sites ranked by the oldest open
 * request (age bar, 8-week signed trend), evaluators holding the oldest requests. No hero. Figures come from the scaled seed
 * (lib/lab/dashboard.ts `opsModel`, over the same `openRequests` the drill list reads). Demo states:
 * ?state=loading|empty|clear|error|partial|stale.
 */
import { TYPE } from "@/components/lab/type-scale"
import * as React from "react"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { NeedsYou, SetupHero, setupOnly } from "@/components/lab/dashboard/cards"
import { OpsPage, type OpsContext } from "@/components/lab/dashboard/ops-frame"
import { HoldersCard, OpsFigures, SitesTableCard } from "@/components/lab/dashboard/ops-sites"
import { OpsDrill } from "@/components/lab/dashboard/ops-drill"
import { opsDrill, opsModel, type OpsModel } from "@/lib/lab/dashboard"

/** ?state=clear: nothing waits (the calm view keeps the figures and says so). */
const clearModel = (m: OpsModel): OpsModel => ({ ...m, waiting: 0, medianDays: 0, old: 0, oldSites: 0, sites: [], top: [], other: { sites: 0, open: 0, old: 0, oldest: 0, students: 0, buckets: [0, 0, 0, 0] }, noSite: 0, holders: [], unverified: [], unverifiedOld: 0, open: [] })

function Body({ ctx }: { ctx: OpsContext }) {
  const { data, scope, demo, param, setParams, clearDemo } = ctx
  const built = React.useMemo(() => opsModel(data, scope), [data, scope])
  const model = demo === "clear" ? clearModel(built) : built
  const list = param("list")
  if (list === "holders" || list === "holder") {
    return <OpsDrill data={data} model={model} scope={scope} list={list} cond={param("cond")} evaluator={param("q")} onChange={setParams} filters={ctx.filters} />
  }
  return (
    <div className="flex flex-col gap-6">
      <OpsFigures model={model} scope={scope} />
      {demo === "clear" ? <p className="text-sm text-foreground" data-clear>Nothing is waiting with an evaluator in this scope.</p> : null}
      {demo === "partial" ? <LocalBanner variant="info">{built.noSite > 0 ? `${built.noSite} ${built.noSite === 1 ? "request has" : "requests have"} no site recorded, so ${built.noSite === 1 ? "it counts" : "they count"} in Waiting but ${built.noSite === 1 ? "is" : "are"} not drawn by site.` : "Some requests have no site recorded, so they count in Waiting but are not drawn by site."}</LocalBanner> : null}
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-12">
        {demo === "error" ? (
          <Card className="py-0 xl:col-span-8" data-region="card-error" role="group" aria-label="Requests waiting, by site">
            <CardContent className="flex flex-col gap-3 py-4">
              <h2 className={TYPE.card}>Requests waiting, by site</h2>
              <LocalBanner variant="error" title="Sites could not be loaded" retry={{ label: "Try again", onClick: clearDemo }}>
                The figures and the evaluator list are current.
              </LocalBanner>
            </CardContent>
          </Card>
        ) : (
          <SitesTableCard className="xl:col-span-8" model={model} scope={scope} />
        )}
        <HoldersCard className="xl:col-span-4" model={model} scope={scope} />
      </div>
    </div>
  )
}

export function AdminDashboardOps() {
  return (
    <OpsPage
      variant="E"
      filtersInBody={(ctx) => ctx.demo !== "empty" && (ctx.param("list") === "holders" || ctx.param("list") === "holder")}
      drillTitle={(ctx) => {
        const list = ctx.param("list")
        if (list !== "holders" && list !== "holder") return null
        const built = opsModel(ctx.data, ctx.scope)
        return opsDrill(ctx.data, ctx.demo === "clear" ? clearModel(built) : built, { list, cond: ctx.param("cond"), evaluator: ctx.param("q") }).title
      }}
    >
      {(ctx) =>
        ctx.demo === "empty" ? (
          <div className="flex flex-col gap-4">
            <SetupHero termName={ctx.model.term.name} />
            <NeedsYou model={setupOnly(ctx.model)} />
          </div>
        ) : (
          <Body ctx={ctx} />
        )
      }
    </OpsPage>
  )
}
