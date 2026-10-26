"use client"

/**
 * Student Record, variant B: chronological (named alternative).
 * Tests: does one dated ledger of every evaluation, by month, with the same filters and reasons, match how students audit their
 * record better than grouping by skill?
 * Regions (list budget 4): header (Share record) · figures that filter · filter row · ledger by month.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@exxatdesignux/ui/components/ui/table"
import { EmptyBlock, Student2Frame, type Student2Ctx } from "@/components/lab/student2/frame"
import { RecordFigures, RecordFilters, RecordMobileRow, ResultLabel } from "@/components/lab/student2/record-parts"
import { LINK_IN_TABLE } from "@/components/lab/student/parts"
import { useRecord } from "./student-record-a"
import { shortDate } from "@/lib/lab/student"
import { skillNoun } from "@/lib/lab/terms"
import { groupByMonth, groupBySkill, recordAttemptLine, student2Href } from "@/lib/lab/student2"

const ROW_LIMIT = 40

export function StudentRecordB() {
  return (
    <Student2Frame
      title="Record"
      primary={(c) => ({ label: "Share record", href: student2Href("share-record", {}, c.studentId) })}
      empty={(c) => <EmptyBlock title="No evaluations yet" body="Each evaluation appears here with whether it counted and why." action={{ label: "Send for evaluation", href: student2Href("request-signoff", {}, c.studentId) }} />}
    >
      {(ctx) => <Ledger ctx={ctx} />}
    </Student2Frame>
  )
}

function Ledger({ ctx }: { ctx: Student2Ctx }) {
  const r = useRecord(ctx)
  const [all, setAll] = React.useState(false)
  const capped = all ? r.shown : r.shown.slice(0, ROW_LIMIT)
  const months = React.useMemo(() => groupByMonth(capped), [capped])
  // One failed rule per skill on the phone ledger: only the newest "did not count" of each skill carries its reason; older ones show the result word, and the skill page holds every attempt with its reason.
  const whyShown = React.useMemo(() => {
    const newest = new Map<string, { id: string; date: string }>()
    for (const mo of months) for (const x of mo.rows) {
      if (x.result !== "not-counted") continue
      const cur = newest.get(x.skillId)
      if (!cur || x.date > cur.date) newest.set(x.skillId, { id: x.id, date: x.date })
    }
    return new Set([...newest.values()].map((v) => v.id))
  }, [months])
  // "5 attempts, 3 count" once per skill, on its newest row in view, counted over the whole record (not the filter).
  const attemptLines = React.useMemo(() => new Map(groupBySkill(r.rows).map((g) => [g.skillId, recordAttemptLine(ctx.state, ctx.studentId, g.skillId)])), [r.rows, ctx.state, ctx.studentId])
  const lineOn = React.useMemo(() => {
    const newest = new Map<string, { id: string; date: string }>()
    for (const x of capped) {
      const cur = newest.get(x.skillId)
      if (!cur || x.date > cur.date) newest.set(x.skillId, { id: x.id, date: x.date })
    }
    return new Set([...newest.values()].map((v) => v.id))
  }, [capped])
  const attemptText = (x: { id: string; skillId: string }) => (lineOn.has(x.id) ? attemptLines.get(x.skillId) ?? "" : "")
  return (
    <div className="flex flex-col gap-4" data-student-lab="record-B">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <RecordFigures counts={r.counts} value={r.f.result} onChange={(v) => r.set({ result: v })} />
        <RecordFilters f={r.f} onChange={r.set} courses={r.courses} />
      </div>
      <Card className="gap-0 overflow-hidden py-0" data-region="ledger">
        <CardContent className="p-0">
          {r.shown.length === 0 ? (
            <EmptyBlock compact title="No evaluations match these filters" action={{ label: "Clear filters" }} onAction={r.clear} />
          ) : (
            <>
            <div className="flex flex-col px-4 sm:hidden">
              {months.map((mo) => (
                <section key={mo.key} aria-label={mo.label} className="flex flex-col">
                  <h3 className="border-b border-border py-2 text-xs font-semibold text-foreground">{`${mo.label} · ${mo.rows.length}`}</h3>
                  <ul className="flex flex-col divide-y divide-border">
                    {mo.rows.map((x) => <RecordMobileRow key={x.id} date={shortDate(x.date)} title={<><Link href={student2Href("skill-detail", { skill: x.skillId }, ctx.studentId)} className={LINK_IN_TABLE}>{x.skillName}</Link>{attemptText(x) ? <span className="block text-xs tabular-nums text-muted-foreground" data-attempt-line>{attemptText(x)}</span> : null}</>} result={x.result} why={x.result === "not-counted" && !whyShown.has(x.id) ? "" : x.why} />)}
                  </ul>
                </section>
              ))}
            </div>
            <Table aria-label="Evaluations by date, newest first" className="max-sm:hidden">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Date</TableHead>
                  <TableHead>{skillNoun().replace(/^./, (c) => c.toUpperCase())}</TableHead>
                  <TableHead className="w-40">Result</TableHead>
                  <TableHead className="hidden lg:table-cell">Evaluator</TableHead>
                  <TableHead className="hidden md:table-cell">Why</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {months.map((mo) => (
                  <React.Fragment key={mo.key}>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableCell colSpan={5} className="py-1.5 text-xs font-semibold text-foreground">{`${mo.label} · ${mo.rows.length}`}</TableCell>
                    </TableRow>
                    {mo.rows.map((x) => (
                      <TableRow key={x.id}>
                        <TableCell className="align-top tabular-nums text-muted-foreground">{shortDate(x.date)}</TableCell>
                        <TableCell className="min-w-40 whitespace-normal align-top">
                          <Link href={student2Href("skill-detail", { skill: x.skillId }, ctx.studentId)} className={LINK_IN_TABLE}>{x.skillName}</Link>
                          {attemptText(x) ? <span className="mt-0.5 block text-xs tabular-nums text-muted-foreground" data-attempt-line>{attemptText(x)}</span> : null}
                          <span className="mt-0.5 block text-xs text-muted-foreground md:hidden">{x.why}</span>
                        </TableCell>
                        <TableCell className="align-top"><ResultLabel result={x.result} /></TableCell>
                        <TableCell className="hidden align-top lg:table-cell">{x.evaluatorName}</TableCell>
                        <TableCell className="hidden min-w-48 whitespace-normal align-top text-sm md:table-cell">{x.why}</TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
            </>
          )}
          {r.shown.length > ROW_LIMIT ? (
            <div className="border-t border-border p-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setAll((v) => !v)}>{all ? "Show fewer" : `Show all ${r.shown.length} evaluations`}</Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
