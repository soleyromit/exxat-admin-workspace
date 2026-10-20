"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { Checkbox } from "@exxatdesignux/ui/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { Textarea } from "@exxatdesignux/ui/components/ui/textarea"
import { PageFrame } from "@/components/skills/page-header"
import { fmtDay } from "@/components/v2/outcomes/version-timeline"
import { useStaff } from "@/components/v2/outcomes/staff"
import { StudentPage } from "@/components/v2/student/student-frame"
import { BTN } from "@/components/v2/student/use-student"
import { useV2Hydrated, useV2State } from "@/lib/v2/react"
import { attemptInfo, closePlan, PLAN_STATUS_LABEL, planFor, setStepDone } from "@/lib/v2/outcomes"
import { ruleSentence, STUDENT_ID } from "@/lib/v2/student"
import type { Remediation, RoleId, V2State } from "@/lib/v2/types"

const TONE = { open: "info", "in-progress": "info", closed: "neutral" } as const
const ICON = { open: "fa-circle", "in-progress": "fa-hourglass-half", closed: "fa-lock" } as const

function Attempts({ s, plan }: { s: V2State; plan: Remediation }) {
  const a = attemptInfo(s, plan.studentId, plan.skillId)
  const skill = s.skills.find((k) => k.id === plan.skillId)
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle asChild className="text-base">
          <h2>Attempts</h2>
        </CardTitle>
        {skill ? <CardDescription>{ruleSentence(skill)}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-1 text-sm" data-attempt-info>
          <li>{a.limit === null ? `${a.used} ${a.used === 1 ? "attempt" : "attempts"} so far. There is no limit.` : `${a.used} of ${a.limit} attempts used.`}</li>
          {a.atLimit ? <li>The attempt limit is reached. Talk to your clinical coordinator.</li> : null}
          <li>{a.nextFrom ? `The next attempt can start from ${fmtDay(a.nextFrom)}.` : a.minDays > 0 ? "No attempt is holding you back yet." : "You can make a further attempt at any time."}</li>
        </ul>
      </CardContent>
    </Card>
  )
}

function StepList({ plan, staff, onToggle, s }: { plan: Remediation; staff: boolean; onToggle: (i: number, done: boolean) => void; s: V2State }) {
  const name = (id?: string) => s.people.find((p) => p.id === id)?.name ?? "program staff"
  return (
    <ol className="flex flex-col gap-2" aria-label="Plan steps" data-plan-steps>
      {plan.steps.map((st, i) => (
        <li key={i} className="flex items-start gap-3 rounded-lg border border-border bg-card p-3" data-step-done={st.done ? "yes" : "no"}>
          {staff ? (
            <Checkbox id={`step-${i}`} checked={st.done} disabled={plan.status === "closed"} className="mt-0.5" onCheckedChange={(v) => onToggle(i, v === true)} />
          ) : (
            <i className={`${st.done ? "fa-solid fa-circle-check" : "fa-light fa-circle"} mt-1 text-base`} aria-hidden="true" />
          )}
          <div className="flex flex-1 flex-col gap-0.5">
            {staff ? (
              <Label htmlFor={`step-${i}`} className="text-start text-sm font-normal text-foreground">
                <span className="sr-only">Mark done: </span>
                {st.label}
              </Label>
            ) : (
              <span className="text-sm text-foreground">{st.label}</span>
            )}
            <span className="text-xs text-muted-foreground">{st.done ? `Done${st.doneAt ? ` on ${fmtDay(st.doneAt)}` : ""}${st.doneById ? ` (confirmed by ${name(st.doneById)})` : ""}` : "Not done yet"}</span>
          </div>
        </li>
      ))}
    </ol>
  )
}

/** A remediation plan. Staff tick steps and close it; the student reads the same plan. */
export function RemediationPage({ role, id }: { role: RoleId; id: string }) {
  const s = useV2State()
  const hydrated = useV2Hydrated()
  const plan = planFor(s, id)
  const isStudent = role === "student"
  const wrap = (title: string, body: React.ReactNode) => (isStudent ? <StudentPage title={title}>{body}</StudentPage> : <PageFrame title={title}>{body}</PageFrame>)
  if (!plan) {
    if (!hydrated) return wrap("Opening the plan", <p role="status" className="text-sm text-muted-foreground">Opening the plan</p>)
    return wrap("Plan not found", <LocalBanner variant="warning" title="This remediation plan does not exist.">Go back and choose a plan from the list.</LocalBanner>)
  }
  if (isStudent && plan.studentId !== STUDENT_ID) return wrap("Plan not found", <LocalBanner variant="warning" title="This plan belongs to another student.">You can only open your own plan.</LocalBanner>)
  return isStudent ? <StudentPlan s={s} plan={plan} /> : <StaffPlan s={s} plan={plan} role={role} />
}

function PlanHead({ s, plan, staff }: { s: V2State; plan: Remediation; staff: boolean }) {
  const skill = s.skills.find((k) => k.id === plan.skillId)
  const student = s.people.find((p) => p.id === plan.studentId)?.name
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-2 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium text-foreground">{skill?.name}{staff && student ? `, ${student}` : ""}</span>
          <span data-plan-status={plan.status}>
            <StatusBadge label={PLAN_STATUS_LABEL[plan.status]} tone={TONE[plan.status]} icon={ICON[plan.status]} size="sm" />
          </span>
        </div>
        <p className="text-muted-foreground">{plan.openedAt ? `Opened ${fmtDay(plan.openedAt)}${plan.evaluationId ? " after an attempt that did not meet the criteria." : "."}` : "Opened by your program."}</p>
        {plan.evaluationId ? (
          <Button asChild variant="link" size="sm" className="h-auto justify-start p-0">
            <Link href={`/v2/${staff ? "reviewer" : "student"}/evaluation/${plan.evaluationId}`}>See that evaluation and its versions</Link>
          </Button>
        ) : null}
        {plan.closed ? (
          <p data-plan-closed className="rounded-md bg-muted px-3 py-2 text-foreground">{`Closed ${fmtDay(plan.closed.at)} by ${s.people.find((p) => p.id === plan.closed?.byId)?.name ?? "program staff"}. ${plan.closed.completed ? "Every step was done." : "Closed before every step was done."}${plan.closed.note ? ` Note: ${plan.closed.note}` : ""}`}</p>
        ) : null}
        {(plan.notes ?? []).map((n, i) => (
          <p key={i} className="text-xs text-muted-foreground">{`${fmtDay(n.at)}: ${n.text}`}</p>
        ))}
      </CardContent>
    </Card>
  )
}

