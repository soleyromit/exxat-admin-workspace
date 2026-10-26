"use client"

/**
 * Pieces of one submission, shared by the split panel (Approvals B) and the three Review item variants:
 * self versus evaluator answers with a disagreement marker [REQ AR-02, AR-03, EV-04], the rule check in numbers from the engine
 * [REQ AE-02, AR-06; strategy/03 "This makes 2 of 3"], the facts AR-01 asks for, the decision bar, and the submission story.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@exxatdesignux/ui/components/ui/table"
import type { Comparison } from "@/lib/v2/queue"
import { recordHref, type ItemDetail, type ReviewRow, type RuleCheck, type StoryStep } from "@/lib/lab/reviewer"
import type { LabScope } from "@/lib/lab/scope"
import { EvaluatorMenu, useDecisionUi } from "@/components/lab/reviewer/decisions"
import { AgreementMark, AgeBadge, EvaluatorName, FactList, ReasonBadge } from "@/components/lab/reviewer/parts"
import { LINK_IN_TABLE as LINK } from "@/components/lab/link-styles"
import { shortDate } from "@/lib/v2/format"

const dateLabel = (iso: string | null) => (iso ? shortDate(iso) : "Not recorded")

/** Why held, as the first line of any detail: the badge and the cause in words. */
export function WhyHeld({ row }: { row: ReviewRow }) {
  return (
    <div className="flex flex-wrap items-center gap-2" data-why-held>
      <ReasonBadge reason={row.reason} />
      <span className="text-sm text-foreground">{row.why}</span>
      <AgeBadge days={row.days} />
    </div>
  )
}

export function CompareTable({ c, compact = false }: { c: Comparison; compact?: boolean }) {
  const self = c.selfRated
  return (
    <div className="flex flex-col gap-1.5">
      {compact ? null : (
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">{c.skillName}</h3>
          {self && c.rows.length > 1 ? <AgreementMark agreement={c.overall} /> : null}
        </div>
      )}
      <div className="overflow-hidden rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asked</TableHead>
              {self ? <TableHead>Student</TableHead> : null}
              <TableHead>Evaluator</TableHead>
              {self ? <TableHead className="w-28"><span className="sr-only">Agreement</span></TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {c.rows.map((r) => (
              <TableRow key={r.label} data-differs={r.agreement === "differed" || undefined}>
                <TableCell>{r.label}</TableCell>
                {self ? <TableCell className={r.agreement === "differed" ? "font-semibold" : undefined}>{r.student}</TableCell> : null}
                <TableCell className={r.agreement === "differed" ? "font-semibold" : undefined}>{r.evaluator}</TableCell>
                {self ? <TableCell><AgreementMark agreement={r.agreement} /></TableCell> : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {self ? null : <p className="text-xs text-muted-foreground">No self-rating, so nothing to compare.</p>}
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
        ["Sent by", r.method],
        ["Signed", dateLabel(d.completedAt)],
        ...(r.revision ? [["Revision", String(r.revision)] as [string, React.ReactNode]] : []),
      ]}
    />
  )
}

/**
 * One decision bar: Approve is the single primary action; Return is outline. Where the evaluator is not assigned (a name the program
 * has not adopted), one outline menu holds Adopt or merge and Assign to someone else (one control, strategy/07 budgets).
 */
export function DecisionBar({ row, next, className = "" }: { row: ReviewRow; next?: { href: string; label: string } | null; className?: string }) {
  const ui = useDecisionUi()
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`} data-decision-bar>
      {row.block ? (
        <span className="text-sm text-muted-foreground">{row.block}</span>
      ) : (
        <Button type="button" variant="default" size="sm" onClick={() => ui.approve([row])}>Approve</Button>
      )}
      <Button type="button" variant="outline" size="sm" onClick={() => ui.openReturn(row)}>Return</Button>
      {row.evaluatorUnverified ? <EvaluatorMenu row={row} /> : null}
      {next ? (
        <Button asChild variant="ghost" size="sm" className="ms-auto">
          <Link href={next.href}>{next.label}</Link>
        </Button>
      ) : null}
    </div>
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
