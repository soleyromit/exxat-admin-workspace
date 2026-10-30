"use client"

/**
 * Student Send for evaluation, variant A: who, then how (recommended).
 * Tests: do skills, then the evaluator (site preceptors first, or anyone by name and email), then one of four ways to reach them,
 * with one Send and one sentence on what happens next, get a request out fastest?
 * Regions (form budget 5): header · skills, where and who signs off · details and note · how they sign · this request (Send).
 * Where decides who may sign (clinical: preceptor or faculty; lab or simulation: lab instructor or faculty). Required details are
 * enforced with one summary on a failed Send; the result lists skills, evaluator and role, setting and location.
 * [REQ ST-04..ST-10, ST-12, ST-13, SL-11, EV-01, EV-02, EV-05, EV-07; LEDGER D-L2 one link per request; COMP QR fastest, CORE link]
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { FieldError } from "@exxatdesignux/ui/components/ui/field"
import { EmptyBlock, Student2Frame, type Student2Ctx } from "@/components/lab/student2/frame"
import { EvaluatorPicker, MethodTiles } from "@/components/lab/student2/log-parts"
import { DetailsAndNote, PhotoField, RequestResult, SavedForLater, SelfEvalPart, SendBlockedNote, SendIssues, SkillsField, WherePick, scopeSentence, useRequestDraft } from "@/components/lab/student2/request-parts"
import { SectionTitle } from "@/components/lab/student/parts"
import { FormSkeleton } from "./student-log-a"
import { aNoun, countSkills, skillNounPlural } from "@/lib/lab/terms"
import { NO_ACCOUNT_LINE, methodById, needsApproval, settingWords, student2Href } from "@/lib/lab/student2"

export function StudentRequestA() {
  return (
    <Student2Frame
      title={`Log ${aNoun()}`}
      empty={(c) => <EmptyBlock title={`No ${skillNounPlural()} open yet`} body={`Your program has not set up ${skillNounPlural()} to send. Check back once it has.`} action={{ label: "Back to My progress", href: student2Href("home", {}, c.studentId) }} />}
      loading={<FormSkeleton />}
    >
      {(ctx) => <RequestForm ctx={ctx} />}
    </Student2Frame>
  )
}

function RequestForm({ ctx }: { ctx: Student2Ctx }) {
  const d = useRequestDraft(ctx)
  if (d.result) return <div className="max-w-3xl"><RequestResult d={d} r={d.result} /></div>
  const approval = needsApproval(d.s, d.skills)
  const m = methodById(d.method)
  return (
    <form className="grid gap-5 lg:grid-cols-12" noValidate onSubmit={(e) => { e.preventDefault(); d.send() }} data-student-lab="request-A">
      <div className="flex min-w-0 flex-col gap-5 lg:col-span-8">
        <SendIssues d={d} />
        <Card className="gap-0 py-0" data-region="who">
          <CardContent className="flex flex-col gap-5 py-4">
            <SkillsField d={d} picks={d.picks} />
            <div className="flex flex-col gap-3 border-t border-border pt-4">
              <WherePick d={d} />
              <EvaluatorPicker options={d.options} value={d.who} onChange={d.setWho} fresh={d.fresh} onFresh={d.setFresh} errors={d.freshErrors} showErrors={d.tried} compact />
              {d.tried && d.errors.who ? <FieldError>{d.errors.who}</FieldError> : null}
            </div>
          </CardContent>
        </Card>
        <SelfEvalPart d={d} />
        <Card className="gap-0 py-0" data-region="details">
          <CardContent className="py-4">
            <DetailsAndNote d={d} />
          </CardContent>
        </Card>
        <Card className="gap-0 py-0" data-region="how">
          <CardContent className="flex flex-col gap-4 py-4">
            <MethodTiles value={d.method} onChange={d.setMethod} offline={d.offline} />
            {d.method === "photo" ? <PhotoField d={d} /> : null}
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-4">
        <Card className="gap-0 py-0 lg:sticky lg:top-4" data-region="send">
          <CardContent className="flex flex-col gap-3 py-4">
            <SectionTitle>This request</SectionTitle>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
              <dt className="text-muted-foreground">{skillNounPlural().replace(/^./, (c) => c.toUpperCase())}</dt>
              <dd className="text-foreground">{d.skills.length ? countSkills(d.skills.length) : "None yet"}</dd>
              <dt className="text-muted-foreground">Where</dt>
              <dd className="truncate text-foreground">{settingWords(d.chosen)}</dd>
              <dt className="text-muted-foreground">To</dt>
              <dd className="truncate text-foreground">{d.who ? d.whoName : "Not chosen"}</dd>
              <dt className="text-muted-foreground">How</dt>
              <dd className="text-foreground">{m.label}</dd>
              <dt className="text-muted-foreground">Counts</dt>
              <dd className="text-foreground">{d.method === "photo" ? "After review" : approval ? "After approval" : "When they answer met"}</dd>
            </dl>
            {/* One paragraph: how the evaluator signs (no account, REQ EV-01), then what they see. Variant B says "no account
                needed" on its "They are not here" choice, so it does not repeat it here. */}
            <p className="text-sm text-muted-foreground" data-scope-sentence>{d.method === "photo" ? scopeSentence(d) : `${NO_ACCOUNT_LINE} ${scopeSentence(d)}`}</p>
            <SavedForLater d={d} />
            <SendBlockedNote d={d} />
            {/* Save for later keeps it in My requests, Drafts; nothing counts until it is sent (LEDGER D-L10). */}
            <div className="flex flex-col gap-2 sm:flex-row-reverse">
              <Button type="submit" variant="default" size="default" className="w-full sm:flex-1 max-sm:h-11" disabled={d.blocked} aria-describedby={d.blocked ? "send-blocked" : undefined}>{d.offline && !m.offline ? "Keep and send later" : "Send"}</Button>
              <Button type="button" variant="outline" size="default" className="w-full sm:flex-1 max-sm:h-11" onClick={() => d.saveForLater()}>Save for later</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  )
}
