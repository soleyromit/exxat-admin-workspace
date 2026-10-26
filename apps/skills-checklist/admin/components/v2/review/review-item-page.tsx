"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@exxatdesignux/ui/components/ui/collapsible"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { RadioGroup, RadioGroupItem } from "@exxatdesignux/ui/components/ui/radio-group"
import { StatusPill } from "@/components/v2/status-pill"
import { Textarea } from "@exxatdesignux/ui/components/ui/textarea"
import { PageFrame, PageSection } from "@/components/skills/page-header"
import { contextLine } from "@/lib/v2/page-context"
import { useStaff } from "@/components/v2/outcomes/staff"
import { fmtDay } from "@/components/v2/outcomes/version-timeline"
import { ChoiceGroup } from "@/components/v2/preceptor/choice-group"
import { BTN, SkillCard } from "@/components/v2/preceptor/evaluation-form"
import { OUTCOME_WORD } from "@/lib/v2/outcomes"
import type { SkillResponse } from "@/lib/v2/preceptor"
import {
  approveBlock, approveItems, blankPaper, compareEvaluation, findQueueItem, joinNames, locationOf, PAPER_FIELDS, priorAttempts, recordPaperOutcome, REASON_MAX, returnItem, returnNextStep, returnReasonIssue, ROLE_LABEL, signerChoices,
  type Agreement, type PaperInput, type QueueItem,
} from "@/lib/v2/queue"
import { useV2Hydrated, useV2State } from "@/lib/v2/react"
import { ROLE_BY_ID } from "@/lib/v2/roles"
import type { Evaluation, RoleId, Skill, V2State } from "@/lib/v2/types"
import { LoadingBlocks } from "@/components/v2/shared-loading"

const AGREE: Record<Agreement, { label: string; badge: string }> = {
  agreed: { label: "Agreed", badge: "Self-rating and evaluator agreed" },
  differed: { label: "Differed", badge: "Self-rating and evaluator differed" },
  "not-comparable": { label: "Not comparable", badge: "No self-rating to compare" },
}

type Decision = { kind: "approved" | "returned"; title: string; text: string }

const name = (s: V2State, id: string | null | undefined) => (id ? (s.people.find((p) => p.id === id)?.name ?? "Unknown person") : "Not named yet")

/** One item in the queue: the facts, the photo, the self-rating beside the evaluator's responses, prior attempts, and the decision. */
export function ReviewItemPage({ role, id }: { role: RoleId; id: string }) {
  const s = useV2State()
  const hydrated = useV2Hydrated()
  const [decision, setDecision] = React.useState<Decision | null>(null)
  const item = findQueueItem(s, id)
  const back = `/v2/${role}/review-queue`
  if (!item && decision) return <Decided role={role} decision={decision} back={back} />
  if (!item) {
    if (!hydrated) return <PageFrame title="Opening the item"><LoadingBlocks label="Opening the item" rows={4} /></PageFrame>
    const x = s.submissions.find((y) => y.id === id)
    const e = s.evaluations.find((y) => y.id === id)
    const text = x ? `This request is not waiting for review. It is ${x.status === "done" ? "complete" : x.status === "returned" ? "with the student" : x.status === "with-evaluator" ? "with its evaluator" : x.status === "stalled" ? "stalled with its evaluator" : "not in the queue"}.` : e ? `This evaluation is not waiting for review. It ${e.status === "counted" ? "already counts" : e.status === "returned" ? "was returned to the student" : "is " + e.status}.` : "This item does not exist."
    return (
      <PageFrame title="This item is not in the queue">
        <LocalBanner variant="warning" title={text} data-item-missing>
          Someone may have approved or returned it already.
          <div className="mt-2">
            <Button asChild variant="outline" size="lg" className={BTN}>
              <Link href={back}>Back to the review queue</Link>
            </Button>
          </div>
        </LocalBanner>
      </PageFrame>
    )
  }
  return <ItemBody key={item.key} s={s} item={item} role={role} back={back} onDecided={setDecision} />
}

