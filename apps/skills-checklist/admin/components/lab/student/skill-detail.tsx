"use client"

/**
 * Skill detail pieces (build prompt stuitem): the rule in one plain sentence, its parts as fractions, the attempt timeline or
 * ledger, and why something did not count with the failed rule in numbers and the next step [REQ SH-01..SH-03, AE-04].
 */
import { aNoun } from "@/lib/lab/terms"
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@exxatdesignux/ui/components/ui/table"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { VIZ } from "@/components/lab/viz"
import { ATTEMPT_WORD, attemptCountLine, attempts, shortDate, studentHref, type AttemptRow, type SkillRecord, type StudentModel } from "@/lib/lab/student"
import type { V2State } from "@/lib/v2/types"
import type { StudentFrameCtx } from "@/components/lab/student/frame"
import { ViewEvaluationButton } from "@/components/lab/student/evaluation-sheet"

/** The skill in the URL (?skill=), else the first required skill in progress, else the first required skill. */
export function pickSkill(ctx: StudentFrameCtx): SkillRecord | null {
  const id = ctx.param("skill")
  const m = ctx.model
  return (id ? m.all.find((r) => r.id === id) : null) ?? m.required.find((r) => r.state === "progress") ?? m.required[0] ?? m.all[0] ?? null
}

/** The page's one filled action, by state: fix a return, make a further attempt, view the open request, or send. */
export function skillPrimary(r: SkillRecord | null, studentId: string): { label: string; href: string } | null {
  if (!r) return null
  // Deactivated [REQ SL-11]: nothing new can be sent for it; an open request can still be viewed.
  if (r.active === false) return r.waiting ? { label: "View request", href: studentHref("my-requests", {}, studentId) } : null
  if (r.returned) return { label: "Fix and send", href: studentHref("fix-returned", { submission: r.returned.submissionId }, studentId) }
  if (r.waiting) return { label: "View request", href: studentHref("my-requests", {}, studentId) }
  if (r.state === "achieved") return null
  if (r.state === "dnq") return { label: "Make a further attempt", href: studentHref("fix-returned", { skill: r.id }, studentId) }
  return { label: `Log ${aNoun()}`, href: studentHref("request-signoff", { skill: r.id }, studentId) }
}

export function useAttempts(state: V2State, studentId: string, skillId: string | undefined): AttemptRow[] {
  return React.useMemo(() => (skillId ? attempts(state, studentId, skillId) : []), [state, studentId, skillId])
}

const MARK: Record<AttemptRow["kind"], { icon: string; color: string; word: string }> = {
  counted: { icon: "fa-solid fa-circle-check", color: "var(--foreground)", word: "Counted" },
  "not-counted": { icon: "fa-solid fa-triangle-exclamation", color: VIZ.behindInk, word: "Did not count" },
  waiting: { icon: "fa-light fa-clock", color: "var(--muted-foreground)", word: "Waiting" },
  returned: { icon: "fa-solid fa-rotate-left", color: VIZ.behindInk, word: "Returned" },
  // Held evidence a reviewer assigned to another evaluator: a neutral handoff, not a return (lib/v2/labels.ts).
  sent: { icon: "fa-light fa-paper-plane", color: "var(--muted-foreground)", word: ATTEMPT_WORD.sent },
}

export function AttemptMark({ kind }: { kind: AttemptRow["kind"] }) {
  const m = MARK[kind]
  return (
    <span className="inline-flex items-center gap-1.5 text-sm" style={kind === "not-counted" || kind === "returned" ? { color: m.color } : undefined}>
      <i className={cn(m.icon, "text-sm")} style={{ color: m.color }} aria-hidden="true" />
      {m.word}
    </span>
  )
}

/** "5 attempts, 2 unmet: 3 count", next to the progress, from the published rule [CALL 10-26 B.4]. Nothing before the first completed attempt. */
export function AttemptCount({ state, studentId, skillId }: { state: V2State; studentId: string; skillId: string }) {
  const line = React.useMemo(() => attemptCountLine(state, studentId, skillId), [state, studentId, skillId])
  if (!line) return null
  return (
    <p className="text-sm tabular-nums text-muted-foreground" data-attempt-line>
      {line}
    </p>
  )
}

/** The plain counted reason says nothing the "Counted" mark does not, so the timeline omits it (say it once). */
const COUNTS_PLAIN = "Counts toward the rule."

