"use client"

/**
 * Submission history as a 1024px DIALOG (prototype parity card P-11, C-4). Same behaviour as S-14
 * (contract S-14-student-skill-history.md): every attempt in order with one explicit outcome (SH-02), who it is with,
 * the failed rule in the student's terms (SH-03), and ONE state-appropriate action:
 *   returned or not yet assessed -> Revise and resend (same record, RV-01/RV-02)
 *   completed, did not meet       -> Make a further attempt (new record, original untouched, RV-03)
 *   counted or awaiting approval  -> no action, a plain-text reason (RV-05)
 * A completed evaluation is read-only (values rendered as text). Who corrects a returned item stays neutral (OD-16).
 * The counter is labelled "In progress" with the helper "Sent but not finished" as in the prototype (C-10, DEC-012
 * superseded): the clash with the skill status "In progress" exists in the prototype too and is flagged to Romit.
 */
import * as React from "react"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@exxatdesignux/ui/components/ui/collapsible"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@exxatdesignux/ui/components/ui/radio-group"
import type { Id } from "@/lib/domain/types"
import type { RecordedDetail } from "@/lib/store"
import { buttons, criteriaSummary, locked, ruleContext, surface } from "@/lib/copy"
import { studentLocal as local } from "@/lib/copy"
import { r5 } from "@/lib/copy/r5-student-preceptor"
import { criteriaParts, skillHistory, type AttemptRow } from "@/lib/store"
import { FailedRuleExplainer } from "@/components/skills"
import { useActingStudent } from "./helpers"
import { OutcomeBadge } from "./outcome-badge"
import { RecordedAnswers } from "./answers"
import { SendDialog, type SendMode, type SentInfo } from "./send-dialog"

const OPEN_STATES = ["awaitingEvaluator", "revised", "awaitingApproval", "returned"]

function summaryOf(d: RecordedDetail): string {
  switch (d.kind) {
    case "binary":
      return d.label
    case "demonstration":
      return d.level
    case "question":
      return `${d.yes} of ${d.total} Yes`
    case "scored":
      return `Average ${d.average.toFixed(1)}`
  }
}

function AttemptCard({ a, db, skillId, onAction }: { a: AttemptRow; db: ReturnType<typeof useActingStudent>["db"]; skillId: Id; onAction: (mode: SendMode, offeringId: Id) => void }) {
  const l = a.ledger
  const skill = db.skills.find((s) => s.id === skillId)!
  const headId = `attempt-${l.submissionId}`
  const [open, setOpen] = React.useState(false)
  const date = l.date.slice(0, 10)
  const where = l.performedIn === "lab" ? "Lab / Simulation" : `Clinical — ${l.settingName ?? ""}`
  const code = db.offerings.find((o) => o.id === l.offeringId)?.code ?? ""
  const who = { name: l.evaluatorName, role: l.evaluatorRole }
  const recordedLine = l.recorded ? r5.history.recorded(summaryOf(l.recorded), who.name, who.role) : r5.history.notRecorded(who.name, who.role)
  return (
    <li className="rounded-lg border border-border p-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div id={headId} className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium text-foreground">{r5.history.attempt(l.attempt)}</span>
            <span className="text-muted-foreground">{date}</span>
            <Badge variant="secondary">{where}</Badge>
            {l.performedIn === "clinical" && l.locationName ? <span className="text-xs text-muted-foreground">{l.locationName}</span> : null}
            <span className="text-xs text-muted-foreground">{code}</span>
          </div>
          <OutcomeBadge state={a.state} who={who} />
        </div>
        <p className="text-sm text-foreground">{recordedLine}</p>

        {l.values.length > 0 || l.studentNote ? (
          <p className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
            {l.values.map((v) => (
              <span key={v.label}>
                <span className="font-medium">{v.label}:</span> {String(v.value)}
              </span>
            ))}
            {l.studentNote ? (
              <span>
                <span className="font-medium">{local.yourNote}:</span> {l.studentNote}
              </span>
            ) : null}
          </p>
        ) : null}
        {l.selfEvaluation ? <p className="text-xs text-muted-foreground">{r5.history.rated(summaryOf(l.selfEvaluation))}</p> : null}
        {l.evaluationId !== null ? (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">{r5.history.feedback(l.evaluatorRole.split(" ")[0] ?? "Evaluator")}</span> {l.comment || local.noComment}
          </p>
        ) : null}
        {l.reviewerNote ? (
          <p className="text-xs text-foreground">
            <span className="font-medium">{r5.history.reviewerNote}</span> {l.reviewerNote}
          </p>
        ) : null}
        {l.revision > 0 ? <p className="text-xs text-muted-foreground">{r5.history.revised(l.revision)}</p> : null}

        {a.state === "didNotMeet" ? (
          a.failedRule && a.failedRule.evaluationReasons.length > 0 ? (
            <FailedRuleExplainer ctx={ruleContext(db, skill)} evaluationReasons={a.failedRule.evaluationReasons} />
          ) : (
            <LocalBanner variant="warning">This evaluation did not meet the criteria. {local.furtherPrompt}</LocalBanner>
          )
        ) : null}
        {a.state === "counted" ? <p className="text-xs text-muted-foreground">{locked.counted}</p> : null}
        {a.state === "awaitingApproval" ? <p className="text-xs text-muted-foreground">{locked.awaitingApproval}</p> : null}

        <div className="flex flex-wrap items-center gap-2">
          {l.recorded ? (
            <Collapsible open={open} onOpenChange={setOpen} className="flex flex-col gap-2">
              <CollapsibleTrigger asChild>
                <Button size="sm" type="button" variant="ghost" className="min-h-11 self-start" aria-expanded={open}>
                  {r5.history.viewForm}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="rounded-md bg-muted p-3">
                <RecordedAnswers detail={l.recorded} />
              </CollapsibleContent>
            </Collapsible>
          ) : null}
          {a.actions.revise ? (
            <Button size="sm" type="button" variant="outline" className="min-h-11" onClick={() => onAction({ kind: "revise", submissionId: l.submissionId }, l.offeringId)}>
              {r5.history.reviseResend}
            </Button>
          ) : null}
        </div>
      </div>
    </li>
  )
}

