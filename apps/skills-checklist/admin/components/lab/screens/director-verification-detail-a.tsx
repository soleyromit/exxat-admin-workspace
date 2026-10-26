"use client"

/**
 * Director Verification detail, variant A: record view. The whole record on the left (every required skill by section, gaps first,
 * the evidence behind each as a link), the decision on the right: what stops verification, each gap with its own named
 * acknowledgement, what the verified record will state, and one primary action, Verify record, disabled until each gap is
 * acknowledged. ?student= picks the record (default: one with a gap that can be verified); ?queue= walks a bulk selection.
 */
import { capitalize, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@exxatdesignux/ui/components/ui/table"
import { DirectorPage } from "@/components/lab/director/frame"
import { ChangedBanner, EvidenceLink, FluxList, GapChecks, RecordLine, SkillState, VerifyAction, useVerifyFlow } from "@/components/lab/director/verify"
import type { DirectorContext } from "@/components/lab/director/use-director"
import { detailModel, directorHref, shortDate, type DetailModel, type Readiness } from "@/lib/lab/director"

function titleOf(ctx: DirectorContext): string {
  const m = ctx.model
  if (!m || !ctx.state) return "Verification"
  return detailModel(ctx.state, m, ctx.param("student"))?.row.name ?? "Verification"
}

function RecordTable({ d, scope }: { d: DetailModel; scope: Readiness["scope"] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[42%]">{capitalize(skillNoun())}</TableHead>
          <TableHead>State</TableHead>
          <TableHead>Evidence</TableHead>
          <TableHead className="text-end">Latest</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {d.sections.map((s) => (
          <React.Fragment key={s.section}>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableCell colSpan={4} className="font-semibold text-foreground">
                {s.section} <span className="font-normal text-muted-foreground">{`${s.achieved} of ${s.lines.length}`}</span>
              </TableCell>
            </TableRow>
            {[...s.lines].sort((a, b) => Number(a.state === "achieved") - Number(b.state === "achieved") || a.name.localeCompare(b.name)).map((l) => (
              <TableRow key={l.skillId}>
                <TableCell className="text-foreground">{l.name}</TableCell>
                <TableCell><SkillState l={l} /></TableCell>
                <TableCell><EvidenceLink l={l} scope={scope} studentId={d.row.id} /></TableCell>
                <TableCell className="text-end tabular-nums text-muted-foreground">{l.lastDate ? shortDate(l.lastDate) : ""}</TableCell>
              </TableRow>
            ))}
          </React.Fragment>
        ))}
      </TableBody>
    </Table>
  )
}

function Body({ m, ctx }: { m: Readiness; ctx: DirectorContext }) {
  const d = detailModel(ctx.state!, m, ctx.param("student"))
  if (!d) return null
  return <Detail d={d} m={m} ctx={ctx} />
}

function Detail({ d, m, ctx }: { d: DetailModel; m: Readiness; ctx: DirectorContext }) {
  const flow = useVerifyFlow(d)
  const queue = (ctx.param("queue") ?? "").split(",").filter(Boolean)
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <RecordLine d={d} flow={flow} />
        <Button asChild variant="ghost" size="sm">
          <Link href={directorHref("dashboard", m.scope)}>Back to the dashboard</Link>
        </Button>
      </div>
      <ChangedBanner d={d} />
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-12">
        <Card className="py-0 xl:col-span-8" data-region="record">
          <CardContent className="flex flex-col gap-3 py-4">
            <h2 className="text-base font-semibold text-foreground">{`Required ${skillNounPlural()}`}</h2>
            {ctx.demo === "error" ? (
              <LocalBanner variant="warning" title="The record could not load" retry={{ label: "Try again", onClick: () => ctx.setParams({ state: null }) }}>
                The decision panel is current.
              </LocalBanner>
            ) : (
              <RecordTable d={d} scope={m.scope} />
            )}
          </CardContent>
        </Card>
        <Card className="py-0 xl:sticky xl:top-4 xl:col-span-4" data-region="decision">
          <CardContent className="flex flex-col gap-4 py-4">
            <h2 className="text-base font-semibold text-foreground">Verify this record</h2>
            <FluxList d={d} scope={m.scope} />
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-foreground">{d.row.gaps.length ? `Gaps (${d.row.gaps.length})` : "Gaps"}</span>
              <GapChecks d={d} flow={flow} idPrefix="va" />
            </div>
            <VerifyAction d={d} flow={flow} scope={m.scope} idPrefix="va" queue={queue} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function DirectorVerificationDetailA() {
  return (
    <DirectorPage title={titleOf} variant="A" pageType="detail" showScope={false} announce={() => "Record loaded"}>
      {(ctx) => <Body m={ctx.model} ctx={ctx} />}
    </DirectorPage>
  )
}
