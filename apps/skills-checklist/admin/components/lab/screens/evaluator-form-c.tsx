"use client"

/**
 * Evaluation form, variant C: fast batch. A compact DS Table, one row per skill with inline outcome chips; level, criteria
 * and feedback for any row open in one shared drawer (Sheet). Mental model: a lab roll call. A per-request link exposes only
 * its own request (D-L2), so rows are this student's skills, never other students. "Mark all" sets the first outcome label on
 * every row; the evaluator still owns each answer.
 */
import { capitalize, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import * as React from "react"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@exxatdesignux/ui/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@exxatdesignux/ui/components/ui/sheet"
import { useIsMobile } from "@exxatdesignux/ui/hooks/use-mobile"
import { evFieldId } from "@/lib/lab/evaluator"
import { EvaluatorGate } from "@/components/lab/evaluator/gate"
import { StickyBar } from "@/components/lab/evaluator/frame"
import { ChoiceTiles, ErrorSummary, RequestSummary, SelfNote, SkillFields, StateBanners, contextLine, skillsWord } from "@/components/lab/evaluator/fields"
import { useEvaluator } from "@/components/lab/evaluator/use-evaluator"

export function EvaluatorFormC() {
  const m = useEvaluator()
  const req = m.req
  const skills = req?.skills ?? []
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState<string | null>(null)
  const openSkill = skills.find((k) => k.id === open) ?? null
  const openIdx = openSkill ? skills.indexOf(openSkill) : -1
  const firstLabel = skills[0]?.choices[0]?.label ?? "Met"

  return (
    <EvaluatorGate
      m={m}
      summary={req ? <RequestSummary req={req} line={contextLine(req)} /> : null}
      footer={
        <StickyBar>
          <p className="hidden text-sm text-muted-foreground tabular-nums sm:block" aria-live="polite">{`${m.done} of ${skills.length} done`}</p>
          <Button type="button" variant="default" size="lg" className="min-h-(--control-height-touch) w-full sm:ms-auto sm:w-auto" onClick={m.submit}>{m.offline ? "Save and send later" : `Submit ${skillsWord(skills.length)}`}</Button>
        </StickyBar>
      }
    >
      {req ? (
        <div className="flex flex-col gap-4">
          <StateBanners m={m} req={req} />
          <ErrorSummary m={m} />
          <Card size="sm" className="gap-0 overflow-hidden py-0" data-region="skill">
            <CardContent className="flex items-center justify-between gap-3 border-b border-border py-2">
              <p className="text-sm font-medium text-foreground">{skillsWord(skills.length)}</p>
              <Button type="button" variant="outline" size="sm" onClick={() => m.setAll("met")}>{`Mark all ${firstLabel}`}</Button>
            </CardContent>
            <Table scrollLabel={`${capitalize(skillNounPlural())} in this request`}>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col" className="ps-3">{capitalize(skillNoun())}</TableHead>
                  <TableHead scope="col" className="hidden w-[13rem] md:table-cell">Outcome</TableHead>
                  <TableHead scope="col" className="hidden w-[11rem] md:table-cell">Level</TableHead>
                  <TableHead scope="col" className="w-12 pe-3 text-end"><span className="sr-only">Details</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {skills.map((k) => {
                  const r = m.response(k.id)
                  const rowIssues = m.issuesFor(k.id)
                  const detailIssue = rowIssues.some((i) => i.field !== evFieldId.outcome(k.id))
                  const graded = r.outcome === "met" || r.outcome === "not-met"
                  const outId = evFieldId.outcome(k.id)
                  const needs = (graded && (k.answerKind || (isMobile && k.levels.length))) || k.feedbackRequired || r.outcome === "not-yet"
                  return (
                    <TableRow key={k.id} className="align-middle">
                      <TableCell className="ps-3 whitespace-normal">
                        <p id={`${outId}-label`} className="text-sm font-medium text-foreground">{k.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {k.attempt ? `Attempt ${k.attempt.n} · ` : ""}
                          {k.self?.rating ? `${req.student.first} rated ${k.self.rating}` : k.answerKind ? `${k.questions.length} criteria` : ""}
                          {r.feedback.trim() ? `${k.self?.rating || k.answerKind ? " · " : ""}Feedback added` : ""}
                        </p>
                        {isMobile ? (
                          <div className="mt-2">
                            <ChoiceTiles id={outId} labelId={`${outId}-label`} options={k.choices} value={r.outcome} onChange={(v) => m.setAnswer(k.id, { outcome: v as typeof r.outcome })} invalid={rowIssues.some((i) => i.field === outId)} cols={k.choices.length === 3 ? 3 : 2} compact />
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {isMobile ? null : <ChoiceTiles id={outId} labelId={`${outId}-label`} options={k.choices} value={r.outcome} onChange={(v) => m.setAnswer(k.id, { outcome: v as typeof r.outcome })} invalid={rowIssues.some((i) => i.field === outId)} cols={k.choices.length === 3 ? 3 : 2} compact />}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {k.levels.length ? (
                          <Select value={r.level === null ? "" : String(r.level)} onValueChange={(v) => m.setAnswer(k.id, { level: Number(v) })}>
                            <SelectTrigger id={evFieldId.level(k.id)} size="sm" className="w-full" aria-label={`${k.levelsLabel}, ${k.name}`} aria-invalid={rowIssues.some((i) => i.field === evFieldId.level(k.id)) || undefined}>
                              <SelectValue placeholder="Choose" />
                            </SelectTrigger>
                            <SelectContent>
                              {k.levels.map((l, i) => <SelectItem key={l} value={String(i)}>{l}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        ) : <span className="sr-only">{`No level for this ${skillNoun()}`}</span>}
                      </TableCell>
                      <TableCell className="pe-3 text-end">
                        <Button type="button" variant={detailIssue ? "outline" : "ghost"} size="icon" className="max-sm:size-11" aria-label={`Details and feedback, ${k.name}${needs ? ", needs input" : ""}`} onClick={() => setOpen(k.id)}>
                          <i className={detailIssue ? "fa-solid fa-message-exclamation text-(--lab-viz-behind-ink)" : r.feedback.trim() ? "fa-solid fa-message-lines" : "fa-light fa-message"} aria-hidden="true" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>
          {!req.onRecord ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ev-c-name" className="text-sm font-medium">Your name and credential</Label>
              <Input id="ev-c-name" defaultValue={req.evaluator.name} autoComplete="name" className="max-w-sm" />
            </div>
          ) : null}
          <Sheet open={!!openSkill} onOpenChange={(o) => { if (!o) setOpen(null) }}>
            <SheetContent side={isMobile ? "bottom" : "right"} className="flex max-h-[90dvh] flex-col">
              {openSkill ? (
                <>
                  <SheetHeader>
                    <SheetTitle>{openSkill.name}</SheetTitle>
                    <SheetDescription>{`${capitalize(skillNoun())} ${openIdx + 1} of ${skills.length}`}</SheetDescription>
                  </SheetHeader>
                  <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
                    <SelfNote skill={openSkill} student={req.student.first} requestNote={req.studentNote} />
                    <SkillFields m={m} skill={openSkill} compactQuestions />
                  </div>
                  <SheetFooter className="flex-row justify-end gap-2">
                    {openIdx < skills.length - 1 ? <Button type="button" variant="ghost" size="default" onClick={() => setOpen(skills[openIdx + 1].id)}>{`Next ${skillNoun()}`}</Button> : null}
                    <Button type="button" variant="default" size="default" onClick={() => setOpen(null)}>Done</Button>
                  </SheetFooter>
                </>
              ) : null}
            </SheetContent>
          </Sheet>
        </div>
      ) : null}
    </EvaluatorGate>
  )
}
