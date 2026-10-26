"use client"

/**
 * Second and third layouts for the evaluator's non-form outcomes (Submitted, Expired). Same request model and receipt lines as
 * variant A (lib/lab/evaluator.ts buildRequest, receipt), same no-chrome frame; only the layout differs. Density per strategy/07:
 * at most 3 regions (light header, outcome, one supporting card) and about 15 words of prose above the fold.
 * Copy rules: one link per request (ledger D-L2), so no "next request" button; link lifetime is OD-18 (open), dates are samples.
 */
import * as React from "react"
import { PageHeader } from "@exxatdesignux/ui/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { STUDENT_SEES, receiptSummary, type EvRequest, type ReceiptLine } from "@/lib/lab/evaluator"
import { EvaluatorFrame } from "@/components/lab/evaluator/frame"
import { EvLabControls } from "@/components/lab/evaluator/lab-controls"
import { Completed, Forwarded, NotForYou } from "@/components/lab/evaluator/status"
import { skillsWord, TOUCH } from "@/components/lab/evaluator/fields"
import type { EvaluatorModel } from "@/components/lab/evaluator/use-evaluator"

const HEADER = "px-0 pt-0 pb-0 lg:px-0 lg:pt-0 lg:pb-0"
const TONE: Record<ReceiptLine["status"], "neutral" | "warning"> = { counts: "neutral", waits: "warning", queued: "neutral", feedback: "neutral" }

/** Lab controls plus the no-chrome frame, with loading handled once. The body is the variant. */
export function OutcomeShell({ m, states, defaultState, children }: { m: EvaluatorModel; states: Array<{ id: string; label: string }>; defaultState: string; children: (req: EvRequest) => React.ReactNode }) {
  return (
    <>
      <EvLabControls states={states} defaultState={defaultState} showSample={false} options={[]} />
      <EvaluatorFrame program={m.req?.programName ?? "Your program"}>
        {!m.hydrated || !m.req ? (
          <div className="flex flex-col gap-3" aria-busy="true">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          children(m.req)
        )}
      </EvaluatorFrame>
    </>
  )
}

const outcomeTitle = (lines: ReceiptLine[], offline: boolean) => {
  if (offline) return "Saved on this phone"
  const s = receiptSummary(lines)
  const many = lines.length > 1
  if (s.waits === 0 && s.feedback === 0) return many ? "Signed off. They count now." : "Signed off. It counts now."
  if (s.counts === 0 && s.feedback === 0) return many ? "Signed off. They wait for approval." : "Signed off. It waits for approval."
  return "Signed off"
}

// ---------------------------------------------------------------------------------------------------------------------
// Submitted B: what happens next, as a short ordered checklist (Ro "What's next" pattern). Each skill sits under the step it is at.

