"use client"

/**
 * Readiness pipeline for one cohort: a unit chart, one square per student, grouped by the four graduation bands (decision D-X11,
 * `graduationStageOf`): Complete, One skill short, Short (2 to 3 missing), Far behind (4 or more), with a hatched overlay where a
 * sign-off request is open (an overlay, never a state). An empty band other than Complete is not drawn (Short is empty in the
 * generated data). Complete is neutral ink; every short band is the one amber accent. Counts are printed above each group and each count links to its list. The squares are decorative
 * (a 38 square chart is not 38 tab stops); the counts and the lists below carry the data, and the chart has a text summary.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { Tip } from "@exxatdesignux/ui/components/ui/tip"
import { VIZ } from "@/components/lab/viz"
import { LINK } from "@/components/lab/director/parts"
import { FAR_BEHIND_MISSING, GRADUATION_LIST, GRADUATION_STAGES, GRADUATION_STAGE_LABEL, listHref, plural, type GraduationStage, type Readiness } from "@/lib/lab/director"

export const FILL: Record<GraduationStage, string> = { complete: "var(--muted-foreground)", "one-short": VIZ.behind, short: VIZ.behind, far: VIZ.behind }
/** Hatching on the overlay: background stripes across the fill (no color-mix). */
const HATCH = "repeating-linear-gradient(135deg, var(--background) 0 1.5px, transparent 1.5px 4.5px)"
export const STAGE_HINT: Record<GraduationStage, string> = {
  complete: "Every required skill achieved",
  "one-short": "Exactly one required skill not achieved",
  short: `Two to ${FAR_BEHIND_MISSING - 1} required skills not achieved`,
  far: `${FAR_BEHIND_MISSING} or more required skills not achieved`,
}
/** Bands drawn: Complete always, the others only when someone is in them. */
export const shownBands = (m: Readiness): GraduationStage[] => GRADUATION_STAGES.filter((st) => st === "complete" || m.graduation[st] > 0)

function Square({ stage, open, title }: { stage: GraduationStage; open: boolean; title: string }) {
  return (
    <span className="relative inline-block size-5 shrink-0 overflow-hidden rounded-sm" style={{ background: FILL[stage] }} title={title} data-flagged={stage !== "complete" || undefined}>
      {open ? <span className="absolute inset-0" style={{ backgroundImage: HATCH }} aria-hidden="true" /> : null}
    </span>
  )
}

export function OpenSwatch() {
  return (
    <span className="relative inline-block size-3 shrink-0 overflow-hidden rounded-sm" style={{ background: "var(--muted-foreground)" }} aria-hidden="true">
      <span className="absolute inset-0" style={{ backgroundImage: HATCH }} />
    </span>
  )
}

export function ReadinessPipeline({ m, demoPartial = false }: { m: Readiness; demoPartial?: boolean }) {
  const cohort = m.scope.cohort || "All cohorts"
  const bands = shownBands(m)
  const summary = `${cohort}: ${GRADUATION_STAGES.map((s) => `${m.graduation[s]} ${GRADUATION_STAGE_LABEL[s].toLowerCase()}`).join(", ")}. ${m.readyToVerify} ready to verify.`
  return (
    <Card className="py-0" data-region="pipeline">
      <CardContent className="flex flex-col gap-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h2 className="text-base font-semibold text-foreground">{`Graduation readiness, ${cohort}`}</h2>
          <Link href={listHref(m.scope, { list: "ready" })} className={`${LINK} flex items-baseline gap-2`} data-figure>
            <span className="text-2xl font-semibold tabular-nums">{m.readyToVerify}</span>
            <span className="text-sm font-normal text-muted-foreground">ready to verify</span>
          </Link>
        </div>
        {/* The text summary of the chart; the grid holds the count links, so it is not one role=img (no nested interactive). */}
        <p className="sr-only">{summary}</p>
        <div
          className="grid grid-cols-1 gap-x-8 gap-y-4 md:[grid-template-columns:var(--cols)]"
          style={{ ["--cols" as string]: bands.map((st) => `minmax(11rem, ${Math.max(m.graduation[st], 5)}fr)`).join(" ") }}
          data-chart
        >
          {bands.map((st) => {
            const members = m.rows.filter((r) => r.graduationStage === st)
            return (
              <div key={st} data-band={st} className={`flex min-w-0 flex-col gap-2 ${st !== "complete" ? "md:border-s md:border-border md:ps-6" : ""}`}>
                <div className="flex flex-col" data-figure>
                  <span className="flex items-baseline gap-2">
                    <Link href={listHref(m.scope, { list: GRADUATION_LIST[st] })} className={`${LINK} text-2xl font-semibold tabular-nums`} aria-label={`${members.length} ${GRADUATION_STAGE_LABEL[st].toLowerCase()}. Open the list`}>
                      {members.length}
                    </Link>
                    <Tip label={STAGE_HINT[st]}>
                      <span className="truncate rounded-sm text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" tabIndex={0}>{GRADUATION_STAGE_LABEL[st]}</span>
                    </Tip>
                  </span>
                  <span className="text-xs text-muted-foreground">{demoPartial ? " " : m.graduationOpen[st] ? `${m.graduationOpen[st]} with a request open` : "No request open"}</span>
                </div>
                <div className="flex flex-wrap gap-1" aria-hidden="true">
                  {members.map((r) => (
                    <Square key={r.id} stage={st} open={!demoPartial && r.open.length > 0} title={`${r.name}: ${r.gaps.length ? plural(r.gaps.length, "gap", "gaps") : "complete"}${r.open.length ? ", request open" : ""}`} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Legend" data-viz-label>
          <span className="inline-flex items-center gap-1.5"><span className="inline-block size-3 rounded-sm" style={{ background: FILL.complete }} />Complete</span>
          {m.rows.length - m.graduation.complete > 0 ? <span className="inline-flex items-center gap-1.5"><span className="inline-block size-3 rounded-sm" style={{ background: VIZ.behind }} />Short</span> : null}
          {demoPartial ? null : <span className="inline-flex items-center gap-1.5"><OpenSwatch />Request open</span>}
        </p>
      </CardContent>
    </Card>
  )
}
