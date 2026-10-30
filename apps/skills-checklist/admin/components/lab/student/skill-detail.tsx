"use client"

/**
 * Skill detail pieces (build prompt stuitem): the rule in one plain sentence, its parts as fractions, the attempt timeline or
 * ledger, and why something did not count with the failed rule in numbers and the next step [REQ SH-01..SH-03, AE-04].
 */
import { aNoun } from "@/lib/lab/terms"
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { CHECKOFF_TAG } from "@/lib/lab/course-checkoff"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@exxatdesignux/ui/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { VIZ } from "@/components/lab/viz"
import { ATTEMPT_WORD, attemptCountLine, attempts, shortDate, studentHref, type AttemptRow, type SkillRecord, type StudentModel } from "@/lib/lab/student"
import type { V2State } from "@/lib/v2/types"
import { rowHeaderLabels } from "@/lib/v2/labels"
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

/** The courses a skill's attempts were made on, most attempts first, for the course filter [REQ SH-06]. */
export function attemptCourses(rows: AttemptRow[]): Array<{ id: string; code: string; n: number }> {
  const m = new Map<string, { id: string; code: string; n: number }>()
  for (const r of rows) {
    const x = m.get(r.courseId) ?? { id: r.courseId, code: r.courseCode, n: 0 }
    x.n++
    m.set(r.courseId, x)
  }
  return [...m.values()].sort((a, b) => b.n - a.n || a.code.localeCompare(b.code))
}

/**
 * Evidence counts across courses, so the attempts cover every course with a way to narrow to one [REQ SH-06]. The course sits in
 * the URL (?course=) like every other scope, and the filter lives in the Attempts card's own header (page anatomy).
 */
export function useCourseNarrow(rows: AttemptRow[], value: string | null) {
  const courses = React.useMemo(() => attemptCourses(rows), [rows])
  const course = value && courses.some((c) => c.id === value) ? value : "all"
  const shown = course === "all" ? rows : rows.filter((r) => r.courseId === course)
  return { courses, course, shown }
}

export function AttemptCourseSelect({ courses, total: _total, value, onChange, id }: { courses: Array<{ id: string; code: string; n: number }>; total: number; value: string; onChange: (v: string) => void; id: string }) {
  if (courses.length === 0) return null
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} size="sm" className="w-full sm:w-44 max-sm:min-h-11" aria-label="Course" data-attempt-course>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {/* No counts in the options: the Attempts title already carries the number shown (say it once, 2026-10-30). */}
        <SelectItem value="all">All courses</SelectItem>
        {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>)}
      </SelectContent>
    </Select>
  )
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

/**
 * "5 attempts, 2 unmet: 3 count", next to the progress, from the published rule [CALL 10-26 B.4]. Nothing before the first completed
 * attempt. Shown only when some completed attempt did not count (2026-10-30: "2 attempts, 2 count" beside a list of 3, one
 * waiting, read as a contradiction and restated the parts); then the attempts not yet answered are named so it matches the list.
 */
export function AttemptCount({ state, studentId, skillId, rows }: { state: V2State; studentId: string; skillId: string; rows: AttemptRow[] }) {
  const base = React.useMemo(() => attemptCountLine(state, studentId, skillId), [state, studentId, skillId])
  const done = rows.filter((r) => r.kind === "counted" || r.kind === "not-counted").length
  const counted = rows.filter((r) => r.kind === "counted").length
  const open = rows.length - done
  if (!base || done === counted) return null
  const line = open > 0 ? `${base}. ${open} not answered yet` : base
  if (!line) return null
  return (
    <p className="text-sm tabular-nums text-muted-foreground" data-attempt-line>
      {line}
    </p>
  )
}

/** The plain counted reason says nothing the "Counted" mark does not, so the timeline omits it (say it once). */
const COUNTS_PLAIN = "Counts toward the rule."

/**
 * Facts every attempt shares (2 or more attempts), said once above the list instead of on each row (anatomy A12, 2026-10-30:
 * three attempts each ending "J. Delgado, RN, Clinical, Inpatient, NURS 350" under the course filter). The course is hidden
 * per row whenever the filter names one course; otherwise it is shared or per row like the others.
 */
