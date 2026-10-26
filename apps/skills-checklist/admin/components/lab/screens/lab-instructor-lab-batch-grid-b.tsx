"use client"

/**
 * Lab batch grid, variant B: roll call. One skill at a time; every student is a row with touch-size answer chips (the
 * program's labels, or Absent). Mental model: taking attendance at the bench with a tablet. Same session state as A
 * (search, group, chosen skills, one count in the save bar, lab label once).
 */
import * as React from "react"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { Checkbox } from "@exxatdesignux/ui/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@exxatdesignux/ui/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@exxatdesignux/ui/components/ui/toggle-group"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { useIsMobile } from "@exxatdesignux/ui/hooks/use-mobile"
import { EvaluatorFrame } from "@/components/lab/evaluator/frame"
import { ChoiceTiles } from "@/components/lab/evaluator/fields"
import { LabHeader, LabSaveBar, LabSaved, LabToolbar } from "@/components/lab/evaluator/lab-grid-parts"
import { useLabGrid } from "@/components/lab/evaluator/use-lab-grid"

export function LabInstructorLabBatchGridB() {
  const g = useLabGrid()
  const isMobile = useIsMobile()
  const [active, setActive] = React.useState<string | null>(null)
  const skill = g.chosenSkills.find((k) => k.id === active) ?? g.chosenSkills[0] ?? null
  const l = skill ? g.labels(skill.id) : { met: "Met", notMet: "Unmet" }
  const left = skill ? g.rows.filter((r) => !g.isAbsent(r.id) && !g.mark(r.id, skill.id)).length : 0
  return (
    <EvaluatorFrame program={g.programName} width="wide" footer={g.hydrated ? <LabSaveBar g={g} /> : undefined}>
      {!g.hydrated ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <>
          <LabHeader g={g} />
          <LabSaved g={g} />
          {/* Search, group, skills and the skill to record all filter this roll call, so they sit in its card (one region). */}
          <Card size="sm" className="gap-0 overflow-hidden py-0" data-region="grid">
            <CardContent className="flex flex-col gap-2 border-b border-border py-2">
              <LabToolbar g={g} />
              {skill ? (
                <ToggleGroup type="single" variant="outline" spacing={2} value={skill.id} onValueChange={(v) => { if (v) setActive(v) }} aria-label="Skill to record" className="flex w-full flex-wrap justify-start">
                  {g.chosenSkills.map((k) => (
                    <ToggleGroupItem key={k.id} value={k.id} size="sm" className="px-2.5">{k.name}</ToggleGroupItem>
                  ))}
                </ToggleGroup>
              ) : null}
            </CardContent>
            {skill ? (
              <CardContent className="flex min-h-12 items-center justify-between gap-3 border-b border-border py-2">
                <p className="min-w-0 truncate text-sm font-medium text-foreground">{skill.name}</p>
                {/* Hidden, not disabled, once every present student has a mark (strategy/07: no disabled control above the fold). */}
                {left > 0 ? <Button type="button" variant="outline" size="sm" onClick={() => g.fillColumn(skill.id)}>{`Mark the rest ${l.met}`}</Button> : null}
              </CardContent>
            ) : null}
            <Table scrollLabel="Students for this skill" containerClassName="max-h-[min(62dvh,640px)] overflow-auto">
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead scope="col" className="ps-3">{`Student (${g.rows.length})`}</TableHead>
                  <TableHead scope="col" className="hidden w-[15rem] md:table-cell">Result</TableHead>
                  <TableHead scope="col" className="w-20 pe-3 text-end">Absent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {skill
                  ? g.rows.map((r) => {
                      const absent = g.isAbsent(r.id)
                      const id = `lab-b-${r.id}`
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="ps-3 py-1.5">
                            <p id={`${id}-label`} className="text-sm font-medium">{r.name}</p>
                            <p className="text-xs text-muted-foreground">{`${r.cohort}, ${r.group}`}</p>
                            {isMobile ? (
                              <div className="mt-2">
                                {absent ? <span className="text-sm text-muted-foreground">Absent, no result</span> : <ChoiceTiles id={id} labelId={`${id}-label`} options={[{ value: "met", label: l.met }, { value: "not-met", label: l.notMet }]} value={g.mark(r.id, skill.id)} onChange={(v) => g.setMark(r.id, skill.id, v as "met" | "not-met")} />}
                              </div>
                            ) : null}
                          </TableCell>
                          <TableCell className="hidden py-1.5 md:table-cell">
                            {isMobile ? null : absent ? (
                              <span className="text-sm text-muted-foreground">Absent, no result</span>
                            ) : (
                              <ChoiceTiles id={id} labelId={`${id}-label`} options={[{ value: "met", label: l.met }, { value: "not-met", label: l.notMet }]} value={g.mark(r.id, skill.id)} onChange={(v) => g.setMark(r.id, skill.id, v as "met" | "not-met")} />
                            )}
                          </TableCell>
                          <TableCell className="pe-3 py-1.5 text-end">
                            <Checkbox checked={absent} onCheckedChange={(c) => g.setAbsent(r.id, !!c)} aria-label={`${r.name} absent`} className="size-6" />
                          </TableCell>
                        </TableRow>
                      )
                    })
                  : null}
                {g.rows.length === 0 || !skill ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">{skill ? "No student matches that search in this group." : "Choose at least one skill for this session."}</TableCell>
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