function Decided({ decision, back, role }: { decision: Decision; back: string; role: RoleId }) {
  return (
    <PageFrame title={decision.title}>
      <div className="flex max-w-2xl flex-col gap-4" data-decided={decision.kind}>
        <div role="status" aria-live="polite">
          <LocalBanner variant="success" title={decision.title}>{decision.text}</LocalBanner>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="default" size="lg" className={BTN}>
            <Link href={back}>Back to the review queue</Link>
          </Button>
          {role !== "reviewer" ? null : (
            <Button asChild variant="outline" size="lg" className={BTN}>
              <Link href="/v2/reviewer/outcome-remediation">Open outcomes and remediation</Link>
            </Button>
          )}
        </div>
      </div>
    </PageFrame>
  )
}

function ItemBody({ s, item, role, back, onDecided }: { s: V2State; item: QueueItem; role: RoleId; back: string; onDecided: (d: Decision) => void }) {
  const { run } = useStaff(role)
  const [note, setNote] = React.useState("")
  const [msg, setMsg] = React.useState<string | null>(null)
  const [notice, setNotice] = React.useState<string | null>(null)
  const [returning, setReturning] = React.useState(false)
  const student = name(s, item.studentId)
  const block = approveBlock(s, item)
  const evaluator = s.people.find((p) => p.id === item.evaluatorId)
  const x = item.submission
  const paper = item.source === "paper-form"
  const returns = x?.returns ?? []
  const entered = item.evaluations[0]?.enteredById

  const approve = () => {
    const r = run((st, a, at) => approveItems(st, [item.key], a, at, note))
    if (!r.ok) {
      setMsg(r.error)
      return
    }
    const n = r.evaluations
    onDecided({ kind: "approved", title: "Approved", text: `${n} ${n === 1 ? "evaluation now counts" : "evaluations now count"} toward ${student}'s record${r.plansOpened ? ", and a remediation plan was opened" : ""}.` })
  }

  return (
    <PageFrame title={`${student}, ${joinNames(item.skillIds.map((id) => s.skills.find((k) => k.id === id)?.name ?? "A skill"))}`} subtitle={contextLine(s)} width="wide">
      <div className="flex flex-col gap-6" data-review-item={item.key}>
        <div role="status" aria-live="polite">
          {msg ? (
            <LocalBanner variant="error" title="Not saved" retry={{ label: "Approve again", onClick: approve }} data-item-message>
              {msg}
            </LocalBanner>
          ) : null}
          {notice ? (
            <LocalBanner variant="success" title="Outcome recorded" data-item-notice>
              {notice}
            </LocalBanner>
          ) : null}
        </div>

        <Card size="sm">
          <CardContent>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-0.5 text-sm sm:grid-cols-[auto_1fr] [&>dd]:mb-2 sm:[&>dd]:mb-0" aria-label="Item facts" data-item-facts>
              <dt className="text-muted-foreground">Student</dt>
              <dd>{student}</dd>
              <dt className="text-muted-foreground">Course</dt>
              <dd>{`${s.course.code}, ${s.course.name}`}</dd>
              {item.skillIds.map((id) => {
                const e = item.evaluations.find((y) => y.skillId === id)
                return (
                  <React.Fragment key={id}>
                    <dt className="text-muted-foreground">{item.skillIds.length > 1 ? s.skills.find((k) => k.id === id)?.name : "Skill"}</dt>
                    <dd>
                      {[item.skillIds.length > 1 ? null : s.skills.find((k) => k.id === id)?.name, e ? (e.setting === "clinical" ? `Clinical, ${e.clinicalSetting ?? "setting not recorded"}` : e.setting === "lab" ? "Lab" : "Simulation") : "Clinical", locationOf(s, item.studentId, id, x, e?.clinicalSetting) ?? "location not recorded"].filter(Boolean).join(", ")}
                    </dd>
                  </React.Fragment>
                )
              })}
              <dt className="text-muted-foreground">Evaluator</dt>
              <dd>{evaluator ? `${evaluator.name}, ${ROLE_LABEL[evaluator.kind].toLowerCase()}` : "Nobody is named yet. Choose who signed the form."}</dd>
              <dt className="text-muted-foreground">Source</dt>
              <dd data-source={item.source}>{paper ? `Paper form${entered ? `, entered by ${name(s, entered)} for ${name(s, item.evaluations[0]?.evaluatorId)}` : ", outcome not entered yet"}` : "Evaluator form, submitted by the evaluator"}</dd>
              <dt className="text-muted-foreground">Waiting since</dt>
              <dd>{fmtDay(item.since)}</dd>
              {item.revision > 0 ? (
                <>
                  <dt className="text-muted-foreground">Revision</dt>
                  <dd data-revision>{`Sent again ${item.revision} ${item.revision === 1 ? "time" : "times"}`}</dd>
                </>
              ) : null}
            </dl>
          </CardContent>
        </Card>

        {returns.length > 0 ? (
          <LocalBanner variant="info" title={`Returned ${returns.length} ${returns.length === 1 ? "time" : "times"} before`} data-return-history>
            <ol className="mt-1 flex flex-col gap-1">
              {returns.map((r) => (
                <li key={r.at}>{`${fmtDay(r.at)}, ${name(s, r.byId)}: ${r.reason}`}</li>
              ))}
            </ol>
          </LocalBanner>
        ) : null}

        {x?.studentNote ? (
          <Card size="sm">
            <CardContent className="text-sm">
              <p className="font-medium text-foreground">Note from the student with this version</p>
              <p className="text-foreground" data-student-note>{x.studentNote}</p>
            </CardContent>
          </Card>
        ) : null}

        {paper && x ? <PhotoPlaceholder file={x.photo} /> : null}

        {item.state === "needs-outcome" && paper ? (
          <PaperForm s={s} item={item} role={role} onRecorded={() => { setMsg(null); setNotice("Outcome recorded. Approve or return it below.") }} />
        ) : null}

        {item.evaluations.map((e) => (
          <CompareBlock key={e.id} s={s} e={e} />
        ))}

        <PageSection title="Your decision" id="decision">
          <Card>
            <CardContent className="flex flex-col gap-4">
              {item.state === "ready" ? (
                <Field>
                  <FieldLabel htmlFor="review-note">Note for the record (optional)</FieldLabel>
                  <Textarea id="review-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
                  <FieldDescription>Staff only. The student does not see it.</FieldDescription>
                </Field>
              ) : null}
              {block ? <p className="text-sm text-foreground" data-approve-block>{block}</p> : null}
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="default" size="lg" className={BTN} disabled={!!block} onClick={approve} data-approve>
                  {item.evaluations.length > 1 ? `Approve ${item.evaluations.length} evaluations and count them` : "Approve and count"}
                </Button>
                <Button type="button" variant="outline" size="lg" className={BTN} onClick={() => { setMsg(null); setReturning(true) }} data-return>
                  Return to student
                </Button>
                <Button asChild variant="outline" size="lg" className={BTN}>
                  <Link href={back}>Back to the review queue</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </PageSection>
      </div>
      <ReturnDialog
        open={returning}
        s={s}
        item={item}
        onClose={() => setReturning(false)}
        onReturn={(reason) => {
          const r = run((st, a, at) => returnItem(st, item.key, { reason }, a, at))
          if (!r.ok) return r.error
          setReturning(false)
          onDecided({ kind: "returned", title: "Returned to the student", text: `${student} sees your reason. It does not count until they send it again.` })
          return null
        }}
      />
    </PageFrame>
  )
}

