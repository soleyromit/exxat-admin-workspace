"use client"

/**
 * Review item A, side-by-side compare. The student's self-rating and the evaluator's answers sit in one table per skill, each row
 * marked Agrees or Differs in words [REQ AR-02, AR-03, EV-04]; why held and the one decision bar sit above it; the rule check and the
 * AR-01 facts sit in a narrow column beside it. The pull-request analogy: the claim next to the observation.
 */
import { TYPE } from "@/components/lab/type-scale"
import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { Separator } from "@exxatdesignux/ui/components/ui/separator"
import { ReviewItemFrame } from "@/components/lab/reviewer/review-item-frame"
import { Facts, ReviewNoteField, RuleCheckLine, Story, WhyHeld } from "@/components/lab/reviewer/review-parts"
import { story } from "@/lib/lab/reviewer"
import { ReviewResponses } from "@/components/lab/reviewer/review-responses"

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
              {/* The left column carries the read-then-decide order: answers, how the submission got here, then the note that goes
                  with the decision. It used to stop after the answers and leave half the 1440 canvas empty beside a tall facts card
                  (design review 2026-10-30, CP-4). */}
              <div className="flex flex-col gap-6 lg:col-span-8" data-region="compare">
                <div role="group" aria-label="Self and evaluator answers" className="flex flex-col gap-4">
                  <ReviewResponses state={ctx.state} d={d} />
                </div>
                <div role="group" aria-labelledby="story-heading" className="flex flex-col gap-2">
                  <h3 id="story-heading" className={TYPE.group}>How it got here</h3>
                  <Story steps={story(ctx.state!, d)} />
                </div>
                <ReviewNoteField />
              </div>
              <Card size="sm" className="self-start lg:col-span-4" data-region="facts">
                <CardHeader>
                  <CardTitle className={TYPE.card}>If you approve</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {ctx.checks.map((c) => <RuleCheckLine key={c.skillId} check={c} />)}
                  <Separator />
                  <Facts d={d} scope={ctx.scope} />
                </CardContent>
              </Card>
            </div>
          </>
        )
      }}
    </ReviewItemFrame>
  )
}
