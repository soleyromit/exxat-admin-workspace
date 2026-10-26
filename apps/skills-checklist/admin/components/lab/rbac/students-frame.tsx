"use client"

/**
 * Reviewer Students: shared frame for the three variants. Header, the shared scope bar (term, cohort, course, filters; the same
 * one Approvals uses so a scope carries between the two reviewer rows), one search box, and the states every variant gets the
 * same way: loading (final-shape skeleton), error with retry (?state=error), empty scope (one Remove per filter), no search match.
 * Rows come from lib/lab/reviewer.ts reviewerStudents: population rows (the dashboard's 123) joined with the approval queue in
 * scope, so "waiting" here equals the Approvals count for the same scope. Every name opens the reviewer student record.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { SampleDataBadge } from "@/components/lab/import/sample-badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@exxatdesignux/ui/components/ui/input-group"
import { PageFrame } from "@/components/skills/page-header"
import { ScopeBar } from "@/components/lab/dashboard/scope-bar"
import { DiamondGlyph } from "@/components/lab/viz"
import { useReviewer, type ReviewerContext } from "@/components/lab/reviewer/use-reviewer"
import { LINK } from "@/components/lab/reviewer/parts"
import { ATTENTION_LABEL, plural, recordHref, reviewItemHref, reviewerStudents, type Attention, type ReviewerStudentRow, type ReviewerStudents } from "@/lib/lab/reviewer"
import { SCOPE_LABEL, removeScope, type ScopeKey } from "@/lib/lab/scope"

export interface StudentsContext extends ReviewerContext {
  model: ReviewerStudents
  /** Student rows after the search box. */
  students: ReviewerStudentRow[]
  query: string
}

export function StudentsFrame({ variant, children, toolbar }: { variant: string; children: (ctx: StudentsContext) => React.ReactNode; toolbar?: (ctx: StudentsContext) => React.ReactNode }) {
  const ctx = useReviewer()
  const [query, setQuery] = React.useState("")
  const [failed, setFailed] = React.useState(false)
  const errorDemo = ctx.param("state") === "error"
  React.useEffect(() => setFailed(errorDemo), [errorDemo])
  const model = React.useMemo(() => (ctx.state ? reviewerStudents(ctx.state, ctx.rows, ctx.scope) : null), [ctx.state, ctx.rows, ctx.scope])
  const q = query.trim().toLowerCase()
  const rows = React.useMemo(() => (model ? model.rows.filter((r) => !q || r.name.toLowerCase().includes(q)) : []), [model, q])
  const applied = (["cohort", "group", "course", "cat", "tag", "loc", "setting"] as ScopeKey[]).filter((k) => !!ctx.scope[k])

  return (
    <PageFrame title="Students" actions={<SampleDataBadge />}>
      <div className="flex flex-col gap-4" data-page-type="list" data-reviewer-students={variant}>
        {ctx.options ? (
          <ScopeBar scope={ctx.scope} options={ctx.options} termName={ctx.termName} onChange={ctx.setScope} chipValue={ctx.chip} asOf={ctx.asOf} onRefresh={ctx.refresh} stale={ctx.demo === "stale"} showBasis={false} courseInFilters />
        ) : null}
        <p role="status" aria-live="polite" className="sr-only">
          {model && ctx.ready ? `${plural(rows.length, "student", "students")} shown` : "Loading students"}
        </p>
        {!ctx.ready || !model ? (
          <div role="status" aria-busy="true" aria-label="Loading students" className="flex flex-col gap-2" data-loading>
            <Skeleton aria-hidden="true" className="h-8 w-72" />
            {Array.from({ length: 10 }, (_, i) => <Skeleton key={i} aria-hidden="true" className="h-11 w-full" />)}
          </div>
        ) : failed ? (
          <LocalBanner variant="warning" title="Students could not load" retry={{ label: "Try again", onClick: () => setFailed(false) }}>
            The scope above is kept.
          </LocalBanner>
        ) : model.rows.length === 0 ? (
          <LocalBanner variant="info" title="No students in this scope">
            <span className="flex flex-col gap-2">
              <span>{applied.length ? "Remove a filter to widen it." : `Nobody takes a course with required skills in ${ctx.termName}.`}</span>
              <span className="flex flex-wrap gap-2">
                {applied.map((k) => (
                  <Button key={k} type="button" variant="outline" size="sm" onClick={() => ctx.setScope(removeScope(ctx.scope, k))}>{`Remove ${SCOPE_LABEL[k].toLowerCase()}`}</Button>
                ))}
              </span>
            </span>
          </LocalBanner>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3" data-region="toolbar">
              <InputGroup className="w-full sm:w-72">
                <InputGroupAddon>
                  <i className="fa-light fa-magnifying-glass" aria-hidden="true" />
                </InputGroupAddon>
                <InputGroupInput type="search" aria-label="Search students by name" placeholder="Search students" value={query} onChange={(e) => setQuery(e.target.value)} />
              </InputGroup>
              {toolbar ? toolbar({ ...ctx, model, students: rows, query: q }) : null}
              {q ? <span className="text-sm text-muted-foreground">{`${plural(rows.length, "match", "matches")} of ${model.rows.length}`}</span> : null}
            </div>
            {q && rows.length === 0 ? (
              <LocalBanner variant="info" title={`No student matches "${query.trim()}"`}>
                <Button type="button" variant="outline" size="sm" onClick={() => setQuery("")}>Clear search</Button>
              </LocalBanner>
            ) : (
              children({ ...ctx, model, students: rows, query: q })
            )}
          </>
        )}
      </div>
    </PageFrame>
  )
}

