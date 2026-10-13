"use client"

import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { addQuestion, removeQuestionFromDraft, setQuestionText } from "./draft"
import { useConfigure } from "./context"
import { describedBy, Errors } from "./section-card"

/** The "Add question" button lives in the card header (prototype P-08), so the focus target id stays `cfg-add-question`. */
export function AddQuestionButton({ label }: { label: string }) {
  const { setCfg } = useConfigure()
  return (
    <Button id="cfg-add-question" type="button" variant="outline" size="sm" onMouseDown={(e) => e.preventDefault()} onClick={() => setCfg((c) => addQuestion(c))}>
      <i className="fa-light fa-plus" aria-hidden="true" />
      {label}
    </Button>
  )
}

/**
 * The question rows for the question and scored models (SC-04): `Q1`, `Q2`, each an input and a remove control. Renaming is
 * text only (AE-06); removing cascades into the rules that referenced the question and says how many (AE-07).
 */
export function QuestionRows() {
  const { cfg, setCfg, visible, touch, announce, removal, setRemoval } = useConfigure()
  const m = cfg.model
  if (m?.kind !== "question" && m?.kind !== "scored") return null
  const listErrors = visible((p) => p === "model.questions")
  return (
    <div className="flex flex-col gap-2">
      <ol aria-label="Questions" className="flex flex-col gap-2">
        {m.questions.map((q, i) => {
          const errs = visible((p) => p === `model.questions.${i}`)
          return (
            <li key={q.id} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="w-8 text-xs font-medium text-muted-foreground" aria-hidden="true">
                  Q{i + 1}
                </span>
                <Input
                  id={`cfg-question-${i}`}
                  aria-label={`Question ${i + 1}`}
                  aria-invalid={errs.length > 0}
                  aria-describedby={describedBy(errs, `cfg-question-${i}`)}
                  value={q.text}
                  onChange={(e) => setCfg((c) => setQuestionText(c, q.id, e.target.value))}
                  onBlur={() => touch("model")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove question ${i + 1}`}
                  onClick={() => {
                    const r = removeQuestionFromDraft(cfg, q.id)
                    setCfg(() => r.cfg)
                    setRemoval({ kind: "question", n: r.removedFromRules })
                    announce(`Question ${i + 1} removed. Removed from ${r.removedFromRules} ${r.removedFromRules === 1 ? "rule" : "rules"}.`)
                  }}
                >
                  <i className="fa-light fa-trash-can" aria-hidden="true" />
                </Button>
              </div>
              <Errors issues={errs} for={`cfg-question-${i}`} />
            </li>
          )
        })}
      </ol>
      <Errors issues={listErrors} />
      {removal?.kind === "question" ? (
        <p className="text-sm text-muted-foreground" data-testid="removal-note">
          Removed from {removal.n} {removal.n === 1 ? "rule" : "rules"}. Evidence already recorded is kept.
        </p>
      ) : null}
    </div>
  )
}