export function HistoryDialog({ skillId, offeringId, onClose, onSent }: { skillId: Id; offeringId: Id; onClose: () => void; onSent: (info: SentInfo) => void }) {
  const { db, studentId } = useActingStudent()
  const [scope, setScope] = React.useState<"all" | "course">("all")
  const [sheet, setSheet] = React.useState<{ mode: SendMode; offeringId: Id; session: number } | null>(null)
  const full = skillHistory(db, studentId, skillId)
  const h = skillHistory(db, studentId, skillId, scope === "course" ? { offeringId } : {})

  if (!full || !h) {
    return (
      <Dialog open onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>{r5.history.close}</DialogTitle>
            <DialogDescription>{surface.s12.error}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  const skill = full.skill
  const course = db.offerings.find((o) => o.id === offeringId)
  const inCourse = full.attempts.filter((a) => a.ledger.offeringId === offeringId).length
  const attempts = [...h.attempts].sort((a, b) => b.ledger.attempt - a.ledger.attempt)
  const latest = full.attempts.reduce<AttemptRow | null>((m, a) => (!m || a.ledger.attempt > m.ledger.attempt ? a : m), null)
  const hasOpen = full.attempts.some((a) => OPEN_STATES.includes(a.state))
  const furtherAvailable = !!latest && latest.actions.furtherAttempt && !hasOpen
  const furtherBlocked = !furtherAvailable && full.attempts.some((a) => a.state === "didNotMeet") && hasOpen
  const parts = criteriaParts(db, skill)
  const t = full.progress.total
  const noun = t.noun === "demonstrations" ? "demonstrations" : "qualifying evaluations"

  return (
    <>
      <Dialog open onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="flex max-h-[calc(100dvh-4rem)] w-[calc(100vw-1rem)] flex-col gap-0 p-0 sm:max-w-5xl [&_[data-slot=dialog-close]]:top-3 [&_[data-slot=dialog-close]]:size-11">
          <DialogHeader className="border-b border-border px-4 py-3 text-left sm:px-6">
            <DialogTitle>{skill.name}</DialogTitle>
            <DialogDescription>{r5.history.title(criteriaSummary(parts))}</DialogDescription>
          </DialogHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { label: r5.history.counted, value: h.counters.counted, help: `${t.have} / ${t.needed ?? t.have} ${noun}` },
                { label: r5.history.inProgress, value: h.counters.outstanding, help: r5.history.inProgressHelper },
                { label: r5.history.returned, value: h.counters.returned, help: r5.history.returnedHelper },
              ].map((c) => (
                <Card key={c.label}>
                  <CardContent>
                    <dl className="flex flex-col gap-0.5">
                      <dt className="text-xs font-medium text-muted-foreground">{c.label}</dt>
                      <dd className="text-2xl font-semibold text-foreground">{c.value}</dd>
                      <dd className="text-xs text-muted-foreground">{c.help}</dd>
                    </dl>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">{r5.history.note}</p>
              <fieldset>
                <legend className="sr-only">Courses</legend>
                <RadioGroup value={scope} onValueChange={(v) => setScope(v as "all" | "course")} className="flex flex-row flex-wrap gap-2">
                  {([
                    ["all", r5.history.allCourses(full.scope.all)],
                    ["course", r5.history.courseOnly(course?.code ?? "", inCourse)],
                  ] as const).map(([val, label]) => (
                    <Label key={val} htmlFor={`scope-${val}`} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-3 text-xs font-medium ${scope === val ? "border-primary bg-accent text-foreground" : "border-border text-muted-foreground"}`}>
                      <RadioGroupItem id={`scope-${val}`} value={val} />
                      {label}
                    </Label>
                  ))}
                </RadioGroup>
              </fieldset>
            </div>

            {furtherAvailable && latest ? (
              <div>
                <Button size="default" type="button" variant="default" className="min-h-11" onClick={() => setSheet({ mode: { kind: "further", fromSubmissionId: latest.ledger.submissionId }, offeringId: latest.ledger.offeringId, session: Date.now() })}>
                  {buttons.furtherAttempt}
                </Button>
              </div>
            ) : furtherBlocked ? (
              <p className="text-sm text-muted-foreground">{local.furtherBlocked}</p>
            ) : null}

            {attempts.length === 0 ? (
              <p className="text-sm text-foreground" role="status">
                {surface.s14.empty}
              </p>
            ) : (
              <ol aria-label="Attempts" className="flex flex-col gap-3">
                {attempts.map((a) => (
                  <AttemptCard key={a.ledger.submissionId} a={a} db={db} skillId={skillId} onAction={(mode, off) => setSheet({ mode, offeringId: off, session: Date.now() })} />
                ))}
              </ol>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {sheet ? (
        <SendDialog
          key={sheet.session}
          open
          onOpenChange={(o) => {
            if (!o) setSheet(null)
          }}
          offeringId={sheet.offeringId}
          skillIds={[skillId]}
          mode={sheet.mode}
          onSent={(info) => {
            onSent(info)
            onClose()
          }}
        />
      ) : null}
    </>
  )
}