/**
 * Attention as glyph + word + colour, without filled chips so a long list does not turn amber (the same reason Approvals uses
 * AgeText): aging is an amber clock glyph, waiting a neutral hourglass, behind the amber diamond, on track plain muted text.
 */
export function AttentionMark({ a }: { a: Attention }) {
  if (a === "aging")
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-foreground">
        <i className="fa-solid fa-clock text-xs" style={{ color: "var(--lab-viz-behind-ink)" }} aria-hidden="true" />
        {ATTENTION_LABEL.aging}
      </span>
    )
  if (a === "approval")
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-foreground">
        <i className="fa-light fa-hourglass-half text-xs text-muted-foreground" aria-hidden="true" />
        {ATTENTION_LABEL.approval}
      </span>
    )
  if (a === "behind")
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
        <DiamondGlyph />
        {ATTENTION_LABEL.behind}
      </span>
    )
  return <span className="text-sm text-muted-foreground">{ATTENTION_LABEL.none}</span>
}

/** Waiting status plus, when the student is also behind, the behind mark, so both facts show and the counts stay true. */
export function StatusCell({ row }: { row: ReviewerStudentRow }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
      <AttentionMark a={row.attention} />
      {row.behind && needsYou(row.attention) ? <AttentionMark a="behind" /> : null}
    </span>
  )
}

export function StudentLink({ ctx, row, className = "" }: { ctx: ReviewerContext; row: ReviewerStudentRow; className?: string }) {
  return <Link className={`${LINK} ${className}`} href={recordHref(ctx.scope, row.id)}>{row.name}</Link>
}

/**
 * The one action per row: review the oldest waiting submission, or open the record. Both change the URL, so they are links,
 * not buttons (density sweep: list and entry actions that navigate are links; a list of 20 rows is not 20 buttons).
 */
export function RowAction({ ctx, row }: { ctx: ReviewerContext; row: ReviewerStudentRow }) {
  if (row.oldestKey)
    return (
      <Link className={`${LINK} text-sm`} href={reviewItemHref(ctx.scope, row.oldestKey)} aria-label={`Review ${row.name}'s oldest submission`}>Review</Link>
    )
  return (
    <Link className={`${LINK} text-sm text-muted-foreground`} href={recordHref(ctx.scope, row.id)} aria-label={`Open ${row.name}'s record`}>Open record</Link>
  )
}

export const needsYou = (a: Attention) => a === "aging" || a === "approval"