function sharedFacts(rows: AttemptRow[], showCourse: boolean) {
  const many = rows.length >= 2
  const same = (f: (r: AttemptRow) => string) => many && rows.every((r) => f(r) === f(rows[0]))
  const evaluator = same((r) => r.evaluatorName)
  const setting = same((r) => r.setting)
  const courseShared = showCourse && same((r) => r.courseCode)
  const parts = [evaluator ? rows[0].evaluatorName : null, setting ? rows[0].setting : null, courseShared ? rows[0].courseCode : null].filter(Boolean)
  return { evaluator, setting, course: !showCourse || courseShared, line: parts.join(" · ") }
}

/** The shared facts as a term and its value (record data, not prose: who, where, which course). */
function SharedLine({ text }: { text: string }) {
  if (!text) return null
  return (
    <dl className="flex flex-wrap gap-x-2 text-sm" data-attempts-shared>
      <dt className="text-muted-foreground">Every attempt</dt>
      <dd className="text-foreground">{text}</dd>
    </dl>
  )
}

/**
 * The row header words for one attempt: the status, then the evaluator's answer only when it is not an engine word that
 * "Did not count" already covers (lib/v2/labels.ts rowHeaderLabels). A request nobody answered has no answer to show.
 */
export function attemptHeader(a: AttemptRow): string[] {
  const answer = a.answer !== "Not answered yet" && a.answer !== "Returned" && a.kind !== "sent" ? a.answer : null
  return rowHeaderLabels([a.status ?? MARK[a.kind].word, answer])
}

/** Vertical timeline, newest first. Each attempt says who, where, the answer, and why it counted or did not. */
export function AttemptTimeline({ rows, onOpen, showCourse = true }: { rows: AttemptRow[]; /** Opens a completed evaluation in full, read only [REQ SH-07]. */ onOpen?: (evaluationId: string) => void; /** False when the course filter names one course: the row does not repeat it. */ showCourse?: boolean }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">No attempts yet.</p>
  const list = [...rows].reverse()
  const sf = sharedFacts(rows, showCourse)
  return (
    <div className="flex flex-col gap-3">
    <SharedLine text={sf.line} />
    <ol className="flex flex-col" aria-label="Attempts, newest first">
      {list.map((a, i) => (
        <li key={a.key} className="relative flex gap-3 pb-4 last:pb-0" data-attempt={a.n}>
          {i < list.length - 1 ? <span className="absolute start-[7px] top-5 bottom-0 w-px bg-border" aria-hidden="true" /> : null}
          <i className={cn(MARK[a.kind].icon, "relative mt-0.5 w-4 text-center text-sm")} style={{ color: MARK[a.kind].color }} aria-hidden="true" />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
              <span className="font-medium text-foreground">{`Attempt ${a.n}`}</span>
              <span data-viz-label className="text-muted-foreground">{[shortDate(a.date), sf.evaluator ? null : a.evaluatorName, sf.setting ? null : a.setting, sf.course ? null : a.courseCode].filter(Boolean).join(", ")}</span>
              {a.checkoff ? <Badge variant="outline" data-checkoff-tag>{CHECKOFF_TAG}</Badge> : null}
            </p>
            {/* One phrase leads ("Did not count"); the evaluator's answer is said only in the explanation (review CP-2). */}
            <p className="text-sm text-foreground">
              <span className="font-medium" style={a.kind === "not-counted" || a.kind === "returned" ? { color: VIZ.behindInk } : undefined}>{`${attemptHeader(a).join(". ")}. `}</span>
              {a.kind === "counted" && a.why === COUNTS_PLAIN ? null : <span className="text-muted-foreground">{a.why}</span>}
            </p>
          </div>
          {a.evaluationId && onOpen ? <ViewEvaluationButton className="-me-2 shrink-0 self-start" name={`attempt ${a.n}`} onOpen={() => onOpen(a.evaluationId!)} /> : null}
        </li>
      ))}
    </ol>
    </div>
  )
}