function StudentPlan({ s, plan }: { s: V2State; plan: Remediation }) {
  const skill = s.skills.find((k) => k.id === plan.skillId)
  const done = plan.steps.filter((x) => x.done).length
  return (
    <StudentPage title={`Remediation plan: ${skill?.name ?? "Skill"}`} subtitle="The steps your program set after an attempt did not meet the criteria.">
      <PlanHead s={s} plan={plan} staff={false} />
      <section aria-labelledby="steps-h" className="flex flex-col gap-3">
        <h2 id="steps-h" className="text-base font-semibold">{`Steps (${done} of ${plan.steps.length} done)`}</h2>
        <StepList plan={plan} staff={false} s={s} onToggle={() => {}} />
        <p className="text-sm text-muted-foreground">Your coordinator confirms each step. You cannot change the plan.</p>
      </section>
      <Attempts s={s} plan={plan} />
      <Button asChild variant="default" size="lg" className={`${BTN} w-full`}>
        <Link href="/v2/student/pick-and-rate">Log a new attempt</Link>
      </Button>
      <Button asChild variant="outline" size="lg" className={`${BTN} w-full`}>
        <Link href="/v2/student/history">Back to your record</Link>
      </Button>
    </StudentPage>
  )
}

function StaffPlan({ s, plan, role }: { s: V2State; plan: Remediation; role: RoleId }) {
  const { run } = useStaff(role)
  const [msg, setMsg] = React.useState<{ kind: "success" | "error"; text: string } | null>(null)
  const [closing, setClosing] = React.useState(false)
  const skill = s.skills.find((k) => k.id === plan.skillId)
  const done = plan.steps.filter((x) => x.done).length
  const back = role === "admin" ? "/v2/admin/outcomes" : "/v2/reviewer/outcome-remediation"
  return (
    <PageFrame
      title={`Remediation plan: ${skill?.name ?? "Skill"}`}
      subtitle="Steps, status and closing the plan. The student sees the same plan and cannot change it."
    >
      <div className="flex max-w-3xl flex-col gap-4" data-plan-page>
        <div>
        plan.status !== "closed" ? (
          <Button type="button" variant="default" size="lg" onClick={() => { setMsg(null); setClosing(true) }}>
            Close plan
          </Button>
        ) : null
        </div>
        <div role="status" aria-live="polite">
          {msg ? (
            <LocalBanner variant={msg.kind === "success" ? "success" : "error"} title={msg.kind === "success" ? "Saved" : "Not saved"} data-staff-message>
              {msg.text}
            </LocalBanner>
          ) : null}
        </div>
        <PlanHead s={s} plan={plan} staff />
        <section aria-labelledby="steps-h" className="flex flex-col gap-3">
          <h2 id="steps-h" className="text-base font-semibold">{`Steps (${done} of ${plan.steps.length} done)`}</h2>
          <StepList plan={plan} staff s={s} onToggle={(i, d) => { const r = run((st, a, at) => setStepDone(st, plan.id, i, d, a, at)); setMsg(r.ok ? { kind: "success", text: d ? "Step marked done." : "Step marked not done." } : { kind: "error", text: r.error }) }} />
        </section>
        <Attempts s={s} plan={plan} />
        <div>
          <Button asChild variant="outline" size="lg" className={BTN}>
            <Link href={back}>Back to outcomes</Link>
          </Button>
        </div>
      </div>
      <CloseDialog open={closing} onClose={() => setClosing(false)} complete={done === plan.steps.length} onSave={(note) => {
        const r = run((st, a, at) => closePlan(st, plan.id, { note }, a, at))
        if (r.ok) { setClosing(false); setMsg({ kind: "success", text: "Plan closed." }) }
        return r.ok ? null : r.error
      }} />
    </PageFrame>
  )
}

function CloseDialog({ open, onClose, complete, onSave }: { open: boolean; onClose: () => void; complete: boolean; onSave: (note: string) => string | null }) {
  const [note, setNote] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  React.useEffect(() => { if (open) { setNote(""); setError(null) } }, [open])
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Close this plan?</DialogTitle>
          <DialogDescription>{complete ? "Every step is done. A closed plan can no longer change. Closing does not change any evaluation." : "Some steps are not done. Say why you are closing early. The reason stays on the plan."}</DialogDescription>
        </DialogHeader>
        <form noValidate className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); setError(onSave(note)) }}>
          <Field>
            <FieldLabel htmlFor="close-note">{complete ? "Note (optional)" : "Reason for closing early"}</FieldLabel>
            <Textarea id="close-note" rows={3} value={note} aria-invalid={error ? true : undefined} aria-describedby={error ? "close-error" : undefined} onChange={(e) => { setNote(e.target.value); setError(null) }} />
            {error ? <FieldError id="close-error" errors={[{ message: error }]} /> : null}
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" size="lg" onClick={onClose}>Keep plan open</Button>
            <Button type="submit" variant="default" size="lg">Close plan</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
