"use client"

/**
 * Evaluation form, variant A: one scrolling page, one card per skill, outcome tiles, sticky submit bar.
 * Mental model: a paper checklist on one sheet. The request summary sits inside the light header (one region), so the first
 * viewport is header with summary, the first skill and the submit bar (3 regions, strategy/07) at 1440, 1280 and 375.
 * Each skill but the last holds at least one screen (one skill per viewport, strategy/07 page-height line), so the next card
 * starts below the fold at any height, and a "Next" link under the card says what follows. The submit bar stays in view.
 * Design notes: docs/knowledge/design/evaluator-and-lab.md.
 */
import { TYPE } from "@/components/lab/type-scale"
import * as React from "react"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { EvaluatorGate } from "@/components/lab/evaluator/gate"
import { StickyBar } from "@/components/lab/evaluator/frame"
import { ErrorSummary, RequestSummary, SelfNote, SkillFields, StateBanners, contextLine, skillsWord } from "@/components/lab/evaluator/fields"
import { useEvaluator } from "@/components/lab/evaluator/use-evaluator"
import { LINK } from "@/components/lab/link-styles"

export function EvaluatorFormA() {
  const m = useEvaluator()
  const req = m.req
  const n = req?.skills.length ?? 0
  return (
    <EvaluatorGate
      m={m}
      summary={req ? <RequestSummary req={req} line={contextLine(req)} /> : null}
      footer={
        <StickyBar>
          <p className="sr-only" aria-live="polite">{`${m.done} of ${n} done`}</p>
          <Button type="button" variant="default" size="lg" className="min-h-(--control-height-touch) w-full sm:w-auto" onClick={m.submit}>
            {m.offline ? "Save and send later" : `Submit ${skillsWord(n)}`}
          </Button>
        </StickyBar>
      }
    >
      {req ? (
        <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); m.submit() }} noValidate aria-label={`Evaluation for ${req.student.name}`}>
          <StateBanners m={m} req={req} />
          <ErrorSummary m={m} />
          {/* The level between the page h1 and each card's h3 (DS review 2026-10-30 S9); the cards say it visually. */}
          <h2 className="sr-only">{`${skillsWord(n)} to evaluate`}</h2>
          {req.skills.map((k, i) => {
            const next = req.skills[i + 1]
            return (
            <div key={k.id} className={next ? "flex min-h-[calc(100dvh-10rem)] flex-col items-start gap-2" : "flex flex-col"}>
            <Card id={`ev-a-skill-${k.id}`} size="sm" data-region="skill" className="w-full scroll-mt-4">
              <CardHeader>
                <CardTitle className={TYPE.card}>{k.name}</CardTitle>
                {k.attempt ? <CardAction><Badge variant="secondary">{k.attempt.limit ? `Attempt ${k.attempt.n} of ${k.attempt.limit}` : `Attempt ${k.attempt.n}`}</Badge></CardAction> : null}
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <SelfNote skill={k} student={req.student.first} requestNote={req.studentNote} />
                <SkillFields m={m} skill={k} />
              </CardContent>
            </Card>
            {next ? (
              <a href={`#ev-a-skill-${next.id}`} className={`${LINK} inline-flex min-h-(--control-height-touch) items-center gap-2 text-sm`}>
                <i className="fa-light fa-arrow-down" aria-hidden="true" />
                {`Next: ${next.name}`}
              </a>
            ) : null}
            </div>
            )
          })}
          {!req.onRecord ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ev-a-name" className="text-sm font-medium">Your name and credential</Label>
              <Input id="ev-a-name" defaultValue={req.evaluator.name} autoComplete="name" className="max-w-sm" />
            </div>
          ) : null}
        </form>
      ) : null}
    </EvaluatorGate>
  )
}
