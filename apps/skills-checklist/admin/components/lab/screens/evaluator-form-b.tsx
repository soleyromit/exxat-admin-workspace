"use client"

/**
 * Evaluation form, variant B: one skill per screen (DS Wizard), swipe or Next, then a review step before submit.
 * Mental model: a short survey. Built for a long request (7 skills) where one long page loses the evaluator's place.
 * Next checks only the current skill; the review step lists anything still open with a link back to it.
 */
import { capitalize, skillNoun } from "@/lib/lab/terms"
import * as React from "react"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { Wizard, WizardContent, WizardNav, WizardPanel, WizardProgress, WizardStepHeading, type WizardStep } from "@exxatdesignux/ui/components/ui/wizard"
import { EvaluatorGate } from "@/components/lab/evaluator/gate"
import { StickyBar } from "@/components/lab/evaluator/frame"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { RequestSummary, SelfNote, SkillFields, StateBanners, contextLine, skillsWord } from "@/components/lab/evaluator/fields"
import { focusField, useEvaluator } from "@/components/lab/evaluator/use-evaluator"

export function EvaluatorFormB() {
  const m = useEvaluator()
  const req = m.req
  const skills = req?.skills ?? []
  const last = skills.length
  const [step, setStep] = React.useState(0)
  const [checked, setChecked] = React.useState<Set<number>>(() => new Set())
  const touch = React.useRef<number | null>(null)

  React.useEffect(() => {
    setStep(0)
    setChecked(new Set())
  }, [req?.id, skills.length, m.state])

  const onReview = step === last
  const openIn = (i: number) => m.issues.filter((x) => x.skillId === skills[i]?.id)
  const steps: WizardStep[] = [...skills.map((k, i) => ({ id: k.id, label: k.name, error: checked.has(i) && openIn(i).length > 0 })), { id: "review", label: "Review" }]

  const go = (i: number) => {
    setChecked((p) => new Set(p).add(step))
    setStep(Math.max(0, Math.min(last, i)))
    requestAnimationFrame(() => document.getElementById(`ev-b-step-${Math.max(0, Math.min(last, i))}`)?.focus())
  }
  const next = () => {
    if (!onReview && openIn(step).length) {
      setChecked((p) => new Set(p).add(step))
      requestAnimationFrame(() => focusField(openIn(step)[0].field))
      return
    }
    go(step + 1)
  }

  return (
    <EvaluatorGate
      m={m}
      summary={req ? <RequestSummary req={req} line={contextLine(req)} /> : null}
      footer={
        <StickyBar>
          {/* A Previous / Next pager: the dead half stays in place at the first skill so Next never moves under the thumb. */}
          <Button type="button" variant="outline" size="lg" className="min-h-(--control-height-touch)" disabled={step === 0} onClick={() => go(step - 1)} aria-label={`Previous ${skillNoun()}`}>Previous</Button>
          {onReview ? (
            <Button type="button" variant="default" size="lg" className="min-h-(--control-height-touch) flex-1 sm:ms-auto sm:flex-none" onClick={m.submit}>{m.offline ? "Save and send later" : `Submit ${skillsWord(last)}`}</Button>
          ) : (
            <Button type="button" variant="default" size="lg" className="min-h-(--control-height-touch) flex-1 sm:ms-auto sm:flex-none" onClick={next}>{step === last - 1 ? "Review" : "Next"}</Button>
          )}
        </StickyBar>
      }
    >
      {req ? (
        <div className="flex flex-col gap-4">
          <StateBanners m={m} req={req} />
          <Wizard steps={steps} current={step} orientation="horizontal" variant="compact" onStepClick={(i) => go(i)}>
            <WizardNav className="hidden md:flex" />
            <WizardContent className="flex flex-col gap-3">
              {/* Phone only: the stepper above says the same from md up (anatomy, 2026-10-30). */}
              <WizardProgress className="md:hidden" formatLabel={(c, t) => (c === t ? "Review" : `${capitalize(skillNoun())} ${c} of ${t - 1}`)} />
              <div
                data-region="skill"
                onTouchStart={(e) => { touch.current = e.touches[0]?.clientX ?? null }}
                onTouchEnd={(e) => {
                  const start = touch.current
                  touch.current = null
                  const end = e.changedTouches[0]?.clientX
                  if (start === null || end === undefined || Math.abs(end - start) < 60) return
                  if (end < start) next()
                  else go(step - 1)
                }}
              >
                {skills.map((k, i) => (
                  <WizardPanel key={k.id} step={i} className="flex flex-col gap-4">
                    <div id={`ev-b-step-${i}`} tabIndex={-1} className="flex items-start justify-between gap-3 outline-none">
                      <WizardStepHeading id={k.id} className="mb-0">{k.name}</WizardStepHeading>
                      {k.attempt ? <Badge variant="secondary" className="shrink-0">{k.attempt.limit ? `Attempt ${k.attempt.n} of ${k.attempt.limit}` : `Attempt ${k.attempt.n}`}</Badge> : null}
                    </div>
                    <SelfNote skill={k} student={req.student.first} requestNote={req.studentNote} />
                    <SkillFields m={{ ...m, issuesFor: (id) => (checked.has(i) || m.showErrors ? m.issues.filter((x) => x.skillId === id) : []) }} skill={k} compactQuestions />
                  </WizardPanel>
                ))}
                <WizardPanel step={last} className="flex flex-col gap-3">
                  <div id={`ev-b-step-${last}`} tabIndex={-1} className="outline-none">
                    <WizardStepHeading id="review" className="mb-0">Review</WizardStepHeading>
                  </div>
                  {m.showErrors && m.issues.length ? (
                    <div ref={m.summaryRef} tabIndex={-1} className="outline-none" data-region="errors">
                      <LocalBanner variant="error" title={`Finish ${skillsWord(new Set(m.issues.map((x) => x.skillId)).size)} to submit`}>Use Change to go back to each one.</LocalBanner>
                    </div>
                  ) : null}
                  <Card size="sm">
                    <CardContent>
                      <ul className="flex flex-col divide-y divide-border">
                        {skills.map((k, i) => {
                          const r = m.response(k.id)
                          const open = openIn(i).length > 0
                          const answer = [k.choices.find((c) => c.value === r.outcome)?.label, r.level !== null ? k.levels[r.level] : null].filter(Boolean).join(", ")
                          return (
                            <li key={k.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground">{k.name}</p>
                                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                  <i className={open ? "fa-light fa-circle-dashed" : "fa-solid fa-circle-check"} aria-hidden="true" />
                                  {open ? "Not finished" : answer}
                                </p>
                              </div>
                              <Button type="button" variant="ghost" size="sm" onClick={() => go(i)} aria-label={`Change ${k.name}`}>Change</Button>
                            </li>
                          )
                        })}
                      </ul>
                    </CardContent>
                  </Card>
                  {!req.onRecord ? (
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="ev-b-name" className="text-sm font-medium">Your name and credential</Label>
                      <Input id="ev-b-name" defaultValue={req.evaluator.name} autoComplete="name" className="max-w-sm" />
                    </div>
                  ) : null}
                </WizardPanel>
              </div>
            </WizardContent>
          </Wizard>
        </div>
      ) : null}
    </EvaluatorGate>
  )
}
