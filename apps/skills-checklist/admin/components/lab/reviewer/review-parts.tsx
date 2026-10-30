"use client"

/**
 * Pieces of one submission, shared by the split panel (Approvals B) and the three Review item variants:
 * self versus evaluator answers with a disagreement marker [REQ AR-02, AR-03, EV-04], the rule check in numbers from the engine
 * [REQ AE-02, AR-06; strategy/03 "This makes 2 of 3"], the facts AR-01 asks for, the decision bar, and the submission story.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Tip } from "@exxatdesignux/ui/components/ui/tip"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@exxatdesignux/ui/components/ui/table"
import type { Comparison } from "@/lib/v2/queue"
import { isCheckoff, recordHref, type ItemDetail, type ReviewRow, type RuleCheck, type StoryStep } from "@/lib/lab/reviewer"
import type { LabScope } from "@/lib/lab/scope"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { Textarea } from "@exxatdesignux/ui/components/ui/textarea"
import { StickyFooter } from "@/components/lab/layout/sticky-footer"
import { TYPE } from "@/components/lab/type-scale"
import { APPROVE_HINT, SEND_BACK_LABEL } from "@/lib/v2/labels"
import { REASON_META } from "@/lib/lab/reviewer"
import { EvaluatorMenu, useDecisionUi } from "@/components/lab/reviewer/decisions"
import { AgreementMark, AgeBadge, CheckoffTag, EvaluatorName, FactList } from "@/components/lab/reviewer/parts"
import { LINK_IN_TABLE as LINK } from "@/components/lab/link-styles"
import { shortDate } from "@/lib/v2/format"
import { checkoffNote } from "@/lib/lab/course-checkoff"

const dateLabel = (iso: string | null) => (iso ? shortDate(iso) : "Not recorded")

/**
 * Why it is here, the first block of any review: every cause in plain words, primary first, with what holds it (for "Approval
 * required", the skill's setting, REQ SC-15) and the wait. Where the evaluator is not on the program's list, the one decision that
 * fits sits beside the words (Adopt, merge or assign).
 */