/** Ledger view of the same attempts, for comparison (variant B). */
export function AttemptLedger({ rows, onOpen, showCourse = true }: { rows: AttemptRow[]; onOpen?: (evaluationId: string) => void; showCourse?: boolean }) {
  const sf = sharedFacts(rows, showCourse)
  // The who-and-where column only while some row has a fact of its own there; a shared fact is said once above the table.
  const whoCol = !(sf.evaluator && sf.setting && sf.course)
  return (
    <div className="flex flex-col gap-3">
    <SharedLine text={sf.line} />
    <Table>
      <TableHeader>
        <TableRow>
          {/* Setting sits under the evaluator and Why under the result, so the ledger fits its card at 1440 and 375 (anatomy A10,
              2026-10-30); on a phone the open button moves under the result too. Nothing is dropped. */}
          <TableHead className="hidden w-8 sm:table-cell">#</TableHead>
          <TableHead>Date</TableHead>
          {whoCol ? <TableHead>{sf.evaluator ? "Where" : "Evaluator"}</TableHead> : null}
          <TableHead>Result</TableHead>
          {onOpen ? <TableHead className="hidden w-36 md:table-cell"><span className="sr-only">Evaluation</span></TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow><TableCell colSpan={5} className="text-muted-foreground">No attempts yet.</TableCell></TableRow>
        ) : (
          [...rows].reverse().map((a) => (
            <TableRow key={a.key} data-attempt={a.n}>
              {/* "Attempt n" for assistive tech; the # column (or "#n" on a phone) shows the number [REQ SH-01]. */}
              <TableCell className="hidden tabular-nums sm:table-cell"><span className="sr-only">Attempt </span>{a.n}</TableCell>
              <TableCell className="whitespace-normal tabular-nums"><span className="block text-xs text-muted-foreground sm:hidden"><span className="sr-only">Attempt </span>{`#${a.n}`}</span>{shortDate(a.date)}</TableCell>
              {whoCol ? (
                <TableCell className="whitespace-normal">
                  <span className="flex flex-col gap-0.5">
                    {sf.evaluator ? null : <span className="inline-flex flex-wrap items-center gap-1.5">{a.evaluatorName}{a.checkoff ? <Badge variant="outline" data-checkoff-tag>{CHECKOFF_TAG}</Badge> : null}</span>}
                    <span className={sf.evaluator ? "text-sm" : "text-xs text-muted-foreground"}>{[sf.setting ? null : a.setting, sf.course ? null : a.courseCode].filter(Boolean).join(" · ")}</span>
                  </span>
                </TableCell>
              ) : null}
              <TableCell className="whitespace-normal">
                <span className="flex flex-col gap-0.5">
                  <span className="inline-flex flex-wrap items-center gap-1.5"><AttemptMark kind={a.kind} />{!whoCol && a.checkoff ? <Badge variant="outline" data-checkoff-tag>{CHECKOFF_TAG}</Badge> : null}</span>
                  {/* The answer only when it adds to the mark: "Did not count" carries it in the why line (review CP-2). */}
                  {a.kind === "sent" ? <span className="text-xs text-muted-foreground">{a.status}</span> : attemptHeader(a).length > 1 ? <span className="text-xs text-muted-foreground">{a.answer}</span> : null}
                  {a.why ? <span className="text-xs text-muted-foreground" data-attempt-why>{a.why}</span> : null}
                  {onOpen && a.evaluationId ? <span className="mt-1 md:hidden"><ViewEvaluationButton name={`attempt ${a.n}`} onOpen={() => onOpen(a.evaluationId!)} /></span> : null}
                </span>
              </TableCell>
              {onOpen ? <TableCell className="hidden text-end md:table-cell">{a.evaluationId ? <ViewEvaluationButton name={`attempt ${a.n}`} onOpen={() => onOpen(a.evaluationId!)} /> : null}</TableCell> : null}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
    </div>
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