function PhotoPlaceholder({ file }: { file?: { name: string; sizeKb: number } }) {
  return (
    <Card size="sm" data-photo-placeholder>
      <CardHeader>
        <CardTitle asChild className="text-base">
          <h2>Photo of the signed paper form</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div role="img" aria-label={file ? `Placeholder for the photo ${file.name}, ${file.sizeKb} kilobytes` : "Placeholder for the photo"} className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border-control-35 bg-muted p-4 text-center">
          <i className="fa-light fa-file-image text-3xl text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground">{file ? file.name : "Photo of the form"}</p>
          <p className="text-xs text-muted-foreground">{file ? `${file.sizeKb} KB` : "No file details."}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function CompareBlock({ s, e }: { s: V2State; e: Evaluation }) {
  const c = compareEvaluation(s, e)
  const prior = priorAttempts(s, e)
  const [open, setOpen] = React.useState(false)
  const a = AGREE[c.overall]
  return (
    <section aria-labelledby={`cmp-${e.id}`} className="flex flex-col gap-3" data-compare={e.id}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={`cmp-${e.id}`} className="text-base font-semibold text-foreground">{c.skillName}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill kind="outcome" value={e.outcome} label={`Outcome: ${e.outcome === "not-met" ? "Did not meet the criteria" : OUTCOME_WORD[e.outcome]}`} />
          <StatusPill kind="agreement" value={c.overall} label={a.badge} />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card size="sm" data-side="student">
          <CardHeader>
            <CardTitle asChild className="text-base"><h3>The student</h3></CardTitle>
            <CardDescription>{c.selfRated ? `Self-rated on ${fmtDay(c.selfAt as string)}` : "No self-rating on record for this skill"}</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="flex flex-col gap-3 text-sm">
              {c.rows.map((r) => (
                <div key={r.label} className="flex flex-col gap-0.5">
                  <dt className="text-muted-foreground">{r.label}</dt>
                  <dd className="text-foreground">{r.student}</dd>
                </div>
              ))}
              {c.selfNote ? (
                <div className="flex flex-col gap-0.5">
                  <dt className="text-muted-foreground">Note</dt>
                  <dd className="text-foreground">{c.selfNote}</dd>
                </div>
              ) : null}
            </dl>
          </CardContent>
        </Card>
        <Card size="sm" data-side="evaluator">
          <CardHeader>
            <CardTitle asChild className="text-base"><h3>The evaluator</h3></CardTitle>
            <CardDescription>{c.recorded ? "Every response, as recorded" : "Only the outcome was stored for this evaluation"}</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="flex flex-col gap-3 text-sm">
              {c.rows.map((r) => (
                <div key={r.label} className="flex flex-col gap-0.5">
                  <dt className="text-muted-foreground">{r.label}</dt>
                  <dd className="flex flex-wrap items-center gap-2 text-foreground">
                    {r.evaluator}
                    <span className="text-xs text-muted-foreground">{AGREE[r.agreement].label}</span>
                  </dd>
                </div>
              ))}
              {c.responses.filter((r) => !c.rows.some((x) => x.label === r.label)).map((r) => (
                <div key={r.label} className="flex flex-col gap-0.5">
                  <dt className="text-muted-foreground">{r.label}</dt>
                  <dd className="text-foreground">{r.value}</dd>
                </div>
              ))}
              <div className="flex flex-col gap-0.5">
                <dt className="text-muted-foreground">Feedback</dt>
                <dd className="text-foreground">{c.recorded ? c.feedback || "No feedback written" : "Not stored for this record"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <Button type="button" variant="outline" size="lg" className={`${BTN} w-full justify-between`} aria-expanded={open}>
            {`Earlier attempts at ${c.skillName} (${prior.length})`}
            <i className={`fa-light fa-chevron-${open ? "up" : "down"}`} aria-hidden="true" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          {prior.length === 0 ? (
            <p className="text-sm text-muted-foreground" data-prior-empty>This is the first attempt the student has made at this skill.</p>
          ) : (
            <ol className="flex flex-col gap-2" aria-label={`Earlier attempts at ${c.skillName}`} data-prior-attempts>
              {prior.map((p) => (
                <li key={p.key} className="rounded-lg border border-border bg-card p-3 text-sm">
                  <p className="font-medium text-foreground">{`Attempt ${p.attempt}, ${fmtDay(p.date)}: ${p.outcome}`}</p>
                  <p className="text-muted-foreground">{`${p.setting}. ${p.who ? `With ${p.who}. ` : ""}${p.counted}`}</p>
                  {p.returnReason ? <p className="text-foreground">{`Returned because: ${p.returnReason}`}</p> : null}
                </li>
              ))}
            </ol>
          )}
        </CollapsibleContent>
      </Collapsible>
    </section>
  )
}

function ReturnDialog({ open, s, item, onClose, onReturn }: { open: boolean; s: V2State; item: QueueItem; onClose: () => void; onReturn: (reason: string) => string | null }) {
  const [reason, setReason] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  React.useEffect(() => {
    if (open) {
      setReason("")
      setError(null)
    }
  }, [open])
  const student = name(s, item.studentId)
  const next = returnNextStep(s, item.submission, item.evaluatorId)
  const len = reason.trim().length
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-lg" data-return-dialog>
        <DialogHeader>
          <DialogTitle>Return to the student?</DialogTitle>
          <DialogDescription>{`Does not count until ${student.split(" ")[0]} sends it again. They see your reason.`}</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" noValidate onSubmit={(e) => { e.preventDefault(); const issue = returnReasonIssue(reason); if (issue) { setError(issue); return } setError(onReturn(reason)) }}>
          <Field>
            <FieldLabel htmlFor="return-reason">What is wrong, and what should the student change?</FieldLabel>
            <Textarea id="return-reason" rows={4} value={reason} aria-invalid={error ? true : undefined} aria-describedby={`return-help${error ? " return-error" : ""}`} onChange={(e) => { setReason(e.target.value); setError(null) }} />
            <FieldDescription id="return-help">{`${len} of ${REASON_MAX} characters. Then: ${next}`}</FieldDescription>
            {error ? <FieldError id="return-error" errors={[{ message: error }]} /> : null}
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" size="lg" onClick={onClose}>
              Keep in review
            </Button>
            <Button type="submit" variant="default" size="lg" data-return-confirm>
              Return to student
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function PaperForm({ s, item, role, onRecorded }: { s: V2State; item: QueueItem; role: RoleId; onRecorded: () => void }) {
  const { run } = useStaff(role)
  const [input, setInput] = React.useState<PaperInput>(() => blankPaper(s, item))
  const [issues, setIssues] = React.useState<Array<{ field: string; message: string }>>([])
  const [error, setError] = React.useState<string | null>(null)
  const summaryRef = React.useRef<HTMLDivElement>(null)
  const skills = item.skillIds.map((id) => s.skills.find((k) => k.id === id)).filter((k): k is Skill => !!k)
  const choices = signerChoices(s, item, ROLE_BY_ID[role].personId)
  const issueFor = (f: string) => issues.find((i) => i.field === f)?.message
  const issuesFor = (fs: string[]) => issues.filter((i) => fs.includes(i.field))
  const patch = (skillId: string, p: Partial<SkillResponse>) => {
    setIssues((cur) => cur.filter((i) => !i.field.includes(skillId)))
    setInput((cur) => ({ ...cur, responses: cur.responses.map((r) => (r.skillId === skillId ? { ...r, ...p } : r)) }))
  }
  const goTo = (field: string) => {
    const el = document.getElementById(field)
    el?.scrollIntoView({ block: "center" })
    el?.focus()
  }
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const r = run((st, a, at) => recordPaperOutcome(st, item.key, input, a, at))
    if (!r.ok) {
      setError(r.error)
      setIssues((r.issues ?? []).map((i) => ({ field: i.field, message: i.message })))
      requestAnimationFrame(() => summaryRef.current?.focus())
      return
    }
    onRecorded()
  }
  if (!item.submission) return null
  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4" aria-label="Outcome from the paper form" data-paper-form>
      <LocalBanner variant="info" title="Enter what the signed form says">
        The record shows it as a paper form, entered by you.
      </LocalBanner>
      {error ? (
        <div ref={summaryRef} tabIndex={-1} role="alert" className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring" data-error-summary>
          <LocalBanner variant="error" title={error}>
            {issues.length > 0 ? (
              <ul className="mt-1 flex flex-col gap-1" aria-label="Problems to fix">
                {issues.map((i, n) => (
                  <li key={`${i.field}-${n}`}>
                    <Button type="button" variant="link" size="sm" className="h-auto whitespace-normal p-0 text-start" onClick={() => goTo(i.field)}>
                      {i.message}
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}
          </LocalBanner>
        </div>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle asChild className="text-base"><h2>Who signed, and where</h2></CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium text-foreground">Who signed the paper form</legend>
            <RadioGroup aria-label="Who signed the paper form" aria-invalid={issueFor(PAPER_FIELDS.signer) ? true : undefined} aria-describedby={issueFor(PAPER_FIELDS.signer) ? "signer-err" : undefined} value={input.signerId} onValueChange={(v) => { setIssues((c) => c.filter((i) => i.field !== PAPER_FIELDS.signer)); setInput({ ...input, signerId: v }) }} className="flex flex-col gap-2">
              {choices.map((c, n) => {
                const id = n === 0 ? PAPER_FIELDS.signer : `signer-${c.person.id}`
                return (
                  <Label key={c.person.id} htmlFor={id} className="flex min-h-(--control-height-touch) items-start gap-3 rounded-lg border border-border bg-card p-3 font-normal aria-disabled:opacity-70" aria-disabled={!c.eligible}>
                    <RadioGroupItem id={id} value={c.person.id} disabled={!c.eligible} className="mt-0.5" />
                    <span className="flex flex-1 flex-col gap-0.5">
                      <span className="text-sm text-foreground">{c.person.name}</span>
                      <span className="text-xs text-muted-foreground">{c.eligible ? c.person.title : `Not qualified. ${c.reasons[0]}`}</span>
                    </span>
                  </Label>
                )
              })}
            </RadioGroup>
            {issueFor(PAPER_FIELDS.signer) ? <FieldError id="signer-err" errors={[{ message: issueFor(PAPER_FIELDS.signer) }]} /> : null}
          </fieldset>
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium text-foreground">Clinical setting on the form</legend>
            <ChoiceGroup name="Clinical setting on the form" idBase="paper-set" firstId={PAPER_FIELDS.setting} columns={2} invalid={!!issueFor(PAPER_FIELDS.setting)} options={s.course.clinicalSettings.map((c) => ({ value: c, label: c }))} value={input.clinicalSetting} onChange={(v) => { setIssues((c) => c.filter((i) => i.field !== PAPER_FIELDS.setting)); setInput({ ...input, clinicalSetting: v }) }} />
            {issueFor(PAPER_FIELDS.setting) ? <FieldError errors={[{ message: issueFor(PAPER_FIELDS.setting) }]} /> : null}
          </fieldset>
        </CardContent>
      </Card>
      {skills.map((k) => {
        const r = input.responses.find((y) => y.skillId === k.id) as SkillResponse
        return <SkillCard key={k.id} s={s} x={item.submission as NonNullable<QueueItem["submission"]>} skill={k} r={r} patch={(p) => patch(k.id, p)} issueFor={issueFor} issuesFor={issuesFor as never} />
      })}
      <div>
        <Button type="submit" variant="default" size="lg" className={BTN} data-record-paper>
          Record outcome from the paper form
        </Button>
      </div>
    </form>
  )
}
