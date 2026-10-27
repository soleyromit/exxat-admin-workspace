"use client"

/**
 * Director Verification detail, variant B: checklist view. One reading column of steps in order: what changed, acknowledge each
 * gap, spot-check the evidence (sections with a gap open, complete sections behind one disclosure, each with its count, the
 * skills and their evidence links), verify.
 * Same rules and the same single primary action as A; the difference is the mental model (steps to tick, not a record to read).
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@exxatdesignux/ui/components/ui/collapsible"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { DirectorPage } from "@/components/lab/director/frame"
import type { V2State } from "@/lib/v2/types"
import { EvidenceLink, FluxList, GapChecks, RecordLine, SkillState, VerifyAction, useVerifyFlow } from "@/components/lab/director/verify"
import type { DirectorContext } from "@/components/lab/director/use-director"
import { DiamondGlyph } from "@/components/lab/viz"
import { detailModel, directorHref, shortDate, type DetailModel, type Readiness } from "@/lib/lab/director"
import { fmt } from "@/lib/v2/format"

function Step({ n, title, count, done, children, region }: { n: number; title: string; count?: number; done?: boolean; children: React.ReactNode; region: string }) {
  return (
    <Card className="py-0" data-region={region}>
      <CardContent className="flex gap-3 py-4">
        <span className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${done ? "bg-foreground text-background" : "border border-border text-muted-foreground"}`} aria-hidden="true">
          {done ? <i className="fa-solid fa-check" /> : n}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <h2 className="text-base font-semibold text-foreground">
            {title}
            {count ? <span className="font-normal tabular-nums text-muted-foreground">{` ${fmt(count)}`}</span> : null}
            {done ? <span className="sr-only">, done</span> : null}
          </h2>
          {children}
        </div>
      </CardContent>
    </Card>
  )
}

type DetailSection = DetailModel["sections"][number]

function SectionLines({ s, d, scope, state }: { s: DetailSection; d: DetailModel; scope: Readiness["scope"]; state: V2State | null }) {
  const short = s.achieved < s.lines.length
  return (
    <li className="flex flex-col gap-1 py-2">
      <h3 className="flex items-center justify-between gap-2 text-sm font-semibold text-foreground">
        <span className="flex items-center gap-2">
          {short ? <DiamondGlyph /> : <span className="inline-block w-2.5" aria-hidden="true" />}
          {s.section}
        </span>
        <span className="font-normal tabular-nums text-muted-foreground">{`${s.achieved} of ${s.lines.length}`}</span>
      </h3>
      <ul className="flex flex-col gap-1 ps-5">
        {s.lines.map((l) => (
          <li key={l.skillId} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 py-1 text-sm">
            <span className="truncate text-foreground">{l.name}</span>
            <EvidenceLink l={l} scope={scope} studentId={d.row.id} state={state} />
            <SkillState l={l} />
          </li>
        ))}
      </ul>
    </li>
  )
}

/**
 * Sections with a gap are open (that is where a spot-check matters); sections already complete sit behind one disclosure,
 * so the step has one toggle instead of one per section (strategy/07 detail budget: 6 controls above the fold).
 */
function Sections({ d, scope, state }: { d: DetailModel; scope: Readiness["scope"]; state: V2State | null }) {
  const short = d.sections.filter((s) => s.achieved < s.lines.length)
  const complete = d.sections.filter((s) => s.achieved >= s.lines.length)
  const [open, setOpen] = React.useState(false)
  return (
    <div className="flex flex-col gap-1">
      {short.length ? (
        <ul className="flex flex-col divide-y divide-border">
          {short.map((s) => <SectionLines key={s.section} s={s} d={d} scope={scope} state={state} />)}
        </ul>
      ) : null}
      {complete.length ? (
        <Collapsible open={open} onOpenChange={setOpen} className="flex flex-col gap-1">
          <CollapsibleTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="self-start">
              <i className={`fa-light ${open ? "fa-chevron-down" : "fa-chevron-right"}`} aria-hidden="true" />
              {`${complete.length === 1 ? "1 complete section" : `${complete.length} complete sections`}`}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul className="flex flex-col divide-y divide-border">
              {complete.map((s) => <SectionLines key={s.section} s={s} d={d} scope={scope} state={state} />)}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      ) : null}
    </div>
  )
}

function Detail({ d, m, ctx }: { d: DetailModel; m: Readiness; ctx: DirectorContext }) {
  const flow = useVerifyFlow(d)
  const queue = (ctx.param("queue") ?? "").split(",").filter(Boolean)
  const changed = d.row.status === "changed"
  const hasChanges = changed || d.row.flux.length > 0
  const first = hasChanges ? 2 : 1
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <RecordLine d={d} flow={flow} />
        <Button asChild variant="ghost" size="sm">
          <Link href={directorHref("dashboard", m.scope)}>Back to the dashboard</Link>
        </Button>
      </div>
      {/* The "what changed" step appears only when something changed or is in flux. Otherwise the record line above already
          says "Never verified" or the version and date, so a step saying it again would repeat it (strategy/07 K4). */}
      {hasChanges ? (
        <Step n={1} title={changed ? `What changed since version ${d.row.version}` : "Earlier verifications"} done region="changes">
          {changed ? (
            <ul className="flex flex-col gap-1 text-sm text-foreground">
              {d.row.changes.map((c) => <li key={c}>{c}</li>)}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{d.row.verifiedAt ? `Version ${d.row.version}, ${shortDate(d.row.verifiedAt)}. Nothing changed since.` : "None. This is the first verification."}</p>
          )}
          <FluxList d={d} scope={m.scope} />
        </Step>
      ) : null}
      <Step n={first} title={d.row.gaps.length ? "Acknowledge each gap" : "Gaps"} count={d.row.gaps.length || undefined} done={flow.remaining === 0} region="gaps">
        <GapChecks d={d} flow={flow} idPrefix="vb" />
      </Step>
      <Step n={first + 1} title="Spot-check the evidence" region="evidence">
        {ctx.demo === "error" ? (
          <LocalBanner variant="warning" title="The evidence could not load" retry={{ label: "Try again", onClick: () => ctx.setParams({ state: null }) }}>
            The gaps above are current.
          </LocalBanner>
        ) : (
          <Sections d={d} scope={m.scope} state={ctx.state} />
        )}
      </Step>
      <Step n={first + 2} title="Verify" done={!!flow.done} region="verify">
        <VerifyAction d={d} flow={flow} scope={m.scope} idPrefix="vb" queue={queue} />
      </Step>
    </div>
  )
}

export function DirectorVerificationDetailB() {
  return (
    <DirectorPage
      title={(ctx) => (ctx.model && ctx.state ? detailModel(ctx.state, ctx.model, ctx.param("student"))?.row.name ?? "Verification" : "Verification")}
      variant="B"
      pageType="detail"
      showScope={false}
      width="wide"
      announce={() => "Record loaded"}
    >
      {(ctx) => {
        const d = detailModel(ctx.state!, ctx.model, ctx.param("student"))
        return d ? <Detail d={d} m={ctx.model} ctx={ctx} /> : null
      }}
    </DirectorPage>
  )
}
