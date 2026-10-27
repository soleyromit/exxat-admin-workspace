"use client"

/**
 * My requests pieces (build prompt sturequests): requests grouped by evaluator, each with its age and its own link state
 * (one link per request, ledger D-L2). The no-login note is said once per page. Waiting 3 days or more is surfaced (N-04).
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { AvatarInitials } from "@exxatdesignux/ui/components/ui/avatar"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { VIZ } from "@/components/lab/viz"
import { WAIT_DAYS, studentHref, type EvaluatorGroup, type RequestRow } from "@/lib/lab/student"
import { LINK_IN_TABLE } from "@/components/lab/student/parts"
import { initialsOf } from "@/lib/v2/format"
import { EvaluatorNameBadge } from "@/components/lab/status-pill"


/** Link state and revision in one quiet line ("Link open since Oct 26", "Revision 2"). */
export const linkLine = (row: RequestRow) => [row.link, row.revision > 0 ? `Revision ${row.revision}` : ""].filter(Boolean).join(". ")

/** Said once per page [brief section 5.4: handoff cue]. */
export function NoLoginNote() {
  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground" data-no-login-note>
      <i className="fa-light fa-envelope-open-text" aria-hidden="true" />
      Evaluators sign through a link, no account needed.
    </p>
  )
}

export function EvaluatorHeading({ g }: { g: EvaluatorGroup }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <AvatarInitials initials={initialsOf(g.name)} size="sm" />
      <div className="flex min-w-0 flex-col">
        <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
          <span data-viz-label>{g.name}</span>
          {g.verified ? null : <EvaluatorNameBadge verified={false} />}
        </p>
        <p className="truncate text-xs text-muted-foreground" data-viz-label>{g.role}</p>
      </div>
    </div>
  )
}

export function StatusOf({ row }: { row: RequestRow }) {
  if (row.status === "returned") return <StatusBadge label={row.statusLabel} tone="warning" icon="fa-rotate-left" size="sm" />
  if (row.status === "done") return <span className="text-sm text-muted-foreground">{row.statusLabel}</span>
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm tabular-nums", row.overdue ? "font-medium" : "text-foreground")} style={row.overdue ? { color: VIZ.behindInk } : undefined}>
      <i className={row.overdue ? "fa-solid fa-diamond text-xs" : "fa-light fa-clock text-xs text-muted-foreground"} aria-hidden="true" />
      {row.statusLabel}
      {row.overdue ? <span className="sr-only">{`, ${WAIT_DAYS} days or more`}</span> : null}
    </span>
  )
}

export function SkillNames({ row, studentId }: { row: RequestRow; studentId: string }) {
  return (
    <span className="text-sm">
      {row.skillNames.map((n, i) => (
        <React.Fragment key={`${row.skillIds[i]}-${i}`}>
          <Link className={LINK_IN_TABLE} href={studentHref("skill-detail", { skill: row.skillIds[i] }, studentId)}>{n}</Link>
          {i < row.skillNames.length - 1 ? <span className="text-muted-foreground">, </span> : null}
        </React.Fragment>
      ))}
    </span>
  )
}

/**
 * The row's one action: "Fix and send" on a returned request (outline: open work), "Correct and resend" on one nobody has assessed
 * yet (ghost: available, not due; REQ RV-01). Nothing once an evaluator answered (awaiting approval or done, REQ RV-05).
 */
export function RowAction({ row }: { row: RequestRow }) {
  if (row.status === "returned") return <Button asChild variant="outline" size="sm"><Link href={row.href}>{row.action}</Link></Button>
  if (row.fix) return <Button asChild variant="ghost" size="sm" className="whitespace-nowrap"><Link href={row.fix.href}>{row.fix.label}</Link></Button>
  return null
}

/** One request as a row: skills, status and age, link state, revision, the reason when returned, and its action. */
export function RequestLine({ row, studentId }: { row: RequestRow; studentId: string }) {
  return (
    <li className="grid grid-cols-1 gap-x-4 gap-y-1 py-2.5 md:grid-cols-12 md:items-center">
      <div className="md:col-span-5"><SkillNames row={row} studentId={studentId} /></div>
      <div className="md:col-span-3"><StatusOf row={row} /></div>
      <p className="text-xs text-muted-foreground md:col-span-3" data-viz-label>
        {linkLine(row)}
      </p>
      <div className="md:col-span-1 md:flex md:justify-end">
        <RowAction row={row} />
      </div>
      {/* The returner's own words, quoted from the record (data, not interface copy). */}
      {row.reason ? <p className="text-sm text-foreground max-sm:line-clamp-2 md:col-span-12" data-return-reason><span className="text-muted-foreground">Reason: </span><q data-user-content>{row.reason}</q></p> : null}
    </li>
  )
}
