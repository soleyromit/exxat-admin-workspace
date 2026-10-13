"use client"

/**
 * S-14 Skill history (contract S-14-student-skill-history.md). Every attempt in order with one explicit outcome (SH-02),
 * who it is with, the failed rule in the student's terms (SH-03), and ONE state-appropriate action (P-10, P-11):
 *   returned or not yet assessed  -> Revise and resend (same record, RV-01/RV-02)
 *   completed, did not meet       -> Make a further attempt (new record, original untouched, RV-03)
 *   counted or awaiting approval  -> no action, a plain-text reason (RV-05)
 * A completed evaluation is read-only: values are rendered as text, never disabled inputs.
 * Wording about who corrects a returned item stays neutral (OD-16). Routes: /courses/[offering]/skills/[skill]/history and
 * /my-skills/[skill]. Shown as a full page rather than a Sheet so the scope toggle lives in the URL and phones get a full
 * screen (contract S-14 §7 mobile proposal); this is a deviation for desktop, recorded in the worker report.
 */
import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@exxatdesignux/ui/components/ui/collapsible"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@exxatdesignux/ui/components/ui/radio-group"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import type { Id } from "@/lib/domain/types"
import type { RecordedDetail } from "@/lib/store"
import { buttons, criteriaSummary, locked, ruleContext, sendCopy, surface } from "@/lib/copy"
import { criteriaParts, skillHistory, type AttemptRow } from "@/lib/store"
import { FailedRuleExplainer, PageFrame, SkillStatusBadge } from "@/components/skills"
import { STUDENT_ROUTES } from "@/lib/skills-routes"
import { studentLocal as local } from "@/lib/copy"
import { useActingStudent, useMounted } from "./helpers"
import { OutcomeBadge } from "./outcome-badge"
import { RecordedAnswers } from "./answers"
import { SkillProgressBlock } from "./skill-progress"
import { SendDialog, type SendMode, type SentInfo } from "./send-dialog"

const s14 = surface.s14
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

