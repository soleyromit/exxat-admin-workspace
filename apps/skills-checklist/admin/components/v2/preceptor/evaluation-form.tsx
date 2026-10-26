"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { LoadingBlocks } from "@/components/v2/shared-loading"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { Checkbox } from "@exxatdesignux/ui/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@exxatdesignux/ui/components/ui/collapsible"
import { Field, FieldDescription, FieldError, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { StatusPill } from "@/components/v2/status-pill"
import { Textarea } from "@exxatdesignux/ui/components/ui/textarea"
import { PageFrame } from "@/components/skills/page-header"
import { ChoiceGroup, TOUCH } from "@/components/v2/preceptor/choice-group"
import { useV2Hydrated, useV2State, useV2Store } from "@/lib/v2/react"
import { OUTCOME_WORD } from "@/lib/v2/outcomes"
import {
  attestationText, blankPass, criteriaNote, fieldIds, FEEDBACK_MAX, levelsLabel, outcomeChoices, requestAccess, SCORE_MAX, showsLevels, studentContext, submitEvaluation, validatePass,
  waitingFor, type Access, type FieldIssue, type PassInput, type PassResult, type SkillResponse,
} from "@/lib/v2/preceptor"
import { oldestFirst, sentAgo } from "@/lib/v2/queue-viz"
import { IDS } from "@/lib/v2/seed"
import type { Outcome, Skill, Submission, V2State } from "@/lib/v2/types"

export const BTN = `${TOUCH} py-2`
const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })
const first = (name: string) => name.split(/\s+/)[0] ?? name

/** Walkthrough step 8. The page a preceptor reaches from a QR code, a link or a handed-over phone. No account, no sign-in. */
export function PreceptorEvaluation() {
  const params = useSearchParams()
  const s = useV2State()
  const hydrated = useV2Hydrated()
  const requestId = params.get("request")
  const asId = params.get("as")
  const handover = params.get("handover") === "1"
  const person = s.people.find((p) => p.id === (asId ?? "")) ?? s.people.find((p) => p.id === IDS.delgado)
  // The form unmounts the moment the request completes, so the result of this sitting lives here.
  const [done, setDone] = React.useState<{ requestId: string; result: PassResult } | null>(null)

  if (!hydrated && requestId) return <Frame title="Opening the request"><LoadingBlocks label="Opening the request" /></Frame>
  if (!requestId) return <Frame title="Requests" subtitle="No account needed."><Waiting personId={person?.id ?? IDS.delgado} s={s} asId={asId} /></Frame>

  const access = requestAccess(s, requestId, asId)
  const student = access.submission ? s.people.find((p) => p.id === access.submission?.studentId)?.name ?? "the student" : ""
  return (
    <Frame title={access.kind === "form" ? `Evaluate ${student}` : access.kind === "completed" ? "Evaluation completed" : "This request cannot be completed here"} subtitle={access.kind === "form" ? `Opened as ${access.person?.name}` : undefined}>
      {access.kind === "form" && access.submission && access.person ? <FormBody key={`${access.submission.id}-${access.person.id}`} s={s} x={access.submission} evaluatorId={access.person.id} handover={handover} onSubmitted={(result) => setDone({ requestId: access.submission?.id ?? "", result })} /> : null}
      {access.kind === "completed" && access.submission ? <Receipt s={s} x={access.submission} result={done && done.requestId === access.submission.id ? done.result : null} handover={handover} /> : null}
      {access.kind !== "form" && access.kind !== "completed" ? <Blocked access={access} /> : null}
    </Frame>
  )
}

function Frame({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <PageFrame title={title} subtitle={subtitle} width="reading">
      <div className="flex w-full flex-col gap-4" data-preceptor-page>
        {children}
      </div>
    </PageFrame>
  )
}

