"use client"

/**
 * Review item A, side-by-side compare. The student's self-rating and the evaluator's answers sit in one table per skill, each row
 * marked Agrees or Differs in words [REQ AR-02, AR-03, EV-04]; why held and the one decision bar sit above it; the rule check and the
 * AR-01 facts sit in a narrow column beside it. The pull-request analogy: the claim next to the observation.
 */
import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { Separator } from "@exxatdesignux/ui/components/ui/separator"
import { ReviewItemFrame } from "@/components/lab/reviewer/review-item-frame"
import { isCheckoff } from "@/lib/lab/reviewer"
import { CompareTable, Facts, Feedback, ReviewNoteField, RuleCheckLine, WhyHeld } from "@/components/lab/reviewer/review-parts"

export function ReviewerReviewItemA() {
  return (
    <ReviewItemFrame variant="A">
      {(ctx) => {
        const d = ctx.detail
        return (
          <>
            <Card size="sm" data-region="decision">
              <CardContent className="flex flex-col gap-3">
                <WhyHeld row={d.row} />
              </CardContent>
            </Card>
            <div className="grid gap-4 lg:grid-cols-12">
              <section aria-label="Self and evaluator answers" className="flex flex-col gap-4 lg:col-span-8" data-region="compare">
                {d.comparisons.length ? d.comparisons.map((c) => <CompareTable key={c.evaluationId} c={c} checkoff={isCheckoff(d.row)} />) : <p className="text-sm text-muted-foreground">The outcome is on the photo of the paper form and has not been entered.</p>}
                {d.feedback ? (
                  <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-semibold">Evaluator feedback</h3>
                    <Feedback text={d.feedback} />
                  </div>
                ) : null}
              </section>
              <Card size="sm" className="self-start lg:col-span-4" data-region="facts">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">If you approve</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {ctx.checks.map((c) => <RuleCheckLine key={c.skillId} check={c} />)}
                  <Separator />
                  <Facts d={d} scope={ctx.scope} />
                  <Separator />
                  <ReviewNoteField />
                </CardContent>
              </Card>
            </div>
          </>
        )
      }}
    </ReviewItemFrame>
  )
}
