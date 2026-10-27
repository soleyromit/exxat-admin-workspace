"use client"

/**
 * The answer controls an evaluator touches. Answer choices are the only touch-size controls (44 px, --control-height-touch);
 * everything else is compact. Selected state is the DS toggle's soft brand tint, never a saturated fill and never red.
 * The skill name is said once, by the caller (card title, step heading or table row); labels here are generic.
 */
import { skillNoun, skillNounPlural } from "@/lib/lab/terms"
import * as React from "react"
import { ToggleGroup, ToggleGroupItem } from "@exxatdesignux/ui/components/ui/toggle-group"
import { Textarea } from "@exxatdesignux/ui/components/ui/textarea"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { PageHeader } from "@exxatdesignux/ui/components/ui/page-header"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { SCORE_MAX } from "@/lib/v2/preceptor"
import { evFieldId, type EvIssue, type EvRequest, type EvResponse, type EvSkill } from "@/lib/lab/evaluator"
import { focusField, type EvaluatorModel } from "@/components/lab/evaluator/use-evaluator"

export const TOUCH = "min-h-(--control-height-touch) h-auto whitespace-normal py-2 text-sm"

function FieldError({ id, issue }: { id: string; issue?: EvIssue }) {
  if (!issue) return null
  return (
    <p id={id} className="flex items-center gap-1.5 text-sm text-destructive">
      <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
      {issue.message}
    </p>
  )
}

