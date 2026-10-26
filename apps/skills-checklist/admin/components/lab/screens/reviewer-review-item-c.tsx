"use client"

/**
 * Review item C, decision first. A verdict card leads with what the engine says approval would do, in numbers ("becomes achieved:
 * 4 of 4") and the minimum evidence still needed, with the decision bar inside it. The answers, and the story with the facts, are
 * collapsed underneath. Tests whether a reviewer who trusts the rule decides faster when the consequence comes first.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@exxatdesignux/ui/components/ui/collapsible"
import { story, type RuleCheck } from "@/lib/lab/reviewer"
import { ReviewItemFrame } from "@/components/lab/reviewer/review-item-frame"
import { AgreementMark } from "@/components/lab/reviewer/parts"
import { CompareTable, DecisionBar, Facts, Feedback, Story, WhyHeld } from "@/components/lab/reviewer/review-parts"

export function ReviewerReviewItemC() {
  return (
    <ReviewItemFrame variant="C">
      {(ctx) => {
        const d = ctx.detail
        const differ = d.comparisons.some((c) => c.overall === "differed")
        return (
          <div className="flex max-w-3xl flex-col gap-4">
            <Card data-region="verdict">
              <CardContent className="flex flex-col gap-4">
                <WhyHeld row={d.row} />
                <div className="flex flex-col gap-3">
                  {ctx.checks.map((c) => <Verdict key={c.skillId} c={c} />)}
                </div>
                {d.comparisons.length ? (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    Self and evaluator: <AgreementMark agreement={differ ? "differed" : d.comparisons.some((c) => c.overall === "agreed") ? "agreed" : "not-comparable"} />
                  </p>
                ) : null}
                <DecisionBar row={d.row} next={ctx.next} />
              </CardContent>
            </Card>
            <Section title="Answers" defaultOpen={differ}>
              <div className="flex flex-col gap-3">
                {d.comparisons.length ? d.comparisons.map((c) => <CompareTable key={c.evaluationId} c={c} />) : <p className="text-sm text-muted-foreground">The outcome is on the photo of the paper form and has not been entered.</p>}
                <Feedback text={d.feedback} />
              </div>
            </Section>
            {/* One disclosure for the context (story, then course, setting and location): both answer "where did this come
                from", and a third toggle would crowd the decision (strategy/07 detail budget, 6 controls). */}
            <Section title="How it got here">
              <div className="flex flex-col gap-4">
                <Story steps={story(ctx.state!, d)} />
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold text-foreground">Course, setting and location</h3>
                  <Facts d={d} scope={ctx.scope} />
                </div>
              </div>
            </Section>
          </div>
        )
      }}
    </ReviewItemFrame>
  )
}

function Verdict({ c }: { c: RuleCheck }) {
  if (!c.after) return <p className="text-sm text-muted-foreground">{`${c.skill} has no rule yet.`}</p>
  const n = c.after
  return (
    <div className="flex items-start gap-4" data-rule-check>
      <span className="flex min-w-24 flex-col" data-figure>
        <span className="text-2xl font-semibold tabular-nums leading-tight">{c.numbers}</span>
        <span className="text-xs text-muted-foreground">after approval</span>
      </span>
      <span className="flex min-w-0 flex-col gap-0.5 pt-0.5">
        <span className="text-sm font-medium">{c.flips ? `Approving makes ${c.skill} achieved` : c.already ? `${c.skill} is already achieved` : n.counted === 0 ? `${c.skill} still has no counted evidence` : `${c.skill} stays in progress`}</span>
        <span className="text-xs text-muted-foreground">{c.already ? "This evaluation adds evidence; the state does not change." : n.achieved ? n.rule.replace(/^You need /, "Rule: ") : `Still needed: ${c.missing.join("; ")}`}</span>
      </span>
    </div>
  )
}

function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(defaultOpen)
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="flex flex-col gap-2 border-t border-border pt-2">
      <CollapsibleTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="self-start" aria-expanded={open}>
          <i className={`fa-light ${open ? "fa-chevron-down" : "fa-chevron-right"}`} aria-hidden="true" />
          {title}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  )
}
