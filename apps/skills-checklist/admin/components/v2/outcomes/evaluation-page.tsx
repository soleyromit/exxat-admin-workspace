"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { Textarea } from "@exxatdesignux/ui/components/ui/textarea"
import { PageFrame, PageSection } from "@/components/skills/page-header"
import { ChoiceGroup } from "@/components/v2/preceptor/choice-group"
import { OUTCOME_TONE, VersionTimeline, fmtDay } from "@/components/v2/outcomes/version-timeline"
import { useStaff } from "@/components/v2/outcomes/staff"
import { StudentPage } from "@/components/v2/student/student-frame"
import { BTN } from "@/components/v2/student/use-student"
import { useV2Hydrated, useV2State } from "@/lib/v2/react"
import { canReopen, concernsFor, confirmVersion, evaluationById, openPlanByHand, OUTCOME_WORD, planOfEvaluation, reopenEvaluation } from "@/lib/v2/outcomes"
import { STUDENT_ID } from "@/lib/v2/student"
import { verifiedAt } from "@/lib/v2/verification"
import type { Evaluation, Outcome, RoleId, V2State } from "@/lib/v2/types"

const STATUS_TEXT: Record<Evaluation["status"], string> = {
  counted: "Counts toward the record",
  "awaiting-approval": "Waiting for approval, not counted yet",
  returned: "Returned for correction, not counted",
  reopened: "Reopened, not counted until the newest version is confirmed",
}

const OUT_OPTIONS: Array<{ value: Outcome; label: string }> = [
  { value: "met", label: "Met" },
  { value: "not-met", label: "Did not meet the criteria" },
  { value: "not-yet", label: "Not yet, feedback only" },
]

function Facts({ s, e, staff }: { s: V2State; e: Evaluation; staff: boolean }) {
  const name = (id: string) => s.people.find((p) => p.id === id)?.name ?? "Unknown person"
  const skill = s.skills.find((k) => k.id === e.skillId)
  const t = OUTCOME_TONE[e.outcome]
  return (
    <Card size="sm">
      <CardContent>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm" aria-label="Evaluation facts">
          <dt className="text-muted-foreground">Skill</dt>
          <dd>{skill?.name ?? "A skill"}</dd>
          {staff ? (
            <>
              <dt className="text-muted-foreground">Student</dt>
              <dd>{name(e.studentId)}</dd>
            </>
          ) : null}
          <dt className="text-muted-foreground">Evaluator</dt>
          <dd>{name(e.evaluatorId)}</dd>
          <dt className="text-muted-foreground">Date</dt>
          <dd>{fmtDay(e.date)}</dd>
          <dt className="text-muted-foreground">Setting</dt>
          <dd>{e.setting === "clinical" ? `Clinical, ${e.clinicalSetting ?? "setting not recorded"}` : e.setting === "lab" ? "Lab" : "Simulation"}</dd>
          {e.source === "paper-form" ? (
            <>
              <dt className="text-muted-foreground">Source</dt>
              <dd data-source="paper-form">{`Paper form, entered by ${name(e.enteredById ?? "")} for ${name(e.evaluatorId)}`}</dd>
            </>
          ) : null}
          {e.review ? (
            <>
              <dt className="text-muted-foreground">{e.review.decision === "approved" ? "Approved" : "Returned"}</dt>
              <dd data-review-decision>{`${name(e.review.byId)}, ${fmtDay(e.review.at)}${e.review.note && staff ? `. Note: ${e.review.note}` : e.review.decision === "returned" ? `. Reason: ${e.review.note}` : ""}`}</dd>
            </>
          ) : null}
          <dt className="text-muted-foreground">Outcome</dt>
          <dd data-current-outcome>
            <StatusBadge label={e.outcome === "not-met" ? "Did not meet the criteria" : OUTCOME_WORD[e.outcome]} tone={t.tone} icon={t.icon} size="sm" />
          </dd>
          <dt className="text-muted-foreground">Status</dt>
          <dd data-current-status>{STATUS_TEXT[e.status]}</dd>
        </dl>
      </CardContent>
    </Card>
  )
}

/** One evaluation and every version of it. Staff can reopen it or confirm the newest version; the student reads it. */
export function EvaluationPage({ role, id }: { role: RoleId; id: string }) {
  const s = useV2State()
  const hydrated = useV2Hydrated()
  const e = evaluationById(s, id)
  const isStudent = role === "student"
  if (!hydrated && !e) return isStudent ? <StudentPage title="Opening the evaluation"><p role="status" className="text-sm text-muted-foreground">Opening the evaluation</p></StudentPage> : <PageFrame title="Opening the evaluation" />
  if (!e) return <Missing role={role} text="This evaluation does not exist." />
  if (isStudent && e.studentId !== STUDENT_ID) return <Missing role={role} text="This evaluation belongs to another student." />
  return isStudent ? <StudentView s={s} e={e} /> : <StaffView s={s} e={e} role={role} />
}

