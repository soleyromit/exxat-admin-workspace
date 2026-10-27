"use client"

/**
 * Admin Dashboard, concept C: journey pipeline ("where does progress stall?"). Built from
 * docs/knowledge/design/dashboard-concepts/mockups/c-journey-pipeline.html with DS components.
 * Regions: page header, scope bar (shared frame), stage strip (the four engine states, each with its 8-week movement),
 * sections card (one compact state bar per section, counts printed, every count and segment a link). Figures are computed
 * from the scaled seed through `populationRows` and `skillProgress` (lib/lab/dashboard.ts `pipelineModel`).
 * A figure opens its records on the same URL (?list=records&cond=&q=), so the list keeps the scope and its length equals the figure.
 * Demo states: ?state=loading|empty|clear|error|partial|stale.
 */
import * as React from "react"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { DashboardPage, type DashboardContext } from "@/components/lab/dashboard/frame"
import { NeedsYou, SetupHero, setupOnly } from "@/components/lab/dashboard/cards"
import { SectionsCard, StageStrip } from "@/components/lab/dashboard/pipeline-sections"
import { PipelineDrill } from "@/components/lab/dashboard/pipeline-drill"
import { isRecordState, pipelineModel, type PipelineModel } from "@/lib/lab/dashboard"

/** ?state=clear: the calm view, nothing flagged; ?state=partial: the basis cannot be shown, so the tick is hidden and said so. */
function demoModel(m: PipelineModel, demo: DashboardContext["demo"]): PipelineModel {
  if (demo === "clear" || demo === "partial") {
    const strip = (s: PipelineModel["all"]) => ({ ...s, short: 0 })
    return { ...m, all: strip(m.all), sections: m.sections.map(strip), tick: demo === "partial" ? null : m.tick }
  }
  return m
}

function Body({ ctx }: { ctx: DashboardContext }) {
  const { data, scope, demo, param, setParams, clearDemo } = ctx
  const built = React.useMemo(() => pipelineModel(data, scope), [data, scope])
  const model = demoModel(built, demo)
  const list = param("list")
  const cond = param("cond")
  if (list === "records") {
    return <PipelineDrill model={model} scope={scope} state={isRecordState(cond) ? cond : null} section={param("q")} onChange={setParams} />
  }
  return (
    <div className="flex flex-col gap-6">
      <StageStrip model={model} scope={scope} />
      {demo === "partial" ? <LocalBanner variant="info">{`Too few students in this scope to compare (4). The ${scope.basis === "median" ? "section median" : "expected now"} tick is hidden; the counts are current.`}</LocalBanner> : null}
      {demo === "clear" ? <p className="text-sm text-foreground" data-clear>{`No section sits 8 or more points under ${built.tick?.label.toLowerCase() ?? "the basis"}.`}</p> : null}
      {demo === "error" ? (
        <Card className="py-0" data-region="card-error" role="group" aria-label="Sections by record state">
          <CardContent className="flex flex-col gap-3 py-4">
            <h2 className="text-sm font-semibold text-foreground">Sections by record state</h2>
            <LocalBanner variant="error" title="Section states could not be calculated" retry={{ label: "Try again", onClick: clearDemo }}>
              The four figures above are current.
            </LocalBanner>
          </CardContent>
        </Card>
      ) : (
        <SectionsCard model={model} scope={scope} />
      )}
    </div>
  )
}

export function AdminDashboardPipeline() {
  return (
    <DashboardPage variant="C">
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
    </DashboardPage>
  )
}
