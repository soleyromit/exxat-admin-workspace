"use client"

/**
 * Student Record, variant A: by skill (recommended).
 * Tests: does a filtered list of evidence grouped under each skill, with did-not-count first and the reason on every row, match
 * how students audit their record?
 * Regions (list budget 4): header (Share record) · figures that filter · filter row · evidence table grouped by skill.
 * [REQ SH-01 every submission in order (requests not answered yet included), SH-02 explicit outcome, SH-03 failed rule, SH-04 counted,
 * outstanding and returned, SH-06 every course and narrow, SH-07 each completed evaluation in full, read only]
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@exxatdesignux/ui/components/ui/table"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { EmptyBlock, Student2Frame, type Student2Ctx } from "@/components/lab/student2/frame"
import { RecordFigures, RecordFilters, ResultLabel, WhyText } from "@/components/lab/student2/record-parts"
import { LINK_IN_TABLE, StateLabel } from "@/components/lab/student/parts"
import { shortDate, shortSettingLine } from "@/lib/lab/student"
import { aNoun, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { EMPTY_RECORD_FILTER, filterRecord, groupBySkill, recordAttemptLine, recordCourses, recordFigures, recordRows, student2Href, whyWithRule, type RecordFilter } from "@/lib/lab/student2"
import { EvaluatorWithTag } from "@/components/lab/student/checkoff"
import { EVALUATION_PARAM, StudentEvaluationSheet, ViewEvaluationButton, ViewEvaluationLink } from "@/components/lab/student/evaluation-sheet"

const GROUP_LIMIT = 12

export function StudentRecordA() {
  return (
    <Student2Frame
      title="My evaluations"
      primary={(c) => ({ label: "Share record", href: student2Href("share-record", {}, c.studentId) })}
      empty={(c) => <EmptyBlock title="No evaluations yet" body="Each evaluation appears here with whether it counted and why." action={{ label: `Log ${aNoun()}`, href: student2Href("request-signoff", {}, c.studentId) }} />}
    >
      {(ctx) => <BySkill ctx={ctx} />}
    </Student2Frame>
  )
}

export function useRecord(ctx: Student2Ctx) {
  const rows = React.useMemo(() => recordRows(ctx.state, ctx.model), [ctx.state, ctx.model])
  const [f, setF] = React.useState<RecordFilter>(EMPTY_RECORD_FILTER)
  const shown = React.useMemo(() => filterRecord(rows, f), [rows, f])
  // SH-04: counted, outstanding and returned, each request once, under the other filters (never under the result filter itself).
  const counts = React.useMemo(() => recordFigures(filterRecord(rows, { ...f, result: "all" })), [rows, f])
  const courses = React.useMemo(() => recordCourses(rows), [rows])
  // SH-07: a completed evaluation opens in full, read only, beside the list (?evaluation=, so Back closes it).
  const openEval = (id: string) => ctx.setParams({ [EVALUATION_PARAM]: id })
  const sheet = <StudentEvaluationSheet state={ctx.state} studentId={ctx.studentId} evaluationId={ctx.param(EVALUATION_PARAM)} onClose={() => ctx.setParams({ [EVALUATION_PARAM]: null })} />
  return { rows, shown, f, set: (p: Partial<RecordFilter>) => setF((x) => ({ ...x, ...p })), clear: () => setF(EMPTY_RECORD_FILTER), counts, courses, openEval, sheet }
}

function BySkill({ ctx }: { ctx: Student2Ctx }) {
  const r = useRecord(ctx)
  const groups = React.useMemo(() => groupBySkill(r.shown), [r.shown])
  // "5 attempts, 3 count" per skill from the whole record, so a result filter never changes how attempts are counted.
  const attemptLines = React.useMemo(() => new Map(groupBySkill(r.rows).map((g) => [g.skillId, recordAttemptLine(ctx.state, ctx.studentId, g.skillId)])), [r.rows, ctx.state, ctx.studentId])
  // A named setting still short reads beside the count, "Inpatient 1 of 2" [REQ SH-05]; met settings stay on the skill page.
  const settingLines = React.useMemo(() => new Map(ctx.model.all.map((x) => [x.id, shortSettingLine(x)])), [ctx.model])
  const countText = (g: { skillId: string; rows: unknown[] }) => {
    const base = attemptLines.get(g.skillId) || (g.rows.length === 1 ? "1 evaluation" : `${g.rows.length} evaluations`)
    const setting = settingLines.get(g.skillId)
    return setting ? `${base} · ${setting}` : base
  }
  const [open, setOpen] = React.useState<Record<string, boolean>>({})
  const [all, setAll] = React.useState(false)
  const isOpen = (id: string, notCounted: number) => open[id] ?? notCounted > 0
  const list = all ? groups : groups.slice(0, GROUP_LIMIT)
  return (
    <div className="flex flex-col gap-4" data-student-lab="record-A">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <RecordFigures counts={r.counts} value={r.f.result} onChange={(v) => r.set({ result: v })} />
        <RecordFilters f={r.f} onChange={r.set} courses={r.courses} />
      </div>
      <Card className="gap-0 overflow-hidden py-0" data-region="evidence">
        <CardContent className="p-0">
          {groups.length === 0 ? (
            <EmptyBlock compact title="No evaluations match these filters" action={{ label: "Clear filters" }} onAction={r.clear} />
          ) : (
            <>
            <ul className="flex flex-col divide-y divide-border px-4 sm:hidden" aria-label={`Evaluations by ${skillNoun()}`}>
              {list.map((g) => {
                // Phone: one line per skill (its latest evaluation), no per-skill toggles. Every evaluation is one tap away on the
                // skill page; the reason shows only when the latest did not count or came back (one failed rule per skill).
                const latest = g.rows.reduce((a, b) => (b.date > a.date ? b : a), g.rows[0])
                return (
                  <li key={g.skillId} className="flex flex-col gap-1 py-2.5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <Link href={student2Href("skill-detail", { skill: g.skillId }, ctx.studentId)} className={cn(LINK_IN_TABLE, "min-w-0 flex-1 text-sm font-semibold")}>{g.skillName}</Link>
                      <span className="text-xs tabular-nums text-muted-foreground" data-viz-label data-attempt-line>{countText(g)}</span>
                    </div>
                    {g.state && g.label ? <StateLabel record={{ state: g.state, label: g.label }} className="text-xs" /> : null}
                    {latest ? (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="text-xs tabular-nums text-muted-foreground" data-viz-label>{shortDate(latest.date)}</span>
                        <ResultLabel result={latest.result} className="text-xs" />
                      </div>
                    ) : null}
                    {latest && (latest.result === "not-counted" || latest.result === "returned" || latest.result === "sent") ? <p className="text-xs text-muted-foreground"><WhyText why={latest.result === "not-counted" ? whyWithRule({ why: latest.why, rule: g.rule ?? undefined }) : latest.why} /></p> : null}
                    {/* One tap to the latest completed evaluation in full [REQ SH-07]; older ones are on the skill page. */}
                    {latest?.evaluationId ? <ViewEvaluationLink href={student2Href("record", { [EVALUATION_PARAM]: latest.evaluationId }, ctx.studentId)} name={`${g.skillName}, ${shortDate(latest.date)}`} /> : null}
                  </li>
                )
              })}
            </ul>
            <Table aria-label={`Evaluations by ${skillNoun()}`} className="max-sm:hidden">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Date</TableHead>
                  <TableHead className="w-40">Result</TableHead>
                  <TableHead className="hidden md:table-cell">Evaluator</TableHead>
                  <TableHead className="hidden lg:table-cell">Setting</TableHead>
                  <TableHead>Why</TableHead>
                  <TableHead className="w-36"><span className="sr-only">Evaluation</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((g) => {
                  const expanded = isOpen(g.skillId, g.notCounted)
                  return (
                    <React.Fragment key={g.skillId}>
                      <TableRow className={expanded ? "bg-muted/40 hover:bg-muted/40" : ""}>
                        <TableCell colSpan={6} className="py-1.5">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <Button type="button" variant="ghost" size="icon-sm" aria-expanded={expanded} aria-label={`${expanded ? "Hide" : "Show"} evaluations for ${g.skillName}`} onClick={() => setOpen((o) => ({ ...o, [g.skillId]: !expanded }))}>
                              <i className={cn("fa-light", expanded ? "fa-chevron-down" : "fa-chevron-right")} aria-hidden="true" />
                            </Button>
                            <Link href={student2Href("skill-detail", { skill: g.skillId }, ctx.studentId)} className={cn(LINK_IN_TABLE, "text-sm font-semibold")}>{g.skillName}</Link>
                            {g.state && g.label ? <StateLabel record={{ state: g.state, label: g.label }} className="text-xs" /> : null}
                            <span className="ms-auto text-xs tabular-nums text-muted-foreground" data-attempt-line>{countText(g)}</span>
                          </div>
                          {/* The failed rule once per skill, not on every attempt (review 2026-10-30) [REQ SH-03]. */}
                          {g.rule ? <p className="ps-10 text-sm text-foreground" data-skill-rule>{g.rule}</p> : null}
                        </TableCell>
                      </TableRow>
                      {expanded
                        ? g.rows.map((x) => (
                            <TableRow key={x.id}>
                              <TableCell className="tabular-nums text-muted-foreground">{shortDate(x.date)}</TableCell>
                              <TableCell><ResultLabel result={x.result} /></TableCell>
                              <TableCell className="hidden md:table-cell"><EvaluatorWithTag s={ctx.state} evaluationId={x.evaluationId} name={x.evaluatorName} /></TableCell>
                              <TableCell className="hidden text-muted-foreground lg:table-cell">{x.setting}</TableCell>
                              <TableCell className="min-w-48 whitespace-normal text-sm">{x.why}</TableCell>
                              <TableCell className="text-end">{x.evaluationId ? <ViewEvaluationButton name={`${x.skillName}, ${shortDate(x.date)}`} onOpen={() => r.openEval(x.evaluationId!)} /> : null}</TableCell>
                            </TableRow>
                          ))
                        : null}
                    </React.Fragment>
                  )
                })}
              </TableBody>
            </Table>
            </>
          )}
          {groups.length > GROUP_LIMIT ? (
            <div className="border-t border-border p-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setAll((v) => !v)}>{all ? "Show fewer" : `Show all ${groups.length} ${skillNounPlural()}`}</Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
      {r.sheet}
    </div>
  )
}