function Waiting({ s, personId, asId }: { s: V2State; personId: string; asId: string | null }) {
  const list = oldestFirst(waitingFor(s, personId))
  const name = s.people.find((p) => p.id === personId)?.name
  return (
    <>
      {list.length === 0 ? (
        <Card size="sm">
          <CardContent className="text-sm">
            <p className="font-medium text-foreground">{`Nothing waiting for ${name ?? "you"}`}</p>
            <p className="text-muted-foreground">Requests appear when a student names you.</p>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3" aria-label="Requests waiting">
          {list.map((x) => (
            <li key={x.id}>
              <Card size="sm" role="article" aria-labelledby={`wait-${x.id}`} data-waiting={x.id}>
                <CardHeader>
                  <CardTitle asChild className="text-base">
                    <h2 id={`wait-${x.id}`}>{`${s.people.find((p) => p.id === x.studentId)?.name ?? "A student"}, ${x.skillIds.length} ${x.skillIds.length === 1 ? "skill" : "skills"}`}</h2>
                  </CardTitle>
                  <CardDescription>{`${x.skillIds.map((id) => s.skills.find((k) => k.id === id)?.name).join(", ")}. ${sentAgo(x.createdAt)}`}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="default" size="lg" className={BTN}>
                    <Link href={`/v2/preceptor/preceptor-evaluation?request=${x.id}${asId ? `&as=${asId}` : ""}`}>{`Start the evaluation of ${first(s.people.find((p) => p.id === x.studentId)?.name ?? "the student")}`}</Link>
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

function Blocked({ access }: { access: Access }) {
  return (
    <LocalBanner variant={access.kind === "unqualified" || access.kind === "not-on-request" ? "warning" : "info"} title={access.message} data-access={access.kind}>
      {access.reasons.length > 0 ? (
        <ul className="mt-1 flex flex-col gap-1">
          {access.reasons.map((r) => (
            <li key={r.skillName}>{`${r.skillName}: ${r.reason}`}</li>
          ))}
        </ul>
      ) : null}
      <p className="mt-1">{access.fix}</p>
    </LocalBanner>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// The form

function FormBody({ s, x, evaluatorId, handover, onSubmitted }: { s: V2State; x: Submission; evaluatorId: string; handover: boolean; onSubmitted: (r: PassResult) => void }) {
  const store = useV2Store()
  const [input, setInput] = React.useState<PassInput>(() => blankPass(s, x.id, evaluatorId))
  const [issues, setIssues] = React.useState<FieldIssue[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [result, setResult] = React.useState<PassResult | null>(null)
  const summaryRef = React.useRef<HTMLDivElement>(null)
  const skills = x.skillIds.map((id) => s.skills.find((k) => k.id === id)).filter((k): k is Skill => !!k)
  const student = s.people.find((p) => p.id === x.studentId)?.name ?? "the student"
  const issueFor = (field: string) => issues.find((i) => i.field === field)?.message
  const issuesFor = (fields: string[]) => issues.filter((i) => fields.includes(i.field))

  const patchResp = (skillId: string, p: Partial<SkillResponse>) => {
    setIssues((cur) => cur.filter((i) => !(i.field.includes(skillId))))
    setInput((cur) => ({ ...cur, responses: cur.responses.map((r) => (r.skillId === skillId ? { ...r, ...p } : r)) }))
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    setError(null)
    const found = validatePass(s, input)
    setIssues(found)
    if (found.length > 0) {
      setError(`Fix ${found.length} ${found.length === 1 ? "problem" : "problems"} before you submit.`)
      requestAnimationFrame(() => summaryRef.current?.focus())
      return
    }
    setBusy(true)
    const r = submitEvaluation(store.getSnapshot(), input, new Date().toISOString())
    if (!r.ok) {
      setBusy(false)
      setError(r.error)
      requestAnimationFrame(() => summaryRef.current?.focus())
      return
    }
    store.update(() => r.state)
    onSubmitted(r)
    setResult(r)
    setBusy(false)
  }

  if (result) {
    const done = store.getSnapshot().submissions.find((y) => y.id === x.id) ?? x
    return <Receipt s={store.getSnapshot()} x={done} result={result} handover={handover} />
  }

  const goTo = (field: string) => {
    const el = document.getElementById(field)
    el?.scrollIntoView({ block: "center" })
    el?.focus()
  }
  const hold = skills.some((k) => k.config?.approvalRequired)
  const allHold = skills.every((k) => k.config?.approvalRequired)

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4" aria-label={`Evaluation of ${student}`} data-eval-form>
      {error ? (
        <div ref={summaryRef} tabIndex={-1} role="alert" className="outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg" data-error-summary>
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
            ) : (
              <p className="mt-1">Check the details and try again. Nothing was saved.</p>
            )}
          </LocalBanner>
        </div>
      ) : null}

      {skills.map((k) => {
        const r = input.responses.find((y) => y.skillId === k.id) as SkillResponse
        return <SkillCard key={k.id} s={s} x={x} skill={k} r={r} patch={(p) => patchResp(k.id, p)} issueFor={issueFor} issuesFor={issuesFor} />
      })}

      <Card>
        <CardHeader>
          <CardTitle asChild className="text-base">
            <h2>For the whole pass</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className={`${TOUCH} flex items-start gap-3 rounded-lg border border-border bg-card p-3`}>
              <Checkbox id="concern-flag" checked={input.concern.raised} className="mt-0.5" aria-describedby="concern-help" onCheckedChange={(v) => { setIssues((c) => c.filter((i) => i.field !== fieldIds.concern)); setInput({ ...input, concern: { ...input.concern, raised: v === true } }) }} />
              <Label htmlFor="concern-flag" className="flex flex-1 flex-col items-start gap-0.5 text-start font-normal">
                <span className="text-sm font-medium text-foreground">Flag a confidential concern</span>
                <span id="concern-help" className="text-xs text-muted-foreground">Staff only. The student never sees it.</span>
              </Label>
            </div>
            {input.concern.raised ? (
              <Field>
                <FieldLabel htmlFor={fieldIds.concern}>Describe the concern</FieldLabel>
                <Textarea id={fieldIds.concern} rows={3} value={input.concern.note} aria-invalid={issueFor(fieldIds.concern) ? true : undefined} aria-describedby={issueFor(fieldIds.concern) ? "concern-note-error" : undefined} onChange={(e) => { setIssues((c) => c.filter((i) => i.field !== fieldIds.concern)); setInput({ ...input, concern: { ...input.concern, note: e.target.value } }) }} />
                {issueFor(fieldIds.concern) ? <FieldError id="concern-note-error" errors={[{ message: issueFor(fieldIds.concern) }]} /> : null}
              </Field>
            ) : null}
          </div>

          <div className="flex flex-col gap-1">
            <div className={`${TOUCH} flex items-start gap-3 rounded-lg border border-border bg-card p-3`}>
              <Checkbox id={fieldIds.attest} checked={input.attested} className="mt-0.5" aria-invalid={issueFor(fieldIds.attest) ? true : undefined} aria-describedby={issueFor(fieldIds.attest) ? "attest-error" : undefined} onCheckedChange={(v) => { setIssues((c) => c.filter((i) => i.field !== fieldIds.attest)); setInput({ ...input, attested: v === true }) }} />
              <Label htmlFor={fieldIds.attest} className="flex-1 text-start text-sm font-normal text-foreground">
                {attestationText(skills)}
              </Label>
            </div>
            {issueFor(fieldIds.attest) ? <FieldError id="attest-error" errors={[{ message: issueFor(fieldIds.attest) }]} /> : null}
          </div>

          <p className="text-sm text-muted-foreground" data-counts-note>
            {allHold ? `Program staff approve this before it counts toward ${first(student)}'s record.` : hold ? `Some of this waits for program staff to approve it. The rest counts toward ${first(student)}'s record as soon as you submit.` : `This counts toward ${first(student)}'s record as soon as you submit.`}
          </p>
          <div>
            <Button type="submit" variant="default" size="lg" className={BTN} disabled={busy} data-submit-eval>
              {busy ? "Submitting" : `Submit evaluation of ${skills.length} ${skills.length === 1 ? "skill" : "skills"}`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}

export function SkillCard({ s, x, skill, r, patch, issueFor, issuesFor }: { s: V2State; x: Submission; skill: Skill; r: SkillResponse; patch: (p: Partial<SkillResponse>) => void; issueFor: (f: string) => string | undefined; issuesFor: (f: string[]) => FieldIssue[] }) {
  const c = skill.config
  const entry = studentContext(s, x, skill.id)
  const [open, setOpen] = React.useState(false)
  if (!c) return null
  const levels = c.levels
  const choices = outcomeChoices(skill)
  const outId = fieldIds.outcome(skill.id)
  const fbId = fieldIds.feedback(skill.id)
  const noteFor = criteriaNote(skill, r)
  const fb = r.feedback.trim()
  const required = c.feedbackRequired || r.outcome === "not-yet"
  return (
    <Card role="group" aria-labelledby={`card-${skill.id}`} data-skill-form={skill.id}>
      <CardHeader>
        <CardTitle asChild className="text-base">
          <h2 id={`card-${skill.id}`}>{skill.name}</h2>
        </CardTitle>
        <CardDescription>{evaluatorLine(skill)}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <Button type="button" variant="outline" size="lg" className={`${BTN} w-full justify-between`} aria-expanded={open}>
              {`What ${first(s.people.find((p) => p.id === x.studentId)?.name ?? "the student")} supplied for ${skill.name}`}
              <i className={`fa-light fa-chevron-${open ? "up" : "down"}`} aria-hidden="true" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            {entry ? (
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-lg bg-muted px-3 py-2 text-sm" data-student-context>
                <dt className="text-muted-foreground">Logged</dt>
                <dd>{fmt(entry.at)}</dd>
                <dt className="text-muted-foreground">Where</dt>
                <dd>{[entry.clinicalSetting, entry.location].filter(Boolean).join(", ") || "Not recorded"}</dd>
                <dt className="text-muted-foreground">Self-rating</dt>
                <dd>{entry.answers ? `${entry.answers.filter((a) => a === "yes").length} of ${entry.answers.length} answered yes` : entry.rating ?? "Not asked for this skill"}</dd>
                <dt className="text-muted-foreground">Note</dt>
                <dd>{entry.note || "No note"}</dd>
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">The student supplied no details for this skill.</p>
            )}
          </CollapsibleContent>
        </Collapsible>

        {skill.model === "question" ? (
          <div className="flex flex-col gap-3">
            {c.questions.map((q, i) => {
              const id = fieldIds.question(skill.id, i)
              return (
                <fieldset key={i} className="flex flex-col gap-1">
                  <legend className="text-sm text-foreground">{q}</legend>
                  <ChoiceGroup name={`${q} for ${skill.name}`} idBase={`${id}`} firstId={id} columns={2} invalid={!!issueFor(id)} describedBy={issueFor(id) ? `${id}-error` : undefined} options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} value={r.answers[i] ?? ""} onChange={(v) => { const a = [...r.answers]; a[i] = v as "yes" | "no"; patch({ answers: a }) }} />
                  {issueFor(id) ? <FieldError id={`${id}-error`} errors={[{ message: issueFor(id) }]} /> : null}
                </fieldset>
              )
            })}
          </div>
        ) : null}

        {skill.model === "scored" ? (
          <div className="flex flex-col gap-3">
            {c.questions.map((q, i) => {
              const id = fieldIds.question(skill.id, i)
              return (
                <fieldset key={i} className="flex flex-col gap-1">
                  <legend className="text-sm text-foreground">{q}</legend>
                  <ChoiceGroup name={`Score for ${q} in ${skill.name}`} idBase={id} firstId={id} columns={3} invalid={!!issueFor(id)} describedBy={issueFor(id) ? `${id}-error` : undefined} options={Array.from({ length: SCORE_MAX }, (_, n) => ({ value: String(n + 1), label: String(n + 1) }))} value={r.scores[i] != null ? String(r.scores[i]) : ""} onChange={(v) => { const a = [...r.scores]; a[i] = Number(v); patch({ scores: a }) }} />
                  {issueFor(id) ? <FieldError id={`${id}-error`} errors={[{ message: issueFor(id) }]} /> : null}
                </fieldset>
              )
            })}
          </div>
        ) : null}

        {showsLevels(skill) ? (
          <fieldset className="flex flex-col gap-1">
            <legend className="text-sm font-medium text-foreground">{levelsLabel(skill)}</legend>
            <ChoiceGroup name={`${levelsLabel(skill)} for ${skill.name}`} idBase={`lvl-${skill.id}`} firstId={fieldIds.level(skill.id)} invalid={!!issueFor(fieldIds.level(skill.id))} describedBy={issueFor(fieldIds.level(skill.id)) ? `${fieldIds.level(skill.id)}-error` : undefined} options={levels.map((l, i) => ({ value: String(i), label: l }))} value={r.levelIndex === null ? "" : String(r.levelIndex)} onChange={(v) => patch({ levelIndex: Number(v) })} />
            {issueFor(fieldIds.level(skill.id)) ? <FieldError id={`${fieldIds.level(skill.id)}-error`} errors={[{ message: issueFor(fieldIds.level(skill.id)) }]} /> : null}
          </fieldset>
        ) : null}

        <fieldset className="flex flex-col gap-1">
          <legend className="text-sm font-medium text-foreground">{`Outcome for ${skill.name}`}</legend>
          <ChoiceGroup name={`Outcome for ${skill.name}`} idBase={`out-${skill.id}`} firstId={outId} invalid={!!issueFor(outId)} describedBy={issueFor(outId) ? `${outId}-error` : undefined} options={choices.map((o) => ({ value: o.value, label: o.label }))} value={r.outcome ?? ""} onChange={(v) => patch({ outcome: v as Outcome })} />
          {r.outcome === "not-yet" ? <p className="text-xs text-muted-foreground">Feedback only. No pass or fail is recorded.</p> : null}
          {noteFor ? <p className="text-xs text-foreground" role="status" data-criteria-note>{noteFor}</p> : null}
          {issueFor(outId) ? <FieldError id={`${outId}-error`} errors={[{ message: issueFor(outId) }]} /> : null}
        </fieldset>

        <Field>
          <FieldLabel htmlFor={fbId}>{required ? `Feedback for ${skill.name} (required)` : `Feedback for ${skill.name} (optional)`}</FieldLabel>
          <Textarea id={fbId} rows={4} value={r.feedback} aria-invalid={issuesFor([fbId]).length > 0 ? true : undefined} aria-describedby={`${fbId}-count${issueFor(fbId) ? ` ${fbId}-error` : ""}`} onChange={(e) => patch({ feedback: e.target.value })} />
          <FieldDescription id={`${fbId}-count`}>{`${fb.length} of ${FEEDBACK_MAX} characters. ${c.feedbackRequired ? "The program requires feedback on every evaluation." : "The student reads this."}`}</FieldDescription>
          {issueFor(fbId) ? <FieldError id={`${fbId}-error`} errors={[{ message: issueFor(fbId) }]} /> : null}
        </Field>
      </CardContent>
    </Card>
  )
}

function evaluatorLine(skill: Skill): string {
  const c = skill.config
  if (!c) return ""
  const parts: string[] = []
  if (skill.model === "binary") parts.push(`One outcome: ${c.outcomeLabels[0]} or ${c.outcomeLabels[1]}.`)
  if (skill.model === "question") parts.push(`A Yes or No for each of ${c.questions.length} questions.`)
  if (skill.model === "scored") parts.push(`A score for each of ${c.questions.length} questions.`)
  if (skill.model === "demonstration") parts.push("The level of supervision you observed.")
  if (c.overallRating && skill.model !== "demonstration") parts.push("One overall supervision rating.")
  return parts.join(" ")
}

// ---------------------------------------------------------------------------------------------------------------------
// Receipt

function Receipt({ s, x, result, handover }: { s: V2State; x: Submission; result: PassResult | null; handover: boolean }) {
  const evals = s.evaluations.filter((e) => e.submissionId === x.id)
  const student = s.people.find((p) => p.id === x.studentId)?.name ?? "the student"
  const by = x.completedById ? s.people.find((p) => p.id === x.completedById)?.name ?? "an evaluator" : "an evaluator"
  const concern = result?.concernId ? true : s.concerns.some((c) => c.submissionId === x.id)
  return (
    <div className="flex flex-col gap-4" data-receipt>
      <LocalBanner variant="success" title={result ? `Submitted. ${first(student)}'s evaluation is recorded.` : `Completed by ${by}${x.completedAt ? ` on ${fmt(x.completedAt)}` : ""}.`}>
        It cannot be changed from this page.
      </LocalBanner>
      {evals.length === 0 ? <p className="text-sm text-muted-foreground">No outcome details are held for this request.</p> : null}
      <ul className="flex flex-col gap-3" aria-label="What was recorded">
        {evals.map((e) => {
          const k = s.skills.find((y) => y.id === e.skillId)
          return (
            <li key={e.id}>
              <Card size="sm" role="article" aria-labelledby={`rc-${e.id}`} data-receipt-item={e.skillId}>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle asChild className="text-base">
                      <h2 id={`rc-${e.id}`}>{k?.name ?? "A skill"}</h2>
                    </CardTitle>
                    <StatusPill kind="outcome" value={e.outcome} label={e.outcome === "not-met" ? "Did not meet the criteria" : OUTCOME_WORD[e.outcome]} />
                  </div>
                  <CardDescription>
                    {e.status === "awaiting-approval" ? "Held for program staff to approve. It does not count yet." : e.outcome === "not-yet" ? "Feedback only. Nothing was recorded as passed or failed." : e.outcome === "met" ? `Counts toward ${first(student)}'s record now.` : "Recorded. It does not count toward the rule."}
                  </CardDescription>
                </CardHeader>
              </Card>
            </li>
          )
        })}
      </ul>
      {concern ? <LocalBanner variant="info" title="Your concern went to program staff">{`It is confidential. ${first(student)} cannot see it.`}</LocalBanner> : null}
      {result && result.planIds.length > 0 ? <p className="text-sm text-muted-foreground">{`Program staff will follow up with ${first(student)} on the skill that did not meet the criteria.`}</p> : null}
      {handover ? (
        <Button asChild variant="default" size="lg" className={BTN}>
          <Link href="/v2/student/request-signoff">{`Give the phone back to ${first(student)}`}</Link>
        </Button>
      ) : null}
    </div>
  )
}
