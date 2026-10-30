"use client"

/**
 * Director Dashboard, variant A: readiness pipeline (dashboard-concepts README, director readiness).
 * Regions: header, scope bar, pipeline card (Complete, One skill short, Far behind as a unit chart, request open as a hatched
 * overlay, "ready to verify" as the fourth figure), the ready-to-verify worklist (top rows, "All n"), and the not-complete list.
 * Every figure links to Dashboard C filtered to the same rows with the scope in the URL. Demo states via ?state=.
 */
import { TYPE } from "@/components/lab/type-scale"
import { skillNoun } from "@/lib/lab/terms"
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { DirectorPage } from "@/components/lab/director/frame"
import { ReadinessPipeline, OpenSwatch } from "@/components/lab/director/pipeline"
import { WorklistTable } from "@/components/lab/director/worklist"
import { LINK } from "@/components/lab/director/parts"
import { DiamondGlyph } from "@/components/lab/viz"
import { detailHref, filterRows, listHref, type Readiness } from "@/lib/lab/director"
import type { LabScope } from "@/lib/lab/scope"

const SHOWN = 6
const order = { changed: 0, ready: 1, verified: 2, blocked: 3 } as const

function ReadyCard({ m, scope }: { m: Readiness; scope: LabScope }) {
  const rows = filterRows(m.rows, { list: "ready" }).sort((a, b) => order[a.status] - order[b.status] || b.gaps.length - a.gaps.length || a.name.localeCompare(b.name))
  return (
    <Card className="py-0 xl:col-span-8" data-region="ready">
      <CardContent className="flex flex-col gap-3 py-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className={TYPE.card}>Ready to verify</h2>
          <Button asChild variant="outline" size="sm">
            <Link href={listHref(scope, { list: "ready" })} aria-label={`All ${rows.length} ready to verify`}>View all</Link>
          </Button>
        </div>
        <WorklistTable rows={rows.slice(0, SHOWN)} scope={scope} compact empty="No record can be verified in this scope yet." />
      </CardContent>
    </Card>
  )
}

function NotCompleteCard({ m, scope }: { m: Readiness; scope: LabScope }) {
  const rows = filterRows(m.rows, { list: "gaps" })
  return (
    <Card className="self-start py-0 xl:col-span-4" data-region="not-complete">
      <CardContent className="flex flex-col gap-3 py-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className={TYPE.card}>Not complete</h2>
          <Button asChild variant="outline" size="sm">
            <Link href={listHref(scope, { list: "gaps" })}>{`All ${rows.length}`}</Link>
          </Button>
        </div>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{`Every student in scope has achieved every required ${skillNoun()}.`}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {rows.slice(0, SHOWN + 1).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2">
                <span className="flex min-w-0 items-start gap-2">
                  <span className="pt-1"><DiamondGlyph /></span>
                  <span className="flex min-w-0 flex-col">
                    <span className="flex min-w-0 items-center gap-2">
                      <Link className={`${LINK} truncate text-sm`} href={detailHref(scope, r.id)}>{r.name}</Link>
                      {r.open.length ? (
                        <span className="inline-flex items-center" title="Request open">
                          <OpenSwatch />
                          <span className="sr-only">, request open</span>
                        </span>
                      ) : null}
                    </span>
                    {/* The one missing skill on the row, under the name; the trailing value is always the gap count
                        (design review 2026-10-30, others #7: it mixed counts and skill names). */}
                    {r.gaps.length === 1 ? <span className={`${TYPE.meta} truncate`} title={r.gaps[0].name}>{`Missing ${r.gaps[0].name}`}</span> : null}
                  </span>
                </span>
                <span className="shrink-0 text-sm tabular-nums text-foreground" data-gap-count={r.gaps.length}>
                  {r.gaps.length === 1 ? "1 gap" : `${r.gaps.length} gaps`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export function DirectorDashboardA() {
  return (
    <DirectorPage title="Dashboard" variant="A" pageType="dashboard" announce={(m) => `${m.stage.complete} of ${m.rows.length} complete, ${m.readyToVerify} ready to verify`}>
      {({ model: m, scope, demo, setParams }) => (
        <div className="flex flex-col gap-4">
          {demo === "error" ? (
            <LocalBanner variant="warning" title="Readiness could not be calculated" retry={{ label: "Try again", onClick: () => setParams({ state: null }) }}>
              The scope is kept. Nothing was lost.
            </LocalBanner>
          ) : (
            <ReadinessPipeline m={m} demoPartial={demo === "partial"} />
          )}
          {demo === "partial" ? <LocalBanner variant="info">Open requests could not load, so the overlay is hidden. The counts are current.</LocalBanner> : null}
          {demo === "clear" ? <p className="text-sm text-foreground">Every student in scope is complete and nothing is open.</p> : null}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <ReadyCard m={m} scope={scope} />
            <NotCompleteCard m={m} scope={scope} />
          </div>
        </div>
      )}
    </DirectorPage>
  )
}