/** `showAge` false where the wait already shows beside the open row (Approvals B's queue), so the number is said once. */
export function WhyHeld({ row, showAge = true }: { row: ReviewRow; showAge?: boolean }) {
  return (
    <section className="flex flex-col gap-2" aria-labelledby={`why-${row.key}`} data-why-held>
      <div className="flex flex-wrap items-center gap-2">
        <h2 id={`why-${row.key}`} className={TYPE.section}>Why it is here</h2>
        {showAge ? <AgeBadge days={row.days} /> : null}
        {isCheckoff(row) ? <CheckoffTag /> : null}
      </div>
      <ul className="flex flex-col gap-1.5">
        {row.because.map((b) => (
          <li key={b.reason} className={`flex items-baseline gap-2 ${TYPE.body}`} data-because={b.reason}>
            <i className={`fa-light ${REASON_META[b.reason].icon} shrink-0 text-xs text-muted-foreground`} aria-hidden="true" />
            <span>{b.text}</span>
          </li>
        ))}
      </ul>
      {isCheckoff(row) ? <p className={`${TYPE.body} text-muted-foreground`} data-checkoff-note>{checkoffNote(row.checkoffSkill)}</p> : null}
      {row.evaluatorUnverified ? (
        <span className="self-start">
          <EvaluatorMenu row={row} />
        </span>
      ) : null}
    </section>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Review note (REQ AR-04): one note per open review, kept with the evaluation on Approve and offered as the reason on Send back.

const NoteCtx = React.createContext<{ note: string; setNote: (v: string) => void } | null>(null)

export function ReviewNoteProvider({ resetKey, children }: { resetKey: string; children: React.ReactNode }) {
  const [note, setNote] = React.useState("")
  React.useEffect(() => setNote(""), [resetKey])
  const value = React.useMemo(() => ({ note, setNote }), [note])
  return <NoteCtx.Provider value={value}>{children}</NoteCtx.Provider>
}

const useReviewNote = () => React.useContext(NoteCtx)

export function ReviewNoteField({ id = "review-note" }: { id?: string }) {
  const ctx = useReviewNote()
  if (!ctx) return null
  return (
    <div className="flex flex-col gap-1.5" data-review-note>
      <Label htmlFor={id} className={TYPE.group}>Review note, kept with the evaluation</Label>
      <Textarea id={id} rows={2} value={ctx.note} onChange={(e) => ctx.setNote(e.target.value)} />
    </div>
  )
}

/**
 * Self versus evaluator, every row (AR-02, AR-03): each question, the score on each question, the level and the evaluator's
 * outcome. The student's self-evaluation note follows the table (AR-03: "the full set of responses"), quoted as record content.
 */
export function CompareTable({ c, compact = false, showNote = true, checkoff = false }: { c: Comparison; compact?: boolean; showNote?: boolean; checkoff?: boolean }) {
  const self = c.selfRated
  return (
    <div className="flex flex-col gap-1.5">
      {compact ? null : (
        <div className="flex items-center justify-between gap-2">
          <h3 className={TYPE.group}>{c.skillName}</h3>
          {self && c.rows.length > 1 ? <AgreementMark agreement={c.overall} /> : null}
        </div>
      )}
      <div className="overflow-hidden rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Question</TableHead>
              {self ? <TableHead>Student answer</TableHead> : null}
              <TableHead>Evaluator answer</TableHead>
              {self ? <TableHead className="w-28"><span className="sr-only">Agreement</span></TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {c.rows.map((r) => (
              <TableRow key={r.label} data-differs={r.agreement === "differed" || undefined}>
                {/* Questions wrap, so the answer columns stay in view in a 375 px sheet. */}
                <TableCell className="whitespace-normal">{r.label}</TableCell>
                {self ? <TableCell className={r.agreement === "differed" ? "font-semibold" : undefined}>{r.student}</TableCell> : null}
                <TableCell className={r.agreement === "differed" ? "font-semibold" : undefined}>{r.evaluator}</TableCell>
                {self ? <TableCell><AgreementMark agreement={r.agreement} /></TableCell> : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {self || checkoff ? null : <p className="text-xs text-muted-foreground">No self-rating to compare.</p>}
      {showNote && c.selfNote ? (
        <blockquote className="whitespace-pre-line border-s-2 border-border ps-3 text-sm text-foreground" data-user-content data-self-note>
          <span className="sr-only">Student note: </span>
          {c.selfNote}
        </blockquote>
      ) : null}
    </div>
  )
}

/** "Approving makes it achieved: 4 of 4", or what is still missing after approval. */
export function RuleCheckLine({ check }: { check: RuleCheck }) {
  if (!check.after) return <p className="text-sm text-muted-foreground">{`${check.skill} has no rule yet.`}</p>
  return (
    <div className="flex flex-col gap-0.5" data-rule-check>
      <p className="text-sm">
        <span className="font-medium">{check.skill}</span>
        {check.flips ? " becomes achieved: " : check.already ? " is already achieved: " : " moves to "}
        <span className="font-semibold tabular-nums">{check.numbers}</span>
      </p>
      {check.already ? <p className="text-xs text-muted-foreground">This evaluation adds evidence; the state does not change.</p> : null}
      {!check.after.achieved && check.missing.length ? <p className="text-xs text-muted-foreground">{`Still needed: ${check.missing.join("; ")}`}</p> : null}
    </div>
  )
}

export function Facts({ d, scope }: { d: ItemDetail; scope: LabScope }) {
  const r = d.row
  return (
    <FactList
      facts={[
        ["Student", <Link key="s" className={LINK} href={recordHref(scope, r.studentId)}>{r.student}</Link>],
        ["Cohort", r.group ? `${r.cohort}, ${r.group}` : r.cohort],
        ["Course", r.course],
        ["Setting", r.setting],
        ["Location", r.location],
        ["Evaluator", r.evaluatorUnverified ? <EvaluatorName key="e" name={r.evaluator} unrecorded /> : `${r.evaluator}${r.evaluatorRole ? `, ${r.evaluatorRole}` : ""}`],
        [isCheckoff(r) ? "Entered from" : "Sent by", r.method],
        ["Signed", dateLabel(d.completedAt)],
        ...(r.revision ? [["Revision", String(r.revision)] as [string, React.ReactNode]] : []),
      ]}
    />
  )
}

/**
 * The decision bar of a panel (Approvals B): what Approve does in words, then Send back to student (outline) and Approve (the one
 * filled action, far right, the footer contract). The review note, when the panel has one, goes with either decision.
 */
export function DecisionBar({ row, className = "" }: { row: ReviewRow; className?: string }) {
  const ui = useDecisionUi()
  const note = useReviewNote()?.note ?? ""
  return (
    <div className={`flex w-full flex-wrap items-center gap-2 ${className}`} data-decision-bar>
      {row.block ? <span className={`me-auto ${TYPE.helper}`}>{row.block}</span> : <span className="me-auto" />}
      <Button type="button" variant="outline" size="sm" onClick={() => ui.openReturn(row, note)}>{SEND_BACK_LABEL}</Button>
      {row.block ? null : (
        <Tip label={APPROVE_HINT}>
          <Button type="button" variant="default" size="sm" onClick={() => ui.approve([row], note)} aria-describedby={`approve-hint-${row.key}`}>Approve</Button>
        </Tip>
      )}
      <span id={`approve-hint-${row.key}`} className="sr-only">{APPROVE_HINT}</span>
    </div>
  )
}

/**
 * The review page's decision, on the shared sticky footer: what Approve does, Send back to student, Approve. No Back button: the
 * Approvals row in the sidebar is the way back (say it once), and the footer keeps Back's slot empty so nothing shifts.
 */
export function DecisionFooter({ row }: { row: ReviewRow }) {
  const ui = useDecisionUi()
  const note = useReviewNote()?.note ?? ""
  return (
    <StickyFooter
      context={row.block ? undefined : APPROVE_HINT}
      secondary={{ label: SEND_BACK_LABEL, onClick: () => ui.openReturn(row, note) }}
      primary={{ label: "Approve", onClick: () => ui.approve([row], note), disabled: !!row.block, disabledReason: row.block ?? undefined }}
    />
  )
}

export function Feedback({ text }: { text: string }) {
  if (!text) return null
  return (
    <blockquote className="border-s-2 border-border ps-3 text-sm text-foreground">
      <span className="sr-only">Evaluator feedback: </span>
      {text}
    </blockquote>
  )
}

export function Story({ steps }: { steps: StoryStep[] }) {
  return (
    <ol className="flex flex-col" aria-label="Submission story, oldest first">
      {steps.map((s, i) => (
        <li key={s.id} className="relative flex gap-3 pb-4 last:pb-0">
          {i < steps.length - 1 ? <span aria-hidden="true" className="absolute start-[15px] top-8 bottom-0 w-px bg-border" /> : null}
          <span className={`flex size-8 shrink-0 items-center justify-center rounded-full border ${s.id === "held" ? "border-foreground bg-background text-foreground" : "border-border bg-muted text-muted-foreground"}`}>
            <i className={`fa-light ${s.icon} text-xs`} aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-col pt-1">
            <span className="text-sm font-medium">{s.title}</span>
            <span className="text-xs text-muted-foreground">{`${dateLabel(s.at)} · ${s.detail}`}</span>
          </span>
        </li>
      ))}
    </ol>
  )
}

export function UnverifiedNote({ d }: { d: ItemDetail }) {
  if (!d.row.evaluatorUnverified) return null
  return <StatusBadge label={`${d.row.evaluator} is not on your evaluator list`} tone="neutral" icon="fa-user-plus" size="sm" />
}
