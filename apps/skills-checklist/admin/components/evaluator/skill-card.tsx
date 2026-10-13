"use client"

import * as React from "react"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { Textarea } from "@exxatdesignux/ui/components/ui/textarea"
import { FieldError } from "@exxatdesignux/ui/components/ui/field"
import type { EvaluatorRequestItem } from "@/lib/store"
import { EvaluatorAnswerGroup } from "./answer-group"
import { StudentContext } from "./student-context"
import { evaluatorCopy as c, heldOrCounts } from "@/lib/copy"
import { missingKeys, type AnswerDraft } from "./form-state"

/**
 * One skill in the request (EV-05: several in one sitting, each with its own outcome and comment).
 * Shows the skill name and its model's controls only. The program's achievement figures are never shown (OD-17, DEFECT-05).
 */
export function SkillCard({
  index,
  item,
  settingLine,
  draft,
  onChange,
  showErrors,
  headingRef,
  previousReturned,
  criteriaLine,
  heldLabel,
}: {
  index: number
  item: EvaluatorRequestItem
  settingLine: string
  draft: AnswerDraft
  onChange: (next: AnswerDraft) => void
  showErrors: boolean
  headingRef?: React.Ref<HTMLHeadingElement>
  /** OD-08 seam: shows the line only when an earlier evaluation of this skill was returned. Answers are not prefilled. */
  previousReturned: boolean
  /** C-6 [PROTO]: "Model · Achievement: criteria". Only the in-shell demo page passes it (flag evaluatorSeesProgress); the real link never does (OD-17). */
  criteriaLine?: string
  /** [PROTO] "Goes to review" on the in-shell demo page; the real link keeps the sentence from lib/copy. */
  heldLabel?: string
}) {
  const prefix = `ev-${item.submissionId}`
  const mandatory = item.commentRule === "mandatory"
  const missing = missingKeys(item.model, draft)
  const answersInvalid = showErrors && missing.length > 0
  const commentInvalid = showErrors && mandatory && !draft.comment.trim()
  const answerErrorId = `${prefix}-answers-error`
  const commentErrorId = `${prefix}-comment-error`
  const commentId = `${prefix}-comment`
  const answerError = item.model.kind === "question" || item.model.kind === "scored" ? c.incompleteQuestions(item.skillName) : c.incompleteChoice(item.skillName)
  return (
    <section aria-labelledby={`${prefix}-h`} className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4" data-testid={`skill-${item.skillId}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 id={`${prefix}-h`} ref={headingRef} tabIndex={-1} className="text-base font-semibold text-foreground">
          {c.skillHeading(index + 1, item.skillName)}
        </h2>
        <Badge variant="outline" className="h-auto max-w-full whitespace-normal py-1 text-left">{item.heldForApproval ? (heldLabel ?? heldOrCounts.beforeSubmit.held) : heldOrCounts.beforeSubmit.countsNow}</Badge>
      </div>
      {criteriaLine ? (
        <p className="text-sm text-muted-foreground" data-testid="criteria-line">
          {criteriaLine}
        </p>
      ) : null}
      <p className="text-sm text-muted-foreground">{settingLine}</p>
      {previousReturned ? <p className="text-sm text-muted-foreground">{c.previousReturned}</p> : null}
      <StudentContext idPrefix={prefix} values={item.studentValues} note={item.studentNote} model={item.model} selfEvaluation={item.selfEvaluation} />
      <div className="flex flex-col gap-2" aria-describedby={answersInvalid ? answerErrorId : undefined}>
        <EvaluatorAnswerGroup idPrefix={prefix} model={item.model} draft={draft} onChange={onChange} invalidKeys={answersInvalid ? missing : []} />
        {answersInvalid ? <FieldError id={answerErrorId}>{answerError}</FieldError> : null}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={commentId} className="text-sm font-medium">
          {mandatory ? c.commentRequired : c.commentOptional}
        </Label>
        <Textarea
          id={commentId}
          value={draft.comment}
          onChange={(e) => onChange({ ...draft, comment: e.target.value })}
          aria-required={mandatory || undefined}
          aria-invalid={commentInvalid || undefined}
          aria-describedby={[`${prefix}-comment-help`, commentInvalid ? commentErrorId : null].filter(Boolean).join(" ")}
          rows={4}
        />
        <p id={`${prefix}-comment-help`} className="text-sm text-muted-foreground">
          {c.commentHelper}
        </p>
        {commentInvalid ? <FieldError id={commentErrorId}>{c.commentError(item.skillName)}</FieldError> : null}
      </div>
    </section>
  )
}
