"use client"

/**
 * Lab batch grid, variant A: students by skills in one DS Table. Press a cell to cycle the program's labels (Met, Unmet,
 * not recorded); "All" in a column header fills every visible present student who has no mark yet. Absent students get no
 * result. 123 students: search and group filter; the table scrolls inside its card with a sticky header and first column.
 * The count is said once, in the save bar. Lab evidence never satisfies a clinical setting (REQ SC-12), said once in the header.
 * Feedback (EV-06): once a cell has a result, a small comment button beside it opens that result's feedback; a skill that
 * requires feedback says so under its column name, and Save names any result still missing it.
 */
import { skillNounPlural } from "@/lib/lab/terms"
import * as React from "react"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Checkbox } from "@exxatdesignux/ui/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@exxatdesignux/ui/components/ui/table"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { cn } from "@exxatdesignux/ui/lib/utils"
import type { LabMark } from "@/lib/lab/evaluator"
import { EvaluatorFrame } from "@/components/lab/evaluator/frame"
import { FeedbackRequiredCue, LabFeedback, LabHeader, LabSaveBar, LabSaved, LabToolbar } from "@/components/lab/evaluator/lab-grid-parts"
import { useLabGrid } from "@/components/lab/evaluator/use-lab-grid"

const CYCLE: LabMark[] = ["met", "not-met", null]
const nextMark = (m: LabMark): LabMark => CYCLE[(CYCLE.indexOf(m) + 1) % CYCLE.length]

export function LabInstructorLabBatchGridA() {
  const g = useLabGrid()
  return (
    <EvaluatorFrame program={g.programName} width="wide" footer={g.hydrated ? <LabSaveBar g={g} /> : undefined}>
      {!g.hydrated ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <>
          <LabHeader g={g} />
          <LabSaved g={g} />
          {/* The toolbar filters this grid, so it sits in the grid's card (one region: the grid and its own search, group and
              skills), like a DataTable toolbar. */}
          <Card size="sm" className="gap-0 overflow-hidden py-0" data-region="grid">
            <CardContent className="border-b border-border py-2">
              <LabToolbar g={g} />
            </CardContent>
            <Table scrollLabel={`Students by ${skillNounPlural()}`} containerClassName="max-h-[min(62dvh,640px)] overflow-auto">
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead scope="col" className="sticky left-0 z-10 min-w-44 bg-card ps-3">{`Student (${g.rows.length})`}</TableHead>
                  {g.chosenSkills.map((k) => (
                    <TableHead key={k.id} scope="col" className="min-w-40 align-bottom whitespace-normal">
                      <div className="flex items-end justify-between gap-2 py-1">
                        <span className="flex flex-col gap-0.5">
                          <span className="line-clamp-2 text-xs font-medium">{k.name}</span>
                          <FeedbackRequiredCue skill={k} />
                        </span>
                        <Button type="button" variant="ghost" size="xs" onClick={() => g.fillColumn(k.id)} aria-label={`Mark every visible student ${g.labels(k.id).met} for ${k.name}`}>All</Button>
                      </div>
                    </TableHead>
                  ))}
                  <TableHead scope="col" className="w-20 pe-3 text-end">Absent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {g.rows.map((r) => {
                  const absent = g.isAbsent(r.id)
                  return (
                    <TableRow key={r.id} className={cn(absent && "text-muted-foreground")}>
                      <TableCell className="sticky left-0 z-[1] bg-card ps-3 py-1.5">
                        <p className="text-sm font-medium">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{`${r.cohort}, ${r.group}`}</p>
                      </TableCell>
                      {g.chosenSkills.map((k) => {
                        const m = g.mark(r.id, k.id)
                        const l = g.labels(k.id)
                        const word = m === "met" ? l.met : m === "not-met" ? l.notMet : "Not recorded"
                        return (
                          <TableCell key={k.id} className="py-1.5">
                            {absent ? (
                              <span className="text-xs">Absent</span>
                            ) : (
                              <div className="flex items-center gap-1">
                                <Button type="button" variant={m ? "outline" : "ghost"} size="sm" className={cn("min-w-0 flex-1 justify-start gap-1.5 max-sm:min-h-(--control-height-touch)", !m && "text-muted-foreground")} onClick={() => g.setMark(r.id, k.id, nextMark(m))} aria-label={`${k.name}, ${r.name}: ${word}. Press to change.`}>
                                  <i className={m === "met" ? "fa-solid fa-circle-check" : m === "not-met" ? "fa-light fa-circle-xmark" : "fa-light fa-circle-dashed"} aria-hidden="true" />
                                  {m ? word : null}
                                </Button>
                                {m ? <LabFeedback g={g} row={r} skill={k} /> : null}
                              </div>
                            )}
                          </TableCell>
                        )
                      })}
                      <TableCell className="pe-3 py-1.5 text-end">
                        <Checkbox checked={absent} onCheckedChange={(c) => g.setAbsent(r.id, !!c)} aria-label={`${r.name} absent`} className="max-sm:size-6" />
                      </TableCell>
                    </TableRow>
                  )
                })}
                {g.rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={g.chosenSkills.length + 2} className="py-8 text-center text-sm text-muted-foreground">No student matches that search in this group.</TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </EvaluatorFrame>
  )
}