function Missing({ role, text }: { role: RoleId; text: string }) {
  const back = role === "student" ? "/v2/student/history" : role === "admin" ? "/v2/admin/outcomes" : "/v2/reviewer/outcome-remediation"
  const body = (
    <LocalBanner variant="warning" title={text}>
      <Button asChild variant="outline" size="lg" className={`${BTN} mt-2`}>
        <Link href={back}>{role === "student" ? "Back to your record" : "Back to outcomes"}</Link>
      </Button>
    </LocalBanner>
  )
  return role === "student" ? <StudentPage title="Evaluation not found">{body}</StudentPage> : <PageFrame title="Evaluation not found">{body}</PageFrame>
}

function StudentView({ s, e }: { s: V2State; e: Evaluation }) {
  const skill = s.skills.find((k) => k.id === e.skillId)
  const plan = planOfEvaluation(s, e.id) ?? s.remediations.find((r) => r.studentId === e.studentId && r.skillId === e.skillId && r.status !== "closed")
  return (
    <StudentPage title={skill?.name ?? "Evaluation"} subtitle="The completed evaluation and every version of it.">
      <Facts s={s} e={e} staff={false} />
      {e.status === "reopened" ? <LocalBanner variant="info" title="Your program reopened this evaluation">Version {e.currentVersion} is waiting to be confirmed. Until then it does not count. Earlier versions are kept as they were.</LocalBanner> : null}
      {plan ? (
        <Card size="sm" data-plan-link>
          <CardContent className="flex flex-col gap-2 text-sm">
            <p className="font-medium text-foreground">You have a remediation plan for this skill</p>
            <Button asChild variant="default" size="lg" className={BTN}>
              <Link href={`/v2/student/remediation/${plan.id}`}>See your plan</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
      <section aria-labelledby="ver-h" className="flex flex-col gap-3">
        <h2 id="ver-h" className="text-base font-semibold">{`Versions (${e.versions.length})`}</h2>
        <VersionTimeline s={s} e={e} />
      </section>
      <p className="text-xs text-muted-foreground">A completed evaluation is never edited. A correction adds a version and keeps the earlier ones.</p>
      <Button asChild variant="outline" size="lg" className={BTN}>
        <Link href="/v2/student/history">Back to your record</Link>
      </Button>
    </StudentPage>
  )
}

function StaffView({ s, e, role }: { s: V2State; e: Evaluation; role: RoleId }) {
  const { actorId, run } = useStaff(role)
  const [open, setOpen] = React.useState(false)
  const [msg, setMsg] = React.useState<{ kind: "success" | "error"; text: string } | null>(null)
  const skill = s.skills.find((k) => k.id === e.skillId)
  const student = s.people.find((p) => p.id === e.studentId)?.name ?? "Unknown person"
  const concerns = concernsFor(s, role).filter((c) => c.evaluationId === e.id)
  const plan = planOfEvaluation(s, e.id) ?? s.remediations.find((r) => r.studentId === e.studentId && r.skillId === e.skillId && r.status !== "closed")
  const reopened = e.status === "reopened"
  const verified = verifiedAt(s, e)
  const back = role === "admin" ? "/v2/admin/outcomes" : "/v2/reviewer/outcome-remediation"
  return (
    <PageFrame
      title={`${skill?.name ?? "Evaluation"}, ${student}`}
      subtitle="Every version, who made it and why. An earlier version is never changed."
    >
      <div className="flex max-w-3xl flex-col gap-4" data-evaluation-page>
        <div className="flex flex-wrap gap-2">
          {reopened ? (
            <Button type="button" variant="default" size="lg" onClick={() => { const r = run((st, a, at) => confirmVersion(st, e.id, a, at)); setMsg(r.ok ? { kind: "success", text: `Version ${e.currentVersion} confirmed as final.${r.planOpened ? " A remediation plan was opened." : ""}` } : { kind: "error", text: r.error }) }}>
              {`Confirm version ${e.currentVersion} as final`}
            </Button>
          ) : null}
          {canReopen(e) ? (
            <Button type="button" variant={reopened ? "outline" : "default"} size="lg" onClick={() => { setMsg(null); setOpen(true) }}>
              Reopen to edit
            </Button>
          ) : null}
        </div>
        <div role="status" aria-live="polite">
          {msg ? (
            <LocalBanner variant={msg.kind === "success" ? "success" : "error"} title={msg.kind === "success" ? "Done" : "Not saved"} data-staff-message>
              {msg.text}
            </LocalBanner>
          ) : null}
        </div>
        <Facts s={s} e={e} staff />
        {verified ? (
          <LocalBanner variant="info" title={`Part of a verified record (version ${verified.version})`} data-verified-banner>
            {`${student}'s record was verified by ${s.people.find((p) => p.id === verified.byId)?.name ?? "the program director"} on ${fmtDay(verified.at)}. Reopening adds a version here and leaves that verification as it is. The record then reads Changed since verified until the director verifies again.`}
          </LocalBanner>
        ) : null}
        {reopened ? (
          <LocalBanner variant="info" title={`Version ${e.currentVersion} is waiting to be confirmed`}>
            This evaluation does not count while it is reopened. Confirm the newest version to make it count again.
          </LocalBanner>
        ) : null}

        {concerns.length > 0 ? (
          <PageSection title="Confidential concern" id="concern" description="Program staff only. The student and the preceptor roles never see this.">
            <ul className="flex flex-col gap-2">
              {concerns.map((c) => (
                <li key={c.id}>
                  <Card size="sm" data-concern={c.id}>
                    <CardContent className="text-sm">
                      <p className="text-foreground">{c.note}</p>
                      <p className="text-xs text-muted-foreground">{`Raised by ${s.people.find((p) => p.id === c.raisedById)?.name ?? "an evaluator"} on ${fmtDay(c.at)}.`}</p>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          </PageSection>
        ) : null}

        {plan ? (
          <Button asChild variant="outline" size="lg" className={BTN}>
            <Link href={`/v2/${role}/remediation/${plan.id}`}>Open the remediation plan</Link>
          </Button>
        ) : e.outcome === "not-met" && e.status !== "reopened" ? (
          <div>
            <Button type="button" variant="outline" size="lg" className={BTN} onClick={() => { const r = run((st, a, at) => openPlanByHand(st, e.id, a, at)); setMsg(r.ok ? { kind: "success", text: "A remediation plan was opened. The student can see it." } : { kind: "error", text: r.error }) }}>
              Open a remediation plan
            </Button>
          </div>
        ) : null}

        <PageSection title={`Versions (${e.versions.length})`} id="versions">
          <VersionTimeline s={s} e={e} />
        </PageSection>
        <div>
          <Button asChild variant="outline" size="lg" className={BTN}>
            <Link href={back}>Back to outcomes</Link>
          </Button>
        </div>
      </div>
      <ReopenDialog open={open} onClose={() => setOpen(false)} s={s} e={e} onSave={(input) => {
        const r = run((st, a, at) => reopenEvaluation(st, { evaluationId: e.id, ...input }, a, at))
        if (r.ok) {
          setOpen(false)
          setMsg({ kind: "success", text: `Version ${r.version} added. The evaluation is reopened and does not count until you confirm it.` })
        }
        return r.ok ? null : r.error
      }} actorId={actorId} />
    </PageFrame>
  )
}

function ReopenDialog({ open, onClose, s, e, onSave }: { open: boolean; onClose: () => void; s: V2State; e: Evaluation; onSave: (i: { outcome: Outcome; feedback: string; reason: string }) => string | null; actorId: string }) {
  const current = e.versions[e.versions.length - 1]?.detail?.feedback ?? ""
  const [outcome, setOutcome] = React.useState<Outcome>(e.outcome)
  const [feedback, setFeedback] = React.useState(current)
  const [reason, setReason] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  React.useEffect(() => {
    if (open) {
      setOutcome(e.outcome)
      setFeedback(e.versions[e.versions.length - 1]?.detail?.feedback ?? "")
      setReason("")
      setError(null)
    }
  }, [open, e])
  const hasDetail = !!e.versions[e.versions.length - 1]?.detail
  const next = e.currentVersion + 1
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Reopen this evaluation?</DialogTitle>
          <DialogDescription>{`This adds version ${next}. Version ${e.currentVersion} and every earlier version stay as they are. The evaluation does not count until you confirm the new version.`}</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" noValidate onSubmit={(ev) => { ev.preventDefault(); setError(onSave({ outcome, feedback: hasDetail || feedback.trim() ? feedback : "", reason })) }}>
          <fieldset className="flex flex-col gap-1">
            <legend className="text-sm font-medium">New outcome</legend>
            <ChoiceGroup name="New outcome" idBase="reopen-out" firstId="reopen-out-first" options={OUT_OPTIONS} value={outcome} onChange={(v) => setOutcome(v as Outcome)} />
          </fieldset>
          <Field>
            <FieldLabel htmlFor="reopen-feedback">Feedback (change it only if it needs correcting)</FieldLabel>
            <Textarea id="reopen-feedback" rows={3} value={feedback} onChange={(x) => setFeedback(x.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="reopen-reason">Reason for the change</FieldLabel>
            <Textarea id="reopen-reason" rows={3} value={reason} aria-invalid={error ? true : undefined} aria-describedby={error ? "reopen-error" : undefined} onChange={(x) => { setReason(x.target.value); setError(null) }} />
            {error ? <FieldError id="reopen-error" errors={[{ message: error }]} /> : null}
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" size="lg" onClick={onClose}>
              Keep as it is
            </Button>
            <Button type="submit" variant="default" size="lg">
              {`Reopen and add version ${next}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