function AttemptCard({ a, db, skillId, latest, onAction }: { a: AttemptRow; db: ReturnType<typeof useActingStudent>["db"]; skillId: Id; latest: boolean; onAction: (mode: SendMode, offeringId: Id) => void }) {
  const l = a.ledger
  const skill = db.skills.find((s) => s.id === skillId)!
  const headId = `attempt-${l.submissionId}`
  const where = sendCopy.where(l.performedIn, l.settingName, l.locationName)
  const who = { name: l.evaluatorName, role: l.evaluatorRole }
  const [open, setOpen] = React.useState(false)
  const date = l.date.slice(0, 10)
  return (
    <li className="rounded-md border border-border p-3">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 id={headId} className="text-base font-semibold text-foreground">
            {s14.attempt(l.attempt, date, where, a.offeringLabel)}
          </h3>
          <OutcomeBadge state={a.state} who={who} />
        </div>
        <p className="text-sm text-muted-foreground">
          {l.evaluatorName} ({l.evaluatorRole})
        </p>

        {l.values.length > 0 ? (
          <div>
            <p className="text-sm font-medium text-foreground">{local.sentWith}</p>
            <dl className="flex flex-col gap-0.5">
              {l.values.map((v) => (
                <div key={v.label} className="flex flex-wrap justify-between gap-2 text-sm">
                  <dt className="text-muted-foreground">{v.label}</dt>
                  <dd className="text-foreground">{String(v.value)}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}
        {l.studentNote ? (
          <p className="text-sm text-foreground">
            <span className="font-medium">{local.yourNote}: </span>
            {l.studentNote}
          </p>
        ) : null}
        {l.selfEvaluation ? (
          <p className="text-sm text-foreground">
            <span className="font-medium">{local.youRated}: </span>
            {summaryOf(l.selfEvaluation)}
          </p>
        ) : null}
        {l.recorded ? (
          <p className="text-sm text-foreground">
            <span className="font-medium">{local.evaluatorAnswer}: </span>
            {summaryOf(l.recorded)}
          </p>
        ) : null}
        {l.evaluationId !== null ? (
          <p className="text-sm text-foreground">
            <span className="font-medium">{local.feedback}: </span>
            {l.comment || local.noComment}
          </p>
        ) : null}
        {l.reviewerNote ? <p className="text-sm text-foreground">{s14.reviewerNote(l.reviewerNote)}</p> : null}
        {l.revision > 0 ? <p className="text-sm text-muted-foreground">{s14.revised(l.revision)}</p> : null}

        {a.state === "didNotMeet" ? (
          a.failedRule && a.failedRule.evaluationReasons.length > 0 ? (
            <FailedRuleExplainer ctx={ruleContext(db, skill)} evaluationReasons={a.failedRule.evaluationReasons} />
          ) : (
            <LocalBanner variant="warning">
              This evaluation did not meet the criteria. {local.furtherPrompt}
            </LocalBanner>
          )
        ) : null}

        {a.state === "counted" ? <p className="text-sm text-muted-foreground">{locked.counted}</p> : null}
        {a.state === "awaitingApproval" ? <p className="text-sm text-muted-foreground">{locked.awaitingApproval}</p> : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {l.recorded ? (
            <Collapsible open={open} onOpenChange={setOpen}>
              <CollapsibleTrigger asChild>
                <Button size="default" type="button" variant="outline" className="min-h-11 w-full sm:w-auto" aria-expanded={open}>
                  {buttons.viewEvaluation}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 rounded-md bg-muted p-3">
                <RecordedAnswers detail={l.recorded} />
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <span />
          )}
          {a.actions.revise ? (
            <Button size="default" type="button" variant={latest ? "default" : "outline"} className="min-h-11 w-full sm:w-auto" onClick={() => onAction({ kind: "revise", submissionId: l.submissionId }, l.offeringId)}>
              {buttons.reviseAndResend}
            </Button>
          ) : null}
        </div>
      </div>
    </li>
  )
}

export function HistoryView({ skillId, offeringId }: { skillId: Id; offeringId?: Id }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const { db, studentId } = useActingStudent()
  const mounted = useMounted()
  const [newestFirst, setNewestFirst] = React.useState(true)
  const [sheet, setSheet] = React.useState<{ mode: SendMode; offeringId: Id; session: number } | null>(null)
  const [sent, setSent] = React.useState<SentInfo | null>(null)
  const bannerRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (sent) bannerRef.current?.focus()
  }, [sent])

  const scope = params?.get("scope") ?? "all"
  const full = skillHistory(db, studentId, skillId)
  const h = skillHistory(db, studentId, skillId, scope !== "all" ? { offeringId: scope } : {})

  if (!mounted) {
    return (
      <div aria-busy="true" aria-label={local.loading} className="flex flex-col gap-3 px-4 py-6 sm:px-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }
  if (!full || !h) {
    return (
      <div className="px-4 py-6 sm:px-6">
        <LocalBanner variant="error" retry={{ label: buttons.retry, onClick: () => router.refresh() }}>
          {surface.s12.error}
        </LocalBanner>
      </div>
    )
  }

  const skill = full.skill
  const courseOptions = Array.from(new Map(full.attempts.map((a) => [a.ledger.offeringId, a.offeringLabel])).entries())
  const countFor = (id: Id) => full.attempts.filter((a) => a.ledger.offeringId === id).length
  const setScope = (v: string) => {
    const sp = new URLSearchParams(params?.toString() ?? "")
    if (v === "all") sp.delete("scope")
    else sp.set("scope", v)
    const qs = sp.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname)
  }

  const attempts = [...h.attempts].sort((a, b) => (newestFirst ? b.ledger.attempt - a.ledger.attempt : a.ledger.attempt - b.ledger.attempt))
  const latest = full.attempts.reduce<AttemptRow | null>((m, a) => (!m || a.ledger.attempt > m.ledger.attempt ? a : m), null)
  const hasOpen = full.attempts.some((a) => OPEN_STATES.includes(a.state))
  const furtherAvailable = !!latest && latest.actions.furtherAttempt && !hasOpen
  const furtherBlocked = !furtherAvailable && full.attempts.some((a) => a.state === "didNotMeet") && hasOpen
  const backHref = offeringId ? STUDENT_ROUTES.courseSkills(offeringId) : STUDENT_ROUTES.mySkills
  const parts = criteriaParts(db, skill)

  return (
    <PageFrame title={s14.title(skill.name)}>
      <div>
        <Button asChild variant="link" size="sm" className="min-h-11 px-0">
          <Link href={backHref}>{offeringId ? local.backToCourse : local.backToMySkills}</Link>
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SkillStatusBadge state={full.progress.evaluation.state} size="md" />
        <p className="text-sm text-muted-foreground">Needs {criteriaSummary(parts)}</p>
      </div>

      {sent ? (
        <div ref={bannerRef} tabIndex={-1} role="status" className="outline-none">
          <LocalBanner variant="info" dismissible onDismiss={() => setSent(null)}>
            {sent.message}
          </LocalBanner>
        </div>
      ) : null}

      <dl className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">{s14.counters.counted}</dt>
          <dd className="text-2xl font-semibold text-foreground">{h.counters.counted}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">{s14.counters.inProgress}</dt>
          <dd className="text-2xl font-semibold text-foreground">{h.counters.outstanding}</dd>
          <dd className="text-xs text-muted-foreground">{s14.counters.inProgressHelper}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">{s14.counters.returned}</dt>
          <dd className="text-2xl font-semibold text-foreground">{h.counters.returned}</dd>
          <dd className="text-xs text-muted-foreground">{s14.counters.returnedHelper}</dd>
        </div>
      </dl>

      <SkillProgressBlock db={db} studentId={studentId} progress={full.progress} />
      <p className="text-sm text-muted-foreground">{s14.note}</p>

      {furtherAvailable && latest ? (
        <div>
          <Button size="default" type="button" variant="default" className="min-h-11 w-full sm:w-auto" onClick={() => setSheet({ mode: { kind: "further", fromSubmissionId: latest.ledger.submissionId }, offeringId: latest.ledger.offeringId, session: Date.now() })}>
            {buttons.furtherAttempt}
          </Button>
        </div>
      ) : furtherBlocked ? (
        <p className="text-sm text-muted-foreground">{local.furtherBlocked}</p>
      ) : null}

      {courseOptions.length > 0 ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-foreground">Courses</legend>
          <RadioGroup value={scope} onValueChange={setScope} className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:gap-4">
            <div className="flex min-h-11 items-center gap-2">
              <RadioGroupItem id="scope-all" value="all" />
              <Label htmlFor="scope-all" className="min-h-11 cursor-pointer content-center font-normal">
                {s14.scope(full.scope.all, "", 0).all}
              </Label>
            </div>
            {courseOptions.map(([id, label]) => (
              <div key={id} className="flex min-h-11 items-center gap-2">
                <RadioGroupItem id={`scope-${id}`} value={id} />
                <Label htmlFor={`scope-${id}`} className="min-h-11 cursor-pointer content-center font-normal">
                  {s14.scope(full.scope.all, label, countFor(id)).one}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </fieldset>
      ) : null}

      {attempts.length === 0 ? (
        <div className="flex flex-col items-start gap-2" role="status">
          <p className="text-sm text-foreground">{s14.empty}</p>
          {offeringId ? (
            <Button asChild variant="link" size="sm" className="min-h-11 px-0">
              <Link href={STUDENT_ROUTES.courseSkills(offeringId)}>{local.sendThisSkill}</Link>
            </Button>
          ) : null}
        </div>
      ) : (
        <section aria-labelledby="attempts-h" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="attempts-h" className="text-base font-semibold text-foreground">
              Attempts
            </h2>
            <Button type="button" variant="ghost" size="sm" className="min-h-11" onClick={() => setNewestFirst((x) => !x)}>
              {newestFirst ? local.oldestFirst : local.newestFirst}
            </Button>
          </div>
          <ol className="flex flex-col gap-3">
            {attempts.map((a) => (
              <AttemptCard key={a.ledger.submissionId} a={a} db={db} skillId={skillId} latest={!!latest && latest.ledger.submissionId === a.ledger.submissionId && !furtherAvailable} onAction={(mode, off) => setSheet({ mode, offeringId: off, session: Date.now() })} />
            ))}
          </ol>
        </section>
      )}

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
          onSent={(info) => setSent(info)}
        />
      ) : null}
    </PageFrame>
  )
}
