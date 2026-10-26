"use client"

/**
 * Student Send for evaluation, variant B: situation first (named alternative).
 * Tests: does asking "Is your evaluator with you?" first (with me: QR or hand over; not here: email link; paper: photo) route a
 * student to the right method faster than choosing skills and a person first?
 * Regions (form budget 4): header · the situation (three choices) · the rest of the request, shown once a situation is chosen.
 * Same draft, checks and result as variant A; only the order and the mental model differ.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { FieldError, FieldLegend, FieldSet } from "@exxatdesignux/ui/components/ui/field"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@exxatdesignux/ui/components/ui/radio-group"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { EmptyBlock, Student2Frame, type Student2Ctx } from "@/components/lab/student2/frame"
import { EvaluatorPicker, MethodTiles, TOUCH_ROW } from "@/components/lab/student2/log-parts"
import { PhotoField, PlacementSelect, RequestResult, SkillsField, scopeSentence, useRequestDraft } from "@/components/lab/student2/request-parts"
import { FormSkeleton } from "./student-log-a"
import { aNoun, skillNoun } from "@/lib/lab/terms"
import { METHODS, methodById, needsApproval, student2Href } from "@/lib/lab/student2"

type Situation = "with-me" | "not-here" | "paper"

const SITUATIONS: Array<{ id: Situation; title: string; sub: string; icon: string }> = [
  { id: "with-me", title: "They are with me", sub: "Scan a code or sign on this device", icon: "fa-user-group" },
  { id: "not-here", title: "They are not here", sub: "Email a link, no account needed", icon: "fa-envelope" },
  { id: "paper", title: "I have a signed paper form", sub: "Upload a photo for review", icon: "fa-file-signature" },
]

export function StudentRequestB() {
  return (
    <Student2Frame
      title="Send for evaluation"
      width="wide"
      empty={(c) => <EmptyBlock title="Nothing to send yet" body={`Log ${aNoun()} first, then send it here for evaluation.`} action={{ label: `Log ${aNoun()}`, href: student2Href("log-skill", {}, c.studentId) }} />}
      loading={<FormSkeleton />}
    >
      {(ctx) => <SituationFirst ctx={ctx} />}
    </Student2Frame>
  )
}

function SituationFirst({ ctx }: { ctx: Student2Ctx }) {
  const d = useRequestDraft(ctx)
  const [sit, setSit] = React.useState<Situation | null>(null)
  if (d.result) return <RequestResult d={d} r={d.result} />
  const choose = (v: Situation) => {
    setSit(v)
    d.setMethod(v === "with-me" ? "qr" : v === "not-here" ? "link" : "photo")
  }
  const m = methodById(d.method)
  const counts = d.method === "photo" ? "It counts after review." : needsApproval(d.s, d.skills) ? "It counts after approval." : "It counts when they answer Met."
  return (
    <form className="flex flex-col gap-5" noValidate onSubmit={(e) => { e.preventDefault(); d.send() }} data-student-lab="request-B">
      <Card className="gap-0 py-0" data-region="situation">
        <CardContent className="py-4">
          <FieldSet>
            <FieldLegend variant="label">Is your evaluator with you?</FieldLegend>
            <RadioGroup value={sit ?? ""} onValueChange={(v) => choose(v as Situation)} className="grid gap-2 sm:grid-cols-3" aria-label="Is your evaluator with you?">
              {SITUATIONS.map((x) => (
                <Label key={x.id} htmlFor={`sit-${x.id}`} className={cn("flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 font-normal has-[[data-state=checked]]:border-foreground has-[[data-state=checked]]:bg-muted/40", TOUCH_ROW)}>
                  <RadioGroupItem value={x.id} id={`sit-${x.id}`} className="mt-0.5" />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <i className={`fa-light ${x.icon} text-muted-foreground`} aria-hidden="true" />
                      {x.title}
                    </span>
                    <span className="text-xs text-muted-foreground">{x.sub}</span>
                  </span>
                </Label>
              ))}
            </RadioGroup>
          </FieldSet>
        </CardContent>
      </Card>

      {sit ? (
        <Card className="gap-0 py-0" data-region="request">
          <CardContent className="flex flex-col gap-5 py-4">
            {sit === "with-me" ? <MethodTiles value={d.method} onChange={d.setMethod} offline={d.offline} methods={METHODS.filter((x) => x.inPerson)} /> : null}
            <div className="flex flex-col gap-3">
              <PlacementSelect choices={d.clinicalWhere} value={d.whereVal} onChange={d.setWhere} />
              <EvaluatorPicker options={d.options} value={d.who} onChange={d.setWho} fresh={d.fresh} onFresh={d.setFresh} errors={d.freshErrors} showErrors={d.tried} compact />
              {d.tried && d.errors.who ? <FieldError>{d.errors.who}</FieldError> : null}
            </div>
            <div className="border-t border-border pt-4">
              <SkillsField d={d} picks={d.picks} />
            </div>
            {sit === "paper" ? <PhotoField d={d} /> : null}
            <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Replaces the count sentence (the count is on the skills heading): what the evaluator sees, then when it counts. */}
              <p className="text-sm text-muted-foreground" data-scope-sentence>{`${scopeSentence(d)} ${counts}`}</p>
              <Button type="submit" variant="default" size="default" className="w-full sm:w-auto max-sm:h-11">{d.offline && !m.offline ? "Keep and send later" : "Send"}</Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </form>
  )
}
