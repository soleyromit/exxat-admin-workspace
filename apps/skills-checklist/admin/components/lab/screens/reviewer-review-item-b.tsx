"use client"

/**
 * Review item B, evidence timeline. The submission told as a story, oldest first: the request, any earlier returns, the evaluator's
 * signature and every version, then "Waiting for you" with the cause. The answers and the decision come at the end of the story, as
 * the last step. Tests whether context in time order makes the decision safer than a compare table.
 */
import { TYPE } from "@/components/lab/type-scale"
import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@exxatdesignux/ui/components/ui/collapsible"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { story } from "@/lib/lab/reviewer"
import { ReviewItemFrame } from "@/components/lab/reviewer/review-item-frame"
import { Facts, ReviewNoteField, RuleCheckLine, Story, WhyHeld } from "@/components/lab/reviewer/review-parts"
import { ReviewResponses } from "@/components/lab/reviewer/review-responses"

export function ReviewerReviewItemB() {
  return (
    <ReviewItemFrame variant="B">
      {(ctx) => {
        const d = ctx.detail
        const steps = story(ctx.state!, d)
        return (
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="flex flex-col gap-4 lg:col-span-7">
              <section aria-label="Submission story" data-region="story" className="rounded-lg border border-border px-4 py-4">
                <Story steps={steps} />
              </section>
              <Card size="sm" data-region="decision">
                <CardHeader>
                  <CardTitle className={TYPE.card}>Your decision</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <WhyHeld row={d.row} />
                  {ctx.checks.map((c) => <RuleCheckLine key={c.skillId} check={c} />)}
                  <ReviewNoteField />
                </CardContent>
              </Card>
            </div>
            <div className="flex flex-col gap-4 lg:col-span-5">
              <section aria-label="Answers" className="flex flex-col gap-3" data-region="answers">
                <ReviewResponses state={ctx.state} d={d} />
              </section>
              <Details>
                <Facts d={d} scope={ctx.scope} />
              </Details>
            </div>
          </div>
        )
      }}
    </ReviewItemFrame>
  )
}

function Details({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="flex flex-col gap-2">
      <CollapsibleTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="self-start">
          <i className={`fa-light ${open ? "fa-chevron-up" : "fa-chevron-down"}`} aria-hidden="true" />
          {open ? "Hide course, setting and location" : "Course, setting and location"}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  )
}