export function NextSteps({ req, lines, offline }: { req: EvRequest; lines: ReceiptLine[]; offline: boolean }) {
  const s = receiptSummary(lines)
  const byStatus = (st: ReceiptLine["status"]) => lines.filter((l) => l.status === st)
  type Step = { key: string; done: boolean; title: string; detail?: string; lines?: ReceiptLine[] }
  // Step titles are short labels (3 words at most); the skills under each step are the record (data).
  const steps: Step[] = offline
    ? [
        { key: "saved", done: true, title: `Saved: ${skillsWord(lines.length)}`, lines },
        { key: "send", done: false, title: "Sends on reconnect", detail: "Keep this page open." },
        { key: "student", done: false, title: `Then ${req.student.first} sees it` },
      ]
    : [
        { key: "sent", done: true, title: `Signed off: ${skillsWord(lines.length)}`, detail: req.onRecord ? undefined : "The program may confirm your details." },
        ...(s.counts + s.feedback > 0 ? [{ key: "counts", done: true, title: s.counts ? `Counted now: ${skillsWord(s.counts)}` : "Feedback recorded", lines: [...byStatus("counts"), ...byStatus("feedback")] }] : []),
        ...(s.waits > 0 ? [{ key: "waits", done: false, title: "Awaits program approval", lines: byStatus("waits") }] : []),
        { key: "student", done: s.waits === 0, title: s.waits === 0 ? `${req.student.first} sees it` : `Then ${req.student.first} sees it` },
      ]
  return (
    <div className="flex flex-col gap-4" data-ev-receipt="steps">
      <PageHeader title={outcomeTitle(lines, offline)} subtitle={<span data-viz-label>{`${req.student.name} · ${req.course.code}`}</span>} className={HEADER} />
      <Card size="sm" data-region="next-steps">
        <CardHeader className="pb-0">
          <CardTitle className="text-sm">What happens next</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="flex flex-col">
            {steps.map((st, i) => (
              <li key={st.key} className="relative flex gap-3 pb-4 last:pb-0">
                {i < steps.length - 1 ? <span className="absolute top-6 bottom-0 left-[11px] w-px bg-border" aria-hidden="true" /> : null}
                <span className={`relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border ${st.done ? "border-foreground bg-foreground text-background" : "border-border bg-background text-muted-foreground"}`} aria-hidden="true">
                  <i className={`fa-solid ${st.done ? "fa-check" : "fa-circle"} text-[10px]`} />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5 pt-0.5">
                  <p className="text-sm font-medium text-foreground">
                    <span className="sr-only">{st.done ? "Done: " : "Next: "}</span>
                    {st.title}
                  </p>
                  {st.detail ? <p className="text-sm text-muted-foreground">{st.detail}</p> : null}
                  {st.lines?.length ? (
                    <ul className="flex flex-col gap-1" data-viz-label>
                      {st.lines.map((l) => (
                        <li key={l.skillId} className="flex flex-col text-sm sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
                          <span className="min-w-0 text-foreground">{l.name}</span>
                          <span className="shrink-0 text-muted-foreground">{l.answer}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
      <p className="text-sm text-muted-foreground">It cannot be changed from here.</p>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Submitted C: thanks, and the student's view of the same skills (the next role's screen, dots connected per role, ledger D-C).

export function StudentSees({ req, lines, offline }: { req: EvRequest; lines: ReceiptLine[]; offline: boolean }) {
  return (
    <div className="flex flex-col gap-4" data-ev-receipt="student-view">
      <div className="flex flex-col items-start gap-2 pt-2">
        <span className="flex size-10 items-center justify-center rounded-full bg-muted text-foreground" aria-hidden="true">
          <i className={`fa-light ${offline ? "fa-cloud-arrow-up" : "fa-circle-check"} text-lg`} />
        </span>
        <PageHeader title={offline ? "Saved on this phone" : `Thank you, ${req.evaluator.name.split(",")[0]}`} subtitle={offline ? "It sends when you reconnect." : `${skillsWord(lines.length)} signed off for ${req.student.first}.`} className={HEADER} />
      </div>
      <Card size="sm" data-region="student-view" aria-label={`What ${req.student.first} sees`}>
        <CardHeader className="pb-0">
          <CardTitle className="text-sm">{`What ${req.student.first} sees`}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col divide-y divide-border" data-viz-label>
            {lines.map((l) => {
              const sees = STUDENT_SEES[l.status]
              return (
                <li key={l.skillId} className="flex flex-col gap-1.5 py-3 first:pt-2 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                  <span className="min-w-0 text-sm font-medium text-foreground">{l.name}</span>
                  <StatusBadge label={sees.word} tone={TONE[l.status]} icon={sees.icon} size="md" />
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>
      <div>
        <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>Print a copy</Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Expired B: ask the student to resend, with a preview of which request this was (who, course, how many skills, dates).
// Only for a link that reached its addressee and lapsed; "not for you" still shows nothing of the request.

const mailto = (req: EvRequest) => `mailto:?subject=${encodeURIComponent(`Please resend your skills request, ${req.student.first}`)}`

export function ResendPreview({ req }: { req: EvRequest }) {
  const facts: Array<[string, string]> = [
    ["Student", req.student.name],
    ["Course", req.course.code],
    ["Asked for", skillsWord(req.skills.length)],
    ["Sent", req.sentOn],
  ]
  return (
    <div className="flex flex-col gap-4 pt-2" data-ev-expired="resend">
      <PageHeader title={`Ask ${req.student.first} to resend`} subtitle="This link no longer works." className={HEADER} />
      <Card size="sm" data-region="request-preview">
        <CardContent className="flex flex-col gap-3">
          <StatusBadge label="Link expired" tone="neutral" icon="fa-link-slash" size="md" />
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            {facts.map(([k, v]) => (
              <React.Fragment key={k}>
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-foreground">{v}</dd>
              </React.Fragment>
            ))}
          </dl>
          <Button asChild variant="default" size="default" className={`${TOUCH} w-full sm:w-fit`}>
            <a href={mailto(req)}>{`Email ${req.student.first}`}</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Expired C: identify yourself to get a fresh link. A SEAM, not a decision: link lifetime and re-issue are OD-18 (open). The lab
// shows the shape only; nothing is sent and the answer is the same whether or not the address matches (no account to probe).

export function IdentifySeam({ req }: { req: EvRequest }) {
  const [sent, setSent] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const id = "ev-identify-email"
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Enter the email address this request was sent to.")
      return
    }
    setError(null)
    setSent(true)
  }
  return (
    <div className="flex flex-col gap-4 pt-2" data-ev-expired="identify">
      <p className="flex items-center gap-2 text-xs text-muted-foreground" data-lab-chrome>
        <Badge variant="outline">Open decision</Badge>
        How a new link is issued is not decided. Shape only.
      </p>
      <PageHeader title="This link has expired" subtitle="Enter the address it was sent to." className={HEADER} />
      <Card size="sm" data-region="identify">
        <CardContent>
          {sent ? (
            <div role="status" className="flex flex-col gap-1 text-sm">
              <p className="font-medium text-foreground">Check your email</p>
              <p className="text-muted-foreground">If the address matches, a new link is on its way.</p>
            </div>
          ) : (
            <form className="flex flex-col gap-3" onSubmit={submit} noValidate>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={id}>Your email</Label>
                <Input id={id} type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} className="min-h-(--control-height-touch)" />
                {error ? <p id={`${id}-error`} className="text-sm text-destructive">{error}</p> : null}
              </div>
              <Button type="submit" variant="default" size="default" className={`${TOUCH} w-full sm:w-fit`}>Send a new link</Button>
            </form>
          )}
        </CardContent>
      </Card>
      <p className="text-sm text-muted-foreground">
        Not you? <a className="font-medium text-foreground underline underline-offset-2" href={mailto(req)}>{`Tell ${req.student.first}`}</a>
      </p>
    </div>
  )
}

/** The states every expired variant shares with A: forwarded check, not for you, already completed (one message each). */
export function SharedTerminal({ m, req, children }: { m: EvaluatorModel; req: EvRequest; children: React.ReactNode }) {
  if (m.state === "not-for-you" || (m.state === "forwarded" && m.identity === "other")) return <NotForYou req={req} />
  if (m.state === "forwarded" && m.identity === "ask") return <Forwarded req={req} onAnswer={(me) => m.setIdentity(me ? "me" : "other")} />
  if (m.state === "forwarded" && m.identity === "me") return <p className="pt-2 text-sm text-muted-foreground" data-lab-chrome>Confirmed. In the product the form opens here.</p>
  if (m.state === "completed") return <Completed req={req} />
  return <>{children}</>
}