/** One choice from a short list, as touch tiles. Deselecting is not possible: an answer is changed, not cleared. */
export function ChoiceTiles({ id, labelId, options, value, onChange, invalid, describedBy, cols = 2, compact = false }: { id: string; labelId: string; options: Array<{ value: string; label: string }>; value: string | null; onChange: (v: string) => void; invalid?: boolean; describedBy?: string; cols?: 2 | 3 | 5; compact?: boolean }) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      spacing={2}
      value={value ?? ""}
      onValueChange={(v) => { if (v) onChange(v) }}
      aria-labelledby={labelId}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      className={cn("grid w-full gap-2", cols === 2 ? "grid-cols-2" : cols === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-5")}
    >
      {options.map((o, i) => (
        <ToggleGroupItem key={o.value} id={i === 0 ? id : undefined} value={o.value} aria-invalid={invalid || undefined} className={cn(compact ? "h-8 text-sm sm:h-8 max-sm:min-h-(--control-height-touch)" : TOUCH, "w-full justify-center px-3")}>
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

/**
 * What the student supplied: self-rating and note (EV-04). Shown as context, quieter than the evaluator's own answers. The note
 * is shown in full (no clamp): it is the student's account, and the evaluator needs all of it. A note that repeats the request's
 * own note (shown once in the header) is not said twice.
 */
export function SelfNote({ skill, student, requestNote = "" }: { skill: EvSkill; student: string; requestNote?: string }) {
  if (!skill.self) return null
  const { rating } = skill.self
  const note = skill.self.note.trim() && skill.self.note.trim() !== requestNote.trim() ? skill.self.note : ""
  if (!rating && !note) return null
  return (
    // The student's own rating and words: record content, quoted (density rule: user-authored content is data, not prose).
    <div className="flex flex-col gap-0.5 rounded-md bg-muted/60 px-3 py-2 text-sm" data-user-content>
      {rating ? (
        <p className="text-foreground">
          <span className="text-muted-foreground">{student} rated </span>
          {rating}
        </p>
      ) : null}
      {note ? <p className="whitespace-pre-line break-words text-muted-foreground" data-student-note>&ldquo;{note}&rdquo;</p> : null}
    </div>
  )
}

/** All answers for one skill: outcome, then level and questions once graded, then feedback. */
export function SkillFields({ m, skill, compactQuestions = false }: { m: EvaluatorModel; skill: EvSkill; compactQuestions?: boolean }) {
  const r = m.response(skill.id)
  const issues = m.issuesFor(skill.id)
  const issue = (field: string) => issues.find((i) => i.field === field)
  const graded = r.outcome === "met" || r.outcome === "not-met"
  const outId = evFieldId.outcome(skill.id)
  const fbId = evFieldId.feedback(skill.id)
  const fbRequired = skill.feedbackRequired || r.outcome === "not-yet"
  return (
    <div className="flex flex-col gap-4">
      {skill.prior ? (
        <p className="text-sm text-muted-foreground">
          Earlier answer: <span className="text-foreground">{[skill.choices.find((c) => c.value === skill.prior!.outcome)?.label, skill.prior.level !== null ? skill.levels[skill.prior.level] : null].filter(Boolean).join(", ")}</span>
        </p>
      ) : null}
      <div className="flex flex-col gap-2">
        <Label id={`${outId}-label`} className="text-sm font-medium">Outcome</Label>
        <ChoiceTiles id={outId} labelId={`${outId}-label`} options={skill.choices} value={r.outcome} onChange={(v) => m.setAnswer(skill.id, { outcome: v as EvResponse["outcome"] })} invalid={!!issue(outId)} describedBy={issue(outId) ? `${outId}-err` : undefined} cols={skill.choices.length === 3 ? 3 : 2} />
        <FieldError id={`${outId}-err`} issue={issue(outId)} />
        {m.options.ruleHint && skill.ruleHint ? <p className="text-xs text-muted-foreground">{skill.ruleHint}</p> : null}
      </div>
      {graded && skill.levels.length ? (
        <div className="flex flex-col gap-2">
          <Label id={`${evFieldId.level(skill.id)}-label`} className="text-sm font-medium">{skill.levelsLabel}</Label>
          <ChoiceTiles id={evFieldId.level(skill.id)} labelId={`${evFieldId.level(skill.id)}-label`} options={skill.levels.map((l, i) => ({ value: String(i), label: l }))} value={r.level === null ? null : String(r.level)} onChange={(v) => m.setAnswer(skill.id, { level: Number(v) })} invalid={!!issue(evFieldId.level(skill.id))} cols={3} />
          <FieldError id={`${evFieldId.level(skill.id)}-err`} issue={issue(evFieldId.level(skill.id))} />
        </div>
      ) : null}
      {graded && skill.answerKind ? (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-sm font-medium text-foreground">{skill.answerKind === "score" ? `Score each, 1 to ${SCORE_MAX}` : "Criteria"}</legend>
          {skill.questions.map((q, i) => {
            const qid = evFieldId.question(skill.id, i)
            const val = r.answers[i] ?? null
            return (
              <div key={q} className={cn("flex gap-2", compactQuestions ? "flex-col" : "flex-col sm:flex-row sm:items-center sm:justify-between")}>
                <div className={cn("flex flex-col gap-0.5", !compactQuestions && "sm:max-w-[55%]")}>
                  <p id={`${qid}-label`} className="text-sm text-foreground">{q}</p>
                  {/* The student's own answer beside the evaluator's, as context (EV-04); never prefilled into the evaluator's choice. */}
                  {skill.self?.answers?.[i] ? <p className="text-xs text-muted-foreground" data-self-answer>{`Student said ${skill.self.answers[i] === "yes" ? "Yes" : "No"}`}</p> : null}
                </div>
                <div className={skill.answerKind === "score" ? "w-full sm:w-64" : "w-full sm:w-44"}>
                  <ChoiceTiles
                    id={qid}
                    labelId={`${qid}-label`}
                    options={skill.answerKind === "score" ? Array.from({ length: SCORE_MAX }, (_, n) => ({ value: String(n + 1), label: String(n + 1) })) : [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]}
                    value={val === null ? null : String(val)}
                    onChange={(v) => {
                      const next = [...r.answers]
                      next[i] = skill.answerKind === "score" ? Number(v) : (v as "yes" | "no")
                      m.setAnswer(skill.id, { answers: next })
                    }}
                    invalid={!!issue(qid)}
                    cols={skill.answerKind === "score" ? 5 : 2}
                  />
                </div>
              </div>
            )
          })}
          <FieldError id={`${skill.id}-q-err`} issue={issues.find((x) => x.field.startsWith(`ev-q-${skill.id}`))} />
        </fieldset>
      ) : null}
      <div className="flex flex-col gap-2">
        <Label htmlFor={fbId} className="text-sm font-medium">
          Feedback {fbRequired ? <span className="font-normal text-muted-foreground">(required)</span> : <span className="font-normal text-muted-foreground">(optional)</span>}
        </Label>
        <Textarea id={fbId} rows={2} value={r.feedback} onChange={(e) => m.setAnswer(skill.id, { feedback: e.target.value })} aria-invalid={!!issue(fbId) || undefined} aria-describedby={issue(fbId) ? `${fbId}-err` : undefined} className="min-h-16" />
        <FieldError id={`${fbId}-err`} issue={issue(fbId)} />
      </div>
    </div>
  )
}

/** Summary of what blocks submit, with a link to each field. Focused when submit fails. */
export function ErrorSummary({ m }: { m: EvaluatorModel }) {
  if (!m.showErrors || m.issues.length === 0) return null
  const n = m.issues.length
  return (
    <div ref={m.summaryRef} tabIndex={-1} className="outline-none" data-region="errors">
      <LocalBanner variant="error" title={`${n} ${n === 1 ? "answer" : "answers"} missing`}>
        <ul className="mt-1 flex flex-col gap-0.5">
          {m.issues.map((i) => (
            <li key={i.field}>
              <Button type="button" variant="link" size="sm" className="h-auto p-0 text-left whitespace-normal" onClick={() => focusField(i.field)}>
                {m.req && m.req.skills.length > 1 ? `${i.skillName}: ` : ""}
                {i.message}
              </Button>
            </li>
          ))}
        </ul>
      </LocalBanner>
    </div>
  )
}

/** State banners above the form: corrected request, name not on record, offline. One each, only when it applies. */
export function StateBanners({ m, req }: { m: EvaluatorModel; req: EvRequest }) {
  return (
    <>
      {m.state === "corrected" ? (
        <LocalBanner variant="info" title={`Sent again, revision ${req.revision}`}>
          Returned because: {req.returnReason}
        </LocalBanner>
      ) : null}
      {!req.onRecord ? (
        <LocalBanner variant="info" title={`${req.student.first} named you as the evaluator`}>
          The program may confirm your details before this counts.
        </LocalBanner>
      ) : null}
      {m.offline ? (
        <LocalBanner variant="warning" title="You are offline">
          Answers stay on this phone and send when you reconnect.
        </LocalBanner>
      ) : null}
    </>
  )
}

/** "NURS 350 · Harbor General, 4 West, Inpatient · Performed Oct 20": course, where and when, in one line of data (EV-04). */
export function contextLine(req: EvRequest): string {
  return [req.course.code, req.where ? `${req.where.location}${req.where.setting ? `, ${req.where.setting}` : ""}` : null, req.performed ? `Performed ${req.performed}` : null].filter(Boolean).join(" · ")
}

export const skillsWord = (n: number) => `${n} ${n === 1 ? skillNoun() : skillNounPlural()}`

/**
 * Who is asking and where, shown inside the light header (EvaluatorFrame `summary`): the student's name as the page title and
 * one line of request data (skills, course, place). The "Lab sample" badge marks lab data.
 */
export function RequestSummary({ req, line }: { req: EvRequest; line: string }) {
  return (
    <div className="flex flex-col gap-1">
      <PageHeader title={req.student.name} subtitle={<span data-viz-label>{line}</span>} className="px-0 pt-0 pb-0 lg:px-0 lg:pt-0 lg:pb-0" />
      {/* The student's note on the request, in full and once (EV-04): record content, quoted, so it is data, not prose. */}
      {req.studentNote ? (
        <figure className="flex flex-col gap-0.5 rounded-md bg-muted/60 px-3 py-2 text-sm" data-user-content data-request-note>
          <figcaption className="text-muted-foreground">{`Note from ${req.student.first}`}</figcaption>
          <blockquote className="whitespace-pre-line break-words text-foreground">&ldquo;{req.studentNote}&rdquo;</blockquote>
        </figure>
      ) : null}
      {req.sample ? <Badge variant="outline" className="w-fit">Lab sample</Badge> : null}
    </div>
  )
}