/** Vertical timeline, newest first. Each attempt says who, where, the answer, and why it counted or did not. */
export function AttemptTimeline({ rows, onOpen }: { rows: AttemptRow[]; /** Opens a completed evaluation in full, read only [REQ SH-07]. */ onOpen?: (evaluationId: string) => void }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">No attempts yet.</p>
  const list = [...rows].reverse()
  return (
    <ol className="flex flex-col" aria-label="Attempts, newest first">
      {list.map((a, i) => (
        <li key={a.key} className="relative flex gap-3 pb-4 last:pb-0">
          {i < list.length - 1 ? <span className="absolute start-[7px] top-5 bottom-0 w-px bg-border" aria-hidden="true" /> : null}
          <i className={cn(MARK[a.kind].icon, "relative mt-0.5 w-4 text-center text-sm")} style={{ color: MARK[a.kind].color }} aria-hidden="true" />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
              <span className="font-medium text-foreground">{`Attempt ${a.n}`}</span>
              <span data-viz-label className="text-muted-foreground">{`${shortDate(a.date)}, ${a.evaluatorName}, ${a.setting}`}</span>
            </p>
            <p className="text-sm text-foreground">
              <span className="font-medium" style={a.kind === "not-counted" || a.kind === "returned" ? { color: VIZ.behindInk } : undefined}>{`${a.status ?? MARK[a.kind].word}. `}</span>
              {a.answer !== "Not answered yet" && a.kind !== "sent" ? `${a.answer}. ` : ""}
              {a.kind === "counted" && a.why === COUNTS_PLAIN ? null : <span className="text-muted-foreground">{a.why}</span>}
            </p>
          </div>
          {a.evaluationId && onOpen ? <ViewEvaluationButton className="-me-2 shrink-0 self-start" name={`attempt ${a.n}`} onOpen={() => onOpen(a.evaluationId!)} /> : null}
        </li>
      ))}
    </ol>
  )
}

/** Ledger view of the same attempts, for comparison (variant B). */
export function AttemptLedger({ rows, onOpen }: { rows: AttemptRow[]; onOpen?: (evaluationId: string) => void }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">#</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Evaluator</TableHead>
          <TableHead className="hidden md:table-cell">Setting</TableHead>
          
          <TableHead>Result</TableHead>
          <TableHead className="hidden lg:table-cell">Why</TableHead>
          {onOpen ? <TableHead className="w-36"><span className="sr-only">Evaluation</span></TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow><TableCell colSpan={7} className="text-muted-foreground">No attempts yet.</TableCell></TableRow>
        ) : (
          [...rows].reverse().map((a) => (
            <TableRow key={a.key}>
              <TableCell className="tabular-nums">{a.n}</TableCell>
              <TableCell className="tabular-nums">{shortDate(a.date)}</TableCell>
              <TableCell>{a.evaluatorName}</TableCell>
              <TableCell className="hidden md:table-cell">{a.setting}</TableCell>
              <TableCell><span className="flex flex-col gap-0.5"><AttemptMark kind={a.kind} /><span className="text-xs text-muted-foreground">{a.kind === "sent" ? a.status : a.answer}</span></span></TableCell>
              <TableCell className="hidden min-w-64 whitespace-normal text-muted-foreground lg:table-cell">{a.why}</TableCell>
              {onOpen ? <TableCell className="text-end">{a.evaluationId ? <ViewEvaluationButton name={`attempt ${a.n}`} onOpen={() => onOpen(a.evaluationId!)} /> : null}</TableCell> : null}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}

/** The failed rule in numbers, and the next step, in one block. Amber glyph, no red. */
export function WhyNotCounted({ record, studentId, withAction = true }: { record: SkillRecord; studentId: string; withAction?: boolean }) {
  if (!record.failed || record.state === "achieved") return null
  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3" style={{ borderColor: VIZ.behindEdge, background: VIZ.behindWash }} data-why-not-counted>
      <p className="flex items-center gap-2 text-sm font-medium" style={{ color: VIZ.behindInk }}>
        <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
        {`Why attempt on ${shortDate(record.failed.date)} did not count`}
      </p>
      <p className="text-sm text-foreground">{record.failed.rule}</p>
      <p className="text-sm text-foreground">{record.failed.next}</p>
      {withAction && !record.waiting && record.active !== false ? (
        <Button asChild variant="outline" size="sm" className="self-start">
          <Link href={studentHref("fix-returned", { skill: record.id }, studentId)}>Make a further attempt</Link>
        </Button>
      ) : null}
    </div>
  )
}

export function WhereItCounts({ model, record }: { model: StudentModel; record: SkillRecord }) {
  const courses = model.courses.filter((c) => c.mandatory + c.optional > 0)
  const placement = model.placements.find((p) => p.likelyIds.includes(record.id))
  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
      <dt className="text-muted-foreground">Section</dt>
      <dd className="text-foreground">{record.section}</dd>
      <dt className="text-muted-foreground">Expected</dt>
      <dd className="text-foreground">{record.active === false ? "No longer in use. Your evidence stays in My evaluations." : record.required ? "Required this term" : record.level === "recommended" ? "Recommended this term" : record.level === "optional" ? "Optional this term" : "Not mapped to a current course"}</dd>
      {placement ? (
        <>
          <dt className="text-muted-foreground">Likely at</dt>
          <dd className="text-foreground">{`${placement.location}, ends ${shortDate(placement.ends)}`}</dd>
        </>
      ) : null}
      {courses.length === 0 ? null : (
        <>
          <dt className="text-muted-foreground">Counts across</dt>
          <dd className="text-foreground">All your courses</dd>
        </>
      )}
    </dl>
  )
}
